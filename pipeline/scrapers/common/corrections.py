"""The corrections layer: the source is wrong, and the fetched page is edited.

Not to be confused with `overrides`, which says the source is fine and our
derivation is not. See that module for why the two stay apart."""

from __future__ import annotations

import json
from collections.abc import Iterable

from .files import filed_work_ids
from .paths import CORRECTIONS_DIR


class CorrectionDriftError(RuntimeError):
    """A correction's `from` text no longer matches the source.

    Raised when a recorded correction stops applying, which means either the
    source page changed or the correction was wrong to begin with. Either way
    the run must fail loudly rather than emit a work whose corrections
    silently did nothing -- see pipeline/docs/corrections.md, "Source-defect corrections
    policy".

    vatican_docs.py deliberately does NOT use this: `scrape_one` promises not
    to raise, so that one bad document cannot kill a crawl of many, and it
    reports drift as `status="corrections-drift"` on its result instead.
    """


# --------------------------------------------------------------------------
# The `field` vocabulary, and the two rules every applier shares.
#
# A corrections file holds entries for more than one KIND of defect -- the
# corpus files twenty-odd `field` values today, and one Bible edition's file
# carries both a wrong verse text and a wrong verse NUMBER. Each kind wants a
# different applier, so every applier has to answer the same two questions
# first: which entries are mine, and did all of mine actually apply.
#
# Both answers were being written out by hand, four times and three times
# respectively, once per applier -- `kaldi.py` twice, `straubinger.py` once,
# and `apply_verse_corrections` below. They are here because neither answer is
# an edition's to give: "never apply an entry carrying a `resolution`" and
# "an entry that matched nothing on a full run is drift" are both
# pipeline/docs/corrections.md's policy, in the same way the
# locator shape is docs/corpus-schema.md's. What stays with each scraper is
# the applier itself, which knows what its own parse looks like.
#
# Note what is NOT here: which entries an applier owns is answered by `field`
# for the verse-number appliers, but `douay_rheims.py` partitions its file by
# locator SCOPE and `matos_soares.py` by the presence of a locator key. Those
# are older and predate the field, and unifying them is a schema question
# rather than a refactor -- see pipeline/corrections/README.md.
# --------------------------------------------------------------------------

FIELD_VERSE_NUMBER = "verse_number"
FIELD_VERSE_DUPLICATE = "verse_duplicate"
#: The verse's own words. Spelled out because an edition whose file carries
#: more than one KIND of defect has to say which applier owns an entry, and
#: `matos_soares.py` -- the first file to use the value -- partitions by
#: locator instead and so never named it. `kaldi.py` needs the name: its file
#: holds verse numbers, held duplicates and now verse text, three appliers over
#: one file, and "everything that is not one of the other two" is the kind of
#: default that silently adopts the next field somebody files.
FIELD_VERSE_TEXT = "verse_text"


def filed(corrections: Iterable[dict], field: str | None = None) -> list[dict]:
    """The entries a run may actually apply, optionally of one `field`.

    An entry carrying a `resolution` is documented-but-not-applied: a defect
    with no known correct value gets recorded, never invented
    (pipeline/docs/corrections.md). Passing `field=None`
    keeps every kind, which is what an applier that owns a whole file wants.
    """
    return [
        c
        for c in corrections
        if not c.get("resolution") and (field is None or c.get("field") == field)
    ]


def require_all_applied(
    corrections: Iterable[dict],
    applied_ids: set[str],
    *,
    field: str | None = None,
    source: str,
) -> None:
    """Fail unless every filed entry matched something during a full run.

    The only check that catches a correction which has quietly stopped
    applying while still claiming, by its presence, to be handling a defect.
    Callers pass `full_run` themselves and simply skip this on a sample,
    where a correction aimed at a book the sample never built is out of
    scope rather than drift.

    `source` names the `raw/` directory to re-verify against, because that is
    the first thing the person reading the traceback has to go and open.
    """
    missing = [c["id"] for c in filed(corrections, field) if c["id"] not in applied_ids]
    if missing:
        kind = f"{field} " if field else ""
        raise CorrectionDriftError(
            f"{kind}correction(s) never matched during full run: {missing} "
            f"(source drift -- re-verify against {source} and update or "
            "remove the entry)"
        )


