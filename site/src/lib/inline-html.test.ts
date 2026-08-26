import { describe, it, expect } from 'vitest';
import {
	parseInlineHtml,
	parseInlineMarked,
	plainTextNodes,
	inlineText,
	textRuns,
	withTextRuns,
	decodeTextRun,
	linkifyInline,
	splitLines,
	type InlineNode
} from './inline-html';
import { linkifyProse } from './refs';

/*
 * The corpus stores inline markup as a narrow, closed vocabulary and the
 * renderer walks it rather than pasting it (see the module docblock). These
 * pin the walk: nothing may lose words, and a footnote marker must come out
 * as a marker rather than as an empty superscript.
 */
describe('parseInlineHtml', () => {
	it('keeps a partial emphasis run inside surrounding text', () => {
		expect(parseInlineHtml('The <i>res novae</i> of our time')).toEqual([
			{ kind: 'text', text: 'The ' },
			{ kind: 'emphasis', tag: 'i', children: [{ kind: 'text', text: 'res novae' }] },
			{ kind: 'text', text: ' of our time' }
		]);
	});

	it('reads a footnote marker as a marker, not as a superscript', () => {
		const nodes = parseInlineHtml('word<sup data-fn="12"></sup>.');
		expect(nodes).toEqual([
			{ kind: 'text', text: 'word' },
			{ kind: 'marker', marker: '12', seq: 0 },
			{ kind: 'text', text: '.' }
		]);
	});

	it('numbers markers so the same note cited twice gets two keys', () => {
		const nodes = parseInlineHtml('a<sup data-fn="7"></sup> b<sup data-fn="7"></sup>');
		expect(nodes.filter((n) => n.kind === 'marker')).toEqual([
			{ kind: 'marker', marker: '7', seq: 0 },
			{ kind: 'marker', marker: '7', seq: 1 }
		]);
	});

	it('keeps a bare <sup> as typography — it is not a citation', () => {
		// 106 of these survive mark_footnotes across the corpus, roughly half
		// real typography inside bibliographic citations ("Paris 1960²").
		expect(parseInlineHtml('Paris 1960<sup>2</sup>')).toEqual([
			{ kind: 'text', text: 'Paris 1960' },
			{ kind: 'emphasis', tag: 'sup', children: [{ kind: 'text', text: '2' }] }
		]);
	});

	it('nests emphasis', () => {
		expect(inlineText(parseInlineHtml('<b>bold <i>and italic</i></b>'))).toBe('bold and italic');
		const [outer] = parseInlineHtml('<b>bold <i>and italic</i></b>');
		expect(outer).toMatchObject({ kind: 'emphasis', tag: 'b' });
	});

	it('renders <br/> as a break rather than swallowing it', () => {
		expect(parseInlineHtml('FOUNDATIONS<br/> AND PRINCIPLES')).toEqual([
			{ kind: 'text', text: 'FOUNDATIONS' },
			{ kind: 'break' },
			{ kind: 'text', text: ' AND PRINCIPLES' }
		]);
	});

	// Degrading to plain text is acceptable; losing words never is.
	it('keeps the words when the markup is unknown, unopened or unclosed', () => {
		expect(inlineText(parseInlineHtml('a <span lang="pt">b</span> c'))).toBe('a b c');
		expect(inlineText(parseInlineHtml('a </i> b'))).toBe('a  b');
		expect(inlineText(parseInlineHtml('a <i>b'))).toBe('a b');
	});

	it('decodes only the three escapes the scraper emits', () => {
		expect(decodeTextRun('AT&amp;T &lt;x&gt;')).toBe('AT&T <x>');
		// A literal "&lt;" in the source is stored as "&amp;lt;" and must come
		// back as text, not as a tag.
		expect(decodeTextRun('&amp;lt;')).toBe('&lt;');
		expect(inlineText(parseInlineHtml('a &amp; b'))).toBe('a & b');
	});

	it('is empty for an empty string', () => {
		expect(parseInlineHtml('')).toEqual([]);
	});
});

