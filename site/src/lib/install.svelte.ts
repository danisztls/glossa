/**
 * Home-screen install affordances.
 *
 * The site has been an installable PWA since the service worker landed (see
 * README §Offline / service worker) — a manifest, icons, `display: standalone`
 * and a fetch handler are all a browser needs. What was missing was any way for
 * a reader to *find out*. This module supplies the two mechanisms that exist,
 * which have nothing in common but their goal:
 *
 *   - **Chromium** (Android Chrome, Edge, desktop Chrome/Brave) fires
 *     `beforeinstallprompt`. Calling `preventDefault()` on it suppresses the
 *     browser's own mini-infobar and hands the event to us to replay later.
 *     The event is single-use and must be replayed from inside a real user
 *     gesture, so it is stashed here and spent by `InstallButton.svelte`.
 *   - **iOS/iPadOS** has no API whatsoever. `beforeinstallprompt` does not
 *     exist there and never fires, in Safari or in any other iOS browser (they
 *     are all WebKit). The only possible affordance is written instructions —
 *     `InstallHint.svelte` — which is why that half needs the engagement
 *     gating below and the Chromium half does not.
 *
 * THE ASYMMETRY IS DELIBERATE. The button is passive: it appears only when the
 * browser has told us the site is installable, it costs one slot in a header
 * row the reader is already looking at, and nothing happens until it is
 * clicked. The iOS hint is proactive — it appears unbidden over the page — so
 * it has to earn its interruption. It is gated on fifteen minutes of *visible*
 * reading time, because someone who has read for fifteen minutes has
 * demonstrated the thing the prompt is predicated on, and a first-visit
 * prompt has not.
 *
 * Neither is ever offered to a reader who is already running the installed app
 * (`isStandalone`), and the hint's dismissal is permanent.
 *
 * No part of this reports anything anywhere: the counter is a single integer
 * in localStorage, alongside `glossa:theme` and `glossa:font-scale`, and the
 * colophon's "no analytics, no tracking scripts" promise stays true.
 */

import { browser } from '$app/environment';

/** Visible reading time a reader must accumulate before the iOS hint appears. */
export const ENGAGEMENT_THRESHOLD_MS = 15 * 60 * 1000;

/**
 * How much time one tick credits.
 *
 * Time is counted by *counting timer firings*, not by differencing wall-clock
 * timestamps. `setInterval` does not fire while the tab is frozen or the
 * machine is asleep, so a tick can only ever happen while the page was really
 * on screen — whereas a timestamp delta would silently credit a laptop that
 * spent the night closed on a chapter of Genesis. The cost is that up to one
 * tick of partial time is lost each time the reader switches away, which
 * against a fifteen-minute threshold does not matter.
 */
export const ENGAGEMENT_TICK_MS = 15_000;

const ENGAGEMENT_KEY = 'glossa:engaged-ms';
const DISMISSED_KEY = 'glossa:install-dismissed';

/**
 * `beforeinstallprompt` is not in lib.dom — it is a Chromium extension to the
 * platform, not a standard — so its shape is declared here.
 */
interface BeforeInstallPromptEvent extends Event {
	readonly platforms: readonly string[];
	readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	prompt(): Promise<void>;
}

/**
 * Is this an iOS-family browser, where installing means the Share sheet?
 *
 * Two wrinkles, both load-bearing:
 *
 *   - iPadOS 13+ reports a *desktop Macintosh* user-agent by default. The
 *     touch-point count is the usual separator: a real Mac reports 0 (even the
 *     touch-bar ones), an iPad reports 5.
 *   - Every browser on iOS is WebKit underneath, and Chrome, Firefox and Edge
 *     for iOS all carry "Add to Home Screen" in their own share sheets. So the
 *     test is for the platform, not for Safari; the wording in the hint stays
 *     true in all of them because they all spell the entry the same way.
 */
export function isIosLike(ua: string, maxTouchPoints: number): boolean {
	if (/\b(iPhone|iPad|iPod)\b/.test(ua)) return true;
	return /\bMacintosh\b/.test(ua) && maxTouchPoints > 1;
}

/**
 * The whole gate for the iOS hint, in one pure function so the conditions are
 * stated once and can be tested without a browser.
 */
export function shouldOfferIosHint(state: {
	iosLike: boolean;
	standalone: boolean;
	dismissed: boolean;
	engagedMs: number;
}): boolean {
	if (!state.iosLike) return false;
	// Already installed: the reader is looking at the very thing the hint would
	// tell them to create.
	if (state.standalone) return false;
	if (state.dismissed) return false;
	return state.engagedMs >= ENGAGEMENT_THRESHOLD_MS;
}

/** Parse the stored counter defensively — it is user-editable, like any localStorage value. */
function readEngagement(): number {
	if (typeof localStorage === 'undefined') return 0;
	const parsed = Number(localStorage.getItem(ENGAGEMENT_KEY));
	if (!Number.isFinite(parsed) || parsed < 0) return 0;
	return Math.min(parsed, ENGAGEMENT_THRESHOLD_MS);
}

