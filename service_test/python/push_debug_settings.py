from __future__ import annotations

import argparse
import base64
import json
import os
import re
import sys
from dataclasses import dataclass
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


# Default settings to upload when running this script with NO parameters.
# This is equivalent to service_test/sample_default_debug_settings.json (debug-only).
DEFAULT_DEBUG_SETTINGS: dict[str, Any] = {
    "debug": {
        "output": {"sink": "console"},
        # Human-friendly list; this script will encode these into Firebase-safe keys.
        "enabledIdentsPlain": [
            "cdebug.js::selftest::ping",
            # "oneaudio_controlbuttons.js::addButtonsTrans_oap::addedTransButton",
        ],
    }
}


def ident_to_key(ident: str) -> str:
    # Firebase RTDB keys cannot contain: . $ # [ ] /
    # Encode ident as base64url without padding.
    raw = str(ident or "").strip()
    if not raw:
        return ""
    enc = base64.urlsafe_b64encode(raw.encode("utf-8")).decode("ascii")
    return enc.rstrip("=")


def normalize_enabled_idents(obj: dict[str, Any]) -> dict[str, Any]:
    # Convert human-friendly enabledIdentsPlain (list of idents) into enabledIdents (encoded-key map).
    dbg = obj.get("debug")
    if not isinstance(dbg, dict):
        return obj

    enabled_map: dict[str, Any] = {}

    # Start with any existing encoded map (keep as-is).
    existing = dbg.get("enabledIdents")
    if isinstance(existing, dict):
        enabled_map.update(existing)

    # Accept list-based input.
    plain = dbg.get("enabledIdentsPlain")
    if isinstance(plain, list):
        for it in plain:
            k = ident_to_key(str(it))
            if k:
                enabled_map[k] = True

    # Also accept legacy dict where keys were raw idents (cannot be stored in RTDB, but can appear in local JSON).
    if isinstance(existing, dict):
        bad_keys = [k for k in existing.keys() if any(ch in str(k) for ch in [".", "#", "$", "[", "]", "/"]) or str(k).strip() == ""]
        if bad_keys:
            for raw_ident, v in existing.items():
                if v is True:
                    k = ident_to_key(str(raw_ident))
                    if k:
                        enabled_map[k] = True

    # Write back normalized map and remove plain list.
    dbg["enabledIdents"] = enabled_map
    if "enabledIdentsPlain" in dbg:
        dbg.pop("enabledIdentsPlain", None)

    obj["debug"] = dbg
    return obj


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


def deep_merge(a: Any, b: Any) -> Any:
    if not isinstance(a, dict) or not isinstance(b, dict):
        return b
    out = dict(a)
    for k, v in b.items():
        if k in out:
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out


def rtdb_patch(cfg: FirebaseConfig, id_token: str, rtdb_path: str, patch: dict[str, Any]) -> Any:
    clean = rtdb_path.strip("/")
    url = f"{cfg.database_url}/{clean}.json?auth={quote(id_token)}"
    return http_json("PATCH", url, patch)


def rtdb_put(cfg: FirebaseConfig, id_token: str, rtdb_path: str, value: dict[str, Any]) -> Any:
    clean = rtdb_path.strip("/")
    url = f"{cfg.database_url}/{clean}.json?auth={quote(id_token)}"
    return http_json("PUT", url, value)


def rtdb_get(cfg: FirebaseConfig, id_token: str, rtdb_path: str) -> Any:
    clean = rtdb_path.strip("/")
    url = f"{cfg.database_url}/{clean}.json?auth={quote(id_token)}"
    return http_json("GET", url)


def _looks_empty(value: Any) -> bool:
    if value is None:
        return True
    if value == "":
        return True
    if isinstance(value, dict) and len(value) == 0:
        return True
    return False


def _print_existing_summary(existing: Any) -> None:
    try:
        if isinstance(existing, dict):
            keys = sorted([str(k) for k in existing.keys()])
            print(f"Existing keys: {keys}")
        else:
            print(f"Existing value type: {type(existing).__name__}")
    except Exception:
        print("Existing value: (unable to summarize)")


def _ask_yes_no(prompt: str) -> bool:
    try:
        ans = input(prompt).strip().lower()
    except (EOFError, KeyboardInterrupt):
        return False
    return ans in {"y", "yes"}


def load_json_file(path: Path) -> dict[str, Any]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise RuntimeError(f"JSON root must be an object: {path}")
    return data


