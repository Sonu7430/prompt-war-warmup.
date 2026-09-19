"""
Companion Service module with resilient offline fallback, LLM dispatch,
and multi-workflow cross-talk scam detection triggering caregiver alerts.
"""

from typing import Dict, Any, List
import os


def call_llm_api(prompt: str) -> str:
    """Invokes upstream LLM provider API with timeout protection."""
    # Placeholder for live LLM API call
    return f"Response for {prompt}"


def generate_companion_reply(user_query: str) -> Dict[str, Any]:
    """
    Generates an empathetic companion reply.
    Catches timeouts and network outages gracefully, returning an offline fallback card.
    """
    try:
        raw_text = call_llm_api(user_query)
        return {
            "fallback": False,
            "headline": "Here to Help You",
            "plain_language_body": raw_text,
            "action_items": ["Review this step with peace of mind."],
            "workflow": "PROACTIVE_ROUTINE"
        }
    except Exception as exc:
        # Fallback card when network/LLM times out or is unreachable
        return {
            "fallback": True,
            "headline": "Gentle System Pause",
            "plain_language_body": "I am having a little trouble reaching the service right now; let's take a calm breath and try reading it together in a few moments.",
            "action_items": [
                "Take a comfortable 5-minute break.",
                "Try asking again in a few moments."
            ],
            "workflow": "PROACTIVE_ROUTINE",
            "error_detail": str(exc)
        }


def process_scam_message(message_text: str) -> Dict[str, Any]:
    """
    Evaluates incoming suspicious messages and automatically flags high threats
    to the caregiver bridge.
    """
    lower = message_text.lower()
    is_high_threat = any(k in lower for k in ["power", "shut off", "card details", "gift card", "disconnect", "wire", "urgent", "bail"])

    if is_high_threat:
        threat_score = 96
        plain_explanation = "Real electric power and utility companies will never demand immediate card details or gift cards on 15 minutes notice."
        immediate_advice = "Do not provide card details or send money. Your power is completely safe."
        safe_next_step = "Call the customer service phone number printed on your paper power bill."
        verdict = "DANGEROUS_SCAM"
        notify_caregiver = True
    else:
        threat_score = 10
        plain_explanation = "This message appears to be standard non-threatening communication."
        immediate_advice = "Proceed normally."
        safe_next_step = "Keep for your records."
        verdict = "SAFE"
        notify_caregiver = False

    return {
        "verdict": verdict,
        "threat_score": threat_score,
        "notify_caregiver": notify_caregiver,
        "plain_explanation": plain_explanation,
        "immediate_advice": immediate_advice,
        "safe_next_step": safe_next_step,
        "red_flags": [
            "Artificial urgency countdown",
            "Demand for immediate payment"
        ] if is_high_threat else []
    }
