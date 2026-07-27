from dataclasses import dataclass, field


@dataclass
class SearchQuery:
    query: str | None = None
    mode: str = "fulltext"
    filters: list[dict] = field(default_factory=list)
    sort: list[dict] = field(default_factory=list)
    facets: list[str] = field(default_factory=list)
    page: int = 1
    size: int = 20


def build_search_query(sq: SearchQuery) -> dict:
    q: dict = {"track_total_hits": True}

    if sq.query:
        match sq.mode:
            case "exact":
                q["query"] = {"match_phrase": {"_all": sq.query}}
            case "fulltext":
                q["query"] = {
                    "multi_match": {
                        "query": sq.query,
                        "fields": ["title^3", "body", "inhoudsindicatie^2"],
                    }
                }
            case "fuzzy":
                q["query"] = {
                    "multi_match": {
                        "query": sq.query,
                        "fields": ["title", "body"],
                        "fuzziness": "AUTO",
                    }
                }
            case "wildcard":
                q["query"] = {"wildcard": {"title": {"value": f"*{sq.query.lower()}*"}}}
            case "operator":
                q["query"] = {
                    "query_string": {"query": sq.query, "default_operator": "AND"}
                }
            case _:
                q["query"] = {
                    "multi_match": {"query": sq.query, "fields": ["title", "body"]}
                }
    else:
        q["query"] = {"match_all": {}}

    if sq.filters:
        q["query"] = {"bool": {"must": [q["query"]], "filter": sq.filters}}

    if sq.sort:
        q["sort"] = sq.sort

    if sq.facets:
        q["aggs"] = {f: {"terms": {"field": f, "size": 20}} for f in sq.facets}

    q["from"] = (sq.page - 1) * sq.size
    q["size"] = sq.size
    q["highlight"] = {"fields": {"body": {}, "title": {}}}

    return q
