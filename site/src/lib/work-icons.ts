/**
 * One glyph per work, and one per place: the whole icon vocabulary for the
 * things this site holds.
 *
 * ## Why it is a module
 *
 * `site/CLAUDE.md` has said since the catalogue was written that a card takes
 * THE SAME GLYPH `/schola` GIVES THAT WORK, "rather than choosing again" — and
 * by 2026-09-12 three tables had chosen again anyway, keyed three different
 * ways: `shelves.ts` by shelf key, `/schola`'s `WORKS` by its own, and
 * `CENSUS_ICONS` by the census builder's. They agreed, which is the whole
 * danger: nothing would have said so if they had not, and the reader who
 * learns a mark on the Library is the one who meets it again on Learn. The
 * places were copied twice more, between `/schola`'s `PLACES` and the three
 * cards `ShelfGrid` appends by hand.
 *
 * This is `specimens.ts`'s argument a second time — a table four surfaces want
 * is a module, not a fourth copy — and the same test applies to the next
 * surface that wants a glyph: take it from here, and if it is not here, the
 * thing it names is new.
 *
 * ## Keyed by what the thing IS, so nothing has to agree about a name
 *
 * A work is keyed by its `WorkType` and a place by the address it opens. Both
 * are identities the rest of the site already carries, so a consumer looks its
 * glyph up out of a field it holds anyway — which is why `Shelf` and `/schola`
 * stopped declaring an `icon` at all. A table keyed on a name invites a fourth
 * name for the same work; there is no room for one here.
 */
import type { IconName } from './components/Icon.svelte';
import type { WorkType } from './types';

/**
 * The work types this site gives a shelf, a row and a mark to.
 *
 * `Extract` and not a hand-written union: a renamed member of `WorkType` is a
 * type error here rather than a work that quietly loses its glyph. The two it
 * leaves out are the two that are not shelves — `bible-intro` and `commentary`
 * are read INSIDE another work (`shelves.ts`: "a card is named for its
 * flagship and holds what is around it"), so a mark of their own would put
 * Haydock on the page as a ninth thing to choose between.
 */
export type ShelvedWork = Extract<
	WorkType,
	| 'bible'
	| 'catechism'
	| 'compendium'
	| 'document'
	| 'social-doctrine'
	| 'canon-law'
	| 'prayer'
	| 'summa'
>;

/**
 * In the order a reader meets the Church's texts, which is `SHELVES`' order
 * and `SECTIONS`'. The glyphs are lucide's, through `Icon.svelte`.
 */
export const WORK_ICONS = {
	bible: 'scroll',
	catechism: 'book-marked',
	compendium: 'messages-square',
	document: 'landmark',
	'social-doctrine': 'users',
	'canon-law': 'scale',
	prayer: 'flame',
	summa: 'feather'
} as const satisfies Record<ShelvedWork, IconName>;

/**
 * NOT TEXTS, BUT PLACES — `/schola`'s own distinction, and the reason these
 * are a second table rather than eight more rows above: none of them is
 * something to read. Two are other ways into the works, one is a day, one is
 * what the reader themselves marked, and the last is a count of the rest.
 *
 * Keyed by the address because that is what a place IS, and because both
 * surfaces that draw them already have the href in hand.
 */
export const PLACE_ICONS = {
	'/bibliotheca': 'book-open',
	'/quaestiones': 'circle-help',
	'/calendarium': 'calendar',
	'/signata': 'bookmark',
	'/bibliotheca/census': 'chart-column'
} as const satisfies Record<string, IconName>;

export type PlacePath = keyof typeof PLACE_ICONS;
