#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""What the corpus asks of the Fathers, parsed rather than guessed at.

A tool over already-written output, like `audit.py`, `census.py` and
`bible/divergence.py`: no requests, no work written, nothing ingested.

WHY THIS EXISTS. `docs/research/summa-and-fathers.md` recommended, in place of
ingesting a patristic library, that the citations already captured be PARSED —
"94% of the 1,244 patristic citations carry a work-internal locator ... quite
apart from the Migne column", so `{author, work, locator}` is derivable from
text fetched months ago at zero cost and zero rights exposure. That survey did
its own counting with regexes over whole strings and said so, listing the
consequences in its own "Honest gaps": the family count was a floor, the
author table left 34% unmatched against a hand-built list, and the work titles
were never counted at all. This is the parser it asked for, and
`docs/research/patristic-citations.md` is what it measures.

WHAT A PATRISTIC CITATION LOOKS LIKE, and what is extracted from it:

    St. Irenaeus, Adv. haeres. 3, 20, 2: PG 7/1, 944
    └── author ──┘  └── work ──┘└locator┘  └─ Migne ─┘

The Migne column is the discriminator and the least useful part: it addresses
a page of a scan nobody here can read. The locator is the address that would
survive into any edition, which is why the survey measured it and why this
does too.

THREE THINGS THIS DOES NOT DO, each on purpose:

  - **It does not attribute an unnamed clause from its Migne volume.** Migne
    is arranged by author, so `PL 182` could be read as Bernard and `PG 7` as
    Irenaeus. That would be a claim taken from a table written from memory
    rather than a reading of the citation, and it would be indistinguishable
    in the output from an attribution the source actually made. Unattributed
    is reported as unattributed.
  - **It carries an author forward only inside ONE citation string.** A
    footnote reading `S. Augustinus, De civ. Dei 1: PL 41, 13; Sermo 2: PL 38,
    21` names Augustine once for two works, and reading the second as
    Augustine's is reading the footnote rather than guessing. Carrying across
    footnotes is the `Ibid.` problem, which belongs to
    `site/scripts/build-xrefs.mjs` and is unsolved there too.
  - **It matches no work against ANF/NPNF.** That match is what the survey
    says must run before anyone commits to a patristic subset, and it needs
    those collections' contents, which are a fetch this tool does not make.
    The subset ladder it prints instead answers the prior question, and
    answers it harshly enough that the ANF/NPNF match may never be worth
    running: 69% of the works are cited exactly once.

    ./patristics.py                # the summary, top authors, subset ladder
    ./patristics.py --authors      # the full author table
    ./patristics.py --works        # the work-title table, most-cited first
    ./patristics.py --residue      # clauses the parser got no author from
    ./patristics.py --json         # everything parsed, one object per clause
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import build_root, require_corpus

# A Migne reference: the series, its volume (Arabic or Roman, sometimes with a
# part -- `PG 7/1`), then the columns. `Migne, PL 54, 359` and `PL XVI, 342`
# and `PL 183,1182CD` are all in the corpus.
MIGNE_RE = re.compile(
    r"\b(?:Migne,?\s*)?(?P<series>P[LG])\s*(?P<volume>[0-9]{1,3}|[IVXLC]{1,6})"
    r"(?:\s*/\s*(?P<part>\d))?\s*,?\s*(?P<columns>[0-9]{1,4}[0-9A-D,\s.–-]*)?",
    re.IGNORECASE,
)

# The lead-ins a citation opens with, which are not part of anyone's name.
LEAD_RE = re.compile(r"^\s*(?:Cf\.|Cfr\.|cf\.|See|Veja|Vide|Ver)\s*", re.IGNORECASE)

