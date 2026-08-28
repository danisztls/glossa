import { describe, expect, it } from 'vitest';
import {
	buildCondensationMap,
	condensingRun,
	expandCccRefs,
	reverseCondensation,
	type CondensationEdition
} from './condensation';

const ALL = new Set(Array.from({ length: 2865 }, (_, i) => i + 1));

function edition(lang: string, refs: Record<number, string>): CondensationEdition {
	return {
		lang,
		work: `compendium.${lang}`,
		questions: Object.entries(refs).map(([n, ccc_refs]) => ({ n: Number(n), ccc_refs }))
	};
}

describe('expandCccRefs', () => {
	it('reads the shapes the ten editions actually print', () => {
		expect(expandCccRefs('212').numbers).toEqual([212]);
		expect(expandCccRefs('27-30 44-45').numbers).toEqual([27, 28, 29, 30, 44, 45]);
		// Italian and Swedish separate with a semicolon, Slovenian with a comma.
		expect(expandCccRefs('59-64; 72').numbers).toEqual([59, 60, 61, 62, 63, 64, 72]);
		expect(expandCccRefs('1804, 1810').numbers).toEqual([1804, 1810]);
	});

	// Romanian sets every range with a non-breaking hyphen, and Portuguese
	// prints Q1's range as "1 25 –". Neither is a different reference.
	it('normalises the dash the source happens to use', () => {
		expect(expandCccRefs('212‑213').numbers).toEqual([212, 213]);
		expect(expandCccRefs('212–213').numbers).toEqual([212, 213]);
	});

	it('reports a token that names nothing rather than guessing at it', () => {
		// The English Q39 defect, corrected 2026-08-28: first number > second.
		expect(expandCccRefs('2112-213')).toEqual({ numbers: [], malformed: ['2112-213'] });
		// German prints a trailing hyphen at Q15, Spanish a full stop at Q12.
		expect(expandCccRefs('91-')).toEqual({ numbers: [], malformed: ['91-'] });
		expect(expandCccRefs('96.98')).toEqual({ numbers: [], malformed: ['96.98'] });
		expect(expandCccRefs('').numbers).toEqual([]);
		expect(expandCccRefs(undefined).numbers).toEqual([]);
	});

	it('keeps the readable half of a line whose other half is not', () => {
		expect(expandCccRefs('212-213 91-')).toEqual({
			numbers: [212, 213],
			malformed: ['91-']
		});
	});
});

describe('buildCondensationMap', () => {
	// The real German behaviour: it prints only the first of a question's
	// ranges. Two editions against one keep the range it drops.
	it('keeps a paragraph a majority of the editions name', () => {
		const { map } = buildCondensationMap(
			[
				edition('de', { 2: '27-30' }),
				edition('en', { 2: '27-30 44-45' }),
				edition('pt', { 2: '27-30 44-45' })
			],
			ALL
		);
		expect(map[2]).toEqual([
			[27, 30],
			[44, 45]
		]);
	});

	// The real Slovenian and Swedish behaviour at Q39: one edition widens the
	// range nobody else does.
	it('drops a paragraph only one edition of several names', () => {
		const { map, stats } = buildCondensationMap(
			[
				edition('en', { 39: '212-213' }),
				edition('pt', { 39: '212-213' }),
				edition('sl', { 39: '212-213 229' })
			],
			ALL
		);
		expect(map[39]).toEqual([[212, 213]]);
		expect(stats.contested).toBe(1);
	});

	it('keeps a lone edition rather than dropping the only witness there is', () => {
		const { map } = buildCondensationMap([edition('sv', { 500: '2000-2001' })], ALL);
		expect(map[500]).toEqual([[2000, 2001]]);
	});

	// The real Swedish Q556 prints "2639-3643" for "2639-2643", a single-digit
	// typo that names a thousand paragraphs the Catechism does not have. The
	// corpus bound is what stops those becoming a thousand dead addresses.
	it('refuses a paragraph this corpus does not carry, and says so', () => {
		const { map, stats } = buildCondensationMap([edition('sv', { 556: '2860-2870' })], ALL);
		expect(map[556]).toEqual([[2860, 2865]]);
		expect(stats.absent).toEqual([2866, 2867, 2868, 2869, 2870]);
	});

	it('reports an unreadable token against the edition that printed it', () => {
		const { stats } = buildCondensationMap([edition('de', { 15: '84-91 91-' })], ALL);
		expect(stats.malformed).toEqual(['de Q15: 91-']);
	});

	it('leaves a question no edition gave references for out of the map', () => {
		const { map } = buildCondensationMap([edition('en', { 7: '' })], ALL);
		expect(map[7]).toBeUndefined();
	});
});

describe('reverseCondensation', () => {
	it('answers which questions condense a paragraph, ascending', () => {
		const reverse = reverseCondensation({
			5: [
				[10, 12],
				[20, 20]
			],
			2: [[11, 11]]
		});
		expect(reverse.get(10)).toEqual([5]);
		expect(reverse.get(11)).toEqual([2, 5]);
		expect(reverse.get(20)).toEqual([5]);
		expect(reverse.get(99)).toBeUndefined();
	});
});

describe('condensingRun', () => {
	const map = {
		10: [[100, 110]] as [number, number][],
		11: [[111, 120]] as [number, number][],
		12: [[121, 130]] as [number, number][],
		// A question from another part reaching back into this one — the shape
		// that makes min..max useless. Nine of the CCC's 67 articles have one.
		400: [[105, 105]] as [number, number][]
	};

	it('takes the longest contiguous run, not the outermost pair', () => {
		expect(condensingRun(map, 100, 130)).toEqual([10, 12]);
	});

	it('answers a single question where only one condenses the span', () => {
		expect(condensingRun(map, 121, 130)).toEqual([12, 12]);
	});

	it('still answers when the only witness is the distant one', () => {
		expect(condensingRun({ 400: [[105, 105]] }, 105, 105)).toEqual([400, 400]);
	});

	it('answers nothing for a span no question condenses', () => {
		expect(condensingRun(map, 2000, 2100)).toBeUndefined();
	});
});
