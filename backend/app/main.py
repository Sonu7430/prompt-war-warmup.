"""
FastAPI Gateway for Senior-First GenAI Platform.
Features WCAG AAA friendly design, SSE streaming, PII scrubbing,
prompt injection defense, and 3 interconnected workflows.
"""

import json
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
