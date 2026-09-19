"""
Guardrails security interface for defensive prompt injection checking and PII sanitization.
"""

from app.security.prompt_defense import inspect_prompt


def sanitize_and_check(malicious_input: str) -> bool:
    """
    Evaluates input against prompt injection, jailbreaks, and token smuggling.
    Returns True if safe, False if containment triggered.
    """
    result = inspect_prompt(malicious_input)
    return result.is_safe
