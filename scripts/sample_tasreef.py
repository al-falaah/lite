#!/usr/bin/env python3
"""
Sample ~500 words from the Surah App word-tasreef endpoint, spread across
the Qur'an, to catalog response shape variations before a full download.

Output: scripts/data/tasreef_sample.json
"""

import json
import os
import random
import time
import urllib.request

BASE_URL = "https://dev.surahapp.com/api/v1"
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "tasreef_sample.json")

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

N = 500


def fetch(url):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "AlfalaahQuranTools/1.0",
            "Accept": "application/json"
        })
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"_error": str(e)}


def main():
    random.seed(42)
    samples = []
    seen = set()

    print(f"Sampling {N} words from word-tasreef...")
    while len(samples) < N:
        sura = random.randint(1, 114)
        aya = random.randint(1, SURAH_AYAH_COUNTS[sura - 1])
        word = random.randint(1, 6)  # most ayahs have >=6 words
        key = (sura, aya, word)
        if key in seen:
            continue
        seen.add(key)

        url = f"{BASE_URL}/word/word-tasreef/{sura}/{aya}/{word}"
        data = fetch(url)
        if data and "_error" not in data and "error" not in data:
            samples.append(data)

        if len(samples) % 25 == 0:
            print(f"  {len(samples)}/{N}")
        time.sleep(0.15)

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(samples)} samples to {OUTPUT}")
    print(f"Size: {os.path.getsize(OUTPUT) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
