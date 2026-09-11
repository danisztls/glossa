import { describe, expect, it } from 'vitest';
import {
	editorialSourceAddresses,
	editorialSourceLine,
	sourceLinks,
	SOURCES_PLACEHOLDER,
	type SourceLinePart
} from './topic-sources';

/** The label a caller would get from `citationFor`, without the corpus: these
 *  tests are about the ORDER and the splice, and the writer has its own. */
const label = (n: number) => `unit ${n}`;
const flatten = (parts: SourceLinePart[]) =>
	parts.map((part) => ('link' in part ? part.link.label : part.text)).join('');

describe('editorialSourceAddresses', () => {
	it('lists the works in the order the page prints their blocks', () => {
		const addresses = editorialSourceAddresses({
			documents: ['rerum-novarum'],
			canons: [1374],
			csdc: [567],
			ccc: [2088]
		});
		expect(addresses.map((a) => a.kind)).toEqual(['ccc', 'socialDoctrine', 'canonLaw', 'document']);
	});

	/** A footing has nothing to disclose, so it cannot afford an order a reader
	 *  would read as a mistake — where the passages have `lead` and say so. */
	it('sorts the numbers inside each work ascending, whatever the file says', () => {
		const addresses = editorialSourceAddresses({ canons: [1374, 6, 1315, 915] });
		expect(addresses.map((a) => ('n' in a ? a.n : undefined))).toEqual([6, 915, 1315, 1374]);
	});

	it('leaves the documents in the order the topic named them', () => {
		const addresses = editorialSourceAddresses({ documents: ['zeta', 'alpha'] });
		expect(addresses.map((a) => ('slug' in a ? a.slug : undefined))).toEqual(['zeta', 'alpha']);
	});

	it('addresses each unit as the site spells it', () => {
		const links = sourceLinks(editorialSourceAddresses({ ccc: [1385], canons: [6] }), (a) =>
			a.kind === 'ccc' || a.kind === 'canonLaw' ? label(a.n) : ''
		);
		expect(links).toEqual([
			{ href: '/catechismus/1385', label: 'unit 1385' },
			{ href: '/ius-canonicum/6', label: 'unit 6' }
		]);
	});
});

describe('editorialSourceLine', () => {
	const links = [
		{ href: '/catechismus/1385', label: 'CCC 1385' },
		{ href: '/catechismus/2088', label: 'CCC 2088' },
		{ href: '/ius-canonicum/6', label: 'Can. 6' }
	];

	it('splices the citations where the placeholder stands', () => {
		const parts = editorialSourceLine(
			`Checked against ${SOURCES_PLACEHOLDER}. Nothing else.`,
			links,
			'en'
		);
		// The conjunction and its comma are the PLATFORM's — English ICU puts
		// the serial comma in — which is the whole reason no translator writes
		// this punctuation.
		expect(flatten(parts)).toBe('Checked against CCC 1385, CCC 2088, and Can. 6. Nothing else.');
		expect(parts.filter((part) => 'link' in part)).toHaveLength(3);
	});

	/** THE SEPARATOR IS THE PLATFORM'S, which is the whole reason the line is
	 *  assembled rather than written: a translator carries the sentence and
	 *  never the punctuation between citations. */
	it('joins the list in the reader’s own language', () => {
		expect(flatten(editorialSourceLine(SOURCES_PLACEHOLDER, links, 'pt-BR'))).toBe(
			'CCC 1385, CCC 2088 e Can. 6'
		);
	});

	/** The sentinel is a NUL and an index, so a label carrying the list's own
	 *  separator cannot be cut by the splice that finds it. */
	it('keeps a label that contains the separator whole', () => {
		const awkward = [
			{ href: '/documenta/a', label: 'On Rights, and Duties' },
			{ href: '/documenta/b', label: 'Another' }
		];
		const parts = editorialSourceLine(SOURCES_PLACEHOLDER, awkward, 'en');
		expect(
			parts.filter((part) => 'link' in part).map((part) => ('link' in part ? part.link : null))
		).toEqual(awkward);
	});

	it('renders a single citation with no punctuation of its own', () => {
		expect(flatten(editorialSourceLine(SOURCES_PLACEHOLDER, [links[0]], 'en'))).toBe('CCC 1385');
	});

	/** A translation that lost the placeholder keeps its prose and loses its
	 *  apparatus, which is the safe direction — and `quaestiones.test.ts`
	 *  refuses to let that be the shipped state. */
	it('keeps the sentence when the placeholder is gone', () => {
		const parts = editorialSourceLine('No placeholder here.', links, 'en');
		expect(parts).toEqual([{ text: 'No placeholder here.' }]);
	});

	it('says nothing rather than trailing punctuation when a topic cites nothing', () => {
		expect(editorialSourceLine(SOURCES_PLACEHOLDER, [], 'en')).toEqual([
			{ text: SOURCES_PLACEHOLDER }
		]);
	});
});
