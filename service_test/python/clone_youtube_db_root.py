"""Clone YouTube DB root data from one prefix to another in Firebase RTDB.

This workspace uses the Firebase REST API via the same project credentials as the JS pages.

Default:
- from: db_youtube1
- to:   db_youtube2

Notes:
- This performs a best-effort, idempotent-ish copy.
- It will refuse to overwrite an existing destination root unless you pass --overwrite.

Examples:
  python clone_youtube_db_root.py
  python clone_youtube_db_root.py --from db_youtube1 --to db_youtube2
  python clone_youtube_db_root.py --overwrite
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request


DEFAULT_DATABASE_URL = "https://storage-eu-default-rtdb.firebaseio.com"
DEFAULT_AUTH_EMAIL = "saps1@nukr.net"
DEFAULT_AUTH_PASSWORD = "B0u_1hg81apAqw"
DEFAULT_API_KEY = "AIzaSyCh5Fs3-KtOSw5HNssAwNDLc1Z5jIiaaFU"

# All data is under this root in the RTDB.
DEFAULT_BASE_ROOT = "auto"


def _read_json(resp) -> object:
    raw = resp.read().decode("utf-8")
    if not raw:
        return None
    return json.loads(raw)


def firebase_sign_in(api_key: str, email: str, password: str) -> str:
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
    payload = json.dumps({"email": email, "password": password, "returnSecureToken": True}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = _read_json(resp)
    if not isinstance(data, dict) or not data.get("idToken"):
        raise RuntimeError(f"Sign-in failed: {data}")
    return str(data["idToken"])


def rtdb_url(database_url: str, base_root: str, path: str, id_token: str) -> str:
    """Build a Firebase RTDB REST URL.

    If base_root is empty, path is treated as top-level.
    """
    path = (path or "").strip("/")
    base_root = (base_root or "").strip("/")

    parts: list[str] = []
    if base_root:
        parts.append(base_root)
    if path:
        parts.append(path)

    quoted = "/".join(urllib.parse.quote(p, safe="") for p in parts)
    return f"{database_url}/{quoted}.json?auth={urllib.parse.quote(id_token)}"


def rtdb_get(database_url: str, base_root: str, path: str, id_token: str):
    url = rtdb_url(database_url, base_root, path, id_token)
    with urllib.request.urlopen(url, timeout=30) as resp:
        return _read_json(resp)


def rtdb_put(database_url: str, base_root: str, path: str, id_token: str, payload) -> None:
    url = rtdb_url(database_url, base_root, path, id_token)
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"}, method="PUT")
    with urllib.request.urlopen(req, timeout=60):
        return


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="src", default="db_youtube1", help="Source root under data_base2")
    ap.add_argument("--to", dest="dst", default="db_youtube2", help="Destination root under data_base2")
    ap.add_argument("--overwrite", action="store_true", help="Allow overwriting destination if it already exists")
    ap.add_argument("--database-url", default=DEFAULT_DATABASE_URL)
    ap.add_argument(
        "--base-root",
        default=DEFAULT_BASE_ROOT,
        help=(
            "Base root container (default: auto). "
            "Use 'data_base2' for normal app data, '' for top-level. "
            "For YouTube pages that use ../db_youtubeX, top-level is usually correct."
        ),
    )
    ap.add_argument("--api-key", default=DEFAULT_API_KEY)
    ap.add_argument("--email", default=DEFAULT_AUTH_EMAIL)
    ap.add_argument("--password", default=DEFAULT_AUTH_PASSWORD)

    args = ap.parse_args(argv)

    src = str(args.src).strip("/")
    dst = str(args.dst).strip("/")
    if not src or not dst:
        print("ERROR: --from/--to must be non-empty", file=sys.stderr)
        return 2
    if src == dst:
        print("ERROR: --from and --to must be different", file=sys.stderr)
        return 2

    print(f"Signing in as {args.email}...")
    token = firebase_sign_in(args.api_key, args.email, args.password)

    # Base root auto-detection:
    # - Many pages use data_base2/<...>
    # - YouTube pages here often use ../db_youtubeX which escapes data_base2 and writes at top-level.
    base_root_raw = "" if args.base_root is None else str(args.base_root)
    base_root_raw = base_root_raw.strip()
    base_root_choices = []
    if base_root_raw.lower() == "auto":
        base_root_choices = ["data_base2", ""]
    else:
        base_root_choices = [base_root_raw]

    chosen_base_root = None
    chosen_src_data = None

    for br in base_root_choices:
        br_label = br if br else "<top-level>"
        print(f"Probing source {src} under base-root {br_label}...")
        try:
            data = rtdb_get(args.database_url, br, src, token)
        except Exception as e:
            print(f"Probe failed for base-root {br_label}: {e}")
            data = None

        if data not in (None, {}):
            chosen_base_root = br
            chosen_src_data = data
            break

    if chosen_base_root is None:
        print(
            f"ERROR: source '{src}' does not exist or is empty (tried base-roots: {', '.join([b or '<top-level>' for b in base_root_choices])}).",
            file=sys.stderr,
        )
        return 4

    br_label = chosen_base_root if chosen_base_root else "<top-level>"
    print(f"Using base-root: {br_label}")

    print(f"Checking destination {dst}...")
    existing_dst = rtdb_get(args.database_url, chosen_base_root, dst, token)
    if existing_dst not in (None, {}):
        if not args.overwrite:
            print(f"ERROR: destination '{dst}' already exists. Use --overwrite to replace it.", file=sys.stderr)
            return 3
        print("Destination exists; will overwrite (--overwrite).")

    print(f"Writing destination {dst}...")
    rtdb_put(args.database_url, chosen_base_root, dst, token, chosen_src_data)

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
