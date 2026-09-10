/**
 * Scripture cross-reference index, derived from `corpus/build/` at build time.
 *
 * This used to be `corpus/xrefs/ccc-bible.json`, committed to the repository
 * and produced by `pipeline/build/xrefs.py` — a SECOND implementation of the
 * citation grammar that `src/lib/refs.ts` already implements for rendering.
 * Two parsers over the same strings drift, and they had: `refs.ts`'s own
 * docblock recorded that the two disagreed on ~1.6% of paragraphs and that
 * `refs.ts` was right in every disagreement, a discrepancy that sat in the
 * tree as "tracked follow-up" because fixing it meant fixing it twice.
 *
 * So the file is no longer stored. It is derived here, on every build, by the
 * SAME parser that renders every link on the page — `src/lib/refs-grammar.ts`,
 * which imports nothing and so runs under plain Node (type stripping is
 * native as of Node 22.18/24; `tsconfig.json` already sets
 * `rewriteRelativeImportExtensions`, which is what lets the `.ts` specifiers
 * below resolve in both worlds). One grammar, one set of tests, and an index
 * that cannot drift from the corpus it describes because nothing persists
 * between builds. See site/docs/references.md.
 *
 * Coverage is every edition of a work, not one: the Portuguese Catechism
 * prints Scripture locators inline that the English edition footnotes, and
 * vice versa, and both are the same Catechism citing the same verse. The two
 * editions' references are therefore UNIONED per paragraph — see
 * `mergeRefs` for what that does with `cf` and with duplicate verses.
 *
 * And coverage is every WORK TYPE, which it was not until 2026-09-05: this
 * file read the Catechism and the magisterial documents and nothing else, so
 * the four bodies of text that cite Scripture most were invisible to a reader
 * standing on the verse (`Citer`, and docs/link-surface.md #12). The index it
 * emits is sharded by book and already inverted, which is what made that
 * affordable — `invertScriptureRefs`.
 */

import {
	citesVulgateNumbering,
	expandIbidem,
	linkifyProse,
	normalizeCitationSpacing,
	parseRefs,
	parseStoredRef,
	siglumStanding
} from '../src/lib/refs-grammar.ts';
import { toVulgateCandidates } from '../src/lib/versification.ts';

/**
 * @typedef {import('../src/lib/types.ts').ScriptureRef} ScriptureRef
 *
 * A citation as `paragraphs.json`/`sections.json` store one; `label` is set
 * only on the ones the source printed inline (docs/corpus-schema.md §CCC).
 * @typedef {{ marker: string, text?: string, label?: string }} Citation
 *
 * Anything that carries an apparatus or prose — a CCC paragraph, a document
 * section, a Summa article, a prayer, a note hanging off a verse. It has no
 * number of its own here: what a unit IS called is the `Citer` beside it, so
 * this is only the two fields that are READ. The caller synthesizes one where
 * the corpus stores something else (a Rosary mystery's single `citation`, a
 * verse's `notes`), which costs one object and buys one reader.
 * @typedef {{ citations?: Citation[], blocks?: { text_marked?: string, html?: string, text?: string }[] }} Unit
 */

/**
 * Every parsed reference is converted from whatever numbering the citation
 * prints to the Vulgate address space the corpus canonicalizes on
 * (docs/corpus-schema.md), before anything downstream sees it — so no
 * consumer of this index ever has to know two conventions exist.
 *
 * Returns a LIST because one printed reference can be two Vulgate ones:
 *
 *   - A whole-chapter reference to a Hebrew chapter that splits across two
 *     Vulgate chapters (Ps 116, Ps 147, Malachi 3) genuinely means both
 *     halves, and an index has no reason to pick one. (`refHref` does pick,
 *     because a link needs a single URL; here there is no such constraint.)
 *   - A verse range can straddle a split point, so verses are mapped
 *     individually and regrouped by the chapter they land in.
 *
 * Applied unconditionally across BOOKS, with no "is this a divergent book"
 * gate: `toVulgateCandidates` is the identity for any address it has no data
 * for, and a no-op cannot turn a correct address into a wrong one. The gate
 * used to exist and was a bug — it skipped the late-merge chapters (Matthew
 * 17, Acts 7, Exodus 40, Zechariah 2, 2 Corinthians 13), emitting e.g. Acts
 * 7:60 into a corpus whose Acts 7 ends at 59.
 *
 * Across WORKS it is conditional, and has to be: a work of the Douay
 * tradition already cites in the numbering being converted to, so converting
 * moves each of its psalm references a psalm down. `refAddress` makes the
 * same exception off the same flag — this is the half of "the builder must
 * pass the same work the page passes" that versification needs.
 */
/**
 * @param {ScriptureRef} ref
 * @param {boolean} alreadyVulgate
 * @returns {ScriptureRef[]}
 */
function toVulgateRefs(ref, alreadyVulgate) {
	if (alreadyVulgate) return [ref];
	if (ref.verses.length === 0) {
		return toVulgateCandidates(ref.osis, ref.chapter).map((c) => ({
			osis: ref.osis,
			chapter: c.chapter,
			verses: [],
			cf: ref.cf
		}));
	}
	const byChapter = new Map();
	for (const v of ref.verses) {
		const c = toVulgateCandidates(ref.osis, ref.chapter, v)[0];
		const list = byChapter.get(c.chapter);
		if (list) list.push(c.verse);
		else byChapter.set(c.chapter, [c.verse]);
	}
	return [...byChapter].map(([chapter, verses]) => ({
		osis: ref.osis,
		chapter,
		verses: [...new Set(verses)].sort((a, b) => a - b),
		cf: ref.cf
	}));
}

