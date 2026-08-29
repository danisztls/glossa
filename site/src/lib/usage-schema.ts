/**
 * The usage beacon's contract, as data — shared by the page that sends one
 * and the edge worker that stores it.
 *
 * WHY THIS IS A MODULE AND NOT TWO LISTS. `/a` is an open, unauthenticated
 * POST endpoint: anything on the internet can put a row in the table. The
 * defence is that every field is an enum and the worker rejects a value that
 * is not in it, which only works while the sender's idea of the vocabulary
 * and the receiver's are literally the same object. Two copies drift, and the
 * failure is silent in the worst direction — the client keeps sending a
 * bucket the worker has started dropping, and the metric simply reads zero.
 *
 * WHY EVERY NUMBER IS A BUCKET. The colophon says the site keeps "anonymous
 * usage counts only, with nothing that identifies you", and coarse buckets are
 * most of what makes that true. Twenty exact figures about one session is a
 * fingerprint; twenty ranges is a row that thousands of sessions share. The
 * bucketing functions live here rather than at the call sites so that the
 * claim is enforced in one place instead of being re-derived, slightly
 * differently, in each of them.
 *
 * NOTHING HERE MAY TOUCH THE DOM. `src/worker.ts` imports this module and runs
 * on the edge; a `window` reference would break the deploy rather than a test.
 *
 * See `docs/decisions.md` §Usage measurement for the design, and
 * `usage.svelte.ts` for the collector that fills a payload in.
 */

/** Bumped only when a field changes meaning. The worker drops a payload whose
 *  version it does not know, which is what lets an old installed PWA — which
 *  may run a superseded shell for weeks, see `sw.svelte.ts` — stop writing
 *  rows the current schema would misread rather than write them wrongly. */
export const SCHEMA_VERSION = 1;

/**
 * Scalar fields, each with its complete vocabulary.
 *
 * Order matters: it is the order the report renders, and it is ascending, so
 * a bucketing function can return the last entry whose threshold is passed.
 */
export const SCALARS = {
	/** Distinct days this device opened the site, out of the last 28. */
	days28: ['1', '2-3', '4-7', '8-14', '15-28'],
	/** Sessions this device has ever had. */
	visits: ['1', '2', '3-5', '6-20', '21-100', '100+'],
	/** How long ago this device's first session was. */
	age: ['new', '1-7d', '8-30d', '31-90d', '90d+'],
	/** Installed app, or a browser tab. */
	mode: ['app', 'browser'],
	device: ['phone', 'tablet', 'desktop'],
	/** Visible reading time this session. */
	minutes: ['<1', '1-5', '5-15', '15-60', '60+'],
	/** How the session started: the home page, a deep link, or a search engine. */
	entry: ['home', 'deep', 'search'],
	/** Resolved citations followed this session. The site's whole thesis is
	 *  that a citation becomes a link; this is the only measure of whether
	 *  anyone pulls one. */
	refs: ['0', '1-2', '3-10', '10+'],
	/** Whether the jump box was used, and whether it found anything. */
	jump: ['none', 'hit', 'miss'],
	/** Why a jump box query failed. Never the query itself. */
	missKind: ['unknown-book', 'out-of-range', 'no-match'],
	/** How much of the offline library this device holds. */
	library: ['none', 'partial', 'full'],
	/** A service worker that installed and left the reader with no library.
	 *  `sw-policy.ts` names this failure mode and nothing has ever reported
	 *  it; this is that report. */
	swFail: ['quota', 'parse', 'network', 'other'],
	/** Deploys behind the current one — whether `UpdateBanner` actually lands. */
	behind: ['0', '1', '2-5', '6+'],
	installPrompt: ['shown', 'accepted', 'dismissed']
} as const satisfies Record<string, readonly string[]>;

export type ScalarField = keyof typeof SCALARS;

/**
 * Set-valued fields. All four land in one `session_tag` table keyed by kind,
 * rather than four tables, because they are queried the same way and nothing
 * about them differs but the vocabulary.
 */
export const SETS = {
	/** Work ids opened this session — `ccc.pt`, `bible.cpdv.en`. Work level,
	 *  never passage level: which text someone opened is a corpus-priority
	 *  signal, which paragraph they read is their business. */
	work: undefined,
	/** Content languages actually read, which is not the interface language
	 *  wherever `CONTENT_LANG_FALLBACK` is doing the work. */
	content: [
		'en',
		'pt',
		'la',
		'de',
		'es',
		'fr',
		'it',
		'mg',
		'pl',
		'ru',
		'ar',
		'hu',
		'ro',
		'sl',
		'sv',
		'cs',
		'da',
		'fi',
		'hr',
		'lv',
		'nl',
		'sk',
		'sw',
		'vi'
	],
	/** Top-level sections visited, by canonical (Latin) route root. */
	section: [
		'home',
		'scriptura',
		'catechismus',
		'compendium',
		'documenta',
		// The shelf for the Fathers and Doctors (2026-08-28). `summa` stays a
		// bucket of its own — the work moved under the shelf, and a series that
		// broke at the move would read as a collapse in readership.
		'doctores',
		'preces',
		'summa',
		'colophon',
		'other'
	],
	/** Which families of citation were followed, so this can be read against
	 *  the per-family table `reference-coverage.mjs` already prints. */
	refKind: ['scripture', 'document', 'ccc']
} as const satisfies Record<string, readonly string[] | undefined>;

export type SetField = keyof typeof SETS;

/** Interface languages. A copy of `i18n.svelte.ts`'s `UI_LANGS`, kept here so
 *  the worker does not import the store and its fourteen dictionaries for one
 *  validation. `usage-schema.test.ts` asserts the two are equal — the same
 *  arrangement, and the same reason, as `app.html`'s copy. */
