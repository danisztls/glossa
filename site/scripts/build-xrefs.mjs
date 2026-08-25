/**
 * Scripture cross-reference index, derived from `corpus/works/` at build time.
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
 * between builds. See docs/decisions.md §Parsing.
 *
 * Coverage is every edition of a work, not one: the Portuguese Catechism
 * prints Scripture locators inline that the English edition footnotes, and
 * vice versa, and both are the same Catechism citing the same verse. The two
 * editions' references are therefore UNIONED per paragraph — see
 * `mergeRefs` for what that does with `cf` and with duplicate verses.
 */

import {
	expandIbidem,
	linkifyProse,
	normalizeCitationSpacing,
	parseRefs
} from '../src/lib/refs-grammar.ts';
import { toVulgateCandidates } from '../src/lib/versification.ts';

/**
 * @typedef {import('../src/lib/types.ts').ScriptureRef} ScriptureRef
 * @typedef {import('../src/lib/types.ts').CccBibleXref} CccBibleXref
 * @typedef {import('../src/lib/types.ts').DocumentBibleXref} DocumentBibleXref
 *
 * A citation as `paragraphs.json`/`sections.json` store one; `label` is set
 * only on the ones the source printed inline (docs/corpus-schema.md §CCC).
 * @typedef {{ marker: string, text?: string, label?: string }} Citation
 *
 * Any numbered unit carrying an apparatus — a CCC paragraph, a document
 * section. Only the two fields read here are named.
 * @typedef {{ n: number, citations?: Citation[], blocks?: { text_marked?: string, html?: string, text?: string }[] }} Unit
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
 * Applied unconditionally, with no "is this a divergent book" gate:
 * `toVulgateCandidates` is the identity for any address it has no data for,
 * and a no-op cannot turn a correct address into a wrong one. The gate used
 * to exist and was a bug — it skipped the late-merge chapters (Matthew 17,
 * Acts 7, Exodus 40, Zechariah 2, 2 Corinthians 13), emitting e.g. Acts 7:60
 * into a corpus whose Acts 7 ends at 59.
 */
/**
 * @param {ScriptureRef} ref
 * @returns {ScriptureRef[]}
 */
function toVulgateRefs(ref) {
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
 * tag is not a word boundary -- decisions.md §Storage), `<br>` and every
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
 * @returns {ScriptureRef[]}
 */
