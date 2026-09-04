import httpx
from google import genai
from google.genai import types

from app.config import settings

_gemini_client = genai.Client(api_key=settings.gemini_api_key)
GEMINI_MODEL = "gemini-3.5-flash-lite"


def generate_text(
    prompt: str,
    *,
    json_mode: bool = False,
    temperature: float = 0.5,
    max_output_tokens: int = 1500,
    thinking_budget: int | None = None,
) -> str:
    if settings.ai_provider == "ollama":
        return _generate_ollama(prompt, json_mode=json_mode, temperature=temperature)
    return _generate_gemini(
        prompt,
        json_mode=json_mode,
        temperature=temperature,
        max_output_tokens=max_output_tokens,
        thinking_budget=thinking_budget,
    )


def _generate_gemini(
    prompt: str,
    *,
    json_mode: bool,
    temperature: float,
    max_output_tokens: int,
    thinking_budget: int | None,
) -> str:
    config_kwargs: dict = {
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }
    if json_mode:
        config_kwargs["response_mime_type"] = "application/json"
    if thinking_budget is not None:
        config_kwargs["thinking_config"] = types.ThinkingConfig(
            thinking_budget=thinking_budget
        )

    response = _gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(**config_kwargs),
    )
    return response.text or ""


def _generate_ollama(prompt: str, *, json_mode: bool, temperature: float) -> str:
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if json_mode:
        payload["format"] = "json"

    resp = httpx.post(
        f"{settings.ollama_url}/api/generate", json=payload, timeout=120.0
    )
    resp.raise_for_status()
    return resp.json()["response"]
