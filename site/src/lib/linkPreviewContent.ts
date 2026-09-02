/**
 * Preview-target -> rendered text resolution for `LinkPreview.svelte`.
 *
 * Split out from the component (and from `address.ts`'s pure parsing)
 * because this half is the opposite of pure: it reads the reader's
 * effective language/edition off the content store, fetches corpus content
 * tier files, and skips works switched off — none of which belongs in a unit
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
	documentSectionText,
	documentSectionExists,
	getCompendiumChapterFor,
	getSocialDoctrineParagraphAsync,
	getSummaQuestionAsync,
	isUnpublished,
	listCccChapters,
	socialDoctrineChapterFor,
	socialDoctrineWorkId,
	summaDivisionsText,
	summaWorkIdFor
} from './corpus';
import { summaPartFromSlug, type PreviewTarget } from './address';
import { summaQuestionLabel } from './summa-titles';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';
import { displayTitle } from './titles';

export interface ResolvedUnit {
	/** Short heading line: "Genesis 1:1-3", "CCC 1", a CCC chapter's own
	 *  title, "Question 12", "§19". */
	title: string;
	/** The unit's plain text, NOT truncated. Where a branch below deliberately
	 *  selects an *excerpt* — a chapter's opening verses rather than the whole
	 *  chapter — that selection is part of what the address means here and
	 *  survives; only the character cap belongs to the preview. */
	text: string;
}

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
export function truncate(text: string, max = MAX_BODY_CHARS): string {
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
		case 'compendiumChapter':
			return `compendiumChapter:${content.langFor('compendium')}:${target.n}`;
		case 'socialDoctrine':
			return `socialDoctrine:${content.langFor('social-doctrine')}:${target.n}`;
		case 'socialDoctrineChapter':
			return `socialDoctrineChapter:${content.langFor('social-doctrine')}:${target.n}`;
		case 'document': {
			const workId = content.documentWorkIdFor(target.slug);
			if (!workId) return undefined;
			return `document:${workId}:${target.n}`;
		}
		case 'summa': {
			const part = summaPartFromSlug(target.part);
			if (!part) return undefined;
			// Keyed by the WORK the address resolves to, not by the reader's
			// language: the Summa's edition falls back per address, so a Latin
			// reader's `Suppl` previews come from English while the rest come
			// from Latin, and one key per language would collide those.
			const workId = summaWorkIdFor(content.langFor('summa'), part, target.question);
			if (!workId) return undefined;
			return `summa:${workId}:${part}:${target.question}:${target.article ?? ''}`;
		}
	}
}

async function resolveBible(
	target: Extract<PreviewTarget, { kind: 'bible' }>
): Promise<ResolvedUnit | undefined> {
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
		return { title, text: selected.map((v) => `${v.n} ${v.text}`).join(' ') };
	}

	// No verse named: the chapter's own opening, not its full text -- a
	// preview, not a second reading pane.
	const opening = verses.slice(0, 3);
	return {
		title: `${book.name} ${target.chapter}`,
		text: opening.map((v) => `${v.n} ${v.text}`).join(' ')
	};
}

async function resolveCcc(n: number): Promise<ResolvedUnit | undefined> {
	const lang = content.langFor('catechism');
	if (isUnpublished(`ccc.${lang}`)) return undefined;
	const para = await getCccParagraphAsync(lang, n);
	if (!para) return undefined;
	// `.text` is CccParagraph's own already-derived plain rendering (blocks
	// joined, `⟦marker⟧` footnote tokens stripped, whitespace normalized) --
	// exactly what a plain-text preview needs and precisely what
	// `ProseBlocks.svelte` does NOT use, since that component exists to
	// render the marked-up version footnotes and inline links depend on. A
	// hover preview has no business hosting either.
	return { title: `CCC ${n}`, text: para.text };
}

async function resolveCccChapter(n: number): Promise<ResolvedUnit | undefined> {
	const lang = content.langFor('catechism');
	if (isUnpublished(`ccc.${lang}`)) return undefined;

	// `/catechismus/caput/{n}` addresses a chapter by its FIRST paragraph number
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
	return { title, text: para ? para.text : '' };
}

async function resolveCompendium(n: number): Promise<ResolvedUnit | undefined> {
	const lang = content.langFor('compendium');
	if (isUnpublished(`compendium.${lang}`)) return undefined;
	const question = await getCompendiumQuestionAsync(lang, n);
	if (!question) return undefined;
	const answer = question.answer_blocks.map((b) => b.text).join(' ');
	return {
		title: `${i18n.t('compendium.question')} ${n}`,
		text: `${question.question} ${answer}`
	};
}

async function resolveCompendiumChapter(n: number): Promise<ResolvedUnit | undefined> {
	const lang = content.langFor('compendium');
	if (isUnpublished(`compendium.${lang}`)) return undefined;
	const chapter = getCompendiumChapterFor(lang, n);
	if (!chapter) return undefined;
	const dt = displayTitle(chapter, lang);
	const question = await getCompendiumQuestionAsync(lang, n);
	return {
		title: dt.ordinal ? `${dt.ordinal} ${dt.title}` : dt.title,
		text: question
			? `${question.question} ${question.answer_blocks.map((block) => block.text).join(' ')}`
			: ''
	};
}

/**
 * One paragraph of the Compendium of the Social Doctrine, or the opening of
 * one of its chapters.
 *
 * A DOCUMENT'S TEXT AT THE CATECHISM'S ADDRESS, which is what this work is
 * throughout: the excerpt comes from `documentSectionText` the way an
 * encyclical section's does, and the citation is the bare number the way
 * `CCC 1` is, because that is what the address names. The chapter branch
 * previews its first paragraph rather than the whole span, the same choice
 * `resolveCccChapter` makes and for the same reason.
 */
