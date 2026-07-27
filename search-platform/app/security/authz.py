from dataclasses import dataclass

from jose import jwt


@dataclass
class AuthContext:
    sub: str
    roles: list[str]
    groups: list[str]
    raw_claims: dict


def decode_token(token: str, secret: str) -> AuthContext:
    claims = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    return AuthContext(
        sub=claims.get("sub", ""),
        roles=claims.get("roles", []),
        groups=claims.get("groups", []),
        raw_claims=claims,
    )


def build_dls_filter(auth: AuthContext, dls_field: str, dls_claim: str) -> dict | None:
    values = auth.raw_claims.get(dls_claim, [])
    if not values:
        return None
    return {"terms": {dls_field: values}}


def apply_fls_projection(
    auth: AuthContext, restricted_fields: list[str], allow_roles: list[str]
) -> list[str]:
    if any(r in allow_roles for r in auth.roles):
        return []
    return restricted_fields
