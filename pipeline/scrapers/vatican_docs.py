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
    - "bracket": bare `[N]` inline, no <sup> and no anchor (36 works)
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

`--jobs N` (phase1/phase2) sets how many worker processes PARSE. It does not
and cannot affect how fast this crawls: fetching stays serial in the parent
behind the 2s crawl delay, and only the work after the bytes arrive fans out.
`--jobs 1` runs everything inline, which is what to use when a parser crash
needs a real traceback.

Every fetched page (index pages and document pages alike) is cached under
corpus/raw/vatican-docs/ and reused offline on re-run -- phase 2 in
particular is designed to be interrupted and resumed: re-running the same
command after a partial run only fetches what's still missing, and a
document already written to corpus/works/ is left untouched (use
--overwrite to force a re-parse of an already-written document from its
cached raw HTML, no network needed).

"What's still missing" has to include what is missing AT THE SOURCE, or the
resumption is not free. Ten Pius XI/XII encyclicals have no Portuguese
translation and two pontificate indexes do not exist; each 404 was retried
MAX_ATTEMPTS times with backoff on EVERY run, and nothing recorded the
outcome. That made a supposedly zero-network `--overwrite` cost 36 requests
and 2m59s of wall clock against 6.5s of CPU. `pipeline/absent-sources.json`
(common.AbsentSources) now remembers a definitive 404/410 so the next run
does not ask again, and `--recheck-absent` re-asks when you want to know
whether a translation has appeared.

Removing that sleep left the run CPU-bound for the first time -- 6.25s pinned
to one core, 61% of it inside re.Pattern.sub -- so `scrape_one` was split into
`fetch_for_parse` (serial, the network) and `parse_and_write` (a pure function
of bytes already fetched, run in a worker pool). A full re-parse is now ~1.3s.
The two are driven apart rather than back to back, so on a REAL crawl a
document parses inside the 2s the parent is already obliged to spend sleeping
before the next request: parsing stops adding to a crawl's wall clock instead
of being made to go faster.

