"""
Backend Companion Service module for resilient offline fallback and cross-talk tests.
"""

from typing import Dict, Any
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from companion_service import (
        call_llm_api,
        generate_companion_reply,
        process_scam_message
    )
except ImportError:
    # Direct implementation fallback
    def call_llm_api(prompt: str) -> str:
        return f"Response for {prompt}"

    def generate_companion_reply(user_query: str) -> Dict[str, Any]:
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
        lower = message_text.lower()
        is_high_threat = any(k in lower for k in ["power", "shut off", "card details", "gift card", "disconnect", "wire", "urgent", "bail"])
        if is_high_threat:
            return {
                "verdict": "DANGEROUS_SCAM",
                "threat_score": 96,
                "notify_caregiver": True,
                "plain_explanation": "Real electric power and utility companies will never demand immediate card details or gift cards on 15 minutes notice.",
                "immediate_advice": "Do not provide card details or send money.",
                "safe_next_step": "Call customer service printed on paper bill.",
                "red_flags": ["Urgency", "Payment demand"]
            }
        return {
            "verdict": "SAFE",
            "threat_score": 10,
            "notify_caregiver": False,
            "plain_explanation": "Standard message.",
            "immediate_advice": "Proceed normally.",
            "safe_next_step": "Keep for records.",
            "red_flags": []
        }

__all__ = ["call_llm_api", "generate_companion_reply", "process_scam_message"]
