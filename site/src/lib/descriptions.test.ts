import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { UI_LANGS } from './i18n.svelte';

/**
 * Invariants of `site/descriptions.json`.
 *
 * The file is written by hand, one batch of documents at a time, and the
 * distinction it encodes is the one thing the whole procedure exists to keep
 * true: a description written by READING a document and a translation of one
 * are different claims, and nothing on the rendered page tells them apart
 * (docs/writing-descriptions.md). So the checks here are about provenance,
 * not prose — a batch that fills the field correctly and labels it wrongly
 * would render identically and be wrong silently.
 */
const file = JSON.parse(readFileSync(path.join(process.cwd(), 'descriptions.json'), 'utf8')) as {
	descriptions: Record<string, Record<string, { text: string; origin: string; from?: string }>>;
};
const entries = Object.entries(file.descriptions);

describe('descriptions.json', () => {
	it('has at least one rendering per work', () => {
		for (const [workId, renderings] of entries) {
			expect(Object.keys(renderings).length, workId).toBeGreaterThan(0);
		}
	});

	it('gives every rendering a known origin and non-empty text', () => {
		for (const [workId, renderings] of entries) {
			for (const [lang, r] of Object.entries(renderings)) {
				expect(['read', 'translated'], `${workId}/${lang}`).toContain(r.origin);
				expect(r.text.trim().length, `${workId}/${lang}`).toBeGreaterThan(0);
			}
		}
	});

	/**
	 * A reading is prose about a particular text, so it can only be in the
	 * language of the work it was read from — `encyclical.rerum-novarum.pt` is
	 * described in Portuguese by definition. A reading filed under any other
	 * language is a description of a text nobody read.
	 */
	it("files every reading under its work's own language", () => {
		for (const [workId, renderings] of entries) {
			const workLang = workId.split('.').at(-1);
			for (const [lang, r] of Object.entries(renderings)) {
				if (r.origin === 'read') expect(lang, workId).toBe(workLang);
			}
		}
	});

	it('has at most one reading per work', () => {
		for (const [workId, renderings] of entries) {
			const read = Object.values(renderings).filter((r) => r.origin === 'read');
			expect(read.length, workId).toBeLessThanOrEqual(1);
		}
	});

	/**
	 * `from` is what makes provenance a chain rather than a label: correct a
	 * reading and every translation of it is known stale by inspection. A
	 * `from` pointing at a rendering that does not exist breaks that, and a
	 * translation of itself is a cycle.
	 */
	it('points every translation at a rendering that exists', () => {
		for (const [workId, renderings] of entries) {
			for (const [lang, r] of Object.entries(renderings)) {
				if (r.origin !== 'translated') continue;
				expect(r.from, `${workId}/${lang}`).toBeDefined();
				expect(r.from, `${workId}/${lang}`).not.toBe(lang);
				expect(Object.keys(renderings), `${workId}/${lang}`).toContain(r.from);
			}
		}
	});

	/** A translation into a language the interface does not have reaches nobody. */
	it('translates only into interface languages', () => {
		for (const [workId, renderings] of entries) {
			for (const [lang, r] of Object.entries(renderings)) {
				if (r.origin === 'translated') {
					expect(UI_LANGS as readonly string[], `${workId}/${lang}`).toContain(lang);
				}
			}
		}
	});
});
