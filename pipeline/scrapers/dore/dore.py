#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy", "pillow"]
# ///
"""Gustave Doré's 241 wood engravings for `La Grande Bible de Tours` (1866).

WHAT THIS IS FOR. The engravings are an apparatus over the Bible text, not a
decoration of it: each one depicts a named verse, and the site anchors it
there. They cover 195 of the corpus's 1,334 chapters -- Doré illustrated
narrative, so Genesis is 48% covered and the Psalms, Proverbs and every
epistle but one are not covered at all. That sparseness is the artifact's
own shape and is why these are anchored to a VERSE rather than used as a
per-chapter hero: an illustration that appears where the illustrator drew one
reads as apparatus, the same way Challoner's notes do, while an empty banner
on 1,139 chapters reads as a broken template.

SOURCE, AND WHAT WE OWE IT. The scans are Fr. Felix Just, S.J.'s collection at
catholic-resources.org, reproduced from `The Doré Bible Illustrations` (Dover,
1974) with that publisher's permission. The engravings are long in the public
domain -- published 1866, Doré died 1883 -- and a faithful photograph of a
public-domain flat artwork carries no new copyright of its own. Fr. Just's
stated terms are non-commercial use, credit by full name, and a link to his
site; all three are met, and the colophon names Doré, Dover and him.

PROVENANCE, which is the whole reason the reconciliation below exists. Two
indexes describe this set and both number the plates 1 to 241 -- but they
order them differently, so the numbers do not correspond and joining on them
mis-anchors 146 of the 241 while looking entirely reasonable. The plate's own
printed caption is the way out, because it is attached to the file rather
than to a position in a list. See `sources.py`.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np
from PIL import Image

# `common` is a package one directory up; Python puts a script's own directory
# on sys.path at startup, and since this file sits in dore/ that directory is
# no longer the one holding it. Hence the imports below sitting under this.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import plates as plateio
import sources
from common import (
    Fetcher,
    FetchPolicy,
    WholesaleDivergence,
    build_root,
    download_resumable,
    raw_root,
    require_corpus,
    to_vulgate,
    write_stamped_json,
)

WORK_ID = "dore.tours"


def work_dir() -> Path:
    """This work's parsed output, under the corpus's `build/`.

    `build/` and not `works/`: the corpus renamed it on 2026-08-27 and put the
    whole directory in `.gitignore`, because it is the one of the three
    top-level directories that is derived. So nothing this scraper writes
    there is tracked -- the 241 masters under `raw/` are the artifact that
    must survive, and they are what git-lfs carries.
    """
    return build_root() / WORK_ID


INDEX_URLS = {
    "Dore-OT.htm": "https://catholic-resources.org/Art/Dore-OT.htm",
    "Dore-NT.htm": "https://catholic-resources.org/Art/Dore-NT.htm",
}

#: The English Wikipedia article, as wikitext through the action API. Its table
#: is the independent transcription that checks the captions.
WIKI_URL = (
    "https://en.wikipedia.org/w/api.php?action=parse"
    "&page=Gustave%20Dor%C3%A9%27s%20illustrations%20for%20La%20Grande%20Bible%20de%20Tours"
    "&prop=wikitext&format=json&formatversion=2"
)

USER_AGENT = "glossa-catholica/1.0 (+https://glossacatholica.org)"

#: catholic-resources.org publishes no robots.txt crawl delay, so this is our
#: own floor rather than one asked of us. It is the same two seconds we hold
#: for vatican.va: a personal academic site serving 4-6 MB scans deserves at
#: least the courtesy the Holy See asks for.
CRAWL_DELAY = 2.0

#: Widths served, and the AVIF quality each is encoded at. Two sizes, because
#: the whole point of the smaller one is that a phone never downloads the
#: larger: a browser fetches exactly one entry of a srcset. Encoding is a
#: little softer at 1200 than at 800 -- the artifacts are proportionally
#: smaller there, and dense line work is where the bytes go.
OUTPUT_SIZES = ((800, 60), (1200, 58))


@dataclass(frozen=True)
class Reading:
    """What one source says a plate depicts."""

    osis: str | None
    chapter: int | None
    verse: int | None


@dataclass(frozen=True)
class Anchor:
    """One plate, resolved to where it belongs, with every reading behind it."""

    plate_id: str
    number: int
    #: The elected address, in Vulgate numbering.
    osis: str
    chapter: int
    verse: int | None
    anchor: str  # "verse" | "chapter"
    #: Which reading supplied the book, and which the verse.
    book_source: str
    verse_source: str | None
    title: str
    caption_title: str | None
    #: Each source verbatim, BEFORE election or Vulgate conversion, so a later
    #: disagreement can be argued from what was actually read rather than from
    #: our arithmetic over it.
    caption: Reading
    wiki: Reading
    index: Reading
    wiki_number: int | None
    alternate: str | None
    source_url: str
    agreement: str  # confirmed | disputed | caption-only | wiki-only | unplaced


def _fetcher(offline: bool, refresh: bool) -> Fetcher:
    return Fetcher(
        cache_dir=raw_root() / "dore",
        policy=FetchPolicy(
            user_agent=USER_AGENT,
            delay=CRAWL_DELAY,
            attempts=4,
            backoff=(2.0, 8.0, 20.0),
            timeout=60.0,
        ),
        offline=offline,
        refresh=refresh,
    )


def fetch_indexes(
    fetcher: Fetcher,
) -> tuple[list[sources.IndexPlate], list[sources.WikiPlate]]:
    """The two catholic-resources tables and the Wikipedia one, cache-first."""
    index: list[sources.IndexPlate] = []
    for name, url in INDEX_URLS.items():
        data, error = fetcher.try_fetch(url, name)
        if data is None:
            raise SystemExit(f"dore: {error}")
        index += sources.parse_index(data.decode("utf-8", "replace"))

    data, error = fetcher.try_fetch(WIKI_URL, "wikipedia-table.json")
    if data is None:
        raise SystemExit(f"dore: {error}")
    wikitext = json.loads(data)["parse"]["wikitext"]
    return index, sources.parse_wikitable(wikitext)


def fetch_plates(
    index: list[sources.IndexPlate], *, limit: int | None = None
) -> list[str]:
    """Download the full-resolution masters into `raw/`, resumably.

    `download_resumable` rather than the plain fetcher because these are 4-6 MB
    each: a whole-response read that drops at 90% starts again from zero, and
    241 of those is a lot of somebody else's bandwidth to spend twice.

    THESE ARE THE ONLY ARTIFACT HERE THAT COST A REAL FETCH, and the only one
    git tracks: `build/` rebuilds from them in minutes with no network and is
    ignored, so these carry the whole of the "re-parse, never re-crawl"
    insurance for this work. They are held in git-lfs -- 1.1 GB of JPEG is not
    something to put in a packfile, and the corpus has just been through one
    history rewrite already.
    """
    destination = raw_root() / "dore" / "plates"
    failures: list[str] = []
    for plate in index[:limit]:
        target = destination / f"{plate.plate_id}.jpg"
        if target.exists():
            continue
        size, error = download_resumable(
            plate.url,
            target,
            policy=FetchPolicy(user_agent=USER_AGENT, delay=CRAWL_DELAY, timeout=120.0),
        )
        if error:
            failures.append(f"{plate.plate_id}: {error}")
        else:
            print(f"  {plate.plate_id}  {size // 1024} KB")
    return failures


def read_caption(
    path: Path,
) -> tuple[str | None, tuple[str | None, int | None, int | None]]:
    """OCR the printed caption below the plate: its title, and its reference.

    Runs BEFORE the crop that discards the caption, on the region the crop is
    about to remove -- so it costs one tesseract call and no extra pixels.

    Read at full resolution and nowhere else. The words are what degrade first
    ("Genesis" comes back as "Gesests" at 450px, "Zechariah" as "Zecharisk")
    while the digits survive; `parse_caption` accepts a book name only above a
    similarity floor and returns the numbers regardless, so a degraded read
    loses the book rather than inventing one.
    """
    with Image.open(path) as image:
        gray = plateio.to_grayscale(image)
        box = plateio.find_plate_box(np.asarray(gray).astype(float))
        if box is None:
            return None, (None, None, None)
        band = plateio.caption_band(gray, box)
        if band.height < 8:
            return None, (None, None, None)
        band = band.resize((band.width * 2, band.height * 2), Image.LANCZOS)
        scratch = path.with_suffix(".caption.png")
        band.save(scratch)
    try:
        result = subprocess.run(
            ["tesseract", str(scratch), "-", "--psm", "6"],
            capture_output=True,
            text=True,
            check=False,
        )
    finally:
        scratch.unlink(missing_ok=True)

    text = result.stdout
    locus = sources.parse_caption(text)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    # The caption's first line is its title, set in capitals above the excerpt.
    title = None
    for line in lines:
        letters = [c for c in line if c.isalpha()]
        if len(letters) >= 6 and sum(c.isupper() for c in letters) / len(letters) > 0.8:
            title = line.strip(" |.-")
            break
    return title, locus


def _normalize(text: str) -> str:
    return " ".join(re.sub(r"[^a-z ]", " ", text.lower()).split())


#: Title similarity below which a pairing is not proposed at all. Measured:
#: the true pairs whose books disagree score 0.72 and up on the caption title,
#: and the best WRONG cross-book pair scores below 0.5.
MIN_TITLE_SIMILARITY = 0.55


def pair_with_wikipedia(
    index: list[sources.IndexPlate],
    wiki: list[sources.WikiPlate],
    captions: dict[str, tuple[str | None, int | None]],
) -> dict[str, sources.WikiPlate]:
    """Match each plate to the Wikipedia row describing it, best pair first.

    NOT BY PLATE NUMBER -- the two indexes order the series differently, and
    joining on the number agrees on only 95 of 241.

    ON THE CAPTION'S TITLE, not the index's. Both the caption and Wikipedia
    descend from the 1866 plates and print nearly the same words -- "THE ANGEL
    APPEARING TO JOSHUA" against "The Angel Appearing to Joshua" -- while
    catholic-resources rewrote its titles into modern English ("Cedars Are Cut
    Down for the Jerusalem Temple" for "Cutting Down Cedars for the
    Construction of the Temple"). Matching on the rewritten titles is what made
    an earlier attempt propose "Achan Is Stoned to Death" for "The Vision of
    Death" at 0.60. The OCR'd caption is the better key by a wide margin.

    BOOK AND CHAPTER SCORE, THEY DO NOT FILTER. Restricting candidates to the
    index's own book left six plates unpaired, and every one of them had an
    unclaimed Wikipedia row that matched its caption almost word for word --
    the two sources simply disagree about where the scene belongs. Two of those
    disagreements are the index being wrong (its "Judges 2" plate is captioned
    THE ANGEL APPEARING TO JOSHUA), one is a locus the index itself offers as
    an alternate, and the rest are a scene told in more than one book. A hard
    filter cannot express any of that; a bonus can.

    GLOBALLY BEST-FIRST, not per-plate. 34 chapters hold more than one plate
    (John 19 holds four), so giving each plate its own best free row in index
    order lets an early plate take the row a later one needed -- which is how
    the burial of Christ (John 19:40) came to be paired against the crowning
    with thorns (19:2). Scoring every pair first lets the confident ones settle
    before the doubtful ones choose.
    """
    from difflib import SequenceMatcher

    scored: list[tuple[float, str, sources.WikiPlate]] = []
    for plate in index:
        caption_title, locus = captions.get(plate.plate_id, (None, (None, None, None)))
        caption_osis, _, caption_verse = locus
        # The caption when OCR read one, else the index's rewritten title.
        target = _normalize(caption_title or plate.title)
        for row in wiki:
            similarity = SequenceMatcher(None, target, _normalize(row.title)).ratio()
            agrees_with_index = row.osis == plate.osis
            agrees_with_caption = caption_osis is not None and row.osis == caption_osis
            if (
                similarity < MIN_TITLE_SIMILARITY
                and not agrees_with_index
                and not agrees_with_caption
            ):
                continue
            score = similarity
            # The caption is the artifact's own word, so a row agreeing with it
            # is weighted above one agreeing only with the index -- which is
            # what lets the six relocated plates find their row at all.
            if agrees_with_caption:
                score += 0.80
            if agrees_with_index:
                score += 0.60
                if row.chapter == plate.chapter:
                    score += 0.40
                elif abs(row.chapter - plate.chapter) <= 2:
                    score += 0.15
            if caption_verse is not None and row.verse is not None:
                score += 0.30 / (1.0 + abs(row.verse - caption_verse))
            scored.append((score, plate.plate_id, row))

    scored.sort(key=lambda item: -item[0])
    paired: dict[str, sources.WikiPlate] = {}
    claimed: set[int] = set()
    for _, plate_id, row in scored:
        if plate_id in paired or row.number in claimed:
            continue
        paired[plate_id] = row
        claimed.add(row.number)
    return paired


def elect_book(
    caption: Reading, wiki: Reading, index: Reading, index_alternate: Reading
) -> tuple[str, str]:
    """The book a plate belongs to, and which witness carried the vote.

    THREE READINGS, BUT NOT THREE INDEPENDENT VOTERS. The index table and the
    verse pencilled in the scan's own margin are both Fr. Just: he reclassified
    some plates for his teaching collection and wrote the new locus on the
    page. Counting the note and the table separately would give one person two
    votes and let him outvote the artifact, so the note is not read at all --
    the table already says what he thinks.

    That leaves three genuine witnesses: the 1866 plate's printed caption, the
    English Wikipedia table, and Fr. Just. Two agreeing win; all three
    differing goes to the caption, the artifact's own word about itself.

    AN INDEX ROW MAY ENDORSE TWO BOOKS, and ignoring the second one is what
    made this necessary. Seven rows read "Matt 27A (or John 19B)" -- a scene
    told in more than one gospel, which the index declines to choose between.
    Treating only the primary as its vote meant a caption reading John 19 lost
    two-to-one to Matthew, and "THE CROWN OF THORNS" anchored at Matthew 27:60,
    which is the burial. In all seven the alternate agrees with the caption, so
    the index was never the dissenter it appeared to be.
    """
    endorsements: dict[str, set[str]] = {}

    def endorse(osis: str | None, witness: str) -> None:
        if osis:
            endorsements.setdefault(osis, set()).add(witness)

    endorse(caption.osis, "caption")
    endorse(wiki.osis, "wikipedia")
    endorse(index.osis, "index")
    endorse(index_alternate.osis, "index")

    if not endorsements:
        raise AssertionError("a plate with no book at all")

    # Most witnesses wins; the caption breaks a tie, then Wikipedia. Ordering
    # the preference explicitly rather than relying on dict order, because
    # which witness wins a 1-1 split is a decision, not an implementation
    # detail: it decides every plate whose caption OCR could not be read.
    def rank(item: tuple[str, set[str]]) -> tuple[int, int, int]:
        _osis, witnesses = item
        return (
            len(witnesses),
            1 if "caption" in witnesses else 0,
            1 if "wikipedia" in witnesses else 0,
        )

    osis, witnesses = max(endorsements.items(), key=rank)
    for witness in ("caption", "wikipedia", "index"):
        if witness in witnesses:
            return osis, witness
    raise AssertionError("elected a book no witness endorsed")


def reconcile(
    index: list[sources.IndexPlate],
    wiki: list[sources.WikiPlate],
    captions: dict[str, tuple[str | None, tuple[str | None, int | None, int | None]]],
    verse_exists: object = None,
) -> list[Anchor]:
    """Resolve each plate to an address, recording what agreed and what did not.

    THE CAPTION WINS THE VERSE. It is the plate's own printed statement, and
    where it differs from Wikipedia the two are usually both right about the
    same picture -- the caption cites the line it QUOTES beneath the engraving,
    Wikipedia the verse the scene DEPICTS. Most disagreements are within two
    verses and of exactly that kind.

    A CAPTION THAT CANNOT BE TRUE DOES NOT WIN. OCR misreads a digit now and
    then, and the tell is an address the Bible does not have -- `Ruth 2:58` in
    a chapter of 23 verses. Where `verse_exists` rejects a reading, the next
    source stands in. Preferring a source is not trusting it blindly.

    THE BOOK IS VOTED ON, not taken from the index; see `elect_book`.
    """
    paired = pair_with_wikipedia(index, wiki, captions)

    anchors: list[Anchor] = []
    for plate in index:
        caption_title, locus = captions.get(plate.plate_id, (None, (None, None, None)))
        caption = Reading(*locus)
        match = paired.get(plate.plate_id)
        wiki_reading = Reading(
            match.osis if match else None,
            match.chapter if match else None,
            match.verse if match else None,
        )
        index_reading = Reading(plate.osis, plate.chapter, None)
        alternate_reading = Reading(plate.alternate_osis, plate.alternate_chapter, None)

        osis, book_source = elect_book(
            caption, wiki_reading, index_reading, alternate_reading
        )

        # Only readings that agree with the elected book may place it inside
        # that book; a reading outvoted on the book cannot be trusted for the
        # chapter either.
        chapter, verse, verse_source = None, None, None
        for reading, name in (
            (caption, "caption"),
            (wiki_reading, "wikipedia"),
            (index_reading, "index"),
            (alternate_reading, "index"),
        ):
            if reading.osis is not None and reading.osis != osis:
                continue
            if reading.chapter is None:
                continue
            try:
                # Unconditional, not a fallback: the verses BEFORE a late-merge
                # point resolve to real, existing, WRONG text.
                mapped_chapter, mapped_verse = to_vulgate(
                    osis, reading.chapter, reading.verse
                )
            except WholesaleDivergence:
                continue
            if verse_exists is not None and not verse_exists(
                osis, mapped_chapter, mapped_verse
            ):
                continue
            chapter, verse, verse_source = mapped_chapter, mapped_verse, name
            break
        if chapter is None:
            chapter, verse, verse_source = plate.chapter, None, None

        if caption.verse is not None and wiki_reading.verse is not None:
            same = (caption.osis in (None, wiki_reading.osis)) and (
                caption.chapter == wiki_reading.chapter
            )
            agreement = (
                "confirmed"
                if same and caption.verse == wiki_reading.verse
                else "disputed"
            )
        elif caption.verse is not None:
            agreement = "caption-only"
        elif wiki_reading.verse is not None:
            agreement = "wiki-only"
        else:
            agreement = "unplaced"

        anchors.append(
            Anchor(
                plate_id=plate.plate_id,
                number=plate.number,
                osis=osis,
                chapter=chapter,
                verse=verse,
                anchor="verse" if verse is not None else "chapter",
                book_source=book_source,
                verse_source=verse_source,
                title=plate.title,
                caption_title=caption_title,
                caption=caption,
                wiki=wiki_reading,
                index=index_reading,
                wiki_number=match.number if match else None,
                alternate=plate.alternate,
                source_url=plate.url,
                agreement=agreement,
            )
        )
    return anchors


def derive_images(anchors: list[Anchor], out_root: Path) -> list[str]:
    """Crop, level, resize and encode every plate at every served width."""
    source_dir = raw_root() / "dore" / "plates"
    problems: list[str] = []
    for anchor in anchors:
        master = source_dir / f"{anchor.plate_id}.jpg"
        if not master.exists():
            problems.append(f"{anchor.plate_id}: master not fetched")
            continue
        with Image.open(master) as image:
            deviation = plateio.chroma_deviation(image)
            if deviation > 2.0:
                # Not flattened silently: every master measured so far is
                # exactly neutral, and one that is not is a different scan.
                problems.append(
                    f"{anchor.plate_id}: chroma deviation {deviation:.0f}, not neutral"
                )
            for width, quality in OUTPUT_SIZES:
                rendered = plateio.derive(image, width)
                plateio.encode_avif(
                    rendered,
                    out_root / f"{anchor.plate_id}-{width}.avif",
                    quality=quality,
                )
    return problems


def tesseract_version() -> str:
    """The OCR engine's version, recorded beside the output it produced.

    `plates.json` is `build/`, untracked, and regenerates from `raw/` with no
    network -- but not every input to it is a file. 202 of the 241 verse
    anchors come from tesseract reading a printed caption, and a different
    engine version can read a digit differently. That would move an anchor
    silently on a rebuild, which is the one way this output could drift from
    its inputs. Recording the version does not prevent it; it makes it
    visible in a diff, which is the same reason `retrieved_at` is stored.
    """
    try:
        first = subprocess.run(
            ["tesseract", "--version"], capture_output=True, text=True, check=False
        ).stdout.splitlines()
        return first[0].strip() if first else "unknown"
    except OSError:
        return "unavailable"


def verse_checker() -> object:
    """`(osis, chapter, verse) -> bool` over the Douay-Rheims in `build/`.

    The Bible is the edition the plates are anchored INTO, so it is the only
    thing that can say whether an address exists. Without it a misread digit
    stands: `Ruth 2:58` is a perfectly plausible-looking anchor until you know
    Ruth 2 ends at 23.

    Returns None when the Bible has not been built, and `reconcile` then skips
    the check rather than rejecting everything -- a corpus mid-rebuild must not
    silently strip every verse anchor in the work.
    """
    books = build_root() / "bible.douay-rheims.en" / "books"
    if not books.is_dir():
        return None
    counts: dict[tuple[str, int], set[int]] = {}
    for path in books.glob("*.json"):
        book = json.loads(path.read_text(encoding="utf-8"))
        for chapter in book.get("chapters", []):
            counts[(book["osis"], chapter["n"])] = {
                verse["n"] for verse in chapter.get("verses", [])
            }

    def exists(osis: str, chapter: int, verse: int | None) -> bool:
        if verse is None:
            return (osis, chapter) in counts
        return verse in counts.get((osis, chapter), ())

    return exists


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--fetch-plates", action="store_true", help="download the 241 masters into raw/"
    )
    parser.add_argument(
        "--derive", action="store_true", help="rebuild the served images from raw/"
    )
    parser.add_argument(
        "--limit", type=int, help="stop after N plates (for a trial run)"
    )
    parser.add_argument(
        "--offline", action="store_true", help="never touch the network"
    )
    parser.add_argument(
        "--refresh", action="store_true", help="refetch the index pages"
    )
    args = parser.parse_args()

    require_corpus()
    fetcher = _fetcher(offline=args.offline, refresh=args.refresh)
    index, wiki = fetch_indexes(fetcher)
    print(f"index: {len(index)} plates   wikipedia: {len(wiki)} rows")
    if len(index) != 241:
        print(f"  WARNING: expected 241 plates, parsed {len(index)}")

    if args.fetch_plates:
        print("fetching masters (2s floor, resumable):")
        for failure in fetch_plates(index, limit=args.limit):
            print(f"  FAILED {failure}")

    source_dir = raw_root() / "dore" / "plates"
    captions: dict[str, tuple[str | None, int | None]] = {}
    for plate in index[: args.limit]:
        master = source_dir / f"{plate.plate_id}.jpg"
        if master.exists():
            captions[plate.plate_id] = read_caption(master)

    exists = verse_checker()
    if exists is None:
        print("  NOTE: no bible.douay-rheims.en in build/; verse existence unchecked")
    anchors = reconcile(index, wiki, captions, exists)

    tally: dict[str, int] = {}
    for anchor in anchors:
        tally[anchor.agreement] = tally.get(anchor.agreement, 0) + 1
    print("agreement: " + "  ".join(f"{k}={v}" for k, v in sorted(tally.items())))
    print(
        f"anchored to a verse: {sum(1 for a in anchors if a.anchor == 'verse')}   "
        f"to a chapter: {sum(1 for a in anchors if a.anchor == 'chapter')}   "
        f"verse from caption: {sum(1 for a in anchors if a.verse_source == 'caption')}   "
        f"from wikipedia: {sum(1 for a in anchors if a.verse_source == 'wikipedia')}"
    )
    for anchor in anchors:
        sources_disagree = {
            r.osis for r in (anchor.caption, anchor.wiki, anchor.index) if r.osis
        }
        if len(sources_disagree) > 1:
            print(
                f"  BOOK VOTED {anchor.plate_id}: caption={anchor.caption.osis} "
                f"wikipedia={anchor.wiki.osis} index={anchor.index.osis} "
                f"-> {anchor.osis} {anchor.chapter}:{anchor.verse} "
                f"(carried by {anchor.book_source})  {anchor.caption_title or anchor.title}"
            )
    # A caption that lost the verse was rejected as impossible, not outvoted --
    # the only case where the stated preference does not hold, so it is named.
    for anchor in anchors:
        if (
            anchor.caption.verse is not None
            and anchor.verse_source != "caption"
            and anchor.caption.osis in (None, anchor.osis)
        ):
            print(
                f"  CAPTION REJECTED {anchor.plate_id} {anchor.osis} {anchor.chapter}: "
                f"caption {anchor.caption.chapter}:{anchor.caption.verse} does not exist; "
                f"using {anchor.verse_source or 'chapter anchor'} {anchor.verse}"
            )
    for anchor in anchors:
        if anchor.anchor == "chapter":
            print(
                f"  CHAPTER ANCHOR {anchor.plate_id} {anchor.osis} {anchor.chapter}  "
                f"{anchor.caption_title or anchor.title}"
            )

    out = work_dir()
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_stamped_json(
        out,
        {
            "plates.json": {
                "work": WORK_ID,
                "generated_at": generated_at,
                "ocr_engine": tesseract_version(),
                "artist": "Gustave Doré (1832-1883)",
                "edition": "La Grande Bible de Tours (Mame, Tours, 1866)",
                "reproduction": "The Doré Bible Illustrations (Dover, 1974)",
                "source": "https://catholic-resources.org/Art/Dore-OT.htm",
                "credit": "Material provided by Rev. Felix Just, S.J., at https://catholic-resources.org",
                "plates": [asdict(a) for a in anchors],
            }
        },
        generated_at,
    )
    print(f"wrote {out / 'plates.json'}")

    if args.derive:
        images = out / "images"
        wanted = anchors[: args.limit]
        print(f"deriving {len(wanted)} plates at {len(OUTPUT_SIZES)} sizes -> {images}")
        for problem in derive_images(wanted, images):
            print(f"  {problem}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
