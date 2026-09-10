import { describe, expect, it } from 'vitest';
import { pinnedEdition, withoutEditionPin } from './edition-pin';

const at = (href: string) => new URL(href, 'https://glossacatholica.org');

describe('pinnedEdition', () => {
	it('is the edition the link named, when this address has it', () => {
		expect(pinnedEdition(at('/catechismus/27?ed=ccc.la'), ['ccc.en', 'ccc.la'])).toBe('ccc.la');
	});

	it('is nothing at all when the address names none', () => {
		expect(pinnedEdition(at('/catechismus/27'), ['ccc.en'])).toBeUndefined();
	});

	// A pin travels with a URL, and a URL gets edited and forwarded. Falling
	// through to the reader's own preference is the only safe answer.
	it('falls through for an edition this address does not have', () => {
		expect(pinnedEdition(at('/catechismus/27?ed=ccc.hu'), ['ccc.en', 'ccc.la'])).toBeUndefined();
		expect(pinnedEdition(at('/catechismus/27?ed='), ['ccc.en'])).toBeUndefined();
	});
});

describe('withoutEditionPin', () => {
	it('drops the pin and keeps everything else, fragment included', () => {
		expect(withoutEditionPin(at('/scriptura/genesis/1?v=3-5&ed=bible.clementina.la#v3'))).toBe(
			'/scriptura/genesis/1?v=3-5#v3'
		);
	});

	it('leaves an address with no pin alone, which is the common case', () => {
		expect(withoutEditionPin(at('/catechismus/27'))).toBeUndefined();
	});

	it('drops the query entirely when the pin was all of it', () => {
		expect(withoutEditionPin(at('/catechismus/27?ed=ccc.la'))).toBe('/catechismus/27');
	});
});
