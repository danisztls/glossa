/**
 * The usage beacon's collector: what this session did, as buckets, sent once.
 *
 * WHAT THIS IS AND IS NOT. The site is offline-first, so the edge sees almost
 * nothing a reader does: `/` is precached and served cache-first, in-app
 * navigation is a `pushState` that never reaches the network, and an installed
 * app launching at `start_url` makes no document request at all. Request logs
 * can count arrivals and nothing else — they cannot tell a reader who came
 * once from one who has read daily for a year, which is the question this
 * exists to answer. See docs/decisions.md §Usage measurement.
 *
 * It is NOT an analytics client. There is no identifier, no cookie, no
 * sequence, no passage-level position, and no free text; every number is a
 * bucket from `usage-schema.ts`, and the device's own history is counted on
 * the device (`usage-device.ts`) so that only a range ever leaves it. What the
 * colophon promises is what this sends.
 *
 * ONE BEACON PER SESSION, AND ONLY FOR A READER. Nothing is sent until the
 * session has had `ENGAGEMENT_MIN_MS` of *visible* time and at least one real
 * interaction. That gate is not politeness — it is the bot defence. A
 * JS-rendering crawler loads, snapshots the DOM and leaves without scrolling
 * or clicking, and because it keeps no localStorage between crawls every one
 * of its visits would look like a brand new device that came once and never
 * returned. That is precisely the row this measurement exists to count, so
 * letting crawlers write it would poison the one number that matters. Arrivals
 * are still counted by the edge logs; this counts readers.
 */

import { browser } from '$app/environment';
import { compare } from './compare-pref.svelte';
import { setContentReadObserver } from './corpus';
import { listContentAssets } from './corpus-assets';
import { i18n } from './i18n.svelte';
import { readStoredJson, readStoredString, writeStoredJson, writeStoredString } from './storage';
import {
	SCHEMA_VERSION,
	bucketAge,
	bucketBehind,
	bucketDays28,
	bucketMinutes,
	bucketRefs,
	bucketVisits,
	type UsagePayload
} from './usage-schema';
import {
	classifyDevice,
	classifyEntry,
	countDays,
	daysBetween,
	parseDevice,
	refKindFor,
	rollDevice,
	sectionFor,
	type DeviceRecord
} from './usage-device';

/** Where the beacon posts. Matches `BEACON_PATH` in `src/worker.ts` and the
 *  WAF custom rule that guards it. */
const ENDPOINT = '/a';

/** Visible time before a session is worth reporting. Five seconds is above
 *  what a renderer spends on a page and below what a reader spends on a
 *  paragraph. */
const ENGAGEMENT_MIN_MS = 5_000;

/** Counted by counting timer firings, never by differencing wall-clock stamps
 *  — the same decision, for the same reason, as `install.svelte.ts`'s
 *  engagement clock: `setInterval` does not fire while the tab is frozen, so a
 *  tick can only happen while the page was really on screen, where a timestamp
 *  delta would credit a laptop that spent the night closed on Genesis. */
const TICK_MS = 5_000;

/** The service worker's content cache. A copy of `service-worker.ts`'s
 *  constant, which cannot be imported (that module reads `$service-worker` at
 *  module scope and registers listeners as a side effect of loading).
 *  `usage.test.ts` asserts the two agree. */
export const CONTENT_CACHE = 'glossa-content';

/** Fraction of the content tier that counts as a finished library. Not 1: a
 *  handful of files may legitimately be missing (a failed fetch the reader
 *  never noticed, a work added by a deploy since the fill), and reporting
 *  those readers as `partial` would understate the feature the number exists
 *  to measure. */
const FULL_LIBRARY_RATIO = 0.95;

const DEVICE_KEY = 'glossa:usage-device';
/** Consecutive sessions that were offered an update and did not take it. */
const STALE_KEY = 'glossa:usage-stale';
/** The shell version this device last ran, so the counter above resets when
 *  an update actually lands rather than counting forever. */
const VERSION_KEY = 'glossa:usage-version';

function utcToday(now: number): string {
	return new Date(now).toISOString().slice(0, 10);
}

/** Standalone-display test. Deliberately a copy of `install.svelte.ts`'s
 *  private `isStandalone`, rather than an import: `install.svelte.ts` reports
 *  the install prompt's outcome to THIS module, and importing it back would
 *  make a cycle out of two files that each need one fact from the other. */
function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
	return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** workId -> declared content language, from the manifest rather than from
 *  parsing the id. Work ids only LOOK parseable (CLAUDE.md, the corpus
 *  schema); `sync-corpus.mjs` copies the real language onto every asset. */
let langByWork: Map<string, string> | undefined;
function contentLangOf(workId: string): string | undefined {
	if (!langByWork) {
		langByWork = new Map();
		for (const asset of listContentAssets()) langByWork.set(asset.workId, asset.lang);
	}
	return langByWork.get(workId);
}

