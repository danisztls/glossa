/**
 * 한국어 UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in 한국어, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, South Korea, whose Catholic community is large and unusually active. A reader gets their own chrome and English
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

export const ko: Dictionary = {
	'nav.bible': '성경',
	'nav.ccc': '교리서',
	'nav.compendium': '요약',
	'nav.magisterium': '교도권',
	'nav.prayers': '기도문',
	'nav.bookmarks': '책갈피',
	'nav.menu': '메뉴',
	'nav.summa': '신학대전',
	'home.title': 'Glossa Catholica',
	'home.continueReading': '이어서 읽기',
	'home.works': '서고',
	'home.ccc.heading': '교리서와 요약',
	'home.magisterium.mostRecent': '최신',
	'home.prayers.heading': '기도문',
	'unitNav.previous': '이전',
	'unitNav.next': '다음',
	'bible.landing.title': '성경',
	'bible.landing.tagline': '성경 전체를 한 권씩, 한 장씩 읽으십시오.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': '모세오경',
	'bible.group.historical': '역사서',
	'bible.group.wisdom': '지혜서',
	'bible.group.prophetic': '예언서',
	'bible.group.gospels': '복음서',
	'bible.group.acts': '사도행전',
	'bible.group.pauline': '바오로 서간',
	'bible.group.catholicLetters': '가톨릭 서간',
	'bible.group.revelation': '요한 묵시록',
	'ccc.landing.title': '가톨릭 교회 교리서',
	'ccc.landing.tagline':
		'<strong>교리서</strong>는 가톨릭 교리를 번호가 매겨진 2,865개 항으로 제시합니다. <strong>요약</strong>은 같은 교리를 같은 얼개에 따라 598개의 문답으로 다시 제시합니다.',
	'document.library.tagline': '회칙, 공의회 헌장, 교령, 그리고 교도권의 선언.',
	'doctores.landing.title': '교회 학자',
	'doctores.landing.tagline': '교부들과 교회 학자들의 신학 저작.',
	'summa.landing.title': '신학대전',
	'summa.landing.tagline': '토마스 아퀴나스, 영어와 그가 쓴 라틴어로.',
	'prayers.landing.title': '일반 기도문',
	'prayers.landing.tagline': '라틴어 본문을 나란히 실은 기도문.',
	'colophon.title': '간기',
	'colophon.lede':
		'이 사이트가 무엇인지, 본문이 어디에서 왔는지, 그리고 그것을 옮기는 일에 대한 우리의 입장.'
};
