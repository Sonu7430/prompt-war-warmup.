"""
Workflow 1: Proactive Daily Companion & Health Pulse.
Generates a calm, bite-sized conversational check-in based on time-of-day,
user mood, and fatigue/medication status, connected with dynamic checklist tasks.
"""

from datetime import datetime
from app.schemas import DailyPulse, DailyPulseRequest
from app.prompts import DAILY_PULSE_PROMPT
from app.engine import execute_prompt_with_fallback
from app.workflows.state_store import global_state


def get_current_time_period() -> str:
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


async def generate_daily_pulse(req: DailyPulseRequest) -> DailyPulse:
    """Produces the proactive health pulse and merges live checklists and advisories."""
    time_period = req.time_of_day or get_current_time_period()
    
    prompt = (
        DAILY_PULSE_PROMPT
        .replace("{TIME_OF_DAY}", time_period)
        .replace("{USER_MOOD}", req.user_mood or "calm")
        .replace("{FATIGUE_FLAG}", str(req.fatigue_indicated))
        .replace("{MISSED_MED_FLAG}", str(req.missed_medication))
        .replace("{CUSTOM_NOTE}", req.custom_note or "None")
    )

    data = await execute_prompt_with_fallback(
        prompt_type="daily_pulse",
        raw_prompt=prompt,
        user_text=f"Time: {time_period}, Fatigue: {req.fatigue_indicated}, Missed: {req.missed_medication}"
    )

    # Blend with dynamic state store
    current_checklist = global_state.get_checklist()
    current_advisories = global_state.get_advisories()

    # Dynamic gentle reminder if fatigue or missed medication
    gentle_reminder = data.get("gentle_reminder", "Stay hydrated and take gentle steps today.")
    if req.fatigue_indicated:
        gentle_reminder = "You mentioned feeling a bit tired. Please take a comforting 20-minute rest on your recliner and keep a water cup near you."
    elif req.missed_medication:
        gentle_reminder = "It looks like a dose may have been delayed. Let's take a calm breath, check the bottle label, and take your scheduled dose with water."

    return DailyPulse(
        greeting=data.get("greeting", f"Good {time_period}! Wishing you a serene and healthy day."),
        time_context=data.get("time_context", f"It is currently {time_period}."),
        gentle_reminder=gentle_reminder,
        routine_checklist=current_checklist,
        wellbeing_tip=data.get("wellbeing_tip", "A glass of cool water and 5 deep, slow breaths can refresh your entire morning."),
        advisory_notes=current_advisories
    )