NOTE ON THE ROOTS: this file may run from a git worktree
(.claude/worktrees/*/). Both roots are now derived from __file__, so both
follow whichever checkout the code being run lives in.

  SOURCE_ROOT -- where pipeline/corrections/ lives. Derived from
  __file__, the way ccc.py/compendium.py do it, because corrections ARE
  tracked source: `docs/decisions.md`'s Corrections and overrides
  makes git history the audit log, so a correction must land in whatever
  checkout its scraper change is being written in. Hardcoding this one
  wrote correction files into the main checkout while their scraper code
  sat on a worktree branch -- splitting the audit trail from the code it
  documents, and needing a sandbox escape to do it.

  DATA_ROOT -- where corpus/ lives. This was hardcoded to one absolute
  path on the reasoning that corpus/ was gitignored, so a worktree-local
  copy would be an orphaned duplicate no other tool reads. That stopped
  being true on 2026-08-16, when corpus/ became tracked (CLAUDE.md,
  docs/decisions.md). A tracked corpus/ IS present in a worktree, and the
  hardcoded path had by then drifted into a near-empty directory. Two
  things went wrong while it pointed there, both silent: re-parsed output
  landed outside the tracked corpus, reaching neither the site build nor
  git; and because the raw cache it read was empty, `--overwrite`
  RE-CRAWLED vatican.va instead of re-parsing -- the precise failure
  "re-parse, never re-crawl" (docs/link-surface.md) exists to prevent, and
  one that reports itself only as a nonzero fetch count in the run
  summary. Deriving it from __file__ keeps the raw cache and the parser in
  the same checkout, which is what makes a re-parse provably zero-network.
"""

from __future__ import annotations

import argparse
import collections
import contextlib
import difflib
import html as ihtml
import itertools
import json
import multiprocessing
import os
import re
import sys
import time
import urllib.parse
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from pathlib import Path

# Sibling package in this directory -- a script's own directory is on sys.path,
# so this resolves regardless of the working directory. See common/__init__.py's
# docblock for what does and does not belong there.
from common import (
    Fetcher,
    FetchPolicy,
    OverrideDriftError,
    apply_overrides,
    corpus_dir,
    corrections_receipt,
    fold,
    fold_index,
    load_corrections,
    load_overrides,
    load_translations_checked,
    looks_like_number_typo,
    read_text_or_none,
    require_corpus,
    roman_to_int,
    write_stamped_json,
)

#: How this scraper conducts itself toward vatican.va. The 2.0s is from that
#: host's robots.txt `Crawl-delay` and is a commitment (docs/decisions.md),
#: not a tuning parameter; the retries are for the ~1-in-6-to-8 transient edge
#: failures the 2026-08-15 survey measured (no 403s, no CAPTCHA).
VATICAN_POLICY = FetchPolicy(
    user_agent="Glossa Catholica corpus builder",
    delay=2.0,
    attempts=3,
    backoff=(3.0, 8.0),
)

# See "NOTE ON THE ROOTS" in the module docstring. The two roots diverged
# again on 2026-08-23: the corpus moved to its own private repository, so
# DATA_ROOT is resolved by `common.corpus_dir()` ($CORPUS_DIR, else a
# `glossa-corpus/` sibling) while SOURCE_ROOT still follows this checkout.
DATA_ROOT = corpus_dir()
SOURCE_ROOT = (
    Path(__file__).resolve().parents[2]
)  # tracked source; follows this file's checkout
RAW_ROOT = DATA_ROOT / "raw" / "vatican-docs"
WORKS_ROOT = DATA_ROOT / "works"

#: `work_id -> {lang: status record}`, read once. Lives in THIS checkout,
#: not the corpus, because it is knowledge derived about the sources rather
#: than a page fetched from them -- the same argument absent-sources.json is
#: kept here by, and the reason a rebuilt `works/` still carries the field.
TRANSLATIONS_CHECKED = load_translations_checked()
CRAWL_LOCK_PATH = (
    RAW_ROOT / ".crawl.lock"
)  # see acquire_crawl_lock/touch_crawl_lock below
PROGRESS_PATH = RAW_ROOT / "_progress.json"

MARK_OPEN, MARK_CLOSE = "⟦", "⟧"

VATII_INDEX_URL = (
    "https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm"
)
VATII_DOC_BASE = (
    "https://www.vatican.va/archive/hist_councils/ii_vatican_council/documents/"
)

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


def make_fetcher(recheck_absent: bool = False) -> Fetcher:
    """This scraper's fetcher: the shared skeleton, VATICAN_POLICY's conduct.

    The retry/absence behaviour that used to live in a local `Fetcher` class is
    now `VATICAN_POLICY` plus `common.Fetcher`; what stayed here is the part
    that is about this source rather than about fetching -- the charset sniff
    in `decode_page`, and the cache directory."""
    return Fetcher(
        RAW_ROOT,
        VATICAN_POLICY,
        decode=decode_page,
        recheck_absent=recheck_absent,
    )


# --------------------------------------------------------------------------
# Text utilities (ported from ccc.py, unchanged in behavior)
# --------------------------------------------------------------------------


# The tags that mark up a RUN OF TEXT rather than separate two of them, and
# so leave no space behind when removed. Exactly the set `narrow_html` keeps
# as inline emphasis (`_HTML_ALLOWED_SIMPLE` plus a bare `<sup>`); `br` and
# `blockquote` survive narrowing too but ARE separators and stay a space,
# as does every tag narrowing drops.
#
# Keeping this set in step with what `narrow_html` keeps is what holds the
# round-trip invariant `html_to_text(html) == text_marked` exact: both sides
# must agree on every tag, and they only see the same tags because one is
# derived from the other's input.
_INLINE_TEXT_TAGS = frozenset({"i", "em", "b", "strong", "sup"})
_TEXT_TAG_RE = re.compile(r"<\s*(/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>")


def strip_tags(s: str) -> str:
    """Plain text from markup: a separator tag becomes a space, an emphasis
    tag becomes nothing.

    Every tag used to become a space, which was wrong in one direction and
    accidentally right in another, and the two had to be separated before
    either could be fixed. Wrong: `Constitution <i>Esti minime</i>.` read
    back as `Esti minime .`, and `Sh<sup>e</sup>ma` as `Sh e ma` -- 6,436
    spurious spaces over 17.2% of sections, none of them in the source.
    Accidentally right: where the SOURCE omits a space around a tag
    (`<i>modus vivendi</i>had`, `with the<i>reaffirmation`), the substituted
    space papered over the gap. That is a source defect and belongs in
    `pipeline/corrections/` with evidence, not in a text rule that has to
    corrupt 6,436 correct passages to hide 33 broken ones.

    Emphasis cannot be stripped by a whitespace pass afterwards, either: the
    corpus's own text prints spaced punctuation on purpose -- 2,450 `« x »`,
    960 `( 1 )`, 2,300 `. . .` -- so a rule keyed on the CHARACTERS could not
    tell the source's spacing from ours. Only the tag boundary can, and this
    is where it is still known."""

    def one(m: re.Match[str]) -> str:
        return "" if m.group(2).lower() in _INLINE_TEXT_TAGS else " "

    s = _TEXT_TAG_RE.sub(one, s)
    # Comments, doctypes and anything else angle-bracketed that isn't a tag:
    # unchanged behaviour, and never an emphasis run.
    s = re.sub(r"<[^>]+>", " ", s)
    s = ihtml.unescape(s)
    s = s.replace("\xa0", " ")  # &nbsp; after unescape
    return re.sub(r"\s+", " ", s).strip()


# --------------------------------------------------------------------------
# Narrowed inline HTML (docs/decisions.md §Storage)
# --------------------------------------------------------------------------
#
# A unit's text is stored as HTML restricted to a closed allowlist, rather
# than as tag-stripped plain text plus a parallel ⟦n⟧-marked copy. The
# allowlist was derived by counting tags inside numbered body paragraphs
# across all 465 raw pages, not by assumption -- see the decision entry for
# the table. Two results worth restating here, because both contradict what
# a reader would guess: `<small>` never occurs, and `span[lang]` does (263
# times), marking Latin inside vernacular text.
#
# `em` folds to `i` and `strong` to `b`. HTML5's `<i>` means idiomatic text
# -- foreign phrases and work titles -- which is exactly what this corpus
# italicises; `<em>` would assert stress emphasis the source never claimed.
#
# THE INVARIANT, and why disallowed tags become a space rather than nothing:
# `strip_tags` substitutes " " for every tag, so `a<font>b</font>c` has
# always produced "a b c". Dropping a disallowed tag to "" instead would
# silently reflow text that has been in the corpus since the first crawl.
# Emitting a space keeps `html_to_text(html) == <the stored text>` exact,
# which is what makes the migration checkable rather than merely plausible.
_HTML_ALLOWED_SIMPLE = {"i": "i", "em": "i", "b": "b", "strong": "b"}
_TAG_RE = re.compile(r"<\s*(/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(/?)\s*>")
_FN_EL_RE = re.compile(r"<sup\s+data-fn=\"[^\"]*\"\s*></sup>")


def narrow_html(marked_html: str, dropped: collections.Counter | None = None) -> str:
    """Reduce already-footnote-marked inner HTML to the stored allowlist.

    Input is the output of `mark_footnotes` (⟦n⟧ tokens embedded); those
    become `<sup data-fn="n"></sup>` so the stored payload is one syntax
    rather than two. Unknown tags are dropped but their TEXT is kept, and
    counted into `dropped` for anomaly reporting -- logged, never silently
    absent, the same posture as everything else in this scraper."""
    out: list[str] = []
    pos = 0
    for m in _TAG_RE.finditer(marked_html):
        out.append(escape_text_run(marked_html[pos : m.start()]))
        pos = m.end()
        closing, name, _attrs = bool(m.group(1)), m.group(2).lower(), m.group(3)
        if name in _HTML_ALLOWED_SIMPLE:
            tag = _HTML_ALLOWED_SIMPLE[name]
            out.append(f"</{tag}>" if closing else f"<{tag}>")
        elif name == "br" and not closing:
            out.append("<br/>")
        elif name == "blockquote":
            out.append("</blockquote>" if closing else "<blockquote>")
        elif name == "sup":
            # A <sup> still standing after mark_footnotes is not a footnote
            # reference -- 106 of them across 11 files, and roughly half are
            # real typography inside bibliographic citations ("Paris 1960²",
            # "2ª"), which dropping would flatten to "1960 2". Keeping it is
            # invariant-neutral: an unattributed <sup> strips to a space
            # exactly as dropping it would. The renderer tells the two apart
            # by the data-fn attribute, which only marker elements carry.
            out.append("</sup>" if closing else "<sup>")
        elif name == "span":
            # Not allowlisted. `span[lang]` looked like semantics worth keeping
            # until its values were read: all 486 occurrences are lang="pt"
            # inside Portuguese documents, wrapping Portuguese headings. Export
            # noise. The text is kept; the wrapper is not.
            out.append(" ")
        else:
            if dropped is not None and not closing:
                dropped[name] += 1
            out.append(" ")
    out.append(escape_text_run(marked_html[pos:]))
    html = "".join(out)
    html = re.sub(
        rf"{MARK_OPEN}([0-9A-Za-z*]+){MARK_CLOSE}", r'<sup data-fn="\1"></sup>', html
    )
    return re.sub(r"\s+", " ", html).strip()


def escape_text_run(s: str) -> str:
    """Re-encode one run of text content between tags: decode whatever entity
    form the source used, then escape only the three characters that would
    otherwise be structural.

    WHY, rather than passing the source's entities through. vatican.va's
    export writes accented characters as named entities -- `&atilde;` 47,570
    times, `&ccedil;` 34,693, and a long tail after that. A browser decodes
    them for free, and the site could simply hand the string to one: the
    payload is not untrusted input, since `narrow_html` above rebuilt it
    from a closed five-tag allowlist. It is handed to {@html} elsewhere for
    exactly that reason (`manifest.header`, an inert masthead).

    Body and heading text is not inert, though. Three features have to reach
    INSIDE the markup: `<sup data-fn>` has to become the footnote disclosure
    button (past {@html} it renders as an empty superscript and the citation
    apparatus silently disappears), `linkifyProse` has to find "cf. Jn 3:16"
    in the text but not inside a tag, and the drop cap needs the first letter
    of the first text run. Any of those means walking the markup rather than
    pasting it, and once the renderer is walking it, it is decoding the text
    too. Against the source's entity vocabulary that means shipping an HTML
    entity table to the client and keeping it complete forever; against
    `&amp;`/`&lt;`/`&gt;` it means three cases that cannot grow.

    So the decoding happens here, once, where Python's own table is already
    complete and correct. `&nbsp;` decodes to U+00A0 and is then collapsed
    by the caller's whitespace pass, which is what `strip_tags` does to it
    as well -- the round-trip invariant is unaffected, and 1,301 stored
    non-breaking spaces stop rendering as a stray double space."""
    return (
        ihtml.unescape(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


_MARKER_TOKEN_RE = re.compile(rf"{MARK_OPEN}[0-9A-Za-z*]+{MARK_CLOSE}")


def strip_markers(text: str) -> str:
    """Drop ⟦n⟧ footnote tokens and tidy the space they leave."""
    if not text:
        return text
    return re.sub(r"\s+", " ", _MARKER_TOKEN_RE.sub("", text)).strip()


def heading_inner_html(html: str) -> str:
    """A heading's narrowed html with its OWN emphasis stripped, or "" when
    nothing meaningful is left.

    A heading is recognised BY its emphasis -- `is_full_bold` is the whole
    detector -- so the `<b>` wrapping the entire title is our own detection
    signal showing through, not something the document is saying about the
    words. Storing it would make every heading bold twice and tell a
    renderer nothing. Emphasis covering only PART of the title is different:
    that is the source distinguishing words inside the heading, and it is
    lost today.

    Measured over all 3,656 heading blocks in corpus/raw/vatican-docs: 3,648
    carry `<i>`/`<b>`, but only 153 (in 51 pages) carry any once the
    full-coverage wrappers come off -- encyclical titles inside a heading
    (`THE MESSAGE OF <i>POPULORUM PROGRESSIO</i>`), scripture references
    (`QUEM ME VÊ, VÊ O PAI (CF. <i>JO</i> 14, 9)`), and the Latin phrase in
    Magnifica Humanitas' `The <i>res novae</i> of our time`. Those 153 are
    what this returns; the other 3,503 come back "" and store nothing.

    Applied repeatedly, because both wrappers can cover the whole title
    (`<i><b>Title</b></i>`) and removing one exposes the other."""
    prev = None
    while prev != html:
        prev = html
        if is_full_bold(html):
            html = re.sub(r"</?b>", "", html)
        if is_full_italic(html):
            html = re.sub(r"</?i>", "", html)
    # A <br/> inside a heading is where the SOURCE's measure ran out, not
    # something the heading says. Lumen Gentium PT breaks its eighth chapter
    # after `MÃE DE DEUS`, which is a line-wrap in the middle of one title and
    # lands in the wrong place at any other width. The words are unchanged and
    # `title` already joins them with a space; this stops `title_html` from
    # carrying the source's page layout into ours. Recoverable from raw/, like
    # every other typographic loss.
    html = re.sub(r"<br\s*/?>", " ", html, flags=re.IGNORECASE)
    html = re.sub(r"\s+", " ", html).strip()
    return html if re.search(r"<(?:i|b|sup)\b", html) else ""


def html_to_text(html: str) -> str:
    """The stored `text` a narrowed html string must reproduce exactly.

    Footnote elements vanish without leaving a space -- `Section.resolve`
    removes ⟦n⟧ with "" -- so `word<sup data-fn="12"></sup>.` reads back as
    "word." and not "word ." . The remaining tags follow `strip_tags`:
    emphasis (`i`/`b`/`sup`) leaves nothing behind, `br` and `blockquote`
    leave a space. Removing the marker element here first is therefore no
    longer a special case so much as the same rule applied early -- it has
    to happen before `strip_tags` only because a `<sup>` WITHOUT `data-fn`
    is real typography (`1960²`) that the corpus keeps."""
    return strip_tags(_FN_EL_RE.sub("", html))


_BOLD_SPAN_RE = re.compile(r"<b[^>]*>(.*?)</b>", re.DOTALL | re.IGNORECASE)


_ITALIC_SPAN_RE = re.compile(r"<(i|em)\b[^>]*>(.*?)</\1>", re.IGNORECASE | re.DOTALL)

# What a source may set OUTSIDE a heading's emphasis run without the run
# ceasing to cover the heading. Two things, and deliberately no more:
#
#   the ENUMERATOR it prints in front  -- `I. - <b><i>The Study of Scholastic
#                                         Philosophy</i></b>`, `d) <i>Cristo é
#                                         o "conservador"</i>`, `N.<b> Title</b>`
#   the PUNCTUATION it closes with     -- `<b><i>A Encíclica «Rerum
#                                         novarum»</i></b>.`
#
# and the same punctuation BETWEEN two runs, which is the long-documented
# `<b>CHAPTER I</b> - <b>Title</b>` form. Anything else outside the run means
# the emphasis is a bold lead-in to ordinary prose, not a heading, and the
# test must keep saying no -- that caveat is why the predicate was written as
# exact equality in the first place.
_ENUM_OUTSIDE_RE = re.compile(
    r"^[\s(\[]*(?:\d{1,4}|[IVXLCDM]{1,7}|[A-Za-z])[\s.)\]\u00ba\u00aa]*"
    r"[-\u2013\u2014]?\s*$"
)
_PUNCT_OUTSIDE_RE = re.compile(r"^[\s.,;:\u2013\u2014-]*$")
# A footnote marker is not part of the heading it hangs off. Gaudium et Spes
# PT prints `<p align="center"><b>PROÉMIO</b>(1)</p>`, putting the reference
# outside the bold run, and the whole heading was dropped as furniture --
# the Portuguese counterpart of the English edition's PREFACE, missing from
# structure.json outright. Bracketed only: a bare trailing numeral would make
# a heading of any bold line a source happens to follow with a digit.
_FN_MARKER_OUTSIDE_RE = re.compile(
    r"^[\s.,;:\u2013\u2014-]*(?:\(\d{1,3}\*?\)|\[\d{1,3}\*?\])[\s.,;:\u2013\u2014-]*$"
)


_BLANK_OUTSIDE_RE = re.compile(r"^\s*$")


def _emphasis_covers(
    inner_html: str, span_re: re.Pattern, tolerant: bool = False
) -> bool:
    """Does `span_re`'s emphasis cover this block's text, allowing a source's
    enumerator and punctuation to sit outside it?

    Measured cost of the old exact-equality form: Pascendi EN's entire
    REMEDIES I-VII list vanished from the corpus, because the roman numeral
    sits outside the `<b>`; Mystici Corporis PT lost two lettered
    sub-headings the same way; Quadragesimo PT absorbed one into a paragraph
    over a trailing period. All three are the source setting an enumerator or
    a full stop outside the run it emphasises."""
    spans = list(span_re.finditer(inner_html))
    if not spans:
        return False
    covered = strip_tags("".join(m.group(0) for m in spans))
    if not covered.strip():
        return False
    for a, b in itertools.pairwise(spans):
        if not _PUNCT_OUTSIDE_RE.match(strip_tags(inner_html[a.end() : b.start()])):
            return False
    before = strip_tags(inner_html[: spans[0].start()])
    after = strip_tags(inner_html[spans[-1].end() :])
    outside = _PUNCT_OUTSIDE_RE if tolerant else _BLANK_OUTSIDE_RE
    if not outside.match(after) and not (
        tolerant and _FN_MARKER_OUTSIDE_RE.match(after)
    ):
        return False
    if outside.match(before):
        return True
    return bool(tolerant and _ENUM_OUTSIDE_RE.match(before))


_ANCHOR_TITLE_RE = re.compile(
    r"^\s*<a\s+name=\"([^\"]+)\"\s*>\s*</a>\s*([^<]{1,120}?)\s*$", re.IGNORECASE
)


def _anchor_titles_itself(inner_html: str) -> bool:
    """An empty named anchor whose NAME is the text that follows it.

    `<p><a name="SHATTERED_DREAMS"></a>SHATTERED DREAMS</p>` -- no bold, no
    italic, no centring, nothing `is_full_bold` or either recovery pass can
    see. The anchor is the signal: an empty `<a name>` exists to be linked TO,
    and one whose name spells the paragraph's own text is a heading the page
    means a table of contents to point at. Body prose never carries one.
    """
    m = _ANCHOR_TITLE_RE.match(inner_html)
    if m is None:
        return False
    name = re.sub(r"[^a-z0-9]+", "", m.group(1).lower())
    text = re.sub(r"[^a-z0-9]+", "", ihtml.unescape(m.group(2)).lower())
    return bool(name) and bool(text) and (name == text or text.startswith(name))


def is_full_bold(inner_html: str) -> bool:
    """True when the block's visible text sits inside <b>...</b> --
    ccc.py's heading style detector, widened 2026-08-24 to allow the
    enumerator and punctuation a source sets outside the run (see
    `_emphasis_covers`). The caveat it still guards against is ccc.py's: a
    bold *prefix* of an ordinary paragraph must not read as a heading."""
    if not strip_tags(inner_html):
        return False
    return _emphasis_covers(inner_html, _BOLD_SPAN_RE, tolerant=True)


def is_full_italic(inner_html: str) -> bool:
    """True when the block's visible text sits inside <i>/<em>, the italic
    counterpart of `is_full_bold`.

    Not a heading test on its own -- see `promote_italic_heading_run` for
    why a single italic block is presumed NOT to be a heading. That weakness
    is why it takes NEITHER tolerance `is_full_bold` has, and stays exact.
    Both were measured and both cost more than they returned:

    - the ENUMERATOR tolerance cost Redemptoris Missio EN 9,318 characters of
      §37, whose `(a) <i>Territorial limits.</i>` sub-labels became headings,
      closed the section, and left the prose beneath them orphaned. Those
      sub-labels really are headings; what cannot yet hold them is the walk,
      which has no way to keep a section open across one.
    - the TRAILING-PUNCTUATION tolerance promoted Sacerdotii EN's closing
      dateline, `<i>Given at Rome, at St. Peter's, on August 1, 1959...</i>.`,
      to a level-1 node in the table of contents.

    A heading whose emphasis is bold survives either mistake, because
    `is_full_bold` sees it first. Until the walk can keep a section open
    across a heading, the safer reading of a lone italic line is prose."""
    if not strip_tags(inner_html):
        return False
    return _emphasis_covers(inner_html, _ITALIC_SPAN_RE)


_CENTERED_RE = re.compile(
    r'align\s*=\s*["\']?center|text-align:\s*center', re.IGNORECASE
)


_INDENT_STYLE_RE = re.compile(
    r"(?:margin|padding)-(?:left|inline-start)\s*:\s*(?!0)", re.IGNORECASE
)
_INDENT_NBSP_RE = re.compile(
    r"^(?:\s|<[^>]+>)*(?:(?:&nbsp;|&#160;|&#[xX]0*[aA]0;)\s*){3,}"
)


def is_indented(outer_html: str, inner_html: str) -> bool:
    """Did the source push this block in from the margin?

    Two spellings, both found live: a `style="margin-left: 40px;"` on the
    block (Dilexit Nos EN's Dante quotation), and a run of `&nbsp;` before
    the first word (the same encyclical's John of the Cross verses, whose
    <p> carries no style at all). Three or more, so an ordinary typographic
    space or two is not read as an indent.

    An indent means a QUOTATION here. `heading_style_rank` knows only
    centred against flush-left, so without this the italic-run recovery
    reads quoted verse -- short, fully italic, several in a row -- as a run
    of sub-headings, which is exactly what it looks like to that pass.
    `pipeline/overrides/README.md` records the mirror-image case, PT editions
    using <blockquote> to indent the document's own words; the signal is the
    same in both directions.
    """
    return bool(_INDENT_STYLE_RE.search(outer_html)) or bool(
        _INDENT_NBSP_RE.match(inner_html)
    )


def heading_style_rank(
    outer_html: str, inner_html: str, is_center_tag: bool, anchor_titled: bool = False
) -> int:
    """Rank a heading block by how it LOOKS, not by what it means.

    The corpus distinguishes heading tiers visually and does so consistently
    (docs/research/description-pass-2026-08.md): centered headings outrank
    left-aligned ones, and within either, a plain-bold heading outranks a
    bold-italic one. `haurietis-aquas.pt` splits 7 centered against 21 left
    bold-italic, `sacrosanctum-concilium.pt` 16 against 83,
    `deus-caritas-est.pt` 5 against 13.

    Ranks are compared only WITHIN one document and then compacted to
    contiguous levels, so the absolute numbers carry no meaning across works
    -- a document using only centered and left-italic headings gets levels 1
    and 2, not 1 and 4."""
    centered = is_center_tag or bool(_CENTERED_RE.search(outer_html))
    # An anchor-titled heading carries no emphasis of its own (see
    # `_anchor_titles_itself`), so ranked on markup alone it lands BETWEEN the
    # centred tier and the left-italic one and becomes a tier of its own.
    # Fratelli Tutti prints both kinds under the same chapters, interleaved --
    # `THE BASIS OF CONSENSUS` sits between two italic sub-headings rather than
    # containing either -- so they are peers, and giving the anchored ones the
    # emphasised rank is what says so.
    italic = anchor_titled or bool(re.search(r"<(i|em)\b", inner_html, re.IGNORECASE))
    return (0 if centered else 2) + (1 if italic else 0)


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
    # bare "N." -- with the same transparent-tag tolerance between the digits
    # and their period that `_NUM_PREFIX_HTML_RE` already has when stripping
    # it. Arcanum EN prints `<font size="3">20<i>. </i></font>`, putting the
    # period inside an italic run; the number went unrecognised and §20 was
    # swallowed into §19's text, digits and all, leaving the document with no
    # unit at that address.
    r"|(?P<bare_n>\d(?:(?:<(?!a[\s>])[^>]*>)*\d){0,3})"
    r"(?:\s|&nbsp;|<(?!a[\s>])[^>]*>)*\."
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
    # `bare_n` may carry tags BETWEEN its digits -- Humanae Vitae EN prints
    # paragraph 14 as `1<b>4.</b>`, opening the bold run between the digits
    # rather than before them. Read as a contiguous `\d{1,4}` the block was
    # not a numbered paragraph at all: it was buffered as unnumbered prose,
    # given back to §13, and then promoted a second time to fill the §14 gap
    # its own absence had created. Only one page in the corpus does this, and
    # allowing tags (never whitespace, which would read "1 4." as fourteen)
    # is cheaper than a correction against a source that is not wrong.
    return int(_TAG_RE.sub("", n)), m.end()


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


_BRACKET_MARKER_RE = re.compile(r"\[(\d{1,3}\*?)\]")
# Attached to the word or punctuation it follows -- `"one."[1]`, `head,[4]`.
# That attachment is the discriminator against an editorial `[1]` standing on
# its own, and the count threshold below is the second: a document really
# using this convention has dozens.
_BRACKET_ATTACHED_RE = re.compile(r"[^\s>]\[\d{1,3}\*?\]")
_BRACKET_MIN = 3


# The PAIRED anchor convention, found on 27 Portuguese pages and nowhere
# else: the marker is TWO anchors, `<a name="fnrefN">(</a>` carrying the
# opening bracket and `<a href="#fnN">N</a>` carrying the number, with the
# closing bracket as plain text after them. `_ftnref` (with the underscore)
# does not match it, so `detect_marker_template` fell through to "paren",
# whose regex needs a literal untagged `(N)` -- and here the bracket and the
# digit sit in different elements, so nothing matched either. Every footnote
# on all 27 pages resolved to nothing: 921 of them, `citations: []` in each
# work, with the note text stored nowhere in the corpus.
_FNPAIR_REF_RE = re.compile(
    r"<a\s[^>]*?name=[\"']?fnref(?P<code>[0-9A-Za-z]+)[\"']?[^>]*>.*?</a>"
    r"\s*<a\s[^>]*?href=[\"']?#fn[0-9A-Za-z]+[\"']?[^>]*>(?P<vis>[^<]*)</a>\s*\)?",
    re.IGNORECASE | re.DOTALL,
)


def detect_marker_template(body_html: str) -> str:
    if re.search(r'name=["\']?_ftnref[0-9A-Za-z]+', body_html, re.IGNORECASE):
        return "ftn"
    if _FNPAIR_REF_RE.search(body_html):
        return "fnpair"
    if re.search(r"<sup\b", body_html, re.IGNORECASE):
        return "sup"
    # "bracket": bare `[N]` in the text, with no <sup> and no anchor of any
    # kind -- the whole apparatus is plain characters. Found on 36 works,
    # every one of which stored ZERO citations because the fallthrough to
    # "paren" below matches `(N)` only: Mediator Dei alone prints 171 of
    # them, and its 30-entry note list parsed correctly all along with
    # nothing in the body pointing at it. Checked after "sup"/"ftn" because
    # the "ftn" template already reads a `[N]` echoed beside its anchor.
    if len(_BRACKET_ATTACHED_RE.findall(body_html)) >= _BRACKET_MIN:
        return "bracket"
    return "paren"


def mark_footnotes(inner_html: str, template: str) -> str:
    if template == "fnpair":

        def sub_pair(m: re.Match) -> str:
            # Keyed on the PRINTED number, like every other template: the
            # anchor code and the visible label agree on these pages, but the
            # table is built from the visible one either way.
            visible = strip_tags(m.group("vis")).strip().strip("()[]")
            return f"{MARK_OPEN}{visible or m.group('code')}{MARK_CLOSE}"

        return _FNPAIR_REF_RE.sub(sub_pair, inner_html)
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
            marker = (
                inner_visible
                if inner_visible.isdigit()
                else (m.group(3) or m.group(4) or m.group(1))
            )
            return f"{MARK_OPEN}{marker}{MARK_CLOSE}"

        return _FTNREF_RE.sub(sub_ftnref, inner_html)
    if template == "bracket":
        return _BRACKET_MARKER_RE.sub(
            lambda m: f"{MARK_OPEN}{m.group(1)}{MARK_CLOSE}", inner_html
        )
    return _PAREN_MARKER_RE.sub(
        lambda m: f"{MARK_OPEN}{m.group(1)}{MARK_CLOSE}", inner_html
    )


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
    r'name=["\']?(?:_ftn(?!ref)[0-9A-Za-z]+|\$[0-9A-Za-z]+|%24[0-9A-Za-z]+'
    r"|fn(?!ref)\d[0-9A-Za-z]*)",
    re.IGNORECASE,
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
        candidates.append(
            (tag_start if tag_start != -1 else m.start(), "definition anchor")
        )
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
# The superscript-label form, matched before tags are stripped -- see
# `parse_footnote_entry`. Deliberately anchored and digits-only: a note
# opening with an italic word must not be mistaken for a labelled entry.
_FN_SUP_DEF_RE = re.compile(r"^\s*<sup[^>]*>\s*(\d{1,4})\s*</sup>", re.IGNORECASE)
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
        return marker, strip_tags(raw_inner_html[m.end() :]).strip()
    # `<sup>98</sup>Cf. Second Vatican...` -- the superscript IS the entry's
    # label and the source prints no space after it (Ecclesia de Eucharistia
    # EN, all 104 notes). Matched on the RAW markup, like the anchor form
    # above and for the same reason: the split is structural. `strip_tags`
    # no longer leaves a space where an emphasis tag was (see its
    # docstring), so by the time this is text the label and the note are
    # flush -- "98Cf." -- and no rule over the characters can tell that from
    # a note whose text simply begins with a number.
    m = _FN_SUP_DEF_RE.match(raw_inner_html)
    if m:
        return m.group(1), strip_tags(raw_inner_html[m.end() :]).strip()
    stripped = strip_tags(raw_inner_html)
    m = _FN_PAREN_RE.match(stripped)
    if m:
        return m.group(1), stripped[m.end() :].strip()
    m = _FN_BARE_RE.match(stripped)
    if m:
        return m.group(1), stripped[m.end() :].strip()
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
    r"<a\s[^>]*?name=[\"']?(?:_ftn(?!ref)(?P<ftn>[0-9A-Za-z]+)|\$(?P<dollar>[0-9A-Za-z]+)"
    r"|%24(?P<pct>[0-9A-Za-z]+)|fn(?!ref)(?P<pair>\d[0-9A-Za-z]*))[\"']?[^>]*>"
    r"(?P<inner>.*?)</a>"
    # The PAIRED form prints its number in a SECOND anchor linking back to the
    # body: `<a name="fn1">(</a><a href="#fnref1">1</a>) text`. The first
    # anchor's own text is just the opening bracket, so the visible number has
    # to come from the sibling or every entry keys on "(".
    r"(?:\s*<a\s[^>]*?href=[\"']?#fnref[0-9A-Za-z]+[\"']?[^>]*>(?P<pairvis>[^<]*)</a>\s*\)?)?",
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
        code = m.group("ftn") or m.group("dollar") or m.group("pct") or m.group("pair")
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(region_html)
        chunk = region_html[start:end]
        visible = strip_tags(m.group("pairvis") or m.group("inner"))
        visible = visible.strip().strip("[]()")
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
            echo_m = re.match(
                r"^\s*(?:\((\d+)\)|\[(\d+)\]|(?:</?[a-z][^>]*>)*\s*(\d{1,4})\s*(?:</[a-z][^>]*>)?\s*\.)",
                chunk,
                re.IGNORECASE,
            )
            marker = (
                (echo_m.group(1) or echo_m.group(2) or echo_m.group(3))
                if echo_m
                else code
            )
        chunk = re.sub(
            rf"^\s*(?:\({re.escape(marker)}\)|\[{re.escape(marker)}\]|(?:</?[a-z][^>]*>)*\s*{re.escape(marker)}\s*(?:</[a-z][^>]*>)?\s*\.)?\s*",
            "",
            chunk,
            flags=re.IGNORECASE,
        )
        table[marker] = strip_tags(chunk).strip()
    return table


_FN_CHAPTER_NUM_ALT = (
    r"([IVXLCDM]+|\d{1,2}|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)"
)
_FN_CHAPTER_HEADING_RE = re.compile(
    rf"^(?:CHAPTER|CAPITULO)\s+{_FN_CHAPTER_NUM_ALT}\b", re.IGNORECASE
)


def match_footnote_chapter_heading(text: str) -> int | None:
    """Detects a chapter-restart heading INSIDE a footnote-list region --
    e.g. Christus Dominus's footnote list restarts its own numbering at
    every 'Chapter I' / 'Chapter II' / 'CHAPTER III' (confirmed live: the
    footnote-list numbers run 1-7, then restart 1-8, then 1-21, then 1-2,
    with exactly these three headings sitting at each restart). This is
    a DIFFERENT matcher from `match_label` (which detects
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
    forking EN/PT the way `DIVISIONS` does for body headings.

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
    return _resolve_num(m.group(1), "en")


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
        self.label: str = ""  # bare division label above the title
        self.title_html: str = ""  # title with partial inline emphasis kept
        self.subtitle: str = ""  # further printed lines below it
        self.children: list[Node] = []
        self.depth: int = 1  # observed heading level, compacted per document
        self.before: int | None = None  # the section this heading precedes
        self.own: set[int] = set()
        self.span: tuple[int | None, int | None] = (None, None)
        self.has_unnumbered = (
            False  # e.g. LG's APPENDIX -- structure present, no addressable span
        )

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
    html: str = ""
    attribution: str | None = None

    def to_dict(self) -> dict:
        # `kind` is OMITTED when it is "prose", the same "absent means the
        # ordinary case" rule `attribution` below already follows, and
        # `label`/`subtitle`/`title_html` follow in structure.json. Documents
        # are 99.93% prose -- 11 blocks of 14,924 are not -- so writing it
        # every time spent the field's whole budget saying "nothing to see",
        # and a reader scanning a section could not tell the exception from
        # the rule. Now every `"kind"` in a document marks a real one, and
        # `grep -c '"kind"'` is the census of them. The field stays worth
        # carrying: it is 11% of CCC blocks and 4% of the Compendium's.
        #
        # ONE REPRESENTATION: `html`, and nothing derived from it. `text_marked`
        # used to be stored beside it as the round-trip oracle's expected
        # value, which was a real argument while the check compared a fresh
        # derivation against a recorded one. It stopped being one when the
        # check moved into `validate_document`: both sides are now computed
        # in this process from the same source string, so the oracle is
        # exactly as strong with nothing on disk. What the stored copy was
        # actually buying was 32 MB, a fat-corpus/thin-shipped split, and a
        # second format every reader had to branch on.
        #
        # `self.text` stays alive in memory -- `Section.resolve` reads it to
        # find ⟦n⟧ markers, and the round-trip check compares against it.
        d: dict = {}
        if self.kind != "prose":
            d["kind"] = self.kind
        d["html"] = self.html
        if self.attribution:
            d["attribution"] = self.attribution
        return d


@dataclass
class Section:
    n: int | None
    blocks: list[BlockOut] = field(default_factory=list)
    text: str = ""
    citations: list[dict] = field(default_factory=list)
    chapter: int | None = (
        None  # the structure-tree chapter this section sits under, if any --
    )
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
                    anomalies.append(
                        f"section {self.n}: star marker {tok} has no supplementary note"
                    )
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
        # No `text` either -- same reasoning as `BlockOut.to_dict`. It was the
        # blocks joined with markers stripped, so it is derivable from them
        # twice over; the site's `documentSectionText` is that derivation, and
        # it now matches this section for section rather than approximately
        # (docs/decisions.md §Storage).
        return {
            "n": self.n,
            "blocks": [b.to_dict() for b in self.blocks],
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
        self.pending_first_html: str | None = None
        # How many of `pending_headings` were pushed BEFORE the buffered
        # prose began. A promoted section takes only those: a heading
        # printed after the text being promoted belongs to the section that
        # follows, not to the one the text becomes. Humanae Vitae prints its
        # salutation, then `I. PROBLEM AND COMPETENCY OF THE MAGISTERIUM`,
        # then `2.` -- and the part heading was landing at `before` 1, the
        # section made out of the salutation above it.
        self.pending_before_buffer: int = 0
        # A section number read off a "N. Title" heading, waiting for the
        # prose block underneath to open the section (Gravissimum
        # Educationis EN -- see parse_document's heading branch). The number
        # and the section's first words are in DIFFERENT blocks there, which
        # is the whole reason this has to be carried rather than handled in
        # place like an ordinary numbered paragraph.
        self.pending_section_n: int | None = None
        self.pending_headings: list[Node] = []
        # Content the source prints AFTER its last numbered paragraph, under
        # its own headings: Lumen Gentium's notifications and Nota Explicativa
        # Praevia, Laudato Si's two closing prayers. `push_heading` closes the
        # open section, so every block after a trailing heading found
        # `open_section is None` and was logged as orphan and dropped -- while
        # its heading survived in structure.json, which is how a table of
        # contents came to list entries with nothing behind them. Each entry
        # is one heading and the prose beneath it; see `appendix.json`.
        self.appendix: list[dict] = []
        # The last numbered section started, so a heading can record which
        # section it interrupted. See reclaim_mid_body_prose.
        self.last_section_n: int | None = None
        self.reclaimed: int = 0
        self.appendix_out: list[dict] = []
        self.content_started = False
        self.empty_nest_depth = 0
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

    def push_heading(
        self,
        kind: str,
        n: int | None,
        title: str,
        depth: int = 1,
        label: str = "",
        subtitle: str = "",
        title_html: str = "",
    ) -> None:
        # A structure node has no citations array, so a footnote marker inside
        # a heading has nothing to resolve against and would be stored as a
        # literal token in the title -- `PROÉMIO⟦1⟧`. The note itself stays in
        # the footnote region and in raw/; what is lost is the reference from
        # the heading, which is the lesser loss against dropping the heading
        # (see `_FN_MARKER_OUTSIDE_RE`, which is why such headings survive at
        # all now).
        title = strip_markers(title)
        label = strip_markers(label)
        subtitle = strip_markers(subtitle)
        title_html = strip_markers(title_html)
        self.finalize_open_section()
        self.open_appendix_unit(title)
        level = LEVELS[kind]
        # A heading that has taken no content yet is the PARENT of the
        # heading that immediately follows it, not its sibling.
        #
        # Every generic heading is `sub`, so the pop rule below (>= level)
        # made two adjacent headings siblings, and the first was sealed
        # holding nothing -- a node with a [null, null] range. That is ~70
        # of the 513 null-range nodes measured in the 2026-08 description
        # pass (§2): real divisions (`PRIMEIRA PARTE`, `PROEMIO`,
        # `CONCLUSAO`) emptied by the walker rather than by the source.
        # It fires wherever a page prints a part title, then its subtitle,
        # then a sub-heading, before any numbered paragraph -- Deus
        # Caritas Est PT and Dignitatis Humanae PT both do exactly that.
        #
        # Nesting is capped so a run of empty headings (a post-body
        # appendix, say) cannot build an arbitrarily deep spine. The
        # counter has to live on the walker, not in this call: nesting B
        # under A gives A a child, so A stops looking empty and a
        # per-call check would re-arm on every heading and never cap.
        while self.stack and self.stack[-1].level >= level:
            top = self.stack[-1]
            if not top.own and not top.children and self.empty_nest_depth < 2:
                self.empty_nest_depth += 1
                break
            self.empty_nest_depth = 0
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
        node.depth = depth
        node.label = label
        node.title_html = title_html
        node.subtitle = subtitle
        parent_children.append(node)
        self.stack.append(node)
        self.pending_headings.append(node)

    def start_section(
        self,
        n: int,
        kind: str,
        text: str = "",
        html: str = "",
        blocks: list[BlockOut] | None = None,
        claim: int | None = None,
    ) -> None:
        """`blocks`, when given, IS the section's own content and replaces
        the single `(kind, text, html)` block. Only the promotion paths use
        it, and they need it because their content is a run of blocks already
        buffered elsewhere -- see `take_buffered_blocks`.

        `claim` limits how many pending headings anchor here; None means all
        of them, which is right for every ordinary section."""
        # Every heading seen since the last section began anchors here: this
        # is the section it precedes, which is what `before` means. Headings
        # with no following section keep `before = None` -- trailing matter
        # the numbered flow never reaches.
        claimed = (
            self.pending_headings if claim is None else self.pending_headings[:claim]
        )
        for node in claimed:
            node.before = n
        del self.pending_headings[: len(claimed)]
        self.content_started = True
        self.empty_nest_depth = 0
        # Everything buffered so far was mid-body after all, not appendix --
        # so it is given back rather than dropped. See reclaim_mid_body_prose.
        #
        # The heading itself still anchors at THIS section, not at the one its
        # prose rejoined. `before` means "the first numbered paragraph after
        # the heading" and is read off the page by eye when an oracle is
        # written (docs/writing-descriptions.md §3); making it depend on where
        # the parser decided to put the text would leave a reader unable to
        # derive it from the source at all.
        front = self.reclaim_mid_body_prose(n)
        self.appendix.clear()
        self.last_section_n = n
        sec = Section(n=n, chapter=self.current_chapter())
        sec.blocks.extend(front)
        if blocks is not None:
            sec.blocks.extend(blocks)
        else:
            sec.blocks.append(BlockOut(kind, text, html))
        self.open_section = sec
        if self.stack:
            self.stack[-1].own.add(n)
        else:
            self.orphan_content.append(
                f"section {n} started with no open structure node"
            )

    def open_appendix_unit(self, title: str) -> None:
        """A heading past the end of the numbered body opens an appendix unit.

        Called for EVERY heading; `start_section` throws the buffer away, so
        only the run that survives to the end of the walk is really appendix
        matter. That is the whole trick -- whether a heading is back matter
        cannot be known when it is read, only by whether a numbered paragraph
        ever follows it.
        """
        # `after_n` is the section this heading interrupted, and it is what
        # `reclaim_mid_body_prose` needs to put the prose back if a numbered
        # section turns out to follow. None means no section had started yet:
        # front matter, which belongs to the first section instead.
        self.appendix.append(
            {"title": title, "blocks": [], "after_n": self.last_section_n}
        )

    def reclaim_mid_body_prose(self, opening: int) -> list[BlockOut]:
        """Give buffered prose back, now that a numbered section proves it was
        not back matter after all.

        `open_appendix_unit` buffers the prose under EVERY heading, because
        whether a heading is back matter cannot be known when it is read --
        only by whether a numbered paragraph ever follows. When one does, the
        buffer used to be thrown away, and with it every unnumbered paragraph
        the source printed under a mid-body heading. Measured: Rerum Novarum
        PT lost ~4,800 characters between §5 and §6 under three subheadings
        the English edition never prints, and Gravissimum Educationis lost its
        whole Introduction in both editions.

        Where it goes is decided by whether a section had already started:

        - a section HAD started -- the heading interrupted it, and the prose
          beneath is the rest of that printed paragraph. Redemptoris Missio's
          §37 prints `(a) Territorial limits.` and carries on; the text after
          it is still §37.
        - NO section had started -- this is front matter under its own
          heading, and it opens the first numbered section rather than
          trailing the previous one, which is what `pending_first_block`
          already does for a document with no explicit `1.`.

        Returns the blocks that belong at the FRONT of the section now
        opening; everything else is appended to its own section here."""
        front: list[BlockOut] = []
        for unit in self.appendix:
            if not unit["blocks"]:
                continue
            after = unit.get("after_n")
            sec = self.sections.get(after) if after is not None else None
            if sec is None:
                front.extend(unit["blocks"])
            else:
                sec.blocks.extend(unit["blocks"])
                sec.resolve(
                    self.current_footnote_table,
                    self.current_chapter_footnote_table,
                    self.current_star_table,
                    self.anomalies,
                )
            self.reclaimed += len(unit["blocks"])
            unit["blocks"] = []
        if front:
            self.anomalies.append(
                f"unnumbered prose before section {opening} kept as its opening "
                f"({len(front)} block(s))"
            )
        return front

    def take_buffered_blocks(self) -> list[BlockOut]:
        """Remove and return everything buffered since the last section closed.

        THE DEFECT THIS FIXES: unclaimed prose was being kept TWICE, in two
        places that did not know about each other. `pending_first_block`
        accumulates it as one joined string, ready to be promoted into a
        section the source never numbered; `add_appendix_block` buffers the
        same blocks against the chance that they are back matter. When the
        promotion fired, `start_section` handed the buffer back through
        `reclaim_mid_body_prose` AND appended the promoted string, so the
        section opened with its own opening text printed twice. Measured
        across the corpus: 171 works, every one of them in §1 -- the
        salutation and first paragraph of nearly every encyclical Leo XIII
        through Pius XII wrote, read twice on the page.

        The buffered blocks are the better copy and the promoted string is
        dropped, not the other way round: `pending_first_block` only
        accumulates `kind == "prose"`, so a blockquote printed before the
        first numbered paragraph is missing from it entirely, while the
        buffer keeps it as its own block."""
        taken: list[BlockOut] = []
        for unit in self.appendix:
            taken.extend(unit["blocks"])
            unit["blocks"] = []
        return taken

    def add_appendix_block(self, kind: str, text: str, html: str = "") -> None:
        if not self.appendix:
            self.appendix.append({"title": "", "blocks": [], "after_n": None})
        blocks = self.appendix[-1]["blocks"]
        if blocks and blocks[-1].kind == kind:
            blocks[-1].text += " " + text
            blocks[-1].html = (
                (blocks[-1].html + " " + html).strip() if html else blocks[-1].html
            )
        else:
            blocks.append(BlockOut(kind, text, html))

    def add_continuation(self, kind: str, text: str, html: str = "") -> None:
        sec = self.open_section
        assert sec is not None
        last = sec.blocks[-1]
        if last.kind == kind:
            last.text = last.text + " " + text
            last.html = (last.html + " " + html).strip() if html else last.html
        else:
            sec.blocks.append(BlockOut(kind, text, html))

    def finalize_open_section(self) -> None:
        if self.open_section is None:
            return
        self.open_section.resolve(
            self.current_footnote_table,
            self.current_chapter_footnote_table,
            self.current_star_table,
            self.anomalies,
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
    html: str = ""  # narrowed inline html (docs/decisions.md §Storage)
    style: int = 9  # observed heading style rank; see heading_style_rank
    # A heading printed on several lines: the bare division label above the
    # name ("CHAPTER THREE"), and any further lines below it. Both empty for
    # the ordinary one-line heading. See merge_heading_lines.
    label: str = ""
    subtitle: str = ""
    # The source indented this block. `heading_style_rank` models centred
    # against flush-left and nothing else, so an indent is invisible to it --
    # and in this corpus an indent means a quotation. See `is_indented`.
    indented: bool = False


def mark_and_split(raw: str, marker_template: str) -> tuple[str, str, str]:
    """Marks footnotes in raw, then strips the block's own leading
    paragraph-number prefix. Returns (full_marked_stripped_text,
    rest_after_number, rest_html_after_number)."""
    marked = mark_footnotes(raw, marker_template)
    text = strip_tags(marked)
    html = narrow_html(marked)
    m = _NUM_PREFIX_TEXT_RE.match(text)
    if m:
        return text, text[m.end() :], strip_leading_number_html(html)
    return text, text, html


_NUM_PREFIX_TEXT_RE = re.compile(r"^(\d{1,4})\s*\.\s*")
# The prefix can be padded with entities as well as tags and whitespace --
# `&nbsp;9. ` occurs 9 times across the corpus. `html_to_text` unescapes, so
# the text gate matches while a tags-and-space-only pattern would not, and
# the number would survive into the stored html. Only WHITESPACE entities
# qualify: an earlier version allowed any `&name;`, and the padding after the
# period then swallowed a leading `&quot;` -- 359 sections lost an opening
# quotation mark, caught by the round-trip check.
_PREFIX_FILLER = r"(?:<[^>]+>|\s|&nbsp;|&#160;|&#[xX]0*[aA]0;)*"
# Same tags-between-digits tolerance as PARA_NUM_RE's `bare_n`, so a number
# that IS recognised is also stripped rather than left in the stored html.
_NUM_PREFIX_HTML_RE = re.compile(
    rf"^{_PREFIX_FILLER}\d(?:(?:<[^>]+>)*\d){{0,3}}{_PREFIX_FILLER}\.{_PREFIX_FILLER}"
)


def strip_leading_number_html(html: str) -> str:
    """Drop a block's own leading paragraph number from the narrowed html.

    `mark_and_split` does this on tag-stripped text, where the prefix is a
    plain `27. `. In html the number can be wrapped or split across tags --
    `27<i>. </i>`, `<font>27</font>. ` -- so the prefix is matched allowing
    interleaved tags rather than by counting characters, which whitespace
    collapsing would misalign. Gated on the text form matching first, so a
    paragraph that merely opens with a numeral is never truncated."""
    if _NUM_PREFIX_TEXT_RE.match(html_to_text(html)) is None:
        return html
    return _NUM_PREFIX_HTML_RE.sub("", html, count=1)


_GAP_NUM_PREFIX_RE = re.compile(r"^\s*\d{1,4}\s*\.\s*")


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
    section elsewhere in the corpus can suddenly open one here.

    UNNUMBERED GAPS ARE KEPT TOO, as of 2026-08-23, and that is the larger
    half. The original gate above required the gap itself to open with a
    paragraph number, which recovered `aeterna-dei.pt`'s case and dropped
    every other kind of unwrapped text on the floor exactly as before. Two
    Portuguese editions turn out to be built almost entirely that way --
    alternating a <p>-wrapped sentence with a bare text node sitting directly
    in the parent <div> -- and lost half their prose to it:

        mortalium-animos.pt   50.1% coverage, ~36 prose blocks gone
        humanae-vitae.pt      78.9% coverage, 18 continuation sentences gone

    `humanae-vitae.pt` is why this went unnoticed for so long: 31 sections
    against the English edition's 31, so cross-language symmetry passes, and
    the loss is *inside* the sections where the round-trip check cannot look.
    Corpus-wide the recoverable text is 216,671 characters, 1.24% of all body
    text, concentrated in 43 files (`audit.py coverage`).

    A FULLY-BOLD GAP IS A HEADING, as of 2026-08-24. This used to be text
    only, on the grounds that promoting it "would change heading detection for
    the whole corpus, which is a separate decision needing its own
    blast-radius measurement". That measurement is now cheap -- `works/` is
    tracked in the corpus repo, so a full re-parse's blast radius is `git
    status` there, and `audit.py toc` compares twelve hand-read tables of
    contents against the parse -- and the harm was not as small as it looked.
    Mortalium Animos PT prints eleven of its nineteen section headings this
    way, `</p> <b>4. <i>Outro erro...</i></b> <p>`, with no <p> of their own.
    Kept as prose they were not merely unranked: each one opened its section
    with its own title as the first words of the body, the same defect the
    <p>-wrapped case had.

    The test is `is_full_bold`, the detector every ordinary block already
    uses, applied to the span _BLOCK_RE stepped over -- not a new heuristic.
    The style rank comes out left-aligned by construction (a gap has no outer
    tag to carry `align=`), which is what these are.

    A whitespace-only gap -- the overwhelming majority, ordinary inter-block
    newlines in every one of the other works -- still yields nothing, because
    it has no text.
    """
    marked = mark_footnotes(gap_html, marker_template)
    text = strip_tags(marked)
    if not text:
        return None
    # The second test because the source is not consistent about which side
    # of the <b> its own number falls on: Mortalium Animos PT prints
    # `<b>4. <i>Outro erro...</i></b>` for eighteen of its headings and
    # `1.  <b><i>Ânsia Universal...</i></b>` for the first -- same element,
    # same document, number outside the bold once. NOT
    # `strip_leading_number_html`: that one lets tags count as padding after
    # the period, so it takes the opening `<b><i>` off with the number and
    # `is_full_bold` then sees no bold at all. Here the prefix must be the
    # number and whitespace only, leaving the markup to be judged.
    heading = is_full_bold(gap_html) or is_full_bold(
        _GAP_NUM_PREFIX_RE.sub("", gap_html, count=1)
    )
    return Block(
        heading,
        "prose",
        text,
        gap_html,
        narrow_html(marked),
        heading_style_rank(gap_html, gap_html, False),
    )


# --------------------------------------------------------------------------
# Structure labels, in every language the corpus reads
# --------------------------------------------------------------------------
#
# A division label is a noun ("CHAPTER", "CAPITOLO", "ГЛАВА") and a number,
# and every language in the corpus writes the pair in some subset of four
# arrangements:
#
#   noun then numeral   CHAPTER I, ROZDZIAŁ V, PARTE II
#   noun then word      Capitolo primo, CAPÍTULO PRIMERO, ГЛАВА ПЕРВАЯ,
#                       الفصل الأوّل, CHAPTER ONE
#   numeral then noun   II PARTE, 1ª PARTE
#   word then noun      PRIMEIRA PARTE, ERSTES KAPITEL, PREMIÈRE PARTIE
#
# so the patterns are generated from the vocabulary rather than written out
# per language. The alternative -- nine hand-written pattern lists -- was
# what EN and PT had, and the Portuguese one had to be rewritten twice
# (2026-08-24) because each rewrite covered the forms one document happened
# to print. Generating them means a new language is a vocabulary entry and
# nothing else, and it means the four arrangements are recognised uniformly
# instead of wherever someone remembered to add them.
#
# ORDINALS AND CARDINALS ARE NOT INTERCHANGEABLE, and the distinction is the
# one guard here that earns its keep. An ordinal before the noun is
# unambiguous -- "FIRST PART" is a label and nothing else. A CARDINAL before
# the noun is ordinary prose: "ONE PART OF THE CHURCH" would become a
# division heading. So cardinals are only ever read AFTER the noun, where
# English prints them ("CHAPTER ONE"), and ordinals are read on both sides.
#
# Everything below is written in its natural spelling and folded at compile
# time -- `fold` is what the matching runs through, so the table stays
# readable as the language actually writes it (`SECÇÃO`, `ЧЕТВЁРТАЯ`,
# `الأوّل`) rather than as the folded form nobody would recognise.

_NUMERAL = r"[IVXLCDM]+|\d{1,3}"


@dataclass(frozen=True)
class Divisions:
    """One language's division vocabulary."""

    #: kind (a `_LABEL_DEPTH` key) -> the noun's spellings. Several where the
    #: language spells it more than one way: Portuguese prints both `SECÇÃO`
    #: and the post-reform `SEÇÃO`.
    nouns: dict[str, tuple[str, ...]]
    #: A number written as an ordinal -> its value. Read on either side of
    #: the noun. Genders and declensions are listed out rather than stemmed:
    #: the stem forms are what made the Portuguese table hard to read.
    ordinals: dict[str, int]
    #: A number written as a cardinal -> its value. Read only AFTER the noun.
    cardinals: dict[str, int] = field(default_factory=dict)
    #: Between a LEADING numeral and the noun. Portuguese prints the ordinal
    #: indicator there (`1ª PARTE`), which arrives folded as a plain
    #: lowercase letter -- `'ª'.upper()` is `'ª'`, and NFKD then yields `a`.
    infix: str = r"\s*"
    #: Whether the language ever puts the numeral first. English never does,
    #: and admitting the form there would only add false positives.
    numeral_first: bool = True


def _alt(words) -> str:
    """Folded alternation, longest first so no entry shadows a longer one
    sharing its prefix (`الأول` ahead of nothing, but `PRIMEIRA` ahead of
    `PRIMEIR`-style stems, and every Arabic ordinal shares `ال`)."""
    return "|".join(sorted({fold(w) for w in words}, key=len, reverse=True))


def _compile_labels(spec: Divisions) -> list[tuple[str, re.Pattern]]:
    """`spec` -> the (kind, pattern) list `match_label`/`LABEL_PATTERNS` use.

    Grouped by arrangement rather than by kind, so a noun-anchored form is
    always tried before a number-anchored one; the kinds themselves cannot
    collide, since no two share a noun."""
    after = _alt({**spec.ordinals, **spec.cardinals})
    before = _alt(spec.ordinals)
    nouns = {k: _alt(v) for k, v in spec.nouns.items()}
    pats = [
        (kind, re.compile(rf"^(?:{noun})\s+({_NUMERAL}|{after})\b"))
        for kind, noun in nouns.items()
    ]
    if spec.numeral_first:
        pats += [
            (kind, re.compile(rf"^({_NUMERAL}){spec.infix}(?:{noun})\b"))
            for kind, noun in nouns.items()
        ]
    if before:
        pats += [
            (kind, re.compile(rf"^({before})\s+(?:{noun})\b"))
            for kind, noun in nouns.items()
        ]
    return pats


# fmt: off
DIVISIONS: dict[str, Divisions] = {
    "en": Divisions(
        nouns={
            "part": ("PART",),
            "section": ("SECTION",),
            "chapter": ("CHAPTER",),
            "article": ("ARTICLE",),
        },
        ordinals={
            "FIRST": 1, "SECOND": 2, "THIRD": 3, "FOURTH": 4, "FIFTH": 5,
            "SIXTH": 6, "SEVENTH": 7, "EIGHTH": 8, "NINTH": 9, "TENTH": 10,
        },
        cardinals={
            "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5,
            "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10,
        },
        numeral_first=False,
    ),
    "pt": Divisions(
        nouns={
            "part": ("PARTE",),
            "section": ("SECÇÃO", "SEÇÃO"),
            "chapter": ("CAPÍTULO",),
            "article": ("ARTIGO",),
        },
        ordinals={
            "PRIMEIRA": 1, "PRIMEIRO": 1, "SEGUNDA": 2, "SEGUNDO": 2,
            "TERCEIRA": 3, "TERCEIRO": 3, "QUARTA": 4, "QUARTO": 4,
            "QUINTA": 5, "QUINTO": 5, "SEXTA": 6, "SEXTO": 6,
            "SÉTIMA": 7, "SÉTIMO": 7, "OITAVA": 8, "OITAVO": 8,
            "NONA": 9, "NONO": 9, "DÉCIMA": 10, "DÉCIMO": 10,
        },
        # `1ª PARTE`, `II ª PARTE` -- Pascendi PT prints both.
        infix=r"\s*[ªºAOao]?\s*",
    ),
    "es": Divisions(
        nouns={
            "part": ("PARTE",),
            "section": ("SECCIÓN",),
            "chapter": ("CAPÍTULO",),
            "article": ("ARTÍCULO",),
        },
        ordinals={
            "PRIMERO": 1, "PRIMERA": 1, "PRIMER": 1, "SEGUNDO": 2, "SEGUNDA": 2,
            "TERCERO": 3, "TERCERA": 3, "TERCER": 3, "CUARTO": 4, "CUARTA": 4,
            "QUINTO": 5, "QUINTA": 5, "SEXTO": 6, "SEXTA": 6,
            "SÉPTIMO": 7, "SÉPTIMA": 7, "OCTAVO": 8, "OCTAVA": 8,
            "NOVENO": 9, "NOVENA": 9, "DÉCIMO": 10, "DÉCIMA": 10,
        },
    ),
    "it": Divisions(
        nouns={
            "part": ("PARTE",),
            "section": ("SEZIONE",),
            "chapter": ("CAPITOLO",),
            "article": ("ARTICOLO",),
        },
        ordinals={
            "PRIMO": 1, "PRIMA": 1, "SECONDO": 2, "SECONDA": 2,
            "TERZO": 3, "TERZA": 3, "QUARTO": 4, "QUARTA": 4,
            "QUINTO": 5, "QUINTA": 5, "SESTO": 6, "SESTA": 6,
            "SETTIMO": 7, "SETTIMA": 7, "OTTAVO": 8, "OTTAVA": 8,
            "NONO": 9, "NONA": 9, "DECIMO": 10, "DECIMA": 10,
        },
    ),
    "fr": Divisions(
        nouns={
            "part": ("PARTIE",),
            "section": ("SECTION",),
            "chapter": ("CHAPITRE",),
            "article": ("ARTICLE",),
        },
        ordinals={
            "PREMIER": 1, "PREMIÈRE": 1, "DEUXIÈME": 2, "SECOND": 2, "SECONDE": 2,
            "TROISIÈME": 3, "QUATRIÈME": 4, "CINQUIÈME": 5, "SIXIÈME": 6,
            "SEPTIÈME": 7, "HUITIÈME": 8, "NEUVIÈME": 9, "DIXIÈME": 10,
        },
    ),
    "de": Divisions(
        nouns={
            "part": ("TEIL",),
            "section": ("ABSCHNITT",),
            "chapter": ("KAPITEL",),
            "article": ("ARTIKEL",),
        },
        # German inflects the ordinal for the noun's gender and case, and the
        # mastheads print the neuter (`ERSTES KAPITEL`); the other endings are
        # listed because `TEIL` is masculine (`ERSTER TEIL`).
        ordinals={
            "ERSTES": 1, "ERSTER": 1, "ERSTE": 1, "ZWEITES": 2, "ZWEITER": 2,
            "ZWEITE": 2, "DRITTES": 3, "DRITTER": 3, "DRITTE": 3,
            "VIERTES": 4, "VIERTER": 4, "VIERTE": 4, "FÜNFTES": 5,
            "FÜNFTER": 5, "FÜNFTE": 5, "SECHSTES": 6, "SECHSTER": 6,
            "SECHSTE": 6, "SIEBTES": 7, "SIEBENTES": 7, "SIEBTER": 7,
            "SIEBTE": 7, "ACHTES": 8, "ACHTER": 8, "ACHTE": 8,
            "NEUNTES": 9, "NEUNTER": 9, "NEUNTE": 9,
            "ZEHNTES": 10, "ZEHNTER": 10, "ZEHNTE": 10,
        },
    ),
    "pl": Divisions(
        nouns={
            "part": ("CZĘŚĆ",),
            "section": ("SEKCJA",),
            "chapter": ("ROZDZIAŁ",),
            "article": ("ARTYKUŁ",),
        },
        # Ł has no canonical decomposition, so it survives `fold` and the
        # folded noun is still `ROZDZIAŁ`; Ę/Ś/Ć do decompose, so `CZĘŚĆ`
        # folds to `CZESC`. Both are handled by folding the table itself.
        ordinals={
            "PIERWSZY": 1, "PIERWSZA": 1, "PIERWSZE": 1, "DRUGI": 2,
            "DRUGA": 2, "DRUGIE": 2, "TRZECI": 3, "TRZECIA": 3, "TRZECIE": 3,
            "CZWARTY": 4, "CZWARTA": 4, "CZWARTE": 4, "PIĄTY": 5, "PIĄTA": 5,
            "PIĄTE": 5, "SZÓSTY": 6, "SZÓSTA": 6, "SZÓSTE": 6, "SIÓDMY": 7,
            "SIÓDMA": 7, "SIÓDME": 7, "ÓSMY": 8, "ÓSMA": 8, "ÓSME": 8,
            "DZIEWIĄTY": 9, "DZIEWIĄTA": 9, "DZIESIĄTY": 10, "DZIESIĄTA": 10,
        },
    ),
    "ru": Divisions(
        nouns={
            "part": ("ЧАСТЬ",),
            "section": ("РАЗДЕЛ",),
            "chapter": ("ГЛАВА",),
            "article": ("СТАТЬЯ",),
        },
        # Ё decomposes to Е under NFKD, so `ЧЕТВЁРТАЯ` and `ЧЕТВЕРТАЯ` fold
        # to the same string and one entry covers both spellings.
        ordinals={
            "ПЕРВАЯ": 1, "ПЕРВЫЙ": 1, "ПЕРВОЕ": 1, "ВТОРАЯ": 2, "ВТОРОЙ": 2,
            "ВТОРОЕ": 2, "ТРЕТЬЯ": 3, "ТРЕТИЙ": 3, "ТРЕТЬЕ": 3,
            "ЧЕТВЁРТАЯ": 4, "ЧЕТВЁРТЫЙ": 4, "ЧЕТВЁРТОЕ": 4, "ПЯТАЯ": 5,
            "ПЯТЫЙ": 5, "ПЯТОЕ": 5, "ШЕСТАЯ": 6, "ШЕСТОЙ": 6, "ШЕСТОЕ": 6,
            "СЕДЬМАЯ": 7, "СЕДЬМОЙ": 7, "СЕДЬМОЕ": 7, "ВОСЬМАЯ": 8,
            "ВОСЬМОЙ": 8, "ВОСЬМОЕ": 8, "ДЕВЯТАЯ": 9, "ДЕВЯТЫЙ": 9,
            "ДЕСЯТАЯ": 10, "ДЕСЯТЫЙ": 10,
        },
    ),
    "ar": Divisions(
        # Arabic prints the definite article on both halves -- `الفصل الأوّل`,
        # "the chapter the-first" -- so it is part of both the noun and the
        # ordinal rather than something to strip.
        nouns={
            "part": ("الجزء",),
            "section": ("القسم",),
            "chapter": ("الفصل",),
            "article": ("المادة",),
        },
        # Written without tashkeel: the vowel marks the page prints (`الأوّل`)
        # are combining characters, so `fold` removes them from the text
        # before these patterns ever see it.
        ordinals={
            "الأول": 1, "الثاني": 2, "الثالث": 3, "الرابع": 4, "الخامس": 5,
            "السادس": 6, "السابع": 7, "الثامن": 8, "التاسع": 9, "العاشر": 10,
        },
    ),
}

# fmt: on

LABEL_PATTERNS = {lang: _compile_labels(spec) for lang, spec in DIVISIONS.items()}

#: Headings that name a document's front or back matter rather than one of
#: its divisions, in every language the corpus reads. Ranked as a peer of the
#: shallowest division the document prints (see `depth_key`), which is what
#: keeps a PROLOGUE from being read as a sub-heading of the chapter above it.
#:
#: One set for all nine languages rather than one per language: these words
#: do not collide across languages in any way that matters, and a document is
#: only ever tested against the list in the language it is written in anyway.
#: Written naturally and folded here, so `CONCLUSIÓN` and `ZAKOŃCZENIE` are
#: entered as they are printed.
_FRONT_BACK_MATTER = frozenset(
    map(
        fold,
        (
            # en / la
            "PREFACE", "PROLOGUE", "PROEMIUM", "INTRODUCTION", "CONCLUSION",
            "EPILOGUE", "APPENDIX", "BLESSING",
            # pt
            "PREFÁCIO", "PROÉMIO", "PRÓLOGO", "INTRODUÇÃO", "CONCLUSÃO",
            "EPÍLOGO", "APÊNDICE",
            # es
            "PREFACIO", "PROEMIO", "INTRODUCCIÓN", "CONCLUSIÓN", "EPÍLOGO",
            "APÉNDICE",
            # it
            "PREFAZIONE", "PROEMIO", "INTRODUZIONE", "CONCLUSIONE", "EPILOGO",
            "APPENDICE",
            # fr
            "PRÉFACE", "AVANT-PROPOS", "PROLOGUE", "CONCLUSION", "ÉPILOGUE",
            "ANNEXE",
            # de
            "VORWORT", "EINLEITUNG", "EINFÜHRUNG", "SCHLUSS", "SCHLUSSWORT",
            "ANHANG",
            # pl
            "WSTĘP", "WPROWADZENIE", "PRZEDMOWA", "ZAKOŃCZENIE", "ANEKS",
            # ru
            "ПРЕДИСЛОВИЕ", "ВВЕДЕНИЕ", "ЗАКЛЮЧЕНИЕ", "ПРИЛОЖЕНИЕ",
            # ar
            "المقدمة", "الخاتمة", "تمهيد", "الملحق",
        ),
    )
)  # fmt: skip

#: The number-words keyed the way a match actually arrives -- folded. The
#: table above is written in natural spelling for the reader, and a captured
#: group comes out of a pattern built from `fold`ed alternatives, so the two
#: only meet here. Arabic is the case that made this its own step: `الأوّل`
#: folds to `الاول`, and looking the capture up in the natural-spelling dict
#: quietly returned no number at all.
_LABEL_WORDS = {
    lang: {fold(w): n for w in (spec.ordinals, spec.cardinals) for w, n in w.items()}
    for lang, spec in DIVISIONS.items()
}


def _resolve_num(token: str, lang: str) -> int | None:
    """The number a label's captured group names, in `lang`.

    Resolved against ONE language's vocabulary rather than a merged table:
    the words collide across languages (`PRIMA` is Italian for first and
    Portuguese for the feminine of it, `SECOND` is English and French), and
    while every collision found so far agrees on the value, nothing makes
    that a property worth relying on."""
    folded = fold(token)
    if folded in _LABEL_WORDS[lang]:
        return _LABEL_WORDS[lang][folded]
    if folded.isdigit():
        return int(folded)
    return roman_to_int(folded)


def match_label(text: str, lang: str) -> tuple[str, int | None] | None:
    """`(kind, number)` when `text` OPENS with a division label, else None."""
    for kind, pat in LABEL_PATTERNS[lang]:
        m = pat.match(fold(text))
        if m:
            return kind, _resolve_num(m.group(1), lang)
    return None


def label_matcher(lang: str):
    """`match_label` bound to one language, for the call sites that take a
    matcher rather than a language (`drop_table_of_contents`)."""
    return lambda text: match_label(text, lang)


_APPENDIX_LABEL_RE = re.compile(r"^(?:APPENDIX|AP[EÊ]NDICE)(?=\s|:|$)", re.IGNORECASE)


def _label_prefix_end(text: str, lang: str) -> int | None:
    """The offset at which a division label ends in `text`, or None when
    `text` does not open with one.

    Split out of `split_label_prefix` so the same question can be asked of one
    LINE of a multi-line heading -- see `split_heading_break`.

    `APPENDIX` is here rather than in LABEL_PATTERNS because every pattern
    there is anchored on a numeral (`PART II`, `CAPITULO IV`) and an appendix
    carries no number. Keeping it out of LABEL_PATTERNS also keeps it out of
    `match_label`, hence out of the `_LABEL_DEPTH` ranking -- which has no
    tier for a division appearing once at the end of a document, and should
    not be given one on the strength of the three that exist in this corpus.

    The offset comes back through `fold_index` rather than being used as-is.
    `fold` is length-preserving for Latin text and the Portuguese patterns
    relied on that, but Arabic folds SHORTER (its vowel marks are combining
    characters), and an offset that is quietly a few characters early would
    cut a heading mid-word rather than fail."""
    m = _APPENDIX_LABEL_RE.match(text)
    if m:
        return m.end()
    folded = fold(text)
    for _kind, pat in LABEL_PATTERNS[lang]:
        m = pat.match(folded)
        if m:
            return fold_index(text)[m.end()]
    return None


def bare_division_label(text: str, lang: str) -> bool:
    """True when `text` is a division label AND NOTHING ELSE -- "CHAPTER
    THREE", "CAPITULO IV", "PRIMEIRA PARTE".

    This is the discriminator `merge_heading_lines` runs on, and it is
    deliberately narrow. A bare label is never a complete heading: the
    document that prints one always prints the division's name on the next
    line. A label that already carries its name ("III OS ARGUMENTOS
    TEOLOGICOS") is complete on its own, and whatever follows it is a real
    sub-heading, not a continuation -- which is exactly the distinction that
    keeps the merge off `ad-caeli-reginam.pt` and on `caritas-in-veritate`."""
    probe = fold(" ".join(text.split()).strip(" .:;-"))
    for _kind, pat in LABEL_PATTERNS[lang]:
        m = pat.match(probe)
        if m:
            return probe[m.end() :].strip(" .:;-\u2014\u2013") == ""
    return False


def split_label_prefix(text: str, lang: str) -> tuple[str, str] | None:
    """Split `CHAPTER I THE MYSTERY OF THE CHURCH` into its label and its name.

    `merge_heading_lines` already does this when the source prints the two on
    separate blocks, which is how the Portuguese edition of Lumen Gentium sets
    its chapters -- `<p align="center"><b>CAPÍTULO I</b></p>` followed by
    `<p align="center"><b>O MISTÉRIO DA IGREJA</b></p>`. The English edition
    of the same document prints them inside ONE `<center>`, with the label
    loose and the name in a nested `<p>`:

        <center>
          <font size="3"> <b>CHAPTER I </b> </font>
          <font ...> <p><b> THE MYSTERY OF THE CHURCH</b></p></font>
        </center>

    `_BLOCK_RE` takes the `<center>` as a single block, so there are never two
    lines to merge and all eight chapters came out with an empty `label` and
    the label welded to the front of the title.

    Matched on the label patterns rather than on the markup, so it holds
    however the two are wrapped. `fold` preserves length, so the offset from a
    Portuguese match applies to the original string unchanged.
    """
    end = _label_prefix_end(text, lang)
    if end is None:
        return None
    label, rest = text[:end].strip(), text[end:].strip(" .:;-\u2014")
    # No name after the label is the ordinary merged case, already handled:
    # `CHAPTER I` alone is the whole heading and stays the title.
    return (label, rest) if rest else None


_BR_SPLIT_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)