def corrections_receipt(
    work_id: str,
    applied: list[dict],
    corrections: list[dict],
    generated_at: str,
) -> dict:
    """The corrections receipt as a value (docs/corpus-schema.md #Corrections).

    Five scrapers had built this dict, and after the receipts became values
    rather than writes the five bodies were character for character the same.
    Nothing here is per-source: `applied` and `corrections` are already this
    work's own, and an entry carrying a `resolution` is documented-but-not-
    applied by the policy in pipeline/docs/corrections.md, not by any one source's
    reading of it.

    Written by `write_stamped_json` along with the rest of the work, which is
    why it is built rather than written: the same payload is rendered twice,
    once with the stored stamp to compare and once with this run's to save."""
    return {
        "work_id": work_id,
        "generated_at": generated_at,
        "applied": applied,
        "unresolved": [c for c in corrections if c.get("resolution")],
        "count": len(applied),
    }


def apply_verse_corrections(
    books: Iterable[tuple[str, list[dict]]],
    corrections: list[dict],
    full_run: bool,
) -> tuple[list[dict], set[str]]:
    """Apply file-sourced corrections to already-parsed verse text, in place.
    Returns (applied entries, applied ids).

    WHY THIS IS SHAREABLE WHERE `validate` IS NOT. All three Bible scrapers had
    this, and the two sacredbible.org ones were identical to the character;
    matos_soares.py differed only in reaching a book's fields by attribute
    rather than by key. That is not a coincidence of three editions agreeing.
    Every rule here comes from somewhere above the edition: the drift guard and
    the never-apply-a-`resolution` rule are pipeline/docs/corrections.md's source-defect
    corrections policy, and the `{osis, chapter, verse}` locator and
    `{"n", "text"}` verse are docs/corpus-schema.md. An edition has no standing
    to disagree with either, which is exactly what `validate` -- asserting book
    and chapter counts for one particular text -- does have.

    `books` is `(osis, chapters)` pairs, so each caller writes the one line
    that knows its own book shape and nothing here has to guess.

    THREE OUTCOMES, and the middle one is the point:

      - A locator whose (osis, chapter) is not in this run is SKIPPED. Scope is
        tracked per chapter, not per book, because `--sample` keeps one book
        whole and truncates another to its first chapters; a correction aimed
        at a chapter the sample never built is out of scope, not drift.
      - A locator that IS in scope but whose exact `from` text is not there is
        a DRIFT FAILURE: the source changed since the entry was authored, and
        re-verifying it is required before the run may proceed.
      - On a full run, an entry that never matched anywhere is also a failure.
        It is the only check that catches a correction which has quietly
        stopped applying while still claiming, by its presence, to be handling
        a defect."""
    present_chapters: set[tuple[str, int]] = set()
    verse_index: dict[tuple[str, int, int], dict] = {}
    for osis, chapters in books:
        for chap in chapters:
            present_chapters.add((osis, chap["n"]))
            for v in chap["verses"]:
                verse_index[(osis, chap["n"], v["n"])] = v

    applied: list[dict] = []
    seen: set[str] = set()
    for c in filed(corrections):
        loc = c["locator"]
        key = (loc["osis"], loc["chapter"], loc["verse"])
        if (loc["osis"], loc["chapter"]) not in present_chapters:
            continue  # out of scope for this run (e.g. --sample)
        verse = verse_index.get(key)
        if verse is None or c["from"] not in verse["text"]:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected text {c['from']!r} not found "
                f"at {loc['osis']} {loc['chapter']}:{loc['verse']} (source drift -- "
                "re-verify against corpus/raw/ and update or remove the entry)"
            )
        verse["text"] = verse["text"].replace(c["from"], c["to"], 1)
        applied.append(dict(c))
        seen.add(c["id"])

    if full_run:
        require_all_applied(corrections, seen, source="the corpus's raw/")
    return applied, seen


