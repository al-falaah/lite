#!/usr/bin/env python3
"""
Harvest Qurʾānic thematic topics from the Bahouth MCP server
(bahouth.tafsir.net/mcp) into the quran_ayah_topic table.

Bahouth exposes no topic catalog and no bulk download, so topic_ids can only
be discovered by sweeping list_verse_topics across every verse. This crawls
all 6236 verses (verse-first sweep), caches results incrementally so a re-run
resumes, then upserts the verse<->topic mapping to Supabase.

Attribution: any surface that displays this data must credit
"Tafsir Center for Quranic Studies (tafsir.net)".

Usage:
  python3 scripts/harvest_bahouth_topics.py               # harvest (resume) then upload
  python3 scripts/harvest_bahouth_topics.py --harvest-only # crawl + cache, no DB write
  python3 scripts/harvest_bahouth_topics.py --upload-only   # upload existing cache only

Requires (from .env or environment), for the upload phase only:
  VITE_SUPABASE_URL (or SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
"""

import json
import os
import sys
import time
import urllib.request
import urllib.error

# Reuse the env + batched-upsert plumbing from the SQLite importer.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_markaz import load_env, upload  # noqa: E402

MCP_URL = "https://bahouth.tafsir.net/mcp"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "bahouth_topics.json")

# Standard Hafs per-surah ayah counts (index 0 unused; 1..114). Derived from
# quran.db word_content_rasm per-surah maxima; sums to 6236.
AYAH_COUNTS = [0,
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99,
    128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34,
    30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18,
    45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30,
    52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22,
    17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5,
    4, 7, 3, 6, 3, 5, 4, 5, 6]


def mcp_call(name, arguments, rid=1, retries=5):
    """Call an MCP tool; return the parsed inner tool-result dict, or None."""
    body = json.dumps({
        "jsonrpc": "2.0", "id": rid, "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }).encode("utf-8")
    delay = 1.0
    for attempt in range(retries):
        req = urllib.request.Request(MCP_URL, data=body, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Accept", "application/json, text/event-stream")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
            # response may be plain JSON or SSE (data: <json>)
            if raw.lstrip().startswith("event:") or raw.lstrip().startswith("data:"):
                for line in raw.splitlines():
                    if line.startswith("data:"):
                        raw = line[5:].strip()
                        break
            env = json.loads(raw)
            if env.get("result", {}).get("isError"):
                return None
            text = env["result"]["content"][0]["text"]
            return json.loads(text)
        except (urllib.error.HTTPError, urllib.error.URLError, KeyError,
                json.JSONDecodeError, TimeoutError) as e:
            code = getattr(e, "code", None)
            if code in (429, 500, 502, 503, 504) or code is None:
                time.sleep(delay)
                delay = min(delay * 2, 30)
                continue
            return None
    print(f"    give up: {name} {arguments}")
    return None


def all_verse_keys():
    for s in range(1, 115):
        for a in range(1, AYAH_COUNTS[s] + 1):
            yield f"{s}-{a}"


def harvest():
    cache = {}
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            cache = json.load(f)
        print(f"Resuming: {len(cache):,} verses already cached.")
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)

    keys = list(all_verse_keys())
    done_since_flush = 0
    for i, vk in enumerate(keys):
        if vk in cache:
            continue
        result = mcp_call("list_verse_topics", {"verse_key": vk}, rid=i + 1)
        cache[vk] = (result or {}).get("topics", [])
        done_since_flush += 1
        time.sleep(0.15)  # be polite to the server
        if done_since_flush >= 50:
            with open(CACHE, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False)
            done_since_flush = 0
            n_topics = sum(len(v) for v in cache.values())
            print(f"  {len(cache):,}/{len(keys):,} verses  ({n_topics:,} topic rows)")
    with open(CACHE, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    print(f"Harvest complete: {len(cache):,} verses cached at {CACHE}")
    return cache


def cache_to_rows(cache):
    seen = set()
    rows = []
    for vk, topics in cache.items():
        s, a = (int(x) for x in vk.split("-"))
        for t in topics:
            tid = t.get("topic_id")
            if tid is None:
                continue
            key = (s, a, tid)
            if key in seen:
                continue
            seen.add(key)
            rows.append({
                "sura_number": s, "aya_number": a, "topic_id": tid,
                "category_id": t.get("category_id"),
                "subcategory_id": t.get("subcategory_id"),
                "title": t.get("title_raw") or "",
            })
    return rows


def main():
    args = sys.argv[1:]
    harvest_only = "--harvest-only" in args
    upload_only = "--upload-only" in args

    if upload_only:
        if not os.path.exists(CACHE):
            print(f"Error: no cache at {CACHE}; run harvest first.")
            sys.exit(1)
        with open(CACHE, encoding="utf-8") as f:
            cache = json.load(f)
    else:
        cache = harvest()

    if harvest_only:
        return

    rows = cache_to_rows(cache)
    print(f"\n{len(rows):,} verse-topic rows to upsert.")

    load_env()
    url = (os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Error: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (via .env).")
        sys.exit(1)
    upload(url, key, "quran_ayah_topic", rows)


if __name__ == "__main__":
    main()
