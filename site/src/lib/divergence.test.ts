import { describe, expect, it } from 'vitest';
import { divergenceFor, divergenceKey, divergences } from './divergence';
import { dictionaryFor } from './i18n.svelte';
import table from './divergence.json';

describe('divergenceFor', () => {
	it('finds the chapters a person has read and classified', () => {
		// The two the research note calls the sharpest rows: Psalm 13, where the
		// Latin's verse COUNT sides with one edition and its TEXT with the other,
		// and Acts 14, where the verse numbers agree and twenty verses of text
		// do not.
		expect(divergenceFor('ps', 13)).toEqual({ kind: 'textual-variant' });
		expect(divergenceFor('acts', 14)).toEqual({ kind: 'span-shift' });
	});

	it('carries the confirmed mapping where there is one', () => {
		expect(divergenceFor('2thess', 2)?.mapping).toBe('en 10 <-> pt 10+11; en 11-16 <-> pt 12-17');
	});

	// The reason this file exists at all: a note on every chapter would say
	// nothing, and the table's whole claim is that these are the exceptions.
	it('says nothing about a chapter nobody has found a divergence in', () => {
		expect(divergenceFor('john', 3)).toBeUndefined();
		expect(divergenceFor('gen', 1)).toBeUndefined();
		expect(divergenceFor('not-a-book', 1)).toBeUndefined();
	});
});

describe('the exported table', () => {
	// It is written by `pipeline/scrapers/bible/divergence.py --export`, which
	// fails when this file falls behind it. What that script cannot check is
	// the half that lives here: a kind it adds needs a sentence, or the reader
	// gets the key name printed at them.
	it('has an English sentence for every kind in it', async () => {
		const en: Record<string, string> = await dictionaryFor('en');
		for (const { osis, chapter, row } of divergences()) {
			const key = divergenceKey(row.kind);
			expect(en[key], `${osis} ${chapter} is ${row.kind}, which no dictionary spells`).toBeTruthy();
		}
	});

	it('names the editions it was measured over', () => {
		expect(table.measured_over).toContain('bible.cpdv.en');
		expect(table.measured_over).toContain('bible.matos-soares.pt');
	});

	// Esther is sixteen rows of one fact and the rest are single chapters, so
	// the count is the shape of the table rather than an inventory of it: if
	// Esther ever stops being every chapter of the book, this is what says so.
	it('covers the whole of Esther and nothing else wholesale', () => {
		const esther = divergences().filter((d) => d.osis === 'esth');
		expect(esther).toHaveLength(16);
		expect(esther.every((d) => d.row.kind === 'arrangement')).toBe(true);
	});
});
