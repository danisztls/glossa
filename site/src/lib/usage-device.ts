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
 * asks. See docs/decisions.md §Usage measurement.
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
	if (!stored) return { first: today, visits: 1, anchor: today, mask: 1 };

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
	if (pathname.startsWith('/catechismus/') || pathname.startsWith('/compendium/')) return 'ccc';
	if (pathname.startsWith('/documenta/')) return 'document';
	return undefined;
}

/** The canonical section a path belongs to. */
export function sectionFor(pathname: string): string {
	if (pathname === '/') return 'home';
	const root = pathname.split('/')[1] ?? '';
	const KNOWN = [
		'scriptura',
		'catechismus',
		'compendium',
		'documenta',
		'preces',
		'summa',
		'colophon'
	];
	return KNOWN.includes(root) ? root : 'other';
}
