import { describe, expect, it } from 'vitest';
import { parseHref } from './address';
import { getCccStructure, getCompendiumStructure } from './corpus';
import {
	councilRoute,
	gospelsRoute,
	pillarsRoute,
	socialRoute,
	ROUTE_ORDER,
	type LearningRoute
} from './learning-routes';
import { pairDivisionsCached } from './toc-pairing';
import type { DocumentGroup } from './corpus';
import type { DocumentManifest, StructureNode } from './types';

const LABELS = { cccTitle: 'Catechism', compendiumTitle: 'Compendium' };

/**
 * THE GUARD THIS FILE EXISTS FOR. A route is a list of addresses assembled at
 * render time from four different corpora, and the site is an SPA shell — a
 * bad address is answered by `src/worker.ts` with a 404 and the app's own
 * not-found UI, never by a build failure. So every href every builder emits is
 * put back through the parser that decides an address's shape.
 *
 * This checks SHAPE, not existence: whether the corpus carries the target is
 * `isCanonicalPath`'s question and it is answered against the real manifest at
 * the edge, not against fixtures holding two books of the Bible.
 */
function everyHrefParses(route: LearningRoute) {
	for (const step of route.steps) {
		expect(parseHref(step.href), step.href).toBeDefined();
		for (const offer of step.offers) {
			expect(parseHref(offer.href), offer.href).toBeDefined();
		}
	}
	expect(parseHref(route.source), route.source).toBeDefined();
}

describe('the four pillars', () => {
	const tree = getCccStructure('en');
	const pairs = pairDivisionsCached(tree, getCompendiumStructure('en'));
	const route = pillarsRoute({
		tree,
		treeWork: 'ccc',
		lang: 'en',
		columns: ['ccc', 'compendium'],
		pairs,
		labels: LABELS,
		prayer: (slug) =>
			slug === 'our-father' ? { href: '/preces/our-father', label: 'Our Father' } : undefined
	});

	it('addresses every step and every offer', () => {
		expect(route.steps.length).toBeGreaterThan(0);
		everyHrefParses(route);
	});

	it('cites the paragraph that states the plan', () => {
		expect(route.source).toBe('/catechismus/13');
	});

	it('takes the parts and nothing else', () => {
		// The fixture's tree carries a part; a Prologue or a bare chapter at the
		// top level is not a pillar and must not become a step.
		for (const step of route.steps) {
			const node = tree.find((n) => n.title === step.label);
			expect(node?.kind, step.label).toBe('part');
		}
	});

	it('offers the other work beside the one the tree is, never itself', () => {
		for (const step of route.steps) {
			expect(step.offers.map((offer) => offer.href)).not.toContain(step.href);
		}
	});

	it('hangs the Lord’s Prayer on the fourth pillar and on no other', () => {
		const withPrayer = route.steps.filter((step) =>
			step.offers.some((offer) => offer.href === '/preces/our-father')
		);
		const fourth = tree.find((node) => node.kind === 'part' && node.n === 4);
		expect(withPrayer).toHaveLength(fourth ? 1 : 0);
	});

	it('drops a prayer this edition does not carry', () => {
		const bare = pillarsRoute({
			tree,
			treeWork: 'ccc',
			lang: 'en',
			columns: ['ccc'],
			pairs: new Map<StructureNode, StructureNode>(),
			labels: LABELS,
			prayer: () => undefined
		});
		expect(bare.steps.flatMap((step) => step.offers)).toEqual([]);
	});
});

describe('the Gospels', () => {
	it('keeps the canon’s order and skips what the edition has not got', () => {
		const route = gospelsRoute({
			nameOf: (osis) => (osis === 'john' ? 'John' : undefined),
			hasIntro: () => false,
			source: '/documenta/dei-verbum'
		});
		expect(route.steps.map((step) => step.href)).toEqual(['/scriptura/ioannes/1']);
		everyHrefParses(route);
	});

	it('runs Matthew to Acts when the edition is whole', () => {
		const route = gospelsRoute({
			nameOf: (osis) => osis,
			hasIntro: () => false,
			source: '/documenta/dei-verbum'
		});
		expect(route.steps.map((step) => step.label)).toEqual(['matt', 'mark', 'luke', 'john', 'acts']);
		everyHrefParses(route);
	});

	it('offers the introduction where the language has one', () => {
		const route = gospelsRoute({
			nameOf: (osis) => osis,
			hasIntro: (osis) => osis === 'mark',
			source: '/documenta/dei-verbum'
		});
		const offers = route.steps.flatMap((step) => step.offers);
		expect(offers).toEqual([{ href: '/scriptura/marcus/0', labelKey: 'bible.introduction' }]);
		everyHrefParses(route);
	});
});

function conciliar(slug: string, kind: string, promulgated: string): DocumentGroup {
	const manifest = { id: `vatii.${slug}.en`, title: slug, document_kind: kind, promulgated };
	return {
		slug,
		family: 'vatii',
		manifests: { en: manifest as unknown as DocumentManifest }
	};
}

describe('what the Council said', () => {
	// Deliberately shuffled, and deliberately including a document the Council
	// did not write: the ordering must come from the genre and the date, not
	// from the order the corpus happens to list works in.
	const documents = [
		conciliar('nostra-aetate', 'conciliar-declaration', '1965-10-28'),
		conciliar('lumen-gentium', 'conciliar-constitution', '1964-11-21'),
		conciliar('inter-mirifica', 'conciliar-decree', '1963-12-04'),
		conciliar('sacrosanctum-concilium', 'conciliar-constitution', '1963-12-04'),
		conciliar('humanae-vitae', 'encyclical', '1968-07-25')
	];
	const route = councilRoute({
		documents,
		manifestOf: (group) => group.manifests.en,
		source: '/documenta/lumen-gentium'
	});

	it('ranks the constitutions first, then decrees, then declarations', () => {
		expect(route.steps.map((step) => step.label)).toEqual([
			'sacrosanctum-concilium',
			'lumen-gentium',
			'inter-mirifica',
			'nostra-aetate'
		]);
		everyHrefParses(route);
	});

	it('leaves out what the Council did not publish', () => {
		expect(route.steps.map((step) => step.label)).not.toContain('humanae-vitae');
	});

	it('leaves out a document the corpus has no edition of', () => {
		const none = councilRoute({
			documents,
			manifestOf: () => undefined,
			source: '/documenta/lumen-gentium'
		});
		expect(none.steps).toEqual([]);
	});
});

describe('the social doctrine', () => {
	const node = (title: string, from: number): StructureNode => ({
		kind: 'sub',
		n: null,
		title,
		paragraphs: [from, from + 10],
		children: []
	});

	it('walks the outline’s own top level', () => {
		const route = socialRoute({
			outline: [node('Part One', 1), node('Part Two', 100)],
			hrefAt: (n) => `/doctrina-socialis/caput/${n}`,
			source: '/doctrina-socialis/8'
		});
		expect(route.steps.map((step) => step.label)).toEqual(['Part One', 'Part Two']);
		everyHrefParses(route);
	});

	it('drops a heading nothing addresses', () => {
		const route = socialRoute({
			outline: [{ ...node('Unanchored', 1), paragraphs: [null, null] }],
			hrefAt: () => undefined,
			source: '/doctrina-socialis/8'
		});
		expect(route.steps).toEqual([]);
	});
});

describe('the page order', () => {
	it('names each route once', () => {
		expect(new Set(ROUTE_ORDER).size).toBe(ROUTE_ORDER.length);
	});
});
