#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""One document's raw blocks, joined against what the parser kept — the
evidence an agent needs to judge a parse without reading 400 KB of HTML.

WHY THIS EXISTS. `docs/research/description-pass-2026-08.md` records the
methodological error that cost batch 1 a false negative: an agent asked
whether a document has sub-headings answered by grepping `sections.json`, and
could not possibly have found them, because the headings' defect is that they
are MISSING FROM THAT FILE. A negative from parsed output means "no headings
survived the parse", never "no headings exist". Only `raw/` can answer it.

Batch 2's brief fixed that by requiring a raw check, but left every agent to
invent its own way of reading a 16-424 KB page of `<font>` soup. Method
variation is what produced the batch-1 error in the first place, so this makes
the reading uniform and cheap: one line per block, longest text truncated,
with the parser's verdict on that block beside it.

WHY IT DOES NOT REUSE `_BLOCK_RE`. The parser sees `<p>`, `<blockquote>` and
`<center>`. Measured over all 466 raw pages, **1.24% of body text lies outside
those three tags** — 47,559 characters in `lumen-fidei.pt` alone, where the
source stops wrapping paragraphs at all. An extractor built on the parser's
own regex inherits the parser's blind spot, and the blind spot is the thing
under audit. So blocks here are cut at EVERY block-level boundary, and text
belonging to no tag is emitted as its own unit rather than dropped.

Over-inclusiveness is the point. A block the census hides is a heading the
agent cannot find, so the filter is length (headings are short) and never
markup — being wrong about markup is precisely the defect class being hunted.

  ./census.py encyclical.evangelium-vitae.pt            # blocks + parse verdict
  ./census.py encyclical.rerum-novarum.en --headings    # only short/unkept blocks
  ./census.py vatii.lumen-gentium.en --json
