import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ask as ask_service
from app.services import gemini_client, ratelimit


@pytest.fixture
def client():
    ratelimit._hits.clear()
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/health").json()["ok"] is True


def test_bootstrap_has_everything_the_frontend_needs(client):
    b = client.get("/content/bootstrap").json()
    assert {"regions", "garments", "occasions", "colors", "accessories", "sources", "opening"} <= b.keys()
    assert any(r["status"] == "locked" for r in b["regions"])


def test_garment_detail_and_404(client):
    assert client.get("/garments/ao-dai").json()["accessory_details"]
    assert client.get("/garments/khong-co").status_code == 404


def test_compass_422_on_bad_selection(client):
    r = client.post("/compass", json={"garment_id": "ao-dai", "occasion_id": "di-tich", "accessories": ["khan-ran"]})
    assert r.status_code == 422


def test_compare(client):
    base = {"garment_id": "ao-dai", "occasion_id": "di-tich"}
    r = client.post("/compass/compare", json={"selections": [base, {**base, "accessories": ["obi"]}]})
    assert [x["state"] for x in r.json()] == ["fit", "distorted"]


def test_tryon_distorted_look_renders_alternative(client, fake_gemini):
    sel = {"garment_id": "ao-ngu-than", "occasion_id": "di-tich", "accessories": ["obi"]}
    files = {"photo": ("me.png", b"\x89PNG me", "image/png")}
    r = client.post("/tryon", data={"selection": json.dumps(sel)}, files=files).json()
    assert r["rendered_alternative"] is True
    assert "obi" not in r["rendered_selection"]["accessories"]
    assert r["image_base64"]
    assert "Japanese obi" in fake_gemini.image_calls[0]  # still listed under MUST AVOID
    assert "Accessories: none" in fake_gemini.image_calls[0]
    assert "Chinese characters" in fake_gemini.image_calls[0]  # backgrounds like Tết pagodas tend to add couplets


def test_tryon_rejects_non_image(client, fake_gemini):
    sel = {"garment_id": "ao-dai", "occasion_id": "di-tich"}
    r = client.post("/tryon", data={"selection": json.dumps(sel)}, files={"photo": ("a.txt", b"hi", "text/plain")})
    assert r.status_code == 415


def test_tryon_without_gemini_returns_no_image(client):
    sel = {"garment_id": "ao-dai", "occasion_id": "di-tich"}
    r = client.post("/tryon", data={"selection": json.dumps(sel)}, files={"photo": ("me.png", b"x", "image/png")}).json()
    assert r["image_base64"] is None


def test_tryon_rate_limit(client, fake_gemini, monkeypatch):
    monkeypatch.setattr("app.routers.styling.settings", type("S", (), {"tryon_per_minute": 1, "max_upload_mb": 8})())
    sel = json.dumps({"garment_id": "ao-dai", "occasion_id": "di-tich"})
    files = {"photo": ("me.png", b"x", "image/png")}
    assert client.post("/tryon", data={"selection": sel}, files=files).status_code == 200
    assert client.post("/tryon", data={"selection": sel}, files=files).status_code == 429


def test_ask_drops_invented_sources(client, fake_gemini):
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Áo ngũ thân có từ khi nào?"}).json()
    assert r["sources"] == ["ref-03"]
    assert r["grounded"] is True


def test_ask_without_gemini_says_busy_not_unknown(client):
    # a 402/429 from Gemini is not "no source": the reader should ask again later (#51)
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Có từ khi nào?"}).json()
    assert r == {"answer": ask_service.REFUSALS["unavailable"], "sources": [], "grounded": False, "reason": "unavailable"}


def test_quiz_hides_answers_and_checks(client):
    q = client.get("/quiz?count=2").json()
    assert all("answer" not in i for i in q["items"])
    r = client.post("/quiz/answer", json={"id": "q-hanbok", "answer": "hanfu"}).json()
    assert r["correct"] is False and r["answer"] == "hanbok"


def test_shops_filter(client):
    assert len(client.get("/shops?city=huế&garment_id=ao-dai").json()) == 1
    assert client.get("/shops?city=Hà Nội").json() == []


def test_weather_locked_region_has_no_point(client):
    assert client.get("/weather/tay-bac").json() == {"available": False}


def test_content_report(client):
    rep = client.get("/admin/content-report").json()
    assert rep["ok"] is True and rep["counts"]["garments"] == 6


def test_reload_disabled_without_token(client):
    assert client.post("/admin/reload").status_code == 403


class _Scripted(gemini_client.GeminiClient):
    """Returns whatever the test says Gemini answered."""

    def __init__(self, out):
        self.out = out
        self.prompts: list[str] = []

    @property
    def available(self) -> bool:
        return True

    def generate_json(self, prompt):
        self.prompts.append(prompt)
        return self.out


@pytest.fixture
def scripted():
    def use(out):
        fake = _Scripted(out)
        gemini_client.set_client(fake)
        return fake

    yield use
    gemini_client.set_client(gemini_client.GeminiClient(api_key=None))


@pytest.mark.parametrize(
    "out",
    [
        ["ref-03"],  # a list
        "Áo ngũ thân có từ 1744",  # a string
        42,  # a number
        {"answer": {"text": "x"}, "sources": ["ref-03"]},  # answer is an object
        {"answer": "Có từ 1744.", "sources": "ref-03"},  # sources is a string
    ],
)
def test_ask_wrong_shapes_refuse_without_500(client, scripted, out):
    scripted(out)
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Có từ khi nào?"})
    assert r.status_code == 200
    assert r.json() == {"answer": ask_service.REFUSALS["unavailable"], "sources": [], "grounded": False, "reason": "unavailable"}


