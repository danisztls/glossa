/**
 * Bahasa Indonesia UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Bahasa Indonesia, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, Indonesia, the largest Catholic population of any Muslim-majority country. A reader gets their own chrome and English
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

export const id: Dictionary = {
	'nav.bible': 'Alkitab',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magisterium',
	'nav.prayers': 'Doa',
	'nav.bookmarks': 'Penanda',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Lanjutkan membaca',
	'home.works': 'Perpustakaan',
	'home.ccc.heading': 'Katekismus dan Kompendium',
	'home.magisterium.mostRecent': 'Terbaru',
	'home.prayers.heading': 'Doa',
	'unitNav.previous': 'Sebelumnya',
	'unitNav.next': 'Berikutnya',
	'bible.landing.title': 'Alkitab',
	'bible.landing.tagline': 'Bacalah seluruh Alkitab, kitab demi kitab, bab demi bab.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentateukh',
	'bible.group.historical': 'Kitab-kitab Sejarah',
	'bible.group.wisdom': 'Kitab-kitab Kebijaksanaan',
	'bible.group.prophetic': 'Kitab-kitab Nabi',
	'bible.group.gospels': 'Injil',
	'bible.group.acts': 'Kisah Para Rasul',
	'bible.group.pauline': 'Surat-surat Paulus',
	'bible.group.catholicLetters': 'Surat-surat Katolik',
	'bible.group.revelation': 'Wahyu',
	'ccc.landing.title': 'Katekismus Gereja Katolik',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> memaparkan ajaran Katolik dalam 2.865 alinea bernomor. <strong>Kompendium</strong> menyajikan ajaran yang sama sebagai 598 tanya jawab, menurut kerangka yang sama.',
	'document.library.tagline': 'Ensiklik, konstitusi konsili, dekret, dan deklarasi Magisterium.',
	'doctores.landing.title': 'Pujangga Gereja',
	'doctores.landing.tagline': 'Karya-karya teologis para Bapa dan Pujangga Gereja.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tomas Aquinas, dalam bahasa Inggris dan dalam bahasa Latin yang ia tulis.',
	'prayers.landing.title': 'Doa-doa Umum',
	'prayers.landing.tagline': 'Doa dengan teks Latin di sampingnya.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Apa situs ini, dari mana teksnya berasal, dan bagaimana sikap kami tentang memperbanyaknya.'
};
