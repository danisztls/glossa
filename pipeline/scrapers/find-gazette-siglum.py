#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Acta Sanctae Sedis cited as `AAS`, found by measuring an edition against
itself.

WHY THIS EXISTS. The Holy See's gazette was the *Acta Sanctae Sedis* from 1865
to 1908 and the *Acta Apostolicae Sedis* from 1909, and the corpus cites the
older one 194 times under the later siglum. Read as AAS those are real volumes
forty years wrong, and the site's reference grammar refuses every one of them
on the printed year (`site/src/lib/refs-grammar.ts`, the two gazette sections)
-- so the citation resolves to nothing, in a family where the same footnote in
a sibling language resolves.

WHAT MAKES ONE A DEFECT RATHER THAN A CONVENTION, and it is the only test that
matters here: THE EDITION ITSELF. An edition that writes `ASS` at some pre-1909
citations and `AAS` at others contradicts its own practice, and the ones it
writes correctly are the witness -- no cross-language argument needed, and none
offered. Latin Lumen gentium prints ASS eighteen times and AAS once; English
nine and eight.

WHAT IT REFUSES TO PROPOSE, each refusal principled:

  * AN EDITION THAT NEVER WRITES `ASS`. 56 editions and 134 citations, and
    this is the important refusal. Czech Lumen gentium writes AAS at all
    seventeen of its pre-1909 citations, which is that edition's practice and
    not a slip; correcting it would impose the Latin's usage on an edition
    that consistently does otherwise, and `docs/decisions.md` on corrections
    forbids exactly that -- "never wording, never modernization". These are
    reported as leads under `--practice` and filed nowhere.
  * A VOLUME AND YEAR THAT ARE NOT AN ASS ROW. `AAS 29 (1896-1807)` in the
    Spanish Lumen gentium is the right volume with an OCR'd year, so the two
    tokens do not agree and nothing here knows which one is wrong. A second,
    separately-argued defect; reported, never bundled into this one.
  * A `from` THAT CANNOT BE MADE UNIQUE in the raw page. `raw_text` entries
    are matched by string and replaced once (`apply_raw_text_corrections`),
    so an ambiguous `from` silently corrects the wrong occurrence.
  * A CITATION THE PARSE DOES NOT CARRY. Without a section and marker the
    entry cannot say where it is, and a locator nobody can check is worse
    than none.

Everything it proposes changes exactly one character, `A` to `S`, inside a
citation the edition already writes both ways. Output is a proposal: read
every entry against the page before filing it.

    ./find-gazette-siglum.py vatii.lumen-gentium.la      # propose, to stdout
    ./find-gazette-siglum.py --practice                  # the refused class
    ./find-gazette-siglum.py --write vatii.lumen-gentium.en
