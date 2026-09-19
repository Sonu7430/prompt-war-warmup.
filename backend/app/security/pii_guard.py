"""
Zero-PII Anonymization Layer.
Ensures sensitive elderly personal data (SSN, credit card, phone, email, accounts)
is stripped before processing or logging.
"""

import re
from typing import Tuple

# Regex patterns for high-risk PII
PATTERNS = {
    "SSN": re.compile(r"\b(?:\d{3}-\d{2}-\d{4}|\d{9})\b"),
    "CREDIT_CARD": re.compile(r"\b(?:\d{4}[- ]?){3}\d{4}\b"),
    "PHONE": re.compile(r"\b(?:\+?1[-. ]?)?(?:\(?\d{3}\)?[-. ]?)\d{3}[-. ]?\d{4}\b"),
    "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "BANK_ROUTING": re.compile(r"\b(?:routing|account)[\s#:]+(\d{8,17})\b", re.IGNORECASE),
}


def sanitize_pii(text: str) -> Tuple[str, int]:
    """
    Sanitizes raw user input by replacing sensitive PII with tokens.
    Returns the sanitized text and the total count of redacted entities.
    """
    if not text:
        return text, 0

    sanitized = text
    redaction_count = 0

    # Redact SSN
    sanitized, ssn_hits = PATTERNS["SSN"].subn("[REDACTED-SSN]", sanitized)
    redaction_count += ssn_hits

    # Redact Credit Cards
    sanitized, card_hits = PATTERNS["CREDIT_CARD"].subn("[REDACTED-CARD]", sanitized)
    redaction_count += card_hits

    # Redact Emails
    sanitized, email_hits = PATTERNS["EMAIL"].subn("[REDACTED-EMAIL]", sanitized)
    redaction_count += email_hits

    # Redact Phone Numbers
    sanitized, phone_hits = PATTERNS["PHONE"].subn("[REDACTED-PHONE]", sanitized)
    redaction_count += phone_hits

    # Redact Bank Routing / Account digits
    def redact_account(match):
        return match.group(0).replace(match.group(1), "[REDACTED-ACCOUNT]")

    sanitized, bank_hits = PATTERNS["BANK_ROUTING"].subn(redact_account, sanitized)
    redaction_count += bank_hits

    return sanitized, redaction_count


def safe_log_message(msg: str) -> str:
    """Safe logger ensuring no PII ever enters application stdout or logs."""
    sanitized, _ = sanitize_pii(msg)
    return sanitized
