"""
Defensive AI Guardrail against prompt injection, jailbreaking, and system prompt exfiltration.
Protects vulnerable seniors and safeguards system instructions.
"""

import re
from typing import List
from app.schemas import SafetyCheckResult
from app.security.pii_guard import sanitize_pii

# High-risk adversarial injection signatures
INJECTION_SIGNATURES = [
    (r"(?i)\bignore\s+(all\s+)?(previous|prior|your|system|\s*)+\s*(instructions|directives|rules)\b", "Instruction override attack"),
    (r"(?i)\bdisregard\s+(all\s+)?(previous|system|prior|rules)\b", "Disregard system directives"),
    (r"(?i)\b(reveal|show|print|dump|leak|output)\s+(your\s+)?(system\s+prompt|instructions|initial\s+prompt)\b", "System prompt extraction"),
    (r"(?i)\b(dan\s+mode|jailbreak|developer\s+mode\s+enabled|unfiltered\s+mode)\b", "Persona jailbreak / DAN mode"),
    (r"(?i)<\s*/?\s*(system_instruction|system|few_shot_examples|assistant|user)\s*>", "XML delimiter injection / tag smuggling"),
    (r"(?i)\[\s*/?\s*(INST|SYS)\s*\]", "Llama/Mistral token smuggling"),
    (r"(?i)\b(act\s+as|pretend\s+you\s+are)\s+(an\s+evil|an\s+unrestricted|a\s+hacked)\b", "Adversarial roleplay"),
    (r"(?i)\bprescribe\s+(me\s+)?(\d+\s*mg\s+)?([a-zA-Z]+|medication|dosage|pills|narcotics|prescription)\b", "Unauthorized medical prescription attempt"),
    (r"(?i)\b(bypass|disable)\s+(safety|content\s+filters|security|guardrails)\b", "Filter bypass trigger"),
    (r"(?i)\b(bypass|steal|crack|hack|reveal)\s+.*?(password|passwords|credentials|pin)\b", "Credential/password bypass trigger"),
    (r"(?i)\b(sudo|eval|exec|import\s+os|system\(|chmod)\b", "Code execution payload in natural language"),
]


def inspect_prompt(raw_text: str) -> SafetyCheckResult:
    """
    Evaluates input text against known injection techniques,
    applies PII scrubbing, and returns a verified safety verdict.
    """
    flagged: List[str] = []
    
    # Check injection signatures
    for pattern, reason in INJECTION_SIGNATURES:
        if re.search(pattern, raw_text):
            flagged.append(reason)
            
    # Sanitize PII
    sanitized_text, pii_hits = sanitize_pii(raw_text)

    # Defuse raw delimiter tags to prevent breaking out of XML schemas
    sanitized_text = re.sub(r"<\s*/?\s*([a-zA-Z0-9_-]+)\s*>", r"[\1]", sanitized_text)

    is_safe = len(flagged) == 0
    return SafetyCheckResult(
        is_safe=is_safe,
        flagged_reasons=flagged,
        sanitized_text=sanitized_text,
        pii_redacted_count=pii_hits
    )
