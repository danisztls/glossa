import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	cccChunkStartFor,
	compendiumChunkStartFor,
	documentChunkStartFor,
	expandRun
} from './corpus-index';
import {
	documentSectionText,
	getAdjacentChapterAcrossBooks,
	getBook,
	getBookIntro,
	getCanonicalBook,
	hasBookIntro,
	hasIntroForWork,
	compareColumnLabel,
	getCccChapterBreadcrumb,
	getCccChapterFor,
	getCompendiumChapterBreadcrumb,
	getCompendiumChapterFor,
	getCompendiumQuestionRangeAsync,
	listCompendiumChapters,
	randomVerse,
	CONTENT_LANG_FALLBACK,
	defaultWorkId,
	editionInLang,
	listEditions,
	baseLang,
	completeEditionTags,
	languageDisplayName,
	resolveEditionTag,
	PREFERRED_EDITION
} from './corpus';

describe('Compendium whole-reading units', () => {
	it('uses the innermost chapter, while retaining a section fallback before its first chapter', () => {
		expect(getCompendiumChapterFor('en', 2)?.kind).toBe('chapter');
		expect(getCompendiumChapterFor('en', 1)?.kind).toBe('section');
	});

	/**
	 * The whole-chapter view prints its unit's ancestors and stops there —
	 * everything below the chapter is on the page already, not above it. So
	 * the trail must end at the same node `getCompendiumChapterFor` picks,
	 * including where that is the section fallback before the first chapter.
	 */
	it('trails down to the whole-reading unit and no further', () => {
		expect(getCompendiumChapterBreadcrumb('en', 2).map((node) => node.kind)).toEqual([
			'part',
			'section',
			'chapter'
		]);
		expect(getCompendiumChapterBreadcrumb('en', 1).map((node) => node.kind)).toEqual([
			'part',
			'section'
		]);
		expect(getCompendiumChapterBreadcrumb('en', 2).at(-1)).toBe(getCompendiumChapterFor('en', 2));
	});

	it('makes all whole-reading starts available to the route manifest', () => {
		expect(listCompendiumChapters('en').map((chapter) => chapter.paragraphs[0])).toEqual([
			1, 1, 2, 6, 25
		]);
	});

	it('reads only the requested question range from the memoized language asset', async () => {
		await expect(getCompendiumQuestionRangeAsync('en', 2, 4)).resolves.toMatchObject([
			{ n: 2 },
			{ n: 3 },
			{ n: 4 }
		]);
	});
});

describe('CCC whole-chapter breadcrumb', () => {
	/** Paragraph 28 sits inside an ARTICLE inside the chapter, and the article
	 *  is a heading printed in the chapter's own body — a place the reader is
	 *  already at, not one to go up to. */
	it('stops at the chapter, dropping the article the paragraph is in', () => {
		expect(getCccChapterBreadcrumb('en', 28).map((node) => node.kind)).toEqual([
			'part',
			'section',
			'chapter'
		]);
		expect(getCccChapterBreadcrumb('en', 28).at(-1)).toBe(getCccChapterFor('en', 28));
	});

	it('is empty where no chapter contains the paragraph', () => {
		expect(getCccChapterBreadcrumb('en', 9999)).toEqual([]);
		expect(getCccChapterFor('en', 9999)).toBeUndefined();
	});
});

