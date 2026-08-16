#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Vatican II documents, papal encyclicals, apostolic exhortations, and CDF
documents -- English and Portuguese, from vatican.va.

Generalizes ccc.py's EN-mirror parser (same IntraText-family template, same
defensive posture toward sloppy/inconsistent HTML) to a much larger and more
heterogeneous document set. Where ccc.py and compendium.py each hardcode one
page template because their source is exactly one page shape, this scraper
crawls hundreds of documents spanning ~135 years (1891-2026) and at least
four distinct underlying page templates -- so every structural decision
below is made by *sniffing* the page rather than assuming a fixed shape.

Empirically confirmed templates (see survey doc + live fetches performed
2026-08-15, one document per case unless noted):

  PAGE SHELL (where the real content lives on the page):
    - "modern" shell: content/{pontiff}/{lang}/... pages (encyclicals,
      exhortations). Content sits inside `<div class="testo">` ... the
      literal HTML comment `<!-- /TESTO -->` closes it. Site nav/chrome
      (breadcrumbs, share buttons, footer) is built from <div>/<ul>/<svg>
      -- NOT <p> tags -- so it never surfaces as a text block once the
      <p> extractor requires a real tag-name boundary (see BLOCK_RE: a
      naive `<p[^>]*>` also matches `<path d=...>` inside inline SVG
      icons, which modern pages embed constantly for share/search icons;
      BLOCK_RE requires the char after "p" to be whitespace or ">").
    - "old" shell: archive/hist_councils/... (Vatican II) and
      roman_curia/congregations/.../documents/... (CDF) pages. Old
      table-layout HTML, no `testo` div. Content starts after the last
      `<hr>` before the first numbered paragraph (skips a TOC block, when
      present) and ends at a footnote-start boundary (see below).

  FOOTNOTE MARKER conventions (inline, in running prose) -- three found,
  auto-detected per page (a single document is internally consistent):
    - "sup": `<sup>...</sup>`, either bare (`<sup>2</sup>`, e.g. CDF's
      Dominus Iesus) or wrapping a self-link anchor
      (`<sup><a name="-1" href="#$1">1</a></sup>` or the href-encoded
      variant `href="#%241"` -- both seen; ccc.py's own EN CCC convention).
      Whichever it is, stripping the <sup>'s inner tags and checking
      "is it all digits" recovers the marker either way.
    - "ftn": Word-export footnote anchor pairs, `name="_ftnrefN"` inline
      / `name="_ftnN"` at the definition -- found on BOTH English (Rerum
      Novarum, 1891) and Portuguese (Centesimus Annus PT) pages, so this
      is an era/export-path artifact, not a language convention. Two
      sub-shapes seen: the visible number sits *inside* the anchor
      (`<a href="#_ftn1" name="_ftnref1">[1]</a>`, CA PT) or the anchor is
      empty and a plain "(N)" follows it as ordinary text immediately
      after (`<a name="_ftn39" href="#_ftnref39" class=" cleaner"></a>
      (39).`, RN EN) -- handled by matching on the anchor's `name`
      attribute (always present, always numeric) and separately trimming
      a redundant echoed "(N)"/"[N]" that immediately follows.
    - "paren": bare `(N)` inline, with an optional second series `(N*)`
      seen exactly once (Lumen Gentium's patristic "SUPPLEMENTARY NOTES",
      chapter-scoped -- see below). No anchors, no <sup> at all in the
      whole document; this is the fallback template.
  Per-page template is picked by presence of `_ftnref` first, then `<sup`,
  else "paren" -- checked in that order to avoid a false "sup" read on a
  page that happens to have a decorative superscript unrelated to notes.

  FOOTNOTE LIST (the definitions block, always found before parsing
  proper): every convention found puts exactly one footnote per <p> (or
  per <blockquote>) -- unlike ccc.py's PT mirror, which needed a
  sequential-scan-with-lookahead parser because footnotes there are NOT
  reliably one-per-<p>. That algorithm was ported here defensively as a
  fallback (see parse_footnote_entry's bare-number branch) but the
  common case is a direct per-block parse: try an anchor-based marker
  first (name="_ftnN" / name="$N" / name="%24N"), then a leading "(N)",
  then a leading bare "N". A block matching none of these is treated as
  a continuation of the previous footnote (rare, multi-<p> footnotes).

  FOOTNOTE-REGION START boundary (splits body from the footnote list) is
  the EARLIEST of: (a) a bold "NOTES" / "Notas" / "Referências" heading,
  (b) the first footnote-*definition*-style anchor (name="_ftnN" or
  name="$N"/"%24N" -- deliberately excluding the "-N"/"_ftnrefN" inline-
  reference anchors, which appear throughout the body), (c) the last
  `<hr>` in the document. (a)/(b) dominate when present; (c) is the
  fallback for the one template found with no heading and no anchors at
  all (CDF's Dominus Iesus: a bare `(N)` list after a single `<hr>`).
  This ordering was verified against Lumen Gentium specifically because
  it is the one adversarial case found: LG has a second `<hr>` mid-
  document (before an unnumbered "APPENDIX" -- the Council's own
  'Nota Praevia'-adjacent notificationes -- sitting between the last
  numbered paragraph and the real "NOTES" heading). Using the *heading
  text* as the primary signal, not "last <hr>", correctly skips over
  that appendix instead of misreading it as footnote content; the
  appendix itself becomes a structure node with a null paragraph span
  (corpus-schema.md's "unnumbered content" provision, already used by
  the CCC scraper) rather than being force-fit into the numbered stream.

  PARAGRAPH NUMBER, three variants (all confirmed live, combined into one
  regex -- PARA_NUM_RE): a bare leading digit+period ("2. Therefore..."),
  a self-link-anchored digit (`<a name="18">18</a>.`, Lumen Gentium: 8/69
  paragraphs use this form, the rest are bare -- both mean the same
  thing), and an `&nbsp;`-separated digit ("1.&nbsp; The Lord Jesus...",
  Dominus Iesus). One document, Rerum Novarum (1891), opens with a
  paragraph of unnumbered framing prose before its first numbered
  paragraph, which is "2." -- modeled the way ccc.py models its own
  first-paragraph special cases: if the very first number found in a
  document is 2 and exactly one prose block preceded it with no number
  of its own, that block is retroactively paragraph 1 (logged, not
  silently done).

  STRUCTURE headings: PART/SECTION/CHAPTER/ARTICLE, Roman numeral in every
  case found in this family (Gaudium et Spes: "PART I"/"CHAPTER I".."VIII"
  -- unlike the CCC's own word-spelled "PART ONE", these are genuinely
  Roman). All are printed as fully-bold <p> blocks, matching ccc.py's
  is_full_bold heading detector exactly. Any other fully-bold block
  (a document's own "INTRODUCTION", "CONCLUSION", a Blessing, LG's
  "SUPPLEMENTARY NOTES (*)") becomes a generic `sub` node, same fallback
  ccc.py uses for unrecognized bold headings.

  LUMEN GENTIUM'S CHAPTER-SCOPED STAR NOTES: LG alone (of everything
  fetched) prints a second, patristic footnote series, "(N*)" inline,
  under a "SUPPLEMENTARY NOTES (*)" heading near the end, organized as
  one flat list PER CHAPTER, each restarting at (1). A star marker is
  therefore only unique combined with the chapter it appears in --
  handled by keying that table on (chapter_n, n) rather than n alone,
  using whichever structure-stack chapter is open when the marker is
  encountered. Not generalized further: no other document sampled has
  this pattern, so it is treated as a documented, LG-specific case
  rather than folded into the generic footnote-table logic.

  DATE PARSING: filenames encode the promulgation date as 8 digits, but
  NOT consistently DDMMYYYY vs YYYYMMDD across families -- Vatican II and
  CDF filenames are YYYYMMDD ("19641121" = 1964-11-21), encyclical/
  exhortation filenames are DDMMYYYY ("01051991" = 1 May 1991). Rather
  than hardcode this per family (fragile -- some documents contradict the
  general pattern), both interpretations are tried and whichever yields a
  calendar-valid date wins; logged as an anomaly if neither does.

  LANGUAGE CODE: the archive/hist_councils (Vatican II) mirror uses "po"
  for Portuguese (matching ccc.py's PT_BASE convention); the modern
  content/{pontiff}/... pages use "pt". Both confirmed live.

Sources / URL patterns (see docstring on each discover_* function for the
exact shape):
  Vatican II index: https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm
  Encyclical index (per pontiff): https://www.vatican.va/content/{pontiff}/en/encyclicals.index.html
  Apostolic exhortation index (per pontiff): .../content/{pontiff}/en/apost_exhortations.index.html

Usage:
  uv run pipeline/scrapers/vatican_docs.py phase1 [--lang en|pt|both] [--sample]
  uv run pipeline/scrapers/vatican_docs.py phase2 [--pontiffs leo-xiii,pius-x,...]
                                                   [--time-budget SECONDS]
                                                   [--limit N]
  uv run pipeline/scrapers/vatican_docs.py discover-encyclicals   # index-only, no document fetches

Every fetched page (index pages and document pages alike) is cached under
corpus/raw/vatican-docs/ and reused offline on re-run -- phase 2 in
particular is designed to be interrupted and resumed: re-running the same
command after a partial run only fetches what's still missing, and a
document already written to corpus/works/ is left untouched (use
--overwrite to force a re-parse of an already-written document from its
cached raw HTML, no network needed).

NOTE ON THE TWO ROOTS: this file may run from a git worktree
(.claude/worktrees/*/), and the two things it touches want opposite
answers, so they are deliberately separate constants:

  DATA_ROOT -- where corpus/ lives. Hardcoded to the main checkout,
  because corpus/ is gitignored and therefore NOT shared between
  worktrees: a worktree-local copy would be an orphaned duplicate that
  no other tool reads. This is scraped output, not source.

  SOURCE_ROOT -- where pipeline/corrections/ lives. Derived from
  __file__, the way ccc.py/compendium.py do it, because corrections ARE
  tracked source: `docs/decisions.md`'s Source-defect corrections policy
  makes git history the audit log, so a correction must land in whatever
  checkout its scraper change is being written in. Hardcoding this one
  wrote correction files into the main checkout while their scraper code
  sat on a worktree branch -- splitting the audit trail from the code it
  documents, and needing a sandbox escape to do it.
"""

from __future__ import annotations

import argparse
import html as ihtml
import json
import re
import sys
import time
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

USER_AGENT = "Depositum corpus builder"
CRAWL_DELAY = 2.0  # seconds; robots.txt on vatican.va says Crawl-delay: 2
MAX_ATTEMPTS = 3  # survey measured ~1-in-6-to-8 transient failures, no 403s/CAPTCHA
RETRY_BACKOFF = [3.0, 8.0]  # seconds, between attempts 1->2 and 2->3

# See "NOTE ON THE TWO ROOTS" in the module docstring for why these differ.
DATA_ROOT = Path("/home/dani/Dev/me/scriptura")  # gitignored output; shared, never worktree-local
SOURCE_ROOT = Path(__file__).resolve().parents[2]  # tracked source; follows this file's checkout
RAW_ROOT = DATA_ROOT / "corpus" / "raw" / "vatican-docs"
WORKS_ROOT = DATA_ROOT / "corpus" / "works"
CORRECTIONS_DIR = SOURCE_ROOT / "pipeline" / "corrections"
PROGRESS_PATH = RAW_ROOT / "_progress.json"

MARK_OPEN, MARK_CLOSE = "⟦", "⟧"

VATII_INDEX_URL = "https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm"
VATII_DOC_BASE = "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/"

COPYRIGHT_HOLDER = "Libreria Editrice Vaticana / Dicastery for Communication"

PONTIFF_CANDIDATES = [
    # (slug, display name, approximate start year) -- verified live, not assumed;
    # a 404'ing slug is skipped and logged, never treated as a failure.
    ("pius-ix", "Pius IX", 1846),
    ("leo-xiii", "Leo XIII", 1878),
    ("pius-x", "Pius X", 1903),
    ("benedict-xv", "Benedict XV", 1914),
    ("pius-xi", "Pius XI", 1922),
    ("pius-xii", "Pius XII", 1939),
    ("john-xxiii", "John XXIII", 1958),
    ("paul-vi", "Paul VI", 1963),
    ("john-paul-i", "John Paul I", 1978),
    ("john-paul-ii", "John Paul II", 1978),
    ("benedict-xvi", "Benedict XVI", 2005),
    ("francesco", "Francis", 2013),
    ("leo-xiv", "Leo XIV", 2025),
]


# --------------------------------------------------------------------------
# Fetching (cached, rate-limited, retry-with-backoff)
# --------------------------------------------------------------------------

_CHARSET_SNIFF_RE = re.compile(rb'charset=["\']?\s*([a-zA-Z0-9_-]+)', re.IGNORECASE)


def decode_page(data: bytes) -> str:
    """Old-shell pages (ccc.py/compendium.py's whole world) declare
    iso-8859-1/cp1252 and decoding as cp1252 is correct and was ported
    unchanged. Modern-shell pages (content/{pontiff}/...) declare UTF-8 --
    confirmed live (Centesimus Annus, Rerum Novarum both `charset="UTF-8"`)
    -- and decoding those as cp1252 produces exactly the mojibake pattern
    ccc.py's own validator already watches for (â€-family sequences), just from
    the opposite direction (UTF-8 bytes misread as single-byte). Sniffed
    per-page from the declared <meta charset> rather than assumed from the
    page shell, since that's what's actually authoritative."""
    m = _CHARSET_SNIFF_RE.search(data[:2000])
    charset = m.group(1).decode("ascii", errors="replace").lower() if m else "cp1252"
    if charset in ("utf-8", "utf8"):
        return data.decode("utf-8", errors="replace")
    return data.decode("cp1252", errors="replace")


class Fetcher:
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._last_request = 0.0
        self.network_fetches = 0
        self.retried_ok = 0  # count of fetches that failed once then succeeded

    def _sleep_for_crawl_delay(self) -> None:
        elapsed = time.monotonic() - self._last_request
        if elapsed < CRAWL_DELAY:
            time.sleep(CRAWL_DELAY - elapsed)

    def try_fetch(self, url: str, cache_name: str) -> tuple[bytes | None, str | None]:
        """Cached, rate-limited, retrying fetch. Returns (data, error) --
        exactly one is None. Never raises: a document family running into
        a genuinely dead URL must not kill an otherwise-long crawl."""
        cache_path = self.cache_dir / cache_name
        if cache_path.exists():
            return cache_path.read_bytes(), None
        last_exc: Exception | None = None
        for attempt in range(MAX_ATTEMPTS):
            self._sleep_for_crawl_delay()
            req = Request(url, headers={"User-Agent": USER_AGENT})
            try:
                with urlopen(req, timeout=30) as resp:
                    data = resp.read()
                self._last_request = time.monotonic()
                self.network_fetches += 1
                if attempt > 0:
                    self.retried_ok += 1
                cache_path.write_bytes(data)
                return data, None
            except (HTTPError, URLError) as exc:
                last_exc = exc
                self._last_request = time.monotonic()
                self.network_fetches += 1
                if attempt < MAX_ATTEMPTS - 1:
                    time.sleep(RETRY_BACKOFF[attempt])
        return None, f"{url}: {last_exc}"

    def fetch_text(self, url: str, cache_name: str) -> tuple[str | None, str | None]:
        data, err = self.try_fetch(url, cache_name)
        if data is None:
            return None, err
        return decode_page(data), None


# --------------------------------------------------------------------------
# Text utilities (ported from ccc.py, unchanged in behavior)
# --------------------------------------------------------------------------


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = ihtml.unescape(s)
    s = s.replace("\xa0", " ")  # &nbsp; after unescape
    s = re.sub(r"\s+", " ", s).strip()
    return s


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL | re.IGNORECASE)


def is_full_bold(inner_html: str) -> bool:
    """True when the block's entire visible text sits inside <b>...</b> --
    ccc.py's heading style detector, unchanged. See ccc.py for the caveat
    this guards against (a bold *prefix* of an ordinary paragraph must not
    read as a heading)."""
    full_text = strip_tags(inner_html)
    if not full_text:
        return False
    bold_text = strip_tags(" ".join(_BOLD_SPAN_RE.findall(inner_html)))
    return bool(bold_text) and bold_text == full_text


def fold(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.upper())
    return "".join(c for c in s if not unicodedata.combining(c))


_ROMAN_VALUES = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}


def roman_to_int(s: str) -> int | None:
    s = s.upper()
    if not s or any(c not in _ROMAN_VALUES for c in s):
        return None
    total, prev = 0, 0
    for ch in reversed(s):
        v = _ROMAN_VALUES[ch]
        total += -v if v < prev else v
        prev = max(prev, v)
    return total or None


def is_mini_header(text: str) -> bool:
    t = text.strip()
    if MARK_OPEN in t:
        return False
    if len(t.split()) > 8:
        return False
    return not t.endswith((".", "!", ";", ":", '"', "”", "’"))


# --------------------------------------------------------------------------
# Paragraph-number detection (unified across all three variants -- see
# module docstring). Matched against the block's RAW inner HTML (before tag
# stripping), anchored at the start.
# --------------------------------------------------------------------------

PARA_NUM_RE = re.compile(
    r"^(?:\s|&nbsp;)*"
    r"(?:<(?!a[\s>])[^>]+>(?:\s|&nbsp;)*)*"  # skip a leading transparent wrapper tag, e.g. <span lang="pt">
    r"(?:<a\s[^>]*?name=[\"']?(?P<anchor_n>\d{1,4})[\"']?[^>]*>\s*(?P=anchor_n)\s*</a>"
    r"|(?P<bare_n>\d{1,4}))"
    r"\s*\.\s*(?:&nbsp;\s*)*",
    re.IGNORECASE | re.DOTALL,
)
# The leading-wrapper-tag skip (Christus Dominus PT, Presbyterorum Ordinis
# PT: paragraph numbers wrapped in <span lang="pt">N. text</span> rather
# than sitting bare at the start of the <p>) deliberately excludes <a...> --
# an anchor there is the self-link-anchored-digit variant, matched by the
# alternation below instead, which needs the digit to reappear as the
# anchor's own name attribute; a generic wrapper skip would swallow it
# without checking that constraint.


def match_para_num(inner_html: str) -> tuple[int, int] | None:
    """Returns (number, end_offset_into_inner_html) or None."""
    m = PARA_NUM_RE.match(inner_html)
    if not m:
        return None
    n = m.group("anchor_n") or m.group("bare_n")
    return int(n), m.end()


# --------------------------------------------------------------------------
# Footnote markers: template detection + inline substitution
# --------------------------------------------------------------------------

_SUP_RE = re.compile(r"<sup>(.*?)</sup>", re.IGNORECASE | re.DOTALL)
_FTNREF_RE = re.compile(
    r"<a\s[^>]*?name=[\"']?_ftnref([0-9A-Za-z]+)[\"']?[^>]*>(.*?)</a>"
    r"\s*(?:\((\d+)\)|\[(\d+)\])?\.?",
    re.IGNORECASE | re.DOTALL,
)
_PAREN_MARKER_RE = re.compile(r"\((\d{1,4}\*?)\)")


def detect_marker_template(body_html: str) -> str:
    if re.search(r'name=["\']?_ftnref[0-9A-Za-z]+', body_html, re.IGNORECASE):
        return "ftn"
    if re.search(r"<sup\b", body_html, re.IGNORECASE):
        return "sup"
    return "paren"


def mark_footnotes(inner_html: str, template: str) -> str:
    if template == "sup":

        def sub_sup(m: re.Match) -> str:
            digits = strip_tags(m.group(1)).strip()
            if digits.isdigit():
                return f"{MARK_OPEN}{digits}{MARK_CLOSE}"
            return m.group(0)

        return _SUP_RE.sub(sub_sup, inner_html)
    if template == "ftn":

        def sub_ftnref(m: re.Match) -> str:
            # Prefer the VISIBLE number ([N] inside the anchor, or an
            # (N)/[N] echoed right after it) over the anchor's own
            # name="_ftnrefCODE" -- confirmed live (Centesimus Annus'
            # sibling $-anchor convention) that vatican.va's internal
            # anchor codes can diverge from the printed number once a
            # document has passed some internal per-fragment count (codes
            # roll over into letters, "A", "B", ... and/or restart) -- see
            # build_footnote_table_anchor's docstring for the full case.
            # code (m.group(1)) is the fallback only.
            inner_visible = strip_tags(m.group(2)).strip().strip("[]")
            marker = inner_visible if inner_visible.isdigit() else (m.group(3) or m.group(4) or m.group(1))
            return f"{MARK_OPEN}{marker}{MARK_CLOSE}"

        return _FTNREF_RE.sub(sub_ftnref, inner_html)
    return _PAREN_MARKER_RE.sub(lambda m: f"{MARK_OPEN}{m.group(1)}{MARK_CLOSE}", inner_html)


# --------------------------------------------------------------------------
# Footnote LIST: region boundary + per-block table builder
# --------------------------------------------------------------------------

_FN_HEADING_RE = re.compile(
    r"<(?:b|p)[^>]*>\s*((?:END)?NOTES|Notas|Refer\xeanc?ias)\s*(?:\(\*\))?\s*</(?:b|p)>",
    re.IGNORECASE,
)
# Matches the heading whether or not it's bolded: most documents print a
# bold "NOTES", but Apostolicam Actuositatem's is plain "<p>NOTES </p>" --
# and whether it says "NOTES" or "ENDNOTES" (Ad Gentes, Apostolicam
# Actuositatem, Christus Dominus use the latter; the four constitutions use
# the former). Without both variants covered, find_footnote_region_start
# had no heading/anchor signal for the ENDNOTES documents and fell back to
# "last <hr>" -- wrong there, since the true last <hr> in those pages is a
# trailing decorative divider *after* the whole footnote list, which
# produced an empty table AND, worse, let the footnote list's own
# bibliographic year citations ("A.A.S. 54 (1962)") get swallowed as
# ordinary body prose attached to the final numbered section.
_FN_DEF_ANCHOR_RE = re.compile(
    r'name=["\']?(?:_ftn(?!ref)[0-9A-Za-z]+|\$[0-9A-Za-z]+|%24[0-9A-Za-z]+)', re.IGNORECASE
)
# (?!ref) matters: name="_ftnrefN" is the INLINE reference anchor, not a
# footnote *definition* -- without excluding it, a widened alphanumeric
# code class (needed for codes that roll over into letters, e.g. Centesimus
# Annus' "%24A" -- see build_footnote_table_anchor's docstring) also
# matches "ref1" as if "ref1" were the code, misreading the first inline
# reference in the whole document as the footnote-region boundary.
_HR_RE = re.compile(r"<hr\b[^>]*>", re.IGNORECASE)


def find_footnote_region_start(html: str) -> tuple[int | None, str]:
    """Returns (offset, evidence) -- offset is None if no signal found at
    all (document has no footnotes, or the page defeated every heuristic --
    the latter is reported, not silently swallowed)."""
    candidates: list[tuple[int, str]] = []
    m = _FN_HEADING_RE.search(html)
    if m:
        candidates.append((m.start(), f"heading {m.group(1)!r}"))
    m = _FN_DEF_ANCHOR_RE.search(html)
    if m:
        # Back up to the enclosing <a's own start -- _FN_DEF_ANCHOR_RE
        # matches from "name=..." onward, not from "<a", so using m.start()
        # directly would slice the region starting mid-tag (confirmed live:
        # Rerum Novarum -- this silently dropped footnote 1's whole
        # definition, since the truncated first entry no longer starts
        # with "<a" and the anchor-table builder's own tag-anchored regex
        # can't match it).
        tag_start = html.rfind("<a", max(0, m.start() - 200), m.start())
        candidates.append((tag_start if tag_start != -1 else m.start(), "definition anchor"))
    hrs = list(_HR_RE.finditer(html))
    if hrs:
        candidates.append((hrs[-1].start(), "last <hr>"))
    if not candidates:
        return None, "no signal"
    candidates.sort()
    return candidates[0]


_FN_ANCHOR_DEF_RE = re.compile(
    r"^\s*<a\s[^>]*?name=[\"']?(?:_ftn(?!ref)(?P<ftn>[0-9A-Za-z]+)|\$(?P<dollar>[0-9A-Za-z]+)|%24(?P<pct>[0-9A-Za-z]+))[\"']?[^>]*>"
    r"(?P<inner>.*?)</a>\s*\.?\s*",
    re.IGNORECASE | re.DOTALL,
)
_FN_PAREN_RE = re.compile(r"^\s*\((\d{1,4}\*?)\)\.?\s*")
_FN_BARE_RE = re.compile(r"^\s*(\d{1,4})(?:\.+\s*|\s+)")
# (?:\.+\s*|\s+) (not \.*\s+): a handful of entries in the "NOTES" list
# print a doubled period after the number (confirmed live, Lumen Gentium
# PT footnote 174: "174.. Cfr. Paulo VI...") -- handled by \.+ (one or
# more periods) tolerating any count -- but a separate, independently
# confirmed defect (Christus Dominus EN footnote 9: "9.Pius XII's
# encyclical letter..."; also seen in Apostolicam Actuositatem PT's own
# footnote 1 and Presbyterorum Ordinis EN's footnotes 4 and 57) drops the
# space after the period entirely. The old `\.*\s+` unconditionally
# required at least one trailing space, so "9.Pius" (period, zero spaces,
# capital letter) never matched at all -- silently merging footnote 9's
# whole text into footnote 8's as an unrecognized continuation and
# leaving marker 9 permanently unresolved wherever nothing later in the
# document happened to redefine it. `\.+\s*` (period(s) mandatory,
# trailing space optional) fixes this without weakening the period
# requirement -- a bare "9 text" wouldn't match this branch at all,
# still, only the alternate `\s+`-only branch (no period, whitespace
# glue) does, exactly the original bare-digit case ccc.py's own PT
# footnote parser already tolerates.


def parse_footnote_entry(raw_inner_html: str) -> tuple[str | None, str]:
    """One footnote-list block -> (marker_or_None, text). marker is None
    for a block that doesn't open a new entry (a continuation of the
    previous one, or junk) -- caller decides what to do with that."""
    m = _FN_ANCHOR_DEF_RE.match(raw_inner_html)
    if m:
        code = m.group("ftn") or m.group("dollar") or m.group("pct")
        visible = strip_tags(m.group("inner")).strip().strip("[]")
        marker = visible if visible.isdigit() else code
        return marker, strip_tags(raw_inner_html[m.end():]).strip()
    stripped = strip_tags(raw_inner_html)
    m = _FN_PAREN_RE.match(stripped)
    if m:
        return m.group(1), stripped[m.end():].strip()
    m = _FN_BARE_RE.match(stripped)
    if m:
        return m.group(1), stripped[m.end():].strip()
    return None, stripped.strip()


_BLOCK_RE = re.compile(
    r"<p(?=[\s>])[^>]*>((?:(?!</p>).)*?)</p>"
    r"|<blockquote>((?:(?!</blockquote>).)*?)</blockquote>"
    r"|<center>((?:(?!</center>).)*?)</center>",
    re.DOTALL | re.IGNORECASE,
)
# Three alternatives: <p> (group 1), <blockquote> (group 2, "quote" kind),
# <center> (group 3, "prose" kind -- see below). <center> exists because
# Vatican II's old-shell template prints "CHAPTER I" etc as bare <b> text
# sitting directly inside <center>...</center>, NOT wrapped in its own <p>
# (confirmed live: Lumen Gentium, Dei Verbum) -- a naive <p>/<blockquote>-
# only extractor silently never sees these labels as blocks at all, and
# the chapter numbering is lost even though its bold subtitle (which IS
# its own <p>) still comes through. Each <center> block reliably wraps
# just the chapter/part label plus its own subtitle <p>(s), closing
# before the first numbered paragraph -- confirmed by inspecting every
# CHAPTER-label <center> block in Lumen Gentium's raw HTML -- so treating
# the whole <center>...</center> span as one block (its nested <p> tags
# are consumed as part of it, not separately re-matched, since finditer
# never overlaps) reconstructs "CHAPTER I THE MYSTERY OF THE CHURCH" as a
# single fully-bold heading block, the same shape ccc.py gets from two
# separately-merged heading blocks.


def block_kind(m: re.Match) -> tuple[str, str]:
    """Returns (raw_inner_html, block_kind) for one _BLOCK_RE match, where
    block_kind is "p" | "blockquote" | "center"."""
    if m.group(1) is not None:
        return m.group(1), "p"
    if m.group(2) is not None:
        return m.group(2), "blockquote"
    return m.group(3), "center"


def raw_blocks(html: str) -> list[str]:
    """Inner HTML of each top-level <p>/<blockquote>/<center> in document
    order. Tag-name-boundary-safe: `<p(?=[\\s>])` deliberately does NOT
    match `<path ...>` -- modern pages embed inline SVG icons constantly,
    and a naive `<p[^>]*>` (ccc.py's own regex, safe there because CCC's
    archive mirror predates SVG) matches those false-positively."""
    return [block_kind(m)[0] for m in _BLOCK_RE.finditer(html)]


_FN_ANCHOR_ANY_RE = re.compile(
    r"<a\s[^>]*?name=[\"']?(?:_ftn(?!ref)(?P<ftn>[0-9A-Za-z]+)|\$(?P<dollar>[0-9A-Za-z]+)|%24(?P<pct>[0-9A-Za-z]+))[\"']?[^>]*>"
    r"(?P<inner>.*?)</a>",
    re.IGNORECASE | re.DOTALL,
)


def build_footnote_table_anchor(region_html: str) -> dict[str, str]:
    """Anchor-keyed footnote lists split by a flat scan over the whole
    region rather than by <p> block, because the two anchor sub-styles
    found disagree on <p>-wrapping: RN/CA-PT's `_ftnN` entries are each
    their own <p>, but CA EN's `$N`/`%24N` entries are NOT wrapped in any
    tag at all -- just `<font><b><a name="%24N">N</a></b></font>. text
    <br/><br/>` run directly in the page, ccc.py's own EN CCC shape. A
    flat regex scan (find every anchor, take the text between one anchor
    and the next) works for both without needing to special-case either.

    Keyed by the entry's own VISIBLE printed number, not the anchor's
    internal name="..." code -- confirmed live (Centesimus Annus) that
    these DIVERGE: vatican.va's own footnote renumbering prints "36" as
    the 10th footnote's visible label while its anchor is name="%2410"
    (a per-page-fragment internal counter, not the printed number) --
    exactly the mismatch ccc.py's own `_en_footnote_table` already
    guards against for the CCC's identical convention (it keeps `_code`
    and `num` as two separate regex groups and keys on `num`). The
    inline <sup> marker's own visible digits (what mark_footnotes
    extracts) always match the definition's visible number, never the
    code, so keying here on anything else silently breaks every citation
    after the first page-fragment's worth."""
    matches = list(_FN_ANCHOR_ANY_RE.finditer(region_html))
    table: dict[str, str] = {}
    for i, m in enumerate(matches):
        code = m.group("ftn") or m.group("dollar") or m.group("pct")
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(region_html)
        chunk = region_html[start:end]
        visible = strip_tags(m.group("inner")).strip().strip("[]")
        if visible.isdigit():
            marker = visible
        else:
            # Empty anchor (RN-style): the visible number is echoed as
            # plain "(N)"/"[N]" text immediately after the anchor closes.
            echo_m = re.match(r"^\s*(?:\((\d+)\)|\[(\d+)\])", chunk)
            marker = (echo_m.group(1) or echo_m.group(2)) if echo_m else code
        chunk = re.sub(rf"^\s*(?:\({re.escape(marker)}\)|\[{re.escape(marker)}\])?\s*\.?\s*", "", chunk)
        table[marker] = strip_tags(chunk).strip()
    return table


_FN_CHAPTER_NUM_ALT = r"([IVXLCDM]+|\d{1,2}|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)"
_FN_CHAPTER_HEADING_RE = re.compile(rf"^(?:CHAPTER|CAPITULO)\s+{_FN_CHAPTER_NUM_ALT}\b", re.IGNORECASE)


def match_footnote_chapter_heading(text: str) -> int | None:
    """Detects a chapter-restart heading INSIDE a footnote-list region --
    e.g. Christus Dominus's footnote list restarts its own numbering at
    every 'Chapter I' / 'Chapter II' / 'CHAPTER III' (confirmed live: the
    footnote-list numbers run 1-7, then restart 1-8, then 1-21, then 1-2,
    with exactly these three headings sitting at each restart). This is
    a DIFFERENT matcher from match_label_en/match_label_pt (which detect
    the same convention in the document BODY, driving the structure
    tree) for two reasons, both confirmed live: (1) the footnote list's
    own chapter labels don't always agree in numeral style with the
    body's -- Presbyterorum Ordinis EN's body prints Roman "CHAPTER
    I"/"II"/"III" but its OWN footnote list restarts under plain arabic
    "Chapter 1"/"2"/"3" instead (both resolve to the same chapter number
    via _resolve_num, which already handles roman/arabic/spelled-out
    forms uniformly, so accepting all three here costs nothing); (2) a
    handful of documents (Apostolicam Actuositatem EN) print a compound
    heading, "Chapter III Article 10:", combining the chapter restart
    with an inner article label in one block -- match_label's body
    regexes are used standalone against otherwise-bare heading blocks,
    but this matcher is deliberately NOT end-anchored so the compound
    form still resolves to chapter 3.

    fold() (accent/case normalization, already used elsewhere in this
    module) turns "Capítulo"/"CAPÍTULO"/"Chapter"/"CHAPTER" into one
    comparison, covering both languages with a single regex instead of
    forking EN/PT the way MATCH_LABEL does for body headings.

    Grep-confirmed safe against false positives from a footnote entry's
    OWN body prose that happens to mention a chapter in passing (e.g.
    Presbyterorum Ordinis EN footnote 47: "...Council of Trent, Session
    XXV, De Reform., chapter 1."): this matcher is only ever called
    against a block's FULL text, one raw_blocks() block at a time, and
    an ordinary footnote entry's block always starts with its own
    leading digit marker, never with the word "Chapter" -- so prose
    mentioning a chapter mid-entry can never reach this matcher at all.
    """
    m = _FN_CHAPTER_HEADING_RE.match(fold(text))
    if not m:
        return None
    return _resolve_num(m.group(1))


def build_footnote_table(region_html: str) -> tuple[dict, dict]:
    """Parses a footnote region into {marker: text}. Also returns a
    SECOND, chapter-scoped table {(chapter_n_or_None, marker): text},
    generalizing the per-chapter restart handling LG's star series
    already needed (build_chapter_scoped_star_table) to this, the
    PRIMARY numeric series -- confirmed live on more than just Christus
    Dominus (see match_footnote_chapter_heading's docstring): Ad Gentes,
    Apostolicam Actuositatem, Dei Verbum, Gaudium et Spes and
    Presbyterorum Ordinis all restart their own primary footnote
    numbering per chapter too, previously silently flattened into one
    global series the exact same way Christus Dominus was (repeated
    marker strings overwriting each other, last chapter in document
    order always winning -- confirmed live, e.g. Christus Dominus EN's
    global marker "21" used to carry Chapter II's own footnote 21 text
    with "CHAPTER III" (the next heading's own text, misread as an
    unlabeled continuation) appended, since nothing in this function
    used to recognize a chapter-heading block as anything other than
    unparseable junk merged onto the previous entry).

    chapter_n is None for every entry printed before the footnote
    list's own first chapter heading (e.g. a document's "Preface"/
    "Proémio" footnotes) -- this lines up by construction with
    ScrapeState.current_chapter(), which is likewise None for any
    section opened before the body's own first CHAPTER/CAPITULO
    heading, so Section.resolve's chapter-scoped lookup (see there)
    finds the right group without special-casing the unlabeled case.

    A document whose footnote list never restarts (the overwhelming
    majority -- e.g. Lumen Gentium's own PRIMARY series, confirmed by
    inspection to have no 'Chapter N' sub-headings at all, unlike its
    separate star series) gets a chapter_table with every entry keyed
    under chapter None; Section.resolve only ever consults the
    chapter-scoped table when the section's own chapter is not None
    (see there), so such a document's behavior is unchanged -- this is
    a strictly additive lookup, never a replacement for the flat table,
    which keeps being returned and populated exactly as before."""
    if _FN_DEF_ANCHOR_RE.search(region_html):
        return build_footnote_table_anchor(region_html), {}
    # No anchors at all: bare "N text" (vatii "NOTES") or "(N) text" (CDF) --
    # both confirmed one-entry-per-<p> in every document sampled.
    table: dict[str, str] = {}
    chapter_table: dict[tuple[int | None, str], str] = {}
    last_marker: str | None = None
    current_chapter: int | None = None
    for inner in raw_blocks(region_html):
        stripped = strip_tags(inner)
        ch = match_footnote_chapter_heading(stripped)
        if ch is not None:
            current_chapter = ch
            last_marker = None  # a chapter heading can't be a continuation target
            continue
        marker, text = parse_footnote_entry(inner)
        if marker is None:
            if last_marker is not None and text:
                table[last_marker] = (table[last_marker] + " " + text).strip()
                chapter_table[(current_chapter, last_marker)] = table[last_marker]
            continue
        table[marker] = text
        chapter_table[(current_chapter, marker)] = text
        last_marker = marker
    return table, chapter_table


def build_chapter_scoped_star_table(region_html: str) -> dict[tuple[int, str], str]:
    """LG-specific: 'SUPPLEMENTARY NOTES (*)' groups entries under bare
    'Chapter N' sub-labels (English) -- each sub-list restarts its own
    parenthesized numbering at (1). See module docstring."""
    table: dict[tuple[int, str], str] = {}
    current_chapter: int | None = None
    for inner in raw_blocks(region_html):
        stripped = strip_tags(inner)
        m = re.match(r"^Chapter\s+([IVXLCDM]+)$", stripped, re.IGNORECASE)
        if m:
            current_chapter = roman_to_int(m.group(1))
            continue
        marker, text = parse_footnote_entry(inner)
        if marker is not None and current_chapter is not None:
            table[(current_chapter, marker)] = text
    return table


# --------------------------------------------------------------------------
# Structure tree (same node schema as ccc.py; span field kept named
# "paragraphs" per this task's explicit schema instruction)
# --------------------------------------------------------------------------


class Node:
    def __init__(self, kind: str, n: int | None, title: str, level: int):
        self.kind = kind
        self.n = n
        self.title = title
        self.level = level
        self.children: list[Node] = []
        self.own: set[int] = set()
        self.span: tuple[int | None, int | None] = (None, None)
        self.has_unnumbered = False  # e.g. LG's APPENDIX -- structure present, no addressable span

    def compute_span(self) -> tuple[int | None, int | None]:
        lo, hi = (min(self.own), max(self.own)) if self.own else (None, None)
        for child in self.children:
            clo, chi = child.compute_span()
            if clo is not None:
                lo = clo if lo is None else min(lo, clo)
                hi = chi if hi is None else max(hi, chi)
        self.span = (lo, hi)
        return self.span

    def to_dict(self) -> dict:
        d = {
            "kind": self.kind,
            "title": self.title,
            "paragraphs": [self.span[0], self.span[1]],
            "children": [c.to_dict() for c in self.children],
        }
        if self.n is not None:
            d["n"] = self.n
        return d


LEVELS = {"part": 0, "section": 1, "chapter": 2, "article": 3, "sub": 4}


# --------------------------------------------------------------------------
# Section assembly (sections.json -- the CCC paragraphs.json shape, no
# `related`/`in_brief`)
# --------------------------------------------------------------------------


@dataclass
class BlockOut:
    kind: str  # "prose" | "quote"
    text: str
    attribution: str | None = None

    def to_dict(self) -> dict:
        d = {"kind": self.kind, "text_marked": self.text}
        if self.attribution:
            d["attribution"] = self.attribution
        return d


@dataclass
class Section:
    n: int
    blocks: list[BlockOut] = field(default_factory=list)
    text: str = ""
    citations: list[dict] = field(default_factory=list)
    chapter: int | None = None  # the structure-tree chapter this section sits under, if any --
    # used both for LG's star series (originally the only consumer, hence the
    # field's old name "star_chapter") and, generalized here, for ANY
    # document whose primary numeric footnote series restarts per chapter
    # (see build_footnote_table's chapter_table return value / module
    # docstring's "LUMEN GENTIUM'S CHAPTER-SCOPED STAR NOTES" section, now
    # joined by Christus Dominus and others as a non-LG-specific case).

    def resolve(
        self,
        footnote_table: dict[str, str],
        chapter_footnote_table: dict[tuple[int | None, str], str],
        star_table: dict[tuple[int, str], str],
        anomalies: list[str],
    ) -> None:
        all_marked = " ".join(b.text for b in self.blocks)
        tokens = re.findall(rf"{MARK_OPEN}([0-9A-Za-z*]+){MARK_CLOSE}", all_marked)
        seen: set[str] = set()
        citations = []
        for tok in tokens:
            if tok in seen:
                continue
            seen.add(tok)
            if tok.endswith("*") and self.chapter is not None:
                text = star_table.get((self.chapter, tok[:-1]))
                if text is None:
                    anomalies.append(f"section {self.n}: star marker {tok} has no supplementary note")
                citations.append({"marker": tok, "text": text or ""})
                continue
            # Chapter-scoped lookup first, keyed on THIS section's own
            # chapter -- which may itself be None (a section printed
            # before the document's first CHAPTER heading, e.g. Christus
            # Dominus's own numbered "Preface" sections 1-3: their
            # marker "1" must resolve to the Preface's OWN footnote list
            # entry, not fall through to the flat table, which would
            # silently hand back whatever chapter's definition of "1"
            # was written LAST in document order -- exactly the original
            # flattening bug, just for the unscoped group instead of a
            # named chapter. Only once THIS specific (chapter, marker)
            # pair has no entry at all do we fall back to the flat
            # table -- e.g. an ordinary document whose footnote list
            # never restarts, where chapter_table only ever has entries
            # under key (None, marker) and is therefore equivalent to
            # the flat table for every lookup; see build_footnote_table's
            # docstring.
            text = chapter_footnote_table.get((self.chapter, tok))
            if text is None:
                text = footnote_table.get(tok)
            if text is None:
                anomalies.append(f"section {self.n}: marker {tok} has no footnote text")
            citations.append({"marker": tok, "text": text or ""})
        self.citations = citations
        flat = re.sub(rf"{MARK_OPEN}[0-9A-Za-z*]+{MARK_CLOSE}", "", all_marked)
        self.text = re.sub(r"\s+", " ", flat).strip()

    def to_dict(self) -> dict:
        return {
            "n": self.n,
            "blocks": [b.to_dict() for b in self.blocks],
            "text": self.text,
            "citations": self.citations,
        }


class ScrapeState:
    def __init__(self, corrections: list[dict] | None = None):
        self.stack: list[Node] = []
        self.root_children: list[Node] = []
        self.sections: dict[int, Section] = {}
        self.open_section: Section | None = None
        self.last_n: int | None = None
        self.gaps: list[tuple[int, int]] = []
        self.dropped: list[str] = []
        self.anomalies: list[str] = []
        self.orphan_content: list[str] = []
        # The single most recent unclaimed prose block since the last
        # section closed -- covers two cases with the same shape: (a) the
        # Rerum Novarum case, content before section 1 ever opens (see
        # last_n is None branch below), and (b) a genuine unnumbered mid-
        # document paragraph (confirmed live: Sacrosanctum Concilium PT
        # §70 -- printed with NO leading number at all between a bold
        # subtitle and §71, while the EN edition prints §70 normally).
        # Only ever promoted when the next real number closes an
        # exactly-one-wide gap; a wider gap is left as a genuine,
        # reported gap rather than guessed at.
        self.pending_first_block: str | None = None
        self.content_started = False
        self.current_footnote_table: dict[str, str] = {}
        self.current_chapter_footnote_table: dict[tuple[int | None, str], str] = {}
        self.current_star_table: dict[tuple[int, str], str] = {}
        self.corrections: list[dict] = corrections or []
        self.corrections_applied: list[dict] = []
        self.corrections_seen: set[str] = set()
        self.promoted_first_paragraph = False
        self.promoted_gap_fills: list[int] = []

    def current_chapter(self) -> int | None:
        for node in reversed(self.stack):
            if node.kind == "chapter":
                return node.n
        return None

    def push_heading(self, kind: str, n: int | None, title: str) -> None:
        self.finalize_open_section()
        level = LEVELS[kind]
        while self.stack and self.stack[-1].level >= level:
            self.stack.pop()
        parent_children = self.stack[-1].children if self.stack else self.root_children
        prev = parent_children[-1] if parent_children else None
        same = (
            prev is not None
            and prev.kind == kind
            and ((n is not None and prev.n == n) or (n is None and prev.title == title))
        )
        if same:
            self.stack.append(prev)
            return
        node = Node(kind, n, title, level)
        parent_children.append(node)
        self.stack.append(node)

    def start_section(self, n: int, kind: str, text: str) -> None:
        self.content_started = True
        sec = Section(n=n, chapter=self.current_chapter())
        sec.blocks.append(BlockOut(kind, text))
        self.open_section = sec
        if self.stack:
            self.stack[-1].own.add(n)
        else:
            self.orphan_content.append(f"section {n} started with no open structure node")

    def add_continuation(self, kind: str, text: str) -> None:
        sec = self.open_section
        assert sec is not None
        last = sec.blocks[-1]
        if last.kind == kind:
            last.text = last.text + " " + text
        else:
            sec.blocks.append(BlockOut(kind, text))

    def finalize_open_section(self) -> None:
        if self.open_section is None:
            return
        self.open_section.resolve(
            self.current_footnote_table, self.current_chapter_footnote_table, self.current_star_table, self.anomalies
        )
        self.sections[self.open_section.n] = self.open_section
        self.open_section = None

    def record_gap(self, prev: int, cand: int) -> None:
        self.gaps.append((prev + 1, cand - 1))


# --------------------------------------------------------------------------
# Generic single-page block walker (ported from ccc.py's process_page,
# adapted: unified paragraph-number regex, per-page marker template,
# structure-tree nodes carry no in_brief/related concept). The walker
# itself lives inline in parse_document() below (it needs the page's
# already-detected marker_template threaded through per block, which a
# free function would otherwise have to take as a repeated parameter);
# Block and mark_and_split are the two pieces factored out because both
# are also useful standalone (mark_and_split is unit-testable independent
# of the walker's state machine).
# --------------------------------------------------------------------------


@dataclass
class Block:
    is_heading: bool
    kind: str  # "prose" | "quote"
    text: str  # marked text (⟦n⟧ tokens embedded), tags stripped
    raw: str  # raw inner html, for paragraph-number detection


def mark_and_split(raw: str, marker_template: str) -> tuple[str, str]:
    """Marks footnotes in raw, then strips the block's own leading
    paragraph-number prefix from the marked+stripped text. Returns
    (full_marked_stripped_text, rest_after_number)."""
    marked = mark_footnotes(raw, marker_template)
    text = strip_tags(marked)
    m = re.match(r"^(\d{1,4})\s*\.\s*", text)
    if m:
        return text, text[m.end():]
    return text, text


# --------------------------------------------------------------------------
# EN / PT structure labels
# --------------------------------------------------------------------------

_EN_WORD_NUM = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5, "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10}

_EN_LABELS = [
    ("part", re.compile(r"^PART\s+([IVXLCDM]+|ONE|TWO|THREE|FOUR|FIVE)\b", re.IGNORECASE)),
    ("section", re.compile(r"^SECTION\s+([IVXLCDM]+|\d+|ONE|TWO|THREE|FOUR|FIVE)\b", re.IGNORECASE)),
    ("chapter", re.compile(r"^CHAPTER\s+([IVXLCDM]+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\b", re.IGNORECASE)),
    ("article", re.compile(r"^ARTICLE\s+([IVXLCDM]+|\d+)\b", re.IGNORECASE)),
]


def _resolve_num(token: str) -> int | None:
    token = token.upper()
    if token in _EN_WORD_NUM:
        return _EN_WORD_NUM[token]
    if token.isdigit():
        return int(token)
    return roman_to_int(token)


def match_label_en(text: str) -> tuple[str, int | None] | None:
    for kind, pat in _EN_LABELS:
        m = pat.match(text)
        if m:
            return kind, _resolve_num(m.group(1))
    return None


_PT_LABELS = [
    ("part", re.compile(r"^PARTE\s+([IVXLCDM]+)\b")),
    ("section", re.compile(r"^SEC[CS][AC]O\s+([IVXLCDM]+)\b")),
    ("chapter", re.compile(r"^CAPITULO\s+([IVXLCDM]+)\b")),
    ("article", re.compile(r"^ARTIGO\s+([IVXLCDM]+|\d+)\b")),
]


def match_label_pt(text: str) -> tuple[str, int | None] | None:
    folded = fold(text)
    for kind, pat in _PT_LABELS:
        m = pat.match(folded)
        if m:
            return kind, _resolve_num(m.group(1))
    return None


MATCH_LABEL = {"en": match_label_en, "pt": match_label_pt}

_SECTION_TITLE_HEADING_RE = re.compile(r"^(\d{1,4})\.\s+")
# Gravissimum Educationis EN's convention (see parse_document's heading
# branch): a fully-bold block whose text is itself "N. Title" -- checked
# only against blocks that already failed match_label (a real PART/
# SECTION/CHAPTER/ARTICLE label), and only opens a section when N is
# already the legitimate next number, so an ordinary bold heading that
# happens to start with a digit for unrelated reasons can't misfire.


# --------------------------------------------------------------------------
# Body-region extraction (page-shell detection, see module docstring)
# --------------------------------------------------------------------------


def find_content_start_old_shell(html: str) -> int:
    """Old-shell only: earliest position where PARA_NUM_RE matches n==1
    (or, failing that, n==2 -- Rerum Novarum) at a <p>/<blockquote> block
    boundary, walked back to the last <hr> before it (skips a TOC).

    Bounded to stop scanning once a footnote-region heading is reached
    ("NOTES"/"Notas"/etc): a document whose body paragraphs are never
    bare-digit-led at all (confirmed live: Gravissimum Educationis, whose
    12 sections are each a bold "N. Title" heading followed by unnumbered
    prose -- a genuinely different convention from LG/GS/DV's sequential
    numbered paragraphs) would otherwise have this function walk straight
    past the entire body and lock onto the footnote LIST's own "1. Cf...."
    entries as if they were paragraph 1, discarding the whole document.
    Without a real body match before that boundary, returns 0 (no
    trimming) and process_document's main walker sees zero numbered
    sections -- reported honestly as "no sections captured", not
    guessed at."""
    fn_start, _ev = find_footnote_region_start(html)
    search_limit = fn_start if fn_start is not None else len(html)
    first_pos = None
    fallback_pos = None
    for m in _BLOCK_RE.finditer(html):
        if m.start() >= search_limit:
            break
        inner, _kind = block_kind(m)
        pm = match_para_num(inner)
        if pm is None:
            continue
        if pm[0] == 1:
            first_pos = m.start()
            break
        if pm[0] == 2 and fallback_pos is None:
            fallback_pos = m.start()
    pos = first_pos if first_pos is not None else fallback_pos
    if pos is None:
        return 0
    hrs = [hm.start() for hm in _HR_RE.finditer(html) if hm.start() < pos]
    return hrs[-1] if hrs else 0


# --------------------------------------------------------------------------
# Corrections layer (ported from ccc.py unchanged in design)
# --------------------------------------------------------------------------


class CorrectionDriftError(RuntimeError):
    pass


def load_corrections(work_id: str) -> list[dict]:
    path = CORRECTIONS_DIR / f"{work_id}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def looks_like_number_typo(cand: int, expected: int) -> bool:
    """True when `cand` differs from `expected` by exactly one digit at the
    same string length (e.g. 81 vs 87) -- a plausible single-keystroke
    misprint of the section number, as opposed to an unrelated number that
    happens to start a block. Ported unchanged from ccc.py."""
    a, b = str(cand), str(expected)
    return len(a) == len(b) and sum(x != y for x, y in zip(a, b)) == 1


def find_paragraph_number_correction(corrections: list[dict], expected: int, cand: int) -> dict | None:
    for c in corrections:
        if c.get("resolution") or c["field"] != "paragraph_number":
            continue
        loc = c["locator"]
        if loc.get("section") == expected and c["from"] == str(cand):
            return c
    return None


def write_corrections_receipt(work_dir: Path, work_id: str, applied: list[dict], corrections: list[dict], generated_at: str) -> int:
    unresolved = [c for c in corrections if c.get("resolution")]
    receipt = {
        "work_id": work_id,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": unresolved,
        "count": len(applied),
    }
    work_dir.mkdir(parents=True, exist_ok=True)
    (work_dir / "corrections-applied.json").write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + "\n")
    return len(applied)


def apply_raw_text_corrections(
    html_text: str, corrections: list[dict], applied_log: list[dict], seen_ids: set[str]
) -> str:
    """Applies field="raw_text" corrections as exact substring replacements
    on the fetched HTML, BEFORE parsing -- ported from ccc.py's identical
    citation_text pre-parse mechanism (see ccc.py's "Corrections layer"
    docstring for why this class of defect must be fixed pre-parse rather
    than post-parse: a dropped/mislabeled paragraph NUMBER, unlike a
    footnote text/marker fix, changes which text the boundary-detection
    scan itself attaches to which section -- fixing it after the scan has
    already misattributed the text is too late.

    Concrete case this exists for (Optatam Totius EN, confirmed live):
    the source drops the "21." paragraph number entirely for one
    paragraph (a genuinely unnumbered mid-document paragraph, verified
    against the PT sibling's own "21." at the equivalent, verbatim-
    matching position) and then prints "21." a second time for what is
    actually section 22 (verified the same way). Neither half is a
    plausible single-digit-substitution typo (looks_like_number_typo
    doesn't fire: "missing" isn't "wrong digit"), so the paragraph_number
    correction path (applied post-parse, see the typo branch in
    parse_document) can't reach either half -- by the time parsing
    reaches the first paragraph, its number is simply absent, and the
    second paragraph looks like an entirely ordinary, correctly-
    sequenced "21." with no signal that anything is wrong. Restoring the
    missing digits in the raw HTML before the section walker ever runs
    is the only point at which this is fixable without hand-editing
    output or fabricating structure the source doesn't actually have --
    every restored digit is independently verified against the PT
    sibling's matching content, not invented."""
    for c in corrections:
        if c.get("resolution") or c["field"] != "raw_text":
            continue
        if c["id"] in seen_ids:
            continue
        frm = c["from"]
        if frm in html_text:
            html_text = html_text.replace(frm, c["to"], 1)
            applied_log.append(dict(c))
            seen_ids.add(c["id"])
    return html_text


# --------------------------------------------------------------------------
# Document reference + discovery
# --------------------------------------------------------------------------


@dataclass
class DocRef:
    family: str  # "vatii" | "encyclical" | "exhortation" | "cdf"
    document_kind: str
    slug: str
    pontiff_or_council: str
    date_digits: str  # 8 raw digits from the filename, format TBD (see parse_promulgation_date)
    lang_urls: dict[str, str]  # {"en": url, "pt": url}


def parse_promulgation_date(digits: str) -> str | None:
    if len(digits) != 8 or not digits.isdigit():
        return None
    y1, m1, d1 = digits[0:4], digits[4:6], digits[6:8]
    y2, m2, d2 = digits[4:8], digits[2:4], digits[0:2]
    for y, mo, d in ((y1, m1, d1), (y2, m2, d2)):
        try:
            datetime(int(y), int(mo), int(d))
            return f"{y}-{mo}-{d}"
        except ValueError:
            continue
    return None


VATII_KIND_MAP = {
    "const": "conciliar-constitution",
    "decl": "conciliar-declaration",
    "decree": "conciliar-decree",
}

_VATII_LINK_RE = re.compile(
    r'href="documents/(vat-ii_(const|decl|decree)_(\d{8})_([a-z-]+)_(en|po)\.html)"'
)


def discover_vatii(fetcher: Fetcher) -> tuple[list[DocRef], str | None]:
    text, err = fetcher.fetch_text(VATII_INDEX_URL, "index__vatii.html")
    if text is None:
        return [], err
    by_slug: dict[str, DocRef] = {}
    for m in _VATII_LINK_RE.finditer(text):
        _fname, kind, date8, slug, lang = m.groups()
        ref = by_slug.setdefault(
            slug,
            DocRef("vatii", VATII_KIND_MAP[kind], slug, "Second Vatican Council", date8, {}),
        )
        ref.lang_urls[lang] = VATII_DOC_BASE + _fname
    return list(by_slug.values()), None


_ENCYC_LINK_RE_TMPL = r'href="(?:https?://www\.vatican\.va)?/content/{slug}/{lang}/encyclicals/documents/([a-z0-9_.-]+)\.html"'
_EXH_LINK_RE_TMPL = r'href="(?:https?://www\.vatican\.va)?/content/{slug}/{lang}/apost_exhortations/documents/([a-z0-9_.-]+)\.html"'

_DATE_SLUG_RE = re.compile(r"_(\d{8})_([a-z0-9-]+)$")
_DATE_SLUG_RE_MODERN = re.compile(r"^(\d{8})-(?:enciclica-|encyclical-)?([a-z0-9-]+)$")
_ENCICLICA_FILLER_RE = re.compile(r"^(?:enciclica|encyclical)-")


def parse_date_slug(fname: str) -> tuple[str, str] | None:
    """Two filename conventions confirmed live: the long-standing
    `hf_{pontiff}_enc_{DDMMYYYY}_{slug}.html` (matched by _DATE_SLUG_RE,
    date embedded mid-name) and a newer one used by the two most recent
    encyclicals found (Francis' Dilexit Nos, 2024; Leo XIV's Magnifica
    Humanitas, 2026): `{YYYYMMDD}-{slug}.html`, date-first, hyphen- not
    underscore-separated, sometimes with a filler "enciclica-"/
    "encyclical-" word before the real slug. Without both, the most
    recent documents from the two most recent pontificates -- arguably
    the most relevant to a live reading site -- would silently vanish
    from discovery."""
    m = _DATE_SLUG_RE.search(fname)
    if m:
        return m.group(1), m.group(2)
    m = _DATE_SLUG_RE_MODERN.match(fname)
    if m:
        return m.group(1), _ENCICLICA_FILLER_RE.sub("", m.group(2))
    return None


def _index_links(fetcher: Fetcher, index_url: str, cache_name: str, link_re: re.Pattern) -> list[str]:
    text, err = fetcher.fetch_text(index_url, cache_name)
    if text is None:
        return []
    return sorted({m.group(1) for m in link_re.finditer(text)})


def discover_encyclicals(fetcher: Fetcher, pontiff_slug: str, display_name: str) -> tuple[list[DocRef], list[str]]:
    """Enumerates from the pontiff's own EN encyclicals index -- not a
    hardcoded document list, per this task's brief. PT availability is
    then checked per-document (a 404 is expected, not an error -- see
    module docstring / final report)."""
    notes: list[str] = []
    en_re = re.compile(_ENCYC_LINK_RE_TMPL.format(slug=pontiff_slug, lang="en"))
    fnames = _index_links(
        fetcher,
        f"https://www.vatican.va/content/{pontiff_slug}/en/encyclicals.index.html",
        f"index__encyclicals__{pontiff_slug}.html",
        en_re,
    )
    refs = []
    for fname in fnames:
        parsed = parse_date_slug(fname)
        if parsed is None:
            notes.append(f"{pontiff_slug}: filename {fname!r} matches neither known convention -- skipped")
            continue
        date8, slug = parsed
        en_url = f"https://www.vatican.va/content/{pontiff_slug}/en/encyclicals/documents/{fname}.html"
        refs.append(DocRef("encyclical", "encyclical", slug, display_name, date8, {"en": en_url}))
    return refs, notes


def discover_exhortations(fetcher: Fetcher, pontiff_slug: str, display_name: str) -> tuple[list[DocRef], list[str]]:
    notes: list[str] = []
    en_re = re.compile(_EXH_LINK_RE_TMPL.format(slug=pontiff_slug, lang="en"))
    fnames = _index_links(
        fetcher,
        f"https://www.vatican.va/content/{pontiff_slug}/en/apost_exhortations.index.html",
        f"index__exhortations__{pontiff_slug}.html",
        en_re,
    )
    refs = []
    for fname in fnames:
        parsed = parse_date_slug(fname)
        if parsed is None:
            notes.append(f"{pontiff_slug}: filename {fname!r} matches neither known convention -- skipped")
            continue
        date8, slug = parsed
        en_url = f"https://www.vatican.va/content/{pontiff_slug}/en/apost_exhortations/documents/{fname}.html"
        refs.append(DocRef("exhortation", "apostolic-exhortation", slug, display_name, date8, {"en": en_url}))
    return refs, notes


def pt_url_for(ref: DocRef) -> str | None:
    en_url = ref.lang_urls.get("en")
    if en_url is None:
        return None
    if ref.family == "vatii":
        return None  # discovered directly from the index, not derived
    return en_url.replace("/en/", "/pt/", 1)


# --------------------------------------------------------------------------
# Per-document parse
# --------------------------------------------------------------------------


@dataclass
class ParseResult:
    state: ScrapeState
    marker_template: str
    shell: str
    footnote_evidence: str
    fetched_url: str
    retrieved_at: str


_TRANSPARENT_SPAN_RE = re.compile(r"</?span(?:\s[^>]*)?>", re.IGNORECASE)


def strip_transparent_spans(html: str) -> str:
    """Some PT old-shell pages (confirmed live: Christus Dominus,
    Presbyterorum Ordinis) wrap paragraph numbers, structure headings,
    AND footnote-list entries alike in `<span lang="pt">...</span>` --
    e.g. `<p align="left"><span lang="pt">16. Cfr. ...</span></p>` for a
    footnote, `<p><span lang="pt">1. Christ...</span></p>` for a
    paragraph. This single wrapper, applied uniformly by whatever export
    tool produced the page, was breaking THREE independent regexes at
    once (PARA_NUM_RE, the footnote heading detector, the footnote-entry
    parser) because none of them expect an inline tag between a block's
    own <p> and its leading digit. Rather than teach every one of those
    regexes to tolerate an extra wrapper (fragile, and there could be
    others not yet seen), the tag is unwrapped once, up front, before any
    other parsing runs -- <span> carries no structural meaning here (no
    lang-specific handling depends on it elsewhere in this scraper), so
    dropping it is lossless for everything this schema captures."""
    return _TRANSPARENT_SPAN_RE.sub("", html)


def parse_document(html: str, lang: str, corrections: list[dict], fetched_url: str) -> ParseResult:
    html = strip_transparent_spans(html)
    testo_m = re.search(r'class="testo"', html)
    if testo_m:
        shell = "modern"
        end_m = re.search(r"/TESTO", html[testo_m.start():], re.IGNORECASE)
        region = html[testo_m.start(): testo_m.start() + end_m.start()] if end_m else html[testo_m.start():]
        content_start = 0
    else:
        shell = "old"
        region = html
        content_start = find_content_start_old_shell(html)
        region = region[content_start:]

    fn_start, evidence = find_footnote_region_start(region)
    if fn_start is None:
        body_html, foot_html = region, ""
    else:
        body_html, foot_html = region[:fn_start], region[fn_start:]

    marker_template = detect_marker_template(body_html + foot_html)
    footnote_table, chapter_footnote_table = build_footnote_table(foot_html)

    star_table: dict[tuple[int, str], str] = {}
    star_m = re.search(r"SUPPLEMENTARY NOTES", foot_html, re.IGNORECASE)
    if star_m:
        primary_foot = foot_html[:star_m.start()]
        star_region = foot_html[star_m.start():]
        footnote_table, chapter_footnote_table = build_footnote_table(primary_foot)
        star_table = build_chapter_scoped_star_table(star_region)

    state = ScrapeState(corrections)
    state.current_footnote_table = footnote_table
    state.current_chapter_footnote_table = chapter_footnote_table
    state.current_star_table = star_table

    blocks: list[Block] = []
    for m in _BLOCK_RE.finditer(body_html):
        inner, kind = block_kind(m)
        is_bq = kind == "blockquote"
        if kind == "center":
            # Always a heading candidate, not gated on is_full_bold: LG's
            # "CHAPTER VII" (uniquely among its 8 chapters) is printed
            # WITHOUT its own <b> -- only its subtitle is bold -- so
            # is_full_bold on the merged <center> block would read False
            # and silently lose the chapter boundary. Every <center>
            # block found in a trimmed body region (see _BLOCK_RE's
            # docstring) is empirically a chapter/part label wrapper, so
            # this is safe rather than a special case for one document.
            is_heading = True
        else:
            is_heading = is_full_bold(inner) if not is_bq else False
        marked = mark_footnotes(inner, marker_template)
        text = strip_tags(marked)
        if not text:
            continue
        blocks.append(Block(is_heading, "quote" if is_bq else "prose", text, inner))

    match_label = MATCH_LABEL[lang]

    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]
        if b.is_heading:
            matched = match_label(b.text)
            if matched is not None:
                kind, num = matched
                state.push_heading(kind, num, b.text)
                i += 1
                continue
            title_m = _SECTION_TITLE_HEADING_RE.match(b.text)
            if title_m is not None:
                # Section-title-aware branch (Gravissimum Educationis EN,
                # confirmed live: its 12 items are each printed as a fully-
                # bold "<i><b>N. Title</b></i>" heading -- e.g. "1. The
                # Meaning of the Universal Right to an Education" -- with
                # unnumbered prose underneath, never a bare "N. body text"
                # start. Because this block is_heading, it would otherwise
                # never reach the paragraph-number detection below at all
                # (that branch `continue`s past it), so GE's numbering was
                # invisible to the section walker and the whole document
                # produced zero sections (see build_manifest's "PARSER
                # DEFEATED" note, now obsolete once this branch fires).
                # Gated exactly like an ordinary numbered paragraph (only
                # the next expected number opens a new section) so this
                # can't misfire on an unrelated bold heading that merely
                # starts with a digit -- confirmed safe against the other
                # 31 documents (see final report): no other document has a
                # fully-bold block matching this pattern at a position
                # where the number is a legitimate continuation.
                cand_title = int(title_m.group(1))
                if state.last_n is None or cand_title == state.last_n + 1:
                    state.finalize_open_section()
                    state.start_section(cand_title, b.kind, b.text[title_m.end():])
                    state.last_n = cand_title
                    state.pending_first_block = None
                    i += 1
                    continue
            # body_html is already trimmed to real content (see
            # find_content_start_old_shell / the "testo" div boundary),
            # so any bold block reaching here is legitimate document
            # structure (INTRODUCTION, CONCLUSION, a document's own
            # title) -- not front-matter chrome, so no content_started
            # gate: an unrecognized heading appearing before section 1
            # (e.g. INTRODUCTION) must still become a node.
            state.push_heading("sub", None, b.text)
            i += 1
            continue

        pm = match_para_num(b.raw)
        cand = pm[0] if pm else None
        is_new = False
        rest_text = b.text
        fills_gap_at: int | None = None  # set when a size-1 gap can be closed by pending_first_block
        if cand is not None:
            if state.last_n is None or cand == state.last_n + 1:
                is_new = True
            elif cand > state.last_n + 1:
                is_new = True
                if cand == state.last_n + 2 and state.pending_first_block is not None:
                    fills_gap_at = state.last_n + 1
                else:
                    state.record_gap(state.last_n, cand)
            elif state.last_n is not None and looks_like_number_typo(cand, state.last_n + 1):
                # A single-digit-substitution misprint of the section's own
                # leading number (verified live: Sacrosanctum Concilium EN
                # prints "81." where position/content/the PT parallel all
                # agree it is section 87 -- "87" -> "81" is a one-digit
                # substitution at the same length). Without this branch
                # `cand <= state.last_n` falls through to the "false
                # positive" case below and the text silently merges into
                # the PRECEDING section as a continuation, permanently
                # losing the section boundary (confirmed: this is exactly
                # how SC EN lost its own section 87 before this fix).
                # Ported from ccc.py's identical paragraph-number typo
                # heuristic; ccc.py's ScrapeState never applied a
                # corrections-layer paragraph_number entry so this scraper
                # closes that gap by consulting one, same as ccc.py's
                # process_page does for CCC paragraphs.
                expected = state.last_n + 1
                is_new = True
                entry = find_paragraph_number_correction(state.corrections, expected, cand)
                if entry is not None:
                    if entry["id"] not in state.corrections_seen:
                        state.corrections_applied.append(dict(entry))
                        state.corrections_seen.add(entry["id"])
                    state.anomalies.append(
                        f"section {expected}: source printed {str(cand)!r} "
                        f"(corrected via corrections entry {entry['id']!r})"
                    )
                else:
                    state.anomalies.append(
                        f"section {expected}: source printed {str(cand)!r} (single-digit typo, "
                        "corrected; UNDOCUMENTED -- add a pipeline/corrections/{work_id}.json "
                        "paragraph_number entry)"
                    )
                cand = expected
            # else: cand <= last_n and not a plausible typo -> false positive;
            # fall through as continuation
            if is_new:
                _, rest_text = mark_and_split(b.raw, marker_template)

        if is_new:
            state.finalize_open_section()
            if fills_gap_at is not None:
                # Generalizes the Rerum Novarum "unnumbered section 1"
                # case to mid-document: the one prose block since the
                # last section closed is promoted to the number the gap
                # implies -- confirmed live (Sacrosanctum Concilium PT
                # §70, printed with no leading number between a bold
                # subtitle and §71) rather than being dropped as an
                # unrecoverable gap or silently merged into the previous
                # section's text.
                state.start_section(fills_gap_at, "prose", state.pending_first_block)
                state.finalize_open_section()
                state.last_n = fills_gap_at
                state.promoted_gap_fills.append(fills_gap_at)
                if state.orphan_content and state.orphan_content[-1].endswith(state.pending_first_block[:90]):
                    state.orphan_content.pop()
                state.anomalies.append(
                    f"section {fills_gap_at}: source prints no leading number at all "
                    f"(unnumbered text between the surrounding sections) -- promoted "
                    f"the preceding block to section {fills_gap_at}"
                )
            elif state.last_n is None and cand == 2 and state.pending_first_block is not None:
                state.start_section(1, "prose", state.pending_first_block)
                state.finalize_open_section()
                state.last_n = 1
                state.promoted_first_paragraph = True
                state.anomalies.append(
                    "section 1: source prints no leading number (unnumbered framing "
                    "text before '2.') -- promoted the preceding block to section 1"
                )
            state.start_section(cand, b.kind, rest_text)
            state.last_n = cand
            state.pending_first_block = None
        elif state.open_section is None:
            if b.kind == "prose" and is_mini_header(b.text):
                state.dropped.append(b.text)
            else:
                if b.kind == "prose":
                    state.pending_first_block = b.text
                where = state.stack[-1].title if state.stack else "?"
                state.orphan_content.append(f"[{where}] {b.text[:90]}")
        elif b.kind == "prose" and is_mini_header(b.text):
            state.dropped.append(b.text)
        else:
            state.add_continuation(b.kind, b.text)
        i += 1
    state.finalize_open_section()

    return ParseResult(
        state=state,
        marker_template=marker_template,
        shell=shell,
        footnote_evidence=evidence,
        fetched_url=fetched_url,
        retrieved_at=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    )


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

_MOJIBAKE_PATTERNS = ["Ã©", "Ã§", "â€™", "â€", "Ã³"]

EXPECTED_RANGES = {
    # survey table sec.3 -- spot-checked, not exhaustive; any document not
    # listed here is validated on contiguity alone (1..max, no gaps).
    "lumen-gentium": (1, 69),
    "laudato-si": (1, 246),
    "familiaris-consortio": (1, 86),
    "centesimus-annus": (1, 62),
    "rerum-novarum": (1, 64),
    "dominus-iesus": (1, 23),
}


def validate_document(slug: str, state: ScrapeState) -> tuple[bool, list[str]]:
    problems: list[str] = []
    sections = state.sections
    if not sections:
        return False, ["no sections captured at all"]
    numbers = sorted(sections)
    lo, hi = numbers[0], numbers[-1]
    missing = [n for n in range(lo, hi + 1) if n not in sections]
    if missing:
        problems.append(f"gaps in {lo}..{hi}: missing {missing[:20]}{'...' if len(missing) > 20 else ''}")
    if lo != 1:
        problems.append(f"numbering starts at {lo}, not 1")
    expected = EXPECTED_RANGES.get(slug)
    if expected and (lo, hi) != expected:
        problems.append(f"expected range {expected}, got ({lo}, {hi})")

    for node in state.root_children:
        node.compute_span()

    for n, sec in sorted(sections.items()):
        for block in sec.blocks:
            if "<" in block.text or ">" in block.text:
                problems.append(f"section {n}: leftover markup in block text")
            if "�" in block.text:
                problems.append(f"section {n}: replacement character present")
            for pat in _MOJIBAKE_PATTERNS:
                if pat in block.text:
                    problems.append(f"section {n}: mojibake pattern {pat!r}")
        tokens = re.findall(rf"{MARK_OPEN}([0-9A-Za-z*]+){MARK_CLOSE}", " ".join(b.text for b in sec.blocks))
        markers = [c["marker"] for c in sec.citations]
        if set(tokens) != set(markers) or len(markers) != len(set(markers)):
            problems.append(f"section {n}: token/citation mismatch {tokens} vs {markers}")
        empty_citations = [c["marker"] for c in sec.citations if not c["text"]]
        if empty_citations:
            problems.append(f"section {n}: citations with no resolved text: {empty_citations}")

    return (len(problems) == 0), problems


# --------------------------------------------------------------------------
# Known, unfixable source defects (docs/decisions.md's Source-defect
# corrections policy explicitly excludes these: there is no correct value to
# substitute, only a gap or a dangling reference in vatican.va's own page --
# see docs/research/vatican-documents.md's "Known source defects" section
# for the full evidence trail behind each entry). Recorded here, keyed by
# work_id, so build_manifest can surface them in manifest.notes in the same
# honest register as every other note -- NOT as pipeline/corrections/
# entries, which are reserved for defects with a known correct value.
# --------------------------------------------------------------------------

KNOWN_SOURCE_DEFECTS: dict[str, str] = {
    "vatii.lumen-gentium.en": (
        "KNOWN SOURCE DEFECT (undocumented, not correctable): the source's own footnote "
        "list skips numbers -- section 11's marker 106 and section 13's marker 118 are "
        "both cited inline but have no matching entry in the footnote list, which jumps "
        "105 straight to 107 and similarly around 118. No parallel edition or other source "
        "supplies the missing text, so these two citations are left with empty text rather "
        "than fabricated content; see docs/research/vatican-documents.md's Known source "
        "defects section."
    ),
    "vatii.lumen-gentium.pt": (
        "KNOWN SOURCE DEFECT (undocumented, not correctable): the PT footnote list is "
        "truncated at 194 in the source page itself (194 inline markers, 193 citations, "
        "highest printed marker 198), while the body's own prose cites markers up to 198. "
        "Section 59's marker 198 has no footnote-list entry to resolve to; left with empty "
        "text rather than fabricated content; see docs/research/vatican-documents.md's "
        "Known source defects section."
    ),
    "vatii.inter-mirifica.pt": (
        "KNOWN SOURCE DEFECT (undocumented, not correctable): section 19's marker 1 is a "
        "single isolated inline citation with no matching footnote-list definition "
        "anywhere on the page -- not a numbering-scope issue (this document's footnote "
        "list isn't chapter-restarted), just a dangling reference in the source itself. "
        "Left with empty text rather than fabricated content; see "
        "docs/research/vatican-documents.md's Known source defects section."
    ),
}


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------


def build_manifest(
    work_id: str,
    document_kind: str,
    title: str,
    lang: str,
    pontiff_or_council: str,
    promulgated: str | None,
    source_url: str,
    retrieved_at: str,
    state: ScrapeState,
    parse: ParseResult,
) -> dict:
    notes = [
        f"page shell: {parse.shell}; footnote-marker template: {parse.marker_template}; "
        f"footnote-region boundary evidence: {parse.footnote_evidence}.",
        "Inline italics (titles, Latin terms) are not captured -- a deliberate v1 loss, "
        "recoverable later from corpus/raw/ without re-crawling (same posture as ccc.py).",
    ]
    if not state.sections:
        notes.insert(
            0,
            "PARSER DEFEATED -- zero sections captured. This document's numbered "
            "items are printed as bold 'N. Title' headings with unnumbered prose "
            "underneath, not vatii's usual sequential 'N. body text' paragraphs "
            "(confirmed live: Gravissimum Educationis EN specifically; its own PT "
            "translation does NOT share this convention and parses cleanly). "
            "structure.json/sections.json are empty; do not treat this as a "
            "published work until re-parsed with a section-title-aware pass -- "
            "raw HTML is cached in corpus/raw/, so this is fixable without "
            "re-crawling.",
        )
    if state.gaps:
        notes.append(f"source section-number gaps detected: {state.gaps}")
    if state.promoted_first_paragraph:
        notes.append(
            "Section 1 has no leading number in the source (unnumbered framing text before "
            "'2.') -- promoted the preceding unnumbered block to section 1; see anomalies."
        )
    if state.promoted_gap_fills:
        notes.append(
            f"Section(s) {state.promoted_gap_fills} have no leading number in the source "
            "(unnumbered text between two normally-numbered sections) -- promoted the "
            "single preceding unclaimed block to fill each; see anomalies."
        )
    if state.orphan_content:
        notes.append(f"{len(state.orphan_content)} unnumbered content blocks not attached to any section (logged, not fabricated).")
    if state.anomalies:
        notes.append(f"{len(state.anomalies)} anomalies recorded; see corrections-applied.json / run log.")
    if work_id in KNOWN_SOURCE_DEFECTS:
        notes.append(KNOWN_SOURCE_DEFECTS[work_id])
    manifest = {
        "id": work_id,
        "type": "document",
        "document_kind": document_kind,
        "title": title,
        "short_title": title,
        "language": lang,
        "edition": "vatican.va HTML mirror",
        "pontiff_or_council": pontiff_or_council,
        "promulgated": promulgated,
        "sources": [{"url": source_url, "retrieved_at": retrieved_at}],
        "copyright": {
            "status": "copyrighted",
            "holder": COPYRIGHT_HOLDER,
            "notice": "Copyright © Dicastery for Communication – Libreria Editrice Vaticana",
        },
        "notes": " ".join(notes),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(state.corrections_applied),
    }
    return manifest


def write_document_outputs(work_id: str, manifest: dict, state: ScrapeState) -> None:
    out_dir = WORKS_ROOT / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    for node in state.root_children:
        node.compute_span()
    structure = [n.to_dict() for n in state.root_children]
    sections = [state.sections[n].to_dict() for n in sorted(state.sections)]
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    (out_dir / "structure.json").write_text(json.dumps(structure, indent=2, ensure_ascii=False) + "\n")
    (out_dir / "sections.json").write_text(json.dumps(sections, indent=2, ensure_ascii=False) + "\n")
    write_corrections_receipt(
        out_dir, work_id, state.corrections_applied, state.corrections,
        manifest["generated_at"],
    )


# --------------------------------------------------------------------------
# Orchestration: one document, both languages
# --------------------------------------------------------------------------


def cache_name_for(ref: DocRef, lang: str) -> str:
    return f"{ref.family}__{ref.slug}__{lang}.html"


def url_lang_key(ref: DocRef, lang: str) -> str:
    """The corpus/work-id language code is always "pt" (per this task's
    schema instruction), but the Vatican II archive mirror's own URLs use
    "po" for Portuguese (confirmed live from the index page: ..._po.html)
    -- content/{pontiff}/... pages use "pt" directly. DocRef.lang_urls is
    keyed by whatever the *source* used, so this translates the work-level
    "pt" into the right dict key per family."""
    if ref.family == "vatii" and lang == "pt":
        return "po"
    return lang


def scrape_one(fetcher: Fetcher, ref: DocRef, lang: str, title_hint: str, overwrite: bool) -> dict:
    """Returns a small result dict for progress/reporting; never raises."""
    url = ref.lang_urls.get(url_lang_key(ref, lang))
    result = {
        "family": ref.family,
        "slug": ref.slug,
        "lang": lang,
        "status": None,
        "url": url,
    }
    work_id = f"{ref.family}.{ref.slug}.{lang}"
    if url is None:
        result["status"] = "no-url"
        return result
    out_dir = WORKS_ROOT / work_id
    if (out_dir / "sections.json").exists() and not overwrite:
        result["status"] = "already-written"
        return result

    html, err = fetcher.fetch_text(url, cache_name_for(ref, lang))
    if html is None:
        result["status"] = "fetch-failed"
        result["error"] = err
        return result

    corrections = load_corrections(work_id)
    pre_applied: list[dict] = []
    pre_seen: set[str] = set()
    html = apply_raw_text_corrections(html, corrections, pre_applied, pre_seen)
    try:
        parse = parse_document(html, lang, corrections, url)
    except Exception as exc:  # noqa: BLE001 -- a parser crash on one document must not kill the crawl
        result["status"] = "parse-error"
        result["error"] = f"{type(exc).__name__}: {exc}"
        return result
    parse.state.corrections_applied = pre_applied + parse.state.corrections_applied
    parse.state.corrections_seen |= pre_seen

    # Corrections drift guard (docs/corpus-schema.md #Corrections, ported
    # from ccc.py's end-of-run version but checked per-document here since
    # each vatii/encyclical page is its own single-page crawl rather than
    # a multi-page work): every non-"resolution" entry in this document's
    # own corrections file must have found and fixed its target on THIS
    # page, or the raw HTML has drifted since the entry was authored --
    # fail loudly (a distinct result status, not a silent skip) rather
    # than shipping a corpus with a stale, unapplied correction.
    missing = [c["id"] for c in corrections if not c.get("resolution") and c["id"] not in parse.state.corrections_seen]
    if missing:
        result["status"] = "corrections-drift"
        result["error"] = f"correction entries never matched during parse: {missing}"
        return result

    ok, problems = validate_document(ref.slug, parse.state)
    promulgated = parse_promulgation_date(ref.date_digits)
    manifest = build_manifest(
        work_id, ref.document_kind, title_hint or ref.slug.replace("-", " ").title(),
        lang, ref.pontiff_or_council, promulgated, url, parse.retrieved_at,
        parse.state, parse,
    )
    write_document_outputs(work_id, manifest, parse.state)

    result["status"] = "validated" if ok else "validation-failed"
    result["problems"] = problems
    result["sections"] = len(parse.state.sections)
    result["range"] = (min(parse.state.sections), max(parse.state.sections)) if parse.state.sections else None
    result["shell"] = parse.shell
    result["marker_template"] = parse.marker_template
    return result


# --------------------------------------------------------------------------
# Phase 1: Vatican II
# --------------------------------------------------------------------------

VATII_ORDER = [
    "sacrosanctum-concilium", "lumen-gentium", "dei-verbum", "gaudium-et-spes",  # constitutions first (task priority)
    "unitatis-redintegratio", "ad-gentes", "dignitatis-humanae", "apostolicam-actuositatem",
    "christus-dominus", "nostra-aetate", "perfectae-caritatis", "inter-mirifica",
    "optatam-totius", "gravissimum-educationis", "presbyterorum-ordinis", "orientalium-ecclesiarum",
]

VATII_TITLES = {
    "lumen-gentium": "Lumen Gentium",
    "sacrosanctum-concilium": "Sacrosanctum Concilium",
    "gaudium-et-spes": "Gaudium et Spes",
    "dei-verbum": "Dei Verbum",
    "unitatis-redintegratio": "Unitatis Redintegratio",
    "ad-gentes": "Ad Gentes",
    "dignitatis-humanae": "Dignitatis Humanae",
    "apostolicam-actuositatem": "Apostolicam Actuositatem",
    "christus-dominus": "Christus Dominus",
    "nostra-aetate": "Nostra Aetate",
    "perfectae-caritatis": "Perfectae Caritatis",
    "inter-mirifica": "Inter Mirifica",
    "optatam-totius": "Optatam Totius",
    "gravissimum-educationis": "Gravissimum Educationis",
    "presbyterorum-ordinis": "Presbyterorum Ordinis",
    "orientalium-ecclesiarum": "Orientalium Ecclesiarum",
}


def run_phase1(fetcher: Fetcher, langs: list[str], only: list[str] | None) -> list[dict]:
    refs, err = discover_vatii(fetcher)
    if err:
        print(f"FATAL: could not fetch Vatican II index: {err}", file=sys.stderr)
        return []
    by_slug = {r.slug: r for r in refs}
    print(f"discovered {len(refs)} Vatican II documents from index (expected 16)")
    order = only or VATII_ORDER
    results = []
    for slug in order:
        ref = by_slug.get(slug)
        if ref is None:
            results.append({"family": "vatii", "slug": slug, "status": "not-in-index"})
            continue
        for lang in langs:
            r = scrape_one(fetcher, ref, lang, VATII_TITLES.get(slug, slug), overwrite=True)
            results.append(r)
            print(f"  {slug}.{lang}: {r['status']}" + (f" {r.get('range')}" if r.get("range") else "") + (f" ERR={r.get('error')}" if r.get("error") else ""))
    return results


# --------------------------------------------------------------------------
# Phase 2: encyclicals (+ exhortations, same code path)
# --------------------------------------------------------------------------


def run_phase2(
    fetcher: Fetcher,
    pontiff_slugs: list[str] | None,
    time_budget: float | None,
    limit: int | None,
    include_exhortations: bool,
) -> list[dict]:
    start = time.monotonic()
    results: list[dict] = []
    candidates = PONTIFF_CANDIDATES if not pontiff_slugs else [c for c in PONTIFF_CANDIDATES if c[0] in pontiff_slugs]
    n_done = 0
    for slug, display, _year in candidates:
        if time_budget is not None and time.monotonic() - start > time_budget:
            print(f"time budget ({time_budget}s) reached before {slug}; stopping")
            break
        refs, notes = discover_encyclicals(fetcher, slug, display)
        for note in notes:
            print(f"  [discover] {note}")
        if not refs:
            print(f"{slug}: 0 encyclicals discovered (index missing or empty) -- skipping")
            continue
        print(f"{slug}: {len(refs)} encyclicals discovered")
        for ref in refs:
            if time_budget is not None and time.monotonic() - start > time_budget:
                print(f"time budget reached mid-pontificate ({slug}); stopping")
                return results
            if limit is not None and n_done >= limit:
                print(f"--limit {limit} reached; stopping")
                return results
            r_en = scrape_one(fetcher, ref, "en", ref.slug.replace("-", " ").title(), overwrite=False)
            results.append(r_en)
            n_done += 1
            pt_url = pt_url_for(ref)
            pt_status = "no-pt-url"
            if pt_url:
                ref.lang_urls["pt"] = pt_url
                r_pt = scrape_one(fetcher, ref, "pt", ref.slug.replace("-", " ").title(), overwrite=False)
                results.append(r_pt)
                pt_status = r_pt["status"]
                if r_pt["status"] == "fetch-failed":
                    pt_status = "pt-unavailable (expected for many pontificates, see survey)"
            print(f"  {ref.slug}: en={r_en['status']} pt={pt_status}")
        if include_exhortations:
            exh_refs, exh_notes = discover_exhortations(fetcher, slug, display)
            for note in exh_notes:
                print(f"  [discover-exh] {note}")
            for ref in exh_refs:
                if time_budget is not None and time.monotonic() - start > time_budget:
                    return results
                r_en = scrape_one(fetcher, ref, "en", ref.slug.replace("-", " ").title(), overwrite=False)
                results.append(r_en)
                pt_url = pt_url_for(ref)
                if pt_url:
                    ref.lang_urls["pt"] = pt_url
                    results.append(scrape_one(fetcher, ref, "pt", ref.slug.replace("-", " ").title(), overwrite=False))
    return results


# --------------------------------------------------------------------------
# Cross-language symmetry check (docs/decisions.md's "Language symmetry
# principle" used as a QA oracle -- see this task's brief). Deliberately a
# standalone pass over already-written corpus/works/ output, not folded
# into parse_document/validate_document: it needs to see BOTH languages'
# finished sections.json at once, which a single-document parse never has
# in scope, and keeping it separate lets it re-run against output from an
# earlier crawl without re-parsing anything.
# --------------------------------------------------------------------------

_WORK_ID_RE = re.compile(r"^([a-z][a-z-]*)\.(.+)\.(en|pt)$")


def check_language_symmetry(works_root: Path = WORKS_ROOT) -> tuple[bool, list[str]]:
    """For every (family, slug) that has a WRITTEN sections.json in BOTH
    "en" and "pt" under works_root, checks that the two languages' sets of
    section numbers are identical -- exactly the check that would have
    caught all three of this task's defects (Gravissimum Educationis EN:
    0 sections vs. PT's 12; Sacrosanctum Concilium: EN missing 87, PT
    missing 70; Optatam Totius EN: 21 sections vs. PT's 22). Each
    language looked internally plausible in isolation (a contiguous,
    gap-free 1..N run) -- validate_document's per-document contiguity
    check cannot see this class of defect at all, only comparing against
    the sibling translation's own section set reveals it.

    Deliberately does NOT require every document to exist in both
    languages: a missing translation is legitimate and common across the
    full encyclical corpus this scraper also covers (Leo XIII is only
    ~17% translated into Portuguese on vatican.va, docs/decisions.md's
    "Vatican documents in scope" entry / research/vatican-documents.md
    §2) -- so a (family, slug) with only one language written is silently
    skipped, not flagged. Only a pair where BOTH sides exist and disagree
    is a defect. A work directory that exists but has no sections.json at
    all (e.g. a "parser defeated, zero sections" case that was never
    written -- see build_manifest) is treated the same as absent, not as
    an empty section set that would trivially "disagree" with everything.

    Returns (ok, problems)."""
    by_pair: dict[tuple[str, str], dict[str, Path]] = {}
    if not works_root.exists():
        return True, []
    for entry in sorted(works_root.iterdir()):
        if not entry.is_dir():
            continue
        m = _WORK_ID_RE.match(entry.name)
        if not m:
            continue
        family, slug, lang = m.groups()
        sections_path = entry / "sections.json"
        if not sections_path.exists():
            continue
        by_pair.setdefault((family, slug), {})[lang] = sections_path

    problems: list[str] = []
    for (family, slug), langs in sorted(by_pair.items()):
        if "en" not in langs or "pt" not in langs:
            continue  # one language legitimately absent -- not a defect, see docstring
        en_nums = {s["n"] for s in json.loads(langs["en"].read_text(encoding="utf-8"))}
        pt_nums = {s["n"] for s in json.loads(langs["pt"].read_text(encoding="utf-8"))}
        if en_nums != pt_nums:
            only_en = sorted(en_nums - pt_nums)
            only_pt = sorted(pt_nums - en_nums)
            problems.append(
                f"{family}.{slug}: EN/PT section-number sets differ -- "
                f"EN has {len(en_nums)}{f', missing from PT: {only_en}' if only_en else ''}; "
                f"PT has {len(pt_nums)}{f', missing from EN: {only_pt}' if only_pt else ''}"
            )
    return (len(problems) == 0), problems


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def summarize(results: list[dict]) -> None:
    from collections import Counter

    counts = Counter(r["status"] for r in results)
    print("\n=== summary ===")
    for status, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {status}: {n}")
    failed = [r for r in results if r["status"] in ("fetch-failed", "parse-error", "validation-failed")]
    if failed:
        print(f"\n{len(failed)} problem documents:")
        for r in failed:
            print(f"  {r['family']}.{r['slug']}.{r.get('lang')}: {r['status']} {r.get('error', '')} {r.get('problems', '')}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p1 = sub.add_parser("phase1", help="Vatican II, all 16 documents")
    p1.add_argument("--lang", choices=["en", "pt", "both"], default="both")
    p1.add_argument("--only", help="comma-separated slugs, for iterating on one document")

    p2 = sub.add_parser("phase2", help="encyclicals (+exhortations), per-pontificate discovery")
    p2.add_argument("--pontiffs", help="comma-separated slugs; default: all candidates")
    p2.add_argument("--time-budget", type=float, default=None, help="seconds; stop gracefully once exceeded")
    p2.add_argument("--limit", type=int, default=None, help="max new documents (en+pt counted together) this run")
    p2.add_argument("--exhortations", action="store_true", help="also crawl apostolic exhortations per pontificate")

    sub.add_parser("discover-encyclicals", help="index-only census, no document fetches")
    sub.add_parser("check-symmetry", help="cross-language section-set check over already-written corpus/works/ (no fetches, no parsing)")

    args = ap.parse_args()
    fetcher = Fetcher(RAW_ROOT)

    if args.cmd == "phase1":
        langs = ["en", "pt"] if args.lang == "both" else [args.lang]
        only = args.only.split(",") if args.only else None
        results = run_phase1(fetcher, langs, only)
        summarize(results)
        print(f"\nnetwork fetches this run: {fetcher.network_fetches} (retried-then-ok: {fetcher.retried_ok})")
        ok = all(r["status"] in ("validated", "already-written") for r in results)
        sym_ok, sym_problems = check_language_symmetry()
        print(f"\n=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}")
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if (ok and sym_ok) else 1

    if args.cmd == "phase2":
        pontiffs = args.pontiffs.split(",") if args.pontiffs else None
        results = run_phase2(fetcher, pontiffs, args.time_budget, args.limit, args.exhortations)
        summarize(results)
        print(f"\nnetwork fetches this run: {fetcher.network_fetches} (retried-then-ok: {fetcher.retried_ok})")
        sym_ok, sym_problems = check_language_symmetry()
        print(f"\n=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}")
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if sym_ok else 1

    if args.cmd == "check-symmetry":
        sym_ok, sym_problems = check_language_symmetry()
        print(f"=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}")
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if sym_ok else 1

    if args.cmd == "discover-encyclicals":
        total = 0
        for slug, display, _year in PONTIFF_CANDIDATES:
            refs, notes = discover_encyclicals(fetcher, slug, display)
            pt_checked = 0
            for note in notes:
                print(f"  [note] {note}")
            print(f"{slug} ({display}): {len(refs)} encyclicals")
            total += len(refs)
        print(f"\ntotal encyclicals discovered across {len(PONTIFF_CANDIDATES)} candidate pontificates: {total}")
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
