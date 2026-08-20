#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx"]
# ///
"""CPDV (Catholic Public Domain Version) scraper.

Source: https://sacredbible.org/catholic/ — one HTML file per book. Verses
are marked inline as ``{chapter:verse}``; chapters are marked by an anchor
like ``[<A NAME=1><A HREF=#top class=chapter>John 1</A></A>]``.

Pages are served as cp1252 ("Windows-1252") without a reliable charset
declaration in the HTTP headers, so decoding is forced to cp1252
unconditionally — trusting the transport would produce mojibake on curly
quotes/apostrophes.

Usage:
    uv run pipeline/scrapers/cpdv.py              # full 73-book run
    uv run pipeline/scrapers/cpdv.py --sample      # Philemon + John 1-3 only
    uv run pipeline/scrapers/cpdv.py --offline     # cache-only, no network
    uv run pipeline/scrapers/cpdv.py --refresh     # bypass cache, re-fetch

Caches every raw fetched page under corpus/raw/cpdv/ and is fully
offline-capable from that cache on re-runs. Ends with a validation pass
that prints a summary table and exits non-zero on failure.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import httpx

# Sibling module in this directory -- a script's own directory is on sys.path,
# so this resolves regardless of the working directory. See common.py's
# docblock for what does and does not belong there.
from common import CorrectionDriftError, chapter_opening_letter, load_corrections

BASE_URL = "https://sacredbible.org/catholic/"
USER_AGENT = "Glossa Catholica corpus builder (+contact via repo)"
RATE_LIMIT_SECONDS = 1.0

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
RAW_DIR = REPO_ROOT / "corpus" / "raw" / "cpdv"
WORK_DIR = REPO_ROOT / "corpus" / "works" / "bible.cpdv.en"
WORK_ID = "bible.cpdv.en"

# (osis, filename, display name) in the schema's canonical 73-book order.
# docs/corpus-schema.md §"Canonical book order".
BOOKS: list[tuple[str, str, str]] = [
    # OT (46)
    ("gen", "OT-01_Genesis.htm", "Genesis"),
    ("exod", "OT-02_Exodus.htm", "Exodus"),
    ("lev", "OT-03_Leviticus.htm", "Leviticus"),
    ("num", "OT-04_Numbers.htm", "Numbers"),
    ("deut", "OT-05_Deuteronomy.htm", "Deuteronomy"),
    ("josh", "OT-06_Joshua.htm", "Joshua"),
    ("judg", "OT-07_Judges.htm", "Judges"),
    ("ruth", "OT-08_Ruth.htm", "Ruth"),
    ("1sam", "OT-09_1-Samuel.htm", "1 Samuel"),
    ("2sam", "OT-10_2-Samuel.htm", "2 Samuel"),
    ("1kgs", "OT-11_1-Kings.htm", "1 Kings"),
    ("2kgs", "OT-12_2-Kings.htm", "2 Kings"),
    ("1chr", "OT-13_1-Chronicles.htm", "1 Chronicles"),
    ("2chr", "OT-14_2-Chronicles.htm", "2 Chronicles"),
    ("ezra", "OT-15_Ezra.htm", "Ezra"),
    ("neh", "OT-16_Nehemiah.htm", "Nehemiah"),
    ("tob", "OT-17_Tobit.htm", "Tobit"),
    ("jdt", "OT-18_Judith.htm", "Judith"),
    ("esth", "OT-19_Esther.htm", "Esther"),
    ("1macc", "OT-45_1-Maccabees.htm", "1 Maccabees"),
    ("2macc", "OT-46_2-Maccabees.htm", "2 Maccabees"),
    ("job", "OT-20_Job.htm", "Job"),
    ("ps", "OT-21_Psalms.htm", "Psalms"),
    ("prov", "OT-22_Proverbs.htm", "Proverbs"),
    ("eccl", "OT-23_Ecclesiastes.htm", "Ecclesiastes"),
    # OT-24_Song2.htm is the plain-text primary link ("Song of Songs" on the
    # index page); OT-24_Song.htm is an alternate "in color" variant with
    # speaker names inlined via <FONT COLOR> instead of <I> — not used here.
    ("song", "OT-24_Song2.htm", "Song of Songs"),
    ("wis", "OT-25_Wisdom.htm", "Wisdom"),
    ("sir", "OT-26_Sirach.htm", "Sirach"),
    ("isa", "OT-27_Isaiah.htm", "Isaiah"),
    ("jer", "OT-28_Jeremiah.htm", "Jeremiah"),
    ("lam", "OT-29_Lamentations.htm", "Lamentations"),
    ("bar", "OT-30_Baruch.htm", "Baruch"),
    ("ezek", "OT-31_Ezekiel.htm", "Ezekiel"),
    ("dan", "OT-32_Daniel.htm", "Daniel"),
    ("hos", "OT-33_Hosea.htm", "Hosea"),
    ("joel", "OT-34_Joel.htm", "Joel"),
    ("amos", "OT-35_Amos.htm", "Amos"),
    ("obad", "OT-36_Obadiah.htm", "Obadiah"),
    ("jonah", "OT-37_Jonah.htm", "Jonah"),
    ("mic", "OT-38_Micah.htm", "Micah"),
    ("nah", "OT-39_Nahum.htm", "Nahum"),
    ("hab", "OT-40_Habakkuk.htm", "Habakkuk"),
    ("zeph", "OT-41_Zephaniah.htm", "Zephaniah"),
    ("hag", "OT-42_Haggai.htm", "Haggai"),
    ("zech", "OT-43_Zechariah.htm", "Zechariah"),
    ("mal", "OT-44_Malachi.htm", "Malachi"),
    # NT (27)
    ("matt", "NT-01_Matthew.htm", "Matthew"),
    ("mark", "NT-02_Mark.htm", "Mark"),
    ("luke", "NT-03_Luke.htm", "Luke"),
    ("john", "NT-04_John.htm", "John"),
    ("acts", "NT-05_Acts.htm", "Acts of the Apostles"),
    ("rom", "NT-06_Romans.htm", "Romans"),
    ("1cor", "NT-07_1-Corinthians.htm", "1 Corinthians"),
    ("2cor", "NT-08_2-Corinthians.htm", "2 Corinthians"),
    ("gal", "NT-09_Galatians.htm", "Galatians"),
    ("eph", "NT-10_Ephesians.htm", "Ephesians"),
    ("phil", "NT-11_Philippians.htm", "Philippians"),
    ("col", "NT-12_Colossians.htm", "Colossians"),
    ("1thess", "NT-13_1-Thessalonians.htm", "1 Thessalonians"),
    ("2thess", "NT-14_2-Thessalonians.htm", "2 Thessalonians"),
    ("1tim", "NT-15_1-Timothy.htm", "1 Timothy"),
    ("2tim", "NT-16_2-Timothy.htm", "2 Timothy"),
    ("titus", "NT-17_Titus.htm", "Titus"),
    ("phlm", "NT-18_Philemon.htm", "Philemon"),
    ("heb", "NT-19_Hebrews.htm", "Hebrews"),
    ("jas", "NT-20_James.htm", "James"),
    ("1pet", "NT-21_1-Peter.htm", "1 Peter"),
    ("2pet", "NT-22_2-Peter.htm", "2 Peter"),
    ("1john", "NT-23_1-John.htm", "1 John"),
    ("2john", "NT-24_2-John.htm", "2 John"),
    ("3john", "NT-25_3-John.htm", "3 John"),
    ("jude", "NT-26_Jude.htm", "Jude"),
    ("rev", "NT-27_Revelation.htm", "Revelation"),
]

assert len(BOOKS) == 73, f"expected 73 books in BOOKS table, got {len(BOOKS)}"

# Curated jump-box abbreviations for well-known books; anything not listed
# here falls back to [osis, name-without-spaces-lowercased].
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["jos"],
    "judg": ["jdg"],
    "1sam": ["1sm"],
    "2sam": ["2sm"],
    "1kgs": ["1kg", "1ki"],
    "2kgs": ["2kg", "2ki"],
    "1chr": ["1ch"],
    "2chr": ["2ch"],
    "ps": ["psa", "psalm", "psalms"],
    "prov": ["pr"],
    "eccl": ["ecc", "qoh"],
    "song": ["sos", "canticles", "cant"],
    "isa": ["is"],
    "jer": ["jr"],
    "ezek": ["eze", "ezk"],
    "dan": ["dn"],
    "matt": ["mt"],
    "mark": ["mk", "mrk"],
    "luke": ["lk"],
    "john": ["jn", "joh"],
    "acts": ["ac"],
    "rom": ["ro"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["ga"],
    "eph": ["ep"],
    "phil": ["php"],
    "col": ["co"],
    "phlm": ["phm"],
    "heb": ["he"],
    "jas": ["jm"],
    "1pet": ["1pt"],
    "2pet": ["2pt"],
    "1john": ["1jn"],
    "2john": ["2jn"],
    "3john": ["3jn"],
    "jude": ["jud"],
    "rev": ["re", "apoc"],
}

# Known chapter counts for sanity-checking a full (untruncated) run.
KNOWN_CHAPTER_COUNTS = {"gen": 50, "ps": 150, "matt": 28, "rev": 22, "john": 21}

SAMPLE_BOOKS = {"phlm", "john"}
SAMPLE_JOHN_CHAPTERS = {1, 2, 3}

CHAPTER_RE = re.compile(
    r"^\[<A NAME=(\d+)><A HREF=#top class=chapter>([^<]*)</A></A>\]$", re.IGNORECASE
)
VERSE_RE = re.compile(r"^\{(\d+):(\d+)\}\s*(.*)$", re.DOTALL)
TAG_RE = re.compile(r"<[^>]*>")
WS_RE = re.compile(r"\s+")

# Substrings that must never appear in cleaned verse text.
MOJIBAKE_MARKERS = ["�", "\N{REPLACEMENT CHARACTER}", "Ã©", "â€™", "â€œ", "â€"]


def abbrevs_for(osis: str, name: str) -> list[str]:
    base = [osis, name.lower().replace(" ", "")]
    extra = _CURATED_ABBREVS.get(osis, [])
    seen: list[str] = []
    for a in base + extra:
        if a not in seen:
            seen.append(a)
    return seen


def clean_text(raw: str) -> str:
    """Strip HTML tags/entities from a verse's raw text and normalize whitespace."""
    no_tags = TAG_RE.sub("", raw)
    unescaped = html.unescape(no_tags)
    # cp1252 has no NBSP glyph issue after decode, but entities may still
    # introduce \xa0; fold it into a normal space before collapsing.
    unescaped = unescaped.replace("\xa0", " ")
    collapsed = WS_RE.sub(" ", unescaped).strip()
    return collapsed