"""

import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

import common

BUILD = common.build_root()
RAW = common.corpus_dir() / "raw" / "vatican-docs"
# Tracked source, which follows this checkout rather than the corpus -- the
# same split `vatican_docs.py` documents under "NOTE ON THE ROOTS".
SOURCE_ROOT = Path(__file__).resolve().parents[2]
CORRECTIONS = SOURCE_ROOT / "pipeline" / "corrections"

#: Volume -> the years it carries, read off the Vatican's own index
#: (`/archive/ass/index_en.htm`, 2026-09-03). The site holds the same 41 rows
#: with the filenames beside them (`ASS_VOLUMES` in `refs-grammar.ts`); this
#: copy carries only the years, because a proposer needs to know which volume
#: a year belongs to and nothing about where the scan is published. Neither
#: derives from the other, and neither should: the index is the authority, and
#: a generated proposal is read by hand before it is filed.
ASS_YEARS = {
    1: (1865, 1866),
    2: (1867, 1867),
    3: (1867, 1867),
    4: (1868, 1868),
    5: (1869, 1870),
    6: (1870, 1871),
    7: (1872, 1873),
    8: (1874, 1875),
    9: (1876, 1876),
    10: (1877, 1877),
    11: (1878, 1878),
    12: (1879, 1879),
    13: (1880, 1880),
    14: (1881, 1881),
    15: (1882, 1882),
    16: (1883, 1884),
    17: (1884, 1884),
    18: (1885, 1885),
    19: (1886, 1887),
    20: (1887, 1887),
    21: (1888, 1888),
    22: (1889, 1890),
    23: (1890, 1891),
    24: (1891, 1892),
    25: (1892, 1893),
    26: (1893, 1894),
    27: (1894, 1895),
    28: (1895, 1896),
    29: (1896, 1897),
    30: (1897, 1898),
    31: (1898, 1899),
    32: (1899, 1900),
    33: (1900, 1901),
    34: (1901, 1902),
    35: (1902, 1903),
    36: (1903, 1904),
    37: (1904, 1905),
    38: (1905, 1906),
    39: (1906, 1906),
    40: (1907, 1907),
    41: (1908, 1908),
}

#: The siglum, then whatever the typesetter put between it and the volume --
#: a closing `</i>`, an entity, a comma, spaces -- then the volume and the
#: year, span and closing bracket included. Swahili prints
#: `<i>AAS </i>29 (1896-97)`, so a pattern that demanded adjacency would find
#: none of that edition's seventeen; and the match runs to the closing bracket
#: so that a proposed `from` never cuts a year in half.
GAP = r"(?:</?[a-zA-Z][^>]*>|&[a-zA-Z#0-9]+;|[\s.,])*"
RAW_RE = re.compile(
    rf"\b(AAS|ASS)\b({GAP})(\d{{1,3}}|[IVXLC]{{1,7}})\s*[\(\[](\d{{4}})"
    rf"(?:\s*[-\u2010\u2011\u2013\u2014/]\s*\d{{2,4}})?\s*[\)\]]"
)
TAG = re.compile(r"<[^>]*>")

ROMAN = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100}


def roman(token: str) -> int | None:
    total, previous = 0, 0
    for ch in reversed(token):
        value = ROMAN.get(ch)
        if value is None:
            return None
        total += -value if value < previous else value
        previous = max(previous, value)
    return total or None


def volume_of(token: str) -> int | None:
    return int(token) if token.isdigit() else roman(token)


def is_ass_volume(token: str, year: int) -> int | None:
    """The volume this names, if the printed year agrees that it is ASS."""
    volume = volume_of(token)
    if volume is None or volume not in ASS_YEARS:
        return None
    return volume if year in ASS_YEARS[volume] else None


def raw_path(work_id: str):
    family, slug, lang = work_id.split(".")
    return RAW / f"{family}__{slug}__{lang}.html"


#: The same shape as `RAW_RE` over text the parse has already stripped of
#: markup -- no `GAP`, because there are no tags left to step over.
PARSED_RE = re.compile(r"\b(AAS|ASS)\b[\s.,]*(\d{1,3}|[IVXLC]{1,7})\s*[\(\[](\d{4})")


def parsed_defects(work_id: str) -> list[tuple[int, str, str, int, int]]:
    """`(section, marker, text, volume, year)` per pre-1909 AAS the parse
    carries, in document order -- the same order and the same count as
    `survey`'s defects, which is what lets the two be zipped."""
    path = BUILD / work_id / "sections.json"
    if not path.exists():
        return []
    out = []
    for section in json.loads(path.read_text(encoding="utf-8")):
        for citation in section.get("citations") or []:
            text = citation.get("text", "")
            for m in PARSED_RE.finditer(TAG.sub("", text)):
                sigil, token, year_text = m.groups()
                year = int(year_text)
                # The SAME test the raw side applies, and it has to be: a list
                # filtered one way cannot be zipped against a list filtered
                # another, and the failure is a wrong locator rather than an
                # error. Spanish `AAS 29 (1896-1807)` is the case -- a lead on
                # one side and a defect on the other until this matched.
                volume = is_ass_volume(token, year) if sigil == "AAS" else None
                if volume is not None and year <= 1908:
                    out.append(
                        (section["n"], citation.get("marker", ""), text, volume, year)
                    )
    return out


#: A proposed `from` carries this much of the sentence before the siglum even
#: where fewer characters would already be unique. Uniqueness is what makes
#: the entry correct (`apply_raw_text_corrections` replaces the FIRST match and
#: consults no locator); context is what makes it reviewable, and lets it
#: survive a page that grows another citation of the same volume.
FROM_CONTEXT = 48


def unique_from(html: str, start: int, end: int) -> str | None:
    """The match with its sentence, widened left until the page holds it once."""
    for left in range(max(0, start - FROM_CONTEXT), max(-1, start - 260), -12):
        candidate = html[left:end]
        if html.count(candidate) == 1:
            return candidate
    return None


def corrected_html(work_id: str) -> str:
    """The raw page as the PARSER sees it: already-filed corrections applied.

    Without this the tool is not idempotent, and worse, it is confusing in the
    one state that matters -- run it after filing, and the raw page still holds
    the defect (corrections never touch `raw/`) while the parse no longer does,
    so the two lists disagree and every entry is refused as unlocatable. Same
    substring replacement, same order, same first-match-only rule as
    `apply_raw_text_corrections`.
    """
    html = raw_path(work_id).read_text(encoding="utf-8", errors="replace")
    path = CORRECTIONS / f"{work_id}.json"
    if not path.exists():
        return html
    for c in json.loads(path.read_text(encoding="utf-8")):
        if c.get("resolution") or c.get("field") != "raw_text":
            continue
        html = html.replace(c["from"], c["to"], 1)
    return html


def survey(work_id: str):
    """Every pre-1909 gazette citation in one edition, sorted into three."""
    html = corrected_html(work_id)
    correct, defects, leads = 0, [], []
    for m in RAW_RE.finditer(html):
        sigil, _gap, token, year_text = m.groups()
        year = int(year_text)
        if year > 1908:
            continue
        if sigil == "ASS":
            correct += 1
            continue
        volume = is_ass_volume(token, year)
        if volume is None:
            leads.append((m.group(0), "volume and year disagree -- a second defect"))
            continue
        defects.append((m, volume, year))
    return correct, defects, leads


