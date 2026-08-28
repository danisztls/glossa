/**
 * Which Compendium questions condense which Catechism paragraphs, derived
 * from `corpus/build/` at build time.
 *
 * Every Compendium question prints, beside itself, the CCC paragraph range it
 * condenses — `questions[].ccc_refs` (docs/link-surface.md #11), stored raw
 * per the corpus's store-raw principle. This is the only place the two works
 * are joined by the sources themselves rather than by our reading of them,
 * and it is what lets a Catechism paragraph say "the Compendium asks this as
 * question 18" and a Catechism ARTICLE offer the questions covering it —
 * the level below the shared part/section/chapter outline, where the
 * Compendium has no division of its own to pair with (`toc-pairing.ts`).
 *
 * IT IS VOTED ACROSS ALL TEN EDITIONS, NOT READ FROM ENGLISH. Two reasons,
 * both measured:
 *
 *   - The editions disagree, and each disagreement is one edition against the
 *     rest. German systematically prints only the first of a question's
 *     ranges ("26-30" where eight editions read "27-30 44-45"); Swedish
 *     widens Q39 to "206-213" and Slovenian adds a "229" nobody else has;
 *     English printed "2112-213" for "212-213" until the correction filed on
 *     2026-08-28. Reading one edition inherits whichever of these it happens
 *     to carry.
 *   - Coverage is uneven — 598 questions carry refs in EN/FR/HU/RO/SL, 597 in
 *     DE/PT, 595 in ES, 593 in IT, 577 in SV — so no single edition is
 *     complete, and the union of any two is closer than the best one.
 *
 * The vote is PER PARAGRAPH, not per reference string, because the strings
 * are not comparable: editions punctuate them differently (Romanian uses a
 * non-breaking hyphen throughout, Italian and Swedish separate with
 * semicolons, Portuguese spaces its dashes — "1 – 25" — and it and Spanish
 * separate with a full stop). Expanding each to the set of paragraph numbers
 * it names and asking how many editions named each one compares the only
 * thing they agree about — the doctrine.
 *
 * A paragraph is kept when at least half the editions that printed anything
 * for that question named it. Half rather than a bare plurality because the
 * relation drives LINKS: an address offered to a reader should be one the
 * sources broadly agree on, and the under-link-rather-than-over-link posture
 * is the same one `refs.ts` takes.
 */

/** An inclusive `[from, to]` span of Catechism paragraph numbers. */
export type Run = [number, number];

/** Compendium question number -> the Catechism paragraphs it condenses. */
export type CondensationMap = Record<number, Run[]>;

export interface CondensationEdition {
	lang: string;
	work: string;
	questions: { n: number; ccc_refs?: string }[];
}

export interface CondensationStats {
	editions: number;
	questions: number;
	paragraphs: number;
	distinctParagraphs: number;
	/** Questions where at least one edition named a paragraph the vote dropped. */
	contested: number;
	/** `"<lang> Q<n>: <token>"` for every reference token that named nothing. */
	malformed: string[];
	/** Paragraph numbers referenced that this corpus does not carry. */
	absent: number[];
}

/** `1-25`, `212`, `2112-213` -> paragraph numbers, or null if malformed. */
function expandToken(token: string): number[] | null {
	const m = /^(\d{1,4})(?:-(\d{1,4}))?$/.exec(token);
	if (!m) return null;
	const from = Number(m[1]);
	const to = m[2] === undefined ? from : Number(m[2]);
	// A descending range names nothing. It is how English's `2112-213` typo
	// presented, and rejecting it here is what keeps a defect from becoming
	// 1,900 paragraphs of noise if one is ever filed unnoticed.
	if (to < from) return null;
	const out = [];
	for (let n = from; n <= to; n++) out.push(n);
	return out;
}

/**
 * One edition's `ccc_refs` string -> the paragraph numbers it names, plus the
 * tokens that named nothing.
 *
 * The separators are normalised first because the ten editions punctuate the
 * same list differently and none of that is meaning. Three rules, each
 * measured against what the other nine editions print in the same position:
 *
 *   - U+2010–U+2015 and U+2212 all stand in for the hyphen. Romanian uses
 *     the non-breaking one throughout.
 *   - WHITESPACE AROUND THE HYPHEN IS NOT A SEPARATOR. Portuguese prints
 *     "1 – 25", "861- 865" and "992 – 1004; 1016 –1018" where the other
 *     editions print the same ranges closed up. Splitting on whitespace
 *     first read "1016 –1018" as `1016` plus a malformed `-1018` and threw
 *     the second half of the range away.
 *   - THE FULL STOP IS A LIST SEPARATOR in Portuguese and Spanish, in exactly
 *     the position the other nine print a comma: "96.98" against English's
 *     "96, 98" (Q12), "324. 400" against "324, 400" (Q57), "1005-1014. 1019"
 *     against "1005-1014 1019" (Q206). It is never a decimal point — these
 *     are paragraph numbers, 1 to 2865.
 *
 * Together those recover 45 of the 70 tokens this function used to report as
 * unreadable. THE 25 THAT REMAIN ARE SOURCE DEFECTS RATHER THAN PUNCTUATION:
 * each is one edition against nine, and each is filed in
 * `pipeline/corrections/compendium.*.json`.
 */
export function expandCccRefs(raw: unknown): { numbers: number[]; malformed: string[] } {
	const numbers: number[] = [];
	const malformed: string[] = [];
	const normalized = String(raw ?? '')
		.replace(/[‐-―−]/g, '-')
		.replace(/\s*-\s*/g, '-');
	for (const token of normalized.split(/[\s,;.]+/)) {
		if (!token || token === '-') continue;
		const expanded = expandToken(token);
		if (expanded === null) malformed.push(token);
		else numbers.push(...expanded);
	}
	return { numbers, malformed };
}

