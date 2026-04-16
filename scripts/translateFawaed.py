#!/usr/bin/env python3
"""Translate fawaed_page.json Arabic bullets to English using Google Translate.

Output: fawaed_pages.json (bilingual) with shape:
  [{ page_number: N, insights: [{ ar: "...", en: "..." }, ...] }, ...]
"""
import json, os, sys, time

from deep_translator import GoogleTranslator

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(SCRIPT_DIR, "data", "fawaed_page.json")
OUTPUT = os.path.join(SCRIPT_DIR, "..", "public", "content", "fawaed_pages.json")
CHECKPOINT = os.path.join(SCRIPT_DIR, "data", "fawaed_translate_checkpoint.json")

translator = GoogleTranslator(source="ar", target="en")

with open(INPUT, encoding="utf-8") as f:
    raw = json.load(f)

# Load checkpoint if exists
checkpoint = {}
if os.path.exists(CHECKPOINT):
    with open(CHECKPOINT, encoding="utf-8") as f:
        checkpoint = json.load(f)
    print(f"Resuming from checkpoint ({len(checkpoint)} pages done)", flush=True)

result = []
total_bullets = 0
failed = 0

for idx, page in enumerate(raw):
    pn = page["page_number"]
    bullets_ar = []
    for c in page["content"]:
        for line in c.split("\n"):
            clean = line.lstrip("•-– ").strip()
            if clean:
                bullets_ar.append(clean)

    # Use checkpoint if available
    if str(pn) in checkpoint:
        result.append(checkpoint[str(pn)])
        total_bullets += len(bullets_ar)
        continue

    insights = []
    for bullet in bullets_ar:
        total_bullets += 1
        for attempt in range(3):
            try:
                en = translator.translate(bullet)
                insights.append({"ar": bullet, "en": en or ""})
                break
            except Exception as e:
                if attempt == 2:
                    insights.append({"ar": bullet, "en": ""})
                    failed += 1
                    print(f"  [FAIL] Page {pn}: {e}", flush=True)
                else:
                    time.sleep(1)

    page_data = {"page_number": pn, "insights": insights}
    result.append(page_data)
    checkpoint[str(pn)] = page_data

    # Save checkpoint every 25 pages
    if (idx + 1) % 25 == 0:
        with open(CHECKPOINT, "w", encoding="utf-8") as f:
            json.dump(checkpoint, f, ensure_ascii=False)

    if (idx + 1) % 10 == 0 or idx == len(raw) - 1:
        print(f"  {idx + 1}/{len(raw)} pages ({total_bullets} bullets, {failed} failed)", flush=True)

# Final save
with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False)

# Save final checkpoint
with open(CHECKPOINT, "w", encoding="utf-8") as f:
    json.dump(checkpoint, f, ensure_ascii=False)

size_kb = os.path.getsize(OUTPUT) / 1024
print(f"\nDone! {total_bullets} bullets across {len(result)} pages", flush=True)
print(f"Failed: {failed}", flush=True)
print(f"Saved to {OUTPUT} ({size_kb:.0f} KB)", flush=True)
