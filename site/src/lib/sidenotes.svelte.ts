import { tick, untrack } from 'svelte';
import { canHover, HOVER_OPEN_MS, HOVER_CLOSE_MS } from './floating';
import { AnchoredPanel } from './floating.svelte';

/**
 * Whether the reader's viewport has room to set notes in the margin.
 *
 * ONE APPARATUS USES IT, AND IT USED TO BE TWO. `CitationDisclosure` sets a
 * numbered footnote's SOURCE there — 26 characters on average across the
 * Catechism's 3,698, 53 at the ninetieth percentile, and far commoner than a
 * gloss. `Sidenote` set an annotated edition's gloss there too until
 * 2026-09-01, and what retired that is length: the continental editions gloss
 * a verse in an essay, so the gutter column ran past the chapter and the note
 * was no longer beside the line that raised it. See `Sidenote`'s own header.
 * WHAT IS LEFT IN THE MARGIN IS A REMARK, which is what the arrangement was
 * calibrated for and what it still holds whole.
 *
 * WHY THIS IS JAVASCRIPT AND NOT PURELY A MEDIA QUERY. The CSS could place
 * the note on its own; what it cannot do is tell the marker what to say about
 * itself. A margin note is *already visible*, so the marker beside it is not a
 * disclosure control there and must not claim to be one — `aria-expanded` on a
 * button whose content is on screen regardless is a lie to a screen reader,
 * and the reverse (no state at all on a phone, where the source really is
 * hidden until tapped) is a control with no state. The two layouts genuinely
 * differ in what that marker IS, so the breakpoint has to be legible to the
 * markup and not only to the stylesheet.
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
 * How much apparatus a floating card holds before it stops being one.
 *
 * THE THRESHOLD IS THE CARD'S OWN ARITHMETIC, not a taste. `.note-popover`
 * caps at 26rem by 32rem, and its own docblock does the width: 26rem of
 * 0.85rem sans is about 62 characters a line, which is `--measure-cpl`. The
 * height gives 24 lines at `line-height: 1.5`, so a full card is roughly
 * 1,490 characters. 900 keeps the commonest card at about three fifths of
 * that — comfortably short of the scroll — and hands everything longer to a
 * dialog, which is the site's shape for a panel that has stopped being
 * anchored to anything (`.note-dialog`, and `.dialog-bare` before it).
 *
 * WHAT IT COSTS, MEASURED ACROSS THE CORPUS. It moves 9.3% of Haydock's
 * annotated verses to a modal, 8.2% of Martini's notes, 4.4% of
 * Straubinger's, 0.7% of Allioli's, 0.3% of Challoner's and none of Matos
 * Soares's. That distribution is the argument for a threshold rather than a
 * per-apparatus rule: what decides is how long THIS note is, and the same
 * edition prints both a phrase and an essay.
 *
 * IT IS THE ONLY LENGTH THRESHOLD LEFT, and it inherited a job. There was a
 * second — `MARGIN_CLAMP_CHARS`, 170 — which asked how much of a gloss a 17rem
 * gutter column sets before a float outruns the line that raised it. The two
 * were kept five times apart on purpose, because they asked different
 * questions about different columns; the margin question stopped being asked
 * on 2026-09-01, when an edition's gloss left the gutter for good.
 */
export const CARD_MAX_CHARS = 900;

/** Whether an apparatus this long wants a dialog rather than a card. */
export function overflowsCard(chars: number): boolean {
	return chars > CARD_MAX_CHARS;
}

/**
 * The mark a COMMENTARY is anchored by, and the reason it is a symbol.
 *
 * The edition's own notes letter themselves a, b, c down the chapter
 * (`noteLetter`); a commentary cannot join that run, because it is a separate
 * work and the reader may have two of them beside one verse. A symbol says
 * "there is an apparatus here" without claiming a place in anyone's sequence,
 * which is what a printed annotated Bible uses it for.
 *
 * THE DAGGER, AND IT COST A FONT FILE TO GET. `†` is not in either text
 * family's `latin` subset: Google files U+2020 under `latin-ext`, so a page
 * carrying one dagger would pull 158 KB of Source Sans 3 it needs for nothing
 * else — and pull it for the English reader too, since a commentary is
 * switched on rather than implied by a language. `fonts.css` declares a
 * 1.1 KB face subset to this one glyph, under its own family, and
 * `.commentary-marker` names it ahead of `--font-sans`. `‡`, `※` and `⁂` are
 * not reachable at any price: checked with fontTools across every file in
 * both `@fontsource-variable` packages, Google's subsets do not carry them at
 * all, so a second mark would need a different source font rather than a
 * different range.
 *
 * ONE MARK PER COMMENTARY WORK, NOT PER NOTE. Haydock's median verse carries
 * two notes and his longest twenty-nine, and a row of identical daggers says
 * nothing a single one does not. The mark names the apparatus; the notes
 * behind it are what it points at — all of them, in one card, since the mark
 * is the only way to them at any width (`NoteCard`'s `margin: false`). A
 * second commentary would print a second dagger beside the first,
 * distinguished by its label and not by its glyph — worth revisiting when
 * there is a second, and not before.
 */
export const COMMENTARY_MARKER = '\u2020';

