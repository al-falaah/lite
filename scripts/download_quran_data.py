#!/usr/bin/env python3
"""
Download Quran data from Surah App API and save as JSON files.
Fetches 4 core datasets: tajweed-aya, eerab-aya, eerab-word, word-tasreef.

Usage:
  python3 scripts/download_quran_data.py [--ayah-only] [--word-only] [--tasreef-only] [--eerab-word-only] [--resume]

Output: scripts/data/ directory with one JSON file per dataset.

The ayah-level datasets download in ~2 minutes (114 requests each).
The word-level datasets take longer (~77k words) but use concurrent requests.
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "https://dev.surahapp.com/api/v1"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# Surah ayah counts (114 surahs)
SURAH_AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 6, 3, 4,
    5, 4, 5, 6
]

TOTAL_AYAHS = sum(SURAH_AYAH_COUNTS)  # 6236


def fetch_json(url, retries=3):
    """Fetch JSON from URL with retry logic."""
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "AlfalaahQuranTools/1.0",
                "Accept": "application/json"
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return None


def download_aya_dataset(slug, output_file):
    """Download an ayah-level dataset using range endpoint (114 requests)."""
    print(f"\nDownloading {slug} (ayah-level, {TOTAL_AYAHS} ayahs)...")
    all_data = []
    start = time.time()

    for sura_idx, ayah_count in enumerate(SURAH_AYAH_COUNTS):
        sura = sura_idx + 1
        url = f"{BASE_URL}/aya/{slug}/{sura}/1/{ayah_count}"
        data = fetch_json(url)

        if data and isinstance(data, list):
            all_data.extend(data)
        elif data and isinstance(data, dict) and "error" not in data:
            all_data.append(data)
        else:
            print(f"  WARNING: Surah {sura} failed")

        # Progress every 10 surahs
        if sura % 10 == 0:
            elapsed = time.time() - start
            print(f"  {sura}/114 surahs | {len(all_data)} records | {elapsed:.0f}s")

        time.sleep(0.3)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False)

    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    elapsed = time.time() - start
    print(f"  Done: {len(all_data)} records, {size_mb:.1f} MB, {elapsed:.0f}s")
    return len(all_data)


def fetch_word(slug, sura, aya, word_num):
    """Fetch a single word. Returns (data, sura, aya, word_num) or None."""
    url = f"{BASE_URL}/word/{slug}/{sura}/{aya}/{word_num}"
    data = fetch_json(url)
    if data and "error" not in data:
        return data
    return None


def download_word_dataset(slug, output_file, max_workers=5):
    """Download word-level dataset with concurrent requests.

    Strategy per surah: submit all (ayah, word) pairs for words 1..probe_max
    into ONE shared executor, then extend beyond probe_max only for ayahs
    that had a hit at the boundary. This avoids the per-ayah pool overhead.
    """
    print(f"\nDownloading {slug} (word-level, ~77k words)...")
    print(f"  Using {max_workers} concurrent workers")

    # Check for resume file
    resume_file = output_file + ".partial"
    all_data = []
    start_sura = 1

    if os.path.exists(resume_file):
        with open(resume_file, "r", encoding="utf-8") as f:
            resume_data = json.load(f)
            all_data = resume_data.get("data", [])
            start_sura = resume_data.get("next_sura", 1)
            print(f"  Resuming from surah {start_sura} ({len(all_data)} words so far)")

    start = time.time()
    PROBE_MAX = 20  # 99%+ of ayahs are <= 20 words; we extend for the rest

    for sura_idx in range(start_sura - 1, len(SURAH_AYAH_COUNTS)):
        sura = sura_idx + 1
        ayah_count = SURAH_AYAH_COUNTS[sura_idx]

        # Phase 1: fire words 1..PROBE_MAX for every ayah in the surah, one pool
        results = {}  # (aya, w) -> data
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {}
            for aya in range(1, ayah_count + 1):
                for w in range(1, PROBE_MAX + 1):
                    fut = executor.submit(fetch_word, slug, sura, aya, w)
                    futures[fut] = (aya, w)
            for fut in as_completed(futures):
                aya, w = futures[fut]
                res = fut.result()
                if res:
                    results[(aya, w)] = res

        # Phase 2: for ayahs that had a word at PROBE_MAX, extend until we miss
        extend_ayahs = [aya for aya in range(1, ayah_count + 1)
                        if (aya, PROBE_MAX) in results]
        if extend_ayahs:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures = {}
                for aya in extend_ayahs:
                    for w in range(PROBE_MAX + 1, 130):  # 2:282 has ~128 words
                        fut = executor.submit(fetch_word, slug, sura, aya, w)
                        futures[fut] = (aya, w)
                for fut in as_completed(futures):
                    aya, w = futures[fut]
                    res = fut.result()
                    if res:
                        results[(aya, w)] = res

        # Assemble in order: by ayah, then by word. Stop per-ayah at first gap.
        sura_words = []
        for aya in range(1, ayah_count + 1):
            w = 1
            while (aya, w) in results:
                sura_words.append(results[(aya, w)])
                w += 1

        all_data.extend(sura_words)

        elapsed = time.time() - start
        print(f"  Surah {sura:3d}: {len(sura_words):5d} words | total: {len(all_data)} | {elapsed:.0f}s")

        # Save checkpoint every 5 surahs
        if sura % 5 == 0:
            with open(resume_file, "w", encoding="utf-8") as f:
                json.dump({"data": all_data, "next_sura": sura + 1}, f, ensure_ascii=False)

    # Final save
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False)

    # Clean up resume file
    if os.path.exists(resume_file):
        os.remove(resume_file)

    size_mb = os.path.getsize(output_file) / (1024 * 1024)
    elapsed = time.time() - start
    print(f"  Done: {len(all_data)} records, {size_mb:.1f} MB, {elapsed:.0f}s")
    return len(all_data)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    ayah_only = "--ayah-only" in sys.argv
    word_only = "--word-only" in sys.argv
    tasreef_only = "--tasreef-only" in sys.argv
    eerab_word_only = "--eerab-word-only" in sys.argv

    print("Quran Data Downloader — Surah App API")
    print(f"Output: {OUTPUT_DIR}\n")

    results = {}

    if not word_only and not tasreef_only and not eerab_word_only:
        # Ayah-level datasets (~2 min total)
        results["tajweed-aya"] = download_aya_dataset(
            "tajweed-aya", os.path.join(OUTPUT_DIR, "tajweed_aya.json")
        )
        results["eerab-aya"] = download_aya_dataset(
            "eerab-aya", os.path.join(OUTPUT_DIR, "eerab_aya.json")
        )

    if tasreef_only:
        results["word-tasreef"] = download_word_dataset(
            "word-tasreef", os.path.join(OUTPUT_DIR, "word_tasreef.json"),
            max_workers=12
        )
    elif eerab_word_only:
        results["eerab-word"] = download_word_dataset(
            "eerab-word", os.path.join(OUTPUT_DIR, "eerab_word.json"),
            max_workers=12
        )
    elif not ayah_only:
        # Both word-level datasets
        results["eerab-word"] = download_word_dataset(
            "eerab-word", os.path.join(OUTPUT_DIR, "eerab_word.json")
        )
        results["word-tasreef"] = download_word_dataset(
            "word-tasreef", os.path.join(OUTPUT_DIR, "word_tasreef.json")
        )

    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    for name, count in results.items():
        print(f"  {name}: {count:,} records")

    json_files = [f for f in os.listdir(OUTPUT_DIR) if f.endswith(".json")]
    total_size = sum(os.path.getsize(os.path.join(OUTPUT_DIR, f)) for f in json_files)
    print(f"  Total size: {total_size / (1024*1024):.1f} MB")


if __name__ == "__main__":
    main()
