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
    payments,
    cards,
)

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)


def _warm_up() -> None:
    try:
        warm_jwks()
    except Exception as exc:  # noqa: BLE001 - warming must never be fatal
        logger.warning("JWKS warm-up failed; the first login pays for it: %s", exc)


@asynccontextmanager
async def lifespan(_app: FastAPI):
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
app.include_router(cards.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