/** An ascending list of numbers -> inclusive [from, to] runs. */
function toRuns(sorted: number[]): Run[] {
	const runs: Run[] = [];
	for (const n of sorted) {
		const last = runs[runs.length - 1];
		if (last && last[1] === n - 1) last[1] = n;
		else runs.push([n, n]);
	}
	return runs;
}

/**
 * @param editions every Compendium edition the corpus carries
 * @param cccParagraphs every paragraph the synced Catechism has
 */
export function buildCondensationMap(
	editions: CondensationEdition[],
	cccParagraphs: Set<number>
): { map: CondensationMap; stats: CondensationStats } {
	/** question -> paragraph -> how many editions named it */
	const votes = new Map<number, Map<number, number>>();
	/** question -> how many editions printed any reference at all */
	const witnesses = new Map<number, number>();
	const malformed: string[] = [];
	const absent = new Set<number>();

	for (const { lang, questions } of editions) {
		for (const question of questions) {
			const { numbers, malformed: bad } = expandCccRefs(question.ccc_refs);
			for (const token of bad) malformed.push(`${lang} Q${question.n}: ${token}`);
			if (numbers.length === 0) continue;
			witnesses.set(question.n, (witnesses.get(question.n) ?? 0) + 1);
			let counts = votes.get(question.n);
			if (!counts) votes.set(question.n, (counts = new Map()));
			for (const n of numbers) {
				// A reference to a paragraph this corpus does not carry is
				// dropped rather than linked. Nothing produces one today; the
				// check is here because the alternative is a dead address, and
				// `refs.ts` refuses those everywhere else.
				if (!cccParagraphs.has(n)) {
					absent.add(n);
					continue;
				}
				counts.set(n, (counts.get(n) ?? 0) + 1);
			}
		}
	}

	const map: CondensationMap = {};
	let paragraphCount = 0;
	let contested = 0;
	for (const [question, counts] of [...votes].sort((a, b) => a[0] - b[0])) {
		// Unreachable: `witnesses` is incremented for every question that ever
		// reaches `votes`. Guarded rather than asserted because a zero would
		// make `needed` zero and keep every stray reference in the corpus.
		const seen = witnesses.get(question) ?? 0;
		if (seen === 0) continue;
		const needed = Math.ceil(seen / 2);
		const kept = [...counts]
			.filter(([, count]) => count >= needed)
			.map(([n]) => n)
			.sort((a, b) => a - b);
		if (counts.size > kept.length) contested += 1;
		if (kept.length === 0) continue;
		map[question] = toRuns(kept);
		paragraphCount += kept.length;
	}

	return {
		map,
		stats: {
			editions: editions.length,
			questions: Object.keys(map).length,
			paragraphs: paragraphCount,
			distinctParagraphs: new Set(
				Object.values(map).flatMap(([...runs]) =>
					runs.flatMap(([from, to]) => {
						const out = [];
						for (let n = from; n <= to; n++) out.push(n);
						return out;
					})
				)
			).size,
			/** Questions where at least one edition named a paragraph the vote dropped. */
			contested,
			malformed,
			absent: [...absent].sort((a, b) => a - b)
		}
	};
}

// --- Reading the map ------------------------------------------------------

/** Catechism paragraph -> the questions condensing it, ascending. */
export function reverseCondensation(map: CondensationMap): Map<number, number[]> {
	const reverse = new Map<number, number[]>();
	for (const [question, runs] of Object.entries(map)) {
		for (const [from, to] of runs) {
			for (let n = from; n <= to; n++) {
				const questions = reverse.get(n);
				if (questions) questions.push(Number(question));
				else reverse.set(n, [Number(question)]);
			}
		}
	}
	for (const questions of reverse.values()) questions.sort((a, b) => a - b);
	return reverse;
}

/**
 * The run of questions condensing any paragraph in `[from, to]` — the
 * Compendium's answer to a Catechism division that has no counterpart in its
 * own outline (an ARTICLE, mainly: `toc-pairing.ts` pairs everything above
 * that structurally, and the Compendium prints no articles).
 *
 * THE LONGEST CONTIGUOUS RUN, NOT THE MIN AND MAX, and the difference is not
 * cosmetic. Of the Catechism's 67 articles, 58 are condensed by a block of
 * consecutive questions and 9 are not, because a question may reach outside
 * its own part: one question in Part Two cites a paragraph in Part Three's
 * treatment of the same sacrament. Spanning min to max would answer
 * "Q231-428" for ¶1987-2029, which is 198 questions for an article that
 * really has 7. The stray witness is dropped instead, and the label names
 * the block a reader would actually turn to.
 */
export function condensingRun(map: CondensationMap, from: number, to: number): Run | undefined {
	const hits: number[] = [];
	for (const [question, runs] of Object.entries(map)) {
		if (runs.some(([f, t]) => f <= to && t >= from)) hits.push(Number(question));
	}
	if (hits.length === 0) return undefined;
	hits.sort((a, b) => a - b);
	let best: Run = [hits[0], hits[0]];
	let current: Run = [hits[0], hits[0]];
	for (const n of hits.slice(1)) {
		if (n === current[1] + 1) current = [current[0], n];
		else current = [n, n];
		if (current[1] - current[0] > best[1] - best[0]) best = current;
	}
	return best;
}