# `\b` after the name is load-bearing: without it `(\w+)` backtracks, so
# `<br/> </b>` matches as an empty `b` pair -- `br` reduced to `b` with `r/`
# read as attributes -- and deleting it destroyed Populorum Progressio PT's
# masthead, closing `<b>` and swallowing the line break at once.
_EMPTY_TAG_PAIR_RE = re.compile(r"<(\w+)\b[^>]*>\s*</\1\s*>")


def strip_leading_text_html(html: str, prefix: str) -> str:
    """Drop `prefix` from the front of `html`, ignoring tags and whitespace.

    Wanted when a heading's label moves into its own `label` field:
    `title_html` is the NAME's inline markup, and leaving the label in it
    makes the site -- which typesets the two as separate spans -- print the
    label twice. Seven nodes in the corpus read `CHAPTER VII CHAPTER VII THE
    ESCHATOLOGICAL NATURE...` for exactly this reason.

    Matched character by character across tag boundaries, like
    `strip_leading_number_html`, because the label and its name are routinely
    divided by markup -- `APPENDIX <i> A DECLARATION...</i>`, `CHAPTER VII
    <b>THE ESCHATOLOGICAL...</b>`. Returns `html` untouched if the visible
    text does not in fact begin with `prefix`, so a failed match cannot
    truncate a title."""
    want = "".join(prefix.split()).upper()
    out, seen, i = [], 0, 0
    while i < len(html) and seen < len(want):
        if html[i] == "<":
            j = html.find(">", i)
            if j == -1:
                return html
            out.append(html[i : j + 1])
            i = j + 1
            continue
        ch = html[i]
        if not ch.isspace():
            if ch.upper() != want[seen]:
                return html
            seen += 1
        i += 1
    if seen < len(want):
        return html
    # Tags the prefix emptied would leave `heading_inner_html` storing markup
    # that says nothing. Collapsed on the JOINED result, because the pair
    # routinely straddles the cut -- `<b>CHAPTER</b> <i>III</i> THE NAME`
    # leaves its `<i>` on one side and its `</i>` on the other. A tag the
    # prefix only opened still closes over the name and survives, having
    # something between its ends.
    rest = html[i:].lstrip().lstrip(" .:;-\u2014\u2013").lstrip()
    kept = "".join(out) + rest
    while (collapsed := _EMPTY_TAG_PAIR_RE.sub("", kept)) != kept:
        kept = collapsed
    return kept


def split_heading_break(html: str, text: str, lang: str) -> tuple[str, str] | None:
    """Split `APPENDIX<br/>From the Acts of the Council` into label and name.

    `heading_inner_html` flattens every `<br/>` in a heading to a space,
    because in this corpus a break inside a heading is nearly always the
    source's measure running out mid-phrase: `THE MESSAGE<br/>OF POPULORUM
    PROGRESSIO` is one title set on two lines, and reading the break as
    structure would cut a title in half. That flattening is right and stays.

    Nearly always is not always. Of the 326 heading blocks in
    corpus/raw/vatican-docs holding a `<br/>`, 50 print a bare division label
    above the division's name -- `SECTION 1<br/>The Avoidance of War`,
    `PRIMEIRA PARTE<br/>MARIA NO MISTÉRIO DE CRISTO`. That is the same thing
    `merge_heading_lines` recognises when a source prints the two as separate
    paragraphs, set one way instead of the other, and it earns the same
    answer: a `label` and a `title`, not one run-on line.

    THE DISCRIMINATOR IS THE FIRST LINE AND NOTHING ELSE. It must be a
    division label and carry no name of its own, which is what makes this
    safe to hang on a break. Measured over the same 326: the test accepts 50,
    every one of them a label; of the 276 it rejects, none is -- they are
    wraps (`FRATERNITY, ECONOMIC<br/>DEVELOPMENT AND CIVIL SOCIETY`) and
    salutations (`Venerable Brethren,<br/>Health and the Apostolic
    Blessing.`), and both have to stay whole.

    42 of the 50 are already split by `split_label_prefix` from the flattened
    text, since their label carries a numeral it can anchor on. This reaches
    the other 8 -- the labels spelled out in words, `PRIMEIRA PARTE` and
    `CHAPTER FOUR` -- and Lumen Gentium EN's appendix, whose label carries no
    number at all.

    The split is applied to `text`, not to the html: `text` is the marked
    text, carrying the footnote tokens, and is what a heading's title is
    built from. The html is consulted only for WHERE the source broke."""
    parts = _BR_SPLIT_RE.split(html, maxsplit=1)
    if len(parts) != 2:
        return None
    label = " ".join(html_to_text(parts[0]).split()).strip(" .:;-\u2014\u2013")
    if not label:
        return None
    end = _label_prefix_end(label, lang)
    if end is None or label[end:].strip(" .:;-\u2014\u2013"):
        return None
    probe = " ".join(text.split())
    if not probe.upper().startswith(label.upper()):
        return None
    rest = probe[len(label) :].strip(" .:;-\u2014\u2013")
    return (label, rest) if rest else None


def merge_heading_lines(
    blocks: list[Block], lang: str, toc_level: dict[int, int]
) -> tuple[dict[int, int], list[str]]:
    """Fold a heading printed on several lines into ONE heading block, and
    return the remapped `toc_level` plus a report of what was merged.

    THE DEFECT THIS FIXES. vatican.va prints a division's identifier, its
    name and sometimes a subtitle as separate paragraphs:

        <p><b>CHAPTER THREE</b></p>
        <p><b>TECHNOLOGY AND DOMINANCE.</b></p>
        <p><b>THE GRANDEUR OF HUMANITY IN LIGHT OF THE PROMISES OF AI</b></p>

    Three blocks, one heading. Kept as three structure nodes they are three
    rows in the reader's table of contents, all anchored to the same section
    -- so they all derive the SAME range, and a table of contents that
    highlights the reader's position highlights three rows at once. Before
    the levels came from the page's own TOC they were merely inconsistent
    instead: the levelling walk's subtitle rule put the identifier one tier
    above its own name, inventing a level that is not in the document.

    Neither is a rendering problem to paper over downstream. `CHAPTER THREE`
    is an identifier, `TECHNOLOGY AND DOMINANCE.` is the name and `THE
    GRANDEUR OF HUMANITY...` is the subtitle, so the node carries all three
    and the consumer decides how to print them.

    WHAT IS ABSORBED, and why not more. The run must open with a BARE
    division label (see `bare_division_label`) -- that is the only
    unambiguous evidence in the source that a heading continues on the next
    line. Then exactly ONE following heading is taken as the name, because
    the third line of a run is genuinely ambiguous: Ad Petri Cathedram
    prints `QUARTA PARTE` / `EXORTACOES PATERNAIS` / `Aos bispos`, and `Aos
    bispos` is the part's first sub-section, not its subtitle. Further lines
    are absorbed ONLY where the page's own table of contents assigns them
    the same level as the label -- a statement, not an inference, and the
    only reason Magnifica Humanitas' three-line chapter openings merge while
    Ad Petri's three-line one does not.

    Measured before it was written: 154 runs in 33 works open with a bare
    label, every one of them an identifier followed by a name."""
    merged: list[str] = []
    dropped: set[int] = set()
    i = 0
    while i < len(blocks):
        if (
            not blocks[i].is_heading
            or blocks[i].label
            or not bare_division_label(blocks[i].text, lang)
            or i + 1 >= len(blocks)
            or not blocks[i + 1].is_heading
            # Two bare labels in a row are two divisions opening together
            # ("PART I" then "CHAPTER I"), not a label and its name. No
            # document in the corpus does this today -- the guard is here so
            # that one arriving later loses a level rather than a heading.
            or bare_division_label(blocks[i + 1].text, lang)
        ):
            i += 1
            continue
        head = blocks[i]
        absorbed = [i + 1]
        j = i + 2
        while (
            j < len(blocks)
            and blocks[j].is_heading
            and toc_level.get(i) is not None
            and toc_level.get(j) == toc_level.get(i)
        ):
            absorbed.append(j)
            j += 1
        head.label = head.text
        head.text = blocks[absorbed[0]].text
        head.html = blocks[absorbed[0]].html
        head.style = blocks[absorbed[0]].style
        head.subtitle = " ".join(blocks[k].text for k in absorbed[1:]).strip()
        merged.append(
            f"{head.label} / {head.text}"
            + (f" / {head.subtitle}" if head.subtitle else "")
        )
        dropped.update(absorbed)
        i = j

    if not dropped:
        return toc_level, merged
    shift = {}
    out = 0
    for idx in range(len(blocks)):
        if idx in dropped:
            continue
        shift[idx] = out
        out += 1
    blocks[:] = [b for k, b in enumerate(blocks) if k not in dropped]
    return {shift[k]: v for k, v in toc_level.items() if k in shift}, merged


