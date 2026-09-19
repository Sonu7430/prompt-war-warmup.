"""
Root Guardrails entry point for pipeline tests.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from app.security.prompt_defense import inspect_prompt


def sanitize_and_check(malicious_input: str) -> bool:
    """
    Evaluates input against prompt injection, jailbreaks, and token smuggling.
    Returns True if safe, False if containment triggered.
    """
    result = inspect_prompt(malicious_input)
    return result.is_safe
