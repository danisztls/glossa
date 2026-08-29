import { untrack } from 'svelte';
import { canHover, HOVER_OPEN_MS, HOVER_CLOSE_MS } from './floating';
import { AnchoredPanel } from './floating.svelte';

/**
 * Whether the reader's viewport has room to set notes in the margin.
 *
 * TWO APPARATUSES USE IT, and they are different kinds of note. `Sidenote`
 * sets an annotated edition's GLOSS there — Challoner at the length of a
 * sentence — and `CitationDisclosure` a numbered footnote's SOURCE, which is
 * shorter (26 characters on average across the Catechism's 3,698, 53 at the
 * ninetieth percentile) and far commoner. Both are apparatus over a text
 * rather than the text, both are wanted beside the line that raises them, and
 * once there is a margin to put them in neither has any reason to be a
 * disclosure. So the arrangement is one arrangement — `.margin-note` in
 * app.css — and this module is what decides, for both, that it applies.
 *
 * WHY THIS IS JAVASCRIPT AND NOT PURELY A MEDIA QUERY. The CSS could place
 * the notes on its own; what it cannot do is tell the marker what to say
 * about itself. A margin note is *already visible*, so `Sidenote`'s marker is
 * not a disclosure control there and must not claim to be one —
 * `aria-expanded` on a button whose content is on screen regardless is a lie
 * to a screen reader, and the reverse (no state at all on a phone, where the
 * gloss really is hidden until tapped) is a control with no state. The two
 * layouts genuinely differ in what that marker IS, so the breakpoint has to
 * be legible to the markup and not only to the stylesheet.
 *
 * `CitationDisclosure` reads the same value for a different question, and it
 * is the plainer of the two: its marker opens a popover at every width, so
 * only whether the margin ALSO gets a copy is in doubt. The two apparatuses
 * agree on where a note goes and disagree about what a second route to it is
 * worth — a gloss beside its line is read there and wants nothing further,
 * where a citation's column narrows with the reader's text and stacks up
 * beside a densely-cited paragraph.
 *
 * `MARGIN_QUERY` is deliberately wider than `.reading-layout`'s own 80rem
 * grid breakpoint. At exactly 80rem the reading column and the navigation
 * aside are the whole of the viewport, and `--margin-lane` — the grid's first
 * column, which is the margin the notes occupy — has collapsed to nothing to
 * let them be. It opens as the viewport grows, so it appears well
 * after the aside does, and asking for the notes earlier would push them over
 * the text.
 *
 * INLINE-START, NOT INLINE-END: the end margin is where `.reading-aside`
 * already lives at these widths. The start margin is both the free one and
 * the historically right one — a *Glossa Ordinaria* sets its gloss around
 * the text, and the project is named for it (docs/decisions.md §Posture).
 */
const MARGIN_QUERY = '(min-width: 100rem)';

function hasRoom(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia(MARGIN_QUERY).matches;
}

class SidenoteRoom {
	/**
	 * Tracked rather than read once, for the same reason `AppearanceStore`
	 * tracks the dark-mode query: a window resize across the breakpoint has to
	 * move the notes AND change what their markers announce, and a value read
	 * at mount would leave the two disagreeing until a navigation.
	 *
	 * `false` before hydration, which is the honest answer rather than a
	 * conservative one — the site renders no HTML on the server (`ssr = false`,
	 * CLAUDE.md), so there is no first paint this could be wrong for.
	 */
	#wide: boolean = $state(hasRoom());

	/**
	 * How many surfaces currently on the page have taken the margin for
	 * something else — in practice zero or one, since the only claimant is
	 * `CompareGrid` and a page compares or it does not.
	 *
	 * COMPARE MODE SPENDS THE ROOM THE NOTES LIVE IN. The margin is a lane
	 * sized from what the reading columns leave over (`--margin-lane` in
	 * `layout.css`, overridden for compare in `compare.css`), and two reading
	 * columns plus the aside leave it very little — about 10rem of lane at
	 * 100rem, against the 21.5rem a note wants at full width. A note floated
	 * there would sit over the text rather than beside it.
	 *
	 * A COUNT, AND NOT THE `compare` PREFERENCE. That store says what the
	 * reader wants; it does not say whether this page could honour it, and a
	 * work with one edition (most of the encyclicals) compares in one column
	 * with the margin free. What is true exactly when the margin is gone is
	 * that a `CompareGrid` is mounted, so that is what claims it. Counted
	 * rather than flagged so that two overlapping lifetimes — a grid mounting
	 * before its predecessor tears down — cannot leave the margin claimed by
	 * nothing.
	 */
	#claims: number = $state(0);

