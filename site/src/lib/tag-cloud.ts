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
 *  height (chip COUNT dominates that), so it is chosen for BALANCE and not for
 *  compactness. The panel's own body size is 0.85rem and its section headings
 *  are 0.8rem, so a ceiling above about 1rem puts the heaviest subjects above
 *  everything around them and the cloud stops reading as part of the sidebar.
 *  At 0.95 the average chip is 15.0px against that 15.3px body — the cloud
 *  sits just under the panel it lives in — and the heaviest term reaches
 *  17.1px. The 1.27x spread left is close to the floor of what still reads as
 *  weight; below about 0.9 the cloud is a list of words in one size.
 *
 *  THE OTHER END CANNOT MOVE. `CLOUD_SIZE_MIN` is `--font-size-min`, and the
 *  CSS clamps to that token, so a smaller value here would not render smaller
 *  — it would flatten every term below the floor onto it. Twenty-three of the
 *  58 hold nine documents or fewer, so that is exactly where the distinctions
 *  are worth keeping. Shrink the cloud from the top.
 *
 *  THIS IS ALSO WHY COLOUR CARRIES THE WEIGHT TOO. A 1.27x spread is not much
 *  to see across a 58-term panel, and the range cannot widen without the cloud
 *  outgrowing the sidebar around it — so `weight` drives a second channel that
 *  costs no space at all. */
export const CLOUD_SIZE_MAX = 0.95;

export interface CloudTag {
	value: string;
	label: string;
	count: number;
	/** Where this term sits between the cloud's lightest and heaviest, 0 to 1.
	 *  Both channels are read off it, which is the point: size and colour say
	 *  the same thing, so they cannot disagree. The CSS mixes the text colour
	 *  with it — see `DocumentFilters.svelte`. */
	weight: number;
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

	const span = Math.sqrt(max) - Math.sqrt(min);

	return tags.map((tag) => {
		/* Nothing to encode — one term, or every term tied — puts everything at
		   the midpoint rather than at the maximum, because drawing a lone chip
		   at full weight states a prominence nothing in the data supports. */
		const weight = span === 0 ? 0.5 : clamp((Math.sqrt(tag.count) - Math.sqrt(min)) / span, 0, 1);
		return {
			value: tag.value,
			label: tag.label,
			count: tag.count,
			weight,
			fontSize: minRem + (maxRem - minRem) * weight
		};
	});
}

function clamp(value: number, low: number, high: number): number {
	return Math.min(high, Math.max(low, value));
}
