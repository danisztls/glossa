/**
 * The page's side of the service worker conversation: whether a new version is
 * waiting, and how much of the library is on the device.
 *
 * Two jobs, and the first is the one that was missing entirely.
 *
 * UPDATES. `src/service-worker.ts` deliberately does not `skipWaiting()` — a
 * reader mid-chapter should not have the ground shift under them. But the
 * browser's own rule for when a waiting worker takes over ("once every client
 * on the old version is gone") is not something a reader can discover or act
 * on: a plain reload does NOT release the old worker, because the new document
 * is claimed by it and there is never a moment with zero clients. Closing one
 * tab of several does nothing. An installed PWA can sit on a superseded
 * version indefinitely.
 *
 * That is worse here than on most sites, because the corpus INDEX is baked
 * into the shell bundle: a stale shell is a stale table of contents, so a new
 * work, a new translation or a correction never appears. The reader is not
 * looking at an old stylesheet, they are looking at an old library.
 *
 * So: watch for the waiting worker, and take it at a moment that costs the
 * reader nothing. There are three such moments, tried in that order:
 *
 *   1. THE READER IS NOT LOOKING. Tab hidden, `applyUpdate` straight away.
 *      Nothing is on screen to shift.
 *   2. THE READER IS LEAVING THIS PAGE ANYWAY. `carriesUpdate` below says
 *      which navigations qualify; the root layout cancels one and hands the
 *      destination to `applyOnNavigation`, which applies the update and lands
 *      there instead of where it started. A full load where a soft transition
 *      would have been, at the one instant the reader has no place to lose.
 *   3. NEITHER, so ask. `UpdateBanner` is the fallback now rather than the
 *      only path — for the reader parked on one chapter who never navigates,
 *      which is the case where consent is genuinely the right answer.
 *
 * In all three the ground moves only where there is nothing standing on it.
 * That is the same principle the no-`skipWaiting` decision was protecting; 1
 * and 2 are the observation that consent is not the only way to honour it.
 *
 * `registration.update()` runs on tab focus with a floor between checks, since
 * an installed PWA may go months without a cold navigation and the browser's
 * own update check rides on navigations.
 *
 * DOWNLOADS. The layout asks for the automatic waves once, after first render;
 * `requestWave` and `requestWork` are the explicit forms, for a UI that offers
 * "make this available offline" against a real byte count. See `planWaves` in
 * `sw-policy.ts` for the order and where the automatic line falls.
 *
 * OFFLINE MODE stops both jobs at their source — no `registration.update()`,
 * no offer, no apply, and no message that would make the worker fetch
 * anything. The listeners are still wired, because an event listener costs
 * nothing and re-attaching a set of them on a toggle is a lifecycle to get
 * wrong; what is gated is every point that reaches the network or moves the
 * ground under the reader. `$lib/offline.svelte.ts` has the argument, and the
 * worker's own half of it.
 */

import { contentLangChain, lastContentRead } from './corpus';
import { content, type WorkTypeKey } from './content.svelte';
import { offline, setOfflineObserver } from './offline.svelte';
import { usage } from './usage';
import type { WaveId, WavePlanInput, WaveRequest } from './sw-policy';

/** How long to wait between `registration.update()` checks. Six hours: long
 *  enough that a reader with the app open all day costs one or two requests,
 *  short enough that a deploy reaches an installed PWA the same day. */
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Give route loading and the first interaction a clear head start before
 *  asking for anything in the background. */
const PRELOAD_DELAY_MS = 1_500;

/** How long `applyOnNavigation` waits for the new worker before giving up and
 *  going where the reader asked anyway.
 *
 *  `activate` sweeps two caches before `controllerchange` fires, and one of
 *  them walks every key in the content cache — normally milliseconds, but it
 *  is work, and a reader who clicked a link is watching nothing happen while
 *  it runs. Three seconds is far past the normal case and far short of a
 *  reader deciding the site is broken. Timing out is not a failure: the
 *  navigation completes on the old shell, the new worker stays waiting, and
 *  the next link tries again. */
const APPLY_TIMEOUT_MS = 3_000;

