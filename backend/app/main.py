"""
FastAPI Gateway for Senior-First GenAI Platform.
Features WCAG AAA friendly design, SSE streaming, PII scrubbing,
prompt injection defense, and 3 interconnected workflows.
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.schemas import (
    AnalyzeDocRequest,
    AnalyzeScamRequest,
    DailyPulseRequest,
    DailyPulse,
    SimplifiedDoc,
    ScamVerdict,
    SafetyCheckResult,
    WorkflowIntent,
    ChatRequest
)
from app.security.prompt_defense import inspect_prompt
from app.security.pii_guard import sanitize_pii
from app.router import route_intent
from app.engine import stream_tokens
from app.workflows.daily_companion import generate_daily_pulse
from app.workflows.medical_simplifier import simplify_medical_doc, pin_medical_action_to_daily_pulse
from app.workflows.scam_shield import analyze_scam_message, pin_scam_warning_to_daily_pulse
from app.workflows.state_store import global_state

app = FastAPI(
    title="Guardian Angel & Health Pulse Gateway",
    description="Elderly-First Accessible Generative AI Companion Platform",
    version="1.0.0"
)

# CORS configuration for local development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def senior_friendly_exception_handler(request: Request, exc: Exception):
    """Comforting fallback error boundary so seniors never see a cold 500 stack trace."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "elderly_fallback",
            "message": "I'm having a little trouble reading that right now; let's take a deep breath and try reading it together.",
            "safe_retry": True
        }
    )


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Guardian Angel & Health Pulse",
        "wcag_compliant": True,
        "security_shield_active": True
    }


@app.post("/api/security/check", response_model=SafetyCheckResult)
async def check_security(payload: dict):
    text = payload.get("text", "")
    return inspect_prompt(text)


@app.post("/api/router/classify", response_model=WorkflowIntent)
async def classify_intent(payload: dict):
    text = payload.get("text", "")
    return await route_intent(text)


# --- WORKFLOW 1: Proactive Daily Pulse ---

@app.post("/api/workflows/daily-pulse", response_model=DailyPulse)
async def get_daily_pulse(req: DailyPulseRequest):
    return await generate_daily_pulse(req)


@app.post("/api/workflows/daily-pulse/toggle-task/{task_id}")
async def toggle_task(task_id: str):
    completed = global_state.toggle_checklist_item(task_id)
    return {"task_id": task_id, "completed": completed, "checklist": global_state.get_checklist()}


# --- WORKFLOW 2: Medical Document Simplifier ---

@app.post("/api/workflows/medical-simplifier", response_model=SimplifiedDoc)
async def process_medical_doc(req: AnalyzeDocRequest):
    # Pass through security shield first
    security = inspect_prompt(req.document_text)
    if not security.is_safe:
        raise HTTPException(
            status_code=400,
            detail=f"Security Notice: Prompt contained restricted elements: {', '.join(security.flagged_reasons)}"
        )
    # Use PII-scrubbed text
    safe_req = AnalyzeDocRequest(document_text=security.sanitized_text, senior_name=req.senior_name)
    return await simplify_medical_doc(safe_req)


@app.post("/api/workflows/medical-simplifier/pin")
async def pin_medical_item(payload: dict):
    action_item = payload.get("action_item", "Take prescribed medication")
    title = payload.get("title", "Prescription Follow-Up")
    return pin_medical_action_to_daily_pulse(action_item, title)


# --- WORKFLOW 3: Guardian Angel Scam Shield ---

@app.post("/api/workflows/scam-shield", response_model=ScamVerdict)
async def process_scam_message(req: AnalyzeScamRequest):
    # Pass through security & PII shield
    security = inspect_prompt(req.message_text)
    safe_req = AnalyzeScamRequest(message_text=security.sanitized_text, source_type=req.source_type)
    return await analyze_scam_message(safe_req)


@app.post("/api/workflows/scam-shield/pin")
async def pin_scam_item(verdict: ScamVerdict):
    return pin_scam_warning_to_daily_pulse(verdict)


# --- SSE STREAMING COMPANION CHAT ---

