/**
 * The spring, applied to every fragment jump inside the page the reader is
 * already on: a table of contents row on `/documenta/[slug]`, where the whole
 * document is one page and the sidebar links `#s{n}`; an article of a Summa
 * question (`#a3`); a verse number; anything else that names a target in this
 * document.
 *
 * IT DOES NOT INTERCEPT THE NAVIGATION, AND THAT IS THE WHOLE DESIGN. A
 * fragment link is not only a scroll — it is a history entry, a `hashchange`,
 * a focus move, and, where SvelteKit's router recognises it, an update to
 * `page.url`. Taking the click means owning all of them, and the two that
 * cannot be owned cheaply are the ones that matter: a `history.pushState`
 * written here copies `sveltekit:history` onto the new entry, so Back lands on
 * an index the router reads as no movement at all; and `goto()`, the sanctioned
 * way to stay in sync, runs the whole navigation machinery — `load`, a
 * `root.$set` over the tree — for a scroll (§The liturgical calendar measured
 * what that costs, down to the font restyle it provoked).
 *
 * So the browser performs the jump exactly as it does today and this only
 * REPLAYS THE TRAVEL: note where the page was on the way into the click, and
 * on the scroll that follows, put it back and glide to where the browser put
 * it. The failure mode of every guess below is therefore that the animation
 * does not run, which is the behaviour it replaced — never a jump that lands
 * somewhere else.
 *
 * THE REWIND IS INVISIBLE, and that is a property of the event loop rather
 * than of luck: a `scroll` event is dispatched in the rendering update's
 * scroll steps, which run before that frame's animation callbacks and before
 * it paints. The frame that would have shown the page at the target shows it
 * back at the origin instead. Nothing is ever painted in two places.
 *
 * ONLY A LINK TO THIS PAGE ARMS IT. A cross-page deep link scrolls too —
 * SvelteKit calls `scrollIntoView()` once the new route has rendered — and
 * gliding there would animate a page the reader has not seen yet, from a top
 * they never occupied. `samePageFragment` is that gate and `ARM_FRAMES` is its
 * second half: a route that resolves from cache still cannot land inside it.
 *
 * The reduced-motion check is not repeated here. `springScrollTo` owns it, and
 * under it the rewind and the jump back both land in the same frame — so a
 * reader who asked for less motion sees exactly what they saw before.
 */

import { cancelSpringScroll, glideScrollToElement } from './smooth-scroll';

/**
 * How many frames a click's claim on the next scroll lasts.
 *
 * The jump is performed in the click's own task, so the scroll event arrives
 * in the very next rendering update and one frame would nearly always do. Three
 * is slack for a frame the browser dropped between the two, and it is still far
 * short of the cheapest cross-page navigation — which is the thing the deadline
 * exists to stay under, since a route that rendered inside the window would get
 * its arrival animated.
 */
const ARM_FRAMES = 3;

/* ------------------------------------------------------------------------ *
 * WHICH UNIT THE READER ASKED FOR, ANNOUNCED AT THE CLICK.
 *
 * The scroll spy answers "where is the reader" by measuring, and this module
 * stops it measuring while the glide runs (`springScrolling`, smooth-scroll) —
 * so without this the sidebar held its old row for the whole half second and
 * then snapped, which reads as the table of contents lagging behind the page.
 *
 * It is not a shortcut for the measurement: it is a better answer than any
 * measurement can give, and it is available earlier. A reader who clicks §42
 * is at §42 from that moment, whatever the scrollport is doing on the way —
 * and the fragment names the unit exactly, where the reference line has to
 * infer one from a viewport offset.
 *
 * A list rather than a store because the subscriber is `scroll-spy.svelte.ts`,
 * one per page that has a spy at all, and it needs the value inside an
 * `$effect` it already owns rather than as a second reactive source to
 * reconcile against its own.
 * ------------------------------------------------------------------------ */

const asked = new Set<(id: string) => void>();

/**
 * Hear which element id the reader has just asked to be taken to, at the
 * moment they ask rather than when the page arrives. Returns the unsubscribe.
 *
 * The id is raw — a consumer that knows nothing about it should ignore it,
 * never treat it as "no position".
 */
export function onFragmentAsked(fn: (id: string) => void): () => void {
	asked.add(fn);
	return () => asked.delete(fn);
}

