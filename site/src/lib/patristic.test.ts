import { describe, expect, it } from 'vitest';
import { authorInClause, clusterAuthors, foldName, locatorsIn } from '../../scripts/patristic.mjs';

/**
 * Reading which Father the library is cited for.
 *
 * Every case below is a shape the corpus really prints, and the three
 * `describe`s are the three rules `patristic.mjs` argues for — each of which
 * was arrived at by a wrong answer the census published.
 */

const sighting = (
	name: string,
	locators: string[],
	lang = 'la',
	citer = 'ccc 1',
	counts = true
) => ({ name, lang, locators, citer, counts });

describe('authorInClause', () => {
	it('reads the name before the locator the colon introduces', () => {
		expect(authorInClause('Sanctus Augustinus, Sermo 241, 2: PL 38, 1134.')).toBe(
			'Sanctus Augustinus'
		);
		expect(
			authorInClause('Sanctus Gregorius Magnus, Homilia in Ezechielem 1, 7, 8: CCL 142, 87')
		).toBe('Sanctus Gregorius Magnus');
	});

	/** Roughly one series citation in eight prints no colon at all, and the
	 *  head then runs to the siglum. */
	it('reads it where the edition prints no colon', () => {
		expect(authorInClause('Origen, De orat. 29 PG 11, 544CD.')).toBe('Origen');
		expect(authorInClause('St. Cyprian, De Dom. orat. 21 PL 4, 534A.')).toBe('St. Cyprian');
	});

	it('drops the apparatus in front of the name', () => {
		expect(authorInClause('Cf Sanctus Ambrosius, Explanatio Symboli, 8: CSEL 73, 10-11')).toBe(
			'Sanctus Ambrosius'
		);
		expect(authorInClause('5 Sanctus Augustinus, Contra epistulam, 5, 6: CSEL 25, 197')).toBe(
			'Sanctus Augustinus'
		);
	});

	/**
	 * WHERE THE AUTHOR SAT IN THE PREVIOUS FOOTNOTE the clause opens with the
	 * work, and reading that as a person is what put `De Trinitate` and
	 * `Homiliae in Matthaeum` at the head of clusters — and, being shared
	 * between authors, bridged them.
	 */
	it('refuses a head that is a work rather than a person', () => {
		expect(authorInClause('De Trinitate, 15, 26, 47: CCL 50A, 529')).toBeNull();
		expect(authorInClause('Homiliae in Matthaeum 19, 5: PG 57, 280')).toBeNull();
		expect(authorInClause('Epistula 66, 8: CSEL 3, 733')).toBeNull();
		expect(authorInClause('Adversus haereses 3, 24, 1: SC 211, 472')).toBeNull();
	});

	/** An ibidem word stands where a name would and the antecedent is the note
	 *  before; `Ders` is German `derselbe` and reached the ranking once. */
	it('refuses an ibidem word', () => {
		expect(authorInClause('Ibid. 2, 9: PL 176, 642-643')).toBeNull();
		expect(authorInClause('Ibidem, 4: PL 32, 659')).toBeNull();
		expect(authorInClause('Ders., Sermo 43: PL 38, 258')).toBeNull();
	});

	/** An inline citation opens with the sentence that raised it, not a name. */
	it('refuses running prose', () => {
		expect(
			authorInClause(
				'Per tale motivo san Giustino poté parlare di semi del Verbo nel mondo: PG 6, 421'
			)
		).toBeNull();
	});

	it('refuses a scripture locator and a clause naming no series', () => {
		expect(authorInClause('1 Co 7, 5: PL 4, 519')).toBeNull();
		expect(authorInClause('Sanctus Augustinus, Sermo 241, 2.')).toBeNull();
	});
});

describe('locatorsIn', () => {
	/** Volume AND column: `PL 38` alone is the whole of Augustine's sermons and
	 *  would join every text printed in that volume into one author. */
	it('takes the volume and the column together', () => {
		expect(locatorsIn('Sermo 241, 2: PL 38, 1134.')).toEqual(['PL 38 1134']);
		expect(locatorsIn('Confessiones 1, 1, 1: CCL 27, 1 (PL 32, 659-661).')).toEqual([
			'CCL 27 1',
			'PL 32 659'
		]);
	});

	it('finds none where the clause names no series', () => {
		expect(locatorsIn('Sanctus Augustinus, Sermo 241, 2.')).toEqual([]);
	});
});

describe('foldName', () => {
	/** Most of the merging is done before a locator is consulted at all. */
	it('folds case, diacritics and the honorific into one key', () => {
		expect(foldName('Sanctus Augustinus')).toBe(foldName('S. AUGUSTINUS'));
		expect(foldName('Sanctus Augustinus')).toBe(foldName('Augustinus'));
		expect(foldName('São Justino')).toBe(foldName('S. Justino'));
	});

	it('keeps two different men apart', () => {
		expect(foldName('Sanctus Augustinus')).not.toBe(foldName('Sanctus Ambrosius'));
	});
});