def _norm_heading(text: str) -> str:
    """Whitespace/case-normalized heading text, for comparing a table-of-
    contents entry against the body heading it duplicates."""
    return re.sub(r"\s+", " ", text).strip().casefold()


_TOC_MIN_ENTRIES = 3
_TOC_MIN_TITLE_CHARS = 6
_TOC_INDENT_MIN = 4
_TOC_FUZZY_RATIO = 0.9
_INPAGE_LINK_RE = re.compile(
    r'<a[^>]*\bhref="#([^"]+)"[^>]*>(.*?)</a>', re.DOTALL | re.IGNORECASE
)
_ANCHOR_TARGET_RE = re.compile(r'<a[^>]*\bname="([^"]+)"|\bid="([^"]+)"', re.IGNORECASE)
_TOC_PARA_RE = re.compile(
    r"<p(?=[\s>])([^>]*)>((?:(?!</p>).)*?)</p>", re.DOTALL | re.IGNORECASE
)
_BR_RE = re.compile(r"<br\s*/?>", re.IGNORECASE)
_MARGIN_LEFT_RE = re.compile(r"margin-left:\s*(\d+)", re.IGNORECASE)


def toc_link_span(body_html: str) -> tuple[int, int] | None:
    """The character span of the page's own printed table of contents, or
    None where it prints none.

    The detection is `extract_toc_outline`'s, factored out because two
    different jobs need the same answer: that function reads the outline's
    LEVELS, and `parse_document` needs to take the outline's TEXT out of the
    body before it is mistaken for the document's opening paragraph. A table
    of contents is the one region of a page that says the same things the
    body says, so anything that reads it must also know where it stops.

    A TOC entry is an in-page link whose target is defined LATER in the
    document; the forward direction is what separates it from the footnote
    back-references that are far more common (see `extract_toc_outline`).
    The span runs from the first such link to the last, widened to whole
    paragraphs, so the UNLINKED lines between them are inside it too. That
    matters: the Russian edition of `magnifica-humanitas` links only its
    chapter titles and prints all forty sub-entries as plain text, so a rule
    that could only see links would take out a tenth of its table of
    contents and leave the rest as prose.

    THE GUARD IS THE NUMBERED PARAGRAPH. Widening a span to the last forward
    link would be reckless on its own: one stray forward link in the body
    would stretch the span over the whole document. But a table of contents
    never contains a numbered paragraph and a body is made of them, so a span
    holding one is not a table of contents, and None is returned rather than
    a guess. That is a property of the two things being told apart, not a
    threshold to tune."""
    targets: dict[str, int] = {}
    for m in _ANCHOR_TARGET_RE.finditer(body_html):
        name = m.group(1) or m.group(2)
        targets.setdefault(name, m.start())
        targets.setdefault(urllib.parse.unquote(name), m.start())

    forward = [
        m
        for m in _INPAGE_LINK_RE.finditer(body_html)
        if len(strip_tags(m.group(2))) >= _TOC_MIN_TITLE_CHARS
        and (
            targets.get(m.group(1), targets.get(urllib.parse.unquote(m.group(1)))) or -1
        )
        > m.start()
    ]
    if len(forward) < _TOC_MIN_ENTRIES:
        return None

    start, end = forward[0].start(), forward[-1].end()
    for para in _TOC_PARA_RE.finditer(body_html):
        if para.end() > start and para.start() < end:
            start = min(start, para.start())
            end = max(end, para.end())
    end = _extend_toc_tail(body_html, end)
    for para in _TOC_PARA_RE.finditer(body_html[start:end]):
        if match_para_num(para.group(2)):
            return None
    return start, end


def _printed_lines_from(body_html: str, pos: int) -> set[str]:
    """Every printed line at or after `pos`, normalized for comparison.

    A "line" is what the page breaks: a paragraph, or one <br>-separated run
    inside one. That is the unit a heading occupies and the unit a table of
    contents lists, which is what makes the two comparable at all."""
    lines = set()
    for para in _TOC_PARA_RE.finditer(body_html, pos):
        for line in _BR_RE.split(para.group(2)):
            text = _norm_heading(strip_tags(line))
            if text:
                lines.add(text)
    return lines


def _extend_toc_tail(body_html: str, end: int) -> int:
    """Grow a table-of-contents span forward over the unlinked paragraphs
    that finish it.

    A page need not link its last outline entries. The Russian edition of
    `magnifica-humanitas` links its chapter titles and stops: the four
    sub-entries under CONCLUSION are printed after the last link and are
    plain text, so a span ending at that link leaves them behind to be read
    as the document's opening paragraph -- the same defect the span exists to
    fix, one paragraph wide.

    The test for "still the outline" is that every line of the paragraph is
    printed AGAIN BELOW IT, as a whole line. Both halves of that were got
    wrong once and each failed in its own direction, so both are load-bearing:

      - Measured against the text after the SPAN rather than after the
        paragraph, every paragraph trivially contains its own lines and the
        extension runs to the end of the document. It fails safe when it does
        -- `toc_link_span`'s numbered-paragraph guard rejects the span
        outright -- so the German and Polish editions lost their outline
        entirely rather than gaining a wrong one.
      - Tested as a SUBSTRING of the running text rather than as a whole
        printed line, a heading that is also an ordinary word matches its own
        body. The Polish edition's `WPROWADZENIE` was swallowed that way: it
        is both the title of the introduction and the word for introducing
        something, which the encyclical goes on to do about forty times.

    Ordinary prose is not reprinted verbatim as a line further down, so a
    paragraph of it stops the extension at once, and a numbered paragraph
    stops it whatever its text says -- the body has started. Lines too short
    to be a heading are ignored rather than allowed to stop it: a stray
    `&nbsp;` line is not evidence of anything."""
    for para in _TOC_PARA_RE.finditer(body_html, end):
        gap = body_html[end : para.start()]
        if para.start() != end and _norm_heading(strip_tags(gap)):
            break  # real text between the span and this paragraph
        if match_para_num(para.group(2)):
            break  # the body has started
        lines = [
            _norm_heading(strip_tags(line)) for line in _BR_RE.split(para.group(2))
        ]
        lines = [line for line in lines if len(line) >= _TOC_MIN_TITLE_CHARS]
        if not lines:
            break
        below = _printed_lines_from(body_html, para.end())
        if not all(line in below for line in lines):
            break
        end = para.end()
    return end


def extract_toc_outline(body_html: str) -> list[tuple[str, int]]:
    """Read the page's own linked table of contents and return its entries as
    (title, level), in document order. Empty when the page has no such TOC.

    WHY THIS EXISTS. Every other level signal in this file is inferred from
    how a heading is *painted* in the body -- bold, italic, centered, its
    rank among the styles the document happens to use. That inference is
    what `heading_style_rank` and the levelling walk in `parse_document` do,
    and it is guesswork, because vatican.va's markup carries no heading
    semantics at all: a chapter title and a sub-section title are both just
    a <p> with some emphasis on it.

    A linked table of contents is different in kind. It is the document
    *stating its own outline*: which headings exist, in what order, and --
    through the TOC's own indentation and emphasis -- at what depth. Where a
    page ships one, it outranks anything inferred from the body, and the
    inference should defer to it rather than average with it.

    HOW WIDESPREAD, measured over all 466 pages in corpus/raw/vatican-docs:
    exactly three carry a linked TOC -- magnifica-humanitas in both
    languages (82 entries each, complete) and divini-redemptoris.pt (7
    entries, top level only). Nothing else has one. So this is not a general
    replacement for the style heuristics; it is an override that fires on
    the documents that earned it, and its blast radius is those three pages.
    The count is worth re-measuring as new documents arrive: Magnifica
    Humanitas (2026) is the newest encyclical in the corpus and the only one
    produced with this markup, so the modern template may well keep it.

    DETECTION. A TOC entry is an in-page link whose target is defined LATER
    in the document. That forward direction is the whole discriminator, and
    it is what separates a TOC from the far more common footnote
    back-reference: `dominum-et-vivificantem` has 594 in-page links and
    `quadragesimo-anno.pt` 161, all of them pointing BACKWARD from a note to
    its marker. Requiring the link text to be more than a bare number rules
    out the marker links themselves.

    LEVELS come from the TOC's own typography, which -- unlike the body's --
    is internally consistent, because a TOC is written as a unit:

        bold                   -> 1   (INTRODUCTION, CHAPTER TWO)
        italic, or indented    -> 3   (sub-section titles)
        neither                -> 2   (section titles)

    Both languages agree on the scheme without using the same cues: the
    English TOC indents its level-3 entries by eight &nbsp; AND italicises
    them, the Portuguese one only italicises, and indents with a
    `margin-left` style. Either signal alone is taken as sufficient, so
    neither page depends on the other's convention. Emphasis is counted
    within the entry's own <p>, not from the top of the document, because
    these are Word exports and their <b>/<i> nesting does not survive being
    read as a global stack.

    The levels are then shifted to a base of 1 and clamped so that no entry
    sits more than one level below the one before it -- see the comment at
    the foot of the function for what each of those two steps is for."""
    span = toc_link_span(body_html)
    if span is None:
        return []
    span_start, span_end = span
    entries: list[tuple[str, int]] = []
    for para in _TOC_PARA_RE.finditer(body_html):
        if para.end() <= span_start or para.start() >= span_end:
            continue
        attrs, inner = para.group(1), para.group(2)
        margin = _MARGIN_LEFT_RE.search(attrs)
        para_indented = bool(margin) and int(margin.group(1)) > 0
        # One entry per printed LINE, not per link. The two languages break
        # their entries differently -- the English page puts <br> between the
        # anchors, the Portuguese one puts it INSIDE them -- and neither
        # keeps one anchor per line: "The song of hope: the <i>Magnificat</i>"
        # is two anchors on one line, while "CAPITULO I / UM PENSAMENTO
        # DINAMICO FIEL AO EVANGELHO" is one anchor and one unlinked line.
        # Splitting the paragraph on <br> is the only cut that agrees with
        # what the page prints, and it picks up the unlinked lines that
        # per-anchor iteration drops on the floor.
        # Emphasis is inherited across the breaks and left unbalanced on both
        # sides of them -- `<b><a>CHAPTER ONE</a><br/> A DYNAMIC APPROACH</b>`
        # opens <b> on the first line and closes it on the second. So each
        # line is re-balanced against the tags still open when it starts
        # before is_full_bold/is_full_italic sees it; testing the raw slice
        # reads every emphasised run one line late.
        bold_open = italic_open = 0
        for line in _BR_RE.split(inner):
            delta_b = len(re.findall(r"<b(?=[\s>])", line, re.IGNORECASE)) - len(
                re.findall(r"</b>", line, re.IGNORECASE)
            )
            delta_i = len(re.findall(r"<i(?=[\s>])", line, re.IGNORECASE)) - len(
                re.findall(r"</i>", line, re.IGNORECASE)
            )
            balanced_b = "<b>" * bold_open + line + "</b>" * max(0, bold_open + delta_b)
            balanced_i = (
                "<i>" * italic_open + line + "</i>" * max(0, italic_open + delta_i)
            )
            bold_open = max(0, bold_open + delta_b)
            italic_open = max(0, italic_open + delta_i)
            title = strip_tags(line)
            if len(title) < _TOC_MIN_TITLE_CHARS:
                continue
            indent = len(re.findall(r"&nbsp;|&#160;|\xa0", line.split("<a")[0]))
            deeper = (
                is_full_italic(balanced_i) or para_indented or indent >= _TOC_INDENT_MIN
            )
            entries.append(
                (title, 1 if is_full_bold(balanced_b) else (3 if deeper else 2))
            )

    # No entry may sit more than one level below the one before it. The
    # three levels above are read off typography a human compositor applied
    # by hand, and it is applied inconsistently: magnifica-humanitas.en
    # italicises three of CONCLUSION's four sub-headings and not the fourth,
    # which would otherwise print CONCLUSION at h1, three children at h3 and
    # their sibling at h2. Clamping is the same normalisation the styling
    # path already does one level down, applied to the TOC's own gaps.
    # Shift to a base of 1 BEFORE clamping, or the clamp mistakes a flat TOC
    # for a nested one: divini-redemptoris.pt emphasises none of its seven
    # entries, so all seven read as 2, and clamping first would pull only
    # the first of them to 1 and leave its six peers a level below it.
    if not entries:
        return []
    base = min(level for _, level in entries) - 1
    clamped: list[tuple[str, int]] = []
    prev = 0
    for title, level in entries:
        level = min(level - base, prev + 1)
        clamped.append((title, level))
        prev = level
    return clamped


def apply_toc_outline(
    blocks: list[Block], entries: list[tuple[str, int]], match_label
) -> tuple[dict[int, int], list[str]]:
    """Match TOC entries to body blocks. Returns (block index -> level) and
    the texts of blocks PROMOTED to headings because the TOC named them.

    Matched in document order against the block stream, never by the TOC's
    own anchors. The anchors look like the obvious key and are not usable:
    magnifica-humanitas.en points both "FOUNDATIONS AND PRINCIPLES OF THE
    SOCIAL DOCTRINE OF THE CHURCH" and "The foundations of Social Doctrine"
    at the same `#The_foundations`, so keying on them silently merges a
    chapter title with its first section.

    For a block the style rules ALREADY read as a heading, matching is
    generous: exact normalized, then whole-word prefix either way (a body
    heading may carry a subtitle the TOC omits), then fuzzy, for the case
    where the two disagree in wording -- the same page prints "The limit,
    the heart, the grandeur of the human person" in its TOC and "The limit,
    the heart and the grandeur of the human person" in the body. The BODY
    text is kept as the title in every case: the TOC supplies depth, not
    wording.

    A LABELLED heading is matched on its label instead, which is the same
    identity `drop_table_of_contents` uses and for the same reason: the two
    places a document names a division rarely agree on how to write its
    number. Magnifica Humanitas lists `CAPITOLO 1` / `ГЛАВА 1` in its table
    of contents and prints `Capitolo primo` / `ГЛАВА ПЕРВАЯ` in the body, so
    no amount of text similarity connects them -- and with the chapters
    unmatched the TOC levelled every sub-heading around them while leaving
    the chapters to the style walk, which ranked them BELOW their own
    sections. Both editions came out as five-chapter documents whose
    chapters sat at levels 3 to 5.

    PROMOTION, for a block the style rules missed. A TOC entry is the
    document asserting that a heading exists, which is better evidence than
    any amount of emphasis-reading, and it recovers headings no style rule
    can reach. magnifica-humanitas.pt prints two of its headings with no
    usable styling at all -- `<p><i>As </i>res novae<i> do nosso tempo</i></p>`
    is only partly italic, and `<p style="text-align: center;">UM PENSAMENTO
    DINAMICO FIEL AO EVANGELHO</p>` carries nothing but centring -- and both
    were absent from the outline until the TOC vouched for them.

    Promotion is held to a stricter match than levelling: exact or fuzzy
    only, never prefix, and never a numbered paragraph. A prefix match here
    would let a short TOC entry claim the opening words of a long paragraph
    and delete it from the text, which is the failure mode
    `promote_italic_heading_run` is careful about for the same reason."""
    levels: dict[int, int] = {}
    promoted: list[str] = []
    cursor = 0
    for title, level in entries:
        want = _norm_heading(title)
        found = None
        for pos in range(cursor, len(blocks)):
            blk = blocks[pos]
            have = _norm_heading(blk.text)
            if not have:
                continue
            if blk.is_heading:
                # Both numbers must be known before a label counts as
                # identity: `("chapter", None)` compares equal to every other
                # unnumbered chapter, and would match the first one found.
                sig = match_label(blk.label or blk.text)
                hit = (
                    have == want
                    or have.startswith(want + " ")
                    or want.startswith(have + " ")
                    or (
                        sig is not None
                        and sig[1] is not None
                        and sig == match_label(title)
                    )
                    or difflib.SequenceMatcher(None, have, want).ratio()
                    >= _TOC_FUZZY_RATIO
                )
            else:
                hit = not match_para_num(blk.raw) and (
                    have == want
                    or difflib.SequenceMatcher(None, have, want).ratio()
                    >= _TOC_FUZZY_RATIO
                )
            if hit:
                found = pos
                break
        if found is None:
            continue
        if not blocks[found].is_heading:
            blocks[found].is_heading = True
            promoted.append(blocks[found].text)
        levels[found] = level
        cursor = found + 1
    return levels, promoted


def drop_table_of_contents(blocks: list[Block], match_label) -> list[str]:
    """Remove the page's own table of contents from the block stream, in
    place, and return the texts dropped (for the run summary -- this is
    never silent).

    THE DEFECT THIS FIXES, observed on `encyclical.magnifica-humanitas`
    (both languages): the modern vatican.va shell prints a linked table of
    contents ahead of the body, and every one of its entries is a fully-bold
    <p> block -- indistinguishable, to `is_full_bold`, from the real heading
    it points at. The walker therefore pushed each TOC entry as a structure
    node, and because a heading stays open until the next one pops it, the
    LAST TOC entry was still open when the body's first numbered section
    arrived. Result: five phantom top-level nodes with null ranges, plus a
    sixth phantom "CHAPTER FIVE" that swallowed the document's real
    Introduction (sections 1-16) as its children. The body's own chapters
    parsed correctly; only the front of the tree was wrong, which is exactly
    the kind of defect that looks plausible until someone reads it.

    `compendium.py` has the same problem and solves it by walking only
    between two known anchors. That works for one hand-inspected page; this
    scraper runs across ~450 documents in several templates, so the rule
    here is structural instead of positional:

        A block that appears BEFORE the body's first numbered section is a
        table-of-contents entry if a LATER heading duplicates it.

    It said "a HEADING that appears before" until 2026-08-24, and that was
    too narrow by exactly the amount that matters. A printed table of
    contents is typeset like the outline it depicts: its chapter lines are
    bold and its sub-headings are not, so only the bold minority ever became
    heading blocks. The rest stayed ordinary prose blocks, invisible to this
    function, and were swept into the document's first section --
    `magnifica-humanitas` opened with its own table of contents as the first
    paragraph of §1 in eight of its nine editions, and
    `divini-redemptoris.pt` with all four of its part titles. The Arabic
    edition escaped only because it prints no table of contents at all.

    A pre-body block is a weaker candidate than a pre-body heading, so the
    duplicate test below carries the whole burden -- which it already could:
    a block holding several TOC lines run together with <br/> is matched by
    the same whole-word-prefix rule that matches one, since the first line
    of the block is the heading and the rest is what follows it in the
    outline. That is how the Russian edition's unlinked, unbolded sub-entries
    are caught alongside the English edition's linked ones.

    "Duplicates" is deliberately two-pronged, because a TOC entry is rarely
    character-identical to its target. Where a heading carries a real label
    (`CHAPTER ONE`), the label and its number are the identity, and the TOC's
    trailing subtitle text ("CHAPTER ONE A DYNAMIC APPROACH FAITHFUL TO THE
    GOSPEL" against the body's bare "CHAPTER ONE") is ignored. Where it does
    not (`INTRODUCTION`, `CONCLUSION`), the body heading must be a
    whole-word prefix of the TOC entry -- the TOC lists a section's
    sub-headings after its title, so the TOC text is the longer of the two.

    TWO GUARDS AGAINST EATING REAL STRUCTURE, since dropping a legitimate
    heading would be a worse defect than the one being fixed:

      - Only pre-body blocks are ever candidates. A document's real
        INTRODUCTION also sits before section 1, and survives precisely
        because nothing later duplicates it -- as do the salutation, the
        dateline, and the unnumbered framing prose that several encyclicals
        print ahead of their first numbered paragraph.
      - At least TWO duplicates are required before anything is dropped. One
        repeated heading is a coincidence a real document can easily produce
        (per-part introductions, a repeated ARTICLE label); a whole run of
        them repeating in order is a table of contents.
    """
    first_numbered: int | None = None
    for idx, blk in enumerate(blocks):
        if not blk.is_heading and match_para_num(blk.raw):
            first_numbered = idx
            break
    if first_numbered is None:
        # No numbered section anywhere -- an unnumbered document (or a
        # parse this function has no business second-guessing). Leave it be.
        return []

    heading_idx = [i for i, blk in enumerate(blocks) if blk.is_heading]
    # Every pre-body block, not only the ones the walker already reads as
    # headings: see the docstring's note on why a printed TOC is only
    # half bold.
    candidates = [i for i in range(first_numbered) if blocks[i].text.strip()]
    if not candidates:
        return []

    duplicated: list[int] = []
    for i in candidates:
        sig_i = match_label(blocks[i].text)
        norm_i = _norm_heading(blocks[i].text)
        for j in heading_idx:
            if j <= i:
                continue
            if sig_i is not None:
                # Labelled: identity is (kind, number), subtitle ignored.
                if match_label(blocks[j].text) == sig_i:
                    duplicated.append(i)
                    break
                continue
            # Unlabelled: the body heading is a whole-word prefix of the
            # TOC entry. The `+ " "` is what keeps a short later heading
            # from prefix-matching an unrelated longer one.
            norm_j = _norm_heading(blocks[j].text)
            if norm_j and (norm_i == norm_j or norm_i.startswith(norm_j + " ")):
                duplicated.append(i)
                break

    if len(duplicated) < 2:
        return []

    dropped = [blocks[i].text for i in duplicated]
    for i in reversed(duplicated):
        del blocks[i]
    return dropped


def _opens_a_numbered_paragraph(blocks: list[Block], i: int) -> bool:
    """Whether the next block that is not a heading carries a paragraph number.

    The one thing that lets an italic block BEFORE the body's first numbered
    paragraph be a heading rather than furniture. `promote_italic_heading_run`
    excludes that whole region, and has to: a document's salutation
    ("Venerable Brethren, Health and the Apostolic Blessing.") is printed in
    exactly the same italics as its sub-headings, and promoting it would put
    furniture in the table of contents.

    But an encyclical whose §1 is unnumbered framing text puts its FIRST real
    sub-heading in that region too, and it was being dropped outright --
    `augustissimae-virginis-mariae.en` kept nine of its ten and lost "Mary's
    Place in the Incarnation and Redemption", the only difference being that
    §1 carries no number for it to sit after.

    The two are told apart by what follows, which is what a heading is for: a
    heading is followed by the numbered paragraph it heads, while the
    salutation is followed by the document's unnumbered opening prose."""
    for blk in blocks[i + 1 :]:
        if blk.is_heading:
            continue
        return match_para_num(blk.raw) is not None
    return False


# Longest italic block still plausibly a heading. Sub-headings in this
# corpus run well under this; the salutations and datelines that share the
# markup are comparable in length, so length alone does NOT separate them
# -- the run rule below is what does.
_ITALIC_HEADING_MAX_CHARS = 90
_ITALIC_HEADING_MIN_RUN = 3

#: How many headings a style must hold before a lone heading of the
#: neighbouring style is read as the odd one out rather than a tier. Three,
#: the same floor `_ITALIC_HEADING_MIN_RUN` uses: two headings are not yet a
#: pattern worth overruling a third with.
_MIN_STYLE_TIER = 3

#: How many headings a style may hold and still be read as the odd one out.
#: Two, because Sollicitudo Rei Socialis EN puts two there -- the citation
#: heading and the `Blessing` salutation, both centred and italic against six
#: centred plain chapters -- and its oracle reads all eight as one tier.
_ODD_TIER_MAX = 2


def promote_italic_heading_run(blocks: list[Block]) -> list[str]:
    """Mark italic-only blocks as headings where a RUN of them appears, and
    return the texts promoted (for the run summary -- never silent).

    THE DEFECT THIS FIXES (description pass 2026-08, docs/research/
    description-pass-2026-08.md §1): `is_full_bold` recognises a heading
    only when the block's whole text sits inside <b>. vatican.va marks
    sub-headings up three ways, and only one of them is bold:

        <p align="left"><b><i>Title</i></b></p>   -> detected
        <p><i>Title</i></p>                       -> MISSED
        <p align="CENTER"><i>Title</i></p>        -> MISSED

    A missed heading is not merely left unstructured. It is not a numbered
    paragraph either, so nothing downstream claims it and the text is
    discarded outright. `fratelli-tutti.pt` is the controlled case: all 17
    of its bold-only blocks were captured and all 78 of its italic
    sub-headings vanished. `ad-petri.en` lost 47 of 48. Across
    corpus/raw/vatican-docs this markup appears ~1,000 times, and on a
    random 40-page sample 30 of 32 such blocks were absent from the parse.
    This is the main reason ~300 works have no usable chapter division.

    WHY A RUN, AND NOT SIMPLY "ITALIC MEANS HEADING": the same markup
    carries a document's opening salutation ("Venerable Brethren, Health
    and Apostolic Benediction.") and its closing dateline. Promoting those
    would put furniture in the table of contents -- the exact defect class
    `drop_table_of_contents` exists to undo. A document that titles its
    sub-sections does so throughout; a salutation occurs once. So the rule
    is the same shape as that function's: a lone occurrence is a
    coincidence a real document produces, a run of them is a convention.

    Numbered paragraphs are excluded explicitly: italic is also how some
    pages wrap an ordinary numbered paragraph (Redemptor Hominis EN's
    `<p><b><i>10 . The human dimension...`), and turning one into a
    heading would cost a section rather than gain a heading."""
    numbered = [
        i for i, b in enumerate(blocks) if not b.is_heading and match_para_num(b.raw)
    ]
    body_start = numbered[0] if numbered else -1
    candidates = [
        i
        for i, blk in enumerate(blocks)
        if (i > body_start or _opens_a_numbered_paragraph(blocks, i))
        and not blk.is_heading
        and blk.kind != "quote"
        and len(blk.text) <= _ITALIC_HEADING_MAX_CHARS
        and match_para_num(blk.raw) is None
        and _SECTION_TITLE_HEADING_RE.match(blk.text) is None
        and has_words(blk.text)
        and not blk.indented
        and is_full_italic(blk.raw)
    ]
    # THE RUN IS ESTABLISHED BY THE BODY, and a pre-body block only joins
    # one that already exists. Counting the two together lets a single
    # pre-body block push a document over the threshold on its own, and
    # the blocks that then come with it are not headings:
    # `quum-diuturnum.en` has two real italic sub-headings and one italic
    # CONTINUATION of §4's own sentence, and admitting all three turned
    # that sentence into a heading and took it out of the section. A
    # document that titles its sub-sections does so in its body, where the
    # evidence is a run rather than a single block.
    if len([i for i in candidates if i > body_start]) < _ITALIC_HEADING_MIN_RUN:
        return []
    for i in candidates:
        blocks[i].is_heading = True
    return [blocks[i].text for i in candidates]