	margin: boolean = $derived(this.#wide && this.#claims === 0);

	/**
	 * Which margin note the reader last named, by the id of the `NoteCard`
	 * that owns it — or nothing, which is the resting state.
	 *
	 * AT MOST ONE, because the question it answers is "which of these is the
	 * one I just clicked". A column of notes beside a densely-annotated
	 * paragraph is exactly where a marker and its note stop being obviously
	 * paired: they are separated by the whole width of the gutter, with other
	 * notes stacked between. Lighting two would answer nothing.
	 *
	 * HELD HERE RATHER THAN IN THE NOTE because only one note can hold it and
	 * a note cannot know that on its own — the same reason `#claims` is here.
	 * It is written from a click handler, which is not a reactive context, so
	 * unlike `claim()` a plain assignment is safe; `unhighlight` is the one
	 * path that reads before writing, and it says why below.
	 */
	highlighted: string | undefined = $state();

	/**
	 * Drop the highlight if `id` still holds it — for a note leaving the page.
	 *
	 * A NOTE MUST NOT OUTLIVE ITS HIGHLIGHT, and the failure if it does is not
	 * a stale glow but a wrong one: `$props.id()` counts per root, so the same
	 * string is handed out again on the next page and would light a note that
	 * has nothing to do with the one the reader clicked.
	 *
	 * Untracked for the reason `claim()` gives at length: this reads the state
	 * it writes, and it is called from an effect's teardown.
	 */
	unhighlight(id: string) {
		untrack(() => {
			if (this.highlighted === id) this.highlighted = undefined;
		});
	}

	constructor() {
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			window.matchMedia(MARGIN_QUERY).addEventListener('change', (e) => {
				this.#wide = e.matches;
			});
		}
	}

