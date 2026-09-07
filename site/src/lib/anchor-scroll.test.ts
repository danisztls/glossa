import { describe, expect, it } from 'vitest';
import { samePageFragment } from './anchor-scroll';

const HERE = 'https://glossacatholica.org/documenta/dei-verbum';

describe('samePageFragment', () => {
	it('takes a bare fragment, which is how a sidebar row writes it', () => {
		expect(samePageFragment('#s12', HERE)).toBe(true);
	});

	it('takes the same address spelled in full', () => {
		expect(samePageFragment('/documenta/dei-verbum#s12', HERE)).toBe(true);
		expect(samePageFragment(HERE + '#s12', HERE)).toBe(true);
	});

	it('refuses another page, whose scroll is an arrival and not a move', () => {
		expect(samePageFragment('/documenta/lumen-gentium#s12', HERE)).toBe(false);
		expect(samePageFragment('/catechismus/caput/3#s330', HERE)).toBe(false);
	});

	it('refuses a link that leaves the site', () => {
		expect(samePageFragment('https://www.vatican.va/archive#x', HERE)).toBe(false);
	});

	it('refuses a link with no fragment, and an empty one', () => {
		expect(samePageFragment('/documenta/dei-verbum', HERE)).toBe(false);
		// `#` alone is the top of the page, which the browser answers with a
		// jump this cannot rewind to anything meaningful.
		expect(samePageFragment('#', HERE)).toBe(false);
	});

	it('reads the search as part of the address, since two routes address by it', () => {
		const chapter = 'https://glossacatholica.org/scriptura/iosue/1?v=3';
		expect(samePageFragment('#v3', chapter)).toBe(true);
		// A different verse span is a different page of this route, and its
		// scroll is the route's to place.
		expect(samePageFragment('?v=7#v7', chapter)).toBe(false);
	});

	it('answers false rather than throwing on an href no URL can parse', () => {
		expect(samePageFragment('http://[', HERE)).toBe(false);
	});
});
