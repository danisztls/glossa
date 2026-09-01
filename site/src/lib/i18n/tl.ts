/**
 * Tagalog UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Tagalog, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, the Philippines, the third-largest Catholic country in the world. A reader gets their own chrome and English
 * content through `CONTENT_LANG_FALLBACK`, which is the honest state of it:
 * the alternative is not better content, it is the same content behind a
 * language they do not read.
 *
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback -- it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content.
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

export const tl: Dictionary = {
	'nav.bible': 'Bibliya',
	'nav.ccc': 'Katesismo',
	'nav.compendium': 'Kompendyo',
	'nav.magisterium': 'Magisterium',
	'nav.prayers': 'Mga Panalangin',
	'nav.bookmarks': 'Mga Bookmark',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Magpatuloy sa pagbabasa',
	'home.works': 'Aklatan',
	'home.ccc.heading': 'Katesismo at Kompendyo',
	'home.magisterium.mostRecent': 'Pinakabago',
	'home.prayers.heading': 'Mga Panalangin',
	'unitNav.previous': 'Nakaraan',
	'unitNav.next': 'Susunod',
	'bible.landing.title': 'Ang Bibliya',
	'bible.landing.tagline': 'Basahin ang buong Bibliya, aklat bawat aklat, kabanata bawat kabanata.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentateuko',
	'bible.group.historical': 'Mga Aklat ng Kasaysayan',
	'bible.group.wisdom': 'Mga Aklat ng Karunungan',
	'bible.group.prophetic': 'Mga Aklat ng Propeta',
	'bible.group.gospels': 'Mga Ebanghelyo',
	'bible.group.acts': 'Mga Gawa ng mga Apostol',
	'bible.group.pauline': 'Mga Sulat ni Pablo',
	'bible.group.catholicLetters': 'Mga Sulat Katoliko',
	'bible.group.revelation': 'Pahayag',
	'ccc.landing.title': 'Katesismo ng Simbahang Katoliko',
	'ccc.landing.tagline':
		'<strong>Ang Katesismo</strong> ay naglalahad ng turong Katoliko sa 2,865 binilang na talata. <strong>Ang Kompendyo</strong> ay muling naglalahad ng gayunding turo sa 598 tanong at sagot, sa gayunding balangkas.',
	'document.library.tagline':
		'Mga ensiklika, konstitusyong konsiliyar, dekreto, at pahayag ng Magisterium.',
	'doctores.landing.title': 'Mga Doktor ng Simbahan',
	'doctores.landing.tagline': 'Ang mga akdang teolohiko ng mga Ama at Doktor ng Simbahan.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomas de Aquino, sa Ingles at sa Latin na kanyang isinulat.',
	'prayers.landing.title': 'Karaniwang mga Panalangin',
	'prayers.landing.tagline': 'Mga panalangin na may katabing tekstong Latin.',
	'colophon.title': 'Kolopon',
	'colophon.lede':
		'Kung ano ang sityong ito, kung saan nanggaling ang mga teksto nito, at ang aming paninindigan sa paglalathala ng mga ito.'
};
