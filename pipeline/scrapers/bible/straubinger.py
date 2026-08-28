#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""The Straubinger Spanish Bible, as `bible.straubinger.es`.

NO NETWORKING HAPPENS HERE. Every page this scraper reads was already fetched
into `corpus/raw/straubinger/` by `pipeline/scrapers/bible/capture.py` from
`inventories/straubinger.json` on 2026-08-28, from lasantabiblia.com.ar --
Astro-rendered, server-side, one HTML file per chapter at
`{libro}/{capitulo}.html`, plus `index.html`, `portadas.html` and
`prologo.html`. This scraper only parses what is already on disk
(`common.raw_root() / "straubinger"`) and writes `bible.straubinger.es` under
`common.build_root()`. Re-parsing never re-crawls (`docs/link-surface.md`).

BOOK NAMES COME FROM THE SOURCE'S OWN INDEX, not from this file: `portadas.html`
lists the 73 books in the schema's own canonical order (verified byte for
byte against `docs/corpus-schema.md`'s OT/NT lists), each as a link whose text
is the display name to print (`San Mateo`, `Eclesiástico`, `1 San Juan`, ...).
`SLUG_OSIS` below maps each of those 73 URL slugs to its OSIS code and is the
one thing that must be hand-maintained; the display name itself is read at
parse time so a wording change on the site is a diff, not a silent staleness.

WHAT THE MARKUP LOOKS LIKE, verified against all 1,410 captured pages before
writing a single line of this parser (see the scraper's own docblock notes
below for the two ways it breaks):

  - A verse is `<div class="versiculo" id="v-N">` wrapping a `<span
    class="v-num">N</span>`, the text in `<span class="v-texto"
    data-v="N">...</span>`, and a share-button widget that is dropped whole.
    `v-texto` never carries nested markup anywhere in this capture (checked:
    0 of 45,000+ verses).
  - Footnotes are NOT anchored to their verse in the markup. Every chapter's
    notes sit in one trailing `<div class="notas-v4">`, each `<div
    class="nota-v4-item" id="nota-N">` pairing a `<span class="nota-v4-ref">N
    </span>` with the note text -- the anchor is POSITIONAL: N is matched
    against the verse whose `data-v` is N (or, on a reset page, against
    whichever run's local N it is -- see `attach_notes_multi_run` below).
  - Structural markup above a chapter's verses: `cap-seccion` (a book Part,
    "I. Desde la Creación..."), `cap-intro` (a printed verse-span for a
    section spanning several chapters, e.g. "(12, 1 - 15, 33)"), `cap-titulo-
    txt` (a chapter's own argument OR, when paired with `cap-intro`, a
    section title), `cap-subtitulo` (a finer subsection heading mid-chapter).
    See `parse_chapter`'s "cap-titulo-txt at before_verse == 1..." comment for
    how the four map onto `summary` vs `headings` at levels 1-4.

