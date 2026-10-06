"""Open every source link and photo credit link:  python -m scripts.check_links

Run by hand before a demo, or on a schedule. Exit code 1 when a link is broken (404, 410, 5xx).
"Blocked" (401, 403, 429) usually means the site turns bots away; open it in a browser to be sure.
"""

import sys
from collections.abc import Iterable
from concurrent.futures import ThreadPoolExecutor

import httpx

from app.content import store

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
LABELS = {"ok": "✅ mở được", "blocked": "🚫 chặn bot (mở thử bằng trình duyệt)", "timeout": "⏱️ quá thời gian", "broken": "❌ hỏng"}


def links(content: store.Content) -> list[tuple[str, str]]:
    found = [(f"sources.json [{s.id}]", s.url) for s in content.sources.values() if s.url]

    def walk(value, where: str, path: str = "") -> None:
        if isinstance(value, dict):
            if value.get("source_url"):
                found.append((f"{where} photo at {path}", value["source_url"]))
            for k, v in value.items():
                walk(v, where, f"{path}.{k}" if path else k)
        elif isinstance(value, list):
            for i, v in enumerate(value):
                walk(v, where, f"{path}[{i}]")

    for reg in content.regions.values():
        walk(reg.model_dump(), f"regions [{reg.id}]")
    return found


def _status(client: httpx.Client, url: str) -> tuple[str, str]:
    try:
        res = client.head(url)
        if res.status_code >= 400:
            res = client.get(url)  # some sites answer HEAD badly but GET fine
    except httpx.TimeoutException:
        return "timeout", "timeout"
    except httpx.HTTPError as e:
        return "broken", type(e).__name__
    code = res.status_code
    if code < 400:
        return "ok", str(code)
    if code in (401, 403, 429):
        return "blocked", str(code)
    return "broken", str(code)


def check(items: Iterable[tuple[str, str]], client: httpx.Client) -> list[tuple[str, str, str, str]]:
    """(where, url) -> (where, url, ok|blocked|timeout|broken, HTTP code or error)"""
    items = list(items)
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda it: _status(client, it[1]), items))
    return [(where, url, status, detail) for (where, url), (status, detail) in zip(items, results)]


def main() -> int:
    content, _ = store.load()
    items = links(content)
    with httpx.Client(follow_redirects=True, timeout=15, headers={"User-Agent": UA}) as client:
        results = check(items, client)
    print(f"{len(results)} đường dẫn\n")
    for status in ("broken", "timeout", "blocked"):
        bad = [r for r in results if r[2] == status]
        if bad:
            print(f"{LABELS[status]} ({len(bad)}):")
            for where, url, _, detail in bad:
                print(f"   - {where} [{detail}] {url}")
            print()
    ok = sum(r[2] == "ok" for r in results)
    print(f"{LABELS['ok']}: {ok}/{len(results)}")
    return 1 if any(r[2] == "broken" for r in results) else 0


if __name__ == "__main__":
    sys.exit(main())