/**
 * Whether a pending navigation is one the update can ride on.
 *
 * Exported and pure because the alternative is this judgment living inside
 * `+layout.svelte`, where nothing in this repo can test it — the same reason
 * `inline-html.ts` exists (CLAUDE.md, "Running prose is an apparatus").
 *
 * Three exclusions, each a way to turn a free update into a cost:
 *
 *   - ONLY `link`. A `goto` is the app moving itself, and several of those
 *     are state changes wearing a URL: a compare toggle, an edition switch.
 *     Reloading the document under one would be a visible stall in the middle
 *     of an interaction the reader thinks of as a button, not a journey.
 *   - NEVER `popstate`. Back must stay back. A full load there pushes a
 *     history entry and lands at the top of a page the reader had a position
 *     in — the precise loss this whole scheme exists to avoid.
 *   - NEVER WITHIN THE SAME DOCUMENT. A footnote anchor, a `#`-jump from the
 *     table of contents and a sidenote link are all navigations to the page
 *     the reader is already reading. They are the commonest navigation in the
 *     corpus and the one where a reload costs the most.
 */
export interface PendingNavigation {
	type: string;
	from: URL | undefined;
	to: URL | undefined;
	willUnload: boolean;
}

export function carriesUpdate(nav: PendingNavigation): boolean {
	if (nav.type !== 'link') return false;
	// Already a full load (an external link, a download). There is nothing to
	// cancel and nothing to gain — the next document decides for itself.
	if (nav.willUnload) return false;
	if (!nav.from || !nav.to) return false;
	if (nav.from.origin !== nav.to.origin) return false;
	return nav.from.pathname !== nav.to.pathname || nav.from.search !== nav.to.search;
}

/**
 * Everything the worker cannot work out for itself: the reader's language
 * chain, what they have open, and the editions they picked.
 *
 * EXPORTED BECAUSE TWO CALLERS MUST AGREE. `#send` puts it on every download
 * message, and `library.svelte.ts` plans the same waves on this side in order
 * to PRICE them. If the two ever computed it differently the panel would show
 * a reader one number and the worker would fetch another set of files — a
 * disagreement with no symptom beyond a size that is quietly wrong.
 */
export function readerPlan(): WavePlanInput {
	return {
		langs: contentLangChain(readerLang()),
		current: lastContentRead(),
		chosen: chosenEditions()
	};
}

export interface WaveProgress {
	wave: WaveId;
	count: number;
	bytes: number;
	ofCount: number;
	ofBytes: number;
}

class ServiceWorkerStore {
	/** A new version is installed and waiting for permission to take over. */
	updateReady = $state(false);
	/** Most recent wave progress report, for an offline-library UI. */
	progress = $state<WaveProgress | undefined>();
	/** Bumped once per `CACHE_CONTENT:done`. A COUNTER and not a boolean,
	 *  because what a consumer wants is "something finished, look again" and
	 *  two fills in a session must be two signals — `AdvancedSheet` re-measures
	 *  the cache off this. */
	completed = $state(0);
	/** Whether a worker is actually driving this page. The library panel is
	 *  offered only where a download would do something: `npm run dev`
	 *  registers no worker at all (`vite.config.ts` says why), and a control
	 *  that silently does nothing there is worse than an absent one. */
	controlled = $state(false);

	#registration: ServiceWorkerRegistration | undefined;
	#lastCheck = 0;
	/** Set once the page is on its way to the new version, so nothing sends it
	 *  twice — `controllerchange` and the timeout below race by design. */
	#reloading = false;
	/** Where to land when the new worker takes over. Set only by
	 *  `applyOnNavigation`; undefined means "back to this address". */
	#pendingHref: string | undefined;
	#pendingTimer: number | undefined;

	/**
	 * Wire up update detection and the deferred preload. Returns a teardown.
	 * Call once, from the root layout's `onMount`.
	 */
	start(): () => void {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};

		let cancelled = false;
		const controller = new AbortController();
		const { signal } = controller;