/**
 * Collapse a unit's references — across both language editions — into one
 * list, at most one entry per (book, chapter).
 *
 * `cf` survives only when EVERY citation that produced this address printed
 * it as a "cf.". The two are different claims: a bare reference says the text
 * quotes the verse, "cf." says compare it. If either edition quotes it
 * outright, the stronger claim is the true one, so any non-cf occurrence
 * clears the flag. Emitted only when true, matching the wire shape callers
 * already expect (`ScriptureRef.cf?`).
 *
 * A whole-chapter reference (`verses: []`) is NOT merged into a verse-level
 * one for the same chapter: the two say different things, and expanding the
 * chapter across its verses would claim citations the source never made. It
 * survives as its own entry and reaches the reader as the chapter-level note
 * the Bible page already renders under its sentinel key.
 */
/**
 * @param {ScriptureRef[]} refs
 * @returns {ScriptureRef[]}
 */
function mergeRefs(refs) {
	/** @type {Map<string, ScriptureRef & { cf: boolean }>} */
	const byAddress = new Map();
	for (const ref of refs) {
		const key = `${ref.osis}:${ref.chapter}:${ref.verses.length === 0 ? 'all' : 'v'}`;
		const seen = byAddress.get(key);
		if (!seen) {
			byAddress.set(key, { ...ref, verses: [...ref.verses], cf: ref.cf === true });
			continue;
		}
		for (const v of ref.verses) if (!seen.verses.includes(v)) seen.verses.push(v);
		if (ref.cf !== true) seen.cf = false;
	}
	return [...byAddress.values()]
		.map((ref) => ({
			osis: ref.osis,
			chapter: ref.chapter,
			verses: ref.verses.sort((a, b) => a - b),
			...(ref.cf ? { cf: true } : {})
		}))
		.sort((a, b) => a.osis.localeCompare(b.osis) || a.chapter - b.chapter);
}

/**
 * Scripture references printed by one unit (a CCC paragraph, a document
 * section), from its citation apparatus.
 *
 * `label ?? text` is the same choice `CccParagraphText.svelte` makes when it
 * renders: a citation the source printed INLINE carries its parenthesis in
 * `label` and its bare locator in `text` (docs/corpus-schema.md §CCC), and
 * either parses, but reading the same field the renderer reads is what keeps
 * this index and the page agreeing about what the corpus says. Spacing is
 * normalized first for the same reason — the renderer does it too.
 */
/**
 * A block's plain prose, from whichever form it carries.
 *
 * Documents store `html` ONLY (docs/corpus-schema.md); the CCC and Compendium
 * still store `text_marked` and have no `html` yet. This reads either, so the
 * one call site below does not branch on work type.
 *
 * THIS IS THE THIRD IMPLEMENTATION of one rule -- `strip_tags`/`html_to_text`
 * in `pipeline/scrapers/vatican_docs.py` and `inlineText` in
 * `src/lib/inline-html.ts` are the other two -- and that is a real cost, paid
 * because a build script run by bare `node` cannot import the TypeScript one.
 * It is kept honest by being tiny and by the corpus's own round-trip check;
 * if it ever needs to grow past this, extract the TS version to plain JS and
 * import it in all three places rather than editing a fourth copy.
 *
 * The rules, matching those two: an emphasis tag leaves NOTHING behind (a
 * tag is not a word boundary -- pipeline/docs/parsing.md), `<br>` and every
 * other tag leave a space, footnote markers contribute nothing whether they
 * arrive as `<sup data-fn>` elements or as bare ⟦n⟧ tokens.
 *
 * @param {{ text_marked?: string, html?: string, text?: string }} block
 * @returns {string}
 */
export function blockProse(block) {
	if (block.html) {
		return block.html
			.replace(/<sup\s+data-fn="[^"]*"><\/sup>/g, '')
			.replace(/<\/?(?:i|b|sup)\b[^>]*>/g, '')
			.replace(/<[^>]+>/g, ' ')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&amp;/g, '&')
			.replace(/\s+/g, ' ')
			.trim();
	}
	// `text` alone is a block with no apparatus at all (a book introduction);
	// it still carries prose worth scanning.
	return (block.text_marked ?? block.text ?? '').replace(/⟦[^⟧]*⟧/g, '');
}

/**
 * @param {Unit} unit
 * @param {string} lang
 * @param {string} [work] corpus work id, for the few works whose own book
 *   naming overrides their language's — see `refs-grammar.ts`'s `WORK_CONFIGS`.
 *   The builder must pass the same one the reader's page passes, or the
 *   scripture index points at a different verse from the link on the page.
 * @returns {ScriptureRef[]}
 */
function refsForUnit(unit, lang, work) {
	/** @type {ScriptureRef[]} */
	const out = [];
	const alreadyVulgate = citesVulgateNumbering(lang, work);
	for (const citation of unit.citations ?? []) {
		const raw = citation.label ?? citation.text;
		if (!raw) continue;
		for (const seg of parseRefs(normalizeCitationSpacing(raw), { lang, work })) {
			if (seg.kind === 'scripture') out.push(...toVulgateRefs(seg, alreadyVulgate));
		}
	}
	// The BODY too, not just the apparatus. A reference the text names in its
	// own sentence — "«Eu estarei contigo» – Ex 3, 12" — is a citation by any
	// reader's reckoning, and `linkifyProse` (the same function that turns it
	// into a link on the page) is what finds it. The ⟦⟧ tokens are stripped
	// first: they mark where the numbered notes and the inline locators stood,
	// and both were already read from `citations` above.
	for (const block of unit.blocks ?? []) {
		const prose = blockProse(block);
		for (const seg of linkifyProse(prose, { lang, work })) {
			if (seg.kind === 'scripture') out.push(...toVulgateRefs(seg, alreadyVulgate));
		}
	}
	return out;
}

