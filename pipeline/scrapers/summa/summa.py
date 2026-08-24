#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Summa Theologiae scraper -- English and Latin, from two different sources.

WHY TWO SOURCES AND NOT ONE. Every other scraper here reads one host's
template in N languages. This work has no host that carries both languages in
a form worth parsing: the sites that print Latin and English side by side are
either machine-translated (liriocatolico), rights-reserved over the whole
edition (Documenta Catholica Omnia), or a JavaScript editing surface with no
server-rendered text (aquinas.cc). So the two editions come from the two best
single-language sources and are joined by ADDRESS, which is safe here in a way
it would not be for a Bible: an article's address (part, question, article,
division) is the same in both because it is the work's own structure, not an
editorial decision either site made. See docs/decisions.md, 2026-08-23.

  EN: https://ccel.org/ccel/aquinas/summa.xml
      CCEL's ThML source for the Fathers of the English Dominican Province
      translation (Shapcote, 1920 / Benziger 1947), public domain by age.
      ONE fetch for the whole work -- 19 MB of XML carrying all five parts.
      `robots.txt` says `Crawl-delay: 10`, which a single request satisfies
      trivially; that is the reason this reads the bulk XML rather than
      walking 3,110 per-article pages that are equally derivable.

  LA: https://www.corpusthomisticum.org/sth####.html
      The Corpus Thomisticum (Enrique Alarcon, Univ. of Navarre), Leonine-
      based. 87 pages, each carrying many questions, enumerated from the
      site's own `iopera.html` index rather than guessed at. No robots.txt
      (404), so the floor is this project's conservative 2.0s.