def entries_for(work_id: str) -> tuple[list[dict], list[str]]:
    correct, defects, leads = survey(work_id)
    notes = [f"{leads_text}" for _, leads_text in leads]
    if not defects:
        return [], notes
    if correct == 0:
        notes.append(
            f"{len(defects)} citation(s) refused: this edition never writes ASS, "
            "so its practice is uniform and there is no witness inside it."
        )
        return [], notes

    html = corrected_html(work_id)
    # THE RAW PAGE AND THE PARSE ARE ZIPPED, NOT SEARCHED. Both walk the
    # document in order and the parse is derived from the page, so the nth
    # defect in one is the nth in the other -- and asserting that is a far
    # stronger check than looking each up, which quietly mis-locates a
    # footnote that carries two of them (Lumen gentium's English section 8
    # cites volumes 22 and 28 in one note). A disagreement of length or of
    # value means the two are not the same list, and nothing here is then
    # entitled to say where a defect is.
    located = parsed_defects(work_id)
    if len(located) != len(defects) or any(
        (volume, year) != (lv, ly)
        for (_, volume, year), (_, _, _, lv, ly) in zip(defects, located, strict=True)
    ):
        notes.append(
            f"the raw page holds {len(defects)} defect(s) and the parse "
            f"{len(located)}, or they disagree in order -- nothing proposed, "
            "because no locator here can be trusted."
        )
        return [], notes
    slug = work_id.split(".")[1]
    short = "".join(part[0] for part in slug.split("-"))
    lang = work_id.split(".")[2]
    out = []
    for (m, volume, year), (section, marker, text, _, _) in zip(
        defects, located, strict=True
    ):
        frm = unique_from(html, m.start(), m.end())
        if frm is None:
            notes.append(
                f"{m.group(0)!r}: no unique `from` within 260 chars -- not proposed"
            )
            continue
        out.append(
            {
                "id": f"vatii.{short}.{lang}-sec{section}-fn{marker}-ass{volume}",
                "locator": {"section": section, "marker": marker},
                "field": "raw_text",
                "from": frm,
                "to": frm.replace("AAS", "ASS", 1),
                "reason": (
                    f"The gazette was the Acta Sanctae Sedis until 1908 and the Acta "
                    f"Apostolicae Sedis from 1909, and the printed year says which this "
                    f"is: volume {volume} of the ASS is {'-'.join(dict.fromkeys(str(y) for y in ASS_YEARS[volume]))}, "
                    f"while AAS {volume} is {1908 + volume}. Read as printed the citation "
                    f"names a real volume {abs(1908 + volume - year)} years from the "
                    f"document it cites. THE WITNESS IS THIS EDITION ITSELF, which writes "
                    f"ASS at {correct} other pre-1909 citation(s) and AAS here; no sibling "
                    f"language is relied on. One character changes and nothing else."
                    + (
                        " The witness is in THIS FOOTNOTE: it writes both sigla, a few "
                        "words apart, for two volumes of the same gazette."
                        if "ASS" in TAG.sub("", text).replace("AAS", "")
                        else ""
                    )
                ),
                "evidence": (
                    f"raw/vatican-docs/{raw_path(work_id).name}: {frm!r}. "
                    f"The parse carries this as section {section}, footnote {marker}: "
                    f"{TAG.sub('', text).strip()!r}."
                ),
                "added": datetime.now(UTC).date().isoformat(),
            }
        )
    return out, notes


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    works = args or sorted(
        p.name for p in BUILD.iterdir() if p.is_dir() and raw_path_exists(p.name)
    )

    if "--practice" in flags:
        for work_id in works:
            try:
                correct, defects, _ = survey(work_id)
            except OSError:
                continue
            if defects and correct == 0:
                print(f"{work_id:<44} {len(defects)} citation(s), 0 written ASS")
        return 0

    for work_id in works:
        try:
            entries, notes = entries_for(work_id)
        except OSError as exc:
            print(f"{work_id}: {exc}", file=sys.stderr)
            continue
        for note in notes:
            print(f"# {work_id}: {note}", file=sys.stderr)
        if not entries:
            continue
        text = json.dumps(entries, indent=2, ensure_ascii=False) + "\n"
        if "--write" in flags:
            path = CORRECTIONS / f"{work_id}.json"
            if path.exists():
                print(
                    f"# {work_id}: {path.name} exists -- not overwritten",
                    file=sys.stderr,
                )
                continue
            path.write_text(text, encoding="utf-8")
            print(f"wrote {path.relative_to(SOURCE_ROOT)} ({len(entries)} entries)")
        else:
            print(f"=== {work_id} ({len(entries)} entries)")
            print(text)
    return 0


def raw_path_exists(work_id: str) -> bool:
    return work_id.count(".") == 2 and raw_path(work_id).exists()


if __name__ == "__main__":
    raise SystemExit(main())
