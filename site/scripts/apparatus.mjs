/**
 * The two generated files that carry what this project wrote, rather than what
 * it reproduces.
 *
 * `static/apparatus.json` is read by the edge worker: the editorial
 * description of each magisterial document, the imprint needed for the
 * structured data, and the cross-reference apparatus reduced to bare addresses.
 * `static/works.json` is read by nobody here — it is published for the machines
 * that come asking, and `llms.txt` points at it.
 *
 * WHAT MAY GO IN EITHER IS THE SAME RULE `route-titles.mjs` STATES, one step
 * further out. A name, an address, a date, a rights holder and a source URL are
 * the imprint of a work. A description is prose written HERE by reading a
 * document, so it is ours to publish. A Catechism paragraph, a Compendium
 * answer or a verse belongs to its publisher and stays out of both files,
 * whatever it would do for a snippet.
 *
 * Both are derived from the SAME manifests, indexes and `descriptions.json`
 * that `sync-corpus.mjs` has already built by the time it calls this, so
 * neither can describe a corpus the build did not produce.
 */

import { PER_KIND } from '../src/lib/apparatus.ts';
import { documentSlugIds, servedEdition, servedLang } from './route-titles.mjs';

/** Bumped when the shape changes; `apparatus.ts` declares the reader's copy. */
export const APPARATUS_VERSION = 1;

/**
 * Add `value` to `object[key][field]`, once, in first-seen order.
 *
 * Capped at `PER_KIND` — IMPORTED, not restated. This file held its own `8`
 * against `apparatus.ts`'s `4` for exactly as long as both existed, so half of
 * every list here was shipped to the edge, parsed there, and never rendered.
 * Genesis 1 is cited by ninety-odd paragraphs; the page needs a path onward,
 * not the index, and the table needs to hold what the page will actually use.
 */
function push(object, key, field, value) {
	const entry = (object[key] ??= {});
	const list = (entry[field] ??= []);
	if (list.length < PER_KIND && !list.includes(value)) list.push(value);
}

/** `{osis}.{chapter}` — the key `apparatus.ts` splits on its LAST dot, so the
 *  OSIS id may contain one and the chapter may not. */
function chapterKey(ref) {
	return `${ref.osis}.${ref.chapter}`;
}

/**
 * The imprint of the edition a crawler is served for one work kind.
 *
 * `null` for a field the manifest leaves empty — a public-domain work has no
 * rights holder, and writing one in would be inventing a claim about property.
 */
function imprintOf(manifests, ids, name) {
	const id = ids.length ? servedEdition(manifests, ids) : undefined;
	const manifest = id ? manifests[id] : undefined;
	return {
		name,
		publisher: manifest?.copyright?.holder ?? null,
		notice: manifest?.copyright?.notice ?? null,
		source: manifest?.sources?.[0]?.url ?? null
	};
}

/** Work ids of one manifest type. */
function idsOfType(manifests, type) {
	return Object.keys(manifests).filter((id) => manifests[id].type === type);
}

/**
 * @param {{
 *   manifests: Record<string, any>,
 *   descriptions: Record<string, Record<string, { text: string, origin: string }>>,
 *   xrefs: { ccc: number, refs: { osis: string, chapter: number }[] }[],
 *   documentXrefs: { work: string, n: number, refs: { osis: string, chapter: number }[] }[],
 *   cccCompendium: Record<string, [number, number][]>,
 *   cccCitations: { ccc: number, cited_by: { kind: string, slug?: string }[] }[]
 * }} input
 */
export function buildApparatus({
	manifests,
	descriptions,
	xrefs,
	documentXrefs,
	cccCompendium,
	cccCitations
}) {
	/** @type {Record<string, { ccc?: number[], docs?: string[] }>} */
	const bible = {};
	/** @type {Record<string, { bible?: string[], docs?: string[], comp?: number[] }>} */
	const ccc = {};

	// Both directions from one pass: a Catechism paragraph names the chapter it
	// cites, and that chapter names the paragraph back. The reverse direction is
	// the one no other index in the corpus holds, and it is the whole reason a
	// Bible chapter has anything to link to at all.
	for (const entry of xrefs) {
		for (const ref of entry.refs ?? []) {
			push(bible, chapterKey(ref), 'ccc', entry.ccc);
			push(ccc, String(entry.ccc), 'bible', chapterKey(ref));
		}
	}
	/** @type {Record<string, { bible?: string[] }>} */
	const docs = {};
	for (const entry of documentXrefs) {
		for (const ref of entry.refs ?? []) {
			push(bible, chapterKey(ref), 'docs', entry.work);
			push(docs, entry.work, 'bible', chapterKey(ref));
		}
	}
	for (const entry of cccCitations) {
		for (const citer of entry.cited_by ?? []) {
			if (citer.slug) push(ccc, String(entry.ccc), 'docs', citer.slug);
		}
	}
	/** @type {Record<string, [number, number][]>} */
	const compendium = {};
	for (const [question, spans] of Object.entries(cccCompendium)) {
		compendium[question] = spans;
		// Only the first paragraph of each span is linked back: a question
		// condensing 1-25 would otherwise fill the cap on one span, and the
		// reader of a paragraph wants the question, not twenty-five of them.
		for (const [from] of spans) push(ccc, String(from), 'comp', Number(question));
	}

	/** @type {Record<string, string>} */
	const documentDescriptions = {};
	/** @type {Record<string, [string, string, string]>} */
	const imprint = {};
	for (const [slug, ids] of documentSlugIds(manifests)) {
		const id = servedEdition(manifests, ids);
		const manifest = manifests[id];
		const described = descriptions[id]?.[manifest.language];
		// Only a description READ from the document, never a translation of one:
		// the page a crawler is served is this edition, and a translated
		// description would describe it in a language its own text is not in.
		if (described?.origin === 'read' && described.text) documentDescriptions[slug] = described.text;
		imprint[slug] = [
			manifest.pontiff_or_council || '',
			manifest.promulgated || '',
			manifest.sources?.[0]?.url || ''
		];
	}

	return {
		version: APPARATUS_VERSION,
		works: {
			bible: imprintOf(manifests, idsOfType(manifests, 'bible'), 'Sacred Scripture'),
			ccc: imprintOf(
				manifests,
				idsOfType(manifests, 'catechism'),
				'Catechism of the Catholic Church'
			),
			compendium: imprintOf(
				manifests,
				idsOfType(manifests, 'compendium'),
				'Compendium of the Catechism of the Catholic Church'
			),
			summa: imprintOf(manifests, idsOfType(manifests, 'summa'), 'Summa Theologiae'),
			prayer: imprintOf(manifests, idsOfType(manifests, 'prayer'), 'Common Prayers'),
			// The collection, not a work: each document carries its own source
			// URL in `imprint` above, which is finer and is what a citation wants.
			// The publisher is read off a served edition all the same, so a change
			// at the source reaches this table on the next sync.
			document: {
				...imprintOf(manifests, idsOfType(manifests, 'document'), 'Documents of the Magisterium'),
				source: null
			}
		},
		descriptions: documentDescriptions,
		imprint,
		bible,
		ccc,
		compendium,
		docs
	};
}

