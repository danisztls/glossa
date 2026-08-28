import { describe, expect, it } from 'vitest';
import { summaOutline } from './corpus';
import { contains, marker, rowHref, rowState } from './components/structureToc';
import { displayTitle } from './titles';
import type { StructureNode } from './types';

/**
 * `summaOutline` replaced `summaToc.ts` and `SummaSidebarToc.svelte`, which
 * existed on the claim that the Summa's flat `SummaNode` could not become a
 * `StructureNode` tree without "inventing bounds (`paragraphs`) and kinds the
 * corpus does not carry". `DocumentNode` is the same shape and
 * `buildDocumentOutline` derives exactly those bounds from it, by the rule
 * `types.ts` states and `docs/corpus-schema.md` repeats for the Summa
 * specifically. So these tests are about the derivation being the shared one
 * and still telling the truth about this work's two real peculiarities —
 * per-part question numbering, and a Latin edition that prints no headings.
 *
 * The fixtures carry both: `summa.en` has one part heading and three
 * treatises under it, `summa.la` has part headings and nothing else.
 */

const titles = (nodes: StructureNode[]) => nodes.map((n) => n.title);
const ranges = (nodes: StructureNode[]) => nodes.map((n) => n.paragraphs);

/** The question row for `n`, wherever the outline put it — under a treatise
 *  when the edition prints them, at the top level when it does not. */
function question(roots: StructureNode[], n: number): StructureNode | undefined {
	for (const node of roots) {
		if (node.n === n && node.kind === 'sub') return node;
		const hit = question(node.children, n);
		if (hit) return hit;
	}
	return undefined;
}

describe('treatise ranges are derived, never stored', () => {
	it('runs each treatise up to just before the next one begins', () => {
		const roots = summaOutline('en', 'I');
		// The fixture's headings start at questions 1, 2 and 27.
		// Title-cased and de-bracketed by `summaHeadingTitle`, the same
		// display pass the bespoke component used.
		expect(titles(roots)).toEqual([
			'Treatise on Sacred Doctrine (Q 1)',
			'Treatise on the One God (QQ 2-26)',
			'Treatise on the Most Holy Trinity (QQ 27-43)'
		]);
		expect(ranges(roots)).toEqual([
			[1, 1],
			[2, 26],
			// The last treatise runs to the part's last question, not to a
			// stored bound — the fixture's highest `I` question is 71.
			[27, 71]
		]);
	});

	it('drops the PART heading, which would be a root containing everything', () => {
		expect(titles(summaOutline('en', 'I')).join(' ')).not.toMatch(/FIRST PART/i);
	});

	it('puts each question under the treatise whose range covers it', () => {
		const [sacredDoctrine, oneGod, trinity] = summaOutline('en', 'I');
		expect(sacredDoctrine.children.map((c) => c.n)).toEqual([1]);
		expect(oneGod.children).toEqual([]);
		// Question 71 falls in the third treatise's derived range (27–71).
		expect(trinity.children.map((c) => c.n)).toEqual([71]);
	});
});

describe('the Latin edition prints no treatise headings', () => {
	it('degrades to a flat list of questions rather than borrowing English divisions', () => {
		const roots = summaOutline('la', 'I');
		expect(roots.map((n) => n.n)).toEqual([1, 71]);
		expect(roots.every((n) => n.children.length === 0)).toBe(true);
	});

	it('marks a title it had to borrow, with the language it came from', () => {
		const [q1] = summaOutline('la', 'I');
		// The Corpus Thomisticum prints no question titles, so this is the
		// English edition's, and the row has to say so.
		expect(q1.titleLang).toBe('en');
		expect(q1.title).not.toBe('');
	});

	it('leaves a title the edition prints itself unmarked', () => {
		const [treatise] = summaOutline('en', 'I');
		expect(treatise.children[0].titleLang).toBeUndefined();
	});
});

describe('question numbering restarts per part', () => {
	it('never mixes two parts into one outline', () => {
		expect(summaOutline('en', 'II-II').flatMap((n) => n.children.map((c) => c.n))).not.toContain(1);
		expect(summaOutline('en', 'Suppl').map((n) => n.n)).toEqual([77]);
	});

	it('resolves the current row per part, so q. 1 of one is not q. 1 of another', () => {
		const [first] = summaOutline('en', 'I');
		expect(contains(first, 1)).toBe(true);
		// II-II's fixture question is 184; a part-blind outline would have
		// matched it against I's ranges.
		expect(summaOutline('en', 'II-II').some((n) => contains(n, 1))).toBe(false);
	});
});

describe('articles are fragments of the question page', () => {
	const outline = () =>
		summaOutline('en', 'II-II', 184, [
			{ n: 1, title: 'Whether perfection consists in charity?' },
			{ n: 2, title: 'OF THE STATE OF PERFECTION (SIX ARTICLES)' },
			{ n: 3, titleLang: 'en' }
		]);

	it('hangs only under the question being read', () => {
		expect(question(outline(), 184)?.children.map((c) => c.anchor)).toEqual(['a1', 'a2', 'a3']);
		// Nothing hangs anywhere when no question is being read.
		expect(question(summaOutline('en', 'II-II'), 184)?.children).toEqual([]);
	});

	it('carries null bounds, because a question number does not address an article', () => {
		expect(question(outline(), 184)?.children.map((c) => c.paragraphs)).toEqual([
			[null, null],
			[null, null],
			[null, null]
		]);
	});

	it('is addressed by its anchor, not by a route', () => {
		const article: StructureNode = {
			kind: 'article',
			n: 3,
			title: '',
			paragraphs: [null, null],
			children: [],
			anchor: 'a3'
		};
		expect(rowHref(article, NaN, 'route', (n) => `/doctores/summa/ii-ii/${n}`)).toBe('#a3');
	});

	/**
	 * The index tier holds article NUMBERS and no titles, so a sidebar built
	 * from it alone listed bare ordinals beside titled headings. The titles
	 * come from the question the reading page already loaded, through the same
	 * display pass a question title gets — `(SIX ARTICLES)` and the shouting
	 * both come off — and a borrowed one still says where it came from.
	 */
	it('carries the title the page headed the article with', () => {
		const kids = question(outline(), 184)!.children;
		expect(kids.map((c) => c.title)).toEqual([
			// Sentence case in the source, and left alone; only the shouted
			// heading beneath it is recased.
			'Whether perfection consists in charity?',
			'Of the State of Perfection',
			''
		]);
		expect(kids.map((c) => c.titleLang)).toEqual([undefined, undefined, 'en']);
	});

	it('is an `article`, so the row gets a kind marker rather than a bare ordinal', () => {
		const kids = question(outline(), 184)!.children;
		expect(kids.map((c) => c.kind)).toEqual(['article', 'article', 'article']);
		expect(marker(kids[0], 'en')).toBe('Art. 1');
		expect(displayTitle(kids[0], 'en').title).toBe('Whether perfection consists in charity?');
		// `sub` had no entry in that table, so the old rows fell through to
		// `displayTitle`'s ordinal — which, against a title that WAS the
		// ordinal, left the row with a number and no text at all.
		expect(displayTitle(kids[2], 'en').title).toBe('');
	});

	it('never steals the current-row highlight from its question', () => {
		const q184 = question(outline(), 184)!;
		// Null-bound children cannot contain the position, so the QUESTION is
		// the deepest current row — the old bespoke component's behaviour, and
		// the reason articles are not given their question's range.
		expect(rowState(q184, 184, undefined)).toEqual({ onPath: true, isCurrent: true });
		expect(q184.children.every((c) => !rowState(c, 184, undefined).onPath)).toBe(true);
	});
});