/**
/**
 * WHO CAN CITE — every unit of the corpus that carries an apparatus or prose,
 * named by the address a reader can be sent to, which is what a "cited by"
 * row has to be able to say.
 *
 * IT USED TO BE TWO KINDS AND IS EIGHT (docs/link-surface.md #12). The index
 * read the Catechism and the magisterial documents and nothing else, so a
 * verse's cited-by list omitted the four bodies of text in this corpus that
 * cite Scripture MOST — the Bible editions' own notes, the Summa, Haydock and
 * the prayers — plus the Compendium, the Compendium of the Social Doctrine
 * and the Code, ingested after that row was written. The forward direction
 * had resolved for every one of them for months: the units existed and were
 * simply never handed to this file.
 *
 * `annotation` IS THE ONE THAT IS NOT A DIVISION OF A WORK: a note hanging
 * off a verse, either in a Bible edition's own apparatus or in a commentary
 * that addresses that Bible. It carries the work id, and that is the answer
 * to the question the row deferred — whether an edition's notes may be citers
 * at all. They may, AS THE EDITION: two editions of one Catechism are one
 * Catechism and are unioned by producing the same citer, but Challoner's note
 * is not Allioli's and never was, so an annotation names the apparatus that
 * wrote it rather than the Scripture it sits beside. What the row called
 * circular is real, and is narrower than it looked — see `isSelfReference`.
 *
 * @typedef {{ kind: 'ccc', n: number }
 *   | { kind: 'compendium', n: number }
 *   | { kind: 'document', slug: string, n: number }
 *   | { kind: 'socialDoctrine', n: number }
 *   | { kind: 'canonLaw', n: number }
 *   | { kind: 'summa', part: string, question: number, article: number | null }
 *   | { kind: 'prayer', slug: string }
 *   | { kind: 'annotation', work: string, osis: string, chapter: number, verse: number }} Citer
 *
 * A citing unit with the address that names it; `lang`/`work` are the parse
 * configuration, exactly as `refsForUnit` wants them.
 *
 * `scriptureOnly` withholds the unit from `buildCitationXrefs` — see there for
 * the one work that sets it and why a bookless locator is the reason.
 * @typedef {{ citer: Citer, lang: string, work?: string, unit: Unit, scriptureOnly?: boolean }} CitingUnit
 *
 * @typedef {{ citer: Citer, refs: ScriptureRef[] }} ScriptureCitation
 */

/** Presentation order, and the order every citer list is written in. */
const CITER_KINDS = [
	'ccc',
	'compendium',
	'document',
	'socialDoctrine',
	'canonLaw',
	'summa',
	'prayer',
	'annotation'
];

/**
 * A citer's identity: two citers with the same key are the same place, and
 * one place is listed once however many times it cites an address.
 *
 * This is also the edition-union rule, and it is the whole of it. A CCC
 * paragraph is `ccc 1` in all eight editions, so eight units collapse to one
 * citer; a document section is its slug and its number, and collapses the
 * same way. An annotation carries its work id and so does NOT collapse, which
 * is what carrying it is for.
 *
 * @param {Citer} citer
 * @returns {string}
 */
export function citerKey(citer) {
	const parts =
		citer.kind === 'document'
			? [citer.slug, citer.n]
			: citer.kind === 'summa'
				? [citer.part, citer.question, citer.article ?? '']
				: citer.kind === 'prayer'
					? [citer.slug]
					: citer.kind === 'annotation'
						? [citer.work, citer.osis, citer.chapter, citer.verse]
						: [citer.n];
	return [citer.kind, ...parts].join(' ');
}

/**
 * Deterministic order for a citer list: by kind, then by the address within
 * it, numbers numerically.
 *
 * @param {Citer} a
 * @param {Citer} b
 * @returns {number}
 */
export function compareCiters(a, b) {
	const byKind = CITER_KINDS.indexOf(a.kind) - CITER_KINDS.indexOf(b.kind);
	if (byKind !== 0 || a.kind !== b.kind) return byKind;
	if (a.kind === 'document' && b.kind === 'document') {
		return a.slug.localeCompare(b.slug) || a.n - b.n;
	}
	if (a.kind === 'prayer' && b.kind === 'prayer') return a.slug.localeCompare(b.slug);
	if (a.kind === 'summa' && b.kind === 'summa') {
		return (
			a.part.localeCompare(b.part) || a.question - b.question || (a.article ?? 0) - (b.article ?? 0)
		);
	}
	if (a.kind === 'annotation' && b.kind === 'annotation') {
		return (
			a.work.localeCompare(b.work) ||
			a.osis.localeCompare(b.osis) ||
			a.chapter - b.chapter ||
			a.verse - b.verse
		);
	}
	return /** @type {{ n: number }} */ (a).n - /** @type {{ n: number }} */ (b).n;
}

/**
 * The WORK a citer belongs to, which is the unit an `Ibid.` chain runs
 * through — and never the citer itself, whose address changes at every
 * footnote.
 *
 * Only reached HERE where the caller passes no corpus work id, which is one
 * edition of one work and is what the sync always hands over; the composite
 * is for a caller that parses under a bare language. Exported because
 * `scripts/census.mjs` asks the same question of a cited address — whether a
 * citer is the cited work talking about itself — and a second spelling of
 * "which work is this citer part of" is a second thing to keep true.
 *
 * @param {Citer} citer
 * @returns {string}
 */
export function citerWorkKey(citer) {
	if (citer.kind === 'document') return `document ${citer.slug}`;
	if (citer.kind === 'annotation') return `annotation ${citer.work}`;
	return citer.kind;
}

/**
 * A citer as one phrase for a console report — see `checkXrefsAgainstCorpus`.
 * @param {Citer} citer
 * @returns {string}
 */
