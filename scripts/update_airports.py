"""Refresh the local airport search index from OurAirports public domain data.

Usage: python scripts/update_airports.py [airports.csv countries.csv]
Without arguments, downloads the current CSV files from OurAirports.
"""

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path


SOURCE = "https://raw.githubusercontent.com/davidmegginson/ourairports-data/main"
OUTPUT = Path(__file__).resolve().parents[1] / "src/lib/airline/data/airports-index.json"
TYPE_RANK = {"large_airport": 0, "medium_airport": 1, "small_airport": 2,
             "seaplane_base": 3, "heliport": 4}


def read_rows(filename: str, local_path: str | None):
    if local_path:
        with open(local_path, encoding="utf-8-sig", newline="") as source:
            return list(csv.DictReader(source))
    with urllib.request.urlopen(f"{SOURCE}/{filename}") as response:
        return list(csv.DictReader(io.StringIO(response.read().decode("utf-8-sig"))))


def main():
    if len(sys.argv) not in (1, 3):
        raise SystemExit("Usage: python scripts/update_airports.py [airports.csv countries.csv]")
    airport_rows = read_rows("airports.csv", sys.argv[1] if len(sys.argv) == 3 else None)
    country_rows = read_rows("countries.csv", sys.argv[2] if len(sys.argv) == 3 else None)
    countries = {row["code"]: row["name"] for row in country_rows}

    by_code = {}
    for row in airport_rows:
        code = row["iata_code"].strip().upper()
        if not re.fullmatch(r"[A-Z]{3}", code) or row["type"] not in TYPE_RANK:
            continue
        if not row["name"].strip():
            continue
        country = countries.get(row["iso_country"], row["iso_country"] or "Unknown")
        city = row["municipality"].strip() or row["name"].strip()
        priority = (row["scheduled_service"] != "yes", TYPE_RANK[row["type"]], row["ident"])
        previous = by_code.get(code)
        if previous is None or priority < previous[0]:
            by_code[code] = (priority, [code, row["name"].strip(), city, country])

    airports = [item[1] for item in sorted(by_code.values(), key=lambda item: (item[0], item[1][0]))]
    OUTPUT.write_text(json.dumps(airports, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(airports)} airports to {OUTPUT}")


if __name__ == "__main__":
    main()

