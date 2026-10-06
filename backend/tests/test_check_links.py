import httpx

from scripts import check_links


def _client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=True)


def test_each_link_is_sorted_by_what_a_reader_would_see():
    def handler(req: httpx.Request) -> httpx.Response:
        path = req.url.path
        if path == "/moved":
            return httpx.Response(301, headers={"location": "https://a.vn/ok"})
        if path == "/timeout":
            raise httpx.ReadTimeout("slow", request=req)
        if path == "/head-not-allowed":
            return httpx.Response(405 if req.method == "HEAD" else 200)
        return httpx.Response({"/ok": 200, "/bot": 403, "/gone": 404, "/down": 503}[path])

    links = [(f"s-{p}", f"https://a.vn/{p}") for p in ("ok", "moved", "bot", "gone", "down", "timeout", "head-not-allowed")]
    with _client(handler) as client:
        got = {where: status for where, _, status, _ in check_links.check(links, client)}
    assert got == {
        "s-ok": "ok",
        "s-moved": "ok",
        "s-bot": "blocked",
        "s-gone": "broken",
        "s-down": "broken",
        "s-timeout": "timeout",
        "s-head-not-allowed": "ok",
    }


def test_links_come_from_sources_and_photo_credits(content):
    links = check_links.links(content)
    wheres = [w for w, _ in links]
    assert "sources.json [ref-08]" in wheres
    assert any(w.startswith("regions [hue]") and "photo" in w for w in wheres)
    assert all(url.startswith("http") for _, url in links)
