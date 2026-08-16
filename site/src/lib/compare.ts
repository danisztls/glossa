/**
 * Side-by-side comparison ("compare mode") — pure, corpus-agnostic core.
 *
 * Every reading route this feature touches (Bible chapter, CCC paragraph/
 * chapter, Compendium question, document section/read) addresses its content
 * by a single integer: verse number, paragraph number, question number,
 * section number. That shared shape is what lets ONE alignment function be
 * correct everywhere, instead of four bespoke ones.
 *
 * ## Why alignment is by NUMBER, never by array position
 *
 * `CLAUDE.md`'s cross-language QA oracle only promises unit-NUMBER-set
 * equality for the Bible, the CCC and the Compendium, and even that is a
 * promise about the two languages' address spaces agreeing on which numbers
 * exist — not that the arrays holding them line up index-for-index. Documents
 * don't even get that promise (a missing translation is legitimate and
 * common, `docs/decisions.md` "Vatican documents in scope"). Zipping two
 * arrays by position silently mismatches the moment either side has a gap:
 * the first missing unit shifts everything after it by one, and nothing about
 * that failure is visible on screen — it just quietly shows the wrong pair of
 * texts next to each other. Aligning by the number printed in each unit
 * itself, and rendering an explicit gap wherever only one side has it, is the
 * only version of this that can't drift silently — see `alignByNumber` below.
 *
 * ## The Bible has a SECOND, narrower version of the same trap
 *
 * `docs/link-surface.md` and `versification.ts` document Hebrew-vs-Vulgate
 * chapter renumbering; both v1 editions print Vulgate numbering, so that
 * trap doesn't apply BETWEEN editions. But measuring the real corpus for
 * this task (every common chapter of `bible.cpdv.en` vs
 * `bible.matos-soares.pt`, 1,333 chapters) found a second, narrower
 * divergence `versification.ts` doesn't cover at all: 30 chapters (~2.25%)
 * where both editions print the SAME chapter number but a DIFFERENT verse
 * count. Three real causes, all confirmed by reading the actual text, not
 * guessed from the counts:
 *
 *   - **Esther** (chapters 1–15, one book-wide exception): the deuterocanonical
 *     material is real in both editions but distributed across the numbered
 *     chapters differently — PT even has a `chapter 16` EN has no equivalent
 *     for at all. The single largest divergence in the corpus.
 *   - **A textual variant, not a numbering choice** (Psalm 13 is the clean
 *     example: CPDV has 10 verses, Matos Soares has 7): CPDV's Psalm 13
 *     includes the "Romans 3" interpolation historically printed in some
 *     Vulgate psalters (vv. 3–6, borrowed wholesale from Romans 3:13–18);
 *     Matos Soares' source doesn't carry it. Verses 7–10 in CPDV are the
 *     SAME content as verses 4–7 in Matos Soares — same number, different
 *     text. `Psalm 43/92/125/135`, `Song of Songs` (near-systematic through
 *     the book) and a handful of one-off single-verse splits (`2 Sam 13`,
 *     `2 Thess 2`, `Gen 37`, `Judg 21`, `Sir 29`) are smaller instances of
 *     the same phenomenon.
 *
 * `alignByNumber` still does the right, honest thing for every one of these
 * — a verse number present in only one edition renders as a gap, never as a
 * guess. What it CANNOT do, because no corpus data says otherwise, is notice
 * that Psalm 13:7 (CPDV) and Psalm 13:7 (Matos Soares) both "exist" at the
 * same number but are not the same sentence — that would need a real
 * cross-edition content alignment this corpus has no data to build. That
 * residual risk is real and is not silently designed away; see
 * `numberSetsDiffer`, which at least surfaces the chapters where it's live so
 * a reader isn't trusting row-for-row correspondence blind.
 */

/** A comparison row: the same unit number in two editions, either side
 *  possibly absent — see the module docblock for why that's the honest
 *  outcome rather than something to paper over. */
export interface AlignedRow<L, R> {
	n: number;
	left: L | undefined;
	right: R | undefined;
}

/**
 * Align two lists of numbered units by their `n`, over the UNION of numbers
 * either side has, ascending. Neither list needs to be sorted or gapless —
 * whichever number is missing on a side simply produces `undefined` there.
 *
 * `L`/`R` are independent type parameters (a `Verse` on one side, a
 * `CccParagraph`/`DocumentSection` on the other would both type-check) since
 * every real call site pairs the SAME shape on both sides in practice, but
 * nothing about the alignment itself requires that.
 */