@dataclass
class Anomaly:
    osis: str
    detail: str


ANOMALIES: list[Anomaly] = []


def parse_book(osis: str, raw_html: str) -> list[dict]:
    """Parse a decoded book page into a list of {n, verses:[{n,text}]} chapters."""
    begin = raw_html.find("<!-- begin -->")
    end = raw_html.find("<!-- end -->")
    body = raw_html[begin:end] if begin != -1 and end != -1 else raw_html

    segments = re.split(r"<BR>", body, flags=re.IGNORECASE)

    chapters: dict[int, list[tuple[int, str]]] = {}
    chapter_order: list[int] = []
    seen_verses: dict[int, set[int]] = {}

    for raw_seg in segments:
        seg = raw_seg.strip().replace("\r", "").replace("\n", " ").strip()
        if not seg:
            continue

        m_ch = CHAPTER_RE.match(seg)
        if m_ch:
            n = int(m_ch.group(1))
            if n not in chapters:
                chapters[n] = []
                chapter_order.append(n)
                seen_verses[n] = set()
            continue

        m_v = VERSE_RE.match(seg)
        if m_v:
            c, v, raw_text = int(m_v.group(1)), int(m_v.group(2)), m_v.group(3)
            text = clean_text(raw_text)
            if not text:
                ANOMALIES.append(Anomaly(osis, f"empty verse text at {c}:{v}, dropped"))
                continue
            if c not in chapters:
                chapters[c] = []
                chapter_order.append(c)
                seen_verses[c] = set()
            if v in seen_verses[c]:
                ANOMALIES.append(
                    Anomaly(
                        osis,
                        f"duplicate verse {c}:{v} in source, kept first occurrence",
                    )
                )
                continue
            seen_verses[c].add(v)
            chapters[c].append((v, text))
            continue

        # Editorial asides (e.g. Esther 9's "<i>Alternate text from the
        # Hebrew...</i>" heading) or blank noise between verses — ignored,
        # they carry no {c:v} marker so nothing is lost from the text.

    result = []
    for n in sorted(chapter_order):
        verses = sorted(chapters[n], key=lambda t: t[0])
        result.append({"n": n, "verses": [{"n": v, "text": t} for v, t in verses]})
    return result


