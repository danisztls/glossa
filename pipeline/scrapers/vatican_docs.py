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
import os
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
CRAWL_LOCK_PATH = RAW_ROOT / ".crawl.lock"  # see acquire_crawl_lock/touch_crawl_lock below
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
    r"(?:<a\s[^>]*?name=[\"']?\d{1,4}[\"']?[^>]*>\s*</a>\s*)?"  # skip a leading EMPTY self-link anchor, e.g. <a name="1"></a>1.
    r"(?:"
    r"<a\s[^>]*?name=[\"']?(?P<anchor_dot_n>\d{1,4})\.[\"']?[^>]*>\s*(?P=anchor_dot_n)\.\s*</a>"  # <a name="3.">3.</a> -- period INSIDE both the name attr and the anchor text (Caritas in Veritate EN)
    r"|<a\s[^>]*?name=[\"']?(?P<anchor_n>\d{1,4})[\"']?[^>]*>\s*(?P=anchor_n)\s*</a>\s*\."  # <a name="18">18</a>. -- period OUTSIDE (Lumen Gentium)
    r"|(?P<bare_n>\d{1,4})\s*\."  # bare "N."
    r")"
    r"\s*(?:&nbsp;\s*)*",
    re.IGNORECASE | re.DOTALL,
)
# The leading-wrapper-tag skip (Christus Dominus PT, Presbyterorum Ordinis
# PT: paragraph numbers wrapped in <span lang="pt">N. text</span> rather
# than sitting bare at the start of the <p>) deliberately excludes <a...> --
# an anchor there is the self-link-anchored-digit variant, matched by the
# alternation below instead, which needs the digit to reappear as the
# anchor's own name attribute; a generic wrapper skip would swallow it
# without checking that constraint.
#
# The EMPTY-self-link-anchor skip (added after the full phase-2 sweep,
# confirmed live: Dilexit Nos PT, 2024 -- `<a name="1"></a>1. «Amou-nos»,
# diz São Paulo...`) is a THIRD, distinct anchor convention: unlike
# Lumen Gentium's self-link anchor (`<a name="18">18</a>.`, digit repeated
# as the anchor's own text content, matched by the anchor_n branch above)
# or the plain bare-digit case (no anchor at all), this page's anchor is a
# pure empty deep-link target -- nothing between its open and close tags --
# immediately followed by the real, separately-printed bare digit. Every
# one of this document's 219 paragraphs used this convention; before this
# fix the anchor_n branch failed (nothing to match `(?P=anchor_n)` against
# inside an empty anchor) and the bare_n branch never got a chance to run
# (the empty anchor tag sat unconsumed at the match position, since the
# leading-wrapper-tag skip explicitly excludes <a...>) -- so EVERY
# paragraph missed, and the whole document silently produced zero
# sections despite having complete, correctly-numbered content on the
# page. Deliberately not required to double-check the skipped anchor's
# own digit against the bare digit that follows (no backreference here,
# unlike the anchor_n branch) -- the bare digit immediately after is the
# one actually printed on the page and is what CCC/vatii's own posture
# already trusts as authoritative; the anchor is only ever a same-page
# navigation target, not a second source of truth to reconcile against.
#
# The FOURTH variant, `anchor_dot_n` (confirmed live: Caritas in Veritate
# EN, 2009 -- `<a name="3.">3.</a> Through this close link...`), is a
# self-link anchor like Lumen Gentium's, except the period that ends every
# paragraph number is printed INSIDE the anchor, in both the `name`
# attribute value and the anchor's own text ("3." rather than "3" in
# both places) -- not after `</a>` where the LG-style branch and the
# outer `\s*\.` expect it. Handled as its own alternative rather than
# folded into the anchor_n branch because the *outer* trailing `\.` that
# every other branch relies on has nothing left to match here (the period
# was already consumed inside the anchor); each of the three alternatives
# therefore owns its own trailing-period consumption instead of sharing
# one after the alternation closes.


