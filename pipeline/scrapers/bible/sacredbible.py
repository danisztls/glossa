"""The page format shared by the two sacredbible.org Bibles.

WHY THIS IS ITS OWN MODULE AND NOT `common.py`. `common.py` takes only what
is identical across scrapers *and* has no per-source behaviour. Everything
here is the opposite of that second half: it is intensely per-source -- the
`{chapter:verse}` marker, the `[<A NAME=n>...]` chapter anchor, the
`<!-- begin -->`/`<!-- end -->` body fence, the cp1252 decode -- and it is
shared for exactly one reason, that `sacredbible.org/catholic/` (CPDV) and
`sacredbible.org/vulgate1914/` (Clementine Vulgate) are the same operator
serving the same hand-built template. Verified by fetching Philemon from
both: the markup differs only in the language of the words inside it.

So the boundary is "one host's page format", not "generic scraping". A third
scraper against a different site must not import this; it would be importing
a coincidence.

WHAT STAYS IN THE SCRAPERS, deliberately, in the spirit of `common.py`'s own
list of things that only look duplicated:

  - **The `BOOKS` table and the manifest.** Per work, obviously.
  - **Expected book/chapter counts and the chapter-opening-capital check.**
    These assert things about *an edition*, not about the template. CPDV's
    lowercase-opening check is documented there as earning its place by
    catching the sixth lost capital after the Portuguese source had five;
    the Vulgate's is a different claim about a different text.
  - **The rate limit.** Same host and so genuinely the same number today,
    but `common.py` records why a shared rate-limit constant is a bad idea
    even when the numbers agree, and being the same host does not make it a
    better one -- it makes the two scrapers' politeness budgets add up when
    both run, which is an argument for keeping each visible in its own file.

`Fetcher` IS shared here, unlike across the four unrelated scrapers, because
these two have no differences to preserve: same encoding hazard, same
cache-first policy, same absence of retry logic. It is now a thin adapter over
`common.Fetcher` -- what stayed here is the base-URL prefixing and the httpx
client's lifetime, and what moved into `FetchPolicy` is this host's floor,
including the fact that it is spent after a request rather than before one.
"""

from __future__ import annotations

import html
import re
import sys
from dataclasses import dataclass
from pathlib import Path

import httpx

# `common` is a package one directory up. Python puts a script's own directory
# on sys.path at startup -- which is what made a bare `import common` work while
# these files sat beside it -- and since the move into bible/ and ccc/ that
# directory is no longer the one holding it. Hence this, and hence the imports
# below it being the only ones not at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Imported as a module, not by name: this file's own public class is called
# `Fetcher` (cpdv.py and vulgate.py import it as such), and `common.Fetcher`
# is a different thing that it wraps.
import common

# A chapter heading, e.g.
#   [<A NAME=1><A HREF=#top class=chapter>John 1</A></A>]
# The unclosed-then-doubly-closed <A> nesting is the source's, not a typo.
CHAPTER_RE = re.compile(
    r"^\[<A NAME=(\d+)><A HREF=#top class=chapter>([^<]*)</A></A>\]$", re.IGNORECASE
)
# A verse marker, e.g. the `{1:1}` in `{1:1} In principio creavit Deus...`.
# Searched for anywhere in a segment rather than anchored to its start, so
# that two verses the source failed to separate still parse as two -- see
# `parse_book`.
VERSE_MARKER_RE = re.compile(r"\{(\d+):(\d+)\}")

TAG_RE = re.compile(r"<[^>]*>")
WS_RE = re.compile(r"\s+")

# Substrings that must never appear in cleaned verse text. These are the
# signatures of decoding the cp1252 bytes as UTF-8 (or vice versa), which is
# the one way these pages go wrong silently -- the text still reads, it just
# reads with 'Ã©' in it.
MOJIBAKE_MARKERS = ["\N{REPLACEMENT CHARACTER}", "Ã©", "â€™", "â€œ", "â€"]


def clean_text(raw: str) -> str:
    """Strip HTML tags/entities from a verse's raw text and normalize whitespace."""
    no_tags = TAG_RE.sub("", raw)
    unescaped = html.unescape(no_tags)
    # cp1252 has no NBSP glyph issue after decode, but entities may still
    # introduce \xa0; fold it into a normal space before collapsing.
    unescaped = unescaped.replace("\xa0", " ")
    return WS_RE.sub(" ", unescaped).strip()


@dataclass
class Anomaly:
    osis: str
    detail: str


