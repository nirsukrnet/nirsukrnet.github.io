from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class FirebaseConfig:
    api_key: str
    database_url: str
    identity_base_url: str
    email: str
    password: str


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def _extract_js_string(src: str, pattern: str, label: str) -> str:
    m = re.search(pattern, src)
    if not m:
        raise RuntimeError(f"Failed to find {label} in global_var.js")
    return m.group(1)


def load_config_from_global_var_js(global_var_path: Path) -> FirebaseConfig:
    src = _read_text(global_var_path)

    api_key = _extract_js_string(src, r"apiKey:\s*\"([^\"]+)\"", "apiKey")
    database_url = _extract_js_string(src, r"databaseURL:\s*\"([^\"]+)\"", "databaseURL")
    identity_base_url = _extract_js_string(src, r"URL_identity:\s*`([^`]+)`", "URL_identity")
    email = _extract_js_string(src, r"email\s*:\s*\"([^\"]+)\"", "email")
    password = _extract_js_string(src, r"password\s*:\s*\"([^\"]+)\"", "password")

    return FirebaseConfig(
        api_key=api_key,
        database_url=database_url.rstrip("/"),
        identity_base_url=identity_base_url,
        email=email,
        password=password,
    )


def apply_env_overrides(cfg: FirebaseConfig) -> FirebaseConfig:
    # Allow overriding secrets/config without editing JS files
    api_key = os.environ.get("FIREBASE_API_KEY") or cfg.api_key
    database_url = os.environ.get("FIREBASE_DATABASE_URL") or cfg.database_url
    identity_base_url = os.environ.get("FIREBASE_IDENTITY_BASE_URL") or cfg.identity_base_url
    email = os.environ.get("FIREBASE_EMAIL") or cfg.email
    password = os.environ.get("FIREBASE_PASSWORD") or cfg.password

    return FirebaseConfig(
        api_key=api_key,
        database_url=database_url.rstrip("/"),
        identity_base_url=identity_base_url,
        email=email,
        password=password,
    )


def http_json(method: str, url: str, body: Optional[dict[str, Any]] = None) -> Any:
    data: Optional[bytes] = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = Request(url=url, method=method.upper(), data=data, headers=headers)
    try:
        with urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw) if raw.strip() else None
    except HTTPError as e:
        raw = ""
        try:
            raw = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        raise RuntimeError(f"HTTP {e.code} for {url}: {raw[:500]}") from e
    except URLError as e:
        raise RuntimeError(f"Network error for {url}: {e}") from e


def sign_in_and_get_id_token(cfg: FirebaseConfig) -> str:
    url = f"{cfg.identity_base_url}{cfg.api_key}"
    payload = {"email": cfg.email, "password": cfg.password, "returnSecureToken": True}
    data = http_json("POST", url, payload)
    token = (data or {}).get("idToken")
    if not token:
        raise RuntimeError(f"Sign-in failed; response did not include idToken. Keys: {list((data or {}).keys())}")
    return token


def rtdb_get(cfg: FirebaseConfig, id_token: str, rtdb_path: str) -> Any:
    # rtdb_path should be like: data_base3/settings/default_user/settingsData
    clean = rtdb_path.strip("/")
    url = f"{cfg.database_url}/{clean}.json?auth={quote(id_token)}"
    return http_json("GET", url)


def validate_settings(rtdb_path: str, settings_data: Any) -> list[str]:
    # Only validate schema when the snapshot is actually settingsData.
    clean = (rtdb_path or "").strip("/")
    if not clean.endswith("data_base3/settings/default_user/settingsData"):
        return []

    warnings: list[str] = []
    if not isinstance(settings_data, dict):
        return ["settingsData is not an object (dict)"]

    last_lesson_id = settings_data.get("lastLessonId")
    if isinstance(last_lesson_id, dict):
        for owner in ("mp3_playing", "trans_block"):
            v = last_lesson_id.get(owner)
            if v is None:
                continue
            s = str(v)
            if not s.startswith("lesson_"):
                warnings.append(f"lastLessonId.{owner} is not a lesson key: {s!r}")
    else:
        if last_lesson_id is None:
            warnings.append("settingsData.lastLessonId is missing")
        else:
            warnings.append(
                "settingsData.lastLessonId is not an object (legacy format: primitive string/number); "
                "expected an object keyed by Owner (mp3_playing/trans_block)"
            )

    return warnings


