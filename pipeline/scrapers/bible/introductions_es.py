#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Straubinger's book introductions, as `bible-intro.es`.

NO NETWORKING HAPPENS HERE. Every page this scraper reads was fetched into
`corpus/raw/straubinger/` on 2026-08-28 by `capture.py` and is already parsed
for its verses by `straubinger.py`; this reads the one part of each book's
`index.html` that edition has no field for -- the introduction printed before
the book -- and writes it as a work keyed by LANGUAGE. Why that is a work of
its own rather than a field on the edition is `introductions.py`'s docblock
and docs/corpus-schema.md; the short form is that an introduction describes
the book, not the translation.

    <div class="intro-lbl">✦ Introducción de Monseñor Straubinger</div>
    <div class="intro-texto">Introducción Los cuatro libros de los Reyes …</div>

IT COVERS 56 OF 73 BOOKS, AND THE 17 MISSING ARE THE SOURCE'S DOING. All 73
pages carry an `intro-texto` under the same label, but only 56 of them are
Straubinger's introduction:

  - 15 ARE CUT MID-WORD AT 4,000 CHARACTERS. The clamp is the server's, not
    the capture's -- the live page and a Wayback snapshot five months older
    stop at the same word of Genesis -- so it is a property of the site's
    stored data, and the `/data/` JSON where the unclipped text would be is
    `Disallow:` in its robots.txt. `bibliastraubinger.com`, the second witness
    for that site's five missing chapters, publishes no introductions at all.
    Declared in `TRUNCATED_AT_SOURCE` with the length measured, so the day the
    site stores them whole this scraper fails and says so.
  - 2 ARE NOT STRAUBINGER'S PROSE. Números and 1 Tesalonicenses carry a modern
    editorial summary under his name -- and serving those as his would publish
    a false attribution, which is the one failure this work cannot recover
    from by re-parsing. Declared in `NOT_STRAUBINGER`, with the evidence.

THE DAGGER IS THE ORACLE. Straubinger's introductions end on `†` and nothing
else in the block does: 56 end with it, and every page that does not either
stops at the clamp or is one of the two summaries. So completeness is read off
the text rather than off its length, and the two tables above are checked
against that reading rather than trusted. The `†` itself is an end-mark rather
than a word, and is dropped from what the site serves.

A BOOK WITHOUT AN INTRODUCTION IS AN ORDINARY ABSENCE, not a defect to work
around: `bible-intro.en` covers 71 of 73 for a reason of its own, and the site
serves a missing introduction exactly as it serves a chapter its reader's
edition does not print (docs/corpus-schema.md §Book introductions).

Usage:
    uv run pipeline/scrapers/bible/introductions_es.py

Ends with a validation pass that exits non-zero on failure.
"""

from __future__ import annotations

import html
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line is
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    build_root,
    captured_at,
    require_corpus,
    write_stamped_json,
)

# The 73-book table and the site it was captured from belong to the edition's
# own parser, which verified the slugs against the source's index page. A
# second copy here is a second thing that can drift.
from straubinger import SITE_BASE, SLUG_OSIS, raw_dir

WORK_ID = "bible-intro.es"

#: The label the site prints above every introduction. Checked rather than
#: assumed: it is the source's own attribution, and this work reproduces it as
#: "Straubinger's introductions" on that basis alone.
EXPECTED_LABEL = "✦ Introducción de Monseñor Straubinger"

#: Straubinger's own end-mark, and the completeness oracle -- see the docblock.
END_MARK = "†"

#: `slug -> the length the source truncates that introduction to`. Fifteen
#: books, all cut mid-word. The length is declared rather than tolerated by a
#: threshold so that a source that later stores the whole text FAILS here
#: instead of quietly staying excluded; two of the fifteen stop at 3,999
#: because the clamp counts a character this transcription does not print.
TRUNCATED_AT_SOURCE: dict[str, int] = {
    "1juan": 4000,
    "1pedro": 4000,
    "apocalipsis": 4000,
    "cantares": 4000,
    "daniel": 3999,
    "deuteronomio": 4000,
    "eclesiastes": 4000,
    "eclesiastico": 4000,
    "genesis": 4000,
    "hechos": 4000,
    "josue": 4000,
    "levitico": 4000,
    "romanos": 4000,
    "sabiduria": 4000,
    "salmos": 3999,
}

#: `slug -> why the text under Straubinger's name is not his`. Both are a
#: third the median length, neither ends on his `†`, and Números explains its
#: own book as "compuesto con diversas fuentes antiguas reunidas por la
#: tradición sacerdotal" -- source criticism a 1944 Catholic introduction does
#: not write.
NOT_STRAUBINGER: dict[str, str] = {
    "numeros": "modern editorial summary; documentary-hypothesis vocabulary",
    "1tesalonicenses": "modern editorial summary; no end-mark, 141 words",
}

#: Labels the source leaves inside the text itself, having no element of its
#: own for them. Dropped only at the very start of a block, and only as whole
#: words: "Introducción" opens 14 of the 56, and `GÉNESIS es una palabra
#: griega` opens one where the capitals are the sentence's own subject, so a
#: rule about capitals would take the second with the first.
LEADING_LABELS = ("Introducción", "Nota introductoria")

INTRO_RE = re.compile(r'<div class="intro-texto"[^>]*>(.*?)</div>', re.DOTALL)
LABEL_RE = re.compile(r'<div class="intro-lbl"[^>]*>(.*?)</div>', re.DOTALL)


def work_dir() -> Path:
    return build_root() / WORK_ID


def plain_text(fragment: str) -> str:
    """The block's text: entities resolved, whitespace collapsed.

    No tag stripping is needed and none is done -- `intro-texto` carries no
    markup at all in this capture (checked: 0 inline tags across all 73), and
    a stripper here would silently paper over the day it does."""
    return html.unescape(re.sub(r"\s+", " ", fragment)).strip()


def read_intro(slug: str) -> tuple[str, str]:
    """`(label, text)` off one book's index page, verbatim."""
    page = raw_dir() / slug / "index.html"
    markup = page.read_text(encoding="utf-8")
    intro = INTRO_RE.search(markup)
    label = LABEL_RE.search(markup)
    if not intro or not label:
        raise SystemExit(f"{slug}: no intro-texto/intro-lbl block in {page}")
    return plain_text(label.group(1)), plain_text(intro.group(1))


