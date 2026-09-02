import { describe, expect, it } from 'vitest';
import { resolveBookToken } from './book-token';

// Fixtures (see CLAUDE.md — `npm test` never sees the real corpus) carry
// Genesis and John in both editions, which is exactly the asymmetry this
// module exists for: CPDV records `gen|ge|gn` / `jn|joh|john`, Matos Soares
// records one abbreviation each (`gn`, `jo`) and leaves its full names
// ("Gênesis", "São João") reachable only through `name`.
const CPDV = 'bible.cpdv.en';
const PT = 'bible.matos-soares.pt';
const DR = 'bible.douay-rheims.en';

describe('resolveBookToken', () => {
	it('resolves an abbreviation from either edition', () => {
		expect(resolveBookToken('john')?.book.osis).toBe('john');
		expect(resolveBookToken('jo')?.book.osis).toBe('john');
		expect(resolveBookToken('gn')?.book.osis).toBe('gen');
	});

	it('resolves a bare OSIS code', () => {
		expect(resolveBookToken('gen')?.book.osis).toBe('gen');
	});

	it('resolves a Portuguese full name, which no abbreviation covers', () => {
		expect(resolveBookToken('sãojoão')?.book.osis).toBe('john');
		expect(resolveBookToken('gênesis')?.book.osis).toBe('gen');
	});

	it('normalizes a raw, unnormalized token too (spaces, case, dots)', () => {
		expect(resolveBookToken('São João')?.book.osis).toBe('john');
		expect(resolveBookToken('Gn.')?.book.osis).toBe('gen');
	});

	it('falls back to an accent-insensitive reading for a reader who did not type them', () => {
		expect(resolveBookToken('saojoao')?.book.osis).toBe('john');
		expect(resolveBookToken('genesis')?.book.osis).toBe('gen');
	});

	it('prefers an exact reading in ANY edition over an accent-folded one in the reader’s own', () => {
		// "gênesis" is exactly the PT edition's name, so it resolves there even
		// with the English edition preferred — the accent the reader typed is
		// evidence, not noise.
		expect(resolveBookToken('gênesis', { preferWorkId: CPDV })?.workId).toBe(PT);
		// And the reverse: "genesis" is an exact English reading — the
		// Douay-Rheims prints it as an abbreviation, the CPDV as its display
		// name — so it wins in English even with Portuguese preferred, rather
		// than being folded into the PT name. Which English edition reports it
		// is tier order, not preference: an abbreviation outranks a name.
		expect(resolveBookToken('genesis', { preferWorkId: PT })?.workId).toBe(DR);
	});

	it("gives a same-tier tie to the language's preferred edition", () => {
		// "joh" is a real abbreviation in BOTH English editions and in neither
		// the OSIS code nor anything Portuguese carries, so nothing about the
		// token separates the two and the answer used to be registry order. It
		// is now PREFERRED_EDITION, the same table that decides which Bible the
		// reader opens — so this moved with it on 2026-09-01 and is the one
		// test outside `corpus.test.ts` that reads the table's value rather
		// than a work id. (An OSIS code like "gen" would NOT show this: every
		// edition matches it, so the reader's own wins first, as it should.)
		expect(resolveBookToken('joh', { preferWorkId: PT })?.workId).toBe(DR);
	});

	it('breaks a tie between editions in favour of the reader’s own', () => {
		// "gn" is a real abbreviation in both — the same book here, but the tie
		// is what decides genuinely divergent tokens like "jn" (John in
		// English, Jonas in Portuguese) against the full corpus.
		expect(resolveBookToken('gn', { preferWorkId: PT })?.workId).toBe(PT);
		expect(resolveBookToken('gn', { preferWorkId: CPDV })?.workId).toBe(CPDV);
	});

	it('ignores a preference naming an edition that is not present', () => {
		expect(resolveBookToken('gn', { preferWorkId: 'bible.nonexistent.la' })?.book.osis).toBe('gen');
	});

	it('returns undefined for a token no edition names', () => {
		expect(resolveBookToken('asdf')).toBeUndefined();
		expect(resolveBookToken('')).toBeUndefined();
	});
});
