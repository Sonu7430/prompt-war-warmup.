"""
Workflow: Family & Caregiver Peace-of-Mind Dispatch Bridge.
Connects senior actions directly to family members via simulated SMS / Webhook.
"""

from datetime import datetime
from typing import List
from app.schemas import CaregiverDispatchRequest, CaregiverDispatchResponse
from app.workflows.state_store import global_state

# In-memory store for family dispatches
DISPATCH_HISTORY: List[CaregiverDispatchResponse] = []


def dispatch_caregiver_update(req: CaregiverDispatchRequest) -> CaregiverDispatchResponse:
    """Dispatches a simulated SMS/Webhook update to the caregiver."""
    now_str = datetime.now().strftime("%I:%M %p")

    if req.dispatch_type == "scam_alert" and req.scam_context:
        preview = (
            f"🚨 GUARDIAN ANGEL ALERT for {req.caregiver_name}: "
            f"Dad intercepted a dangerous threat ({req.scam_context.verdict}, Threat Rating: {req.scam_context.threat_score}/100). "
            f"Nestor guided: \"{req.scam_context.immediate_advice}\". Safe step: \"{req.scam_context.safe_next_step}\". "
            f"Zero funds or credentials were lost."
        )
        # Also log directly to Daily Pulse as an active security advisory
        global_state.add_advisory_note(
            source="scam",
            title="Family Guardian Alert Sent",
            message=f"Alert dispatched to {req.caregiver_name} ({req.caregiver_phone}) regarding intercepted message.",
            severity="critical"
        )
    elif req.dispatch_type == "med_confirmed":
        preview = (
            f"💚 Care Update for {req.caregiver_name}: "
            f"Dad has confirmed taking his scheduled morning medication with water at {now_str}. "
            f"Vitality checklist updated."
        )
    elif req.dispatch_type == "missed_routine":
        preview = (
            f"⏰ Routine Notice for {req.caregiver_name}: "
            f"Dad's morning check-in is pending. Nestor offered a gentle 30-minute snooze."
        )
    else:
        # One-Tap Check-In
        preview = (
            f"☀️ Daily Peace-of-Mind for {req.caregiver_name}: "
            f"Dad checked in at {now_str}! He completed his morning vitality routine and says hello. Everything is calm."
        )

    dispatch_id = f"disp-{len(DISPATCH_HISTORY) + 1}-{int(datetime.now().timestamp())}"
    record = CaregiverDispatchResponse(
        id=dispatch_id,
        status="delivered",
        timestamp=now_str,
        simulated_sms_preview=preview,
        recipient=f"{req.caregiver_name} ({req.caregiver_phone})",
        dispatch_type=req.dispatch_type
    )

    DISPATCH_HISTORY.insert(0, record)
    return record


def get_recent_dispatches() -> List[CaregiverDispatchResponse]:
    return DISPATCH_HISTORY
