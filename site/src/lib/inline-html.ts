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

export type InlineNode =
	| { kind: 'text'; text: string }
	| { kind: 'break' }
	/** A footnote reference. `seq` is its 0-based position among the markers
	 *  of this string, which gives each disclosure a stable key even when the
	 *  same note is cited twice in one paragraph. */
	| { kind: 'marker'; marker: string; seq: number }
	| { kind: 'emphasis'; tag: 'i' | 'b' | 'sup'; children: InlineNode[] };

const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
const DATA_FN = /\bdata-fn="([^"]*)"/;
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
	const stack: { tag: string; children: InlineNode[] }[] = [];
	const top = () => (stack.length ? stack[stack.length - 1].children : root);

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
		if (!EMPHASIS.has(tag)) continue; // unknown tag: keep the text, drop the wrapper

		if (closing) {
			// Close the nearest matching opener; ignore it entirely if there
			// is none, rather than unwinding unrelated emphasis.
			const at = stack.map((f) => f.tag).lastIndexOf(tag);
			if (at === -1) continue;
			while (stack.length > at) {
				const frame = stack.pop() as { tag: string; children: InlineNode[] };
				const parent = stack.length ? stack[stack.length - 1].children : root;
				parent.push({
					kind: 'emphasis',
					tag: frame.tag as 'i' | 'b' | 'sup',
					children: frame.children
				});
			}
		} else {
			stack.push({ tag, children: [] });
		}
	}
	if (pos < html.length) {
		const text = decodeTextRun(html.slice(pos));
		if (text) top().push({ kind: 'text', text });
	}
	while (stack.length) {
		const frame = stack.pop() as { tag: string; children: InlineNode[] };
		const parent = stack.length ? stack[stack.length - 1].children : root;
		parent.push({
			kind: 'emphasis',
			tag: frame.tag as 'i' | 'b' | 'sup',
			children: frame.children
		});
	}
	return root;
}

/** Every text run, in document order. The case normalizer works on these so
 *  that an ALL-CAPS heading carrying markup is title-cased across its words
 *  without the tags between them being touched. */
export function textRuns(nodes: InlineNode[]): string[] {
	const out: string[] = [];
	const walk = (ns: InlineNode[]) => {
		for (const n of ns) {
			if (n.kind === 'text') out.push(n.text);
			else if (n.kind === 'emphasis') walk(n.children);
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
				: n.kind === 'emphasis'
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
			else if (n.kind === 'emphasis') walk(n.children);
		}
	};
	walk(nodes);
	return out;
}
