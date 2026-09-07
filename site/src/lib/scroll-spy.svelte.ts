/**
 * Which numbered unit the reader is currently looking at, on a page that
 * holds many of them.
 *
 * The single-unit routes (`/catechismus/[n]`, `/catechismus/compendium/[n]`) already know their
 * own position: the URL names it, and it cannot change without a
 * navigation. The CONTINUOUS views do
 * not — `/documents/[slug]` is a whole encyclical on one page and
 * `/catechismus/caput/[n]` a whole chapter — so their sidebar had no way to say
 * where the reader is, and (since the table of contents expands only the
 * branch containing the current position) nothing to expand either. This
 * supplies that missing number from scroll position.
 *
 * ## Why a binary search rather than an IntersectionObserver
 *
 * The obvious implementation observes every unit with a `rootMargin` that
 * narrows the viewport to a band near the top, and treats whatever is in
 * the band as current. It breaks on exactly the content this site has: a
 * section longer than the band leaves it EMPTY, so while the reader is in
 * the middle of a long paragraph nothing is current at all and the sidebar
 * highlight drops out until the next heading scrolls in.
 *
 * The question is not "which unit is in a band" but "which unit did the
 * reader most recently scroll past", and that has an exact answer: the last
 * one whose top edge is at or above a reference line. Because the units are
 * laid out in document order their top edges increase monotonically, so
 * that answer is a binary search — about 8 measurements for a 245-section
 * document rather than 245.
 *
 * Measurement is `requestAnimationFrame`-throttled: scroll fires far more
 * often than the screen updates, and `getBoundingClientRect` forces layout.
 * The frame is scheduled only in response to a scroll or resize, never on a
 * standing loop, so an idle page costs nothing. The one loop it does hold is
 * bounded by an animation the site is running (`springScrolling`, below), and
 * it exists to take FEWER measurements rather than more.
 *
 * ## The reference line
 *
 * A third of the way down the viewport, not the very top. At the top a unit
 * becomes "current" the instant its first line appears — before the reader
 * is plausibly reading it — and the highlight then runs consistently ahead
 * of them. A third down tracks roughly where attention actually sits.
 *
 * Browser-only by construction: it touches `window` and `document`, runs
 * inside `$effect` (which never runs server-side — doubly so now that
 * `ssr = false` in `+layout.ts` means no route renders on the server at
 * all, where "during prerendering" used to be the operative case), and
 * every view using it renders complete and navigable without it. There is
 * deliberately
 * no fallback guess before the first measurement — the position is
 * `undefined`, which the sidebar already handles as "no position known".
 */

import { onFragmentAsked } from './anchor-scroll';
import { springScrolling } from './smooth-scroll';

/** Fraction of the viewport height at which a unit counts as reached. */
const REFERENCE_LINE = 1 / 3;

/** An element id in document order, paired with the unit number it stands
 *  for — e.g. `['s17', 17]` for a document's `id="s{n}"` sections. */
export type SpyTarget = readonly [id: string, n: number];

export interface ScrollSpy {
	/** The unit the reader is at, or `undefined` before the first
	 *  measurement and on a page with nothing to track. */
	readonly current: number | undefined;
}

/**
 * Track `getTargets()` and report the reader's position.
 *
 * Call once in a component body. The internal `$effect` re-establishes the
 * listeners whenever the target LIST changes — which happens when the
 * reader switches language on the continuous document view and the whole
 * section list is replaced — and tears them down on unmount.
 *
 * The effect reads `getTargets()` and nothing else, so it does not
 * re-subscribe when the reported position changes; `current` is written
 * from the scroll handler, never read inside the effect.
 */