# --------------------------------------------------------------------------
# The author table.
#
# ONE ENTRY PER PERSON, WITH EVERY SURFACE FORM THE CORPUS PRINTS. The three
# languages name the same man three ways and the honorific varies inside each
# ("St."/"Saint"/"S."/"Santo"/"São"/"S."), so the honorific is stripped before
# matching and the patterns below carry only the name. They are matched
# case-insensitively against text with diacritics folded away, which is what
# lets one pattern cover `Jerónimo`, `Jerônimo` and `Jeronimo` -- the
# Portuguese corpus prints all three.
#
# BUILT FROM WHAT IS THERE, not from a canon. Every pattern here was added
# because a clause in `build/` matched nothing; the list is therefore exactly
# as long as the corpus makes it and no longer. `Iraeneus` is not a typo in
# this file -- it is `vatii.ad-gentes.en` §8's spelling, and a name table that
# only accepts correct spellings measures the corpus it wishes it had.
# --------------------------------------------------------------------------
AUTHORS: dict[str, str] = {
    "Augustine": r"august(?:ine|inus|in|ino|inho)|agostinho",
    "Ambrose": r"ambros(?:e|ius|io|ii)|ambrosio",
    "John Chrysostom": r"(?:jo(?:hn|ao|hannes)\s+)?chrysostom(?:us)?|crisostomo",
    "Irenaeus": r"ir[ae]?n[ae]?eus|ireneu|irineu|iraeneus|ireneo",
    "Tertullian": r"tertullian(?:us)?|tertuliano",
    "Gregory the Great": r"greg(?:ory|orius|orio)\b[^,]*\b(?:the\s+great|magn(?:us|o)|m\.)",
    "Gregory of Nazianzus": r"greg(?:ory|orius|orio)\b[^,]*nazianz",
    "Gregory of Nyssa": r"greg(?:ory|orius|orio)\b[^,]*(?:nyss|niss)",
    "Origen": r"origen(?:es)?",
    "Justin Martyr": r"justin(?:us|o)?\b",
    "Cyril of Jerusalem": r"cyril|cirilo",  # narrowed below by `SEES`
    "Basil the Great": r"basil(?:ius|io)?|basilio",
    "Jerome": r"jerome|jeronimo|hieronymus",
    "Cyprian": r"cyprian(?:us)?|cipriano",
    "Leo the Great": (
        r"leo\b[^,]*(?:the\s+great|magn(?:us|o)|m\.)|leao\b[^,]*(?:magn|\bm\.)"
    ),
    "Athanasius": r"athanasius|atanasio",
    "John Damascene": r"damasc(?:ene|enus|eno)",
    "Clement of Rome": r"clement(?:e)?\s+(?:of\s+rome|romano|de\s+roma)",
    "Theophilus of Antioch": r"theophil|teofil",
    "Faustus of Riez": r"faust(?:us|o)\b",
    "Nicetas": r"nicet",
    "Innocent I": r"innocent(?:ius|e)?\s*i\b|inocencio\s*i\b",
    "Clement of Alexandria": r"clement(?:e)?\s+(?:of|de)\s+alex",
    "Bernard of Clairvaux": r"bernard(?:us|o)?\b",
    "Hilary of Poitiers": r"hilar(?:y|ius|io)|hilario",
    "Maximus the Confessor": r"maxim(?:us|o)\b[^,]*(?:confessor)",
    "Ignatius of Antioch": r"ignat(?:ius|ius|io)\b[^,]*antioch",
    "Eusebius of Caesarea": r"eusebi(?:us|o)\b",
    "Lactantius": r"lactantius|lactancio",
    "Peter Chrysologus": r"chrysolog|crisolog",
    "Anselm": r"anselm(?:us|o)?\b",
    "Fulgentius": r"fulgent(?:ius|io)",
    "Germanus of Constantinople": r"german(?:us|o)\b",
    "Theodoret": r"theodoret|teodoreto",
    "Evagrius Ponticus": r"evagri(?:us|o)\b|evagrio",
    "Didymus the Blind": r"didym(?:us|o)|didimo",
    "Epiphanius": r"epiphan(?:ius|io)|epifanio",
    "Ephrem": r"ephr[ae]?em|efrem",
    "Cyril of Alexandria": r"(?<!)cirilo\s+de\s+alexandria|cyril\s+of\s+alexandria",
    "Gregory Thaumaturgus": r"greg(?:ory|orius|orio)\b[^,]*thaumaturg",
    "Isidore of Seville": r"isidor(?:e|us|o)\b",
    "Benedict": r"benedict(?:us|o)?\b|bento\b",
    "Caesarius of Arles": r"caesari(?:us)?\b|cesario\b",
    "Bede": r"\bbede\b|beda\b",
    "Peter Damian": r"(?:peter|pedro|petrus)\s+dami|damian(?:us|i)\b",
    "Hippolytus": r"hippolyt(?:us|o)|hipolito",
    "Polycarp": r"polycarp|policarpo",
    "Vincent of Lerins": r"vincent\b[^,]*lerin|vicente\b[^,]*lerin",
    "Prosper of Aquitaine": r"prosper\b|prospero\b",
    "John Cassian": r"cassian(?:us|o)?\b",
    "Gregory of Elvira": r"greg(?:ory|orius|orio)\b[^,]*elvira",
    "Melito of Sardis": r"melit(?:o|on)\b",
    "Aphraates": r"aphraat|afraat",
    "Pseudo-Dionysius": r"(?:pseudo-?)?dionys(?:ius|io)|dionisio\s+areopag",
}

