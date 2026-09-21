from functools import lru_cache

import httpx
from fastapi import HTTPException, status

from app.config import settings

_TIMEOUT = httpx.Timeout(15.0, connect=10.0)
_LIMITS = httpx.Limits(
    max_keepalive_connections=10,
    max_connections=20,
    keepalive_expiry=60.0,
)


@lru_cache
def _client() -> httpx.Client:
    return httpx.Client(timeout=_TIMEOUT, limits=_LIMITS)


def close_client() -> None:
    client = _client()
    _client.cache_clear()
    client.close()


def _headers() -> dict[str, str]:
    key = settings.supabase_service_role_key
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def rest_get(path_with_query: str) -> httpx.Response:
    url = f"{settings.supabase_url}/rest/v1/{path_with_query}"
    try:
        response = _client().get(url, headers=_headers())
        response.raise_for_status()
        return response
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not read database: {exc}",
        ) from exc


def rest_rpc(fn_name: str, payload: dict) -> object:
    url = f"{settings.supabase_url}/rest/v1/rpc/{fn_name}"
    try:
        response = _client().post(url, headers=_headers(), json=payload)
        response.raise_for_status()
        if not response.content:
            return {}
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not update database: {exc}",
        ) from exc