def main(argv: list[str]) -> int:
    # No-args default behavior:
    # - Check if test_debug_db3/default_debug already exists
    # - Ask before overwriting
    # - PUT the embedded DEFAULT_DEBUG_SETTINGS
    if len(argv) == 0:
        workspace_root = Path(__file__).resolve().parents[2]  # .../html
        global_var_js = workspace_root / "assets" / "js" / "global_var.js"
        if not global_var_js.exists():
            raise RuntimeError(f"Cannot find {global_var_js}")

        cfg = apply_env_overrides(load_config_from_global_var_js(global_var_js))
        token = sign_in_and_get_id_token(cfg)

        path = "test_debug_db3/default_debug"
        existing = rtdb_get(cfg, token, path)

        if not _looks_empty(existing):
            print(f"Firebase already has data at: {cfg.database_url}/{path}")
            _print_existing_summary(existing)
            ok = _ask_yes_no("Replace it with the default debug settings? [y/N]: ")
            if not ok:
                print("Aborted (no changes made).")
                return 0

        rtdb_put(cfg, token, path, normalize_enabled_idents(dict(DEFAULT_DEBUG_SETTINGS)))
        print(f"Uploaded default debug settings via PUT: {cfg.database_url}/{path}")
        return 0

    parser = argparse.ArgumentParser(
        description="Push debug settings (enabledIdents + output sink) into Firebase RTDB for cdebug.js"
    )
    parser.add_argument(
        "--path",
        default="test_debug_db3/default_debug",
        help="Firebase RTDB path to patch (no leading slash)",
    )
    parser.add_argument(
        "--sink",
        choices=["console", "db", "both"],
        help="debug.output.sink value to write",
    )
    parser.add_argument(
        "--enable",
        action="append",
        default=[],
        help="Enable a specific ident (repeatable)",
    )
    parser.add_argument(
        "--disable",
        action="append",
        default=[],
        help="Disable a specific ident (repeatable). This deletes the key (PATCH null).",
    )
    parser.add_argument(
        "--json",
        dest="json_path",
        help="Path to a JSON file. With default mode it is merged via PATCH; with --put it is uploaded as the full object.",
    )
    parser.add_argument(
        "--put",
        action="store_true",
        help="Upload the entire JSON object to --path using PUT (overwrites the node). Requires --json and --force.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Required with --put to avoid accidental overwrites.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the PATCH body and exit without writing",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Do not prompt (only affects interactive overwrite prompts).",
    )

    args = parser.parse_args(argv)

    # PUT mode: overwrite the node with the provided JSON.
    if args.put:
        if not args.json_path:
            raise RuntimeError("--put requires --json <file>")
        if not args.force:
            raise RuntimeError("Refusing to overwrite without --force (use --put --force)")
        full_obj = normalize_enabled_idents(load_json_file(Path(args.json_path)))

        if args.dry_run:
            print(json.dumps({"path": args.path, "method": "PUT", "value": full_obj}, ensure_ascii=False, indent=2))
            return 0

        workspace_root = Path(__file__).resolve().parents[2]  # .../html
        global_var_js = workspace_root / "assets" / "js" / "global_var.js"
        if not global_var_js.exists():
            raise RuntimeError(f"Cannot find {global_var_js}")

        cfg = apply_env_overrides(load_config_from_global_var_js(global_var_js))
        token = sign_in_and_get_id_token(cfg)
        # Optional preflight prompt unless --yes.
        if not args.yes:
            existing = rtdb_get(cfg, token, args.path)
            if not _looks_empty(existing):
                print(f"Firebase already has data at: {cfg.database_url}/{args.path}")
                _print_existing_summary(existing)
                ok = _ask_yes_no("Replace it via PUT? [y/N]: ")
                if not ok:
                    print("Aborted (no changes made).")
                    return 0

        rtdb_put(cfg, token, args.path, full_obj)
        print(f"Overwrote Firebase RTDB via PUT: {cfg.database_url}/{args.path}")
        return 0

    patch: dict[str, Any] = {}

    if args.json_path:
        patch = deep_merge(patch, normalize_enabled_idents(load_json_file(Path(args.json_path))))

    dbg_patch: dict[str, Any] = {}

    if args.sink:
        dbg_patch = deep_merge(dbg_patch, {"output": {"sink": args.sink}})

    if args.enable:
        enabled = {ident_to_key(ident): True for ident in args.enable if str(ident).strip() and ident_to_key(ident)}
        if enabled:
            dbg_patch = deep_merge(dbg_patch, {"enabledIdents": enabled})

    if args.disable:
        disabled = {ident_to_key(ident): None for ident in args.disable if str(ident).strip() and ident_to_key(ident)}
        if disabled:
            dbg_patch = deep_merge(dbg_patch, {"enabledIdents": disabled})

    if dbg_patch:
        patch = deep_merge(patch, {"debug": dbg_patch})

    if not patch:
        raise RuntimeError("No changes specified. Use --sink/--enable/--disable/--json.")

    if args.dry_run:
        print(json.dumps({"path": args.path, "method": "PATCH", "patch": patch}, ensure_ascii=False, indent=2))
        return 0

    # Prefer the main app config so credentials stay in one place
    workspace_root = Path(__file__).resolve().parents[2]  # .../html
    global_var_js = workspace_root / "assets" / "js" / "global_var.js"
    if not global_var_js.exists():
        raise RuntimeError(f"Cannot find {global_var_js}")

    cfg = apply_env_overrides(load_config_from_global_var_js(global_var_js))
    token = sign_in_and_get_id_token(cfg)

    rtdb_patch(cfg, token, args.path, patch)
    print(f"Patched Firebase RTDB: {cfg.database_url}/{args.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(os.sys.argv[1:]))