describe('content chunking', () => {
	/**
	 * Every stride is written TWICE — in `scripts/sync-corpus.mjs`, which
	 * decides where the chunk boundaries fall, and in `corpus-index.ts`, which
	 * decides where to look for them. They cannot import each other (one is a
	 * build script, the other ships to the browser), and a mismatch fails
	 * SILENTLY: the `…ChunkStartFor` function computes a start no file was
	 * written for, the location lookup returns `undefined`, and the page
	 * renders nothing at all rather than erroring.
	 *
	 * A table rather than four copies of one test, so that adding a fifth
	 * chunked work type is one row — the document stride shipped alone for
	 * nine days and the Compendium and Bible strides were added without this
	 * guard being extended, which is exactly how the pair drifts.
	 */
	const STRIDES: { name: string; constant: string; startFor: (n: number) => number }[] = [
		{ name: 'documents', constant: 'DOCUMENT_CHUNK_SIZE', startFor: documentChunkStartFor },
		{ name: 'CCC', constant: 'CCC_CHUNK_SIZE', startFor: cccChunkStartFor },
		{ name: 'Compendium', constant: 'COMPENDIUM_CHUNK_SIZE', startFor: compendiumChunkStartFor }
		// Bible chapters were a fourth row here until 2026-08-28. They are no
		// longer a STRIDE: chunks are packed by size, so there is no constant
		// for the two sides to agree on and nothing for this test to pin. What
		// replaces it is `bibleChapterChunkFor`, whose contract is a lookup
		// over ranges the sync script named -- covered below rather than here.
	];

	for (const { name, constant, startFor } of STRIDES) {
		it(`${name}: same stride as the sync script that writes the chunks`, () => {
			const source = readFileSync(
				new URL('../../scripts/sync-corpus.mjs', import.meta.url),
				'utf8'
			);
			const declared = source.match(new RegExp(`^const ${constant} = (\\d+);$`, 'm'));
			expect(declared, `sync-corpus.mjs must declare ${constant}`).not.toBeNull();
			const stride = Number(declared![1]);

			// The `…StartFor` function is the only place the reader's copy is
			// observable, so exercise it rather than re-reading the literal:
			// the first unit of a chunk and its last must agree on the start.
			expect(startFor(1)).toBe(1);
			expect(startFor(stride)).toBe(1);
			expect(startFor(stride + 1)).toBe(stride + 1);
			expect(startFor(stride * 2)).toBe(stride + 1);
		});
	}

	/**
	 * The ceiling exists because every chunking regression so far was a size
	 * premise that went stale unobserved. It is enforced by the sync (which is
	 * where the byte counts are), so what this checks is only that the sync
	 * still declares one — deleting the constant would delete the guard
	 * without failing anything else.
	 */
	it('declares a per-file size ceiling in the sync script', () => {
		const source = readFileSync(new URL('../../scripts/sync-corpus.mjs', import.meta.url), 'utf8');
		const declared = source.match(/^const CONTENT_FILE_CEILING_BYTES = ([\d_]+);$/m);
		expect(declared, 'sync-corpus.mjs must declare CONTENT_FILE_CEILING_BYTES').not.toBeNull();
		expect(Number(declared![1].replace(/_/g, ''))).toBeGreaterThan(0);
	});
});

/**
 * `compactRun` (in the sync script) and `expandRun` (in `corpus-index.ts`) are
 * the same pair of halves the strides above are, and they fail the same way:
 * the sync writes `31`, the reader expands it wrongly, and a chapter's verses
 * are quietly the wrong set — no error, just citations that stop linking or
 * start linking to verses that are not there.
 *
 * The encoder is LIFTED OUT OF THE SOURCE rather than imported, because
 * importing `sync-corpus.mjs` runs it, and the first thing it does is
 * `rmSync(destDir, { recursive: true })`. Reading the script as text is what
 * `sw-policy.test.ts` already does to recover the content kinds, for the same
 * reason.
 */
describe("the index tier's compact numbering", () => {
	function encoder(): (nums: number[]) => number | number[] {
		const source = readFileSync(new URL('../../scripts/sync-corpus.mjs', import.meta.url), 'utf8');
		const declared = source.match(/^function compactRun\(nums\) \{\n(?:.*\n)*?\}$/m);
		expect(declared, 'sync-corpus.mjs must declare compactRun').not.toBeNull();
		return new Function(`${declared![0]}; return compactRun;`)() as (
			nums: number[]
		) => number | number[];
	}

	/** The three real gaps in the corpus today all live in Douay-Rheims, plus
	 *  the shapes the other index files exhibit and the two degenerate ones. */
	const RUNS: { name: string; run: number[] }[] = [
		{ name: 'an empty run (an article-less Summa question)', run: [] },
		{ name: 'a single element', run: [1] },
		{ name: 'a gapless chapter', run: [1, 2, 3, 4, 5] },
		{ name: 'the Compendium, 1..598', run: Array.from({ length: 598 }, (_, i) => i + 1) },
		{ name: 'Douay-Rheims Ps 115, beginning at verse 10', run: [10, 11, 12, 13, 14, 15] },
		{ name: 'Douay-Rheims Wis 18, skipping 25', run: [22, 23, 24, 26] },
		{ name: 'a run starting at 1 with a hole in it', run: [1, 2, 4, 5] }
	];

	for (const { name, run } of RUNS) {
		it(`round-trips ${name}`, () => {
			expect(expandRun(encoder()(run))).toEqual(run);
		});
	}

	it('encodes a gapless run as its count and anything else verbatim', () => {
		const compactRun = encoder();
		// The whole saving, and the whole risk: this is the only case where the
		// wire form is not the data.
		expect(compactRun([1, 2, 3])).toBe(3);
		expect(compactRun([])).toBe(0);
		// A gap of any kind falls back to the array, which is what keeps the
		// encoding lossless — see `compactRun`'s docblock on why a bound was
		// refused for exactly this reason.
		expect(compactRun([2, 3])).toEqual([2, 3]);
		expect(compactRun([1, 3])).toEqual([1, 3]);
	});
});