export function citerLabel(citer) {
	switch (citer.kind) {
		case 'document':
			return `${citer.slug} ${citer.n}`;
		case 'summa':
			return `summa ${citer.part} ${citer.question}${citer.article === null ? '' : `.${citer.article}`}`;
		case 'prayer':
			return `prayer ${citer.slug}`;
		case 'annotation':
			return `${citer.work} ${citer.osis} ${citer.chapter}:${citer.verse}`;
		default:
			return `${citer.kind} ${citer.n}`;
	}
}

/**
 * A reference that points at the page it is printed on.
 *
 * THIS IS THE CIRCULARITY THE ROW NAMED, and it is only ever an annotation's:
 * a note glossing Matthew 5 that says "Matt. v. 31" names the chapter the
 * reader already has open, and a row telling them the apparatus beside the
 * text mentions the text is not a cross-reference. It is the same argument as
 * the document-cites-itself drop below, one work type over — a document's
 * sections share one page, and an edition's notes share one chapter.
 *
 * The CHAPTER and not the verse, deliberately: a note at verse 3 pointing to
 * verse 31 is pointing inside its own page either way.
 *
 * A note pointing at another chapter, or another book, is kept — that is a
 * real cross-reference, and it is the great majority of them.
 *
 * @param {Citer} citer
 * @param {ScriptureRef} ref
 * @returns {boolean}
 */
function isSelfReference(citer, ref) {
	return citer.kind === 'annotation' && citer.osis === ref.osis && citer.chapter === ref.chapter;
}

/**
 * Every Scripture reference the corpus makes, per citing address.
 *
 * ONE PASS OVER EVERY WORK TYPE, where there were two functions over two of
 * them. What differs between a Catechism paragraph, an encyclical section, a
 * Summa article, a prayer and a Haydock note is only what the address is
 * CALLED: `refsForUnit` already reads any of them, because a unit carrying
 * `citations` and `blocks` is the shape they all store.
 *
 * @param {CitingUnit[]} units
 * @returns {ScriptureCitation[]}
 */
export function buildScriptureRefs(units) {
	/** @type {Map<string, { citer: Citer, refs: ScriptureRef[] }>} */
	const byCiter = new Map();
	for (const { citer, lang, work, unit } of units) {
		const refs = refsForUnit(unit, lang, work);
		if (refs.length === 0) continue;
		const key = citerKey(citer);
		const seen = byCiter.get(key);
		if (seen) seen.refs.push(...refs);
		else byCiter.set(key, { citer, refs });
	}
	/** @type {ScriptureCitation[]} */
	const out = [];
	for (const { citer, refs } of byCiter.values()) {
		const merged = mergeRefs(refs).filter((ref) => !isSelfReference(citer, ref));
		if (merged.length > 0) out.push({ citer, refs: merged });
	}
	return out.sort((a, b) => compareCiters(a.citer, b.citer));
}

/**
 * The same relation read backwards, and SHARDED BY BOOK — the file a Bible
 * chapter actually fetches.
 *
 * INVERTED HERE RATHER THAN IN THE BROWSER, which is the change that made the
 * other six citers affordable. `xrefs.svelte.ts` used to fetch two forward
 * tables (`xrefs.json` and `document-xrefs.json`, 993 KB between them) whose
 * ONLY consumer was a lazy inversion it ran on the first Bible chapter that
 * asked — nothing ever read them forward, because a forward link is one the
 * grammar renders from the citation string itself with nothing stored. Adding
 * the Summa, Haydock, the prayers and seven annotated Bible editions to a
 * whole-corpus table that every reading page downloads was not an option;
 * adding them to one book's slice is a file of a few tens of kilobytes,
 * fetched by the chapter that wants it and then cached for good (the service
 * worker's deferred tier takes every immutable `.json` that is not corpus
 * text — `sw-policy.ts`).
 *
 * A WHOLE-CHAPTER REFERENCE (`verses: []`) lands under the sentinel verse 0,
 * the convention `ScriptureRef` and the reader's page already share:
 * expanding it across the chapter would claim citations the source never
 * made, and dropping it would lose one it did.
 *
 * @param {ScriptureCitation[]} citations
 * @returns {Record<string, Record<string, Record<string, Citer[]>>>} osis ->
 *   chapter -> verse (0 = the chapter as a whole) -> citers
 */
export function invertScriptureRefs(citations) {
	/** @type {Map<string, Map<number, Map<number, { citer: Citer, key: string }[]>>>} */
	const books = new Map();
	for (const { citer, refs } of citations) {
		const key = citerKey(citer);
		for (const ref of refs) {
			let chapters = books.get(ref.osis);
			if (!chapters) books.set(ref.osis, (chapters = new Map()));
			let verses = chapters.get(ref.chapter);
			if (!verses) chapters.set(ref.chapter, (verses = new Map()));
			for (const verse of ref.verses.length > 0 ? ref.verses : [0]) {
				let list = verses.get(verse);
				if (!list) verses.set(verse, (list = []));
				// One citer per address however many of its references reach
				// it: a note naming a verse twice is one note.
				if (!list.some((entry) => entry.key === key)) list.push({ citer, key });
			}
		}
	}
	/** @type {Record<string, Record<string, Record<string, Citer[]>>>} */
	const out = {};
	for (const osis of [...books.keys()].sort()) {
		const chapters = books.get(osis);
		if (!chapters) continue;
		/** @type {Record<string, Record<string, Citer[]>>} */
		const chaptersOut = {};
		for (const chapter of [...chapters.keys()].sort((a, b) => a - b)) {
			const verses = chapters.get(chapter);
			if (!verses) continue;
			/** @type {Record<string, Citer[]>} */
			const versesOut = {};
			for (const verse of [...verses.keys()].sort((a, b) => a - b)) {
				versesOut[verse] = (verses.get(verse) ?? [])
					.map((entry) => entry.citer)
					.sort(compareCiters);
			}
			chaptersOut[chapter] = versesOut;
		}
		out[osis] = chaptersOut;
	}
	return out;
}