# The two Cyrils and the two Clements share a first name, so the bare pattern
# above would take the first of them for both. `SEES` runs first and only on
# the ambiguous names -- a see named in the clause decides it, and a clause
# naming neither goes unattributed rather than to whichever entry sorted first.
SEES: list[tuple[str, str]] = [
    ("Cyril of Alexandria", r"cyril|cirilo"),
    ("Cyril of Jerusalem", r"cyril|cirilo"),
    ("Clement of Alexandria", r"clement"),
    ("Clement of Rome", r"clement"),
]
SEE_WORDS = {
    "Cyril of Alexandria": r"alexandri",
    "Cyril of Jerusalem": r"jerusal",
    "Clement of Alexandria": r"alex",
    "Clement of Rome": r"rom",
}

# An honorific is a title, not a name, and every language spells it its own
# way. Stripped before matching so one pattern per person suffices.
HONORIFIC_RE = re.compile(
    r"^\s*(?:s|st|ss|sto|sta|saint|santo|santa|sao|s\.?to|blessed|beato|"
    r"pope|papa|dom|bp|bishop|bispo)\.?\s+",
    re.IGNORECASE,
)

# A work-internal locator: the numbers that address a place in the work rather
# than a column of Migne. `3, 20, 2`; `1. III, c. 4`; `XII, 20`; `4, 2`.
# Roman and Arabic both, with the `l.`/`c.`/`n.`/`q.` labels the sources print.
LOCATOR_RE = re.compile(
    r"(?:\b(?:l|lib|c|cap|n|no|q|a|art|hom|serm|tract|ep|par)\.?\s*)?"
    r"\b(?:\d{1,4}|[IVXLC]{1,6})\b"
    r"(?:\s*[,.]\s*(?:\b(?:c|cap|n|no|q|a|art|par)\.?\s*)?(?:\d{1,4}|[IVXLC]{1,6})\b)*",
    re.IGNORECASE,
)


def fold(text: str) -> str:
    """Diacritics away and lowercased, so one pattern covers `Jerónimo`,
    `Jerônimo` and `Jeronimo` -- the Portuguese corpus prints all three.

    LENGTH-PRESERVING, one character in for one character out, because
    `parse_clause` uses a match position in the folded string as a position in
    the original. The obvious spelling -- decompose the whole string, then drop
    every combining mark -- is not: `NFD("ã")` is two characters, so every
    accent to the left of a match shifts it, and the work title comes out with
    the last letters of the author's name still attached."""
    out = []
    for char in text:
        decomposed = unicodedata.normalize("NFD", char)
        base = next((c for c in decomposed if not unicodedata.combining(c)), char)
        out.append(base.lower())
    return "".join(out)


def citation_strings() -> list[tuple[str, int | None, str]]:
    """Every `citations[].text` in the corpus, as `(work_id, unit, text)`.

    `text` over `label`, matching what `build-xrefs.mjs` reads and what
    docs/corpus-schema.md §CCC says the two fields mean -- `label` is the
    parenthesized inline form and carries the same locator."""
    out: list[tuple[str, int | None, str]] = []
    for work_dir in sorted(build_root().iterdir()):
        for name in ("paragraphs.json", "sections.json"):
            path = work_dir / name
            if not path.exists():
                continue
            for unit in json.loads(path.read_text(encoding="utf-8")):
                for citation in unit.get("citations") or []:
                    raw = (citation.get("text") or citation.get("label") or "").strip()
                    if raw:
                        out.append((work_dir.name, unit.get("n"), raw))
    return out


