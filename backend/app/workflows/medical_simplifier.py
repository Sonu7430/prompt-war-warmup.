"""
Workflow 2: "Translate to Plain English" (Medical & Official Documents).
Translates lab reports, prescription slips, or notices into 5th-grade plain English,
utilizing analogical prompting and structured action points.
"""

from app.schemas import SimplifiedDoc, AnalyzeDocRequest
from app.prompts import MEDICAL_SIMPLIFIER_PROMPT
from app.engine import execute_prompt_with_fallback
from app.workflows.state_store import global_state


async def simplify_medical_doc(req: AnalyzeDocRequest) -> SimplifiedDoc:
    """Processes medical text, extracting analogies, simplified summaries, and doctor questions."""
    prompt = MEDICAL_SIMPLIFIER_PROMPT.replace("{DOCUMENT_TEXT}", req.document_text)

    data = await execute_prompt_with_fallback(
        prompt_type="medical",
        raw_prompt=prompt,
        user_text=req.document_text
    )

    doc = SimplifiedDoc(
        summary=data.get("summary", "Here is a simplified summary of your document in everyday language."),
        analogy=data.get("analogy", "Think of this like an oil check on your car to make sure everything runs smoothly."),
        action_items=data.get("action_items", [
            "Follow the instructions printed clearly on your medication label.",
            "Keep this summary page handy for your next clinic visit."
        ]),
        questions_for_doctor=data.get("questions_for_doctor", [
            "When should I get my next routine check-up?",
            "Are there any everyday activities or foods I should adjust?"
        ]),
        urgency_level=data.get("urgency_level", "routine")
    )
    return doc


def pin_medical_action_to_daily_pulse(action_item: str, title: str = "Doctor Follow-Up") -> dict:
    """Pins an extracted action item into the senior's Daily Pulse checklist & advisory log."""
    new_task = global_state.add_checklist_item(
        title=action_item,
        category="medication",
        time_str="Scheduled"
    )
    new_advisory = global_state.add_advisory_note(
        source="medical",
        title=f"Health Action: {title}",
        message=f"Added to routine: {action_item}",
        severity="info"
    )
    return {
        "status": "success",
        "task_id": new_task.id,
        "advisory_id": new_advisory.id,
        "message": "Pinned to your Daily Pulse and routine checklist!"
    }
