from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
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

app = FastAPI(title="Resumate API")

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
