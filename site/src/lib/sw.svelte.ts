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
 * So: watch for the waiting worker, tell the reader, and let them decide. On
 * accept, `SKIP_WAITING` goes to the worker and `controllerchange` reloads the
 * page. Nothing happens without the reader asking, which is the same principle
 * the no-`skipWaiting` decision was protecting in the first place.
 *
 * `registration.update()` runs on tab focus with a floor between checks, since
 * an installed PWA may go months without a cold navigation and the browser's
 * own update check rides on navigations.
 *
 * DOWNLOADS. The layout asks for the automatic waves once, after first render;
 * `requestWave` and `requestWork` are the explicit forms, for a UI that offers
 * "make this available offline" against a real byte count. See `planWaves` in
 * `sw-policy.ts` for the order and where the automatic line falls.
 */

import { contentLangChain, lastContentRead } from './corpus';
import { content, type WorkTypeKey } from './content.svelte';
import type { WaveId } from './sw-policy';

/** How long to wait between `registration.update()` checks. Six hours: long
 *  enough that a reader with the app open all day costs one or two requests,
 *  short enough that a deploy reaches an installed PWA the same day. */
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** Give route loading and the first interaction a clear head start before
 *  asking for anything in the background. */
const PRELOAD_DELAY_MS = 1_500;

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

	#registration: ServiceWorkerRegistration | undefined;
	#lastCheck = 0;
	/** Set while reloading, so `controllerchange` cannot reload twice. */
	#reloading = false;

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

		// A worker that calls skipWaiting hands control to this page mid-life.
		// That only happens because the reader accepted the offer below, so the
		// right response is to reload onto the version they just asked for.
		navigator.serviceWorker.addEventListener(
			'controllerchange',
			() => {
				if (this.#reloading) return;
				this.#reloading = true;
				location.reload();
			},
			{ signal }
		);

		navigator.serviceWorker.ready
			.then((registration) => {
				if (cancelled) return;
				this.#registration = registration;
				this.#watchForUpdate(registration, signal);
				this.checkForUpdate();
			})
			.catch(() => {
				// No registration (private browsing, an unsupported context).
				// Reading works; there is simply nothing to update or preload.
			});

		document.addEventListener('visibilitychange', () => this.checkForUpdate(), { signal });

		const timer = window.setTimeout(() => {
			if (!cancelled) this.requestAutomatic();
		}, PRELOAD_DELAY_MS);

		return () => {
			cancelled = true;
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
		if (registration.waiting && navigator.serviceWorker.controller) this.updateReady = true;

		registration.addEventListener(
			'updatefound',
			() => {
				const installing = registration.installing;
				if (!installing) return;
				installing.addEventListener('statechange', () => {
					if (installing.state === 'installed' && navigator.serviceWorker.controller) {
						this.updateReady = true;
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
		if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
		const now = Date.now();
		if (now - this.#lastCheck < UPDATE_CHECK_INTERVAL_MS) return;
		this.#lastCheck = now;
		this.#registration?.update().catch(() => {
			// Offline, or the check failed. The next focus tries again.
		});
	}

	/** The reader accepted the update. The worker takes over, `controllerchange`
	 *  fires, and the page reloads onto the new version. */
	applyUpdate(): void {
		const waiting = this.#registration?.waiting;
		if (!waiting) {
			// Raced away (another tab accepted first, or the worker activated on
			// its own because every other client closed). A reload lands on the
			// new version either way.
			location.reload();
			return;
		}
		waiting.postMessage({ type: 'SKIP_WAITING' });
	}

	/** The waves the worker may take without being asked, for this reader's
	 *  languages and whatever they have open. */
	requestAutomatic(): void {
		this.#send({ type: 'CACHE_CONTENT' });
	}

	/** One named wave, in full. The reader asked, so the worker does not gate
	 *  this on connection or quota. */
	requestWave(wave: WaveId): void {
		this.#send({ type: 'CACHE_WAVE', wave });
	}

	/** One work, whatever language it is in — asking for a work by id IS the
	 *  explicit request that reaching outside the reader's own languages
	 *  requires. */
	requestWork(workId: string): void {
		this.#send({ type: 'CACHE_CONTENT', workId });
	}

	/** Forget the whole offline library. */
	clear(): void {
		this.#send({ type: 'CLEAR_CONTENT' });
	}

	#send(message: Record<string, unknown>): void {
		const controller = navigator.serviceWorker?.controller;
		if (!controller) return;
		controller.postMessage({
			...message,
			// Sent with every request rather than read by the worker, which has
			// no access to the reader's stored preferences: language lives in
			// localStorage and the worker cannot see it.
			langs: contentLangChain(readerLang()),
			current: lastContentRead(),
			chosen: chosenEditions()
		});
	}

	#onMessage(event: MessageEvent): void {
		const data = event.data as { type?: string } & Partial<WaveProgress>;
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
