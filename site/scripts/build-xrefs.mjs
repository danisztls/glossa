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
 * between builds. See docs/decisions.md, 2026-08-21.
 *
 * Coverage is every edition of a work, not one: the Portuguese Catechism
 * prints Scripture locators inline that the English edition footnotes, and
 * vice versa, and both are the same Catechism citing the same verse. The two
 * editions' references are therefore UNIONED per paragraph — see
 * `mergeRefs` for what that does with `cf` and with duplicate verses.
 */

import { linkifyProse, normalizeCitationSpacing, parseRefs } from '../src/lib/refs-grammar.ts';
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
 * tag is not a word boundary -- decisions.md, 2026-08-22), `<br>` and every
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
