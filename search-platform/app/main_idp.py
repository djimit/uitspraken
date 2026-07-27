import os
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI, Form
from jose import jwt

app = FastAPI(title="Mock IdP")
SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-in-production")


@app.post("/token")
async def token(sub: str = Form(...), roles: str = Form(""), groups: str = Form("")):
    claims = {
        "sub": sub,
        "iss": "http://mock-idp:8081",
        "aud": "search-platform",
        "iat": datetime.now(UTC),
        "exp": datetime.now(UTC) + timedelta(hours=1),
        "roles": [r.strip() for r in roles.split(",") if r.strip()],
        "groups": [g.strip() for g in groups.split(",") if g.strip()],
    }
    return {
        "access_token": jwt.encode(claims, SECRET, algorithm="HS256"),
        "token_type": "bearer",
    }


@app.get("/.well-known/jwks.json")
async def jwks():
    import base64

    key = base64.urlsafe_b64encode(SECRET.encode()).rstrip(b"=").decode()
    return {
        "keys": [
            {"kty": "oct", "k": key, "alg": "HS256", "use": "sig", "kid": "mock-key-1"}
        ]
    }
