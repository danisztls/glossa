/**
 * The keyboard shortcuts, as one table and a pure resolver over it.
 *
 * ## Two axes, and the page is what assigns them
 *
 * `UnitNav` draws previous/next as arrows PINNED TO THE VISUAL EDGES — its
 * docblock is explicit that this is deliberate rather than logical-property
 * behaviour — so the site has already told the reader that horizontal means
 * "the document before/after this one". Verses, CCC paragraphs, Compendium
 * questions and document sections all run DOWN the page. So:
 *
 *   horizontal (A/D, H/L, arrows) -> between documents
 *   vertical   (W/S, K/J)         -> between reference numbers within one
 *
 * The inverse assignment was considered and is wrong for three of the four
 * readers: only the Bible's `placement="inline"` puts consecutive numbers on
 * the same line, and `placement="margin"` (CCC, Compendium, documents) is
 * strictly a column. The fine step has to mean one thing everywhere.
 *
 * ## Why `code` for the letters and `key` for `?`
 *
 * `KeyW`/`KeyA`/`KeyS`/`KeyD` is the scancode, which is exactly what a game
 * binds: the same four physical keys are WASD on QWERTY, ZQSD on AZERTY,
 * ЦФЫВ on ЙЦУКЕН and صشسي on the Arabic 101 layout. There is no per-layout
 * table to keep, and nothing here branches on the interface language. Had
 * this matched `key`, the binding would simply not exist for readers on the
 * two non-Latin interface languages this site publishes.
 *
 * `?` is the exception and goes on `key`, because no physical position means
 * "question mark" across layouts — the reader presses whatever their own
 * keyboard prints it on, which is precisely what `key` reports. That is also
 * why Shift is not part of the guard below: `?` is shifted nearly everywhere,
 * and on AZERTY so is `.`.
 *
 * `Escape` is on `key` too and for a different reason: it is not a printed
 * character at all, so `code` and `key` agree everywhere and `key` is the
 * spelling that says what is meant. It leaves focus mode, and only while
 * focus mode is on — see `ShortcutContext.zen`.
 *
 * ## What this module deliberately does not do
 *
 * It touches no DOM. The environment is `node` under vitest (see
 * `vitest.config.ts`), and the whole point of splitting the matcher from
 * `Shortcuts.svelte` is that the table above is testable at all — there is no
 * component test harness in this repository, so logic left in a `.svelte`
 * file is logic nothing checks. The caller supplies the facts that cannot be
 * read off a keystroke (`ShortcutContext` — where focus is, what is open,
 * which way the interface runs, whether focus mode is on), and executes
 * whatever comes back.
 */

export type ShortcutAction =
	'previousDocument' | 'nextDocument' | 'previousReference' | 'nextReference' | 'help' | 'exitZen';

/**
 * The subset of `KeyboardEvent` the resolver reads.
 *
 * Structural rather than the real thing so a test can pass an object literal:
 * `KeyboardEvent` does not exist in the `node` test environment, and
 * constructing one would mean adopting jsdom for four fields.
 */
export interface KeyStroke {
	code: string;
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	isComposing: boolean;
}

export interface ShortcutContext {
	/** Focus is in a field, so every printable key belongs to the reader. */
	typing: boolean;
	/** A modal dialog or an open popover is up — see `isOverlayOpen`. */
	overlay: boolean;
	/** The interface is right-to-left, which mirrors the horizontal axis. */
	rtl: boolean;
	/**
	 * Focus mode is on, so `Escape` has something to close.
	 *
	 * THE FLAG IS WHAT KEEPS `Escape` FREE THE REST OF THE TIME. A key that
	 * quietly does nothing is cheap; a key that quietly SWALLOWS something is
	 * not, and `Escape` already belongs to whatever the browser or the page
	 * has open. With this false the resolver answers `null` and the keystroke
	 * is never claimed — see `resolveShortcut`, which does not
	 * `preventDefault` what it did not match.
	 */
	zen: boolean;
}

/** Keys on the visual LEFT. Which document they reach depends on `rtl`. */
const INLINE_START = ['KeyA', 'KeyH', 'ArrowLeft'];
/** Keys on the visual RIGHT. */
const INLINE_END = ['KeyD', 'KeyL', 'ArrowRight'];
/** Keys pointing UP the page. */
const BLOCK_START = ['KeyW', 'KeyK', 'ArrowUp'];
/** Keys pointing DOWN the page. */
const BLOCK_END = ['KeyS', 'KeyJ', 'ArrowDown'];