def match_para_num(inner_html: str) -> tuple[int, int] | None:
    """Returns (number, end_offset_into_inner_html) or None."""
    m = PARA_NUM_RE.match(inner_html)
    if not m:
        return None
    n = m.group("anchor_dot_n") or m.group("anchor_n") or m.group("bare_n")
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
_PAREN_MARKER_RE = re.compile(r"\((\d{1,3}\*?)\)")
# Capped at 3 digits, not 4 (confirmed live: Populorum Progressio EN --
# "...We traveled to Latin America (1960) and Africa (1962)..." -- ordinary
# prose parenthetically citing a YEAR, not a footnote marker at all, was
# being marked as citations "1960"/"1962" with no matching footnote-list
# entry, i.e. two guaranteed-unresolved citations on every document using
# this template that happens to parenthesize a year anywhere in its prose).
# 3 digits safely covers every real footnote count seen in the whole
# phase-2 sweep (Mediator Dei's 213 footnotes is the highest found) while
# excluding every plausible year (1000-2999) a papal document could cite.


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
            # Empty anchor: the visible number is echoed as plain text
            # immediately after the anchor closes -- either "(N)"/"[N]"
            # (RN-style) or a bare "N." label (confirmed live: Veritatis
            # Splendor EN, `<b><a name="%2454"></a>184</b>. <i>Ibid</i>...`
            # -- an empty anchor whose internal per-fragment code, "54",
            # has nothing to do with the real, 130-higher printed number
            # "184" once the document has passed some internal per-
            # fragment count; see this function's own docstring on why
            # the code is never trustworthy once a visible number exists).
            # Without the third alternative here, EVERY footnote whose
            # code had already been used earlier in the SAME document
            # (a near-certainty once codes wrap back into a smaller range
            # for a new page fragment) got silently overwritten in this
            # flat dict by a later, wrong entry sharing that recycled
            # code -- corrupting even the early, correctly-keyed entries,
            # not just the late ones.
            echo_m = re.match(r"^\s*(?:\((\d+)\)|\[(\d+)\]|(?:</?[a-z][^>]*>)*\s*(\d{1,4})\s*(?:</[a-z][^>]*>)?\s*\.)", chunk, re.IGNORECASE)
            marker = (echo_m.group(1) or echo_m.group(2) or echo_m.group(3)) if echo_m else code
        chunk = re.sub(
            rf"^\s*(?:\({re.escape(marker)}\)|\[{re.escape(marker)}\]|(?:</?[a-z][^>]*>)*\s*{re.escape(marker)}\s*(?:</[a-z][^>]*>)?\s*\.)?\s*",
            "", chunk, flags=re.IGNORECASE,
        )
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


def _gap_block(gap_html: str, marker_template: str) -> Block | None:
    """Recovers a numbered paragraph whose opening <p> tag is missing from
    the source. Confirmed live (docs/research/vatican-documents.md §7.1,
    encyclical.aeterna-dei.pt): `<p align="center"><b>TITLE</b></p> 3. À
    vida...` -- the heading's own </p> closes normally right after </b>,
    but paragraph 3 never gets an opening <p> of its own, so its entire
    text runs as bare markup between that </p> and the next block's <p>.
    _BLOCK_RE only ever yields text strictly INSIDE a <p>/<blockquote>/
    <center> pair, so `finditer` simply steps over this span without
    matching it at all -- it isn't merged into the heading's own captured
    group, it's dropped on the floor, taking the paragraph's number and
    content with it.

    parse_document calls this on the text sitting between every pair of
    consecutive _BLOCK_RE matches (and before the first / after the
    last), gated on the exact same match_para_num every ordinary block
    already has to pass to be recognized as a numbered paragraph -- not a
    new heuristic, just applying the existing one to a span of body_html
    that used to be skipped outright. A whitespace-only gap (the
    overwhelming majority -- ordinary inter-block newlines/indentation in
    every one of the other 328 works) fails match_para_num immediately
    and yields nothing, so this is a pure addition: no existing block's
    classification changes, and nothing that couldn't already open a
    section elsewhere in the corpus can suddenly open one here."""
    if match_para_num(gap_html) is None:
        return None
    text = strip_tags(mark_footnotes(gap_html, marker_template))
    if not text:
        return None
    return Block(False, "prose", text, gap_html)


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

