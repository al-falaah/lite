#!/usr/bin/env python3
"""
Import Markaz Tafsir data (quran.db, from tafsir.net, CC BY 4.0) into Supabase,
alongside the existing quran_tajweed_aya table. Mirrors upload_to_supabase.py:
batched upsert via the REST API with Prefer: resolution=merge-duplicates.

Attribution: any surface that displays this text must credit
"Tafsir Center for Quranic Studies (tafsir.net)". Text is shown verbatim.

Usage:
  QURAN_DB=/path/to/quran.db python3 scripts/import_markaz.py [table ...]

  - QURAN_DB defaults to scripts/data/quran.db if present.
  - Pass one or more logical table names to import a subset; omit to import all.
    Names: ayah_ref mukhtasar classical irab nozool word_grammar fawaed

Requires (from .env or environment):
  VITE_SUPABASE_URL (or SUPABASE_URL)
  SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)   # never pass on the CLI
"""

import json
import os
import sqlite3
import sys
import urllib.request
import urllib.error

BATCH_SIZE = 500


def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as ef:
            for line in ef:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


def supabase_upsert(url, key, table, rows):
    """Upsert a batch to {table}. Returns (status, body)."""
    body = json.dumps(rows, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(f"{url}/rest/v1/{table}", data=body, method="POST")
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "resolution=merge-duplicates")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")


def upload(url, key, table, rows):
    print(f"\n  {table}: {len(rows):,} rows")
    done = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        status, body = supabase_upsert(url, key, table, batch)
        if status in (200, 201):
            done += len(batch)
            if (i // BATCH_SIZE) % 10 == 0:
                print(f"    {done:,}/{len(rows):,}...")
        else:
            print(f"    ERROR at batch {i}: HTTP {status}\n    {body[:300]}")
            return done
    print(f"    Done: {done:,}")
    return done


# --- Row builders: read quran.db, return list[dict] matching each table ---

def build_ayah_ref(con):
    """Reconstruct imla'i ayah text by joining word_content_rasm.word in order."""
    rows = []
    cur = con.execute(
        "SELECT surahNo, ayahNo, word FROM word_content_rasm ORDER BY surahNo, ayahNo, wordNo")
    cur_key, words = None, []
    for s, a, w in cur:
        key = (s, a)
        if key != cur_key:
            if cur_key is not None:
                rows.append({"sura_number": cur_key[0], "aya_number": cur_key[1],
                             "ayah_imlai": " ".join(words)})
            cur_key, words = key, []
        words.append((w or "").strip())
    if cur_key is not None:
        rows.append({"sura_number": cur_key[0], "aya_number": cur_key[1],
                     "ayah_imlai": " ".join(words)})
    return rows


def build_mukhtasar(con):
    return [{"sura_number": s, "aya_number": a, "ar": ar, "en": en, "bn": bn}
            for s, a, ar, en, bn in con.execute(
                "SELECT surahNo, ayahNo, Mukhtasarar, Mukhtasaren, Mukhtasarbn "
                "FROM QuranTafseer ORDER BY surahNo, ayahNo")]


def build_classical(con):
    rows = []
    for source, tbl in (("tabary", "tafsir_tabary"), ("katheer", "tafsir_katheer"),
                        ("baghawy", "tafsir_baghawy"), ("saadi", "tafsir_saadi"),
                        ("moyassar", "tafsir_moyassar")):
        for s, a, t in con.execute(
                f"SELECT sura, aya, tafsir FROM {tbl} ORDER BY sura, aya"):
            if t is not None and t != "":
                rows.append({"sura_number": s, "aya_number": a,
                             "source": source, "tafsir": t})
    return rows


def build_irab(con):
    return [{"sura_number": s, "aya_number": a, "irab": t}
            for s, a, t in con.execute(
                "SELECT surahNo, ayahNo, irabAyah1 FROM ayah_content_irab ORDER BY surahNo, ayahNo")
            if t is not None and t != ""]


def build_nozool(con):
    return [{"sura_number": s, "aya_number": a, "nozool": t}
            for s, a, t in con.execute(
                "SELECT surahNo, ayahNo, nozoolInfo FROM ayah_content_nozool ORDER BY surahNo, ayahNo")
            if t is not None and t != ""]


def build_word_grammar(con):
    return [{"sura_number": s, "aya_number": a, "word_number": w, "word": (word or "").strip(),
             "irab": irab, "sarf": sarf, "meaning": meaning}
            for s, a, w, word, irab, sarf, meaning in con.execute(
                "SELECT r.surahNo, r.ayahNo, r.wordNo, r.word, "
                "       i.irabMushakkal, sf.sarf, m.meaning "
                "FROM word_content_rasm r "
                "LEFT JOIN word_content_irab i "
                "  ON r.surahNo=i.surahNo AND r.ayahNo=i.ayahNo AND r.wordNo=i.wordNo "
                "LEFT JOIN word_content_sarf sf "
                "  ON r.surahNo=sf.surahNo AND r.ayahNo=sf.ayahNo AND r.wordNo=sf.wordNo "
                "LEFT JOIN word_content_meaning m "
                "  ON r.surahNo=m.surahNo AND r.ayahNo=m.ayahNo AND r.wordNo=m.wordNo "
                "ORDER BY r.surahNo, r.ayahNo, r.wordNo")]


def build_fawaed(con):
    return [{"page": p, "fawaed": c}
            for p, c in con.execute(
                "SELECT page, content FROM mokhtasar_fawaed ORDER BY page")
            if c is not None and c != ""]


BUILDERS = {
    "ayah_ref":     ("quran_ayah_ref",        build_ayah_ref),
    "mukhtasar":    ("quran_tafsir_mukhtasar", build_mukhtasar),
    "classical":    ("quran_tafsir_classical", build_classical),
    "irab":         ("quran_ayah_irab",        build_irab),
    "nozool":       ("quran_ayah_nozool",      build_nozool),
    "word_grammar": ("quran_word_grammar",     build_word_grammar),
    "fawaed":       ("quran_page_fawaed",      build_fawaed),
}


def main():
    load_env()
    url = (os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("Error: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (via .env).")
        sys.exit(1)

    db = os.environ.get("QURAN_DB") or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "data", "quran.db")
    if not os.path.exists(db):
        print(f"Error: quran.db not found at {db}. Set QURAN_DB=/path/to/quran.db")
        sys.exit(1)

    wanted = [a for a in sys.argv[1:] if not a.startswith("-")] or list(BUILDERS)
    unknown = [w for w in wanted if w not in BUILDERS]
    if unknown:
        print(f"Unknown table(s): {unknown}. Choose from {list(BUILDERS)}")
        sys.exit(1)

    con = sqlite3.connect(db)
    print(f"Markaz Tafsir import → {url}\nSource: {db}")

    summary = {}
    for name in wanted:
        table, builder = BUILDERS[name]
        rows = builder(con)
        summary[table] = upload(url, key, table, rows)

    print("\n" + "=" * 50)
    print("IMPORT SUMMARY")
    print("=" * 50)
    for table, n in summary.items():
        print(f"  {table}: {n:,}")


if __name__ == "__main__":
    main()
