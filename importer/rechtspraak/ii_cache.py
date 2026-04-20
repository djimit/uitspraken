"""Pre-compute expensive inhoudsindicatie analysis results into a cache table.

This avoids 100+ second full-table LIKE scans at dashboard load time by running
them once during import and storing the JSON results.
"""

import json
import logging
import sqlite3
import re
from collections import Counter

logger = logging.getLogger(__name__)

# ── Patterns (must match the dashboard's queries.ts exactly) ──

OUTCOME_PATTERNS = [
    ("Veroordeling", r"veroordeeld|veroordeling|veroordeelt", "#dc2626"),
    ("Beroep ongegrond", r"beroep\s+ongegrond", "#ea580c"),
    ("Niet-ontvankelijk", r"niet.ontvankelijk", "#d97706"),
    ("Gevangenisstraf", r"gevangenisstraf", "#7c3aed"),
    ("Beroep gegrond", r"beroep\s+gegrond", "#16a34a"),
    ("Vrijspraak", r"vrijspraak|vrijgesproken", "#059669"),
    ("Bewaring/detentie", r"bewaring|detentie", "#be185d"),
    ("Schadevergoeding", r"schadevergoeding", "#0369a1"),
    ("Boete", r"geldboete|boete", "#ca8a04"),
    ("Voorlopige voorziening", r"voorlopige voorziening", "#6d28d9"),
    ("Taakstraf", r"taakstraf", "#0d9488"),
    ("Kort geding", r"kort geding", "#2563eb"),
    ("Hoger beroep", r"hoger beroep", "#4f46e5"),
    ("TBS", r"\btbs\b|terbeschikkingstelling", "#991b1b"),
    ("Ontslag", r"ontslag", "#65a30d"),
]

LAW_PATTERNS = [
    ("Burgerlijk Wetboek (BW)", r"\bBW\b"),
    ("Wetboek van Strafrecht (Sr)", r"\bSr\b|Wetboek van Strafrecht"),
    ("Wetboek van Strafvordering (Sv)", r"\bSv\b|Wetboek van Strafvordering"),
    ("Algemene wet bestuursrecht (Awb)", r"\bAwb\b"),
    ("Vreemdelingenwet (Vw)", r"\bVw\b|Vreemdelingenwet"),
    ("EVRM", r"\bEVRM\b"),
    ("Wet WOZ", r"\bWOZ\b|Wet WOZ|Wet waardering"),
    ("Opiumwet", r"Opiumwet"),
    ("Wegenverkeerswet (WVW)", r"\bWVW\b|Wegenverkeerswet"),
    ("Wet arbeidsongeschiktheid (WIA/WAO)", r"\bWIA\b|\bWAO\b"),
    ("Participatiewet", r"Participatiewet"),
    ("Wet maatschappelijke ondersteuning (Wmo)", r"\bWmo\b|\bWMO\b"),
    ("Faillissementswet (Fw)", r"\bFw\b|Faillissementswet"),
    ("Huurrecht (7:)", r"\b7:\d"),
    ("Arbeidsrecht (7:6)", r"\b7:6\d\d"),
    ("EU-recht", r"\bEU\b.*recht|Verdrag.*EU|VWEU|VEU"),
    ("Wet Bibob", r"Bibob"),
    ("Gemeentewet", r"Gemeentewet"),
]

STOPWORDS = {
    "de", "het", "een", "van", "in", "is", "op", "dat", "die", "en", "voor",
    "met", "zijn", "aan", "te", "niet", "als", "door", "om", "er", "was",
    "bij", "ook", "tot", "uit", "naar", "worden", "kan", "heeft", "wordt",
    "dan", "nog", "al", "maar", "of", "wel", "geen", "meer", "dit", "werd",
    "over", "zo", "hun", "haar", "na", "had", "hebben", "zij", "hij", "wat",
    "wie", "deze", "zich", "zal", "zou", "kunnen", "moeten", "mogen",
    "wij", "men", "ons", "onder", "ten", "tussen", "tegen", "indien",
    "reeds", "echter", "aldus", "zeer", "toch", "slechts", "waar", "daar",
    "hier", "alleen", "alle", "andere", "ander", "elk", "elke", "iedere",
    "ieder", "dezelfde", "zelfde", "nu", "want", "omdat", "dus", "toen",
    "hoe", "welke", "welk", "per", "dient", "waren", "zullen",
    "zonder", "artikel", "lid", "eerste", "tweede", "derde",
}