async function resolveSocialDoctrine(n: number, chapter: boolean) {
	const lang = content.langFor('social-doctrine');
	if (isUnpublished(socialDoctrineWorkId(lang))) return undefined;
	const span = chapter ? socialDoctrineChapterFor(lang, n) : undefined;
	if (chapter && (!span || span[0] !== n)) return undefined;
	const section = await getSocialDoctrineParagraphAsync(lang, n);
	if (!section) return undefined;
	return { title: `CSDC ${n}`, text: documentSectionText(section) };
}

async function resolveDocument(
	target: Extract<PreviewTarget, { kind: 'document' }>
): Promise<ResolvedUnit | undefined> {
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
	return { title, text: documentSectionText(section) };
}

/**
 * One Summa question, or one article of it.
 *
 * THE WORK CITES ITSELF MORE THAN ANY OTHER IN THE CORPUS -- 5,180 internal
 * cross-references, each one an argument leaning on an argument made
 * elsewhere -- so this is the preview that earns its keep most: following
 * `Q[74], A[2]` in the middle of a reply is exactly the case where a reader
 * wants the text without losing their place.
 *
 * The citation is the scholastic form (`S.Th. II-II, q. 184, a. 3`), matching
 * `bookmarkContent.ts`, and the excerpt is the article's BODY where the
 * citation names one: `co.` is what a cross-reference to an article almost
 * always means, and the objections that precede it are the position being
 * argued against rather than what the article holds. Showing those first
 * would preview the opposite of the point.
 */
async function resolveSummaUnit(
	target: Extract<PreviewTarget, { kind: 'summa' }>
): Promise<ResolvedUnit | undefined> {
	const part = summaPartFromSlug(target.part);
	if (!part) return undefined;
	const workId = summaWorkIdFor(content.langFor('summa'), part, target.question);
	if (!workId || isUnpublished(workId)) return undefined;
	const question = await getSummaQuestionAsync(workId, part, target.question);
	if (!question) return undefined;

	const cite =
		`S.Th. ${part}, q. ${target.question}` +
		(target.article === null ? '' : `, a. ${target.article}`);

	if (target.article !== null) {
		const article = question.articles.find((a) => a.n === target.article);
		if (!article) return undefined;
		const body = article.divisions.filter((d) => d.kind === 'corpus');
		return {
			title: article.title ? `${cite} — ${article.title}` : cite,
			text: summaDivisionsText(body.length > 0 ? body : article.divisions)
		};
	}

	// A question-level citation previews the question's own prologue, which is
	// where this work says what the question is about -- and is the only place
	// the Latin edition says it at all, printing no titles.
	return {
		title: question.title ? `${cite} — ${summaQuestionLabel(question.title)}` : cite,
		text: summaDivisionsText([{ kind: 'preamble', blocks: question.prologue }])
	};
}

async function resolveUncached(target: PreviewTarget): Promise<ResolvedUnit | undefined> {
	switch (target.kind) {
		case 'bible':
			return resolveBible(target);
		case 'ccc':
			return resolveCcc(target.n);
		case 'cccChapter':
			return resolveCccChapter(target.n);
		case 'compendium':
			return resolveCompendium(target.n);
		case 'compendiumChapter':
			return resolveCompendiumChapter(target.n);
		case 'document':
			return resolveDocument(target);
		case 'socialDoctrine':
			return resolveSocialDoctrine(target.n, false);
		case 'socialDoctrineChapter':
			return resolveSocialDoctrine(target.n, true);
		case 'summa':
			return resolveSummaUnit(target);
	}
}

/** target-cache-key -> resolved preview (or the resolution that found
 *  nothing to show) -- see the module docblock and `cacheKey`'s own. Module-
 *  level and never evicted: the whole corpus this draws from is immutable
 *  once published (same premise `corpus.ts`'s own `contentCache` rests on),
 *  so a cached preview never goes stale except by the reader changing
 *  edition/language, which `cacheKey` already accounts for by encoding it. */
const previewCache = new Map<string, Promise<ResolvedUnit | undefined>>();

/**
 * Resolve a parsed target to its full text and citation.
 *
 * Everything `resolvePreview` returns, minus the character cap -- which is
 * the difference between a hover glance and the consumer that needs the real
 * thing: the anchor popover's "copy", where a reader quoting a verse wants
 * the verse and not the verse with a "…" on the end of it.
 *
 * Returns `undefined` for anything that shouldn't resolve at all: a withheld
 * work (`isUnpublished`), a citation that names a verse the edition doesn't
 * have at that address, an edition-free document slug with no edition in the
 * reader's language, or a number outside this corpus.
 */
export async function resolveUnitText(target: PreviewTarget): Promise<ResolvedUnit | undefined> {
	const key = cacheKey(target);
	if (!key) return undefined;
	let pending = previewCache.get(key);
	if (!pending) {
		pending = resolveUncached(target);
		previewCache.set(key, pending);
	}
	return pending;
}

/**
 * Resolve a parsed preview target to the text `LinkPreview.svelte` shows.
 * The same resolution as `resolveUnitText`, capped for a hover overlay.
 * `LinkPreview.svelte` treats `undefined` as "show nothing", never as an
 * error state.
 */
export async function resolvePreview(target: PreviewTarget): Promise<ResolvedPreview | undefined> {
	const unit = await resolveUnitText(target);
	if (!unit) return undefined;
	return { title: unit.title, body: truncate(unit.text) };
}
