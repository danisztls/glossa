/**
 * Slovenčina UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 3 editions in Slovenčina and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback: it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content. What is
 * here is the chrome -- including every key `CHROME_KEYS` requires, since an
 * unnamed chrome page fails the sync rather than falling back.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const sk: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katechizmus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magistérium',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Ponuka',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Pokračovať v čítaní',
	'home.works': 'Knižnica',
	'home.ccc.heading': 'Katechizmus a Kompendium',
	'home.magisterium.mostRecent': 'Najnovšie',
	'home.prayers.heading': 'Modlitby',
	'unitNav.previous': 'Predchádzajúce',
	'unitNav.next': 'Ďalšie',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Čítajte celú Bibliu, knihu po knihe, kapitolu po kapitole.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Historické knihy',
	'bible.group.wisdom': 'Múdroslovné knihy',
	'bible.group.prophetic': 'Prorocké knihy',
	'bible.group.gospels': 'Evanjeliá',
	'bible.group.acts': 'Skutky apoštolov',
	'bible.group.pauline': 'Pavlove listy',
	'bible.group.catholicLetters': 'Katolícke listy',
	'bible.group.revelation': 'Zjavenie',
	'ccc.landing.title': 'Katechizmus Katolíckej cirkvi',
	'ccc.landing.tagline':
		'<strong>Katechizmus</strong> predkladá katolícku náuku v 2 865 očíslovaných odsekoch. <strong>Kompendium</strong> tú istú náuku podáva ako 598 otázok a odpovedí podľa toho istého usporiadania.',
	'document.library.tagline': 'Encykliky, koncilové konštitúcie, dekréty a deklarácie Magistéria.',
	'doctores.landing.title': 'Učitelia Cirkvi',
	'doctores.landing.tagline': 'Teologické diela cirkevných otcov a učiteľov Cirkvi.',
	'summa.landing.title': 'Teologická suma',
	'summa.landing.tagline': 'Tomáš Akvinský, po anglicky a v latinčine, ktorou písal.',
	'prayers.landing.title': 'Bežné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textom vedľa.',
	'colophon.title': 'Tiráž',
	'colophon.lede':
		'Čo je táto stránka, odkiaľ pochádzajú jej texty a aký je náš postoj k ich reprodukovaniu.'
};
