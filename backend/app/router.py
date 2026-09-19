"""
Semantic Router / Intent Agent.
Quickly classifies senior requests to route directly to the optimal workflow engine.
"""

from app.schemas import WorkflowIntent
from app.prompts import ROUTER_PROMPT
from app.engine import execute_prompt_with_fallback


async def route_intent(user_input: str) -> WorkflowIntent:
    """Classifies input into one of the three core workflows."""
    prompt = ROUTER_PROMPT.replace("{USER_INPUT}", user_input)
    data = await execute_prompt_with_fallback(
        prompt_type="router",
        raw_prompt=prompt,
        user_text=user_input
    )
    
    intent = data.get("intent", "daily_pulse")
    if intent not in ["daily_pulse", "medical_doc", "scam_shield", "general_companion"]:
        intent = "daily_pulse"
        
    return WorkflowIntent(
        intent=intent,
        confidence=float(data.get("confidence", 0.90))
    )
