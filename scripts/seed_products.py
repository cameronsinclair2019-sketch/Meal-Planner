#!/usr/bin/env python3
"""One-time / weekly seed: load the TJ price CSV into Supabase `products`.

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment.
Does not touch package_size or category on existing rows, since those are
filled in by hand and this script has no source for them.
"""

import csv
import json
import os
import sys
import urllib.request

CSV_URL = "https://data.traderjoesprices.com/dump.csv"
CANONICAL_STORE = "701"


def fetch_latest_prices():
    latest = {}
    req = urllib.request.Request(CSV_URL, headers={"User-Agent": "curl/8.0"})
    with urllib.request.urlopen(req) as resp:
        reader = csv.DictReader(line.decode("utf-8") for line in resp)
        for row in reader:
            if row["store_code"] != CANONICAL_STORE:
                continue
            sku = row["sku"]
            ts = row["inserted_at"]
            existing = latest.get(sku)
            if existing is None or ts > existing["inserted_at"]:
                latest[sku] = row
    return latest


def upsert_batch(supabase_url, service_key, batch):
    url = f"{supabase_url}/rest/v1/products?on_conflict=sku"
    body = json.dumps(batch).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates")
    with urllib.request.urlopen(req) as resp:
        resp.read()


def main():
    supabase_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not service_key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching latest CSV, filtering to store {CANONICAL_STORE}...")
    latest = fetch_latest_prices()
    print(f"{len(latest)} products found")

    rows = [
        {
            "sku": sku,
            "name": row["item_title"],
            "price": row["retail_price"],
            "store_code": row["store_code"],
            "last_updated": row["inserted_at"],
        }
        for sku, row in latest.items()
    ]

    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        upsert_batch(supabase_url, service_key, batch)
        print(f"Upserted {i + len(batch)}/{len(rows)}")

    print("Done.")


if __name__ == "__main__":
    main()
