#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Write down what a sibling-language URL turned out to BE, from cache.

WHY THIS EXISTS. `vatican_docs.py` already knows: `parse_document` raises
`StubPageError` for a page that carries a masthead and no document, the run
reports it as `no-translation-stub`, and then the run ends and the knowledge
goes with it. `pipeline/translations-checked.json` is where that answer is
supposed to live -- `common/translations.py` says why at length -- but until
2026-08-29 it held 125 records, all of them Portuguese encyclicals, written
by a reconciliation pass in August. Meanwhile 619 stub pages sat under
`raw/`, 504 of them unrecorded, and every one of them was a question already
answered that nothing could answer twice without asking vatican.va again.

WHY IT IS A SEPARATE SCRIPT AND NOT A FLAG ON THE SCRAPER. Because
`common/translations.py` says a status is established by a deliberate act and
never as a side effect of a parse, and that rule is worth keeping: a scraper
that appends to its own input can turn one bad run into a permanent record.
This is the tool that half of the sentence "by hand, or by a tool that says
so" refers to.

IT COSTS NO REQUESTS. Every answer comes off a page already in `raw/`. That
is the whole reason the statuses are cheap to write and expensive to lose.

WHAT IT WILL NOT DO. It records a status only for a page the real parser
rejects, and the rejection has to be `StubPageError` -- the same test
`vatican_docs` applies, imported rather than reimplemented, because a
threshold copied into a second file is a threshold that drifts. A raw page
with no work directory that PARSES is a parse this scraper lost, not a
translation that does not exist; it is printed and nothing is written for it.

  ./record_translations.py            # report what it would add
  ./record_translations.py --write    # merge into translations-checked.json
"""

from __future__ import annotations

import argparse
import collections
import json
import re
import sys
from pathlib import Path

import common
import vatican_docs as V

#: Families whose works are documents with sibling-language editions. `index`
#: pages live under the same directory and are not documents.
FAMILIES = ("encyclical", "exhortation", "vatii")

#: Which surviving edition of a document carries the record. The field is
#: per-work (`docs/corpus-schema.md` #Documents) and the fact is per
#: (document, language), so one edition has to hold it; English first keeps
#: the 125 records already written where they are, and the rest is a fixed
#: order so that re-running this cannot move a record to a different sibling.
ANCHOR_ORDER = ("en", "it", "la", "pt", "es", "fr", "de", "pl", "ar", "ru")

#: A stub that offers the document as a PDF *in the language asked for* is
#: not the same absence as a stub that offers nothing. The edition EXISTS;
#: vatican.va publishes it in a format nothing here reads. Matching the
#: language suffix is what makes it evidence -- every page links siblings'
#: PDFs too. The mirror's own codes apply, so Latin arrives as `_lt`.
_PDF_HREF_RE = re.compile(r'href="(/content/dam/[^"]+?_([a-z]{2})\.pdf)"')
PDF_LANG_FROM_SUFFIX = {"lt": "la"}


def raw_pages() -> list[tuple[str, str, str, Path]]:
    """`(family, slug, lang, path)` for every document page under `raw/`."""
    out = []
    for path in sorted(V.RAW_ROOT.glob("*.html")):
        family, _, rest = path.stem.partition("__")
        if family not in FAMILIES:
            continue
        slug, _, lang = rest.rpartition("__")
        if slug:
            out.append((family, slug, lang, path))
    return out


def pdf_for(html: str, lang: str) -> str | None:
    """The page's link to its own text as a PDF in `lang`, if it prints one."""
    for href, suffix in _PDF_HREF_RE.findall(html):
        if PDF_LANG_FROM_SUFFIX.get(suffix, suffix) == lang:
            return href
    return None


def classify(path: Path, lang: str, work_id: str) -> tuple[str, str]:
    """`(status, note)` for one raw page, or `("", reason)` when it parses.

    The parse is the real one. `repair_markup` runs first for the same reason
    it runs in the scraper -- a page whose markup is broken enough to hide its
    own body would otherwise measure as a stub."""
    html = path.read_text(encoding="utf-8", errors="replace")
    try:
        V.parse_document(V.repair_markup(html, work_id), lang, [], "")
    except V.StubPageError:
        href = pdf_for(html, lang)
        if href:
            return "pdf-only", f"the page's only text link is {href}"
        # No note: the status is the whole finding, and 613 copies of one
        # sentence is not evidence. `pdf-only` keeps one because the href is
        # what makes it that rather than a bare stub, and it varies.
        return "stub-page", ""
    # Reported, never recorded: an unrecognised failure is a parse this
    # scraper lost, and a ledger record would claim the opposite.
    except Exception as exc:
        return "", f"{type(exc).__name__}: {exc}"
    return "", "parses to a real document"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--write", action="store_true", help="merge into translations-checked.json"
    )
    args = ap.parse_args()
    common.require_corpus()

    build = V.BUILD_ROOT
    built = {d.name for d in build.iterdir() if d.is_dir()} if build.exists() else set()
    captured = json.loads((V.RAW_ROOT / "captured-at.json").read_text(encoding="utf-8"))
    ledger = json.loads(common.TRANSLATIONS_CHECKED_PATH.read_text(encoding="utf-8"))
    known = {(r["work"], r["lang"]) for r in ledger}

    editions: dict[tuple[str, str], set[str]] = collections.defaultdict(set)
    for name in built:
        family, _, rest = name.partition(".")
        slug, _, lang = rest.rpartition(".")
        if family in FAMILIES and slug:
            editions[(family, slug)].add(lang)

    added: list[dict] = []
    examined = already = 0
    counts: collections.Counter = collections.Counter()
    unexplained: list[str] = []
    for family, slug, lang, path in raw_pages():
        if f"{family}.{slug}.{lang}" in built:
            continue
        anchor = next(
            (x for x in ANCHOR_ORDER if x in editions[(family, slug)]),
            None,
        )
        if anchor is None:
            # No edition of this document survives, so there is no work to
            # hang the record on. Nothing is lost: a document absent in every
            # language is absent from the corpus, which is not ambiguous.
            counts["no surviving edition"] += 1
            continue
        work = f"{family}.{slug}.{anchor}"
        status, note = classify(path, lang, f"{family}.{slug}.{lang}")
        if not status:
            unexplained.append(f"{family}.{slug}.{lang}: {note}")
            continue
        counts[status] += 1
        examined += 1
        if (work, lang) in known:
            already += 1
            continue
        added.append(
            {
                "work": work,
                "lang": lang,
                "status": status,
                # The day vatican.va answered, not the day this ran. The
                # answer is the fetch; re-reading a cached page establishes
                # nothing new, and dating it today would claim it did.
                "checked_at": captured.get(path.name, ""),
                **({"note": note} if note else {}),
            }
        )

    for line in unexplained:
        print(f"UNEXPLAINED (recorded nothing): {line}")
    print(f"pages examined without a work directory: {examined}")
    for status, n in sorted(counts.items()):
        print(f"  {status:22} {n}")
    print(f"already in the ledger: {already}")
    print(f"new records: {len(added)}")
    for lang, n in collections.Counter(r["lang"] for r in added).most_common():
        print(f"  {lang:4} {n}")

    if not args.write:
        print("\n(dry run -- pass --write to merge)")
        return 0
    merged = sorted(ledger + added, key=lambda r: (r["work"], r["lang"]))
    common.TRANSLATIONS_CHECKED_PATH.write_text(
        json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nwrote {len(merged)} records to {common.TRANSLATIONS_CHECKED_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