def serve_text(text: str) -> str:
    """What the site shows: the introduction without the source's furniture.

    The trailing `†` is an end-mark and the leading `Introducción` is the
    heading of a section the site renders as one undivided string; neither is
    a word Straubinger wrote in the sentence it sits beside. Both are
    recoverable from `raw/` by re-parsing, like every other v1 loss."""
    text = text.removesuffix(END_MARK).strip()
    for label in LEADING_LABELS:
        if text.startswith(label + " "):
            text = text[len(label) :].strip()
    return text


def classify(text: str) -> str:
    """`complete`, `truncated`, or `other` -- read off the text, not a table."""
    if text.endswith(END_MARK):
        return "complete"
    if len(text) >= min(TRUNCATED_AT_SOURCE.values()):
        return "truncated"
    return "other"


def read_all() -> dict[str, dict]:
    """Every book's introduction as captured, keyed by the source's slug."""
    out: dict[str, dict] = {}
    for osis, slug in SLUG_OSIS:
        label, text = read_intro(slug)
        out[slug] = {
            "osis": osis,
            "label": label,
            "text": text,
            "chars": len(text),
            "kind": classify(text),
        }
    return out


def edition_books() -> set[str]:
    """The OSIS codes `bible.straubinger.es` actually prints.

    The mapping oracle, and the reason this stage `needs` that one: an
    introduction filed against a book the edition does not hold would publish
    an address to a chapter 0 of nothing. Empty when the edition is not in the
    corpus, which the caller reports as a skipped check rather than a pass."""
    books_dir = build_root() / "bible.straubinger.es" / "books"
    return (
        {path.stem for path in books_dir.glob("*.json")}
        if books_dir.is_dir()
        else set()
    )


def validate(read: dict[str, dict], entries: list[dict]) -> tuple[bool, list[str]]:
    """Check the reading against both declared tables and against the edition."""
    report: list[str] = []
    ok = True

    labels = {row["label"] for row in read.values()}
    if labels == {EXPECTED_LABEL}:
        report.append(f"OK: all {len(read)} pages carry the same attribution label")
    else:
        ok = False
        report.append(f"FAIL: unexpected intro label(s): {sorted(labels)}")

    found = {
        kind: {s for s, r in read.items() if r["kind"] == kind}
        for kind in ("complete", "truncated", "other")
    }
    declared_truncated = set(TRUNCATED_AT_SOURCE)
    declared_other = set(NOT_STRAUBINGER)

    if found["truncated"] == declared_truncated:
        report.append(
            f"OK: {len(declared_truncated)} introduction(s) still truncated at source, as declared"
        )
    else:
        ok = False
        report.append(
            f"FAIL: truncation set moved -- now {sorted(found['truncated'])}, "
            f"declared {sorted(declared_truncated)}. A source that stores them whole "
            f"is a reason to ingest them, not to widen the table."
        )

    mismeasured = [
        f"{slug} ({read[slug]['chars']}, declared {TRUNCATED_AT_SOURCE[slug]})"
        for slug in sorted(declared_truncated & found["truncated"])
        if read[slug]["chars"] != TRUNCATED_AT_SOURCE[slug]
    ]
    if mismeasured:
        ok = False
        report.append(f"FAIL: truncation length changed for {', '.join(mismeasured)}")

    if found["other"] == declared_other:
        report.append(
            f"OK: {len(declared_other)} introduction(s) are the site's own summary, as declared "
            f"({', '.join(sorted(declared_other))})"
        )
    else:
        ok = False
        report.append(
            f"FAIL: non-Straubinger set moved -- now {sorted(found['other'])}, "
            f"declared {sorted(declared_other)}"
        )

    empty = [e["osis"] for e in entries if not e["blocks"][0]["text"].strip()]
    if empty:
        ok = False
        report.append(f"FAIL: {len(empty)} intro(s) built but empty: {empty}")

    keeps_marker = [e["osis"] for e in entries if END_MARK in e["blocks"][0]["text"]]
    if keeps_marker:
        ok = False
        report.append(f"FAIL: end-mark left in served text: {keeps_marker}")

    ours = {e["osis"] for e in entries}
    theirs = edition_books()
    if not theirs:
        report.append(
            "SKIP: bible.straubinger.es not in the corpus; mapping oracle not run"
        )
    elif ours <= theirs:
        report.append(
            f"OK: all {len(ours)} introductions name a book bible.straubinger.es prints"
        )
    else:
        ok = False
        report.append(
            f"FAIL: introductions for books the edition lacks: {sorted(ours - theirs)}"
        )

    # What an empty `shared_preface_with` asserts, asked of the texts: a source
    # printing one preface across two volumes prints it twice here, since every
    # book has a page of its own to print it on.
    texts = [entry["blocks"][0]["text"] for entry in entries]
    if len(set(texts)) == len(texts):
        report.append(
            "OK: no two books share an introduction; no shared preface to declare"
        )
    else:
        ok = False
        report.append(
            "FAIL: two books carry the same introduction -- a shared preface, undeclared"
        )

    return ok, report