/**
 * `static/works.json` — the imprint of every work, with its address space.
 *
 * Published for a machine that wants to cite this library correctly without
 * crawling ~6,000 addresses to work out what is here. It answers the two
 * questions `llms.txt` puts in prose: what is published, and who to cite for
 * the words.
 *
 * ONE ENTRY PER DOCUMENT, ONE PER EDITION OF EVERYTHING ELSE. A document's
 * editions are translations of one text and share an address, so they are one
 * entry with a language list. The Bible's are not: the Catholic Public Domain
 * Version and the Clementine Vulgate are different works under different
 * rights that happen to share an address space, and flattening them would
 * publish one edition's licence over another's text.
 *
 * NO BUILD TIMESTAMP, for the reason `sitemap.mjs` gives about `lastmod`: a
 * generated file that changes on every deploy whether or not its content did
 * makes every diff unreadable and every claim in it less believable.
 */
export function buildWorks({ manifests, descriptions, origin }) {
	/** @type {any[]} */
	const works = [];

	const ADDRESSES = {
		bible: '/scriptura/{book}/{chapter}',
		catechism: '/catechismus/{n}',
		compendium: '/catechismus/compendium/{n}',
		summa: '/doctores/summa/{part}/{question}',
		prayer: '/preces/{slug}'
	};

	for (const [type, address] of Object.entries(ADDRESSES)) {
		for (const id of idsOfType(manifests, type).sort()) {
			const manifest = manifests[id];
			works.push({
				id,
				kind: type,
				title: manifest.title || id,
				address,
				languages: [manifest.language],
				edition: manifest.edition || null,
				publisher: manifest.copyright?.holder ?? null,
				rights: manifest.copyright?.status ?? null,
				notice: manifest.copyright?.notice ?? null,
				source: manifest.sources?.[0]?.url ?? null
			});
		}
	}

	for (const [slug, ids] of documentSlugIds(manifests)) {
		const id = servedEdition(manifests, ids);
		const manifest = manifests[id];
		const described = descriptions[id]?.[manifest.language];
		works.push({
			id: id.replace(/\.[a-z]{2,3}(-[a-z]{2,3})?$/, ''),
			kind: manifest.document_kind || 'document',
			title: manifest.title || slug,
			address: `/documenta/${slug}`,
			languages: ids.map((each) => manifests[each].language).sort(),
			author: manifest.pontiff_or_council || null,
			promulgated: manifest.promulgated || null,
			publisher: manifest.copyright?.holder ?? null,
			rights: manifest.copyright?.status ?? null,
			notice: manifest.copyright?.notice ?? null,
			source: manifest.sources?.[0]?.url ?? null,
			...(described?.origin === 'read' && described.text ? { description: described.text } : {})
		});
	}

	return { version: APPARATUS_VERSION, site: origin, works };
}

/**
 * Refuse a build whose apparatus is empty where the corpus is not.
 *
 * The same reasoning as `assertNamed`: every failure this catches is invisible
 * to a person looking at the site, because the page renders its own
 * cross-references from the content tier and always has. Only the consumers
 * that never run JavaScript see an empty apparatus, and none of them reports
 * back.
 */
export function assertApparatus(apparatus, works) {
	const problems = [];
	if (!Object.keys(apparatus.bible).length) problems.push('no Bible chapter has a citer');
	if (!Object.keys(apparatus.ccc).length) problems.push('no Catechism paragraph has an apparatus');
	if (!Object.keys(apparatus.descriptions).length) problems.push('no document has a description');
	if (!Object.keys(apparatus.docs).length) problems.push('no document cites Scripture');
	for (const [kind, imprint] of Object.entries(apparatus.works)) {
		if (!imprint.publisher && !imprint.notice) problems.push(`${kind}: no rights position at all`);
	}
	if (!works.works.length) problems.push('works.json lists nothing');
	if (problems.length) {
		throw new Error(`[apparatus] refusing to write:\n  - ${problems.join('\n  - ')}`);
	}
}
