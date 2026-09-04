import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { assertSourcesNamed, llmsFacts, llmsTxt } from '../../scripts/llms.mjs';

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
	ccc: [1, 2865],
	compendium: [1, 598],
	socialDoctrine: [1, 583],
	canonLaw: [1, 1752],
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

describe('llmsFacts', () => {
	it('reads the address space and the languages off the corpus', () => {
		const facts = llmsFacts({ routeManifest: manifest, works, apparatus });
		expect(facts.CCC_MAX).toBe(2865);
		expect(facts.CANON_MAX).toBe(1752);
		expect(facts.SUMMA_PARTS).toBe('`i`, `i-ii`, `ii-ii`, `iii`, `suppl`');
		expect(facts.LANGUAGE_COUNT).toBe(2);
		expect(facts.LANGUAGES).toBe('en, la');
		// The pair the old prose conflated into one number.
		expect(facts.DOCUMENT_COUNT).toBe(2);
		expect(facts.DESCRIPTION_COUNT).toBe(1);
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
		const facts = llmsFacts({ routeManifest: manifest, works, apparatus });
		expect(() => llmsTxt(TEMPLATE, facts)).not.toThrow();
	});

	it('leaves no unsubstituted token in the output', () => {
		const out = llmsTxt(TEMPLATE, llmsFacts({ routeManifest: manifest, works, apparatus }));
		expect(out).not.toMatch(/\{\{|-->/);
	});
});
