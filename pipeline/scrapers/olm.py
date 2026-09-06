#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Ordo Lectionum Missae 1981, read off the scan, as an ORACLE.

WHAT THIS IS FOR. `lectionary.py` reads USCCB's daily pages, which print the
United States' adaptation: its psalms are numbered the modern way, its calendar
is the United States', and a handful of its pericopes differ from the typical
edition outright. This reads the typical edition itself and answers ONE
question -- which passages does entry N appoint -- so the two can be diffed.
It serves nothing. `site/src/lib/lectionary/table.json` is what the site
renders; this is what says whether that table is right.

WHY THE DjVu XML AND NOT THE PDF OR THE PLAIN TEXT. The book sets two columns
and its slot labels centred across both, so `_djvu.txt` linearises into
unusable order -- which is the observation that made USCCB the source in the
first place. But the XML derivative keeps a bounding box on every word, and
that is enough to put the page back together: group words into lines by a y
tolerance, then read each line left to right. The difference is not marginal.
Reading the words in raw coordinate order finds 1,215 citations, because the
words of `Rom 2, 1-11` stop being adjacent and the regex sees nothing; reading
them line by line finds 3,886. The scan was never the problem, the reading
order was.

HOW AN ENTRY NUMBER IS TOLD FROM EVERY OTHER NUMERAL, which takes three weak
signals because no one of them is sufficient:

  - It is SET LARGE. The Praenotanda's footnotes are numbered too and were
    half the first chain -- `1 Cf. praesertim Concilium Vaticanum II` is not
    lectionary number 1. Footnotes run h~20-31 against an entry's h~43-46.
  - It OPENS A COLUMN. Requiring the left margin instead cost 307 of 1,026:
    an entry beginning in the right column carries its number at x~1400, in
    the middle of a line whose left half belongs to the entry above.
  - It CONTINUES THE SEQUENCE. The numbers run 1..N in order through the book,
    so a candidate is kept only if it is larger than the last kept and not
    absurdly further on. This is what excludes the running header's page
    number, which is also a large numeral.

WHAT IT DELIBERATELY DOES NOT READ. Not the slot labels, and not which of Anno
I and Anno II a weekday reading belongs to. The labels are precisely the half
OCR destroys -- they arrive as `LEecrio. Í` and `PsALMUS RESP.` -- and an
oracle does not need them: knowing the SET of passages entry N appoints is
enough to catch a wrong pericope, a wrong chapter, or a psalm off by the
Vulgate shift, which is every failure the USCCB adaptation can produce. The
slot and the year are what USCCB reads well, and neither source is asked for
the half it reads badly.

WHERE THE OUTPUT LIVES, and why not `oracles/`. It goes to `build/`, because a
stage regenerates it from `raw/` with no network, and that is the whole of the
test the root CLAUDE.md sets. `oracles/` is for what was read off a page BY
HAND and which nothing regenerates. Being an oracle is what this output is
FOR; it is not where it belongs.

