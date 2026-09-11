/**
 * Which sections of a folded index are open — `/quaestiones` over its shelves
 * of questions, `/preces` over its sections of prayers.
 *
 * A MODULE BECAUSE THE POLICY IS DECIDED TWICE, not because the two pages look
 * alike. What they share is not the markup — one is a grid of cells in a
 * landing column, the other a multicolumn list beside an aside — but three
 * rules about `<details>` that are each invisible when they are wrong:
 *
 * A LIVE QUERY FORCES EVERY SURVIVING SECTION OPEN. A search that matched
 * three rows and showed three shut headings reads as a page with no results.
 *
 * AND DOES NOT RECORD ITSELF. The reader's own folds outlive the query, so
 * clearing the box puts the page back exactly as they had it rather than
 * leaving whatever the search opened standing.
 *
 * A FRAGMENT OPENS ITS OWN SECTION. A browser opens a closed `<details>` only
 * for a target INSIDE it, and these ids are on the element itself — so a
 * table-of-contents row or somebody's bookmark would otherwise scroll to a
 * shut heading and stop there.
 *
 * WHAT THE CALLER KEEPS is what it can defend: the DEFAULT. Sixteen shelves
 * of questions are a list to choose between and open shut; a collection of
 * prayers is the page itself and opens open, narrowing to its first sections
 * on a phone. Both are answers to "what is this page FOR", which is the one
 * thing a shared module has no business holding.
 */

/** How a page decides the state a section is in before anybody touches it. */
export interface FoldOptions {
	/** Whether a query is live. A GETTER, so the page's own `$derived` stays
	 *  the single source of truth rather than being mirrored in here. */
	searching: () => boolean;
	/** By POSITION, which is what a page can state about sections whose names
	 *  are the corpus's own words and differ per language. Defaults to shut. */
	defaultOpen?: (index: number) => boolean;
}

export interface FoldState {
	/** Whether the section at `index` draws open right now. */
	isOpen(id: string, index: number): boolean;
	/** What the reader just did to it, if it was the reader who did it. */
	remember(id: string, index: number, open: boolean): void;
	/** Open the section a fragment names. Ignores the empty string, so a page
	 *  can hand it `url.hash.slice(1)` unguarded. */
	reveal(id: string): void;
}

export function foldState(options: FoldOptions): FoldState {
	const defaultOpen = options.defaultOpen ?? (() => false);
	const opened = $state<Record<string, boolean>>({});

	return {
		isOpen(id, index) {
			return options.searching() || (opened[id] ?? defaultOpen(index));
		},

		/**
		 * A TOGGLE THAT AGREES WITH THE DEFAULT RECORDS NOTHING, and it has to:
		 * `open` is a reactive attribute, so anything that moves the default —
		 * a viewport crossing a breakpoint, a query clearing — closes sections
		 * and the browser fires `toggle` for each. Written down, those would be
		 * choices the reader never made, and the page would stay folded at a
		 * width that has room for it. Clearing the entry instead also gives a
		 * reader who toggles back to the default their default back, rather
		 * than a pin at the same value.
		 */
		remember(id, index, open) {
			if (options.searching()) return;
			if (open === defaultOpen(index)) delete opened[id];
			else opened[id] = open;
		},

		reveal(id) {
			if (id) opened[id] = true;
		}
	};
}
