import { describe, expect, it, vi } from 'vitest';
import {
	expandIbidem,
	glossOf,
	linkifyProse,
	normalizeCitationSpacing,
	parseRefs,
	refHref,
	type RefSegment
} from './refs';
import { bookAbbrev, citesVulgateNumbering, hasBookAbbrevs } from './refs-grammar';

const CANON_OT =
	`gen exod lev num deut josh judg ruth 1sam 2sam 1kgs 2kgs 1chr 2chr ezra neh tob jdt
	esth 1macc 2macc job ps prov eccl song wis sir isa jer lam bar ezek dan hos joel amos obad
	jonah mic nah hab zeph hag zech mal`.split(/\s+/);
const CANON_NT = `matt mark luke john acts rom 1cor 2cor gal eph phil col 1thess 2thess 1tim 2tim
	titus phlm heb jas 1pet 2pet 1john 2john 3john jude rev`.split(/\s+/);

/**
 * `refHref`'s divergent-book tests (Psalms/Malachi/Joel) below need Bible
 * book data for `ps`/`mal`/`joel` — but `corpus.ts` (owned by another
 * agent's restructuring work, not touched here) only wires `gen`/`john`
 * fixtures into its registry, and its per-file fixture imports aren't
 * something this file can extend without editing `corpus.ts`. Rather than
 * touch a file outside this task's scope, `./corpus` is mocked here with a
 * small synthetic registry: `gen`/`john` reproduce exactly the shape the
 * pre-existing tests below already depend on (so those tests are unchanged
 * and unaffected), and `ps`/`mal`/`joel` use the real corpus-verified verse
 * counts from `versification.test.ts` (Vulg Ps 9 = 39 verses, Ps 113 = 26,
 * Ps 114 = 9, Ps 115 = 10, Ps 146 = 11, Ps 147 = 9; Malachi 1-4 =
 * 14/17/18/6; Joel 1-3 = 20/32/21 — see that file's ground-truth table and
 * versification.ts's docblock for where these numbers come from).
 */
const { mockBibleBooks } = vi.hoisted(() => {
	function makeChapters(counts: Record<number, number>) {
		return Object.entries(counts).map(([n, verseCount]) => ({
			n: Number(n),
			verses: Array.from({ length: verseCount }, (_, i) => ({ n: i + 1, text: `v${i + 1}` }))
		}));
	}
	const books: Record<string, Record<string, unknown>> = {
		'bible.cpdv.en': {
			gen: {
				osis: 'gen',
				name: 'Genesis',
				abbrevs: ['gen'],
				order: 1,
				chapters: makeChapters({ 1: 13 })
			},
			john: {
				osis: 'john',
				name: 'John',
				abbrevs: ['john', 'jn'],
				order: 43,
				chapters: makeChapters({ 1: 51, 3: 36 })
			},
			ps: {
				osis: 'ps',
				name: 'Psalms',
				abbrevs: ['ps', 'psalm', 'psalms'],
				order: 23,
				// 10, 102 and 103 are here for the Vulgate-numbering works below:
				// 102/103 are the pair Haydock's `Ps. ciii. 3` lands between, and
				// Vulg Ps 10 (8 verses, against Hebrew Ps 10's 18) is what makes
				// the residue case fail to exist rather than resolve wrongly.
				// Real CPDV counts throughout.
				chapters: makeChapters({
					1: 6,
					9: 39,
					10: 8,
					21: 32,
					50: 21,
					102: 22,
					103: 35,
					113: 26,
					114: 9,
					115: 10,
					146: 11,
					147: 9
				})
			},
			mal: {
				osis: 'mal',
				name: 'Malachi',
				abbrevs: ['mal', 'malachi'],
				order: 46,
				chapters: makeChapters({ 1: 14, 2: 17, 3: 18, 4: 6 })
			},
			joel: {
				osis: 'joel',
				name: 'Joel',
				abbrevs: ['joel'],
				order: 36,
				chapters: makeChapters({ 1: 20, 2: 32, 3: 21 })
			}
		}
	};
	return { mockBibleBooks: books };
});

/**
 * Fake document registry for `refHref`'s document-linking tests. Three shapes,
 * because three things can be true of a citation's target: available in both
 * EN/PT ("gaudium-et-spes", mirroring the real `vatii.gaudium-et-spes.{en,pt}`
 * pair — section 19 stands in for the real corpus's own GS §19, the CCC 27
 * citation `docs/link-surface.md` predicted this feature would resolve); in
 * the reader's language but SHORT a section ("dei-verbum", whose PT edition
 * stops at 1, the one case that must still refuse the anchor); and in no
 * reader language at all ("sacrosanctum-concilium", EN-only — which links
 * anyway, through the edition opening the document would give them).
 */
const mockDocumentSections: Record<string, Partial<Record<string, number[]>>> = {
	'gaudium-et-spes': { en: [1, 2, 19, 20], pt: [1, 2, 19, 20] },
	'dei-verbum': { en: [1, 2, 3], pt: [1] },
	// Present so the per-language sigla tests below can prove that `SC` and
	// `CA` reach a real document from the German/Spanish/French tables and
	// stay unlinked from the Latin/Italian one, which is the whole point of
	// splitting those two entries.
	'sacrosanctum-concilium': { en: [5, 61] },
	'centesimus-annus': { en: [25, 48] },
	// Added for the prose-siglum tests: LG is the siglum the four editions
	// that print sigla in prose use most (850 occurrences), and AA is the one
	// that collides with the Summa's own "articles" shorthand.
	'lumen-gentium': { en: [12, 20, 30, 56], de: [12, 20, 30, 56] },
	'apostolicam-actuositatem': { en: [2, 3] },
	// An apostolic exhortation, present because the exhortation sigla carried
	// an expansion and no slug until 2026-09-02 — the table said the corpus
	// held no exhortation family long after the sweep that ingested 33.
	'familiaris-consortio': { en: [16, 84] }
};

/**
 * Titles for the by-title document matcher. Deliberately mirrors the real
 * corpus's exclusion rules so the tests exercise them: "Humani Generis" is
 * multi-word and unambiguous (so it resolves), while "Mysterium" is
 * single-word (so it must NOT, even though a citation naming "Mysterium
 * Fidei" would otherwise match it — that was a real false positive found
 * against the corpus).
 */
const mockDocumentTitles: Record<string, string> = {
	'gaudium-et-spes': 'Gaudium et Spes',
	'dei-verbum': 'Dei Verbum',
	'humani-generis': 'Humani Generis',
	mysterium: 'Mysterium',
	'sacrosanctum-concilium': 'Sacrosanctum Concilium',
	'centesimus-annus': 'Centesimus Annus',
	'lumen-gentium': 'Lumen Gentium',
	'apostolicam-actuositatem': 'Apostolicam Actuositatem',
	'familiaris-consortio': 'Familiaris Consortio'
};

vi.mock('./corpus', () => ({
	findBookByAbbrev: (workId: string, abbrev: string) =>
		mockBibleBooks[workId]?.[abbrev.toLowerCase()],
	workIdToEdition: (workId: string) => workId.replace(/^bible\./, ''),
	listDocuments: () =>
		Object.entries(mockDocumentTitles).map(([slug, title]) => {
			const byLang = mockDocumentSections[slug] ?? { en: [] };
			const manifests: Record<string, { id: string; title: string }> = {};
			for (const lang of Object.keys(byLang)) {
				manifests[lang] = { id: `vatii.${slug}.${lang}`, title };
			}
			// A document with no sections entry still needs a manifest, or the
			// title index would silently skip it and the exclusion tests below
			// would pass for the wrong reason.
			if (Object.keys(manifests).length === 0) manifests.en = { id: `vatii.${slug}.en`, title };
			return { slug, family: 'vatii', manifests };
		}),
	// Mirrors `editionInLang`'s chain closely enough for these tests: the
	// reader's own language, then English, then Latin, then whatever exists.
	defaultDocumentWorkId: (slug: string, lang: string) => {
		const langs = Object.keys(mockDocumentSections[slug] ?? {});
		const pick = [lang, 'en', 'la'].find((l) => langs.includes(l)) ?? langs[0];
		return pick ? `vatii.${slug}.${pick}` : undefined;
	},
	getDocumentGroup: (slug: string) => {
		const byLang = mockDocumentSections[slug];
		if (!byLang) return undefined;
		const manifests: Record<string, { id: string }> = {};
		for (const lang of Object.keys(byLang)) manifests[lang] = { id: `vatii.${slug}.${lang}` };
		return { slug, family: 'vatii', manifests };
	},
	documentSectionExists: (workId: string, n: number) => {
		const m = /^vatii\.([a-z-]+)\.([a-z]+)$/.exec(workId);
		if (!m) return false;
		const [, slug, lang] = m;
		return mockDocumentSections[slug]?.[lang]?.includes(n) ?? false;
	}
}));

/** Convenience: just the non-text segments, dropping `raw`/`text` noise for terse assertions. */
function kinds(segs: RefSegment[]) {
	return segs.map((s) => s.kind);
}

