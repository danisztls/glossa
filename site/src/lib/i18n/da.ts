/**
 * Dansk UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 3 editions in Dansk and its readers were reading
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

export const da: Dictionary = {
	'nav.bible': 'Bibelen',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Læreembedet',
	'nav.prayers': 'Bønner',
	'nav.bookmarks': 'Bogmærker',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Fortsæt læsning',
	'home.works': 'Bibliotek',
	'home.ccc.heading': 'Katekismus og Kompendium',
	'home.magisterium.mostRecent': 'Nyeste',
	'home.prayers.heading': 'Bønner',
	'unitNav.previous': 'Forrige',
	'unitNav.next': 'Næste',
	'bible.landing.title': 'Bibelen',
	'bible.landing.tagline': 'Læs hele Bibelen, bog for bog, kapitel for kapitel.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuken',
	'bible.group.historical': 'Historiske bøger',
	'bible.group.wisdom': 'Visdomsbøger',
	'bible.group.prophetic': 'Profetiske bøger',
	'bible.group.gospels': 'Evangelierne',
	'bible.group.acts': 'Apostlenes Gerninger',
	'bible.group.pauline': 'Paulusbrevene',
	'bible.group.catholicLetters': 'De katolske breve',
	'bible.group.revelation': 'Åbenbaringen',
	'ccc.landing.title': 'Den Katolske Kirkes Katekismus',
	'ccc.landing.tagline':
		'<strong>Katekismen</strong> fremlægger den katolske lære i 2.865 nummererede afsnit. <strong>Kompendiet</strong> gengiver den samme lære som 598 spørgsmål og svar efter samme disposition.',
	'document.library.tagline':
		'Encyklikaer, konciliære konstitutioner, dekreter og erklæringer fra Læreembedet.',
	'doctores.landing.title': 'Kirkelærere',
	'doctores.landing.tagline': 'Kirkefædrenes og kirkelærernes teologiske værker.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas Aquinas, på engelsk og på det latin han skrev.',
	'prayers.landing.title': 'Almindelige bønner',
	'prayers.landing.tagline': 'Bønner med den latinske tekst ved siden af.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Hvad dette websted er, hvor teksterne kommer fra, og hvor vi står med hensyn til at gengive dem.'
};
