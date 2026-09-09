import { describe, expect, it } from 'vitest';
import { sourceLabels } from './copyright';

/**
 * The label rule the copyright notice draws its links with. It is worth a test
 * of its own because its two halves fail in opposite directions and neither
 * fails loudly: too shallow prints one word twice and tells a reader nothing,
 * too deep prints a file path and reads as a leak.
 */
describe('sourceLabels', () => {
	const ROSARY = 'https://www.vatican.va/special/rosary/index_rosary_ge.htm';
	const APPENDIX =
		'https://www.vatican.va/archive/compendium_ccc/documents/archive_2005_compendium-ccc_ge.html';

	it('gives one source its bare host', () => {
		expect(sourceLabels([APPENDIX])).toEqual(['vatican.va']);
	});

	it('leaves sources on different hosts at their hosts', () => {
		expect(
			sourceLabels([APPENDIX, 'https://www.vaticannews.va/en/prayers/our-father.html'])
		).toEqual(['vatican.va', 'vaticannews.va']);
	});

	// The case the rule exists for: the Rosary's six editions cite the micro-site
	// for their mysteries and the appendix for their concluding prayer.
	it('adds path where one host serves both', () => {
		expect(sourceLabels([ROSARY, APPENDIX])).toEqual([
			'vatican.va/special/rosary',
			'vatican.va/archive/compendium_ccc'
		]);
	});

	it('never prints the filename', () => {
		for (const label of sourceLabels([ROSARY, APPENDIX])) {
			expect(label).not.toContain('.htm');
		}
	});

	it('goes deeper only where two directories still collide', () => {
		expect(
			sourceLabels([
				'https://example.org/a/b/c/one.html',
				'https://example.org/a/b/d/two.html',
				'https://example.org/a/b/d/e/three.html'
			])
		).toEqual(['example.org/a/b/c', 'example.org/a/b/d', 'example.org/a/b/d/e']);
	});

	// A malformed entry drops its own link and none of the others — the notice
	// pairs labels with urls by index for exactly this.
	it('answers undefined for what it cannot read', () => {
		expect(sourceLabels([undefined, 'not a url', APPENDIX])).toEqual([
			undefined,
			undefined,
			'vatican.va'
		]);
	});
});