/**
 * The non-scripture half of the same derivation: who cites this document
 * section, who cites this Catechism paragraph, and who cites this article of
 * the Summa.
 *
 * THE FORWARD DIRECTION HAS BEEN RENDERED FOR A WHILE and this is its
 * missing counterpart (docs/link-surface.md #12). A CCC footnote reading
 * "LG 12" already becomes a link to Lumen Gentium §12; standing on Lumen
 * Gentium §12 there was no way to learn the Catechism cites it. Same shape as
 * the scripture index above — derived on every build, by the same grammar
 * that renders the links, never committed — and for the same reason: a second
 * implementation of the citation grammar is what this file exists to have
 * stopped having.
 *
 * WHAT COUNTS AS A CITER is the same list the scripture pass reads, and it
 * grew with it: what used to be a CCC paragraph and a document section is now
 * every kind in `Citer`. Two of those changed what this half reports rather
 * than only what the Bible page shows — the Compendium of the Social Doctrine
 * and the Code cite the documents and the Catechism heavily, and were
 * invisible backward for as long as they had been ingested.
 *
 * CITATIONS, and not, unlike the scripture pass, prose: `linkifyProse` finds
 * scripture locators anywhere in a sentence and emits nothing else, so a
 * document named in running text is not linked on the page either. Scanning
 * prose here would therefore have been work that could only ever return
 * scripture segments this function discards. If that limit is ever lifted in
 * the grammar, this is a caller that wants the lift.
 *
 * WHAT IS READ BESIDES A CITATION IS A STORED ADDRESS, and that is not prose
 * either. CCEL marks each of the Summa's 5,180 self-citations with an anchor
 * naming its exact target, which the scraper carries across as
 * `data-ref="summa:I:74:2"` (`parseStoredRef`, in the grammar, for why the
 * visible text of those citations is unparseable in isolation). It is a
 * reference the SOURCE stated, in a block that has no `citations` array at
 * all, so a pass that read only citations could never see it — and it is the
 * whole of what the Summa says about itself.
 *
 * A UNIT MARKED `scriptureOnly` IS NOT READ HERE AT ALL, and the prayers are
 * the only work that sets it. Their apparatus is a Scripture apparatus and
 * nothing else — a mystery of the Rosary prints the Gospel passage it is
 * meditated on, which is every one of the collection's citations across all
 * twenty editions. So a `ccc`, `document` or `summa` segment out of a prayer
 * citation is a MISPARSE by construction, and the Italian edition prints the
 * shape that produces one: its locators are bookless (`1,26-28.30-31` for
 * Luke 1), and a bare number list reads as bare paragraph numbers. It named
 * 27 Catechism paragraphs, every one of them wrong, and each would have
 * rendered as a link under a real paragraph.
 *
 * Fixing the grammar was the other option and is the wrong lever: bare numbers
 * are a real citation form in the apparatus this reads everywhere else. What
 * makes withholding right rather than convenient is that the corpus already
 * answers this question by a checked route — `build/prayer-references/` holds
 * which Catechism article and which Compendium questions treat each prayer,
 * authored in the pipeline and validated there, and the prayer page renders
 * it. A guessed index beside a curated one is the second implementation this
 * file exists to have stopped having.
 *
 * TWO THINGS ARE DROPPED, both deliberately:
 *
 *   - **A document citing itself.** Lumen Gentium's own text says "Lumen
 *     Gentium", and a panel telling a reader that §22 is cited by §1 of the
 *     document they are already reading is noise wearing the clothes of a
 *     cross-reference. Same slug in and out is dropped whatever the sections.
 *     The Summa is NOT the same case and is not dropped: its parts, questions
 *     and articles are separate addresses on separate pages, so `I-II 79.1`
 *     citing `I 3.4` is a cross-reference by every test this file applies to
 *     one document citing another.
 *   - **A section number the target does not have.** `sectionExists` is the
 *     same validation `refAddress` performs before it will render a link, and
 *     for the same reason: "Humani generis 561" is an AAS page number and
 *     that document has 44 sections. A citation whose number does not
 *     validate still names the document, so it is kept with `n: null` — that
 *     is what the landing-page fallback in `refAddress` means, recorded. The
 *     same bucket holds a bare siglum ("cf. GS"), which the forward direction
 *     refuses to link because it has no destination worth guessing. The
 *     reverse direction is not guessing: the citation names Gaudium et Spes
 *     whether or not anything can be linked to, and a reader standing on that
 *     document is owed the fact.
 *
 * `Ibid.` IS RESOLVED HERE, and the doubt about whether that is reading or
 * guessing is settled by a guard rather than by an argument. An ibidem word
 * names the work of the PREVIOUS FOOTNOTE, and 401 of the corpus's 1,240 sit
 * in a different unit from the note they point back at — so believing them
 * means carrying a target across a unit boundary. What makes that a reading:
 * the apparatus numbers its notes, and the builder refuses to expand unless
 * this citation's number is exactly one past the number of the citation it
 * would inherit from. A footnote the parser dropped, or a chapter that
 * restarts its numbering, breaks the run and the `Ibid.` stays unread. 1,227
 * of 1,240 pass; the thirteen that fail are the check doing its job.
 *
 * `expandIbidem` (in the grammar, with the surface forms and the case
 * against `Id.`) does the rewriting; everything else about a citation is
 * read here exactly as it would have been had the source spelled the work
 * out. Two rules make the expansion mean what the word means:
 *
 *   - **A work is inherited only from the citation immediately before**, and
 *     only when that citation named one. A note giving nothing but an AAS
 *     volume ends the run rather than being seen through, because "the same
 *     as two notes ago" is not what `Ibid.` says.
 *   - **A bare `Ibid.` inherits the PLACE too**, not just the work. That is
 *     the whole content of the word, and it is the only part the re-parse
 *     cannot state on its own: a work named with no number after it is not a
 *     reference, so it comes back as no segment at all.
 *
 * MEASURED over the corpus (2026-08-25): 513 citations that resolved to
 * nothing now name an ingested work — 499 documents and 14 Catechism
 * paragraphs — which is 38 document addresses and 8 Catechism paragraphs
 * gaining a citer they did not have. The other 718 still resolve to nothing,
 * and correctly: their antecedent is Denzinger, Migne, a Father or a papal
 * address, none of which this corpus holds, so there was never a link to
 * inherit.
 *
 * THE FOURTH LIST IS THE OTHER SIDE OF THE SAME PASS: what the apparatus asks
 * for that this library has not got. Every citation is already parsed here,
 * against a grammar that recognizes far more works than the corpus holds — so
 * the works it names and cannot reach are a measurement lying on the floor of
 * this function, and `/census` ranks them as the list of what to ingest next
 * (`site/docs/census.md`). `siglumStanding` decides held from absent, because
 * a segment's own `slug` cannot: Portuguese maps no siglum to a slug at all,
 * so read off the parse the corpus appears to lack Familiaris consortio.
 *
 * WHAT NAMES NOTHING IS COUNTED AND NEVER RANKED. 31,525 distinct citation
 * strings resolve to no address and 94% of them occur once — an unexpanded
 * `Ibid.` in a dozen languages, a synod `Propositio`, a line of a footnote
 * the parser stopped short of. Ranked by their own text the head of that list
 * is `Ibid.` and the page would publish it as the most-cited work this
 * library lacks. So the residue is two integers per citer kind: the ibidem
 * words, which are a limit of the reading, and everything else. `unread` is
 * the honest denominator under the ranking and not a table of its own.
 *
 * @typedef {{ work: string, n: number | null, cited_by: Citer[] }} DocumentCitationXref
 * @typedef {{ ccc: number, cited_by: Citer[] }} CccCitationXref
 * @typedef {{ part: string, question: number, article: number | null, cited_by: Citer[] }} SummaCitationXref
 * @typedef {{ work: string, cited_by: Citer[] }} AbsentCitationXref
 * @typedef {{ ibidem: Record<string, number>, other: Record<string, number> }} UnreadCitations
 *
 * @param {CitingUnit[]} units
 *   every citing unit, each already carrying the address that names it
 * @param {(slug: string, n: number) => boolean} sectionExists
 * @param {(n: number) => boolean} paragraphExists
 * @param {(part: string, question: number, article: number | null) => boolean} summaExists
 * @returns {{ documents: DocumentCitationXref[], ccc: CccCitationXref[], summa: SummaCitationXref[], absent: AbsentCitationXref[], unread: UnreadCitations }}
 */