describe('textRuns / withTextRuns', () => {
	it('round-trips the structure while replacing every run', () => {
		const nodes = parseInlineHtml('The <i>res novae</i> of<br/> our time<sup data-fn="1"></sup>');
		expect(textRuns(nodes)).toEqual(['The ', 'res novae', ' of', ' our time']);
		const upper = withTextRuns(
			nodes,
			textRuns(nodes).map((r) => r.toUpperCase())
		);
		expect(inlineText(upper)).toBe('THE RES NOVAE OF  OUR TIME');
		expect(upper[1]).toMatchObject({ kind: 'emphasis', tag: 'i' });
		expect(upper.some((n) => n.kind === 'marker')).toBe(true);
	});
});

/*
 * A reference that straddles an emphasis boundary. vatican.va italicises the
 * book name and leaves the numbers upright, so linkifying each text run
 * separately handed the matcher "Ezek " and "47:7-9)." and matched neither.
 * 3,590 references across 88 works were affected.
 */
/**
 * `text_marked` is the OTHER stored form — the CCC's and the Compendium's,
 * with `⟦N⟧` where a document has `<sup data-fn>`. The suite below is here
 * because the two forms have to reach the renderer as the same node list and
 * go through the same linkify step, and for four days they did not: the
 * marker walk lived inside `ProseBlocks.svelte` where nothing could test it,
 * and it returned its nodes unlinkified. Every one of the 18,831 references
 * the eight Catechism editions name in running prose went undrawn — total in
 * German, French and Spanish, which print no footnotes at all and so had no
 * other apparatus to fall back on.
 */
describe('parseInlineMarked', () => {
	it('reads a footnote token as a marker between its text runs', () => {
		expect(parseInlineMarked('word⟦12⟧ tail')).toEqual([
			{ kind: 'text', text: 'word' },
			{ kind: 'marker', marker: '12', seq: 0 },
			{ kind: 'text', text: ' tail' }
		]);
	});

	it('numbers repeats by position, so each discloses independently', () => {
		expect(parseInlineMarked('a⟦4⟧b⟦4⟧')).toEqual([
			{ kind: 'text', text: 'a' },
			{ kind: 'marker', marker: '4', seq: 0 },
			{ kind: 'text', text: 'b' },
			{ kind: 'marker', marker: '4', seq: 1 }
		]);
	});

	it('returns one text run for prose carrying no apparatus', () => {
		expect(parseInlineMarked('plain prose')).toEqual([{ kind: 'text', text: 'plain prose' }]);
		expect(parseInlineMarked('')).toEqual([]);
	});

	it('links the references a marked block names in its prose', () => {
		// ccc.de 145, verbatim: this edition footnotes nothing, so its whole
		// apparatus is in the running text and an unlinkified block is an
		// unlinked paragraph.
		const marked =
			'ohne zu wissen, wohin er kommen würde" (Hebr 11, 8) [Vgl. Gen 12,1-4.]. ' +
			'Aufgrund des Glaubens hielt er sich als Fremder und Pilger im verheißenen Land [Vgl. Gen 23,4.] auf.';
		const nodes = linkifyInline(parseInlineMarked(marked), (t) => linkifyProse(t, { lang: 'de' }));
		const found = nodes.filter((n) => n.kind === 'ref');
		expect(found.map((n) => (n.kind === 'ref' ? n.seg : null))).toMatchObject([
			{ kind: 'scripture', osis: 'heb', chapter: 11 },
			{ kind: 'scripture', osis: 'gen', chapter: 12 },
			{ kind: 'scripture', osis: 'gen', chapter: 23 }
		]);
	});

	it('links across a footnote marker without swallowing it', () => {
		// ccc.la 145: the locus is printed inline AND a note follows it, which
		// is the shape `inlineText` has to skip over for the offsets to line up.
		const marked = 'nesciens quo iret » (Heb 11,8).⟦144⟧ Fide ut advena';
		const nodes = linkifyInline(parseInlineMarked(marked), (t) => linkifyProse(t, { lang: 'la' }));
		expect(nodes.filter((n) => n.kind === 'marker')).toHaveLength(1);
		const found = nodes.filter((n) => n.kind === 'ref');
		expect(found).toHaveLength(1);
		expect(found[0].kind === 'ref' && found[0].seg).toMatchObject({ osis: 'heb', chapter: 11 });
		expect(inlineText(nodes)).toBe(inlineText(parseInlineMarked(marked)));
	});
});

