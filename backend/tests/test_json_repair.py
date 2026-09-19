"""Unit tests for resilient JSON repair parser."""

import pytest
from app.engine import extract_and_repair_json


def test_clean_json_parsing():
    raw = '{"name": "Alice", "age": 75}'
    parsed = extract_and_repair_json(raw)
    assert parsed["name"] == "Alice"
    assert parsed["age"] == 75


def test_markdown_codeblock_removal():
    raw = '```json\n{"verdict": "SAFE", "threat_score": 10}\n```'
    parsed = extract_and_repair_json(raw)
    assert parsed["verdict"] == "SAFE"


def test_trailing_comma_repair():
    raw = '{"action_items": ["item1", "item2", ], "urgency": "routine", }'
    parsed = extract_and_repair_json(raw)
    assert len(parsed["action_items"]) == 2
    assert parsed["urgency"] == "routine"


def test_python_style_booleans():
    raw = '{"is_safe": True, "details": None, "flagged": False}'
    parsed = extract_and_repair_json(raw)
    assert parsed["is_safe"] is True
    assert parsed["details"] is None
    assert parsed["flagged"] is False
