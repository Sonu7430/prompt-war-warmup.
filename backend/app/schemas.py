"""
Pydantic schemas enforcing strict typing for the Senior-First Companion Platform.
Separation of concerns: UI <-> API Gateway <-> Agent Pipeline <-> LLM Engine.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field


# --- WORKFLOW 1: Proactive Daily Companion & Health Pulse ---

class ChecklistItem(BaseModel):
    id: str
    title: str
    time: str
    category: Literal["medication", "hydration", "activity", "wellness", "safety"]
    completed: bool = False


class AdvisoryNote(BaseModel):
    id: str
    source: Literal["medical", "scam", "system"]
    title: str
    message: str
    severity: Literal["info", "warning", "critical"] = "info"
    created_at: str


class DailyPulseRequest(BaseModel):
    time_of_day: Optional[Literal["morning", "afternoon", "evening", "night"]] = None
    user_mood: Optional[str] = "calm"
    fatigue_indicated: bool = False
    missed_medication: bool = False
    custom_note: Optional[str] = None


class DailyPulse(BaseModel):
    greeting: str = Field(description="Gentle, empowering greeting matching local time")
    time_context: str = Field(description="Friendly description of the current part of the day")
    gentle_reminder: str = Field(description="Supportive nudge if medication or rest is needed")
    routine_checklist: List[ChecklistItem] = Field(default_factory=list, description="Manageable daily tasks")
    wellbeing_tip: str = Field(description="A warm, bite-sized wellness or hydration tip")
    advisory_notes: List[AdvisoryNote] = Field(default_factory=list, description="Notes pinned from other workflows")


# --- WORKFLOW 2: Medical Document Simplifier ---

class AnalyzeDocRequest(BaseModel):
    document_text: str = Field(..., min_length=5, description="Raw text of medical/legal document")
    senior_name: Optional[str] = "Friend"


class SimplifiedDoc(BaseModel):
    summary: str = Field(..., description="High-level 5th-grade plain-language translation")
    analogy: str = Field(..., description="Concrete real-world metaphor (e.g. garden hose for blood pressure)")
    action_items: List[str] = Field(default_factory=list, description="Clear, immediate steps to take")
    questions_for_doctor: List[str] = Field(default_factory=list, description="Questions for their next visit")
    urgency_level: Literal["routine", "urgent", "emergency"] = Field(
        default="routine",
        description="Clinical urgency classification"
    )


# --- WORKFLOW 3: Guardian Angel Scam & Phishing Shield ---

class AnalyzeScamRequest(BaseModel):
    message_text: str = Field(..., min_length=5, description="Suspicious text, email, or call transcript")
    source_type: Optional[Literal["SMS", "Email", "Voicemail", "Phone", "Letter", "Unknown"]] = "SMS"


class ScamVerdict(BaseModel):
    verdict: Literal["SAFE", "SUSPICIOUS", "DANGEROUS_SCAM"] = Field(
        ..., description="Binary/categorical threat classification"
    )
    threat_score: int = Field(
        ..., ge=0, le=100, description="Confidence score from 0 (harmless) to 100 (critical scam)"
    )
    plain_explanation: str = Field(
        ..., description="Calm explanation of the warning signs without inducing panic"
    )
    immediate_advice: str = Field(
        ..., description="Direct, non-confusing action to protect themselves right now"
    )
    safe_next_step: str = Field(
        ..., description="Empowering next step (e.g. calling family or official number)"
    )
    red_flags: List[str] = Field(
        default_factory=list, description="Key red flag indicators found in message"
    )


# --- SECURITY & GUARDRAILS ---

class SafetyCheckResult(BaseModel):
    is_safe: bool
    flagged_reasons: List[str] = Field(default_factory=list)
    sanitized_text: str
    pii_redacted_count: int = 0


# --- UNIFIED CHAT / ROUTER ---

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    history: List[ChatMessage] = Field(default_factory=list)
    stream: bool = True


class WorkflowIntent(BaseModel):
    intent: Literal["daily_pulse", "medical_doc", "scam_shield", "general_companion"]
    confidence: float = 0.90


# --- FAMILY & CAREGIVER DISPATCH BRIDGE ---

class CaregiverDispatchRequest(BaseModel):
    caregiver_name: str = "Sarah"
    caregiver_phone: str = "(555) 234-5678"
    dispatch_type: Literal["one_tap_checkin", "med_confirmed", "scam_alert", "missed_routine"]
    custom_note: Optional[str] = None
    scam_context: Optional[ScamVerdict] = None


class CaregiverDispatchResponse(BaseModel):
    id: str
    status: Literal["dispatched", "delivered"]
    timestamp: str
    simulated_sms_preview: str
    recipient: str
    dispatch_type: str


# --- GENTLE COGNITIVE STIMULATION & MEMORY JOURNAL ---

class MemoryReflectionRequest(BaseModel):
    prompt_id: Optional[str] = "prompt-1"
    prompt_question: str
    story_text: str = Field(..., min_length=2)


class MemoryCard(BaseModel):
    id: str
    prompt_question: str
    story_text: str
    ai_reflection: str
    timestamp: str
    era_tag: Optional[str] = "Life Story"


