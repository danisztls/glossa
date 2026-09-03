import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { VERSIFICATION_PATH, versificationJson } from '../../scripts/export-versification.mjs';

describe('pipeline/scrapers/common/versification.json', () => {
	it('is the divergence tables, exported — run `npm run export` when this fails', () => {
		expect(readFileSync(VERSIFICATION_PATH, 'utf8')).toBe(versificationJson());
	});
});
