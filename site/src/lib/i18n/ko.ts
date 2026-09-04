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
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const ko: Dictionary = {
	'nav.bible': '성경',
	'nav.ccc': '교리서',
	'nav.compendium': '요약',
	'nav.magisterium': '교도권',
	'nav.socialDoctrine': '사회교리',
	'socialDoctrine.landing.title': '교회의 사회교리 편람',
	'socialDoctrine.landing.tagline': '교회가 사회생활에 관하여 가르치는 바, 583개 항으로.',
	'nav.canonLaw': '교회법',
	'canonLaw.landing.title': '교회법전',
	'canonLaw.landing.tagline': '라틴 교회의 법, 일곱 권에 걸친 1,752개 조문.',
	'canonLaw.canon': '제',
	'canonLaw.canons': '제',
	'canonLaw.prevCanon': '이전 조문',
	'canonLaw.nextCanon': '다음 조문',
	'canonLaw.readFullTitle': '제목 전체 읽기',
	'canonLaw.superseded': '다음 문서로 대체된 본문',
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
		'이 사이트가 무엇인지, 본문이 어디에서 왔는지, 그리고 그것을 옮기는 일에 대한 우리의 입장.',
	'colophon.whatThisIs': '이것은 무엇인가',
	'colophon.whatThisIsBody':
		'글로사 카톨리카는 성경, 교리서, 요약본, 그리고 교도권 문헌을 영어와 포르투갈어와 라틴어로 읽기 위한 사이트입니다. 읽히기 위해 존재하며, 읽는 데 그 밖의 어떤 것도 요구하지 않습니다:',
	'colophon.pointFree': '무료이며, 언제나 무료입니다. 유료 장벽도, 구독도, 살 것도 없습니다.',
	'colophon.pointNoAds': '광고도, 어떠한 종류의 협찬 게재도 없습니다.',
	'colophon.pointNoAccounts': '계정이 없습니다. 가입할 것도, 로그인할 것도 없습니다.',
	'colophon.pointNoTracking':
		'추적 스크립트도, 제삼자 코드도, 쿠키도 없습니다. 오직 익명의 이용 횟수만 있으며, 귀하를 식별하는 것은 아무것도 없습니다.',
	'colophon.pointOffline':
		'한 번 방문하시면 연결이 끊겨도 계속 작동하도록 만들어졌습니다. 열악한 연결이 읽기의 장벽이 되지 않도록 하기 위함입니다.',
	'colophon.whatThisIsStanding':
		'글로사 카톨리카는 평신도들의 사적인 기획입니다. 어떠한 교회의 인가도 받지 않았으며, 자체의 어떠한 권위로도 말하지 않습니다.',
	'footer.notEndorsed': '교황청의 승인을 받지 않음',
	'colophon.textsTitle': '본문',
	'colophon.textsBody':
		'모든 본문은 명시된 출처에서 왔으며, 각 저작은 그 판본과 출처 페이지와 가져온 날짜를 기록합니다. 성경은 퍼블릭 도메인 번역을 사용하며, 교리서와 요약본과 교도권 문헌은 성좌가 스스로 펴낸 본문에서 왔습니다.',
	'colophon.textsFidelity':
		'본문은 결코 축약되지 않고, 결코 의역되지 않으며, 결코 다시 쓰이지 않고, 결코 광고 옆에 놓이지 않습니다. 다만 명백한 결함은 바로잡습니다 — 빠진 낱말, 훼손된 인용, 한 단락을 삼켜 버린 표시 — 언제나 출처가 스스로 인쇄한 바를 향하여이지, 결코 우리가 그래야 한다고 여기는 바를 향해서가 아닙니다.',
	'colophon.countBible': '개의 성경 판본',
	'colophon.countDocuments': '건의 교도권 문헌',
	'colophon.copyrightTitle': '저작권',
	'colophon.copyrightBody1':
		'교리서와 요약본과 교도권 문헌은 그 권리자들의 재산입니다 — 주로 바티칸 출판사(Libreria Editrice Vaticana)와 소통부입니다.',
	'colophon.copyrightBody2':
		'각 저작은 그 권리자 자신의 저작권 고지를 그들의 표현 그대로 보여 주며, 가져온 페이지로 연결됩니다.',
	'colophon.copyrightBody3':
		'여기 있는 어떤 본문에 대한 권리를 보유하고 계시며 그것이 공개되지 않기를 바라신다면, 저희에게 알려 주십시오.',
	'colophon.contactTitle': '연락',
	'colophon.contactBody': '위의 사항을 포함하여 무엇이든:',
	'colophon.contactPending':
		'연락처가 아직 마련되지 않았습니다. 연락처가 생기기 전에는 이 사이트를 공개해서는 안 됩니다 — 위의 약속은 저희에게 닿을 방법이 없다면 아무런 의미가 없습니다.',
	'colophon.illustrationsTitle': '삽화',
	'colophon.illustrationsBody':
		'성경에는 귀스타브 도레의 판화가 실려 있으며, 각각 그것이 묘사하는 절에 놓였습니다 — 그의 성경 연작 가운데 마지막이자 가장 큰 것으로, 그의 그림을 따라 나무에 새겨 뒤에 모아 두지 않고 본문과 함께 인쇄되었습니다.',
	'colophon.illustrationsRights':
		'아래의 연도가 보여 주듯 이것들은 퍼블릭 도메인에 있으며, 퍼블릭 도메인 판화를 충실히 사진으로 복제한 것은 그 자체로 새로운 저작권을 갖지 않습니다.',
	'colophon.countPlates': '점의 판화',
	'colophon.countPlateChapters': '개 장에 삽화',
	'colophon.typeTitle': '활자',
	'colophon.typeBody':
		'클로드 가라몽이 1590년대에 새긴 활자를 게오르크 두프너와 옥타비오 파르도가 되살린 EB Garamond로 조판했습니다 — 교회가 르네상스 이래로 인쇄해 온 인문주의 전통입니다. 그 키릴 문자는 같은 손에서 나왔으나 되살린 것은 없습니다: 키릴 가라몽은 한 번도 새겨진 적이 없어, 러시아어는 나머지 곁에 서도록 그려진 형태로 조판되었습니다.',
	'colophon.typeArabic':
		'아랍어는 그 범위를 온전히 벗어나며 Amiri로 조판했습니다 — 1905년 카이로의 불라크 인쇄소를 위해 새겨진 나스흐체를 할레드 호스니가 되살린 것으로, 본문 활자와 같은 이유로 골랐습니다: 오늘날의 도안이 아니라 특정한 역사적 책 활자라는 이유입니다.',
	'colophon.typeInitials':
		'첫머리 장식 글자는 Pirata One으로, 큰 첫 글자가 요구하는 크기에서도 대문자가 읽히는 고딕 활자이며 — 러시아어의 경우 — 시노드 인쇄소의 교회 슬라브 활자를 재현한 Ponomar입니다. Ponomar는 첫 글자만 조판하며 결코 본문을 조판하지 않습니다: 현대의 회칙을 처음부터 끝까지 시노드 활자로 조판한다면 그것이 무엇인지에 대해 참되지 않은 무언가를 말하게 될 것입니다. 모두 SIL Open Font License에 따라 사용이 허가되었고 제삼자가 아니라 이 사이트에서 제공되므로, 한 페이지를 읽는 데 다른 이의 서버에 아무것도 요구하지 않습니다.'
};