describe('parseRefs — citation-clause grammar (EN)', () => {
	it('parses the contract example: scripture, scripture, document, interleaved with text', () => {
		const segs = parseRefs('Cf. Gen 9:16; Lk 21:24; DV 3.');
		expect(segs).toEqual([
			{ kind: 'text', text: 'Cf. ' },
			{ kind: 'scripture', osis: 'gen', chapter: 9, verses: [16], cf: true, raw: 'Gen 9:16' },
			{ kind: 'text', text: '; ' },
			{ kind: 'scripture', osis: 'luke', chapter: 21, verses: [24], raw: 'Lk 21:24' },
			{ kind: 'text', text: '; ' },
			{
				kind: 'document',
				via: 'siglum',
				label: 'DV',
				locus: '3',
				expansion: expect.stringContaining('Dei Verbum'),
				slug: 'dei-verbum',
				raw: 'DV 3'
			},
			{ kind: 'text', text: '.' }
		]);
	});

	it('applies "Cf." to a clause and to bookless continuation clauses that inherit its book', () => {
		const segs = parseRefs('Cf. Acts 2:41; 8:12-13; 10:48; 16:15.');
		const refs = segs.filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: 'acts', chapter: 2, verses: [41], cf: true, raw: 'Acts 2:41' },
			{ kind: 'scripture', osis: 'acts', chapter: 8, verses: [12, 13], cf: true, raw: '8:12-13' },
			{ kind: 'scripture', osis: 'acts', chapter: 10, verses: [48], cf: true, raw: '10:48' },
			{ kind: 'scripture', osis: 'acts', chapter: 16, verses: [15], cf: true, raw: '16:15' }
		]);
	});

	it('scopes "cf." to only the clause that carries it', () => {
		const segs = parseRefs('Jn 3:16; cf. 1 Jn 4:9.');
		const refs = segs.filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' },
			{ kind: 'scripture', osis: '1john', chapter: 4, verses: [9], cf: true, raw: '1 Jn 4:9' }
		]);
	});

	it('a clause introducing its own book resets cf scope (documented ambiguity, ported as-is from xrefs.py)', () => {
		// "Cf." grammatically reads as scoping all three refs, but the ported
		// grammar only extends it to the clause it's attached to plus bookless
		// continuations — see the module docblock and xrefs.py's docstring.
		const segs = parseRefs('Cf. Gen 9:16; Lk 21:24.');
		const refs = segs.filter(
			(s): s is Extract<RefSegment, { kind: 'scripture' }> => s.kind === 'scripture'
		);
		expect(refs[0].cf).toBe(true);
		expect(refs[1].cf).toBeUndefined();
	});

	it('emits an empty-array whole-chapter reference', () => {
		const segs = parseRefs('Ps 22.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'ps',
			chapter: 22,
			verses: [],
			raw: 'Ps 22'
		});
	});

	it('strips a verse-subdivision letter', () => {
		const segs = parseRefs('Mt 5:3a.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'matt',
			chapter: 5,
			verses: [3],
			raw: 'Mt 5:3a'
		});
	});

	it('chains dot-separated additional verses', () => {
		const segs = parseRefs('Jn 3:16.21.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'john',
			chapter: 3,
			verses: [16, 21],
			raw: 'Jn 3:16.21'
		});
	});

	it('accepts a bare-space chapter/verse split (dropped colon)', () => {
		const segs = parseRefs('Mk 10 14.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'mark',
			chapter: 10,
			verses: [14],
			raw: 'Mk 10 14'
		});
	});

	it('accepts the verified comma separator in Vatican’s English Rosary citation', () => {
		expect(parseRefs('Mt 27,26.')).toContainEqual({
			kind: 'scripture',
			osis: 'matt',
			chapter: 27,
			verses: [26],
			raw: 'Mt 27,26'
		});
	});

	it('recognizes a roman-numeral book-number prefix', () => {
		const segs = parseRefs('cf. I Cor 9:22; I Pt 2:2');
		const refs = segs.filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: '1cor', chapter: 9, verses: [22], cf: true, raw: 'I Cor 9:22' },
			{ kind: 'scripture', osis: '1pet', chapter: 2, verses: [2], raw: 'I Pt 2:2' }
		]);
	});

	it('drops an implausible chapter number from a dropped-colon typo rather than guessing', () => {
		const segs = parseRefs('Cf. Eph 314.');
		expect(segs.some((s) => s.kind === 'scripture')).toBe(false);
		// The junk stays as plain text — nothing is silently discarded.
		expect(segs.map((s) => (s.kind === 'text' ? s.text : '')).join('')).toContain('Eph 314');
	});

	it('recognizes the lowercase-L-for-1 typo', () => {
		const segs = parseRefs('l Cor 13:12.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: '1cor',
			chapter: 13,
			verses: [12],
			raw: 'l Cor 13:12'
		});
	});

	it('recognizes the "In" typo for "Jn"', () => {
		const segs = parseRefs('In 17:3.');
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'john',
			chapter: 17,
			verses: [3],
			raw: 'In 17:3'
		});
	});

	it('recognizes all-caps PS/EX variants', () => {
		expect(parseRefs('PS 118:22.')).toContainEqual({
			kind: 'scripture',
			osis: 'ps',
			chapter: 118,
			verses: [22],
			raw: 'PS 118:22'
		});
		expect(parseRefs('EX 3:6.')).toContainEqual({
			kind: 'scripture',
			osis: 'exod',
			chapter: 3,
			verses: [6],
			raw: 'EX 3:6'
		});
	});

	it('a book-shaped false lead does not block a later real ref in the same clause', () => {
		const segs = parseRefs('St. Ignatius of Antioch, Ad Eph. 19, 1: AF 11/2 76-80: cf. I Cor 2:8.');
		const refs = segs.filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: '1cor', chapter: 2, verses: [8], cf: true, raw: 'I Cor 2:8' }
		]);
	});

	// The pre-conciliar printers' punctuation: the book, a comma, then a Roman
	// chapter. `I Cor. XII, 13` always resolved and `I Cor., XII, 13` never
	// did — one comma, and it was the whole scripture apparatus of the older
	// encyclicals. See `BOOK_CHAPTER_GAP_RE`.
	it('reads a comma between the book name and its chapter', () => {
		for (const [text, osis, chapter, verses] of [
			['I Cor., XII, 13.', '1cor', 12, [13]],
			['Acts, XX, 28.', 'acts', 20, [28]],
			['Col., I, 18.', 'col', 1, [18]],
			['Matth., XVI, 18.', 'matt', 16, [18]],
			['John, III, 16.', 'john', 3, [16]],
			// Arabic too — the comma was the defect, not the numeral.
			['Rom., 12, 5.', 'rom', 12, [5]]
		] as const) {
			const match = parseRefs(text).find((s) => s.kind === 'scripture');
			expect(match, text).toBeTruthy();
			expect([match!.osis, match!.chapter, match!.verses], text).toEqual([osis, chapter, verses]);
		}
	});

	// `MAX_CHAPTER` used to hide this: Ignatius's `Ad Eph. 19` is refused only
	// because Ephesians stops at 6, and `Ad Rom. 6` — a chapter Romans really
	// has — went straight through. See `PATRISTIC_LETTER_RE`.
	it('does not read a patristic letter TO a church as the epistle to it', () => {
		for (const text of [
			'St. Ignatius of Antioch, Ad Rom. 6, 1-2: Apostolic Fathers, II/2, 217-220.',
			'St. Ignatius of Antioch, Ad Rom., 6, 1-2: Apostolic Fathers, II/2, 217-220.',
			'Ad Rom., 7: PG 5, 694.',
			'St. Clement of Rome, Ad Cor. 42, 44: PG 1, 291-300.',
			'S. Clem. Rom., 1. c., 42, 3-4.'
		]) {
			expect(
				parseRefs(text).some((s) => s.kind === 'scripture'),
				text
			).toBe(false);
		}
	});

	it('resolves an apostolic exhortation siglum to its ingested slug', () => {
		expect(parseRefs('Cf. FC 16.')).toContainEqual(
			expect.objectContaining({ kind: 'document', label: 'FC', slug: 'familiaris-consortio' })
		);
	});

	it("treats a single-chapter book's bare number as a verse, not a chapter", () => {
		for (const [text, osis, chapter, verses] of [
			['LG 12; cf. Jude 3.', 'jude', 1, [3]],
			['I Tim 3:15; Jude 3.', 'jude', 1, [3]],
			['Cf. I Jn 4:2-3; 2 Jn 7.', '2john', 1, [7]],
			['Cf. Jn 3:18; Acts 2:21; 5:41; 3 Jn 7; Rom 10:6-13.', '3john', 1, [7]],
			['Philem 16.', 'phlm', 1, [16]]
		] as const) {
			const refs = parseRefs(text).filter(
				(s): s is Extract<RefSegment, { kind: 'scripture' }> => s.kind === 'scripture'
			);
			const match = refs.find((r) => r.osis === osis);
			expect(match, text).toBeTruthy();
			expect([match!.chapter, match!.verses]).toEqual([chapter, verses]);
		}
	});

	it('parses a verse range on a single-chapter book', () => {
		const segs = parseRefs('Cf. Eph 1:3-14; Rom 16:25-27; Eph 3:20-21; Jude 24-25.');
		const jude = segs.find((s) => s.kind === 'scripture' && s.osis === 'jude');
		expect(jude).toMatchObject({ chapter: 1, verses: [24, 25] });
	});

	it('parses a document siglum with a locus and expansion, resolved to its ingested slug', () => {
		const segs = parseRefs('GS 19 # 1.');
		expect(segs).toContainEqual(
			expect.objectContaining({
				kind: 'document',
				label: 'GS',
				locus: '19 # 1',
				slug: 'gaudium-et-spes',
				raw: 'GS 19 # 1'
			})
		);
	});

	it('recognizes a document siglum with no ingested slug behind it (DS is not in the corpus)', () => {
		const segs = parseRefs('Cf. Council of Trent (1546): DS 1514; cf. Col 1:12-14.');
		const ds = segs.find((s) => s.kind === 'document' && s.label === 'DS');
		expect(ds).toMatchObject({ slug: null });
	});

	it('keeps unrecognized document-shaped prose entirely as text, no data lost', () => {
		const text = 'St. Augustine, Sermo 241, 2: PL 38, 1134,';
		const segs = parseRefs(text);
		expect(segs.some((s) => s.kind === 'scripture')).toBe(false);
		expect(segs.some((s) => s.kind === 'document' && s.label === 'PL')).toBe(true);
		// Reassembling every segment's text/raw must reproduce the original string.
		const reassembled = segs.map((s) => (s.kind === 'text' ? s.text : s.raw)).join('');
		expect(reassembled).toBe(text);
	});

	it('reproduces the exact original string across text + raw for a variety of citations', () => {
		const samples = [
			'Cf. Gen 9:16; Lk 21:24; DV 3.',
			'Cf. Acts 2:41; 8:12-13; 10:48; 16:15.',
			'Roman Missal, EP I (Roman Canon) 88.',
			'Cf. Council of Trent (1546): DS 1514; cf. Col 1:12-14.',
			'Vatican Council II, GS 19 # 1.'
		];
		for (const s of samples) {
			const segs = parseRefs(s);
			expect(segs.map((seg) => (seg.kind === 'text' ? seg.text : seg.raw)).join('')).toBe(s);
		}
	});
});

describe('parseRefs — citation-clause grammar (PT)', () => {
	it('parses the PT comma chapter/verse separator', () => {
		const segs = parseRefs('Cf. Act 2, 42.', { lang: 'pt' });
		expect(segs).toContainEqual({
			kind: 'scripture',
			osis: 'acts',
			chapter: 2,
			verses: [42],
			cf: true,
			raw: 'Act 2, 42'
		});
	});

	it('resolves "Jn" to Jonah and "Jo" to John — the reverse of the English convention', () => {
		expect(parseRefs('Cf. Jn 1, 3.', { lang: 'pt' })).toContainEqual({
			kind: 'scripture',
			osis: 'jonah',
			chapter: 1,
			verses: [3],
			cf: true,
			raw: 'Jn 1, 3'
		});
		expect(parseRefs('Cf. Jo 1, 3.', { lang: 'pt' })).toContainEqual({
			kind: 'scripture',
			osis: 'john',
			chapter: 1,
			verses: [3],
			cf: true,
			raw: 'Jo 1, 3'
		});
	});

	it('resolves "Job" (unabbreviated, matching the English form)', () => {
		expect(parseRefs('Cf. Job 42, 3.', { lang: 'pt' })).toContainEqual({
			kind: 'scripture',
			osis: 'job',
			chapter: 42,
			verses: [3],
			cf: true,
			raw: 'Job 42, 3'
		});
	});

	it('chains a dot-separated additional verse and a bookless continuation clause', () => {
		const segs = parseRefs('Cf. Mt 1, 20; 2, 13.19.', { lang: 'pt' });
		const refs = segs.filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: 'matt', chapter: 1, verses: [20], cf: true, raw: 'Mt 1, 20' },
			{ kind: 'scripture', osis: 'matt', chapter: 2, verses: [13, 19], cf: true, raw: '2, 13.19' }
		]);
	});

	it('recognizes the observed numbered-book and typo variants', () => {
		expect(parseRefs('Cf. 1Ts 4, 7.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: '1thess' })
		);
		expect(parseRefs('Cf. I Cor 1, 18.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: '1cor' })
		);
		expect(parseRefs('Cf. Dr 18, 10.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: 'deut' })
		);
		expect(parseRefs('e também Is 49, 1-6; Mr 3, 17.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: 'mark' })
		);
	});

	it('handles PT archive punctuation around an otherwise ordinary biblical locus', () => {
		expect(parseRefs('1 Cor, 13, 12.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: '1cor',
				chapter: 13,
				verses: [12],
				raw: '1 Cor, 13, 12'
			})
		);
		expect(parseRefs('Fl . 3, 8.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'phil',
				chapter: 3,
				verses: [8],
				raw: 'Fl . 3, 8'
			})
		);
	});

	it('tolerates a space before the chapter/verse separator', () => {
		expect(parseRefs('Cf. Mc 1 , 11.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'mark',
				chapter: 1,
				verses: [11],
				raw: 'Mc 1 , 11'
			})
		);
	});

	it('reads the archive\'s "." for "," as a chapter/verse separator', () => {
		expect(parseRefs('Cf. Sl 19. 2.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'ps',
				chapter: 19,
				verses: [2],
				raw: 'Sl 19. 2'
			})
		);
	});

	it('leaves a trailing full stop outside the reference rather than reading it as an empty separator', () => {
		const segs = parseRefs('Cf. Ez 36.', { lang: 'pt' });
		expect(segs).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'ezek',
				chapter: 36,
				verses: [],
				raw: 'Ez 36'
			})
		);
		expect(segs).toContainEqual({ kind: 'text', text: '.' });
	});

	it('reads a lowercase "l" standing in for the digit 1 inside a locus', () => {
		expect(parseRefs('Cf. Act 4, l2.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: 'acts', chapter: 4, verses: [12] })
		);
	});

	it('matches a book abbreviation glued to its chapter number', () => {
		expect(parseRefs('Jo14, 16-17', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'john',
				chapter: 14,
				verses: [16, 17],
				raw: 'Jo14, 16-17'
			})
		);
		expect(parseRefs('canon 1: DS1511.', { lang: 'pt' })).toContainEqual(
			expect.objectContaining({ kind: 'document', label: 'DS', locus: '1511' })
		);
	});

	it('splits clauses on ":" as well as ";" — the archive drifts between the two', () => {
		const refs = parseRefs('Cf. Ex 34, 28: Dt 4, 13: 10, 4.', { lang: 'pt' }).filter(
			(s) => s.kind === 'scripture'
		);
		expect(refs).toEqual([
			{ kind: 'scripture', osis: 'exod', chapter: 34, verses: [28], cf: true, raw: 'Ex 34, 28' },
			{ kind: 'scripture', osis: 'deut', chapter: 4, verses: [13], raw: 'Dt 4, 13' },
			{ kind: 'scripture', osis: 'deut', chapter: 10, verses: [4], raw: '10, 4' }
		]);
	});

	it('keeps scanning a clause after a matched reference, so a comma-joined second one still links', () => {
		const refs = parseRefs('Heb 10, 5-7, citando o Sl 40. 7-9, segundo os LXX', {
			lang: 'pt'
		}).filter((s) => s.kind === 'scripture');
		expect(refs).toEqual([
			{ kind: 'scripture', osis: 'heb', chapter: 10, verses: [5, 6, 7], raw: 'Heb 10, 5-7' },
			{ kind: 'scripture', osis: 'ps', chapter: 40, verses: [7, 8, 9], raw: 'Sl 40. 7-9' }
		]);
	});

	it('does not treat "Cat Rom" (Catechismus Romanus) as the Letter to the Romans', () => {
		const segs = parseRefs('Cat Rom 1, 10, 24, p. 119.', { lang: 'pt' });
		expect(segs.some((s) => s.kind === 'scripture' && s.osis === 'rom')).toBe(false);
	});

	it('recognizes the PT-specific document siglum meaning (SC = Sources Chrétiennes, not Sacrosanctum Concilium) and never resolves it to a slug', () => {
		const segs = parseRefs('Santo Ireneu de Lião, Adversus haereses I. 10, 1-2: SC 264, 154-158.', {
			lang: 'pt'
		});
		const doc = segs.find((s) => s.kind === 'document' && s.label === 'SC') as
			Extract<RefSegment, { kind: 'document' }> | undefined;
		expect(doc).toBeTruthy();
		expect(doc?.expansion).toContain('Sources Chrétiennes');
		// PT's config never maps ANY siglum to a slug (DOCUMENT_SLUGS_EN's own
		// docblock) — critically including "SC", which in EN IS a linkable
		// document (Sacrosanctum Concilium). A shared/leaky slug table here
		// would silently mislink this PT patristics citation into the
		// conciliar constitution; `slug: null` (and, in the `refHref` describe
		// block below, an actually-unlinked href) is what proves it doesn't.
		expect(doc?.slug).toBeNull();
	});
});

