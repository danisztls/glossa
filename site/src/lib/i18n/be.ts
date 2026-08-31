/**
 * Беларуская UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 31 editions in Беларуская and its readers were reading
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

export const be: Dictionary = {
	'nav.bible': 'Біблія',
	'nav.ccc': 'Катэхізіс',
	'nav.compendium': 'Кампендыум',
	'nav.magisterium': 'Настаўніцтва Касцёла',
	'nav.prayers': 'Малітвы',
	'nav.bookmarks': 'Закладкі',
	'nav.menu': 'Меню',
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Працягнуць чытанне',
	'home.works': 'Бібліятэка',
	'home.ccc.heading': 'Катэхізіс і Кампендыум',
	'home.magisterium.mostRecent': 'Найноўшыя',
	'home.prayers.heading': 'Малітвы',
	'unitNav.previous': 'Папярэдняе',
	'unitNav.next': 'Наступнае',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Чытайце ўсю Біблію, кнігу за кнігай, раздзел за раздзелам.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Пяцікніжжа',
	'bible.group.historical': 'Гістарычныя кнігі',
	'bible.group.wisdom': 'Кнігі мудрасці',
	'bible.group.prophetic': 'Прарочыя кнігі',
	'bible.group.gospels': 'Евангеллі',
	'bible.group.acts': 'Дзеі Апосталаў',
	'bible.group.pauline': 'Пасланні Паўла',
	'bible.group.catholicLetters': 'Каталіцкія пасланні',
	'bible.group.revelation': 'Апакаліпсіс',
	'ccc.landing.title': 'Катэхізіс Каталіцкага Касцёла',
	'ccc.landing.tagline':
		'<strong>Катэхізіс</strong> выкладае каталіцкае вучэнне ў 2865 пранумараваных пунктах. <strong>Кампендыум</strong> перадае тое самае вучэнне як 598 пытанняў і адказаў паводле таго ж парадку.',
	'document.library.tagline':
		'Энцыклікі, саборныя канстытуцыі, дэкрэты і дэкларацыі Настаўніцтва Касцёла.',
	'doctores.landing.title': 'Дактары Касцёла',
	'doctores.landing.tagline': 'Багаслоўскія творы Айцоў і Дактароў Касцёла.',
	'summa.landing.title': 'Сума тэалогіі',
	'summa.landing.tagline': 'Тамаш Аквінскі, па-англійску і на лаціне, на якой ён пісаў.',
	'prayers.landing.title': 'Штодзённыя малітвы',
	'prayers.landing.tagline': 'Малітвы з лацінскім тэкстам побач.',
	'colophon.title': 'Калафон',
	'colophon.lede':
		'Чым з’яўляецца гэты сайт, адкуль паходзяць яго тэксты і якая наша пазіцыя адносна іх узнаўлення.'
};