COVERAGE IS REPORTED, NOT ASSUMED. The run prints how many of the printed
numbers it recovered and how many carry at least one citation, and the figures
go into the output. An oracle that quietly has no opinion about a third of the
book would agree with anything.
"""

from __future__ import annotations

import argparse
import re
import sys
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from io import BytesIO
from urllib.parse import quote

from common import (
    Fetcher,
    FetchError,
    FetchPolicy,
    book_form_pattern,
    book_forms,
    build_root,
    raw_root,
    require_corpus,
    write_stamped_json,
)

SOURCE_DIR_NAME = "olm1981"
OUTPUT_DIR_NAME = "olm1981"

#: archive.org item and the derivative wanted. The identifier is stable and the
#: derivative names itself after the item's title, spaces and parentheses and
#: all, so it is quoted rather than hand-escaped.
ITEM = "OLM1981"
DERIVATIVE = "Ordo lectionum Missae (editio typica altera, 1981)_djvu.xml"
URL = f"https://archive.org/download/{ITEM}/{quote(DERIVATIVE)}"
CACHE_NAME = "olm1981.djvu.xml"

#: One artifact, fetched once, ever. The delay is a formality at that size but
#: is stated rather than left at zero, because a policy that says "no limit"
#: reads as a decision nobody made.
POLICY = FetchPolicy(
    user_agent="GlossaCatholicaBot/1.0 (+https://glossa.catholic; lectionary oracle)",
    delay=2.0,
    attempts=3,
    backoff=(5.0, 30.0),
    timeout=300.0,
)

#: An entry number is set at least this tall. Footnote numerals run to ~31 and
#: body text to ~44; the gap between the two is where this sits.
MIN_HEIGHT = 36

#: White space to the left of a numeral that marks it as opening a column.
COLUMN_GAP = 90

#: A numeral above this is inside the running header, not the text block.
HEADER_Y = 260

#: How much larger than the last kept number a candidate may be. The book skips
#: no numbers, but the reader does -- a missed one must not end the chain.
MAX_JUMP = 12

#: Chapter, then verses: `Rom 2, 1-11`, `Ps 61, 2-3. 6-7. 9`, `Eph. 1, 1-10`.
#: Latin cites separate chapter from verse with a comma and verse groups with
#: periods, which is why this cannot be shared with the English-facing parsers.
_VERSES = r"\d[\dab\s.\-—–]*"


def load_pages(data: bytes) -> list[dict]:
    """The scan as pages of positioned words.

    `coords` is `x0,y1,x1,y0` -- the second value is the TOP edge in DjVu's
    bottom-left origin, so the pair is read in that order and stored as a
    plain top-down box.
    """
    pages: list[dict] = []
    current: dict | None = None
    for event, element in ET.iterparse(BytesIO(data), events=("start", "end")):
        if event == "start" and element.tag == "OBJECT":
            current = {"w": int(element.get("width", 0)), "words": []}
        elif event == "end" and element.tag == "WORD" and current and element.text:
            coords = element.get("coords", "").split(",")
            if len(coords) >= 4:
                x0, y1, x1, y0 = (int(v) for v in coords[:4])
                current["words"].append(
                    {"x0": x0, "y0": y0, "x1": x1, "y1": y1, "t": element.text}
                )
        elif event == "end" and element.tag == "OBJECT":
            pages.append(current or {"w": 0, "words": []})
            current = None
            element.clear()
    return pages


def lines(page: dict, tolerance: int = 18) -> list[list[dict]]:
    """The page's words grouped into lines, each read left to right.

    THE WHOLE PARSE TURNS ON THIS. A line's words do not share a y to the
    pixel, so ordering words by y alone interleaves neighbouring lines and the
    two columns, and a citation stops being contiguous text.
    """
    ordered = sorted(page["words"], key=lambda w: (w["y0"], w["x0"]))
    out: list[list[dict]] = []
    current: list[dict] = []
    last: int | None = None
    for word in ordered:
        if last is None or abs(word["y0"] - last) <= tolerance:
            current.append(word)
        else:
            out.append(sorted(current, key=lambda w: w["x0"]))
            current = [word]
        last = word["y0"]
    if current:
        out.append(sorted(current, key=lambda w: w["x0"]))
    return out


def tokenise(pages: list[dict]) -> list[dict]:
    """Every word in reading order, each knowing the page and gap before it."""
    tokens: list[dict] = []
    for index, page in enumerate(pages):
        for line in lines(page):
            for position, word in enumerate(line):
                tokens.append(
                    {
                        "page": index,
                        "t": word["t"],
                        "x0": word["x0"],
                        "y0": word["y0"],
                        "h": word["y1"] - word["y0"],
                        "gap": None
                        if position == 0
                        else word["x0"] - line[position - 1]["x1"],
                    }
                )
    return tokens


def entry_numbers(tokens: list[dict]) -> list[tuple[int, int, int]]:
    """`(index into tokens, number, page)` for each entry, in book order.

    The longest ascending chain starting from a low number wins; see the
    docstring above for why none of the three signals decides this alone.
    """
    numeral = re.compile(r"^(\d{1,4})$")
    candidates = [
        (i, int(tok["t"]), tok["page"])
        for i, tok in enumerate(tokens)
        if numeral.match(tok["t"])
        and tok["y0"] > HEADER_Y
        and tok["h"] >= MIN_HEIGHT
        and (tok["gap"] is None or tok["gap"] >= COLUMN_GAP)
    ]

    def walk(start: int) -> list[tuple[int, int, int]]:
        kept = [candidates[start]]
        for candidate in candidates[start + 1 :]:
            if kept[-1][1] < candidate[1] <= kept[-1][1] + MAX_JUMP:
                kept.append(candidate)
        return kept

    best: list[tuple[int, int, int]] = []
    for start, (_, number, _) in enumerate(candidates):
        if number <= 3:
            chain = walk(start)
            if len(chain) > len(best):
                best = chain
    return best


def _tidy(verses: str) -> str:
    return re.sub(r"\s+", " ", verses.replace("—", "-").replace("–", "-")).strip(" .,-")


def citation_pattern() -> re.Pattern[str]:
    """Latin book forms from the site's own grammar -- never a second list.

    `common/book_forms.py` states the rule and the reason: the table that
    decides what is a citation and the table that decides what links may not
    disagree about what a book is called.
    """
    return re.compile(
        rf"\b({book_form_pattern('la')})\s*\.?\s+(\d{{1,3}})\s*,\s*({_VERSES})"
    )


def citations(
    text: str, pattern: re.Pattern[str], to_osis: dict[str, str]
) -> list[dict]:
    """Every distinct citation in an entry's text, in the order printed."""
    seen: set[tuple[str, int, str]] = set()
    out: list[dict] = []
    for match in pattern.finditer(text):
        book, chapter, verses = (
            match.group(1),
            int(match.group(2)),
            _tidy(match.group(3)),
        )
        key = (book, chapter, verses)
        if not verses or key in seen:
            continue
        seen.add(key)
        out.append(
            {
                "osis": to_osis.get(book, ""),
                "ch": chapter,
                "v": verses,
                "raw": f"{book} {chapter}, {verses}",
            }
        )
    return out


