import argparse
import json
import random
from datetime import date, timedelta

COURTS = [
    "Rechtbank Amsterdam",
    "Rechtbank Den Haag",
    "Rechtbank Rotterdam",
    "Gerechtshof Amsterdam",
    "Hoge Raad",
]
LEGAL_AREAS = ["Bestuursrecht", "Civiel recht", "Strafrecht"]
TITLES = [
    "Uitspraak inzake ontbinding huurcontract",
    "Vordering schadevergoeding verkeersongeval",
    "Bestuursrechtelijke bezwaarschrift belastingaanslag",
    "Eis tot betaling vorderingsrecht",
    "Strafzaak inzake verduiving",
]


def generate(n: int) -> list[dict]:
    random.seed(42)
    base = date(2020, 1, 1)
    docs = []
    for i in range(n):
        docs.append(
            {
                "ecli": f"ECLI:NL:RBAMS:{2020 + i // 10000:04d}:{i:06d}",
                "title": random.choice(TITLES),
                "body": (
                    f"Dit is een synthetische uitspraak voor testdoeleinden. Document {i}. "
                    f"Randnummer {random.randint(1, 50)}. "
                    f"Overweging: partijen worden gehoord. Beslissing: afgewezen."
                ),
                "inhoudsindicatie": f"Korte samenvatting van zaak {i}",
                "court": random.choice(COURTS),
                "legal_area": random.choice(LEGAL_AREAS),
                "decision_date": (base + timedelta(days=random.randint(0, 1500))).isoformat(),
                "source_system": "synthetic-seed",
            }
        )
    return docs


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", default="uitspraken-openbaar")
    parser.add_argument("--count", type=int, default=100)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()
    docs = generate(args.count)
    if args.output:
        with open(args.output, "w") as f:
            json.dump(docs, f, indent=2)
    else:
        print(json.dumps(docs, indent=2))