class Fetcher:
    def __init__(self, offline: bool, refresh: bool):
        self.offline = offline
        self.refresh = refresh
        self.client = (
            None
            if offline
            else httpx.Client(
                headers={"User-Agent": USER_AGENT}, timeout=30, follow_redirects=True
            )
        )

    def fetch(self, filename: str) -> str:
        """Return decoded (cp1252) HTML for a source page, cache-first."""
        cache_path = RAW_DIR / filename
        if not self.refresh and cache_path.exists():
            raw = cache_path.read_bytes()
            return raw.decode("cp1252")

        if self.offline:
            raise RuntimeError(
                f"--offline set but {filename} is not cached at {cache_path}"
            )

        url = BASE_URL + filename
        resp = self.client.get(url)
        resp.raise_for_status()
        raw = resp.content
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        cache_path.write_bytes(raw)
        time.sleep(RATE_LIMIT_SECONDS)
        return raw.decode("cp1252")

    def close(self):
        if self.client is not None:
            self.client.close()


# --------------------------------------------------------------------------
# Corrections layer (docs/corpus-schema.md #Corrections, docs/decisions.md
# #Source-defect corrections policy)
#
# Verified source defects are corrected via an auditable data file rather
# than by hand-editing output. Entries live in
# pipeline/corrections/bible.cpdv.en.json (committed to the repo, if/when
# any defect is documented for this source -- CPDV is a clean, modern
# public-domain translation with no known mechanical/typographic defects as
# of this writing, so the file is typically absent and this layer applies
# zero corrections). Loading comes from common.py; APPLYING it stays here,
# because what a correction means is per-source -- this scraper's own
# non-zero-exit drift guard is below.
# --------------------------------------------------------------------------


