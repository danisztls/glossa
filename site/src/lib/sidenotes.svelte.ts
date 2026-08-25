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
 * `ProseBlocks` keys a paragraph that cites one footnote twice.
 */
export function noteKey(unit: string | number, marker: string, seq: number): string {
	return `${unit}:${marker}:${seq}`;
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
