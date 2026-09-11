/**
 * The chrome guide: one sentence per control, and which bar it is on.
 *
 * ## It was a section of `/schola` until 2026-09-07
 *
 * A guide to the chrome printed on a page of its own has to describe controls
 * the reader cannot see while they read it — so it needed a group heading
 * saying WHERE each row's control lives, and even then it told a reader on a
 * landing page about the compare button, which correctly is not there. The
 * same rows in the sheet the `?` button opens are read WITH the page in
 * front of them, and the sheet draws only the rows whose control is on that
 * page. A heading stays where it is the thing to say — which bar a list of
 * controls is on; what is gone is the row for a control that is not there.
 *
 * ## A ROW HAS TO TEACH SOMETHING THE CONTROL DOES NOT, AND THE PANEL IT OPENS
 * IS PART OF THE CONTROL
 *
 * The settings and language rows went on 2026-09-07, by direction, and the
 * jump box's section on 2026-09-10: opening any of the three explains it
 * completely — the box answers an empty field with a legend of its own, one
 * row per work, the form beside the name and clickable. A guide that teaches
 * the same notation one panel further away is a second copy that can fall out
 * of step with the box. What is left is what a reader could not work out by
 * opening the thing: whole works download for offline reading, an edition can
 * be set beside another, an edition's footnotes and the commentary written on
 * it exist at all.
 *
 * `site/docs/finding.md` holds the argument.
 *
 * ## Nothing here is a page, and nothing here is a name
 *
 * Library, the Calendar and Bookmarks were rows in this list while it was on
 * `/schola` and are addresses rather than controls; they stayed behind, in
 * that page's list of what is on the site. What is left is exactly what a
 * link cannot reach — a menu that opens in the header of whatever page the
 * reader is on has no address to give them.
 *
 * Every `nameKey` is the key the control it describes is already labelled by,
 * so a reader who reads a row and goes looking for the control finds the same
 * word, and a translated interface cannot disagree with its own guide. Only
 * the sentence under each (`help.feature.*`) is written for this list.
 *
 * ## `key` is the contract with the markup, and it runs both ways
 *
 * It names the sentence (`help.feature.${key}`) AND it is the value the
 * control marks itself with, `data-help="offline"` — which is how the sheet
 * knows what is on the page without a per-route registration, a context store
 * or a list of selectors to keep in step. `Help.svelte` reads the attributes;
 * this module is the order they are drawn in and the words that go with them.
 *
 * A control may carry the attribute in more than one place — the table of
 * contents is a sidebar at desktop widths, a panel in the reading bar below
 * them, and inline markup on `/documenta` — and the reader is shown one row
 * either way, because what is collected is a set of keys.
 */
import type { IconName } from '$lib/components/Icon.svelte';

export interface HelpFeature {
	/** The `data-help` its control marks itself with, and the tail of the key
	 *  the sentence under it is written at. */
	key: string;
	/** THE GLYPH THE CONTROL ITSELF DRAWS, as its name is the label the control
	 *  itself wears. A row marked with a different mark is a row a reader
	 *  cannot match to anything in the bar: this said `eye` for focus mode for
	 *  a day, where `ZenToggle` has always drawn `maximize`. */
	icon: IconName;
	/** The key the control itself is labelled by. */
	nameKey: string;
}

export interface HelpGroup {
	/** Where the controls under it are, which is the whole reason a group is a
	 *  list rather than a section headed by each control's own name. */
	headingKey: string;
	features: readonly HelpFeature[];
}

/**
 * A SECTION IS A CONTROL WHOSE LESSON IS NOT WHICH BAR IT IS ON. A group's
 * heading says WHERE the rows under it are; this one is headed by its own
 * name, because where it is is not what a reader has to be told — a heading
 * naming the bar every page carries, standing over one row, sends the reader
 * looking for a list that is not there.
 *
 * It stays a list rather than collapsing into the row it now holds alone: the
 * jump box had a section here until 2026-09-10 and the shape is what a control
 * whose lesson is its own earns, not a count.
 */
export const OFFLINE: HelpFeature = { key: 'offline', icon: 'download', nameKey: 'install.label' };

/** The sections, in the order they are drawn, before the groups. */
export const HELP_SECTIONS: readonly HelpFeature[] = [OFFLINE];

/**
 * The bar a reader does not always have, which is why its rows keep a heading:
 * it appears only once there is a text on the screen, and the heading is what
 * says that is where the controls under it are.
 */
export const HELP_GROUPS: readonly HelpGroup[] = [
	{
		headingKey: 'help.reading.heading',
		features: [
			{ key: 'contents', icon: 'table-of-contents', nameKey: 'document.tableOfContents' },
			{ key: 'compare', icon: 'columns-2', nameKey: 'compare.enter' },
			{ key: 'apparatus', icon: 'notebook-pen', nameKey: 'apparatus.label' },
			{ key: 'focus', icon: 'maximize', nameKey: 'zen.enter' }
		]
	}
];

/** What one page's sheet holds: the sections whose control is on it, and the
 *  groups of rows whose controls are. */
export interface HelpSheet {
	sections: HelpFeature[];
	groups: HelpGroup[];
}

/**
 * The guide for one page: the sections whose control the page carries, then
 * the groups that still have a row, each holding the rows whose control the
 * page actually shows.
 *
 * A GROUP WITH NOTHING IN IT IS DROPPED WITH ITS HEADING, which is the whole
 * behaviour on a landing page — "The bar above a text" over an empty list
 * would be the same false promise the section made on `/schola`, printed one
 * level down. The order is this module's, never the DOM's: the sheet reads
 * an unordered set of attributes off the page, and a reader who opens it
 * twice must not meet two orders.
 */
export function helpFor(present: ReadonlySet<string>): HelpSheet {
	return {
		sections: HELP_SECTIONS.filter((feature) => present.has(feature.key)),
		groups: HELP_GROUPS.map((group) => ({
			headingKey: group.headingKey,
			features: group.features.filter((feature) => present.has(feature.key))
		})).filter((group) => group.features.length > 0)
	};
}
