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

PROVENANCE, and why there is no reconciliation here any more. Two indexes
describe this set and both number the plates 1 to 241 -- but they order them
differently, so the numbers do not correspond and joining on them mis-anchors
146 of the 241 while looking entirely reasonable. The plate's own printed
caption was the way out, because it is attached to the file rather than to a
position in a list: OCR read all 241 captions, a three-way vote settled each
book and verse against the Wikipedia table and the index, and the result is
`pipeline/dore-anchors.json`, tracked in the site repository.

THAT WAS A ONE-TIME PIECE OF WORK AND IT IS DONE. The code that did it was
deleted on 2026-08-28 along with `sources.py`, and this file no longer reads a
caption, parses an index or asks Wikipedia anything. Not merely to save the
64 seconds of tesseract a rebuild was spending: OCR is not a pure function of
a file, so re-deriving those anchors on every rebuild was a re-decision
wearing a rebuild's clothes -- and `plates.json` lives in `build/`, which is
untracked, so nothing would have shown a verse moving. A vote whose result is
written down has nothing left to decide. The anchors file kept every witness's
reading at first and no longer does: with the code that weighed them gone,
nothing read them either, so they went the same way it did. Both are in git
history (`ca1b76d`), which is where the evidence for a decision already taken
belongs.

WHAT IS LEFT IS ENCODING, and that is here because it genuinely is not
settled: the AVIF quality ladder, the crop, the served widths and the masters
themselves can all change, and each change has to be able to run over the 241
scans again. `--derive` is that, and it is the reason this is still a script
rather than a JSON file.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

from PIL import Image

