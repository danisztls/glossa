/**
 * The day's readings, as CITATIONS resolved through this site's own editions.
 *
 * ## What this is and is not
 *
 * It is a list of which passages are appointed, rendered as links into the
 * Bibles the corpus holds. It is NOT a Missal, and it is not the translation
 * read aloud in any parish: the pericopes are the same, the words are this
 * site's editions. `site/docs/calendar.md` states the position and the page
 * says it in the colophon's voice beside the readings themselves. The rights
 * problem in a lectionary lives entirely in the TEXT of the readings, which
 * every conference licenses separately; a schedule of citations is a list of
 * facts, and this site is a citation resolver.
 *
 * ## The lookup is ARITHMETIC, and the crawl is only its oracle
 *
 * `table.json` carries one half now: `masses`, keyed by the Ordo Lectionum
 * Missae's own lectionary number, which is permanent — what reading set 130 IS
 * has no year in it. Which day keeps 130 is computed by `./rules.ts` from the
 * liturgical day alone, so a reader asking for 2040 is answered by arithmetic
 * and not by whether anybody crawled it.
 *
 * IT SHIPPED AS A DATE INDEX FOR ONE DAY, and what replaced it was not new
 * data: `days.oracle.json` is that index, still built, imported by
 * `rules.test.ts` and by nothing else, and the rules must reproduce all 808 of
 * its comparable days before they may be believed. The crawl stopped being the
 * answer and became the check — the same move `site/docs/calendar.md` records
 * for the calendar itself, and the reason `$lib/calendar` was worth having
 * before this feature existed.
 */

import type { LiturgicalDay } from '$lib/calendar/types';
import { retryableOnce } from '$lib/retryable-once';
import { olmNumbersFor } from './rules';

/**
 * A normalised slot. The source's labels are not a vocabulary — `Reading 1`
 * and `Reading I` are one slot in two templates, `Alleluia` and `Verse Before
 * the Gospel` are one slot under two names because Lent does not say Alleluia
 * — and `scripts/build-lectionary.mjs` is where that judgment is made.
 *
 * `null` means the generator could not classify the source's label; the label
 * itself is then carried on the pericope and printed instead. A citation this
 * site cannot file is still a citation the source printed.
 */
export type Slot = 'reading' | 'psalm' | 'epistle' | 'acclamation' | 'gospel' | 'sequence';

export interface Pericope {
	slot: Slot | null;
	/** 1..7 on a `reading`. The Easter Vigil is why this goes past two. */
	ordinal?: number;
	/** The source's own label, present only when `slot` is null. */
	label?: string;
	/**
	 * The citation, or the empty string — which means the source printed NO
	 * address because the text is not Scripture (Christmas Day's acclamation,
	 * the Easter sequences). Empty is "no citation", never "we lost one", and
	 * the renderer must not show it as a broken link.
	 */
	cite: string;
	/** Alternatives the source offers with `or`, in the order printed. */
	orElse?: string[];
}

export interface MassReadings {
	/** The Ordo Lectionum Missae's own number for this reading set. */
	olm: string;
	/**
	 * Which Mass, on a day that has more than one — `Vigil Mass`, `Mass at
	 * Dawn`, `At the Procession with Palms`. Absent on an ordinary day,
	 * because the source names a Mass only where there is another to tell it
	 * from, and inventing a name for the only Mass of a day would be this site
	 * asserting something nobody printed.
	 */
	label?: string;
	readings: Pericope[];
}

interface Table {
	masses: Record<string, MassReadings>;
}

/**
 * THE TABLE IS FETCHED, NOT IMPORTED, and the reason is the boot payload.
 *
 * A static `import table from './table.json'` puts the whole thing in the chunk
 * every route preloads — and this module is reached from `LiturgicalDayCard`,
 * which the HOME PAGE renders, so it would be on the critical path for every
 * reader at every address. That is the third of the three silent ways
 * `site/CLAUDE.md` records data getting into the boot chunk: a static import
 * from a component the layout renders. At 138 KB against a 0.47 MB budget it is
 * not a rounding error.
 *
 * `retryableOnce` rather than a bare `??=`: a rejected promise kept in a module
 * memo makes one dropped fetch permanent for the life of the page, which this
 * project has learned twice (that module's docblock has both scars).
 */
const loadTable = retryableOnce(async (): Promise<Table> => {
	const module = await import('./table.json');
	return module.default as unknown as Table;
});

/** Filled by `primeLectionary`; empty until then, which reads as "no answer". */
let table: Table | null = null;

/**
 * Fetch the table. Idempotent, and safe to call from several places in one
 * tick. A caller that never awaits it simply gets no readings.
 */
export async function primeLectionary(): Promise<void> {
	table ??= await loadTable();
}

/**
 * Every Mass appointed for a day, in the order the source prints them, or
 * `null` where this site has no answer — a date outside the crawled years, or
 * the table not yet fetched. Both say so by showing nothing rather than by
 * guessing, which is why the caller needs no third state.
 *
 * SYNCHRONOUS ON PURPOSE, like `corpus.ts`'s two dozen readers: it is called
 * from render, and what became asynchronous is when the table is FILLED.
 */
export function readingsFor(day: LiturgicalDay): MassReadings[] | null {
	if (!table) return null;
	const masses = olmNumbersFor(day)
		.map((n) => table?.masses[n])
		.filter((m): m is MassReadings => Boolean(m));
	return masses.length ? masses : null;
}

/** The reading set for one lectionary number, for a caller that has one. */
export function massByNumber(olm: string): MassReadings | null {
	return table?.masses[olm] ?? null;
}

/**
 * The i18n key naming a slot. A `reading` is numbered where the day has more
 * than one and bare where it does not — "First Reading" on a day with only one
 * reading is the page inventing a second.
 */
export function slotKey(p: Pericope, readings: Pericope[]): string {
	if (p.slot === null) return '';
	if (p.slot !== 'reading') return `lectionary.slot.${p.slot}`;
	const numbered = readings.filter((r) => r.slot === 'reading').length > 1;
	return numbered ? `lectionary.slot.reading${p.ordinal ?? 1}` : 'lectionary.slot.reading';
}