export function buildCitationXrefs(units, sectionExists, paragraphExists, summaExists) {
	/** `slug` -> section number (or `''` for the document at large) -> citers */
	/** @type {Map<string, Map<string, Citer[]>>} */
	const documents = new Map();
	/** @type {Map<number, Citer[]>} */
	const ccc = new Map();
	/** `part:question:article` (article empty for a question-level address) */
	/** @type {Map<string, Citer[]>} */
	const summa = new Map();
	/** the name of a work this corpus has not got -> who asked for it */
	/** @type {Map<string, Citer[]>} */
	const absent = new Map();
	/** @type {{ ibidem: Record<string, number>, other: Record<string, number> }} */
	const unread = { ibidem: {}, other: {} };

	/**
	 * One `Ibid.` chain per EDITION — a work in one language — because that
	 * is the unit a footnote sequence runs through. The units of one edition
	 * arrive here contiguous and in order, so the chain is a running pair
	 * rather than an index.
	 *
	 * Keyed on the corpus work id where the caller has one, which IS an
	 * edition; the composite is the fallback for a caller that does not pass
	 * one (the unit tests, which parse under a bare language).
	 */
	/** @type {Map<string, { marker: number | null, named: NamedWork | null }>} */
	const chains = new Map();

	/** @param {Citer[]} list @param {Citer} citer */
	const addOnce = (list, citer) => {
		// One citer per address however many times it cites it: a paragraph
		// that footnotes LG 12 twice cites it once as far as a reader standing
		// on LG 12 is concerned. The two language editions of one work arrive
		// as separate units with the same address, which is the other half of
		// what this collapses.
		const key = citerKey(citer);
		if (!list.some((c) => citerKey(c) === key)) list.push(citer);
	};

	/** @param {Citer} citer @param {import('../src/lib/refs-grammar.ts').RefSegment} seg */
	const record = (citer, seg) => {
		if (seg.kind === 'ccc') {
			if (citer.kind === 'ccc' || !paragraphExists(seg.n)) return;
			let list = ccc.get(seg.n);
			if (!list) ccc.set(seg.n, (list = []));
			addOnce(list, citer);
			return;
		}
		if (seg.kind === 'summa') {
			if (!summaExists(seg.part, seg.question, seg.article)) return;
			const key = `${seg.part}:${seg.question}:${seg.article ?? ''}`;
			let list = summa.get(key);
			if (!list) summa.set(key, (list = []));
			addOnce(list, citer);
			return;
		}
		if (seg.kind !== 'document' || !seg.slug) return;
		if (citer.kind === 'document' && seg.slug === citer.slug) return;
		const n = firstSection(seg.locus);
		const key = n !== null && sectionExists(seg.slug, n) ? String(n) : '';
		let byUnit = documents.get(seg.slug);
		if (!byUnit) documents.set(seg.slug, (byUnit = new Map()));
		let list = byUnit.get(key);
		if (!list) byUnit.set(key, (list = []));
		addOnce(list, citer);
	};

	/**
	 * Whether a segment lands on an address this corpus holds.
	 *
	 * A `document` segment asks `siglumStanding` and not its own `slug`, for
	 * the reason on that function; a segment matched by TITLE always carries
	 * one, an unresolvable title never having become a segment at all. The
	 * Compendium is true with nothing checked because no consumer of this
	 * index addresses it — a `compendium` segment is a link the page draws
	 * and the reverse direction does not keep, which makes it resolved here
	 * and absent from `documents` for two different reasons.
	 *
	 * @param {import('../src/lib/refs-grammar.ts').RefSegment} seg
	 * @param {string} [lang] @param {string} [work]
	 */
	const resolvesHere = (seg, lang, work) => {
		if (seg.kind === 'scripture' || seg.kind === 'compendium') return true;
		if (seg.kind === 'ccc') return paragraphExists(seg.n);
		if (seg.kind === 'summa') return summaExists(seg.part, seg.question, seg.article);
		if (seg.kind !== 'document') return false;
		return !!seg.slug || siglumStanding(seg.label, lang, work).held;
	};

	/**
	 * One citation, weighed against what the library holds.
	 *
	 * A NAMED ABSENCE IS RECORDED EVEN WHERE THE CITATION ALSO RESOLVED.
	 * "Cf. LG 12; PL 54, 200" links to Lumen gentium and asks for Migne in
	 * the same breath, and a ranking of what the apparatus reaches for that
	 * is not here has to hear the second half. Only the RESIDUE is gated on
	 * the citation landing nowhere: a citation that reached an address is not
	 * unread whatever else it mentions.
	 *
	 * @param {Citer} citer
	 * @param {import('../src/lib/refs-grammar.ts').RefSegment[]} segments
	 * @param {string} text @param {string} [lang] @param {string} [work]
	 */
	const weigh = (citer, segments, text, lang, work) => {
		let named = 0;
		for (const seg of segments) {
			if (seg.kind !== 'document' || seg.slug) continue;
			const standing = siglumStanding(seg.label, lang, work);
			if (standing.held || !standing.work) continue;
			named++;
			let list = absent.get(standing.work);
			if (!list) absent.set(standing.work, (list = []));
			addOnce(list, citer);
		}
		if (named || segments.some((seg) => resolvesHere(seg, lang, work))) return;
		// `expandIbidem` returns null unless the string opens with an ibidem
		// word, so it is the same test the expansion above ran, asked of a
		// citation that came out of it with nothing to show.
		const bucket = expandIbidem(text, 'x') === null ? unread.other : unread.ibidem;
		bucket[citer.kind] = (bucket[citer.kind] ?? 0) + 1;
	};

	for (const { citer, lang, work, unit, scriptureOnly } of units) {
		if (scriptureOnly) continue;
		const chainKey = work ?? `${citerWorkKey(citer)} ${lang}`;
		let chain = chains.get(chainKey);
		if (!chain) chains.set(chainKey, (chain = { marker: null, named: null }));

		for (const citation of unit.citations ?? []) {
			const raw = citation.label ?? citation.text;
			if (!raw) continue;
			const text = normalizeCitationSpacing(raw);
			// An inline locator (`marker: "inline3"`) carries no footnote
			// number, so it neither breaks the chain nor joins it: it sits
			// between two numbered notes without standing between them.
			const marker = /^\d+$/.test(String(citation.marker ?? '').trim())
				? Number(citation.marker)
				: null;
			const antecedent = marker !== null && chain.marker === marker - 1 ? chain.named : null;
			const segments = antecedent
				? expandedSegments(text, lang, work, antecedent)
				: parseRefs(text, { lang, work });
			if (marker !== null) {
				chain.marker = marker;
				chain.named = lastNamedWork(segments);
			}
			for (const seg of segments) record(citer, seg);
			weigh(citer, segments, text, lang, work);
		}

		for (const block of unit.blocks ?? []) {
			for (const address of storedAddresses(block.html)) {
				const seg = parseStoredRef(address, address);
				if (seg) record(citer, seg);
			}
		}
	}

	/** @param {Citer[]} list */
	const ordered = (list) => [...list].sort(compareCiters);

	/** @type {DocumentCitationXref[]} */
	const documentsOut = [];
	for (const slug of [...documents.keys()].sort()) {
		const byUnit = documents.get(slug);
		if (!byUnit) continue;
		// The document-at-large entry (`n: null`) leads its own sections, the
		// way a landing page precedes what it contains.
		const keys = [...byUnit.keys()].sort((a, b) => (a === '' ? -1 : b === '' ? 1 : +a - +b));
		for (const key of keys) {
			documentsOut.push({
				work: slug,
				n: key === '' ? null : +key,
				cited_by: ordered(byUnit.get(key) ?? [])
			});
		}
	}

	/** @type {SummaCitationXref[]} */
	const summaOut = [];
	for (const key of [...summa.keys()].sort()) {
		const [part, question, article] = key.split(':');
		summaOut.push({
			part,
			question: +question,
			// A question-level anchor leads its own articles, for the reason
			// the document-at-large entry leads its sections.
			article: article === '' ? null : +article,
			cited_by: ordered(summa.get(key) ?? [])
		});
	}
	summaOut.sort(
		(a, b) =>
			a.part.localeCompare(b.part) || a.question - b.question || (a.article ?? 0) - (b.article ?? 0)
	);

	return {
		documents: documentsOut,
		ccc: [...ccc.keys()]
			.sort((a, b) => a - b)
			.map((n) => ({ ccc: n, cited_by: ordered(ccc.get(n) ?? []) })),
		summa: summaOut,
		absent: [...absent.keys()]
			.sort()
			.map((work) => ({ work, cited_by: ordered(absent.get(work) ?? []) })),
		unread
	};
}