# The prepositions a work's title uses to name someone who is NOT its author.
# `Contra Faustum`, `Ad Simplicianum`, `Adversus haereses`, `De fide ad
# Gratianum`, `In Matthaeum` -- the name after one of these is a target, an
# addressee or a subject, and reading it as the author is the one mistake a
# whole-clause search can make that a first-phrase search could not.
NOT_THE_AUTHOR_RE = re.compile(
    r"\b(?:ad|adv|adversus|contra|in|de|pro|apud|ed|cum|inter|super|sobre|"
    r"contre|para)\.?\s+$",
    re.IGNORECASE,
)


def match_author(clause: str) -> tuple[str, int] | None:
    """The author a clause names, or `None`.

    SEARCHED ACROSS THE WHOLE CLAUSE, not only its opening phrase. The opening
    phrase is where most forms put the name, and reading only there missed a
    measurable share: `vatii.lumen-gentium.pt` §42 prints a sentence of
    Portuguese prose before "cfr. S. João Crisóstomo", and a clause can carry a
    conciliar citation ahead of a patristic one.

    What a whole-clause search risks is taking a name out of a TITLE, and the
    corpus's titles name people constantly -- `Contra Faustum`, `Ad
    Simplicianum`, `De fide ad Gratianum`, `Epistola ad Magnum`. Every one of
    them puts the name after a preposition, so `NOT_THE_AUTHOR_RE` is the
    whole guard: a match preceded by one is a subject, an addressee or an
    opponent, and is refused. A name must also open a phrase -- the start of
    the clause, or after a comma, a full stop, a `cf.` or an honorific -- so
    that a name buried mid-title cannot win either."""
    text = clause
    folded = fold(text)

    def is_the_author(pos: int) -> bool:
        """A name preceded by one of the title prepositions is not the author.

        Only what sits immediately before the match is consulted, which is all
        the corpus's titles need: every one of them puts the name directly
        after the preposition -- `Contra Faustum`, `Ad Simplicianum`, `De fide
        ad Gratianum`. A longer look-back would start rejecting real
        attributions, since `cf.`, an honorific and a first name all sit in
        that space too.

        `Pseudo-` is refused on the same principle from the other side: the
        corpus prints "Pseudo Eusébio de Alexandria", and reading that as
        Eusebius of Caesarea would attribute a work to a man on the strength
        of the word saying it is not his."""
        before = fold(text[:pos])
        if re.search(r"\bpseudo[-\s]*$", before):
            return False
        return not NOT_THE_AUTHOR_RE.search(before)

    def first_at(pattern: str) -> tuple[int, int] | None:
        """Where this author's name first stands as an attribution, and how
        long it runs -- the end is where the work title begins."""
        for m in re.finditer(pattern, folded):
            if is_the_author(m.start()):
                return m.start(), m.end() - m.start()
        return None

    # LEFTMOST WINS, not first-in-the-table. A clause naming two people --
    # "S. Coelestinus, Epist. 18 ... Cfr. Benedictus XIV" -- is cited for the
    # first of them; resolving it by the order this file happens to list
    # authors in would make the answer depend on nothing at all.
    best: tuple[int, str, int] | None = None
    ambiguous_names = {name for name, _ in SEES}
    for canonical, ambiguous in SEES:
        hit = first_at(ambiguous)
        if (
            hit is not None
            and re.search(SEE_WORDS[canonical], folded)
            and (best is None or hit[0] < best[0])
        ):
            best = (hit[0], canonical, hit[1])
    for canonical, pattern in AUTHORS.items():
        if canonical in ambiguous_names:
            continue
        hit = first_at(pattern)
        if hit is not None and (best is None or hit[0] < best[0]):
            best = (hit[0], canonical, hit[1])
    return (best[1], best[0] + best[2]) if best else None