"""

from __future__ import annotations

import argparse
import html as ihtml
import json
import re
import sys
from pathlib import Path

import common
import vatican_docs as V

# Every tag that ends a line of running text. `br` is included: the pages that
# stop wrapping paragraphs in `<p>` still separate them with `<br>`, and those
# are exactly the documents whose text leaks past `_BLOCK_RE`.
BLOCK_TAGS = (
    "p|blockquote|center|div|td|tr|table|li|ul|ol|dl|dt|dd|"
    "h1|h2|h3|h4|h5|h6|hr|br|body|form|section|article|main|header|footer|nav"
)
_SPLIT_RE = re.compile(rf"<\s*/?\s*(?:{BLOCK_TAGS})(?=[\s/>])[^>]*>", re.IGNORECASE)

# A heading is short. 200 chars is generous — the longest real heading found in
# the corpus census is under 150 — and generous is the right side to err on.
HEADING_MAX_CHARS = 200


def body_region(html: str) -> str:
    """Body as `parse_document` delimits it. Mirrors `audit.body_region`."""
    html = V.strip_transparent_spans(html)
    testo = re.search(r'class="testo"', html)
    if testo:
        end = re.search(r"/TESTO", html[testo.start() :], re.IGNORECASE)
        # After the opening tag, matching `parse_document` -- see the note
        # there on why starting at the attribute mattered.
        tag_end = html.find(">", testo.start())
        start = tag_end + 1 if tag_end != -1 else testo.start()
        region = html[start : testo.start() + end.start()] if end else html[start:]
    else:
        region = html[V.find_content_start_old_shell(html) :]
    fn_start, _ = V.find_footnote_region_start(region)
    return region if fn_start is None else region[:fn_start]


def split_blocks(body: str) -> list[str]:
    """Each block-level unit, in document order, WITH ITS OWN OPENING TAG.

    Cuts at every block boundary rather than matching open/close pairs, so
    unwrapped text between two tags becomes its own unit instead of vanishing.
    Nested containers therefore yield an empty slice for the outer element,
    which `census` drops on the text test below.

    The opening tag is prepended rather than discarded because the block's
    alignment lives in its own attributes -- `<p align="center">`,
    `<p style="text-align: center">`. Splitting them away made `shape()`
    structurally incapable of reporting centering, so every centered heading
    in the corpus showed a blank shape while the parser detected them fine.
    """
    out, prev_tag, prev_end = [], "", 0
    for m in _SPLIT_RE.finditer(body):
        out.append(prev_tag + body[prev_end : m.start()])
        prev_tag, prev_end = m.group(0), m.end()
    out.append(prev_tag + body[prev_end:])
    return out


def shape(raw: str) -> list[str]:
    """The markup facts that heading detection turns on, named not judged.

    Deliberately reports what the source did — centered, bold, italic — and
    leaves 'is this a heading' to the reader. Four of the heading variants
    found in batch 2 were markup the parser's own predicate called false.
    """
    tags = []
    # Both spellings. The old shell writes `align="center"`; the modern one
    # writes `style="text-align: center"`, and reporting only the first showed
    # a blank shape for all 42 centered headings in `dilexit-nos.en` -- which
    # the parser itself detects perfectly well.
    if (
        re.search(r"align\s*=\s*[\"']?center", raw, re.IGNORECASE)
        or re.search(r"text-align\s*:\s*center", raw, re.IGNORECASE)
        or "<center" in raw.lower()
    ):
        tags.append("center")
    if re.search(r"align\s*=\s*[\"']?left", raw, re.IGNORECASE) or re.search(
        r"text-align\s*:\s*left", raw, re.IGNORECASE
    ):
        tags.append("left")
    text = V.strip_tags(raw)
    if text:
        bold = V.strip_tags(" ".join(V._BOLD_SPAN_RE.findall(raw)))
        italic = V.strip_tags(
            " ".join(m.group(0) for m in V._ITALIC_SPAN_RE.finditer(raw))
        )
        if bold and bold == text:
            tags.append("all-bold")
        elif bold:
            tags.append("part-bold")
        if italic and italic == text:
            tags.append("all-italic")
        elif italic:
            tags.append("part-italic")
    if re.search(r"font-weight\s*:\s*(?:bold|[6-9]00)", raw, re.IGNORECASE):
        tags.append("css-bold")
    return tags


def _is_heading_line(text: str, title: str) -> bool:
    """Is `text` one whole line of the multi-line heading `title`?

    Word-boundary anchored on purpose. A bare `in` test matched "o amor
    conjugal" inside "AS CARACTERISTICAS DO AMOR CONJUGAL" -- catching the
    tail of "do" -- and so reported a heading that the parser had actually
    lost as one it had kept.
    """
    return (
        text == title
        or title.startswith(text + " ")
        or title.endswith(" " + text)
        or f" {text} " in title
    )


_JOIN_SEP_RE = re.compile(r"[\s\u00a0]*[-\u2010-\u2015:.]+[\s\u00a0]*")


def join_key(text: str) -> str:
    """A heading reduced to its words, with the punctuation that separates a
    division label from its name thrown away.

    The parser splits a heading into `ident` and `title`; the SOURCE prints
    them on one line, joined however that page happens to punctuate it --
    `CHAPTER I - PRINCIPLES OF DOCTRINE`, `ARTICLE 1: Christian Witness`.
    Comparing the raw line against the two fields separately matches neither,
    so a correctly-parsed heading was reported DROPPED. That false negative
    cost four documents' readers a wasted investigation each
    (redemptoris-mater, redemptoris-missio, ad-gentes, evangelium-vitae)
    before it was recognised as a defect in this tool rather than the parser.

    `_is_heading_line` covers the opposite shape -- the source printing ONE
    heading across two blocks -- and is not a substitute: there the raw text
    is a PART of the stored title, here it is the WHOLE of two stored fields.
    """
    return " ".join(_JOIN_SEP_RE.sub(" ", text).split())


_MARKER_RE = re.compile(f"{V.MARK_OPEN}[^{V.MARK_CLOSE}]*{V.MARK_CLOSE}")


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", ihtml.unescape(s)).strip().lower()


def census(corpus: Path, work_id: str) -> dict:
    family, slug, lang = work_id.split(".")
    page = corpus / "raw" / "vatican-docs" / f"{family}__{slug}__{lang}.html"
    if not page.exists():
        raise SystemExit(f"no raw page for {work_id}: {page}")
    work = corpus / "works" / work_id

    body = body_region(page.read_text(encoding="utf-8", errors="replace"))
    # The parser marks footnote references and then stores the text WITHOUT
    # them, so a raw block reading "...Encyclical,[48] is not..." never
    # matches the stored "...Encyclical, is not..." and every test below
    # falls through to DROPPED. Three separate readers reported paragraphs as
    # lost content on that basis alone. Marked here with the document's own
    # template -- the same one `parse_document` detects -- so both sides of
    # every comparison have their markers removed rather than one.
    marker_template = V.detect_marker_template(body)

    kept_text = ""
    kept_blocks: set[str] = set()  # each stored block on its own, see `kept?` below
    if (work / "sections.json").exists():
        for section in json.loads((work / "sections.json").read_text()):
            for block in section["blocks"]:
                kept_blocks.add(norm(V.strip_tags(block.get("html", ""))))
            joined = " ".join(
                V.strip_tags(b.get("html", "")) for b in section["blocks"]
            )
            kept_text += " " + norm(joined)
    # AN UNNUMBERED EDITION KEEPS ITS TEXT IN `appendix.json`, NOT
    # `sections.json`. Reading only the latter scored every body paragraph of
    # such a work DROPPED -- all 35 blocks of `rerum-orientalium.it`, a
    # document with nothing wrong with it. The same blind spot reported the
    # trailing block after `optatam-totius.en`'s CONCLUSION as lost.
    if (work / "appendix.json").exists():
        for entry in json.loads((work / "appendix.json").read_text()):
            blocks = entry.get("blocks", []) if isinstance(entry, dict) else []
            for block in blocks:
                kept_blocks.add(norm(V.strip_tags(block.get("html", ""))))
            kept_text += " " + norm(
                " ".join(V.strip_tags(b.get("html", "")) for b in blocks)
            )
    structure_titles = set()
    structure_joined = set()
    if (work / "structure.json").exists():
        for node in json.loads((work / "structure.json").read_text()):
            parts = []
            for field in ("ident", "title", "subtitle"):
                if node.get(field):
                    structure_titles.add(norm(node[field]))
                    parts.append(norm(node[field]))
            # Every leading run of the node's fields, so a source line that
            # prints `IDENT - TITLE` matches whether or not the node also
            # carries a subtitle the page set on its own line.
            for cut in range(2, len(parts) + 1):
                structure_joined.add(join_key(" ".join(parts[:cut])))

    rows = []
    for index, raw in enumerate(split_blocks(body)):
        text = _MARKER_RE.sub("", V.strip_tags(V.mark_footnotes(raw, marker_template)))
        if not text:
            continue
        number = None
        m = re.match(r"^(\d{1,4})\s*\.\s*", text)
        if m:
            number = int(m.group(1))
            text = text[m.end() :]
            if not text:
                continue
        # Matched WITHOUT the paragraph-number prefix, because the parser strips
        # it (`mark_and_split`) before storing. Comparing with it in place scores
        # every correctly-parsed numbered paragraph as DROPPED.
        n = norm(text)
        if n in structure_titles or (n and join_key(n) in structure_joined):
            verdict = "heading"
        elif n and any(_is_heading_line(n, title) for title in structure_titles):
            # A heading printed on two lines is ONE node: `merge_heading_lines`
            # joins the division label, its name and any subtitle. Each raw
            # line is still its own block here, so an exact-match test scores
            # both halves DROPPED and invents content loss that did not happen
            # -- 16 such rows in `lumen-gentium.pt` alone.
            verdict = "heading*"
        elif n in kept_blocks:
            verdict = "kept"
        elif (
            n
            and len(n) <= HEADING_MAX_CHARS
            and any(other.startswith(n) and other != n for other in kept_blocks)
        ):
            # A LOST HEADING CAN IMPERSONATE A KEPT ONE. `humanae-vitae.pt`
            # prints "O amor conjugal" as a heading and opens the next
            # paragraph "O amor conjugal exprime a sua verdadeira natureza",
            # so a containment test says kept while the heading is in fact
            # gone from both the sections and the structure tree. Reported as
            # unresolved rather than guessed either way.
            verdict = "kept?"
        elif n and n in kept_text:
            verdict = "kept"
        elif n and len(n) > 12 and n[:60] in kept_text:
            verdict = "kept*"  # kept, but not byte-identical
        else:
            verdict = "DROPPED"
        rows.append(
            {
                "i": index,
                "n": number,
                "verdict": verdict,
                "shape": shape(raw),
                "chars": len(text),
                "text": text if len(text) <= 300 else text[:300] + "…",
            }
        )
    return {"work": work_id, "blocks": rows}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("work", help="work id, e.g. encyclical.evangelium-vitae.pt")
    ap.add_argument(
        "--headings",
        action="store_true",
        help="only blocks short enough to be a heading, or dropped",
    )
    ap.add_argument(
        "--dropped", action="store_true", help="only blocks the parse did not keep"
    )
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    result = census(common.require_corpus(), args.work)
    rows = result["blocks"]
    if args.headings:
        rows = [
            r
            for r in rows
            if r["chars"] <= HEADING_MAX_CHARS or r["verdict"] == "DROPPED"
        ]
    if args.dropped:
        rows = [r for r in rows if r["verdict"] == "DROPPED"]

    if args.json:
        json.dump({**result, "blocks": rows}, sys.stdout, indent=1, ensure_ascii=False)
        print()
        return 0

    counts: dict[str, int] = {}
    for row in result["blocks"]:
        counts[row["verdict"]] = counts.get(row["verdict"], 0) + 1
    print(
        f"{result['work']}: {len(result['blocks'])} blocks  "
        + "  ".join(f"{k}={v}" for k, v in sorted(counts.items()))
    )
    print(f"{'i':>4} {'§':>4} {'verdict':<8} {'shape':<26} text")
    for row in rows:
        print(
            f"{row['i']:4} {row['n'] or '':>4} {row['verdict']:<8} "
            f"{','.join(row['shape']):<26} {row['text'][:110]}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
