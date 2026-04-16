#!/usr/bin/env python3
"""Download fawaed-page data from Surah App API (604 pages, batched)."""
import json, os, time, urllib.request

BASE = "https://dev.surahapp.com/api/v1/page/fawaed-page"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "fawaed_page.json")
BATCH = 50

all_pages = []
for start in range(1, 605, BATCH):
    end = min(start + BATCH - 1, 604)
    url = f"{BASE}/{start}/{end}"
    print(f"  Fetching pages {start}-{end}...")
    req = urllib.request.Request(url, headers={"User-Agent": "AlfalaahTools/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if isinstance(data, list):
            all_pages.extend(data)
        else:
            all_pages.append(data)
    time.sleep(0.5)

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(all_pages, f, ensure_ascii=False)

print(f"\nSaved {len(all_pages)} pages to {OUT}")
print(f"Size: {os.path.getsize(OUT) / 1024:.0f} KB")