/**
 * The third stored form: a bare string with neither markup nor markers — a
 * Compendium answer, a Compendium question, an annotated Bible edition's
 * note. Each was rendered as inert text until 2026-08-26 on the reasoning
 * that a text with no footnote apparatus has nothing to link, which is
 * exactly backwards: those are the texts that print their locators in the
 * sentence.
 */
describe('plainTextNodes', () => {
	it('is one run, and nothing for an empty string', () => {
		expect(plainTextNodes('a plain answer')).toEqual([{ kind: 'text', text: 'a plain answer' }]);
		expect(plainTextNodes('')).toEqual([]);
	});

	it('links the locator a Compendium answer prints in its own sentence', () => {
		// compendium.en 145, verbatim — the Compendium footnotes nothing.
		const text = 'so that all might bear “the fruit of the Spirit” (Galatians 5:22).';
		const nodes = linkifyInline(plainTextNodes(text), (t) => linkifyProse(t, { lang: 'en' }));
		const found = nodes.filter((n) => n.kind === 'ref');
		expect(found).toHaveLength(1);
		expect(found[0].kind === 'ref' && found[0].seg).toMatchObject({
			osis: 'gal',
			chapter: 5,
			verses: [22]
		});
		expect(inlineText(nodes)).toBe(text);
	});

	it("reads a Douay note's Kings as Samuel, and only because the work says so", () => {
		// bible.douay-rheims.en, Challoner at 1 Chronicles 21 — the census,
		// which is 2 Samuel 24. Under the modern reading it is Jehoiachin.
		const text = 'The difference of the numbers here and 2 Kings 24. is to be accounted for';
		const osisOf = (work?: string) => {
			const nodes = linkifyInline(plainTextNodes(text), (t) =>
				linkifyProse(t, { lang: 'en', work })
			);
			const ref = nodes.find((n) => n.kind === 'ref');
			return ref?.kind === 'ref' && ref.seg.kind === 'scripture' ? ref.seg.osis : undefined;
		};
		expect(osisOf()).toBe('2kgs');
		expect(osisOf('bible.douay-rheims.en')).toBe('2sam');
	});
});

describe('linkifyInline', () => {
	const link = (html: string) =>
		linkifyInline(parseInlineHtml(html), (t) => linkifyProse(t, { lang: 'en' }));

	const refs = (nodes: InlineNode[]): InlineNode[] => {
		const out: InlineNode[] = [];
		const walk = (ns: InlineNode[]) => {
			for (const n of ns) {
				if (n.kind === 'ref') out.push(n);
				if (n.kind === 'ref' || n.kind === 'emphasis') walk(n.children);
			}
		};
		walk(nodes);
		return out;
	};

	it('links a citation whose book name is italic and whose numbers are not', () => {
		// dilexit-nos.en §93, verbatim from the corpus.
		const nodes = link('the river goes” (<i>Ezek </i>47:7-9).');
		const found = refs(nodes);
		expect(found.length).toBeGreaterThan(0);
		expect(found[0].kind === 'ref' && found[0].seg.kind).toBe('scripture');
		expect(found[0].kind === 'ref' && found[0].seg).toMatchObject({
			osis: 'ezek',
			chapter: 47
		});
	});

	it('keeps the italic half italic while linking across the boundary', () => {
		const nodes = link('(<i>Ezek </i>47:7-9).');
		// The emphasis node survives and now holds a ref inside it.
		const em = nodes.find((n) => n.kind === 'emphasis');
		expect(em).toBeDefined();
		expect(em && em.kind === 'emphasis' && em.children[0].kind).toBe('ref');
	});

	it('loses no words', () => {
		const html = 'quoted (<i>Ezek </i>47:7-9) and <b>bold</b> tail';
		expect(inlineText(link(html))).toBe(inlineText(parseInlineHtml(html)));
	});

	it('leaves prose with no references structurally untouched', () => {
		const html = 'The <i>res novae</i> of our time';
		expect(link(html)).toEqual(parseInlineHtml(html));
	});
});

