/**
 * Preview-target -> rendered text resolution for `LinkPreview.svelte`.
 *
 * Split out from the component (and from `linkPreviewHref.ts`'s pure
 * parsing) because this half is the opposite of pure: it reads the reader's
 * effective language/edition off the content store, fetches corpus content
 * tier files, and enforces takedown state — none of which belongs in a unit
 * that's supposed to be testable with no mocks at all.
 *
 * COST: every fetch here goes through `corpus.ts`'s existing `readContent`
 * memoization, so hovering the same file's content twice (two paragraphs of
 * the same CCC chunk, two sections of the same document) costs one read.
 * `resolvePreview`'s own cache below is a second, smaller layer on top of
 * that — it memoizes the RESOLVED preview (title + truncated body) by
 * target, so a repeat hover skips even the array `.find()`/truncation work,
 * not just the file read. Measured against the real corpus
 * (2026-08-16): a Bible book or the Compendium's whole-language file top out
 * around 290 KB raw / 85 KB gzipped, a CCC 100-paragraph chunk around
 * 145 KB raw / 30 KB gzipped, and the single largest document
 * (`encyclical.evangelium-vitae.pt`) at 558 KB raw / 113 KB gzipped against
 * a 62 KB raw / ~14 KB gzipped median across all 333 ingested documents.
 * Every one of these is a COARSE, already-established read this module adds
 * no new cost model to — hovering a document link simply asks for the same
 * file `/documents/{slug}/{n}` would fetch on a real navigation, just
 * possibly a little earlier. What keeps that acceptable rather than a
 * mouse-triggered stall is `LinkPreview.svelte`'s hover delay (nothing
 * fetches on a passing cursor) plus this memoization (never fetched twice)
 * plus the fact that a document a reader ends up opening anyway pays this
 * cost exactly once, just moved earlier by however long they hovered first.
 */

import {
	getBook,
	getChapter,
	getCccParagraphAsync,
	getCompendiumQuestionAsync,
	getDocumentManifest,
	getDocumentSectionAsync,
	documentSectionExists,
	isUnpublished,
	listCccChapters
} from './corpus';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';
import { displayTitle } from './titles';
import type { PreviewTarget } from './linkPreviewHref';

export interface ResolvedPreview {
	/** Short heading line: "Genesis 1:1-3", "CCC 1", a CCC chapter's own
	 *  title, "Question 12", "§19". */
	title: string;
	/** Plain-text excerpt, already truncated with a trailing "…" if cut. */
	body: string;
}

/** A preview body is a glance, not a reading view: long enough to judge
 *  whether the link is worth following, short enough that a hover never
 *  turns into a second thing to read. Chosen the same way `RefText.svelte`'s
 *  own quiet styling was -- big enough for two or three sentences of CCC/
 *  document prose, small enough that even a long single Psalm verse doesn't
 *  fill more than the fixed-width overlay allows. */
const MAX_BODY_CHARS = 320;

/** Truncate at a word boundary rather than mid-word -- a preview that ends
 *  "...the natural mora" reads as broken in a way "...the natural..." does
 *  not. Falls back to a hard cut only when the text has no space anywhere
 *  near the limit (a single very long "word", which no real corpus prose
 *  does, but a defect somewhere upstream shouldn't be able to hang this on
 *  an infinite scan either). */
function truncate(text: string, max = MAX_BODY_CHARS): string {
	const collapsed = text.trim().replace(/\s+/g, ' ');
	if (collapsed.length <= max) return collapsed;
	const cut = collapsed.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	const boundary = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
	return boundary.trimEnd() + '…';
}

/**
 * Cache key covering the target AND whichever edition/language currently
 * resolves for it -- NOT just the target's own numbers. Two hovers of the
 * identical `/bible/john/1` href must resolve to different cached text after
 * the reader switches from the English to the Portuguese edition, and
 * folding the resolved workId/lang into the key is what makes that automatic
 * rather than something `resolvePreview` has to remember to invalidate by
 * hand. A stale entry for an edition the reader has switched away from is
 * simply never looked up again -- harmless, not evicted.
 */
function cacheKey(target: PreviewTarget): string | undefined {
	switch (target.kind) {
		case 'bible': {
			const workId = content.workIdFor('bible');
			if (!workId) return undefined;
			return `bible:${workId}:${target.osis}:${target.chapter}:${target.from ?? ''}:${target.to ?? ''}`;
		}
		case 'ccc':
			return `ccc:${content.langFor('catechism')}:${target.n}`;
		case 'cccChapter':
			return `cccChapter:${content.langFor('catechism')}:${target.n}`;
		case 'compendium':
			return `compendium:${content.langFor('compendium')}:${target.n}`;
		case 'document': {
			const workId = content.documentWorkIdFor(target.slug);
			if (!workId) return undefined;
			return `document:${workId}:${target.n}`;
		}
	}
}

async function resolveBible(
	target: Extract<PreviewTarget, { kind: 'bible' }>
): Promise<ResolvedPreview | undefined> {
	const workId = content.workIdFor('bible');
	if (!workId || isUnpublished(workId)) return undefined;

	const book = getBook(workId, target.osis);
	if (!book) return undefined;

	const result = await getChapter(workId, target.osis, target.chapter);
	if (!result) return undefined;
	const verses = result.chapter.verses;

	if (target.from !== undefined && target.to !== undefined) {
		const selected = verses.filter((v) => v.n >= target.from! && v.n <= target.to!);
		// The cited verse(s) don't actually exist in THIS edition at this
		// address -- the same "real chapter, wrong/absent verse" gap the Bible
		// chapter route's own `cccCitationRows` degrades on (CLAUDE.md's
		// versification note): showing nothing is honest, a made-up excerpt is
		// not.
		if (selected.length === 0) return undefined;
		const title =
			target.from === target.to
				? `${book.name} ${target.chapter}:${target.from}`
				: `${book.name} ${target.chapter}:${target.from}-${target.to}`;
		return { title, body: truncate(selected.map((v) => `${v.n} ${v.text}`).join(' ')) };
	}

	// No verse named: the chapter's own opening, not its full text -- a
	// preview, not a second reading pane.
	const opening = verses.slice(0, 3);
	return {
		title: `${book.name} ${target.chapter}`,
		body: truncate(opening.map((v) => `${v.n} ${v.text}`).join(' '))
	};
}

