import { describe, expect, it } from 'vitest';
import { buildTagCloud, CLOUD_SIZE_MAX, CLOUD_SIZE_MIN, type CloudTag } from './tag-cloud';

const tag = (label: string, count: number) => ({ value: label.toLowerCase(), label, count });

const sizeOf = (cloud: CloudTag[], label: string) =>
	cloud.find((entry) => entry.label === label)!.fontSize;

describe('buildTagCloud', () => {
	it('returns nothing for an empty facet', () => {
		expect(buildTagCloud([])).toEqual([]);
	});

	it('gives the extremes the ends of the range', () => {
		const cloud = buildTagCloud([tag('a', 3), tag('b', 12), tag('c', 42)]);
		expect(sizeOf(cloud, 'a')).toBe(CLOUD_SIZE_MIN);
		expect(sizeOf(cloud, 'c')).toBe(CLOUD_SIZE_MAX);
	});

	it('never shrinks a term that holds more documents', () => {
		const counts = [3, 4, 5, 8, 12, 19, 26, 34, 42];
		const cloud = buildTagCloud(counts.map((n) => tag(`t${n}`, n)));
		const sizes = cloud.map((entry) => entry.fontSize);
		for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeGreaterThan(sizes[i - 1]);
	});

	/* A lone term drawn at full size would state a prominence nothing in the
	   data supports; the midpoint says "no comparison available". */
	it('falls to the midpoint when there is nothing to encode', () => {
		const middle = (CLOUD_SIZE_MIN + CLOUD_SIZE_MAX) / 2;
		expect(sizeOf(buildTagCloud([tag('only', 17)]), 'only')).toBe(middle);
		const tied = buildTagCloud([tag('a', 9), tag('b', 9), tag('c', 9)]);
		for (const entry of tied) expect(entry.fontSize).toBe(middle);
	});

	/* Two selected terms sharing no document leave both at 0. Taken as the
	   minimum that would drag the floor down and inflate every other chip
	   against it, so the range ignores them and they clamp instead. */
	it('keeps a zero count out of the range and clamps it to the floor', () => {
		const cloud = buildTagCloud([tag('dead', 0), tag('a', 3), tag('b', 42)]);
		expect(sizeOf(cloud, 'dead')).toBe(CLOUD_SIZE_MIN);
		expect(sizeOf(cloud, 'a')).toBe(CLOUD_SIZE_MIN);
		expect(sizeOf(cloud, 'b')).toBe(CLOUD_SIZE_MAX);
		for (const entry of cloud) expect(Number.isFinite(entry.fontSize)).toBe(true);
	});

	it('sizes every term at the midpoint when only zero counts are present', () => {
		const cloud = buildTagCloud([tag('a', 0), tag('b', 0)]);
		const middle = (CLOUD_SIZE_MIN + CLOUD_SIZE_MAX) / 2;
		for (const entry of cloud) expect(entry.fontSize).toBe(middle);
	});

	/* The curvature, pinned. Linear crowds half the vocabulary into the bottom
	   third of the range and log over-expands the low end; square root is what
	   was measured against this corpus, so a future edit that swaps the curve
	   fails here rather than merely looking different. */
	it('is square root and not linear', () => {
		const cloud = buildTagCloud([tag('lo', 3), tag('mid', 22), tag('hi', 42)]);
		const linearMidpoint = (CLOUD_SIZE_MIN + CLOUD_SIZE_MAX) / 2;
		expect(sizeOf(cloud, 'mid')).toBeGreaterThan(linearMidpoint);
		expect(sizeOf(cloud, 'mid')).toBeLessThan(CLOUD_SIZE_MAX);
	});

	/* Order belongs to the route, which ranks every facet in one place. */
	it('preserves the order it is given', () => {
		const input = [tag('zeal', 3), tag('apple', 42), tag('Banana', 12)];
		expect(buildTagCloud(input).map((entry) => entry.label)).toEqual(['zeal', 'apple', 'Banana']);
	});

	it('returns every term it was given, once', () => {
		const input = [tag('a', 3), tag('b', 9), tag('c', 9), tag('d', 42)];
		const cloud = buildTagCloud(input);
		expect(cloud).toHaveLength(input.length);
		expect(cloud.map((entry) => entry.value).sort()).toEqual(input.map((t) => t.value).sort());
		for (const entry of cloud) {
			expect(entry.count).toBe(input.find((t) => t.value === entry.value)!.count);
		}
	});

	it('honours an overridden range', () => {
		const cloud = buildTagCloud([tag('a', 3), tag('b', 42)], { minRem: 1, maxRem: 2 });
		expect(sizeOf(cloud, 'a')).toBe(1);
		expect(sizeOf(cloud, 'b')).toBe(2);
	});

	it('stays inside the range for every term in the real distribution', () => {
		const counts = [
			42, 35, 35, 34, 34, 33, 33, 31, 30, 29, 26, 25, 21, 21, 20, 19, 19, 19, 19, 19, 18, 18, 18,
			17, 17, 16, 16, 14, 12, 12, 12, 11, 11, 11, 10, 9, 9, 9, 9, 9, 8, 8, 7, 7, 7, 7, 6, 6, 6, 6,
			5, 5, 5, 4, 4, 4, 3, 3
		];
		const cloud = buildTagCloud(counts.map((n, i) => tag(`t${i}`, n)));
		expect(cloud).toHaveLength(58);
		for (const entry of cloud) {
			expect(entry.fontSize).toBeGreaterThanOrEqual(CLOUD_SIZE_MIN);
			expect(entry.fontSize).toBeLessThanOrEqual(CLOUD_SIZE_MAX);
		}
	});
});