# The bar is `[ AR - BE - ... ]` in the old shell and a BARE `EN - FR - IT -
# LA - PT` in the modern one, sometimes with `ZH_CN`/`ZH_TW` among the codes.
# Requiring the brackets meant `extract_document_header` broke on its very
# first block for every modern-shell page, so all 307 encyclicals had an empty
# `manifest.header` while all 32 old-shell vatii works had one -- a split by
# page shell, which is what gave the cause away.
_LANG_CODE = r"[A-Za-z]{2}(?:_[A-Za-z]{2})?"
_LANG_BAR_PREFIX_RE = re.compile(
    rf"^\s*\[?\s*{_LANG_CODE}\s*(?:-\s*{_LANG_CODE}\s*)+\]?\s*"
)


_BR_RUN_RE = re.compile(r"(?:<br\s*/?>\s*){2,}", re.IGNORECASE)
_ANY_TAG_RE = re.compile(r"<(/?)(\w+)\b[^>]*>")


def drop_orphan_close_tags(html: str) -> str:
    """Remove closing tags that nothing in `html` opened.

    Three mastheads carry one: the source opens `<b><i>` in one block and
    closes it in the next, and blocks are narrowed one at a time, so the
    opener is in a block the header scan dropped while `</i></b>` survives in
    the one it kept. Harmless in the corpus, not harmless on the page -- the
    site renders `header` as html, so a stray closer shuts a tag the page
    itself opened."""
    open_counts: dict[str, int] = {}
    out, pos = [], 0
    for m in _ANY_TAG_RE.finditer(html):
        name = m.group(2).lower()
        if m.group(1):
            if open_counts.get(name, 0) > 0:
                open_counts[name] -= 1
            else:
                out.append(html[pos : m.start()])
                pos = m.end()
                continue
        elif name != "br":
            open_counts[name] = open_counts.get(name, 0) + 1
    out.append(html[pos:])
    return "".join(out)


# The rule a page may print between its masthead and its body, and the link
# lines that sit beside it. Structural rather than a vocabulary list: the link
# is localised (`[ Multimedia ]`, `[ Multimédia ]`, `[ Multimídia ]`) and the
# next one added would be too, so what is matched is "a bracketed single
# anchor, and nothing else in the block".
_MASTHEAD_RULE_RE = re.compile(r"^_{5,}$")
_MASTHEAD_LINK_RE = re.compile(r"^\[\s*[^\[\]]{1,24}\s*\]$")
_SINGLE_ANCHOR_RE = re.compile(
    r"^\[\s*<a\s[^>]*>.*</a>\s*\]$", re.IGNORECASE | re.DOTALL
)
#: How far into a page the furniture may sit before it stops being a masthead
#: boundary at all. The nine pages that print one put it at block 2-7.
_MASTHEAD_WINDOW = 12


def _is_masthead_furniture(b: Block) -> bool:
    flat = " ".join(b.text.split())
    if _MASTHEAD_RULE_RE.match(flat):
        return True
    return bool(_MASTHEAD_LINK_RE.match(flat)) and bool(
        _SINGLE_ANCHOR_RE.match(" ".join(b.raw.split()))
    )


def _printed_masthead_end(blocks: list[Block]) -> int | None:
    """Index of the first furniture block, when the page prints one ahead of
    its body, else None. See `extract_document_header`."""
    for i, b in enumerate(blocks[:_MASTHEAD_WINDOW]):
        if match_para_num(b.raw):
            return None
        if _is_masthead_furniture(b):
            return i or None
    return None


def _skip_masthead_furniture(blocks: list[Block], end: int) -> int:
    """`end` advanced past the furniture run itself. Not simply "one block":
    the Russian edition prints the rule between `[ Multimedia ]` and
    `[ PDF ]`, so the run is three blocks long there and one elsewhere."""
    i = end
    while i < len(blocks) and _is_masthead_furniture(blocks[i]):
        i += 1
    return i


def extract_document_header(
    blocks: list[Block], slug: str, pontiff: str
) -> tuple[str, int]:
    """Split the document's own printed masthead off the front of the stream.

    Every page opens with one -- "CONSTITUIÇÃO CONCILIAR SACROSANCTUM
    CONCILIUM SOBRE A SAGRADA LITURGIA", "ENCYCLICAL OF POPE LEO XIII ON
    CAPITAL AND LABOR" -- and it is real content worth showing, not furniture
    to discard. What it is NOT is a heading: left in the block stream it
    becomes a phantom top-level structure node, which is how Rerum Novarum
    ended up with a two-node "outline" consisting of its own title and
    subtitle.

    vatican.va prints its language selector in the same region, sometimes as
    its own block and sometimes run together with the masthead, so the bar is
    stripped wherever it appears.

    The boundary cannot be styling: Sacrosanctum Concilium's masthead is not
    bold while Rerum Novarum's title is. It is identity instead -- a leading
    block belongs to the header while it names the document (every
    significant word of the slug) or names its author. The first block that
    does neither is the document's first real heading, and the scan stops
    there rather than running to the first numbered section, which would
    swallow a genuine PREFACE or PROÉMIO.

    UNLESS THE PAGE SAYS WHERE THE MASTHEAD ENDS, which some do: a rule of
    underscores, and the `[ Multimedia ]` / `[ PDF ]` links beside it, printed
    between the masthead and the first heading. Where a page prints that, it
    is stating its own boundary and the identity guess defers to it -- the
    same order of precedence `extract_toc_outline` gives a printed table of
    contents over inferred heading levels.

    It matters because identity is a Latin-script rule wearing a general
    one's clothes. It works while the masthead is one block naming the
    document, which is every page in the corpus until Magnifica Humanitas
    arrived in nine languages: its Polish, Russian and Arabic editions each
    open with a bare kind-word block (`ENCYKLIKA`, `ЭНЦИКЛИКА`, `رسالة بابويّة
    عامّة`) that names neither the document nor its author, so the scan
    stopped on block one and captured an empty masthead, leaving
    `MAGNIFICA HUMANITAS` and the Pope's name behind as phantom headings.
    Localised regnal names (`ЛЬВА XIV` for `Leo XIV`) close the other route
    in. Measured over all 468 raw pages, exactly those nine print the rule,
    and six of them already had the right masthead by identity -- so they are
    the regression check on this, not just its beneficiaries."""
    end = _printed_masthead_end(blocks)
    slug_words = [w for w in fold(slug.replace("-", " ")).split() if len(w) > 2]
    pont = fold(pontiff or "").strip()
    taken = 0
    kept: list[str] = []
    for i, b in enumerate(blocks):
        if end is not None and i >= end:
            break
        if match_para_num(b.raw):
            break
        flat = " ".join(b.text.split())
        bar_only = bool(_LANG_BAR_ONE_RE.match(flat))
        folded = fold(_LANG_BAR_PREFIX_RE.sub("", flat))
        names_doc = bool(slug_words) and all(w in folded for w in slug_words)
        names_author = bool(pont) and pont in folded
        if end is None and not (bar_only or names_doc or names_author):
            break
        taken += 1
        if not bar_only:
            html = _LANG_BAR_PREFIX_RE.sub("", b.html).strip()
            # A block whose only content is empty emphasis (`<b><i> </i></b>`,
            # which several pages leave behind between masthead lines) is not
            # a line of the masthead and must not become one.
            if html and strip_tags(html).strip():
                kept.append(html)
    if not taken:
        return "", 0
    # The furniture itself is not masthead and not content -- a link to a PDF
    # of the same document and a printed rule. Dropped with it, so nothing
    # downstream has to decide what a block of underscores is.
    dropped = taken if end is None else _skip_masthead_furniture(blocks, end)
    del blocks[:dropped]
    # Joined with a BREAK, not a space: each block kept here is its own
    # printed paragraph, which is a line of the masthead. Populorum
    # Progressio EN prints the title, `ENCYCLICAL OF POPE PAUL VI / ON THE
    # DEVELOPMENT OF PEOPLES` and the date as three blocks, and a space join
    # ran the title into the line beneath it. Its PT edition looked right only
    # because that page happens to set the whole masthead in ONE block with
    # its own `<br/>`s -- the same masthead, saved by an accident of markup.
    joined = "<br/>".join(kept).strip()
    # Some blocks already end with their own break; the join would double it.
    joined = _BR_RUN_RE.sub("<br/>", joined)
    # Emphasis wrapped around nothing -- `<b><i> </i></b>`, which several
    # pages leave between masthead lines -- renders as nothing and only makes
    # the stored markup harder to read. Collapsed repeatedly because the pairs
    # nest.
    while (collapsed := _EMPTY_TAG_PAIR_RE.sub("", joined)) != joined:
        joined = collapsed
    return drop_orphan_close_tags(joined).strip(), dropped


def promote_plain_centered_run(blocks: list[Block]) -> list[str]:
    """Recover headings the source centres but never emphasises.

    `Ad Petri Cathedram` marks its four parts as bare `<p align="CENTER">I</p>`
    and `Laudato Si'` its chapters the same way -- no bold, no italic, nothing
    for `is_full_bold` or the italic run to catch. The result is not merely a
    missing heading: the tier ABOVE the titled headings vanishes, so a
    45-heading document flattens to one level.

    Gated twice, because this shape is mostly page furniture across the corpus
    (386 blocks in 199 files, dominated by copyright lines and title blocks):
    only runs of >= 3 count, and only blocks sitting INSIDE the numbered body,
    which is where furniture never is."""
    numbered = [
        i for i, b in enumerate(blocks) if not b.is_heading and match_para_num(b.raw)
    ]
    if not numbered:
        return []
    lo, hi = numbered[0], numbered[-1]
    # THE RUN IS THE WHOLE RUN, including the members some earlier pass has
    # already claimed. Counting only the unclaimed ones let a document lose
    # exactly the markers another pass had missed: `ad-petri.en` prints its
    # four parts as `<p align="CENTER">I</p>` .. `IV`, byte-identical, and the
    # page's own table of contents had already promoted I and III -- leaving
    # II and IV as a run of two, one short of the threshold, so the document
    # came out with a part boundary at 6 and 59 and none at 20 or 97. Same
    # shape, opposite verdict, from a gate that was never meant to decide it.
    #
    # `is_full_bold` is what keeps the peers honest: `style` records centring
    # and italics but says nothing about bold, so without it a centred BOLD
    # heading would pad the run that is supposed to establish the unemphasised
    # ones.
    peers = [
        i
        for i, b in enumerate(blocks)
        if lo < i < hi
        and b.kind != "quote"
        and b.style == 0  # centred, no italic, and not bold or it would be a heading
        and not is_full_bold(b.raw)
        and len(b.text) <= _ITALIC_HEADING_MAX_CHARS
        and match_para_num(b.raw) is None
        and _SECTION_TITLE_HEADING_RE.match(b.text) is None
        and has_words(b.text)
        and not b.indented
    ]
    if len(peers) < _ITALIC_HEADING_MIN_RUN:
        return []
    candidates = [i for i in peers if not blocks[i].is_heading]
    for i in candidates:
        blocks[i].is_heading = True
    return [blocks[i].text for i in candidates]


_HEADING_LETTER_RE = re.compile(r"[^\W\d_]", re.UNICODE)


def has_words(text: str) -> bool:
    """A heading names something, so it has at least one letter.

    Both recovery passes below promote a RUN of same-styled blocks, and a
    source that sets its headings apart typographically tends to set its
    scene breaks apart the same way: Laudato Si' EN prints
    `<p align="center">* * * * *</p>` before section 246, indistinguishable
    by style from the 42 centred headings the pass exists to find, and the
    hand-read table of contents (`audit.py toc`) caught it standing among
    them as a heading. Punctuation is not a title."""
    return _HEADING_LETTER_RE.search(text) is not None


# `*`, not `+`: a document published in ONE language still prints the bar,
# and it is then a single bare code. `rerum-ecclesiae.en` opens with `EN`
# alone, which failed this test, was not the document's title or its author
# either, and so ended the masthead scan on block one -- leaving `ENCYCLICAL
# OF POPE PIUS XI / ON CATHOLIC MISSIONS / TO OUR VENERABLE BRETHREN...` to
# be read as the opening words of §1. 26 works had an empty
# `manifest.header` for this reason.
#
# Deliberately only the WHOLE-BLOCK test. `_LANG_BAR_PREFIX_RE` strips a bar
# off the front of a block that continues into real text, and letting one
# code satisfy that would truncate any masthead line beginning with a
# two-letter word.
# TWO SPELLINGS, FOR TWO DIFFERENT DECISIONS.
#
# `_LANG_BAR_ONE_RE` accepts a bar of a single code, because a document
# published in one language still prints one and it is then a bare `EN`
# (19 mastheads recovered). That tolerance is
# safe for the masthead scan, which only asks where the front matter STARTS.
#
# `_LANG_BAR_RE` requires two, because `drop_page_furniture` DELETES what it
# matches, and a lone two-letter token is not evidence of anything: `II` and
# `IV` are two letters. Sharing the loosened form cost `ad-petri.en` the part
# markers before §20 and §97 while leaving `I` and `III` standing -- same
# markup, opposite verdict, decided by nothing but how many letters the
# numeral has. `sacerdotii.en`, `grata-recordatio.en` and `princeps.en` lost
# the same `II`, and in each the effect was worse than a missing heading: the
# flat structure array had no boundary at all where that part began.
_LANG_BAR_ONE_RE = re.compile(rf"^\[?\s*{_LANG_CODE}\s*(?:-\s*{_LANG_CODE}\s*)*\]?$")
_LANG_BAR_RE = re.compile(rf"^\[?\s*{_LANG_CODE}\s*(?:-\s*{_LANG_CODE}\s*)+\]?$")
_PAPAL_SIGNATURE_RE = re.compile(
    r"^(?:PAPA\s+)?"
    r"(?:PIUS|PIO|LEO|LEAO|IOANNES|JOANNES|JOAO|JOHN|PAULUS|PAUL|PAULO"
    r"|BENEDICTUS|BENEDICT|BENTO|FRANCISCUS|FRANCIS|GREGORIUS|GREGORY)"
    r"(?:\s+(?:PAULUS|PAULO|PAUL|XXIII))?"
    # `PP.` sits on either side of the numeral. `PIO PP. XII` is the common
    # form; divini-redemptoris.pt signs `PIO XI PP.`, which the fixed order
    # missed, leaving the signature in the outline as a top-level heading
    # with nothing under it.
    r"(?:\s+PP\.?)?"
    r"(?:\s+[IVXLC]+)?"
    r"(?:\s+PP\.?)?"
    r"(?:\s+PAPA)?\.?$"
)


def drop_page_furniture(blocks: list[Block]) -> list[str]:
    """Remove non-content blocks that `is_full_bold` cannot tell from a
    chapter title, and return the texts dropped (never silent).

    Two kinds, both measured across the corpus in the 2026-08 description
    pass (§2): of 513 structure nodes carrying a [null, null] range, ~168
    are furniture -- 153 papal signature lines (`PIUS XII`, `PIO PP. XII`,
    `IOANNES PAULUS PP. II`, ...) and 15 copies of vatican.va's own
    language navigation bar, `[ AR - BE - CS - DE - EN - ES - ... ]`. Both
    are bold and centered, so they read as headings and surface in a
    reader's table of contents as entries with nothing under them.

    The signature test is POSITIONAL as well as textual: a papal name is
    dropped only after the last numbered paragraph, which is the only place
    a signature occurs. A pope's name is perfectly legitimate as a heading
    inside a document's body (a section about a predecessor), and that case
    must survive."""
    last_numbered = -1
    for idx, blk in enumerate(blocks):
        if not blk.is_heading and match_para_num(blk.raw):
            last_numbered = idx

    doomed: list[int] = []
    for i, blk in enumerate(blocks):
        if not blk.is_heading:
            continue
        text = " ".join(blk.text.split())
        if _LANG_BAR_RE.match(text) or (
            i > last_numbered and _PAPAL_SIGNATURE_RE.match(fold(text))
        ):
            doomed.append(i)

    dropped = [blocks[i].text for i in doomed]
    for i in reversed(doomed):
        del blocks[i]
    return dropped


_TITLE_NUMBERING_MIN_RUN = 3


def numbering_is_in_headings(blocks: list[Block]) -> bool:
    """Does this document number its SECTIONS in its headings?

    Gravissimum Educationis EN does: its twelve items are printed as
    `<p><i><b>N. Title</b></i></p>` with unnumbered prose underneath, and
    nowhere does a paragraph carry a number of its own. Quadragesimo Anno PT
    looks identical block by block and means something entirely different --
    its bold numbers run 1,2,3 / 1,3,4,5 / 1,2,3, a per-part outline that
    RESTARTS, and reading them as section numbers fabricated five sections
    out of an unnumbered document (it was withheld for that, and this is the
    gate that stops the parser producing them in the first place).

    One block can't tell the two apart, so the decision is made once for the
    document, on three things:

    - the numbered headings never go backwards. A GAP is fine -- Mortalium
      Animos PT prints 2, 3, 8, 13, 14, 15, 17, 18 as headings and the
      numbers in between inline, mid-prose, where _gap_block recovers them,
      so demanding a complete run there cost seven real sections. A RESTART
      is the fabrication signal: Quadragesimo Anno PT's bold numbers go
      1, 2, 3 / 1, 3, 4, 5 / 1, 2, 3, a per-part outline that begins again
      in each part, and reading it as section numbers invented five
      sections for a document that numbers nothing (it was withheld for
      exactly that, against an EN sibling with 148);
    A document may use BOTH conventions at once and still be read correctly:
    Mortalium Animos PT prints eight of its nineteen section numbers as
    headings and the rest inline. So the presence of ordinary numbered
    paragraphs is deliberately not disqualifying -- an earlier draft made it
    so and cost that document seven sections.
    - every heading between the first numbered one and the last is either
      numbered itself or a ROMAN-numeral division. A section number names
      the finest division a document has, so a heading of some other kind
      underneath means the numbers are an outline over finer structure.
      Miranda Prorsus EN is why: its "1. GENERAL INSTRUCTION" .. "4.
      TELEVISION" run 1-4 contiguously and it numbers no paragraphs, so the
      first two tests pass -- but fifteen unnumbered headings sit between
      its 1 and its 2 ("PUBLICISING CHRISTIAN DOCTRINE", 'THE "GOOD SEED"',
      ...), because those four are the encyclical's parts. Read as sections
      they produced four ~18,000-character "paragraphs" against a PT
      sibling that has none to check them by.

      The Roman exemption is not a loophole: Redemptor Hominis, Laborem
      Exercens and Dives in Misericordia all print "I. INHERITANCE",
      "II. THE MYSTERY OF THE REDEMPTION" between their numbered sections,
      and those are a COARSER tier above them, not a finer one underneath.
      Requiring nothing at all between the numbers took all three to zero
      sections -- 64 real ones lost -- which is what this clause prevents."""
    numbered: list[int] = []
    span: list[bool] = []  # is_numbered, per heading, in document order
    allowed: list[bool] = []  # numbered, or a coarser Roman division
    for b in blocks:
        if b.is_heading:
            m = _SECTION_TITLE_HEADING_RE.match(b.text)
            span.append(m is not None)
            allowed.append(
                m is not None or _ROMAN_DIVISION_RE.match(b.text) is not None
            )
            if m is not None:
                numbered.append(int(m.group(1)))
    if len(numbered) < _TITLE_NUMBERING_MIN_RUN:
        return False
    if any(b <= a for a, b in itertools.pairwise(numbered)):
        return False
    lo, hi = span.index(True), len(span) - span[::-1].index(True)
    return all(allowed[lo:hi])


_ROMAN_DIVISION_RE = re.compile(r"^[IVXLCDM]+\s*\.\s")
# Anchored on the period: "IN THE SERVICE OF TRUTH" and "MASS EDUCATION"
# both open on letters that are also Roman digits, and neither is followed
# by one.


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


# NOTE: no `CorrectionDriftError` here, unlike ccc.py/cpdv.py/matos_soares.py.
# Those scrapers raise on drift; this one cannot, because `scrape_one` promises
# never to raise (see its docstring) so that one bad document can't kill a crawl
# of many. Drift is reported instead as `status="corrections-drift"` on the
# result dict -- see the `missing` check at the end of `scrape_one`.


def find_paragraph_number_correction(
    corrections: list[dict], expected: int, cand: int
) -> dict | None:
    for c in corrections:
        if c.get("resolution") or c["field"] != "paragraph_number":
            continue
        loc = c["locator"]
        if loc.get("section") == expected and c["from"] == str(cand):
            return c
    return None


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
    date_digits: (
        str  # 8 raw digits from the filename, format TBD (see parse_promulgation_date)
    )
    lang_urls: dict[str, str]  # {"en": url, "pt": url}
    #: The language of the index this document was discovered from, and so the
    #: language its other URLs are derived from. English for all but the seven
    #: encyclicals vatican.va lists only in Italian -- see
    #: `FALLBACK_INDEX_LANGS`. Not cosmetic: every other language's URL is one
    #: path substitution away from THIS one, and a document with no English
    #: edition has no English URL to substitute from.
    base_lang: str = "en"


def parse_promulgation_date(digits: str) -> str | None:
    if len(digits) != 8 or not digits.isdigit():
        return None
    y1, m1, d1 = digits[0:4], digits[4:6], digits[6:8]
    y2, m2, d2 = digits[4:8], digits[2:4], digits[0:2]
    for y, mo, d in ((y1, m1, d1), (y2, m2, d2)):
        try:
            date(int(y), int(mo), int(d))
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
            DocRef(
                "vatii", VATII_KIND_MAP[kind], slug, "Second Vatican Council", date8, {}
            ),
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


def _index_links(
    fetcher: Fetcher, index_url: str, cache_name: str, link_re: re.Pattern
) -> list[str]:
    text, _err = fetcher.fetch_text(index_url, cache_name)
    if text is None:
        return []
    return sorted({m.group(1) for m in link_re.finditer(text)})


#: Indexes consulted after English, for documents English does not list.
#: Measured 2026-08-25 across all thirteen pontificates: Italian lists seven
#: encyclicals English does not -- six of Pius XI's and one of Pius XII's --
#: and no other language was needed to reach a document at all. Ordered, and
#: the first index that has a document wins, so a document reachable in two
#: fallbacks is taken from the earlier one.
#:
#: This is not a general "crawl more languages" switch. It exists so that
#: every encyclical the Holy See publishes is on the site in SOME language
#: (`docs/decisions.md` §Scope); the language a document arrives in is
#: whichever one it exists in, not a preference.
FALLBACK_INDEX_LANGS = ("it",)


def _encyclical_refs_from_index(
    fetcher: Fetcher, pontiff_slug: str, display_name: str, lang: str
) -> tuple[dict[str, DocRef], list[str]]:
    """`slug -> DocRef` for one pontificate's encyclical index in `lang`."""
    notes: list[str] = []
    link_re = re.compile(_ENCYC_LINK_RE_TMPL.format(slug=pontiff_slug, lang=lang))
    cache = f"index__encyclicals__{pontiff_slug}.html"
    if lang != "en":
        cache = f"index__encyclicals__{pontiff_slug}__{lang}.html"
    fnames = _index_links(
        fetcher,
        f"https://www.vatican.va/content/{pontiff_slug}/{lang}/encyclicals.index.html",
        cache,
        link_re,
    )
    refs: dict[str, DocRef] = {}
    for fname in fnames:
        parsed = parse_date_slug(fname)
        if parsed is None:
            notes.append(
                f"{pontiff_slug}: filename {fname!r} matches neither known convention -- skipped"
            )
            continue
        date8, slug = parsed
        url = (
            f"https://www.vatican.va/content/{pontiff_slug}/{lang}"
            f"/encyclicals/documents/{fname}.html"
        )
        refs[slug] = DocRef(
            "encyclical",
            "encyclical",
            slug,
            display_name,
            date8,
            {lang: url},
            base_lang=lang,
        )
    return refs, notes


def discover_encyclicals(
    fetcher: Fetcher, pontiff_slug: str, display_name: str
) -> tuple[list[DocRef], list[str]]:
    """Enumerates from the pontiff's own encyclicals index -- not a hardcoded
    document list, per this task's brief. Other languages are then checked
    per-document (a 404 is expected, not an error -- see module docstring /
    final report).

    English first, then `FALLBACK_INDEX_LANGS` for anything English does not
    list. Reading one index only was a silent gap rather than a small one: a
    document the Holy See never translated into English was not discovered,
    not fetched, and not recorded absent, so nothing anywhere said it existed.
    Seven encyclicals were in that state until 2026-08-25."""
    refs, notes = _encyclical_refs_from_index(fetcher, pontiff_slug, display_name, "en")
    for lang in FALLBACK_INDEX_LANGS:
        extra, extra_notes = _encyclical_refs_from_index(
            fetcher, pontiff_slug, display_name, lang
        )
        notes.extend(extra_notes)
        new = {s: r for s, r in extra.items() if s not in refs}
        if new:
            notes.append(
                f"{pontiff_slug}: {len(new)} encyclical(s) listed in {lang} and not "
                f"in en: {', '.join(sorted(new))}"
            )
        refs.update(new)
    return list(refs.values()), notes


def discover_exhortations(
    fetcher: Fetcher, pontiff_slug: str, display_name: str
) -> tuple[list[DocRef], list[str]]:
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
            notes.append(
                f"{pontiff_slug}: filename {fname!r} matches neither known convention -- skipped"
            )
            continue
        date8, slug = parsed
        en_url = f"https://www.vatican.va/content/{pontiff_slug}/en/apost_exhortations/documents/{fname}.html"
        refs.append(
            DocRef(
                "exhortation",
                "apostolic-exhortation",
                slug,
                display_name,
                date8,
                {"en": en_url},
            )
        )
    return refs, notes


#: The languages a phase2 run fetches unless told otherwise. Not "every
#: language vatican.va publishes": the Holy See puts most encyclicals out in
#: eight or nine, and crawling all of them for all 339 documents would be
#: ~2,400 requests at the 2s Crawl-delay this project treats as a commitment,
#: for editions in languages the site has no interface in. A run that wants
#: more asks for it (`--langs`), which is how Magnifica Humanitas was taken in
#: all nine.
DEFAULT_LANGS = ("en", "pt")


def translation_url_for(ref: DocRef, lang: str) -> str | None:
    """`ref`'s URL in `lang`, derived from the one its index gave it.

    vatican.va's modern shell puts the language in one path segment and
    changes nothing else, so every translation of a document is one
    substitution away from the URL it was discovered from. Whether the page is
    actually there is not asked here -- a 404 is the expected answer for most
    (language, document) pairs and is recorded in the absent ledger, not
    treated as an error.

    Substitutes from `ref.base_lang` rather than from English, which is the
    same thing for all but seven documents and the whole point for those
    seven: an encyclical the Holy See never translated has no English URL to
    start from."""
    base = ref.lang_urls.get(ref.base_lang)
    if base is None or lang == ref.base_lang:
        return None
    if ref.family == "vatii":
        return None  # discovered directly from the index, not derived
    return base.replace(f"/{ref.base_lang}/", f"/{lang}/", 1)


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
    header: str = ""  # the document's own printed masthead, as narrowed html


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
#
# It is a floor, not the whole test, because the two things it measures that
# are NOT the document -- the language bar and the masthead -- have no fixed
# size. `amoris-laetitia.en` cleared 300 on those alone: vatican.va publishes
# that exhortation's English text as a PDF and nothing else, so its HTML page
# carries a sixteen-language bar, a six-line masthead, the words "DOWNLOAD
# PDF", and no document. See `parse_document`'s closing check, which asks the
# question this threshold is a cheap approximation of.
STUB_CONTENT_MIN_CHARS = 300


