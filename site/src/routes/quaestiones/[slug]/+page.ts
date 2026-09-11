import { error } from '@sveltejs/kit';
import {
	canonLawLangs,
	canonLawWorkId,
	cccLangs,
	getCanonLawRangeAsync,
	getCccParagraphRangeAsync,
	getDocumentGroup,
	getSocialDoctrineRangeAsync,
	getWork,
	loadQuaestiones,
	socialDoctrineLangs,
	socialDoctrineWorkId,
	type DocumentGroup
} from '$lib/corpus';
import type { CccParagraph, DocumentSection, Topic, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * One topic's paragraphs in ONE language, embedded per language exactly as
 * `/catechismus/caput/[n]` embeds a chapter's.
 *
 * THE PAGE CANNOT PICK THE LANGUAGE HERE. Content language is a client-side
 * preference (`$lib/content.svelte.ts`) and this route renders only in the
 * browser (`ssr = false`), but `load` re-runs on navigation and not when a
 * stored preference changes — so a language resolved in here would be the
 * reader's language at the moment they arrived and would then stop following
 * them. This route shipped with `'en'` written into the fetch, which is the
 * same defect with the fallback nailed shut.
 *
 * THE COST IS THE ONE THE CHAPTER ROUTE ALREADY PAYS, and less: a chapter can
 * run to ninety paragraphs in each of the Catechism's languages, and the
 * longest topic here is twenty-two.
 */
interface TopicLangData {
	/** In the order the page renders them: `lead` first where the topic names
	 *  one, then the spans in the file's own order. Resolved per language
	 *  because the lead has to be found among THAT language's paragraphs. */
	paragraphs: CccParagraph[];
	/** The Catechism's own IN BRIEF paragraphs for this question, in the
	 *  topic's order. Empty on every topic that names none, and short of an
	 *  entry in an edition that lacks it — the block degrades rather than
	 *  failing, since a summary is not the page's answer. */
	brief: CccParagraph[];
	/** The paragraph actually moved to the front, or `undefined` where the
	 *  topic named none. Drives the page's disclosure that it has reordered. */
	lead: number | undefined;
	work: WorkManifest;
}

/**
 * The Compendium's sections, or the Code's canons, in one language.
 *
 * ONE SHAPE FOR BOTH, because the two works are the same shape: numbered
 * units of a `DocumentSection` addressed one at a time, differing only in
 * which id resolves them (`corpus.ts`, "THE SAME ARRANGEMENT AS THE BLOCK
 * ABOVE"). No `lead` — `Topic.lead` reorders the Catechism alone, and
 * `site/quaestiones.json` says why.
 *
 * THE LANGUAGE SETS ARE NOT THE SAME as the Catechism's and not the same as
 * each other: nine editions of the CCC, ten of the Compendium, seven of the
 * Code. So each block carries its own `byLang` and the page resolves each
 * against its own reader preference, rather than one language being picked
 * for a page that would then have to hide two thirds of itself.
 */
interface TopicSectionsData {
	sections: DocumentSection[];
	work: WorkManifest;
}

/** Spans in the file's own order, kept that way. `get…RangeAsync` sorts
 *  within a span, which is the reading order of a run of numbered units;
 *  nothing sorts ACROSS spans, for the reason `Topic.ccc` gives. */
async function resolveSpans(
	spans: [number, number][],
	range: (from: number, to: number) => Promise<DocumentSection[]>
): Promise<DocumentSection[]> {
	const runs = await Promise.all(spans.map(([from, to]) => range(from, to)));
	return runs.flat();
}

/**
 * ONE TOPIC, RESOLVED TO THE NUMBERED UNITS IT NAMES.
 *
 * Three works, each fetched by span and each in every language the corpus has
 * it in: the Catechism, the Compendium of the Social Doctrine where the topic
 * names sections of it, the Code where it names canons. Documents are not
 * fetched — a whole encyclical is not quotable at a topic's length, so they
 * resolve to their groups and the page lists them.
 *
 * There is no passage list to load, and that is the design rather than an
 * omission (`site/quaestiones.json` argues it): the Scripture a topic wants is
 * already in the footnotes of the units it anchors, and `ProseBlocks`
 * linkifies those wherever a unit is rendered. So this load fetches spans and
 * lets the apparatus do the rest — the same apparatus `/catechismus/{n}`,
 * `/doctrina-socialis/{n}` and `/ius-canonicum/{n}` use, on the same data,
 * which is why a topic page cannot drift out of agreement with the pages it
 * points at.
 */
export const load: PageLoad = async ({ params, parent }) => {
	// Runs CONCURRENTLY with the layout that primes this route's indexes
	// unless it waits — `src/routes/+layout.ts` has the whole of why.
	await parent();

	const index = await loadQuaestiones();
	const topic: Topic | undefined = index?.topics[params.slug];
	// A build with no topic index at all (the fixtures, a partial sync) and a
	// build whose index does not hold this slug are the same 404 to a reader.
	// The edge already refuses an address `route-manifest.ts` does not list, so
	// reaching here with an unknown slug means the two disagree, which is worth
	// failing on rather than rendering an empty page.
	if (!topic) error(404, 'Not found');

	const byLang: Partial<Record<string, TopicLangData>> = {};
	for (const lang of cccLangs()) {
		const work = getWork(`ccc.${lang}`);
		if (!work) continue;

		// Paragraphs are fetched span by span and kept in the file's own order,
		// which is not always ascending — see `Topic.ccc`. Flattening and
		// re-sorting would silently undo an editorial ordering, so nothing here
		// sorts.
		const spans = await Promise.all(
			topic.ccc.map(([from, to]) => getCccParagraphRangeAsync(lang, from, to))
		);
		const inFileOrder = spans.flat();
		// A language whose edition is short this topic's paragraphs is skipped
		// rather than listed with holes: the reader gets a language that can
		// actually answer, which is the same call the chapter route makes.
		if (inFileOrder.length === 0) continue;

		// `lead` moves one paragraph to the front and removes nothing. The find
		// is by paragraph number rather than by index because the spans it may
		// be drawn from are several — sync-corpus.mjs has already refused a
		// `lead` outside them, so a miss here means this language's edition
		// lacks that paragraph, and it degrades to printed order rather than
		// dropping the page.
		const led = topic.lead !== undefined ? inFileOrder.find((p) => p.n === topic.lead) : undefined;

		// Fetched ONE AT A TIME because a brief is a handful of scattered
		// numbers rather than a run — an article's summary is not adjacent to
		// the span the topic took out of that article, and the five on
		// `beata-virgo` sit in three different parts of the work. Kept in the
		// file's order, which is the answer's order and not the Catechism's.
		const brief = (
			await Promise.all((topic.brief ?? []).map((n) => getCccParagraphRangeAsync(lang, n, n)))
		).flat();

		byLang[lang] = {
			paragraphs: led ? [led, ...inFileOrder.filter((p) => p.n !== led.n)] : inFileOrder,
			brief,
			lead: led?.n,
			work
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No edition of the Catechism in this corpus has this topic’s paragraphs');
	}

	// Documents are named by slug and resolved to their groups here so the page
	// can title each in the corpus's own words rather than restating a title in
	// the interface — the rule `/schola` states for every work it names. Which
	// EDITION's title is the page's decision, not this one's: it follows the
	// reader's document language and so has to be reactive. A slug the corpus
	// has lost is skipped, not rendered as a dead link; the sync refuses that
	// state, so this is the fixtures' case.
	const documents = (topic.documents ?? [])
		.map((slug) => getDocumentGroup(slug))
		.filter((group): group is DocumentGroup => group !== undefined);

	// A language whose edition is short every one of this topic's sections is
	// skipped, as above; a language short SOME of them keeps the rest, which
	// is the opposite call and the right one here. The Catechism block is the
	// page's answer and has to be whole or absent; these two are the developed
	// teaching and the law under it, where a reader with nine sections of ten
	// is better served than one sent to another language.
	const socialDoctrineByLang: Partial<Record<string, TopicSectionsData>> = {};
	for (const lang of topic.csdc?.length ? socialDoctrineLangs() : []) {
		const work = getWork(socialDoctrineWorkId(lang));
		if (!work) continue;
		const sections = await resolveSpans(topic.csdc ?? [], (from, to) =>
			getSocialDoctrineRangeAsync(lang, from, to)
		);
		if (sections.length === 0) continue;
		socialDoctrineByLang[lang] = { sections, work };
	}

	const canonsByLang: Partial<Record<string, TopicSectionsData>> = {};
	for (const lang of topic.canons?.length ? canonLawLangs() : []) {
		const work = getWork(canonLawWorkId(lang));
		if (!work) continue;
		const sections = await resolveSpans(topic.canons ?? [], (from, to) =>
			getCanonLawRangeAsync(lang, from, to)
		);
		if (sections.length === 0) continue;
		canonsByLang[lang] = { sections, work };
	}

	return { slug: params.slug, topic, byLang, socialDoctrineByLang, canonsByLang, documents };
};