/**
 * How much of the offline library this device holds.
 *
 * Measured from the cache rather than from the worker's progress messages,
 * because progress only reports fills that happened while this page was open
 * — and the reader whose library was filled last week is exactly the one worth
 * counting.
 */
export async function measureLibrary(
	caches: CacheStorage | undefined,
	totalAssets: number
): Promise<string> {
	if (!caches) return 'none';
	try {
		const cache = await caches.open(CONTENT_CACHE);
		const held = (await cache.keys()).length;
		if (held === 0) return 'none';
		if (totalAssets > 0 && held >= totalAssets * FULL_LIBRARY_RATIO) return 'full';
		return 'partial';
	} catch {
		// Storage denied (private browsing, a browser configured to block site
		// data). Reading works; there is simply no library to report.
		return 'none';
	}
}

class UsageSession {
	#started = false;
	#sent = false;

	#visibleMs = 0;
	#interacted = false;

	#device: DeviceRecord | undefined;
	#entry = 'home';
	#library = 'none';
	#offline = false;

	#works = new Set<string>();
	#content = new Set<string>();
	#sections = new Set<string>();
	#refKinds = new Set<string>();
	#refs = 0;

	#jump = 'none';
	#missKind: string | undefined;
	#missBook: string | undefined;
	#swFail: string | undefined;
	#installPrompt: string | undefined;
	#updateOffered = false;
	/** Consecutive prior sessions that were offered an update and left it. */
	#staleSessions = 0;
	/** Whether compare mode was on at ANY point, not merely at the end: a
	 *  reader who compared two editions and then turned it off has used the
	 *  feature, and that is what the number is asked to say. */
	#compared = false;

