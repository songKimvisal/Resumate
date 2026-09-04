import httpx
from fastapi import HTTPException, status

from app.config import settings


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
        response = httpx.get(url, headers=_headers(), timeout=15)
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
        response = httpx.post(url, headers=_headers(), json=payload, timeout=15)
        response.raise_for_status()
        if not response.content:
            return {}
        return response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not update database: {exc}",
        ) from exc