def apply_note_corrections(
    book_docs: Iterable[dict],
    corrections: list[dict],
    full_run: bool,
    *,
    source: str,
) -> tuple[list[dict], set[str]]:
    """Apply note-scoped corrections to already-parsed apparatus, in place.
    Returns (applied entries, applied ids).

    WHY THIS IS SHAREABLE, on `apply_verse_corrections`' own argument. A note
    has no locator in docs/corpus-schema.md -- a verse has one and the notes
    hang off it -- so the scoping is `{osis, chapter, verse, note}`, where
    `note` is the note's own printed MARKER and not a position. That is the
    same shape in every annotated edition here, because the marker is what
    the source prints and the schema stores (`{"marker", "text"}`), and an
    edition has no standing to disagree with it any more than it has with
    the verse locator.

    THREE EDITIONS ANNOTATE AND EACH FOUND THE SAME CLASS OF DEFECT. It began
    as `douay_rheims.py`'s, filed against Challoner's own transcription typos
    (`comdemnation` at John 3:19); Straubinger and Martini then both turned out
    to print a citation that addresses nothing, which is the identical repair
    one field over. What stayed with the caller is the PARTITION -- douay's
    file mixes note-scoped entries with verse-scoped ones and splits them by
    locator scope, and reading a verse entry here would report it as drift.

    `field` defaults to `"text"` and may name any key the note carries, so a
    marker defect and a text defect are the same entry shape. A note the
    locator does not resolve to, or a `from` that is not in it, is DRIFT and
    not a miss: unlike a verse locator, which a `--sample` run legitimately
    fails to reach, the sample check is the (osis, chapter) scope above it.

    A `from` OCCURRING TWICE IS REFUSED, and that is not a formality. The
    first entry filed here repaired the second of two citations in one note of
    Straubinger's, `II Reyes 4, 31`, which is a substring of the CORRECT one
    eleven words earlier -- so a replace-once turned `III Reyes` into
    `IIII Reyes` and reported success. pipeline/docs/corrections.md already
    refuses an unlocatable `from` at the PROPOSING end; this is the same rule
    where it can still be checked, and the fix is to widen the entry's `from`
    until it names one place.
    """
    index: dict[tuple, dict] = {}
    scope: set[tuple[str, int]] = set()
    for book in book_docs:
        for chap in book["chapters"]:
            scope.add((book["osis"], chap["n"]))
            for unit in [*chap["verses"], *(chap.get("headings") or [])]:
                for note in unit.get("notes") or []:
                    index[(book["osis"], chap["n"], unit.get("n"), note["marker"])] = (
                        note
                    )

    applied: list[dict] = []
    seen: set[str] = set()
    for c in filed(corrections):
        loc = c["locator"]
        if (loc["osis"], loc["chapter"]) not in scope:
            continue  # out of scope for this run (e.g. --sample)
        note = index.get(
            (loc["osis"], loc["chapter"], loc.get("verse"), str(loc["note"]))
        )
        field = c.get("field", "text")
        if note is None or c["from"] not in (note.get(field) or ""):
            raise CorrectionDriftError(
                f"correction {c['id']!r}: expected {field} {c['from']!r} not found on note "
                f"{loc['note']} at {loc['osis']} {loc['chapter']}:{loc.get('verse')} "
                f"(source drift -- re-verify against {source} and update or remove it)"
            )
        occurrences = note[field].count(c["from"])
        if occurrences > 1:
            raise CorrectionDriftError(
                f"correction {c['id']!r}: {field} {c['from']!r} occurs {occurrences} times "
                f"on note {loc['note']} at {loc['osis']} {loc['chapter']}:{loc.get('verse')} "
                "-- widen `from` until it names one place, since this replaces the FIRST "
                "match and the others are as likely to be the defect"
            )
        note[field] = note[field].replace(c["from"], c["to"], 1)
        applied.append(dict(c))
        seen.add(c["id"])

    if full_run:
        require_all_applied(corrections, seen, source=source)
    return applied, seen


def load_corrections(work_id: str) -> list[dict]:
    """The recorded corrections for `work_id`, or `[]` when none are filed.

    An absent file is the normal case, not an error: most sources have no
    documented defect, and the layer is expected to apply zero corrections
    while still proving it ran (each scraper's own drift guard).
    """
    if work_id not in filed_work_ids(CORRECTIONS_DIR):
        return []
    path = CORRECTIONS_DIR / f"{work_id}.json"
    entries = json.loads(path.read_text(encoding="utf-8"))
    # Ids must be unique within a file: `apply_raw_text_corrections` records
    # each applied id in a `seen_ids` set and skips anything already there,
    # so two entries sharing an id means the second SILENTLY does not apply.
    # Caught live -- two Redemptoris Missio entries both derived the id
    # `...-missing-space-Ac` from their own `from` text, and only the first
    # was applied while the receipt still reported success. Nothing else
    # would have noticed: the layer's drift guard checks that a filed
    # correction MATCHED, not that every filed correction was reached.
    ids = [e.get("id") for e in entries]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        raise ValueError(
            f"{path}: duplicate correction id(s) {dupes} -- ids must be unique "
            "within a file or all but the first are skipped without a word"
        )
    return entries