describe('documentSectionText', () => {
	it('derives from html — the corpus stores no `text` to read', () => {
		const section = {
			n: 1,
			blocks: [{ html: 'Constitution <i>Esti minime</i>.' }, { html: 'A second block.' }],
			citations: []
		};
		// Blocks joined by ONE space, and no space introduced at the `</i>`
		// boundary — the corpus's own `text` stores `Esti minime .` there
		// (see `documentSectionText`'s docblock: 17.2% of sections differ from
		// their stored text by exactly this, and by nothing else).
		expect(documentSectionText(section)).toBe('Constitution Esti minime. A second block.');
	});

	it('drops footnote markers without leaving a space behind', () => {
		const section = {
			n: 1,
			blocks: [{ html: 'word<sup data-fn="12"></sup>. Next.' }],
			citations: []
		};
		expect(documentSectionText(section)).toBe('word. Next.');
	});
});

describe('book introductions (chapter 0)', () => {
	// The fixtures give English an introduction for Genesis and none for John,
	// which is what lets both the present and the absent path be asserted here
	// rather than only the happy one.
	it('knows which books a language introduces', () => {
		expect(hasBookIntro('en', 'gen')).toBe(true);
		expect(hasBookIntro('en', 'john')).toBe(false);
		expect(hasBookIntro('pt', 'gen')).toBe(false);
	});

	it('resolves a work id to its language, so an edition inherits its language’s introductions', () => {
		expect(hasIntroForWork('bible.cpdv.en', 'gen')).toBe(true);
		// Same book, same address, a language with nothing written for it yet.
		expect(hasIntroForWork('bible.matos-soares.pt', 'gen')).toBe(false);
		expect(hasIntroForWork('bible.clementina.la', 'gen')).toBe(false);
	});

	it('reads the introduction as blocks, and nothing for a book without one', async () => {
		const intro = await getBookIntro('en', 'gen');
		expect(intro?.osis).toBe('gen');
		expect(intro?.blocks.length).toBe(2);
		expect(intro?.blocks[0].text).toContain('GENERATION');
		await expect(getBookIntro('en', 'john')).resolves.toBeUndefined();
		await expect(getBookIntro('pt', 'gen')).resolves.toBeUndefined();
	});

	it('puts chapter 0 before chapter 1 for the languages that have one', () => {
		// The fixture Genesis carries one chapter; the 0 sorts in front of it.
		expect(getCanonicalBook('gen')?.chapters).toEqual([0, 1]);
		// The canonical list is the union across languages, so John — which no
		// language introduces — never gains a 0 at all. (Its [1, 3] gap is the
		// fixtures' own deliberate not-in-corpus case, left untouched.)
		expect(getCanonicalBook('john')?.chapters).toEqual([1, 3]);
	});

	it('navigates from chapter 1 back into the introduction, but only where there is one', () => {
		expect(getAdjacentChapterAcrossBooks('bible.cpdv.en', 'gen', 1, 'prev')).toEqual({
			osis: 'gen',
			chapter: 0
		});
		expect(getAdjacentChapterAcrossBooks('bible.cpdv.en', 'gen', 0, 'next')).toEqual({
			osis: 'gen',
			chapter: 1
		});
		// A Portuguese reader steps straight past it, because for them it is an
		// absent chapter rather than a page with nothing on it.
		expect(
			getAdjacentChapterAcrossBooks('bible.matos-soares.pt', 'gen', 1, 'prev')
		).toBeUndefined();
	});

	it('keeps chapter 0 out of the citation address space', () => {
		// The whole reason introductions are stored apart from `chapters`: a
		// reference must never resolve to one. `refs.ts` checks existence
		// against the book's chapters, which never carry a 0.
		expect(getBook('bible.cpdv.en', 'gen')?.chapters.some((c) => c.n === 0)).toBe(false);
	});
});

