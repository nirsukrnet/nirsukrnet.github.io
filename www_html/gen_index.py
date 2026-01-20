from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


@dataclass(frozen=True)
class Entry:
    name: str
    href: str
    is_dir: bool
    size_bytes: int
    mtime: float


def _format_size(size_bytes: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    size = float(size_bytes)
    for unit in units:
        if size < 1024.0 or unit == units[-1]:
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size_bytes} B"


def _format_mtime(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")


def _iter_entries(folder: Path) -> list[Entry]:
  entries: list[Entry] = []

  data_dir = folder / "data"
  pages_dir = folder / "pages"
  has_split_dirs = data_dir.is_dir() and pages_dir.is_dir()

  for p in folder.iterdir():
    # Topics-only index for split layout: list root .html pages only.
    if not p.is_file():
      continue
    if p.suffix.lower() != ".html":
      continue
    if p.name in {"index.html", "template_shell.html"}:
      continue
    if p.name.startswith("template_"):
      continue

    # Filter out broken/mismatched topics: include only pages that have
    # corresponding split-layout bundle files.
    if has_split_dirs:
      stem = p.stem
      if not (data_dir / f"{stem}.data.js").is_file():
        continue
      if not (pages_dir / f"{stem}.page.js").is_file():
        continue

    stat = p.stat()
    entries.append(
      Entry(
        name=p.name,
        href=p.name,
        is_dir=False,
        size_bytes=stat.st_size,
        mtime=stat.st_mtime,
      )
    )

  entries.sort(key=lambda e: e.name.casefold())
  return entries


def render_index(folder: Path) -> str:
    entries = _iter_entries(folder)
    rows = "\n".join(
        [
            "".join(
                [
                    "<tr>",
                    f"<td class=\"name\"><a href=\"{e.href}\">{e.name}</a></td>",
                    f"<td class=\"size\">{_format_size(e.size_bytes) if not e.is_dir else '—'}</td>",
                    f"<td class=\"mtime\">{_format_mtime(e.mtime)}</td>",
                    "</tr>",
                ]
            )
            for e in entries
        ]
    )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Topics</title>
  <style>
    :root {{
      --bg: #0b1220;
      --panel: #0f1a2e;
      --text: #e7eefc;
      --muted: #a9b7d0;
      --border: rgba(231, 238, 252, 0.14);
      --link: #7ab7ff;
      --linkHover: #b6d8ff;
      --shadow: rgba(0, 0, 0, 0.35);
    }}
    body {{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: radial-gradient(1200px 800px at 20% 0%, #182a4a 0%, var(--bg) 55%) fixed;
      color: var(--text);
    }}
    .wrap {{ max-width: 980px; margin: 32px auto; padding: 0 16px; }}
    .card {{
      background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: 0 12px 30px var(--shadow);
      overflow: hidden;
    }}
    header {{ padding: 18px 20px; border-bottom: 1px solid var(--border); }}
    h1 {{ margin: 0; font-size: 18px; letter-spacing: 0.2px; }}
    .sub {{ margin-top: 6px; font-size: 12px; color: var(--muted); }}
    .actions {{ margin-top: 12px; display: flex; gap: 10px; flex-wrap: wrap; }}
    .btn {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.06);
      color: var(--text);
      text-decoration: none;
      font-size: 13px;
    }}
    .btn:hover {{ background: rgba(255,255,255,0.10); text-decoration: none; }}
    .help {{ padding: 14px 20px; border-bottom: 1px solid var(--border); }}
    details.help-item {{
      border: 1px solid var(--border);
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      padding: 10px 12px;
      margin-top: 10px;
    }}
    details.help-item summary {{
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 13px;
    }}
    details.help-item summary::-webkit-details-marker {{ display: none; }}
    .toggle {{
      width: 22px;
      height: 22px;
      border-radius: 6px;
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      color: var(--muted);
      background: rgba(255,255,255,0.06);
      flex: 0 0 auto;
    }}
    .help-body {{ margin-top: 10px; color: var(--muted); font-size: 12px; line-height: 1.5; }}
    .help-body a {{ color: var(--link); }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ padding: 12px 14px; border-bottom: 1px solid var(--border); }}
    th {{ text-align: left; font-size: 12px; color: var(--muted); font-weight: 600; }}
    td {{ font-size: 14px; }}
    td.size, td.mtime {{ white-space: nowrap; color: var(--muted); font-variant-numeric: tabular-nums; }}
    a {{ color: var(--link); text-decoration: none; }}
    a:hover {{ color: var(--linkHover); text-decoration: underline; }}
    .footer {{ padding: 12px 20px; color: var(--muted); font-size: 12px; }}
    .hint {{ margin-top: 10px; color: var(--muted); font-size: 12px; }}
    code {{ background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 6px; }}
  </style>
