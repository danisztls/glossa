/**
 * Suomi UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 2 editions in Suomi and its readers were reading
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
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const fi: Dictionary = {
	'nav.bible': 'Raamattu',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Opetusvirka',
	'nav.prayers': 'Rukoukset',
	'nav.bookmarks': 'Kirjanmerkit',
	'nav.menu': 'Valikko',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Jatka lukemista',
	'home.works': 'Kirjasto',
	'home.ccc.heading': 'Katekismus ja Kompendium',
	'home.magisterium.mostRecent': 'Uusimmat',
	'home.prayers.heading': 'Rukoukset',
	'unitNav.previous': 'Edellinen',
	'unitNav.next': 'Seuraava',
	'bible.landing.title': 'Raamattu',
	'bible.landing.tagline': 'Lue koko Raamattu, kirja kirjalta, luku luvulta.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateukki',
	'bible.group.historical': 'Historialliset kirjat',
	'bible.group.wisdom': 'Viisauskirjat',
	'bible.group.prophetic': 'Profeetalliset kirjat',
	'bible.group.gospels': 'Evankeliumit',
	'bible.group.acts': 'Apostolien teot',
	'bible.group.pauline': 'Paavalin kirjeet',
	'bible.group.catholicLetters': 'Katoliset kirjeet',
	'bible.group.revelation': 'Ilmestyskirja',
	'ccc.landing.title': 'Katolisen kirkon katekismus',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> esittää katolisen opin 2 865 numeroidussa kohdassa. <strong>Kompendium</strong> esittää saman opin 598 kysymyksenä ja vastauksena samaa jäsennystä noudattaen.',
	'document.library.tagline':
		'Kiertokirjeitä, konsiilin konstituutioita, dekreettejä ja opetusviran julistuksia.',
	'doctores.landing.title': 'Kirkonopettajat',
	'doctores.landing.tagline': 'Kirkkoisien ja kirkonopettajien teologiset teokset.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tuomas Akvinolainen, englanniksi ja sillä latinalla jota hän kirjoitti.',
	'prayers.landing.title': 'Tavalliset rukoukset',
	'prayers.landing.tagline': 'Rukoukset latinankielisen tekstin rinnalla.',
	'colophon.title': 'Kolofoni',
	'colophon.lede':
		'Mikä tämä sivusto on, mistä sen tekstit ovat peräisin ja mikä on kantamme niiden toisintamiseen.'
};