/**
 * Does this href name a target in the page `here`, so that following it moves
 * the page rather than leaving it?
 *
 * Resolved rather than compared as text: a row's `href` may be `#s12`, the
 * whole path, or a relative segment, and all three are the same link. The
 * search is part of the comparison because it is part of the address on the
 * routes that have one (`?c=`, `?v=`, `?compare=`) — a link that changes it
 * asks for a different page of this route, not a place in this one.
 */
export function samePageFragment(href: string, here: string): boolean {
	let url: URL;
	let base: URL;
	try {
		base = new URL(here);
		url = new URL(href, base);
	} catch {
		return false;
	}
	if (url.hash.length < 2) return false;
	return url.origin === base.origin && url.pathname === base.pathname && url.search === base.search;
}

/** Is this the click that follows a link, rather than one the browser will
 *  answer with a new tab, a download or a context menu? */
function isPlainFollow(e: MouseEvent): boolean {
	return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

/**
 * Watch for same-page fragment jumps and replay them as a glide. Returns the
 * teardown; `+layout.svelte` mounts it once for the session.
 */
export function installAnchorGlide(): () => void {
	/** Where the page was when the click came in. */
	let from = 0;
	/** The element the reader asked for, so the glide can follow it. */
	let asking: HTMLElement | null = null;
	/** Frames left before the claim lapses; 0 means not armed. */
	let armed = 0;
	let frame = 0;

	function disarm() {
		armed = 0;
		asking = null;
		if (frame) cancelAnimationFrame(frame);
		frame = 0;
		window.removeEventListener('scroll', onScroll);
	}

	function countdown() {
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (--armed > 0) countdown();
			else disarm();
		});
	}

	function onScroll() {
		const to = window.scrollY;
		const el = asking;
		disarm();
		// The browser did not move after all — a target already at the top of
		// the scrollport, or a scroll that was somebody else's.
		if (to === from) return;
		// Back to where the reader was, then forward under the spring. Both
		// writes are inside this handler, so the frame paints once, at `from`.
		//
		// `to` is the browser's own answer for this element and is handed over
		// with it, so the glide starts from a measured offset and then follows
		// the element rather than the number — a font swap re-measuring the
		// lines above it must not leave the reader at the heading before.
		window.scrollTo({ top: from, behavior: 'auto' });
		if (el) glideScrollToElement(el, to);
	}

	// CAPTURE, so this runs before SvelteKit's own document-level handler and
	// before anything that calls `preventDefault`. It never prevents anything
	// itself, so ordering costs nothing — and the one branch of the router that
	// does take the click (a second click on the hash already in the address,
	// which it answers with `scrollIntoView` and a focus) still scrolls, and is
	// still replayed.
	function onClick(e: MouseEvent) {
		if (!isPlainFollow(e)) return;
		if (!(e.target instanceof Element)) return;
		const el = e.target.closest('a[href]');
		if (!(el instanceof HTMLAnchorElement)) return;
		if (el.hasAttribute('download') || (el.target && el.target !== '_self')) return;
		if (!samePageFragment(el.getAttribute('href') ?? '', location.href)) return;

		// A spring still running would write the scrollport on the very frame
		// this jump is reported on, and its own writes would be read here as the
		// jump. Stopping it first also stops it fighting the browser: after the
		// teleport its `state` and its drift check both describe a page that is
		// no longer there, and it would abandon the glide one frame in.
		cancelSpringScroll();

		from = window.scrollY;
		if (!armed) window.addEventListener('scroll', onScroll, { passive: true });
		armed = ARM_FRAMES;
		if (!frame) countdown();

		// A hash this page cannot decode names no element.
		let id: string;
		try {
			id = decodeURIComponent(el.hash.slice(1));
		} catch {
			return;
		}
		// Resolved here rather than on the scroll, because THIS is the DOM the
		// reader clicked in: announcing the unit below re-renders the sidebar,
		// and on a route where that could replace the target it must not be a
		// different element that gets followed.
		asking = document.getElementById(id);

		// Announced before the browser has moved anything: the answer is the
		// reader's own request, so it does not wait on the travel.
		for (const fn of asked) fn(id);
	}

	document.addEventListener('click', onClick, true);
	return () => {
		document.removeEventListener('click', onClick, true);
		disarm();
	};
}