function readDismissed(): boolean {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(DISMISSED_KEY) === '1';
}

function isStandalone(): boolean {
	if (typeof window === 'undefined') return false;
	if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
	// iOS predates `display-mode` and still exposes only this non-standard flag.
	return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function detectIosLike(): boolean {
	if (typeof navigator === 'undefined') return false;
	return isIosLike(navigator.userAgent, navigator.maxTouchPoints ?? 0);
}

class InstallStore {
	/** The stashed Chromium event, or null when the browser has not offered one. */
	promptEvent: BeforeInstallPromptEvent | null = $state(null);
	installed: boolean = $state(isStandalone());
	engagedMs: number = $state(readEngagement());
	hintDismissed: boolean = $state(readDismissed());

	readonly iosLike: boolean = detectIosLike();

	/** Chromium only: the browser has told us the site can be installed right now. */
	get canInstall(): boolean {
		return this.promptEvent !== null && !this.installed;
	}

	/**
	 * iOS only: every condition for showing the hint is met *now*. Whether it
	 * actually appears is `InstallHint.svelte`'s call — it waits for a
	 * navigation rather than materialising mid-paragraph.
	 */
	get iosHintEligible(): boolean {
		return shouldOfferIosHint({
			iosLike: this.iosLike,
			standalone: this.installed,
			dismissed: this.hintDismissed,
			engagedMs: this.engagedMs
		});
	}

	/**
	 * Spend the stashed event. Must be called synchronously from a user
	 * gesture; the event cannot be replayed, so it is cleared either way and
	 * the button disappears until Chromium offers a fresh one.
	 */
	async prompt(): Promise<void> {
		const event = this.promptEvent;
		if (!event) return;
		this.promptEvent = null;
		await event.prompt();
		const { outcome } = await event.userChoice;
		if (outcome === 'accepted') this.installed = true;
	}

	dismissHint() {
		this.hintDismissed = true;
		if (typeof localStorage !== 'undefined') localStorage.setItem(DISMISSED_KEY, '1');
	}

	/**
	 * Put a reader back where they started: no dismissal on record, no time
	 * banked. Exists for `?install-hint=reset` (see InstallHint.svelte) —
	 * fifteen minutes is a long time to re-earn by hand when you are checking
	 * whether the bar still wraps properly in Portuguese.
	 *
	 * Takes effect on the next load, because `track()` decides once at mount
	 * whether there is anything worth counting. Entering the URL is itself a
	 * load, so in practice this is invisible.
	 */
	resetHint() {
		this.hintDismissed = false;
		this.engagedMs = 0;
		if (typeof localStorage === 'undefined') return;
		localStorage.removeItem(DISMISSED_KEY);
		localStorage.removeItem(ENGAGEMENT_KEY);
	}

	/**
	 * Accumulate visible reading time. Called once from the root layout, which
	 * mounts exactly once for the life of the session (the app is an SPA after
	 * hydration), and returns its own teardown.
	 *
	 * Counting stops for good at the threshold: past it the number has no
	 * further meaning, and there is no reason to keep a timer and a localStorage
	 * write running for the rest of the session.
	 */
	track(): () => void {
		if (typeof document === 'undefined') return () => {};
		// Nothing to measure if the hint could never be shown anyway.
		if (!this.iosLike || this.installed || this.hintDismissed) return () => {};

		let timer: number | undefined;

		const stop = () => {
			if (timer === undefined) return;
			clearInterval(timer);
			timer = undefined;
		};

		const tick = () => {
			this.engagedMs = Math.min(this.engagedMs + ENGAGEMENT_TICK_MS, ENGAGEMENT_THRESHOLD_MS);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(ENGAGEMENT_KEY, String(this.engagedMs));
			}
			if (this.engagedMs >= ENGAGEMENT_THRESHOLD_MS) stop();
		};

		const sync = () => {
			if (document.visibilityState !== 'visible' || this.engagedMs >= ENGAGEMENT_THRESHOLD_MS) {
				stop();
				return;
			}
			if (timer === undefined) timer = window.setInterval(tick, ENGAGEMENT_TICK_MS);
		};

		sync();
		document.addEventListener('visibilitychange', sync);

		return () => {
			stop();
			document.removeEventListener('visibilitychange', sync);
		};
	}
}

export const install = new InstallStore();

if (browser) {
	/*
	 * Registered at module scope rather than in a component's `onMount`.
	 * `beforeinstallprompt` fires once, shortly after the browser has processed
	 * the manifest and service worker, and it does not replay for a listener
	 * that attaches late — so the listener wants to exist as early as the
	 * module graph allows. This module is imported by the root layout, which is
	 * in the entry chunk.
	 */
	window.addEventListener('beforeinstallprompt', (event) => {
		event.preventDefault();
		install.promptEvent = event as BeforeInstallPromptEvent;
	});

	// Fires for an install completed anywhere, including through the browser's
	// own menu rather than our button.
	window.addEventListener('appinstalled', () => {
		install.promptEvent = null;
		install.installed = true;
	});
}
