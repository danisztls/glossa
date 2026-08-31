/**
 * Kiswahili UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 19 editions in Kiswahili and its readers were reading
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

export const sw: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katekisimu',
	'nav.compendium': 'Muhtasari',
	'nav.magisterium': 'Mafundisho ya Kanisa',
	'nav.prayers': 'Sala',
	'nav.bookmarks': 'Alamisho',
	'nav.menu': 'Menyu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Endelea kusoma',
	'home.works': 'Maktaba',
	'home.ccc.heading': 'Katekisimu na Muhtasari',
	'home.magisterium.mostRecent': 'Mpya zaidi',
	'home.prayers.heading': 'Sala',
	'unitNav.previous': 'Iliyotangulia',
	'unitNav.next': 'Inayofuata',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Soma Biblia nzima, kitabu kwa kitabu, sura kwa sura.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuki',
	'bible.group.historical': 'Vitabu vya Historia',
	'bible.group.wisdom': 'Vitabu vya Hekima',
	'bible.group.prophetic': 'Vitabu vya Manabii',
	'bible.group.gospels': 'Injili',
	'bible.group.acts': 'Matendo ya Mitume',
	'bible.group.pauline': 'Barua za Paulo',
	'bible.group.catholicLetters': 'Barua za Kikatoliki',
	'bible.group.revelation': 'Ufunuo',
	'ccc.landing.title': 'Katekisimu ya Kanisa Katoliki',
	'ccc.landing.tagline':
		'<strong>Katekisimu</strong> inaeleza mafundisho ya Kikatoliki katika aya 2,865 zenye namba. <strong>Muhtasari</strong> unaeleza mafundisho hayo hayo kwa maswali na majibu 598, kwa mpangilio uleule.',
	'document.library.tagline':
		'Waraka wa kipapa, katiba za mtaguso, amri na matamko ya Mafundisho ya Kanisa.',
	'doctores.landing.title': 'Walimu wa Kanisa',
	'doctores.landing.tagline': 'Kazi za kitaalimungu za Mababa na Walimu wa Kanisa.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomaso wa Akwino, kwa Kiingereza na kwa Kilatini alichoandika.',
	'prayers.landing.title': 'Sala za Kawaida',
	'prayers.landing.tagline': 'Sala pamoja na maandishi ya Kilatini kando.',
	'colophon.title': 'Kolofoni',
	'colophon.lede':
		'Tovuti hii ni nini, maandishi yake yanatoka wapi, na msimamo wetu kuhusu kuyanakili.'
};