# `common` is a package one directory up; Python puts a script's own directory
# on sys.path at startup, and since this file sits in dore/ that directory is
# no longer the one holding it. Hence the imports below sitting under this.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import plates as plateio
from common import (
    DORE_ANCHORS_PATH,
    FetchPolicy,
    build_root,
    captured_at,
    download_resumable,
    raw_root,
    require_corpus,
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


#: Where a master lives, one per plate id. A template rather than 241 stored
#: URLs: every one of them was `.../Dore/Images/{plate_id}.jpg`, so the strings
#: were a third of `dore-anchors.json` restating the id beside it. If the site
#: ever rearranges, this is the one line to change -- and the masters are in
#: `raw/` already, so nothing routine reads it.
MASTER_URL = "https://catholic-resources.org/Dore/Images/{plate_id}.jpg"

#: The two index pages, kept for the manifest alone: they are where the
#: collection came from and `captured_at` reads the day each was fetched off
#: the copy in `raw/`. Nothing parses them any more -- what they were parsed
#: FOR is decided and committed (`pipeline/dore-anchors.json`).
INDEX_URLS = {
    "Dore-OT.htm": "https://catholic-resources.org/Art/Dore-OT.htm",
    "Dore-NT.htm": "https://catholic-resources.org/Art/Dore-NT.htm",
}

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


def load_anchors() -> tuple[list[dict], dict]:
    """The 241 committed anchors, and the provenance recorded with them.

    Each record is one plate and five fields: `plate_id`, the address it was
    anchored to (`osis`, `chapter`, `verse`), and the `title` the site prints
    under it. They go into `plates.json` verbatim, which is why nothing here
    reshapes them -- the file IS the payload, and a transformation in between
    would be one more thing that could move an anchor.

    Read from the site repository rather than the corpus, because this is the
    one input to `plates.json` that does not regenerate from `raw/`. See the
    file's own header, which also says where the witnesses' readings went.
    """
    data = json.loads(DORE_ANCHORS_PATH.read_text(encoding="utf-8"))
    plates = data["plates"]
    if len(plates) != 241:
        print(
            f"  WARNING: expected 241 anchors, {DORE_ANCHORS_PATH} holds {len(plates)}"
        )
    return plates, data


def fetch_plates(anchors: list[dict], *, limit: int | None = None) -> list[str]:
    """Download the full-resolution masters into `raw/`, resumably.

    `download_resumable` rather than the plain fetcher because these are 4-6 MB
    each: a whole-response read that drops at 90% starts again from zero, and
    241 of those is a lot of somebody else's bandwidth to spend twice.

    Each master's URL is `MASTER_URL` over the plate id, which is the only
    remaining reason this can still run at all: nothing here parses the index
    page that used to supply them.

    THESE ARE THE ONLY ARTIFACT HERE THAT COST A REAL FETCH, and the only one
    git tracks: `build/` rebuilds from them in minutes with no network and is
    ignored, so these carry the whole of the "re-parse, never re-crawl"
    insurance for this work. They are held in git-lfs -- 1.1 GB of JPEG is not
    something to put in a packfile, and the corpus has just been through one
    history rewrite already.
    """
    destination = raw_root() / "dore" / "plates"
    failures: list[str] = []
    for plate in anchors[:limit]:
        plate_id = plate["plate_id"]
        target = destination / f"{plate_id}.jpg"
        if target.exists():
            continue
        size, error = download_resumable(
            MASTER_URL.format(plate_id=plate_id),
            target,
            policy=FetchPolicy(user_agent=USER_AGENT, delay=CRAWL_DELAY, timeout=120.0),
        )
        if error:
            failures.append(f"{plate_id}: {error}")
        else:
            print(f"  {plate_id}  {size // 1024} KB")
    return failures


def derive_images(anchors: list[dict], out_root: Path) -> list[str]:
    """Crop, level, resize and encode every plate at every served width.

    Writes `sizes.json` beside the images: `plate_id -> width -> [w, h]`.

    THE SITE CANNOT MEASURE THESE AND MUST NOT GUESS THEM. Every plate is
    rendered at a fixed width, but the crop is the engraving's own, so the
    HEIGHT is different for each one -- 241 aspect ratios, none of them known
    before the ink block is found. An `<img>` without both dimensions reserves
    no space, and a plate landing mid-chapter after the text has painted
    shoves the verse the reader was on off the screen. The numbers exist only
    here, at the moment the encoder is handed the pixels, so they are recorded
    here rather than re-derived by a second decoder somewhere downstream.
    """
    source_dir = raw_root() / "dore" / "plates"
    problems: list[str] = []
    sizes: dict[str, dict[str, list[int]]] = {}
    for anchor in anchors:
        plate_id = anchor["plate_id"]
        master = source_dir / f"{plate_id}.jpg"
        if not master.exists():
            problems.append(f"{plate_id}: master not fetched")
            continue
        with Image.open(master) as image:
            deviation = plateio.chroma_deviation(image)
            if deviation > 2.0:
                # Not flattened silently: every master measured so far is
                # exactly neutral, and one that is not is a different scan.
                problems.append(
                    f"{plate_id}: chroma deviation {deviation:.0f}, not neutral"
                )
            for width, quality in OUTPUT_SIZES:
                rendered = plateio.derive(image, width)
                plateio.encode_avif(
                    rendered,
                    out_root / f"{plate_id}-{width}.avif",
                    quality=quality,
                )
                sizes.setdefault(plate_id, {})[str(width)] = list(rendered.size)
    if sizes:
        out_root.mkdir(parents=True, exist_ok=True)
        (out_root / "sizes.json").write_text(
            json.dumps(sizes, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
    return problems


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
    args = parser.parse_args()

    require_corpus()
    anchors, provenance = load_anchors()
    print(
        f"anchors: {len(anchors)} plates, decided {provenance['decided_at']} "
        f"({provenance['ocr_engine']})"
    )
    chapters = {(a["osis"], a["chapter"]) for a in anchors}
    print(
        f"anchored to a verse: {sum(1 for a in anchors if a['verse'] is not None)}   "
        f"to a chapter: {sum(1 for a in anchors if a['verse'] is None)}   "
        f"across {len(chapters)} chapters"
    )

    if args.fetch_plates:
        print("fetching masters (2s floor, resumable):")
        for failure in fetch_plates(anchors, limit=args.limit):
            print(f"  FAILED {failure}")

    out = work_dir()
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_stamped_json(
        out,
        {
            # A MANIFEST BECAUSE THAT IS WHAT MAKES A DIRECTORY VISIBLE.
            # `sync-corpus.mjs` states the rule outright -- "a work IS its
            # manifest" -- and reports any directory under `build/` without
            # one as a work whose scrape did not finish. This collection is
            # not a work in the reading sense (no language, no addresses, no
            # text), and the sync branches on `type` to keep it out of the
            # registry; but it is the corpus's record of where 241 images
            # came from and who is owed credit for them, and a manifest is
            # where the corpus keeps that for everything else.
            "manifest.json": {
                "id": WORK_ID,
                "type": "plates",
                "title": "Doré's Illustrations for La Grande Bible de Tours",
                "short_title": "Doré Bible Illustrations",
                # The engravings carry no language. `title` on each plate is
                # English because the caption Doré's engraver cut into the
                # steel is English in this reproduction, and it is a label for
                # the picture rather than text to be read.
                "language": None,
                "edition": "La Grande Bible de Tours (Alfred Mame et fils, Tours, 1866)",
                "sources": [
                    {
                        "url": url,
                        "retrieved_at": captured_at(raw_root() / "dore" / name),
                    }
                    for name, url in INDEX_URLS.items()
                ],
                # PUBLIC DOMAIN TWICE OVER, AND CREDITED ANYWAY. Doré died in
                # 1883 and the plates were published in 1866, so the
                # engravings are out of copyright everywhere; a faithful
                # photographic reproduction of a two-dimensional public-domain
                # work originates no new copyright of its own (Bridgeman v.
                # Corel), which covers both the Dover printing and the scans.
                # The credit line below is therefore courtesy, not licence --
                # it is what the site displays, and it is the request
                # catholic-resources.org actually makes of anyone reusing the
                # files.
                "copyright": {
                    "status": "public-domain",
                    "holder": None,
                    "notice": "Engraved 1866; Gustave Doré died 1883. Public domain.",
                },
                "credit": {
                    "artist": "Gustave Doré (1832-1883)",
                    "reproduction": "The Doré Bible Illustrations (Dover Publications, 1974)",
                    "provider": "Rev. Felix Just, S.J.",
                    "provider_url": "https://catholic-resources.org/Art/",
                },
                "notes": (
                    "241 steel engravings, anchored to a verse of "
                    "bible.douay-rheims.en by vote of three readings: the "
                    "caption printed under each plate (read by OCR), the "
                    "Wikipedia table, and catholic-resources.org's own index. "
                    "That reconciliation ran once and its result is committed "
                    "as pipeline/dore-anchors.json in the site repository; the "
                    "code that produced it, and the witnesses' individual "
                    "readings, are in that repository's git history. This "
                    "scraper now encodes the images and writes this manifest."
                ),
                "generated_at": generated_at,
            },
            # THE ANCHORS, AND NOTHING THE MANIFEST ALREADY SAYS. This
            # carried a second copy of the artist, edition, reproduction,
            # source and credit lines, which `manifest.json` above holds and
            # is the only place the sync reads them from -- two records of one
            # fact, and the wrong one to correct is the one nothing reads.
            "plates.json": {
                "work": WORK_ID,
                "generated_at": generated_at,
                # How the anchors were arrived at, carried so the corpus says
                # it on its own: the day they were decided, and the engine
                # that read the captions behind them -- not whatever tesseract
                # happens to be installed today, which no longer runs and has
                # produced none of this.
                "anchors_decided": provenance["decided_at"],
                "ocr_engine": provenance["ocr_engine"],
                "plates": anchors,
            },
        },
        generated_at,
    )
    print(f"wrote {out / 'plates.json'} and {out / 'manifest.json'}")

    if args.derive:
        images = out / "images"
        wanted = anchors[: args.limit]
        print(f"deriving {len(wanted)} plates at {len(OUTPUT_SIZES)} sizes -> {images}")
        for problem in derive_images(wanted, images):
            print(f"  {problem}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
