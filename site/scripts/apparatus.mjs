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
		source: manifest?.sources?.[0]?.url ?? null,
		rights: manifest?.copyright?.status ?? null
	};
}

/** Work ids of one manifest type. */
function idsOfType(manifests, type) {
	return Object.keys(manifests).filter((id) => manifests[id].type === type);
}

/**
 * Every work type a manifest may carry, and what the two files publish for it:
 * the imprint key, the name that key is published under, and the address space
 * the work occupies.
 *
 * ONE TABLE BECAUSE THERE WERE TWO, and a work absent from both passed both.
 * The Code of Canon Law and the Compendium of the Social Doctrine were routed,
 * titled and served while `works.json` named no address under `/ius-canonicum`
 * or `/doctrina-socialis` and `shell-head.ts` asked for a `canonLaw` imprint
 * this file had never been given — a breadcrumb and no publisher, on every one
 * of those addresses. `assertApparatus` reads the types the CORPUS holds and
 * demands each be here.
 *
 * `key` IS WHAT `WORK_OF` IN `shell-head.ts` ASKS FOR, spelled the same. It is
 * the site's name for the work and not the manifest's type string, because the
 * edge addresses a work by what it is called there (`ccc`, not `catechism`).
 */
const WORK_KINDS = {
	bible: { key: 'bible', name: 'Sacred Scripture', address: '/scriptura/{book}/{chapter}' },
	catechism: {
		key: 'ccc',
		name: 'Catechism of the Catholic Church',
		address: '/catechismus/{n}'
	},
	compendium: {
		key: 'compendium',
		name: 'Compendium of the Catechism of the Catholic Church',
		address: '/catechismus/compendium/{n}'
	},
	'canon-law': { key: 'canonLaw', name: 'Code of Canon Law', address: '/ius-canonicum/{n}' },
	'social-doctrine': {
		key: 'socialDoctrine',
		// The name the edge already prints on every one of these pages
		// (`SOCIAL_DOCTRINE` in `shell-head.ts`), not the manifest title: a work
		// called one thing in the breadcrumb and another in the structured data
		// is two works to a parser.
		name: 'Compendium of the Social Doctrine',
		address: '/doctrina-socialis/{n}'
	},
	summa: {
		key: 'summa',
		name: 'Summa Theologiae',
		address: '/doctores/summa/{part}/{question}'
	},
	prayer: { key: 'prayer', name: 'Common Prayers', address: '/preces/{slug}' },
	commentary: {
		// Its own imprint, not the annotated edition's, though the two are read
		// at one address. A commentary is a separate work with a separate author
		// and a separate rights position — Haydock died in 1849 and Challoner in
		// 1781 — and folding it into the Bible's imprint would credit the
		// translation for words it does not contain.
		key: 'commentary',
		name: 'Commentary',
		// THE ADDRESS OF THE WORK IT ANNOTATES, because a commentary has none of
		// its own (docs/corpus-schema.md §Commentary). That is not a gap in this
		// table: `works.json` exists so a machine can read what is here without
		// crawling ~6,000 pages, and the true answer to "where do I find
		// Haydock" is "at the verse he comments on". A reader following this
		// address gets the verse and, having asked for the apparatus, the note
		// beside it.
		address: '/scriptura/{book}/{chapter}'
	},
	document: {
		// The collection, not a work: each document carries its own source URL in
		// `imprint`, which is finer and is what a citation wants. The publisher is
		// read off a served edition all the same, so a change at the source
		// reaches this table on the next sync.
		key: 'document',
		name: 'Documents of the Magisterium',
		address: '/documenta/{slug}',
		collection: true
	},
	// An introduction is chapter 0 of its book, so it has no address and no
	// imprint of its own: a crawler asking who published it is asking about the
	// Bible edition the chapter belongs to, and `WORK_OF` answers `bible`.
	'bible-intro': { servedWith: 'bible' }
};

/** Work type -> the imprint of the edition a crawler is served, for every type
 *  that has an imprint of its own. */
function imprintTable(manifests) {
	/** @type {Record<string, any>} */
	const works = {};
	for (const [type, kind] of Object.entries(WORK_KINDS)) {
		if (kind.servedWith) continue;
		works[kind.key] = {
			...imprintOf(manifests, idsOfType(manifests, type), kind.name),
			// A collection's own source URL would be an index page, and the
			// per-document one above is the URL to cite.
			...(kind.collection ? { source: null } : {})
		};
	}
	return works;
}

