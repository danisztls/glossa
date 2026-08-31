/**
 * Nederlands UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 9 editions in Nederlands and its readers were reading
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

export const nl: Dictionary = {
	'nav.bible': 'Bijbel',
	'nav.ccc': 'Catechismus',
	'nav.compendium': 'Compendium',
	'nav.magisterium': 'Leergezag',
	'nav.prayers': 'Gebeden',
	'nav.bookmarks': 'Bladwijzers',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Verder lezen',
	'home.works': 'Bibliotheek',
	'home.ccc.heading': 'Catechismus en Compendium',
	'home.magisterium.mostRecent': 'Nieuwste',
	'home.prayers.heading': 'Gebeden',
	'unitNav.previous': 'Vorige',
	'unitNav.next': 'Volgende',
	'bible.landing.title': 'De Bijbel',
	'bible.landing.tagline': 'Lees de hele Bijbel, boek voor boek, hoofdstuk voor hoofdstuk.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Historische boeken',
	'bible.group.wisdom': 'Wijsheidsboeken',
	'bible.group.prophetic': 'Profetische boeken',
	'bible.group.gospels': 'Evangeliën',
	'bible.group.acts': 'Handelingen van de Apostelen',
	'bible.group.pauline': 'Brieven van Paulus',
	'bible.group.catholicLetters': 'Katholieke brieven',
	'bible.group.revelation': 'Openbaring',
	'ccc.landing.title': 'Catechismus van de Katholieke Kerk',
	'ccc.landing.tagline':
		'<strong>De Catechismus</strong> zet de katholieke leer uiteen in 2.865 genummerde paragrafen. <strong>Het Compendium</strong> geeft dezelfde leer weer als 598 vragen en antwoorden, volgens dezelfde indeling.',
	'document.library.tagline':
		'Encyclieken, conciliaire constituties, decreten en verklaringen van het Leergezag.',
	'doctores.landing.title': 'Kerkleraren',
	'doctores.landing.tagline': 'De theologische werken van de kerkvaders en kerkleraren.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas van Aquino, in het Engels en in het Latijn dat hij schreef.',
	'prayers.landing.title': 'Gebruikelijke gebeden',
	'prayers.landing.tagline': 'Gebeden met de Latijnse tekst ernaast.',
	'colophon.title': 'Colofon',
	'colophon.lede':
		'Wat deze site is, waar haar teksten vandaan komen, en hoe wij staan tegenover het reproduceren ervan.'
};