def apply_corrections(
    book_docs: list[dict], corrections: list[dict], full_run: bool
) -> tuple[list[dict], set[str]]:
    # Scope is tracked at (osis, chapter) granularity, not just osis: --sample
    # keeps Philemon whole but truncates John to chapters 1-3, so a
    # correction targeting a chapter the sample run never touched must be
    # skipped as out-of-scope, not treated as source drift.
    present_chapters = {
        (b["osis"], chap["n"]) for b in book_docs for chap in b["chapters"]
    }
    verse_index: dict[tuple[str, int, int], dict] = {}
    for b in book_docs:
        for chap in b["chapters"]:
            for v in chap["verses"]:
                verse_index[(b["osis"], chap["n"], v["n"])] = v

    applied: list[dict] = []
    seen: set[str] = set()
    for c in corrections:
        if c.get("resolution"):
            continue  # documented non-defect / unresolved -- never applied
        loc = c["locator"]
        key = (loc["osis"], loc["chapter"], loc["verse"])
        if (loc["osis"], loc["chapter"]) not in present_chapters:
            continue  # out of scope for this run (e.g. --sample)
        verse = verse_index.get(key)
        if verse is None or c["from"] not in verse["text"]:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected text {c['from']!r} not found "
                f"at {loc['osis']} {loc['chapter']}:{loc['verse']} (source drift -- "
                "re-verify against corpus/raw/ and update or remove the entry)"
            )
        verse["text"] = verse["text"].replace(c["from"], c["to"], 1)
        applied.append(dict(c))
        seen.add(c["id"])

    if full_run:
        missing = [
            c["id"]
            for c in corrections
            if not c.get("resolution") and c["id"] not in seen
        ]
        if missing:
            raise CorrectionDriftError(
                f"correction entries never matched during full run: {missing}"
            )
    return applied, seen


