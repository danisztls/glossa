import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hrefFor, parseHref } from './address';
import { isCanonicalPath, type RouteManifest } from './route-manifest';
import { sectionFor } from './usage-device';
import { SETS } from './usage-schema';
import { en } from './i18n/en';
import { foldForSearch } from './topic-search';
import type { Dictionary } from './i18n.svelte';

/**
 * The tracked editorial source, not the synced index. These tests are about
 * whether the FILE is well-formed and whether every consumer of it exists;
 * whether its anchors point at real paragraphs is checked by
 * `sync-corpus.mjs`, against the corpus, which is the only place that can
 * answer it. Reading the source here keeps the suite deterministic — the
 * synced index is absent under the fixtures by design.
 */
const source = JSON.parse(readFileSync('quaestiones.json', 'utf8')) as {
	doorways: string[];
	clusters: Record<string, string[]>;
	topics: Record<
		string,
		{
			doorway: string;
			cluster: string;
			ccc: [number, number][];
			lead?: number;
			csdc?: [number, number][];
			canons?: [number, number][];
		}
	>;
};

/** The three quoted works, in the order the page prints them. `documents` is
 *  not among them: it names whole works and is a list of links. */
const spansOf = (topic: (typeof source.topics)[string]): [string, [number, number][]][] => [
	['ccc', topic.ccc],
	['csdc', topic.csdc ?? []],
	['canons', topic.canons ?? []]
];

const allClusters = Object.values(source.clusters).flat();

const slugs = Object.keys(source.topics);

describe('quaestiones.json', () => {
	it('has topics at all, so an empty walk cannot pass vacuously', () => {
		expect(slugs.length).toBeGreaterThan(0);
	});

	it('files every topic under a doorway in the closed vocabulary', () => {
		for (const [slug, topic] of Object.entries(source.topics)) {
			expect(source.doorways, slug).toContain(topic.doorway);
		}
	});

	/** A cluster is scoped to its doorway, so `marriage` declared under
	 *  `life-event` does not admit a topic whose doorway is `argument`. A flat
	 *  membership check would pass that and the page would drop the topic
	 *  silently — it draws each doorway's own declared list. */
	it('files every topic under a cluster its own doorway declares', () => {
		for (const [slug, topic] of Object.entries(source.topics)) {
			expect(source.clusters[topic.doorway] ?? [], slug).toContain(topic.cluster);
		}
	});

	/** Every declared cluster is drawn, so an empty one is a heading that
	 *  renders as nothing — usually the residue of a topic renamed out from
	 *  under it. The sync warns; this fails, because the suite is where the
	 *  file's own consistency is checked. */
	it('leaves no declared cluster empty', () => {
		for (const [doorway, clusters] of Object.entries(source.clusters)) {
			for (const cluster of clusters) {
				const held = Object.values(source.topics).filter(
					(topic) => topic.doorway === doorway && topic.cluster === cluster
				);
				expect(held.length, `${doorway}/${cluster}`).toBeGreaterThan(0);
			}
		}
	});

	/** Declared for a doorway that does not exist is the same defect as a
	 *  topic outside the vocabulary, one level up. */
	it('declares clusters only for doorways in the closed vocabulary', () => {
		for (const doorway of Object.keys(source.clusters)) {
			expect(source.doorways).toContain(doorway);
		}
	});

	/** The check `sync-corpus.mjs` also makes, kept here because it is the one
	 *  whose failure is invisible on the page: a `lead` outside its own spans
	 *  renders in printed order, and a page in printed order looks exactly like
	 *  a page nobody wrote a `lead` for. */
	it('draws every lead from the topic’s own spans', () => {
		for (const [slug, topic] of Object.entries(source.topics)) {
			if (topic.lead === undefined) continue;
			const covered = topic.ccc.some(([from, to]) => topic.lead! >= from && topic.lead! <= to);
			expect(covered, `${slug}: lead ${topic.lead}`).toBe(true);
		}
	});

	it('writes every span with its ends in order', () => {
		for (const [slug, topic] of Object.entries(source.topics)) {
			for (const [field, spans] of spansOf(topic)) {
				for (const [from, to] of spans) {
					expect(to, `${slug}: ${field} [${from}, ${to}]`).toBeGreaterThanOrEqual(from);
				}
			}
		}
	});

	/** A topic with no span of any quoted work renders a heading, a question
	 *  and a list of document titles — a page that asks something and answers
	 *  it with a bibliography. The sync refuses it too; this is the check that
	 *  runs without a corpus. */
	it('gives every topic at least one span of a work it can quote', () => {
		for (const [slug, topic] of Object.entries(source.topics)) {
			const total = spansOf(topic).reduce((n, [, spans]) => n + spans.length, 0);
			expect(total, slug).toBeGreaterThan(0);
		}
	});

	/** A slug that does not survive the URL grammar is unreachable, and the
	 *  sync would not notice: it validates a topic against the corpus, never
	 *  against the address rules. */
	it('gives every topic an addressable slug that round-trips', () => {
		for (const slug of slugs) {
			expect(parseHref(hrefFor({ kind: 'topic', slug })), slug).toEqual({ kind: 'topic', slug });
		}
	});
});