export function alignByNumber<L extends { n: number }, R extends { n: number }>(
	left: readonly L[],
	right: readonly R[]
): AlignedRow<L, R>[] {
	const leftByN = new Map(left.map((u) => [u.n, u]));
	const rightByN = new Map(right.map((u) => [u.n, u]));
	const ns = new Set<number>();
	for (const u of left) ns.add(u.n);
	for (const u of right) ns.add(u.n);
	return [...ns]
		.sort((a, b) => a - b)
		.map((n) => ({ n, left: leftByN.get(n), right: rightByN.get(n) }));
}

/**
 * True when two number sets are not identical — the signal behind the
 * Bible-only "these editions split this chapter's verses differently" note
 * (see module docblock). Order-independent, length-independent (a length
 * mismatch alone already answers true, cheaply, before the set walk).
 */
export function numberSetsDiffer(leftNs: readonly number[], rightNs: readonly number[]): boolean {
	if (leftNs.length !== rightNs.length) return true;
	const rightSet = new Set(rightNs);
	return leftNs.some((n) => !rightSet.has(n));
}

/**
 * Which second edition compare mode pairs against the reader's current one.
 * Prefers an edition in a DIFFERENT base language over one in the same
 * language — "the same passage in two editions" is compare mode's stated
 * purpose, but the driving cases in the task brief (docs/decisions.md's
 * language-symmetry principle) are all EN-vs-PT, and a corpus that someday
 * ships a second English or Portuguese Bible edition (`research/bible-
 * texts.md` names Douay-Rheims and Figueiredo as later candidates) shouldn't
 * make compare mode silently pair two English texts over the PT one just
 * because it happens to sort first. Falls back to the first other edition
 * available when nothing differs in language (a corpus with only one
 * language for this work — compare mode is then meaningless, and callers are
 * expected to hide the toggle entirely rather than reach this case, but a
 * pure function shouldn't assume its caller got that right).
 */
export function pickComparisonEdition<E extends { id: string; lang: string }>(
	primaryId: string,
	editions: readonly E[]
): E | undefined {
	const others = editions.filter((e) => e.id !== primaryId);
	const primaryLang = editions.find((e) => e.id === primaryId)?.lang;
	return others.find((e) => e.lang !== primaryLang) ?? others[0];
}

// --------------------------------------------------------------------------
// URL addressing — see `bible/[book]/[chapter]/+page.svelte`'s `citedRange`
// docblock for why a query param is the only safe way to carry UI state on a
// page that has to prerender complete without it: reading
// `page.url.searchParams` during prerendering throws (one prerendered file
// serves every query string that points at it), so this is a pure string/URL
// utility with NO dependency on `$app/state` or `$app/navigation` — every
// caller is responsible for only invoking these from inside a
// `browser`-guarded read, the same discipline `citedRange` already
// established.
//
// THIS IS NO LONGER THE ONLY PLACE `?compare=` GETS READ. Since
// `compare-pref.svelte.ts` shipped, the URL is a SHARING mechanism layered on
// top of a stored reading preference, not the sole source of truth — see
// that module's docblock for the full contract, including why `?compare=1`
// still has to parse (it predates the per-edition target this file now
// carries) and why that mapping lives in `CompareStore.syncFromUrl`, not
// here: this file only builds/writes addresses, it never decides what a
// stored preference should become. `COMPARE_PARAM` is exported so the two
// places that read/write the same query key (`syncFromUrl` here) can't drift
// on the string itself even though the decoding logic they apply to it
// differs.
// --------------------------------------------------------------------------

export const COMPARE_PARAM = 'compare';

/** `url` with the compare target set/cleared — a new `URL`, `url` itself is
 *  never mutated. `target` is whatever `CompareStore.paramValue` says a link
 *  carrying the reader's current preference should look like: `undefined`
 *  removes the param entirely, otherwise it's written verbatim (`'1'` for
 *  "on, route's choice", or a work id for an explicit edition pick — see
 *  compare-pref.svelte.ts). Used by every reading route's compare toggle and
 *  by the comparison edition picker to build the address they navigate to. */
export function withCompareParam(url: URL, target: string | undefined): URL {
	const next = new URL(url);
	if (target === undefined) next.searchParams.delete(COMPARE_PARAM);
	else next.searchParams.set(COMPARE_PARAM, target);
	return next;
}