def write_corrections_receipt(
    work_dir: Path, applied: list[dict], corrections: list[dict], generated_at: str
) -> int:
    unresolved = [c for c in corrections if c.get("resolution")]
    receipt = {
        "work_id": WORK_ID,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": unresolved,
        "count": len(applied),
    }
    work_dir.mkdir(parents=True, exist_ok=True)
    (work_dir / "corrections-applied.json").write_text(
        json.dumps(receipt, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return len(applied)


def run_scrape(
    sample: bool, offline: bool, refresh: bool
) -> tuple[list[dict], list[str]]:
    fetcher = Fetcher(offline=offline, refresh=refresh)
    book_docs: list[dict] = []
    fetched_files: list[str] = []
    try:
        for order, (osis, filename, name) in enumerate(BOOKS, start=1):
            if sample and osis not in SAMPLE_BOOKS:
                continue
            raw_html = fetcher.fetch(filename)
            fetched_files.append(filename)
            chapters = parse_book(osis, raw_html)
            if sample and osis == "john":
                chapters = [c for c in chapters if c["n"] in SAMPLE_JOHN_CHAPTERS]
            book_docs.append(
                {
                    "osis": osis,
                    "name": name,
                    "abbrevs": abbrevs_for(osis, name),
                    "order": order,
                    "chapters": chapters,
                }
            )
    finally:
        fetcher.close()
    return book_docs, fetched_files


def validate(book_docs: list[dict], sample: bool) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str):
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if not sample:
        if len(book_docs) != 73:
            fail(f"expected 73 books, got {len(book_docs)}")
        present = {b["osis"] for b in book_docs}
        expected = {b[0] for b in BOOKS}
        missing = expected - present
        if missing:
            fail(f"missing books: {sorted(missing)}")

    truncated = {"john"} if sample else set()
    for b in book_docs:
        osis = b["osis"]
        if osis in KNOWN_CHAPTER_COUNTS and osis not in truncated:
            expected_n = KNOWN_CHAPTER_COUNTS[osis]
            got_n = len(b["chapters"])
            if got_n != expected_n:
                fail(f"{osis}: expected {expected_n} chapters, got {got_n}")

        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{osis} chapter {ch['n']}: no verses")
            else:
                # A chapter's first verse begins a sentence, so its first letter
                # must be capitalized. The same check on the Portuguese edition
                # found five lost capitals in that source (see
                # pipeline/corrections/bible.matos-soares.pt.json); this edition
                # currently has none, which is exactly why it belongs here --
                # the check is cheap and its value is catching the sixth.
                opening = chapter_opening_letter(ch["verses"][0]["text"])
                if opening is not None and opening.islower():
                    fail(
                        f"{osis} {ch['n']}:{ch['verses'][0]['n']}: chapter opens on "
                        f"lowercase {opening!r} -- likely a lost capital in the source; "
                        "adjudicate into pipeline/corrections/ rather than editing text"
                    )

            for v in ch["verses"]:
                t = v["text"]
                if "<" in t:
                    fail(f"{osis} {ch['n']}:{v['n']}: leftover '<' in text")
                if "{" in t or "}" in t:
                    fail(
                        f"{osis} {ch['n']}:{v['n']}: leftover verse marker braces in text"
                    )
                if "  " in t:
                    fail(f"{osis} {ch['n']}:{v['n']}: double space in text")
                if t != t.strip():
                    fail(f"{osis} {ch['n']}:{v['n']}: leading/trailing whitespace")
                for marker in MOJIBAKE_MARKERS:
                    if marker in t:
                        fail(
                            f"{osis} {ch['n']}:{v['n']}: mojibake marker {marker!r} in text"
                        )

    return ok, report


def print_summary(book_docs: list[dict]) -> int:
    total_verses = 0
    print(f"{'book':<8} {'chapters':>8} {'verses':>8}")
    print("-" * 26)
    for b in book_docs:
        n_chapters = len(b["chapters"])
        n_verses = sum(len(c["verses"]) for c in b["chapters"])
        total_verses += n_verses
        print(f"{b['osis']:<8} {n_chapters:>8} {n_verses:>8}")
    print("-" * 26)
    print(f"{'TOTAL':<8} {'':>8} {total_verses:>8}")
    return total_verses


def write_output(
    book_docs: list[dict],
    sample: bool,
    total_verses: int,
    corrections_applied: int,
    generated_at: str,
) -> None:
    books_dir = WORK_DIR / "books"
    books_dir.mkdir(parents=True, exist_ok=True)
    for b in book_docs:
        out_path = books_dir / f"{b['osis']}.json"
        write_json(out_path, b)

    today = datetime.now(timezone.utc).date().isoformat()

    notes = (
        "Ronald L. Conte Jr. translation, 2004-2009, from the Clementine "
        "Vulgate with Challoner Douay-Rheims as English guide; no imprimatur, "
        "not submitted for ecclesiastical review (translator's own choice). "
        "Latest known errata: 2025-02-26. See docs/research/bible-texts.md "
        "for the doctrinal-fidelity assessment and known translation "
        "eccentricities (e.g. John 1:1 Latin word order; Matt 1:25 'yet' for "
        "donec)."
    )
    if sample:
        notes = (
            "SAMPLE RUN for review only — contains Philemon (complete) and "
            "John (chapters 1-3 only). Not the full 73-book corpus. " + notes
        )

    manifest = {
        "id": "bible.cpdv.en",
        "type": "bible",
        "title": "Catholic Public Domain Version",
        "short_title": "CPDV",
        "language": "en",
        "edition": "2009, per errata of 2025-02-26 where stated",
        "sources": [
            {"url": BASE_URL + "index.htm", "retrieved_at": today},
        ],
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": "Entire text, including all html and css code, is in the public domain. No copyright.",
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
        "corrections_applied": corrections_applied,
    }
    write_json(WORK_DIR / "manifest.json", manifest)


def write_json(path: Path, obj) -> None:
    path.write_text(
        json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--sample",
        action="store_true",
        help="Only scrape Philemon (complete) and John (chapters 1-3) for review.",
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Never touch the network; fail if a required page isn't cached.",
    )
    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Bypass the cache and re-fetch every page from the network.",
    )
    args = parser.parse_args()

    book_docs, _ = run_scrape(
        sample=args.sample, offline=args.offline, refresh=args.refresh
    )

    total_verses = print_summary(book_docs)

    if ANOMALIES:
        print(f"\n{len(ANOMALIES)} source anomalies noted during parsing:")
        for a in ANOMALIES:
            print(f"  [{a.osis}] {a.detail}")

    ok, report = validate(book_docs, sample=args.sample)
    print()
    if report:
        for line in report:
            print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    corrections = load_corrections(WORK_ID)
    try:
        applied, _seen = apply_corrections(
            book_docs, corrections, full_run=not args.sample
        )
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    corrections_count = write_corrections_receipt(
        WORK_DIR, applied, corrections, generated_at
    )
    print(
        f"\nCorrections layer: {corrections_count} applied, "
        f"{len([c for c in corrections if c.get('resolution')])} documented unresolved/"
        "not-a-defect (see corrections-applied.json)"
    )

    write_output(
        book_docs,
        sample=args.sample,
        total_verses=total_verses,
        corrections_applied=corrections_count,
        generated_at=generated_at,
    )
    print(f"\nWrote {len(book_docs)} book file(s) to {WORK_DIR}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