// Every case below is a string the corpus actually prints, with the paragraph
// it comes from named — the tables were derived from those strings, so a test
// invented from a style guide would be testing the wrong thing.
describe('parseRefs — the six editions added 2026-08-26', () => {
	it('reads each edition’s own name for John, none of which is the English one', () => {
		const cases: [string, string, string][] = [
			['it', 'Gv 11,52', 'Gv'],
			['la', 'Io 11,52', 'Io'],
			['mg', 'Jo 11,52', 'Jo'],
			['fr', 'Jn 11, 52', 'Jn'],
			['es', 'Jn 11,52', 'Jn'],
			['de', 'Joh 11,52', 'Joh']
		];
		for (const [lang, raw, form] of cases) {
			expect(parseRefs(raw, { lang })).toContainEqual({
				kind: 'scripture',
				osis: 'john',
				chapter: 11,
				verses: [52],
				raw
			});
			expect(form).toBeTruthy();
		}
	});

	it('reads a numbered book that the English table made resolve to the Gospel', () => {
		// ccc.de §91, ccc.la §91: "1 Joh 2,20.27" / "1 Io 2,20.27". Neither
		// base is in `BOOK_VARIANTS_EN`'s numbered forms, so the bare `Joh` /
		// `Io` matched and every First-John citation in both editions landed
		// on John — 120 and 138 of them.
		expect(parseRefs('Cf 1 Io 2,20.27.', { lang: 'la' })).toContainEqual({
			kind: 'scripture',
			osis: '1john',
			chapter: 2,
			verses: [20, 27],
			cf: true,
			raw: '1 Io 2,20.27'
		});
		expect(parseRefs('Vgl. 1 Joh 2,20.27.', { lang: 'de' })).toContainEqual({
			kind: 'scripture',
			osis: '1john',
			chapter: 2,
			verses: [20, 27],
			raw: '1 Joh 2,20.27'
		});
	});

	it('reads the German mirror’s `Job` as John, and `Ijob` as Job', () => {
		// ccc.de §363 prints "Mt 26,38; Job 12,27" — Jn 12:27 beside Mt 26:38
		// — and §223 prints "Ijob 36,26". The h/b confusion is this Word
		// export's, on all 73 occurrences; under the English table they were
		// links to the book of Job.
		expect(parseRefs('Vgl. Job 12,27.', { lang: 'de' })).toContainEqual({
			kind: 'scripture',
			osis: 'john',
			chapter: 12,
			verses: [27],
			raw: 'Job 12,27'
		});
		expect(parseRefs('Ijob 36,26.', { lang: 'de' })).toContainEqual({
			kind: 'scripture',
			osis: 'job',
			chapter: 36,
			verses: [26],
			raw: 'Ijob 36,26'
		});
	});

	it('reads "Gl" as Joel in Italian and as Galatians in Portuguese', () => {
		// ccc.it §715 ends "Ger 31,31-34; Gl 3,1-5" — Joel 3. The same two
		// letters are Galatians in the Portuguese table, which is why these
		// tables are never merged.
		expect(parseRefs('Gl 3,1-5.', { lang: 'it' })).toContainEqual({
			kind: 'scripture',
			osis: 'joel',
			chapter: 3,
			verses: [1, 2, 3, 4, 5],
			raw: 'Gl 3,1-5'
		});
		expect(parseRefs('Gl 3, 1.', { lang: 'pt' })).toContainEqual({
			kind: 'scripture',
			osis: 'gal',
			chapter: 3,
			verses: [1],
			raw: 'Gl 3, 1'
		});
	});

	it('keeps "SC" a patristic series in Latin and Italian, and the constitution elsewhere', () => {
		// ccc.la §53: "Adversus haereses, 3, 20, 2: SC 211, 392 (PG 7, 944)"
		// — Sources chrétiennes volume 211, page 392, which the English table
		// read as Sacrosanctum Concilium §211. 54 Latin and 55 Italian
		// citations carried a number that constitution really has.
		for (const lang of ['la', 'it']) {
			const doc = parseRefs('SC 211, 392.', { lang }).find((s) => s.kind === 'document');
			expect(doc?.label).toBe('SC');
			expect(doc?.expansion).toBe('Sources chrétiennes');
			expect(doc?.slug).toBeNull();
		}
		for (const lang of ['fr', 'es', 'de']) {
			const doc = parseRefs('SC 5.', { lang }).find((s) => s.kind === 'document');
			expect(doc?.expansion).toBe('Sacrosanctum concilium');
			expect(doc?.slug).toBe('sacrosanctum-concilium');
		}
	});

	it('keeps "CA" the encyclical in French and the patristic corpus in Latin', () => {
		// ccc.fr §2431 "(CA 48)" against ccc.la §160 "Apologia, 1, 61: CA 1,
		// 168" — the second collision the Latin edition's own sigla table
		// settles.
		expect(parseRefs('CA 48.', { lang: 'fr' }).find((s) => s.kind === 'document')?.slug).toBe(
			'centesimus-annus'
		);
		const la = parseRefs('CA 1, 168.', { lang: 'la' }).find((s) => s.kind === 'document');
		expect(la?.expansion).toBe('Corpus apologetarum Christianorum saeculi secundi');
		expect(la?.slug).toBeNull();
	});

	it('reads the Malagasy edition’s translated conciliar sigla', () => {
		// ccc.mg §87 "jer. FF 20" is Lumen gentium 20 — this edition
		// translates the conciliar sigla (FF, FAA, FA, EK) and keeps the
		// papal ones (CA, CT, RM, SRS) as they are.
		expect(
			parseRefs('jer. FF 20.', { lang: 'mg' }).find((s) => s.kind === 'document')
		).toMatchObject({ label: 'FF', expansion: 'Lumen gentium' });
		expect(parseRefs('FAA 19, § 1.', { lang: 'mg' }).find((s) => s.kind === 'document')?.slug).toBe(
			'gaudium-et-spes'
		);
		expect(parseRefs('jer. FA 6.', { lang: 'mg' }).find((s) => s.kind === 'document')?.slug).toBe(
			'dei-verbum'
		);
		expect(parseRefs('jer. CA 25.', { lang: 'mg' }).find((s) => s.kind === 'document')?.slug).toBe(
			'centesimus-annus'
		);
	});

	it('does not read a patristic work title as a book', () => {
		// "Sermo 241, 2", "Ed. Leon. 4, 31" and "Oratio 40, 9" shape exactly
		// like a chapter/verse locator and are the bulk of what these
		// apparatus print. The Fathers are not ingested; leaving them as text
		// is the module's under-link-rather-than-guess rule.
		for (const lang of ['it', 'la', 'fr', 'es', 'de', 'mg']) {
			for (const raw of ['Sermo 241, 2.', 'Oratio 40, 9.', 'Enarratio in Psalmum 103, 4, 1.']) {
				expect(parseRefs(raw, { lang }).some((s) => s.kind === 'scripture')).toBe(false);
			}
		}
	});

	it('falls back to English for a language with no table of its own', () => {
		// `hu`, `ro`, `sl`, `sv` hold the Compendium and nothing else, and its
		// `ccc_refs` are bare numbers no book table touches. `en-gb` is
		// English by prefix.
		expect(parseRefs('279-289, 296-298', { lang: 'sv' })).toContainEqual({
			kind: 'ccc',
			n: 279,
			raw: '279'
		});
		expect(parseRefs('Jn 3:16', { lang: 'en-gb' })).toContainEqual({
			kind: 'scripture',
			osis: 'john',
			chapter: 3,
			verses: [16],
			raw: 'Jn 3:16'
		});
	});
});

describe('linkifyProse — the six editions added 2026-08-26', () => {
	it('links a Scripture locator inside running prose in each of them', () => {
		// These three editions fold every reference into the text instead of
		// printing footnotes (docs/corpus-schema.md §Catechism), so prose is
		// where all of their references live.
		const cases: [string, string, string, number][] = [
			['fr', 'les nations de la terre " (Gn 12, 3 LXX; cf. Ga 3, 8).', 'gal', 3],
			['es', 'todas las naciones de la tierra" (Gn 12,3; cf. Ga 3,8).', 'gal', 3],
			['de', 'Erdgeschlechter Segen erlangen" (Gen 12,3) [Vgl. Gal 3,8.]', 'gal', 3]
		];
		for (const [lang, text, osis, chapter] of cases) {
			const segs = linkifyProse(text, { lang });
			expect(
				segs.some((s) => s.kind === 'scripture' && s.osis === osis && s.chapter === chapter)
			).toBe(true);
		}
	});
});

describe('normalizeCitationSpacing', () => {
	it("tidies the vatican.va mirrors' loose spacing around a citation", () => {
		expect(normalizeCitationSpacing('( Sl 105, 3)')).toBe('(Sl 105, 3)');
		expect(normalizeCitationSpacing('(2 Cor 5, 17 )')).toBe('(2 Cor 5, 17)');
		expect(normalizeCitationSpacing('Cf . Lc 1, 38.')).toBe('Cf. Lc 1, 38.');
		expect(normalizeCitationSpacing('Cf. Mc 1 , 11.')).toBe('Cf. Mc 1, 11.');
		expect(normalizeCitationSpacing('Catechesi tradendae , 1: AAS 71 (1979) 1277.')).toBe(
			'Catechesi tradendae, 1: AAS 71 (1979) 1277.'
		);
		expect(normalizeCitationSpacing('  Cf.  Ez  36. ')).toBe('Cf. Ez 36.');
	});

	it('changes nothing but whitespace — no mark is added, removed or replaced', () => {
		const samples = [
			'Cf. Gen 9:16; Lk 21:24; DV 3.',
			'Heb 10, 5-7, citando o Sl 40. 7-9, segundo os LXX',
			'Santo Ambrósio, De sacramentis 2, 2, 6: CSEL 73, 27-28 (PL 16, 425-426).'
		];
		for (const s of samples) {
			expect(normalizeCitationSpacing(s)).toBe(s);
			expect(normalizeCitationSpacing(s).replace(/\s/g, '')).toBe(s.replace(/\s/g, ''));
		}
		expect(normalizeCitationSpacing('( Fl . 3, 8 )').replace(/\s/g, '')).toBe(
			'( Fl . 3, 8 )'.replace(/\s/g, '')
		);
	});

	it('leaves a reference resolvable after tidying', () => {
		expect(parseRefs(normalizeCitationSpacing('( Sl 105, 3)'), { lang: 'pt' })).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'ps',
				chapter: 105,
				verses: [3],
				raw: 'Sl 105, 3'
			})
		);
	});
});

describe('parseRefs — cross-chapter ranges (EN)', () => {
	it("links a cross-chapter range's opening verse instead of expanding across the chapter break", () => {
		const segs = parseRefs('Cf. Isa 52:13-53:12.', { lang: 'en' });
		expect(segs).toContainEqual(
			expect.objectContaining({
				kind: 'scripture',
				osis: 'isa',
				chapter: 52,
				verses: [13],
				raw: 'Isa 52:13'
			})
		);
		expect(segs).toContainEqual({ kind: 'text', text: '-53:12.' });
	});

	it('still expands an ordinary within-chapter range', () => {
		expect(parseRefs('Cf. Isa 52:13-15.', { lang: 'en' })).toContainEqual(
			expect.objectContaining({ kind: 'scripture', osis: 'isa', chapter: 52, verses: [13, 14, 15] })
		);
	});
});

describe('parseRefs — bare CCC-paragraph-number lists (Compendium ccc_refs, CCC related)', () => {
	it('parses a comma/space-separated list of single numbers and ranges', () => {
		const segs = parseRefs('279-289, 296-298');
		expect(kinds(segs)).toEqual(['ccc', 'text', 'ccc', 'text', 'ccc', 'text', 'ccc']);
		expect(
			segs.filter((s) => s.kind === 'ccc').map((s) => (s as Extract<RefSegment, { kind: 'ccc' }>).n)
		).toEqual([279, 289, 296, 298]);
	});

	it("parses the real corpus's space-separated ccc_refs shape", () => {
		const segs = parseRefs('27-30 44-45');
		expect(
			segs.filter((s) => s.kind === 'ccc').map((s) => (s as Extract<RefSegment, { kind: 'ccc' }>).n)
		).toEqual([27, 30, 44, 45]);
	});

	it('parses a single bare number', () => {
		expect(parseRefs('67')).toEqual([{ kind: 'ccc', n: 67, raw: '67' }]);
	});

	it('tolerates an en dash range and a dot separator, both observed in the real corpus', () => {
		expect(parseRefs('1 – 25').filter((s) => s.kind === 'ccc')).toHaveLength(2);
		expect(parseRefs('75-79, 83 96.98').filter((s) => s.kind === 'ccc')).toHaveLength(5);
	});

	it('ranges with a non-breaking hyphen exactly as with a hyphen, everywhere', () => {
		// The Romanian Compendium is the source that forced this, but the range
		// separator is now one shared class (`DASHES` in refs-grammar.ts) rather
		// than six regexes each spelling out its own `[-–]`. Asserted as an
		// EQUIVALENCE so it keeps holding whatever those sites parse into.
		// Compared with the separator normalized back, not by rewriting the
		// expectation: the parse KEEPS whatever the page printed, so the two
		// results differ in exactly that one character and nowhere else — a
		// slug like `dei-verbum` stays a hyphen on both sides.
		const parsed = (s: string) => JSON.stringify(parseRefs(s));
		for (const s of ['Cf. Mt 5, 3-12', 'LG 14-16', '279-289, 296-298', 'DV 7-10']) {
			expect(parsed(s.replace(/-/g, '\u2011')).replace(/\u2011/g, '-')).toBe(parsed(s));
		}
	});

	it('tolerates the non-breaking hyphen the Romanian Compendium ranges with', () => {
		// Every one of ro's 598 reference lines uses U+2011, not U+002D. Before
		// the grammar accepted it, none of them was a number list at all and 490
		// citations read as unrecognized.
		expect(parseRefs('1\u201125').filter((s) => s.kind === 'ccc')).toEqual([
			{ kind: 'ccc', n: 1, raw: '1' },
			{ kind: 'ccc', n: 25, raw: '25' }
		]);
		expect(parseRefs('39\u201143 48\u201149').filter((s) => s.kind === 'ccc')).toHaveLength(4);
	});

	it('reproduces the exact original string', () => {
		const s = '279-289, 296-298';
		const segs = parseRefs(s);
		expect(segs.map((seg) => (seg.kind === 'text' ? seg.text : seg.raw)).join('')).toBe(s);
	});
});