def build_scripts_section(workspace_root: Path) -> dict[str, Any]:
    # Full paths and the key functions this diagnostic is related to.
    db_conns = workspace_root / "assets" / "js" / "db_connswmp3.js"
    menu_less = workspace_root / "assets" / "js" / "output_audio_phrase" / "oap_menu_less.js"
    return {
        "python": {
            "script_path": str(Path(__file__).resolve()),
            "entry": "main(argv)",
            "purpose": "Download DB3 snapshots and emit a diagnostic JSON report",
        },
        "js": [
            {
                "path": str(db_conns.resolve()),
                "functions": [
                    "Save_To_FBDB_Current_Lesson(Lesson_ID, Owner)",
                    "Load_From_FBDB_Current_Lesson(Owner)",
                    "Load_DB3_Lesson_Phrases(lessonId)",
                ],
                "purpose": "Persist/restore last lesson and load lesson phrases",
            },
            {
                "path": str(menu_less.resolve()),
                "functions": [
                    "setSelectedId(id, opts)",
                    "restoreSelectedIdFromFirebase(reason)",
                ],
                "purpose": "Lesson menu UI; saves/restores selection",
            },
        ],
    }


def build_expected_data_for_path(rtdb_path: str) -> Any:
    clean = (rtdb_path or "").strip("/")

    # For settingsData we expect lastLessonId to be an object keyed by Owner.
    if clean.endswith("data_base3/settings/default_user/settingsData"):
        # This is an example of the expected structure (not validated strictly).
        return {
            "lastLessonId": {
                "mp3_playing": "lesson_1",
                "trans_block": "lesson_2",
            },
            "playbackSpeed": 1,
            "theme": "dark",
        }

    # For other paths, keep empty unless you want to define expectations.
    return {}


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Snapshot Firebase DB3 data and emit a diagnostic JSON report")
    parser.add_argument(
        "--out-dir",
        # __file__ = .../html/service_test/python/snapshot_db3_settings.py
        # Default output should be .../html/service_test/js/snapshots (no duplicated service_test).
        default=str(Path(__file__).resolve().parents[1] / "js" / "snapshots"),
        help="Output directory for snapshot json",
    )
    parser.add_argument(
        "--path",
        default="data_base3/settings/default_user/settingsData",
        help="Firebase RTDB path to snapshot (no leading slash)",
    )
    args = parser.parse_args(argv)

    # Prefer the main app config so credentials stay in one place
    workspace_root = Path(__file__).resolve().parents[2]  # .../html
    global_var_js = workspace_root / "assets" / "js" / "global_var.js"
    if not global_var_js.exists():
        raise RuntimeError(f"Cannot find {global_var_js}")

    cfg = apply_env_overrides(load_config_from_global_var_js(global_var_js))

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    id_token = sign_in_and_get_id_token(cfg)
    data = rtdb_get(cfg, id_token, args.path)

    clean_path = (args.path or "").strip("/")
    validated_settings = clean_path.endswith("data_base3/settings/default_user/settingsData")

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = out_dir / f"tests_and_diagnostic_{ts}.json"

    warnings = validate_settings(args.path, data)
    received_keys: Optional[list[str]] = None
    if isinstance(data, dict):
        try:
            received_keys = sorted([str(k) for k in data.keys()])
        except Exception:
            received_keys = None

    snapshot_diagnostic = {
        "snapshot": {
            "path": args.path,
            "fetched_at": datetime.now().isoformat(timespec="seconds"),
            "data": data,
            "expected_data": build_expected_data_for_path(args.path),
        },
        "errors": {
            "warnings": warnings,
            "received_top_level_keys": received_keys,
        },
        "scripts": build_scripts_section(workspace_root),
    }

    report = {"snapshot_diagnostic": snapshot_diagnostic}
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Wrote diagnostic: {out_path}")
    if warnings:
        print("Warnings:")
        for w in warnings:
            print(f"- {w}")
    else:
        if validated_settings:
            print("OK: lastLessonId values look like lesson_# keys")
        else:
            print(f"OK: snapshot fetched for {clean_path}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        raise
