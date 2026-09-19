"""
Root Companion Engine entry point for pipeline tests.
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "backend")))

from companion_engine import (
    CompanionResponseSchema,
    handle_llm_failure,
    route_and_execute_llm,
    call_streaming_llm,
    query_cache,
)

__all__ = [
    "CompanionResponseSchema",
    "handle_llm_failure",
    "route_and_execute_llm",
    "call_streaming_llm",
    "query_cache",
]
