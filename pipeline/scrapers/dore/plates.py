"""Turning a scanned Doré plate into the image the site serves.

No network, no corpus paths, no argument parsing: everything here is a
function of pixels, so it can be exercised on a handful of files without
fetching anything. `dore.py` is the half that talks to the network.

THE SHAPE OF A SCANNED PLATE, which is what every decision below answers to.
Each file from catholic-resources.org is one page of the Dover reproduction:

    +-----------------------------------+
    |  [thin engraved rule]             |
    |                                   |   <- the engraving, signed by Doré
    |        the engraving              |      at bottom-left and by his
    |                                   |      engraver (Pisan and others)
    |  [thin engraved rule]             |      at bottom-right
    +-----------------------------------+
      THE CREATION OF LIGHT                  <- printed caption: title,
      And the earth was without form,           excerpt, and the reference
      and void . . . (Genesis 1: 2)  (1:3)      -- then a HANDWRITTEN verse
                                                 correction in pen

The caption is not ours to show: it is the Dover edition's English apparatus
over a French edition of the Vulgate, and this site prints the Douay-Rheims.
But it is also the plate's own statement of what it depicts, so `dore.py`
reads it BEFORE `crop_to_plate` throws it away.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

#: Fraction of a row (or column) that must carry ink for it to count as part
#: of the plate rather than as margin. Deliberately low: the top edge of a
#: pale sky meets the rule with very little ink under it, and the cost of
#: setting this too high is a silently clipped image.
INK_FRACTION = 0.03

#: A pixel is ink if it is below this fraction of the paper tone. Relative,
#: not absolute, because the paper tone itself ranges from 198 to 255 across
#: the set -- an absolute threshold calibrated on one plate mis-reads another.
INK_OF_PAPER = 0.90

#: Percentile taken as "paper". Not the maximum: a scanner highlight or a
#: blown pixel at the page edge would set it, and every threshold derived
#: from it would then be too high.
PAPER_PERCENTILE = 92


@dataclass(frozen=True)
class Box:
    """A crop rectangle, in PIL's (left, upper, right, lower) order."""

    left: int
    upper: int
    right: int
    lower: int

    @property
    def size(self) -> tuple[int, int]:
        return self.right - self.left, self.lower - self.upper

    def as_tuple(self) -> tuple[int, int, int, int]:
        return (self.left, self.upper, self.right, self.lower)


def _runs(mask: np.ndarray) -> list[tuple[int, int]]:
    """Contiguous True runs in a 1-D boolean mask, as (start, stop)."""
    padded = np.concatenate(([False], mask.astype(bool), [False]))
    edges = np.flatnonzero(padded[1:] != padded[:-1])
    return list(zip(edges[0::2], edges[1::2], strict=True))


def paper_tone(gray: np.ndarray) -> float:
    """The tone of the unprinted page, in 0-255."""
    return float(np.percentile(gray, PAPER_PERCENTILE))


def find_plate_box(gray: np.ndarray, pad: int = 2) -> Box | None:
    """The engraving's bounding box, excluding the printed caption.

    FINDING THE BORDER RULE DIRECTLY DOES NOT WORK, and the failure is worth
    recording because it is the obvious first attempt. Scanning inward for the
    first row that is mostly dark finds the rule on most plates and finds the
    top of a night sky on the rest -- on one Zechariah plate it cut 114 pixels
    of sky, which is a plausible-looking crop of the wrong thing. Requiring
    paper on the outer side of the candidate line fixes that and introduces
    the opposite failure, missing the rule on plates that sit flush to the
    file edge with no margin outside it.

    So this looks for the PLATE rather than for the rule. The engraving and
    the caption are two blocks of ink separated by a band of blank paper, and
    the engraving is much the taller of the two; taking the largest contiguous
    run of inked rows therefore discards the caption -- and with it the
    handwritten verse correction -- without needing to detect either.

    Returns None if the image carries no ink at all, which no real plate does
    and a truncated download might.
    """
    ink = gray < paper_tone(gray) * INK_OF_PAPER

    rows = _runs(ink.mean(axis=1) > INK_FRACTION)
    if not rows:
        return None
    upper, lower = max(rows, key=lambda r: r[1] - r[0])

    cols = _runs(ink[upper:lower].mean(axis=0) > INK_FRACTION)
    if not cols:
        return None
    left, right = max(cols, key=lambda c: c[1] - c[0])

    height, width = gray.shape
    return Box(
        left=max(0, int(left) - pad),
        upper=max(0, int(upper) - pad),
        right=min(width, int(right) + pad),
        lower=min(height, int(lower) + pad),
    )


def caption_band(image: Image.Image, box: Box) -> Image.Image:
    """Everything below the plate: the printed caption, for OCR.

    Full width rather than the plate's, because the caption is centred on the
    PAGE and a narrow plate leaves it overhanging on both sides.
    """
    return image.crop((0, box.lower, image.width, image.height))


