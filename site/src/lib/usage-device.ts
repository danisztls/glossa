/**
 * What one device remembers about itself between visits — and the only reason
 * the site can answer "do readers come back" without ever identifying one.
 *
 * THE TRICK, STATED ONCE. Retention normally needs an identifier: you link
 * visits over time and see who returned. You do not need one if the DEVICE
 * does the counting and reports a summary. A 28-bit integer in localStorage,
 * one bit per day, "did this device open the site that day" — and what leaves
 * the device is the bucket that count falls in, never the bitmask, never a
 * date, never a number assigned to anyone. Two sessions from the same device
 * carry no field that joins them.
 *
 * What that costs is classic cohort retention (of the devices first seen in
 * March, how many survived to April) — the sort of question that genuinely
 * does need identity. What it buys is the age distribution of the active
 * population, which is what "are they reading daily or did they stop" actually
 * asks. See site/docs/usage.md.
 *
 * Everything here is pure and DOM-free so it can be tested directly; the store
 * that reads and writes localStorage around it is `usage.svelte.ts`.
 */

/** Days the bitmask covers. 28 rather than 30 so the window is four whole
 *  weeks — a reader with a Sunday habit registers the same in every window,
 *  where a 30-day window would sometimes hold five Sundays and sometimes four. */
export const WINDOW_DAYS = 28;

const WINDOW_MASK = (1 << WINDOW_DAYS) - 1;

const MS_PER_DAY = 86_400_000;

/**
 * How long a device's record may live before it is discarded and started over.
 *
 * TWELVE MONTHS, and the number is bounded from both directions.
 *
 * FROM ABOVE, by the LGPD — which is the law this site is actually exposed to,
 * its author being in Brazil. There is NO Brazilian analogue to ePrivacy's
 * Art. 5(3): writing to a device is not itself a regulated act here, and what
 * matters is whether what is transmitted is dados pessoais at all. The ANPD's
 * `Guia Orientativo — Cookies e Proteção de Dados Pessoais` (2022) accepts
 * legítimo interesse (Art. 7, IX) for first-party audience measurement without
 * consent, provided the processing is limited to patterns and trends over
 * AGGREGATED data, is not combined with other tracking, and does not build
 * profiles — all three of which this design satisfies by construction. What the
 * same guide does require is a retention period proportionate to the purpose:
 * indeterminate durations are rejected outright, and persistent storage is to
 * be limited in time as far as the purpose allows. That is what this constant
 * is, and the paragraph below is why the purpose does not allow less.
 *
 * FROM BELOW, by what the buckets can actually express. `age` tops out at
 * `90d+`, so any expiry past three months costs that field literally nothing —
 * a two-year reader and a four-month reader already report the same value. The
 * field that needs the room is `visits`, and the binding case is the INFREQUENT
 * reader: someone visiting monthly takes a year to reach twelve visits at all.
 * Cutting the window to four months would not merely lose their history, it
 * would report them as a brand-new device three times a year — inflating the
 * one number this whole measurement exists to establish. A year is the shortest
 * window that does not corrupt the answer.
 *
 * THE EXPIRY STILL DISTORTS THAT NUMBER, and the report prints the caveat
 * beside it. A returning device whose record has expired reports
 * `age: new, visits: 1` for exactly one session, so `new` is over-counted by
 * roughly one session per device per year — 0.3% of a daily reader's sessions,
 * 8% of a monthly one's.
 *
 * IT IS AN ABSOLUTE LIFETIME, NOT A SLIDING ONE. Renewing it on every visit
 * would keep a record alive indefinitely for exactly the readers who visit
 * most, which is what a retention limit is for.
 *
 * (EU readers are a real secondary exposure — the interface is in fourteen
 * languages, most of them European — and ePrivacy's consent rule is stricter
 * than any of the above. The design was built to the stricter reading and is
 * left there; this comment records which law is the primary one, not a
 * relaxation.)
 */
export const RECORD_MAX_DAYS = 365;

