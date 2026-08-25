/**
 * Whether the reader's viewport has room to set notes in the margin.
 *
 * WHY THIS IS JAVASCRIPT AND NOT PURELY A MEDIA QUERY. The CSS could place
 * the notes on its own; what it cannot do is tell the marker what to say
 * about itself. A margin note is *already visible*, so its marker is not a
 * disclosure control and must not claim to be one — `aria-expanded` on a
 * button whose content is on screen regardless is a lie to a screen reader,
 * and the reverse (no state at all on a phone, where the note really is
 * hidden until tapped) is a control with no state. The two layouts genuinely
 * differ in what the marker IS, so the breakpoint has to be legible to the
 * markup and not only to the stylesheet.
 *
 * `MARGIN_QUERY` is deliberately wider than `.reading-layout`'s own 80rem
 * grid breakpoint. At exactly 80rem the reading column and the navigation
 * aside are the whole of the viewport — the pair is centred as a unit and
 * there is no slack on either side. The margin the notes occupy is that
 * slack, so it appears well after the aside does, and asking for it earlier
 * would push the notes over the text.
 *
 * INLINE-START, NOT INLINE-END: the end margin is where `.reading-aside`
 * already lives at these widths. The start margin is both the free one and
 * the historically right one — a *Glossa Ordinaria* sets its gloss around
 * the text, and the project is named for it (docs/decisions.md, 2026-08-16).
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
	margin: boolean = $state(hasRoom());

	constructor() {
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			window.matchMedia(MARGIN_QUERY).addEventListener('change', (e) => {
				this.margin = e.matches;
			});
		}
	}
}

export const sidenoteRoom = new SidenoteRoom();

/**
 * The key that keeps one note's open state apart from another's.
 *
 * BY UNIT AND POSITION, NOT BY MARKER. A marker is unique within its unit and
 * not within its chapter (docs/corpus-schema.md), so `⟦1⟧` recurs down a
 * chapter of the Douay-Rheims meaning something different each time — John
 * 3:5 and 3:18 both carry a note numbered 1. Keying on the marker alone would
 * make every "1" in a chapter open and close together, showing the reader
 * Nicodemus's note against a verse thirteen verses later. `seq` then separates
 * two occurrences of one marker inside a single unit, the same way
 * `CccParagraphText` keys a paragraph that cites one footnote twice.
 */
export function noteKey(unit: string | number, marker: string, seq: number): string {
	return `${unit}:${marker}:${seq}`;
}