def chroma_deviation(image: Image.Image) -> float:
    """Largest per-pixel departure from neutral grey, in 0-255.

    Two thirds of the masters arrive in an RGB container and every one
    measured so far is exactly neutral -- the scans were desaturated before
    they were published. That makes `to_grayscale` lossless, but only as long
    as it stays true, and it is not the kind of thing to assume: a sepia scan
    slipping into the set should be a finding, not a silent flattening.

    Returns 0.0 for an image that is already single-channel.
    """
    if image.mode in ("L", "1"):
        return 0.0
    rgb = np.asarray(image.convert("RGB")).astype(np.int16)
    red, green, blue = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    return float(np.maximum(np.abs(red - green), np.abs(green - blue)).max())


def to_grayscale(image: Image.Image) -> Image.Image:
    """One channel, so the encoder can emit a single plane.

    THIS IS NOT ABOUT FILE SIZE. Constant chroma planes compress to nearly
    nothing: converting saves 0.3% of the AVIF. What it saves is decode work
    -- measured at 5.29 ms against 7.19 ms for the same picture left in an RGB
    container, because `avifenc` emits YUV400 for grayscale input and YUV444
    otherwise, and three full-size planes must then be allocated and decoded
    instead of one. On a low-end phone that ratio is the whole argument.

    The trap is that passing an RGB file through costs nothing visible and
    nothing fails, so the slower encoding is what you get by default.
    """
    return image if image.mode == "L" else image.convert("L")


def normalize(
    gray: np.ndarray, low: float = 0.5, high: float = 99.5, paper: float = 252.0
) -> np.ndarray:
    """Stretch onto a common black and white point.

    ENDPOINTS FROM PERCENTILES, NOT FROM MIN AND MAX. A single dust mote or
    a blown highlight otherwise sets an endpoint and the stretch collapses to
    a no-op on exactly the plates that most need it.

    Only the endpoints are equalized; the median is left alone. Across the
    set the normalized medians still range from 40 to 136, and that spread is
    the pictures rather than the scans -- Doré's night scenes are meant to sit
    dark. Equalizing brightness would flatten the series into itself.
    """
    lo = float(np.percentile(gray, low))
    hi = float(np.percentile(gray, high))
    if hi - lo < 1.0:
        return gray
    return np.clip((gray - lo) * (paper / (hi - lo)), 0, 255)


def resample(image: Image.Image, width: int) -> Image.Image:
    """Downscale to `width`, prefiltered against moire.

    LANCZOS ALONE IS THE WRONG CHOICE HERE, which is worth stating because it
    is the usual default and it is worse than bilinear on this material. A
    wood engraving is dense parallel line work; at a 3x reduction the lines
    beat against the sample grid and Lanczos, which sharpens, amplifies the
    aliasing it just created into visible horizontal ripples across a sky.
    Measured as mean high-frequency energy: nearest 73.4, Lanczos 35.8,
    bilinear 27.4, and a Gaussian prefilter followed by Lanczos 21.3 -- the
    last both cleanest by the number and by looking at it.

    The prefilter is scaled to the decimation factor, since that is what sets
    which frequencies cannot survive, and is skipped entirely when there is
    barely any decimation to do.
    """
    if width >= image.width:
        return image
    factor = image.width / width
    source = (
        image.filter(ImageFilter.GaussianBlur(radius=0.4 * factor))
        if factor > 1.2
        else image
    )
    height = round(image.height * width / image.width)
    return source.resize((width, height), Image.LANCZOS)


def encode_avif(image: Image.Image, dest: Path, *, quality: int, speed: int = 4) -> int:
    """Write `image` as AVIF via `avifenc`, and return the file size.

    AVIF RATHER THAN WEBP, against the usual advice that AVIF decodes slower.
    That advice is about photographs in colour. These are grayscale, and lossy
    WebP has no monochrome mode -- it always carries YUV420, so it encodes and
    decodes two chroma planes of flat neutral data for no benefit. Measured on
    a dense plate at 1800px: AVIF 588 KB and 10.1 ms against WebP 703 KB and
    29.0 ms, at slightly better SSIM. The gap is structural, three planes
    against one, so it does not depend on the decoder being clever.

    Raises CalledProcessError if `avifenc` is missing or fails; a plate that
    silently did not encode would be a hole in the apparatus.
    """
    dest.parent.mkdir(parents=True, exist_ok=True)
    with_suffix = dest.with_suffix(".png")
    image.save(with_suffix)
    try:
        subprocess.run(
            [
                "avifenc",
                "-q",
                str(quality),
                "-s",
                str(speed),
                "--jobs",
                "4",
                str(with_suffix),
                str(dest),
            ],
            capture_output=True,
            check=True,
        )
    finally:
        with_suffix.unlink(missing_ok=True)
    return dest.stat().st_size


def derive(image: Image.Image, width: int) -> Image.Image:
    """The whole derivation for one output size: crop, grey, level, resize."""
    gray = to_grayscale(image)
    box = find_plate_box(np.asarray(gray).astype(float))
    if box is not None:
        gray = gray.crop(box.as_tuple())
    levelled = normalize(np.asarray(gray).astype(float))
    return resample(Image.fromarray(levelled.astype(np.uint8)), width)