def parse_book(osis: str, raw_html: str) -> tuple[list[dict], list[Anomaly]]:
    """Parse a decoded book page into `[{n, verses:[{n,text}]}]` plus anomalies.

    Anomalies are RETURNED rather than appended to a module global so that
    two scrapers importing this cannot silently share one bucket. Each keeps
    its own list and prints its own summary.
    """
    begin = raw_html.find("<!-- begin -->")
    end = raw_html.find("<!-- end -->")
    body = raw_html[begin:end] if begin != -1 and end != -1 else raw_html

    segments = re.split(r"<BR>", body, flags=re.IGNORECASE)

    anomalies: list[Anomaly] = []
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

        # A segment normally holds exactly one verse, because the source puts
        # a <BR> between them. Twice in the 1914 Vulgate it does not
        # (2 Reges 8:5-6 and Nehemias 3:15-16), which glues two verses into
        # one segment. Splitting on every marker rather than matching one at
        # the segment start recovers the second verse instead of losing it
        # and leaving its `{c:v}` marker embedded in the first verse's text.
        # The defect is REPORTED as an anomaly, not silently repaired: the
        # source is still wrong and the run summary should say so.
        markers = list(VERSE_MARKER_RE.finditer(seg))
        if markers:
            if len(markers) > 1:
                joined = " ".join(m.group(0) for m in markers)
                anomalies.append(
                    Anomaly(
                        osis,
                        f"missing <BR> in source glued {joined} into one segment; "
                        "split on the markers",
                    )
                )
            for i, m in enumerate(markers):
                c, v = int(m.group(1)), int(m.group(2))
                stop = markers[i + 1].start() if i + 1 < len(markers) else len(seg)
                text = clean_text(seg[m.end() : stop])
                if not text:
                    anomalies.append(
                        Anomaly(osis, f"empty verse text at {c}:{v}, dropped")
                    )
                    continue
                if c not in chapters:
                    chapters[c] = []
                    chapter_order.append(c)
                    seen_verses[c] = set()
                if v in seen_verses[c]:
                    anomalies.append(
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
        # Hebrew...</i>" heading) or blank noise between verses -- ignored,
        # they carry no {c:v} marker so nothing is lost from the text.

    result = []
    for n in sorted(chapter_order):
        verses = sorted(chapters[n], key=lambda t: t[0])
        result.append({"n": n, "verses": [{"n": v, "text": t} for v, t in verses]})
    return result, anomalies


def verse_text_faults(text: str) -> list[str]:
    """Format-level defects in a cleaned verse, as short phrases for a report.

    These check that `clean_text` and the marker split actually did their
    job -- leftover markup, a marker that survived, whitespace that should
    have been collapsed, a bad decode. They say nothing about whether the
    text is the right text, which is each edition's own business.
    """
    faults: list[str] = []
    if "<" in text:
        faults.append("leftover '<' in text")
    if "{" in text or "}" in text:
        faults.append("leftover verse marker braces in text")
    if "  " in text:
        faults.append("double space in text")
    if text != text.strip():
        faults.append("leading/trailing whitespace")
    for marker in MOJIBAKE_MARKERS:
        if marker in text:
            faults.append(f"mojibake marker {marker!r} in text")
    return faults


def decode_cp1252(data: bytes) -> str:
    """Pages are served as cp1252 with no reliable charset declaration in the
    HTTP headers, so decoding is forced rather than sniffed -- trusting the
    transport produces mojibake on curly quotes, apostrophes and (in the
    Latin) the ae/oe ligatures."""
    return data.decode("cp1252")


class Fetcher:
    """Cache-first page fetcher for one sacredbible.org edition directory.

    An adapter over `common.Fetcher` rather than a fetcher of its own: it owns
    the httpx client that has to be closed, prefixes the base URL, and passes a
    filename where the shared fetcher wants a cache name. The conduct is
    declared as `FetchPolicy` -- including, importantly, that this host's floor
    is spent AFTER a request rather than before it.

    Raw bytes are cached verbatim, so `raw/` stays a record of what the server
    sent rather than of what we made of it.
    """

    def __init__(
        self,
        *,
        base_url: str,
        raw_dir: Path,
        user_agent: str,
        rate_limit_seconds: float,
        offline: bool,
        refresh: bool,
    ):
        self.base_url = base_url
        self.client = None if offline else httpx.Client(follow_redirects=True)
        self.fetcher = common.Fetcher(
            raw_dir,
            common.FetchPolicy(
                user_agent=user_agent,
                delay=rate_limit_seconds,
                # This host's floor has always been spent after the request
                # completes, not before it starts. Kept that way: the other
                # mode counts parsing toward the delay, so the same number
                # would make requests come sooner than they do today -- a
                # loosening of a self-imposed limit, and not this change's to
                # make.
                delay_before=False,
            ),
            transport=(
                common.httpx_transport(self.client) if self.client is not None else None
            ),
            decode=decode_cp1252,
            offline=offline,
            refresh=refresh,
        )

    def fetch(self, filename: str) -> str:
        """Return decoded (cp1252) HTML for a source page, cache-first."""
        return self.fetcher.fetch_str(self.base_url + filename, filename)

    def close(self):
        if self.client is not None:
            self.client.close()