/**
 * Every `data-ref` address in one block of stored HTML.
 *
 * Read with a regex rather than by parsing, exactly as `inline-html.ts`'s
 * `DATA_REF` reads it on the page: the corpus writes the attribute, this is
 * a build script, and an HTML parser here would be a second reading of the
 * same markup the renderer already has one of.
 *
 * @param {string | undefined} html
 * @returns {string[]}
 */
function storedAddresses(html) {
	if (!html) return [];
	return [...html.matchAll(/\bdata-ref="([^"]*)"/g)].map((m) => m[1]);
}

/**
 * The work a citation ends by naming, in the form an `Ibid.` after it needs:
 * the label to write into the expansion, and the segment itself, which is
 * what a bare `Ibid.` inherits whole.
 *
 * THE LAST named work, not the first, because that is the one an ibidem word
 * points at. The distinction only ever arises inside a single citation that
 * names two ("LG 12; GS 22"), since the edition locators that usually trail
 * a citation — "GS 82: AAS 58 (1966), 1105" — name no work this corpus
 * holds and so are not candidates at all.
 *
 * @typedef {{ label: string, segment: import('../src/lib/refs-grammar.ts').RefSegment }} NamedWork
 * @param {import('../src/lib/refs-grammar.ts').RefSegment[]} segments
 * @returns {NamedWork | null}
 */
