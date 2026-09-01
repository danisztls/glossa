/**
 * Українська UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Українська, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, the Ukrainian Greek Catholic Church, the largest Eastern Catholic church. A reader gets their own chrome and English
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

export const uk: Dictionary = {
	'nav.bible': 'Біблія',
	'nav.ccc': 'Катехизм',
	'nav.compendium': 'Компендіум',
	'nav.magisterium': 'Учительство Церкви',
	'nav.prayers': 'Молитви',
	'nav.bookmarks': 'Закладки',
	'nav.menu': 'Меню',
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Продовжити читання',
	'home.works': 'Бібліотека',
	'home.ccc.heading': 'Катехизм і Компендіум',
	'home.magisterium.mostRecent': 'Найновіші',
	'home.prayers.heading': 'Молитви',
	'unitNav.previous': 'Попереднє',
	'unitNav.next': 'Наступне',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Читайте всю Біблію, книгу за книгою, розділ за розділом.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'П’ятикнижжя',
	'bible.group.historical': 'Історичні книги',
	'bible.group.wisdom': 'Книги мудрості',
	'bible.group.prophetic': 'Пророчі книги',
	'bible.group.gospels': 'Євангелія',
	'bible.group.acts': 'Діяння апостолів',
	'bible.group.pauline': 'Послання Павла',
	'bible.group.catholicLetters': 'Католицькі послання',
	'bible.group.revelation': 'Одкровення',
	'ccc.landing.title': 'Катехизм Католицької Церкви',
	'ccc.landing.tagline':
		'<strong>Катехизм</strong> викладає католицьке вчення у 2865 пронумерованих пунктах. <strong>Компендіум</strong> подає те саме вчення як 598 запитань і відповідей за тим самим порядком.',
	'document.library.tagline':
		'Енцикліки, соборові конституції, декрети та декларації Учительства Церкви.',
	'doctores.landing.title': 'Учителі Церкви',
	'doctores.landing.tagline': 'Богословські твори Отців та Учителів Церкви.',
	'summa.landing.title': 'Сума теології',
	'summa.landing.tagline': 'Тома Аквінський, англійською і латиною, якою він писав.',
	'prayers.landing.title': 'Звичайні молитви',
	'prayers.landing.tagline': 'Молитви з латинським текстом поруч.',
	'colophon.title': 'Колофон',
	'colophon.lede':
		'Чим є цей сайт, звідки походять його тексти і яка наша позиція щодо їх відтворення.'
};