def parse_clause(clause: str) -> dict | None:
    """One Migne-bearing clause as `{author, work, locator, series, volume}`.

    `None` when the clause carries no Migne reference at all -- this parser
    claims only the family the survey's discriminator claims, and says so in
    the summary rather than widening silently."""
    migne = MIGNE_RE.search(clause)
    if not migne:
        return None
    hit = match_author(clause)
    author = hit[0] if hit else None

    # Everything between the author's own name-phrase and the Migne reference
    # is the work and its locator. Cut at the END of the matched name rather
    # than at the first comma: `St. Basil De Spiritu Sancto 15, 36` punctuates
    # nothing, and a comma cut there throws the title away and keeps the tail
    # of the locator.
    name_end = hit[1] if hit else 0
    # Past the end of the WORD, not of the match: `greg...nazianz` stops
    # inside `Nazianzus`, and cutting there leaves `us, Oratio theol.` standing
    # as a work title.
    while hit and name_end < len(clause) and clause[name_end].isalpha():
        name_end += 1
    rest = clause[name_end : migne.start()]
    if not hit:
        rest = HONORIFIC_RE.sub("", LEAD_RE.sub("", rest))
    else:
        # A see is part of the name, not of the work: `Irineu de Lião,
        # Adversus haereses` and `Cyril of Jerusalem, Catech.`. Matched
        # CASE-SENSITIVELY, which is the whole discriminator -- a lowercase
        # `de` introduces a birthplace, a capitalised `De` opens a Latin title
        # (`De Spiritu Sancto`), and nothing else tells them apart.
        rest = re.sub(r"^[\s,]*(?:de|of|do|da|von|di)\s+[^,]*,", "", rest)

    # A citation names its work, then the critical edition it is quoted from,
    # then Migne: `Adversus haereses, 2, 30, 9: SC 294, 318-320 (PG 7, 822)`.
    # The colon is the boundary the sources keep, so everything from the first
    # one is somebody's edition and not the work -- without this cut the title
    # comes out as `Adversus haereses, 2, 30, 9: SC 294, 318-320 (`.
    rest = rest.split(":")[0]
    rest = re.sub(r"^\s*[.\-–—]\s*", "", rest).strip(" ;,.(")

    # The locator is the trailing run of numbers; the work is what precedes
    # it. A work with no number after it (`De civitate Dei: PL 41, 13`) has no
    # locator, which is the other side of the share the survey measured.
    #
    # PEELED ONE GROUP AT A TIME, not matched in one pass. A locator is a path
    # -- `Sermo 196, 1`, `Adv. haeres. 5, 20, 2` -- and a single trailing
    # number match takes only its last step, leaving `Sermo 196` to stand as a
    # work title distinct from `Sermo`. The loop is what makes the work table
    # count works rather than citations.
    rest = re.sub(
        r"[\s,.]*\b(?:CSEL|CCL|CCSL|SC|GCS|CA|PL|PG|Funk|Hartel)\b[\s0-9]*$", "", rest
    )
    steps: list[str] = []
    while True:
        tail = re.search(
            r"(?:^|[,.\s])\s*((?:\b(?:l|lib|c|cap|n|no|hom|serm|q|a|art|par|prol)\.?\s*)?"
            r"(?:\d{1,4}[a-z]?|[IVXLC]{1,6})(?:\s*[-–]\s*\d{1,4})?\s*[.,]?)$",
            rest,
        )
        if not tail or not re.search(r"\d|[IVXLC]", tail.group(1)):
            break
        steps.insert(0, tail.group(1).strip(" ,."))
        rest = rest[: tail.start()].rstrip(" ,.")
    locator = ", ".join(step for step in steps if step) or None
    work = rest.strip(" ,.") or None

    return {
        "author": author,
        "work": work or None,
        "locator": locator or None,
        "series": migne.group("series").upper(),
        "volume": migne.group("volume"),
        "raw": clause.strip(),
    }