describe('parseRefs — must-not-link / degenerate input', () => {
	it('returns an empty array for empty input', () => {
		expect(parseRefs('')).toEqual([]);
	});

	it('a bare non-scripture citation with no digits at all stays entirely text', () => {
		expect(parseRefs('Ibid.')).toEqual([{ kind: 'text', text: 'Ibid.' }]);
	});
});

describe('linkifyProse', () => {
	it('links "cf. 1212" to a CCC paragraph, leaving "cf. " as text', () => {
		const segs = linkifyProse('As explained in cf. 1212, the Church teaches...', {
			cccParagraphRefs: true
		});
		expect(segs).toEqual([
			{ kind: 'text', text: 'As explained in cf. ' },
			{ kind: 'ccc', n: 1212, raw: '1212' },
			{ kind: 'text', text: ', the Church teaches...' }
		]);
	});

	it('links "Cf. Jn 3:16" to a scripture reference, marked comparative', () => {
		const segs = linkifyProse('Cf. Jn 3:16 makes this explicit.');
		expect(segs).toEqual([
			{ kind: 'text', text: 'Cf. ' },
			{ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], cf: true, raw: 'Jn 3:16' },
			{ kind: 'text', text: ' makes this explicit.' }
		]);
	});

	it('links a locator with no "cf." trigger and no brackets around it', () => {
		// The shape that motivated dropping the trigger: PT prints a quotation
		// and its locator inside one parenthesis, with prose between them.
		const segs = linkifyProse('(«Eu estarei contigo» – Ex 3, 12)', { lang: 'pt' });
		expect(segs).toEqual([
			{ kind: 'text', text: '(«Eu estarei contigo» – ' },
			{ kind: 'scripture', osis: 'exod', chapter: 3, verses: [12], raw: 'Ex 3, 12' },
			{ kind: 'text', text: ')' }
		]);
	});

	it('links a bare locator in ordinary running prose', () => {
		expect(linkifyProse('The account of the fall in Genesis 3 uses figurative language.')).toEqual([
			{ kind: 'text', text: 'The account of the fall in ' },
			{ kind: 'scripture', osis: 'gen', chapter: 3, verses: [], raw: 'Genesis 3' },
			{ kind: 'text', text: ' uses figurative language.' }
		]);
	});

	it('never carries a book across a sentence the way the citation grammar does', () => {
		// `parseRefs` would read ", 12, 4" as a bookless continuation of Mt.
		// Prose has no clauses to continue, so nothing but a real book name
		// starts a reference.
		const segs = linkifyProse('Cf. Mt 5, 3. Depois, 12, 4 pontos ficaram por tratar.', {
			lang: 'pt'
		});
		expect(segs.filter((s) => s.kind === 'scripture')).toEqual([
			{ kind: 'scripture', osis: 'matt', chapter: 5, verses: [3], cf: true, raw: 'Mt 5, 3' }
		]);
	});

	it('does not read a patristic commentary title as a reference to the book it comments on', () => {
		for (const [text, lang] of [
			['St. Gregory the Great, Moralia in Job 31, 45: PL 76, 621.', 'en'],
			['Origenes, In Mt. 16, 21.', 'en'],
			['S. Aug. in Ps 32.', 'en']
		] as const) {
			expect(parseRefs(text, { lang }).some((s) => s.kind === 'scripture')).toBe(false);
			expect(linkifyProse(text, { lang }).some((s) => s.kind === 'scripture')).toBe(false);
		}
		// ...but ordinary English "quoted in" is still a real reference.
		expect(
			parseRefs('Is 7:14 (LXX), quoted in Mt 1:23 (Greek).', { lang: 'en' }).filter(
				(s) => s.kind === 'scripture'
			)
		).toHaveLength(2);
	});

	it('links "cf. nn. 1212-1215" as a CCC paragraph range', () => {
		const segs = linkifyProse('cf. nn. 1212-1215 for more.', { cccParagraphRefs: true });
		expect(kinds(segs)).toEqual(['text', 'ccc', 'text', 'ccc', 'text']);
		expect(segs[0]).toEqual({ kind: 'text', text: 'cf. nn. ' });
	});

	it('does not link a bare number with no "cf." trigger', () => {
		const segs = linkifyProse('In 1212 the situation changed.');
		expect(segs).toEqual([{ kind: 'text', text: 'In 1212 the situation changed.' }]);
	});

	it('does not link an ordinary sentence mentioning a chapter/paragraph by word', () => {
		const segs = linkifyProse('See chapter 12, paragraph 5 for details.');
		expect(segs).toEqual([{ kind: 'text', text: 'See chapter 12, paragraph 5 for details.' }]);
	});

	it('leaves a dangling "cf." with nothing ref-shaped after it as plain text', () => {
		const segs = linkifyProse('This is true, cf. the previous chapter.');
		expect(segs).toEqual([{ kind: 'text', text: 'This is true, cf. the previous chapter.' }]);
	});

	it('finds a second "cf." after a non-matching first one', () => {
		const segs = linkifyProse('See cf. above and cf. 1212 below.', { cccParagraphRefs: true });
		expect(segs).toEqual([
			{ kind: 'text', text: 'See cf. above and cf. ' },
			{ kind: 'ccc', n: 1212, raw: '1212' },
			{ kind: 'text', text: ' below.' }
		]);
	});
});

// Every string below is one the corpus actually prints, with the work and
// unit it comes from named. The rules were derived from those strings.
/*
 * `RefsOpts.sameChapter` — a commentary naming the verses beside the one it
 * annotates, with no book and no chapter, because both are the page the
 * reader is on. The whole difficulty is that `v.` is also the Roman five, and
 * what separates the two readings is never the number after it.
 *
 * The counts below are measured over the 45,747 notes of
 * `commentary.haydock.en`: 2,753 admitted, 593 refused.
 */
describe('linkifyProse — same-chapter verses, added 2026-09-01', () => {
	const opts = {
		lang: 'en',
		work: 'commentary.haydock.en',
		sameChapter: { osis: 'gen', chapter: 1 }
	};
	const versesOf = (text: string) =>
		linkifyProse(text, opts)
			.filter((s) => s.kind === 'scripture')
			.map((s) => `${s.osis} ${s.chapter}:${s.verses.join(',')}`);

	it('does nothing at all unless the caller names an address', () => {
		expect(linkifyProse('to enjoy himself. v. 13.', { lang: 'en' })).toEqual([
			{ kind: 'text', text: 'to enjoy himself. v. 13.' }
		]);
	});

	it('reads a bare verse as one of this chapter', () => {
		expect(versesOf('perhaps, as literally, to enjoy himself. v. 13.')).toEqual(['gen 1:13']);
		expect(versesOf('and is here chiefly meant. See ver. 5.')).toEqual(['gen 1:5']);
	});

	it('reads the list and the range the source prints', () => {
		expect(versesOf('done frequently by posterity also, v. 3. 12. 14.')).toEqual(['gen 1:3,12,14']);
		expect(versesOf('rescued the less guilty multitude, v. 9, 23.')).toEqual(['gen 1:9,23']);
		expect(versesOf('very equivocal. v. 24 and 34.')).toEqual(['gen 1:24,34']);
		expect(versesOf('the whole passage, v. 15-17, is late.')).toEqual(['gen 1:15,16,17']);
	});

	/*
	 * The `.` separator is the source's and it is the dangerous one:
	 * `parseVerseList` chains on `.` for its own good reasons, and reusing it
	 * here takes the `2` that opens the NEXT reference's book name. A real
	 * continuation always carries a full stop of its own; `2 Par.` does not.
	 */
	it('does not eat the book number of the reference after it', () => {
		expect(versesOf('falling on his knees, v. 54. 2 Par. vi. 13.')).toEqual(['gen 1:54']);
	});

	/*
	 * The collision, in its four shapes — a book abbreviation, an authority
	 * whose numeral is a chapter, a Roman chapter spelled out before it, and a
	 * locus continued with "and". Every one of them is `v.` meaning five.
	 */
	it('refuses a "v." that is a Roman chapter', () => {
		expect(versesOf('at Nobe. Wisd. v. 1.')).toEqual([]);
		expect(versesOf('is very just. Calmet v. 17.')).toEqual([]);
		expect(versesOf('as in S. Matt. c. xxiv. v. 40, and elsewhere')).toEqual([]);
		expect(versesOf('now enlarged. 2 Mac. iv. 27. and v. 5.')).toEqual(['2macc 4:27']);
	});

	// "See" is the one capitalised word let through, because it is a verb of
	// the surrounding prose and can never be naming a work. 75 references.
	it('lets "See" through', () => {
		expect(versesOf('he shall contaminate him. See v. 11.')).toEqual(['gen 1:11']);
	});

	/*
	 * THE BARE RUN IS NOT LINKABLE, and this pins the decision rather than the
	 * code. Genesis 1:1 ends "...out of pre-existing matter. 21. 27.", which
	 * really is verses 21 and 27 of that chapter — and of the 154 notes ending
	 * in a run of bare numbers it is the ONLY one. The rest are patristic and
	 * juridical loci whose work title happens to end in a period: "S. Aug. ep.
	 * 119. 16.", "Grot. Jur. ii. 21. 4.", "Bible de Vence Max. 9. 5. 2." Under
	 * the tightest filter that admits Genesis 1:1 — an ordinary prose word
	 * before the run — six of the seven survivors are still wrong. Nothing in
	 * the string distinguishes "matter." from "Prolegom.", so the reference
	 * stays text.
	 */
	it('leaves a run of bare numbers alone', () => {
		expect(versesOf('the forming of a thing out of pre-existing matter. 21. 27.')).toEqual([]);
		expect(versesOf('on the day of Pentecost. S. Aug. ep. 119. 16.')).toEqual([]);
	});
});

describe('linkifyProse — document sigla, added 2026-08-26', () => {
	it('reads a siglum with a locus inside a bracket, in each edition that prints one there', () => {
		const cases: [string, string, string, string | null][] = [
			// ccc.de §85, ccc.es §27, ccc.fr §27, ccc.en §27 — the German,
			// Spanish and French editions print NO footnotes, so this is where
			// their whole apparatus lives.
			['de', '…und nehmen [Vgl. LG 20.] auf.', 'LG', 'lumen-gentium'],
			['es', '…y se entrega a su Creador» (GS 19,1).', 'GS', 'gaudium-et-spes'],
			['fr', '…s’abandonne à son Créateur (GS 19, § 1).', 'GS', 'gaudium-et-spes'],
			[
				'en',
				'this "intimate and vital bond of man to God" (GS 19 # 1) can be forgotten.',
				'GS',
				'gaudium-et-spes'
			]
		];
		for (const [lang, text, siglum, slug] of cases) {
			const doc = linkifyProse(text, { lang }).find((s) => s.kind === 'document');
			expect(doc?.label).toBe(siglum);
			expect(doc?.slug).toBe(slug);
		}
	});

	it('requires the bracket', () => {
		// Measured over the four editions that print sigla in prose: 3,708 of
		// 3,712 occurrences are inside a "(" or a "[". Without the guard every
		// capitalised abbreviation in 383 works is a candidate.
		expect(
			linkifyProse('Vgl. LG 20 und andere.', { lang: 'de' }).some((s) => s.kind === 'document')
		).toBe(false);
		expect(linkifyProse('[Vgl. LG 20.]', { lang: 'de' }).some((s) => s.kind === 'document')).toBe(
			true
		);
	});

	it('requires a locus', () => {
		// A siglum named in passing points at nothing.
		expect(
			linkifyProse('(so LG lehrt es)', { lang: 'de' }).some((s) => s.kind === 'document')
		).toBe(false);
	});

	it('reads "SC" as the constitution or the patristic series, per edition', () => {
		// ccc.de §1068 "(SC 103)" is Sacrosanctum concilium; ccc.es §478 quotes
		// "SC 345, 480" — Sources chrétiennes volume 345, page 480.
		const de = linkifyProse('die erhabenste Frucht der Erlösung" (SC 103).', { lang: 'de' }).find(
			(s) => s.kind === 'document'
		);
		expect(de?.slug).toBe('sacrosanctum-concilium');
		const la = linkifyProse('(Adversus haereses, 3, 20, 2: SC 211, 392)', { lang: 'la' }).find(
			(s) => s.kind === 'document'
		);
		expect(la?.expansion).toBe('Sources chrétiennes');
		expect(la?.slug).toBeNull();
	});

	it('keeps a recognized but unlinkable siglum as a segment, so its words still render', () => {
		// DS is 646 of the sigla found in prose and names nothing the corpus
		// holds. `InlineNodes` renders a hrefless ref as its own text.
		const seg = linkifyProse('(1. Vatikanisches K.: DS 3004)', { lang: 'de' }).find(
			(s) => s.kind === 'document'
		);
		expect(seg).toMatchObject({ label: 'DS', locus: '3004', slug: null, raw: 'DS 3004' });
	});

	it('does not read the Summa’s "(AA 1,2)" as Apostolicam actuositatem', () => {
		// summa.en I q.13 a.4: articles 1 and 2 of the question being read,
		// three of which CCEL left unanchored. The conciliar decree is always
		// cited with one section number.
		expect(
			linkifyProse('it is also clear from what has been said (AA 1,2) that they differ.', {
				lang: 'en'
			}).some((s) => s.kind === 'document')
		).toBe(false);
		expect(
			linkifyProse('a leaven in the world" (AA 2 # 2).', { lang: 'en' }).find(
				(s) => s.kind === 'document'
			)?.slug
		).toBe('apostolicam-actuositatem');
	});
});