/**
 * @param {{
 *   manifests: Record<string, any>,
 *   descriptions: Record<string, Record<string, { text: string, origin: string }>>,
 *   scriptureCitations: { citer: { kind: string, n?: number, slug?: string }, refs: { osis: string, chapter: number }[] }[],
 *   cccCompendium: Record<string, [number, number][]>,
 *   cccCitations: { ccc: number, cited_by: { kind: string, slug?: string }[] }[]
 * }} input
 */
export function buildApparatus({
	manifests,
	descriptions,
	scriptureCitations,
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
	/** @type {Record<string, { bible?: string[] }>} */
	const docs = {};
	// THE CATECHISM AND THE DOCUMENTS ALONE, out of the eight kinds the
	// scripture index now holds. This table is served to a crawler that
	// renders nothing, and every address in it has to be one the edge can
	// NAME from `route-titles.json`: a Haydock note and a Bible edition's own
	// note are addressed as the verse they hang on, which the Bible half of
	// this table already covers, and the rest would need a name apiece for a
	// budget (`PER_KIND`) that is already full. What a machine reading this
	// gets is unchanged; what moved is only where the two kinds are read from.
	for (const { citer, refs } of scriptureCitations) {
		for (const ref of refs ?? []) {
			if (citer.kind === 'ccc' && citer.n !== undefined) {
				push(bible, chapterKey(ref), 'ccc', citer.n);
				push(ccc, String(citer.n), 'bible', chapterKey(ref));
			} else if (citer.kind === 'document' && citer.slug) {
				push(bible, chapterKey(ref), 'docs', citer.slug);
				push(docs, citer.slug, 'bible', chapterKey(ref));
			}
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
		works: imprintTable(manifests),
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

	// THE ADDRESSES ARE `WORK_KINDS`, not a list beside it. A collection is
	// enumerated per document by the loop below rather than per edition, and a
	// type served inside another work's address space has no entry of its own.
	for (const [type, kind] of Object.entries(WORK_KINDS)) {
		if (kind.servedWith || kind.collection) continue;
		for (const id of idsOfType(manifests, type).sort()) {
			const manifest = manifests[id];
			works.push({
				id,
				kind: type,
				title: manifest.title || id,
				address: kind.address,
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
export function assertApparatus(apparatus, works, manifests) {
	const problems = [];
	if (!Object.keys(apparatus.bible).length) problems.push('no Bible chapter has a citer');
	if (!Object.keys(apparatus.ccc).length) problems.push('no Catechism paragraph has an apparatus');
	if (!Object.keys(apparatus.descriptions).length) problems.push('no document has a description');
	if (!Object.keys(apparatus.docs).length) problems.push('no document cites Scripture');

	// THE EXPECTED KINDS ARE THE CORPUS'S OWN, which is the difference between
	// this check and the one it replaces. Iterating `apparatus.works` asks
	// whether every kind the table HAS is filled in, and a work type the table
	// never heard of passes that question by not being asked it — which is how
	// every edition of the Code and of the Compendium of the Social Doctrine was
	// routed, titled and served with no publisher and no address in
	// `works.json`.
	const addresses = works.works.map((work) => work.address);
	for (const type of new Set(Object.values(manifests).map((manifest) => manifest.type))) {
		const kind = WORK_KINDS[type];
		if (!kind) {
			problems.push(`${type}: a work type with no imprint kind and no address (see WORK_KINDS)`);
			continue;
		}
		if (kind.servedWith) continue;
		if (!apparatus.works[kind.key]) problems.push(`${type}: no imprint under \`${kind.key}\``);
		// The literal head of the address, since a collection's entries carry a
		// slug where the table carries `{slug}`.
		const prefix = kind.address.split('{')[0];
		if (!addresses.some((address) => address.startsWith(prefix)))
			problems.push(`${type}: nothing at ${kind.address} in works.json`);
	}

	for (const [kind, imprint] of Object.entries(apparatus.works)) {
		// A public-domain kind has no publisher and no notice BY DEFINITION,
		// which this check could not distinguish from a kind whose imprint was
		// never wired up. `rights` is what tells them apart.
		if (!imprint.publisher && !imprint.notice && !imprint.rights)
			problems.push(`${kind}: no rights position at all`);
	}
	if (!works.works.length) problems.push('works.json lists nothing');
	if (problems.length) {
		throw new Error(`[apparatus] refusing to write:\n  - ${problems.join('\n  - ')}`);
	}
}
