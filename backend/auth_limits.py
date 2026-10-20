"""Small per-process abuse guard; production proxy limits can supplement it."""
import hashlib
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_attempts = defaultdict(deque)
_lock = threading.Lock()
WINDOW = 60


def check_limit(key, maximum, now=None):
    now = time.monotonic() if now is None else now
    with _lock:
        # Remove expired keys so arbitrary submitted addresses cannot grow memory forever.
        for stale in [k for k, values in _attempts.items() if not values or values[-1] <= now - WINDOW]:
            del _attempts[stale]
        values = _attempts[key]
        while values and values[0] <= now - WINDOW:
            values.popleft()
        if len(values) >= maximum:
            retry = max(1, int(WINDOW - (now - values[0])) + 1)
            raise HTTPException(429, "Pārāk daudz mēģinājumu. Lūdzu, uzgaidi minūti un mēģini vēlreiz.", headers={"Retry-After": str(retry)})
        values.append(now)


async def limit_auth(request: Request):
    ip = request.client.host if request.client else "unknown"
    # Do not trust X-Forwarded-For supplied by a client.
    check_limit(("ip", ip), 30)
    try:
        body = await request.json()
        email = str(body.get("email", "")).strip().casefold() if isinstance(body, dict) else ""
    except ValueError:
        email = ""
    digest = hashlib.sha256(email.encode()).hexdigest()
    maximum = 8 if request.url.path == "/login" else 5
    check_limit((request.url.path, ip, digest), maximum)
