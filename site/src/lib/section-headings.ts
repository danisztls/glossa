/**
 * The headings INSIDE a work, as something the jump box can complete.
 *
 * ## What was missing
 *
 * `suggest.ts` ranges over the address space and over the works' own NAMES —
 * a book, a document, a prayer, a Summa question, a Catechism chapter. What
 * it never saw was the headings a work prints inside itself: the sections of
 * a magisterial document, the titles and chapters of the Code, the divisions
 * of the Compendium of the Social Doctrine. Those are reachable today only by
 * opening the work and reading its table of contents, which is the one thing
 * a reader who knows the words cannot do quickly.
 *
 * ## Why it is a shard per language and not one file
 *
 * A heading is TEXT, so it exists once per edition, and this corpus is 2,068
 * editions of 466 works. Every edition's headings is 1.8 MB before framing;
 * the reader needs one edition of each work — the one they would actually
 * open. So `sync-corpus.mjs` resolves that per interface language, walking the
 * same list `editionInLang` walks at runtime, and writes
 * `index/section-headings.<lang>.json`. A reader fetches ONE of them, on the
 * first opening of the jump box: 65–100 KB gzipped, ~5,000 headings.
 *
 * THE NEIGHBOUR IS THE POINT OF RESOLVING RATHER THAN FILTERING. A Portuguese
 * reader's shard carries the Portuguese headings of every work that has them
 * and the SPANISH ones of the works that do not, because that is the edition
 * `/documenta/{slug}` will show them. Shipping a shard per language and
 * loading the reader's whole chain would have cost 256 KB gzipped for the
 * same answer.
 *
 * ## What it costs to be wrong about the edition
 *
 * A reader who has overridden ONE work's edition by hand (`content.svelte.ts`
 * keeps a per-slug override) is offered that work's headings in the language
 * their shard was built for, and lands on the page in the language they
 * chose. The anchor is the same number either way — a heading's address is
 * `#s{n}`, and `n` is a unit number, which no edition disagrees about — so
 * the cost is a row labelled in the wrong language, not a row that goes
 * anywhere wrong.
 */

/** One heading: the unit it stands before, and the words the edition prints.
 *  A tuple rather than an object because there are five thousand of them per
 *  shard and `{"n":7,"title":"…"}` is 12 bytes of punctuation each. */
export type HeadingRow = [n: number, title: string];

/**
 * A shard: one language's headings for the three work types that have them.
 *
 * The Bible, the Catechism, its Compendium and the Summa are absent on
 * purpose — their divisions are already named in the box (`titleIndex`'s
 * chapter rows and question titles), and a work whose headings are already
 * addressable by name does not want them twice.
 */
export interface SectionHeadings {
	/** Keyed by document SLUG, which is what the address names — the edition
	 *  each row came from is the shard's business and nothing downstream's. */
	documents: Record<string, HeadingRow[]>;
	socialDoctrine: HeadingRow[];
	canonLaw: HeadingRow[];
}

export const EMPTY_SECTION_HEADINGS: SectionHeadings = {
	documents: {},
	socialDoctrine: [],
	canonLaw: []
};

/** The shape `structure.json` stores, narrowed to what a heading row needs.
 *  `before` is the unit number the heading stands before, and `null` where
 *  the edition prints a heading after its last numbered unit. */
export interface StructureRow {
	title?: string;
	before?: number | null;
}

/**
 * The headings of one edition, pruned to what is worth offering.
 *
 * THREE DROPS, AND EACH IS A ROW THAT COULD NOT BE FOLLOWED OR COULD NOT BE
 * TOLD APART.
 *
 *  - **No `before`** — the heading stands after the last numbered unit, so
 *    `#s{n}` would name nothing. 6,642 rows of the corpus, mostly appendices.
 *  - **The work's own title** — every document prints its name over its first
 *    page, and the box already offers that document by that name. A second
 *    row differing only in where it lands is a duplicate a reader has to read
 *    twice to tell apart.
 *  - **The same words at the same anchor twice** — an edition that prints a
 *    title and its subtitle as two level-1 headings, both before §1.
 *
 * WHAT IS DELIBERATELY NOT DROPPED is the front matter a document opens with
 * — `PAUL, BISHOP, SERVANT OF THE SERVANTS OF GOD`, `INTRODUCTION`. They are
 * headings the edition really prints, they cost their own bytes and nothing
 * else, and every rule proposed for recognising them ("level 1 before §1",
 * "all capitals") also catches the first chapter of something.
 */
export function headingRows(
	nodes: readonly StructureRow[],
	work: { title?: string; short_title?: string }
): HeadingRow[] {
	const own = new Set(
		[work.title, work.short_title]
			.filter((t): t is string => Boolean(t))
			.map((t) => t.trim().toLowerCase())
	);
	// A set per anchor rather than one set of joined keys: the same words at
	// two anchors are two places, and joining a number to a title needs a
	// separator no title may contain, which is a claim about the corpus
	// nobody can check.
	const seen = new Map<number, Set<string>>();
	const rows: HeadingRow[] = [];
	for (const node of nodes) {
		const title = node.title?.trim();
		const before = node.before;
		if (!title || typeof before !== 'number') continue;
		const folded = title.toLowerCase();
		if (own.has(folded)) continue;
		const here = seen.get(before) ?? new Set<string>();
		if (here.has(folded)) continue;
		here.add(folded);
		seen.set(before, here);
		rows.push([before, title]);
	}
	return rows;
}