def parse_all() -> tuple[list[dict], int]:
    """Every Migne-bearing clause in the corpus, parsed. Returns the clauses
    and the total number of citation strings they were drawn from.

    THE AUTHOR IS CARRIED FORWARD WITHIN ONE CITATION STRING and never past
    it -- see the module docblock. A footnote naming Augustine once for two
    works has named him for both; the next footnote has named nobody."""
    strings = citation_strings()
    out: list[dict] = []
    for work_id, unit, text in strings:
        carried: str | None = None
        for clause in re.split(r"\s*;\s*", text):
            parsed = parse_clause(clause)
            if parsed is None:
                continue
            if parsed["author"] is None and carried is not None:
                parsed["author"] = carried
                parsed["carried"] = True
            elif parsed["author"] is not None:
                carried = parsed["author"]
            parsed["work_id"] = work_id
            parsed["unit"] = unit
            out.append(parsed)
    return out, len(strings)


# The same work, printed two ways because two languages print it two ways.
# Token-prefix clustering below folds `Serm.` into `Sermones` for free, since
# an abbreviation IS a truncation; it cannot fold `Sermao` into `Sermo`, which
# is a translation. This table is that difference and nothing else -- it is
# short because the corpus's Latin titles are mostly left in Latin even in the
# Portuguese editions.
TITLE_ALIASES: dict[str, str] = {
    "sermao": "sermo",
    "sermoes": "sermo",
    "homilias": "homilia",
    "carta": "epistula",
    "cartas": "epistula",
    "epist": "epistula",
    "ep": "epistula",
    "epistola": "epistula",
    "epistolas": "epistula",
    "comentario": "commentarius",
    "commentarium": "commentarius",
    "tratado": "tractatus",
    "discurso": "oratio",
    # Latin's own I/J variance, which the corpus prints both ways in the same
    # title -- `In Joannis Evangelium` beside `In Iohannis evangelium`.
    "joannis": "iohannis",
    "ioannis": "iohannis",
    "joan": "iohannis",
    "joh": "iohannis",
    "jo": "iohannis",
    "io": "iohannis",
    "ioh": "iohannis",
}


def normalize_title(title: str) -> list[str]:
    """A work title as comparable tokens: folded, unpunctuated, aliased.

    Periods go because they mark abbreviation and abbreviation is what the
    clustering below is FOR -- keeping them would make `Serm.` and `Serm`
    different works."""
    folded = fold(title)
    tokens = [t for t in re.split(r"[^a-z0-9]+", folded) if t]
    return [TITLE_ALIASES.get(t, t) for t in tokens]


def abbreviates(short: list[str], long: list[str]) -> bool:
    """True when `short` reads as an abbreviation of `long`.

    Token for token, each of `short`'s is a prefix of the corresponding one in
    `long`, and `short` is no longer. That is what an abbreviated title IS --
    `Adv. haer.` for `Adversus haereses`, `En. in Ps.` for `Enarrationes in
    Psalmos` -- so the rule needs no table of which abbreviations exist, which
    is the half the survey called hard.

    It over-merges where two real titles share a truncation (`De orat.` could
    abbreviate both `De oratione` and `De ordine`). Accepted, and named here
    rather than papered over: the alternative is a hand table of 288 titles in
    three languages, and the merged form is always a title the corpus prints."""
    if not short or len(short) > len(long):
        return False
    return all(b.startswith(a) for a, b in zip(short, long, strict=False))


def cluster_titles(counter: Counter) -> Counter:
    """Fold every `(author, title)` pair whose title abbreviates another's.

    Greedy, longest first, so a cluster is named by the fullest form the
    corpus prints rather than by whichever came first. Not transitive and does
    not pretend to be -- `a` may abbreviate `b` and `b` abbreviate `c` without
    `a` abbreviating `c`, and forcing those together would merge on a
    similarity nothing asserted.

    Clustered WITHIN one author, never across: two men may write a `De
    virginitate` and they are two works."""
    heads: list[tuple[str, list[str], str]] = []
    merged: Counter = Counter()
    for (author, title), count in sorted(
        counter.items(), key=lambda kv: (-len(normalize_title(kv[0][1])), -kv[1])
    ):
        tokens = normalize_title(title)
        for head_author, head_tokens, head_label in heads:
            if head_author == author and abbreviates(tokens, head_tokens):
                merged[head_label] += count
                break
        else:
            label = f"{author} — {title}"
            heads.append((author, tokens, label))
            merged[label] += count
    return merged


