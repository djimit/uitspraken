
from app.engine.query_builder import SearchQuery, build_search_query


class TestQueryBuilder:
    def test_fulltext_query(self):
        q = build_search_query(SearchQuery(query="huurcontract", mode="fulltext"))
        assert "multi_match" in q["query"]
        assert q["query"]["multi_match"]["query"] == "huurcontract"

    def test_exact_query(self):
        q = build_search_query(SearchQuery(query="ontbinding", mode="exact"))
        assert "match_phrase" in q["query"]

    def test_fuzzy_query(self):
        q = build_search_query(SearchQuery(query="wanprestatie", mode="fuzzy"))
        assert q["query"]["multi_match"]["fuzziness"] == "AUTO"

    def test_wildcard_query(self):
        q = build_search_query(SearchQuery(query="huur", mode="wildcard"))
        assert "wildcard" in q["query"]
        assert "*huur*" in q["query"]["wildcard"]["title"]["value"]

    def test_operator_query(self):
        q = build_search_query(SearchQuery(query="A AND B", mode="operator"))
        assert "query_string" in q["query"]

    def test_paging(self):
        q = build_search_query(SearchQuery(query="test", page=3, size=25))
        assert q["from"] == 50
        assert q["size"] == 25

    def test_filters(self):
        q = build_search_query(
            SearchQuery(query="test", filters=[{"term": {"court": "RB"}}])
        )
        assert "bool" in q["query"]
        assert "filter" in q["query"]["bool"]

    def test_facets(self):
        q = build_search_query(
            SearchQuery(query="test", facets=["court", "legal_area"])
        )
        assert "aggs" in q
        assert "court" in q["aggs"]

    def test_sort(self):
        q = build_search_query(
            SearchQuery(query="test", sort=[{"decision_date": "desc"}])
        )
        assert q["sort"] == [{"decision_date": "desc"}]

    def test_highlight_always_present(self):
        q = build_search_query(SearchQuery(query="test"))
        assert "highlight" in q

    def test_match_all_when_no_query(self):
        q = build_search_query(SearchQuery(query=None))
        assert q["query"] == {"match_all": {}}