	/**
	 * Begin the session. Called once from the root layout, which mounts exactly
	 * once for the life of the app; returns its own teardown.
	 */
	start(shellVersion: string): () => void {
		if (!browser || this.#started) return () => {};
		this.#started = true;

		const today = utcToday(Date.now());
		this.#device = rollDevice(parseDevice(readStoredJson(DEVICE_KEY, null)), today);
		writeStoredJson(DEVICE_KEY, this.#device);

		// Roll the staleness counter BEFORE anything can offer an update, so
		// this session's number is what the reader arrived on rather than what
		// they were shown while here.
		this.#rollStaleness(shellVersion);

		this.#entry = classifyEntry(location.pathname, document.referrer, location.host);
		this.notePath(location.pathname);
		if (typeof navigator !== 'undefined' && navigator.onLine === false) this.#offline = true;

		const controller = new AbortController();
		const { signal } = controller;

		for (const event of ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const) {
			addEventListener(event, () => (this.#interacted = true), {
				signal,
				passive: true,
				once: true
			});
		}
		addEventListener('offline', () => (this.#offline = true), { signal });

		// ONE DELEGATED LISTENER, not an opt-in on every link generator — the
		// same argument `LinkPreview.svelte` makes at length for its own: the
		// site's citation links are produced in about a dozen places
		// (`RefText.svelte`, `linkifyProse`, the readers' footers), and a
		// measurement each of them has to remember to call is a measurement
		// that silently stops being true. The selector is `LinkPreview`'s
		// `TAP_PREVIEW_SELECTOR`; capture phase, so a handler that stops
		// propagation cannot hide the click.
		addEventListener(
			'click',
			(event) => {
				const target = event.target as Element | null;
				const link = target?.closest?.('a.ref-link, a.inline-ref');
				if (!(link instanceof HTMLAnchorElement)) return;
				try {
					this.noteRef(new URL(link.href, location.href).pathname);
				} catch {
					// A link whose href is not a URL is not a citation.
				}
			},
			{ signal, capture: true, passive: true }
		);

		setContentReadObserver((workId) => this.noteWork(workId));

		const timer = setInterval(() => {
			if (document.visibilityState === 'visible') this.#visibleMs += TICK_MS;
		}, TICK_MS);

		// `pagehide` is the reliable end-of-session event (a phone browser may
		// never fire `unload`, and `beforeunload` breaks the back/forward
		// cache); `visibilitychange` catches the reader who switches away and
		// never comes back. Both funnel into one guarded send.
		addEventListener('pagehide', () => this.#send(), { signal });
		document.addEventListener(
			'visibilitychange',
			() => {
				if (document.visibilityState === 'hidden') this.#send();
			},
			{ signal }
		);

		void this.#measure();

		return () => {
			clearInterval(timer);
			controller.abort();
		};
	}

	/** A content file was read — the single chokepoint `corpus.ts` already
	 *  records `lastContentRead()` at, for the same reason it gives there. */
	noteWork(workId: string): void {
		if (!workId) return;
		this.#works.add(workId);
		const lang = contentLangOf(workId);
		if (lang) this.#content.add(lang);
	}

	/** A route was entered. Also the sampling point for compare mode, which has
	 *  no event of its own and is a preference rather than an action. */
	notePath(pathname: string): void {
		this.#sections.add(sectionFor(pathname));
		if (compare.active) this.#compared = true;
	}

	/** A resolved citation was followed. */
	noteRef(pathname: string): void {
		this.#refs += 1;
		const kind = refKindFor(pathname);
		if (kind) this.#refKinds.add(kind);
	}

	/**
	 * The jump box answered. `book` is an identifier from our own tables, never
	 * the reader's query: a failed lookup is the best expansion signal there is
	 * ("eleven people asked for Sirach chapters we do not carry"), and the
	 * query text is the one thing on a site of these texts that must not be
	 * stored.
	 */
	noteJump(outcome: 'hit' | 'miss', kind?: string, book?: string): void {
		// A hit is never downgraded: a reader who found what they wanted on the
		// second try used a jump box that works.
		if (this.#jump === 'hit') return;
		this.#jump = outcome;
		if (outcome === 'miss') {
			this.#missKind = kind;
			this.#missBook = book;
		}
	}

	/** The install prompt was shown, taken or refused. */
	noteInstallPrompt(state: 'shown' | 'accepted' | 'dismissed'): void {
		// Later states win: shown then accepted is an acceptance.
		if (state === 'shown' && this.#installPrompt) return;
		this.#installPrompt = state;
	}

	/** The service worker failed in a way that leaves the reader without the
	 *  library it reported installing — the silent failure `sw-policy.ts` names
	 *  and nothing has ever reported. */
	noteSwFailure(reason: string): void {
		this.#swFail ??= reason;
	}

	/** An update is waiting. Recorded so the NEXT session's `behind` counts a
	 *  reader who was offered one and did not take it. */
	noteUpdateOffered(): void {
		this.#updateOffered = true;
	}

	async #measure(): Promise<void> {
		this.#library = await measureLibrary(
			typeof caches === 'undefined' ? undefined : caches,
			listContentAssets().length
		);
	}

	/**
	 * `behind` counts CONSECUTIVE SESSIONS OFFERED AN UPDATE AND NOT TAKING IT,
	 * which is measurable here where "deploys behind" is not — the page knows
	 * its own shell version and whether one is waiting, never how many releases
	 * have happened since. It answers the same question: `sw.svelte.ts` says an
	 * installed PWA can sit on a superseded version indefinitely and a stale
	 * shell is a stale table of contents, and this is whether `UpdateBanner`
	 * actually moves anyone off one.
	 */
	#rollStaleness(shellVersion: string): void {
		const previous = readStoredString(VERSION_KEY);
		if (previous !== shellVersion) {
			// The update landed (or this is a first visit). The count starts over.
			writeStoredString(VERSION_KEY, shellVersion);
			writeStoredString(STALE_KEY, '0');
			return;
		}
		const carried = Number(readStoredString(STALE_KEY) ?? '0');
		this.#staleSessions = Number.isFinite(carried) && carried > 0 ? Math.floor(carried) : 0;
	}

	#payload(): UsagePayload {
		const device = this.#device ?? rollDevice(undefined, utcToday(Date.now()));
		return {
			v: SCHEMA_VERSION,
			days28: bucketDays28(countDays(device.mask)),
			visits: bucketVisits(device.visits),
			age: bucketAge(daysBetween(device.first, device.anchor)),
			mode: isStandalone() ? 'app' : 'browser',
			device: classifyDevice(window.innerWidth),
			minutes: bucketMinutes(this.#visibleMs),
			entry: this.#entry,
			ui: i18n.lang,
			compare: this.#compared || compare.active ? 1 : 0,
			offline: this.#offline ? 1 : 0,
			refs: bucketRefs(this.#refs),
			jump: this.#jump,
			missKind: this.#missKind,
			missBook: this.#missBook,
			library: this.#library,
			swFail: this.#swFail,
			behind: bucketBehind(this.#staleSessions),
			installPrompt: this.#installPrompt,
			work: [...this.#works],
			content: [...this.#content],
			section: [...this.#sections],
			refKind: [...this.#refKinds]
		};
	}

	#send(): void {
		if (this.#sent) return;
		if (this.#visibleMs < ENGAGEMENT_MIN_MS || !this.#interacted) return;
		this.#sent = true;

		// Carry this session's answer forward for the next one's `behind`.
		writeStoredString(STALE_KEY, String(this.#updateOffered ? this.#staleSessions + 1 : 0));

		try {
			const body = JSON.stringify(this.#payload());
			navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }));
		} catch {
			// A beacon queue that is full, a browser that refuses, a page dying
			// mid-serialise. None of it is the reader's problem.
		}
	}
}

export const usage = new UsageSession();
