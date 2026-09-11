import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hrefFor, parseHref } from './address';
import { hasTopics } from './corpus';
import { isCanonicalPath, type RouteManifest } from './route-manifest';
import { sectionFor } from './usage-device';
import { SETS } from './usage-schema';
import { en } from './i18n/en';
import { foldForSearch } from './topic-search';
import { SOURCES_PLACEHOLDER } from './topic-sources';
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
			brief?: number[];
			editorial?: boolean;
			editorialSources?: {
				ccc?: number[];
				csdc?: number[];
				canons?: number[];
				documents?: string[];
			};
			csdc?: [number, number][];
			canons?: [number, number][];
			documents?: string[];
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

	/** The card `ShelfGrid.svelte` draws on the home page and on
	 *  `/bibliotheca` is gated on there being a topic list behind it, which
	 *  under the fixtures — and after a partial sync — there is not. The two
	 *  pages a reader arrives at are the last place to offer a door onto
	 *  `quaestiones.landing.none`, and the gate is the one thing about that
	 *  card a test can hold: the grid itself is not rendered anywhere here. */
	it('offers no catalogue card where the build carries no topics', () => {
		expect(hasTopics()).toBe(false);
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

	/** Keywords are additive to everything else the row is matched on, and the
	 *  haystack is the title, the question AND the line itself — so a term any
	 *  other part of the row already carries is already matched and only makes
	 *  the line look like it is doing work.
	 *
	 *  THE LINE'S OWN NEIGHBOURS WERE THE HALF THIS COULD NOT SEE. Matching is
	 *  a substring, so `good atheists` answers `atheist`, `smartphone` answers
	 *  `phone` and `once saved always saved` answers `saved`; 29 terms across
	 *  the two dictionaries stood beside the longer term that already covered
	 *  them. It was one rule written against half the haystack, and the half it
	 *  missed is the half a person is looking at while they add a term.
	 *
	 *  A TERM AT A TIME AND NEVER THE LINE JOINED, because a cover has to be
	 *  something a reader could have typed rather than an accident of the order
	 *  the terms were written in: `x a` beside `b y` reads as `a b` when the
	 *  line is concatenated, and reordering would take it away again. The title
	 *  and the question keep their joined form, which is what has shipped and
	 *  is two sentences a reader really does read as one line.
	 *
	 *  EVERY DICTIONARY THAT HAS BEGUN THE SECTION, not English alone. The
	 *  terms are the reader's own words and are translated rather than
	 *  transposed — measured, no `pt` line shares even half its terms with the
	 *  English one — so nothing about one language's line predicts another's,
	 *  which is exactly why English cannot stand in for the rest here. */
	it('writes no keyword another part of the same row already carries', async () => {
		const loaders = import.meta.glob<Record<string, Dictionary>>('./i18n/*.ts');
		let begun = 0;
		for (const [path, load] of Object.entries(loaders)) {
			const module = await load();
			const dictionary = Object.values(module)[0] as unknown as Record<string, string>;
			if (!dictionary?.['quaestiones.landing.title']) continue;
			begun += 1;
			for (const slug of slugs) {
				const visible = foldForSearch(
					`${dictionary[`quaestiones.${slug}.title`]} ${dictionary[`quaestiones.${slug}.question`]}`
				);
				const terms = (dictionary[`quaestiones.${slug}.keywords`] ?? '')
					.split(', ')
					.map(foldForSearch);
				for (const [i, term] of terms.entries()) {
					const covered =
						visible.includes(term) || terms.some((other, j) => j !== i && other.includes(term));
					expect(covered, `${path} ${slug}: ${term}`).toBe(false);
				}
			}
		}
		// The glob is what makes this reach past English, so a glob that matched
		// nothing would pass in silence — the same guard the completeness test
		// keeps one screen below.
		expect(begun).toBeGreaterThanOrEqual(2);
	});

	/** THE FLAG AND THE PARAGRAPH ARE TWO FILES APART AND FAIL IN OPPOSITE
	 *  DIRECTIONS, both visibly wrong and neither caught by anything else. A
	 *  topic flagged with no string renders `quaestiones.{slug}.editorial` as
	 *  literal text at the top of the page, because `t()` hands back the key
	 *  it cannot resolve; a string with no flag is the site's own voice
	 *  written, reviewed and then silently dropped, which is the failure
	 *  nobody would ever notice. */
	it('pairs every editorial flag with the paragraph it prints, in both directions', () => {
		const dictionary = en as unknown as Record<string, string>;
		for (const slug of slugs) {
			const flagged = source.topics[slug].editorial === true;
			const written = Boolean(dictionary[`quaestiones.${slug}.editorial`]);
			expect(written, `${slug}: editorial flag ${flagged}, string ${written}`).toBe(flagged);
			// IF THE SITE SPEAKS, IT CITES. The note is the one paragraph here
			// resting on nobody else's authority, so the line saying where its
			// claims can be checked is part of the field rather than a nicety
			// somebody remembers — required with the note and forbidden
			// without it.
			const sourced = Boolean(dictionary[`quaestiones.${slug}.editorial.sources`]);
			expect(sourced, `${slug}: editorial ${flagged}, sources ${sourced}`).toBe(flagged);
			// AND THE SENTENCE HAS TO LEAVE ROOM FOR THEM. The citations are
			// spliced at `{sources}`, so a translation that dropped the
			// placeholder publishes the footing's prose with no apparatus in
			// it — which reads as a finished sentence and is the one failure
			// here nothing else can see.
			if (flagged) {
				const line = dictionary[`quaestiones.${slug}.editorial.sources`];
				expect(line, `${slug}: sources line without ${SOURCES_PLACEHOLDER}`).toContain(
					SOURCES_PLACEHOLDER
				);
			}
		}
		// The heading is the whole disclosure — the site's paragraph sits under
		// it where every other block sits under the name of the work it quotes
		// — so it is not optional the way a blurb is.
		if (slugs.some((slug) => source.topics[slug].editorial)) {
			expect(dictionary['quaestiones.editorial.heading']).toBeTruthy();
		}
	});

	/** THE EXCEPTION HAS TO STAY ONE. `docs/decisions.md` §Posture lets this
	 *  page carry a gloss only because the gloss is disclosed and rare; a file
	 *  where a third of the topics explain themselves in our voice is a
	 *  commentary with quotations in it, which is a different site. No
	 *  threshold is defensible in the abstract — this one is low enough that
	 *  crossing it is a decision somebody makes on purpose, in a diff. */
	it('keeps the site’s own voice exceptional', () => {
		const flagged = slugs.filter((slug) => source.topics[slug].editorial);
		expect(flagged.length, `editorial on: ${flagged.join(', ')}`).toBeLessThanOrEqual(5);
	});

	/** THE FOOTING MAY CITE ONLY WHAT THE PAGE PRINTS, which is the sentence's
	 *  own claim and is enforced rather than proofread. `sync-corpus.mjs`
	 *  checks it too and is the gate that matters; this is here because the
	 *  failure it catches is an edit to the ANCHORS, and somebody moving a
	 *  span runs the tests long before they run a sync. */
	it('foots a note only on units the topic itself anchors', () => {
		for (const slug of slugs) {
			const topic = source.topics[slug];
			const sources = topic.editorialSources;
			if (!sources) continue;
			const anchored = (spans: [number, number][] | undefined) => {
				const held = new Set<number>();
				for (const [from, to] of spans ?? []) for (let n = from; n <= to; n++) held.add(n);
				return held;
			};
			const held: Record<string, Set<number>> = {
				ccc: anchored(topic.ccc),
				csdc: anchored(topic.csdc),
				canons: anchored(topic.canons)
			};
			for (const field of ['ccc', 'csdc', 'canons'] as const) {
				for (const n of sources[field] ?? []) {
					expect(held[field].has(n), `${slug}: sources ${field} ${n} is not anchored`).toBe(true);
				}
			}
			for (const document of sources.documents ?? []) {
				expect(topic.documents ?? [], `${slug}: sources document ${document}`).toContain(document);
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
			// The card's shorter form of it, on the same footing: the card is
			// drawn on the home page and on `/bibliotheca` in whatever
			// language the reader is in, so a dictionary that has begun this
			// section and skipped this one names the section in its own
			// language and describes it in English.
			'quaestiones.landing.cardTagline',
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

/**
 * The grades in `quaestiones-review.json`, which are claims about whether a
 * reader arriving with a topic's own `question` leaves with it answered.
 * `docs/research/topic-anchor-review.md` holds the method and the findings;
 * the rows are here so a grade has one copy and can be checked.
 *
 * WHAT ONLY A TEST CAN CATCH: a grade is a claim about a PARTICULAR anchor
 * set, and anchor sets change. Nothing about a re-anchored topic looks wrong —
 * the file parses, the sync passes, the page renders — and the verdict beside
 * it is now about a page that no longer exists. So each row states the set it
 * was formed on and this recomputes it. The fix when it fails is to re-read
 * the topic, not to paste the new signature in: the point of the failure is
 * that somebody has to look.
 */
const review = JSON.parse(readFileSync('quaestiones-review.json', 'utf8')) as {
	reviewed: Record<
		string,
		{ grade: string; reviewed: string; was?: string; anchors: string; note: string }
	>;
};

describe('quaestiones-review.json', () => {
	/** The same statement the ledger's `anchors` field holds, from the source. */
	const signature = (topic: (typeof source.topics)[string]): string => {
		const parts: string[] = [];
		// First, because it is what the page prints first. A grade is a claim
		// about the page a reader meets, and a summary added or dropped above
		// the passages changes that page as much as a span does.
		if (topic.editorial) parts.push('editorial');
		if (topic.brief?.length) parts.push(`brief ${topic.brief.join(',')}`);
		for (const [work, spans] of spansOf(topic)) {
			if (spans.length === 0) continue;
			parts.push(`${work} ${spans.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)).join(',')}`);
		}
		if (topic.lead !== undefined) parts.push(`lead ${topic.lead}`);
		const documents = (topic as { documents?: string[] }).documents ?? [];
		if (documents.length > 0) parts.push(`documents ${documents.join(',')}`);
		return parts.join(' | ');
	};

	it('grades only topics that exist', () => {
		for (const slug of Object.keys(review.reviewed)) {
			expect(source.topics[slug], slug).toBeDefined();
		}
	});

	it('records a grade the scale defines, and never a C or a D', () => {
		for (const [slug, row] of Object.entries(review.reviewed)) {
			// C is "the corpus has a text and the topic does not name it", which
			// is fixed in the pass that finds it; D is "the corpus has nothing",
			// which is the blocklist in docs/research/topics.md and not a grade
			// this file gets to keep. A row left at C would be a to-do wearing a
			// verdict's clothes.
			expect(['A', 'B'], `${slug}: grade`).toContain(row.grade);
			if (row.was !== undefined) expect(['B', 'C', 'D'], `${slug}: was`).toContain(row.was);
			expect(row.note, `${slug}: note`).toBeTruthy();
			expect(row.reviewed, `${slug}: reviewed`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		}
	});

	it('was formed on the anchor set the topic still has', () => {
		const drifted = Object.entries(review.reviewed)
			.filter(([slug, row]) => row.anchors !== signature(source.topics[slug]))
			.map(
				([slug, row]) =>
					`${slug}\n  graded: ${row.anchors}\n  now:    ${signature(source.topics[slug])}`
			);
		expect(
			drifted,
			`re-read these topics against their new passages, then update quaestiones-review.json:\n${drifted.join('\n')}`
		).toEqual([]);
	});
});