THE TWO LANDMINES THIS PARSER EXISTS TO SURVIVE:

  1. PSALM 9 AND 113 RESET THEIR VERSE COUNTER MID-PAGE. The Vulgate's Psalm 9
     is the Hebrew Psalter's 9 and 10 combined, and 113 is 114 and 115
     combined; this source's PAGE numbering is already Vulgate (its own note
     at Ps 9:21 says so: "...comenzando con el versículo 22 el Salmo 10"), but
     it renders each constituent Hebrew psalm with its OWN verse counter, so
     `data-v` runs 1-21 then restarts 1-18 on the Ps 9 page (39 total -- the
     Vulgate count), and 1-8 then 1-18 on the Ps 113 page (26 total). Detected
     by the local counter genuinely going back to 1 (in `parse_chapter`);
     corroborated, never trusted alone, by a Word-export artifact bleeding
     into the boundary verse's text (next point).
  2. `if !supportFootnotes endif` IS A LEFTOVER WORD CONDITIONAL-COMMENT
     ARTIFACT, present in 1,354 verses (essentially one per chapter, always at
     the chapter's own last verse) and ALWAYS stripped. In 52 of those it is
     not alone: real content rides along after it, because the site's
     template collapsed a following element into the same text node. Three
     kinds, and only three, appear in this capture (audited by hand, all 52):
       - 21 are Psalm 118's Hebrew stanza letters (BET, GUIMEL, ... TAU) --
         the acrostic's own division headings, glued onto the last verse of
         the PRECEDING 8-verse stanza. Recovered as `headings` on the verse
         that follows. ALEF (before v.1) is not one of them -- it is simply
         absent from the source, and is left absent here rather than invented.
       - 2 are the Ps 9 / Ps 113 split markers ("Salmo 9 b (10)", "Salmo 113 b
         (115)"), corroborating landmine 1.
       - 29 are ORPHANED NOTES: real apparatus text with nowhere else to live,
         because the source's own `<div class="nota-v4-item">` for that note
         never rendered. Recovered as an unanchored `notes[]` entry (a marker,
         no `text_marked` token -- docs/corpus-schema.md's "a note need not
         have a token") on the verse it was found glued to. One of these
         (Josue 12) is itself a continuation of another orphaned note's
         sentence, cut across a phantom verse -- see `PHANTOM_VERSES`.

EIGHTEEN CHAPTERS ALSO MISLABEL ONE OR MORE VERSE NUMBERS (21 corrections in
all) -- unrelated to either landmine above. Seventeen were found by scanning
every chapter for a local counter that goes backward WITHOUT reaching 1; the
eighteenth (Exodus 20) never decreases -- it jumps 25 straight to 28 with
nothing labelled 26 or 27 anywhere on the page -- and was found instead by
`edition_check.py` flagging a chapter whose verse COUNT matches
bible.clementina.la but whose numbering does not. Each was individually
verified against its neighbours' content (and, for `tob 5`, against the
chapter's own note text, which anchors to the corrected number) before being
filed in `pipeline/corrections/bible.straubinger.es.json`; none of them is a
Vulgate/Hebrew versification question, all of them are a `data-v` a template
got wrong by one. `john 18` is the one genuine exception: it is not a
mislabelling at all but Straubinger's own placement of John 18:24 immediately
after v.13 (a known displacement in some traditions), printed a second time
at its numeric slot as a bare editorial pointer ("[Va después del 13]") that
carries no content of its own -- the edition being itself, not a defect, so
it stays handled inline in `parse_chapter` by occurrence count on raw label
"24", never filed as a correction.

THESE 21 GO THROUGH THE AUDITED `pipeline/corrections/` LAYER, unlike the
artifact-stripping and note-anchoring above: a mangled tag or a misplaced
note changes nothing a reader reads, but a wrong verse NUMBER is the address
a reader cites, and changing it changes what the source is recorded as
having said -- precisely the class CLAUDE.md's "Corrections and overrides"
reserves for `pipeline/corrections/`, locator/before/after/reason/evidence,
never a code special-case. `field: "verse_number"` is the same field
`kaldi.py`'s `apply_verse_number_corrections` introduced for the identical
defect class in the Hungarian edition (bible.kaldi.hu), applied here with the
same matching and the same loud failure on drift; see
`load_verse_number_corrections`, `build_verse_fixes` and
`apply_verse_number_corrections` below for the one addition this edition
needed (an `occurrence` key in the locator, because a mislabelled verse here
usually collides with a real verse of the same printed number elsewhere in
the chapter).

Usage:
    python3 pipeline/scrapers/bible/straubinger.py
"""

from __future__ import annotations

import html as html_lib
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

# `common` is a package one directory up; see cpdv.py for why this line sits
# above the imports rather than the imports being at the top of the file.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import (
    CorrectionDriftError,
    build_root,
    captured_at,
    chapter_opening_letter,
    corrections_receipt,
    load_corrections,
    raw_root,
    require_corpus,
    write_stamped_json,
)

RAW_SUBDIR = "straubinger"
WORK_ID = "bible.straubinger.es"
SITE_BASE = "https://lasantabiblia.com.ar"

# --------------------------------------------------------------------------
# The 73-book table: OSIS code, source's own URL slug, canonical order.
# docs/corpus-schema.md "Canonical book order". Verified 2026-08-28 that
# `portadas.html` lists exactly these 73 slugs in exactly this order.
# --------------------------------------------------------------------------
SLUG_OSIS: list[tuple[str, str]] = [
    ("gen", "genesis"),
    ("exod", "exodo"),
    ("lev", "levitico"),
    ("num", "numeros"),
    ("deut", "deuteronomio"),
    ("josh", "josue"),
    ("judg", "jueces"),
    ("ruth", "rut"),
    ("1sam", "1samuel"),
    ("2sam", "2samuel"),
    ("1kgs", "1reyes"),
    ("2kgs", "2reyes"),
    ("1chr", "1cronicas"),
    ("2chr", "2cronicas"),
    ("ezra", "esdras"),
    ("neh", "nehemias"),
    ("tob", "tobias"),
    ("jdt", "judit"),
    ("esth", "ester"),
    ("1macc", "1macabeos"),
    ("2macc", "2macabeos"),
    ("job", "job"),
    ("ps", "salmos"),
    ("prov", "proverbios"),
    ("eccl", "eclesiastes"),
    ("song", "cantares"),
    ("wis", "sabiduria"),
    ("sir", "eclesiastico"),
    ("isa", "isaias"),
    ("jer", "jeremias"),
    ("lam", "lamentaciones"),
    ("bar", "baruc"),
    ("ezek", "ezequiel"),
    ("dan", "daniel"),
    ("hos", "oseas"),
    ("joel", "joel"),
    ("amos", "amos"),
    ("obad", "abdias"),
    ("jonah", "jonas"),
    ("mic", "miqueas"),
    ("nah", "nahum"),
    ("hab", "habacuc"),
    ("zeph", "sofonias"),
    ("hag", "ageo"),
    ("zech", "zacarias"),
    ("mal", "malaquias"),
    ("matt", "mateo"),
    ("mark", "marcos"),
    ("luke", "lucas"),
    ("john", "juan"),
    ("acts", "hechos"),
    ("rom", "romanos"),
    ("1cor", "1corintios"),
    ("2cor", "2corintios"),
    ("gal", "galatas"),
    ("eph", "efesios"),
    ("phil", "filipenses"),
    ("col", "colosenses"),
    ("1thess", "1tesalonicenses"),
    ("2thess", "2tesalonicenses"),
    ("1tim", "1timoteo"),
    ("2tim", "2timoteo"),
    ("titus", "tito"),
    ("phlm", "filemon"),
    ("heb", "hebreos"),
    ("jas", "santiago"),
    ("1pet", "1pedro"),
    ("2pet", "2pedro"),
    ("1john", "1juan"),
    ("2john", "2juan"),
    ("3john", "3juan"),
    ("jude", "judas"),
    ("rev", "apocalipsis"),
]
assert len(SLUG_OSIS) == 73, f"expected 73 books, got {len(SLUG_OSIS)}"

# Curated jump-box abbreviations. Common Spanish-language forms; anything not
# listed falls back to [osis, name-without-spaces-lowercased].
_CURATED_ABBREVS: dict[str, list[str]] = {
    "gen": ["gn"],
    "exod": ["ex"],
    "lev": ["lv"],
    "num": ["nm"],
    "deut": ["dt"],
    "josh": ["jos"],
    "judg": ["jue", "jc"],
    "ruth": ["rt"],
    "1sam": ["1sm", "1s"],
    "2sam": ["2sm", "2s"],
    "1kgs": ["1re", "1r"],
    "2kgs": ["2re", "2r"],
    "1chr": ["1cr"],
    "2chr": ["2cr"],
    "ezra": ["esd"],
    "neh": ["ne"],
    "tob": ["tb"],
    "jdt": ["jdt"],
    "esth": ["est"],
    "1macc": ["1ma", "1mac"],
    "2macc": ["2ma", "2mac"],
    "job": ["jb"],
    "ps": ["sal", "salmo", "salmos"],
    "prov": ["pr"],
    "eccl": ["qo", "ecl"],
    "song": ["ct", "cantar"],
    "wis": ["sb", "sab"],
    "sir": ["eclo", "si"],
    "isa": ["is"],
    "jer": ["jr"],
    "lam": ["lm"],
    "bar": ["ba"],
    "ezek": ["ez"],
    "dan": ["dn"],
    "hos": ["os"],
    "joel": ["jl"],
    "amos": ["am"],
    "obad": ["ab", "abd"],
    "jonah": ["jon"],
    "mic": ["mi", "miq"],
    "nah": ["na"],
    "hab": ["ha"],
    "zeph": ["so", "sof"],
    "hag": ["ag"],
    "zech": ["za"],
    "mal": ["ml"],
    "matt": ["mt"],
    "mark": ["mc", "mr"],
    "luke": ["lc"],
    "john": ["jn"],
    "acts": ["hch", "hech"],
    "rom": ["rm"],
    "1cor": ["1co"],
    "2cor": ["2co"],
    "gal": ["ga"],
    "eph": ["ef"],
    "phil": ["flp", "fil"],
    "col": ["col"],
    "1thess": ["1ts"],
    "2thess": ["2ts"],
    "1tim": ["1tm"],
    "2tim": ["2tm"],
    "titus": ["tt"],
    "phlm": ["flm"],
    "heb": ["hb"],
    "jas": ["st", "sant"],
    "1pet": ["1p"],
    "2pet": ["2p"],
    "1john": ["1jn"],
    "2john": ["2jn"],
    "3john": ["3jn"],
    "jude": ["jud"],
    "rev": ["ap", "apoc"],
}


def abbrevs_for(osis: str, name: str) -> list[str]:
    bare = re.sub(r"\s*\([^)]*\)", "", name)
    base = [osis, bare.lower().replace(" ", "")]
    seen: list[str] = []
    for a in base + _CURATED_ABBREVS.get(osis, []):
        if a not in seen:
            seen.append(a)
    return seen


# --------------------------------------------------------------------------
# The 18-chapter, 21-correction single-verse mislabelling class (landmine,
# third kind -- see docblock) goes through the audited corrections layer,
# `pipeline/corrections/bible.straubinger.es.json` (CLAUDE.md "Corrections
# and overrides"; docs/decisions.md SS Corrections and overrides): the
# source's own printed verse ADDRESS is wrong, which is exactly the class
# that layer exists for -- a verse number is not markup, it is what a reader
# cites. `field: "verse_number"` is the same field `kaldi.py`'s
# `apply_verse_number_corrections` introduced for the identical defect class
# in the Hungarian edition, applied here with the same matching and the same
# loud failure on drift (`apply_verse_number_corrections` below); the
# `occurrence` key in the locator is this edition's own addition, needed
# because a mislabelled verse here usually collides with a real verse of the
# same printed number elsewhere in the chapter, and the raw label alone does
# not say which of the two a correction means.
# --------------------------------------------------------------------------


def load_verse_number_corrections() -> list[dict]:
    return load_corrections(WORK_ID)


def build_verse_fixes(
    corrections: list[dict],
) -> dict[tuple[str, int], dict[tuple[str, int], tuple[str, str]]]:
    """`(osis, chapter) -> {(from label, occurrence): (to label, correction id)}`,
    the shape `parse_chapter` looks fixes up in. Built once per run from the
    filed corrections rather than hand-maintained, so the table and its
    evidence live in exactly one place."""
    fixes: dict[tuple[str, int], dict[tuple[str, int], tuple[str, str]]] = {}
    for c in corrections:
        if c.get("field") != "verse_number" or c.get("resolution"):
            continue
        loc = c["locator"]
        key = (loc["osis"], loc["chapter"])
        occ = loc.get("occurrence", 1)
        fixes.setdefault(key, {})[(str(c["from"]), occ)] = (str(c["to"]), c["id"])
    return fixes


def apply_verse_number_corrections(
    fixes: dict[tuple[str, int], dict[tuple[str, int], tuple[str, str]]],
    applied_ids: set[str],
    corrections: list[dict],
) -> None:
    """The full-run drift guard `kaldi.py`'s function of the same name has:
    every filed, unresolved `verse_number` correction must have matched
    something during parsing, or the source has drifted since the entry was
    written and the run must fail loudly rather than ship a work whose
    corrections silently stopped applying. Unlike `kaldi.py`, this can only
    be checked AFTER every chapter has been parsed -- `parse_chapter` records
    into `applied_ids` as it goes, since (osis, chapter) here maps to a
    document scanned once, not a mutable dict a correction can probe ahead of
    time -- so this runs once, at the end, rather than per entry."""
    missing = [
        c["id"]
        for c in corrections
        if c.get("field") == "verse_number"
        and not c.get("resolution")
        and c["id"] not in applied_ids
    ]
    if missing:
        raise CorrectionDriftError(
            f"verse-number correction(s) never matched during the run: {missing} "
            "(source drift -- re-verify against raw/straubinger/ and update or "
            "remove the entry)"
        )


# Phantom verse elements: not verses at all, but a broken continuation of an
# orphaned note's own sentence, wrapped by the template in a spurious
# `<div class="versiculo">`. Excluded from the verse list; their text is
# appended to the orphaned note recovered from the chapter's real last verse.
# (osis, chapter) -> (raw label, occurrence) to drop.
PHANTOM_VERSES: dict[tuple[str, int], tuple[str, int]] = {
    ("josh", 12): ("2", 2),
}

# John 18:24 (see docblock): Straubinger prints the verse's real text right
# after v.13 (with a trailing "]" this parser drops) and again, at its numeric
# slot after v.23, as a content-free editorial pointer, "[Va después del 13]"
# -- handled inline in `parse_chapter` by occurrence count on raw label "24".

# Two chapters print a trailing heading with nothing left in the same file to
# attach it to (`next_verse_after` finds no following verse). The general
# case is a template ordering slip -- the heading was meant to sit BEFORE the
# chapter's own last verse and prints after it instead, so it reattaches
# there (Judges 3's trailing "El juez Samgar" describes v.31, the chapter's
# last verse, alone: Shamgar's whole one-verse story). Baruc 5 is the
# exception: its two trailing headings ("Apéndice", "Carta de jeremías a los
# desterrados") describe Baruc 6 in full -- the Letter of Jeremiah, printed
# there as its own chapter with no heading of its own -- so they are
# suppressed from chapter 5 and injected at the head of chapter 6 instead.
SUPPRESS_TRAILING_HEADING: set[tuple[str, int, str]] = {
    ("bar", 5, "Apéndice"),
    ("bar", 5, "Carta de jeremías a los desterrados"),
}
INJECT_LEADING_HEADINGS: dict[tuple[str, int], list[tuple[str, str]]] = {
    ("bar", 6): [
        ("cap-seccion", "Apéndice"),
        ("cap-titulo-txt", "Carta de jeremías a los desterrados"),
    ],
}

# The acrostic Psalm 118 (119)'s 22 Hebrew stanza letters, in order from the
# second (ALEF, before v.1, is never printed in this capture -- see docblock).
HEBREW_STANZA_LETTERS = {
    "BET",
    "GUIMEL",
    "DALET",
    "HE",
    "VAU",
    "ZAIN",
    "HET",
    "TET",
    "YOD",
    "CAF",
    "LAMED",
    "MEM",
    "NUN",
    "SAMEC",
    "AYIN",
    "PE",
    "SADE",
    "QOF",
    "RESCH",
    "SIN",
    "TAU",
}

WORD_ARTIFACT_RE = re.compile(
    r"if !supportFootnotes\s*endif(.*)$", re.IGNORECASE | re.DOTALL
)
SPLIT_MARKER_RE = re.compile(r"^Salmo \d+ b \(\d+\)$")
GENERAL_NOTE_LOCATOR_RE = re.compile(r"^\*\s*(\d+)")
#: A note whose entire text is a bare run of ascending integers starting at 2
#: is not apparatus at all -- it is the site's OWN chapter-navigation widget
#: (`caps-nums`), leaked into a `nota-v4-item` wrapper. Verified against every
#: one of the 36 instances this matches (every chapter of Numbers, id
#: "nota-1", always the literal text "2 3 4 ... 36" -- Numbers' own chapter
#: count): real Straubinger apparatus prose never has this shape.
CHAPTER_NAV_LEAK_RE = re.compile(r"^2(\s+\d+)*$")

TOKEN_RE = re.compile(
    r'<div class="(cap-seccion|cap-intro|cap-titulo-txt|cap-subtitulo)"[^>]*>(.*?)</div>'
    r'|<span class="v-texto" data-v="(\d+)"[^>]*>(.*?)</span>',
    re.DOTALL,
)
NOTE_RE = re.compile(
    r'<div class="nota-v4-item" id="([^"]+)"[^>]*>.*?'
    r'<span class="nota-v4-ref"[^>]*>(.*?)</span>\s*'
    r'<span class="nota-v4-txt"[^>]*>(.*?)</span>',
    re.DOTALL,
)

HEADING_LEVEL = {
    "cap-seccion": 1,
    "cap-intro": 2,
    "cap-titulo-txt": 3,
    "cap-subtitulo": 4,
}


def clean_text(raw: str) -> str:
    """Unescape entities, collapse whitespace, trim -- the schema's plain-text
    rule (docs/corpus-schema.md "Bible book files")."""
    return re.sub(r"\s+", " ", html_lib.unescape(raw)).strip()


class Anomaly:
    def __init__(self, osis: str, chapter: int, detail: str):
        self.osis, self.chapter, self.detail = osis, chapter, detail


def raw_dir() -> Path:
    return raw_root() / RAW_SUBDIR


def work_dir() -> Path:
    return build_root() / WORK_ID


def load_book_names() -> dict[str, str]:
    """slug -> display name, read off `portadas.html`'s own 73-book index."""
    html = (raw_dir() / "portadas.html").read_text(encoding="utf-8")
    names: dict[str, str] = {}
    for slug, inner in re.findall(
        r'href="/biblia/([a-z0-9]+)/?"[^>]*>(.*?)</a>', html, re.DOTALL
    ):
        if slug in names:
            continue
        names[slug] = clean_text(re.sub(r"<[^>]+>", "", inner))
    return names


# --------------------------------------------------------------------------
# Per-chapter parsing
# --------------------------------------------------------------------------


def classify_artifact_trailing(
    trailing: str,
    osis: str,
    chapter: int,
    local_before_strip: int,
    anomalies: list[Anomaly],
) -> tuple[str | None, str | None, dict | None]:
    """What follows a stripped `if !supportFootnotes endif` (see docblock).

    Returns (kind, text, extra) where kind is "letter", "split", "orphan" or
    None (nothing followed). `extra` carries the Hebrew letter's own text for
    "letter", and is unused otherwise."""
    if not trailing:
        return None, None, None
    if trailing in HEBREW_STANZA_LETTERS:
        return "letter", trailing, None
    if SPLIT_MARKER_RE.match(trailing):
        return "split", trailing, None
    anomalies.append(
        Anomaly(
            osis,
            chapter,
            f"orphaned note text recovered from v.{local_before_strip}'s trailing "
            f"Word-export artifact: {trailing[:60]!r}...",
        )
    )
    return "orphan", trailing, None


def parse_chapter(
    osis: str,
    chapter_n: int,
    raw_html: str,
    anomalies: list[Anomaly],
    verse_fixes: dict[tuple[str, int], dict[tuple[str, int], tuple[str, str]]],
    applied_correction_ids: set[str],
) -> dict:
    fixes = verse_fixes.get((osis, chapter_n), {})
    phantom = PHANTOM_VERSES.get((osis, chapter_n))
    occurrence_count: dict[str, int] = {}

    # ---- Pass 1: tokenize headings and verses in document order. ----------
    tokens: list[tuple] = []  # ("heading", cls, text) | ("verse", raw_label, text)
    for cls, text in INJECT_LEADING_HEADINGS.get((osis, chapter_n), []):
        tokens.append(("heading", cls, text))
    for m in TOKEN_RE.finditer(raw_html):
        if m.group(1):
            tokens.append(("heading", m.group(1), clean_text(m.group(2))))
        else:
            tokens.append(("verse", m.group(3), clean_text(m.group(4))))

    # ---- Pass 2: verses -- overrides, phantom drop, John 18 displacement,
    #      artifact stripping, continuous (reset-aware) numbering. ----------
    verses: list[dict] = []
    heading_specs: list[dict] = []  # {"cls","text","token_index"}
    verse_token_index: list[int] = []  # parallel to `verses`, for heading before_verse
    john18_pointer_seen = False
    phantom_text: str | None = None

    local_prev = 0
    offset = 0
    run_index = 0
    for idx, tok in enumerate(tokens):
        if tok[0] == "heading":
            heading_specs.append({"cls": tok[1], "text": tok[2], "token_index": idx})
            continue

        _, raw_label, text = tok
        occurrence_count[raw_label] = occurrence_count.get(raw_label, 0) + 1
        occ = occurrence_count[raw_label]

        if phantom == (raw_label, occ):
            phantom_text = text
            continue

        if osis == "john" and chapter_n == 18 and raw_label == "24":
            if not john18_pointer_seen and occ == 1:
                # The real, displaced verse 24 -- printed right after v.13.
                text = re.sub(r"\s*\]\s*$", "", text)
                local = 24
                anomalies.append(
                    Anomaly(
                        osis,
                        chapter_n,
                        "v.24 printed immediately after v.13 (Straubinger's own "
                        "placement); its normal numeric slot carries only the "
                        "editorial pointer '[Va después del 13]', dropped",
                    )
                )
            else:
                # The content-free pointer at v.24's numeric slot.
                john18_pointer_seen = True
                continue
        else:
            fix = fixes.get((raw_label, occ))
            if fix is not None:
                corrected, correction_id = fix
                applied_correction_ids.add(correction_id)
                anomalies.append(
                    Anomaly(
                        osis,
                        chapter_n,
                        f"source mislabels a verse '{raw_label}' (occurrence {occ}); "
                        f"corrected to {corrected} per {correction_id} "
                        "(pipeline/corrections/bible.straubinger.es.json)",
                    )
                )
                local = int(corrected)
            else:
                local = int(raw_label)

        # Artifact stripping (landmine 2), corroborating landmine 1 when it's
        # a split marker.
        m = WORD_ARTIFACT_RE.search(text)
        recovered_heading: tuple[str, str] | None = None
        pending_note: str | None = None
        if m:
            text = clean_text(text[: m.start()])
            kind, trailing, _ = classify_artifact_trailing(
                clean_text(m.group(1)), osis, chapter_n, local, anomalies
            )
            if kind in ("letter", "split"):
                recovered_heading = (kind, trailing)
            elif kind == "orphan":
                pending_note = trailing

        # Landmine 1: a genuine restart to 1 (never a mere decrease -- see
        # docblock and the corpus-wide audit behind this threshold).
        if local == 1 and local_prev > 1:
            offset = verses[-1]["n"] if verses else 0
            run_index += 1
            anomalies.append(
                Anomaly(
                    osis,
                    chapter_n,
                    f"verse counter resets to 1 after local {local_prev} -- "
                    f"renumbered continuously from {offset + 1}",
                )
            )
        continuous = local + offset
        local_prev = local

        verse: dict = {
            "n": continuous,
            "text": text,
            "_local": local,
            "_run": run_index,
        }
        if pending_note:
            verse.setdefault("_orphans", []).append(pending_note)
        if recovered_heading:
            kind, txt = recovered_heading
            level = 4 if kind == "letter" else 2
            # before_verse = the verse AFTER this one -- the heading trails
            # the closing verse of the division it follows.
            heading_specs.append(
                {
                    "cls": None,
                    "text": txt,
                    "level": level,
                    "before_after": continuous + 1,
                }
            )
        verses.append(verse)
        verse_token_index.append(idx)

    # Merge the Josue 12 phantom fragment into whatever orphan note already
    # landed on the chapter's real last verse (see PHANTOM_VERSES docblock).
    if phantom_text and verses:
        last = verses[-1]
        if last.get("_orphans"):
            last["_orphans"][-1] = clean_text(last["_orphans"][-1] + " " + phantom_text)
        else:
            last.setdefault("_orphans", []).append(clean_text(phantom_text))

    if not verses:
        return {"n": chapter_n, "verses": []}

    # ---- Pass 3: resolve heading before_verse from token position. --------
    def next_verse_after(token_index: int) -> int | None:
        for vi, ti in zip((v["n"] for v in verses), verse_token_index, strict=True):
            if ti > token_index:
                return vi
        return None

    resolved_headings: list[dict] = []
    for spec in heading_specs:
        if spec.get("cls") is None:
            resolved_headings.append(
                {
                    "before_verse": spec["before_after"],
                    "level": spec["level"],
                    "text": spec["text"],
                }
            )
            continue
        bv = next_verse_after(spec["token_index"])
        if bv is None:
            if (osis, chapter_n, spec["text"]) in SUPPRESS_TRAILING_HEADING:
                # Belongs to the next chapter instead -- see
                # INJECT_LEADING_HEADINGS and this module's docblock.
                continue
            # No verse follows in this file: the template printed the
            # heading after the verse it describes rather than before it
            # (Judges 3's "El juez Samgar" describes v.31, the chapter's own
            # last verse, alone). Reattach there rather than lose it.
            bv = verses[-1]["n"]
            anomalies.append(
                Anomaly(
                    osis,
                    chapter_n,
                    f"heading {spec['text']!r} precedes no verse in this chapter -- "
                    f"reattached before its last verse ({bv}) instead of dropped",
                )
            )
        resolved_headings.append(
            {
                "before_verse": bv,
                "level": HEADING_LEVEL[spec["cls"]],
                "text": spec["text"],
                "cls": spec["cls"],
            }
        )

    # cap-titulo-txt at before_verse == 1 is the chapter's own SUMMARY, unless
    # a cap-intro also sits at before_verse == 1 -- in that case it names a
    # multi-chapter section instead (see the module docblock).
    summary = None
    first_v = verses[0]["n"]
    at_first = [h for h in resolved_headings if h["before_verse"] == first_v]
    has_intro_at_first = any(h.get("cls") == "cap-intro" for h in at_first)
    if not has_intro_at_first:
        for h in at_first:
            if h.get("cls") == "cap-titulo-txt":
                summary = h["text"]
                resolved_headings.remove(h)
                break

    for h in resolved_headings:
        h.pop("cls", None)

    # ---- Notes: attach numbered notes and general (asterisk) notes. -------
    notes = [
        (m.group(1), m.group(2).strip(), clean_text(m.group(3)))
        for m in NOTE_RE.finditer(raw_html)
    ]
    attach_notes(osis, chapter_n, verses, notes, anomalies)

    # Fold the recovered orphan-note text (from artifact stripping) in too.
    for v in verses:
        orphans = v.pop("_orphans", None)
        if orphans:
            v.setdefault("notes", [])
            for i, text in enumerate(orphans, start=1):
                v["notes"].append({"marker": f"artifact{i}", "text": text})
        v.pop("_local", None)
        v.pop("_run", None)

    chapter: dict = {"n": chapter_n, "verses": sorted(verses, key=lambda v: v["n"])}
    if summary:
        chapter["summary"] = summary
    if resolved_headings:
        chapter["headings"] = sorted(
            resolved_headings, key=lambda h: (h["before_verse"], h["level"])
        )
    return chapter


def add_note(verse: dict, marker: str, text: str) -> None:
    """Append a note to `verse`, disambiguating `marker` if it is already in
    use there.

    The source itself sometimes prints two genuinely different notes with the
    same visible ref on one verse (`nota-3` and `nota-3-13` both showing "3"
    on Matt 5:3 -- the second is really about vv.31-32's divorce teaching, its
    own ref span simply wrong). Both are real content; only the schema's
    marker needs to be unique, so a collision gets a `-2`, `-3`, ... suffix
    rather than losing the second note."""
    existing = {n["marker"] for n in verse.get("notes", [])}
    final, i = marker, 2
    while final in existing:
        final = f"{marker}-{i}"
        i += 1
    verse.setdefault("notes", []).append({"marker": final, "text": text})


def attach_notes(
    osis: str,
    chapter_n: int,
    verses: list[dict],
    notes: list[tuple[str, str, str]],
    anomalies: list[Anomaly],
) -> None:
    """Match each chapter's notes to a verse.

    Every verse still carries the `_local`/`_run` pair `parse_chapter` stamped
    on it (stripped by the caller right after this returns): `_local` is the
    number as printed (post-override), `_run` is which reset-run it belongs
    to (0 for every chapter except Psalms 9 and 113, which have two)."""
    if not notes or not verses:
        return

    kept_notes = []
    for nid, ref, text in notes:
        if CHAPTER_NAV_LEAK_RE.match(text):
            anomalies.append(
                Anomaly(
                    osis,
                    chapter_n,
                    f"note {nid} is the chapter-navigation widget leaked into a note "
                    f"wrapper (text {text[:30]!r}...) -- dropped, not apparatus",
                )
            )
            continue
        kept_notes.append((nid, ref, text))
    notes = kept_notes

    huerfano_notes = [
        (nid, ref, text) for nid, ref, text in notes if nid.startswith("nota-huerfana")
    ]
    numeric_notes = [
        (nid, ref, text)
        for nid, ref, text in notes
        if ref.isdigit() and not nid.startswith("nota-huerfana")
    ]
    general_notes = [(nid, ref, text) for nid, ref, text in notes if not ref.isdigit()]

    n_runs = len({v["_run"] for v in verses})
    if n_runs == 1:
        by_local = {v["_local"]: v for v in verses}
        for nid, ref, text in numeric_notes:
            target = by_local.get(int(ref))
            if target is None:
                anomalies.append(
                    Anomaly(osis, chapter_n, f"note {nid} (ref {ref}) matches no verse")
                )
                continue
            add_note(target, ref, text)
    else:
        attach_notes_multi_run(osis, chapter_n, verses, numeric_notes, anomalies)

    # `nota-huerfana-{ref}-{suffix}`: the site's OWN name for a note whose
    # named verse never got its own rendered unit on this page -- a title
    # line folded into no verse (Psalm 121:1, "Cántico gradual") or a mid-
    # chapter number the template simply skipped (Numbers 2:32, between
    # rendered v.31 and v.33). Attached to the nearest verse that DOES exist,
    # in either direction; `ref` is not reused as `marker` since two of these
    # can name the same missing number (Psalm 121:1 has two).
    for nid, ref, text in huerfano_notes:
        target = min(verses, key=lambda v: abs(v["_local"] - int(ref)))
        anomalies.append(
            Anomaly(
                osis,
                chapter_n,
                f"note {nid} names verse {ref}, which this page never renders as "
                f"its own unit -- attached to the nearest rendered verse {target['n']}",
            )
        )
        suffix = nid.rsplit("-", 1)[-1]
        add_note(target, f"gap{ref}-{suffix}", text)

    for nid, _ref, text in general_notes:
        gm = GENERAL_NOTE_LOCATOR_RE.match(text)
        if not gm:
            anomalies.append(
                Anomaly(
                    osis, chapter_n, f"general note {nid} names no verse: {text[:40]!r}"
                )
            )
            continue
        vnum = int(gm.group(1))
        target = next((v for v in verses if v["n"] == vnum), None)
        if target is None:
            anomalies.append(
                Anomaly(
                    osis,
                    chapter_n,
                    f"general note {nid} names verse {vnum}, not present",
                )
            )
            continue
        add_note(target, f"gen{vnum}", text)


def attach_notes_multi_run(
    osis: str,
    chapter_n: int,
    verses: list[dict],
    numeric_notes: list[tuple[str, str, str]],
    anomalies: list[Anomaly],
) -> None:
    """Notes for a reset chapter (Psalm 9 or 113): local refs repeat across
    runs (each verse already knows its own `_run` from `parse_chapter`), so
    which run a NOTE belongs to has to be read off the notes' own order
    instead. A run switch fires on either signal: the ref decreasing (Ps 9,
    where run 0's refs climb to 21 before run 1 restarts low) or the ref
    exceeding the current run's own maximum local verse (Ps 113, where run
    0's refs 1-8 never decrease before run 1 begins at a ref already beyond
    8). Both were required -- each alone misreads the other psalm."""
    run_locals: list[dict[int, dict]] = []
    for v in verses:
        while len(run_locals) <= v["_run"]:
            run_locals.append({})
        run_locals[v["_run"]][v["_local"]] = v
    run_maxima = [max(d) for d in run_locals]

    run_idx = 0
    last_ref = 0
    for nid, ref, text in numeric_notes:
        r = int(ref)
        if (r <= last_ref or r > run_maxima[run_idx]) and run_idx + 1 < len(run_locals):
            run_idx += 1
            last_ref = 0
        target = run_locals[run_idx].get(r)
        if target is None:
            anomalies.append(
                Anomaly(
                    osis,
                    chapter_n,
                    f"note {nid} (ref {ref}) matches no verse in run {run_idx}",
                )
            )
            continue
        add_note(target, ref, text)
        last_ref = r


# --------------------------------------------------------------------------
# Driving the whole corpus
# --------------------------------------------------------------------------


def run_scrape(
    verse_fixes: dict[tuple[str, int], dict[tuple[str, int], tuple[str, str]]],
    applied_correction_ids: set[str],
) -> tuple[list[dict], list[Anomaly]]:
    names = load_book_names()
    anomalies: list[Anomaly] = []
    book_docs: list[dict] = []
    for order, (osis, slug) in enumerate(SLUG_OSIS, start=1):
        name = names.get(slug)
        if not name:
            raise SystemExit(f"{slug}: no display name found in portadas.html")
        book_dir = raw_dir() / slug
        chapter_files = sorted(
            (p for p in book_dir.glob("*.html") if p.stem.isdigit()),
            key=lambda p: int(p.stem),
        )
        if not chapter_files:
            raise SystemExit(f"{slug}: no chapter files captured under {book_dir}")
        chapters = []
        for path in chapter_files:
            n = int(path.stem)
            raw_html = path.read_text(encoding="utf-8")
            chapters.append(
                parse_chapter(
                    osis, n, raw_html, anomalies, verse_fixes, applied_correction_ids
                )
            )
        book_docs.append(
            {
                "osis": osis,
                "name": name,
                "abbrevs": abbrevs_for(osis, name),
                "order": order,
                "chapters": chapters,
            }
        )
    return book_docs, anomalies


def validate(book_docs: list[dict]) -> tuple[bool, list[str]]:
    ok = True
    report: list[str] = []

    def fail(msg: str) -> None:
        nonlocal ok
        ok = False
        report.append(f"FAIL: {msg}")

    if len(book_docs) != 73:
        fail(f"expected 73 books, got {len(book_docs)}")

    lower_letter_openings = 0
    for b in book_docs:
        for ch in b["chapters"]:
            if not ch["verses"]:
                fail(f"{b['osis']} {ch['n']}: no verses")
                continue
            seen = set()
            prev = 0
            for v in ch["verses"]:
                if v["n"] in seen:
                    fail(f"{b['osis']} {ch['n']}:{v['n']}: duplicate verse number")
                if v["n"] <= prev:
                    fail(
                        f"{b['osis']} {ch['n']}: verse {v['n']} out of order after {prev}"
                    )
                seen.add(v["n"])
                prev = v["n"]
                if "  " in v["text"] or v["text"] != v["text"].strip():
                    fail(f"{b['osis']} {ch['n']}:{v['n']}: whitespace not normalized")
            opening = chapter_opening_letter(ch["verses"][0]["text"])
            if opening is not None and opening.islower():
                lower_letter_openings += 1
                if lower_letter_openings <= 5:
                    report.append(
                        f"NOTE: {b['osis']} {ch['n']}:{ch['verses'][0]['n']} opens on "
                        f"lowercase {opening!r}"
                    )
    if lower_letter_openings > 5:
        report.append(
            f"NOTE: {lower_letter_openings} chapters total open on a lowercase letter"
        )

    return ok, report


def census(book_docs: list[dict]) -> dict[str, int]:
    chapters = verses = notes = headings = summaries = 0
    for b in book_docs:
        for ch in b["chapters"]:
            chapters += 1
            summaries += 1 if ch.get("summary") else 0
            headings += len(ch.get("headings") or [])
            for v in ch["verses"]:
                verses += 1
                notes += len(v.get("notes") or [])
    return {
        "books": len(book_docs),
        "chapters": chapters,
        "verses": verses,
        "notes": notes,
        "headings": headings,
        "chapter_summaries": summaries,
    }


def write_output(book_docs: list[dict], generated_at: str, receipt: dict) -> None:
    retrieved = (
        captured_at(raw_dir() / "portadas.html") or datetime.now(UTC).date().isoformat()
    )

    notes = (
        "Mons. Juan Straubinger's Spanish translation \"from the original Hebrew "
        'and Greek texts" (1944-1951), captured 2026-08-28 from '
        "lasantabiblia.com.ar (Astro-rendered mirror, 1,410 pages). Straubinger "
        "died in 1956; Argentina and Brazil run copyright as life+70 from 1 "
        "January following the author's death, so the term ends 1 January "
        "2027 -- a knowingly accepted, self-resolving exposure of the same "
        "kind docs/research/copyright.md records for bible.matos-soares.pt. "
        "Psalter is Vulgate-numbered: Psalms 9 and 113 combine two "
        "Hebrew-numbered sub-psalms per page and are renumbered continuously "
        "here (39 and 26 verses respectively), corroborated by the source's "
        "own note at 9:21. The apparatus cites Kings in the four-Kingdoms "
        "scheme (I-IV Reyes) while book titles are modern (1/2 Samuel, 1/2 "
        "Reyes); note text is stored verbatim and left for the site's "
        "reference grammar to resolve, not rewritten here. Straubinger's "
        "per-book introductions are substantial and are not ingested as part "
        "of this work -- they belong in a future bible-intro.es. 18 chapters "
        "carry one or more mislabelled verse numbers in the source (21 "
        "corrections total), each filed in "
        "pipeline/corrections/bible.straubinger.es.json with its own "
        "reason and evidence; John "
        "18 prints v.24 immediately after v.13 (the source's own placement, "
        "not a defect) with a content-free pointer left at its numeric slot. "
        "52 verses carry a leftover Word-export artifact "
        '("if !supportFootnotes endif") whose trailing content, where '
        "present, is recovered as a heading or an unanchored note rather "
        "than discarded; Psalm 118's ALEF stanza heading is genuinely absent "
        "from the source and is not invented here. 29 notes are the site's "
        "own id=\"nota-huerfana-*\" ('orphan note') markup for a note whose "
        "named verse the page never renders as its own unit (a title line "
        "folded into no verse, or a mid-chapter number the template skipped) "
        "-- attached to the nearest verse that does exist. 36 bogus notes "
        "(the chapter-navigation widget's own number list, leaked into a "
        "note wrapper on every chapter of Numbers) are dropped, not stored. "
        "2 Samuel 13:4 is genuinely absent from this transcription -- no "
        'data-v="4" appears anywhere on that page -- and is left as a gap '
        "rather than invented or renumbered around."
    )

    manifest = {
        "id": WORK_ID,
        "type": "bible",
        "title": "Biblia Straubinger",
        "short_title": "Straubinger",
        "language": "es",
        "edition": "1944-1951, traducida de los textos originales hebreo y griego",
        "sources": [
            {"url": f"{SITE_BASE}/biblia/portadas/", "retrieved_at": retrieved}
        ],
        "copyright": {
            "status": "copyrighted",
            "holder": "Juan Straubinger",
            "notice": None,
        },
        "notes": notes,
        "generated_at": generated_at,
        "psalm_numbering": "vulgate",
        "books": [b["osis"] for b in book_docs],
    }

    manifest["corrections_applied"] = receipt["count"]

    write_stamped_json(
        work_dir(),
        {
            "manifest.json": manifest,
            "corrections-applied.json": receipt,
            **{f"books/{b['osis']}.json": b for b in book_docs},
        },
        generated_at,
    )


def main() -> int:
    require_corpus()

    corrections = load_verse_number_corrections()
    verse_fixes = build_verse_fixes(corrections)
    applied_correction_ids: set[str] = set()

    book_docs, anomalies = run_scrape(verse_fixes, applied_correction_ids)
    counts = census(book_docs)

    try:
        apply_verse_number_corrections(verse_fixes, applied_correction_ids, corrections)
    except CorrectionDriftError as exc:
        print(f"\nCORRECTIONS DRIFT GUARD FAILED: {exc}", file=sys.stderr)
        return 1

    print(f"{'book':<8} {'chapters':>8} {'verses':>8} {'notes':>6}")
    print("-" * 34)
    for b in book_docs:
        nv = sum(len(c["verses"]) for c in b["chapters"])
        nn = sum(len(v.get("notes") or []) for c in b["chapters"] for v in c["verses"])
        print(f"{b['osis']:<8} {len(b['chapters']):>8} {nv:>8} {nn:>6}")
    print("-" * 34)
    print(
        f"{'TOTAL':<8} {counts['chapters']:>8} {counts['verses']:>8} {counts['notes']:>6}"
    )
    print(
        f"\nheadings: {counts['headings']}, chapter summaries: {counts['chapter_summaries']}"
    )

    if anomalies:
        print(f"\n{len(anomalies)} source anomalies noted during parsing:")
        for a in anomalies:
            print(f"  [{a.osis} {a.chapter}] {a.detail}")

    ok, report = validate(book_docs)
    print()
    for line in report:
        print(line)
    print("VALIDATION: " + ("PASS" if ok else "FAIL"))
    if not ok:
        print("\nRefusing to write a work that failed validation.", file=sys.stderr)
        return 1

    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    receipt = corrections_receipt(
        WORK_ID,
        [c for c in corrections if c["id"] in applied_correction_ids],
        corrections,
        generated_at,
    )
    print(
        f"\nCorrections layer: {receipt['count']} applied, "
        f"{len(receipt['unresolved'])} documented unresolved/not-a-defect "
        "(see corrections-applied.json)"
    )

    write_output(book_docs, generated_at, receipt)
    print(f"\nWrote {len(book_docs)} book file(s) to {work_dir()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
