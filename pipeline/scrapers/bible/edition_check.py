# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Check a built Bible edition against the schema, and against the Clementine.

WHY THIS EXISTS. Five new editions were ingested in parallel, by five hands,
from five sources that agree about almost nothing. Each of the four editions
already in the corpus carries its own `validate()` -- rightly, because those
assert things about a PARTICULAR source (`sacredbible.py`'s docblock says so)
and merging them would erase the differences. This asserts the opposite kind of
thing: what is true of EVERY Bible edition because `docs/corpus-schema.md` says
so. It is the contract a new edition is written against, not a replacement for
the per-source oracle a scraper still owes.

    uv run pipeline/scrapers/bible/edition_check.py bible.allioli.de
    uv run pipeline/scrapers/bible/edition_check.py --all

Exit status is 1 if any ERROR was reported. NOTEs are printed and never fail:
an edition legitimately differing from the Clementine is the normal case, and a
check that failed on it would be a check nobody could leave switched on.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from common import build_root, require_corpus

#: The 73 lowercase OSIS codes in canonical order. Not derived from an existing
#: edition at runtime: a new edition must be checkable against the canon even
#: on a corpus where nothing else has been built yet, and a canon read out of
#: whatever happens to be on disk would validate a mistake against itself.
CANON = [
    "gen",
    "exod",
    "lev",
    "num",
    "deut",
    "josh",
    "judg",
    "ruth",
    "1sam",
    "2sam",
    "1kgs",
    "2kgs",
    "1chr",
    "2chr",
    "ezra",
    "neh",
    "tob",
    "jdt",
    "esth",
    "1macc",
    "2macc",
    "job",
    "ps",
    "prov",
    "eccl",
    "song",
    "wis",
    "sir",
    "isa",
    "jer",
    "lam",
    "bar",
    "ezek",
    "dan",
    "hos",
    "joel",
    "amos",
    "obad",
    "jonah",
    "mic",
    "nah",
    "hab",
    "zeph",
    "hag",
    "zech",
    "mal",
    "matt",
    "mark",
    "luke",
    "john",
    "acts",
    "rom",
    "1cor",
    "2cor",
    "gal",
    "eph",
    "phil",
    "col",
    "1thess",
    "2thess",
    "1tim",
    "2tim",
    "titus",
    "phlm",
    "heb",
    "jas",
    "1pet",
    "2pet",
    "1john",
    "2john",
    "3john",
    "jude",
    "rev",
]

#: The reference edition for versification. It is the text most of this corpus
#: is translated FROM, so a difference against it is evidence about an edition
#: rather than a third opinion (CLAUDE.md, "Work that spans languages").
REFERENCE = "bible.clementina.la"

OPEN, CLOSE = "⟦", "⟧"
TOKEN = re.compile(rf"{OPEN}([^{OPEN}{CLOSE}]+){CLOSE}")
#: Anything that suggests markup survived into a text field. `text` is plain
#: text by schema; the commonest way to get this wrong is to strip tags with a
#: regex and leave the entities behind.
MARKUP = re.compile(r"<[^>]+>|&[a-z]+;|&#\d+;")


class Report:
    def __init__(self, work: str):
        self.work, self.errors, self.notes = work, [], []
        #: Counted rather than listed. A lemma that quotes the verse loosely is
        #: an editorial habit of the whole edition, so the interesting number is
        #: how many -- a handful is a defect worth chasing, a thousand is a
        #: convention, and printing a thousand lines buries the handful.
        self.lemma_misses = 0

    def error(self, msg: str) -> None:
        self.errors.append(msg)

    def note(self, msg: str) -> None:
        self.notes.append(msg)

    def print(self, limit: int = 25) -> bool:
        print(f"\n=== {self.work} ===")
        for kind, items in (("ERROR", self.errors), ("note", self.notes)):
            for m in items[:limit]:
                print(f"  {kind}: {m}")
            if len(items) > limit:
                print(f"  … and {len(items) - limit} more {kind}(s)")
        if not self.errors:
            print(
                "  schema OK" + (f", {len(self.notes)} note(s)" if self.notes else "")
            )
        return not self.errors


def check_text(rep: Report, where: str, text: object) -> None:
    """The rules `corpus-schema.md` states for every plain-text field."""
    if not isinstance(text, str):
        rep.error(f"{where}: text is {type(text).__name__}, not a string")
        return
    if not text.strip():
        # "A verse present with empty text is invalid -- omit it instead."
        rep.error(f"{where}: empty text")
        return
    if text != text.strip():
        rep.error(f"{where}: leading/trailing whitespace")
    if "  " in text:
        rep.error(f"{where}: double space")
    if m := MARKUP.search(text):
        rep.error(f"{where}: markup survived into text: {m.group(0)!r}")
    if OPEN in text or CLOSE in text:
        rep.error(f"{where}: marker token left in `text` (belongs in text_marked)")
    if "\n" in text or "\t" in text:
        rep.error(f"{where}: newline or tab in text")
    if any(unicodedata.category(c) == "Cc" for c in text):
        rep.error(f"{where}: control character in text")


def check_unit(rep: Report, where: str, unit: dict) -> None:
    """A verse or heading: text, and the optional apparatus over it."""
    check_text(rep, where, unit.get("text"))
    marked, notes = unit.get("text_marked"), unit.get("notes")
    if marked is None and notes is None:
        return
    # NO check that notes imply `text_marked`, and the reason is an edition
    # that already exists: `bible.matos-soares.pt` stores 1,500 notes and no
    # tokens at all, because its source prints the note content on a different
    # page from the markers. The schema's rule runs one way only -- "every
    # token must have a note entry; a note need not have a token" -- so a whole
    # apparatus with no anchors is a legal edition, not a defect, and a check
    # asserting the converse fails a corpus that is already correct.
    if marked is not None:
        if TOKEN.sub("", marked) != unit.get("text"):
            rep.error(f"{where}: text_marked does not reduce to text")
        markers = TOKEN.findall(marked)
        if len(markers) != len(set(markers)):
            # A repeated token is legal (one note anchored twice); a repeated
            # NOTE marker is not. Checked against the note list below.
            pass
        known = {n.get("marker") for n in (notes or [])}
        for mk in markers:
            if mk not in known:
                rep.error(f"{where}: token {mk!r} has no note entry")
    for i, n in enumerate(notes or []):
        w = f"{where} note[{i}]"
        if not n.get("marker"):
            rep.error(f"{w}: no marker")
        check_text(rep, w, n.get("text"))
        if (lem := n.get("lemma")) is not None:
            if not isinstance(lem, str) or not lem.strip():
                rep.error(f"{w}: empty lemma")
            elif lem not in (unit.get("text") or ""):
                # Reported, never fatal: an edition may normalise case or
                # elide with "etc." -- but it caught a real defect once.
                rep.lemma_misses += 1
                if rep.lemma_misses <= 5:
                    rep.note(f"{w}: lemma {lem!r} does not appear in the verse")
    seen = [n.get("marker") for n in (notes or [])]
    if len(seen) != len(set(seen)):
        rep.error(f"{where}: two notes share a marker")


def check_book(
    rep: Report, path: Path, osis: str, expect_order: int | None
) -> dict[int, int]:
    """One `books/{osis}.json`. Returns `{chapter: verse count}`."""
    doc = json.loads(path.read_text(encoding="utf-8"))
    if doc.get("osis") != osis:
        rep.error(f"{osis}: osis field is {doc.get('osis')!r}, filename says {osis!r}")
    if not (doc.get("name") or "").strip():
        rep.error(f"{osis}: no display name")
    if expect_order is not None and doc.get("order") != expect_order:
        rep.error(
            f"{osis}: order is {doc.get('order')!r}, but the manifest puts it "
            f"{expect_order}th"
        )
    abbrevs = doc.get("abbrevs") or []
    if not abbrevs:
        # Not fatal: the jump box degrades to the full name. Worth saying,
        # since a Bible edition is the only place a full book NAME enters the
        # grammar at all (CLAUDE.md, "Reference grammar").
        rep.note(f"{osis}: no abbrevs — the jump box will complete the name only")
    for a in abbrevs:
        if a != a.lower():
            rep.error(f"{osis}: abbrev {a!r} is not lowercase")

    shape: dict[int, int] = {}
    prev = 0
    for ch in doc.get("chapters") or []:
        n = ch.get("n")
        if not isinstance(n, int) or n <= prev:
            rep.error(f"{osis}: chapter numbers not strictly ascending at {n!r}")
        prev = n if isinstance(n, int) else prev
        if (summ := ch.get("summary")) is not None:
            check_text(rep, f"{osis} {n} summary", summ)
        seen_v = set()
        pv = 0
        for v in ch.get("verses") or []:
            vn = v.get("n")
            if not isinstance(vn, int):
                rep.error(f"{osis} {n}: verse number {vn!r} is not an integer")
                continue
            if vn in seen_v:
                rep.error(f"{osis} {n}:{vn}: duplicate verse number")
            if vn <= pv:
                rep.error(f"{osis} {n}: verse {vn} out of order after {pv}")
            seen_v.add(vn)
            pv = vn
            check_unit(rep, f"{osis} {n}:{vn}", v)
        if not seen_v:
            rep.error(f"{osis} {n}: chapter has no verses")
        for h in ch.get("headings") or []:
            bv = h.get("before_verse")
            if bv not in seen_v:
                rep.error(
                    f"{osis} {n}: heading before_verse {bv!r} is not a verse here"
                )
            if (lvl := h.get("level")) is not None and lvl not in (1, 2, 3, 4):
                rep.error(f"{osis} {n}: heading level {lvl!r} outside 1–4")
            check_unit(rep, f"{osis} {n} heading@{bv}", h)
        shape[n] = max(seen_v) if seen_v else 0
    if not shape:
        rep.error(f"{osis}: no chapters")
    return shape


def load_reference() -> dict[str, dict[int, int]] | None:
    root = build_root() / REFERENCE / "books"
    if not root.is_dir():
        return None
    out = {}
    for osis in CANON:
        p = root / f"{osis}.json"
        if not p.is_file():
            continue
        doc = json.loads(p.read_text(encoding="utf-8"))
        out[osis] = {
            c["n"]: max((v["n"] for v in c.get("verses") or []), default=0)
            for c in doc.get("chapters") or []
        }
    return out


def check_work(work: str, ref: dict | None) -> Report:
    rep = Report(work)
    root = build_root() / work
    if not root.is_dir():
        rep.error(f"no such work directory: {root}")
        return rep

    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("type") != "bible":
        rep.error(f"manifest type is {manifest.get('type')!r}, not 'bible'")
    if manifest.get("id") != work:
        rep.error(f"manifest id {manifest.get('id')!r} != directory {work!r}")
    parts = work.split(".")
    if len(parts) != 3 or parts[0] != "bible":
        rep.error(f"work id {work!r} is not bible.{{edition}}.{{lang}}")
    elif manifest.get("language") != parts[2]:
        rep.error(
            f"manifest language {manifest.get('language')!r} != id's {parts[2]!r}"
        )
    for field in ("title", "short_title", "edition"):
        if not (manifest.get(field) or "").strip():
            rep.error(f"manifest has no {field}")
    if manifest.get("psalm_numbering") not in ("vulgate", "hebrew"):
        rep.error(f"psalm_numbering is {manifest.get('psalm_numbering')!r}")
    cr = manifest.get("copyright") or {}
    if cr.get("status") not in ("public-domain", "copyrighted"):
        rep.error(f"copyright.status is {cr.get('status')!r}")
    if not manifest.get("sources"):
        rep.error("manifest lists no sources")

    # `books` is "the 73 OSIS codes in THIS WORK'S canonical order" -- the
    # work's, not a global one. `bible.matos-soares.pt` prints Esther before
    # Tobias and Judith, which is that edition's own order and not a defect, so
    # what is checked is that the SET is the canon and that each book's `order`
    # agrees with where the manifest puts it.
    books = manifest.get("books") or []
    missing = [b for b in CANON if b not in books]
    extra = [b for b in books if b not in CANON]
    if missing:
        rep.error(f"manifest omits {len(missing)} canonical book(s): {missing}")
    if extra:
        rep.error(f"manifest lists non-canonical book(s): {extra}")
    if len(books) != len(set(books)):
        rep.error("manifest lists a book twice")
    if books != CANON and not missing and not extra:
        moved = [b for i, b in enumerate(books) if CANON[i] != b]
        rep.note(
            f"book order differs from the usual canonical order at {len(moved)} "
            f"position(s) — the edition's own print order: {moved[:6]}"
        )
    order_of = {b: i for i, b in enumerate(books, 1)}

    shapes = {}
    for osis in CANON:
        p = root / "books" / f"{osis}.json"
        if not p.is_file():
            rep.error(f"{osis}: books/{osis}.json is missing")
            continue
        shapes[osis] = check_book(rep, p, osis, order_of.get(osis))
    for stray in sorted((root / "books").glob("*.json")):
        if stray.stem not in CANON:
            rep.error(f"books/{stray.name} is not a canonical OSIS code")

    if ref is None:
        rep.note(f"{REFERENCE} is not built; skipping the versification comparison")
        return rep

    #: Compared, reported, and never fatal. An edition legitimately divides
    #: chapters differently (docs/research/bible-edition-divergence.md); what
    #: this is for is making the divergence VISIBLE before someone discovers it
    #: as a wrong link. A missing chapter is a different animal and is an error.
    diverging = 0
    for osis, ours in shapes.items():
        theirs = ref.get(osis) or {}
        gone = sorted(set(theirs) - set(ours))
        if gone:
            rep.error(
                f"{osis}: {len(gone)} chapter(s) present in {REFERENCE} and absent "
                f"here: {gone[:8]}{' …' if len(gone) > 8 else ''}"
            )
        for n in sorted(set(ours) & set(theirs)):
            if ours[n] != theirs[n]:
                diverging += 1
                if diverging <= 10:
                    rep.note(
                        f"{osis} {n}: {ours[n]} verses here, {theirs[n]} in {REFERENCE}"
                    )
    if rep.lemma_misses > 5:
        rep.note(
            f"{rep.lemma_misses} notes quote a lemma that is not literally in its "
            f"verse — at this scale that is the edition's convention, not a defect"
        )
    if diverging:
        total = sum(len(v) for v in shapes.values())
        rep.note(
            f"{diverging} of {total} chapters ({100 * diverging // max(total, 1)} %) "
            f"differ in verse count from {REFERENCE} — read this as a number, not a "
            f"list: a few is edition divergence, a quarter is a versification table"
        )
    return rep


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("work", nargs="*", help="work id, e.g. bible.allioli.de")
    ap.add_argument("--all", action="store_true", help="every built bible.* work")
    args = ap.parse_args()

    require_corpus()
    works = list(args.work)
    if args.all:
        works += sorted(
            p.name
            for p in build_root().glob("bible.*")
            if (p / "manifest.json").is_file()
        )
    if not works:
        ap.error("name a work, or pass --all")

    ref = load_reference()
    ok = True
    for w in dict.fromkeys(works):
        ok &= check_work(w, ref).print()
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