describe('clusterAuthors', () => {
	/**
	 * THE ORACLE. A locator is a volume and column in somebody else's book, so
	 * it is the same string in every language and every edition citing it names
	 * the same man — which is the only thing that can link `St. Augustine` to
	 * `Sanctus Augustinus`, there being no letters in common to fold.
	 */
	it('joins two languages that meet at three locators', () => {
		const locs = ['PL 38 1134', 'PL 32 659', 'CCL 27 1'];
		const rows = clusterAuthors([
			...locs.map((l) => sighting('Sanctus Augustinus', [l], 'la')),
			...locs.map((l) => sighting('St. Augustine', [l], 'en'))
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].spellings).toEqual(['Sanctus Augustinus', 'St. Augustine']);
	});

	/**
	 * ONE SHARED LOCATOR IS A COINCIDENCE A MISPRINT CAN MANUFACTURE, and the
	 * relation is closed transitively, so a single bad edge chains everything:
	 * at a threshold of one, 4,450 of 6,878 heads came out as one Augustine.
	 */
	it('refuses to join on fewer than three', () => {
		const rows = clusterAuthors([
			sighting('Sanctus Augustinus', ['PL 38 1134'], 'la'),
			sighting('St. Jerome', ['PL 38 1134'], 'en'),
			sighting('Sanctus Augustinus', ['PL 32 659'], 'la'),
			sighting('St. Jerome', ['PL 32 659'], 'en')
		]);
		expect(rows).toHaveLength(2);
	});

	/** `/census` is written in English, and ranked on frequency alone the page
	 *  printed `S. CYPRIANUS` and `Sant'Ireneo di Lione` at its head. */
	it('prints the English spelling where the cluster has one', () => {
		const locs = ['PG 7 1 ', 'PG 7 2', 'PG 7 3'].map((l) => l.trim());
		const rows = clusterAuthors([
			...locs.map((l) => sighting("Sant'Ireneo di Lione", [l], 'it')),
			...locs.map((l) => sighting("Sant'Ireneo di Lione", [l], 'it', 'ccc 2')),
			...locs.map((l) => sighting('St. Irenaeus', [l], 'en'))
		]);
		expect(rows[0].name).toBe('St. Irenaeus');
	});

	/** An apparatus that shouts its authors is a printing convention of one
	 *  edition, not a way to write a man's name. */
	it('takes a shouted spelling last', () => {
		const rows = clusterAuthors([
			sighting('S. CYPRIANUS', ['CSEL 3 1'], 'la'),
			sighting('S. CYPRIANUS', ['CSEL 3 1'], 'la', 'ccc 2')
		]);
		expect(rows[0].name).toBe('S. CYPRIANUS');
		const withCased = clusterAuthors([
			sighting('S. CYPRIANUS', ['CSEL 3 1'], 'la'),
			sighting('S. CYPRIANUS', ['CSEL 3 1'], 'la', 'ccc 2'),
			sighting('S. Cyprianus', ['CSEL 3 1'], 'la', 'ccc 3')
		]);
		expect(withCased[0].name).toBe('S. Cyprianus');
	});

	/**
	 * EVERY SIGHTING IS EVIDENCE AND ONLY SOME ARE COUNTED. Narrowing the input
	 * to the sightings that rank throws away the co-occurrences the clustering
	 * runs on — it left Cyprian as two rows, one Latin and one Italian.
	 */
	it('clusters on a sighting that does not count, and does not rank it', () => {
		const locs = ['PL 4 519', 'PL 4 520', 'PL 4 521'];
		const rows = clusterAuthors([
			...locs.map((l) => sighting('S. Cyprianus', [l], 'la', 'ccc 1', false)),
			...locs.map((l) => sighting('St. Cyprian', [l], 'en', 'ccc 2', true))
		]);
		expect(rows).toHaveLength(1);
		expect(rows[0].name).toBe('St. Cyprian');
		// One citing place, not two: the Latin sighting voted and did not count.
		expect(rows[0].citers.size).toBe(1);
	});

	it('drops a cluster nothing counted at all', () => {
		expect(clusterAuthors([sighting('S. Cyprianus', ['PL 4 519'], 'la', 'ccc 1', false)])).toEqual(
			[]
		);
	});

	it('counts a citing place once however many clauses name him', () => {
		const rows = clusterAuthors([
			sighting('Tertullianus', ['PL 2 274'], 'la', 'ccc 9'),
			sighting('Tertullianus', ['PL 2 275'], 'la', 'ccc 9')
		]);
		expect(rows[0].citers.size).toBe(1);
	});
});
