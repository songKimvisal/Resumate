import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.supabase_jwt import warm_jwks
from app.config import settings
from app.services.supabase_rest import close_client
from app.routers import (
    me,
    ai_design,
    smart_rewrite,
    credits,
    job_analysis,
    pdfs,
    templates,
    analyses,
    payments
)

logger = logging.getLogger(__name__)


def _warm_up() -> None:
    """Pay the one-off network costs before a shopper does.

    The first authenticated request on a fresh process fetches Supabase's
    JWKS over the network. On Render's free tier the process is fresh every
    time the service has spun down, so that fetch lands on whichever request
    woke it - and when that request is POST /payments/khqr/create, the QR a
    shopper is waiting on is stuck behind it. Doing it at startup moves the
    cost onto the keep-awake ping, which nobody is watching.

    Best-effort by design: get_current_user still fetches the key set itself
    if this failed, so a slow or unreachable Supabase must not stop the app
    from serving.
    """
    try:
        warm_jwks()
    except Exception as exc:  # noqa: BLE001 - warming must never be fatal
        logger.warning("JWKS warm-up failed; the first login pays for it: %s", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # A daemon thread, so an unreachable Supabase delays no startup and the
    # port binds as fast as it did before.
    threading.Thread(target=_warm_up, name="warm-up", daemon=True).start()
    yield
    close_client()


app = FastAPI(title="Resumate API", lifespan=lifespan)

_LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


def _cors_origins() -> list[str]:
    configured = [
        part.strip().rstrip("/")
        for part in settings.frontend_origin.split(",")
        if part.strip()
    ]
    return list(dict.fromkeys([*configured, *_LOCAL_ORIGINS]))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me.router)
app.include_router(ai_design.router)
app.include_router(smart_rewrite.router)
app.include_router(credits.router)
app.include_router(pdfs.router)
app.include_router(templates.router)
app.include_router(analyses.router)
app.include_router(job_analysis.router)
app.include_router(payments.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
