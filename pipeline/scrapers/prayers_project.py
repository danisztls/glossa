#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# ///
"""Project `build/prayer.common.*` from the CURATED prayers, not from a parse.

`<corpus>/authored/prayers/*.json` is the prayer corpus now: one file per
prayer, the text as it should read, in every language, with each editorial
act recorded beside it. This writes the work directories the site reads out of
those files. `prayers.py` still runs -- as the VERIFIER that every curated
line is findable in the page it cites -- but it no longer decides what a
prayer says.

WHY THE PARSE COULD NOT STAY THE SOURCE. Three things the curation holds are
not recoverable by re-reading vatican.va's Compendium at all:

  * four editions that are not in it -- Hindi, Vietnamese and both Chinese
    scripts come from Vatican News, and seven further prayers with them
    (St Michael, St Joseph, the Holy Family, spiritual communion, the Divine
    Mercy chaplet, the consecration, the prayer for the Pope);
  * the current text where the 2005 edition's is superseded -- the French
    (2017) and Italian (2020) sixth petition, the Missal Creeds, the collects
    the German page omits;
  * the STANZAS. Only `prayer.common.la` divided the Veni Creator into its
    seven quatrains; every vernacular page runs the lines together, and the
    curated files carry the form.

WHAT IS DERIVED HERE AND NOT WRITTEN DOWN. `sources` is the distinct set of
URLs the curated file itself cites for that language, so provenance cannot
drift from the text it belongs to; the collection order and its groups come
from `prayers.STRUCTURE_GROUPS`, which is where they already lived.

THE LATIN IS ONE TEXT AND IT IS ATTACHED TO EVERY EDITION. The appendix
prints it beside each vernacular, so the corpus used to hold fourteen
transcriptions of one text with their own misprints (`luz perpetua`,
`Spirits Sancti`, `sieut locutus`). The curated file holds ONE canonical
Latin per prayer; this attaches that one to every language's entry and emits
`prayer.common.la` from the same field, so the companion a German reader sees
and the Latin edition a Latin reader reads cannot disagree.
"""

import argparse
import json
import sys
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import common
import prayers as P
from common import require_corpus, write_stamped_json

#: The eighth structure group: the prayers Vatican News publishes and the
#: Compendium's appendix does not. Kept here rather than in
#: `prayers.STRUCTURE_GROUPS` because that table describes the appendix, and
#: these seven are not in it -- the grouping is editorial either way (see the
#: note above that table), and a reader browsing a devotion should not have to
#: know which of two Vatican sites published it.
EXTRA_GROUP = (
    {
        "en": "Devotions and Intercessions",
        "pt": "Devoções e intercessões",
        "la": "Devotiones et intercessiones",
    },
    [
        "saint-michael-the-archangel",
        "prayer-to-saint-joseph",
        "prayer-to-the-holy-family",
        "spiritual-communion",
        "chaplet-of-divine-mercy",
        "consecration-to-the-immaculate-heart",
        "prayer-for-the-pope",
    ],
)

#: Editions with no `LANG_CONFIG` entry, because no Compendium exists in them.
#: The titles are the Vatican News section's own, read off its index page --
#: never invented here, for the reason recorded in the curation's README.
VN_EDITIONS = {
    "hi": ("सभी प्रार्थनाएँ", "प्रार्थनाएँ"),
    "vi": ("Tất cả các kinh", "Kinh nguyện"),
    "zh": ("所有祈祷经文", "祈祷经文"),
    "zht": ("所有祈禱經文", "祈禱經文"),
}

#: The two work ids that are not a language of `LANG_CONFIG`. `la` is the
#: derived Latin edition and `en-gb` a REGIONAL one -- five prayers, the UK
#: wording, and nothing else. Both names come from `prayers.py`, which is
#: where they were settled.
SPECIAL_EDITIONS = {
    "la": (P.LATIN_TITLE, P.LATIN_TITLE, "la"),
    "en-gb": (P.REGIONAL_TITLE, P.REGIONAL_TITLE, P.REGIONAL_LANGUAGE),
}

COPYRIGHT = {
    "status": "copyrighted",
    "holder": "Libreria Editrice Vaticana",
    "notice": "© Copyright - Libreria Editrice Vaticana",
}


def curated_dir() -> Path:
    """`<corpus>/authored/prayers/`, which was `oracles/prayers/` until
    2026-09-04 -- see `authored_root` for why the old name said the opposite
    of the truth about this directory."""
    return common.authored_root() / "prayers"