	/**
	 * Take the margin for this surface's own layout, and hand back the release
	 * — shaped for `$effect`, whose return value is its teardown, so a caller
	 * is one line and cannot forget the other half.
	 *
	 * BOTH HALVES MUTATE UNTRACKED, AND THAT IS LOAD-BEARING RATHER THAN
	 * TIDY. `#claims += 1` READS `#claims` as well as writing it, so
	 * `$effect(() => sidenoteRoom.claim())` — the one line this method is
	 * shaped for — made the effect depend on the very state it was setting.
	 * Mounted, that re-entered until Svelte gave up with
	 * `effect_update_depth_exceeded`, which is thrown during hydration and
	 * leaves the route blank. It took down every compare view and nothing
	 * else, because `CompareGrid` is the only claimant.
	 *
	 * THE FIX BELONGS HERE AND NOT AT THE CALL SITE. A method whose whole
	 * documented shape is "hand this to `$effect`" has to be safe to hand to
	 * one; an `untrack` the caller must remember is the same trap with an
	 * extra step. `#claims` stays `$state` because `margin` is derived from
	 * it — what must not be tracked is the increment, not the value.
	 *
	 * IT REPRODUCES ONLY FROM A MOUNTED COMPONENT, which is why there is no
	 * test below it. The same two lines under a bare `$effect.root`, nested
	 * or not, run clean and pass against the broken code; what fails is
	 * mounting a component that carries the effect, and this repository has no
	 * component harness to write that in (CLAUDE.md). It was confirmed against
	 * a temporary one — `jsdom`, a two-line wrapper component, the throw
	 * present without these two `untrack`s and absent with them — rather than
	 * argued from the runtime's semantics.
	 */
	claim(): () => void {
		untrack(() => (this.#claims += 1));
		let released = false;
		return () => {
			if (released) return;
			released = true;
			untrack(() => (this.#claims -= 1));
		};
	}
}

export const sidenoteRoom = new SidenoteRoom();

/**
 * How much gloss the margin sets open before it becomes a preview, counted in
 * characters of the note as stored.
 *
 * THE ARRANGEMENT WAS CALIBRATED ON AN EDITION THAT NO LONGER REPRESENTS THE
 * CORPUS. `.margin-note` was written for Challoner — a gloss at the length of
 * a sentence, 126 characters at the median and 343 at the ninetieth
 * percentile — and for a numbered footnote's source, shorter again at 26. The
 * continental annotated editions print an apparatus of another order
 * entirely: Straubinger's notes run 248/814 and Martini's 361/1,051, with
 * single notes at 4,830 and 10,243. Per chapter their apparatus comes to as
 * many characters as the Scripture beside it — 1.03 and 1.90 times the verse
 * text at the median, 3.0 and 5.7 at the ninetieth percentile, 46 in the
 * Song of Songs — and the gloss column sets about 43 characters a line
 * against the reading measure's 62.4, so parity of characters is already
 * something near half again the height.
 *
 * WHAT THAT BREAKS IS THE ARRANGEMENT'S OWN PREMISE, not merely the look of
 * the page. `.margin-note` floats with `clear: inline-start`, so each note
 * begins below wherever the last one ended: at these lengths the eighth
 * verse's gloss is pages below the line that raises it, and a gloss BESIDE
 * its line is the whole of what the margin is for. Clamping is what keeps the
 * column anchored to the text rather than merely shorter.
 *
 * SO THE LONG ONES ARE CLAMPED AND THE READER IS GIVEN A WAY TO THE REST. 170
 * characters is about four lines of the gloss column, which is
 * `--sidenote-clamp` in `layout.css`: the two numbers are one decision written
 * twice and have to move together. It is deliberately short — a margin holds a
 * remark, and a gloss the reader has to scroll past to reach the next one has
 * stopped being one. At four lines a citation's source is still set whole
 * (every one of the Catechism's 3,698), 59% of Challoner's notes and 76% of
 * Matos Soares's are, and the essayists are cut to an incipit: 35% of
 * Straubinger's notes set open, 16% of Martini's.
 *
 * IT MOVED WITH THE COLUMN, NOT ON ITS OWN (2026-08-29, 130 → 170). The four
 * LINES have not changed and are the decision; the count is only those lines
 * measured, and the gloss column went from 13rem to the aside's 17rem when
 * the two margins were made mirror images (`--sidenote-width`). Leaving the
 * count where it was would have printed "Read more" under notes the four
 * lines set whole — which is the failure this pair exists to prevent, arriving
 * from the other side: a clamp shorter than the count cuts a note off with
 * nothing under it to open, and a count shorter than the clamp offers a rest
 * that is not there. The line count itself has come down twice — twelve, then
 * six — each time because the gutter column was still running past the chapter
 * it hangs beside.
 */
export const MARGIN_CLAMP_CHARS = 170;

/**
 * Whether a gloss this long is more than the margin will set open.
 *
 * COUNTED, NOT MEASURED. Whether a note overflows is a question for layout —
 * `scrollHeight > clientHeight` — and a character count is deterministic,
 * costs no layout read, and needs no width to have been resolved:
 * `--sidenote-width` narrows with the reader's text size, so there is no one
 * width to measure against in any case. It is wrong only at the boundary,
 * where it decides between a note set open and a note set open to within a
 * line of its end.
 *
 * The lemma counts because it is set in the same column, in bold, ahead of
 * the gloss.
 */
export function marginOverflows(note: { lemma?: string; text?: string } | undefined): boolean {
	if (!note) return false;
	return (note.lemma?.length ?? 0) + (note.text?.length ?? 0) > MARGIN_CLAMP_CHARS;
}

/**
 * One note of an apparatus, as a thing the reader can open — the behaviour
 * `CitationDisclosure` and `Sidenote` now share entirely.
 *
 * The two components differ in what a note IS (a source; a gloss), what its
 * marker is printed as (a number; a letter), and what it renders. They no
 * longer differ in any of what is here: a floating card, opened by the
 * pointer resting or by a click where there is no margin, and by nothing at
 * all where there is one — because there the note is already on the screen,
 * and the click has a better answer than repeating it, which is to say WHICH
 * of the notes stacked in the gutter is the one just named.
 *
 * THIS IS `menu.svelte.ts`'S SHAPE, and for its reason. Svelte 4 had no unit
 * of reuse below a whole component, so this would have been a wrapper with a
 * prop per difference; `$state` in a `.svelte.ts` module means a plain object
 * can hold reactive state on a component's behalf while the component keeps
 * its own markup, its own ARIA and its own content. What lives here is only
 * what was genuinely identical.
 *
 * CONSTRUCTED DURING COMPONENT INITIALISATION, which is not decoration: the
 * constructor declares the `$effect`s that own this card's lifetime — its
 * own, and `AnchoredPanel`'s — and a rune outside init has no component to
 * attach to.
 *
 * WHAT THE BASE HOLDS is everything about the card as a floating popover:
 * `trigger`, `panel`, `open`, `place()` and the anchor tracking, which were
 * written here until a plate's caption became the third apparatus wanting
 * exactly them (`floating.svelte.ts`). What stays is what a NOTE is: the
 * pointer's grace periods, and the margin, where a click has a better answer
 * than opening a card at all.
 *
 * `id` comes from the base and is expected to be `$props.id()`, so it is per
 * INSTANCE — which is per occurrence, and that is the whole of the keying
 * problem this used to hand to its callers. A source can cite one footnote
 * twice in a paragraph, and the Douay-Rheims numbers four different notes `1`
 * down a single chapter. It is also the key the margin highlight is held by.
 */
export class NoteCard extends AnchoredPanel {
	/**
	 * Opened by the pointer resting on the marker rather than by a click.
	 *
	 * THE TWO WAYS IN WANT OPPOSITE THINGS ON THE WAY OUT: a card the pointer
	 * merely summoned should leave with the pointer, and one the reader
	 * clicked for should stay until they dismiss it. Without this the click
	 * would be worth nothing on a hover-capable pointer, since every
	 * deliberately-opened card would evaporate the moment the reader looked
	 * away from the marker.
	 */
	#byHover = false;
	#openTimer: ReturnType<typeof setTimeout> | undefined;
	#closeTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(id: string) {
		super(id);
		$effect(() => () => {
			this.#cancel();
			sidenoteRoom.unhighlight(this.id);
		});
	}

	/** Whether this is the note the reader named in the margin. False wherever
	 *  there is no margin, so the state cannot survive a viewport narrowing
	 *  into a highlight on something the reader cannot see. */
	get lit(): boolean {
		return sidenoteRoom.margin && sidenoteRoom.highlighted === this.id;
	}

	/**
	 * The card's id when a click should OPEN it, and nothing when a click has
	 * something better to do.
	 *
	 * WHERE THERE IS A MARGIN THE CARD IS A DUPLICATE, since the note is
	 * already set beside the line -- so a click there lights the note in the
	 * gutter instead, which is the one thing the reader cannot get any other
	 * way once several are stacked. Dropping the attribute is what hands the
	 * click to `onClick`; the browser's own invoker would otherwise toggle the
	 * popover before anything here saw it.
	 */
	get popovertarget(): string | undefined {
		return sidenoteRoom.margin ? undefined : this.id;
	}

	/** `aria-expanded` only where activating the marker really does expand
	 *  something. In the margin it discloses nothing -- the note is already in
	 *  the reading order behind it -- and a control claiming a state its
	 *  activation cannot change is worse than one claiming none. */
	get expanded(): boolean | undefined {
		return sidenoteRoom.margin ? undefined : this.open;
	}

	/**
	 * Placing and revealing the card is `AnchoredPanel`'s; what is this
	 * apparatus's own is that a close, however it happened, ends the hover
	 * claim. `toggle` is the one event every close path fires -- Escape, a
	 * light dismiss, another popover superseding this one -- which is why the
	 * claim is dropped here rather than in the handler that set it.
	 */
	toggled(open: boolean) {
		super.toggled(open);
		if (open) return;
		this.#byHover = false;
		this.#cancel();
	}

	/**
	 * ENTERING THE CARD COUNTS AS ENTERING THE MARKER, and has to: the two are
	 * `GAP` pixels apart, and the reader crosses that gap to reach a reference
	 * inside the card. Both elements call this, so the pair behaves as one
	 * region -- which is also why leaving is on a grace period rather than
	 * immediate.
	 *
	 * AND WHERE THERE IS A MARGIN, NOTHING OPENS AT ALL, which is the last of
	 * the three ways in to learn what `popovertarget` and `expanded` already
	 * knew. The note is on the screen, beside the line that raises it, in the
	 * reading order; a card raised over the text to say the same words a
	 * hand's width to the left is not a preview of anything the reader cannot
	 * see, and it arrives precisely when the pointer is passing through the
	 * prose. Below the breakpoint the card is the whole apparatus -- a phone
	 * has no margin and no hover either -- so this costs that reader nothing.
	 * What a click is for in the margin is unchanged and is the point:
	 * `onClick` lights WHICH of the stacked notes belongs to the number just
	 * passed, which is the one thing the gutter cannot answer on its own.
	 */
	onPointerEnter = () => {
		if (!canHover() || sidenoteRoom.margin) return;
		this.#closeTimer = clear(this.#closeTimer);
		if (this.open || this.#openTimer !== undefined) return;
		this.#openTimer = setTimeout(() => {
			this.#openTimer = undefined;
			// A click can have opened it while this timer was running, in which
			// case the card is not the pointer's to take away again.
			if (this.shown) return;
			this.#byHover = true;
			this.show();
		}, HOVER_OPEN_MS);
	};

	onPointerLeave = () => {
		this.#openTimer = clear(this.#openTimer);
		if (!this.#byHover) return;
		this.#closeTimer = clear(this.#closeTimer);
		this.#closeTimer = setTimeout(() => {
			this.#closeTimer = undefined;
			if (this.#byHover) this.hide();
		}, HOVER_CLOSE_MS);
	};

	/**
	 * Only ever reached where there is a margin -- everywhere else the browser
	 * has already toggled the popover through `popovertarget` and this stands
	 * down. Clicking the lit note again puts it out, which is the reader's way
	 * back to a quiet page without a listener on the window.
	 *
	 * The `hide()` is for one case only, and it is a real one: a card opened
	 * by hover BELOW the breakpoint, still standing when the window was
	 * widened past it. Nothing opens a card on this side of the breakpoint
	 * any more (`onPointerEnter`), so there is otherwise nothing to close.
	 */
	onClick = () => {
		if (!sidenoteRoom.margin) return;
		sidenoteRoom.highlighted = this.lit ? undefined : this.id;
		this.hide();
	};

	#cancel() {
		this.#openTimer = clear(this.#openTimer);
		this.#closeTimer = clear(this.#closeTimer);
	}
}

function clear(timer: ReturnType<typeof setTimeout> | undefined) {
	if (timer !== undefined) clearTimeout(timer);
	return undefined;
}

/**
 * The label a note is PRINTED with — `a`, `b`, … `z`, `aa` — given its
 * position among the notes of its chapter.
 *
 * LETTERS BECAUSE THE PAGE IS ALREADY FULL OF NUMBERS. A verse number sits
 * every few words in the reading column, set as a superscript; a note marker
 * set the same way and also numbered is a second small raised number meaning
 * something entirely different, and the reader has to learn which is which.
 * Letters carry no such collision, and they are the convention a printed
 * critical apparatus uses for the same reason.
 *
 * NOT WHAT THE CORPUS STORES. `VerseNote.marker` stays the source's own
 * ordinal, because that is what the source printed and the corpus records
 * what the source printed (docs/corpus-schema.md). This is presentation, and
 * it is computed per chapter rather than per verse — which is also the answer
 * to the oddity that a marker is unique only within its verse, so the
 * Douay-Rheims prints "1" four times down John 3. Numbered by the chapter,
 * those four become a, b, c, d and read as four distinct notes, which they
 * are.
 *
 * Bijective base-26, so the 27th note of a chapter is `aa` rather than
 * colliding with the 1st. Exactly one chapter in the Douay-Rheims needs it
 * (Daniel 11, with 27 notes); the Matos Soares edition's fullest chapter has
 * 23. Rare is not the same as unreachable.
 */
export function noteLetter(index: number): string {
	if (!Number.isFinite(index) || index < 0) return '?';
	let n = Math.floor(index) + 1;
	let out = '';
	while (n > 0) {
		const rem = (n - 1) % 26;
		out = String.fromCharCode(97 + rem) + out;
		n = Math.floor((n - 1) / 26);
	}
	return out;
}

/**
 * Where each unit of a chapter starts in that chapter's lettered run of
 * notes, keyed `h{verse}.{i}` for a heading and `v{verse}` for a verse.
 *
 * READING ORDER, NOT CORPUS ORDER, and they are not the same: `headings` is a
 * separate array from `verses`, but a heading is printed BEFORE the verse it
 * names, so the reader meets a chapter as heading(s), verse, heading(s),
 * verse. Lettering by the corpus's own array order would run every heading's
 * notes first and then every verse's, which is the one thing a label must not
 * do — a label that does not follow the page is worse than no label.
 *
 * Several headings may share a `before_verse` (see `ChapterHeading.level`),
 * which is why the key carries the index and not just the verse number. They
 * are taken in the order the corpus lists them, which the pipeline guarantees
 * is level order.
 */
export function chapterNoteOffsets(chapter: {
	verses: { n: number; notes?: unknown[] }[];
	headings?: { before_verse: number; notes?: unknown[] }[];
}): Map<string, number> {
	const offsets = new Map<string, number>();
	let seen = 0;
	for (const verse of chapter.verses) {
		let index = 0;
		for (const heading of chapter.headings ?? []) {
			if (heading.before_verse !== verse.n) continue;
			offsets.set(`h${verse.n}.${index}`, seen);
			seen += heading.notes?.length ?? 0;
			index += 1;
		}
		offsets.set(`v${verse.n}`, seen);
		seen += verse.notes?.length ?? 0;
	}
	return offsets;
}