_SECTION_TITLE_HEADING_RE = re.compile(r"^(\d{1,4})\s*\.\s+")
# Gravissimum Educationis EN's convention (see parse_document's heading
# branch): a fully-bold block whose text is itself "N. Title" -- checked
# only against blocks that already failed match_label (a real PART/
# SECTION/CHAPTER/ARTICLE label), and only opens a section when N is
# already the legitimate next number, so an ordinary bold heading that
# happens to start with a digit for unrelated reasons can't misfire.
#
# The optional `\s*` before the period (added after the full phase-2
# sweep, confirmed live: Redemptor Hominis EN -- `<p><b><i>10 . The human
# dimension of the mystery of the Redemption</i></b></p>`, a lone stray
# space between "10" and its period, nowhere else in the document) matters
# far more than one heading: this branch's own "N must be exactly
# last_n+1" gate (see the comment above) never recovers once a single
# expected heading is missed -- section 10 silently became a generic
# untitled "sub" node instead of a section, which meant every subsequent
# "11.", "12.", ... heading in the rest of the document also failed the
# now-permanently-broken continuity check and fell through the same way.
# One extra space, unnoticed, was costing this document sections 10-22
# (13 of the whole document's ~22), not just section 10 -- confirmed by
# reparsing after this fix: 1..22 captured cleanly, matching the EN
# footnote apparatus's own highest citation number.


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
_DATE_SLUG_RE_MODERN = re.compile(r"^(\d{8})-([a-z0-9-]+)$")
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
    from discovery.

    The filler word is NOT unique to the date-first convention, though --
    confirmed live (fixed after the full phase-2 sweep, when the census
    turned up three wrong slugs: `enciclica-fratelli-tutti`,
    `enciclica-laudato-si`, `enciclica-lumen-fidei`, all Francis) that
    vatican.va's OWN filenames for these three use `papa-francesco_
    {DDMMYYYY}_enciclica-{slug}.html` -- the long-standing DATE_SLUG_RE
    shape (date embedded mid-name, underscore-separated), which _DATE_SLUG_RE
    matches and returns FIRST, before the modern-pattern branch (the only
    one that used to strip the filler) is ever reached. Stripping is
    therefore applied once, uniformly, to whichever branch matched --
    not baked into either regex individually -- so a future third
    filename convention can't reintroduce the same class of leak. Kept
    conservative (`_ENCICLICA_FILLER_RE` requires a trailing "-", i.e.
    more slug content after the filler word) so a document that somehow
    really were titled bare "Enciclica"/"Encyclical" alone -- not
    observed anywhere in this corpus -- would be left untouched rather
    than stripped to an empty slug."""
    m = _DATE_SLUG_RE.search(fname)
    if m:
        date8, slug = m.group(1), m.group(2)
    else:
        m = _DATE_SLUG_RE_MODERN.match(fname)
        if not m:
            return None
        date8, slug = m.group(1), m.group(2)
    return date8, _ENCICLICA_FILLER_RE.sub("", slug)


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


class StubPageError(Exception):
    """Raised when the fetched page's content region carries essentially no
    text. Found live, systematically, on Leo XIII-era Portuguese encyclical
    URLs (77 of the first ~130 PT documents attempted in the phase-2
    sweep): the URL 200s and the page shell renders in full (copyright
    footer, breadcrumbs, a language-availability strip), but `div.testo`
    itself is empty or contains only that language strip (e.g. "EN -
    FR - IT - LA" -- Portuguese conspicuously absent from its own list).
    vatican.va's CMS evidently generates a PT URL slot for every
    pontiff/document combination regardless of whether a translator ever
    supplied Portuguese text, so a 200 response is not evidence of a real
    translation the way it is for every other family this scraper
    handles. This is NOT a parser defeat -- there is no structure to
    recover, the page has zero body prose -- and must not be reported or
    written as one (see STUB_CONTENT_MIN_CHARS for the threshold and how
    it was picked)."""


# The shortest genuine document found in the whole phase-2 sweep (Vi E Ben
# Noto, Leo XIII, 3 sections) strips to 7,106 chars of body text; the
# largest stub-page sample found strips to ~90 chars (a bare language
# strip). 300 sits with wide margin on both sides -- it will never
# misclassify a real, however-short, encyclical, and every stub sampled
# clears it by 3x or more.
STUB_CONTENT_MIN_CHARS = 300


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

    region_text_len = len(strip_tags(region))
    if region_text_len < STUB_CONTENT_MIN_CHARS:
        raise StubPageError(
            f"content region has only {region_text_len} chars of text (threshold "
            f"{STUB_CONTENT_MIN_CHARS}) -- translation stub, not a real document page"
        )

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
    prev_end = 0
    block_matches = list(_BLOCK_RE.finditer(body_html))
    for m in block_matches:
        # See _gap_block's docstring: recovers a numbered paragraph whose
        # opening <p> is missing from the source, by checking the raw
        # text _BLOCK_RE stepped over between the previous match and this
        # one (or, on the first iteration, before the first match).
        gap = _gap_block(body_html[prev_end:m.start()], marker_template)
        if gap is not None:
            blocks.append(gap)
        prev_end = m.end()

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
    # Trailing gap after the last block match (or the whole region, if
    # _BLOCK_RE matched nothing at all) -- same recovery, same gate.
    tail_gap = _gap_block(body_html[prev_end:], marker_template)
    if tail_gap is not None:
        blocks.append(tail_gap)

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


def _dict_tree_has_real_span(nodes: list[dict]) -> bool:
    """Same check as _tree_has_real_span, over the finalized structure.json
    dict shape rather than live Node objects -- validate_document checks
    the actual artifact about to be written, not an intermediate
    representation, so this stays honest even if build_structure's
    fallback logic itself is ever changed incorrectly."""
    for node in nodes:
        p = node.get("paragraphs", [None, None])
        if p[0] is not None:
            return True
        if _dict_tree_has_real_span(node.get("children", [])):
            return True
    return False


def validate_document(slug: str, state: ScrapeState, structure: list[dict]) -> tuple[bool, list[str]]:
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

    # Schema-conformance guard (docs/corpus-schema.md #Documents): a
    # document with real, addressable sections must have at least one
    # structure node with usable (non-null) paragraph bounds -- null bounds
    # mean "this content is genuinely unaddressable" (LG's APPENDIX) and
    # every consumer treats a null-bounded node as unlinkable, so a
    # numbered document with none is corpus data that misrepresents its
    # own addressability. build_structure's trivial-node fallback should
    # make this unreachable; checking the actual finalized structure here
    # (not just trusting the fallback ran) turns that invariant into a
    # regression guard instead of an assumption.
    if sections and not _dict_tree_has_real_span(structure):
        problems.append(
            f"{len(sections)} sections captured but structure.json has no node with usable "
            "paragraph bounds -- see build_structure; every node in the tree is null-bounded "
            "despite real, addressable content existing"
        )

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

    # Orphan-ratio guard: a document whose captured sections happen to be
    # small and contiguous (e.g. 1..4) passes the contiguity check above
    # trivially even if the parser only recognized a tiny fraction of the
    # page's real structure and dumped the rest as unnumbered orphan
    # content -- a silent near-total under-capture that would otherwise
    # read as "validated". Surveyed empirically across the full phase-2
    # sweep (~250 works, encyclicals + Vatican II): a normal document has
    # roughly one heading/title block per numbered section (orphan/section
    # ratio ~0.0-2.0 -- headings and section-title blocks are exactly what
    # legitimately end up as orphan content); three genuine parser-defeat
    # cases found live sit at 16x, 27x, and 35x that ratio (Mortalium
    # Animos PT: 32 orphan/2 sections; Quadragesimo Anno PT: 133/5;
    # Miranda Prorsus EN: 139/4 -- each confirmed by inspection to use a
    # heading/numbering convention this parser doesn't recognize, silently
    # dropping nearly the whole document into the orphan bucket instead of
    # sections). The absolute floor (>=10) keeps this from firing on small
    # documents where a low section count makes the ratio noisy by nature
    # (e.g. a real 2-section document with several sub-headings).
    if len(state.orphan_content) >= 10 and len(state.orphan_content) > 5 * max(len(sections), 1):
        problems.append(
            f"{len(state.orphan_content)} unnumbered content blocks vs only {len(sections)} "
            "captured sections -- suspiciously high orphan ratio, almost certainly a "
            "numbering/heading convention this parser doesn't recognize on this page "
            "(not just a few stray section-title blocks); do not trust this document's "
            "captured range as complete."
        )

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

PARSER_DEFEAT_NOTES: dict[str, str] = {
    "vatii.gravissimum-educationis.en": (
        "This document's numbered items are printed as bold 'N. Title' headings with "
        "unnumbered prose underneath, not vatii's usual sequential 'N. body text' "
        "paragraphs (confirmed live: Gravissimum Educationis EN specifically; its own PT "
        "translation does NOT share this convention and parses cleanly). This is fixable "
        "without re-crawling -- raw HTML is cached in corpus/raw/ -- but needs a "
        "section-title-aware pass this parser does not yet have."
    ),
    "encyclical.pascendi-dominici-gregis.pt": (
        "NOT a parser gap and not fixable by better parsing: confirmed by direct "
        "inspection of the cached raw HTML that this page's whole content region "
        "contains zero digit-leading paragraph openings and zero anchor markers of any "
        "kind -- the Portuguese edition of this encyclical was typeset as continuous "
        "prose under 'PARTE'/'CAPÍTULO' headings with no inline paragraph numbering "
        "at all, unlike its own EN sibling (57 numbered paragraphs, parses cleanly to 58 "
        "sections after the usual unnumbered-first-paragraph promotion). There is no "
        "number to recover from the source; inventing one would be fabrication."
    ),
    "encyclical.quae-ad-nos.en": (
        "NOT a parser gap and not fixable by better parsing: confirmed by direct "
        "inspection of the cached raw HTML that this page's whole content region "
        "(2,396 chars of real prose -- a short pastoral letter to the bishops of "
        "Bohemia and Moravia, not a numbered treatise) contains zero digit-leading "
        "paragraph openings and zero anchor markers of any kind. A second confirmed "
        "instance of the same source characteristic as "
        "encyclical.pascendi-dominici-gregis.pt (see that entry): some short/pastoral "
        "encyclicals were simply never typeset with inline paragraph numbers on "
        "vatican.va, in either language. There is no number to recover from the "
        "source; inventing one would be fabrication. (This document's PT edition is "
        "a translation stub -- see StubPageError -- so there is no numbered sibling "
        "to cross-check against here, unlike Pascendi.)"
    ),
    "encyclical.mense-maio.pt": (
        "NOT a parser gap and not fixable by better parsing: same source characteristic as "
        "encyclical.pascendi-dominici-gregis.pt and encyclical.quae-ad-nos.en -- confirmed by "
        "direct inspection that this page's whole content region (12,731 chars of real prose, "
        "Paul VI 1965) contains zero digit-leading paragraph openings and zero anchor markers. "
        "Its EN sibling has 16 cleanly bare-digit-numbered sections; the PT edition was simply "
        "never typeset with inline numbers on vatican.va. No number to recover; inventing one "
        "would be fabrication."
    ),
    "encyclical.vigilanti-cura.en": (
        "NOT a parser gap and not fixable by better parsing: this page's real, substantial "
        "content (27,679+ chars, Pius XI 1936) is organized entirely under bold, named-anchor "
        "TOC-style subheadings (`<p><b><a name=\"The_Influence_of_the_Motion_Picture\"></a>The "
        "Influence of the Motion Picture</b></p>`, five more like it) with continuous unnumbered "
        "prose underneath each -- zero plain-digit paragraph numbers anywhere on the page. Its "
        "PT sibling parses cleanly to 44 bare-digit-numbered sections, so this is the mirror "
        "image of Pascendi (there the EN was numbered and PT wasn't; here PT is numbered and EN "
        "isn't). No number to recover from the EN source; inventing one would be fabrication."
    ),
    "encyclical.divini-illius-magistri.pt": (
        "NOT a parser gap and not fixable by better parsing: confirmed by direct inspection "
        "that this page's real content (105,673 chars, Pius XI 1929) is organized as a lettered/"
        "roman outline -- bold headings like 'A) Em geral', 'a) De modo sobreeminente', 'b) "
        "Essência, importância e excelência da Educação Cristã', nested under bold ALL-CAPS "
        "part titles like 'A QUEM PERTENCE A EDUCAÇÃO' -- with zero plain-digit paragraph "
        "numbers anywhere; the only anchors present are unrelated footnote-reference anchors "
        "('fnref1', 'fnref2', ... -- note: NO underscore prefix, a footnote-marker naming "
        "variant not otherwise seen in this corpus, though moot here since the document has no "
        "numbered paragraphs to attach footnotes to via this parser's model). Its EN sibling "
        "parses cleanly to 102 bare-digit sections. Addressing this PT edition would need a "
        "wholly different addressing scheme (lettered-outline position, not paragraph number) -- "
        "a schema question, not a parser bug -- so it is left undone rather than fabricating "
        "arabic numbers the source never printed."
    ),
    "encyclical.miranda-prorsus.en": (
        "Not a total failure -- worth distinguishing from the zero-section "
        "cases above: this page (Pius XII 1957, ~80K chars of real prose) captured only 4 of "
        "what should be a much longer sequence (139 blocks logged as unnumbered orphan content, "
        "a 35x orphan/section ratio -- see validate_document's orphan-ratio guard, which is what "
        "flagged this as invalid rather than letting it pass as a deceptively small 'clean' "
        "4-section document). The page is organized under a mix of italic mini-headings "
        "('Motivos do interesse da Igreja', 'Precedentes da Encíclica', ...) and continuous "
        "prose; footnotes use the standard `_ftnrefN` convention (so footnote resolution itself "
        "is fine), but paragraph numbering is sparse/inconsistent rather than absent outright, "
        "unlike the fully-unnumbered cases. A real fix would need this specific page's actual "
        "numbering convention characterized paragraph-by-paragraph, not assumed from the 4 "
        "matches found by accident -- not attempted here; left flagged rather than shipped as a "
        "falsely-clean 4-section document."
    ),
    "encyclical.miranda-prorsus.pt": (
        "NOT a parser gap and not fixable by better parsing: same document as "
        "encyclical.miranda-prorsus.en (see that entry for the EN side's different, partial "
        "failure mode); the PT edition (80,088 chars of real prose) has zero digit-leading "
        "paragraph openings at all despite using the standard `_ftnrefN` footnote convention "
        "(footnotes alone would resolve fine). Organized under italic mini-headings with "
        "continuous unnumbered prose underneath, the same shape as Pascendi/Mense Maio/Quae Ad "
        "Nos. No number to recover; inventing one would be fabrication."
    ),
    # encyclical.mortalium-animos.pt's former entry here (a "2, 3, then jumps
    # straight to 8 with no 4/5/6/7 heading anywhere" diagnosis) is now
    # obsolete and was factually wrong about the source: headings 4-7 DO
    # exist in the raw HTML (confirmed live), each missing its own opening
    # <p> the same way the numbered paragraph in _gap_block's docstring is --
    # they were invisible to the old parser, not absent from the page. The
    # gap-recovery fix now captures all of 1..19 contiguously; removed
    # rather than left to mislead the next reader into thinking this
    # document is still defeated or that 4-7 are genuinely unnumbered in
    # the source.
    "encyclical.quadragesimo-anno.pt": (
        "This page (Pius XI 1931, the Rerum Novarum 40th-anniversary encyclical) opens with a "
        "long unnumbered historical recap organized under bold/italic topic labels ('A Encíclica "
        "«Rerum novarum»', 'Sua ocasião', 'Tópicos principais', ...) before its real numbered "
        "content begins -- only sections 1-5 were captured (133 blocks logged as orphan content, "
        "a 26.6x ratio -- see validate_document's orphan-ratio guard) against an EN sibling "
        "running to 148 sections. Checked against the missing-<p>-after-a-block family fixed for "
        "the 11 PT encyclicals in docs/research/vatican-documents.md §7.1 (and, discovered "
        "alongside them, Mortalium Animos PT -- no longer a PARSER_DEFEAT_NOTES entry, see the "
        "comment above this one): that fix's own re-parse left this document's section "
        "count/range completely unchanged, so whatever breaks numbering resumption after section "
        "5 here is a genuinely different, not-yet-characterized shape, not the same defect. Not "
        "investigated past confirming that -- flagged rather than guessed at."
    ),
}


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
    "encyclical.dilexit-nos.pt": (
        "KNOWN SOURCE DEFECT (undocumented, not correctable): section 206 has an anchor "
        "bookmark (`<a name=\"206\"></a>`) but the source never prints the visible '206.' "
        "paragraph number that every sibling paragraph has (204, 205, 207, 208 all print their "
        "number normally) -- confirmed by direct comparison with the EN edition, which prints "
        "'206.' as a plain bare digit at the equivalent point. Because no number is printed, "
        "this parser's normal 'unnumbered paragraph between two numbered ones' promotion never "
        "triggers here (that path requires the content to be sitting as unclaimed orphan content "
        "when the following number is found; here it silently became a continuation of section "
        "205's own text instead, since section 205 was still open when this paragraph was "
        "encountered) -- so the real text is NOT lost (it is preserved, appended to the end of "
        "section 205's text field) but section 206 does not exist as its own addressable unit, "
        "and validate_document correctly reports it as a gap (`gaps in 1..220: missing [206]`) "
        "rather than hiding it. Not fabricated: promoting the anchor's bare name=\"206\" to a "
        "printed section number the page itself never shows would be inventing content the "
        "source doesn't have."
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
            "PARSER DEFEATED -- zero sections captured. "
            + PARSER_DEFEAT_NOTES.get(
                work_id,
                "Cause not auto-diagnosed for this specific document -- inspect the cached "
                "raw HTML in corpus/raw/ to determine whether this is a recoverable parser "
                "gap (a numbering convention this parser doesn't yet handle) or a genuine "
                "source characteristic (e.g. an edition with no inline paragraph numbers at "
                "all) before assuming either. structure.json/sections.json are empty; do "
                "not treat this as a published work until diagnosed.",
            ),
        )
    elif work_id in PARSER_DEFEAT_NOTES:
        # A non-zero-section document can still be a real parser defeat --
        # e.g. one caught by validate_document's orphan-ratio guard, where
        # a handful of sections were captured but the vast bulk of real
        # content silently fell into the orphan bucket instead. The
        # zero-section branch above only fires on total failure; this
        # covers a documented partial one instead of leaving it to the
        # generic gaps/orphan-count notes below to explain on their own.
        notes.insert(0, "PARSER DEFEATED (partial) -- " + PARSER_DEFEAT_NOTES[work_id])
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