</head>
<body>
  <div class=\"wrap\">
    <div class=\"card\">
      <header>
        <h1>Topics</h1>
        <div class=\"sub\">Generated: {now} • {len(entries)} item(s)</div>
        <div class=\"actions\">
          <a class=\"btn\" href=\"/edit\">Open editor (/edit)</a>
          <a class=\"btn\" href=\"/delete\">Delete pages (/delete)</a>
          <a class=\"btn\" href=\"/\">Refresh topics</a>
        </div>
      </header>

      <div class=\"help\">
        <details class=\"help-item\">
          <summary><span class=\"toggle\" aria-hidden=\"true\">+</span> Help: Edit</summary>
          <div class=\"help-body\">
            <div><b>What:</b> Use <a href=\"/edit\">/edit</a> to create NEW pages or append a record in EDIT mode.</div>
            <div><b>Tip:</b> If a page appears in the dropdown, it must have bundle files: <code>data/&lt;slug&gt;.data.js</code> and <code>pages/&lt;slug&gt;.page.js</code>.</div>
            <div style=\"margin-top:8px\"><b>Launch:</b> <code>python web_editor.py</code></div>
          </div>
        </details>

        <details class=\"help-item\">
          <summary><span class=\"toggle\" aria-hidden=\"true\">+</span> Help: Delete</summary>
          <div class=\"help-body\">
            <div><b>What:</b> Use <a href=\"/delete\">/delete</a> to remove a topic bundle (html + data + page js).</div>
            <div><b>Safe:</b> The UI shows the exact files before deleting.</div>
          </div>
        </details>

        <details class=\"help-item\">
          <summary><span class=\"toggle\" aria-hidden=\"true\">+</span> Help: Scripts</summary>
          <div class=\"help-body\">
            <div><b>Regenerate this menu:</b> <code>python gen_index.py</code></div>
            <div><b>Folder:</b> This file lives in <code>www_html/</code>, so running it regenerates <code>www_html/index.html</code>.</div>
          </div>
        </details>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
{rows if rows else '<tr><td class="name">(empty)</td><td class="size">—</td><td class="mtime">—</td></tr>'}
        </tbody>
      </table>
      <div class=\"footer\">
        <div>To regenerate: <code>python gen_index.py</code> • Editor: <a href=\"/edit\">/edit</a> • Delete: <a href=\"/delete\">/delete</a></div>
      </div>
    </div>
  </div>

  <script>
    (function () {{
      var items = document.querySelectorAll('details.help-item');
      function sync(detailsEl) {{
        var t = detailsEl.querySelector('.toggle');
        if (!t) return;
        t.textContent = detailsEl.open ? '-' : '+';
      }}
      items.forEach(function (d) {{
        sync(d);
        d.addEventListener('toggle', function () {{ sync(d); }});
      }});
    }})();
  </script>
</body>
</html>
"""


def main() -> int:
    folder = Path(__file__).resolve().parent
    out = folder / "index.html"
    out.write_text(render_index(folder), encoding="utf-8")
    print(f"Wrote: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