def test_ask_keeps_real_sources_and_refuses_when_none_left(client, scripted):
    scripted({"answer": "Năm 1744.", "sources": ["ref-03", "ref-made-up"]})
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Có từ khi nào?"}).json()
    assert r["sources"] == ["ref-03"] and r["grounded"] is True
    scripted({"answer": "Năm 1744.", "sources": ["ref-made-up"]})
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Có từ khi nào?"}).json()
    assert r["grounded"] is False and r["sources"] == []


def test_ask_refusal_is_never_grounded(client, scripted):
    scripted({"answer": "Thời tiết mai đẹp.", "sources": ["ref-03"], "refuse": "off_topic"})
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Thời tiết mai?"}).json()
    assert r == {"answer": ask_service.REFUSALS["off_topic"], "sources": [], "grounded": False, "reason": "off_topic"}


@pytest.mark.parametrize("reason", ["off_topic", "no_source", "unsafe"])
def test_ask_says_why_it_refuses(client, scripted, reason):
    scripted({"refuse": reason})
    r = client.post("/ask", json={"garment_id": "ao-dai", "question": "Câu gì đó"}).json()
    assert r == {"answer": ask_service.REFUSALS[reason], "sources": [], "grounded": False, "reason": reason}


def test_ask_refusals_speak_as_teo():
    # Tí and Tèo say "tớ" and call the reader "bạn" (content/_templates/README.md, #59)
    assert all("tớ" in t.lower() and "bạn" in t.lower() for t in ask_service.REFUSALS.values())


def test_ask_refusal_points_to_the_chips():
    # the chips are probed, so pointing there never sends the reader to another refusal (#51)
    assert "gợi ý" in ask_service.REFUSALS["no_source"]


def test_ask_wrong_shape_is_a_model_failure_not_missing_data(client, scripted):
    scripted({"answer": 42})
    assert client.post("/ask", json={"garment_id": "ao-dai", "question": "Có từ khi nào?"}).json()["reason"] == "unavailable"


def test_ask_does_not_ground_on_an_unverified_source(client, scripted, content):
    # the reader would see an empty "Nguồn:", since the site never cites a source the team has not vetted
    unverified = next(s.id for s in content.sources.values() if s.verified is False)
    scripted({"answer": "Nhẹ, thoáng.", "sources": [unverified]})
    r = client.post("/ask", json={"garment_id": "ao-ba-ba", "question": "Vì sao áo bà ba mát?"}).json()
    assert r["grounded"] is False and r["reason"] == "no_source"


def test_ask_gives_occasion_names(client, scripted, content):
    fake = scripted({"refuse": "no_source"})
    client.post("/ask", json={"garment_id": "ao-ba-ba", "question": "Mặc dịp nào?"})
    g = content.garments["ao-ba-ba"]
    assert content.occasions[g.occasions[0]].name in fake.prompts[0]


def test_ask_answers_from_compass_rules_and_accessories(client, scripted, content):
    # "Mặc áo dài với sneakers được không?": Compass knows (a modern accessory is a flexible change), so Tèo can too
    flexible = content.rules["flexible"]
    fake = scripted({"answer": "Được, sneakers là phụ kiện hiện đại.", "sources": [flexible.sources[0]]})
    r = client.post("/ask", json={"garment_id": "ao-dai", "question": "Mặc áo dài với sneakers được không?"}).json()
    assert r["grounded"] is True and r["sources"] == [flexible.sources[0]] and r["reason"] is None
    assert "sneakers-trang" in fake.prompts[0] and flexible.why in fake.prompts[0]


def test_ask_can_compare_two_garments(client, scripted, content):
    tu, ngu = (next(s for s in content.garments[g].sources if content.sources[s].verified) for g in ("ao-tu-than", "ao-ngu-than"))
    fake = scripted({"answer": "Tứ thân 4 vạt, ngũ thân 5 vạt.", "sources": [tu, ngu]})
    r = client.post("/ask", json={"garment_id": "ao-tu-than", "question": "Tứ thân khác ngũ thân chỗ nào?"}).json()
    assert r["grounded"] is True and set(r["sources"]) == {tu, ngu}
    prompt = fake.prompts[0]
    assert "ao-ngu-than" in prompt and prompt.index('"id": "ao-tu-than"') < prompt.index('"id": "ao-ngu-than"')


def test_weather_forecast_explains_when_there_is_none(client):
    from datetime import date, timedelta

    far = (date.today() + timedelta(days=40)).isoformat()
    past = (date.today() - timedelta(days=2)).isoformat()
    assert client.get(f"/weather/hue?date={far}").json()["reason"] == "too_far"
    assert client.get(f"/weather/hue?date={past}").json() == {"available": False, "reason": "past"}
    assert client.get(f"/weather/tay-bac?date={far}").json() == {"available": False, "reason": "no_point"}
    assert client.get("/weather/hue?date=not-a-date").status_code == 422


def test_weather_forecast_for_a_day(client, monkeypatch):
    from datetime import date, timedelta

    from app.services import weather

    class R:
        def json(self):
            return {"daily": {"temperature_2m_max": [34.2], "precipitation_probability_max": [20]}}

    monkeypatch.setattr(weather.httpx, "get", lambda *a, **k: R())
    weather._cache.clear()
    d = (date.today() + timedelta(days=3)).isoformat()
    out = client.get(f"/weather/nam-bo?date={d}").json()
    assert out["available"] and out["max_c"] == 34.2 and out["is_hot"] and out["tips"]