def _tree_has_real_span(nodes: list[Node]) -> bool:
    """True if any node in this (sub)tree owns a non-null span. Used to
    distinguish a document with genuine internal heading structure (Vatican
    II's Parts/Chapters, LG's chapter nodes -- where SOME nodes carry real
    bounds even if one sibling, like LG's APPENDIX, is deliberately
    null-bounded for its own documented reason) from a document where
    heading detection produced nothing structurally useful at all."""
    for node in nodes:
        if node.span[0] is not None:
            return True
        if _tree_has_real_span(node.children):
            return True
    return False


def build_structure(state: ScrapeState, title: str) -> list[dict]:
    """Finalizes state.root_children into the structure.json shape.

    Most flat documents (the overwhelming majority of the encyclical corpus:
    no PART/CHAPTER apparatus, just sequentially numbered paragraphs) have
    no real internal heading to own those numbers -- push_heading only ever
    fires here for incidental bold blocks that aren't real containers (a
    document's own byline, a trailing "PIUS XI" signature block), which
    means state.sections gets populated with the stack empty (see
    start_section's "no open structure node" branch) and whatever
    incidental heading nodes exist end up with an empty `own` and a null
    span from compute_span -- even though the document has perfectly
    addressable sections 1..N. That silently violates corpus-schema.md's
    contract for a heading-less document ("gets a trivial single-node tree
    spanning its full section range"): null bounds are supposed to mean
    "this structure node's content is genuinely unaddressable" (LG's
    APPENDIX), not "the document has no headings" -- and every consumer
    treats a null-bounded node as unlinkable/unaddressable, so a numbered
    document coming out this way is corpus data that lies about its own
    addressability, not a cosmetic gap. Confirmed live across the sweep
    (e.g. Acerba Animi EN: 23 cleanly-numbered sections, root_children a
    single childless "PIUS XI" node -- its own closing signature line,
    the only bold block on the whole page -- with paragraphs: [null,
    null]). Fixed by falling back to one trivial node spanning
    [min(n), max(n)] whenever NO node anywhere in the tree ended up with a
    real span despite real sections existing; a document with genuine
    heading structure (even one with a deliberately null-bounded sibling
    like LG's APPENDIX) is untouched, since in that case other nodes DO
    carry real bounds and this condition never fires."""
    for node in state.root_children:
        node.compute_span()
    if state.sections and not _tree_has_real_span(state.root_children):
        lo, hi = min(state.sections), max(state.sections)
        return [{"kind": "sub", "title": title, "paragraphs": [lo, hi], "children": []}]
    return [n.to_dict() for n in state.root_children]


