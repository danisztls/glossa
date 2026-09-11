#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools[woff]"]
# ///
"""The four numbers a reading face is worth, measured rather than recalled.

    ./face-metrics.py                       # every face the site declares
    ./face-metrics.py path/to/other.woff2   # a candidate, beside the two

`styles/tokens.css` states a per-face advance and a bracket for
`--face-size-adjust`, and `src/lib/reading-face.test.ts` pins that bracket.
All of them are frequency-weighted over the corpus, so all of them move when
a face changes or the corpus grows -- and none of them can be re-derived by a
test, which may not open a woff2 or walk a private repository. This is what
derives them.

WHAT IT PRINTS, per face, all as a fraction of the em:

  advance      mean over EVERY character, spaces included, because a line of
               `--measure-cpl` characters contains them.
  ink height   mean bounding-box HEIGHT over inked characters.
  ink area     mean bounding-box AREA -- width x height, NOT the area enclosed
               by the outline. The two are wildly different (EB Garamond
               measures 0.1895 by the box and 0.0639 by the outline), and the
               box is the one `tokens.css` has always meant.

Then, against the first face listed, the two ratios that bracket
`--face-size-adjust` and the geometric mean between them, which is the value
`tokens.css` calibrates from.

MEASURE AT wght 400, AND DO NOT ASSUME THE FILE IS ALREADY THERE. A variable
font's default instance is whatever its `fvar` says, and it is not always the
weight anybody reads at: Source Sans 3's default master is wght 200, EB
Garamond's and most others' are 400. Measuring the file as loaded therefore
returns a number 5% narrow for one face and correct for the next, which is
the shape of error that survives a spot check. Every face here is
instantiated first.

Takes about a minute, almost all of it walking `build/`. Needs the corpus:
`CORPUS_DIR` or a `glossa-corpus` beside this repository.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections import Counter
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SITE = Path(__file__).resolve().parent.parent
FONTS = SITE / "static" / "fonts"

# The serif first: it is the face every other measurement is stated against,
# and `--face-size-adjust` is 1 for it by construction.
DEFAULT_FACES = [
    FONTS / "eb-garamond-latin-wght-normal.woff2",
    FONTS / "source-sans-3-latin-wght-normal.woff2",
]


def corpus_build() -> Path:
    """`sync-corpus.mjs`'s resolution, in Python."""
    d = Path(os.environ.get("CORPUS_DIR", SITE / ".." / ".." / "glossa-corpus"))
    build = (SITE / d / "build").resolve() if not d.is_absolute() else d / "build"
    if not build.is_dir():
        sys.exit(
            f"no corpus at {build} -- clone glossa-corpus beside this repo, or set CORPUS_DIR"
        )
    return build


def frequencies(build: Path) -> Counter[str]:
    """Every character of running text in the corpus, counted.

    `text` and `summary` are the two keys that carry prose; everything else in
    a build file is an address, a name or a count, and setting those is not
    what the measure is for.
    """
    counts: Counter[str] = Counter()
    for path in build.rglob("*.json"):
        if path.name in ("manifest.json", "corrections-applied.json"):
            continue
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            continue
        stack = [doc]
        while stack:
            node = stack.pop()
            if isinstance(node, dict):
                for key, value in node.items():
                    if isinstance(value, str):
                        if key in ("text", "summary"):
                            counts.update(value)
                    else:
                        stack.append(value)
            elif isinstance(node, list):
                stack.extend(node)
    return counts


def measure(path: Path, counts: Counter[str]) -> dict[str, float]:
    font = TTFont(path)
    if "fvar" in font and any(a.axisTag == "wght" for a in font["fvar"].axes):
        font = instancer.instantiateVariableFont(font, {"wght": 400})
    upem = font["head"].unitsPerEm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()

    advance = chars = height = area = inked = 0.0
    for char, n in counts.items():
        name = cmap.get(ord(char))
        if name is None:
            continue
        advance += n * font["hmtx"][name][0]
        chars += n
        if char.isspace():
            continue
        pen = BoundsPen(glyphs)
        glyphs[name].draw(pen)
        if pen.bounds is None:
            continue
        x0, y0, x1, y1 = pen.bounds
        height += n * (y1 - y0)
        area += n * (x1 - x0) * (y1 - y0)
        inked += n
    return {
        "advance": advance / chars / upem,
        "height": height / inked / upem,
        "area": area / inked / upem**2,
        "chars": chars,
        "inked": inked,
    }


def committed() -> dict[str, str]:
    """What `tokens.css` currently states, so drift is visible without git."""
    css = (SITE / "src" / "styles" / "tokens.css").read_text()
    out = {}
    for selector in (":root", ":root[data-face='sans']"):
        start = css.index(f"{selector} {{")
        body = css[start : css.index("\n}", start)]
        found = re.search(r"--prose-char-advance:\s*([\d.]+)", body)
        if found:
            out[selector] = found.group(1)
    return out


def main() -> None:
    faces = [Path(a) for a in sys.argv[1:]] or DEFAULT_FACES
    missing = [f for f in faces if not f.exists()]
    if missing:
        sys.exit("no such file: " + ", ".join(str(m) for m in missing))

    counts = frequencies(corpus_build())
    results = [(f, measure(f, counts)) for f in faces]
    total, inked = results[0][1]["chars"], results[0][1]["inked"]
    print(f"{int(total):,} characters of running text, {int(inked):,} of them inked\n")

    print(f"{'face':34} {'advance':>9} {'ink height':>11} {'ink area':>10}")
    for path, m in results:
        print(
            f"{path.stem:34} {m['advance']:>9.4f} {m['height']:>11.4f} {m['area']:>10.4f}"
        )

    base = results[0][1]
    print(f"\nagainst {results[0][0].stem}, as a linear scale:")
    for path, m in results[1:]:
        by_height = base["height"] / m["height"]
        by_area = (base["area"] / m["area"]) ** 0.5
        lo, hi = sorted((by_height, by_area))
        print(
            f"  {path.stem:32} by ink height {by_height:.4f}   by ink area {by_area:.4f}"
            f"   geometric mean {(by_height * by_area) ** 0.5:.4f}   bracket [{lo:.4f}, {hi:.4f}]"
        )

    print("\ncommitted in tokens.css:")
    for selector, value in committed().items():
        print(f"  {selector:24} --prose-char-advance: {value}")
    print(
        "\nA face declared with `size-adjust` renders smaller than it draws, so the\n"
        "token is the measured advance times that descriptor, and the bracket above\n"
        "is divided by it -- see the `:root[data-face]` block in tokens.css."
    )


if __name__ == "__main__":
    main()