def parse_document(
    html: str,
    lang: str,
    corrections: list[dict],
    fetched_url: str,
    slug: str = "",
    pontiff: str = "",
) -> ParseResult:
    html = strip_transparent_spans(html)
    testo_m = re.search(r'class="testo"', html)
    if testo_m:
        shell = "modern"
        end_m = re.search(r"/TESTO", html[testo_m.start() :], re.IGNORECASE)
        # AFTER the opening tag, not at the `class="testo"` attribute inside
        # it. Starting at the match left `class="testo">` as literal text at
        # the head of the region -- harmless while the region's first
        # characters were skipped anyway, and NOT harmless once `_gap_block`
        # began recovering unwrapped text, because it then became the
        # document's first block: `class="testo"> EN - FR - IT - LA - PT`.
        # That is the language bar with debris glued to it, so
        # `extract_document_header` failed to recognise it and stopped on
        # block 0, leaving every modern-shell page with no masthead.
        tag_end = html.find(">", testo_m.start())
        testo_start = tag_end + 1 if tag_end != -1 else testo_m.start()
        region = (
            html[testo_start : testo_m.start() + end_m.start()]
            if end_m
            else html[testo_start:]
        )
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

    # Take the page's own printed table of contents out of the body before
    # anything reads the body as text. Its LEVELS are still wanted -- they
    # are the document stating its own outline, and outrank anything the
    # levelling walk can infer -- so `extract_toc_outline` keeps reading the
    # untouched string further down, and only the block stream loses it.
    #
    # `drop_table_of_contents` used to be the whole answer and is not: it
    # drops a pre-body HEADING that a later heading duplicates, and a printed
    # table of contents is only half headings. Its chapter lines are bold and
    # its sub-entries are not, so the sub-entries stayed ordinary prose and
    # were swept into the document's first numbered section --
    # `magnifica-humanitas` opened §1 with its own table of contents in eight
    # of its nine editions, and `divini-redemptoris.pt` with all four of its
    # part titles. Both functions stay: this one is exact where the page
    # links its outline, and that one still covers a table of contents typeset
    # without links, which nothing in the corpus has yet but the older shell
    # could plausibly produce.
    toc_html = body_html
    toc_span = toc_link_span(body_html)
    if toc_span is not None:
        body_html = body_html[: toc_span[0]] + body_html[toc_span[1] :]

    marker_template = detect_marker_template(body_html + foot_html)
    footnote_table, chapter_footnote_table = build_footnote_table(foot_html)

    star_table: dict[tuple[int, str], str] = {}
    star_m = re.search(r"SUPPLEMENTARY NOTES", foot_html, re.IGNORECASE)
    if star_m:
        primary_foot = foot_html[: star_m.start()]
        star_region = foot_html[star_m.start() :]
        footnote_table, chapter_footnote_table = build_footnote_table(primary_foot)
        star_table = build_chapter_scoped_star_table(star_region)

    state = ScrapeState(corrections)
    state.current_footnote_table = footnote_table
    state.current_chapter_footnote_table = chapter_footnote_table
    state.current_star_table = star_table

    blocks: list[Block] = []
    dropped_tags: collections.Counter = collections.Counter()
    prev_end = 0
    block_matches = list(_BLOCK_RE.finditer(body_html))
    for m in block_matches:
        # See _gap_block's docstring: recovers a numbered paragraph whose
        # opening <p> is missing from the source, by checking the raw
        # text _BLOCK_RE stepped over between the previous match and this
        # one (or, on the first iteration, before the first match).
        gap = _gap_block(body_html[prev_end : m.start()], marker_template)
        if gap is not None:
            blocks.append(gap)
        prev_end = m.end()

        inner, kind = block_kind(m)
        is_bq = kind == "blockquote"
        anchor_titled = _anchor_titles_itself(inner)
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
            is_heading = (is_full_bold(inner) or anchor_titled) if not is_bq else False
        marked = mark_footnotes(inner, marker_template)
        text = strip_tags(marked)
        if not text:
            continue
        blocks.append(
            Block(
                is_heading,
                "quote" if is_bq else "prose",
                text,
                inner,
                narrow_html(marked, dropped_tags),
                heading_style_rank(
                    m.group(0), inner, kind == "center", anchor_titled=anchor_titled
                ),
                indented=is_indented(m.group(0), inner),
            )
        )
    # Trailing gap after the last block match (or the whole region, if
    # _BLOCK_RE matched nothing at all) -- same recovery, same gate.
    tail_gap = _gap_block(body_html[prev_end:], marker_template)
    if tail_gap is not None:
        blocks.append(tail_gap)

    match_label = label_matcher(lang)

    # Strip the page's own table of contents before the walker sees it --
    # its entries are fully-bold blocks indistinguishable from the headings
    # they point at, and left in place the last one swallows the document's
    # opening sections. See `drop_table_of_contents` for the detection rule
    # and its guards. Reported, never silent.
    # Recover sub-headings the source marks with italics rather than bold.
    # Runs BEFORE the table-of-contents strip so that a TOC printed in that
    # style is still a candidate for it. See promote_italic_heading_run.
    # Compact observed heading styles to contiguous levels 1..N for THIS
    # document (see heading_style_rank). Done before the walker so every
    # push_heading can record the level the source actually showed.
    promoted = promote_italic_heading_run(blocks)
    if promoted:
        state.anomalies.append(
            f"italic heading run promoted ({len(promoted)}): "
            + ", ".join(repr(t[:40]) for t in promoted[:5])
            + (" ..." if len(promoted) > 5 else "")
        )

    # Take the masthead off the front before anything can mistake it for a
    # heading. See extract_document_header.
    header_html, header_blocks = extract_document_header(blocks, slug, pontiff)
    if header_blocks:
        state.anomalies.append(
            f"document header captured ({header_blocks} block(s)): {header_html[:80]!r}"
        )

    plain = promote_plain_centered_run(blocks)
    if plain:
        state.anomalies.append(
            f"plain centered heading run promoted ({len(plain)}): "
            + ", ".join(repr(t[:40]) for t in plain[:5])
            + (" ..." if len(plain) > 5 else "")
        )

    for text in drop_table_of_contents(blocks, match_label):
        state.anomalies.append(f"table-of-contents entry skipped: {text[:80]!r}")

    # The page's own outline, where it prints one, outranks anything the
    # levelling walk below can infer from styling. See extract_toc_outline.
    # Read from the raw region rather than from `blocks`, so it survives the
    # entries having just been dropped from the stream.
    toc_entries = extract_toc_outline(toc_html)
    toc_level: dict[int, int] = {}
    if toc_entries:
        toc_level, toc_promoted = apply_toc_outline(blocks, toc_entries, match_label)
        state.anomalies.append(
            f"table of contents read: {len(toc_entries)} entries, "
            f"{len(toc_level)} matched to a body block"
        )
        if toc_promoted:
            state.anomalies.append(
                f"heading promoted on table-of-contents evidence "
                f"({len(toc_promoted)}): "
                + ", ".join(repr(t[:40]) for t in toc_promoted[:5])
                + (" ..." if len(toc_promoted) > 5 else "")
            )

    # A division's identifier, name and subtitle are printed as separate
    # paragraphs; they are one heading. See merge_heading_lines.
    toc_level, merged_headings = merge_heading_lines(blocks, lang, toc_level)
    # A label and its name printed inside ONE block, either run together
    # (`split_label_prefix`) or divided by the source's own line break
    # (`split_heading_break`).
    for blk in blocks:
        if blk.is_heading and not blk.label:
            split = split_heading_break(blk.html, blk.text, lang) or split_label_prefix(
                blk.text, lang
            )
            if split is not None:
                blk.label, blk.text = split
                # The label left `text`; it has to leave `title_html` too, or
                # the two get printed one after the other. See
                # strip_leading_text_html.
                blk.html = strip_leading_text_html(blk.html, blk.label)
    if merged_headings:
        state.anomalies.append(
            f"heading lines merged ({len(merged_headings)}): "
            + ", ".join(repr(t[:60]) for t in merged_headings[:5])
            + (" ..." if len(merged_headings) > 5 else "")
        )

    # Signature lines and the language navigation bar are bold and centered,
    # so they read as chapter titles. See drop_page_furniture.
    for text in drop_page_furniture(blocks):
        state.anomalies.append(f"page furniture skipped: {text[:80]!r}")

    # Tags outside the stored allowlist keep their text and lose their markup
    # (docs/decisions.md §Storage). Reported per run so the allowlist can be
    # revisited against evidence rather than assumption -- which is how `sup`
    # earned its place, and how `span[lang]` lost the one it was wrongly
    # given (all 486 instances were lang="pt" inside Portuguese pages).
    if dropped_tags:
        summary = ", ".join(f"{t}x{c}" for t, c in dropped_tags.most_common(8))
        state.anomalies.append(f"html tags outside allowlist, text kept: {summary}")

    # Depth key per heading, compacted to contiguous levels 1..N below.
    #
    # A LABEL beats appearance. Styling alone inverts Gaudium et Spes: it
    # wraps each CHAPTER in <center> but prints "PART I" as an ordinary
    # left-aligned bold paragraph, so a purely visual rank puts chapters
    # ABOVE parts -- the same inversion the old `kind` taxonomy produced,
    # arrived at from the other direction. Where the source names its own
    # divisions, that naming is the most direct statement of depth it
    # makes, so labelled headings sort by label and unlabelled ones sort
    # by appearance strictly beneath them (docs/decisions.md §Parsing).
    _LABEL_DEPTH = {"part": 1, "chapter": 2, "section": 3, "article": 4}
    # The shallowest division label the document actually prints. Gaudium et
    # Spes says PART, Dei Verbum's top division is CHAPTER; front and back
    # matter is a peer of whichever it is.
    labelled = [
        (i, _LABEL_DEPTH[matched[0]])
        for i, b in enumerate(blocks)
        if b.is_heading
        for matched in [match_label(b.label or b.text)]
        if matched is not None and matched[0] in _LABEL_DEPTH
    ]
    top_label_depth = min((d for _, d in labelled), default=_LABEL_DEPTH["part"])
    # FRONT and BACK matter, literally: outside the span of the document's
    # labelled divisions. A PROLOGUE among the chapters belongs to the chapter
    # it sits in -- Lumen Gentium PT's chapter VIII opens on `I. PROÉMIO`,
    # whose label `merge_heading_lines` moves into the `label` field, leaving
    # a bare 'PROÉMIO' the name test cannot tell from the document's own. Ranked
    # top-level it flattened that whole chapter's interior by a level.
    label_span = (labelled[0][0], labelled[-1][0]) if labelled else (len(blocks), -1)

    def is_labelled(b: Block) -> bool:
        return match_label(b.label or b.text) is not None

    def is_division(b: Block) -> bool:
        """A heading that NAMES a division, by label or by Roman numeral.

        `match_label` covers PART/CHAPTER/SECTION/ARTICLE in both languages.
        The Roman form is the same tier printed without the word -- Lumen
        Gentium PT's `I. PROÉMIO` inside chapter VIII, Ecclesiam Suam EN's
        `II. THE RENEWAL` -- and the parser has no other way to tell it from
        an ordinary heading that happens to be centred and bold."""
        text = b.label or b.text
        return (
            match_label(text) is not None or _ROMAN_DIVISION_RE.match(text) is not None
        )

    def depth_key(idx: int, b: Block) -> tuple[int, int]:
        # `label` first when the heading has one: after merge_heading_lines,
        # `text` is the division's NAME and the label that ranks it has moved
        # out of it.
        matched = match_label(b.label or b.text)
        if matched is not None and matched[0] in _LABEL_DEPTH:
            return (0, _LABEL_DEPTH[matched[0]])
        # Front and back matter is unlabelled but top-level: a PREFACE is a
        # peer of PART I, not something beneath its sections. Ranking it by
        # appearance alone buried it under SECTION in Gaudium et Spes.
        #
        # Peer of the top division THIS document has, not of "part"
        # unconditionally. Dei Verbum PT has no parts -- a PROÉMIO and six
        # CAPÍTULOs, which are peers -- and pinning the prologue at part depth
        # invented a tier above the chapters: every chapter came out at level
        # 2, and because a chapter's first sub-heading is levelled from the
        # chapter (the subtitle rule below), each one followed it down to 3
        # while its siblings stayed at 2. Twelve of that document's oracle
        # differences were those six pairs.
        # `strip_markers` because a heading can carry a footnote reference and
        # the block still holds it as a ⟦n⟧ token here -- push_heading strips
        # it, but that runs after this walk. Gaudium et Spes PT's `PROÉMIO(1)`
        # read as `PROEMIO⟦1⟧`, missed this set, and was ranked by style: level
        # 4, under the very divisions it introduces.
        if (
            fold(strip_markers(b.text)).strip(" .:;-") in _FRONT_BACK_MATTER
            and not (label_span[0] < idx < label_span[1])
            and b.style <= best_heading_style
        ):
            return (0, top_label_depth)
        return (1, b.style)

    # THE STYLE TEST IS WHAT KEEPS THE FRONT-MATTER PROMOTION HONEST.
    # Lifting a PREFACE to the top tier is right where the document prints it
    # AS the top tier -- Gaudium et Spes' PROÉMIO and Divini Redemptoris PT's
    # INTRODUÇÃO are both set in the best heading style their page uses, the
    # same one their parts and chapters get.
    #
    # It is wrong where the front matter is printed in a LESSER style than
    # something else on the page: `spe-salvi.en` sets "Introduction" in the
    # bold-italic of the eight headings it sits among, while the page's best
    # style belongs to the three centred `I./II./III.` settings nested inside
    # one of them. Promoting it there invented a tier above its own peers and
    # pushed every other heading in the document one level down. If two
    # headings look the same on the page they are the same level
    # (`docs/writing-descriptions.md` §3), and that holds whatever the first
    # one is called.
    body_end, _seen = len(blocks), 0
    for i, b in enumerate(blocks):
        if b.is_heading:
            continue
        pm = match_para_num(b.raw)
        if pm is not None and pm[0] > _seen:
            _seen, body_end = pm[0], i

    # A TIER OF ONE, NEXT TO A TIER OF MANY THAT LOOKS THE SAME, IS A
    # CITATION AND NOT A TIER.
    #
    # `heading_style_rank` counts a heading as italic when `<i>` appears
    # ANYWHERE in it, which cannot tell a heading SET in italics from one
    # that merely QUOTES something. Sollicitudo Rei Socialis EN prints eight
    # chapter headings in one identical style; the second names the encyclical
    # it re-reads, `II. ORIGINALITY OF THE ENCYCLICAL POPULORUM PROGRESSIO`,
    # and because the source italicises that title the heading ranked as a
    # tier of its own. The document came out levelled 1,2,1,2,2,2,2,2 -- a
    # staircase built out of a citation.
    #
    # Proportional coverage was tried first and rejected: it fixed this and
    # broke Pascendi EN, whose `<b>The Magisterium<i> of the Church</i></b>`
    # opens its italic run mid-line and so reads as barely italic while
    # genuinely belonging to that page's twelve-strong bold-italic tier. The
    # two markups are the same shape, so the discriminator cannot be the
    # markup -- it has to be the document. Here it is: a style held by ONE
    # heading, against a style held by several that differs only in the
    # italic bit and sits at the same centring, is the odd one out and joins
    # the many. Pascendi's italic tier has twelve members and is untouched.
    #
    # `docs/writing-descriptions.md` §3, stated the other way round: if two
    # headings look the same on the page, they are the same level.
    # INSIDE THE NUMBERED BODY ONLY. Back matter is ranked by its own branch
    # in `depth_key`, and restyling it here reaches that branch as a changed
    # `b.style`: merging Lumen Gentium EN's post-body `'NOTIFICATIONES'...`
    # block lifted it from level 2 to level 1, a heading the reader placed
    # under the note it introduces.
    _in_body = [b for i, b in enumerate(blocks) if b.is_heading and i < body_end]
    _style_counts = collections.Counter(b.style for b in _in_body)
    for _style, _count in list(_style_counts.items()):
        if _count > _ODD_TIER_MAX:
            continue
        _peer = _style ^ 1  # same centring, opposite italic bit
        if _style_counts.get(_peer, 0) < _MIN_STYLE_TIER:
            continue
        for _b in _in_body:
            if _b.style == _style:
                _b.style = _peer

    best_heading_style = min((b.style for b in blocks if b.is_heading), default=0)
    first_heading_style = next((b.style for b in blocks if b.is_heading), None)

    keys = sorted({depth_key(i, b) for i, b in enumerate(blocks) if b.is_heading})
    level_of = {k: i + 1 for i, k in enumerate(keys)}

    # Levels are assigned by walking the document, not by the global rank
    # alone. vatican.va's formatting is too loose for a per-heading rank to
    # produce a usable outline on its own.
    #
    # Rule 0, where it applies at all, is that the document's own linked
    # table of contents wins outright: it states the outline instead of
    # implying it, so once one is in play the styling rules below stop
    # (see extract_toc_outline). Three pages in the corpus have one. For
    # every other page the following apply in order:
    #
    #   1. A heading directly following another heading, with no section
    #      between, is that heading's SUBTITLE ("PART I" / "THE CHURCH AND
    #      MAN'S CALLING") and sits exactly one level under it.
    #   2. A style already seen keeps the level it was first given, so
    #      headings playing the same role stay siblings. Sacrosanctum
    #      Concilium otherwise put "Fim do Concílio" at h2 and its sibling
    #      "Aplicação aos diversos ritos" at h4.
    #   3. Otherwise take the global rank, but never descend more than one
    #      level at a time. Gaudium et Spes jumped h1 -> h4 because its
    #      "INTRODUCTORY STATEMENT" is unlabelled and bottom-ranked by
    #      styling alone.
    #
    # A final pass compacts whatever survives to contiguous 1..N, which is
    # what turns a document using h1/h2/h4 into one using h1/h2/h3.
    heading_level: dict[int, int] = {}
    assigned: dict[tuple[int, int], int] = {}
    prev_heading_idx: int | None = None
    prev_was_subtitle = False
    last_level: int | None = None
    toc_floor: int | None = None
    division_floor: int | None = None
    division_style = 9
    back_matter_style: int | None = None
    # The TOC floor governs the body only. A dateline or signature trailing
    # the last numbered paragraph is back matter, not a sub-section of
    # whatever the TOC listed last, and pushing it under one sends
    # magnifica-humanitas.pt's "Dado em Roma..." from h2 to h4.
    # The last block that could have OPENED a section, not merely the last one
    # carrying a number. Lumen Gentium PT's `NOTA EXPLICATIVA PRÉVIA` is an
    # appendix whose four points are printed `1.` .. `4.`; taking the last of
    # those put `body_end` past every heading in the back matter, so nothing
    # downstream could tell body from appendix. Numbers are accepted only
    # while they increase, which is the gate the section walker itself uses.
    for idx, blk in enumerate(blocks):
        if not blk.is_heading:
            if match_para_num(blk.raw):
                prev_heading_idx = None
                prev_was_subtitle = False
            continue
        key = depth_key(idx, blk)
        prelim = level_of.get(key, 1)
        if idx in toc_level:
            # The document said so. Taken verbatim, including where two
            # consecutive entries share a level: magnifica-humanitas prints
            # "CHAPTER ONE" and "A DYNAMIC APPROACH FAITHFUL TO THE GOSPEL"
            # as two bold TOC lines, and they are two headings at the same
            # depth over the same section, not a title and a subtitle one
            # level down. Rendering them as a pair is the site's business.
            # Clamped the same way the styling path is: a TOC entry with no
            # block to match it leaves a hole, and taking the next entry's
            # level literally would step over it. magnifica-humanitas.pt
            # lists "As res novae do nosso tempo" at 2 and its three
            # sub-headings at 3; if the 2 finds no block, the 3s must not
            # print as h3 directly under INTRODUCAO's h1.
            lvl = min(toc_level[idx], (last_level or 0) + 1)
            toc_floor = lvl
            prev_was_subtitle = True
        elif toc_floor is not None and idx < body_end:
            # A heading the TOC does not list sits UNDER the last one it
            # did. divini-redemptoris.pt lists only its seven parts, so its
            # ~50 unlisted headings are their sub-sections by construction.
            lvl = max(prelim, toc_floor + 1)
        elif key in assigned:
            # RULE 2, AND IT HAS TO COME BEFORE THE TWO BRANCHES BELOW.
            #
            # It was written down at the head of this walk from the start and
            # never reached: sitting under `elif prev_heading_idx is not None`
            # it could only fire for a heading with no heading before it,
            # which after the document's opening is never.
            #
            # What that cost is a STAIRCASE, in every document whose paragraph
            # numbers live IN its headings ("1. At the close of the second
            # Millennium"). There is then no numbered block between one
            # heading and the next to reset `prev_heading_idx`, so the whole
            # document is one unbroken run of headings, each ranked against the
            # one before it rather than against its own siblings. Redemptor
            # Hominis' four parts came out at levels 2, 3, 4, 5 -- identical
            # centred bold on the page, one tier deeper each time -- and
            # Laborem Exercens reached level 7. Titles and positions were right
            # in both; only the nesting was wrong, which is the signature of a
            # heading that never gets popped.
            #
            # Now a style that already has a level in this document keeps it,
            # which is `docs/writing-descriptions.md` §3 -- if two headings look
            # the same on the page they are the same level -- stated where the
            # walk can act on it. `depth_key`, not raw style, is what has to
            # match: Lumen Gentium PT's `CAPÍTULO VIII` and the `I. PROÉMIO`
            # nested inside it are set in the same centred bold but differ in
            # key, so that pair is untouched.
            lvl = assigned[key]
        elif (
            prev_heading_idx is not None
            and not prev_was_subtitle
            and (
                blk.style > blocks[prev_heading_idx].style
                or (is_labelled(blocks[prev_heading_idx]) and not is_labelled(blk))
                or (is_division(blk) and not is_division(blocks[prev_heading_idx]))
            )
        ):
            # A heading goes UNDER the one it follows when the source says so
            # -- by printing it smaller, or by having named the previous one a
            # division. Neither, and two headings over the same section are
            # two headings: Ecclesiam Suam EN prints 'The Two Vatican
            # Councils' and 'Leo XIII and Pius XII on the Church' as
            # consecutive `<p style="text-align: center;"><i>` blocks before
            # §31, and six pairs like it, all identical markup. Demoting the
            # second of each was six of that document's seven oracle
            # differences.
            #
            # The label half is not redundant with the style half: Lumen
            # Gentium PT prints 'CAPÍTULO VIII' and the 'I. PROÉMIO' that
            # opens it in exactly the same centred bold, so style alone reads
            # them as peers and flattens that chapter's whole interior.
            lvl = heading_level[prev_heading_idx] + 1
            prev_was_subtitle = True
        elif prev_heading_idx is not None:
            # A run of headings with no section between them is a title and
            # its subtitle, then siblings -- not a staircase. Chaining +1 per
            # heading sent Evangelium Vitae's chapter openings to h5.
            lvl = heading_level[prev_heading_idx]
        elif last_level is None:
            # Deliberately the styling rank, not 1. Anchoring the first
            # heading at h1 reads better for Laudato Si', whose introduction
            # carries four sub-headings and no heading of its own -- but it
            # pins Ad Petri Cathedram's deep-styled opening at h1, and the
            # same-style rule then flattens all 47 of its headings onto one
            # level, losing the I/II part tier entirely. Keeping the rank
            # costs a document-initial run of deep headings; forcing 1 costs
            # a whole tier. See docs/research/description-pass-2026-08.md.
            lvl = prelim
        else:
            lvl = min(prelim, last_level + 1)
        # A DIVISION owns what follows it. `assigned` caches a level per
        # heading style for the whole document, which is right while every
        # division has the same internal depth and wrong the moment one has
        # more: Lumen Gentium PT's chapter VIII alone is cut into `I. PROÉMIO`,
        # `II. A VIRGEM SANTÍSSIMA NA ECONOMIA DA SALVAÇÃO`, `III. ...`, and
        # its sub-headings are styled exactly like the sub-headings that sit
        # directly under a chapter everywhere else in the document. Cached by
        # style they came out as PEERS of the Roman divisions above them --
        # thirteen of that document's twenty oracle differences. A floor fixes
        # it without touching the cache: a heading the source prints SMALLER
        # than the division above it is at least one level below it.
        #
        # The style comparison is the whole guard. Humanae Vitae PT prints
        # `AS CARACTERÍSTICAS DO AMOR CONJUGAL` and Ecclesiam Suam EN prints
        # `THE ACT OF FAITH` in exactly the markup of the numbered divisions
        # they sit among -- `<p align="center"><b>` and
        # `<p style="text-align: center;">` respectively -- so they are peers
        # of those divisions however the numeral reads, and flooring them put
        # nine and ten headings a level too deep. Lumen Gentium's Marian
        # sub-headings are `<p align="left"><b><i>` under a centred bold
        # division, which is the case this exists for.
        if idx > body_end:
            # BACK MATTER. Everything after the last numbered paragraph is
            # appendix material -- Lumen Gentium PT's `PAPA PAULO VI`, the
            # notifications read to the Council, the `NOTA EXPLICATIVA
            # PRÉVIA`; the English edition prints an `APPENDIX` heading over
            # the same matter. It is not a subsection of whatever division
            # happened to come last, so the walk restarts here: the first such
            # heading returns to the top tier and the rest rank against it by
            # style, exactly as the body's own headings do.
            if back_matter_style is None:
                back_matter_style, lvl = blk.style, 1
            else:
                lvl = 1 if blk.style <= back_matter_style else 2
            assigned.setdefault(key, lvl)
            heading_level[idx] = lvl
            prev_heading_idx = idx
            last_level = lvl
            continue
        if is_division(blk):
            division_floor, division_style = lvl, blk.style
        elif (
            division_floor is not None
            and idx < body_end
            and blk.style > division_style
            and blk.style != first_heading_style
        ):
            lvl = max(lvl, division_floor + 1)
        assigned.setdefault(key, lvl)
        heading_level[idx] = lvl
        prev_heading_idx = idx
        last_level = lvl

    # A PROMOTED FRONT/BACK-MATTER HEADING MAY NOT OUTRANK ITS OWN TWINS.
    #
    # `depth_key` lifts a CONCLUSION or PROÉMIO to the tier of the document's
    # labelled divisions, which is right where the page prints it as that tier
    # (Gaudium et Spes' PROÉMIO beside its PARTE I). But the key it returns
    # outranks EVERY style key, so in a document whose divisions are unlabelled
    # the promotion does not join a tier -- it invents one above the whole
    # document, and the closing heading comes out alone at level 1 with its
    # five identically-printed siblings at 2.
    #
    # `aeterna-dei.en` is the clean case: six divisions in byte-identical
    # `<p align="CENTER">`, no bold, no italic, none of them saying CHAPTER,
    # and CONCLUSION alone lifted. `mater.en` does it across five,
    # `orientalium-ecclesiarum.en` across eight. The audit reported each as
    # "most headings parsed +1 level(s)" with the closing heading the lone
    # outlier -- the signature of a phantom tier rather than a real one.
    #
    # The repair is stated as the constraint it is, and NOT as a guard on the
    # promotion itself: withholding the key entirely collapses a tier in
    # `divini-redemptoris.pt`, whose INTRODUÇÃO, seven parts and their
    # sub-headings need three levels out of two styles and get the third from
    # exactly this key. Here the promotion still happens; it is only stopped
    # from rising ABOVE headings the page sets in the same style, which is
    # `docs/writing-descriptions.md` §3 read as a post-condition -- if two
    # headings look the same on the page they are the same level.
    #
    # AND ONLY WHERE THE DOCUMENT LABELS NOTHING. A page that does say PART or
    # CHAPTER has a real top tier for the promotion to join, and there the
    # front matter is SUPPOSED to outrank its same-styled twins: Gaudium et
    # Spes EN sets PREFACE in the style of its chapters and means it as the
    # peer of PARTE I, so pulling it down to the chapters cost that document
    # two headings before this guard was added.
    def _is_matter(b: Block) -> bool:
        return fold(strip_markers(b.text)).strip(" .:;-") in _FRONT_BACK_MATTER

    for i in list(heading_level) if not labelled else []:
        if not _is_matter(blocks[i]):
            continue
        twins = [
            heading_level[j]
            for j in heading_level
            if j != i
            and blocks[j].style == blocks[i].style
            and not _is_matter(blocks[j])
        ]
        if twins:
            heading_level[i] = max(heading_level[i], min(twins))

    used = sorted(set(heading_level.values()))
    compact = {lvl: i + 1 for i, lvl in enumerate(used)}
    heading_level = {k: compact[v] for k, v in heading_level.items()}

    numbered_titles = numbering_is_in_headings(blocks)

    i, n = 0, len(blocks)
    while i < n:
        b = blocks[i]
        if b.is_heading:
            # `label` first: a merged heading keeps its label in that field
            # and its name in `text` (see merge_heading_lines).
            matched = match_label(b.label or b.text)
            if matched is not None:
                kind, num = matched
                state.push_heading(
                    kind,
                    num,
                    b.text,
                    heading_level.get(i, 1),
                    label=b.label,
                    subtitle=b.subtitle,
                    title_html=heading_inner_html(b.html),
                )
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
                if numbered_titles and (
                    state.last_n is None or cand_title == state.last_n + 1
                ):
                    # The heading is a HEADING, not the section's opening
                    # words. Folding its title into the first prose block
                    # (what this branch did originally) both left the
                    # narrowed html unbalanced -- `strip_leading_number_html`
                    # takes off the opening `<i><b>` with the number and
                    # leaves the matching `</b></i>` behind -- and made EN
                    # §1 open on "The Meaning of the Universal Right to an
                    # Education All men of every race..." where its own PT
                    # sibling opens on "Todos os homens...". PT prints these
                    # same 12 titles as ordinary heading blocks, so treating
                    # them as headings here is what makes the two editions
                    # agree rather than a convention invented for EN.
                    if state.pending_section_n is not None:
                        state.anomalies.append(
                            f"section {state.pending_section_n} read off a "
                            f"'N. Title' heading never reached prose before "
                            f"section {cand_title}'s heading"
                        )
                    state.push_heading(
                        "sub",
                        None,
                        b.text[title_m.end() :],
                        heading_level.get(i, 1),
                        label=b.label,
                        subtitle=b.subtitle,
                        title_html=heading_inner_html(
                            strip_leading_number_html(b.html)
                        ),
                    )
                    state.pending_section_n = cand_title
                    state.last_n = cand_title
                    i += 1
                    continue
            # body_html is already trimmed to real content (see
            # find_content_start_old_shell / the "testo" div boundary),
            # so any bold block reaching here is legitimate document
            # structure (INTRODUCTION, CONCLUSION, a document's own
            # title) -- not front-matter chrome, so no content_started
            # gate: an unrecognized heading appearing before section 1
            # (e.g. INTRODUCTION) must still become a node.
            state.push_heading(
                "sub",
                None,
                b.text,
                heading_level.get(i, 1),
                label=b.label,
                subtitle=b.subtitle,
                title_html=heading_inner_html(b.html),
            )
            i += 1
            continue

        if state.pending_section_n is not None:
            # The prose under a "N. Title" heading. It carries no number of
            # its own, so it would otherwise fall through to the unnumbered
            # path and be swallowed as orphan content.
            state.finalize_open_section()
            state.start_section(state.pending_section_n, b.kind, b.text, b.html)
            state.pending_section_n = None
            state.pending_first_block = None
            state.pending_first_html = None
            i += 1
            continue

        pm = match_para_num(b.raw)
        cand = pm[0] if pm else None
        is_new = False
        rest_text = b.text
        fills_gap_at: int | None = (
            None  # set when a size-1 gap can be closed by pending_first_block
        )
        if cand is not None:
            if state.last_n is None or cand == state.last_n + 1:
                is_new = True
            elif cand > state.last_n + 1:
                is_new = True
                if cand == state.last_n + 2 and state.pending_first_block is not None:
                    fills_gap_at = state.last_n + 1
                else:
                    state.record_gap(state.last_n, cand)
            elif state.last_n is not None and looks_like_number_typo(
                cand, state.last_n + 1
            ):
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
                entry = find_paragraph_number_correction(
                    state.corrections, expected, cand
                )
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
                _, rest_text, rest_html = mark_and_split(b.raw, marker_template)

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
                state.start_section(
                    fills_gap_at,
                    "prose",
                    blocks=state.take_buffered_blocks()
                    or [
                        BlockOut(
                            "prose",
                            state.pending_first_block,
                            state.pending_first_html or "",
                        )
                    ],
                    claim=state.pending_before_buffer,
                )
                state.finalize_open_section()
                state.last_n = fills_gap_at
                state.promoted_gap_fills.append(fills_gap_at)
                if state.orphan_content and state.orphan_content[-1].endswith(
                    state.pending_first_block[:90]
                ):
                    state.orphan_content.pop()
                state.anomalies.append(
                    f"section {fills_gap_at}: source prints no leading number at all "
                    f"(unnumbered text between the surrounding sections) -- promoted "
                    f"the preceding block to section {fills_gap_at}"
                )
            elif (
                state.last_n is None
                and cand == 2
                and state.pending_first_block is not None
            ):
                state.start_section(
                    1,
                    "prose",
                    blocks=state.take_buffered_blocks()
                    or [
                        BlockOut(
                            "prose",
                            state.pending_first_block,
                            state.pending_first_html or "",
                        )
                    ],
                    claim=state.pending_before_buffer,
                )
                state.finalize_open_section()
                state.last_n = 1
                state.promoted_first_paragraph = True
                state.anomalies.append(
                    "section 1: source prints no leading number (unnumbered framing "
                    "text before '2.') -- promoted the preceding block to section 1"
                )
            state.start_section(cand, b.kind, rest_text, rest_html)
            state.last_n = cand
            state.pending_first_block = None
            state.pending_first_html = None
        elif state.open_section is None:
            if b.kind == "prose" and is_mini_header(b.text):
                state.dropped.append(b.text)
            else:
                if b.kind == "prose":
                    # ACCUMULATE, do not overwrite. A document with no explicit
                    # "1." promotes this into section 1 when it reaches "2.",
                    # and it used to hold only the LAST unnumbered block seen --
                    # so a page opening with a salutation and then its real
                    # first paragraph kept the paragraph and dropped the
                    # salutation, or worse. `singulari-quadam.en` lost its
                    # 1,747-character opening paragraph that way, keeping only
                    # "Beloved Son and Venerable Brethren, Health and the
                    # Apostolic Blessing."; `mortalium-animos.en` lost its
                    # salutation. Joining matches how `add_continuation`
                    # already treats consecutive prose inside a section.
                    if state.pending_first_block is None:
                        state.pending_before_buffer = len(state.pending_headings)
                        state.pending_first_block = b.text
                        state.pending_first_html = b.html
                    else:
                        state.pending_first_block += " " + b.text
                        state.pending_first_html = (
                            f"{state.pending_first_html} {b.html}".strip()
                            if b.html
                            else state.pending_first_html
                        )
                state.add_appendix_block(b.kind, b.text, b.html)
                where = state.stack[-1].title if state.stack else "?"
                state.orphan_content.append(f"[{where}] {b.text[:90]}")
        elif b.kind == "prose" and is_mini_header(b.text):
            state.dropped.append(b.text)
        else:
            state.add_continuation(b.kind, b.text, b.html)
        i += 1
    state.finalize_open_section()

    # Whatever is still buffered never had a numbered paragraph after it, so
    # it is the document's appendix. Citations resolve through the same
    # Section machinery the body uses -- these blocks carry footnote markers
    # like any other (Lumen Gentium's Nota Explicativa Praevia has four).
    appendix_out = []
    for unit in state.appendix:
        if not unit["blocks"]:
            continue
        holder = Section(n=None, chapter=None)
        holder.blocks = unit["blocks"]
        holder.resolve(
            state.current_footnote_table,
            state.current_chapter_footnote_table,
            state.current_star_table,
            state.anomalies,
        )
        entry = holder.to_dict()
        entry.pop("n", None)
        if unit["title"]:
            entry = {"title": unit["title"], **entry}
        appendix_out.append(entry)
    state.appendix_out = appendix_out

    # THE STUB TEST, ASKED PROPERLY. `STUB_CONTENT_MIN_CHARS` above guesses
    # from the size of the raw region, before the language bar and the
    # masthead have been told apart from the document; this asks the same
    # question of the result, where the answer is not a guess -- a page that
    # yielded no numbered section and no unnumbered unit carried no document,
    # whatever its region measured.
    #
    # Zero sections alone is NOT the test, and must not become it: an edition
    # that prints no paragraph numbers is a real document whose whole text is
    # in `appendix.json` (Pascendi PT, Quadragesimo Anno PT, Vigilanti Cura
    # EN). Both halves have to be empty.
    if not state.sections and not any(u["blocks"] for u in state.appendix):
        raise StubPageError(
            "parsed to no sections and no unnumbered content -- the page "
            "carries a masthead and no document (the text is published "
            "elsewhere, typically as a PDF), not a parse this scraper lost"
        )

    return ParseResult(
        state=state,
        marker_template=marker_template,
        shell=shell,
        footnote_evidence=evidence,
        fetched_url=fetched_url,
        retrieved_at=datetime.now(UTC).strftime("%Y-%m-%d"),
        header=header_html,
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
    """Whether any heading in the finalized structure.json anchors to a real
    section. validate_document checks the artifact about to be written, not
    an intermediate representation, so this stays honest even if
    build_structure's fallback logic is ever changed incorrectly.

    The structure is a flat, document-ordered list since 2026-08-21
    (docs/decisions.md), so this no longer recurses -- a heading's `before`
    is its anchor, and nesting is derived by consumers from `level`."""
    return any(node.get("before") is not None for node in nodes)


def validate_document(
    slug: str, state: ScrapeState, structure: list[dict]
) -> tuple[bool, list[str]]:
    problems: list[str] = []
    sections = state.sections
    if not sections:
        if state.appendix_out:
            # An UNNUMBERED EDITION, not a defeat. Eight editions in this
            # corpus print no paragraph number anywhere on the page -- the
            # Portuguese Pascendi, Quadragesimo Anno and Divini Illius
            # Magistri, both editions of Miranda Prorsus, the English
            # Vigilanti Cura, the Portuguese Mense Maio, the English Quae Ad
            # Nos -- and their whole text is stored under the headings the
            # source does print. There is nothing to number and nothing was
            # lost; what such a work does not have is a citable address, which
            # is a property of the edition rather than a fault in the parse.
            return True, []
        return False, ["no sections captured at all"]
    numbers = sorted(sections)
    lo, hi = numbers[0], numbers[-1]
    missing = [n for n in range(lo, hi + 1) if n not in sections]
    if missing:
        problems.append(
            f"gaps in {lo}..{hi}: missing {missing[:20]}{'...' if len(missing) > 20 else ''}"
        )
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

    # THE ROUND-TRIP INVARIANT, checked rather than asserted. `text_marked`
    # and `html` are two derivations of the same source string by two
    # independent code paths (`strip_tags` and `narrow_html`), so their
    # disagreeing means one of them is wrong -- which is the whole reason
    # the corpus stores both.
    #
    # It had been stated in five comments across this file and enforced in
    # none of them: the only thing that ever ran it was an ad-hoc script
    # somebody remembered to write. That is a check in name only, and it
    # matters more now that `strip_tags` distinguishes emphasis from
    # separators (see its docstring) -- the two paths have to agree about
    # every tag, and nothing but this would notice if they stopped.
    # Compared with the ⟦n⟧ tokens removed on BOTH sides: `html_to_text`
    # drops the `<sup data-fn>` marker elements (leaving no space, see
    # there), while `text_marked` keeps the tokens. Stripping them here is
    # what makes the two comparable -- and matches `Section.resolve`, which
    # derives the section's `text` by removing them with "" the same way.
    for n, sec in sorted(sections.items()):
        for i, block in enumerate(sec.blocks):
            if not block.html:
                continue
            expected = re.sub(rf"{MARK_OPEN}[0-9A-Za-z*]+{MARK_CLOSE}", "", block.text)
            expected = re.sub(r"\s+", " ", expected).strip()
            actual = html_to_text(block.html)
            if actual != expected:
                problems.append(
                    f"section {n} block {i}: html/text round-trip mismatch\n"
                    f"      text: {expected[:140]!r}\n"
                    f"      html: {actual[:140]!r}"
                )

    for n, sec in sorted(sections.items()):
        for block in sec.blocks:
            if "<" in block.text or ">" in block.text:
                problems.append(f"section {n}: leftover markup in block text")
            if "�" in block.text:
                problems.append(f"section {n}: replacement character present")
            for pat in _MOJIBAKE_PATTERNS:
                if pat in block.text:
                    problems.append(f"section {n}: mojibake pattern {pat!r}")
        tokens = re.findall(
            rf"{MARK_OPEN}([0-9A-Za-z*]+){MARK_CLOSE}",
            " ".join(b.text for b in sec.blocks),
        )
        markers = [c["marker"] for c in sec.citations]
        if set(tokens) != set(markers) or len(markers) != len(set(markers)):
            problems.append(
                f"section {n}: token/citation mismatch {tokens} vs {markers}"
            )
        empty_citations = [c["marker"] for c in sec.citations if not c["text"]]
        if empty_citations:
            problems.append(
                f"section {n}: citations with no resolved text: {empty_citations}"
            )

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
    if len(state.orphan_content) >= 10 and len(state.orphan_content) > 5 * max(
        len(sections), 1
    ):
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
    # vatii.gravissimum-educationis.en's former entry here ("needs a
    # section-title-aware pass this parser does not yet have") is obsolete:
    # that pass exists -- see _SECTION_TITLE_HEADING_RE and the heading
    # branch in parse_document -- and the document now parses to the same 12
    # sections its PT sibling has, with the 12 titles as heading nodes on
    # both sides. Removed rather than left to keep a fixed document withheld.
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
        'TOC-style subheadings (`<p><b><a name="The_Influence_of_the_Motion_Picture"></a>The '
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
        "NOT a parser gap and not fixable by better parsing -- and no longer a PARTIAL failure "
        "either, which is a correction to this entry rather than a change in the source. It "
        "read 'captured only 4 of what should be a much longer sequence ... paragraph numbering "
        "is sparse/inconsistent rather than absent outright'. That was wrong about the page. "
        "The four are not sparse paragraph numbers: they are the encyclical's four PARTS -- "
        "'1. GENERAL INSTRUCTION', '2. MOTION PICTURES', '3. RADIO', '4. TELEVISION' -- printed "
        "as centered bold headings, with fifteen further unnumbered headings ('PUBLICISING "
        "CHRISTIAN DOCTRINE', 'THE \"GOOD SEED\"', ...) between the first and the second alone. "
        "Read as section numbers they produced four ~18,000-character 'paragraphs' and left 139 "
        "blocks orphaned, which is what the orphan-ratio guard was reporting. This page (Pius "
        "XII 1957, ~74K chars of real prose) numbers no paragraph anywhere; footnotes use the "
        "standard `_ftnrefN` convention and would resolve fine. numbering_is_in_headings now "
        "declines the four, so the parse is honestly empty instead of falsely divided. No "
        "number to recover from either edition -- its PT sibling is unnumbered too."
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
        "NOT a parser gap and not fixable by better parsing. This entry used to say only "
        "sections 1-5 were captured and that 'whatever breaks numbering resumption after "
        "section 5 here is a genuinely different, not-yet-characterized shape'. It is now "
        "characterized, and there was no resumption to break: this page (Pius XI 1931, the "
        "Rerum Novarum 40th-anniversary encyclical, 104K chars) numbers no paragraph at all. "
        "Its bold numbers belong to a per-part outline that begins again in each part -- "
        "1, 2, 3 / 1, 3, 4, 5 / 1, 2, 3 ('1. - ACÇÃO DA IGREJA', '2. - ACÇÃO DA AUTORIDADE "
        "CIVIL', ... then '1. - DO DIREITO DE PROPRIEDADE') -- and the five 'sections' were "
        "the parser reading the first three and a later 4, 5 as a section sequence, which is "
        "why 133 blocks landed in the orphan bucket against an EN sibling running to 148. "
        "numbering_is_in_headings now rejects a restarting run, so the parse is honestly empty "
        "rather than fabricating five addresses. Every number-like token in the body text is a "
        "footnote marker, printed '( 9 )'. No number to recover; inventing one would be "
        "fabrication."
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
        'rather than hiding it. Not fabricated: promoting the anchor\'s bare name="206" to a '
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
        (
            f"page shell: {parse.shell}; footnote-marker template: "
            f"{parse.marker_template}; footnote-region boundary evidence: "
            f"{parse.footnote_evidence}."
        ),
        (
            "Inline markup is stored per block in `html`, restricted to a closed "
            "allowlist (i, b, br, sup, blockquote); tags outside it keep their text "
            "and lose their markup (docs/decisions.md §Storage)."
        ),
    ]
    if not state.sections and state.appendix_out:
        notes.insert(
            0,
            "UNNUMBERED EDITION -- this edition prints no paragraph number "
            "anywhere on the page, so it has no citable section address. Its "
            "text is not missing: it is stored in appendix.json under the "
            "headings the source does print, in document order. "
            + PARSER_DEFEAT_NOTES.get(work_id, ""),
        )
    elif not state.sections:
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
    if state.reclaimed:
        notes.append(
            f"{state.reclaimed} unnumbered block(s) printed under a mid-body heading "
            "returned to the section that heading interrupted (see "
            "reclaim_mid_body_prose); they were dropped outright before 2026-08-24."
        )
    if state.orphan_content:
        notes.append(
            f"{len(state.orphan_content)} unnumbered content blocks not attached to any section (logged, not fabricated)."
        )
    if state.anomalies:
        notes.append(
            f"{len(state.anomalies)} anomalies recorded; see corrections-applied.json / run log."
        )
    if work_id in KNOWN_SOURCE_DEFECTS:
        notes.append(KNOWN_SOURCE_DEFECTS[work_id])
    return {
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
        # The document's own printed masthead, as narrowed html. Real content
        # the page shows above its first heading, kept out of the structure
        # tree where it used to masquerade as a top-level node. See
        # extract_document_header.
        "header": parse.header,
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "corrections_applied": len(state.corrections_applied),
    }


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

    def walk(nodes: list[Node]):
        for nd in nodes:
            yield nd
            yield from walk(nd.children)

    flat = []
    for nd in walk(state.root_children):
        row = {"level": nd.depth, "title": nd.title, "before": nd.before}
        # Optional and omitted when absent, so the common one-line heading
        # stays a three-key object (docs/corpus-schema.md).
        if nd.label:
            row["label"] = nd.label
        if nd.subtitle:
            row["subtitle"] = nd.subtitle
        if nd.title_html:
            row["title_html"] = nd.title_html
        flat.append(row)
    if state.sections and not any(r["before"] is not None for r in flat):
        return [{"level": 1, "title": title, "before": min(state.sections)}]
    return flat


