import { describe, expect, it, vi } from 'vitest';
import { linkifyProse, parseRefs, refHref, type RefSegment } from './refs';

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
			gen: { osis: 'gen', name: 'Genesis', abbrevs: ['gen'], order: 1, chapters: makeChapters({ 1: 13 }) },
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
				chapters: makeChapters({ 1: 6, 9: 39, 21: 32, 50: 21, 113: 26, 114: 9, 115: 10, 146: 11, 147: 9 })
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

vi.mock('./corpus', () => ({
	findBookByAbbrev: (workId: string, abbrev: string) => mockBibleBooks[workId]?.[abbrev.toLowerCase()],
	workIdToEdition: (workId: string) => workId.replace(/^bible\./, '')
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
			{ kind: 'document', sigla: 'DV', locus: '3', expansion: expect.stringContaining('Dei Verbum'), raw: 'DV 3' },
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
		const refs = segs.filter((s): s is Extract<RefSegment, { kind: 'scripture' }> => s.kind === 'scripture');
		expect(refs[0].cf).toBe(true);
		expect(refs[1].cf).toBeUndefined();
	});

	it('emits an empty-array whole-chapter reference', () => {
		const segs = parseRefs('Ps 22.');
		expect(segs).toContainEqual({ kind: 'scripture', osis: 'ps', chapter: 22, verses: [], raw: 'Ps 22' });
	});

	it('strips a verse-subdivision letter', () => {
		const segs = parseRefs('Mt 5:3a.');
		expect(segs).toContainEqual({ kind: 'scripture', osis: 'matt', chapter: 5, verses: [3], raw: 'Mt 5:3a' });
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
		expect(segs).toContainEqual({ kind: 'scripture', osis: 'mark', chapter: 10, verses: [14], raw: 'Mk 10 14' });
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
		expect(segs).toContainEqual({ kind: 'scripture', osis: '1cor', chapter: 13, verses: [12], raw: 'l Cor 13:12' });
	});

	it('recognizes the "In" typo for "Jn"', () => {
		const segs = parseRefs('In 17:3.');
		expect(segs).toContainEqual({ kind: 'scripture', osis: 'john', chapter: 17, verses: [3], raw: 'In 17:3' });
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
		expect(refs).toEqual([{ kind: 'scripture', osis: '1cor', chapter: 2, verses: [8], cf: true, raw: 'I Cor 2:8' }]);
	});

	it('treats a single-chapter book\'s bare number as a verse, not a chapter', () => {
		for (const [text, osis, chapter, verses] of [
			['LG 12; cf. Jude 3.', 'jude', 1, [3]],
			['I Tim 3:15; Jude 3.', 'jude', 1, [3]],
			['Cf. I Jn 4:2-3; 2 Jn 7.', '2john', 1, [7]],
			['Cf. Jn 3:18; Acts 2:21; 5:41; 3 Jn 7; Rom 10:6-13.', '3john', 1, [7]],
			['Philem 16.', 'phlm', 1, [16]]
		] as const) {
			const refs = parseRefs(text).filter((s): s is Extract<RefSegment, { kind: 'scripture' }> => s.kind === 'scripture');
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

	it('parses a document siglum with a locus and expansion', () => {
		const segs = parseRefs('GS 19 # 1.');
		expect(segs).toContainEqual(
			expect.objectContaining({ kind: 'document', sigla: 'GS', locus: '19 # 1', raw: 'GS 19 # 1' })
		);
	});

	it('keeps unrecognized document-shaped prose entirely as text, no data lost', () => {
		const text = 'St. Augustine, Sermo 241, 2: PL 38, 1134,';
		const segs = parseRefs(text);
		expect(segs.some((s) => s.kind === 'scripture')).toBe(false);
		expect(segs.some((s) => s.kind === 'document' && s.sigla === 'PL')).toBe(true);
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
		expect(segs).toContainEqual({ kind: 'scripture', osis: 'acts', chapter: 2, verses: [42], cf: true, raw: 'Act 2, 42' });
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

	it('does not treat "Cat Rom" (Catechismus Romanus) as the Letter to the Romans', () => {
		const segs = parseRefs('Cat Rom 1, 10, 24, p. 119.', { lang: 'pt' });
		expect(segs.some((s) => s.kind === 'scripture' && s.osis === 'rom')).toBe(false);
	});

	it('recognizes the PT-specific document siglum meaning (SC = Sources Chrétiennes, not Sacrosanctum Concilium)', () => {
		const segs = parseRefs('Santo Ireneu de Lião, Adversus haereses I. 10, 1-2: SC 264, 154-158.', { lang: 'pt' });
		const doc = segs.find((s) => s.kind === 'document' && s.sigla === 'SC');
		expect(doc).toBeTruthy();
		expect((doc as Extract<RefSegment, { kind: 'document' }>).expansion).toContain('Sources Chrétiennes');
	});
});

describe('parseRefs — bare CCC-paragraph-number lists (Compendium ccc_refs, CCC related)', () => {
	it('parses a comma/space-separated list of single numbers and ranges', () => {
		const segs = parseRefs('279-289, 296-298');
		expect(kinds(segs)).toEqual(['ccc', 'text', 'ccc', 'text', 'ccc', 'text', 'ccc']);
		expect(segs.filter((s) => s.kind === 'ccc').map((s) => (s as Extract<RefSegment, { kind: 'ccc' }>).n)).toEqual([
			279, 289, 296, 298
		]);
	});

	it('parses the real corpus\'s space-separated ccc_refs shape', () => {
		const segs = parseRefs('27-30 44-45');
		expect(segs.filter((s) => s.kind === 'ccc').map((s) => (s as Extract<RefSegment, { kind: 'ccc' }>).n)).toEqual([
			27, 30, 44, 45
		]);
	});

	it('parses a single bare number', () => {
		expect(parseRefs('67')).toEqual([{ kind: 'ccc', n: 67, raw: '67' }]);
	});

	it('tolerates an en dash range and a dot separator, both observed in the real corpus', () => {
		expect(parseRefs('1 – 25').filter((s) => s.kind === 'ccc')).toHaveLength(2);
		expect(parseRefs('75-79, 83 96.98').filter((s) => s.kind === 'ccc')).toHaveLength(5);
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
		const segs = linkifyProse('As explained in cf. 1212, the Church teaches...');
		expect(segs).toEqual([
			{ kind: 'text', text: 'As explained in cf. ' },
			{ kind: 'ccc', n: 1212, raw: '1212' },
			{ kind: 'text', text: ', the Church teaches...' }
		]);
	});

	it('links "Cf. Jn 3:16" to a scripture reference', () => {
		const segs = linkifyProse('Cf. Jn 3:16 makes this explicit.');
		expect(segs).toEqual([
			{ kind: 'text', text: 'Cf. ' },
			{ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' },
			{ kind: 'text', text: ' makes this explicit.' }
		]);
	});

	it('links "cf. nn. 1212-1215" as a CCC paragraph range', () => {
		const segs = linkifyProse('cf. nn. 1212-1215 for more.');
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
		const segs = linkifyProse('See cf. above and cf. 1212 below.');
		expect(segs).toEqual([
			{ kind: 'text', text: 'See cf. above and cf. ' },
			{ kind: 'ccc', n: 1212, raw: '1212' },
			{ kind: 'text', text: ' below.' }
		]);
	});
});

describe('refHref', () => {
	it('links a CCC segment without needing any corpus context', () => {
		expect(refHref({ kind: 'ccc', n: 1212, raw: '1212' }, {})).toBe('/ccc/1212');
	});

	it('links a Compendium segment without needing any corpus context', () => {
		expect(refHref({ kind: 'compendium', n: 42, raw: '42' }, {})).toBe('/compendium/42');
	});

	it('never links a document segment', () => {
		expect(
			refHref({ kind: 'document', sigla: 'DV', locus: '3', expansion: 'Dei Verbum', raw: 'DV 3' }, {})
		).toBeUndefined();
	});

	it('never links a text segment', () => {
		expect(refHref({ kind: 'text', text: 'hello' }, {})).toBeUndefined();
	});

	it('links a scripture segment present in the given Bible edition (fixture: bible.cpdv.en has gen ch.1, john ch.1+3)', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' }, { bibleWorkId: 'bible.cpdv.en' })
		).toBe('/bible/cpdv.en/gen/1#v1');

		expect(
			refHref({ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' }, { bibleWorkId: 'bible.cpdv.en' })
		).toBe('/bible/cpdv.en/john/3#v16');
	});

	it('omits the verse anchor for a whole-chapter reference', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'john', chapter: 3, verses: [], raw: 'John 3' }, { bibleWorkId: 'bible.cpdv.en' })
		).toBe('/bible/cpdv.en/john/3');
	});

	it('returns undefined when no Bible edition is given', () => {
		expect(refHref({ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' }, {})).toBeUndefined();
	});

	it('returns undefined for a book absent from the given edition (fixture only has gen + john)', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'exod', chapter: 3, verses: [6], raw: 'Ex 3:6' }, { bibleWorkId: 'bible.cpdv.en' })
		).toBeUndefined();
	});

	it('returns undefined for a chapter absent from the given edition (fixture gen only has chapter 1)', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'gen', chapter: 9, verses: [16], raw: 'Gen 9:16' }, { bibleWorkId: 'bible.cpdv.en' })
		).toBeUndefined();
	});

	it('returns undefined for an unknown work id (never throws)', () => {
		expect(
			refHref({ kind: 'scripture', osis: 'gen', chapter: 1, verses: [1], raw: 'Gen 1:1' }, { bibleWorkId: 'bible.nonexistent' })
		).toBeUndefined();
	});

	describe('Hebrew/Masoretic versification (Psalms, Malachi, Joel)', () => {
		it('converts a Hebrew Psalm chapter+verse to its Vulgate address (ccc112: "Ps 22:14" -> Vulgate 21:14)', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'ps', chapter: 22, verses: [14], raw: 'Ps 22:14' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/ps/21#v14');
		});

		it('converts Malachi across the chapter 3/4 split (ccc678: "Mal 3: 19" -> Vulgate 4:1)', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'mal', chapter: 3, verses: [19], raw: 'Mal 3: 19' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/mal/4#v1');
		});

		it('converts Joel across the chapter 2/3 fold ("Joel 3:1-5" -> Vulgate 2:28)', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'joel', chapter: 3, verses: [1, 2, 3, 4, 5], raw: 'Joel 3:1-5' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/joel/2#v28');
		});

		it('never leaves a whole-chapter Joel 3 pointing at the literal (unconverted, WRONG) Vulgate chapter 3, which trivially "exists" but means Hebrew Joel 4', () => {
			const href = refHref(
				{ kind: 'scripture', osis: 'joel', chapter: 3, verses: [], raw: 'Joel 3' },
				{ bibleWorkId: 'bible.cpdv.en' }
			);
			expect(href).toBe('/bible/cpdv.en/joel/2');
			expect(href).not.toContain('/joel/3');
		});

		it('degrades to a chapter-only link when the mapped verse does not exist, same guarantee as the non-divergent path', () => {
			// Ps 22 (Hebrew) -> Vulg 21, which only has 32 verses in the fixture.
			expect(
				refHref({ kind: 'scripture', osis: 'ps', chapter: 22, verses: [9999], raw: 'Ps 22:9999' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/ps/21');
		});

		it('omits the anchor for a whole-chapter Psalm reference that is not a split psalm', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'ps', chapter: 51, verses: [], raw: 'Ps 51' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/ps/50');
		});

		it('picks the first half for a whole-chapter reference to a split psalm (Ps 116 -> Vulg 114)', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'ps', chapter: 116, verses: [], raw: 'Ps 116' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/ps/114');
		});

		it('leaves non-divergent books unaffected by the versification path', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'john', chapter: 3, verses: [16], raw: 'Jn 3:16' }, { bibleWorkId: 'bible.cpdv.en' })
			).toBe('/bible/cpdv.en/john/3#v16');
		});

		it('returns undefined rather than a wrong link when the divergent book is absent from the edition', () => {
			expect(
				refHref({ kind: 'scripture', osis: 'ps', chapter: 22, verses: [14], raw: 'Ps 22:14' }, { bibleWorkId: 'bible.nonexistent' })
			).toBeUndefined();
		});
	});
});
