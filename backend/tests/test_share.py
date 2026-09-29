import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import ratelimit, share

META = {"region_id": "hue", "garment_id": "ao-dai", "occasion_id": "tet-chua", "month": "2026-02", "status": "worn",
        "note": "Lần đầu mặc áo dài đi chùa.", "compass_label": "Authentic", "photo_kinds": ["real"], "photo_samples": [False]}
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100


@pytest.fixture
def client(tmp_path, monkeypatch):
    ratelimit._hits.clear()
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setattr(share, "LOCAL", tmp_path / "shares")
    with TestClient(app) as c:
        yield c


def post(client, meta=META, n=1):
    return client.post("/share", data={"meta": json.dumps(meta)}, files=[("photos", (f"{i}.png", PNG, "image/png")) for i in range(n)])


def test_share_roundtrip_and_delete(client):
    r = post(client)
    assert r.status_code == 201
    sid, key = r.json()["id"], r.json()["delete_key"]
    page = client.get(f"/share/{sid}").json()
    assert page["meta"]["note"] == META["note"] and "delete_key_hash" not in page
    assert client.get(page["photo_urls"][0]).status_code == 200
    assert client.delete(f"/share/{sid}", headers={"X-Delete-Key": "wrong"}).status_code == 404
    assert client.delete(f"/share/{sid}", headers={"X-Delete-Key": key}).status_code == 200
    assert client.get(f"/share/{sid}").status_code == 404


@pytest.mark.parametrize(
    "patch",
    [{"name": "Du Ký của Lan"}, {"date": "2026-02-17"}, {"place": "Chùa Thiên Mụ"}, {"month": "2026-02-17"}, {"note": "x" * 201}],
)
def test_share_refuses_anything_that_points_to_the_person(client, patch):
    assert post(client, {**META, **patch}).status_code == 422


def test_share_checks_photos(client):
    assert post(client, n=2).status_code == 422  # two photos, one declared
    bad = client.post("/share", data={"meta": json.dumps(META)}, files=[("photos", ("x.gif", b"GIF89a", "image/gif"))])
    assert bad.status_code == 415