export const UI_TAGS = [
	'en',
	'pt',
	'la',
	'de',
	'es',
	'fr',
	'it',
	'hu',
	'pl',
	'ro',
	'sl',
	'sv',
	'ru',
	'ar'
] as const;

/**
 * The shape of an identifier this schema will store: a work id, or the book
 * or work a failed jump box query did name.
 *
 * Pattern rather than a whitelist because the worker has no corpus. It cannot
 * know that `ccc.pt` exists and `ccc.zz` does not without reading the route
 * manifest on every beacon, and a bad id costs one meaningless row in a report
 * that is read by eye — where an unbounded string costs an open text column on
 * a public endpoint. The length cap is what actually matters.
 */
const ID_PATTERN = /^[a-z0-9][a-z0-9.\-_]{0,63}$/;

/** Work ids accepted from one session. A reader who opens more than this many
 *  distinct works in one sitting is not reading, and a payload claiming to is
 *  not from a reader. */
const MAX_WORKS = 20;

/** Bytes. `sendBeacon` will not queue much more than this anyway, and the
 *  worker should refuse a body before parsing rather than after. */
export const MAX_BODY_BYTES = 2048;

export interface UsagePayload {
	v: number;
	days28: string;
	visits: string;
	age: string;
	mode: string;
	device: string;
	minutes: string;
	entry: string;
	ui: string;
	compare: 0 | 1;
	offline: 0 | 1;
	refs: string;
	jump: string;
	missKind?: string;
	/** The book or work a failed query named, when the grammar recognised one.
	 *  The expansion signal: "eleven people asked for Sirach chapters we do
	 *  not carry." Absent when nothing was recognised — a query that parsed to
	 *  nothing tells us nothing we are willing to store. */
	missBook?: string;
	library: string;
	swFail?: string;
	behind: string;
	installPrompt?: string;
	work: string[];
	content: string[];
	section: string[];
	refKind: string[];
}

function inList(list: readonly string[], value: unknown): value is string {
	return typeof value === 'string' && list.includes(value);
}

/**
 * Validate an untrusted body into a payload, or `undefined`.
 *
 * Whole-payload rejection, never field-level repair: a body that disagrees
 * with the schema anywhere is not a reader's browser, and salvaging the fields
 * that happen to parse would let a crafted payload choose exactly which
 * columns it writes.
 */
export function validatePayload(raw: unknown): UsagePayload | undefined {
	if (typeof raw !== 'object' || raw === null) return undefined;
	const body = raw as Record<string, unknown>;
	if (body.v !== SCHEMA_VERSION) return undefined;

	const out: Record<string, unknown> = { v: SCHEMA_VERSION };

	const REQUIRED: ScalarField[] = [
		'days28',
		'visits',
		'age',
		'mode',
		'device',
		'minutes',
		'entry',
		'refs',
		'jump',
		'library',
		'behind'
	];
	for (const field of REQUIRED) {
		if (!inList(SCALARS[field], body[field])) return undefined;
		out[field] = body[field];
	}

	const OPTIONAL: ScalarField[] = ['missKind', 'swFail', 'installPrompt'];
	for (const field of OPTIONAL) {
		if (body[field] === undefined) continue;
		if (!inList(SCALARS[field], body[field])) return undefined;
		out[field] = body[field];
	}

	if (!inList(UI_TAGS, body.ui)) return undefined;
	out.ui = body.ui;

	for (const flag of ['compare', 'offline'] as const) {
		if (body[flag] !== 0 && body[flag] !== 1) return undefined;
		out[flag] = body[flag];
	}

	if (body.missBook !== undefined) {
		if (typeof body.missBook !== 'string' || !ID_PATTERN.test(body.missBook)) return undefined;
		out.missBook = body.missBook;
	}

	for (const field of ['work', 'content', 'section', 'refKind'] as const) {
		const value = body[field];
		if (!Array.isArray(value)) return undefined;
		if (value.length > MAX_WORKS) return undefined;
		const vocabulary = SETS[field];
		for (const entry of value) {
			const ok = vocabulary ? inList(vocabulary, entry) : ID_PATTERN.test(String(entry));
			if (!ok) return undefined;
		}
		// Deduplicated here rather than trusted from the client: the tag table
		// counts one row per session per value, and a payload repeating a work
		// twenty times would otherwise count it twenty times.
		out[field] = [...new Set(value as string[])];
	}

	return out as unknown as UsagePayload;
}

// --- Bucketing ------------------------------------------------------------
//
// One function per scalar the collector derives from a real number. Each
// returns a member of its own list above; `usage-schema.test.ts` asserts that
// for every function, over its whole input range.

/** Pick the last label whose lower bound the value has reached. */
function pick(labels: readonly string[], thresholds: readonly number[], value: number): string {
	let chosen = labels[0];
	for (let i = 0; i < thresholds.length; i += 1) {
		if (value >= thresholds[i]) chosen = labels[i + 1];
	}
	return chosen;
}

export function bucketDays28(days: number): string {
	return pick(SCALARS.days28, [2, 4, 8, 15], days);
}

export function bucketVisits(visits: number): string {
	return pick(SCALARS.visits, [2, 3, 6, 21, 101], visits);
}

export function bucketAge(days: number): string {
	return pick(SCALARS.age, [1, 8, 31, 91], days);
}

export function bucketMinutes(ms: number): string {
	return pick(SCALARS.minutes, [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000], ms);
}

export function bucketRefs(count: number): string {
	return pick(SCALARS.refs, [1, 3, 11], count);
}

export function bucketBehind(deploys: number): string {
	return pick(SCALARS.behind, [1, 2, 6], deploys);
}