function refsForUnit(unit, lang) {
	/** @type {ScriptureRef[]} */
	const out = [];
	for (const citation of unit.citations ?? []) {
		const raw = citation.label ?? citation.text;
		if (!raw) continue;
		for (const seg of parseRefs(normalizeCitationSpacing(raw), { lang })) {
			if (seg.kind === 'scripture') out.push(...toVulgateRefs(seg));
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
		for (const seg of linkifyProse(prose, { lang })) {
			if (seg.kind === 'scripture') out.push(...toVulgateRefs(seg));
		}
	}
	return out;
}

/**
 * Build the CCC → Bible index from every CCC edition present.
 *
 * `editions` is `[{ lang, paragraphs }]`. Output is the wire shape
 * `corpus-index.ts` loads: `[{ ccc, refs }]`, ordered by paragraph, entries
 * with no references omitted.
 */
/**
 * @param {{ lang: string, paragraphs: Unit[] }[]} editions
 * @returns {CccBibleXref[]}
 */
export function buildCccBibleXrefs(editions) {
	/** @type {Map<number, ScriptureRef[]>} */
	const byParagraph = new Map();
	for (const { lang, paragraphs } of editions) {
		for (const p of paragraphs) {
			const refs = refsForUnit(p, lang);
			if (refs.length === 0) continue;
			const list = byParagraph.get(p.n);
			if (list) list.push(...refs);
			else byParagraph.set(p.n, refs);
		}
	}
	return [...byParagraph.keys()]
		.sort((a, b) => a - b)
		.map((n) => ({ ccc: n, refs: mergeRefs(byParagraph.get(n) ?? []) }));
}

/**
 * Build the document → Bible index from every ingested magisterial document.
 *
 * `editions` is `[{ slug, lang, sections }]` — one entry per WORK FILE, so a
 * document with an English and a Portuguese edition appears twice and its
 * references are unioned, exactly as the two Catechism editions are.
 *
 * Keyed by `slug` rather than work id because that is what a link addresses:
 * `/documenta/{slug}#s{n}` is edition-free (docs/decisions.md #2's URL
 * convention), and the reader's own language preference decides which edition
 * that page opens in. Output is `[{ work, n, refs }]`, ordered by slug then
 * section, entries with no references omitted.
 *
 * @param {{ slug: string, lang: string, sections: Unit[] }[]} editions
 * @returns {DocumentBibleXref[]}
 */
export function buildDocumentBibleXrefs(editions) {
	/** @type {Map<string, Map<number, ScriptureRef[]>>} */
	const bySlug = new Map();
	for (const { slug, lang, sections } of editions) {
		for (const section of sections) {
			const refs = refsForUnit(section, lang);
			if (refs.length === 0) continue;
			let byUnit = bySlug.get(slug);
			if (!byUnit) bySlug.set(slug, (byUnit = new Map()));
			const list = byUnit.get(section.n);
			if (list) list.push(...refs);
			else byUnit.set(section.n, refs);
		}
	}
	/** @type {DocumentBibleXref[]} */
	const out = [];
	for (const slug of [...bySlug.keys()].sort()) {
		const byUnit = bySlug.get(slug);
		if (!byUnit) continue;
		for (const n of [...byUnit.keys()].sort((a, b) => a - b)) {
			out.push({ work: slug, n, refs: mergeRefs(byUnit.get(n) ?? []) });
		}
	}
	return out;
}

/**
 * The non-scripture half of the same derivation: who cites this document
 * section, and who cites this Catechism paragraph.
 *
 * THE FORWARD DIRECTION HAS BEEN RENDERED FOR A WHILE and this is its
 * missing counterpart (docs/link-surface.md #12). A CCC footnote reading
 * "LG 12" already becomes a link to Lumen Gentium §12; standing on Lumen
 * Gentium §12 there was no way to learn the Catechism cites it. Same shape as
 * the two Bible indexes above — derived on every build, by the same grammar
 * that renders the links, never committed — and for the same reason: a second
 * implementation of the citation grammar is what this file exists to have
 * stopped having.
 *
 * WHAT COUNTS AS A CITER is every unit that carries an apparatus: a CCC
 * paragraph and a document section. Both are read through `parseRefs` over
 * their CITATIONS and not, unlike the scripture pass, over their prose:
 * `linkifyProse` finds scripture locators anywhere in a sentence and emits
 * nothing else, so a document named in running text is not linked on the page
 * either. Scanning prose here would therefore have been work that could only
 * ever return scripture segments this function discards. If that limit is
 * ever lifted in the grammar, this is a caller that wants the lift.
 *
 * TWO THINGS ARE DROPPED, both deliberately:
 *
 *   - **A document citing itself.** Lumen Gentium's own text says "Lumen
 *     Gentium", and a panel telling a reader that §22 is cited by §1 of the
 *     document they are already reading is noise wearing the clothes of a
 *     cross-reference. Same slug in and out is dropped whatever the sections.
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
 * @typedef {{ kind: 'ccc' | 'document', slug?: string, n: number }} Citer
 * @typedef {{ work: string, n: number | null, cited_by: Citer[] }} DocumentCitationXref
 * @typedef {{ ccc: number, cited_by: Citer[] }} CccCitationXref
 *
 * @param {{ citer: Citer & { slug?: string }, lang: string, unit: Unit }[]} units
 *   every citing unit, each already carrying the address that names it
 * @param {(slug: string, n: number) => boolean} sectionExists
 * @param {(n: number) => boolean} paragraphExists
 * @returns {{ documents: DocumentCitationXref[], ccc: CccCitationXref[] }}
 */
export function buildCitationXrefs(units, sectionExists, paragraphExists) {
	/** `slug` -> section number (or `''` for the document at large) -> citers */
	/** @type {Map<string, Map<string, Citer[]>>} */
	const documents = new Map();
	/** @type {Map<number, Citer[]>} */
	const ccc = new Map();

	/**
	 * One `Ibid.` chain per EDITION — a work in one language — because that
	 * is the unit a footnote sequence runs through. The units of one edition
	 * arrive here contiguous and in order, so the chain is a running pair
	 * rather than an index.
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
		if (!list.some((c) => c.kind === citer.kind && c.slug === citer.slug && c.n === citer.n)) {
			list.push(citer);
		}
	};

	for (const { citer, lang, unit } of units) {
		const chainKey = `${citer.kind}\u0000${citer.slug ?? ''}\u0000${lang}`;
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
				? expandedSegments(text, lang, antecedent)
				: parseRefs(text, { lang });
			if (marker !== null) {
				chain.marker = marker;
				chain.named = lastNamedWork(segments);
			}
			for (const seg of segments) {
				if (seg.kind === 'ccc') {
					if (citer.kind === 'ccc' || !paragraphExists(seg.n)) continue;
					let list = ccc.get(seg.n);
					if (!list) ccc.set(seg.n, (list = []));
					addOnce(list, citer);
					continue;
				}
				if (seg.kind !== 'document' || !seg.slug || seg.slug === citer.slug) continue;
				const n = firstSection(seg.locus);
				const key = n !== null && sectionExists(seg.slug, n) ? String(n) : '';
				let byUnit = documents.get(seg.slug);
				if (!byUnit) documents.set(seg.slug, (byUnit = new Map()));
				let list = byUnit.get(key);
				if (!list) byUnit.set(key, (list = []));
				addOnce(list, citer);
			}
		}
	}

	/** @param {Citer[]} list */
	const ordered = (list) =>
		[...list].sort(
			(a, b) =>
				(a.slug ?? '').localeCompare(b.slug ?? '') || a.kind.localeCompare(b.kind) || a.n - b.n
		);

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

	return {
		documents: documentsOut,
		ccc: [...ccc.keys()]
			.sort((a, b) => a - b)
			.map((n) => ({ ccc: n, cited_by: ordered(ccc.get(n) ?? []) }))
	};
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
 * @param {NamedWork} antecedent
 * @returns {import('../src/lib/refs-grammar.ts').RefSegment[]}
 */
function expandedSegments(text, lang, antecedent) {
	const expanded = expandIbidem(text, antecedent.label);
	if (expanded === null) return parseRefs(text, { lang });
	const segments = parseRefs(expanded, { lang });
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
 * @param {(CccBibleXref | DocumentBibleXref)[]} xrefs
 * @param {Map<string, number>} chapterVerses `osis:chapter` -> highest verse number in any edition
 * @returns {string[]}
 */
export function checkXrefsAgainstCorpus(xrefs, chapterVerses) {
	/** @type {string[]} */
	const problems = [];
	for (const entry of xrefs) {
		const where = 'ccc' in entry ? `ccc ${entry.ccc}` : `${entry.work} ${entry.n}`;
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