describe('randomVerse', () => {
	// The fixtures are Genesis 1 (13 verses), John 1 (18) and John 3 (21) —
	// 52 verses in three chapters across two books, in that order.
	it('walks the whole edition, in canonical order', () => {
		const at = (fraction: number) => randomVerse('bible.cpdv.en', () => fraction);
		expect(at(0)).toEqual({ osis: 'gen', chapter: 1, verse: 1 });
		expect(at(12 / 52)).toEqual({ osis: 'gen', chapter: 1, verse: 13 });
		expect(at(13 / 52)).toEqual({ osis: 'john', chapter: 1, verse: 1 });
		expect(at(31 / 52)).toEqual({ osis: 'john', chapter: 3, verse: 1 });
		// `Math.random()` never returns 1, but the clamp means an injected
		// generator that does still lands on the last verse rather than
		// walking off the end and reporting an empty Bible.
		expect(at(1)).toEqual({ osis: 'john', chapter: 3, verse: 21 });
	});

	// The distribution the walk exists for: weight by verses, not by books.
	// John 3 alone is 21 of 52 verses, and a book-then-chapter pick would
	// have given it 1 in 4 instead.
	it('gives every verse the same chance', () => {
		const counts = new Map<string, number>();
		for (let i = 0; i < 52; i++) {
			const verse = randomVerse('bible.cpdv.en', () => (i + 0.5) / 52);
			const key = `${verse?.osis} ${verse?.chapter}:${verse?.verse}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		expect(counts.size).toBe(52);
		expect([...counts.values()].every((n) => n === 1)).toBe(true);
	});

	it('has nothing to offer for a work that is not a Bible', () => {
		expect(randomVerse('ccc.en')).toBeUndefined();
	});
});

describe('compare column labels', () => {
	// The tag over a stacked compare column. Two editions of the same work are
	// told apart by LANGUAGE everywhere except the Bible, which is the only
	// type expected to ever hold two editions of one language.
	it('names the content language in its own tongue', () => {
		expect(compareColumnLabel({ language: 'en', short_title: 'CCC' })).toBe('English');
		expect(compareColumnLabel({ language: 'pt-PT', short_title: 'CIC' })).toBe('Português');
		expect(compareColumnLabel({ language: 'la', short_title: 'Vulgata' })).toBe('Latina');
	});

	it('adds the edition only where a language can hold two of them', () => {
		expect(compareColumnLabel({ language: 'en', short_title: 'Douay-Rheims (CPDV)' }, true)).toBe(
			'English – Douay-Rheims (CPDV)'
		);
	});

	// The regression this replaced: on `/documenta` both columns are one
	// document, so `short_title` was frequently the SAME STRING over both —
	// a tag that identified nothing.
	it('distinguishes two editions whose titles are identical', () => {
		const left = compareColumnLabel({ language: 'en', short_title: 'Magnifica Humanitas' });
		const right = compareColumnLabel({ language: 'pt', short_title: 'Magnifica Humanitas' });
		expect(left).not.toBe(right);
	});
});

describe('preferred edition', () => {
	it('gives an English reader the CPDV, not whichever id sorts first', () => {
		// Both English Bibles are in the fixtures precisely so this can fail.
		expect(listEditions('bible').filter((w) => w.language === 'en')).toHaveLength(2);
		expect(defaultWorkId('bible', 'en')).toBe('bible.cpdv.en');
	});

	it("carries the choice into the fallback languages, not just the reader's own", () => {
		// A German reader has no German Bible and lands on English by
		// CONTENT_LANG_FALLBACK — which must arrive at the same edition an
		// English reader gets, rather than re-deciding by sort order.
		expect(defaultWorkId('bible', 'de')).toBe('bible.cpdv.en');
	});

	it('ends every fallback row in English then Latin', () => {
		// The invariant the rows are allowed to differ underneath: whatever a
		// language prefers, the chain can always answer, because English is the
		// only language the whole corpus exists in and Latin is complete
		// wherever it exists. A row that dropped them would strand its readers.
		for (const [lang, chain] of Object.entries(CONTENT_LANG_FALLBACK)) {
			expect(chain.slice(-2), `${lang} does not end in English then Latin`).toEqual(['en', 'la']);
		}
	});

	it('sends a reader to a near language before a far one', () => {
		// A Spanish reader has no Spanish Catechism in the fixtures. Portuguese
		// and English both have one, and Portuguese is the one they can read —
		// which is the whole point of the row and was English until 2026-08-26.
		expect(editionInLang(listEditions('catechism'), 'es')?.id).toBe('ccc.pt');
	});

	it('routes Malagasy through French, the language the Church there works in', () => {
		expect(resolveEditionTag(['en', 'fr', 'la'], 'mg')).toBe('fr');
	});

	it('falls through a neighbour that does not have the address', () => {
		// No French Summa exists, so `mg`'s row runs on to its tail rather than
		// stopping at the neighbour.
		expect(defaultWorkId('summa', 'mg')).toBe('summa.en');
	});

	it('gives an unlisted language the tail alone', () => {
		// A language ingested before its row is written degrades to the global
		// behaviour this table replaced, not to nothing.
		expect(editionInLang(listEditions('catechism'), 'zz')?.id).toBe('ccc.en');
	});

	it('names only editions that exist', () => {
		for (const [key, id] of Object.entries(PREFERRED_EDITION)) {
			const [type, lang] = key.split(':');
			const editions = listEditions(type as Parameters<typeof listEditions>[0]);
			const named = editions.find((w) => w.id === id);
			expect(named, `${key} names ${id}, which is not an edition`).toBeDefined();
			expect(baseLang(named!.language), `${key} names an edition in another language`).toBe(lang);
		}
	});

	it('leaves no two editions of one language tag undecided', () => {
		// The accident this whole table exists to prevent: a second edition
		// arrives in a language that already has one, nobody states which wins,
		// and the answer becomes alphabetical. Regional pairs are exempt —
		// DEFAULT_REGION decides those, and their tags differ.
		for (const type of ['bible', 'catechism', 'compendium', 'prayer', 'summa'] as const) {
			const byTag = new Map<string, string[]>();
			for (const w of listEditions(type)) {
				const tag = w.language.toLowerCase();
				byTag.set(tag, [...(byTag.get(tag) ?? []), w.id]);
			}
			for (const [tag, ids] of byTag) {
				if (ids.length < 2) continue;
				expect(
					PREFERRED_EDITION[`${type}:${baseLang(tag)}`],
					`${ids.length} editions share ${type}/${tag} (${ids.join(', ')}) with nothing to choose between them`
				).toBeDefined();
			}
		}
	});
});

describe('regional editions', () => {
	// `prayer.common.en-gb` is the five prayers the source heads "UK VERSION";
	// `prayer.common.en` is the collection (docs/decisions.md §Addresses and editions).
	const PRAYERS = { en: 28, 'en-gb': 5, la: 21, pt: 28 };

	it('measures completeness within a base language, not across the corpus', () => {
		// `la` is complete: 21 is every prayer the source prints Latin for, and
		// nothing else is in Latin to be fuller than it. `en-gb` is not: `en` is.
		expect(completeEditionTags(PRAYERS).sort()).toEqual(['en', 'la', 'pt']);
	});

	it('leaves an unmarked edition complete even when a regional one ties it', () => {
		// Two English editions of equal size are two whole books, and both index.
		expect(completeEditionTags({ en: 28, 'en-gb': 28 }).sort()).toEqual(['en', 'en-gb']);
	});

	it('resolves a regional preference to itself where it has the address', () => {
		expect(resolveEditionTag(['en', 'en-gb', 'la', 'pt'], 'en-GB')).toBe('en-gb');
	});

	it("falls back to the base language's unmarked edition where it does not", () => {
		// The Our Father: no UK wording exists, so the reader gets the one text
		// the source prints — not `pt`, and not by id sort order.
		expect(resolveEditionTag(['en', 'la', 'pt'], 'en-GB')).toBe('en');
	});

	it('names only the marked edition after its region', () => {
		expect(languageDisplayName('en')).toBe('English');
		expect(languageDisplayName('en-GB')).toBe('English (UK)');
	});

	it('names a content language the interface is not written in', () => {
		// The pairing that let this table fall a language behind `ContentLang`:
		// `mg` is content-only, so nothing in the language switch would ever
		// have shown it missing, and an unnamed tag degrades to itself — the
		// Catechism's Malagasy edition named itself "mg" in the edition menu.
		expect(languageDisplayName('mg')).toBe('Malagasy');
	});
});
