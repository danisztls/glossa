import { describe, expect, it } from 'vitest';
import { pontificate } from './pontificates';

describe('pontificate', () => {
	it('gives a closed range for a pontificate that has ended', () => {
		expect(pontificate('Leo XIII')).toBe('1878–1903');
		expect(pontificate('Pius XII')).toBe('1939–1958');
	});

	/* The reigning pope. A word here would be a chrome string in thirty-four
	   dictionaries; the trailing dash is the same in all of them. */
	it('leaves the range open for an office still held', () => {
		expect(pontificate('Leo XIV')).toBe('2025–');
	});

	it('covers the council as well as the popes', () => {
		expect(pontificate('Second Vatican Council')).toBe('1962–1965');
	});

	/* A name the table has not learned yet renders as nothing, never as a
	   guess — the same fallback `documentKindLabel` gives an unknown kind. */
	it('answers for a name it does not carry with undefined', () => {
		expect(pontificate('John Paul I')).toBeUndefined();
		expect(pontificate('')).toBeUndefined();
	});

	/* `Record` lookups reach Object.prototype unless the table is consulted
	   with a real key; a facet value arrives from corpus data, so this is
	   cheap insurance against a name like "constructor" printing a function. */
	it('does not answer for an inherited property name', () => {
		expect(pontificate('constructor')).toBeUndefined();
		expect(pontificate('toString')).toBeUndefined();
	});

	it('separates the years with an en dash and not a hyphen', () => {
		expect(pontificate('Francis')).toContain('–');
		expect(pontificate('Francis')).not.toContain('-');
	});
});
