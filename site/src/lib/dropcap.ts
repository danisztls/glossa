/**
 * Splitting the opening character off a passage, for the explicit drop-cap
 * mechanism (`.drop-cap-letter` in app.css — see that rule's comment for why
 * `::first-letter` can't do this job in the Bible reader).
 *
 * "First character" is not `text[0]`, for three reasons the corpus actually
 * exhibits:
 *
 *   - Passages open with punctuation. `"And the Lord said…"` should set the
 *     quotation mark AND the A in the cap, the way a typesetter would;
 *     dropping only the `"` and leaving `And` at body size is worse than no
 *     drop cap at all.
 *   - Portuguese is accented. `Ó`, `É`, `À` may arrive decomposed (a base
 *     letter followed by a combining mark), where slicing at index 1 splits
 *     the accent off its letter and renders a bare diacritic in the cap.
 *     Iterating by grapheme rather than by code unit keeps them together.
 *   - Some blocks start with a marker or whitespace from the parser; leading
 *     whitespace in the cap would push the float away from the margin.
 *
 * Returns the text unchanged in `rest` (and an empty `first`) when there is
 * nothing sensible to promote — the caller then renders it plainly, which is
 * the correct degradation for an empty or punctuation-only passage.
 */

/** Opening punctuation that belongs *with* the first letter in the cap. */
const LEADING_PUNCT = /[\s"'“”‘’«»¿¡([{—–-]/u;

/** What actually counts as the cap's letter. Tested on the grapheme's first
 *  code point, so a base letter plus combining marks still qualifies. */
const LETTER = /\p{L}|\p{N}/u;

export interface DropCapSplit {
	/** The character(s) to set as the drop cap — may be empty. */
	first: string;
	/** Everything after them, to be rendered at body size. */
	rest: string;
}

/**
 * Grapheme-aware where the runtime supports it, code-point-aware otherwise.
 * `Intl.Segmenter` is in every browser this site targets, but is guarded
 * because this module also runs under Node: `dropcap.test.ts` calls
 * `splitDropCap` directly under vitest's Node test environment
 * (`environment: 'node'`, vitest.config.ts). It used to run under Node
 * during the build's prerendering pass too, before the site became one SPA
 * shell with `ssr = false` (`+layout.ts`, docs/decisions.md 2026-08-18) —
 * but the guard was never only about that, and stays regardless of which
 * Node context reaches it.
 */
function graphemes(text: string): string[] {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
		return [...segmenter.segment(text)].map((s) => s.segment);
	}
	// `[...text]` splits by code point, which already keeps surrogate pairs
	// intact; only combining marks are at risk, and those are rare enough in
	// this corpus that the fallback is acceptable where Segmenter is absent.
	return [...text];
}

export function splitDropCap(text: string): DropCapSplit {
	const units = graphemes(text.trimStart());
	if (units.length === 0) return { first: '', rest: text };

	// Take leading punctuation, then exactly one letter. Bounded at 3 units so
	// a passage opening with a run of punctuation ("«— ...") can't swallow
	// half a word into the cap.
	let taken = 0;
	while (taken < units.length && taken < 3 && LEADING_PUNCT.test(units[taken])) taken++;

	// The unit after the punctuation run must actually be a letter. Without
	// this check a passage opening "..." promotes a lone period into a
	// three-line drop cap — punctuation that is neither opening punctuation
	// nor a letter has nothing to lead into.
	if (taken >= units.length || !LETTER.test(units[taken])) return { first: '', rest: text };
	taken++; // the letter itself

	return { first: units.slice(0, taken).join(''), rest: units.slice(taken).join('') };
}