		navigator.serviceWorker.addEventListener('message', (event) => this.#onMessage(event), {
			signal
		});

		// The reader's switch, to the one place that cannot read it for itself.
		// Sent on every start and not only on a change: the worker keeps its own
		// copy in a cache, but a copy is a thing that can go stale (storage
		// cleared, a browser that dropped the entry), and a page is the cheapest
		// possible correction. `#post` and not `#send` — this message is the one
		// that must go THROUGH offline mode rather than being stopped by it.
		this.controlled = !!navigator.serviceWorker.controller;
		this.#post({ type: 'OFFLINE_MODE', on: offline.enabled });
		setOfflineObserver((on) => this.#onOfflineChange(on));

		// A worker that calls skipWaiting hands control to this page mid-life.
		// Every route to that is one of the three moments in the docblock, so
		// the right response is always to go to the new version now — either
		// where the reader was heading, or back to where they are.
		navigator.serviceWorker.addEventListener('controllerchange', () => this.#land(), { signal });

		navigator.serviceWorker.ready
			.then((registration) => {
				if (cancelled) return;
				this.#registration = registration;
				// Again, now that there certainly is a worker. The call above
				// runs before the first one is claimed, where there is no
				// controller to post to and the message is dropped — which is
				// every reader's first visit.
				this.#post({ type: 'OFFLINE_MODE', on: offline.enabled });
				// A first visit reaches `start()` before `clients.claim()` has
				// made this worker the controller, so the flag above was false.
				this.controlled = !!navigator.serviceWorker.controller;
				this.#watchForUpdate(registration, signal);
				this.checkForUpdate();
			})
			.catch(() => {
				// No registration (private browsing, an unsupported context).
				// Reading works; there is simply nothing to update or preload.
			});

		document.addEventListener(
			'visibilitychange',
			() => {
				this.checkForUpdate();
				// An update that arrived while the reader was here, taken now
				// that they are not. The banner stays raised underneath: if the
				// worker never activates, they come back to the offer.
				if (document.visibilityState === 'hidden' && this.updateReady) this.applyUpdate();
			},
			{ signal }
		);

		const timer = window.setTimeout(() => {
			if (!cancelled) this.requestAutomatic();
		}, PRELOAD_DELAY_MS);

		return () => {
			cancelled = true;
			setOfflineObserver(undefined);
			window.clearTimeout(timer);
			controller.abort();
		};
	}

	/**
	 * Watch a registration for a newly installed worker.
	 *
	 * The `navigator.serviceWorker.controller` test is what keeps this from
	 * announcing an update on a reader's FIRST visit: with no controller, the
	 * worker reaching `installed` is the initial install, not a new version.
	 * Getting that backwards is why so many sites greet a first-time visitor
	 * with "a new version is available".
	 *
	 * `registration.waiting` is checked up front as well as watched, because
	 * the update may have finished installing before this page ever loaded —
	 * which is the common case for the reader this exists to help.
	 */
	#watchForUpdate(registration: ServiceWorkerRegistration, signal: AbortSignal): void {
		if (registration.waiting && navigator.serviceWorker.controller) this.#offerUpdate();

		registration.addEventListener(
			'updatefound',
			() => {
				const installing = registration.installing;
				if (!installing) return;
				installing.addEventListener('statechange', () => {
					if (installing.state === 'installed' && navigator.serviceWorker.controller) {
						this.#offerUpdate();
					}
				});
			},
			{ signal }
		);
	}

	/** Ask the browser whether a newer worker exists. Rate-limited: this fires
	 *  on every tab focus, and an unthrottled check would be a request per
	 *  alt-tab. */
	checkForUpdate(): void {
		// The one request this file makes on its own initiative, so it is the
		// first thing offline mode has to stop. A reader who turns the switch off
		// gets a check immediately — see `#onOfflineChange`.
		if (offline.enabled) return;
		if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
		const now = Date.now();
		if (now - this.#lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
		this.#lastCheck = now;
		this.#registration?.update().catch(() => {
			// Offline, or the check failed. The next focus tries again.
		});
	}

	/** Take the update and come back to this same address: the reader accepted
	 *  the offer, or the tab went to the background. The worker takes over,
	 *  `controllerchange` fires, and `#land` reloads onto the new version. */
	applyUpdate(): void {
		// Unreachable from the banner while offline mode is on (it never goes
		// up), but this is also the hidden-tab path in `start()`, and a shell
		// swap is exactly the kind of thing a reader asks a standing app not to
		// do. Cheap to state here rather than to reason about from two callers.
		if (offline.enabled) return;
		const waiting = this.#registration?.waiting;
		if (!waiting) {
			// Raced away (another tab accepted first, or the worker activated on
			// its own because every other client closed). A reload lands on the
			// new version either way.
			this.#land();
			return;
		}
		waiting.postMessage({ type: 'SKIP_WAITING' });
	}

	/**
	 * Moment 2: the reader clicked a link, so take the update and land THERE.
	 *
	 * The caller has already cancelled the client-side navigation — see
	 * `carriesUpdate` for which ones qualify and `+layout.svelte` for the hook.
	 * What the reader sees is a page load instead of a soft transition, at an
	 * address they were going to anyway, so there is no scroll position to keep
	 * and no state to carry: the destination has neither yet.
	 *
	 * Waiting for `controllerchange` rather than navigating immediately is the
	 * whole point. A new document opened before the worker activates is claimed
	 * by the OLD one, which is the trap this file's docblock opens with — the
	 * reader would pay a full load and arrive on the same stale shell.
	 */
	applyOnNavigation(href: string): void {
		this.#pendingHref = href;
		const waiting = this.#registration?.waiting;
		if (!waiting) {
			this.#land();
			return;
		}
		// Down before the load, so the bar cannot flash on the way out.
		this.updateReady = false;
		waiting.postMessage({ type: 'SKIP_WAITING' });
		this.#pendingTimer = window.setTimeout(() => this.#land(), APPLY_TIMEOUT_MS);
	}

	/** Go to the new version, once. */
	#land(): void {
		if (this.#reloading) return;
		this.#reloading = true;
		window.clearTimeout(this.#pendingTimer);
		if (this.#pendingHref) location.href = this.#pendingHref;
		else location.reload();
	}

	/** The waves the worker may take without being asked, for this reader's
	 *  languages and whatever they have open. */
	requestAutomatic(): void {
		this.#send({ type: 'CACHE_CONTENT' });
	}

	/** One named wave in full, or `'all'` for every wave. The reader asked, so
	 *  the worker does not gate this on connection or quota. */
	requestWave(wave: WaveRequest): void {
		this.#send({ type: 'CACHE_WAVE', wave });
	}

	/** One work, whatever language it is in — asking for a work by id IS the
	 *  explicit request that reaching outside the reader's own languages
	 *  requires. */
	requestWork(workId: string): void {
		this.#send({ type: 'CACHE_CONTENT', workId });
	}

	/** Forget the whole offline library.
	 *
	 *  `#post` and not `#send`, for two reasons that point the same way: this
	 *  is a DELETION, so the gate that stops downloads has no business
	 *  stopping it — a reader freeing space on a metered connection is exactly
	 *  who has offline mode on — and the worker returns before it reads the
	 *  reader vocabulary `#send` attaches, so sending it was only ever waste. */
	clear(): void {
		this.#post({ type: 'CLEAR_CONTENT' });
	}

	#send(message: Record<string, unknown>): void {
		// EVERY message that goes through here makes the worker fetch something,
		// which is why the gate is at the chokepoint rather than at each of the
		// three callers. The worker refuses them as well (a tab opened before the
		// switch is still sending); this is the half that means nothing is even
		// asked for.
		if (offline.enabled) return;
		// The reader vocabulary is sent with every request rather than read by
		// the worker, which has no access to their stored preferences:
		// language lives in localStorage and the worker cannot see it.
		this.#post({ ...message, ...readerPlan() });
	}

	/** Post to the worker, with no gate and none of the download vocabulary —
	 *  for the one message that CARRIES the gate rather than obeying it. */
	#post(message: Record<string, unknown>): void {
		// No controller means no worker is running this page yet, so there is
		// nobody to tell and nothing it could be doing wrong. The next start
		// posts again, and the worker's own cached copy answers meanwhile.
		const controller = navigator.serviceWorker?.controller;
		if (!controller) return;
		controller.postMessage(message);
	}

	/**
	 * The switch moved. Tell the worker, and undo or redo what it suppresses.
	 *
	 * Turning it ON also takes down a banner that is already up: an offer the
	 * reader can no longer accept (`#offerUpdate` and `applyUpdate` are both
	 * gated) must not keep sitting on the page as if they could.
	 *
	 * Turning it OFF resumes both jobs at once rather than waiting for the next
	 * tab focus and the next mount — the reader has just said the network is
	 * available again, and the two things they were denied are a check and a
	 * fill.
	 */
	#onOfflineChange(on: boolean): void {
		this.#post({ type: 'OFFLINE_MODE', on });
		if (on) {
			this.updateReady = false;
			return;
		}
		this.checkForUpdate();
		this.requestAutomatic();
	}

	/** Raise the banner, and record that an offer was made. The counter behind
	 *  `usage`'s `behind` bucket asks whether `UpdateBanner` actually moves
	 *  anyone off a superseded shell, which needs to know an offer happened —
	 *  not merely that one was pending somewhere. */
	#offerUpdate(): void {
		// Nothing here needs the network — the worker is already installed and
		// waiting — but taking it swaps the shell, and a reader who has asked the
		// app to stand still has asked for that too. It stays waiting; the switch
		// coming off is what lets it through.
		if (offline.enabled) return;
		this.updateReady = true;
		if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
			// Moment 1. Deliberately WITHOUT `noteUpdateOffered`: `behind`
			// counts readers who saw the bar and left it there, and a bar that
			// was never on a screen anyone was looking at is not one of them.
			// Counting it would report the measure's own success as staleness.
			this.applyUpdate();
			return;
		}
		usage.noteUpdateOffered();
	}

	#onMessage(event: MessageEvent): void {
		const data = event.data as { type?: string; reason?: string } & Partial<WaveProgress>;
		if (data?.type === 'SW:install-failed') {
			usage.noteSwFailure(typeof data.reason === 'string' ? data.reason : 'other');
			return;
		}
		if (data?.type === 'CACHE_CONTENT:done') {
			// Down, not left showing 100%: the run is over, and a bar that
			// stays full is indistinguishable from one that stalled there.
			this.progress = undefined;
			this.completed += 1;
			return;
		}
		if (data?.type === 'CACHE_CONTENT:progress' && data.wave) {
			this.progress = {
				wave: data.wave,
				count: data.count ?? 0,
				bytes: data.bytes ?? 0,
				ofCount: data.ofCount ?? 0,
				ofBytes: data.ofBytes ?? 0
			};
		}
	}
}