THE LATIN STOPS AT THE TERTIA PARS. Corpus Thomisticum publishes parts I,
I-II, II-II and III and no Supplementum -- `sth5000.html` is a 404, checked.
The Supplement is a posthumous compilation from Aquinas's commentary on the
Sentences rather than his own text for this work, and the site's scope
reflects that. It is a real, permanent asymmetry between the two editions:
`summa.en` has 5 parts and `summa.la` has 4. It is NOT a defect and must not
be reported as one -- the reader-facing consequence is handled by the site's
edition fallback (the reader's language, then English, then Latin), and
`validate` asserts the shape rather than symmetry.

THE CROSS-LANGUAGE ORACLE SURVIVES, NARROWED. An earlier draft of this
docstring claimed it did not -- that two sources of differing completeness
could not check each other. The sample run disproved that: over the parts
both editions carry, their address spaces agree exactly (Prima Pars: 119
questions and 582 articles on each side, independently derived from two
sites that share no text), and the comparison immediately earned its keep by
finding three articles whose body the English edition omits and the Latin
has. So CLAUDE.md's free QA oracle does apply, with one narrowing that is a
property of the sources rather than a weakening of the check: it runs over
the parts BOTH editions carry, which excludes the Supplement. `compare_editions`
reports, and never fails, because every difference it can find so far has
been the edition speaking.

Per-edition invariants carry the rest, and are what `validate` fails on:
question numbers inside their part's declared range, article numbers a clean
sequence, divisions in the order the work prints them, no empty block, and
no bodiless article beyond the handful the editions really do print that way.

BOTH SOURCES DECLARE THEIR STRUCTURE, which is why this parser has no
heading heuristics at all -- the thing that costs `vatican_docs.py` most of
its complexity. CCEL nests `div1`(part) > `div3`(question) > `div4`(article)
with ids like `SS_Q184_A3`, and Corpus Thomisticum titles every paragraph
with its own address (`TITLE="I-II q. 71 a. 1 arg. 1"`), division included.
Nothing here infers an address from how a line is painted.

Usage:
  uv run pipeline/scrapers/summa/summa.py --lang en|la|both [--sample]

`--sample` parses the Prima Pars only (EN: the same single XML, sliced; LA:
the 13 `sth1###` pages), per the sample-first protocol in
docs/corpus-schema.md.
"""

from __future__ import annotations

import argparse
import html as htmllib
import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    Fetcher,
    FetchPolicy,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    works_root,
    write_stamped_json,
)

# --------------------------------------------------------------------------
# The address space
# --------------------------------------------------------------------------

#: CCEL's part ids -> the part label the citations of this corpus actually
#: use ("STh I-II, 79, 1"; "Summa theologiae, 1-2, q. 79, a. 1" in the PT
#: Catechism, which normalizes to the same Roman form). `Suppl` is spelled
#: out rather than left as `XP` because it is what a reader sees.
PART_BY_CCEL_ID = {
    "FP": "I",
    "FS": "I-II",
    "SS": "II-II",
    "TP": "III",
    "XP": "Suppl",
}

#: Declared question counts per part, from both sources' own division of the
#: work. Asserted in `validate` rather than trusted: a question number outside
#: its part's range means the address parse went wrong, which is the one
#: failure that would silently produce plausible, wrong links.
QUESTIONS_PER_PART = {"I": 119, "I-II": 114, "II-II": 189, "III": 90, "Suppl": 99}

#: Corpus Thomisticum's page-number prefix -> part. Used only to SELECT pages
#: for `--sample`; the authoritative part for any paragraph is read from its
#: own `TITLE` attribute.
CT_PAGE_PREFIX_PART = {"1": "I", "2": "I-II", "3": "II-II", "4": "III"}

#: The divisions of an article, in the order the work prints them. The four
#: real ones are the address space the citations use -- "ad 3" and "co." are
#: locators in this corpus's own footnotes -- so they are stored as structure
#: rather than flattened into prose.
#:
#: `preamble` is not one of Aquinas's divisions and is deliberately outside
#: the citable set: it holds prose the translation prints before the first
#: objection, which in this edition is an editorial note in square brackets
#: rather than any part of the argument (2 articles in 3,110). It exists so
#: that text is neither dropped nor mis-filed as the body -- the alternative
#: this parser first produced, which put a translator's gloss where a
#: citation to `co.` would land.
DIVISION_ORDER = {
    "preamble": -1,
    "objection": 0,
    "sed-contra": 1,
    "corpus": 2,
    "reply": 3,
}

CCEL_XML_URL = "https://ccel.org/ccel/aquinas/summa.xml"
CT_INDEX_URL = "https://www.corpusthomisticum.org/iopera.html"
CT_PAGE_URL = "https://www.corpusthomisticum.org/{page}"

USER_AGENT = "glossa-catholica/0.1 (+https://glossa.me-f65.workers.dev)"

# `robots.txt` allows all with `Crawl-delay: 10`. One request per run cannot
# breach that, but the floor is declared anyway so a future second fetch
# inherits it rather than the next author rediscovering the number.
CCEL_POLICY = FetchPolicy(
    user_agent=USER_AGENT, delay=10.0, attempts=3, backoff=(2.0, 5.0), timeout=180.0
)
# No robots.txt at all (404, checked 2026-08-23), so nothing is granted and
# this project's own conservative floor applies -- the same 2.0s vatican.va
# asks for in writing.
CT_POLICY = FetchPolicy(
    user_agent=USER_AGENT, delay=2.0, attempts=3, backoff=(2.0, 5.0), timeout=60.0
)


def decode_utf8(data: bytes) -> str:
    return data.decode("utf-8", errors="replace")


def decode_latin1(data: bytes) -> str:
    """Corpus Thomisticum declares ISO-8859-1 and ships pure ASCII plus HTML
    entities (`I&ordf;`, `Alarc&oacute;n`). Decoding latin-1 is therefore
    lossless, and the entities are resolved later by `narrow_html`."""
    return data.decode("iso-8859-1")


# --------------------------------------------------------------------------
# Inline markup: the corpus's narrowed-HTML allowlist
# --------------------------------------------------------------------------

_ALLOWED_INLINE = {"i", "b", "br", "sup", "blockquote"}
_TAG_RE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>")

#: CCEL's own internal cross-reference anchors, e.g. `#FP_Q74_A2`, and the
#: 5,197 `<a href>`s carrying them are the single most valuable thing in this
#: source after the text itself. The Summa cites itself constantly, and this
#: edition states every target EXACTLY -- part siglum, question, article --
#: where the visible text is a mess of `Q[74], A[2]`, `(A[3])`, `Q[76] , A[2]`
#: and `Q[3], AA[1]` that only means anything relative to where it is printed.
#: An earlier version of this scraper dropped these links and kept their text,
#: which is why the corpus was full of stray square brackets: they are what a
#: discarded anchor leaves behind.
#:
#: The finest anchor is the ARTICLE, which is also the finest address the site
#: has (`/summa/{part}/{q}#a{n}`), so nothing is lost by following it. A
#: trailing `, ad 2` sits OUTSIDE the anchor in the source and stays text.
_CCEL_XREF_RE = re.compile(r"^#(FP|FS|SS|TP|XP)_Q(\d+)(?:_A(\d+))?$")


def _xref_address(href: str) -> str | None:
    """A CCEL anchor as a corpus address, or None if it is not one.

    `#APN_Q1_A1` (2 occurrences) is the shape this rejects: `AP` is not a
    part of the Summa, and a reference to a part that does not exist is not
    one this corpus can carry. Those keep their text and lose their link,
    which is the same rule `narrow_html` applies to any tag it does not know.
    """
    m = _CCEL_XREF_RE.match(href.strip())
    if not m:
        return None
    part = PART_BY_CCEL_ID.get(m.group(1))
    if part is None:
        return None
    article = m.group(3)
    return f"summa:{part}:{m.group(2)}" + (f":{article}" if article else "")


def narrow_html(fragment: str) -> str:
    """A source fragment as the corpus's narrowed HTML.

    Same contract as the documents' (docs/corpus-schema.md, amended
    2026-08-21/22): a closed tag allowlist, `em`->`i`, `strong`->`b`, entities
    resolved here rather than shipped to the client, and only `&`/`<`/`>`
    re-escaped. Tags outside the allowlist keep their text and lose their
    markup.

    Neither source needs much of this. CCEL's article prose carries no inline
    markup at all -- all 26,599 of its `<b>` elements are division markers,
    which the caller has already consumed -- and Corpus Thomisticum uses only
    `<I>` for the quotations Aquinas sets off. The allowlist is applied anyway
    so that a source growing a tag does not silently ship raw markup.

    `<a>` IS THE ONE ADDITION TO THE DOCUMENTS' ALLOWLIST, and it is admitted
    only as `<a data-ref="summa:{part}:{q}[:{a}]">` -- never with an `href`,
    never with anything else. See `_CCEL_XREF_RE`: the source states its
    self-references exactly, and this is what carries them into the corpus
    instead of throwing them away. An `<a>` this scraper cannot resolve to an
    address is dropped like any other unknown tag, so an unresolvable link
    degrades to its own words rather than to a broken one.
    """
    out: list[str] = []
    pos = 0
    # Anchors nest nothing, but a dropped opener must not leave its `</a>`
    # behind -- so closers are emitted only for openers that were kept.
    anchor_kept: list[bool] = []
    for m in _TAG_RE.finditer(fragment):
        out.append(_escape_text(htmllib.unescape(fragment[pos : m.start()])))
        closing = m.group(1)
        name = m.group(2).lower()
        name = {"em": "i", "strong": "b"}.get(name, name)
        if name == "a":
            if closing:
                if anchor_kept and anchor_kept.pop():
                    out.append("</a>")
            else:
                href = _ATTR_HREF_RE.search(m.group(0))
                address = _xref_address(href.group(1)) if href else None
                anchor_kept.append(address is not None)
                if address is not None:
                    out.append(f'<a data-ref="{address}">')
        elif name in _ALLOWED_INLINE:
            out.append(f"<{m.group(1)}{name}>")
        pos = m.end()
    out.append(_escape_text(htmllib.unescape(fragment[pos:])))
    # An anchor left open by a malformed fragment is closed here, matching the
    # "unclosed tags are closed at the end" rule the site's reader states.
    out.append("</a>" * sum(1 for kept in anchor_kept if kept))
    return collapse_space("".join(out))


_ATTR_HREF_RE = re.compile(r'\bhref\s*=\s*"([^"]*)"')


def _escape_text(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def collapse_space(text: str) -> str:
    """Line breaks inside a block collapse to single spaces, per the schema."""
    return re.sub(r"[ \t\r\n ]+", " ", text).strip()


def strip_tags(html_text: str) -> str:
    """The plain text of a narrowed-HTML block.

    Inline tags are dropped with NO replacement -- `strip_tags` on the CCC
    learned this the expensive way (docs/decisions.md, 2026-08-23: "inline
    tags are not whitespace"), and `<i>quae</i>dam` must not become `quae dam`.
    `<br>` is the one that genuinely separates words.
    """
    text = re.sub(r"<br\s*/?>", " ", html_text, flags=re.IGNORECASE)
    # `<a data-ref="...">` is the one narrowed tag carrying an attribute, so
    # this pattern cannot be the bare `</?tag>` the others match.
    text = re.sub(r"</?(?:i|b|sup|blockquote|a)\b[^>]*>", "", text, flags=re.IGNORECASE)
    return collapse_space(htmllib.unescape(text))


# --------------------------------------------------------------------------
# English: CCEL's ThML
# --------------------------------------------------------------------------

_DIV_RE = re.compile(r"<div([1-4])\b([^>]*)>")
_ID_RE = re.compile(r'\bid="([^"]+)"')
_H_RE = re.compile(r"<h([1-4])\b[^>]*>(.*?)</h\1>", re.DOTALL | re.IGNORECASE)
_P_RE = re.compile(r"<p\b[^>]*?(/>|>(.*?)</p>)", re.DOTALL | re.IGNORECASE)
_ARTICLE_ID_RE = re.compile(r"^([A-Z]{2})_Q(\d+)_A(\d+)$")
_QUESTION_ID_RE = re.compile(r"^([A-Z]{2})_Q(\d+)$")

#: The English edition's division markers, as `<b>` runs at the head of a
#: paragraph. `Objection 1.` with a period is a single-occurrence source
#: variant of `Objection 1:`; both are matched rather than corrected, since
#: nothing about the text is wrong -- only its punctuation is inconsistent.
_EN_DIVISION_RE = re.compile(
    r"^<b>\s*(?:"
    r"Objection\s+(?P<obj>\d+)\s*[:.]"
    r"|Reply\s+to\s+Objection\s+(?P<reply>\d+)\s*[:.]"
    r"|(?P<contra>On\s+the\s+contrary\s*,?)"
    r"|(?P<corpus>I\s+answer\s+that\s*,?)"
    r")\s*</b>",
    re.IGNORECASE,
)


#: The body opening WITHOUT its `<b>` wrapper. The source loses the markup on
#: 13 articles of 3,110 -- "I answer with Augustine (Gen. ad lit. ii, 5) that,"
#: (FP_Q68_A2), "I answer that As stated above" (several) -- and the wrapper
#: is the only thing missing; the text is intact and in its right place. Left
#: unhandled, each of those bodies is silently appended to the `sed contra`
#: above it, so a citation to `co.` lands on the objection the body answers.
#: Matched as a division opener rather than filed as a source defect because
#: nothing about the source is WRONG here: the words are the translator's own
#: and it is only the emphasis that is inconsistent.
_EN_UNMARKED_CORPUS_RE = re.compile(r"^I answer\b", re.IGNORECASE)


def en_division_of(
    paragraph: str, *, seen: tuple[str, ...] = ()
) -> tuple[str, int | None, str] | None:
    """`(kind, ordinal, remainder)` for a paragraph that opens a division.

    `seen` is the kinds already opened in this article, and it is what keeps
    the unmarked-body rule honest. "I answer" is not a reserved opening: FP
    q. 67 a. 4 uses it *inside* Reply to Objection 2 ("I answer, then, with
    Dionysius..."), and matching it there split one reply into a phantom
    second body. The rule therefore fires only where a body could still
    legitimately begin -- before any reply, and only once."""
    stripped = paragraph.strip()
    m = _EN_DIVISION_RE.match(stripped)
    if not m:
        if (
            _EN_UNMARKED_CORPUS_RE.match(stripped)
            and "corpus" not in seen
            and "reply" not in seen
        ):
            return "corpus", None, stripped
        return None
    rest = paragraph.strip()[m.end() :]
    if m.group("obj"):
        return "objection", int(m.group("obj")), rest
    if m.group("reply"):
        return "reply", int(m.group("reply")), rest
    if m.group("contra"):
        return "sed-contra", None, rest
    return "corpus", None, rest


def en_blocks(region: str) -> list[str]:
    """The `<p>` fragments of a ThML region, empty ones dropped.

    ThML writes a self-closing `<p id="..."/>` between an article's heading
    and its first objection; it carries nothing and is not a block."""
    out = []
    for m in _P_RE.finditer(region):
        body = m.group(2) or ""
        if body.strip():
            out.append(body)
    return out


def parse_en(xml: str, *, sample: bool) -> tuple[list[dict], list[dict], list[str]]:
    """`(questions, structure, anomalies)` from CCEL's ThML.

    A single linear scan over the `divN` openings: each one closes whatever
    is open at its depth or deeper, and the text between one opening and the
    next belongs to the innermost division open at that point. That is enough
    because the ids are explicit -- there is no need to balance closing tags,
    and no need to guess which heading means what.
    """
    marks = [
        (m.start(), int(m.group(1)), _ID_RE.search(m.group(2)))
        for m in _DIV_RE.finditer(xml)
    ]
    marks = [(pos, depth, m.group(1) if m else "") for pos, depth, m in marks]

    questions: dict[tuple[str, int], dict] = {}
    structure: list[dict] = []
    anomalies: list[str] = []
    current_part: str | None = None
    current_question: tuple[str, int] | None = None

    for i, (pos, depth, div_id) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(xml)
        region = xml[pos:end]

        if depth == 1:
            current_part = PART_BY_CCEL_ID.get(div_id)
            current_question = None
            if current_part and not (sample and current_part != "I"):
                title = _heading_text(region, 1)
                if title:
                    structure.append(
                        {"level": 1, "part": current_part, "title": title, "before": 1}
                    )
            continue

        if sample and current_part != "I":
            continue

        if depth == 2:
            # A treatise: the grouping CCEL prints between part and question.
            # Its anchor is the first question it contains, which is not
            # stated in the div -- it is read off the next question div, so
            # the heading is parked and completed there.
            title = _heading_text(region, 2)
            if title and current_part:
                structure.append(
                    {"level": 2, "part": current_part, "title": title, "before": None}
                )
            continue

        if depth == 3:
            qm = _QUESTION_ID_RE.match(div_id)
            if not qm:
                continue
            part = PART_BY_CCEL_ID.get(qm.group(1))
            if part is None or (sample and part != "I"):
                current_question = None
                continue
            n = int(qm.group(2))
            current_question = (part, n)
            # The parked treatise heading (if any) starts here.
            for row in reversed(structure):
                if row["before"] is None:
                    row["before"] = n
                    break
                if row["level"] == 1:
                    break
            prologue, divisions = split_question_region(region, div_id, anomalies)
            questions[current_question] = {
                "part": part,
                "n": n,
                "title": _heading_text(region, 3),
                "prologue": prologue,
                "articles": [],
            }
            if divisions:
                questions[current_question]["divisions"] = divisions
            continue

        am = _ARTICLE_ID_RE.match(div_id)
        if not am:
            continue
        part = PART_BY_CCEL_ID.get(am.group(1))
        if part is None or (sample and part != "I"):
            continue
        key = (part, int(am.group(2)))
        if key not in questions:
            anomalies.append(f"EN: article {div_id} has no question div; skipped")
            continue
        for offset, group in enumerate(
            split_merged_articles(en_divisions(en_blocks(region), div_id, anomalies))
        ):
            n = int(am.group(3))
            if offset:
                # See `split_merged_articles`. The recovered article takes the
                # next number after the one it was buried in, which is free by
                # construction: it is missing from the source precisely
                # because its `div4` is.
                n = max(a["n"] for a in questions[key]["articles"]) + 1
                anomalies.append(
                    f"EN: {div_id} carried a second, unmarked article; "
                    f"recovered as a. {n}"
                )
            questions[key]["articles"].append(
                {
                    "n": n,
                    "title": _heading_text(region, 4) if not offset else "",
                    "divisions": group,
                }
            )

    # A treatise heading that never met a question (trailing matter) anchors
    # nowhere; `before: null` is the documents' own spelling for that.
    ordered = [questions[k] for k in sorted(questions, key=_question_sort_key)]
    return ordered, structure, anomalies


def split_merged_articles(divisions: list[dict]) -> list[list[dict]]:
    """One article's divisions, split where the source ran two together.

    CCEL's ThML omits the `div4` opening for three articles (II-II q. 64
    a. 8, q. 66 a. 6, q. 123 a. 11), so each one's text sits inside its
    predecessor's division with no id and no heading of its own. Left alone,
    a citation to the predecessor opens a page carrying two articles, and the
    successor has no address at all -- II-II q. 64 a. 7 is among the most
    cited articles in this corpus.

    The split rule is structural rather than typographic: an article states
    its objections, answers them from authority, argues its own case and then
    replies. A `sed contra` or a body appearing AFTER the replies have begun
    cannot belong to the same article -- that is the work's own form, not an
    observation about how CCEL paints a heading. Independently confirmed: the
    Latin edition has all three of these articles, at exactly the numbers
    this recovers them at.
    """
    groups: list[list[dict]] = [[]]
    seen_reply = False
    for i, division in enumerate(divisions):
        # The boundary is the next article's FIRST division, which is an
        # objection -- not its body. Splitting at the body instead leaves the
        # recovered article's objections behind in its predecessor.
        #
        # Guarded by "and a body still follows", which is what tells a real
        # article apart from the other defect in this same edition: II-II
        # q. 172 a. 1 and Suppl q. 77 a. 4 print `Objection 2:` where the
        # sequence demands `Reply to Objection 2:`, and that stray objection
        # is followed only by more replies. A split there would invent an
        # article out of a dropped "Reply to " prefix. Those two are a
        # typographic defect and are fixed in the corrections layer, where a
        # claim about what the source SHOULD say belongs.
        if (
            seen_reply
            and division["kind"] == "objection"
            and any(d["kind"] == "corpus" for d in divisions[i:])
        ):
            groups.append([])
            seen_reply = False
        groups[-1].append(division)
        if division["kind"] == "reply":
            seen_reply = True
    return [g for g in groups if g]


def split_question_region(
    region: str, div_id: str, anomalies: list[str]
) -> tuple[list[dict], list[dict]]:
    """A question's own `(prologue, divisions)`.

    ARTICLE-LESS QUESTIONS ARE REAL, and both sources agree on which: I q. 71
    and I q. 72 have no articles at all, and their objections, body and
    replies hang off the question itself. CCEL gives them no `div4`; Corpus
    Thomisticum titles their paragraphs `I q. 71 arg. 1`, with no `a.` --
    26 paragraphs the address matcher first rejected outright.

    An ordinary question yields all prologue and no divisions, because none
    of its paragraphs opens one; `en_divisions` collects exactly that as a
    single leading `preamble`, which is peeled off here. So one code path
    serves both shapes and neither needs a flag.

    The alternative -- inventing `a. 1` for these two questions -- was
    rejected: it would mint an address that neither source uses and that no
    citation can name, in the one place where the work's own address space
    is what everything else here is built on."""
    divisions = en_divisions(en_blocks(region), div_id, anomalies)
    prologue: list[dict] = []
    if divisions and divisions[0]["kind"] == "preamble":
        prologue = divisions[0]["blocks"]
        divisions = divisions[1:]
    return prologue, divisions


def en_divisions(blocks: list[str], div_id: str, anomalies: list[str]) -> list[dict]:
    """Group an article's paragraphs under the division each one opens.

    A paragraph with no marker continues the division above it -- the long
    `corpus` of a substantial article runs to several paragraphs, and they
    are its blocks, not four anonymous ones."""
    divisions: list[dict] = []
    for block in blocks:
        opened = en_division_of(block, seen=tuple(d["kind"] for d in divisions))
        if opened is None:
            if not divisions:
                # Prose before any marker, and before any objection: an
                # editorial note, not the argument. See `DIVISION_ORDER`.
                divisions.append({"kind": "preamble", "blocks": []})
            html_text = narrow_html(block)
            if html_text:
                divisions[-1]["blocks"].append({"html": html_text})
            continue
        kind, ordinal, rest = opened
        entry: dict = {"kind": kind}
        if ordinal is not None:
            entry["n"] = ordinal
        html_text = narrow_html(rest)
        entry["blocks"] = [{"html": html_text}] if html_text else []
        divisions.append(entry)
    for entry in divisions:
        if not entry["blocks"]:
            anomalies.append(
                f"EN: {div_id} {entry['kind']} {entry.get('n', '')} is empty"
            )
    return [d for d in divisions if d["blocks"]]


def _heading_text(region: str, level: int) -> str:
    m = _H_RE.search(region)
    if not m or int(m.group(1)) != level:
        return ""
    return strip_tags(narrow_html(m.group(2)))


def _question_sort_key(key: tuple[str, int]) -> tuple[int, int]:
    order = {"I": 0, "I-II": 1, "II-II": 2, "III": 3, "Suppl": 4}
    return order[key[0]], key[1]


# --------------------------------------------------------------------------
# Latin: the Corpus Thomisticum
# --------------------------------------------------------------------------

_CT_PAGE_RE = re.compile(r"\bsth(\d{4})\.html\b")
_CT_PARA_RE = re.compile(
    r'<P\s+TITLE="([^"]+)"[^>]*>(.*?)</P>', re.DOTALL | re.IGNORECASE
)
#: The `[28674] I q. 11 a. 4 arg. 1` label the site prints at the head of
#: every paragraph: its own anchor and address, not part of Aquinas's text.
_CT_LABEL_RE = re.compile(r'^\s*<A\s+NAME="[^"]*">.*?</A>', re.DOTALL | re.IGNORECASE)

#: `I q. 11 a. 4 arg. 1`, `I-II q. 71 pr.`, `III q. 60 a. 1 s. c. 2`.
#: Every division the two sampled parts produce is matched here; anything
#: else is reported as an anomaly rather than dropped in silence.
_CT_ADDRESS_RE = re.compile(
    r"^(?P<part>I|I-II|II-II|III)\s+q\.\s*(?P<q>\d+)\s+(?:"
    r"(?P<prologue>pr\.)"
    r"|(?:a\.\s*(?P<a>\d+)\s+)?(?:"
    r"arg\.\s*(?P<obj>\d+)"
    r"|s\.\s*c\.(?:\s*(?P<contra_n>\d+))?"
    r"|(?P<corpus>co\.)"
    r"|ad\s+(?P<reply>\d+)"
    r"|(?P<reply_arg>ad\s+arg\.)"
    r"))\s*$"
)


def ct_address(title: str) -> dict | None:
    """A Corpus Thomisticum paragraph title, parsed into an address.

    THE SOURCE STATES THIS; nothing here is inferred. `title` is the page's
    own `TITLE` attribute, and it names part, question, article and division
    explicitly -- which is why the Latin half of this scraper has no
    structural heuristics at all."""
    m = _CT_ADDRESS_RE.match(collapse_space(title))
    if not m:
        return None
    out = {"part": m.group("part"), "question": int(m.group("q"))}
    if m.group("prologue"):
        return out | {"division": "prologue"}
    # No `a.` at all: an article-less question addressing its own arguments
    # (I q. 71, I q. 72). `article` stays absent rather than becoming 1 --
    # see `split_question_region` for why that address is not invented.
    if m.group("a"):
        out["article"] = int(m.group("a"))
    if m.group("obj"):
        return out | {"division": "objection", "n": int(m.group("obj"))}
    if m.group("corpus"):
        return out | {"division": "corpus"}
    if m.group("reply"):
        return out | {"division": "reply", "n": int(m.group("reply"))}
    if m.group("reply_arg"):
        # `ad arg.` -- a reply that answers the objections together rather
        # than one by one. Stored as an unnumbered reply, which is exactly
        # what it is; giving it an invented ordinal would make it look like
        # `ad 1` to every consumer.
        return out | {"division": "reply"}
    return out | {"division": "sed-contra"}


def ct_pages(index_html: str) -> list[str]:
    """The Summa's page list, from the site's own `Opera omnia` index.

    Enumerated rather than generated: the numbering is not contiguous
    (`sth1003` is followed by `sth1015`), so a range scan would spend most of
    its requests on 404s -- against a host that publishes no robots.txt and
    has therefore granted us nothing."""
    pages = sorted({f"sth{n}.html" for n in _CT_PAGE_RE.findall(index_html)})
    # `sth0000.html` is the work's own table of contents, not text.
    return [p for p in pages if p != "sth0000.html"]


def parse_la(pages: dict[str, str]) -> tuple[list[dict], list[dict], list[str]]:
    """`(questions, structure, anomalies)` from the Corpus Thomisticum pages.

    Paragraphs arrive already addressed, so this is a grouping pass rather
    than a parse: bucket by (part, question), then by (article, division),
    keeping source order within each. Consecutive paragraphs sharing one
    address are that division's several blocks -- a long `co.` is printed as
    several `<P>`s with the same title, and they are one division."""
    questions: dict[tuple[str, int], dict] = {}
    anomalies: list[str] = []
    unmatched = 0

    for page in sorted(pages):
        for m in _CT_PARA_RE.finditer(pages[page]):
            address = ct_address(m.group(1))
            if address is None:
                unmatched += 1
                if unmatched <= 5:
                    anomalies.append(f"LA: unparsed address {m.group(1)!r} on {page}")
                continue
            body = _CT_LABEL_RE.sub("", m.group(2))
            html_text = narrow_html(body)
            if not html_text:
                continue

            key = (address["part"], address["question"])
            entry = questions.setdefault(
                key,
                {
                    "part": address["part"],
                    "n": address["question"],
                    "title": "",
                    "prologue": [],
                    "articles": [],
                },
            )
            if address["division"] == "prologue":
                entry["prologue"].append({"html": html_text})
                continue

            if "article" in address:
                divisions = _ct_article(entry, address["article"])["divisions"]
            else:
                divisions = entry.setdefault("divisions", [])
            last = divisions[-1] if divisions else None
            if (
                last is not None
                and last["kind"] == address["division"]
                and last.get("n") == address.get("n")
            ):
                last["blocks"].append({"html": html_text})
            else:
                division: dict = {"kind": address["division"]}
                if "n" in address:
                    division["n"] = address["n"]
                division["blocks"] = [{"html": html_text}]
                divisions.append(division)

    if unmatched > 5:
        anomalies.append(f"LA: {unmatched} unparsed paragraph addresses in total")

    ordered = [questions[k] for k in sorted(questions, key=_question_sort_key)]
    return ordered, la_structure(ordered), anomalies


def _ct_article(question: dict, n: int) -> dict:
    for article in question["articles"]:
        if article["n"] == n:
            return article
    article = {"n": n, "title": "", "divisions": []}
    question["articles"].append(article)
    return article


def la_structure(questions: list[dict]) -> list[dict]:
    """Parts only.

    The Corpus Thomisticum prints no treatise groupings and no question
    titles -- its pages carry the addressed text and nothing else. So the
    Latin edition's structure is the four parts, and the site's table of
    contents for it is the question list. Inventing the English edition's
    treatise names here and attaching them to the Latin would be asserting
    that this source says something it does not."""
    seen: list[dict] = []
    for question in questions:
        if not any(row["part"] == question["part"] for row in seen):
            seen.append(
                {
                    "level": 1,
                    "part": question["part"],
                    "title": f"Pars {question['part']}",
                    "before": question["n"],
                }
            )
    return seen


# --------------------------------------------------------------------------
# Output
# --------------------------------------------------------------------------

EDITIONS = {
    "en": {
        "title": "Summa Theologica",
        "short_title": "Summa (EN)",
        "language": "en",
        "edition": (
            "Fathers of the English Dominican Province, second and revised "
            "edition 1920 (Benziger Brothers, 1947), from CCEL's ThML text"
        ),
        "url": CCEL_XML_URL,
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": (
                "Translation by the Fathers of the English Dominican Province "
                "(1920); public domain by age. Electronic text from the "
                "Christian Classics Ethereal Library."
            ),
        },
    },
    "la": {
        "title": "Summa Theologiae",
        "short_title": "Summa (LA)",
        "language": "la",
        "edition": "Corpus Thomisticum, ed. Enrique Alarcon (Univ. of Navarre), Leonine-based",
        "url": "https://www.corpusthomisticum.org/iopera.html",
        "copyright": {
            "status": "public-domain",
            "holder": None,
            "notice": (
                "Latin text of St Thomas Aquinas (d. 1274); the Leonine edition "
                "(1888-1906) it follows is public domain by age. Electronic "
                "transcription by the Corpus Thomisticum, Fundacion Tomas de "
                "Aquino, which reserves rights over its own edition."
            ),
        },
    },
}


def manifest_for(
    lang: str, questions: list[dict], retrieved_at: str, notes: str
) -> dict:
    spec = EDITIONS[lang]
    parts: list[str] = []
    for question in questions:
        if question["part"] not in parts:
            parts.append(question["part"])
    return {
        "id": f"summa.{lang}",
        "type": "summa",
        "title": spec["title"],
        "short_title": spec["short_title"],
        "language": spec["language"],
        "edition": spec["edition"],
        "sources": [{"url": spec["url"], "retrieved_at": retrieved_at}],
        "copyright": spec["copyright"],
        "notes": notes,
        "generated_at": datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "parts": parts,
        "question_count": len(questions),
        "article_count": sum(len(q["articles"]) for q in questions),
    }


def _retrieved_at(out_dir: Path, fetched: int) -> str:
    """When this edition's source was actually RETRIEVED.

    Not "when this ran". A re-parse serves every page from `raw/` and makes
    no request at all, so stamping today would put a retrieval date in the
    manifest for a retrieval that did not happen -- and provenance is the one
    field in the manifest whose whole job is to be true. The project's stated
    insurance policy is that capture regret is fixed by re-parsing rather than
    re-crawling (`CLAUDE.md`), which means re-parses are the NORMAL case here,
    not an edge one.

    So: today when something was fetched, and otherwise whatever the previous
    manifest recorded. A first run with a warm cache and no prior manifest has
    no better answer than today, and says so by falling back to it.
    """
    if fetched:
        return datetime.now(UTC).strftime("%Y-%m-%d")
    try:
        previous = json.loads((out_dir / "manifest.json").read_text(encoding="utf-8"))
        sources = previous.get("sources") or []
        if sources and sources[0].get("retrieved_at"):
            return str(sources[0]["retrieved_at"])
    except (OSError, ValueError, AttributeError, IndexError):
        pass
    return datetime.now(UTC).strftime("%Y-%m-%d")


def write_outputs(
    lang: str, questions: list[dict], structure: list[dict], notes: str, fetched: int
) -> bool:
    stamp = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    out_dir = works_root() / f"summa.{lang}"
    retrieved_at = _retrieved_at(out_dir, fetched)

    manifest = manifest_for(lang, questions, retrieved_at, notes)
    applied = _EN_APPLIED if lang == "en" else []
    manifest["corrections_applied"] = len(applied)

    payloads: dict[str, object] = {
        "manifest.json": manifest,
        "structure.json": structure,
        "questions.json": questions,
    }
    remove: tuple[str, ...] = ()
    if applied:
        payloads["corrections-applied.json"] = corrections_receipt(
            f"summa.{lang}", applied, load_corrections(f"summa.{lang}"), stamp
        )
    else:
        # The receipt exists only while there is something to receipt for.
        remove = ("corrections-applied.json",)
    return write_stamped_json(out_dir, payloads, stamp, remove=remove)


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------


def validate(
    lang: str, questions: list[dict], structure: list[dict]
) -> tuple[bool, list[str]]:
    """Per-edition structural invariants.

    THESE REPLACE THE CROSS-LANGUAGE ORACLE, which this work does not have
    (see the module docstring). Each one is a claim about the work's own
    shape that a mis-parse would break, and none of them compares the two
    editions -- the Latin legitimately stops before the Supplement, and
    saying so is not the same as saying a part is missing.
    """
    problems: list[str] = []
    notes: list[str] = []
    bodiless: list[str] = []

    if not questions:
        return False, ["no questions parsed at all"], []

    seen: set[tuple[str, int]] = set()
    for question in questions:
        part, n = question["part"], question["n"]
        if (part, n) in seen:
            problems.append(f"{part} q. {n}: duplicate question")
        seen.add((part, n))

        limit = QUESTIONS_PER_PART.get(part)
        if limit is None:
            problems.append(f"{part}: unknown part label")
        elif not 1 <= n <= limit:
            problems.append(f"{part} q. {n}: outside the part's range of 1-{limit}")

        if (
            not question["articles"]
            and not question.get("divisions")
            and not question["prologue"]
        ):
            problems.append(f"{part} q. {n}: no articles, no divisions, no prologue")

        numbers = [a["n"] for a in question["articles"]]
        if numbers != sorted(numbers) or len(set(numbers)) != len(numbers):
            problems.append(
                f"{part} q. {n}: article numbers {numbers} are not a clean sequence"
            )

        for article in question["articles"]:
            where = f"{part} q. {n} a. {article['n']}"
            kinds = [d["kind"] for d in article["divisions"]]
            if not kinds:
                problems.append(f"{where}: no divisions")
                continue
            # An article always argues its own case. The one division that
            # cannot be absent is the body.
            if "corpus" not in kinds:
                # Per article this is the edition speaking, not the parser:
                # FP q. 74 a. 3 prints seven objections and seven replies with
                # no "On the contrary" and no body at all. In BULK it is the
                # signature of a broken division matcher, which is the failure
                # this check actually exists to catch -- so it is counted, and
                # the count is what can fail the run (see `bodiless` below).
                notes.append(f"{where}: no corpus (respondeo) in this edition")
                bodiless.append(where)
            objections = {
                d.get("n") for d in article["divisions"] if d["kind"] == "objection"
            }
            for division in article["divisions"]:
                if (
                    division["kind"] == "reply"
                    and division.get("n") is not None
                    and division["n"] not in objections
                ):
                    # NOT a defect, and it took a sample run to learn why.
                    # The Latin numbers more objections than this translation
                    # prints as numbered ones: where the Leonine sets out
                    # five, the English often numbers three and folds the
                    # rest into unnumbered "Further, ..." paragraphs, while
                    # still numbering all five replies. So `ad 4` with no
                    # visible `arg. 4` is what the edition says, not what the
                    # parser did to it -- reported, never failed on.
                    notes.append(
                        f"{where}: reply ad {division['n']} answers an unnumbered objection"
                    )
                if any(not b.get("html") for b in division["blocks"]):
                    problems.append(f"{where}: {division['kind']} has an empty block")
            if kinds != sorted(kinds, key=lambda k: DIVISION_ORDER[k]):
                problems.append(f"{where}: divisions out of order ({kinds})")

    for row in structure:
        if row["part"] not in QUESTIONS_PER_PART:
            problems.append(f"structure: unknown part {row['part']!r}")

    # The aggregate check the per-article note above defers to. The measured
    # rate on the full English edition is a handful in 3,110; 1% is a ceiling
    # loose enough never to fire on the edition and tight enough that a
    # division matcher that stopped working could not slip through.
    articles = sum(len(q["articles"]) for q in questions)
    if articles and len(bodiless) > max(8, articles // 100):
        problems.append(
            f"{len(bodiless)} of {articles} articles have no corpus -- "
            "that is a broken division matcher, not an edition"
        )

    return not problems, problems, notes


def compare_editions(by_lang: dict[str, list[dict]]) -> list[str]:
    """Differences between the two editions, over the parts both carry.

    Reports, never fails -- see the module docstring. The Supplement is
    excluded by construction rather than by name: a part only one edition has
    is not a disagreement about anything."""
    if len(by_lang) < 2:
        return []
    en = {(q["part"], q["n"]): q for q in by_lang.get("en", [])}
    la = {(q["part"], q["n"]): q for q in by_lang.get("la", [])}
    shared_parts = {p for p, _ in en} & {p for p, _ in la}
    notes: list[str] = []

    for key in sorted(en.keys() | la.keys(), key=_question_sort_key):
        if key[0] not in shared_parts:
            continue
        if key not in en or key not in la:
            notes.append(
                f"{key[0]} q. {key[1]}: only in summa.{'en' if key in en else 'la'}"
            )
            continue
        en_articles = {a["n"]: a for a in en[key]["articles"]}
        la_articles = {a["n"]: a for a in la[key]["articles"]}
        for n in sorted(en_articles.keys() ^ la_articles.keys()):
            side = "en" if n in en_articles else "la"
            notes.append(f"{key[0]} q. {key[1]} a. {n}: only in summa.{side}")
        for n in sorted(en_articles.keys() & la_articles.keys()):
            for kind in ("corpus", "sed-contra"):
                in_en = any(d["kind"] == kind for d in en_articles[n]["divisions"])
                in_la = any(d["kind"] == kind for d in la_articles[n]["divisions"])
                if in_en != in_la:
                    notes.append(
                        f"{key[0]} q. {key[1]} a. {n}: {kind} only in "
                        f"summa.{'en' if in_en else 'la'}"
                    )
    return notes


def print_summary(
    lang: str,
    questions: list[dict],
    structure: list[dict],
    ok: bool,
    problems: list[str],
    anomalies: list[str],
    fetches: int,
) -> None:
    articles = sum(len(q["articles"]) for q in questions)
    divisions = sum(len(a["divisions"]) for q in questions for a in q["articles"])
    blocks = sum(
        len(d["blocks"])
        for q in questions
        for a in q["articles"]
        for d in a["divisions"]
    )
    parts: list[str] = []
    for question in questions:
        if question["part"] not in parts:
            parts.append(question["part"])

    print(f"\n=== summa.{lang} ===")
    print(f"parts       : {', '.join(parts)}")
    print(f"questions   : {len(questions)}")
    print(f"articles    : {articles}")
    print(f"divisions   : {divisions} in {blocks} blocks")
    print(f"structure   : {len(structure)} headings")
    print(
        f"titles      : {sum(1 for q in questions if q['title'])} questions carry one"
    )
    for note in anomalies[:20]:
        print(f"  anomaly: {note}")
    if len(anomalies) > 20:
        print(f"  ... and {len(anomalies) - 20} more anomalies")
    if ok:
        print("validation : OK")
    else:
        print(f"validation : {len(problems)} PROBLEM(S)")
        for problem in problems[:25]:
            print(f"  - {problem}")
        if len(problems) > 25:
            print(f"  ... and {len(problems) - 25} more")
    print(f"(network fetches this run: {fetches})")


# --------------------------------------------------------------------------
# Scrape drivers
# --------------------------------------------------------------------------

EN_NOTES = (
    "Fathers of the English Dominican Province translation (1920/1947), taken "
    "from CCEL's ThML source in a single request rather than by walking 3,110 "
    "per-article pages. Includes the Supplementum (XP), which the Latin "
    "edition does not carry -- see summa.la's notes. The English edition "
    "prints no question titles for the Supplement's source and no inline "
    "emphasis anywhere: every <b> in the source marks a division "
    "(Objection/On the contrary/I answer that/Reply), and those are stored as "
    "structure rather than as text. What it does carry inline is its own "
    'cross-references: CCEL\'s <a href="#FP_Q74_A2"> links, kept as '
    '<a data-ref="summa:PART:Q[:A]">, which state each self-citation\'s '
    'target exactly where the visible text ("Q[74], A[2]", "(A[3])") '
    "only means something relative to where it is printed."
)

LA_NOTES = (
    "Corpus Thomisticum (ed. Enrique Alarcon), Leonine-based. PARTS I, I-II, "
    "II-II AND III ONLY: this source publishes no Supplementum "
    "(sth5000.html is a 404, checked 2026-08-23), the Supplement being a "
    "posthumous compilation from the Scriptum super Sententiis rather than "
    "Aquinas's own text for this work. That asymmetry with summa.en is a "
    "property of the sources and not a defect. This source also prints no "
    "question titles and no treatise groupings -- only address-titled "
    "paragraphs -- so structure.json here is the parts alone."
)


def apply_raw_text_corrections(
    xml: str, corrections: list[dict], full_run: bool
) -> tuple[str, list[dict]]:
    """Exact-substring corrections on the fetched source, BEFORE parsing.

    Pre-parse for the reason `ccc.py` and `vatican_docs.py` are: the defect
    this fixes is a DIVISION LABEL, and the division label is what the parser
    uses to decide which text belongs where. Repairing it afterwards would
    mean rewriting an article whose divisions had already been built wrong.

    The drift guard is the point (docs/decisions.md, source-defect corrections
    policy): a correction whose `from` no longer appears has either been fixed
    upstream or was wrong, and either way the run must fail rather than
    quietly emit an uncorrected work. Only enforced on a full run -- under
    `--sample` most of the work is never parsed, so a correction for the
    Supplement legitimately finds nothing."""
    applied: list[dict] = []
    for c in corrections:
        if c.get("resolution") or c["field"] != "raw_text":
            continue
        if c["from"] not in xml:
            if full_run:
                raise CorrectionDriftError(
                    f"correction {c['id']}: `from` text not found in the source. "
                    "Either the source changed or the correction is wrong; "
                    "neither may be papered over."
                )
            continue
        xml = xml.replace(c["from"], c["to"], 1)
        applied.append(dict(c))
    return xml, applied


#: Corrections applied by the most recent `run_en`, for the receipt. A module
#: level handoff rather than a widened return value: every producer here
#: returns the same four-tuple, and one language's bookkeeping should not push
#: a fifth element into every caller.
_EN_APPLIED: list[dict] = []


def run_en(
    sample: bool, **fetch_kwargs
) -> tuple[list[dict], list[dict], list[str], int]:
    fetcher = Fetcher(
        cache_dir=raw_root() / "summa-en",
        policy=CCEL_POLICY,
        decode=decode_utf8,
        **fetch_kwargs,
    )
    xml = fetcher.fetch_str(CCEL_XML_URL, "summa.xml")
    xml, applied = apply_raw_text_corrections(
        xml, load_corrections("summa.en"), full_run=not sample
    )
    _EN_APPLIED[:] = applied
    questions, structure, anomalies = parse_en(xml, sample=sample)
    prefix = [f"EN: correction applied: {c['id']}" for c in applied]
    return questions, structure, prefix + anomalies, fetcher.network_fetches


def run_la(
    sample: bool, **fetch_kwargs
) -> tuple[list[dict], list[dict], list[str], int]:
    fetcher = Fetcher(
        cache_dir=raw_root() / "summa-la",
        policy=CT_POLICY,
        decode=decode_latin1,
        **fetch_kwargs,
    )
    index = fetcher.fetch_str(CT_INDEX_URL, "iopera.html")
    pages = ct_pages(index)
    if sample:
        pages = [p for p in pages if p.startswith("sth1")]
    if not pages:
        raise SystemExit("no Summa pages found in the Corpus Thomisticum index")

    anomalies: list[str] = []
    fetched: dict[str, str] = {}
    for page in pages:
        text, error = fetcher.fetch_text(CT_PAGE_URL.format(page=page), page)
        if text is None:
            anomalies.append(f"LA: {page}: {error}")
            continue
        fetched[page] = text
    questions, structure, page_anomalies = parse_la(fetched)
    return questions, structure, anomalies + page_anomalies, fetcher.network_fetches


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--lang", choices=["en", "la", "both"], default="both")
    ap.add_argument(
        "--sample",
        action="store_true",
        help="parse the Prima Pars only, for review before a full run",
    )
    ap.add_argument(
        "--offline", action="store_true", help="cache only; a miss is an error"
    )
    ap.add_argument(
        "--refresh", action="store_true", help="refetch, ignoring the cache"
    )
    ap.add_argument(
        "--dry-run", action="store_true", help="parse and report, write nothing"
    )
    args = ap.parse_args()
    # Fail before any directory is created; see common.require_corpus().
    require_corpus()

    fetch_kwargs = {"offline": args.offline, "refresh": args.refresh}
    langs = ["en", "la"] if args.lang == "both" else [args.lang]
    overall_ok = True
    parsed: dict[str, list[dict]] = {}

    for lang in langs:
        runner = run_en if lang == "en" else run_la
        questions, structure, anomalies, fetches = runner(args.sample, **fetch_kwargs)
        parsed[lang] = questions
        ok, problems, notes = validate(lang, questions, structure)
        print_summary(
            lang, questions, structure, ok, problems, anomalies + notes, fetches
        )

        if args.sample:
            print("(--sample: nothing written; review, then run without it)")
        elif args.dry_run:
            print("(--dry-run: nothing written)")
        else:
            notes = EN_NOTES if lang == "en" else LA_NOTES
            wrote = write_outputs(lang, questions, structure, notes, fetches)
            print(f"output      : {'written' if wrote else 'unchanged'}")
        overall_ok = overall_ok and ok

    differences = compare_editions(parsed)
    if differences:
        print(f"\n=== EN/LA differences over shared parts: {len(differences)} ===")
        for note in differences[:30]:
            print(f"  - {note}")
        if len(differences) > 30:
            print(f"  ... and {len(differences) - 30} more")
    elif len(parsed) > 1:
        print("\n=== EN/LA agree on every article of every shared part ===")

    return 0 if overall_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
