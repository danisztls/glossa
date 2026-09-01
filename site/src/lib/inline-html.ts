/**
 * A tiny reader for the inline markup the corpus stores per block and per
 * heading (`docs/corpus-schema.md`, amended 2026-08-21) — `<i>`, `<b>`,
 * `<br/>`, `<sup>`, and the `<sup data-fn="N"></sup>` footnote marker.
 *
 * WHY PARSE IT INSTEAD OF HANDING IT TO {@html}. Not safety: the scraper's
 * `narrow_html` rebuilds every stored string from a closed five-tag
 * allowlist, so the payload cannot contain anything else, and the site does
 * use {@html} for inert corpus markup (`manifest.header`). This text is not
 * inert. Three things have to reach INSIDE it:
 *
 *   - `<sup data-fn="12">` is not a superscript to print, it is where the
 *     footnote disclosure button goes. Pasted as HTML it renders as an empty
 *     `<sup>` and the entire citation apparatus vanishes.
 *   - `linkifyProse` has to find "cf. Jn 3:16" in the TEXT and not inside a
 *     tag or an attribute.
 *   - the drop cap needs the first letter of the first text run.
 *
 * Any one of those means walking the markup rather than pasting it. Nothing
 * here produces HTML — it produces nodes a Svelte snippet renders — so the
 * output cannot inject markup even if the corpus someday did.
 *
 * Text runs carry only `&amp;`/`&lt;`/`&gt;`: the scraper decodes the
 * source's entity vocabulary (`&atilde;` and a long tail) once, at parse
 * time, precisely so this file needs no entity table. See
 * `escape_text_run` in `vatican_docs.py`.
 */

import { parseStoredRef, type RefSegment } from './refs-grammar.ts';

export type InlineNode =
	| { kind: 'text'; text: string }
	| { kind: 'break' }
	/** A footnote reference. `seq` is its 0-based position among the markers
	 *  of this string, which gives each disclosure a stable key even when the
	 *  same note is cited twice in one paragraph. */
	| { kind: 'marker'; marker: string; seq: number }
	| { kind: 'emphasis'; tag: 'i' | 'b' | 'sup'; children: InlineNode[] }
	/**
	 * A run of text that resolved to a reference. Produced two ways, which is
	 * a change: `linkifyInline` still makes one when it FINDS a citation in
	 * prose, and `parseInlineHtml` now makes one when the corpus STATES a
	 * reference, from `<a data-ref="…">`.
	 *
	 * The two are the same node on purpose. Everything downstream — `refHref`,
	 * the renderers, the hover preview — cares what the reference addresses,
	 * not how it was found, and a source that marked its own cross-references
	 * up is strictly better evidence than a regex over its prose, not a
	 * different kind of thing.
	 */
	| { kind: 'ref'; seg: RefSegment; children: InlineNode[] };

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const DATA_FN = /\bdata-fn="([^"]*)"/;
/** The corpus address on an inline anchor — see `parseStoredRef`. */
const DATA_REF = /\bdata-ref="([^"]*)"/;
const EMPHASIS = new Set(['i', 'b', 'sup']);

/** The three escapes `escape_text_run` produces, and no others. `&amp;` is
 *  decoded LAST so that a literal `&lt;` in the source (stored as
 *  `&amp;lt;`) comes back as the text `&lt;` rather than as `<`. */
