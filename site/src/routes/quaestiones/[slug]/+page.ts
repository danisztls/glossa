import { error } from '@sveltejs/kit';
import {
	getCccParagraphRangeAsync,
	getDocumentGroup,
	loadQuaestiones,
	type DocumentGroup
} from '$lib/corpus';
import type { CccParagraph, Topic } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * ONE TOPIC, RESOLVED TO PARAGRAPHS AND NOTHING MORE.
 *
 * There is no passage list to load, and that is the design rather than an
 * omission (`site/quaestiones.json` argues it): the Scripture a topic wants is
 * already in the footnotes of the Catechism paragraphs it anchors, and
 * `ProseBlocks` linkifies those wherever a unit is rendered. So this load
 * fetches spans of the CCC and lets the apparatus do the rest — the same
 * apparatus `/catechismus/{n}` uses, on the same data, which is why a topic
 * page cannot drift out of agreement with the paragraph pages it points at.
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

	// Paragraphs are fetched span by span and kept in the file's own order,
	// which is not always ascending — see `Topic.ccc`. Flattening and re-sorting
	// would silently undo an editorial ordering, so nothing here sorts.
	const spans = await Promise.all(
		topic.ccc.map(([from, to]) => getCccParagraphRangeAsync('en', from, to))
	);
	const inFileOrder = spans.flat();

	// `lead` moves one paragraph to the front and removes nothing. The find is
	// by paragraph number rather than by index because the spans it may be
	// drawn from are several — sync-corpus.mjs has already refused a `lead`
	// outside them, so a miss here would be a bug in this function, not in the
	// data, and it degrades to printed order rather than dropping the page.
	const led = topic.lead !== undefined ? inFileOrder.find((p) => p.n === topic.lead) : undefined;
	const paragraphs: CccParagraph[] = led
		? [led, ...inFileOrder.filter((p) => p.n !== led.n)]
		: inFileOrder;

	// Documents are named by slug and resolved to their groups here so the page
	// can title each in the corpus's own words rather than restating a title in
	// the interface — the rule `/schola` states for every work it names. A slug
	// the corpus has lost is skipped, not rendered as a dead link; the sync
	// refuses that state, so this is the fixtures' case.
	const documents = (topic.documents ?? [])
		.map((slug) => getDocumentGroup(slug))
		.filter((group): group is DocumentGroup => group !== undefined);

	return { slug: params.slug, topic, paragraphs, documents, lead: led?.n };
};
