import { describe, expect, it } from 'vitest';
import { carriesUpdate } from './sw.svelte';

const ORIGIN = 'https://glossacatholica.org';

function nav(
	type: string,
	from: string | undefined,
	to: string | undefined,
	willUnload = false
): { type: string; from: URL | undefined; to: URL | undefined; willUnload: boolean } {
	return {
		type,
		from: from === undefined ? undefined : new URL(from, ORIGIN),
		to: to === undefined ? undefined : new URL(to, ORIGIN),
		willUnload
	};
}

describe('carriesUpdate', () => {
	it('takes a link to another address', () => {
		expect(carriesUpdate(nav('link', '/scriptura/Gen/1', '/scriptura/Gen/2'))).toBe(true);
	});

	it('takes a link across sections', () => {
		expect(carriesUpdate(nav('link', '/catechismus/1', '/documenta/dei-verbum'))).toBe(true);
	});

	// The commonest navigation in the corpus: a sidenote, a footnote marker, a
	// heading in the table of contents. The reader has a position on this page
	// and a document load would throw it away.
	it('refuses a jump within the same document', () => {
		expect(carriesUpdate(nav('link', '/catechismus/1', '/catechismus/1#nota-3'))).toBe(false);
	});

	it('refuses back and forward', () => {
		expect(carriesUpdate(nav('popstate', '/scriptura/Gen/2', '/scriptura/Gen/1'))).toBe(false);
	});

	// A compare toggle or an edition switch is a button that happens to write a
	// URL. Reloading the document under one reads as a stall, not a journey.
	it('refuses a goto the app made for itself', () => {
		expect(carriesUpdate(nav('goto', '/scriptura/Gen/1', '/scriptura/Gen/1?compare=la'))).toBe(
			false
		);
	});

	it('refuses a navigation that is already a full load', () => {
		expect(carriesUpdate(nav('link', '/colophon', 'https://www.vatican.va/', true))).toBe(false);
	});

	it('refuses another origin even when the browser stays put', () => {
		expect(carriesUpdate(nav('link', '/colophon', 'https://www.vatican.va/archive'))).toBe(false);
	});

	// `leave` (closing the tab) and the enter/leave pair carry no destination.
	it('refuses a navigation with no destination', () => {
		expect(carriesUpdate(nav('leave', '/colophon', undefined, true))).toBe(false);
	});

	it('takes a link that changes only the query, which is a different address', () => {
		expect(carriesUpdate(nav('link', '/scriptura/Gen/1', '/scriptura/Gen/1?v=3'))).toBe(true);
	});
});
