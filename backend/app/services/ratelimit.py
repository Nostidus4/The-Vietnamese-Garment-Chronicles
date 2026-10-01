"""Tiny in-memory per-client limiter to protect the Gemini quota during the demo."""

import math
import time
from collections import defaultdict, deque

_hits: dict[str, deque[float]] = defaultdict(deque)


def allow(client_id: str, per_minute: int) -> bool:
    now = time.time()
    q = _hits[client_id]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= per_minute:
        return False
    q.append(now)
    return True


def retry_after(client_id: str) -> int:
    """Whole seconds until `client_id` gets a slot back (for the Retry-After header)."""
    q = _hits[client_id]
    return max(1, math.ceil(60 - (time.time() - q[0]))) if q else 1