def rebuild_ii_cache(conn: sqlite3.Connection) -> None:
    """Rebuild all inhoudsindicatie analysis caches.

    This does a single pass through the inhoudsindicatie text,
    applying all regex patterns and collecting word/bigram frequencies.
    Result: ~3-5 seconds instead of ~110 seconds for the dashboard.
    """
    logger.info("Rebuilding inhoudsindicatie analysis cache...")

    # Single query: fetch ecli, court_name, inhoudsindicatie, body_text_length
    rows = conn.execute("""
        SELECT ecli, court_name, decision_type, decision_date,
               inhoudsindicatie, body_text_length,
               LENGTH(inhoudsindicatie) as ii_length
        FROM decisions
        WHERE fetch_status = 'fetched'
          AND inhoudsindicatie IS NOT NULL
          AND inhoudsindicatie != ''
    """).fetchall()

    # Pre-load legal areas mapping
    area_rows = conn.execute("""
        SELECT dla.ecli, dla.legal_area_name
        FROM decision_legal_areas dla
        JOIN decisions d ON d.ecli = dla.ecli
        WHERE d.fetch_status = 'fetched'
          AND d.inhoudsindicatie IS NOT NULL AND d.inhoudsindicatie != ''
    """).fetchall()
    ecli_areas = {}
    for ar in area_rows:
        ecli_areas.setdefault(ar["ecli"], []).append(ar["legal_area_name"])

    # Compile all regexes once
    outcome_res = [(label, re.compile(pat, re.IGNORECASE), color) for label, pat, color in OUTCOME_PATTERNS]
    law_res = [(label, re.compile(pat)) for label, pat in LAW_PATTERNS]

    # Accumulators
    outcome_counts = Counter()
    court_outcomes = {}  # court -> {gegrond, ongegrond, total}
    law_counts = Counter()
    word_freq = Counter()
    bigram_freq = Counter()

    # Compression ratio buckets
    comp_buckets = {}  # bucket_name -> {count, ii_sum, body_sum}

    # Coverage stats accumulators
    all_ii_lengths = []
    court_stats = {}     # court -> {total, with_ii, ii_sum}
    area_stats = {}      # area -> {total, with_ii, ii_sum}
    type_stats = {}      # type -> {total, with_ii, ii_sum}
    timeline_stats = {}  # YYYY-MM -> {total, with_ii}
    length_trend = {}    # YYYY-MM -> {ii_sum, count}
    length_buckets = Counter()  # bucket_name -> count

    # Beroep gegrond/ongegrond regexes for court outcomes
    re_gegrond = re.compile(r"beroep\s+gegrond", re.IGNORECASE)
    re_ongegrond = re.compile(r"beroep\s+ongegrond", re.IGNORECASE)

    # Sample for word freq (every Nth row to get ~5000)
    sample_step = max(1, len(rows) // 5000)

    for i, row in enumerate(rows):
        ii_text = row["inhoudsindicatie"]
        court = row["court_name"]
        body_len = row["body_text_length"] or 0
        ii_len = row["ii_length"] or 0
        dec_type = row["decision_type"]
        dec_date = row["decision_date"]
        ecli = row["ecli"]
        period = dec_date[:7] if dec_date and len(dec_date) >= 7 else None

        # ── Coverage stats ──
        all_ii_lengths.append(ii_len)

        if court:
            if court not in court_stats:
                court_stats[court] = {"total": 0, "with_ii": 0, "ii_sum": 0}
            court_stats[court]["total"] += 1
            court_stats[court]["with_ii"] += 1
            court_stats[court]["ii_sum"] += ii_len

        if dec_type:
            if dec_type not in type_stats:
                type_stats[dec_type] = {"total": 0, "with_ii": 0, "ii_sum": 0}
            type_stats[dec_type]["total"] += 1
            type_stats[dec_type]["with_ii"] += 1
            type_stats[dec_type]["ii_sum"] += ii_len

        for area in ecli_areas.get(ecli, []):
            if area not in area_stats:
                area_stats[area] = {"total": 0, "with_ii": 0, "ii_sum": 0}
            area_stats[area]["total"] += 1
            area_stats[area]["with_ii"] += 1
            area_stats[area]["ii_sum"] += ii_len

        if period:
            if period not in timeline_stats:
                timeline_stats[period] = {"total": 0, "with_ii": 0}
            timeline_stats[period]["total"] += 1
            timeline_stats[period]["with_ii"] += 1

            if period not in length_trend:
                length_trend[period] = {"ii_sum": 0, "count": 0}
            length_trend[period]["ii_sum"] += ii_len
            length_trend[period]["count"] += 1

        # Length distribution buckets
        if ii_len < 50:
            length_buckets["< 50 tekens"] += 1
        elif ii_len < 100:
            length_buckets["50 – 99"] += 1
        elif ii_len < 200:
            length_buckets["100 – 199"] += 1
        elif ii_len < 500:
            length_buckets["200 – 499"] += 1
        elif ii_len < 1000:
            length_buckets["500 – 999"] += 1
        elif ii_len < 2000:
            length_buckets["1.000 – 1.999"] += 1
        else:
            length_buckets["2.000+"] += 1

        # ── Outcomes: single pass over text ──
        for label, regex, color in outcome_res:
            if regex.search(ii_text):
                outcome_counts[label] += 1

        # ── Law references: single pass ──
        for label, regex in law_res:
            if regex.search(ii_text):
                law_counts[label] += 1

        # ── Court outcomes ──
        if court:
            if court not in court_outcomes:
                court_outcomes[court] = {"gegrond": 0, "ongegrond": 0, "total": 0}
            court_outcomes[court]["total"] += 1
            if re_gegrond.search(ii_text):
                court_outcomes[court]["gegrond"] += 1
            if re_ongegrond.search(ii_text):
                court_outcomes[court]["ongegrond"] += 1

        # ── Compression ratio ──
        if body_len > 0:
            if body_len < 5000:
                bucket = "Kort (< 5K)"
            elif body_len < 15000:
                bucket = "Middel (5–15K)"
            elif body_len < 40000:
                bucket = "Lang (15–40K)"
            else:
                bucket = "Zeer lang (40K+)"

            if bucket not in comp_buckets:
                comp_buckets[bucket] = {"count": 0, "ii_sum": 0, "body_sum": 0, "min_body": body_len}
            comp_buckets[bucket]["count"] += 1
            comp_buckets[bucket]["ii_sum"] += ii_len
            comp_buckets[bucket]["body_sum"] += body_len
            comp_buckets[bucket]["min_body"] = min(comp_buckets[bucket]["min_body"], body_len)

        # ── Word freq + bigrams (sampled) ──
        if i % sample_step == 0:
            words = re.sub(r"[^a-záàâäãéèêëíìîïóòôöõúùûüñç-]", " ", ii_text.lower()).split()
            words = [w for w in words if len(w) > 2 and w not in STOPWORDS]
            word_freq.update(words)
            for j in range(len(words) - 1):
                bigram_freq[f"{words[j]} {words[j+1]}"] += 1

    # ── Store results ──
    def _store(key: str, value):
        conn.execute(
            "INSERT OR REPLACE INTO _ii_analysis_cache (key, value, updated_at) VALUES (?, ?, datetime('now'))",
            (key, json.dumps(value, ensure_ascii=False)),
        )

    # Outcomes
    outcomes_list = [
        {"outcome": label, "count": outcome_counts.get(label, 0), "color": color}
        for label, _, color in OUTCOME_PATTERNS
        if outcome_counts.get(label, 0) > 0
    ]
    outcomes_list.sort(key=lambda x: x["count"], reverse=True)
    _store("outcomes", outcomes_list)

    # Court outcomes
    court_outcomes_list = [
        {
            "court_name": court,
            "gegrond": v["gegrond"],
            "ongegrond": v["ongegrond"],
            "total_with_outcome": v["gegrond"] + v["ongegrond"],
            "pct_gegrond": round(100 * v["gegrond"] / max(1, v["gegrond"] + v["ongegrond"])),
        }
        for court, v in court_outcomes.items()
        if v["gegrond"] + v["ongegrond"] >= 10
    ]
    court_outcomes_list.sort(key=lambda x: x["total_with_outcome"], reverse=True)
    _store("court_outcomes", court_outcomes_list)

    # Law references
    law_list = [
        {"law": label, "count": law_counts.get(label, 0)}
        for label, _ in LAW_PATTERNS
        if law_counts.get(label, 0) > 0
    ]
    law_list.sort(key=lambda x: x["count"], reverse=True)
    _store("law_references", law_list)

    # Word frequency (top 50)
    word_list = [{"word": w, "count": c} for w, c in word_freq.most_common(50)]
    _store("word_frequency", word_list)

    # Bigrams (top 30)
    bigram_list = [{"bigram": bg, "count": c} for bg, c in bigram_freq.most_common(30)]
    _store("bigram_frequency", bigram_list)

    # Compression ratio
    bucket_order = {"Kort (< 5K)": 0, "Middel (5–15K)": 1, "Lang (15–40K)": 2, "Zeer lang (40K+)": 3}
    comp_list = []
    for bucket, v in sorted(comp_buckets.items(), key=lambda x: bucket_order.get(x[0], 99)):
        avg_ii = v["ii_sum"] // max(1, v["count"])
        avg_body = v["body_sum"] // max(1, v["count"])
        ratio = round(100.0 * v["ii_sum"] / max(1, v["body_sum"]), 2)
        comp_list.append({
            "body_category": bucket,
            "count": v["count"],
            "avg_ii_length": avg_ii,
            "avg_body_length": avg_body,
            "ratio_pct": ratio,
        })
    _store("compression_ratio", comp_list)

    # ── Coverage stats ──
    all_ii_lengths.sort()
    total_with_ii = len(all_ii_lengths)
    total_decisions = conn.execute("SELECT COUNT(*) as c FROM decisions WHERE fetch_status = 'fetched'").fetchone()["c"]
    median_len = all_ii_lengths[total_with_ii // 2] if total_with_ii > 0 else 0

    _store("ii_stats", {
        "total_decisions": total_decisions,
        "with_inhoudsindicatie": total_with_ii,
        "without_inhoudsindicatie": total_decisions - total_with_ii,
        "coverage_pct": round(100.0 * total_with_ii / max(1, total_decisions), 1),
        "avg_length": sum(all_ii_lengths) // max(1, total_with_ii),
        "min_length": all_ii_lengths[0] if total_with_ii > 0 else 0,
        "max_length": all_ii_lengths[-1] if total_with_ii > 0 else 0,
        "median_length": median_len,
    })

    # By court
    by_court = [
        {"court_name": c, "total": v["total"], "with_ii": v["with_ii"],
         "pct": round(100.0 * v["with_ii"] / max(1, v["total"]), 1),
         "avg_length": v["ii_sum"] // max(1, v["with_ii"])}
        for c, v in court_stats.items()
    ]
    by_court.sort(key=lambda x: x["total"], reverse=True)
    _store("ii_by_court", by_court[:25])

    # By area
    by_area = [
        {"legal_area_name": a, "total": v["total"], "with_ii": v["with_ii"],
         "pct": round(100.0 * v["with_ii"] / max(1, v["total"]), 1),
         "avg_length": v["ii_sum"] // max(1, v["with_ii"])}
        for a, v in area_stats.items()
    ]
    by_area.sort(key=lambda x: x["total"], reverse=True)
    _store("ii_by_area", by_area[:20])

    # By type
    by_type = [
        {"decision_type": t, "total": v["total"], "with_ii": v["with_ii"],
         "pct": round(100.0 * v["with_ii"] / max(1, v["total"]), 1),
         "avg_length": v["ii_sum"] // max(1, v["with_ii"])}
        for t, v in type_stats.items()
    ]
    by_type.sort(key=lambda x: x["total"], reverse=True)
    _store("ii_by_type", by_type)

    # Timeline
    timeline_list = [
        {"period": p, "total": v["total"], "with_ii": v["with_ii"],
         "pct": round(100.0 * v["with_ii"] / max(1, v["total"]), 1)}
        for p, v in sorted(timeline_stats.items())
    ]
    _store("ii_timeline", timeline_list)

    # Length trend
    lt_list = [
        {"period": p, "avg_length": v["ii_sum"] // max(1, v["count"]), "count": v["count"]}
        for p, v in sorted(length_trend.items())
    ]
    _store("ii_length_trend", lt_list)

    # Length distribution
    bucket_order = ["< 50 tekens", "50 – 99", "100 – 199", "200 – 499", "500 – 999", "1.000 – 1.999", "2.000+"]
    ld_list = [
        {"bucket": b, "count": length_buckets.get(b, 0), "sort_key": i}
        for i, b in enumerate(bucket_order)
        if length_buckets.get(b, 0) > 0
    ]
    _store("ii_length_distribution", ld_list)

    # Examples (longest + shortest)
    longest = conn.execute("""
        SELECT ecli, court_name, decision_date, decision_type,
               inhoudsindicatie, LENGTH(inhoudsindicatie) as length
        FROM decisions WHERE fetch_status = 'fetched' AND inhoudsindicatie IS NOT NULL AND inhoudsindicatie != ''
        ORDER BY LENGTH(inhoudsindicatie) DESC LIMIT 10
    """).fetchall()
    _store("ii_examples_longest", [dict(r) for r in longest])

    shortest = conn.execute("""
        SELECT ecli, court_name, decision_date, decision_type,
               inhoudsindicatie, LENGTH(inhoudsindicatie) as length
        FROM decisions WHERE fetch_status = 'fetched' AND inhoudsindicatie IS NOT NULL AND inhoudsindicatie != ''
        ORDER BY LENGTH(inhoudsindicatie) ASC LIMIT 10
    """).fetchall()
    _store("ii_examples_shortest", [dict(r) for r in shortest])

    conn.commit()
    logger.info(f"II analysis cache rebuilt: {len(rows)} decisions analyzed")