async function resolveCcc(n: number): Promise<ResolvedPreview | undefined> {
	const lang = content.langFor('catechism');
	if (isUnpublished(`ccc.${lang}`)) return undefined;
	const para = await getCccParagraphAsync(lang, n);
	if (!para) return undefined;
	// `.text` is CccParagraph's own already-derived plain rendering (blocks
	// joined, `⟦marker⟧` footnote tokens stripped, whitespace normalized) --
	// exactly what a plain-text preview needs and precisely what
	// `CccParagraphText.svelte` does NOT use, since that component exists to
	// render the marked-up version footnotes and inline links depend on. A
	// hover preview has no business hosting either.
	return { title: `CCC ${n}`, body: truncate(para.text) };
}

async function resolveCccChapter(n: number): Promise<ResolvedPreview | undefined> {
	const lang = content.langFor('catechism');
	if (isUnpublished(`ccc.${lang}`)) return undefined;

	// `/ccc/chapter/{n}` addresses a chapter by its FIRST paragraph number
	// (corpus.ts's `listCccChapters` docblock) -- there is no direct
	// "chapter node by first paragraph" lookup, so this is the same
	// linear scan that route's own `+page.ts` already does to resolve the
	// URL, on a list that's index-backed (sync, no fetch) and capped at the
	// CCC's own chapter count (a few dozen nodes).
	const node = listCccChapters(lang).find((c) => c.paragraphs[0] === n);
	if (!node) return undefined;

	const dt = displayTitle(node, lang);
	const title = dt.ordinal ? `${dt.ordinal} ${dt.title}` : dt.title;

	// The chapter's OPENING, not its full text (task: "preview its heading
	// and opening, not all of it") -- one paragraph fetch, not the whole
	// range `getCccParagraphRangeAsync` would pull for the real reading view.
	const para = await getCccParagraphAsync(lang, n);
	return { title, body: para ? truncate(para.text) : '' };
}

async function resolveCompendium(n: number): Promise<ResolvedPreview | undefined> {
	const lang = content.langFor('compendium');
	if (isUnpublished(`compendium.${lang}`)) return undefined;
	const question = await getCompendiumQuestionAsync(lang, n);
	if (!question) return undefined;
	const answer = question.answer_blocks.map((b) => b.text).join(' ');
	return {
		title: `${i18n.t('compendium.question')} ${n}`,
		body: truncate(`${question.question} ${answer}`)
	};
}

async function resolveDocument(
	target: Extract<PreviewTarget, { kind: 'document' }>
): Promise<ResolvedPreview | undefined> {
	// `content.documentWorkIdFor` already applies the same "reader's language,
	// falling back to whichever edition exists" rule the document's own
	// landing/reading routes use -- a preview that resolved language
	// differently from the page a click would actually land on would be
	// actively misleading, not just inconsistent.
	const workId = content.documentWorkIdFor(target.slug);
	if (!workId || isUnpublished(workId)) return undefined;
	if (!documentSectionExists(workId, target.n)) return undefined;

	const section = await getDocumentSectionAsync(workId, target.n);
	if (!section) return undefined;

	const manifest = getDocumentManifest(workId);
	const title = manifest ? `${manifest.short_title} §${target.n}` : `§${target.n}`;
	return { title, body: truncate(section.text) };
}

async function resolveUncached(target: PreviewTarget): Promise<ResolvedPreview | undefined> {
	switch (target.kind) {
		case 'bible':
			return resolveBible(target);
		case 'ccc':
			return resolveCcc(target.n);
		case 'cccChapter':
			return resolveCccChapter(target.n);
		case 'compendium':
			return resolveCompendium(target.n);
		case 'document':
			return resolveDocument(target);
	}
}

/** target-cache-key -> resolved preview (or the resolution that found
 *  nothing to show) -- see the module docblock and `cacheKey`'s own. Module-
 *  level and never evicted: the whole corpus this draws from is immutable
 *  once published (same premise `corpus.ts`'s own `contentCache` rests on),
 *  so a cached preview never goes stale except by the reader changing
 *  edition/language, which `cacheKey` already accounts for by encoding it. */
const previewCache = new Map<string, Promise<ResolvedPreview | undefined>>();

/**
 * Resolve a parsed preview target to the text `LinkPreview.svelte` shows.
 * Returns `undefined` for anything that shouldn't produce a preview at all:
 * a withheld work (`isUnpublished`), a citation that names a verse the
 * edition doesn't have at that address, an edition-free document slug with
 * no edition in the reader's language, or a number outside this corpus.
 * `LinkPreview.svelte` treats `undefined` as "show nothing", never as an
 * error state.
 */
export async function resolvePreview(target: PreviewTarget): Promise<ResolvedPreview | undefined> {
	const key = cacheKey(target);
	if (!key) return undefined;
	let pending = previewCache.get(key);
	if (!pending) {
		pending = resolveUncached(target);
		previewCache.set(key, pending);
	}
	return pending;
}
