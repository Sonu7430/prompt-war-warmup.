"""Unit tests for Pydantic v2 schemas and strict typing."""

import pytest
from pydantic import ValidationError
from app.schemas import SimplifiedDoc, ScamVerdict, DailyPulse, ChecklistItem, AdvisoryNote


def test_simplified_doc_schema_valid():
    doc = SimplifiedDoc(
        summary="Blood pressure is slightly high.",
        analogy="Like a garden hose turned up high.",
        action_items=["Take 5mg tablet daily"],
        questions_for_doctor=["When should I check next?"],
        urgency_level="routine"
    )
    assert doc.urgency_level == "routine"
    assert len(doc.action_items) == 1


def test_simplified_doc_schema_invalid_urgency():
    with pytest.raises(ValidationError):
        SimplifiedDoc(
            summary="test",
            analogy="test",
            action_items=[],
            questions_for_doctor=[],
            urgency_level="invalid_urgency_level"  # type: ignore
        )


def test_scam_verdict_schema_valid():
    verdict = ScamVerdict(
        verdict="DANGEROUS_SCAM",
        threat_score=98,
        plain_explanation="Gift cards are never used by utility companies.",
        immediate_advice="Do not pay or call back.",
        safe_next_step="Call the real utility phone number on your bill.",
        red_flags=["Gift card payment", "30-minute shut-off threat"]
    )
    assert verdict.threat_score == 98
    assert verdict.verdict == "DANGEROUS_SCAM"


def test_scam_verdict_threat_score_bounds():
    with pytest.raises(ValidationError):
        ScamVerdict(
            verdict="SAFE",
            threat_score=150,  # exceeds 100
            plain_explanation="test",
            immediate_advice="test",
            safe_next_step="test"
        )


def test_daily_pulse_schema_valid():
    pulse = DailyPulse(
        greeting="Good morning!",
        time_context="It is morning.",
        gentle_reminder="Take your water.",
        routine_checklist=[
            ChecklistItem(id="1", title="Water", time="9 AM", category="hydration", completed=False)
        ],
        wellbeing_tip="Enjoy the sun.",
        advisory_notes=[
            AdvisoryNote(id="1", source="system", title="Info", message="Welcome", created_at="10:00 AM")
        ]
    )
    assert len(pulse.routine_checklist) == 1
    assert len(pulse.advisory_notes) == 1
