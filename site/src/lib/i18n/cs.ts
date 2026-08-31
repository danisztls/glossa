/**
 * Čeština UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 17 editions in Čeština and its readers were reading
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

export const cs: Dictionary = {
	'nav.bible': 'Bible',
	'nav.ccc': 'Katechismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Učitelský úřad',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Nabídka',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Pokračovat ve čtení',
	'home.works': 'Knihovna',
	'home.ccc.heading': 'Katechismus a Kompendium',
	'home.magisterium.mostRecent': 'Nejnovější',
	'home.prayers.heading': 'Modlitby',
	'unitNav.previous': 'Předchozí',
	'unitNav.next': 'Další',
	'bible.landing.title': 'Bible',
	'bible.landing.tagline': 'Čtěte celou Bibli, knihu po knize, kapitolu po kapitole.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Dějepisné knihy',
	'bible.group.wisdom': 'Mudroslovné knihy',
	'bible.group.prophetic': 'Prorocké knihy',
	'bible.group.gospels': 'Evangelia',
	'bible.group.acts': 'Skutky apoštolů',
	'bible.group.pauline': 'Pavlovy listy',
	'bible.group.catholicLetters': 'Katolické listy',
	'bible.group.revelation': 'Zjevení',
	'ccc.landing.title': 'Katechismus katolické církve',
	'ccc.landing.tagline':
		'<strong>Katechismus</strong> vykládá katolickou nauku ve 2 865 číslovaných odstavcích. <strong>Kompendium</strong> tutéž nauku podává jako 598 otázek a odpovědí podle téhož uspořádání.',
	'document.library.tagline':
		'Encykliky, koncilní konstituce, dekrety a deklarace učitelského úřadu církve.',
	'doctores.landing.title': 'Učitelé církve',
	'doctores.landing.tagline': 'Teologická díla církevních otců a učitelů církve.',
	'summa.landing.title': 'Teologická summa',
	'summa.landing.tagline': 'Tomáš Akvinský, anglicky a v latině, kterou psal.',
	'prayers.landing.title': 'Běžné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textem vedle.',
	'colophon.title': 'Tiráž',
	'colophon.lede':
		'Co je tento web, odkud pocházejí jeho texty a jaký je náš postoj k jejich reprodukci.'
};
