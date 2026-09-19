"""Integration tests for the 3 connected workflows."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.workflows.state_store import global_state


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_daily_pulse_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"time_of_day": "morning", "user_mood": "cheerful", "fatigue_indicated": False, "missed_medication": False}
        resp = await client.post("/api/workflows/daily-pulse", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "greeting" in data
        assert "routine_checklist" in data
        assert len(data["routine_checklist"]) > 0


@pytest.mark.asyncio
async def test_medical_simplifier_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "document_text": "Stage 1 Essential Hypertension. Prescribed Amlodipine 5mg QD. Monitor sodium intake."
        }
        resp = await client.post("/api/workflows/medical-simplifier", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "analogy" in data
        assert "action_items" in data
        assert "questions_for_doctor" in data
        assert data["urgency_level"] in ["routine", "urgent", "emergency"]


@pytest.mark.asyncio
async def test_scam_shield_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "message_text": "URGENT: Your electricity service will be disconnected in 30 mins due to an unpaid bill of $142. Call immediately with a gift card."
        }
        resp = await client.post("/api/workflows/scam-shield", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["verdict"] == "DANGEROUS_SCAM"
        assert data["threat_score"] >= 80
        assert "gift card" in data["plain_explanation"].lower() or len(data["red_flags"]) > 0


@pytest.mark.asyncio
async def test_connected_workflow_pinning():
    """Verify pinning an item from Medical Simplifier updates the Daily Pulse checklist."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Pin an item
        pin_resp = await client.post("/api/workflows/medical-simplifier/pin", json={
            "action_item": "Schedule annual eye exam for reading glasses",
            "title": "Eye Care"
        })
        assert pin_resp.status_code == 200

        # Now fetch daily pulse and ensure it has the pinned item
        pulse_resp = await client.post("/api/workflows/daily-pulse", json={})
        assert pulse_resp.status_code == 200
        pulse_data = pulse_resp.json()
        checklist_titles = [item["title"] for item in pulse_data["routine_checklist"]]
        assert any("eye exam" in t.lower() for t in checklist_titles)