/**
 * Which action a keystroke asks for, or `null` for "not ours, leave it".
 *
 * BOTH AXES TAKE THEIR ARROWS, and the vertical pair is the one with a cost:
 * `ArrowUp`/`ArrowDown` are also how a reader scrolls, so on a page carrying
 * reference numbers they now step the cursor instead of nudging the viewport.
 * Three things keep that from being a loss of control, and all three have to
 * stay true if this is edited:
 *
 *   - `Space`, `PageUp`/`PageDown`, `Home`/`End` are untouched and still
 *     scroll — see the last test in `shortcuts.test.ts`, which pins that.
 *   - A step that finds nothing returns `null` here or from
 *     `neighbourIndex`, `Shortcuts.svelte` then does not `preventDefault`,
 *     and the arrow scrolls exactly as it used to. So the keys go back to
 *     scrolling past the last number and before the first, and on every page
 *     with no numbers at all (the home page, the section indexes, the
 *     colophon).
 *   - Every step parks the number it lands on at the reference line
 *     (`scrollTopForReference`), so the viewport follows the reader down the
 *     page; what changes is the size of the step.
 *
 * The horizontal arrows carry none of that, because a page that does not
 * scroll sideways had no use for them.
 */
export function resolveShortcut(e: KeyStroke, ctx: ShortcutContext): ShortcutAction | null {
	// Mid-composition keystrokes belong to the IME, which has not decided what
	// they are yet.
	if (e.isComposing) return null;
	// Any of these three and the keystroke is the browser's or the OS's —
	// Ctrl+D, ⌘L, Alt+←. Shift is NOT here; `?` needs it.
	if (e.ctrlKey || e.metaKey || e.altKey) return null;
	if (ctx.typing) return null;
	// `showModal()` makes the page inert to focus and pointers, NOT to a
	// window-level keydown, so an overlay has to be excluded explicitly or a
	// bare `S` would step the page out from under the panel the reader is
	// looking at.
	if (ctx.overlay) return null;

	// AFTER the overlay guard above, and that ordering is the whole of it: a
	// dialog opened from inside focus mode must close on `Escape` the way
	// every dialog does, and if this claimed the key first the reader would
	// leave the mode instead and be left looking at the panel they had just
	// tried to dismiss. `isOverlayOpen` is true for exactly the set that owns
	// the key, so falling through to `null` there hands it back untouched.
	if (e.key === 'Escape') return ctx.zen ? 'exitZen' : null;

	if (e.key === '?') return 'help';
	if (INLINE_START.includes(e.code)) return ctx.rtl ? 'nextDocument' : 'previousDocument';
	if (INLINE_END.includes(e.code)) return ctx.rtl ? 'previousDocument' : 'nextDocument';
	if (BLOCK_START.includes(e.code)) return 'previousReference';
	if (BLOCK_END.includes(e.code)) return 'nextReference';
	return null;
}

/**
 * Whether an event target is somewhere the reader is typing.
 *
 * Moved here from `JumpBox`, which was its only caller until this module
 * existed and is now one of two — and the two must agree, or `/` opens the
 * jump box from inside a field that a bare `S` is already being kept out of.
 */
