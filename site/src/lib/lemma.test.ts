import { describe, expect, it } from 'vitest';
import { splitLemma } from './lemma';

/*
 * Every case here is a real one, quoted from the corpus, because what this
 * function is deciding is whether a source's own headword names a run of its
 * own verse — and the ways that fails are the ways three particular editors
 * happened to print. An invented example proves nothing about any of them.
 */
describe('splitLemma', () => {
	/** Nothing may be rewritten: the two halves are the input, cut. */
	const roundTrips = (text: string, lemma: string) => {
		const split = splitLemma(text, lemma);
		expect(split).toBeDefined();
		expect(split!.head + split!.lemma).toBe(text);
		return split!;
	};

	// Genesis 1:6, and the commonest shape by far: the note's headword is
	// capitalised because it heads a note, the verse's is not.
	it('marks the words the marker follows, folding case', () => {
		const split = roundTrips('And God said: Let there be a firmament', 'A firmament');
		expect(split.head).toBe('And God said: Let there be ');
		expect(split.lemma).toBe('a firmament');
	});

	// Job 68:16 (Douay). The verse's own question mark is not part of the
	// headword and is not a reason to refuse — a mark stopping one character
	// short of it would read as a slip.
	it('lets the mark cover the verse’s own closing punctuation', () => {
		const split = roundTrips(
			'Why suspect, ye curdled mountains?',
			'Why suspect, ye curdled mountains?'
		);
		expect(split.head).toBe('');
		expect(split.lemma).toBe('Why suspect, ye curdled mountains?');
	});

	// Exodus 15:13 in Matos Soares: `à`/`a` and `Santa`/`santa` at once. The
	// offset has to come from the fold's index map, or the slice returned cuts
	// a word in half.
	it('folds diacritics without moving the offset', () => {
		const split = roundTrips('conduzes à tua Santa morada', 'A tua santa morada');
		expect(split.head).toBe('conduzes ');
		expect(split.lemma).toBe('à tua Santa morada');
	});

	// John 12:7 in Matos Soares, where the headword prints a comma the verse
	// sets as a semicolon; Psalm 21:20, where the verse opens a parenthesis in
	// the middle of the words the note quotes. Punctuation carries no words, and
	// what the mark covers is the verse's, not the headword's.
	it('marks through punctuation the two do not agree on', () => {
		expect(
			roundTrips('Mas Jesus respondeu: "Deixa-a; ela reservou', 'Deixa-a , ela reservou').lemma
		).toBe('Deixa-a; ela reservou');
		expect(roundTrips('Perto estás (de mim', 'Perto estás de mim').lemma).toBe(
			'Perto estás (de mim'
		);
	});

	// Martini heads Genesis 2:8 with an elided catchword. It names two ends of
	// a phrase with the middle left out, which is not a run of anything — and
	// the guard is what stops the comparison, which drops punctuation, from
	// reading `E... diede...` as `ediede` and matching across the gap.
	it('refuses an elided catchword', () => {
		expect(
			splitLemma('E al firmamento diede Dio il nome di cielo', 'E... diede... il nome di cielo.')
		).toBeUndefined();
		expect(splitLemma('E la luce nominò giorno', 'E la luce nominò ec.')).toBeUndefined();
	});

	// Every one of Martini's 18,658 markers sits at position 0: his notes are
	// verse-level, so there is never any text before them.
	it('refuses a marker that opens its verse', () => {
		expect(splitLemma('', 'E la luce nominò')).toBeUndefined();
	});

	// Ezechiel 8:17. Without the word-boundary guard the headword matches the
	// tail of a longer word and the mark opens mid-word.
	it('refuses a headword that is only the end of a longer word', () => {
		expect(splitLemma('these men have placed their uncleannesses', 'Uncleanness')).toBeUndefined();
	});

	// Matthew 1:25 spells it as one word in the note and as two in the verse,
	// which is not a divergence between them — it is the same words, and the
	// mark covers the verse's own spelling. This is what dropping whitespace
	// from the comparison buys, and what a length-preserving fold could not.
	it('marks across a space the headword does not have', () => {
		const split = roundTrips(
			'And he knew her not till she brought forth her first born son',
			'Till she brought forth her firstborn son'
		);
		expect(split.lemma).toBe('till she brought forth her first born son');
	});

	// 1 Machabees 7:5. The verse has a word the note's heading does not, which
	// is a real divergence and not a matter of spelling — so the note keeps its
	// headword rather than the verse marking words it did not quote.
	it('refuses where the verse has a word the headword does not', () => {
		expect(
			splitLemma(
				'Now one Alcimus, who had been chief priest',
				'Now Alcimus, who had been chief priest'
			)
		).toBeUndefined();
	});

	it('refuses a headword longer than the run before the marker', () => {
		expect(splitLemma('a firmament', 'Let there be a firmament')).toBeUndefined();
	});

	// Allioli, Straubinger and Crampon print no headword at all — 59,723 notes
	// between them, every one of which arrives here.
	it('has nothing to say about a note with no lemma', () => {
		expect(splitLemma('And God said', undefined)).toBeUndefined();
		expect(splitLemma('And God said', '  ')).toBeUndefined();
	});
});