def write_document_outputs(work_id: str, manifest: dict, state: ScrapeState, structure: list[dict]) -> None:
    out_dir = WORKS_ROOT / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    sections = [state.sections[n].to_dict() for n in sorted(state.sections)]
    # build_manifest constructs a fresh dict every call, with no knowledge
    # of what was already on disk -- fine for every field it owns, but
    # `translations` (docs/corpus-schema.md #Documents) is recorded by a
    # SEPARATE post-hoc reconciliation pass, not by this scrape itself, so
    # a --overwrite re-parse of this exact document (a routine, expected
    # operation -- e.g. after a parser fix) would otherwise silently wipe
    # it. Preserved here rather than trusting every future caller to
    # remember to re-run reconciliation afterward.
    existing_path = out_dir / "manifest.json"
    if existing_path.exists() and "translations" not in manifest:
        try:
            existing = json.loads(existing_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            existing = {}
        if "translations" in existing:
            manifest["translations"] = existing["translations"]
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
    except StubPageError as exc:
        # Not a parser defeat -- the page has no real content to parse (see
        # StubPageError's docstring). Bucketed with fetch-failed/no-pt-url
        # in reporting: a translation that does not exist, not a document
        # this scraper failed to read. Deliberately nothing is written to
        # corpus/works/ -- writing an empty/degraded work here would be
        # exactly the "silent gap dressed as data" this project's posture
        # rules out, and it would also permanently wedge future re-runs
        # via the already-written short-circuit above.
        result["status"] = "no-translation-stub"
        result["error"] = str(exc)
        return result
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

    title = title_hint or ref.slug.replace("-", " ").title()
    structure = build_structure(parse.state, title)
    ok, problems = validate_document(ref.slug, parse.state, structure)
    promulgated = parse_promulgation_date(ref.date_digits)
    manifest = build_manifest(
        work_id, ref.document_kind, title,
        lang, ref.pontiff_or_council, promulgated, url, parse.retrieved_at,
        parse.state, parse,
    )
    write_document_outputs(work_id, manifest, parse.state, structure)

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
        touch_crawl_lock(CRAWL_LOCK_PATH)
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
                if r_pt["status"] in ("fetch-failed", "no-translation-stub"):
                    pt_status = "pt-unavailable (expected for many pontificates, see survey)"
            print(f"  {ref.slug}: en={r_en['status']} pt={pt_status}")
            touch_crawl_lock(CRAWL_LOCK_PATH)
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
                touch_crawl_lock(CRAWL_LOCK_PATH)
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
# Single-instance lock (phase1/phase2 -- both write into the shared
# corpus/works/ tree and both make real network requests against
# vatican.va's Crawl-delay: 2 commitment). Added after a real incident: an
# operator's second invocation was launched believing a first one had died,
# based on `ps` showing nothing -- but in the runtime this actually ran
# under, a detached/backgrounded process started by one shell invocation is
# genuinely alive yet invisible to `ps`/`ps aux` (and to `os.kill(pid, 0)`)
# run from a *later*, separately-sandboxed invocation -- each such
# invocation appears to get its own process/PID-namespace view, where even
# PIDs are renumbered from a low base. That means pid-liveness checks
# (`os.kill(pid, 0)`) are actively misleading here: a genuinely-alive
# process's pid, checked from a different invocation, reads back as
# ProcessLookupError ("dead") every time -- the opposite of a false
# negative, a *guaranteed* false negative. So this lock deliberately does
# NOT use pid liveness to decide staleness (recorded in the file only for
# human diagnostics). It uses a heartbeat instead: the holder re-touches
# the lock file periodically (see touch_crawl_lock, called from inside the
# per-document scrape loops) and a lock is only considered abandoned once
# its heartbeat is older than LOCK_STALE_AFTER -- a real crash stops the
# heartbeat immediately, a real multi-hour run keeps refreshing it, and no
# part of the check depends on process visibility across invocations.
# --------------------------------------------------------------------------

LOCK_STALE_AFTER = 900  # seconds; no heartbeat within this window means abandoned (crashed)


class LockHeld(Exception):
    pass


def _lock_heartbeat_age(lock_path: Path) -> tuple[float, dict]:
    info: dict = {}
    try:
        info = json.loads(lock_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        pass
    heartbeat = 0.0
    try:
        heartbeat = float(info.get("heartbeat", info.get("started", 0)) or 0)
    except (TypeError, ValueError):
        pass
    return time.time() - heartbeat, info


def acquire_crawl_lock(lock_path: Path) -> None:
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    if lock_path.exists():
        age, info = _lock_heartbeat_age(lock_path)
        if age < LOCK_STALE_AFTER:
            raise LockHeld(
                f"a crawl already appears to be running (pid {info.get('pid')}, last "
                f"heartbeat {age:.0f}s ago; lock file {lock_path}). Not starting a second "
                f"one -- it would race the same corpus/works/ output and double the request "
                f"rate against vatican.va. If you are certain that process is dead (a "
                f"heartbeat this recent should only happen on an active run -- see "
                f"touch_crawl_lock), remove the lock file and retry."
            )
    now = time.time()
    lock_path.write_text(json.dumps({"pid": os.getpid(), "started": now, "heartbeat": now}), encoding="utf-8")


def touch_crawl_lock(lock_path: Path) -> None:
    """Refresh the heartbeat so a genuinely long-running crawl doesn't look
    abandoned to acquire_crawl_lock's staleness check. Best-effort: called
    frequently (per document) from inside the phase1/phase2 loops; a
    missing/unreadable lock file is not fatal here, since a lock is
    advisory infrastructure for *other* invocations, not something this
    process depends on to keep working."""
    if not lock_path.exists():
        return
    try:
        info = json.loads(lock_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        info = {"pid": os.getpid(), "started": time.time()}
    info["heartbeat"] = time.time()
    try:
        lock_path.write_text(json.dumps(info), encoding="utf-8")
    except OSError:
        pass


def release_crawl_lock(lock_path: Path) -> None:
    try:
        lock_path.unlink()
    except FileNotFoundError:
        pass


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

    if args.cmd in ("phase1", "phase2"):
        try:
            acquire_crawl_lock(CRAWL_LOCK_PATH)
        except LockHeld as e:
            print(f"ERROR: {e}")
            return 1

    if args.cmd == "phase1":
        try:
            langs = ["en", "pt"] if args.lang == "both" else [args.lang]
            only = args.only.split(",") if args.only else None
            results = run_phase1(fetcher, langs, only)
        finally:
            release_crawl_lock(CRAWL_LOCK_PATH)
        summarize(results)
        print(f"\nnetwork fetches this run: {fetcher.network_fetches} (retried-then-ok: {fetcher.retried_ok})")
        ok = all(r["status"] in ("validated", "already-written") for r in results)
        sym_ok, sym_problems = check_language_symmetry()
        print(f"\n=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}")
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if (ok and sym_ok) else 1

    if args.cmd == "phase2":
        try:
            pontiffs = args.pontiffs.split(",") if args.pontiffs else None
            results = run_phase2(fetcher, pontiffs, args.time_budget, args.limit, args.exhortations)
        finally:
            release_crawl_lock(CRAWL_LOCK_PATH)
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
