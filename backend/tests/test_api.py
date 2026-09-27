import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ratelimit


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


def test_ask_without_gemini_refuses(client):
    r = client.post("/ask", json={"garment_id": "ao-ngu-than", "question": "Có từ khi nào?"}).json()
    assert r["grounded"] is False


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
    assert rep["ok"] is True and rep["counts"]["garments"] == 4


def test_reload_disabled_without_token(client):
    assert client.post("/admin/reload").status_code == 403