def read_entries(pages: list[dict]) -> tuple[dict[str, dict], dict[str, int]]:
    """`{number: {page, citations}}`, plus what the run recovered."""
    tokens = tokenise(pages)
    chain = entry_numbers(tokens)
    pattern = citation_pattern()
    to_osis = {form: osis for osis, forms in book_forms("la").items() for form in forms}

    entries: dict[str, dict] = {}
    for position, (index, number, page) in enumerate(chain):
        end = chain[position + 1][0] if position + 1 < len(chain) else len(tokens)
        text = " ".join(tok["t"] for tok in tokens[index:end])
        entries[str(number)] = {
            "page": page,
            "citations": citations(text, pattern, to_osis),
        }

    printed = chain[-1][1] if chain else 0
    coverage = {
        "numbers_printed": printed,
        "numbers_read": len(entries),
        "with_citations": sum(1 for e in entries.values() if e["citations"]),
        "citations": sum(len(e["citations"]) for e in entries.values()),
        "unresolved_books": sum(
            1 for e in entries.values() for c in e["citations"] if not c["osis"]
        ),
    }
    return entries, coverage


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--offline", action="store_true", help="cache only; never fetch"
    )
    parser.add_argument("--refresh", action="store_true", help="ignore the cache")
    args = parser.parse_args()

    require_corpus()

    fetcher = Fetcher(
        cache_dir=raw_root() / SOURCE_DIR_NAME,
        policy=POLICY,
        offline=args.offline,
        refresh=args.refresh,
    )
    try:
        data = fetcher.fetch_bytes(URL, CACHE_NAME)
    except FetchError as error:
        print(f"olm: {error}", file=sys.stderr)
        return 1

    pages = load_pages(data)
    entries, coverage = read_entries(pages)
    if not entries:
        print(
            "olm: read no entry numbers at all -- the parse is broken", file=sys.stderr
        )
        return 1

    stamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload = {
        "source": {
            "item": ITEM,
            "derivative": DERIVATIVE,
            "url": URL,
            "pages": len(pages),
        },
        "edition": "Ordo Lectionum Missae, editio typica altera (1981)",
        "coverage": coverage,
        "entries": entries,
    }
    out_dir = build_root() / OUTPUT_DIR_NAME
    write_stamped_json(out_dir, {"lectionary.json": payload}, stamp)

    missing = coverage["numbers_printed"] - coverage["numbers_read"]
    print(
        f"olm: {len(pages)} pages, "
        f"{coverage['numbers_read']}/{coverage['numbers_printed']} entry numbers "
        f"({missing} not recovered), "
        f"{coverage['with_citations']} with citations, "
        f"{coverage['citations']} citations, "
        f"{coverage['unresolved_books']} of unknown book"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
