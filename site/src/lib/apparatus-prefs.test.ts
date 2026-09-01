import { beforeEach, describe, expect, it } from 'vitest';
import { apparatusPrefs } from './apparatus-prefs.svelte';

const EDITION = 'bible.douay-rheims.en';
const COMMENTARY = 'commentary.haydock.en';
const OTHER = 'commentary.other.en';

// A module-level singleton, like `compare-pref`'s, so tests must not leak into
// each other. Reset to the defaults rather than exporting a second constructor
// just for tests.
beforeEach(() => {
	apparatusPrefs.setEditionNotes(EDITION, true);
	apparatusPrefs.setCommentary(COMMENTARY, false);
	apparatusPrefs.setCommentary(OTHER, false);
});

describe('the two defaults, which are deliberately opposite', () => {
	it("has an edition's own notes ON for an edition it has never been told about", () => {
		// The reader picked the edition; its apparatus is part of what they
		// picked. A new edition ingested tomorrow must arrive switched on.
		expect(apparatusPrefs.editionNotesEnabled('bible.martini.it')).toBe(true);
	});

	it('has a commentary OFF for one it has never been told about', () => {
		// The largest body of text in the corpus, and nobody opening a chapter
		// asked for it. A new commentary must arrive switched off.
		expect(apparatusPrefs.commentaryEnabled('commentary.someone.en')).toBe(false);
	});

	it('treats an absent work id as notes-on rather than throwing', () => {
		// The Bible route asks before it knows there is an edition — chapter 0
		// is a book introduction and has none.
		expect(apparatusPrefs.editionNotesEnabled(undefined)).toBe(true);
	});
});

describe('switching', () => {
	it("turns an edition's notes off and back on", () => {
		apparatusPrefs.setEditionNotes(EDITION, false);
		expect(apparatusPrefs.editionNotesEnabled(EDITION)).toBe(false);
		apparatusPrefs.setEditionNotes(EDITION, true);
		expect(apparatusPrefs.editionNotesEnabled(EDITION)).toBe(true);
	});

	it('turns a commentary on and back off', () => {
		apparatusPrefs.setCommentary(COMMENTARY, true);
		expect(apparatusPrefs.commentaryEnabled(COMMENTARY)).toBe(true);
		apparatusPrefs.setCommentary(COMMENTARY, false);
		expect(apparatusPrefs.commentaryEnabled(COMMENTARY)).toBe(false);
	});

	it('holds several commentaries at once — the whole reason this is a set', () => {
		// The one thing `content.svelte.ts`'s `Override` cannot express, and
		// the reason this store exists beside it rather than inside it.
		apparatusPrefs.setCommentary(COMMENTARY, true);
		apparatusPrefs.setCommentary(OTHER, true);
		expect(apparatusPrefs.commentaryEnabled(COMMENTARY)).toBe(true);
		expect(apparatusPrefs.commentaryEnabled(OTHER)).toBe(true);
	});

	it('keeps the two halves independent', () => {
		// One list is "off despite the default" and the other "on despite the
		// default"; a single enabled-set would have conflated them.
		apparatusPrefs.setEditionNotes(EDITION, false);
		apparatusPrefs.setCommentary(COMMENTARY, true);
		expect(apparatusPrefs.editionNotesEnabled(EDITION)).toBe(false);
		expect(apparatusPrefs.commentaryEnabled(COMMENTARY)).toBe(true);
	});

	// Haydock reproduces 1,399 of the Douay-Rheims's 1,916 notes, so with both
	// on the reader met most of Challoner twice. The commentary's manifest says
	// so and this turns the default around; nothing is suppressed.
	it('turns the edition off by default once a commentary contains it', () => {
		expect(apparatusPrefs.editionNotesEnabled(EDITION, true)).toBe(false);
		expect(apparatusPrefs.editionNotesEnabled(EDITION, false)).toBe(true);
	});

	// The reader is still allowed both — the overlap is 73%, not 100%.
	it('lets the reader put a subsumed edition back on', () => {
		apparatusPrefs.setEditionNotes(EDITION, true, true);
		expect(apparatusPrefs.editionNotesEnabled(EDITION, true)).toBe(true);
	});

	// The invariant the whole store rests on: what is stored is the difference
	// from the default. A choice made under one default must not survive as a
	// silent override of the other, so switching the commentary off has to
	// leave the edition's notes back on rather than off.
	it('stores the difference from whichever default was in force', () => {
		apparatusPrefs.setEditionNotes(EDITION, false, true);
		expect(apparatusPrefs.editionNotesEnabled(EDITION, true)).toBe(false);
		expect(apparatusPrefs.editionNotesEnabled(EDITION, false)).toBe(true);
	});

	it('is idempotent, so a stored list cannot grow a duplicate', () => {
		apparatusPrefs.setCommentary(COMMENTARY, true);
		apparatusPrefs.setCommentary(COMMENTARY, true);
		apparatusPrefs.setCommentary(COMMENTARY, false);
		expect(apparatusPrefs.commentaryEnabled(COMMENTARY)).toBe(false);
	});
});