def write_document_outputs(
    work_id: str,
    manifest: dict,
    state: ScrapeState,
    structure: list[dict],
    sections: list[dict],
    overrides_applied: list[dict],
) -> None:
    out_dir = WORKS_ROOT / work_id
    out_dir.mkdir(parents=True, exist_ok=True)
    # build_manifest constructs a fresh dict every call, with no knowledge
    # of what was already on disk -- fine for every field it owns, but
    # `translations` (docs/corpus-schema.md #Documents) is recorded by a
    # SEPARATE post-hoc reconciliation pass, not by this scrape itself.
    #
    # It comes from `pipeline/translations-checked.json` FIRST, and off the
    # manifest already on disk only as a fallback. That order is the fix for
    # 2026-08-27: reading the previous output was the ONLY way the field
    # survived, so it protected a --overwrite re-parse (which is what it was
    # written for) and not a rebuild into an empty `works/`, which dropped
    # all 125 records. Now that `works/` is untracked and a rebuild is the
    # supported way to get a corpus, the ledger is the record and the
    # carry-forward is the belt-and-braces -- see common/translations.py.
    raw_manifest = read_text_or_none(out_dir / "manifest.json")
    try:
        existing = json.loads(raw_manifest) if raw_manifest else None
    except json.JSONDecodeError:
        existing = None
    if "translations" not in manifest:
        recorded = TRANSLATIONS_CHECKED.get(work_id)
        if recorded:
            manifest["translations"] = recorded
        elif existing and "translations" in existing:
            manifest["translations"] = existing["translations"]

    files: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": structure,
        "sections.json": sections,
        "corrections-applied.json": corrections_receipt(
            work_id,
            state.corrections_applied,
            state.corrections,
            manifest["generated_at"],
        ),
    }
    # Written only where there is one. A document with no matter after its
    # last numbered paragraph -- the great majority -- gets no file, so the
    # file's presence is itself the answer to "does this work have an
    # appendix", and a stale one from an earlier parse cannot survive.
    appendix_path = out_dir / "appendix.json"
    if state.appendix_out:
        files["appendix.json"] = state.appendix_out
    elif appendix_path.exists():
        appendix_path.unlink()
    # Written only when there are overrides, so the file's presence is itself
    # the signal that this work needed hand-holding -- `ls corpus/works/*/
    # overrides-applied.json` is the census of where the parser gave up.
    if overrides_applied:
        files["overrides-applied.json"] = {
            "work_id": work_id,
            "generated_at": manifest["generated_at"],
            "applied": overrides_applied,
            "count": len(overrides_applied),
        }
    write_stamped_json(
        out_dir,
        files,
        manifest["generated_at"],
        remove=() if overrides_applied else ("overrides-applied.json",),
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


# --------------------------------------------------------------------------
# Per-document work, split on the one line that matters: the network.
#
# `scrape_one` used to be a single function running fetch-then-parse. It is
# now the serial composition of two halves that can be driven separately,
# because they have opposite constraints:
#
#   fetch_for_parse -- touches vatican.va. Must stay strictly serial, one
#     request at a time, behind `_sleep_for_crawl_delay`. robots.txt asks for
#     a 2s Crawl-delay and docs/decisions.md treats that as a commitment about
#     someone else's server, not a tuning parameter. Nothing here may ever run
#     concurrently.
#
#   parse_and_write -- touches nobody's server. Pure CPU over bytes already in
#     hand, plus a write to `works/{work_id}/`, a directory no other document
#     shares. Safe to run in a worker process, and worth it: with the absent
#     ledger in place a re-parse makes zero requests, so the run became
#     CPU-bound for the first time -- 6.25s pinned to ONE core with 15 idle,
#     61% of it inside re.Pattern.sub under strip_tags/narrow_html.
#
# The distinction is between concurrent REQUESTS, which are forbidden here,
# and concurrent WORK, which was simply being left on the floor.
# --------------------------------------------------------------------------


def _result_base(ref: DocRef, lang: str, url: str | None) -> dict:
    """The progress/reporting skeleton both halves fill in."""
    return {
        "family": ref.family,
        "slug": ref.slug,
        "lang": lang,
        "status": None,
        "url": url,
    }


def fetch_for_parse(
    fetcher: Fetcher, ref: DocRef, lang: str, overwrite: bool
) -> tuple[dict | None, str | None]:
    """The serial half: everything up to and including the network.

    Returns `(result, None)` when the document is already finished -- no URL,
    already written, or the fetch failed -- and `(None, html)` when there is a
    page to hand to `parse_and_write`. Exactly one of the two is not None."""
    url = ref.lang_urls.get(url_lang_key(ref, lang))
    result = _result_base(ref, lang, url)
    if url is None:
        result["status"] = "no-url"
        return result, None
    work_id = f"{ref.family}.{ref.slug}.{lang}"
    out_dir = WORKS_ROOT / work_id
    if (out_dir / "sections.json").exists() and not overwrite:
        result["status"] = "already-written"
        return result, None

    html, err = fetcher.fetch_text(url, cache_name_for(ref, lang))
    if html is None:
        result["status"] = "fetch-failed"
        result["error"] = err
        return result, None
    return None, html


def cache_page(fetcher: Fetcher, ref: DocRef, lang: str) -> dict:
    """Put this document's page for `lang` in corpus/raw/, and stop there.

    The serial half of `fetch_for_parse` without the half that decides
    anything. It exists because acquiring raw pages and deciding what the
    corpus publishes are separate decisions on separate timescales: raw/ is
    write-once and the only artifact that costs real fetches, while works/ is
    regenerable from it in minutes with no network at all
    (`docs/link-surface.md`). Crawling a language ahead of the parser, the
    site's plumbing, or anyone's decision to publish it is therefore cheap and
    reversible; writing a work directory for it is neither, and an agent that
    conflates the two has been the way unwanted works got made.

    Deliberately does NOT consult works/. `fetch_for_parse` short-circuits on
    an already-written document because re-parsing it is the caller's whole
    question; here the question is only whether the bytes are on disk, and a
    written work whose raw page went missing is exactly the case worth
    re-asking for."""
    url = ref.lang_urls.get(url_lang_key(ref, lang))
    result = _result_base(ref, lang, url)
    if url is None:
        result["status"] = "no-url"
        return result
    before = fetcher.network_fetches
    html, err = fetcher.fetch_text(url, cache_name_for(ref, lang))
    if html is None:
        # A translation that does not exist is the expected answer for most
        # (language, document) pairs, and the absent ledger has already
        # recorded it. Reported, never raised.
        result["status"] = "fetch-failed"
        result["error"] = err
        return result
    result["status"] = "fetched" if fetcher.network_fetches > before else "cached"
    result["bytes"] = len(html)
    return result


def parse_and_write(ref: DocRef, lang: str, title_hint: str, html: str) -> dict:
    """The parallel half: everything after the bytes are in hand.

    RUNS IN A WORKER PROCESS, so it has to be a pure function of its arguments
    plus read-only files, and it is. Its inputs are the page text and a
    `DocRef` of plain strings; the files it reads are this document's own
    `pipeline/corrections/{work_id}.json` and `pipeline/overrides/{work_id}.json`;
    the only thing it writes is `works/{work_id}/`, which belongs to this
    document alone. No shared mutable state, so a parallel run and a serial
    one produce the same bytes -- checked by diffing the whole `works/` tree
    between `--jobs 1` and `--jobs 16`.

    Keeps `scrape_one`'s contract of not raising for a parse defeat: a crash
    on one document is reported as `parse-error`, never allowed to kill a
    crawl of many."""
    url = ref.lang_urls.get(url_lang_key(ref, lang))
    result = _result_base(ref, lang, url)
    work_id = f"{ref.family}.{ref.slug}.{lang}"

    corrections = load_corrections(work_id)
    pre_applied: list[dict] = []
    pre_seen: set[str] = set()
    html = apply_raw_text_corrections(html, corrections, pre_applied, pre_seen)
    try:
        parse = parse_document(
            html, lang, corrections, url, ref.slug, ref.pontiff_or_council
        )
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
    except Exception as exc:
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
    missing = [
        c["id"]
        for c in corrections
        if not c.get("resolution") and c["id"] not in parse.state.corrections_seen
    ]
    if missing:
        result["status"] = "corrections-drift"
        result["error"] = f"correction entries never matched during parse: {missing}"
        return result

    title = title_hint or ref.slug.replace("-", " ").title()
    structure = build_structure(parse.state, title)

    # Post-parse overrides. Applied before `validate_document`, which reads
    # the structure list this mutates -- so a structure override IS judged by
    # validation, while a section override is not (validation reads
    # `parse.state`, which overrides deliberately do not touch: the state is
    # the parse, and rewriting it would erase the distinction between what
    # the parser produced and what we overrode). Drift gets its own status
    # for the same reason corrections drift does -- `scrape_one` must not
    # raise and kill a crawl of many, but an override that stopped matching
    # cannot pass silently. See common.apply_overrides.
    sections_out = [
        parse.state.sections[n].to_dict() for n in sorted(parse.state.sections)
    ]
    overrides = load_overrides(work_id)
    try:
        overrides_applied = apply_overrides(work_id, structure, sections_out, overrides)
    except OverrideDriftError as exc:
        result["status"] = "overrides-drift"
        result["error"] = str(exc)
        return result
    if overrides_applied:
        parse.state.anomalies.append(
            f"post-parse overrides applied ({len(overrides_applied)}): "
            + ", ".join(a["id"] for a in overrides_applied[:5])
            + (" ..." if len(overrides_applied) > 5 else "")
        )

    ok, problems = validate_document(ref.slug, parse.state, structure)
    promulgated = parse_promulgation_date(ref.date_digits)
    manifest = build_manifest(
        work_id,
        ref.document_kind,
        title,
        lang,
        ref.pontiff_or_council,
        promulgated,
        url,
        parse.retrieved_at,
        parse.state,
        parse,
    )
    write_document_outputs(
        work_id, manifest, parse.state, structure, sections_out, overrides_applied
    )

    result["status"] = "validated" if ok else "validation-failed"
    result["problems"] = problems
    result["sections"] = len(parse.state.sections)
    # Carried so `check_language_symmetry` can answer from memory for the
    # documents this run parsed, instead of re-reading their sections.json
    # off disk seconds after writing it -- 14.4 MB per full run.
    result["section_numbers"] = sorted(parse.state.sections)
    result["range"] = (
        (min(parse.state.sections), max(parse.state.sections))
        if parse.state.sections
        else None
    )
    result["shell"] = parse.shell
    result["marker_template"] = parse.marker_template
    return result


def _pool_context():
    """The multiprocessing start method for the parse pool: `fork`.

    NOT THE DEFAULT, and deliberately so. Python 3.14 made `forkserver` the
    default on Linux because `fork` is unsafe in a process that has threads;
    this scraper has none -- it is one synchronous loop from `main()` down --
    so the hazard the new default guards against does not exist here, and
    `fork` is the better fit for what the workers need. They inherit an
    already-imported module and its compiled regexes copy-on-write, instead of
    re-importing a 4,900-line file (and re-resolving `corpus_dir()` from the
    environment) once per worker.

    Falls back to the platform default if `fork` is unavailable, so the pool
    degrades rather than failing on a platform that has no fork."""
    try:
        return multiprocessing.get_context("fork")
    except ValueError:
        return multiprocessing.get_context()


def default_jobs() -> int:
    """How many parse workers to use when `--jobs` is not given.

    `process_cpu_count()` rather than `cpu_count()` because it honours CPU
    affinity, which is what a cgroup or a `taskset` actually grants us; the
    machine's core count is not ours to assume. Capped at 16 because the
    parent still has to fetch, and past that the pickling of page text costs
    more than the parse it buys."""
    n = getattr(os, "process_cpu_count", os.cpu_count)() or 1
    return max(1, min(n, 16))


class _Done:
    """A job that was finished without a worker, for the inline path.

    Gives `OrderedParsePool.collect` one shape to call `.result()` on whether
    a job ran in a pool, ran inline under `--jobs 1`, or never needed to run
    at all (a document `fetch_for_parse` already settled as `no-url`,
    `already-written` or `fetch-failed`)."""

    __slots__ = ("_value",)

    def __init__(self, value: dict):
        self._value = value

    def result(self) -> dict:
        return self._value


class OrderedParsePool:
    """Fan parse jobs out to worker processes; report results IN ORDER.

    IN ORDER because the per-document progress lines are how a long crawl is
    followed, and an as-completed ordering would shuffle them differently on
    every run for nothing -- the work is already overlapped, only the printing
    waits. It also keeps the returned `results` list, and so the run summary
    and every problem report built from it, identical to a serial run's.

    BOUNDED because during a re-parse the parent submits far faster than the
    workers drain (a cached fetch is a disk read), and an unbounded queue would
    hold every document's HTML in memory at once. `collect()` blocks on the
    oldest job once more than `lookahead` are outstanding.

    `workers <= 1` runs every job inline, with no pool and no pickling, so
    `--jobs 1` is a genuinely serial run rather than a one-worker pool. That is
    the configuration to reach for when a parser crash needs a real traceback,
    and the baseline to diff against when checking that parallel output matches
    serial."""

    def __init__(self, workers: int):
        self.workers = max(1, workers)
        self._ex = (
            ProcessPoolExecutor(max_workers=self.workers, mp_context=_pool_context())
            if self.workers > 1
            else None
        )
        self._pending: collections.deque = collections.deque()
        # Four jobs per worker: deep enough that no worker idles waiting for
        # the parent to come back from a 2s crawl delay, shallow enough that
        # in-flight HTML stays a few MB rather than the whole corpus.
        self._lookahead = self.workers * 4

    def submit(self, tag, fn, *args) -> None:
        if self._ex is None:
            self._pending.append((tag, _Done(fn(*args))))
        else:
            self._pending.append((tag, self._ex.submit(fn, *args)))

    def submit_done(self, tag, value: dict) -> None:
        """Queue an already-decided result, so that a document settled before
        parsing still holds its place in the reporting order."""
        self._pending.append((tag, _Done(value)))

    def collect(self, keep: int | None = None):
        """Yield `(tag, result)` in submission order until at most `keep` jobs
        are still outstanding. `keep=None` uses the lookahead; `keep=0` drains
        everything.

        A worker exception propagates out of `.result()` here, which is the
        same thing that would have happened in a serial run: `scrape_one`
        absorbs a *parse* defeat into a `parse-error` status, but a failure
        outside that -- `write_document_outputs` hitting a full disk, say --
        has always been fatal, and quietly swallowing it because the work
        happened in another process would be a real change in behaviour."""
        limit = self._lookahead if keep is None else keep
        while len(self._pending) > limit:
            tag, job = self._pending.popleft()
            yield tag, job.result()

    def close(self) -> None:
        if self._ex is not None:
            self._ex.shutdown(wait=True)


def scrape_one(
    fetcher: Fetcher, ref: DocRef, lang: str, title_hint: str, overwrite: bool
) -> dict:
    """Fetch then parse one document, serially. Returns a small result dict
    for progress/reporting; never raises.

    The two halves run back to back here. `run_phase1`/`run_phase2` drive them
    apart instead, so that parsing overlaps the crawl delay -- but this
    composition is the definition of what that overlap must produce, and the
    `--jobs 1` path still goes through it."""
    early, html = fetch_for_parse(fetcher, ref, lang, overwrite)
    if early is not None:
        return early
    return parse_and_write(ref, lang, title_hint, html)


# --------------------------------------------------------------------------
# Phase 1: Vatican II
# --------------------------------------------------------------------------

VATII_ORDER = [
    "sacrosanctum-concilium",
    "lumen-gentium",
    "dei-verbum",
    "gaudium-et-spes",  # constitutions first (task priority)
    "unitatis-redintegratio",
    "ad-gentes",
    "dignitatis-humanae",
    "apostolicam-actuositatem",
    "christus-dominus",
    "nostra-aetate",
    "perfectae-caritatis",
    "inter-mirifica",
    "optatam-totius",
    "gravissimum-educationis",
    "presbyterorum-ordinis",
    "orientalium-ecclesiarum",
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


def run_phase1(
    fetcher: Fetcher, langs: list[str], only: list[str] | None, jobs: int = 1
) -> list[dict]:
    refs, err = discover_vatii(fetcher)
    if err:
        print(f"FATAL: could not fetch Vatican II index: {err}", file=sys.stderr)
        return []
    by_slug = {r.slug: r for r in refs}
    print(f"discovered {len(refs)} Vatican II documents from index (expected 16)")
    order = only or VATII_ORDER
    results = []
    pool = OrderedParsePool(jobs)

    def report(tag, r: dict) -> None:
        slug, lang = tag
        results.append(r)
        if lang is None:  # not-in-index; queued only to hold its place
            return
        print(
            f"  {slug}.{lang}: {r['status']}"
            + (f" {r.get('range')}" if r.get("range") else "")
            + (f" ERR={r.get('error')}" if r.get("error") else "")
        )

    try:
        for slug in order:
            ref = by_slug.get(slug)
            if ref is None:
                pool.submit_done(
                    (slug, None),
                    {"family": "vatii", "slug": slug, "status": "not-in-index"},
                )
                continue
            for lang in langs:
                early, html = fetch_for_parse(fetcher, ref, lang, overwrite=True)
                if early is not None:
                    pool.submit_done((slug, lang), early)
                else:
                    pool.submit(
                        (slug, lang),
                        parse_and_write,
                        ref,
                        lang,
                        VATII_TITLES.get(slug, slug),
                        html,
                    )
            touch_crawl_lock(CRAWL_LOCK_PATH)
            for tag, r in pool.collect():
                report(tag, r)
        for tag, r in pool.collect(0):
            report(tag, r)
    finally:
        pool.close()
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
    overwrite: bool = False,
    doc_slugs: list[str] | None = None,
    jobs: int = 1,
    want_langs: tuple[str, ...] = DEFAULT_LANGS,
    fetch_only: bool = False,
) -> list[dict]:
    """`overwrite` re-parses documents already written to corpus/works/ from
    their CACHED raw HTML — the module docstring has promised this flag since
    the scraper was written, but it was never actually wired into argparse, so
    every parser fix so far had to be verified some other way. It costs no
    network: `scrape_one` reads corpus/raw/ and only falls through to a fetch
    for a page that isn't cached, which for an already-written document never
    happens.

    `fetch_only` stops after `cache_page`: every requested language's page
    lands in corpus/raw/ and nothing is parsed, validated or written to
    works/. That is the honest shape of "acquire the sources now, decide what
    to publish later" -- and without it the only way to obtain a language's
    raw pages was a run that also created a work directory per document per
    language, which is a publishing decision wearing a crawl's clothes.

    `doc_slugs` narrows a run to named documents. Without it the smallest unit
    is a whole pontificate, which for Leo XIII is dozens of encyclicals — far
    more re-parsing than checking one parser fix needs, and the per-document
    review workflow (read a document, describe it, report what the parse got
    wrong) wants exactly one document at a time."""
    start = time.monotonic()
    results: list[dict] = []
    candidates = (
        PONTIFF_CANDIDATES
        if not pontiff_slugs
        else [c for c in PONTIFF_CANDIDATES if c[0] in pontiff_slugs]
    )
    n_done = 0
    pool = OrderedParsePool(jobs)
    # A document's progress line names both languages at once, so it can only
    # be printed when both have come back. Keyed by submission index rather
    # than slug: a slug is not unique across pontificates, and reusing one as
    # a key would merge two documents' lines.
    awaiting: dict[int, dict] = {}
    n_submitted = 0

    def report(tag, r: dict) -> None:
        idx, lang = tag
        results.append(r)
        entry = awaiting[idx]
        entry["have"][lang] = r
        if len(entry["have"]) < entry["want"]:
            return
        del awaiting[idx]
        if entry["quiet"]:
            return
        parts = []
        for lang in want_langs:
            r_lang = entry["have"].get(lang)
            if r_lang is None:
                parts.append(f"{lang}=no-url")
                continue
            status = r_lang["status"]
            if lang != "en" and status in ("fetch-failed", "no-translation-stub"):
                status = "unavailable"  # expected for many pontificates
            parts.append(f"{lang}={status}")
        print(f"  {entry['slug']}: " + " ".join(parts))

    def submit_doc(ref: DocRef, quiet: bool) -> None:
        """Fetch this document's languages serially, queue their parses."""
        nonlocal n_submitted
        idx = n_submitted
        n_submitted += 1
        langs = [ref.base_lang] if ref.base_lang in want_langs else []
        for lang in want_langs:
            if lang == ref.base_lang:
                continue
            url = translation_url_for(ref, lang)
            if url:
                ref.lang_urls[lang] = url
                langs.append(lang)
        awaiting[idx] = {
            "slug": ref.slug,
            "want": len(langs),
            "have": {},
            "quiet": quiet,
        }
        title = ref.slug.replace("-", " ").title()
        for lang in langs:
            if fetch_only:
                pool.submit_done((idx, lang), cache_page(fetcher, ref, lang))
                continue
            early, html = fetch_for_parse(fetcher, ref, lang, overwrite)
            if early is not None:
                pool.submit_done((idx, lang), early)
            else:
                pool.submit((idx, lang), parse_and_write, ref, lang, title, html)

    def drain(keep: int | None = None) -> None:
        for tag, r in pool.collect(keep):
            report(tag, r)

    try:
        for slug, display, _year in candidates:
            if time_budget is not None and time.monotonic() - start > time_budget:
                print(f"time budget ({time_budget}s) reached before {slug}; stopping")
                break
            # Finish reporting the previous pontificate before announcing this
            # one. Fetching is instant during a re-parse, so without this the
            # parent runs ahead and prints "pius-x: 16 encyclicals discovered"
            # in the middle of Leo XIII's per-document lines. The barrier costs
            # one pool drain per pontificate -- thirteen in a full run, against
            # a 14ms parse -- and is what keeps the output grouped the way a
            # serial run groups it.
            drain(0)
            refs, notes = discover_encyclicals(fetcher, slug, display)
            for note in notes:
                print(f"  [discover] {note}")
            if not refs:
                print(
                    f"{slug}: 0 encyclicals discovered (index missing or empty) -- skipping"
                )
                continue
            if doc_slugs is not None:
                refs = [r for r in refs if r.slug in doc_slugs]
                if not refs:
                    continue
            print(f"{slug}: {len(refs)} encyclicals discovered")
            for ref in refs:
                if time_budget is not None and time.monotonic() - start > time_budget:
                    print(f"time budget reached mid-pontificate ({slug}); stopping")
                    return results
                if limit is not None and n_done >= limit:
                    print(f"--limit {limit} reached; stopping")
                    return results
                submit_doc(ref, quiet=False)
                n_done += 1
                touch_crawl_lock(CRAWL_LOCK_PATH)
                drain()
            if include_exhortations:
                drain(0)  # same grouping guarantee as above
                exh_refs, exh_notes = discover_exhortations(fetcher, slug, display)
                for note in exh_notes:
                    print(f"  [discover-exh] {note}")
                for ref in exh_refs:
                    if (
                        time_budget is not None
                        and time.monotonic() - start > time_budget
                    ):
                        return results
                    submit_doc(ref, quiet=True)
                    touch_crawl_lock(CRAWL_LOCK_PATH)
                    drain()
        return results
    finally:
        # Every early `return` above lands here first. Work whose page is
        # already fetched and whose parse is already running must still be
        # collected, or a --time-budget/--limit stop would throw away
        # documents it had paid the crawl delay for.
        drain(0)
        pool.close()


# --------------------------------------------------------------------------
# Cross-language symmetry check (docs/decisions.md's "Language symmetry
# principle" used as a QA oracle -- see this task's brief). Deliberately a
# standalone pass over already-written corpus/works/ output, not folded
# into parse_document/validate_document: it needs to see BOTH languages'
# finished sections.json at once, which a single-document parse never has
# in scope, and keeping it separate lets it re-run against output from an
# earlier crawl without re-parsing anything.
# --------------------------------------------------------------------------

# Any language, not `(en|pt)`. That literal pair outlived the two-language
# corpus by a day: Magnifica Humanitas arrived in nine editions on 2026-08-24
# and `check_language_symmetry`'s docstring was generalised to match, but this
# regex was not -- so seven of those nine were silently outside the check that
# exists to compare them. The seven Italian-only encyclicals would have been
# the second set to slip past it.
_WORK_ID_RE = re.compile(r"^([a-z][a-z-]*)\.(.+)\.([a-z]{2})$")


def sections_from_results(results: list[dict]) -> dict[str, list[int]]:
    """`work_id -> section numbers` for every document a run actually parsed.

    Only the parsed ones: a `no-url`/`already-written`/`fetch-failed` result
    never saw a section, and inventing an empty set for it would make the
    symmetry check report a defect where there is only an absence."""
    return {
        f"{r['family']}.{r['slug']}.{r['lang']}": r["section_numbers"]
        for r in results
        if r.get("section_numbers") is not None
    }


def check_language_symmetry(
    works_root: Path = WORKS_ROOT, known: dict[str, list[int]] | None = None
) -> tuple[bool, list[str]]:
    """For every (family, slug) written in more than one language under
    works_root, checks that all of them carry the same set of section
    numbers -- exactly the check that would have
    caught all three of this task's defects (Gravissimum Educationis EN:
    0 sections vs. PT's 12; Sacrosanctum Concilium: EN missing 87, PT
    missing 70; Optatam Totius EN: 21 sections vs. PT's 22). Each
    language looked internally plausible in isolation (a contiguous,
    gap-free 1..N run) -- validate_document's per-document contiguity
    check cannot see this class of defect at all, only comparing against
    the sibling translation's own section set reveals it.

    Was an EN/PT check until Magnifica Humanitas arrived in nine languages
    (2026-08-24). Nothing about the reasoning was ever specific to two: the
    rule is "where two editions of one document exist, they must agree", and
    a document in nine editions offers thirty-six times the evidence rather
    than a different kind of it. A language that deviates alone is now named
    as the odd one out, which two editions could never tell you -- with only
    EN and PT, a disagreement says a defect exists and not which side has it.

    Deliberately does NOT require every document to exist in every
    language: a missing translation is legitimate and common across the
    full encyclical corpus this scraper also covers (Leo XIII is only
    ~17% translated into Portuguese on vatican.va, docs/decisions.md's
    "Scope" section / research/vatican-documents.md
    §2) -- so a (family, slug) with only one language written is silently
    skipped, not flagged. Only a pair where BOTH sides exist and disagree
    is a defect. A work directory that exists but has no sections.json at
    all (e.g. a "parser defeated, zero sections" case that was never
    written -- see build_manifest) is treated the same as absent, not as
    an empty section set that would trivially "disagree" with everything.

    AN EDITION WITH NO SECTIONS IS THE SAME CASE, and is skipped for the same
    reason. Nine editions in the corpus are typeset as continuous prose with
    no inline paragraph numbers at all -- their text is in `appendix.json` and
    `sections.json` is an empty array, which is a real and complete parse, not
    a failure. Comparing that against a numbered sibling says only that one
    edition prints numbers and the other does not, which is a fact about the
    two typesettings and not a defect in either: `orientales` is unnumbered in
    Italian and carries 24 numbered sections in Portuguese. This surfaced the
    day the work-id pattern stopped saying `(en|pt)`, because until then the
    Italian edition was not being read at all.

    `known` is `work_id -> section numbers` for documents the caller has just
    parsed and still holds in memory. It is a CACHE, not a substitute for the
    scan: the sweep over works_root still decides which pairs exist, so a run
    narrowed by --slugs or --pontiffs is still checked against the whole
    corpus rather than quietly against its own slice. All `known` changes is
    where the numbers come from for the documents this run produced -- which
    was 14.4 MB of sections.json re-read seconds after being written.

    Returns (ok, problems)."""
    known = known or {}
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
        # A work_id in `known` was written by this run, so its file is there
        # without asking; anything else has to be checked for.
        if entry.name not in known and not sections_path.exists():
            continue
        by_pair.setdefault((family, slug), {})[lang] = sections_path

    def numbers(family: str, slug: str, lang: str, path: Path) -> set[int]:
        cached = known.get(f"{family}.{slug}.{lang}")
        if cached is not None:
            return set(cached)
        return {s["n"] for s in json.loads(path.read_text(encoding="utf-8"))}

    problems: list[str] = []
    for (family, slug), langs in sorted(by_pair.items()):
        if len(langs) < 2:
            continue  # one language legitimately absent -- not a defect, see docstring
        sets = {lang: numbers(family, slug, lang, path) for lang, path in langs.items()}
        # See the docstring: an unnumbered edition is absent for this
        # comparison, exactly as a missing sections.json is.
        sets = {lang: ns for lang, ns in sets.items() if ns}
        if len(sets) < 2:
            continue
        if len(set(map(frozenset, sets.values()))) == 1:
            continue
        # The reference is the set the most editions agree on, so the report
        # names the ones that deviate rather than measuring everything against
        # whichever language happens to sort first.
        agreed = collections.Counter(frozenset(v) for v in sets.values()).most_common(
            1
        )[0][0]
        detail = []
        for lang, nums in sorted(sets.items()):
            if frozenset(nums) == agreed:
                continue
            missing = sorted(agreed - nums)
            extra = sorted(nums - agreed)
            detail.append(
                f"{lang.upper()} has {len(nums)}"
                + (f", missing {missing}" if missing else "")
                + (f", extra {extra}" if extra else "")
            )
        agreeing = sorted(k.upper() for k, v in sets.items() if frozenset(v) == agreed)
        problems.append(
            f"{family}.{slug}: section-number sets differ -- "
            + "; ".join(detail)
            + f" (against {len(agreed)} in {', '.join(agreeing)})"
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

LOCK_STALE_AFTER = (
    900  # seconds; no heartbeat within this window means abandoned (crashed)
)


class LockHeld(Exception):
    pass


def _lock_heartbeat_age(lock_path: Path) -> tuple[float, dict]:
    info: dict = {}
    with contextlib.suppress(json.JSONDecodeError, OSError):
        info = json.loads(lock_path.read_text(encoding="utf-8"))
    heartbeat = 0.0
    with contextlib.suppress(TypeError, ValueError):
        heartbeat = float(info.get("heartbeat", info.get("started", 0)) or 0)
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
    lock_path.write_text(
        json.dumps({"pid": os.getpid(), "started": now, "heartbeat": now}),
        encoding="utf-8",
    )


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
    with contextlib.suppress(OSError):
        lock_path.write_text(json.dumps(info), encoding="utf-8")


def release_crawl_lock(lock_path: Path) -> None:
    lock_path.unlink(missing_ok=True)


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def summarize(results: list[dict]) -> None:
    from collections import Counter

    counts = Counter(r["status"] for r in results)
    print("\n=== summary ===")
    for status, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {status}: {n}")
    # Drift statuses belong here too. Both were being counted in the tally
    # above and then omitted from the detail below, so a run reported
    # "corrections-drift: 1" and never said which entry stopped matching or
    # why -- the one thing a loud failure exists to tell you.
    failed = [
        r
        for r in results
        if r["status"]
        in (
            "fetch-failed",
            "parse-error",
            "validation-failed",
            "corrections-drift",
            "overrides-drift",
        )
    ]
    if failed:
        print(f"\n{len(failed)} problem documents:")
        for r in failed:
            print(
                f"  {r['family']}.{r['slug']}.{r.get('lang')}: {r['status']} {r.get('error', '')} {r.get('problems', '')}"
            )


def report_fetching(fetcher: Fetcher) -> None:
    """The run's network receipt, including what it did NOT have to ask.

    The skipped count is the point: `--overwrite` is supposed to be a
    zero-network re-parse, and printing only the fetches it made left the 36
    requests it was making to permanently-absent URLs looking like normal
    crawl traffic. A run that reports "0 fetches, 12 skipped" says plainly
    which it was."""
    absent = fetcher.absent
    print(
        f"\nnetwork fetches this run: {fetcher.network_fetches} "
        f"(retried-then-ok: {fetcher.retried_ok}; "
        f"requests skipped as known-absent: {absent.skipped})"
    )
    for url in absent.added:
        print(f"  [absent] recorded 404/410, will not re-ask: {url}")
    for url in absent.forgotten:
        print(f"  [absent] now exists, dropped from the ledger: {url}")
    if absent.save():
        print(f"  [absent] ledger updated: {absent.path}")


def main() -> int:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    sub = ap.add_subparsers(dest="cmd", required=True)

    # Shared by every subcommand that can reach the network. An absence is
    # not permanent -- a translation can appear years after we first asked --
    # so the ledger needs a way to be re-tested; see common.AbsentSources.
    net = argparse.ArgumentParser(add_help=False)
    net.add_argument(
        "--recheck-absent",
        action="store_true",
        help="re-fetch URLs recorded in pipeline/absent-sources.json; "
        "drop the ones that now exist",
    )

    # Parsing only. Fetching is serial at any --jobs; see fetch_for_parse.
    par = argparse.ArgumentParser(add_help=False)
    par.add_argument(
        "--jobs",
        "-j",
        type=int,
        default=default_jobs(),
        help=f"parse worker processes (default: {default_jobs()}); "
        "1 runs inline, which is what to use for a real traceback. "
        "Never affects the request rate",
    )

    p1 = sub.add_parser(
        "phase1", parents=[net, par], help="Vatican II, all 16 documents"
    )
    p1.add_argument("--lang", choices=["en", "pt", "both"], default="both")
    p1.add_argument(
        "--only", help="comma-separated slugs, for iterating on one document"
    )

    p2 = sub.add_parser(
        "phase2",
        parents=[net, par],
        help="encyclicals (+exhortations), per-pontificate discovery",
    )
    p2.add_argument("--pontiffs", help="comma-separated slugs; default: all candidates")
    p2.add_argument(
        "--time-budget",
        type=float,
        default=None,
        help="seconds; stop gracefully once exceeded",
    )
    p2.add_argument(
        "--limit",
        type=int,
        default=None,
        help="max new documents (en+pt counted together) this run",
    )
    p2.add_argument(
        "--exhortations",
        action="store_true",
        help="also crawl apostolic exhortations per pontificate",
    )
    p2.add_argument(
        "--overwrite",
        action="store_true",
        help="re-parse already-written documents from cached raw HTML (no network)",
    )
    p2.add_argument(
        "--slugs",
        default=None,
        help="comma-separated document slugs; default: every document discovered",
    )
    p2.add_argument(
        "--langs",
        default=",".join(DEFAULT_LANGS),
        help="comma-separated language codes to fetch "
        f"(default: {','.join(DEFAULT_LANGS)}). Without --fetch-only every "
        "code must be one this parser has division labels for: "
        + ", ".join(sorted(DIVISIONS)),
    )
    p2.add_argument(
        "--fetch-only",
        action="store_true",
        help="cache each language's page under corpus/raw/ and stop -- no "
        "parsing, no works/ written. Accepts any language code, since "
        "nothing reads the text",
    )

    sub.add_parser(
        "discover-encyclicals",
        parents=[net],
        help="index-only census, no document fetches",
    )
    sub.add_parser(
        "check-symmetry",
        help="cross-language section-set check over already-written corpus/works/ (no fetches, no parsing)",
    )

    args = ap.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()
    fetcher = make_fetcher(getattr(args, "recheck_absent", False))

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
            results = run_phase1(fetcher, langs, only, jobs=args.jobs)
        finally:
            release_crawl_lock(CRAWL_LOCK_PATH)
        summarize(results)
        report_fetching(fetcher)
        ok = all(r["status"] in ("validated", "already-written") for r in results)
        sym_ok, sym_problems = check_language_symmetry(
            known=sections_from_results(results)
        )
        print(
            f"\n=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}"
        )
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if (ok and sym_ok) else 1

    if args.cmd == "phase2":
        try:
            pontiffs = args.pontiffs.split(",") if args.pontiffs else None
            doc_slugs = args.slugs.split(",") if args.slugs else None
            want_langs = tuple(x.strip() for x in args.langs.split(",") if x.strip())
            # Division labels are a parser's requirement, so --fetch-only,
            # which parses nothing, does not have it. This is what lets the
            # raw side of the corpus hold Latin (154 encyclicals) and the
            # languages the interface has never had, years before anything
            # can read them.
            unknown = (
                [] if args.fetch_only else [x for x in want_langs if x not in DIVISIONS]
            )
            if unknown:
                print(
                    f"ERROR: no division labels for {', '.join(unknown)}; "
                    f"known: {', '.join(sorted(DIVISIONS))}"
                )
                return 1
            results = run_phase2(
                fetcher,
                pontiffs,
                args.time_budget,
                args.limit,
                args.exhortations,
                overwrite=args.overwrite,
                doc_slugs=doc_slugs,
                jobs=args.jobs,
                want_langs=want_langs,
                fetch_only=args.fetch_only,
            )
        finally:
            release_crawl_lock(CRAWL_LOCK_PATH)
        summarize(results)
        report_fetching(fetcher)
        if args.fetch_only:
            # Nothing was parsed, so the symmetry oracle has no evidence from
            # this run and would report the corpus's standing state as though
            # it were this run's verdict. A fetch-only run succeeds when the
            # pages it could get are on disk.
            return 0
        sym_ok, sym_problems = check_language_symmetry(
            known=sections_from_results(results)
        )
        print(
            f"\n=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}"
        )
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if sym_ok else 1

    if args.cmd == "check-symmetry":
        # No `known` here by definition: this subcommand exists to check a
        # corpus produced by an earlier run, so every number comes off disk.
        sym_ok, sym_problems = check_language_symmetry()
        print(
            f"=== cross-language symmetry check ===\nVALIDATION: {'PASS' if sym_ok else 'FAIL'}"
        )
        for p in sym_problems:
            print(f"  - {p}")
        return 0 if sym_ok else 1

    if args.cmd == "discover-encyclicals":
        total = 0
        for slug, display, _year in PONTIFF_CANDIDATES:
            refs, notes = discover_encyclicals(fetcher, slug, display)
            for note in notes:
                print(f"  [note] {note}")
            print(f"{slug} ({display}): {len(refs)} encyclicals")
            total += len(refs)
        print(
            f"\ntotal encyclicals discovered across {len(PONTIFF_CANDIDATES)} candidate pontificates: {total}"
        )
        report_fetching(fetcher)
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())