export function isTypingTarget(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

/** Cached once: `:popover-open` is a parse error in browsers without it, and
 *  `querySelector` throws on an invalid selector rather than matching nothing. */
let popoverSelectorParses: boolean | undefined;

/** Structural, so a test can pass a stub: `Document` satisfies it, and the
 *  node test environment has no `Document` to construct. */
export interface OverlayRoot {
	querySelector(selectors: string): unknown;
}

/**
 * Whether something the reader has deliberately opened is currently up.
 *
 * NOT JUST `dialog[open]`: `AnchorMenu` — the panel a reference number opens,
 * and therefore the panel a reader reaches by stepping to a number and
 * pressing Enter — is a native popover, which is not a dialog and does not
 * answer that selector. `CitationDisclosure`, `Sidenote` and `Plate`'s viewer
 * are the same.
 *
 * AND `[popover="auto"]`, NOT `[popover]`. The distinction is the whole
 * correctness of this function: `LinkPreview` is the site's one
 * `popover="manual"`, and it opens on HOVER. Matching every popover would mean
 * a pointer left resting anywhere over a link silently disabled the entire
 * keyboard, with nothing on screen to explain it. An `auto` popover is
 * light-dismissible and reader-invoked, which is exactly the set that should
 * hold the keys; a hover card is not something the reader is *in*.
 *
 * Every popover on the site declares its type explicitly, so the literal
 * attribute match is safe — a bare `popover` (which also means auto) would
 * not be found, and none is written that way.
 */
export function isOverlayOpen(root: OverlayRoot): boolean {
	if (root.querySelector('dialog[open]')) return true;
	if (popoverSelectorParses === false) return false;
	try {
		const open = !!root.querySelector('[popover="auto"]:popover-open');
		popoverSelectorParses = true;
		return open;
	} catch {
		popoverSelectorParses = false;
		return false;
	}
}

/**
 * The step from a reference the reader is already on.
 *
 * IT CLAMPS RATHER THAN WRAPS. Wrapping would send the last verse of a
 * chapter to its first, which reads as the page having jumped somewhere for
 * no reason; and it must not roll on to the next document either, because
 * that is what the horizontal axis is for and one key doing both would make
 * the boundary invisible. `null` means "nothing to do", and the caller leaves
 * the keystroke to the browser.
 */
export function neighbourIndex(current: number, delta: 1 | -1, count: number): number | null {
	const next = current + delta;
	return next >= 0 && next < count ? next : null;
}

/** Fraction of the viewport height at which a unit counts as the one being
 *  read. The same third `scroll-spy.svelte.ts` settled on, and for the reason
 *  argued there: at the very top a unit becomes current before the reader has
 *  plausibly reached it. */
export const REFERENCE_LINE = 1 / 3;

/**
 * Where the FIRST step lands, when focus is not on a reference number yet.
 *
 * Starting from the top of the document would be useless on a page the reader
 * has scrolled halfway down, so the cursor is picked up where they are
 * looking: stepping forward takes the first number at or below the reference
 * line, stepping back takes the last one above it — the one they have just
 * read past.
 *
 * `tops` are viewport-relative top edges in document order. Measured with one
 * `getBoundingClientRect` per number, once per keypress, so the binary search
 * `scroll-spy` needs (it measures per scroll frame) would buy nothing here.
 */
export function indexAtReferenceLine(
	tops: readonly number[],
	line: number,
	delta: 1 | -1
): number | null {
	if (delta === 1) {
		const i = tops.findIndex((top) => top >= line);
		return i === -1 ? null : i;
	}
	let last: number | null = null;
	for (let i = 0; i < tops.length; i++) {
		if (tops[i] < line) last = i;
	}
	return last;
}

/**
 * Where the page has to sit for a reference number to land on that same line.
 *
 * THE STEP HAS TO SCROLL DELIBERATELY, because the browser's own answer is
 * the wrong one. Moving focus scrolls with `nearest` semantics — the smallest
 * nudge that makes the element visible — so a run of steps down the page does
 * nothing at all until the cursor reaches the bottom edge, and from then on
 * pins every number it lands on against that edge, with the text that number
 * addresses off screen below it. Stepping back does the same against the top.
 * The reader ends up reading at whichever margin they happened to arrive
 * from, and the number they just asked for is the one thing they cannot read.
 *
 * So the number goes to the third of the viewport `indexAtReferenceLine`
 * picks the cursor UP from, on every step. One line for both jobs is what
 * makes the pair predictable: the cursor holds still while the text moves
 * past it, the first step is not a special case, and up and down are mirror
 * images of each other.
 *
 * It follows that nothing here compensates for the sticky reading bar, and
 * nothing should — a third of the way down the viewport is far below it.
 * `html`'s `scroll-padding-top` (`styles/base.css`) is still what protects
 * every scroll the site does NOT compute: `:target`, a pasted `#v12`,
 * SvelteKit's deep-link `scrollIntoView`.
 *
 * `top` is the number's viewport-relative top edge, so the caller measures
 * and this stays arithmetic. Clamped at the top of the document — the opening
 * verses of a chapter cannot reach the line, and a negative offset would
 * scroll to 0 anyway; the far end needs a document height this does not have,
 * and the browser clamps it.
 */
export function scrollTopForReference(
	top: number,
	scrollY: number,
	viewportHeight: number
): number {
	return Math.max(0, scrollY + top - viewportHeight * REFERENCE_LINE);
}
