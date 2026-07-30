import jwt

from app.security.authz import AuthContext, apply_fls_projection, build_dls_filter, decode_token
from app.security.masking import sanitize_query_for_log

SECRET = "test-secret"


def make_token(
    sub: str = "user1", roles: list[str] | None = None, groups: list[str] | None = None
) -> str:
    return jwt.encode(
        {"sub": sub, "roles": roles or [], "groups": groups or []},
        SECRET,
        algorithm="HS256",
    )


class TestDecodeToken:
    def test_decode_valid_token(self):
        token = make_token("user1", roles=["rechter"], groups=["group-a"])
        auth = decode_token(token, SECRET)
        assert auth.sub == "user1"
        assert "rechter" in auth.roles
        assert "group-a" in auth.groups


class TestDLSFilter:
    def test_build_dls_filter_with_groups(self):
        auth = AuthContext(
            sub="u", roles=[], groups=["g1", "g2"], raw_claims={"groups": ["g1", "g2"]}
        )
        f = build_dls_filter(auth, "authz_groups", "groups")
        assert f == {"terms": {"authz_groups": ["g1", "g2"]}}

    def test_build_dls_filter_no_groups(self):
        auth = AuthContext(sub="u", roles=[], groups=[], raw_claims={"groups": []})
        f = build_dls_filter(auth, "authz_groups", "groups")
        assert f is None


class TestFLSProjection:
    def test_restricted_fields_for_regular_user(self):
        auth = AuthContext(sub="u", roles=["user"], groups=[], raw_claims={})
        fields = apply_fls_projection(auth, ["bsn", "nawgegevens"], ["rechter", "jurist"])
        assert fields == ["bsn", "nawgegevens"]

    def test_no_restriction_for_authorized_role(self):
        auth = AuthContext(sub="u", roles=["rechter"], groups=[], raw_claims={})
        fields = apply_fls_projection(auth, ["bsn", "nawgegevens"], ["rechter", "jurist"])
        assert fields == []


class TestMasking:
    def test_mask_bsn(self):
        assert "[BSN-MASKED]" in sanitize_query_for_log("mijn bsn is 123456789")

    def test_mask_email(self):
        assert "[EMAIL-MASKED]" in sanitize_query_for_log("contact test@example.com")

    def test_no_pii_unchanged(self):
        assert sanitize_query_for_log("huurcontract ontbinding") == "huurcontract ontbinding"

    def test_none_query(self):
        assert sanitize_query_for_log(None) == ""
