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
 * ## What this module deliberately does not do
 *
 * It touches no DOM. The environment is `node` under vitest (see
 * `vitest.config.ts`), and the whole point of splitting the matcher from
 * `Shortcuts.svelte` is that the table above is testable at all — there is no
 * component test harness in this repository, so logic left in a `.svelte`
 * file is logic nothing checks. The caller supplies the three facts that
 * cannot be read off a keystroke (`ShortcutContext`), and executes whatever
 * comes back.
 */

export type ShortcutAction =
	'previousDocument' | 'nextDocument' | 'previousReference' | 'nextReference' | 'help';

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
}

/** Keys on the visual LEFT. Which document they reach depends on `rtl`. */
const INLINE_START = ['KeyA', 'KeyH', 'ArrowLeft'];
/** Keys on the visual RIGHT. */
const INLINE_END = ['KeyD', 'KeyL', 'ArrowRight'];
/** Keys pointing UP the page. `ArrowUp` is absent on purpose: see below. */
const BLOCK_START = ['KeyW', 'KeyK'];
/** Keys pointing DOWN the page. `ArrowDown` is absent for the same reason. */
const BLOCK_END = ['KeyS', 'KeyJ'];

/**
 * Which action a keystroke asks for, or `null` for "not ours, leave it".
 *
 * THE VERTICAL AXIS HAS NO ARROW SYNONYM, and that asymmetry is the point
 * rather than an omission: `ArrowUp`/`ArrowDown` are how every reader scrolls,
 * and a reading site that takes them has broken the most-used key on the page
 * to save one keystroke on the least-used. The horizontal arrows are free
 * because a page that does not scroll sideways has no use for them.
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