@app.post("/api/workflows/stream-chat")
async def stream_chat(req: ChatRequest):
    """Server-Sent Events streaming chat for real-time progressive response (<1s initial token)."""
    # Defensive check
    safety = inspect_prompt(req.prompt)
    if not safety.is_safe:
        async def safety_stream():
            yield {"data": json.dumps({"token": "I want to make sure you stay safe! I cannot follow requests that attempt to override my care instructions or ask for personal passwords.", "done": True})}
        return EventSourceResponse(safety_stream())

    # Formulate conversational response
    lower = safety.sanitized_text.lower()
    if any(k in lower for k in ["hello", "hi", "good morning", "how are you"]):
        response_text = (
            "Hello there! It is wonderful to speak with you today. "
            "I am right here with you. Whether you want to review your morning routine, "
            "translate a tricky doctor's note into everyday English, or double-check a suspicious phone message, "
            "just tap a button or tell me what's on your mind."
        )
    elif any(k in lower for k in ["headache", "tired", "sleep", "pain"]):
        response_text = (
            "I hear you, and it is completely okay to feel tired. "
            "Please sit back in your favorite comfortable armchair, sip a glass of warm water, "
            "and take a quiet 15-minute rest. If your discomfort continues or feels unusually sharp, "
            "please give your doctor's clinic a gentle call."
        )
    elif any(k in lower for k in ["scam", "suspicious", "text", "email"]):
        response_text = (
            "You did the right thing by checking! Scammers try to rush people into quick decisions. "
            "Take a deep breath. You do not need to reply or send any money. "
            "You can paste the message into our Scam Shield tab and I will read it carefully with you."
        )
    else:
        response_text = (
            f"Thank you for sharing that with me. I am your everyday companion. "
            f"Remember, you are never alone—I am here to help you read complex documents, "
            f"spot tricky scams, and keep your daily routine smooth and happy."
        )

    async def event_generator():
        # Stream response token by token
        async for chunk in stream_tokens(response_text, chunk_size=3, delay_s=0.04):
            yield {"data": json.dumps({"token": chunk, "done": False})}
        yield {"data": json.dumps({"token": "", "done": True})}

    return EventSourceResponse(event_generator())


# --- WORKFLOW: FAMILY & CAREGIVER PEACE OF MIND DISPATCH BRIDGE ---
from app.schemas import CaregiverDispatchRequest, CaregiverDispatchResponse, MemoryReflectionRequest, MemoryCard
from app.workflows.caregiver_bridge import dispatch_caregiver_update, get_recent_dispatches
from app.workflows.reminiscence import get_daily_reminiscence_prompt, create_memory_reflection, get_memory_cards

@app.post("/api/caregiver/dispatch", response_model=CaregiverDispatchResponse)
async def dispatch_caregiver(req: CaregiverDispatchRequest):
    """Dispatches a simulated SMS/Webhook update to a family member or caregiver."""
    return dispatch_caregiver_update(req)


@app.get("/api/caregiver/dispatches", response_model=List[CaregiverDispatchResponse])
async def list_caregiver_dispatches():
    """Lists recent dispatch events sent to family members."""
    return get_recent_dispatches()


# --- WORKFLOW: GENTLE COGNITIVE STIMULATION & MEMORY JOURNAL ---

@app.get("/api/reminiscence/prompt")
async def get_reminiscence_prompt():
    """Fetches the rotating daily nostalgic prompt question."""
    return get_daily_reminiscence_prompt()


@app.post("/api/reminiscence/reflect", response_model=MemoryCard)
async def submit_reminiscence_story(req: MemoryReflectionRequest):
    """Processes spoken senior memory, generates warm AI reflection, and stores card."""
    # Sanitize input against prompt injection or malicious scripts
    security = inspect_prompt(req.story_text)
    safe_req = MemoryReflectionRequest(
        prompt_id=req.prompt_id,
        prompt_question=req.prompt_question,
        story_text=security.sanitized_text
    )
    return create_memory_reflection(safe_req)


@app.get("/api/reminiscence/entries", response_model=List[MemoryCard])
async def list_memory_cards():
    """Returns stored life story memory cards."""
    return get_memory_cards()


# --- NESTOR ENHANCED PROACTIVE ENGINE (DUAL-TIER ROUTING & STREAMING) ---
from companion_engine import call_streaming_llm, route_and_execute_llm, CompanionResponseSchema
from fastapi.responses import StreamingResponse

@app.post("/api/companion/stream")
async def companion_stream(payload: dict):
    """Sub-500ms TTFT SSE streaming endpoint using dual-tier routing and semantic caching."""
    user_input = payload.get("user_input", "")
    user_time = payload.get("user_time", "morning")
    async def event_generator():
        async for chunk in call_streaming_llm(user_input, user_time):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.post("/api/companion/nestor", response_model=CompanionResponseSchema)
async def companion_nestor(payload: dict):
    """Direct JSON endpoint returning structured CompanionResponseSchema."""
    user_input = payload.get("user_input", "")
    user_time = payload.get("user_time", "morning")
    return await route_and_execute_llm(user_input, user_time)



# Mount static production frontend build if present
import os
from fastapi.staticfiles import StaticFiles

frontend_dist = os.getenv("STATIC_DIR", "")
if not frontend_dist or not os.path.exists(frontend_dist):
    for candidate in [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist")),
        "/app/frontend/dist",
        "/app/dist",
    ]:
        if os.path.exists(candidate):
            frontend_dist = candidate
            break

if frontend_dist and os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