describe('the three content languages that had no grammar until 2026-08-26', () => {
	it('reads Polish, Russian and Arabic Scripture in prose', () => {
		// Magnifica Humanitas §7, the same sentence in three of its nine
		// editions. `configFor` answered English for all three, which matched
		// nothing at all in them.
		const cases: [string, string][] = [
			['pl', 'budowę wieży Babel (por. Rdz 11, 1–9) oraz'],
			['ru', 'строительству Вавилонской башни (ср. Быт 11, 1–9) и'],
			['ar', 'بناء برج بابل (راجع تكوين 11، 1-9) و']
		];
		for (const [lang, text] of cases) {
			expect(linkifyProse(text, { lang })).toContainEqual(
				expect.objectContaining({ kind: 'scripture', osis: 'gen', chapter: 11 })
			);
		}
	});

	it('reads the Arabic comma as the chapter/verse separator', () => {
		// U+060C, not U+002C: a config built on "," reads none of this
		// edition's 62 references.
		const seg = linkifyProse('(المزمور 85، 11)', { lang: 'ar' }).find(
			(s) => s.kind === 'scripture'
		);
		expect(seg).toMatchObject({ osis: 'ps', chapter: 85, verses: [11] });
	});

	it('prefers the longer Arabic name where one book’s name opens another’s', () => {
		// "رؤيا يوحنّا" (the Revelation of John) begins with "يوحنّا" (John).
		expect(
			linkifyProse('(رؤيا يوحنّا 21، 2)', { lang: 'ar' }).find((s) => s.kind === 'scripture')?.osis
		).toBe('rev');
		expect(
			linkifyProse('(راجع يوحنّا 10، 10)', { lang: 'ar' }).find((s) => s.kind === 'scripture')?.osis
		).toBe('john');
	});
});

describe('the Douay book names the English Summa cites in', () => {
	it('reads the forms the modern table had no entry for', () => {
		// summa.en, in order: I q.1 a.9, I q.10 a.4, I-II q.100 a.5,
		// II-II q.2 a.2, III q.80 a.4 — 1,180 references in that work's prose
		// alone, all of which read as nothing.
		const cases: [string, string, number][] = [
			['(Mat. 7:6)', 'matt', 7],
			['(Eccles. 1:4)', 'eccl', 1],
			['(Osee 12:10)', 'hos', 12],
			['commenting on Ezech. 16:53', 'ezek', 16],
			['(Malach. 4:4)', 'mal', 4],
			['(Cant 3:4)', 'song', 3],
			['(Tobias 3:17)', 'tob', 3],
			['(2 Paralip. 19:2)', '2chr', 19]
		];
		for (const [text, osis, chapter] of cases) {
			expect(linkifyProse(text, { lang: 'en' })).toContainEqual(
				expect.objectContaining({ kind: 'scripture', osis, chapter })
			);
		}
	});

	it('reads "3 Kings" and "4 Kings", which only the Douay tradition uses', () => {
		expect(
			linkifyProse('(3 Kings 20:39)', { lang: 'en' }).find((s) => s.kind === 'scripture')?.osis
		).toBe('1kgs');
		expect(
			linkifyProse('(4 Kings 2:15)', { lang: 'en' }).find((s) => s.kind === 'scripture')?.osis
		).toBe('2kgs');
	});

	it('reads "1 Kings" as the modern book unless the work is known to be Douay', () => {
		// The citation string is identical in both conventions — ccc.en prints
		// it 13 times meaning 1 Kings and summa.en 38 times meaning 1 Samuel —
		// so only `RefsOpts.work` tells them apart. Modern is the default.
		const osisOf = (opts: { lang: string; work?: string }) =>
			linkifyProse('(1 Kings 19:5)', opts).find((s) => s.kind === 'scripture')?.osis;
		expect(osisOf({ lang: 'en' })).toBe('1kgs');
		expect(osisOf({ lang: 'en', work: 'ccc.en' })).toBe('1kgs');
		expect(osisOf({ lang: 'en', work: 'summa.en' })).toBe('1sam');
	});

	it("reads Haydock's bare `K.` as Kings, and the Douay way", () => {
		// The form no other English work prints, and the one Haydock almost
		// always uses: `1 K.` 298 times, `2 K.` 320, `3 K.` 315, `4 K.` 402,
		// against four spelled-out `Kings`. Without the widened base they match
		// nothing at all — an apparatus of 24,000 notes that links nowhere.
		const osisOf = (text: string, work?: string) =>
			linkifyProse(text, { lang: 'en', work }).find((s) => s.kind === 'scripture')?.osis;
		const HAYDOCK = 'commentary.haydock.en';
		// Saul's body on the walls of Bethsan — 1 Samuel 31:10, not 1 Kings.
		expect(osisOf('1 K. xxxi. 10.', HAYDOCK)).toBe('1sam');
		// David made king at Hebron after Isboseth's death — 2 Samuel 5.
		expect(osisOf('2 K. v. 3.', HAYDOCK)).toBe('2sam');
		// The two that read the same either way, which is the corroboration.
		expect(osisOf('3 K. i. 7.', HAYDOCK)).toBe('1kgs');
		expect(osisOf('4 K. xii. 20.', HAYDOCK)).toBe('2kgs');
		// And the base stays Haydock's: no other English work gains it, or
		// every "1 K" in the corpus would become a citation.
		expect(osisOf('1 K. xxxi. 10.')).toBeUndefined();
		expect(osisOf('1 K. xxxi. 10.', 'summa.en')).toBeUndefined();
	});

	it('reads a Roman chapter in Haydock, as it does in Martini', () => {
		// How the edition's printer set numerals, not how English cites — and
		// without it an English config reads almost none of him, since he
		// writes `Gen. iii. 8` throughout. The guards are unrelaxed: a Roman
		// chapter still needs an explicit separator and a verse-sized verse.
		const osisOf = (text: string, work?: string) =>
			linkifyProse(text, { lang: 'en', work }).find((s) => s.kind === 'scripture');
		const found = osisOf('See Gen. iii. 8.', 'commentary.haydock.en');
		expect(found?.osis).toBe('gen');
		expect(found?.chapter).toBe(3);
		// Not for English at large: `ccc.en` prints no Roman chapters.
		expect(osisOf('See Gen. iii. 8.')).toBeUndefined();
	});

	it('overrides the work for citation strings too, not only prose', () => {
		// Aeterni Patris cites "the God of all knowledge" — 1 Samuel 2:3 — as
		// "1 Kings 2:3", in a numbered footnote rather than in the body.
		const osisOf = (work?: string) =>
			parseRefs('1 Kings 2:3.', { lang: 'en', work }).find((s) => s.kind === 'scripture')?.osis;
		expect(osisOf()).toBe('1kgs');
		expect(osisOf('encyclical.aeterni-patris.en')).toBe('1sam');
	});

	it('moves only the books of Kings, and only for the listed works', () => {
		const douay = { lang: 'en', work: 'summa.en' };
		// 3 and 4 Kings mean the same thing under both conventions, and the
		// other seventy books are untouched: the override is a naming
		// difference, not a dialect.
		for (const [text, osis] of [
			['(3 Kings 20:39)', '1kgs'],
			['(4 Kings 2:15)', '2kgs'],
			['(1 Samuel 2:3)', '1sam'],
			['(2 Esd. 13:1)', 'neh'],
			['(Mat. 7:6)', 'matt']
		] as const) {
			expect(linkifyProse(text, douay).find((s) => s.kind === 'scripture')?.osis).toBe(osis);
		}
		// A work not on the list reads its language's table, whatever else it
		// shares with one that is.
		expect(
			linkifyProse('(1 Kings 19:5)', { lang: 'en', work: 'summa.la' }).find(
				(s) => s.kind === 'scripture'
			)?.osis
		).toBe('1kgs');
	});

	it('reads "2 Esdras" as Nehemias in both languages that print it', () => {
		expect(
			linkifyProse('the Church of God (cf. 2 Esd. 13:1)', { lang: 'en' }).find(
				(s) => s.kind === 'scripture'
			)?.osis
		).toBe('neh');
		expect(
			linkifyProse('é já chamado Igreja de Deus (cfr. 2 Esdr. 13,1)', { lang: 'pt' }).find(
				(s) => s.kind === 'scripture'
			)?.osis
		).toBe('neh');
	});

	it('leaves "3 Esdras" unlinked, because the corpus does not hold the apocryphon', () => {
		expect(
			linkifyProse('it is stated (3 Esdra 3:21) that', { lang: 'en' }).some(
				(s) => s.kind === 'scripture'
			)
		).toBe(false);
	});
});

describe('the Portuguese forms the prose scan found outside the Catechism', () => {
	it('reads the encyclicals’ own abbreviations', () => {
		const cases: [string, string, number][] = [
			['dos dez Mandamentos (cf. Êx 20, 12-17)', 'exod', 20],
			['“obediente até à morte” (Flp 2, 8)', 'phil', 2],
			['a palavra de Deus (cf. 1 Tes 2, 13)', '1thess', 2],
			['« esteja a dormir » (cf. 1 Re 18, 27)', '1kgs', 18],
			['a fé sem as obras é ineficaz" (Tiago 2, 20)', 'jas', 2],
			['amando a piedade (cf. Miq 6, 8)', 'mic', 6],
			['um « explorador » (cf. Coel 1, 13)', 'eccl', 1],
			['o texto de João 7, 38', 'john', 7]
		];
		for (const [text, osis, chapter] of cases) {
			expect(linkifyProse(text, { lang: 'pt' })).toContainEqual(
				expect.objectContaining({ kind: 'scripture', osis, chapter })
			);
		}
	});

	it('does not read a Portuguese commentary title as the book it comments on', () => {
		// Augustine's Enarrationes and Cyril's commentary, both cited by title
		// in the Portuguese encyclicals and council documents, and Tertullian
		// AGAINST Marcion wearing Mark's abbreviation.
		for (const text of [
			'Comentário aos Salmos, 85,5.',
			'Comentário ao Evangelho de João, XII, 20: PG 74, 716.',
			'Tertuliano, Adv. Marc. 3, 7: PL 2, 335.'
		]) {
			expect(linkifyProse(text, { lang: 'pt' }).some((s) => s.kind === 'scripture')).toBe(false);
		}
	});
});