def load() -> dict[str, dict]:
    files = sorted(curated_dir().glob("*.json"))
    if not files:
        raise RuntimeError(f"no curated prayers in {curated_dir()}")
    return {f.stem: json.loads(f.read_text(encoding="utf-8")) for f in files}


def order() -> list[str]:
    """Collection order: the appendix's groups, then the devotions."""
    out: list[str] = []
    for _, slugs in [*P.STRUCTURE_GROUPS, EXTRA_GROUP]:
        out += [s for s in slugs if s not in out]
    return out


def blocks_out(blocks: list) -> list[dict]:
    """Curated blocks -> the schema's block dicts.

    A block is a list of lines, or an object where it needs to be more. The
    `html` field appears only where the block has more than one line, which is
    the schema's own rule: it marks a real exception rather than restating
    `text` with markup around it.
    """
    out: list[dict] = []
    for b in blocks:
        if isinstance(b, dict):
            lines = list(b.get("lines") or [])
            d: dict = {}
            if b.get("kind") and b["kind"] != "prose":
                d["kind"] = b["kind"]
            d["text"] = " ".join(lines)
            if len(lines) > 1:
                d["html"] = P.line_html(lines) or None
                if d["html"] is None:
                    d.pop("html")
            if b.get("label"):
                d["label"] = b["label"]
            if b.get("kind") == "petitions":
                d["response"] = b.get("response")
                d["invocations"] = b.get("invocations") or []
            out.append({k: v for k, v in d.items() if v is not None})
        else:
            lines = list(b)
            d = {"text": " ".join(lines)}
            if len(lines) > 1:
                html = P.line_html(lines)
                if html:
                    d["html"] = html
            out.append(d)
    return out


def kind_of(rec: dict, cur: dict) -> str:
    if cur.get("kind") in ("group", "dialogic"):
        return cur["kind"]
    if rec.get("groups"):
        return "group"
    if any(
        isinstance(b, dict) and b.get("kind") in ("versicle", "response")
        for b in rec["blocks"]
    ):
        return "dialogic"
    return "simple"


def prayer_dict(n: int, slug: str, cur: dict, lang: str) -> dict:
    rec = cur["langs"][lang]
    d: dict = {
        "n": n,
        "slug": slug,
        "title": rec.get("title") or cur.get("latin", {}).get("title") or slug,
        "kind": kind_of(rec, cur),
        "blocks": blocks_out(rec["blocks"]),
    }
    if rec.get("rubric"):
        d["rubric"] = rec["rubric"]
    # ONE LATIN, ATTACHED TO EVERY EDITION -- see the module docstring.
    if cur.get("latin"):
        d["latin"] = {
            "title": cur["latin"].get("title"),
            "blocks": blocks_out(cur["latin"]["blocks"]),
        }
        if not d["latin"]["title"]:
            d["latin"].pop("title")
    for extra in ("groups", "instructions"):
        if rec.get(extra):
            d[extra] = rec[extra]
    if rec.get("url"):
        d["sources"] = [{"url": rec["url"]}]
    return d


def edition_note(langs_seen: dict[str, set[str]], lang: str) -> str:
    w = langs_seen[lang]
    if w == {"vaticannews"}:
        return "Vatican News, Prayers"
    if w == {"compendium"}:
        return "Compendium of the CCC (2005) Appendix A, Catechism texts and Vatican Rosary pages"
    return (
        "Compendium of the CCC (2005) Appendix A, Catechism texts and Vatican "
        "Rosary pages, with prayers and revised texts from Vatican News"
    )


def build(curated: dict[str, dict]) -> dict[str, list[dict]]:
    """Every edition's `prayers.json`, in collection order."""
    editions: dict[str, list[dict]] = defaultdict(list)
    for slug in order():
        cur = curated.get(slug)
        if cur is None:
            continue
        for lang in cur["langs"]:
            editions[lang].append((slug, cur))
    out: dict[str, list[dict]] = {}
    for lang, items in editions.items():
        out[lang] = [
            prayer_dict(i + 1, slug, cur, lang) for i, (slug, cur) in enumerate(items)
        ]
    return out


