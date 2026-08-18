"""Backend tests for new features: snooze presets, auto-wake, batch approval, insights."""
import os
import pytest
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _load_env():
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            return line.split("=", 1)[1].strip()
    return None


BASE = (os.environ.get("REACT_APP_BACKEND_URL") or _load_env()).rstrip("/") + "/api"


def _new_sid():
    return requests.post(f"{BASE}/demo/session").json()["session_id"]


@pytest.fixture(scope="module")
def sid():
    return _new_sid()


def _get_opp(sid, opp_id):
    r = requests.get(f"{BASE}/demo/{sid}/opportunities/{opp_id}")
    assert r.status_code == 200
    data = r.json()
    return data.get("opportunity", data)


def _audit_events_for(sid, opp_id):
    r = requests.get(f"{BASE}/demo/{sid}/audit")
    return [a["event"] for a in r.json().get("audit", []) if a.get("opportunity_id") == opp_id]


class TestSnooze:
    def test_snooze_maya_1h(self, sid):
        until = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat().replace("+00:00", "Z")
        r = requests.post(f"{BASE}/demo/{sid}/opportunities/opp-maya/action",
                          json={"action": "snooze", "preset": "1h", "snoozed_until": until})
        assert r.status_code == 200, r.text
        opp = r.json()["opportunity"]
        assert opp["status"] == "Snoozed"
        assert opp["snoozed_until"] is not None

    def test_snoozed_excluded_from_approvals(self, sid):
        r = requests.get(f"{BASE}/demo/{sid}/approvals")
        assert r.status_code == 200
        queue = r.json()["queue"]
        ids = [o["id"] for o in queue]
        assert "opp-maya" not in ids

    def test_snoozed_category_filter(self, sid):
        r = requests.get(f"{BASE}/demo/{sid}/opportunities", params={"category": "snoozed"})
        assert r.status_code == 200
        ids = [o["id"] for o in r.json()["opportunities"]]
        assert "opp-maya" in ids

    def test_wake_now(self, sid):
        r = requests.post(f"{BASE}/demo/{sid}/opportunities/opp-maya/action",
                          json={"action": "wake_snooze"})
        assert r.status_code == 200
        opp = r.json()["opportunity"]
        assert opp["status"] == "Needs Approval"
        # audit contains Snoozed + Snooze Ended (via opp detail)
        opp_full = _get_opp(sid, "opp-maya")
        events = _audit_events_for(sid, "opp-maya")
        assert "Snoozed" in events
        assert "Snooze Ended" in events


class TestAutoWake:
    def test_auto_wake(self):
        sid = _new_sid()
        past = (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat().replace("+00:00", "Z")
        r = requests.post(f"{BASE}/demo/{sid}/opportunities/opp-maya/action",
                          json={"action": "snooze", "preset": "1h", "snoozed_until": past})
        assert r.status_code == 200
        # GET opportunities should auto-wake
        r = requests.get(f"{BASE}/demo/{sid}/opportunities")
        opps = r.json()["opportunities"]
        maya = next(o for o in opps if o["id"] == "opp-maya")
        assert maya["status"] != "Snoozed", f"expected auto-wake got {maya['status']}"
        # audit
        maya_full = _get_opp(sid, "opp-maya")
        events = _audit_events_for(sid, "opp-maya")
        assert "Snooze Ended" in events


class TestInsights:
    def test_insights_shape(self, sid):
        r = requests.get(f"{BASE}/demo/{sid}/insights")
        assert r.status_code == 200
        data = r.json()
        assert "rows" in data
        assert len(data["rows"]) == 3
        wf_ids = {row["workflow_id"] for row in data["rows"]}
        assert wf_ids == {"wf-lead-rescue", "wf-estimate-recovery", "wf-repeat-revenue"}
        for row in data["rows"]:
            for k in ["opportunities_surfaced", "approved_follow_ups", "simulated_bookings",
                      "pipeline_advanced", "recorded_results"]:
                assert k in row, f"missing {k} in {row}"
        assert data.get("recommendation")
        assert data.get("disclaimer")


class TestBatch:
    def test_batch_get_eligibility(self):
        sid = _new_sid()
        r = requests.get(f"{BASE}/demo/{sid}/batch/repeat-revenue")
        assert r.status_code == 200
        data = r.json()
        eligible = data["eligible"]
        eligible_ids = {e["id"] for e in eligible}
        assert "opp-maya" not in eligible_ids
        assert "opp-carlos" not in eligible_ids
        assert "opp-samuel" not in eligible_ids
        assert "opp-jordan" not in eligible_ids
        assert len(eligible) == 2, f"expected 2 eligible got {eligible_ids}"
        total = sum(e.get("expected_value", 0) for e in eligible)
        assert total == 548, f"expected $548 got ${total}"
        # Denise + Aisha
        assert eligible_ids == {"opp-denise", "opp-aisha"}, eligible_ids
        assert data.get("criteria")

    def test_batch_approve_flow(self):
        sid = _new_sid()
        r = requests.post(f"{BASE}/demo/{sid}/batch/repeat-revenue/approve")
        assert r.status_code == 200, r.text
        # After approval, eligible list empty
        r2 = requests.get(f"{BASE}/demo/{sid}/batch/repeat-revenue")
        assert len(r2.json()["eligible"]) == 0
        # Maya untouched
        maya = _get_opp(sid, "opp-maya")
        assert maya["status"] == "Needs Approval"
        # Denise Sent + audit contains Approved (Batch)
        denise = _get_opp(sid, "opp-denise")
        assert denise["status"] == "Sent", denise["status"]
        events = _audit_events_for(sid, "opp-denise")
        assert any("Approved" in e for e in events)
        assert "Sent" in events
