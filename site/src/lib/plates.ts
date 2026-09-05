/**
 * Doré's 241 engravings for *La Grande Bible de Tours* (1866), placed in the
 * Bible reader.
 *
 * ONE MODULE READ BY BOTH ENDS, deliberately, the way `usage-schema.ts` is:
 * `scripts/sync-corpus.mjs` imports `PLATE_WIDTHS` and `PLATE_DETAIL_WIDTH` to
 * decide which images to copy and `PLATE_INTRINSIC_WIDTH` to decide which
 * dimensions to record, and the page below reads the same constants to build
 * the `srcset`, the `width`/`height` attributes and the viewer's zoom. A
 * second copy would drift in the direction that fails quietly — the sync
 * copying widths the page never asks for, or the page asking for a width the
 * sync never copied, which is a 404 per plate and no error anywhere.
 *
 * WHY THE PLATES ARE ANCHORED TO A VERSE and not given a page or a gallery of
 * their own: 241 plates over 195 chapters is 14.6% coverage, so a per-chapter
 * illustration slot would be empty six times out of seven. Anchored, each
 * plate sits where the scene it depicts is being read, which is also the only
 * place its subject can be checked. See `pipeline/scrapers/dore/` for how each
 * anchor was decided — three readings, voted, every one of them kept.
 */

/**
 * The rendered widths, smallest first — the `srcset` candidates.
 *
 * Two, not four. These are grayscale wood-engraving reproductions in a
 * measured column: 800 covers every phone at 2x and every desktop column at
 * 1x, 1200 covers the column at 2x and a tablet in landscape. A third
 * intermediate width would add 241 files to the deploy to save a reader
 * perhaps 30 KB once.
 */
export const PLATE_WIDTHS = [800, 1200] as const;

/** The rendition whose pixel dimensions are recorded in the content file.
 *  All renditions of a plate share an aspect ratio, so one pair is enough to
 *  reserve the right space; the largest of the SERVED widths is used because
 *  it is exact. */
export const PLATE_INTRINSIC_WIDTH = 1200;

/**
 * The rendition the viewer zooms into, and the reason it is a constant of its
 * own rather than a third entry in `PLATE_WIDTHS`.
 *
 * A `srcset` IS A MENU THE BROWSER ORDERS FROM, and it orders by device pixels.
 * Put 2000 in that list and a phone at 3x asks for it to fill a 390px slot —
 * 1.2 MB to draw an engraving two inches wide, on the connection least able to
 * afford it, before the reader has expressed any interest in the picture at
 * all. The whole point of this width is that it is fetched only by a reader
 * who has opened the viewer AND asked to zoom. So it is deliberately not in
 * the ladder, and `plateSrcset` cannot reach it.
 *
 * WHY 2000. It is the masters' own floor: the narrowest engraving in the set
 * crops to 2248px, so every plate downscales into this and none is invented.
 * What it buys is a real magnification where there was almost none — the
 * viewer fits a plate to about 1155px on a tall desktop, so zoom was worth
 * 1.04x there and the control was not drawn at all. See `PlateViewer`.
 *
 * The height is not recorded and does not need to be: every rendition of a
 * plate shares its aspect ratio, and the viewer already has that from
 * `plate.width / plate.height`.
 */
export const PLATE_DETAIL_WIDTH = 2000;

/**
 * How wide the plate is drawn, as the browser should assume before layout.
 *
 * `sizes` exists because without it the browser assumes `100vw` and picks the
 * 1200 rendition on a phone, which is the opposite of what a `srcset` is for.
 * `40rem` is the reading column (`--measure`); the plate never exceeds it.
 */
export const PLATE_SIZES = '(max-width: 44rem) 100vw, 40rem';

/** One plate, as `content/dore.tours/plates.json` stores it. */
export interface Plate {
	/** `OT-001` — also the image file's stem. */
	id: string;
	osis: string;
	chapter: number;
	/** The verse the plate is anchored to, or null for a plate that resolved
	 *  only to a chapter. None do today; see `sync-corpus.mjs`. */
	verse: number | null;
	/** The plate's own title, for the caption and the `alt` text. */
	title: string;
	width: number;
	height: number;
}

/** The image file name for one plate at one width. The sync writes exactly
 *  these names, and `plate-urls.ts` resolves them to build-asset URLs. */
export function plateImageName(id: string, width: number): string {
	return `${id}-${width}.avif`;
}

/**
 * The plates of one chapter, keyed by the verse each is drawn before.
 *
 * A Map rather than a filter per verse: Genesis carries 27 plates and the
 * reader walks every verse of every chapter regardless, so this is one lookup
 * per verse instead of a scan.
 *
 * `verseNumbers` IS THE EDITION BEING READ, and passing it is the whole
 * reason this is a function rather than a `groupBy`. Every anchor was decided
 * against `bible.douay-rheims.en` (`pipeline/scrapers/dore/`), but a plate
 * belongs to the passage and not to that edition, so it is drawn for whichever
 * edition the reader has open — and the editions do not agree about verse
 * numbers. `docs/research/bible-edition-divergence.md` catalogues the four
 * kinds; the corpus canonicalizes on Vulgate numbering and the three editions
 * still disagree in 31 chapters. A plate anchored to a verse this edition does
 * not print would otherwise be silently dropped, which is the failure mode to
 * avoid: nothing errors, the picture is simply absent for one edition and
 * present for another.
 *
 * So a plate with nowhere exact to go falls BACKWARD to the nearest verse the
 * edition does print, and to the first verse when it is earlier than all of
 * them. Backward rather than forward because the plate follows the verse it
 * illustrates: landing a little late still puts it after the scene, while
 * landing early shows the reader the picture before the sentence.
 *
 * Key 0 is the chapter itself, for a plate that resolved to no verse — the
 * caller draws those before verse 1. Nothing lands there today; all 241 carry
 * a verse.
 */
export function placePlates(
	plates: readonly Plate[],
	verseNumbers: readonly number[]
): Map<number, Plate[]> {
	const present = new Set(verseNumbers);
	const ascending = [...verseNumbers].sort((a, b) => a - b);
	const first = ascending[0];

	const byVerse = new Map<number, Plate[]>();
	for (const plate of plates) {
		let key = plate.verse ?? 0;
		if (key !== 0 && !present.has(key)) {
			// The last verse this edition prints at or before the anchor.
			let fallback: number | undefined;
			for (const n of ascending) {
				if (n > key) break;
				fallback = n;
			}
			key = fallback ?? first ?? 0;
		}
		const at = byVerse.get(key);
		if (at) at.push(plate);
		else byVerse.set(key, [plate]);
	}
	return byVerse;
}
