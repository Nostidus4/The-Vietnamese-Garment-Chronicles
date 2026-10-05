import json
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import events, ratelimit
from scripts.event_stats import summarize

SID = str(uuid.uuid4())


@pytest.fixture
def client(tmp_path, monkeypatch):
    ratelimit._hits.clear()
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setattr(events, "LOCAL", tmp_path / "events.jsonl")
    with TestClient(app) as c:
        yield c


def ev(type_, payload, sid=SID, ts="2026-10-01T10:00:00Z"):
    return {"session_id": sid, "type": type_, "payload": payload, "ts": ts}


def test_valid_event_is_stored_without_extra_data(client):
    r = client.post("/events", json=ev("quiz_answer", {"phase": "pre", "item_id": "q-hanbok", "correct": True, "region_id": "hue"}))
    assert r.status_code == 202 and r.json() == {"stored": "local"}
    saved = json.loads(events.LOCAL.read_text().splitlines()[0])
    assert set(saved) == {"session_id", "type", "payload", "ts", "received_at"}  # no IP, no headers, nothing else


@pytest.mark.parametrize(
    "body",
    [
        ev("page_view", {}),  # unknown type
        ev("duky_save", {"kind": "ai", "garment_id": "ao-dai", "name": "Lan"}),  # extra field: could carry PII
        ev("duky_save", {"kind": "ai", "garment_id": "Áo Dài của Lan"}),  # free text where an id belongs
        ev("tryon", {"garment_id": "ao-dai", "alternative": "yes", "sample": False}),  # wrong type
        {**ev("duky_save", {"kind": "real", "garment_id": "ao-dai"}), "session_id": "user@example.com"},
    ],
)
def test_rejects_unknown_types_and_anything_that_could_carry_pii(client, body):
    assert client.post("/events", json=body).status_code == 422


def test_rejects_oversized_body(client):
    big = ev("duky_save", {"kind": "ai", "garment_id": "ao-dai"})
    big["pad"] = "x" * 3000
    assert client.post("/events", json=big).status_code == 413


def test_rate_limited_per_session(client):
    body = ev("duky_save", {"kind": "ai", "garment_id": "ao-dai"})
    codes = [client.post("/events", json=body).status_code for _ in range(125)]
    assert codes.count(202) == 120 and codes[-1] == 429


def test_summary_numbers():
    a, b = str(uuid.uuid4()), str(uuid.uuid4())
    rows = [
        ev("occasion_selected", {"garment_id": "ao-dai", "occasion_id": "dam-cuoi", "fits": False}, a, "2026-10-01T10:00:00Z"),
        ev("occasion_selected", {"garment_id": "ao-dai", "occasion_id": "tet-chua", "fits": True}, a, "2026-10-01T10:01:00Z"),
        ev("occasion_selected", {"garment_id": "ao-dai", "occasion_id": "dam-cuoi", "fits": False}, b),
        ev("quiz_answer", {"phase": "pre", "item_id": "q1", "correct": False, "region_id": "hue"}, a),
        ev("quiz_answer", {"phase": "post", "item_id": "q1", "correct": True, "region_id": "hue"}, a),
        ev("compass_result", {"state": "distorted", "garment_id": "ao-dai", "occasion_id": "tet-chua"}, a),
        ev("look_fixed", {"from_state": "distorted", "to_state": "fit", "garment_id": "ao-dai"}, a),
        ev("compass_result", {"state": "review", "garment_id": "ao-dai", "occasion_id": "dam-cuoi"}, b),
    ]
    s = summarize(rows)
    assert s["occasion_adoption"] == {"picks": 2, "fits": 1, "rate": 0.5}
    assert s["quiz"] == {"sessions_with_both": 1, "pre_avg": 0.0, "post_avg": 1.0, "by_region": {"hue": {"sessions": 1, "pre_avg": 0.0, "post_avg": 1.0}}}
    assert s["looks_fixed"] == {"flagged": 2, "fixed": 1, "rate": 0.5}


def test_every_event_type_is_allowed_by_the_supabase_table():
    # the CHECK constraint in events.sql must list every type the API accepts, or Supabase refuses the insert (400)
    import re
    from pathlib import Path

    sql = (Path(__file__).parents[1] / "supabase" / "events.sql").read_text(encoding="utf-8")
    allowed = set(re.findall(r"'([a-z_]+)'", sql.split("check (type in", 1)[1].split(")", 1)[0]))
    assert set(events.TYPES) == allowed
    migration = (Path(__file__).parents[1] / "supabase" / "migrations" / "2026-10-05-wardrobe-events.sql").read_text(encoding="utf-8")
    assert all(f"'{t}'" in migration for t in events.TYPES)
