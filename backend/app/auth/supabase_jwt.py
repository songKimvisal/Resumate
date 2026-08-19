"""
Verifies the Supabase-issued JWT sent by the frontend as:
    Authorization: Bearer <access_token>

This project's Supabase instance uses the newer *JWT Signing Keys* system
(asymmetric ECC/RSA keys), not the old shared HS256 secret. That means there
is no secret to copy into .env at all - instead, Supabase publishes its
current *public* key at a JWKS endpoint, and we verify the token's signature
against that. PyJWT's PyJWKClient fetches + caches that key set for us and
picks the right key by the token's `kid` header automatically, including
handling key rotation (e.g. when a "standby key" becomes current).
"""

from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

_bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _get_jwks_client() -> "jwt.PyJWKClient":
    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    return jwt.PyJWKClient(jwks_url, cache_keys=True)


class CurrentUser:
    def __init__(self, id: str, email: str | None):
        self.id = id
        self.email = email


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> CurrentUser:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    token = credentials.credentials
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
        )

    return CurrentUser(id=user_id, email=payload.get("email"))
