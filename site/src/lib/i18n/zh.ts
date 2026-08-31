/**
 * 中文 UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in 中文, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, China and Taiwan, and the language vatican.va publishes the Catechism in. A reader gets their own chrome and English
 * content through `CONTENT_LANG_FALLBACK`, which is the honest state of it:
 * the alternative is not better content, it is the same content behind a
 * language they do not read.
 *
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback -- it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const zh: Dictionary = {
	'nav.bible': '圣经',
	'nav.ccc': '教理',
	'nav.compendium': '简编',
	'nav.magisterium': '训导权',
	'nav.prayers': '祈祷文',
	'nav.bookmarks': '书签',
	'nav.menu': '菜单',
	'nav.summa': '神学大全',
	'home.title': 'Glossa Catholica',
	'home.continueReading': '继续阅读',
	'home.works': '书库',
	'home.ccc.heading': '教理与简编',
	'home.magisterium.mostRecent': '最新',
	'home.prayers.heading': '祈祷文',
	'unitNav.previous': '上一个',
	'unitNav.next': '下一个',
	'bible.landing.title': '圣经',
	'bible.landing.tagline': '通读全部圣经，一卷一卷，一章一章。',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': '梅瑟五书',
	'bible.group.historical': '历史书',
	'bible.group.wisdom': '智慧书',
	'bible.group.prophetic': '先知书',
	'bible.group.gospels': '福音',
	'bible.group.acts': '宗徒大事录',
	'bible.group.pauline': '保禄书信',
	'bible.group.catholicLetters': '公函',
	'bible.group.revelation': '默示录',
	'ccc.landing.title': '天主教教理',
	'ccc.landing.tagline':
		'<strong>《教理》</strong>以 2,865 个编号段落阐述天主教教义。<strong>《简编》</strong>依同一纲目，以 598 个问答重述同一教义。',
	'document.library.tagline': '通谕、大公会议宪章、法令，以及训导权的宣言。',
	'doctores.landing.title': '教会圣师',
	'doctores.landing.tagline': '教会教父与圣师的神学著作。',
	'summa.landing.title': '神学大全',
	'summa.landing.tagline': '多玛斯·阿奎那，英文本与他所写的拉丁文本。',
	'prayers.landing.title': '常用祈祷文',
	'prayers.landing.tagline': '祈祷文并列拉丁文本。',
	'colophon.title': '版本说明',
	'colophon.lede': '本站是什么，文本从何而来，以及我们对复制这些文本的立场。'
};
