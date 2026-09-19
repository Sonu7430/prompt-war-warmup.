"""
Workflow 3: "Guardian Angel" Scam & Message Checker.
Analyzes SMS, email, or call transcripts for psychological manipulation,
urgency pressure, imposter indicators, and financial theft vectors.
"""

from app.schemas import ScamVerdict, AnalyzeScamRequest
from app.prompts import SCAM_SHIELD_PROMPT
from app.engine import execute_prompt_with_fallback
from app.workflows.state_store import global_state


async def analyze_scam_message(req: AnalyzeScamRequest) -> ScamVerdict:
    """Evaluates message threat, outputs calm guidance and safe next steps."""
    prompt = SCAM_SHIELD_PROMPT.replace("{MESSAGE_TEXT}", req.message_text)

    data = await execute_prompt_with_fallback(
        prompt_type="scam",
        raw_prompt=prompt,
        user_text=req.message_text
    )

    verdict_val = data.get("verdict", "SUSPICIOUS")
    if verdict_val not in ["SAFE", "SUSPICIOUS", "DANGEROUS_SCAM"]:
        verdict_val = "SUSPICIOUS"

    return ScamVerdict(
        verdict=verdict_val,
        threat_score=int(data.get("threat_score", 70)),
        plain_explanation=data.get(
            "plain_explanation",
            "This message looks unusual. Legitimate companies will never rush you or ask for sensitive codes."
        ),
        immediate_advice=data.get(
            "immediate_advice",
            "Do not click any links or reply to the message. You are safe."
        ),
        safe_next_step=data.get(
            "safe_next_step",
            "Call the official phone number listed on your previous paperwork or call a family member."
        ),
        red_flags=data.get("red_flags", ["Unverified sender", "Pressure to act immediately"])
    )


def pin_scam_warning_to_daily_pulse(verdict: ScamVerdict) -> dict:
    """Pins a scam advisory note into Workflow 1's Daily Pulse to keep the senior protected."""
    severity = "critical" if verdict.verdict == "DANGEROUS_SCAM" else "warning"
    note = global_state.add_advisory_note(
        source="scam",
        title=f"Security Shield: {verdict.verdict.replace('_', ' ').title()}",
        message=f"Reminder: {verdict.immediate_advice} Safe step: {verdict.safe_next_step}",
        severity=severity
    )
    return {
        "status": "success",
        "advisory_id": note.id,
        "message": "Security warning pinned to your Daily Companion view!"
    }
