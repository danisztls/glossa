import { beforeEach, describe, expect, it } from 'vitest';
import { apparatusPrefs, commentaryDefaultsOn } from './apparatus-prefs.svelte';
import type { WorkManifest } from './types';

const EDITION = 'bible.douay-rheims.en';
const COMMENTARY = 'commentary.haydock.en';
const OTHER = 'commentary.other.en';
// The prayers' apparatus: one work per language, and the one commentary in the
// corpus that arrives switched on.
const PRECES_EN = 'commentary.preces.en';
const PRECES_PT = 'commentary.preces.pt';

// A module-level singleton, like `compare-pref`'s, so tests must not leak into
// each other. Reset to the defaults rather than exporting a second constructor
// just for tests.
beforeEach(() => {
	apparatusPrefs.setEditionNotes(EDITION, true);
	apparatusPrefs.setCommentary(COMMENTARY, false);
	apparatusPrefs.setCommentary(OTHER, false);
	apparatusPrefs.setCommentary(PRECES_EN, true, true);
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

describe('a commentary that arrives switched on', () => {
	// The prayers' apparatus is tens of kilobytes, is the only apparatus a
	// prayer page has, and reaches part of the collection — so opt-in meant
	// a reader who never opened the panel never learned it existed. The switch
	// is the same switch; only the default moved.
	it('is on before the reader has said anything', () => {
		expect(apparatusPrefs.commentaryEnabled(PRECES_EN, true)).toBe(true);
		expect(apparatusPrefs.commentaryEnabled(PRECES_EN, false)).toBe(false);
	});

	it('stays off once turned off, and comes back on when turned on', () => {
		apparatusPrefs.setCommentary(PRECES_EN, false, true);
		expect(apparatusPrefs.commentaryEnabled(PRECES_EN, true)).toBe(false);
		apparatusPrefs.setCommentary(PRECES_EN, true, true);
		expect(apparatusPrefs.commentaryEnabled(PRECES_EN, true)).toBe(true);
	});

	// The reader turned OFF "the Catechism and the Compendium on the prayers",
	// not "…in English". `commentary.preces.*` is fifteen works and the reader
	// meets one of them per page, so a per-work id would have met them again on
	// the next prayer they opened in another language.
	it('is one choice across every language of the same commentary', () => {
		apparatusPrefs.setCommentary(PRECES_EN, false, true);
		expect(apparatusPrefs.commentaryEnabled(PRECES_PT, true)).toBe(false);
		apparatusPrefs.setCommentary(PRECES_PT, true, true);
		expect(apparatusPrefs.commentaryEnabled(PRECES_EN, true)).toBe(true);
	});

	// An edition's notes are NOT family-scoped and must not become so: the
	// Douay-Rheims and the CPDV are two editions with two apparatuses, and a
	// reader turning one off has said nothing about the other.
	it('leaves editions alone, which are chosen one at a time', () => {
		apparatusPrefs.setEditionNotes(EDITION, false);
		expect(apparatusPrefs.editionNotesEnabled('bible.cpdv.en')).toBe(true);
	});
});

describe('which way a work says its switch points', () => {
	const work = (extra: Partial<WorkManifest>) => ({ id: PRECES_EN, ...extra }) as WorkManifest;

	it('reads `default_on` off a commentary manifest', () => {
		expect(commentaryDefaultsOn(work({ type: 'commentary', default_on: true }))).toBe(true);
		expect(commentaryDefaultsOn(work({ type: 'commentary' }))).toBe(false);
	});

	// The narrowing is the point: every caller holds a `WorkManifest`, and a
	// non-commentary has no such field to read.
	it('answers false for a work that is not a commentary', () => {
		expect(commentaryDefaultsOn(work({ type: 'bible' }))).toBe(false);
	});
});
