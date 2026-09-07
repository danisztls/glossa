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
 * page. The headings stay while there are two lists to tell apart; what is
 * gone is the row for a control that is not there.
 *
 * ## A ROW HAS TO TEACH SOMETHING THE CONTROL DOES NOT
 *
 * The settings and language rows went on 2026-09-07, by direction: opening
 * either panel explains it completely, so the row was a second copy of a
 * label. What is left is what a reader could not work out by clicking — the
 * jump box reads a citation (`john 3:16`, `ccc 1234`), whole works download
 * for offline reading, an edition can be set beside another, an edition's
 * footnotes and the commentary written on it exist at all.
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
 * control marks itself with, `data-help="search"` — which is how the sheet
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
import { chapterVerseSep } from '$lib/citation-style';
import { content } from '$lib/content.svelte';
import { getBook } from '$lib/corpus';
import { bcp47, i18n, t } from '$lib/i18n.svelte';
import { scriptureSpecimen } from '$lib/refs';

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
	/** Where the controls under it are, which is why this is two lists. */
	headingKey: string;
	features: readonly HelpFeature[];
}

/**
 * THE JUMP BOX HAS A SECTION AND NOT A ROW (2026-09-07, by direction), which
 * is what the header group had left once the settings and language rows went.
 * It is also the one control here whose lesson is a NOTATION rather than a
 * sentence — the reader has to see what to type — so it carries the examples
 * below, and a row in a list has nowhere to put them.
 */
export const SEARCH: HelpFeature = { key: 'search', icon: 'search', nameKey: 'jumpbox.short' };

/**
 * The two bars, in the order a reader meets them: the header is on every page
 * including the one they are reading this on, and the reading bar appears
 * only once there is a text on the screen.
 */
export const HELP_GROUPS: readonly HelpGroup[] = [
	{
		headingKey: 'help.top.heading',
		features: [{ key: 'offline', icon: 'download', nameKey: 'install.label' }]
	},
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

/** What one page's sheet holds: whether the jump box is on it, and the groups
 *  of rows whose controls are. */
export interface HelpSheet {
	search: boolean;
	groups: HelpGroup[];
}

/**
 * The guide for one page: the search section if the box is there, then the
 * groups that still have a row, each holding the rows whose control the page
 * actually shows.
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
		search: present.has(SEARCH.key),
		groups: HELP_GROUPS.map((group) => ({
			headingKey: group.headingKey,
			features: group.features.filter((feature) => present.has(feature.key))
		})).filter((group) => group.features.length > 0)
	};
}

/** One line of the syntax table: the name a reader already knows, and the
 *  short form the same work answers to. */
export interface SearchExample {
	typed: string;
	cites: string;
}

/**
 * BOTH HALVES ARE SPELLED THE WAY A READER MAY TYPE THEM — lower case, and no
 * stops — because that is what the box accepts and what these lines exist to
 * say. `suggest.ts` folds case and accents (`fold`) and drops every separator
 * from a section keyword before matching (`sectionForm`), so `comp. 123` and
 * `comp 123` are one input to it; printing the stop would teach punctuation
 * the reader does not have to get right, and a capital would teach a shift key
 * they do not have to press.
 *
 * IT IS A LOCALE-AWARE LOWERCASING and not `toLowerCase()`, since these are
 * words in the reader's own language rather than identifiers.
 *
 * (The cost is that a German noun is printed against its own spelling —
 * `katechismus`. It is drawn in the chip idiom, which is the site's way of
 * saying "this is something to type" rather than something to read, and the
 * alternative is a specimen that teaches a shift key the box ignores.)
 */
function typeable(text: string, lang: string): string {
	return text.toLocaleLowerCase(bcp47(lang)).replace(/\./g, '');
}

/**
 * WHAT TO TYPE, IN THREE LINES, and every one of them derived.
 *
 * The lesson is the one thing about this box a reader cannot guess: it takes
 * the name they already know for a work, and it takes the short form the work
 * is cited by, and both land on the same passage. A sentence cannot teach a
 * notation; a pair can, and the arrow between them is the whole grammar.
 *
 * NOT ONE OF THESE IS WRITTEN DOWN. The left column is what `suggest.ts`
 * actually matches — `nav.ccc` and `nav.canonLaw` are in its `SECTIONS` table
 * by those very keys, and the reader's own edition supplies the book's name —
 * and the right column is the siglum `/schola` teaches for the same work, out
 * of the same keys `citation-label.ts` writes a bookmark with. A hard-coded
 * example would be English, and worse, would be a form nobody had checked the
 * parser still reads.
 *
 * THE SCRIPTURE LINE IS THE ONE THAT CAN BE ABSENT, and it is drawn from the
 * corpus for the reason `scriptureSpecimen` gives: only the reader's own
 * edition knows what it calls the book. `/colophon` is the one route that
 * primes no Bible index (`index-priming.ts`), so the sheet opened there shows
 * two lines rather than three — the same silent, correct absence the specimen
 * makes on a page with no edition.
 */
export function searchExamples(): SearchExample[] {
	const rows: SearchExample[] = [];
	const workId = content.workIdFor('bible');
	const bibleLang = content.langFor('bible');
	const book = workId ? getBook(workId, 'john') : undefined;
	const cited = scriptureSpecimen(workId, bibleLang);
	if (book && cited) {
		rows.push({
			typed: typeable(`${book.name} 3${chapterVerseSep()}16`, bibleLang),
			cites: typeable(cited, bibleLang)
		});
	}
	const ui = i18n.lang;
	rows.push({
		typed: typeable(`${t('nav.ccc')} 101`, ui),
		cites: typeable(`${t('ccc.abbrev')} 101`, ui)
	});
	rows.push({
		typed: typeable(`${t('nav.canonLaw')} 123`, ui),
		cites: typeable(`${t('canonLaw.canon')} 123`, ui)
	});
	return rows;
}
