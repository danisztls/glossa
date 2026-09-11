/**
 * The catalogue: one card per work, named and described by the page it opens.
 *
 * ## Why it is a module and not a `const` on a page
 *
 * It was `SHELVES` inside `/bibliotheca` until 2026-09-06, when the home page
 * stopped offering four doors and started offering this list — the two pages
 * would otherwise hold two copies of the same seven names, seven icons and
 * seven taglines, and the copies would part company the first time a work was
 * ingested. `ShelfCard.svelte` is the other half of the same move: the list
 * here, the card there, and neither page owning either.
 *
 * ## Almost every string is one a page already had
 *
 * No entry declares a sentence of its own: each reuses the key its own landing
 * page is titled and described by, which is the same rule
 * `scripts/route-titles.mjs` follows for the `<head>`. A catalogue that
 * paraphrased the pages it lists would be a second set of sentences to
 * translate into 37 languages and a second set to keep true. The two
 * exceptions are the Catechism's, and its entry says why.
 */
import type { ShelvedWork } from '$lib/work-icons';
import { listWorksOfType } from '$lib/corpus';
import type { WorkType } from '$lib/types';

/**
 * ONE CARD, and there is no longer a second shape under it.
 *
 * A shelf could hold nested `works` until 2026-09-06 and exactly one did —
 * Learn, over the Catechism pair and the Social Doctrine — so the whole
 * apparatus (an `Entry` type, a `works` array, a row list inside a card, four
 * rules of CSS pulling `.index-row` back into a block) existed for one group
 * of two. Unfolded, they are two more cards in the same grid, which is what
 * they always looked like to the reader.
 */
export interface Shelf {
	key: string;
	titleKey: string;
	/**
	 * THE SAME WORK NAMED FOR A LINE OF LINKS RATHER THAN FOR A CARD, and
	 * optional because only one entry needs it. A card has three lines and a
	 * sentence under the name, so it can afford `Catechism & Compendium`; the
	 * footer's index is a column of bare links, where a title with an
	 * ampersand in it reads as two entries that failed to separate. Everything
	 * else is already short enough to be its own short name, and a field
	 * repeating `titleKey` on six of seven rows is a field nobody would keep
	 * true. Consumers take `navKey ?? titleKey`.
	 */
	navKey?: string;
	href: string;
	taglineKey: string;
	/**
	 * The work type that has to be in this build for the card to mean
	 * anything — a partial sync or the vitest fixtures may carry some — AND
	 * the card's identity, which is why no row here declares a glyph: the
	 * mark is `WORK_ICONS[type]` (`work-icons.ts`), one vocabulary for the
	 * three surfaces that used to keep their own.
	 */
	type: ShelvedWork;
}

/**
 * The seven cards, in the order a reader meets the Church's texts.
 *
 * THERE IS NO "LEARN" SHELF ANY MORE and the taxonomy argument it carried went
 * with it. It held the Catechism pair and the Compendium of the Social
 * Doctrine, and the Social Doctrine had moved three times before landing there
 * — beside the Magisterium, then under it, then under Learn — on the reasoning
 * that this catalogue groups by FORM (synthesis read THROUGH, against dated
 * acts cited SINGLY) and that both works are syntheses. All of that is still
 * true and none of it needs a container: with one card per work the ORDER
 * states the same sequence, and a group of two was a heading doing the work a
 * position in a list already does. What the address space says is unchanged
 * and is the durable form of the argument — `/doctrina-socialis/{n}` and
 * `/doctrina-socialis/caput/{n}` mirror `/catechismus/{n}` and
 * `/catechismus/caput/{n}`, while the Code is cited by canon and a document by
 * section.
 *
 * A CARD IS STILL NAMED FOR ITS FLAGSHIP AND HOLDS WHAT IS AROUND IT.
 * Scriptura holds Haydock and the book introductions, neither of which is
 * Scripture; the Catechism's card holds its Compendium. That was the one thing
 * the shelf shape was genuinely good for, and it survives as a name.
 */
export const SHELVES: Shelf[] = [
	{
		key: 'bible',
		titleKey: 'nav.bible',
		href: '/scriptura',
		taglineKey: 'bible.landing.tagline',
		type: 'bible'
	},
	{
		// THE PAIR UNDER ONE NAME. `/catechismus` is the index of both works
		// and not of the Catechism alone, which is what `ccc.landing.tagline`
		// has always said in the sentence under it — so the Compendium of the
		// Catechism has no card of its own and needs none.
		//
		// `ccc.landing.pairTitle` and `ccc.landing.pairTagline` are the two keys
		// here written FOR a card: no other surface wants a name or a sentence
		// for the pair (`/schola` lists the two works separately, the `<head>`
		// titles `/catechismus` after the Catechism). `ccc.landing.tagline` is
		// still what `/catechismus` says of itself, at a masthead's width; this
		// is the same two facts in one clause, because in a card it was six
		// lines against its neighbours' three. English only for now; `t()` falls
		// back key by key.
		key: 'catechism',
		titleKey: 'ccc.landing.pairTitle',
		navKey: 'nav.ccc',
		href: '/catechismus',
		taglineKey: 'ccc.landing.pairTagline',
		type: 'catechism'
	},
	{
		// THE NAV BAR'S NAME AND NOT THE LANDING PAGE'S, the one card titled
		// from a different key than its `<head>`: "Compendium of the Social
		// Doctrine of the Church" was the longest name in the grid and buried
		// the two words a reader scans for in the middle of it. It is still what
		// `/doctrina-socialis` calls itself; `nav.socialDoctrine` is the same
		// work's short name and is already written in all 37 languages, so the
		// card shortens without a string to translate.
		key: 'social',
		titleKey: 'nav.socialDoctrine',
		href: '/doctrina-socialis',
		taglineKey: 'socialDoctrine.landing.tagline',
		type: 'social-doctrine'
	},
	{
		key: 'preces',
		titleKey: 'nav.prayers',
		href: '/preces',
		taglineKey: 'prayers.landing.tagline',
		type: 'prayer'
	},
	{
		key: 'ius',
		titleKey: 'nav.canonLaw',
		href: '/ius-canonicum',
		taglineKey: 'canonLaw.landing.tagline',
		type: 'canon-law'
	},
	{
		key: 'magisterium',
		titleKey: 'nav.magisterium',
		href: '/documenta',
		taglineKey: 'document.library.tagline',
		type: 'document'
	},
	{
		// THE CARD THE NAV BAR CANNOT CARRY. `+layout.svelte` leaves `/doctores`
		// unlisted because the Summa awaits its quality pass and the shelf holds
		// nothing else; in a bar that is invisibility, since a bar has no room
		// for a caveat. Here the caveat is the card's own sentence, which is why
		// the argument for hiding it does not reach a page of cards — and why
		// the Summa's own row went on 2026-09-06: two links to one unread work
		// is one more than a caveat can carry, and the row was the one that
		// jumped past it into the text.
		key: 'doctores',
		titleKey: 'doctores.landing.title',
		href: '/doctores',
		taglineKey: 'doctores.landing.tagline',
		type: 'summa'
	}
];

/**
 * The cards this build can actually open, in the order above.
 *
 * The gate is the same test every reading row on the site uses, and it is here
 * rather than on each page for the reason the list is: two callers filtering
 * one list the same way is one place for the two to disagree. A card for a
 * work a partial sync did not carry is a door onto an empty index.
 */
export function visibleShelves(): Shelf[] {
	return SHELVES.filter((shelf) => listWorksOfType(shelf.type).length > 0);
}
