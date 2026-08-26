from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import me, ai_design, smart_rewrite, credits

app = FastAPI(title="Resumate API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me.router)
app.include_router(ai_design.router)
app.include_router(smart_rewrite.router)
app.include_router(credits.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
