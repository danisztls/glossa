import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assertSourcesNamed, llmsFacts, llmsTxt, topicList } from '../../scripts/llms.mjs';
import { buildCensus } from '../../scripts/census.mjs';

const TEMPLATE = readFileSync(
	path.join(import.meta.dirname, '../../scripts/llms.template.md'),
	'utf8'
);

/**
 * What is under test is the property the file exists for: everything it states
 * as fact is read off the corpus in the same pass that builds the corpus, so
 * the two cannot disagree. The counts were hand-maintained until 2026-09-04
 * and had drifted — 263 documents claimed against 298 held, four publishers
 * named against eleven drawn on.
 */
const manifest = {
	version: 1 as const,
	workCount: 4,
	contentAssetCount: 12,
	bible: { gen: [0, 1, 2] },
	ccc: [1, 2865],
	cccChapters: [1],
	compendium: [1, 598],
	compendiumChapters: [1],
	socialDoctrine: [1, 583],
	socialDoctrineChapters: [1],
	canonLaw: [1, 1752],
	canonLawTitles: [1],
	prayers: ['our-father'],
	topics: ['crematio'],
	summa: { i: [1], 'i-ii': [1], 'ii-ii': [1], iii: [1], suppl: [1] },
	documents: ['rerum-novarum', 'vita-consecrata']
};
const works = {
	works: [
		{ source: 'https://www.vatican.va/x', languages: ['en', 'la'] },
		{ source: 'https://ccel.org/y', languages: ['en'] }
	]
};
const apparatus = { descriptions: { 'rerum-novarum': 'a' } };

/**
 * THE FACTS ARE THE CENSUS'S NOW, so the fixture is what the census is built
 * from rather than what `llmsFacts` used to read directly. The join is under
 * test as much as the projection is: `censusValue` throws for a row that has
 * been renamed, which is the failure this file exists to catch one step
 * earlier than a reader would.
 */
const census = buildCensus({
	manifests: {},
	routeManifest: manifest,
	works,
	apparatus,
	addressCount: 9,
	uiLangs: ['en', 'la'],
	// Empty and spelled out rather than defaulted inside the builder: what
	// `llms.txt` reads is the address space and the languages, so a census
	// with no per-language registries is exactly the right fixture here — and
	// a builder that quietly tolerated a missing one would turn a forgotten
	// argument into an empty coverage matrix nobody could see was empty.
	bibleIndex: {},
	cccEditions: [],
	compendiumEditions: [],
	socialDoctrineEditions: [],
	canonLawEditions: [],
	prayerIndex: {},
	documentEditions: [],
	summaIndex: {},
	scriptureByBook: {},
	citationXrefs: {
		documents: [],
		ccc: [],
		summa: [],
		absent: [],
		unread: { ibidem: {}, other: {} }
	},
	summaArticles: new Map()
});

/**
 * Two shelves, deliberately declared in the opposite order to the topics.
 * `site/quaestiones.json`'s own order is what `/quaestiones` draws and what
 * this list has to reproduce, and a fixture agreeing with both orders at once
 * could not tell which one was being read.
 */
const topicIndex = {
	doorways: ['life-event', 'ordinary'],
	clusters: { 'life-event': ['death-and-dying'], ordinary: ['practice'] },
	topics: {
		ieiunium: { doorway: 'ordinary', cluster: 'practice' },
		crematio: { doorway: 'life-event', cluster: 'death-and-dying' }
	}
};
const topicNames: Record<string, [string, string]> = {
	crematio: ['Cremation', 'May a Catholic be cremated?'],
	ieiunium: ['Fasting', 'What is still required?']
};
const topicHeadings = {
	'quaestiones.cluster.death-and-dying': 'Illness, dying & death',
	'quaestiones.cluster.practice': 'Catholic practice'
};
const questions = topicList(topicIndex, topicNames, topicHeadings);

describe('topicList', () => {
	it('shelves the questions in the file’s order and links each one', () => {
		expect(questions).toBe(
			[
				'### Illness, dying & death',
				'',
				'- [Cremation](https://glossacatholica.org/quaestiones/crematio) — May a Catholic be cremated?',
				'',
				'### Catholic practice',
				'',
				'- [Fasting](https://glossacatholica.org/quaestiones/ieiunium) — What is still required?'
			].join('\n')
		);
	});

	it('refuses a shelf with no heading in English', () => {
		expect(() => topicList(topicIndex, topicNames, {})).toThrow(/no English heading/);
	});

	it('refuses a topic with no title and question', () => {
		expect(() => topicList(topicIndex, {}, topicHeadings)).toThrow(/cannot be listed/);
	});

	/** The section is prose in the template and asserts the set exists, so a
	 *  build that has none must fail rather than publish an empty promise. */
	it('refuses a build with no questions at all', () => {
		expect(() => topicList({}, topicNames, topicHeadings)).toThrow(/has none/);
	});
});

describe('llmsFacts', () => {
	it('reads the address space and the languages off the corpus', () => {
		const facts = llmsFacts(census, questions);
		expect(facts.CCC_MAX).toBe(2865);
		expect(facts.CANON_MAX).toBe(1752);
		expect(facts.SUMMA_PARTS).toBe('`i`, `i-ii`, `ii-ii`, `iii`, `suppl`');
		expect(facts.LANGUAGE_COUNT).toBe(2);
		expect(facts.LANGUAGES).toBe('en, la');
		// The pair the old prose conflated into one number.
		expect(facts.DOCUMENT_COUNT).toBe(2);
		expect(facts.DESCRIPTION_COUNT).toBe(1);
		// Carried through unchanged: the questions are not a fact about the
		// corpus, so `llmsFacts` may not be the second place they are shaped.
		expect(facts.TOPIC_LIST).toBe(questions);
	});
});

describe('llmsTxt', () => {
	it('substitutes every token and drops the editor-facing comment', () => {
		const out = llmsTxt('<!-- note -->\nheld in {{LANGUAGE_COUNT}}: {{LANGUAGES}}\n', {
			LANGUAGE_COUNT: 2,
			LANGUAGES: 'en, la'
		});
		expect(out).toBe('held in 2: en, la\n');
	});

	it('refuses a token nothing fills', () => {
		expect(() => llmsTxt('{{NOPE}}', {})).toThrow(/No value for \{\{NOPE\}\}/);
	});

	/** The quiet direction: a deleted token leaves a fact computed, tested and
	 *  no longer published, which no output inspection would reveal. */
	it('refuses a fact no token consumes', () => {
		expect(() => llmsTxt('plain', { LANGUAGES: 'en' })).toThrow(/Nothing consumes LANGUAGES/);
	});
});

describe('assertSourcesNamed', () => {
	it('fails when the corpus draws on a publisher the file does not name', () => {
		expect(() => assertSourcesNamed('we cite vatican.va', works)).toThrow(/ccel\.org/);
	});

	it('passes for the real template, which is the check that matters', () => {
		expect(() => assertSourcesNamed(TEMPLATE, works)).not.toThrow();
	});
});

describe('the committed template', () => {
	it('asks for exactly the facts the builder derives', () => {
		const facts = llmsFacts(census, questions);
		expect(() => llmsTxt(TEMPLATE, facts)).not.toThrow();
	});

	it('leaves no unsubstituted token in the output', () => {
		const out = llmsTxt(TEMPLATE, llmsFacts(census, questions));
		expect(out).not.toMatch(/\{\{|-->/);
	});
});