export function useScrollSpy(getTargets: () => readonly SpyTarget[]): ScrollSpy {
	let current: number | undefined = $state(undefined);

	$effect(() => {
		const targets = getTargets();
		if (targets.length === 0) {
			current = undefined;
			return;
		}

		// Elements are resolved once per (re)start, not per measurement:
		// `getElementById` on every frame would undo the point of the binary
		// search. A missing id is dropped rather than treated as position
		// zero — the caller's list and the rendered content can disagree
		// (unaddressable front matter, a language whose edition lacks a unit).
		const entries: { id: string; el: HTMLElement; n: number }[] = [];
		for (const [id, n] of targets) {
			const el = document.getElementById(id);
			if (el) entries.push({ id, el, n });
		}
		if (entries.length === 0) {
			current = undefined;
			return;
		}

		function measure() {
			const line = window.innerHeight * REFERENCE_LINE;

			// Still above the first unit (the page's own heading is on screen).
			// Report the first unit rather than nothing: being at the top of
			// the text is a position, and blanking the sidebar there would
			// read as the highlight being broken.
			if (entries[0].el.getBoundingClientRect().top > line) {
				current = entries[0].n;
				return;
			}

			// SCROLLED TO THE BOTTOM: report the last unit unconditionally.
			//
			// Without this, a final unit shorter than the reference line never
			// becomes current — there is no scroll left to bring its top edge
			// up to the line, so the reader reaches the end of the document
			// and the sidebar is still highlighting the second-to-last entry.
			// Any reference line below the very top has this blind spot, and
			// it is worst for exactly the short closing sections these texts
			// tend to end on.
			//
			// (Borrowed from ~/Dev/web/minimal/library/interactive-toc, which
			// solved it first with the same reasoning: "edge case, if last
			// item is short it will not trigger".)
			const scrollBottom = window.scrollY + window.innerHeight;
			if (scrollBottom >= document.documentElement.scrollHeight - 1) {
				current = entries[entries.length - 1].n;
				return;
			}

			// Last entry whose top is at or above the line. Monotonic tops
			// make this a plain binary search; `lo` always holds a
			// known-good index, so the loop cannot select a unit the reader
			// has not reached.
			let lo = 0;
			let hi = entries.length - 1;
			while (lo < hi) {
				const mid = Math.ceil((lo + hi) / 2);
				if (entries[mid].el.getBoundingClientRect().top <= line) lo = mid;
				else hi = mid - 1;
			}
			current = entries[lo].n;
		}

		let frame = 0;
		function schedule() {
			if (frame) return; // already queued for this frame
			frame = requestAnimationFrame(function step() {
				// A SCROLL THE SITE IS PERFORMING REPORTS ONCE, AT ITS
				// DESTINATION. The reader chose that destination; the offsets
				// between are not positions they asked about, and answering for
				// each of them is expensive in a way no other consumer of this
				// spy makes obvious — `StructureSidebarToc` renders only the
				// branch containing the current row, so every intermediate
				// answer mounts and unmounts a subtree, lays out its text for
				// the first time (where a `unicode-range` subset is requested,
				// and `font-display: swap` then restyles the document) and
				// forces a layout from `revealRow`. A jump crossed forty
				// sections and cost one of those; a glide crossing the same
				// forty cost forty, and the document visibly reflowed under it.
				//
				// So the frame is kept alive rather than dropped, and the
				// measurement is taken on the first frame after the animation
				// stops — however it stopped, since `springScrolling` goes false
				// on arrival, on a cancel, and on the drift check handing the
				// page back to the reader. Dropping the frame instead would
				// leave the position stale wherever the last write lands
				// exactly where the page already was and fires no scroll event.
				if (springScrolling()) {
					frame = requestAnimationFrame(step);
					return;
				}
				frame = 0;
				if (adopted) {
					adopted = false;
					return;
				}
				measure();
			});
		}

		measure();
		// A UNIT THE READER ASKED FOR IS REPORTED AT THE ASKING, not when the
		// page finishes moving. It is the same answer the measurement below
		// would reach a glide later — the fragment names the unit outright,
		// where the reference line infers one — so taking it early costs
		// nothing and is what keeps the sidebar from trailing the page it
		// describes. An id belonging to some other page furniture matches no
		// entry and is ignored rather than blanking the position.
		//
		// AND IT OUTRANKS THE ARRIVAL MEASUREMENT, which is `adopted`. The
		// fragment jump parks the unit's top just under the reading bar, well
		// above a reference line a third of the way down — so on a section
		// shorter than the gap between them, the line falls into the NEXT unit
		// and the measurement taken on arrival answers §43 to a reader who
		// asked for §42. That was true of the instant jump too and was over
		// before anyone saw it; at the end of a glide it is a visible flip.
		// The reader's own request stands until the reader moves the page
		// themselves, so exactly one measurement is skipped.
		let adopted = false;
		const unlisten = onFragmentAsked((id) => {
			const hit = unitAt(id);
			if (hit === undefined) return;
			current = hit;
			adopted = true;
		});

		/**
		 * Which unit a fragment id stands for.
		 *
		 * AN ID IS RARELY ONE OF THE TARGETS, and that is not a defect in the
		 * caller: a document's table of contents rows address the HEADING
		 * (`rowHref`, structureToc.ts — `#s{n}` lands on the section after it,
		 * which puts the heading itself off the top of the screen), while the
		 * spy tracks the numbered sections. Matching on the id alone therefore
		 * answered nothing for most rows on the one route this all exists for,
		 * and the highlight waited for the measurement at the end of the travel
		 * — which is the lag `onFragmentAsked` was added to remove.
		 *
		 * So an unknown id is placed rather than dropped: the unit is the first
		 * one AT or AFTER it, which is the section a heading introduces and the
		 * section itself when the id is a section's. By document position and
		 * not by geometry, so it costs no layout and needs no tolerance — with
		 * an ancestor counted as a hit, since a heading may be rendered inside
		 * the very section it opens.
		 */
		function unitAt(id: string): number | undefined {
			const exact = entries.find((entry) => entry.id === id);
			if (exact) return exact.n;
			const el = document.getElementById(id);
			if (!el) return undefined;
			const at = entries.find((entry) => {
				if (entry.el === el) return true;
				const pos = el.compareDocumentPosition(entry.el);
				return Boolean(
					pos & Node.DOCUMENT_POSITION_FOLLOWING || pos & Node.DOCUMENT_POSITION_CONTAINS
				);
			});
			return at?.n;
		}
		window.addEventListener('scroll', schedule, { passive: true });
		// A resize moves both the reference line and the layout the tops were
		// measured against, so it needs the same treatment as a scroll.
		window.addEventListener('resize', schedule, { passive: true });

		return () => {
			if (frame) cancelAnimationFrame(frame);
			unlisten();
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	});

	return {
		get current() {
			return current;
		}
	};
}
