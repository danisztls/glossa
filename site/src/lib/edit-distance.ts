/**
 * Optimal String Alignment, bounded — how wrong one short string is about
 * another, abandoned as soon as it cannot come in under the bound.
 *
 * IT IS NOT LEVENSHTEIN, and the adjacent-swap row is the whole reason it
 * exists. Subsequence matching (`fuzzysort`, and `highlight`'s own loose pass)
 * reads a transposition as no match at all rather than as a weak one: `jonh`
 * against "john" wants an `h` that is behind the `n`, so no threshold reaches
 * it — and transposing two letters is the commonest way there is to mistype a
 * word one knows.
 *
 * `suggest.ts` reads book forms with it; `highlight.ts` marks the label word a
 * typo was aimed at. HOW WRONG IS TOO WRONG STAYS WITH EACH CALLER: one is
 * ranging over 258 book forms where `jo` is within one edit of four of them,
 * the other over the words of a single title the ranker has already chosen,
 * and a bound measured against one population says nothing about the other.
 */

/** `null` for "further than `max`", which is the answer both callers act on —
 *  a distance nobody may use is not a distance worth finishing. */
export function boundedEdit(a: string, b: string, max: number): number | null {
	if (Math.abs(a.length - b.length) > max) return null;
	let prev2: number[] = [];
	let prev: number[] = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const cur = [i];
		let rowBest = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			let v = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
			// The adjacent swap. Without this row `jonh` is two edits from
			// "john" and reads no better than half the canon.
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				v = Math.min(v, prev2[j - 2] + 1);
			}
			cur.push(v);
			if (v < rowBest) rowBest = v;
		}
		// The bound is what makes it cheap: a row whose best cell already
		// exceeds `max` can only get worse, so most forms are abandoned after
		// one row and forms of the wrong length never start.
		if (rowBest > max) return null;
		prev2 = prev;
		prev = cur;
	}
	return prev[b.length] <= max ? prev[b.length] : null;
}
