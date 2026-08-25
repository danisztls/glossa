import { describe, it, expect } from 'vitest';
import {
	parseInlineHtml,
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
