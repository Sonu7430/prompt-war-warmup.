"""
Root Companion Engine entry point for pipeline tests.
Delegates to backend/companion_engine.py safely without circular import.
"""

import sys
import os
import importlib.util

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

_backend_file = os.path.join(_backend_dir, "companion_engine.py")
_spec = importlib.util.spec_from_file_location("_backend_companion_engine_impl", _backend_file)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

CompanionResponseSchema = _mod.CompanionResponseSchema
handle_llm_failure = _mod.handle_llm_failure
route_and_execute_llm = _mod.route_and_execute_llm
call_streaming_llm = _mod.call_streaming_llm
query_cache = _mod.query_cache
MAX_TOKENS_PROACTIVE = getattr(_mod, "MAX_TOKENS_PROACTIVE", 150)
MAX_TOKENS_SCAM = getattr(_mod, "MAX_TOKENS_SCAM", 220)
MAX_TOKENS_MEDICAL = getattr(_mod, "MAX_TOKENS_MEDICAL", 300)

__all__ = [
    "CompanionResponseSchema",
    "handle_llm_failure",
    "route_and_execute_llm",
    "call_streaming_llm",
    "query_cache",
    "MAX_TOKENS_PROACTIVE",
    "MAX_TOKENS_SCAM",
    "MAX_TOKENS_MEDICAL",
]