describe('every topic is reachable and named', () => {
	/** `/quaestiones/{slug}` resolves against `manifest.topics` and nothing
	 *  else — the editorial file IS the existence set, since no corpus data
	 *  implies a topic. */
	it('admits a slug the manifest lists and refuses one it does not', () => {
		const manifest = { topics: ['crematio'] } as unknown as RouteManifest;
		expect(isCanonicalPath('/quaestiones/crematio', manifest)).toBe(true);
		expect(isCanonicalPath('/quaestiones/nusquam', manifest)).toBe(false);
	});

	/** The index page needs the OTHER table — `STATIC_PATHS` — and a route in
	 *  neither answers 404 to every cold load while client-side navigation into
	 *  it works, which is how `/calendarium` and `/ius-canonicum` shipped
	 *  broken. `route-manifest.test.ts` walks the routes; this states the case
	 *  for this one. */
	it('serves its own index page to a cold load', () => {
		expect(isCanonicalPath('/quaestiones', { topics: [] } as unknown as RouteManifest)).toBe(true);
	});

	it('buckets the section under a name the beacon schema accepts', () => {
		expect(sectionFor('/quaestiones')).toBe('quaestiones');
		expect(sectionFor('/quaestiones/crematio')).toBe('quaestiones');
		expect(SETS.section).toContain('quaestiones');
	});

	/** Every topic needs both strings, and the pair is the design: the title is
	 *  the site's plain naming, the question is the reader's own sentence.
	 *  `t()` falls back to the key, so a missing one renders as
	 *  `quaestiones.crematio.title` on the page rather than failing anywhere. */
	it('carries a title and a question in English for every topic', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const slug of slugs) {
			expect(dictionary[`quaestiones.${slug}.title`], slug).toBeTruthy();
			expect(dictionary[`quaestiones.${slug}.question`], slug).toBeTruthy();
		}
	});

	/** THE THIRD STRING IS THE ONE NOBODY CAN SEE IS MISSING. A title or a
	 *  question that fell out renders as its own key on the page; keywords
	 *  render nowhere, so a topic without them looks exactly like a topic with
	 *  them and is simply harder to find. */
	it('carries keywords in English for every topic', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const slug of slugs) {
			expect(dictionary[`quaestiones.${slug}.keywords`], slug).toBeTruthy();
		}
	});

	/** Keywords are additive to the pair above them: the haystack is all three,
	 *  so a term the title or the question already carries is already matched
	 *  and only makes the line look like it is doing work. */
	it('writes no keyword the topic’s own title or question already carries', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const slug of slugs) {
			const visible = foldForSearch(
				`${dictionary[`quaestiones.${slug}.title`]} ${dictionary[`quaestiones.${slug}.question`]}`
			);
			for (const term of dictionary[`quaestiones.${slug}.keywords`].split(', ')) {
				expect(visible.includes(foldForSearch(term)), `${slug}: ${term}`).toBe(false);
			}
		}
	});

	/** THE DOORWAYS ARE NOT NAMED IN ANY DICTIONARY, deliberately: they sort
	 *  the file and order the shelves, and the page draws the shelves alone.
	 *  Asserted from the other side, or the eight keys they used to need would
	 *  sit in two dictionaries for ever with nothing reading them. */
	it('names no doorway, the page having no heading for one', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const doorway of source.doorways) {
			expect(dictionary[`quaestiones.doorway.${doorway}`], doorway).toBeUndefined();
		}
	});

	/** A cluster heading and nothing else — no blurb, because a second
	 *  sentence per shelf would be more prose than index on a page of sixteen
	 *  of them. */
	it('carries a heading for every cluster', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const cluster of allClusters) {
			expect(dictionary[`quaestiones.cluster.${cluster}`], cluster).toBeTruthy();
		}
	});

	/** A DICTIONARY THAT HAS STARTED THIS SECTION HAS TO FINISH IT, which is a
	 *  stronger rule than the site's ordinary partial-translation licence and
	 *  is here because of what falls back. `t()` reaches for English, so a
	 *  half-translated section does not break — it prints an English question
	 *  inside an otherwise Portuguese page, under a translated heading, and
	 *  looks deliberate. Anywhere else on the site that is a missing label; on
	 *  a page whose whole subject is somebody's own sentence it reads as the
	 *  site declining to ask theirs.
	 *
	 *  The gate is `quaestiones.landing.title`: a dictionary without it has
	 *  simply not reached this route and is not held to anything. */
	it('finishes the section in every dictionary that has begun it', async () => {
		const loaders = import.meta.glob<Record<string, Dictionary>>(['./i18n/*.ts', '!./i18n/en.ts']);
		const keys = [
			...slugs.flatMap((slug) => [
				`quaestiones.${slug}.title`,
				`quaestiones.${slug}.question`,
				// Held to the same rule as the two visible strings, and for a
				// sharper reason: English keywords under a Portuguese question
				// are not a fallback, they are the reader's own words in a
				// language they did not ask for, and `camisinha` finds nothing.
				`quaestiones.${slug}.keywords`
			]),
			...allClusters.map((cluster) => `quaestiones.cluster.${cluster}`),
			'quaestiones.landing.tagline',
			'quaestiones.landing.none',
			'quaestiones.search.label',
			'quaestiones.search.none',
			'quaestiones.passages.heading',
			'quaestiones.passages.reordered',
			'quaestiones.socialDoctrine.heading',
			'quaestiones.socialDoctrine.blurb',
			'quaestiones.documents.heading',
			'quaestiones.documents.blurb',
			'quaestiones.canons.heading',
			'quaestiones.canons.blurb'
		];

		let begun = 0;
		for (const [path, load] of Object.entries(loaders)) {
			const module = await load();
			const dictionary = Object.values(module)[0] as unknown as Record<string, string>;
			if (!dictionary?.['quaestiones.landing.title']) continue;
			begun += 1;
			for (const key of keys) expect(dictionary[key], `${path}: ${key}`).toBeTruthy();
		}
		// Portuguese is the one that has, and this asserts the loop ran over
		// something — a glob that matched nothing would pass silently.
		expect(begun).toBeGreaterThanOrEqual(1);
	});
});