function lastNamedWork(segments) {
	/** @type {NamedWork | null} */
	let named = null;
	for (const seg of segments) {
		if (seg.kind === 'document' && seg.slug) named = { label: seg.label, segment: seg };
		// "CCC" is a form the grammar's own work-title matcher reads, in
		// every language, so the Catechism expands by the same route a
		// document does rather than through a special case.
		else if (seg.kind === 'ccc') named = { label: 'CCC', segment: seg };
	}
	return named;
}

/**
 * @param {import('../src/lib/refs-grammar.ts').RefSegment} seg
 * @param {import('../src/lib/refs-grammar.ts').RefSegment} named
 */
function namesSameWork(seg, named) {
	return named.kind === 'ccc'
		? seg.kind === 'ccc'
		: seg.kind === 'document' && named.kind === 'document' && seg.slug === named.slug;
}

/**
 * One citation's segments, with a leading `Ibid.` expanded against the work
 * the previous footnote named.
 *
 * @param {string} text a citation, already spacing-normalized
 * @param {string} lang
 * @param {string | undefined} work
 * @param {NamedWork} antecedent
 * @returns {import('../src/lib/refs-grammar.ts').RefSegment[]}
 */
function expandedSegments(text, lang, work, antecedent) {
	const expanded = expandIbidem(text, antecedent.label);
	if (expanded === null) return parseRefs(text, { lang, work });
	const segments = parseRefs(expanded, { lang, work });
	const i = segments.findIndex((seg) => namesSameWork(seg, antecedent.segment));
	// A bare `Ibid.` — the place stands as well as the work. The expansion
	// reads as a work named in passing, which is not a reference, so it comes
	// back either as no segment (i < 0) or as one with no locus; either way
	// the answer is the segment the previous footnote produced.
	if (i < 0) return [antecedent.segment, ...segments];
	const seg = segments[i];
	if (seg.kind === 'document' && seg.locus === null) segments[i] = antecedent.segment;
	return segments;
}

/**
 * The first section number in a parsed document locus, or `null`.
 *
 * A locus is captured but never trusted (`refs-grammar.ts`), and this is the
 * builder's copy of the one line `refs.ts`'s `firstLocusSection` runs before
 * `refAddress` will validate it. Kept here rather than imported because that
 * module reaches the corpus and this script must not.
 *
 * @param {string | null} locus
 * @returns {number | null}
 */
function firstSection(locus) {
	const m = locus ? /^\d+/.exec(locus) : null;
	return m ? +m[0] : null;
}

/**
 * References that point outside the corpus — the check whose absence once let
 * sixteen dead references ship.
 *
 * `chapterVerses` maps `osis:chapter` to that chapter's verse count in some
 * ingested Bible edition; a reference is a problem only when NO edition has
 * it, since the editions legitimately differ. Deliberately reported, never
 * fatal: every survivor is a known source defect (docs/research/
 * ccc-citation-defects.md), and a build that refuses to run until someone
 * fixes the Vatican's typesetting is a build nobody can run.
 */
/**
 * @param {ScriptureCitation[]} citations
 * @param {Map<string, number>} chapterVerses `osis:chapter` -> highest verse number in any edition
 * @returns {string[]}
 */
export function checkXrefsAgainstCorpus(citations, chapterVerses) {
	/** @type {string[]} */
	const problems = [];
	for (const entry of citations) {
		const where = citerLabel(entry.citer);
		for (const ref of entry.refs) {
			const max = chapterVerses.get(`${ref.osis}:${ref.chapter}`);
			if (max === undefined) {
				problems.push(`${where}: ${ref.osis} ${ref.chapter} — chapter not in any edition`);
				continue;
			}
			const dead = ref.verses.filter((/** @type {number} */ v) => v > max);
			if (dead.length > 0) {
				problems.push(
					`${where}: ${ref.osis} ${ref.chapter}:${dead.join(',')} — past end of chapter (${max})`
				);
			}
		}
	}
	return problems;
}