export interface DeviceRecord {
	/** UTC date of this device's first session, for the `age` bucket. */
	first: string;
	/** Sessions this device has ever had. */
	visits: number;
	/** The UTC date bit 0 of `mask` refers to. */
	anchor: string;
	/** Bit i is set when the device opened the site i days before `anchor`. */
	mask: number;
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD` in UTC. Negative when the
 *  clock has gone backwards, which callers clamp rather than trust. */
export function daysBetween(from: string, to: string): number {
	const a = Date.parse(`${from}T00:00:00Z`);
	const b = Date.parse(`${to}T00:00:00Z`);
	if (Number.isNaN(a) || Number.isNaN(b)) return 0;
	return Math.round((b - a) / MS_PER_DAY);
}

/** How many of the last 28 days the mask has set. */
export function countDays(mask: number): number {
	let bits = mask & WINDOW_MASK;
	let count = 0;
	while (bits !== 0) {
		bits &= bits - 1;
		count += 1;
	}
	return count;
}

/**
 * Advance a device's record to today, counting this session.
 *
 * The mask shifts by however many days have passed and today's bit goes in at
 * position 0, so days simply fall off the far end — no expiry pass, no stored
 * list of dates, and nothing that grows.
 *
 * A CLOCK THAT MOVED BACKWARDS IS TREATED AS TODAY, not as an error and not as
 * a negative shift. A device whose clock is wrong (or whose timezone crossed a
 * date line in the unhelpful direction) still gets its visit counted; the only
 * consequence is that one day's bit merges into another's, which no bucket
 * boundary is precise enough to notice.
 */
export function rollDevice(stored: DeviceRecord | undefined, today: string): DeviceRecord {
	const fresh = { first: today, visits: 1, anchor: today, mask: 1 };
	if (!stored) return fresh;
	// Expired: discard and start over, rather than trimming a field. Half a
	// record is not a shorter-lived record.
	if (daysBetween(stored.first, today) >= RECORD_MAX_DAYS) return fresh;

	const delta = Math.max(0, daysBetween(stored.anchor, today));
	// A gap of a whole window leaves nothing to keep: shifting by 28 or more
	// would be a no-op in 32-bit arithmetic rather than clearing the mask, and
	// a returning reader would inherit a month of activity they did not have.
	const shifted = delta >= WINDOW_DAYS ? 0 : (stored.mask << delta) & WINDOW_MASK;

	return {
		first: stored.first,
		visits: stored.visits + 1,
		anchor: today,
		mask: (shifted | 1) & WINDOW_MASK
	};
}

/** Recover a record from whatever was in storage, or `undefined` if it is not
 *  one. Storage is the reader's to clear, corrupt or share between profiles;
 *  a bad value means "new device", never a throw during module init. */
export function parseDevice(raw: unknown): DeviceRecord | undefined {
	if (typeof raw !== 'object' || raw === null) return undefined;
	const value = raw as Record<string, unknown>;
	if (typeof value.first !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.first)) return undefined;
	if (typeof value.anchor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.anchor)) {
		return undefined;
	}
	if (typeof value.visits !== 'number' || !Number.isFinite(value.visits) || value.visits < 0) {
		return undefined;
	}
	if (typeof value.mask !== 'number' || !Number.isInteger(value.mask) || value.mask < 0) {
		return undefined;
	}
	return {
		first: value.first,
		visits: Math.floor(value.visits),
		anchor: value.anchor,
		mask: value.mask & WINDOW_MASK
	};
}

/**
 * Search engines whose referral means the reader arrived by searching rather
 * than by following someone's link. Not exhaustive and does not need to be: an
 * unrecognised external referrer reads as `deep`, which is true of it.
 *
 * THE TLD TAIL IS BOUNDED (`[a-z]{2,3}`) RATHER THAN OPEN. Written as
 * `google\.[a-z.]+` this matched `com.google.android.gm` — the Gmail app's
 * referrer — and filed every reader arriving from their mail client as having
 * arrived from a search engine. Google's search hosts end in a real TLD, so
 * that is what the pattern should say.
 */
const SEARCH_HOSTS =
	/(^|\.)(google\.[a-z]{2,3}(\.[a-z]{2})?|bing\.com|duckduckgo\.com|yandex\.[a-z]{2,3}|ecosia\.org|search\.brave\.com|startpage\.com|baidu\.com|qwant\.com)$/;

/** How the session began. `home` and `deep` distinguish the reader who came to
 *  the library from the one who followed a citation to one paragraph — which
 *  is the entry the whole reference apparatus exists to serve. */
export function classifyEntry(pathname: string, referrer: string, host: string): string {
	let referrerHost = '';
	try {
		if (referrer) referrerHost = new URL(referrer).host;
	} catch {
		referrerHost = '';
	}
	if (referrerHost && referrerHost !== host) {
		return SEARCH_HOSTS.test(referrerHost) ? 'search' : 'deep';
	}
	return pathname === '/' ? 'home' : 'deep';
}

/** Viewport class. Width alone, deliberately: a phone held in landscape is
 *  being read like a phone, and pointer/touch tests answer about the input
 *  device rather than about how much text fits on a line. */
export function classifyDevice(width: number): string {
	if (width < 600) return 'phone';
	if (width < 1024) return 'tablet';
	return 'desktop';
}

/** Which family a followed citation belonged to, from the address it points
 *  at — so no link generator has to be told this measurement exists. Reads
 *  against the per-family table `reference-coverage.mjs` prints. */
export function refKindFor(pathname: string): string | undefined {
	if (pathname.startsWith('/scriptura/')) return 'scripture';
	if (pathname.startsWith('/catechismus/')) return 'ccc';
	if (pathname.startsWith('/documenta/')) return 'document';
	return undefined;
}

/**
 * The canonical section a path belongs to.
 *
 * The Compendium is the one section that is NOT its path's first segment: it
 * moved under `/catechismus/` on 2026-08-28, and it keeps its own bucket
 * because which of the two works a reader is in is the thing the measurement
 * is for. Folding it into `catechismus` would not error -- `compendium` is an
 * enumerated value in `usage-schema.ts`, so the worker would go on accepting a
 * bucket nothing ever sent again and the series would read zero from that day
 * rather than reporting a fault (see CLAUDE.md on why that schema is one
 * module read by both ends).
 */
export function sectionFor(pathname: string): string {
	if (pathname === '/') return 'home';
	if (pathname === '/catechismus/compendium' || pathname.startsWith('/catechismus/compendium/'))
		return 'compendium';
	// Same shape, same reason: the Summa moved under `/doctores` on 2026-08-28
	// and keeps its own bucket, so the series does not break at the move. The
	// shelf itself counts as `doctores`, which is a different question (did
	// anyone find the shelf) from how much the Summa is read.
	if (pathname === '/doctores/summa' || pathname.startsWith('/doctores/summa/')) return 'summa';
	const root = pathname.split('/')[1] ?? '';
	const KNOWN = [
		'scriptura',
		'catechismus',
		'compendium',
		'documenta',
		'doctores',
		'preces',
		'summa',
		'colophon'
	];
	return KNOWN.includes(root) ? root : 'other';
}

/**
 * Hostnames that are a developer's machine rather than a deployment.
 *
 * `$app/environment`'s `dev` is NOT enough on its own: it is
 * `import.meta.env.DEV`, so it is false under `npm run preview` and false
 * under `wrangler dev`, both of which serve a production build from a laptop.
 * The host is what actually separates the two.
 *
 * DENY-LOCAL RATHER THAN ALLOW-CANONICAL, deliberately. Listing the real
 * hostname and refusing everything else fails in the worse direction: move the
 * site to another domain and measurement stops silently, with a report that
 * reads as "nobody visited" rather than as an error. This way a domain change
 * keeps working and only a laptop is refused.
 */
const LOCAL_HOSTS = /^(localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[?::1\]?|.*\.local(host)?)$/i;

export function isLocalHost(hostname: string): boolean {
	return LOCAL_HOSTS.test(hostname);
}

/**
 * Whether this page should report anything at all.
 *
 * `forced` is the escape hatch for testing the beacon deliberately — the same
 * shape as `InstallHint`'s `?install-hint=reset`, since a measurement nobody
 * can exercise by hand is a measurement nobody checks.
 */
export function shouldCollect(hostname: string, isDev: boolean, forced: boolean): boolean {
	if (forced) return true;
	if (isDev) return false;
	return !isLocalHost(hostname);
}
