import { describe, expect, it } from 'vitest';
import {
	indexAtReferenceLine,
	isOverlayOpen,
	neighbourIndex,
	resolveShortcut,
	type KeyStroke,
	type ShortcutContext
} from './shortcuts';

/** A keystroke with nothing held and no IME in the way. */
const stroke = (over: Partial<KeyStroke>): KeyStroke => ({
	code: '',
	key: '',
	ctrlKey: false,
	metaKey: false,
	altKey: false,
	isComposing: false,
	...over
});

/** A reader on a reading page with nothing open and nothing focused. */
const ctx = (over: Partial<ShortcutContext> = {}): ShortcutContext => ({
	typing: false,
	overlay: false,
	rtl: false,
	...over
});

/** What the four physical positions print on the layouts this site publishes
 *  an interface in. The binding is on `code`, so all four rows resolve the
 *  same — that equality is the whole claim being tested. */
const WASD_KEYCAPS = [
	{ layout: 'QWERTY', w: 'w', a: 'a', s: 's', d: 'd' },
	{ layout: 'AZERTY', w: 'z', a: 'q', s: 's', d: 'd' },
	{ layout: 'ЙЦУКЕН', w: 'ц', a: 'ф', s: 'ы', d: 'в' },
	{ layout: 'Arabic 101', w: 'ص', a: 'ش', s: 'س', d: 'ي' }
];

describe('resolveShortcut', () => {
	it('reads the horizontal axis as movement between documents', () => {
		for (const code of ['KeyA', 'KeyH', 'ArrowLeft']) {
			expect(resolveShortcut(stroke({ code }), ctx())).toBe('previousDocument');
		}
		for (const code of ['KeyD', 'KeyL', 'ArrowRight']) {
			expect(resolveShortcut(stroke({ code }), ctx())).toBe('nextDocument');
		}
	});

	it('reads the vertical axis as movement within one document', () => {
		for (const code of ['KeyW', 'KeyK', 'ArrowUp']) {
			expect(resolveShortcut(stroke({ code }), ctx())).toBe('previousReference');
		}
		for (const code of ['KeyS', 'KeyJ', 'ArrowDown']) {
			expect(resolveShortcut(stroke({ code }), ctx())).toBe('nextReference');
		}
	});

	it('mirrors the horizontal axis under a right-to-left interface, and only it', () => {
		// `UnitNav` is a flex row, so `prev` sits on the RIGHT in Arabic and the
		// left-hand key has to reach it. Text still runs downward, so the
		// vertical axis is untouched.
		expect(resolveShortcut(stroke({ code: 'KeyA' }), ctx({ rtl: true }))).toBe('nextDocument');
		expect(resolveShortcut(stroke({ code: 'ArrowRight' }), ctx({ rtl: true }))).toBe(
			'previousDocument'
		);
		expect(resolveShortcut(stroke({ code: 'KeyW' }), ctx({ rtl: true }))).toBe('previousReference');
		expect(resolveShortcut(stroke({ code: 'KeyJ' }), ctx({ rtl: true }))).toBe('nextReference');
	});

	it('binds the physical cluster, whatever the keycaps print', () => {
		for (const { layout, w, a, s, d } of WASD_KEYCAPS) {
			expect(resolveShortcut(stroke({ code: 'KeyW', key: w }), ctx()), layout).toBe(
				'previousReference'
			);
			expect(resolveShortcut(stroke({ code: 'KeyA', key: a }), ctx()), layout).toBe(
				'previousDocument'
			);
			expect(resolveShortcut(stroke({ code: 'KeyS', key: s }), ctx()), layout).toBe(
				'nextReference'
			);
			expect(resolveShortcut(stroke({ code: 'KeyD', key: d }), ctx()), layout).toBe('nextDocument');
		}
	});

	it('takes the help sheet from the printed symbol rather than a position', () => {
		// US: Shift+Slash. German: Shift+ß. AZERTY: Shift+comma. One rule.
		expect(resolveShortcut(stroke({ key: '?', code: 'Slash' }), ctx())).toBe('help');
		expect(resolveShortcut(stroke({ key: '?', code: 'Minus' }), ctx())).toBe('help');
		expect(resolveShortcut(stroke({ key: '?', code: 'Comma' }), ctx())).toBe('help');
	});

	it('leaves the browser its own chords', () => {
		expect(resolveShortcut(stroke({ code: 'KeyD', ctrlKey: true }), ctx())).toBeNull();
		expect(resolveShortcut(stroke({ code: 'KeyL', metaKey: true }), ctx())).toBeNull();
		expect(resolveShortcut(stroke({ code: 'ArrowLeft', altKey: true }), ctx())).toBeNull();
	});

	it('leaves the reader every other way of scrolling', () => {
		// The vertical arrows now step the cursor, so these are what is left to
		// move the viewport with — and taking any of them would leave a reader
		// on a page of numbers with no way to scroll at all.
		for (const code of ['Space', 'PageUp', 'PageDown', 'Home', 'End']) {
			expect(resolveShortcut(stroke({ code }), ctx()), code).toBeNull();
		}
	});

	it('stands aside while the reader is typing or an overlay is up', () => {
		expect(resolveShortcut(stroke({ code: 'KeyS' }), ctx({ typing: true }))).toBeNull();
		expect(resolveShortcut(stroke({ key: '?' }), ctx({ typing: true }))).toBeNull();
		// Not a hypothetical: `AnchorMenu` is what Enter opens on a reference
		// the reader has just stepped to.
		expect(resolveShortcut(stroke({ code: 'KeyJ' }), ctx({ overlay: true }))).toBeNull();
	});

	it('lets a composing keystroke through to the IME', () => {
		expect(resolveShortcut(stroke({ code: 'KeyS', isComposing: true }), ctx())).toBeNull();
	});

	it('claims no letter outside the two clusters', () => {
		for (const code of ['KeyB', 'KeyC', 'KeyT', 'KeyG', 'KeyN', 'KeyP']) {
			expect(resolveShortcut(stroke({ code }), ctx()), code).toBeNull();
		}
	});
});

