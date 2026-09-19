import pytest
from unittest.mock import patch

# Mocked Offline / LLM Outage Fallback Verification
def test_network_outage_fallback_card():
    from companion_service import generate_companion_reply
    with patch("companion_service.call_llm_api", side_effect=TimeoutError("Connection timed out")):
        response = generate_companion_reply("Can you explain this notice?")
        assert response["fallback"] is True
        assert "trouble reaching the service" in response["plain_language_body"].lower()
        assert len(response["action_items"]) > 0

# Multi-Workflow Cross-Talk Verification
def test_scam_detection_triggers_caregiver_flag():
    from companion_service import process_scam_message
    scam_payload = "URGENT: Your power will be shut off in 15 mins. Send card details."
    result = process_scam_message(scam_payload)
    
    assert result["threat_score"] >= 80
    assert result["notify_caregiver"] is True
    assert "gift card" in result["plain_explanation"].lower() or "power" in result["plain_explanation"].lower()