/**
 * The interface language, read from storage directly rather than through
 * `i18n`.
 *
 * The reason used to be graph weight: importing `i18n.svelte.ts` would make a
 * module the root layout loads before anything else depend on the whole i18n
 * store — fourteen eagerly-imported dictionaries — for one string. That reason
 * is spent, since `chosenEditions` above imports `content.svelte.ts` and that
 * imports i18n. (No new weight: the layout itself imports `t`.)
 *
 * What is left is smaller and still true. This wants the raw stored tag, not a
 * validated `UiLang`: the key is the one `app.html`'s pre-paint script writes
 * and reads, `document.documentElement.lang` is the same answer a step later,
 * and a wrong answer costs a suboptimal download order rather than
 * correctness. Reading it directly is also what keeps this working before the
 * i18n store has hydrated.
 */
/**
 * The editions this reader is actually reading, one per work type.
 *
 * `content.workIdFor` answers the EFFECTIVE edition — an active override if
 * there is one, the UI language's default otherwise — which is deliberately
 * more than "their overrides": it is the same answer the reader is routed to
 * when they open the work, and sending it means the offline library and the
 * reader's screen cannot disagree about which edition is theirs. Where there
 * is no override the answer is redundant with `langs` and costs nothing;
 * where there is one it is the whole point (see `WavePlanInput.chosen`).
 *
 * Documents are left out. Their overrides are per slug — hundreds of possible
 * keys, one work each — and the wave they belong to is not automatic, so
 * naming them here would order a download nobody has asked for.
 *
 * This is why the module now imports `content.svelte.ts` (and through it
 * `i18n.svelte.ts`, which `readerLang` below still declines to depend on for
 * its own reason). The store reads localStorage through the same staleness
 * rule the edition menu does, and duplicating that rule here to keep the
 * import out would be a second copy of a policy that has already been
 * rewritten once.
 */
function chosenEditions(): string[] {
	const types: WorkTypeKey[] = ['bible', 'catechism', 'compendium', 'prayer', 'summa'];
	try {
		return types.map((type) => content.workIdFor(type)).filter((id): id is string => !!id);
	} catch {
		// The store reads storage on construction; a context that refuses it
		// should cost the plan its precision, not its existence.
		return [];
	}
}

function readerLang(): string {
	try {
		return localStorage.getItem('glossa:ui-lang') || document.documentElement.lang || 'en';
	} catch {
		return document.documentElement.lang || 'en';
	}
}

export const serviceWorker = new ServiceWorkerStore();
