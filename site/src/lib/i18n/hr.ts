/**
 * Hrvatski UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 5 editions in Hrvatski and its readers were reading
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

export const hr: Dictionary = {
	'nav.bible': 'Biblija',
	'nav.ccc': 'Katekizam',
	'nav.compendium': 'Kompendij',
	'nav.magisterium': 'Učiteljstvo',
	'nav.prayers': 'Molitve',
	'nav.bookmarks': 'Oznake',
	'nav.menu': 'Izbornik',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Nastavi čitati',
	'home.works': 'Knjižnica',
	'home.ccc.heading': 'Katekizam i Kompendij',
	'home.magisterium.mostRecent': 'Najnovije',
	'home.prayers.heading': 'Molitve',
	'unitNav.previous': 'Prethodno',
	'unitNav.next': 'Sljedeće',
	'bible.landing.title': 'Biblija',
	'bible.landing.tagline': 'Čitajte cijelu Bibliju, knjigu po knjigu, poglavlje po poglavlje.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Petoknjižje',
	'bible.group.historical': 'Povijesne knjige',
	'bible.group.wisdom': 'Mudrosne knjige',
	'bible.group.prophetic': 'Proročke knjige',
	'bible.group.gospels': 'Evanđelja',
	'bible.group.acts': 'Djela apostolska',
	'bible.group.pauline': 'Pavlove poslanice',
	'bible.group.catholicLetters': 'Katoličke poslanice',
	'bible.group.revelation': 'Otkrivenje',
	'ccc.landing.title': 'Katekizam Katoličke Crkve',
	'ccc.landing.tagline':
		'<strong>Katekizam</strong> izlaže katolički nauk u 2865 numeriranih odlomaka. <strong>Kompendij</strong> isti nauk donosi kao 598 pitanja i odgovora, prema istom rasporedu.',
	'document.library.tagline':
		'Enciklike, koncilske konstitucije, dekreti i deklaracije Učiteljstva.',
	'doctores.landing.title': 'Naučitelji Crkve',
	'doctores.landing.tagline': 'Teološka djela crkvenih otaca i naučitelja Crkve.',
	'summa.landing.title': 'Suma teologije',
	'summa.landing.tagline': 'Toma Akvinski, na engleskom i na latinskom kojim je pisao.',
	'prayers.landing.title': 'Uobičajene molitve',
	'prayers.landing.tagline': 'Molitve s latinskim tekstom uz njih.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Što je ova stranica, odakle dolaze njezini tekstovi i kakav je naš stav o njihovu reproduciranju.'
};
