import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hrefFor, parseHref } from './address';
import { isCanonicalPath, type RouteManifest } from './route-manifest';
import { sectionFor } from './usage-device';
import { SETS } from './usage-schema';
import { en } from './i18n/en';

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
	topics: Record<string, { doorway: string; ccc: [number, number][]; lead?: number }>;
};

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
			for (const [from, to] of topic.ccc) {
				expect(to, `${slug}: [${from}, ${to}]`).toBeGreaterThanOrEqual(from);
			}
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

	it('carries a heading and a blurb for every doorway', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const doorway of source.doorways) {
			expect(dictionary[`quaestiones.doorway.${doorway}`], doorway).toBeTruthy();
			expect(dictionary[`quaestiones.doorway.${doorway}.blurb`], doorway).toBeTruthy();
		}
	});
});
