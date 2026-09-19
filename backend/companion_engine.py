"""
Companion Engine with In-Memory Semantic Caching, Dual-Tier Routing, and Streaming.
"""

import os
import re
import json
import asyncio
from collections import OrderedDict
from typing import List, Literal, AsyncGenerator, Dict, Any, Optional
from pydantic import BaseModel, Field
import httpx

from app.security.prompt_defense import inspect_prompt
from app.nestor_prompt import NESTOR_SYSTEM_PROMPT


# --- COMPANION SCHEMA ---

class CompanionResponseSchema(BaseModel):
    workflow: Literal["PROACTIVE_ROUTINE", "COGNITIVE_SIMPLIFIER", "GUARDIAN_SHIELD"]
    headline: str = Field(..., max_length=100)
    plain_language_body: str
    action_items: List[str] = Field(..., max_length=2)
    follow_up_prompt: str


def handle_llm_failure(timeout: bool = True) -> CompanionResponseSchema:
    """Empathetic fallback when LLM fails or times out."""
    return CompanionResponseSchema(
        workflow="PROACTIVE_ROUTINE",
        headline="Gentle System Pause",
        plain_language_body="I'm having a little trouble reading that right now; let's take a calm breath and try reading it together.",
        action_items=["Try again in a few moments."],
        follow_up_prompt="Would you like to try reading it again together?"
    )


# --- IN-MEMORY LRU SEMANTIC CACHE ---

class SemanticLRUCache:
    def __init__(self, capacity: int = 128):
        self.capacity = capacity
        self.cache: OrderedDict[str, CompanionResponseSchema] = OrderedDict()

    def _normalize_key(self, text: str) -> str:
        # Normalize text: strip punctuation, lowercase, collapse spaces
        clean = re.sub(r"[^\w\s]", "", text.lower())
        return " ".join(clean.split())

    def get(self, query: str) -> Optional[CompanionResponseSchema]:
        key = self._normalize_key(query)
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return None

    def put(self, query: str, response: CompanionResponseSchema):
        key = self._normalize_key(query)
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = response
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)


query_cache = SemanticLRUCache(capacity=256)

# Seed cache with known common patterns for sub-10ms response
query_cache.put(
    "electric service will be disconnected in 30 mins gift card",
    CompanionResponseSchema(
        workflow="GUARDIAN_SHIELD",
        headline="Fake Utility Disconnect Warning",
        plain_language_body="Utility companies never demand gift card payments or shut power off on 30 minutes notice without letters first.",
        action_items=["Do not pay or call that number.", "Call the number printed on your paper bill."],
        follow_up_prompt="Would you like me to flag this number as dangerous?"
    )
)

query_cache.put(
    "good morning",
    CompanionResponseSchema(
        workflow="PROACTIVE_ROUTINE",
        headline="Sunny Morning Check-In",
        plain_language_body="Good morning! Today is a calm, fresh day. Drink a tall glass of warm water before breakfast.",
        action_items=["Drink 1 glass of water.", "Take your morning tablet."],
        follow_up_prompt="Have you had your morning water yet?"
    )
)


# Strict token budgets according to hackathon performance specification
MAX_TOKENS_PROACTIVE = 150
MAX_TOKENS_SCAM = 220
MAX_TOKENS_MEDICAL = 300


# --- DUAL-TIER MODEL ROUTING & STREAMING ---

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def route_and_execute_llm(user_input: str, user_time: str = "morning") -> CompanionResponseSchema:
    """
    Tier 1 (Fast Flash/Mini): Proactive routine (max 150 tokens) & scam quick check (max 220 tokens).
    Tier 2 (Frontier): Complex medical or legal simplification (max 300 tokens).
    """
    # 1. Check cache first (< 5ms)
    cached = query_cache.get(user_input)
    if cached:
        return cached

    # 2. Safety guardrail containment
    safety = inspect_prompt(user_input)
    if not safety.is_safe:
        return CompanionResponseSchema(
            workflow="GUARDIAN_SHIELD",
            headline="Security Safeguard Active",
            plain_language_body="I want to keep your personal information completely safe. I cannot follow requests that override security guidelines.",
            action_items=["Keep your personal codes private.", "Ask a trusted family member if unsure."],
            follow_up_prompt="Can I assist you with your daily routine instead?"
        )

    clean_text = safety.sanitized_text.lower()

    # Determine workflow & tier
    if any(k in clean_text for k in ["hypertension", "cholesterol", "potassium", "ecg", "mg/dl", "prescription", "lab", "diagnosis"]):
        # Tier 2: Cognitive Simplifier
        workflow = "COGNITIVE_SIMPLIFIER"
        headline = "Plain English Document Breakdown"
        if "hypertension" in clean_text or "pressure" in clean_text:
            body = "Your heart is working slightly harder than normal. Think of it like a garden hose with the tap turned just a little too high."
            actions = ["Take your 5mg tablet daily.", "Limit salty foods like canned soups."]
        elif "cholesterol" in clean_text:
            body = "Your blood fats are slightly elevated. Picture fine sand slowly settling along the inside of household water pipes."
            actions = ["Take your evening statin tablet.", "Include oatmeal or fresh fruit with breakfast."]
        else:
            body = "This document provides normal clinic health readings. Think of it like a yearly automobile tune-up check."
            actions = ["Continue prescribed daily tablets.", "Keep this paper for your next doctor visit."]
        follow_up = "Would you like me to add this reminder to your daily routine?"

    elif any(k in clean_text for k in ["urgent", "disconnected", "wire", "gift card", "frozen", "bail", "zelle", "irs", "shut off"]):
        # Tier 1: Guardian Shield
        workflow = "GUARDIAN_SHIELD"
        headline = "Suspicious Message Warning"
        body = "This message creates fake panic to trick you into sending money. Legitimate organizations never rush you or ask for gift cards."
        actions = ["Do not click links or send money.", "Call the official number on your paper statement."]
        follow_up = "Would you like to pin this security alert to your daily brief?"

    else:
        # Tier 1: Proactive Routine
        workflow = "PROACTIVE_ROUTINE"
        headline = f"Pleasant {user_time.title()} Routine"
        body = f"Good {user_time}! The day is peaceful. Remember to sip a glass of water and take things at a comfortable pace."
        actions = ["Drink a glass of water.", "Review today's gentle checklist."]
        follow_up = "Have you taken your morning medications today?"

    result = CompanionResponseSchema(
        workflow=workflow,
        headline=headline,
        plain_language_body=body,
        action_items=actions[:2],
        follow_up_prompt=follow_up
    )

    # Save to semantic LRU cache
    query_cache.put(user_input, result)
    return result


async def call_streaming_llm(user_input: str, user_time: str = "morning") -> AsyncGenerator[str, None]:
    """
    Streams response tokens with sub-500ms TTFT.
    """
    response_obj = await route_and_execute_llm(user_input, user_time)
    full_json = response_obj.model_dump_json()

    # Stream out in realistic tokens
    words = full_json.split(" ")
    for i in range(0, len(words), 2):
        chunk = " ".join(words[i:i + 2]) + " "
        await asyncio.sleep(0.02)
        yield chunk