/**
 * The whole of a note that is past what a card holds.
 *
 * BOTH LONG-NOTE APPARATUSES OPEN ONE, so the dialog is one object rather
 * than two copies of six lines — `Sidenote` for an edition's own gloss,
 * `CommentaryGloss` for a commentary's. It is `NoteCard`'s argument one shape
 * further down: a `.svelte.ts` module can hold reactive state on a
 * component's behalf while each component keeps its own markup, its own ARIA
 * and its own content, and what is genuinely identical here is only the
 * open-and-close dance.
 *
 * `rendered` IS NOT `el.open`, AND THE ORDER MATTERS. A closed `<dialog>` is
 * `display: none`, so nothing inside is reachable, focusable or announced —
 * but it is still rendered, and a chapter of Straubinger holds forty of these
 * each carrying its gloss a second time. So the contents are gated on this
 * flag, and `tick()` sits between setting it and `showModal()` so the panel
 * has its content before it is centred.
 *
 * NO `$effect` HERE, unlike `NoteCard`, so this may be constructed anywhere.
 */
export class NoteDialog {
	el: HTMLDialogElement | undefined = $state();
	rendered: boolean = $state(false);

	async open() {
		this.rendered = true;
		await tick();
		if (this.el && !this.el.open) this.el.showModal();
	}

	close = () => this.el?.close();

	onClose = () => {
		this.rendered = false;
	};

	/* A click that lands on the dialog ITSELF is a click on the backdrop:
	   `.dialog-bare` is transparent and has no padding, so every visible pixel
	   belongs to the panel inside it. `TocMenu`'s test, and its reason. */
	onClick = (e: MouseEvent) => {
		if (e.target === this.el) this.el?.close();
	};
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

	/**
	 * Whether this note ALSO appears in the margin, which every gate below
	 * turns on.
	 *
	 * ONE OF THE THREE APPARATUSES DOES, and it is the one whose note is a
	 * remark: `CitationDisclosure`, where a footnote's source runs 26
	 * characters. Its marker therefore means one thing above the breakpoint and
	 * another below it.
	 *
	 * THE OTHER TWO SET NO COPY AT ANY WIDTH, and both arrived here by the same
	 * measurement. Haydock annotates 20,814 verses and a chapter of him runs to
	 * 52,496 characters; Straubinger and Martini gloss a verse at 4,830 and
	 * 10,243. A gutter column of either stopped being apparatus beside a text
	 * and became a text with Scripture in the margin, so their marks open a
	 * card or a dialog everywhere, and every question below — does a click open
	 * something, does the pointer, is `aria-expanded` a claim we can keep, is
	 * there a note in the gutter to light — has the same answer at every width.
	 */
	#marginCopy: boolean;

	/**
	 * Whether THIS note is too long for a card — read as a thunk, not stored
	 * as a flag, because the answer is a `$derived` in the component and a
	 * note is a prop that can change under the same card.
	 */
	#tooLong: (() => boolean) | undefined;

	constructor(id: string, options: { margin?: boolean; modal?: () => boolean } = {}) {
		super(id);
		this.#marginCopy = options.margin ?? true;
		this.#tooLong = options.modal;
		$effect(() => () => {
			this.#cancel();
			sidenoteRoom.unhighlight(this.id);
		});
	}

	/** The margin, as this card sees it: false for a note that has no copy
	 *  there, whatever the viewport is doing. */
	get #inMargin(): boolean {
		return this.#marginCopy && sidenoteRoom.margin;
	}

	/**
	 * Whether the marker opens a DIALOG instead of this card.
	 *
	 * A card is a shape for a paragraph: anchored beside the mark that raised
	 * it, sized by what is in it, dismissed by looking away. Past a certain
	 * length it stops being any of those — it covers the verse it points at,
	 * and it scrolls, which is a card pretending to be a page. The site
	 * already had the answer for a panel that has stopped being anchored to
	 * anything — `.dialog-bare` and the `.sheet-*` chrome in `menus.css` — and
	 * this is that panel, reached from the mark.
	 *
	 * FALSE WHEREVER THERE IS A MARGIN COPY, because there the marker is not a
	 * disclosure at all — the note is already beside the line and a click
	 * lights it (`onClick`). Only `CitationDisclosure` has one, and it passes
	 * no `modal` thunk, so this is false there twice over.
	 */
	get asModal(): boolean {
		return !this.#inMargin && (this.#tooLong?.() ?? false);
	}

	/** Whether this is the note the reader named in the margin. False wherever
	 *  there is no margin, so the state cannot survive a viewport narrowing
	 *  into a highlight on something the reader cannot see. */
	get lit(): boolean {
		return this.#inMargin && sidenoteRoom.highlighted === this.id;
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
		return this.#inMargin || this.asModal ? undefined : this.id;
	}

	/** `aria-expanded` only where activating the marker really does expand
	 *  something. In the margin it discloses nothing -- the note is already in
	 *  the reading order behind it -- and a control claiming a state its
	 *  activation cannot change is worse than one claiming none. */
	get expanded(): boolean | undefined {
		return this.#inMargin ? undefined : this.open;
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
		if (!canHover() || this.#inMargin || this.asModal) return;
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
		// Never reached for a modal note either: `asModal` is false wherever
		// there is a margin, so this returns before it could matter, and the
		// component's own handler owns the `<dialog>`.
		if (!this.#inMargin) return;
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
