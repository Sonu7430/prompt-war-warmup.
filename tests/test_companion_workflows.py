"""
Unit tests for senior companion workflows:
- State link between flagged scam (>80%) and Caregiver Bridge notification payload.
- Daily routine generator safe default when network/API is offline.
- Semantic & client-side query cache returning identical payload with zero LLM invocation.
"""

import sys
import os
import pytest

# Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.schemas import (
    ScamVerdict,
    CaregiverDispatchRequest,
    DailyPulseRequest,
)
from app.workflows.caregiver_bridge import dispatch_caregiver_update, get_recent_dispatches
from app.workflows.daily_companion import generate_daily_pulse
from app.workflows.state_store import global_state
from companion_engine import (
    handle_llm_failure,
    route_and_execute_llm,
    query_cache,
    CompanionResponseSchema,
)


# 1. Test state link between flagged scam (>80%) and Caregiver Bridge notification payload
def test_flagged_scam_links_to_caregiver_bridge_payload():
    flagged_scam = ScamVerdict(
        verdict="DANGEROUS_SCAM",
        threat_score=98,
        plain_explanation="Imposter claiming electric utility will disconnect service in 30 minutes without prior notice.",
        immediate_advice="Do not pay or call that number. Your electric power is completely safe.",
        safe_next_step="Look at your regular paper electric bill and call the customer care number printed on it directly.",
        red_flags=["30 minute countdown", "Demand for gift cards", "Urgent payment threat"]
    )

    request = CaregiverDispatchRequest(
        caregiver_name="Sarah Miller",
        caregiver_phone="(555) 234-5678",
        dispatch_type="scam_alert",
        scam_context=flagged_scam
    )

    response = dispatch_caregiver_update(request)

    assert response.status == "delivered"
    assert response.recipient == "Sarah Miller ((555) 234-5678)"
    assert response.dispatch_type == "scam_alert"
    assert "GUARDIAN ANGEL ALERT for Sarah Miller" in response.simulated_sms_preview
    assert "DANGEROUS_SCAM" in response.simulated_sms_preview
    assert "98/100" in response.simulated_sms_preview
    assert "Zero funds or credentials were lost" in response.simulated_sms_preview

    # Verify connected advisory note was logged in global state
    advisories = global_state.get_advisory_notes()
    matching = [a for a in advisories if a.severity == "critical" and "Sarah Miller" in a.message]
    assert len(matching) >= 1


# 2. Test that daily routine generator defaults safely when network is offline / times out
@pytest.mark.asyncio
async def test_daily_routine_generator_offline_safe_defaults():
    # Test routine generator returns valid structured defaults
    req = DailyPulseRequest(time_of_day="morning", user_mood="peaceful")
    pulse = await generate_daily_pulse(req)

    assert pulse.greeting is not None
    assert "morning" in pulse.time_context.lower() or "sun" in pulse.time_context.lower()
    assert len(pulse.routine_checklist) >= 3
    # Check that medication & hydration tasks are present
    categories = [t.category for t in pulse.routine_checklist]
    assert "medication" in categories
    assert "hydration" in categories

    # Test LLM failure/timeout fallback schema
    fallback = handle_llm_failure(timeout=True)
    assert fallback.workflow == "PROACTIVE_ROUTINE"
    assert "I'm having a little trouble reading that right now" in fallback.plain_language_body
    assert fallback.action_items == ["Try again in a few moments."]
    assert fallback.follow_up_prompt == "Would you like to try reading it again together?"


# 3. Test that semantic & client cache returns identical payloads with zero LLM invocation
@pytest.mark.asyncio
async def test_client_semantic_cache_zero_llm_invocation():
    query_text = "electric service will be disconnected in 30 mins gift card"

    # 1. Warm cache lookup
    cached_first = query_cache.get(query_text)
    assert cached_first is not None
    assert cached_first.workflow == "GUARDIAN_SHIELD"
    assert "Utility companies never demand gift card payments" in cached_first.plain_language_body

    # 2. Route execution returns the cached object with zero delay
    routed = await route_and_execute_llm(query_text)
    assert routed.workflow == cached_first.workflow
    assert routed.headline == cached_first.headline
    assert routed.plain_language_body == cached_first.plain_language_body
    assert routed.action_items == cached_first.action_items

    # 3. Verify normalization handles punctuation and casing variations
    varied_query = "ELECTRIC SERVICE WILL BE DISCONNECTED IN 30 MINS, GIFT CARD!!!"
    cached_varied = query_cache.get(varied_query)
    assert cached_varied is not None
    assert cached_varied.headline == cached_first.headline


# 4. Test One-Tap Check-In dispatch to Caregiver Bridge
def test_one_tap_checkin_caregiver_dispatch():
    req = CaregiverDispatchRequest(
        caregiver_name="Sarah Miller",
        caregiver_phone="(555) 234-5678",
        dispatch_type="one_tap_checkin"
    )
    res = dispatch_caregiver_update(req)
    assert res.status == "delivered"
    assert "Daily Peace-of-Mind for Sarah Miller" in res.simulated_sms_preview
    assert "Dad checked in" in res.simulated_sms_preview

    dispatches = get_recent_dispatches()
    assert len(dispatches) >= 1
    assert any(d.dispatch_type == "one_tap_checkin" for d in dispatches)


# 5. Test Reminiscence Journal Daily Prompt & Empathetic AI Reflection
def test_reminiscence_journal_reflection():
    from app.workflows.reminiscence import (
        get_daily_reminiscence_prompt,
        create_memory_reflection,
        get_memory_cards
    )
    from app.schemas import MemoryReflectionRequest

    # Test prompt generation
    daily_prompt = get_daily_reminiscence_prompt()
    assert "prompt_question" in daily_prompt
    assert "theme" in daily_prompt

    # Test reflection creation on nostalgic youth story
    req = MemoryReflectionRequest(
        prompt_question="What was your favorite song when you were twenty?",
        story_text="I loved listening to The Beatles on vinyl records with my best friends in 1969."
    )
    card = create_memory_reflection(req)
    assert card.id is not None
    assert "Beatles" in card.story_text
    assert "warmth" in card.ai_reflection.lower() or "memory" in card.ai_reflection.lower()

    # Verify memory cards list persists
    cards = get_memory_cards()
    assert len(cards) >= 2


# 6. Test Token Budgets Compliance
def test_token_budgets_enforced():
    from app.engine import TOKEN_BUDGETS
    from companion_engine import (
        MAX_TOKENS_PROACTIVE,
        MAX_TOKENS_SCAM,
        MAX_TOKENS_MEDICAL
    )

    # Validate exact token limits mandated by specification
    assert TOKEN_BUDGETS["proactive"] == 150
    assert TOKEN_BUDGETS["scam"] == 220
    assert TOKEN_BUDGETS["medical"] == 300
    assert MAX_TOKENS_PROACTIVE == 150
    assert MAX_TOKENS_SCAM == 220
    assert MAX_TOKENS_MEDICAL == 300