def table(counter: Counter, total: int, limit: int | None = None) -> list[str]:
    """A frequency table with a running cumulative share -- the shape the
    survey's own author table used, so the two can be read against each
    other."""
    lines = []
    seen = 0
    for i, (key, count) in enumerate(counter.most_common(), 1):
        seen += count
        if limit is not None and i > limit:
            continue
        lines.append(
            f"  {i:3}. {key:<34} {count:>5}  {count / total * 100:5.1f}%  "
            f"cum {seen / total * 100:5.1f}%"
        )
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--authors", action="store_true", help="The full author table.")
    parser.add_argument("--works", action="store_true", help="The work-title table.")
    parser.add_argument(
        "--residue", action="store_true", help="Clauses no author was read from."
    )
    parser.add_argument("--json", action="store_true", help="Every parsed clause.")
    args = parser.parse_args()
    require_corpus()

    clauses, total_strings = parse_all()
    if args.json:
        print(json.dumps(clauses, ensure_ascii=False, indent=2))
        return 0

    attributed = [c for c in clauses if c["author"]]
    named = [c for c in attributed if not c.get("carried")]
    with_locator = [c for c in clauses if c["locator"]]
    authors = Counter(c["author"] for c in attributed)
    works = cluster_titles(
        Counter((c["author"] or "?", c["work"]) for c in clauses if c["work"])
    )
    volumes = Counter(f"{c['series']} {c['volume']}" for c in clauses)

    print(f"{total_strings} citation strings in the corpus")
    print(
        f"{len(clauses)} clauses carry a Migne PL/PG reference "
        f"({len(clauses) / total_strings * 100:.1f}% of strings, counted per clause)"
    )
    print(
        f"{len(with_locator)} of them ({len(with_locator) / len(clauses) * 100:.1f}%) "
        "also carry a work-internal locator -- an address that survives the "
        "choice of edition"
    )
    print(
        f"{len(attributed)} ({len(attributed) / len(clauses) * 100:.1f}%) are "
        f"attributed: {len(named)} name their author in the clause, "
        f"{len(attributed) - len(named)} inherit it from an earlier clause of "
        "the same citation"
    )
    print(
        f"{len(clauses) - len(attributed)} "
        f"({(len(clauses) - len(attributed)) / len(clauses) * 100:.1f}%) go "
        "unattributed -- see --residue"
    )
    print(
        f"{len(authors)} distinct authors named, {len(works)} distinct works "
        f"after folding abbreviations together, {len(volumes)} distinct Migne volumes"
    )

    if args.authors:
        print(f"\nAuthors ({len(attributed)} attributed clauses):")
        print("\n".join(table(authors, len(attributed))))
    else:
        print(f"\nTop authors ({len(attributed)} attributed clauses):")
        print("\n".join(table(authors, len(attributed), limit=12)))

    # The ladder is the answer to the question the survey could not ask: how
    # much of the demand a chosen subset would actually serve. It is printed
    # with or without --works because it is the finding, and the 734-row table
    # under it is only the evidence.
    total_work_citations = sum(works.values())
    print("\nWhat a subset would buy, if the works were ingested most-cited first:")
    ladder = []
    seen = 0
    for i, (_, count) in enumerate(works.most_common(), 1):
        seen += count
        if i in (10, 20, 40, 60, 100, 200):
            ladder.append(
                f"  top {i:>3} works: {seen / total_work_citations * 100:5.1f}%"
            )
    print("\n".join(ladder))
    once = sum(1 for count in works.values() if count == 1)
    print(
        f"  {once} of the {len(works)} works ({once / len(works) * 100:.0f}%) are "
        "cited exactly once in the whole corpus"
    )

    if args.works:
        print(f"\nWorks ({len(works)} distinct, abbreviations folded):")
        print("\n".join(table(works, total_work_citations)))

    if args.residue:
        unattributed = [c for c in clauses if not c["author"]]
        print(f"\n{len(unattributed)} clauses with no author read from them:")
        for c in unattributed:
            print(f"  [{c['work_id']} {c['unit']}] {c['raw'][:120]}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