/**
 * `<a data-ref>` is the corpus stating a reference rather than the site
 * guessing one out of prose — CCEL marks all 5,180 of the Summa's
 * self-citations this way (`parseStoredRef`).
 */
describe('stored references', () => {
	it('parses an anchor into a ref node carrying its address', () => {
		const nodes = parseInlineHtml('as shown (<a data-ref="summa:I:74:2">Q[74], A[2]</a>)');
		const ref = nodes.find((n) => n.kind === 'ref');
		expect(ref).toBeDefined();
		expect(ref!.kind === 'ref' && ref!.seg).toMatchObject({
			kind: 'summa',
			part: 'I',
			question: 74,
			article: 2
		});
		expect(inlineText(nodes)).toBe('as shown (Q[74], A[2])');
	});

	it('reads a question-level anchor as having no article', () => {
		const nodes = parseInlineHtml('<a data-ref="summa:II-II:184">Q[184]</a>');
		const ref = nodes[0];
		expect(ref.kind === 'ref' && ref.seg.kind === 'summa' && ref.seg.article).toBe(null);
	});

	it('keeps the words and drops the wrapper for an address it cannot read', () => {
		// What makes a corpus written by a newer scraper readable by an older
		// site: an unknown work family degrades to text, never to an error.
		const nodes = parseInlineHtml('see <a data-ref="quodlibet:3:1">Q[3]</a> here');
		expect(nodes.some((n) => n.kind === 'ref')).toBe(false);
		expect(inlineText(nodes)).toBe('see Q[3] here');
	});

	it('keeps a later prose citation at the right offset', () => {
		// The regression this was written for: `linkifyInline` counted a
		// `ref`'s text in its flattened string but not in its walk, so every
		// span after a stored anchor landed short by that anchor's length.
		const nodes = parseInlineHtml('<a data-ref="summa:I:1:1">Q[1], A[1]</a> and then Jn 3:16');
		const linked = linkifyInline(nodes, (text) => {
			const at = text.indexOf('Jn 3:16');
			return [
				{ kind: 'text', text: text.slice(0, at) },
				{ kind: 'text', text: text.slice(at) }
			];
		});
		expect(inlineText(linked)).toBe('Q[1], A[1] and then Jn 3:16');
	});
});

describe('splitLines', () => {
	const text = (line: InlineNode[]) => line.map((n) => (n.kind === 'text' ? n.text : '')).join('');

	it('cuts a verse block into the lines the source printed', () => {
		const lines = splitLines(
			parseInlineHtml('and holy is his Name.<br />He has mercy<br />on those')
		);
		expect(lines.map(text)).toEqual(['and holy is his Name.', 'He has mercy', 'on those']);
	});

	it('gives a block with no breaks exactly one line', () => {
		// The prose prayers depend on this: one line means no hanging indent,
		// so the Memorare is not set as if it were a hymn.
		expect(splitLines(parseInlineHtml('Remember, O most gracious Virgin Mary'))).toHaveLength(1);
	});

	it('keeps markup inside the line it belongs to', () => {
		const lines = splitLines(parseInlineHtml('a <i>b</i><br />c'));
		expect(lines).toHaveLength(2);
		expect(lines[0][1]).toEqual({
			kind: 'emphasis',
			tag: 'i',
			children: [{ kind: 'text', text: 'b' }]
		});
		expect(text(lines[1])).toBe('c');
	});

	it('leaves a break nested in emphasis alone rather than splitting across it', () => {
		// Splitting there would mean reopening the `<i>` on the far side of the
		// cut — rewriting the corpus's markup rather than reading it.
		const lines = splitLines(parseInlineHtml('<i>a<br />b</i>'));
		expect(lines).toHaveLength(1);
	});
});