def build_latin(curated: dict[str, dict]) -> list[dict]:
    """`prayer.common.la`, from the same canonical field the companions use."""
    out, n = [], 0
    for slug in order():
        cur = curated.get(slug)
        if not cur or not cur.get("latin"):
            continue
        n += 1
        out.append(
            {
                "n": n,
                "slug": slug,
                "title": cur["latin"].get("title") or slug,
                "kind": "simple",
                "blocks": blocks_out(cur["latin"]["blocks"]),
            }
        )
    return out


class _Node:
    """`build_structure` reads only `.slug` and `.title`."""

    def __init__(self, slug: str, title: str) -> None:
        self.slug, self.title = slug, title


def structure_for(rows: list[dict], lang: str) -> list[dict]:
    nodes = [_Node(r["slug"], r["title"]) for r in rows]
    saved = P.STRUCTURE_GROUPS
    try:
        P.STRUCTURE_GROUPS = [*saved, EXTRA_GROUP]
        return P.build_structure(nodes, lang)
    finally:
        P.STRUCTURE_GROUPS = saved


def manifest_for(
    lang: str,
    rows: list[dict],
    curated: dict[str, dict],
    witness_kinds: dict[str, set[str]],
) -> dict:
    language = lang
    if lang in SPECIAL_EDITIONS:
        title, short, language = SPECIAL_EDITIONS[lang]
    elif (spec := P.LANG_CONFIG.get(lang)) is not None:
        title, short = spec.title, spec.short_title
    elif lang in VN_EDITIONS:
        title, short = VN_EDITIONS[lang]
    else:
        title = short = "Common Prayers"
    urls: list[str] = []
    for r in rows:
        for src in r.get("sources") or []:
            if src["url"] not in urls:
                urls.append(src["url"])
    if lang == "la":
        # The Latin edition transcribes no page of its own, so it cites the
        # two witnesses its text was reconciled from -- the pair
        # `build_latin_manifest` cited, and for its reason: the English page
        # supplied the letters and the Portuguese page said where five
        # prayers break into stanzas, so both are load-bearing and naming one
        # alone would make the other's contribution unattributable.
        # Listing all fifty-nine pages that print SOME Latin is not
        # provenance, it is a concordance.
        urls = sorted(
            {
                rec["url"]
                for cur in curated.values()
                if cur.get("latin")
                for tag in ("en", "pt")
                for rec in [cur["langs"].get(tag)]
                if rec and rec.get("url")
            }
        )
    return {
        "id": f"prayer.common.{lang}",
        "type": "prayer",
        "title": title,
        "short_title": short,
        "language": language,
        "edition": edition_note(witness_kinds, lang),
        "sources": [{"url": u} for u in sorted(urls)],
        "copyright": COPYRIGHT,
        "notes": (
            "Curated. The text is edited from the witnesses named in "
            "<corpus>/authored/prayers/, where every editorial act is recorded "
            "with its reason; this file is projected from those and not "
            "parsed. The Latin printed beside each prayer is one canonical "
            "text, not that page's own transcription of it."
        ),
        "curated": True,
        "prayer_count": len(rows),
    }


def write(
    lang: str,
    rows: list[dict],
    curated: dict[str, dict],
    witness_kinds: dict[str, set[str]],
) -> None:
    out_dir = common.build_root() / f"prayer.common.{lang}"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = manifest_for(lang, rows, curated, witness_kinds)
    manifest["generated_at"] = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    write_stamped_json(
        out_dir,
        {
            "manifest.json": manifest,
            "structure.json": structure_for(rows, lang),
            "prayers.json": rows,
        },
        manifest["generated_at"],
        remove=("corrections-applied.json",),
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--list",
        action="store_true",
        help="print what would be written and write nothing",
    )
    args = ap.parse_args()
    require_corpus()

    curated = load()
    editions = build(curated)
    editions["la"] = build_latin(curated)

    witness_kinds: dict[str, set[str]] = defaultdict(set)
    for cur in curated.values():
        for lang, rec in cur["langs"].items():
            witness_kinds[lang].add(rec.get("witness", "compendium"))
    witness_kinds["la"] = {"compendium"}

    total = 0
    for lang in sorted(editions):
        rows = editions[lang]
        total += len(rows)
        if not args.list:
            write(lang, rows, curated, witness_kinds)
        src = "+".join(sorted(witness_kinds[lang])) or "-"
        print(f"  prayer.common.{lang:6} {len(rows):3} prayers   {src}")
    print(
        f"{len(editions)} editions, {total} prayers, "
        f"{len(curated)} curated files"
        + ("  (--list: nothing written)" if args.list else "")
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
