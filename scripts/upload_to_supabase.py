#!/usr/bin/env python3
"""
Upload downloaded Quran data JSON files to Supabase tables.

Usage:
  python3 scripts/upload_to_supabase.py

Requires SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
Uses service role key (not anon key) for write access.
"""

import json
import os
import sys
import urllib.request
import urllib.error

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# Dataset → table mapping
DATASETS = {
    "tajweed_aya.json": {
        "table": "quran_tajweed_aya",
        "columns": ["sura_number", "sura_name", "aya_number", "aya_text", "content"]
    },
    "eerab_aya.json": {
        "table": "quran_eerab_aya",
        "columns": ["sura_number", "sura_name", "aya_number", "aya_text", "content"]
    },
    "eerab_word.json": {
        "table": "quran_eerab_word",
        "columns": ["sura_number", "sura_name", "aya_number", "word_number", "word", "content"]
    },
    "word_tasreef.json": {
        "table": "quran_word_tasreef",
        "columns": ["sura_number", "sura_name", "aya_number", "word_number", "word", "content"]
    }
}

BATCH_SIZE = 500


def supabase_request(url, service_key, data, method="POST"):
    """Make a request to Supabase REST API."""
    body = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("apikey", service_key)
    req.add_header("Authorization", f"Bearer {service_key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates")  # upsert on conflict

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def upload_dataset(supabase_url, service_key, filename, config):
    """Upload a single dataset to its Supabase table."""
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  SKIP: {filename} not found")
        return 0

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    table = config["table"]
    columns = config["columns"]
    url = f"{supabase_url}/rest/v1/{table}"

    print(f"\n  Uploading {filename} → {table} ({len(data):,} records)")

    uploaded = 0
    for i in range(0, len(data), BATCH_SIZE):
        batch = data[i:i + BATCH_SIZE]

        # Only keep the columns we need
        clean_batch = []
        for record in batch:
            row = {col: record.get(col) for col in columns}
            clean_batch.append(row)

        status, body = supabase_request(url, service_key, clean_batch)

        if status in (200, 201):
            uploaded += len(clean_batch)
            if (i // BATCH_SIZE) % 5 == 0:
                print(f"    {uploaded:,}/{len(data):,} records...")
        else:
            print(f"    ERROR at batch {i}: HTTP {status}")
            print(f"    {body[:200]}")
            return uploaded

    print(f"    Done: {uploaded:,} records uploaded")
    return uploaded


def main():
    # Load from .env file if present
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as ef:
            for line in ef:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

    supabase_url = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")

    if not supabase_url or not service_key:
        print("Error: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.")
        print("  export SUPABASE_URL='https://your-project.supabase.co'")
        print("  export SUPABASE_SERVICE_KEY='your-service-role-key'")
        sys.exit(1)

    # Remove trailing slash
    supabase_url = supabase_url.rstrip("/")

    print("Quran Data Uploader → Supabase")
    print(f"Target: {supabase_url}")
    print(f"Data dir: {DATA_DIR}")

    results = {}
    for filename, config in DATASETS.items():
        results[filename] = upload_dataset(supabase_url, service_key, filename, config)

    print("\n" + "=" * 50)
    print("UPLOAD SUMMARY")
    print("=" * 50)
    for filename, count in results.items():
        status = f"{count:,} records" if count > 0 else "skipped"
        print(f"  {filename}: {status}")


if __name__ == "__main__":
    main()
