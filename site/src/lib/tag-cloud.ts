/**
 * Type sizes for `/documenta`'s subject tag cloud.
 *
 * The subject facet is 58 terms holding 3 to 42 documents apiece, and a cloud
 * says a term's weight with its size rather than with a column of numbers. This
 * module is the whole of that mapping, and it is a module rather than a few
 * lines inside `DocumentFilters.svelte` for the reason this repository always
 * gives: there is no component test harness here, so logic left in a `.svelte`
 * file is logic nothing can check.
 *
 * ## One function, not a sort beside a size table
 *
 * `buildTagCloud` returns the entries already carrying their sizes. The
 * alternative — a helper returning an array of sizes to be zipped against the
 * tags in the template — has one failure mode, and it is silent: the two arrays
 * fall out of index alignment and every chip is drawn at some other chip's
 * weight, which looks like a design choice rather than a bug.
 *
 * ORDER IS NOT THIS MODULE'S BUSINESS. The entries come out in the order they
 * went in, because `/documenta`'s route already decides each facet's order
 * beside the other two (`buildFacet`'s `rank`), and a second sort here would be
 * either dead code or a disagreement.
 *
 * ## Square root, against the CURRENT extremes
 *
 * The scale normalises against the min and max of the list it is handed, which
 * is the live filtered count and not the corpus-wide one. Pinning it to the
 * unfiltered 3–42 would collapse the whole cloud to the floor the moment a
 * filter narrowed things, since after one click the largest surviving term may
 * hold nine documents rather than forty-two.
 *
 * The curve is square root because the distribution was measured: over 3–42,
 * linear crowds half the vocabulary into the bottom third of the range and log
 * over-expands the low end, spending most of the scale separating terms that
 * differ by two documents. Test 5 pins the curvature so that swapping it fails
 * a test rather than merely looking different.
 */

/** rem. Equal to `--font-size-min`, the design system's legibility floor. The
 *  CSS is what enforces it — `max(var(--font-size-min), var(--cloud-size))` —
 *  so if the token moves, the token wins and this stays the design intent. */
export const CLOUD_SIZE_MIN = 0.75;
/** rem. Measured against the 17rem aside: the range barely moves the cloud's
 *  height (chip COUNT dominates that), so it is chosen for legibility. Above
 *  roughly 1.2rem the largest terms start to shout in a 272px column. */
export const CLOUD_SIZE_MAX = 1.15;

export interface CloudTag {
	value: string;
	label: string;
	count: number;
	/** rem, within `[CLOUD_SIZE_MIN, CLOUD_SIZE_MAX]`. */
	fontSize: number;
}

interface Sizable {
	value: string;
	label: string;
	count: number;
}

export function buildTagCloud(
	tags: Sizable[],
	{ minRem = CLOUD_SIZE_MIN, maxRem = CLOUD_SIZE_MAX } = {}
): CloudTag[] {
	if (tags.length === 0) return [];

	/* The range is taken over the POSITIVE counts only. A term the reader has
	   selected stays in the cloud whatever its count, and two selected terms
	   that share no document leave both at 0 — which, taken as the minimum,
	   would drag the floor of the scale down and silently inflate every other
	   chip relative to it. Terms at 0 clamp to the smallest size instead, which
	   is what they should read as. */
	const live = tags.filter((tag) => tag.count > 0).map((tag) => tag.count);
	const min = live.length > 0 ? Math.min(...live) : 0;
	const max = live.length > 0 ? Math.max(...live) : 0;

	/* Nothing to encode: one term, or every term tied. The midpoint rather than
	   the maximum, because drawing a lone chip at full size states a prominence
	   that nothing in the data supports. */
	const flat = (minRem + maxRem) / 2;
	const span = Math.sqrt(max) - Math.sqrt(min);

	return tags.map((tag) => ({
		value: tag.value,
		label: tag.label,
		count: tag.count,
		fontSize:
			span === 0
				? flat
				: clamp(
						minRem + (maxRem - minRem) * ((Math.sqrt(tag.count) - Math.sqrt(min)) / span),
						minRem,
						maxRem
					)
	}));
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}
