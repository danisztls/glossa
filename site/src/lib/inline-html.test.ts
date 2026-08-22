import { describe, it, expect } from 'vitest';
import { parseInlineHtml, inlineText, textRuns, withTextRuns, decodeTextRun } from './inline-html';

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
