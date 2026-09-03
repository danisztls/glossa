import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BOOK_FORMS_PATH, bookFormsJson } from '../../scripts/export-book-forms.mjs';

describe('pipeline/scrapers/common/book_forms.json', () => {
	it('is the grammar’s book table, exported — run `npm run export` when this fails', () => {
		expect(readFileSync(BOOK_FORMS_PATH, 'utf8')).toBe(bookFormsJson());
	});
});