def build_entries(read: dict[str, dict]) -> list[dict]:
    """The 56 complete introductions, in `SLUG_OSIS`'s canonical order.

    One block each, because the source stores each introduction as a single
    undivided string: it prints no paragraph markup, and inventing breaks at
    sentence boundaries would be this project writing the shape rather than
    reading it."""
    return [
        {
            "osis": read[slug]["osis"],
            "blocks": [{"text": serve_text(read[slug]["text"])}],
        }
        for _osis, slug in SLUG_OSIS
        if read[slug]["kind"] == "complete"
    ]


def write_output(
    read: dict[str, dict], entries: list[dict], *, generated_at: str
) -> None:
    retrieved = (
        captured_at(raw_dir() / "genesis" / "index.html")
        or datetime.now(UTC).date().isoformat()
    )
    excluded = {*TRUNCATED_AT_SOURCE, *NOT_STRAUBINGER}
    absent = [osis for osis, slug in SLUG_OSIS if slug in excluded]
    manifest = {
        "id": WORK_ID,
        "type": "bible-intro",
        "title": "Introducciones a los libros",
        "short_title": "Introducciones",
        "language": "es",
        "edition": "Introducciones de Mons. Juan Straubinger",
        "sources": [{"url": f"{SITE_BASE}/biblia/genesis/", "retrieved_at": retrieved}],
        "copyright": {
            "status": "copyrighted",
            "holder": "Juan Straubinger",
            "notice": None,
        },
        "notes": (
            "Mons. Juan Straubinger's own introduction to each book, printed "
            "before the book on lasantabiblia.com.ar and captured with the "
            "edition itself (see bible.straubinger.es for the copyright term, "
            "which ends 1 January 2027). It covers 56 of 73 books, and the "
            "17 without one are the source's doing rather than a gap in the "
            "capture: 15 are stored truncated at 4,000 characters and stop "
            "mid-word (the live page and a five-month-older archived copy cut "
            "at the same word, and the site's own JSON is robots-disallowed), "
            "and 2 -- Numbers and 1 Thessalonians -- carry a modern editorial "
            "summary under Straubinger's name rather than his text, which is "
            "recorded here rather than reproduced as his. The books without "
            "an introduction are: " + ", ".join(absent) + ". Each "
            "introduction is one block: the source stores it as a single "
            "undivided string and prints no paragraph markup. The end-mark "
            "that closes each of them, and a leading 'Introducción' or 'Nota "
            "introductoria' label where the source leaves one inside the text, "
            "are dropped; corpus/raw/ holds every page verbatim."
        ),
        "generated_at": generated_at,
        "books": [entry["osis"] for entry in entries],
        # Empty, and checked rather than assumed: Straubinger writes the pairs
        # a shared preface would cover -- Samuel, Kings, Paralipomenon,
        # Maccabees, Corinthians -- an introduction each, and no two of the 56
        # share a text.
        "shared_preface_with": {},
    }

    write_stamped_json(
        work_dir(),
        {"manifest.json": manifest, "intros.json": entries},
        generated_at,
    )


def main() -> int:
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    print(f"Reading {len(SLUG_OSIS)} book pages from {raw_dir()}\n")
    read = read_all()
    entries = build_entries(read)

    for kind, label in (
        ("complete", "built"),
        ("truncated", "truncated at source"),
        ("other", "not Straubinger's"),
    ):
        slugs = sorted(s for s, r in read.items() if r["kind"] == kind)
        print(
            f"  {label:<22} {len(slugs):>2}  {', '.join(slugs) if kind != 'complete' else ''}"
        )

    words = sum(len(e["blocks"][0]["text"].split()) for e in entries)
    print(f"\n{len(entries)} introductions, {words} words total")

    ok, report = validate(read, entries)
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_output(read, entries, generated_at=generated_at)
    print(f"\nWrote {len(entries)} intro(s) to {work_dir()}")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
