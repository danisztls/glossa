/**
 * Href -> preview-target parsing for the hover/focus content preview
 * (`LinkPreview.svelte`).
 *
 * Deliberately pure and dependency-free (no `$lib/corpus`, no i18n, no
 * DOM): this is the one piece of the preview feature with a clean input and
 * output, which is what makes it the piece worth unit-testing directly
 * (`linkPreviewHref.test.ts`) rather than only exercising it indirectly
 * through a mounted component and a mocked corpus.
 *
 * WHY REGEXES OVER `refHref`'s OWN LOGIC: this module does not reconstruct
 * how a link was built, only reads what one already says. Every internal
 * content href on the site is generated in exactly one place (`refs.ts`'s
 * `refHref`, plus a handful of direct template literals in route
 * components — the book/chapter picker, prev/next chapter nav — that all
 * emit the identical `/bible/{osis}/{chapter}` shape with no query/hash).
 * `refHref` already canonicalizes chapter/verse numbers to this corpus's
 * Vulgate address space before the href is ever written to the DOM (see its
 * own docblock on `resolveVulgate`) — so a link's `chapter`/`verse` numbers
 * ARE the Vulgate numbers already. Parsing them back out and feeding them a
 * second time through `versification.ts` would risk double-converting a
 * chapter that only needed shifting once. Nothing in this module imports
 * `versification.ts` for exactly that reason.
 */

export type PreviewTarget =
	| {
			kind: 'bible';
			osis: string;
			chapter: number;
			/** Set together, from a `?v=from-to` span or a lone `#v{n}` anchor
			 *  (from === to). Absent entirely for a bare chapter link, which
			 *  previews the chapter's opening rather than a cited passage. */
			from?: number;
			to?: number;
	  }
	| { kind: 'ccc'; n: number }
	| { kind: 'cccChapter'; n: number }
	| { kind: 'compendium'; n: number }
	| { kind: 'document'; slug: string; n: number };

// A fixed, obviously-fake origin: `URL`'s relative-reference constructor
// needs *some* absolute base to resolve against, and its value is never
// read below except to detect that an href resolved to a DIFFERENT origin
// (i.e. was itself absolute, and thus external — `https://vatican.va/...`
// parses fine against this base but keeps its own origin, which is exactly
// the signal used to reject it two lines down).
const INTERNAL_BASE = 'https://glossa.internal.invalid';

const BIBLE_RE = /^\/bible\/([a-z0-9]+)\/(\d+)$/;
const CCC_CHAPTER_RE = /^\/ccc\/chapter\/(\d+)$/;
const CCC_RE = /^\/ccc\/(\d+)$/;
const COMPENDIUM_RE = /^\/compendium\/(\d+)$/;
// A document is ONE page and a section is a fragment on it (`/documents/
// {slug}#s{n}`) — `documents/[slug]/[n]` was retired 2026-08-17, see
// docs/decisions.md. So unlike the CCC/Compendium shapes above, the section
// number is not in the path: matching the path alone means "this document",
// which is a whole encyclical rather than a previewable unit, and only the
// `#s{n}` anchor names something small enough to show in a popover.
const DOCUMENT_RE = /^\/documents\/([a-z0-9-]+)$/;
const VERSE_SPAN_RE = /^(\d+)-(\d+)$/;
const VERSE_ANCHOR_RE = /^#v(\d+)$/;
const SECTION_ANCHOR_RE = /^#s(\d+)$/;

/**
 * Parse an anchor's `href` attribute into a preview target, or `undefined`
 * for anything that isn't one of the five content-link shapes this feature
 * covers (nav chrome, external links, an unanchored `/documents/{slug}`,
 * ...) — see the module docblock and each kind's route in `+layout.svelte`'s
 * caller.
 *
 * Tolerant, not strict: an href this site never actually generates (a
 * negative chapter, a malformed query) degrades to "no preview" rather than
 * throwing — the same "under-link rather than guess" posture `refs.ts` and
 * the Bible chapter route's own `citedRange` parsing already take for
 * exactly the same reason (a reader's hand-edited URL, or a future bug
 * upstream, should never crash this purely-supplementary layer).
 */
export function parsePreviewHref(href: string | null | undefined): PreviewTarget | undefined {
	if (!href) return undefined;

	let url: URL;
	try {
		url = new URL(href, INTERNAL_BASE);
	} catch {
		return undefined;
	}
	if (url.origin !== INTERNAL_BASE) return undefined; // absolute -> external, or a scheme we don't preview (mailto:, ...)

	const path = url.pathname;

	const bible = BIBLE_RE.exec(path);
	if (bible) {
		const osis = bible[1];
		const chapter = Number(bible[2]);

		// `?v=` names the WHOLE cited extent (refHref: "carries its whole
		// extent, not just its first verse") and takes priority over the
		// anchor, which only ever names the extent's first verse.
		const span = VERSE_SPAN_RE.exec(url.searchParams.get('v') ?? '');
		if (span) {
			const from = Number(span[1]);
			const to = Number(span[2]);
			if (to > from) return { kind: 'bible', osis, chapter, from, to };
		}

		const anchor = VERSE_ANCHOR_RE.exec(url.hash);
		if (anchor) {
			const v = Number(anchor[1]);
			return { kind: 'bible', osis, chapter, from: v, to: v };
		}

		return { kind: 'bible', osis, chapter };
	}

	const cccChapter = CCC_CHAPTER_RE.exec(path);
	if (cccChapter) return { kind: 'cccChapter', n: Number(cccChapter[1]) };

	const ccc = CCC_RE.exec(path);
	if (ccc) return { kind: 'ccc', n: Number(ccc[1]) };

	const compendium = COMPENDIUM_RE.exec(path);
	if (compendium) return { kind: 'compendium', n: Number(compendium[1]) };

	const document = DOCUMENT_RE.exec(path);
	if (document) {
		const anchor = SECTION_ANCHOR_RE.exec(url.hash);
		// No anchor means the document as a whole — a link to the top of an
		// entire encyclical, which is navigation rather than a quotable unit.
		if (anchor) return { kind: 'document', slug: document[1], n: Number(anchor[1]) };
	}

	return undefined;
}