describe('refHref', () => {
	it('links a CCC segment without needing any corpus context', () => {
		expect(refHref({ kind: 'ccc', n: 1212, raw: '1212' }, {})).toBe('/catechismus/1212');
	});

	it('links a Compendium segment without needing any corpus context', () => {
		expect(refHref({ kind: 'compendium', n: 42, raw: '42' }, {})).toBe(
			'/catechismus/compendium/42'
		);
	});

	it('never links a document segment with no ingested slug (DS 1514 must stay unlinked)', () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'DS',
					locus: '1514',
					expansion: 'Denzinger',
					slug: null,
					raw: 'DS 1514'
				},
				{ lang: 'en' }
			)
		).toBeUndefined();
	});

	it("links a document segment whose slug + section exist in the reader's effective language", () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'GS',
					locus: '19',
					expansion: 'Gaudium et Spes',
					slug: 'gaudium-et-spes',
					raw: 'GS 19'
				},
				{ lang: 'en' }
			)
		).toBe('/documenta/gaudium-et-spes#s19');
	});

	it('drops the "# N" subsection and links to the section alone ("GS 19 # 1" -> §19)', () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'GS',
					locus: '19 # 1',
					expansion: 'Gaudium et Spes',
					slug: 'gaudium-et-spes',
					raw: 'GS 19 # 1'
				},
				{ lang: 'en' }
			)
		).toBe('/documenta/gaudium-et-spes#s19');
	});

	it("resolves a document link against the reader's PT effective language, not EN", () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'GS',
					locus: '19',
					expansion: 'Gaudium et Spes',
					slug: 'gaudium-et-spes',
					raw: 'GS 19'
				},
				{ lang: 'pt' }
			)
		).toBe('/documenta/gaudium-et-spes#s19');
	});

	it("never links a section absent from the edition the reader will get (dei-verbum's PT edition stops at 1)", () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'DV',
					locus: '2',
					expansion: 'Dei Verbum',
					slug: 'dei-verbum',
					raw: 'DV 2'
				},
				{ lang: 'pt' }
			)
		).toBeUndefined();
	});

	it('links a document the reader\u2019s language has no edition of, against the one opening it would give them', () => {
		// Sacrosanctum Concilium is EN-only here, as Dei Filius is IT/LA-only in
		// the real corpus and no document at all has a Malagasy edition. The URL
		// names no edition, so this lands the reader exactly where
		// `/documenta/{slug}` would have.
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'SC',
					locus: '61',
					expansion: 'Sacrosanctum Concilium',
					slug: 'sacrosanctum-concilium',
					raw: 'SC 61'
				},
				{ lang: 'de' }
			)
		).toBe('/documenta/sacrosanctum-concilium#s61');
	});

	it('never links a PT SC segment, even though its EN counterpart (Sacrosanctum Concilium) does — the language-dependent siglum guard', () => {
		const [doc] = parseRefs('SC 264.', { lang: 'pt' }).filter(
			(s): s is Extract<RefSegment, { kind: 'document' }> => s.kind === 'document'
		);
		expect(doc.slug).toBeNull();
		expect(refHref(doc, { lang: 'pt' })).toBeUndefined();
	});

	it('never links a document segment with no section number in its locus', () => {
		expect(
			refHref(
				{
					kind: 'document',
					via: 'siglum',
					label: 'GS',
					locus: null,
					expansion: 'Gaudium et Spes',
					slug: 'gaudium-et-spes',
					raw: 'GS'
				},
				{ lang: 'en' }
			)
		).toBeUndefined();
	});

	it('never links a text segment', () => {
		expect(refHref({ kind: 'text', text: 'hello' }, {})).toBeUndefined();
	});

	it('links a scripture segment present in the given Bible edition (fixture: bible.cpdv.en has gen ch.1, john ch.1+3)', () => {
		expect(
			refHref(
				{ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' },
				{ bibleWorkId: 'bible.cpdv.en' }
			)
		).toBe('/scriptura/genesis/1#v1');

		expect(
			refHref(
				{ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' },
				{ bibleWorkId: 'bible.cpdv.en' }
			)
		).toBe('/scriptura/ioannes/3#v16');
	});

	it('omits the verse anchor for a whole-chapter reference', () => {
		expect(
			refHref(
				{ kind: 'scripture', osis: 'john', chapter: 3, verses: [], raw: 'John 3' },
				{ bibleWorkId: 'bible.cpdv.en' }
			)
		).toBe('/scriptura/ioannes/3');
	});

	describe('multi-verse passages carry their extent', () => {
		it('emits ?v=from-to alongside the anchor', () => {
			// "Jn 1:1-7" — the reader should arrive knowing where the citation
			// ends, not just where it starts.
			expect(
				refHref(
					{
						kind: 'scripture',
						osis: 'john',
						chapter: 1,
						verses: [1, 2, 3, 4, 5, 6, 7],
						raw: 'Jn 1:1-7'
					},
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/ioannes/1?v=1-7#v1');
		});

		it('adds nothing for a single-verse reference', () => {
			// Already fully described by its anchor.
			expect(
				refHref(
					{ kind: 'scripture', osis: 'john', chapter: 1, verses: [5], raw: 'Jn 1:5' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/ioannes/1#v5');
		});

		it('spans an unsorted verse list by its min and max', () => {
			// Verse arrays arrive from range expansion AND comma lists, so they
			// are not guaranteed ordered.
			expect(
				refHref(
					{ kind: 'scripture', osis: 'john', chapter: 1, verses: [7, 1, 4], raw: 'Jn 1:7,1,4' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/ioannes/1?v=1-7#v7');
		});

		it('clamps the extent to verses that exist in this edition', () => {
			// Genesis 1 has 13 verses in the fixture; a citation running past the
			// end must not claim to highlight to verse 99.
			expect(
				refHref(
					{
						kind: 'scripture',
						osis: 'gen',
						chapter: 1,
						verses: [11, 12, 13, 99],
						raw: 'Gen 1:11-99'
					},
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/genesis/1?v=11-13#v11');
		});

		it('converts the extent for a divergent book rather than dropping it', () => {
			// Ps 22 is Vulgate Ps 21 with verse numbers unchanged, so the span
			// survives conversion intact. Every verse is converted individually
			// (not offset from the anchor), which is what makes this safe.
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 22, verses: [14, 15, 16], raw: 'Ps 22:14-16' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/psalmi/21?v=14-16#v14');
		});
	});

	it('returns undefined when no Bible edition is given', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' }, {})
		).toBeUndefined();
	});

	it('returns undefined for a book absent from the given edition (fixture only has gen + john)', () => {
		expect(
			refHref(
				{ kind: 'scripture', osis: 'exod', chapter: 3, verses: [6], raw: 'Ex 3:6' },
				{ bibleWorkId: 'bible.cpdv.en' }
			)
		).toBeUndefined();
	});

	it('returns undefined for a chapter absent from the given edition (fixture gen only has chapter 1)', () => {
		expect(
			refHref(
				{ kind: 'scripture', osis: 'gen', chapter: 9, verses: [16], raw: 'Gen 9:16' },
				{ bibleWorkId: 'bible.cpdv.en' }
			)
		).toBeUndefined();
	});

	it('returns undefined for an unknown work id (never throws)', () => {
		expect(
			refHref(
				{ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' },
				{ bibleWorkId: 'bible.nonexistent' }
			)
		).toBeUndefined();
	});

	describe('Hebrew/Masoretic versification (Psalms, Malachi, Joel)', () => {
		it('converts a Hebrew Psalm chapter+verse to its Vulgate address (ccc112: "Ps 22:14" -> Vulgate 21:14)', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 22, verses: [14], raw: 'Ps 22:14' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/psalmi/21#v14');
		});

		it('converts Malachi across the chapter 3/4 split (ccc678: "Mal 3: 19" -> Vulgate 4:1)', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'mal', chapter: 3, verses: [19], raw: 'Mal 3: 19' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/malachias/4#v1');
		});

		it('converts Joel across the chapter 2/3 fold ("Joel 3:1-5" -> Vulgate 2:28)', () => {
			expect(
				refHref(
					{
						kind: 'scripture',
						osis: 'joel',
						chapter: 3,
						verses: [1, 2, 3, 4, 5],
						raw: 'Joel 3:1-5'
					},
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/ioel/2?v=28-32#v28');
		});

		it('never leaves a whole-chapter Joel 3 pointing at the literal (unconverted, WRONG) Vulgate chapter 3, which trivially "exists" but means Hebrew Joel 4', () => {
			const href = refHref(
				{ kind: 'scripture', osis: 'joel', chapter: 3, verses: [], raw: 'Joel 3' },
				{ bibleWorkId: 'bible.cpdv.en' }
			);
			expect(href).toBe('/scriptura/ioel/2');
			expect(href).not.toContain('/joel/3');
		});

		it('degrades to a chapter-only link when the mapped verse does not exist, same guarantee as the non-divergent path', () => {
			// Ps 22 (Hebrew) -> Vulg 21, which only has 32 verses in the fixture.
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 22, verses: [9999], raw: 'Ps 22:9999' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/psalmi/21');
		});

		it('omits the anchor for a whole-chapter Psalm reference that is not a split psalm', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 51, verses: [], raw: 'Ps 51' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/psalmi/50');
		});

		it('picks the first half for a whole-chapter reference to a split psalm (Ps 116 -> Vulg 114)', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 116, verses: [], raw: 'Ps 116' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/psalmi/114');
		});

		it('leaves non-divergent books unaffected by the versification path', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' },
					{ bibleWorkId: 'bible.cpdv.en' }
				)
			).toBe('/scriptura/ioannes/3#v16');
		});

		it('returns undefined rather than a wrong link when the divergent book is absent from the edition', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 22, verses: [14], raw: 'Ps 22:14' },
					{ bibleWorkId: 'bible.nonexistent' }
				)
			).toBeUndefined();
		});
	});

	/**
	 * The other side of the same conversion: a work that ALREADY cites in
	 * Vulgate numbering must not be converted, or every psalm reference it
	 * prints in the shifted range lands a psalm low.
	 *
	 * `Ps. ciii. 3` is the citation that found this — Calmet on Genesis 1:6,
	 * glossing the firmament that divides the waters, and Vulgate Ps 103:3 is
	 * "Who coverest the higher rooms thereof with water". Converted, it reached
	 * Ps 102:3, "Who forgiveth all thy iniquities".
	 */
	describe('works that already cite in Vulgate numbering', () => {
		const PS_CIII: RefSegment = {
			kind: 'scripture',
			osis: 'ps',
			chapter: 103,
			verses: [3],
			raw: 'Ps. ciii. 3'
		};

		it("leaves Haydock's psalm citation where he wrote it", () => {
			expect(
				refHref(PS_CIII, {
					bibleWorkId: 'bible.cpdv.en',
					lang: 'en',
					work: 'commentary.haydock.en'
				})
			).toBe('/scriptura/psalmi/103#v3');
		});

		it('still converts the same segment when no work is named — the Catechism default', () => {
			expect(refHref(PS_CIII, { bibleWorkId: 'bible.cpdv.en', lang: 'en' })).toBe(
				'/scriptura/psalmi/102#v3'
			);
		});

		it.each([
			['summa.en', 'en'],
			['bible.douay-rheims.en', 'en'],
			['bible.straubinger.es', 'es'],
			['bible.martini.it', 'it']
		])('opts %s out of conversion too', (work, lang) => {
			expect(refHref(PS_CIII, { bibleWorkId: 'bible.cpdv.en', lang, work })).toBe(
				'/scriptura/psalmi/103#v3'
			);
		});

		it('does not shift a verse RANGE either', () => {
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 103, verses: [3, 4, 5], raw: 'Ps. ciii. 3-5' },
					{ bibleWorkId: 'bible.cpdv.en', lang: 'en', work: 'commentary.haydock.en' }
				)
			).toBe('/scriptura/psalmi/103?v=3-5#v3');
		});

		it('degrades to a chapter-only link for the residue, rather than resolving it elsewhere', () => {
			// Haydock's six Hebrew-numbered citations, e.g. "Ps. x. 16" for the
			// second half of the merged Vulgate Ps 9, written beside a gloss on the
			// Hebrew text. Vulgate Ps 10 stops at verse 8, so the verse cannot
			// resolve — and a chapter link is the documented answer to that, not a
			// silent hop to whatever the other numbering would have reached.
			expect(
				refHref(
					{ kind: 'scripture', osis: 'ps', chapter: 10, verses: [16], raw: 'Ps. x. 16' },
					{ bibleWorkId: 'bible.cpdv.en', lang: 'en', work: 'commentary.haydock.en' }
				)
			).toBe('/scriptura/psalmi/10');
		});

		it('leaves a non-divergent book alone under either reading', () => {
			const seg: RefSegment = {
				kind: 'scripture',
				osis: 'john',
				chapter: 3,
				verses: [16],
				raw: 'Jn 3:16'
			};
			expect(
				refHref(seg, { bibleWorkId: 'bible.cpdv.en', lang: 'en', work: 'commentary.haydock.en' })
			).toBe(refHref(seg, { bibleWorkId: 'bible.cpdv.en', lang: 'en' }));
		});

		it('reads the flag off the work, never off the language', () => {
			expect(citesVulgateNumbering('en', 'commentary.haydock.en')).toBe(true);
			expect(citesVulgateNumbering('en')).toBe(false);
			expect(citesVulgateNumbering('en', 'ccc.en')).toBe(false);
			expect(citesVulgateNumbering('it')).toBe(false);
		});
	});
});

/**
 * Documents cited by TITLE rather than by siglum. Every case here is drawn
 * from a real citation string in `ccc.en`/`ccc.pt`, including the false
 * positives that motivated the single-word exclusion — see refs.ts's
 * "Documents named by TITLE" section for the measurements behind them.
 */
describe('parseRefs — documents named by title', () => {
	it('links a papal document cited by its incipit', () => {
		const segs = parseRefs('Pius XII, Enc. Humani Generis 3.');
		expect(segs.find((s) => s.kind === 'document' && s.via === 'title')).toMatchObject({
			slug: 'humani-generis',
			locus: '3'
		});
	});

	it('reproduces the original string exactly', () => {
		// The whole point of the segment model: rendering must be lossless.
		const raw = 'Pius XII, Enc. Humani Generis 3.';
		const rebuilt = parseRefs(raw)
			.map((s) => (s.kind === 'text' ? s.text : s.raw))
			.join('');
		expect(rebuilt).toBe(raw);
	});

	it('resolves the spelled-out conciliar titles the Portuguese Catechism uses', () => {
		// PT never abbreviates, which is why it previously resolved no document
		// links at all (DOCUMENT_SLUGS_EN's docblock).
		const segs = parseRefs(
			'II Concílio do Vaticano, Const. dogm. Dei Verbum, 2: AAS 58 (1966) 818.',
			{
				lang: 'pt'
			}
		);
		expect(segs.find((s) => s.kind === 'document' && s.via === 'title')).toMatchObject({
			slug: 'dei-verbum',
			locus: '2'
		});
	});

	it('does NOT match a single-word title inside a longer document name', () => {
		// "Paul VI, Mysterium Fidei" names a document we do not have; matching
		// the bare "Mysterium" would link confidently to the wrong one.
		const segs = parseRefs('Paul VI, Mysterium Fidei: AAS (1965) 771.');
		expect(segs.every((s) => !(s.kind === 'document' && s.via === 'title'))).toBe(true);
	});

	it('does NOT match a single-word title appearing in ordinary Latin prose', () => {
		const segs = parseRefs('Roman Missal, Embolism after the Lord’s Prayer: da propitius pacem.');
		expect(segs.every((s) => !(s.kind === 'document' && s.via === 'title'))).toBe(true);
	});

	it('prefers a siglum over a title when a clause offers both', () => {
		const segs = parseRefs('GS 19');
		expect(segs.find((s) => s.kind === 'document')).toMatchObject({ via: 'siglum' });
	});

	it('links every document the clause names, not only the leftmost', () => {
		// CCC 90's Portuguese footnote, with Dei Filius standing in as Dei
		// Verbum (the mock registry has no `vati` family). The tail after the
		// first match used to be dropped to plain text, so the SECOND document
		// went unlinked — behind the first, the DS siglum between them and the
		// AAS volume that closes the note.
		const segs = parseRefs(
			'Cf. I Concílio do Vaticano, Const. dogm. Dei Verbum, c. 4: DS 3016 «mysteriorum nexus». ' +
				'Cf. II Concílio do Vaticano, Const. dogm. Lumen Gentium, 25: AAS 57 (1965) 29.',
			{ lang: 'pt' }
		);
		expect(
			segs.filter((s) => s.kind === 'document').map((s) => [s.via, s.label, s.slug, s.locus])
		).toEqual([
			['title', 'Dei Verbum', 'dei-verbum', null],
			['siglum', 'DS', null, '3016'],
			['title', 'Lumen Gentium', 'lumen-gentium', '25'],
			['siglum', 'AAS', null, '57']
		]);
		// And the original string is still reproduced character for character.
		expect(segs.map((s) => (s.kind === 'text' ? s.text : s.raw)).join('')).toBe(
			'Cf. I Concílio do Vaticano, Const. dogm. Dei Verbum, c. 4: DS 3016 «mysteriorum nexus». ' +
				'Cf. II Concílio do Vaticano, Const. dogm. Lumen Gentium, 25: AAS 57 (1965) 29.'
		);
	});

	it('is not shadowed by an unlinkable siglum appearing LATER in the clause', () => {
		// Regression: nearly every PT citation ends in an "AAS 58 (1966) 818"
		// volume reference, and AAS never resolves to an address here. Matching
		// sigla first let that trailing AAS beat the linkable title earlier in
		// the same clause — for most of the Portuguese corpus, silently.
		const segs = parseRefs('Const. dogm. Dei Verbum, 2: AAS 58 (1966) 818.', { lang: 'pt' });
		expect(segs.find((s) => s.kind === 'document' && s.via === 'title')).toMatchObject({
			slug: 'dei-verbum'
		});
	});
});