export function decodeTextRun(s: string): string {
	return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/**
 * Parse a stored inline-markup string into nodes.
 *
 * Deliberately forgiving in one direction only: a tag outside the allowlist,
 * or a stray close tag with no opener, is skipped while its text is kept —
 * the same "keep the words, drop the markup" rule the scraper applies when
 * it narrows. Unclosed tags are closed at the end of the string. Malformed
 * input therefore degrades to plain text and never to lost words.
 */
export function parseInlineHtml(html: string): InlineNode[] {
	const root: InlineNode[] = [];
	// `seg` is set only on an `<a data-ref>` frame, and is what decides
	// whether closing it yields a `ref` node or an `emphasis` one.
	const stack: { tag: string; children: InlineNode[]; seg?: RefSegment }[] = [];
	const top = () => (stack.length ? stack[stack.length - 1].children : root);

	const closeFrame = (frame: { tag: string; children: InlineNode[]; seg?: RefSegment }) => {
		const parent = stack.length ? stack[stack.length - 1].children : root;
		if (frame.seg) {
			parent.push({ kind: 'ref', seg: frame.seg, children: frame.children });
		} else {
			parent.push({
				kind: 'emphasis',
				tag: frame.tag as 'i' | 'b' | 'sup',
				children: frame.children
			});
		}
	};

	let seq = 0;
	let pos = 0;
	TAG.lastIndex = 0;
	for (let m = TAG.exec(html); m !== null; m = TAG.exec(html)) {
		if (m.index > pos) {
			const text = decodeTextRun(html.slice(pos, m.index));
			if (text) top().push({ kind: 'text', text });
		}
		pos = m.index + m[0].length;

		const closing = m[1] === '/';
		const tag = m[2].toLowerCase();
		const attrs = m[3] ?? '';

		if (tag === 'br') {
			if (!closing) top().push({ kind: 'break' });
			continue;
		}
		if (tag === 'sup' && !closing) {
			const fn = DATA_FN.exec(attrs);
			if (fn) {
				// Self-contained by construction: the scraper emits the marker
				// as `<sup data-fn="N"></sup>` with nothing between the tags,
				// so the matching close tag is consumed as an unopened one
				// below rather than needing a lookahead here.
				top().push({ kind: 'marker', marker: fn[1], seq: seq++ });
				continue;
			}
		}
		// An anchor whose address this version cannot read is treated as an
		// unknown tag: its words stay, its wrapper goes. That is what keeps a
		// corpus written by a newer scraper readable by an older site.
		let seg: RefSegment | undefined;
		if (tag === 'a' && !closing) {
			const address = DATA_REF.exec(attrs);
			seg = address ? parseStoredRef(address[1], '') : undefined;
			if (!seg) continue;
		}
		if (tag !== 'a' && !EMPHASIS.has(tag)) continue; // unknown tag: keep the text, drop the wrapper

		if (closing) {
			// Close the nearest matching opener; ignore it entirely if there
			// is none, rather than unwinding unrelated emphasis.
			const at = stack.map((f) => f.tag).lastIndexOf(tag);
			if (at === -1) continue;
			while (stack.length > at) {
				closeFrame(stack.pop() as { tag: string; children: InlineNode[]; seg?: RefSegment });
			}
		} else {
			stack.push({ tag, children: [], seg });
		}
	}
	if (pos < html.length) {
		const text = decodeTextRun(html.slice(pos));
		if (text) top().push({ kind: 'text', text });
	}
	while (stack.length) {
		closeFrame(stack.pop() as { tag: string; children: InlineNode[]; seg?: RefSegment });
	}
	return root;
}

/**
 * A parsed string cut at its top-level line breaks — one array per printed
 * line, and a one-element array when the string has none.
 *
 * WHY A CALLER WANTS THE LINES RATHER THAN THE BREAKS. Verse has to
 * distinguish a line the SOURCE broke from a line the VIEWPORT broke, and a
 * hanging indent is how print does it: the source's lines start at the
 * margin, a wrap sits in from it. One paragraph carrying `<br>` cannot
 * express that, and the way it fails is not subtle — `text-indent` applies to
 * a BLOCK's first line, so the first source line is the only one at the
 * margin and all nineteen others look like continuations of it. Giving each
 * line its own block is what lets the indent mean "continued".
 *
 * SPLITS AT THE TOP LEVEL ONLY. A break inside `<i>`/`<b>`/`<a>` stays a
 * `break` node and renders as a `<br>` within its line — the behaviour this
 * replaces, not a new failure. Splitting there would mean reopening the
 * emphasis on the far side of the cut, which is rewriting the corpus's markup
 * rather than reading it. No stored string does it today: measured across
 * every block of every prayer edition, vernacular and Latin, along with
 * leading, trailing and doubled breaks, all of which are likewise absent.
 */
/**
 * Plain corpus text — no markup, no `⟦N⟧` tokens — as the one-node list
 * `linkifyInline` and `InlineNodes` both take.
 *
 * The third stored form, and the reason it needs a name of its own: a
 * Compendium answer, a Compendium question and an annotated Bible edition's
 * note are all stored as bare strings, so a caller reaching for
 * `parseInlineHtml` would parse a `<` the source printed and a caller
 * reaching for `parseInlineMarked` would claim an apparatus that is not
 * there. Both would work today by accident. This says what the string is.
 */
export function plainTextNodes(text: string): InlineNode[] {
	return text ? [{ kind: 'text', text }] : [];
}

/** The CCC's and the Compendium's footnote token — see `parseInlineMarked`. */
const MARKER_RE = /⟦([^⟧]+)⟧/g;

/**
 * The OTHER stored form, and the sibling of `parseInlineHtml`: `text_marked`,
 * which carries no markup at all, only `⟦N⟧` footnote tokens (the CCC and the
 * Compendium have not been migrated to `html` — `docs/corpus-schema.md`).
 *
 * It lives here, beside the parser it parallels, rather than inside the one
 * component that reads it, because the pairing is the point. A caller renders
 * a block by parsing it and then linkifying it, and while this half was a
 * private helper in `ProseBlocks.svelte` the two halves drifted: the `html`
 * branch ran `linkifyInline` and this one returned its nodes raw, so from
 * 2026-08-22 the Catechism drew none of the 18,831 references its prose names
 * (`parseInlineMarked` + `linkifyInline` in `inline-html.test.ts` is the test
 * that would have caught it). Same shape, same file, one test each.
 */
export function parseInlineMarked(marked: string): InlineNode[] {
	const nodes: InlineNode[] = [];
	let lastIndex = 0;
	let seq = 0;
	for (const match of marked.matchAll(MARKER_RE)) {
		const index = match.index ?? 0;
		if (index > lastIndex) nodes.push({ kind: 'text', text: marked.slice(lastIndex, index) });
		nodes.push({ kind: 'marker', marker: match[1], seq: seq++ });
		lastIndex = index + match[0].length;
	}
	if (lastIndex < marked.length) nodes.push({ kind: 'text', text: marked.slice(lastIndex) });
	return nodes;
}

export function splitLines(nodes: InlineNode[]): InlineNode[][] {
	const lines: InlineNode[][] = [[]];
	for (const node of nodes) {
		if (node.kind === 'break') lines.push([]);
		else lines[lines.length - 1].push(node);
	}
	return lines;
}

/** Every text run, in document order. The case normalizer works on these so
 *  that an ALL-CAPS heading carrying markup is title-cased across its words
 *  without the tags between them being touched. */
export function textRuns(nodes: InlineNode[]): string[] {
	const out: string[] = [];
	const walk = (ns: InlineNode[]) => {
		for (const n of ns) {
			if (n.kind === 'text') out.push(n.text);
			else if (n.kind === 'emphasis' || n.kind === 'ref') walk(n.children);
		}
	};
	walk(nodes);
	return out;
}

/** `nodes` with its text runs replaced, in the same order `textRuns` yields
 *  them. Structure is preserved; only the strings change. */
export function withTextRuns(nodes: InlineNode[], runs: string[]): InlineNode[] {
	let i = 0;
	const walk = (ns: InlineNode[]): InlineNode[] =>
		ns.map((n) =>
			n.kind === 'text'
				? { kind: 'text', text: runs[i++] ?? n.text }
				: n.kind === 'emphasis' || n.kind === 'ref'
					? { ...n, children: walk(n.children) }
					: n
		);
	return walk(nodes);
}

/** The plain text of a parsed string — the value the corpus stores alongside
 *  it, and what a caller wants when it needs to measure or match rather than
 *  render. Markers contribute nothing, matching `html_to_text`. */
export function inlineText(nodes: InlineNode[]): string {
	let out = '';
	const walk = (ns: InlineNode[]) => {
		for (const n of ns) {
			if (n.kind === 'text') out += n.text;
			else if (n.kind === 'break') out += ' ';
			else if (n.kind === 'emphasis' || n.kind === 'ref') walk(n.children);
		}
	};
	walk(nodes);
	return out;
}

/**
 * Reference links found across the WHOLE block's text, not run by run.
 *
 * WHY THIS EXISTS. vatican.va italicises the book name of a Scripture
 * citation and leaves the numbers upright — `(<i>Ezek </i>47:7-9)` — so the
 * reference straddles an emphasis boundary. Rendering walked the node tree
 * and linkified each text run separately, which meant the linkifier was
 * handed `"Ezek "` and `"47:7-9)."` as unrelated strings and could not match
 * either. **3,590 references across 88 works** were silently not linking,
 * concentrated in exactly the documents that cite Scripture most:
 * `veritatis-splendor` (306 EN / 311 PT), `evangelium-vitae.pt` (316),
 * `dilexit-nos` (118 EN / 127 PT).
 *
 * It is the same mistake the scraper made on the other side of the pipeline —
 * "an emphasis tag is not a word boundary" (`decisions.md` §Storage).
 * Markup describes how the words look; it does not divide them.
 *
 * So: flatten to text, linkify once, then split the tree back apart at the
 * segment boundaries. A reference that spans an emphasis boundary yields two
 * adjacent `ref` nodes sharing one segment — each keeps its own emphasis, and
 * they render as touching links, which is right both visually and
 * semantically (the italic half really is italic in the source).
 */
export function linkifyInline(
	nodes: InlineNode[],
	linkify: (text: string) => RefSegment[]
): InlineNode[] {
	// Flatten exactly as `inlineText` does, so offsets line up with what the
	// linkifier sees. A `break` contributes one space on both sides.
	const flat = inlineText(nodes);
	if (!flat) return nodes;

	// Segment boundaries as absolute offsets. `linkifyProse` returns segments
	// whose text concatenates back to the input, so lengths give positions.
	const spans: { start: number; end: number; seg: RefSegment }[] = [];
	let at = 0;
	for (const seg of linkify(flat)) {
		const raw = seg.kind === 'text' ? seg.text : seg.raw;
		if (seg.kind !== 'text') spans.push({ start: at, end: at + raw.length, seg });
		at += raw.length;
	}
	if (spans.length === 0) return nodes;

	let pos = 0;
	const walk = (ns: InlineNode[]): InlineNode[] => {
		const out: InlineNode[] = [];
		for (const node of ns) {
			if (node.kind === 'text') {
				const start = pos;
				pos += node.text.length;
				out.push(...splitRun(node.text, start, spans));
			} else if (node.kind === 'break') {
				pos += 1;
				out.push(node);
			} else if (node.kind === 'emphasis') {
				out.push({ ...node, children: walk(node.children) });
			} else if (node.kind === 'ref') {
				// A reference the CORPUS stated (`<a data-ref>`, parsed before
				// this ever runs) is already resolved, so its interior is not
				// re-linkified — but `pos` must still advance past its text, or
				// every span after it in the block lands at the wrong offset.
				// `inlineText` counts a `ref`'s children; this walk did not,
				// which was harmless only while no `ref` could exist yet.
				pos += inlineText([node]).length;
				out.push(node);
			} else {
				out.push(node);
			}
		}
		return out;
	};
	return walk(nodes);
}

/** One text run cut at every reference boundary crossing it. */
function splitRun(
	text: string,
	start: number,
	spans: { start: number; end: number; seg: RefSegment }[]
): InlineNode[] {
	const end = start + text.length;
	const cuts = new Set<number>([0, text.length]);
	for (const s of spans) {
		if (s.end <= start || s.start >= end) continue;
		cuts.add(Math.max(0, s.start - start));
		cuts.add(Math.min(text.length, s.end - start));
	}
	const points = [...cuts].sort((a, b) => a - b);
	const out: InlineNode[] = [];
	for (let i = 0; i < points.length - 1; i++) {
		const from = points[i];
		const to = points[i + 1];
		if (to === from) continue;
		const piece = text.slice(from, to);
		const abs = start + from;
		const span = spans.find((s) => s.start <= abs && abs < s.end);
		const child: InlineNode = { kind: 'text', text: piece };
		out.push(span ? { kind: 'ref', seg: span.seg, children: [child] } : child);
	}
	return out;
}