describe('isOverlayOpen', () => {
	/** A document holding exactly the elements named, answering the same
	 *  selectors a browser would. */
	const root = (present: string[]) => ({
		querySelector: (selectors: string) => (present.includes(selectors) ? {} : null)
	});

	it('holds the keys while a modal dialog is up', () => {
		expect(isOverlayOpen(root(['dialog[open]']))).toBe(true);
	});

	it('holds them for a reader-invoked popover, which is not a dialog', () => {
		// `AnchorMenu`, `CitationDisclosure`, `Sidenote`, `Plate`'s viewer.
		expect(isOverlayOpen(root(['[popover="auto"]:popover-open']))).toBe(true);
	});

	it('does NOT hold them for a hover card', () => {
		// `LinkPreview` is the site's one `popover="manual"`, opened by the
		// pointer resting on a link. Counting it would mean a mouse parked
		// anywhere over the text disabled the whole keyboard.
		expect(isOverlayOpen(root(['[popover="manual"]:popover-open']))).toBe(false);
	});

	it('reads a page with nothing open as nothing open', () => {
		expect(isOverlayOpen(root([]))).toBe(false);
	});
});

describe('neighbourIndex', () => {
	it('steps in both directions', () => {
		expect(neighbourIndex(3, 1, 10)).toBe(4);
		expect(neighbourIndex(3, -1, 10)).toBe(2);
	});

	it('clamps at both ends rather than wrapping', () => {
		expect(neighbourIndex(9, 1, 10)).toBeNull();
		expect(neighbourIndex(0, -1, 10)).toBeNull();
	});
});

describe('indexAtReferenceLine', () => {
	// A chapter scrolled so that verses 1-2 have gone by, 3 sits on the line,
	// and the rest are below it.
	const tops = [-420, -180, 240, 520, 800];
	const line = 240;

	it('takes the first number at or below the line when stepping forward', () => {
		expect(indexAtReferenceLine(tops, line, 1)).toBe(2);
	});

	it('takes the last number above the line when stepping back', () => {
		expect(indexAtReferenceLine(tops, line, -1)).toBe(1);
	});

	it('gives up at the ends rather than guessing', () => {
		// Scrolled to the foot: nothing left below the line.
		expect(indexAtReferenceLine([-900, -600, -300], 240, 1)).toBeNull();
		// At the head: nothing above it.
		expect(indexAtReferenceLine([300, 600, 900], 240, -1)).toBeNull();
	});

	it('has nothing to find on a page with no numbers', () => {
		expect(indexAtReferenceLine([], 240, 1)).toBeNull();
		expect(indexAtReferenceLine([], 240, -1)).toBeNull();
	});
});