describe('refHref — documents named by title', () => {
	const seg = (locus: string | null, slug = 'gaudium-et-spes') =>
		({
			kind: 'document',
			via: 'title',
			label: 'Gaudium et Spes',
			locus,
			expansion: null,
			slug,
			raw: 'x'
		}) as const;

	it('links to the section when the number really is one', () => {
		expect(refHref(seg('19'), { lang: 'en' })).toBe('/documenta/gaudium-et-spes#s19');
	});

	it('falls back to the landing page when the number is not a section', () => {
		// "Humani generis 561" cites an AAS page; that document has 44 sections.
		// Linking to /561 would be a confident 404, so the title alone wins.
		expect(refHref(seg('561'), { lang: 'en' })).toBe('/documenta/gaudium-et-spes');
	});

	it('falls back to the landing page when there is no number at all', () => {
		// Unlike a bare siglum, which links nowhere: a title still names one
		// specific document even with no locus.
		expect(refHref(seg(null), { lang: 'en' })).toBe('/documenta/gaudium-et-spes');
	});

	it('checks the section against the edition the reader will actually get', () => {
		// PT has an edition and it stops at 1, so the anchor is refused — and a
		// title, unlike a siglum, still names the document, so it degrades to
		// the landing page rather than to nothing.
		expect(refHref(seg('2', 'dei-verbum'), { lang: 'pt' })).toBe('/documenta/dei-verbum');
		expect(refHref(seg('2', 'dei-verbum'), { lang: 'en' })).toBe('/documenta/dei-verbum#s2');
		// DE has no edition, so the check runs against the one a DE reader
		// opening the document would be shown.
		expect(refHref(seg('2', 'dei-verbum'), { lang: 'de' })).toBe('/documenta/dei-verbum#s2');
	});
});

describe('expandIbidem', () => {
	it('writes the work back in where the abbreviation stood', () => {
		expect(expandIbidem('Ibid.', 'Lumen Gentium')).toBe('Lumen Gentium');
	});

	it('drops the punctuation between the word and the locus', () => {
		// "LG, 14" would not parse: the siglum path reads a locus only when
		// digits follow the siglum directly. Kept, the comma would cost the
		// section and the citation would inherit the previous note's — a
		// wrong link where there had merely been no link.
		expect(expandIbidem('Ibid., 14.', 'LG')).toBe('LG 14.');
	});

	it('keeps a "cf.", which is part of what the citation claims', () => {
		expect(expandIbidem('Cf. ibid ., 43: AAS 48 (1956), 336.', 'Haurietis aquas')).toBe(
			'Cf. Haurietis aquas 43: AAS 48 (1956), 336.'
		);
	});

	it('tolerates the stray full stop the sources leave in front of one', () => {
		expect(expandIbidem('. Ibid., 23.', 'Ad Gentes')).toBe('Ad Gentes 23.');
	});

	it('reads every form the corpus prints', () => {
		for (const word of ['Ibid.', 'Ibidem', 'ibid', 'Ib.', 'Ibíd.', 'Ebd.']) {
			expect(expandIbidem(word, 'LG')).toBe('LG');
		}
	});

	it('does not read Id., which names the same author and a different work', () => {
		expect(expandIbidem('Id., Homilia III in Dormitionem Ssmae Deiparae.', 'LG')).toBeNull();
		expect(expandIbidem('Idem, Oratio ad Ssmam Dei Matrem.', 'LG')).toBeNull();
	});

	it('does not read one buried in a citation, which points back inside it', () => {
		expect(expandIbidem('Gasser, ib., c. 2.', 'LG')).toBeNull();
	});

	it('leaves an ordinary citation alone', () => {
		expect(expandIbidem('Cf. Acts 2:41.', 'LG')).toBeNull();
		expect(expandIbidem('Ibiza, 4.', 'LG')).toBeNull();
	});
});

/**
 * `bookAbbrev` exists for the reading sidebar, whose cells are eight or nine
 * characters wide — see `chipLabel` in `BookChapterPicker.svelte`. What it
 * must never do is answer in the wrong language, which is why it is separate
 * from `grammarSurface` rather than a view over it.
 */
describe('bookAbbrev', () => {
	it('gives the short form the language itself prints', () => {
		expect(bookAbbrev('gen', 'la')).toBe('Gn');
		expect(bookAbbrev('song', 'la')).toBe('Ct');
		expect(bookAbbrev('rev', 'la')).toBe('Apc');
		expect(bookAbbrev('sir', 'la')).toBe('Eccli');
		expect(bookAbbrev('rev', 'pt')).toBe('Ap');
		expect(bookAbbrev('1john', 'pt')).toBe('1 Jo');
		expect(bookAbbrev('song', 'de')).toBe('Hld');
	});

	it('answers for all 73 books in the three complete tables', () => {
		for (const lang of ['en', 'la', 'pt']) {
			for (const osis of [...CANON_OT, ...CANON_NT]) {
				expect(bookAbbrev(osis, lang), `${lang}.${osis}`).toBeTruthy();
			}
		}
	});

	/**
	 * The derived tables are built from citations, so a book the Catechism
	 * never cites is absent. That is the caller's cue to print the full name,
	 * and it is nearly free: the missing books are also the short-named ones.
	 */
	it('returns undefined for a book its language never cites', () => {
		expect(bookAbbrev('phlm', 'it')).toBeUndefined();
		expect(bookAbbrev('ruth', 'fr')).toBeUndefined();
	});

	/**
	 * THE IMPORTANT ONE. `configFor` ends in `?? CONFIG_EN`, which is right for
	 * parsing a citation and wrong for labelling a book: an English "Song" over
	 * a Hungarian book list abbreviates nothing the reader can see. Hungarian
	 * is the live case — the Káldi Bible is in the corpus and `hu` has no
	 * grammar table.
	 */
	it('never falls back to another language', () => {
		expect(bookAbbrev('gen', 'hu')).toBeUndefined();
		expect(bookAbbrev('song', 'hu')).toBeUndefined();
		expect(bookAbbrev('gen', undefined)).toBeUndefined();
		expect(bookAbbrev('gen', 'zz')).toBeUndefined();
	});

	it('reads a regional tag as its base language', () => {
		expect(bookAbbrev('gen', 'en-GB')).toBe(bookAbbrev('gen', 'en'));
	});

	it('has no answer for something that is not a book', () => {
		expect(bookAbbrev('nope', 'en')).toBeUndefined();
	});
});

/**
 * The predicate separates `bookAbbrev`'s two ways of having no answer, which
 * a caller laying out a list has to tell apart: a missing BOOK is one chip
 * falling back to its name, a missing TABLE is all 73 of them.
 */
describe('hasBookAbbrevs', () => {
	it('is true for a language with a table, whatever its coverage', () => {
		for (const lang of ['en', 'la', 'pt', 'it', 'es', 'fr', 'de', 'ar', 'pl', 'ru', 'mg']) {
			expect(hasBookAbbrevs(lang), lang).toBe(true);
		}
		// `it` is one of the incomplete tables, and still has one.
		expect(bookAbbrev('phlm', 'it')).toBeUndefined();
		expect(hasBookAbbrevs('it')).toBe(true);
	});

	it('is false for a language with none, and for no language at all', () => {
		expect(hasBookAbbrevs('hu')).toBe(false);
		expect(hasBookAbbrevs('zz')).toBe(false);
		expect(hasBookAbbrevs(undefined)).toBe(false);
	});

	it('reads a regional tag as its base language', () => {
		expect(hasBookAbbrevs('en-GB')).toBe(true);
	});
});

/**
 * What a siglum discloses, and -- by answering `undefined` -- whether a cue is
 * drawn over it at all. Both halves are one function so a reader can never
 * meet a dotted underline that opens nothing, which is what the `title` it
 * replaced did on every touch screen (`SiglumGloss.svelte`).
 */
describe('glossOf', () => {
	const documentSeg = (segs: RefSegment[], label: string) =>
		segs.find((s) => s.kind === 'document' && s.label === label)!;

	it('discloses a siglum that names no ingested document', () => {
		const seg = documentSeg(parseRefs('Cf. ibid., 11: AAS 58 (1966), 1033-1034.'), 'AAS');
		expect(glossOf(seg)).toMatch(/^AAS — Acta Apostolicae Sedis/);
	});

	it("discloses a siglum that DOES resolve, since the link is the caller's choice", () => {
		const seg = documentSeg(parseRefs('GS 19 # 1.'), 'GS');
		expect(seg).toMatchObject({ slug: 'gaudium-et-spes' });
		expect(glossOf(seg)).toMatch(/^GS — Gaudium et Spes/);
	});

	it('says nothing for a document named by its title, which explains itself', () => {
		const segs = parseRefs('Const. dogm. Dei Verbum, 2: AAS 58 (1966) 818.', { lang: 'pt' });
		const title = segs.find((s) => s.kind === 'document' && s.via === 'title')!;
		expect(title).toMatchObject({ expansion: null });
		expect(glossOf(title)).toBeUndefined();
	});

	it('says nothing for a scripture segment or for plain text', () => {
		const segs = parseRefs('Cf. Gen 9:16.');
		expect(glossOf(segs.find((s) => s.kind === 'scripture')!)).toBeUndefined();
		expect(glossOf(segs.find((s) => s.kind === 'text')!)).toBeUndefined();
	});
});

/**
 * The first of the two addresses this grammar answers with a link that leaves
 * the site: an AAS volume, on the Holy See's own server. See the AAS section
 * in `refs-grammar.ts` for why it is derived rather than tabulated, and why
 * the printed year is a CHECK and not an input.
 */
describe('external sources — AAS volumes', () => {
	const aas = (text: string, lang = 'en') =>
		parseRefs(normalizeCitationSpacing(text), { lang }).find(
			(s) => s.kind === 'document' && s.label === 'AAS'
		) as Extract<RefSegment, { kind: 'document' }> | undefined;

	it('builds the volume PDF when the citation states volume and year and they agree', () => {
		expect(aas('Cf. ibid., 11: AAS 58 (1966), 1033-1034.')?.external).toEqual({
			href: 'https://www.vatican.va/archive/aas/documents/AAS-58-1966-ocr.pdf',
			label: '58 (1966)'
		});
	});

	it('pads a single-digit volume, which is the Vatican’s own spelling', () => {
		expect(aas('S. Pius X, Haerent animo, 4 Aug. 1908: AAS 4 (1912), 237.')?.external?.href).toBe(
			'https://www.vatican.va/archive/aas/documents/AAS-04-1912-ocr.pdf'
		);
	});

	// THE TRAP THE YEAR CHECK EXISTS FOR. AAS began in 1909, so a citation
	// dated 1885 is volume 18 of the ACTA SANCTAE SEDIS, its predecessor,
	// written under the later siglum out of habit. Deriving the year from the
	// volume would send the reader to AAS 18 (1926) — a real volume, forty
	// years wrong, and nothing downstream could tell.
	it('refuses a volume whose printed year says Acta Sanctae Sedis', () => {
		const seg = aas('Cf. Leo XIII, encycl. "Immortale Dei", Nov. 1, 1885: AAS 18 (1885) p. 161.');
		// Still recognized, still glossed — it is only the way out that is
		// withheld, because there is no way of knowing which gazette this is.
		expect(seg).toMatchObject({ locus: '18' });
		expect(seg?.external).toBeUndefined();
	});

	it('refuses a volume and year that disagree for any other reason', () => {
		// Both are the corpus's own: an OCR'd volume, and a source's slip.
		expect(
			aas('Pius XII, Radiovēstījums 1941: AAS 4433 (1941), 199.', 'lv')?.external
		).toBeUndefined();
		expect(
			aas('Instr. Eucharisticum Mysterium (25 May 1967), 3: AAS 57 (1967), 540.')?.external
		).toBeUndefined();
	});

	it('refuses a citation that prints no year to check the volume against', () => {
		expect(aas('AAS 14, 449ss.')?.external).toBeUndefined();
		expect(aas('Pius XII AAS 1953, 799.')?.external).toBeUndefined();
	});

	// 95 (2003) onward is published one PDF per month under an Italian month
	// name; a citation gives volume and page and never a month, so there is no
	// address to derive rather than one nobody has written yet.
	it('refuses a volume published monthly', () => {
		expect(
			aas('Franciscus, Evangelii gaudium, 1: AAS 105 (2013), 1019.')?.external
		).toBeUndefined();
	});

	// Volume 9 and volume 75 are each bound in two parts, and the part is
	// decided by the page number, which this grammar does not read.
	it('refuses the two volumes published in two parts', () => {
		const bound = aas('AAS 75 (1983), 165.');
		expect(bound).toMatchObject({ locus: '75' });
		expect(bound?.external).toBeUndefined();
		const wartime = aas('Benedictus XV, Cum biblia sacra, 1917: AAS 9 (1917), 5.');
		expect(wartime).toMatchObject({ locus: '9' });
		expect(wartime?.external).toBeUndefined();
	});

	it('leaves every other siglum alone', () => {
		const segs = parseRefs('Cf. Council of Trent (1546): DS 1514.');
		const ds = segs.find((s) => s.kind === 'document' && s.label === 'DS') as
			Extract<RefSegment, { kind: 'document' }> | undefined;
		expect(ds?.locus).toBe('1514');
		expect(ds?.external).toBeUndefined();
	});

	// The outbound address is not a slug and must never be mistaken for one:
	// `refHref` still declines the segment, so nothing that resolves addresses
	// on THIS site sees an AAS volume as one of them.
	it('still resolves to no address on this site', () => {
		const seg = aas('Cf. ibid., 11: AAS 58 (1966), 1033-1034.')!;
		expect(seg.slug).toBeNull();
		expect(refHref(seg, { lang: 'en' })).toBeUndefined();
		expect(glossOf(seg)).toMatch(/^AAS — Acta Apostolicae Sedis/);
	});

	it('reads the same volume in running prose', () => {
		const segs = linkifyProse('The text was promulgated (AAS 58 (1966), 1033) that autumn.', {
			lang: 'en'
		});
		const seg = segs.find((s) => s.kind === 'document' && s.label === 'AAS') as
			Extract<RefSegment, { kind: 'document' }> | undefined;
		expect(seg?.external?.href).toBe(
			'https://www.vatican.va/archive/aas/documents/AAS-58-1966-ocr.pdf'
		);
	});
});

/**
 * The second: an Acta Sanctae Sedis volume, the gazette AAS replaced in 1909.
 * A 41-row table rather than a derivation — the filenames are irregular and
 * the volume/year offset only holds from volume 9 up — but the printed year
 * is a check here exactly as it is for AAS, and for the same reason: it is
 * what refuses a misprinted siglum. See the ASS section in `refs-grammar.ts`.
 *
 * Every citation below is one the corpus actually prints.
 */
describe('external sources — ASS volumes', () => {
	const ass = (text: string, lang = 'en') =>
		parseRefs(normalizeCitationSpacing(text), { lang }).find(
			(s) => s.kind === 'document' && s.label === 'ASS'
		) as Extract<RefSegment, { kind: 'document' }> | undefined;

	it('opens the volume PDF when the printed year matches the table', () => {
		expect(ass('Encyclical Letter Immortale Dei: ASS 18 (1885), 170–171;')?.external).toEqual({
			href: 'https://www.vatican.va/archive/ass/documents/ASS-18-1885-ocr.pdf',
			label: '18 (1885)'
		});
	});

	it('pads a single-digit volume, as the Vatican’s own filenames do', () => {
		expect(ass('Const. Ap. Romanos Pontifices: ASS 3 (1867) 162;')?.external?.href).toBe(
			'https://www.vatican.va/archive/ass/documents/ASS-03-1867-ocr.pdf'
		);
	});

	// A volume bound across two years is cited by either of them, and the
	// editions abbreviate the span three ways. Only the FIRST year is read;
	// the tail is the same volume's other year however it is written.
	it('accepts either year of a two-year volume, and every spelling of the span', () => {
		const href = 'https://www.vatican.va/archive/ass/documents/ASS-23-1890-91-ocr.pdf';
		for (const printed of [
			'Enz. Rerum novarum: ASS 23 (1890-91) 649-662',
			'Rerum Novarum: ASS 23 (1890-1891), p. 651',
			'Enc. Rerum novarum, ASS 23 (1890/91) 643ss',
			'Rerum novarum: ASS 23 (1890–1891), 643ff'
		]) {
			expect(ass(printed)?.external?.href).toBe(href);
		}
		// Volume 29 is 1896-97, and Divinum illud is dated by its second year.
		expect(ass('Enz. Divinum illud, 9. Mai 1897: ASS 29 (1897) 650-651.', 'de')?.external).toEqual({
			href: 'https://www.vatican.va/archive/ass/documents/ASS-29-1896-97-ocr.pdf',
			label: '29 (1897)'
		});
	});

	// The Vatican's own index brackets the year, and fourteen citations
	// follow it.
	it('accepts the year in square brackets', () => {
		expect(
			ass('Litt. Ap. Apostolicae Sedis, 12 oct. 1869: ASS 5 [1869], 305-331')?.external?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-05-1869-70-ocr.pdf');
		expect(
			ass('condamnant l\u2019avortement direct : ASS 17 [1884], 556', 'fr')?.external?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-17-1884-ocr.pdf');
	});

	// The volumes whose names carry the supplement's page range — nothing
	// about the filename follows from the volume and year, which is the whole
	// argument for a table.
	it('opens the two volumes bound with a supplement', () => {
		expect(ass('ASS 10 (1877) 3')?.external?.href).toBe(
			'https://www.vatican.va/archive/ass/documents/ASS-10-1877-1-639+supplemento-321-448-ocr.pdf'
		);
		expect(ass('ASS 16 (1883-84) 5')?.external?.href).toBe(
			'https://www.vatican.va/archive/ass/documents/ASS-16-1883-84-1-576+supplemento-17-96-ocr.pdf'
		);
	});

	// The French and Latin editions set the volume in Roman, and it is the
	// same address — XXVIII is 28, whose years are 1895-96.
	it('reads a volume set in Roman', () => {
		expect(
			ass('Lettre encyclique Satis cognitum du 29 juin 1896. ASS XXVIII (1895-1896) 710.', 'fr')
				?.external
		).toEqual({
			href: 'https://www.vatican.va/archive/ass/documents/ASS-28-1895-96-ocr.pdf',
			label: 'XXVIII (1895)'
		});
		expect(
			ass('Lettre encyclique Divinum illud du 9 mai 1897. ASS XXIX (1897) 649.', 'fr')?.external
				?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-29-1896-97-ocr.pdf');
	});

	// `ASS, XLI, 1908` — no bracket at all, which is how the Latin editions
	// set it. Safe because the number must equal one of the volume's own
	// years, and an ASS page never reaches four digits.
	it('reads a year printed after a bare comma', () => {
		expect(
			ass('Cf S. PIUS X, Adhortatio apost. Haerent animo: ASS, XLI, 1908, pp. 555-577;', 'la')
				?.external?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-41-1908-ocr.pdf');
		expect(
			ass('Leo XIII, litt. enc. Adiutricem populi: ASS, XXVIII, 1895-1896, p.130.', 'la')?.external
				?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-28-1895-96-ocr.pdf');
		// A page list is not a year, however many numbers it chains.
		expect(ass('Haerent animo: ASS 41,555-575.')?.external).toBeUndefined();
		expect(ass('ASS 14, 449ss.')?.external).toBeUndefined();
	});

	// The digit twin of the same form. `LOCUS_RE` chains on commas, so the
	// volume, the year and the pages all arrive as one locus.
	it('reads a year chained into the locus', () => {
		expect(
			ass('Acta Pii IX, V, 55-72; ASS 5, 1869, 305-331; Fontes Iuris Canonici', 'de')?.external
		).toEqual({
			href: 'https://www.vatican.va/archive/ass/documents/ASS-05-1869-70-ocr.pdf',
			label: '5 (1869)'
		});
		expect(
			ass('die direkte Abtreibung verurteilt hat (ASS 17, 1884, S. 556;', 'de')?.external?.href
		).toBe('https://www.vatican.va/archive/ass/documents/ASS-17-1884-ocr.pdf');
	});

	// The year check answers for a numeral exactly as for a digit, and both
	// of these need it: Casti connubii is AAS 22 (1930), and Haerent animo is
	// volume XLI, which this source has set as XII.
	it('refuses a Roman volume the printed year contradicts', () => {
		expect(
			ass('Lettre encyclique Casti connubii du 31 décembre 1930 : ASS XXII (1930) 539-592.', 'fr')
				?.external
		).toBeUndefined();
		expect(
			ass('Exhortation Haerent animo du 4 août 1908 : ASS XII (1908) 555-577.', 'fr')?.external
		).toBeUndefined();
	});

	it('refuses a Roman volume with no year beside it', () => {
		expect(
			ass('lo Spirito Santo è l’anima di lei (ASS XXIX p. 650).', 'it')?.external
		).toBeUndefined();
	});

	// THE MIRROR OF THE AAS TRAP. Mystici Corporis is AAS 35 (1943); volume 35
	// of the ASS is 1902-3. Deriving the file from the volume alone would open
	// a real scan forty years early, and nothing downstream could tell.
	it('refuses a volume whose printed year says Acta Apostolicae Sedis', () => {
		const seg = ass('Pius XII, Litt. Encycl. Mystici Corporis, 29 iun. 1943: ASS 35 (1943) p. 209');
		// Still recognized, still glossed — only the way out is withheld.
		expect(seg).toMatchObject({ locus: '35' });
		expect(seg?.external).toBeUndefined();
		expect(
			ass('Litt. Encycl. Divino afflante Spiritu: ASS 12 (1920) 396;')?.external
		).toBeUndefined();
	});

	// The series ceased with volume 41 in 1908, so these name no volume at
	// all — they are AAS references under the wrong siglum.
	it('refuses a volume the series never had', () => {
		expect(ass('ASS 79 (1987), 1453')?.external).toBeUndefined();
		expect(ass('ASS 91 (1999), 89')?.external).toBeUndefined();
	});

	it('refuses a citation that prints no year to check the volume against', () => {
		expect(ass('ASS 18, 170-171.')?.external).toBeUndefined();
		expect(ass('ASS 23, pp. 643 ss.')?.external).toBeUndefined();
	});

	// The gazettes are two rows in one table, not two code paths, and neither
	// answers for the other's siglum.
	it('keeps the two gazettes apart', () => {
		expect(ass('AAS 18 (1885) p. 161.')).toBeUndefined();
		const seg = parseRefs('Cf. ibid., 11: AAS 58 (1966), 1033-1034.').find(
			(s) => s.kind === 'document' && s.label === 'AAS'
		) as Extract<RefSegment, { kind: 'document' }> | undefined;
		expect(seg?.external?.href).toContain('/archive/aas/');
	});
});

describe('parseRefs — the Code of Canon Law', () => {
	// The Catechism cites the Code 264 times and writes `CIC, can. 748, § 2`.
	// Until 2026-09-03 the siglum matched and the number did not: `LOCUS_RE`
	// wanted a digit and met a `c`, so every one of them rendered as a
	// decoder-ring tooltip beside a canon number left in plain text. `CIC 748`,
	// the one form that did resolve, is printed almost nowhere.
	it('absorbs the canon marker, the comma before it, and the § after it', () => {
		const doc = (s: string) => parseRefs(s).find((x) => x.kind === 'document');
		expect(doc('Cf. CIC, can. 748, § 2')).toMatchObject({
			label: 'CIC',
			locus: '748',
			work: 'canon-law',
			slug: null,
			raw: 'CIC, can. 748, § 2'
		});
		expect(doc('cf. CIC can. 216')).toMatchObject({ locus: '216', raw: 'CIC can. 216' });
		expect(doc('CIC, cann. 1055-1056')).toMatchObject({
			locus: '1055-1056',
			raw: 'CIC, cann. 1055-1056'
		});
		// The bare form still works, and still names the same canon.
		expect(doc('CIC 748')).toMatchObject({ locus: '748', raw: 'CIC 748' });
	});

	// The comma and the marker are per-siglum, not global: `AAS 86 (1994), 449`
	// is a volume and a page, and a grammar that swallowed a comma after every
	// siglum would read the page as part of the volume's locus.
	it('leaves other sigla alone', () => {
		const aas = parseRefs('AAS 86 (1994), 386-387').find((x) => x.kind === 'document');
		expect(aas).toMatchObject({ label: 'AAS', locus: '86' });
		expect(aas).not.toHaveProperty('work');
	});

	// `c.` after a siglum that is not the Code is as likely to be a chapter,
	// which is why the marker is reached through `SiglumEntry.work`.
	it('does not read a canon marker after a document siglum', () => {
		const dv = parseRefs('DV, c. 3').find((x) => x.kind === 'document');
		expect(dv).toMatchObject({ label: 'DV', locus: null, raw: 'DV' });
	});
});
