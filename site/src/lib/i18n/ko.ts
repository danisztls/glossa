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
 * `site/docs/colophon.md`. The confidence note below governs
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
 * THE READER-FACING CONTROLS ARRIVED 2026-09-06 -- the jump box, settings,
 * dark mode, text size, the edition and language pickers, chapter navigation
 * and bookmarks. This file was the shelf titles and the colophon until then,
 * so its reader met their own language around an English interface. Same
 * caveat as everything above: not read by a native speaker.
 *
 * THE CALENDAR ARRIVED 2026-09-06, in two passes on one day -- the 44
 * `calendar.*` keys `/calendarium` labels itself with, its seasons, ranks and
 * colours among them, and then the 31 that TEACH those words
 * (`calendar.gloss.*`, `calendar.primer.*`). Those 31 are prose rather than
 * labels and are what held the page out of `CHROME_PATHS`: both keys
 * `CHROME_KEYS` reads are labels, so the coded gate would have opened on a
 * page whose whole primer was English. Same caveat as everything above.
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
	'reading.continue': '이어서 읽기',
	'home.tagline':
		'성경과 교리서와 교도권 문헌을 읽기 위한 사이트 — 무료이고, 연결이 끊겨도 작동하며, 가입할 것이 없습니다.',
	'home.doors.heading': '어디로 갈까요',
	'home.find.heading': '또는 인용을 입력하십시오',
	'nav.library': '서고',
	'nav.learn': '배우기',
	'library.landing.tagline': '전체 장서를 서가별로 — 읽던 자리와 표시해 둔 곳과 함께.',
	'schola.landing.title': '어디서부터 시작할까',
	'schola.landing.tagline':
		'여기 있는 것들에 대한 짧은 안내입니다. 이 책들이 각각 무엇인지, 그 인용을 어떻게 적는지, 어떤 대목을 어떻게 찾는지, 그리고 교회가 제시한 읽기 순서.',
	'schola.start.heading': '이 모든 것이 처음이시라면',
	'schola.start.body': '이렇게 시작하십시오: ',
	'schola.start.bodyAfter':
		'. 교리서와 같은 가르침을 훨씬 짧게, 묻고 답하는 형식으로 담았습니다. 분량은 십분의 일쯤이며, 아무것도 미리 전제하지 않습니다.',
	'schola.bible.heading': '성경을 한 번도 읽어 보지 않으셨다면',
	'schola.bible.library':
		'한 권이 아니라 일흔세 권입니다. 천 년이 넘는 세월에 걸쳐 쓰였고, 교회가 정한 순서대로 묶였습니다 — 일이 일어난 순서도 아니고, 읽기에 가장 쉬운 순서도 아닙니다. 대개는 첫 쪽부터 시작했다가 몇 주 뒤, 옛 율법의 긴 장 어딘가에서 그만둡니다. 그것이 무엇을 위한 것인지 아직 아무도 말해 주지 않았기 때문입니다.',
	'schola.bible.step.gospel': '복음서 하나로 시작하십시오',
	'schola.bible.start':
		'예수님의 생애를 다룬 네 권의 짧은 책 가운데 하나로, 맨 앞이 아니라 한참 안쪽에 있습니다. 저희 생각이 아닙니다. 교회의 한 공의회는 성경을 올바로 사용하도록 가르치기를 청하면서 「특히 신약을, 그중에서도 무엇보다 복음서를」이라고 했습니다. 어느 하나를 지목하지는 않았고, 저희도 지목하지 않겠습니다.',
	'schola.bible.whichGospel':
		'세 가지가 흔히 권해지는데, 이유는 저마다 다릅니다. 어느 것이든 머무르기에 좋은 자리입니다.',
	'schola.bible.gospel.mark':
		'가장 짧습니다. 한나절이면 다 읽을 수 있고, 처음에는 가장 좋은 것을 고르는 일보다 하나를 끝까지 읽는 일이 더 값집니다.',
	'schola.bible.gospel.luke':
		'이야기를 차례대로 적어 주기를 바란, 신앙 밖의 어떤 사람을 위해 쓰였습니다 — 바로 당신일 수도 있습니다. 사도행전으로 곧장 이어지므로, 사실은 더 긴 책의 전반부입니다.',
	'schola.bible.gospel.john':
		'왜 쓰였는지를 대놓고 말하는 책입니다. 「너희로 믿게 하려 함이라.」 쉬운 말로, 예수님이 누구신가 하는 물음으로 곧장 들어갑니다.',
	'schola.bible.step.acts': '그다음, 그 뒤에 일어난 일',
	'schola.bible.thenActs':
		'하나를 다 읽으셨거든, 그분이 떠나신 뒤에 그분을 알던 이들이 무엇을 했는지 읽으십시오.',
	'schola.bible.acts.why':
		'복음서가 끝난 뒤의 삼십 년. 겁에 질린 수십 명의 사람들, 그리고 그들이 본 것이 어떻게 제국의 반대편까지 이르렀는가.',
	'schola.bible.step.old': '그다음, 더 오래된 절반',
	'schola.bible.thenOld':
		'첫 쪽부터도 아니고, 전부도 아닙니다. 몇 군데가 이야기를 이끌며, 복음서가 거듭 되짚어 가리키는 곳이 바로 그곳들입니다.',
	'schola.bible.ot.beginnings': '어떻게 시작되며, 어떻게 어긋나는가.',
	'schola.bible.ot.promise': '한 집안, 그리고 그 집안 사람들을 모두 넘어 살아남는 약속.',
	'schola.bible.ot.exodus': '종살이에서 이끌려 나온 백성, 그리고 살아가라고 주어진 법.',
	'schola.bible.ot.psalms':
		'이야기가 아닙니다. 백쉰 편의 기도와 노래입니다. 한 편씩, 어떤 순서로든 읽으십시오. 교회는 오늘도 날마다 이것들을 바칩니다.',
	'schola.bible.bothWays':
		'알아보시는 것들이 있을 텐데, 우연이 아니라 그것이 요점입니다. 교회는 더 오래된 책들을 그리스도의 빛에서, 더 나중의 책들을 앞서 있었던 것의 빛에서 읽습니다 — 두 절반이 서로를 풀이하므로, 어느 쪽도 홀로 읽지 않습니다.',
	'schola.guide.heading': '길 찾기',
	'schola.guide.lede':
		'본문이 곧 쪽 전체입니다. 나머지는 필요해지기 전까지 무시해도 좋은 조작 장치입니다.',
	'schola.guide.top.heading': '모든 쪽 맨 위의 막대',
	'schola.guide.reading.heading': '본문 위의 막대',
	'schola.feature.search':
		'맨 위 칸에 인용을 입력하십시오 — 장과 절, 항 번호, 문헌 이름 — 입력하는 대로 완성됩니다. 어디서든 / 또는 Ctrl+K를, 다른 단축키는 ?를 누르십시오.',
	'schola.feature.languages':
		'화면과 본문은 따로 고릅니다. 그래서 단추는 한 언어로 두고 저작은 다른 언어로 읽으실 수 있습니다. 어떤 저작이 당신의 언어로 여러 판본을 가진 경우에는 그중에서도 고르십니다.',
	'schola.feature.settings':
		'글자 크기, 밝게 또는 어둡게, 세피아, 그리고 본문 곁에 주석을 얼마나 둘지.',
	'schola.feature.offline':
		'이 사이트를 홈 화면에 추가하시면 앱처럼 열립니다. 저작 전체를 내려받아 연결 없이 읽으실 수 있습니다.',
	'schola.feature.contents':
		'지금 계신 저작의 구분 — 권, 부, 장 — 처음으로 돌아가지 않고 그 안에서 옮겨 다니시도록.',
	'schola.feature.compare':
		'같은 대목의 두 판본을 나란히 — 당신의 언어 곁에 라틴어를, 또는 한 번역 곁에 다른 번역을.',
	'schola.feature.apparatus':
		'판본 자체의 각주와 본문에 붙은 어떤 주해든, 아래가 아니라 곁에 놓입니다. 본문 안의 인용은 링크이므로, 가리키는 곳으로 그대로 갑니다.',
	'schola.feature.focus':
		'본문만 남기고 모두 치웁니다. 나가는 길은 막대가 있던 자리에 그대로 있어, 그 뒤에 갇히는 것이 없습니다.',
	'schola.books.heading': '여기 무엇이 있고, 어떻게 인용하는가',
	'schola.books.lede':
		'이들은 저마다 다른 종류의 책이며, 각각 고유한 번호로 가리킵니다. 보기가 그 형태를 알려 줍니다. 비슷하게 검색 칸에 입력하시면 그 대목에 닿습니다.',
	'schola.cite.label': '인용 형식',
	'schola.what.scripture':
		'교회가 받아들이는 그대로의 성경, 두 계약 모두. 여기 있는 나머지 전부는 그 빛에서 읽힙니다.',
	'schola.cite.scripture': '권, 장, 절 — 당신의 판본이 찍는 약호로',
	'schola.what.catechism':
		'가톨릭 교회가 믿는 바를 한 권으로 간추린 책입니다. 그 자체가 원천은 아닙니다. 성경과 교부와 전례와 교회의 가르침을 모으며, 각 항은 자기가 말하는 바가 어디서 왔는지 밝힙니다.',
	'schola.cite.catechism': '항 번호로. 첫 쪽부터 끝 쪽까지 끊기지 않고 이어집니다',
	'schola.what.compendium':
		'같은 가르침을 묻고 답하는 형식으로 펼친 것으로, 분량은 십분의 일쯤입니다.',
	'schola.cite.compendium': '물음 번호로',
	'schola.what.magisterium':
		'교황들과 공의회들이 실제로 쓴 것 — 회칙, 헌장, 교령, 선언 — 각각 특정한 때와 특정한 물음을 향합니다. 각각은 라틴어 첫 낱말들로 불립니다.',
	'schola.cite.magisterium': '문헌 이름으로, 그다음 그 안의 항 번호로',
	'schola.what.social':
		'노동과 소유, 가정, 정치, 평화에 대한 교회의 가르침을 그 문헌들에서 모아 한 권으로 엮은 것.',
	'schola.cite.social': '항 번호로, 그 저작이 스스로에게 쓰는 약호 아래에서',
	'schola.what.law': '교리가 아니라 법입니다. 교회가 무엇을 요구하는지 말하며, 개정됩니다.',
	'schola.cite.law': '조문으로. 번호 매긴 단위를 그렇게 부릅니다',
	'schola.what.doctors':
		'교회가 학자로 선포한 신학자들입니다. 저자가 아무리 위대해도 공적 권위를 지니지는 않습니다.',
	'schola.cite.doctors': '부, 그다음 문제로 — 신학대전 자체의 구분',
	'schola.what.prayers': '교회가 바치는 말들, 곁에 라틴어와 함께.',
	'schola.cite.prayers': '이름으로. 인용할 번호는 없습니다',
	'schola.places.heading': '본문이 아니라, 이 사이트의 자리들',
	'schola.what.library': '이 사이트의 모든 저작을 한 목록에, 종류가 아니라 주제로 묶어 놓았습니다.',
	'schola.what.calendar':
		'전례일 — 시기와 색, 누구를 기리는지 — 당신이 따르는 달력의 나라에 맞추어.',
	'schola.what.bookmarks':
		'표시해 두신 대목들과, 저작마다 마지막으로 멈추신 자리. 둘 다 이 브라우저에 보관되며 어디로도 보내지지 않습니다.',
	'jumpbox.placeholder': '이동… (예: jn 3,16, ccc 1234)',
	'jumpbox.short': '찾기',
	'jumpbox.hint': '/ 또는 Ctrl+K를 누르면 인용으로 이동합니다',
	'jumpbox.noMatch': '결과 없음',
	'jumpbox.suggestions': '추천',
	'settings.label': '설정',
	'darkMode.label': '어두운 모드',
	'darkMode.auto': '자동',
	'darkMode.on': '켬',
	'darkMode.off': '끔',
	'loadFailed.title': '불러오지 못했습니다',
	'loadFailed.hint':
		'쪽은 있습니다 — 가져오는 중에 무언가 잘못되었습니다. 다시 시도하면 대개 됩니다.',
	'loadFailed.retry': '다시 시도',
	'loadFailed.retrying': '시도 중…',
	'fontSize.label': '글자 크기',
	'fontSize.larger': '글자 크게',
	'fontSize.smaller': '글자 작게',
	'print.label': '이 쪽 인쇄',
	'toTop.label': '맨 위로',
	'edition.label': '판본',
	'edition.select': '판본 고르기',
	'edition.current': '현재 판본',
	'edition.filter': '판본 찾기',
	'menu.noMatches': '일치하는 것이 없음',
	'unitNav.previous': '이전',
	'unitNav.next': '다음',
	'bible.prevChapter': '이전 장',
	'bible.nextChapter': '다음 장',
	'bible.pickBook': '책과 장',
	'bible.landing.title': '성경',
	'bible.landing.tagline': '성경 전체를 한 권씩, 한 장씩 읽으십시오.',
	'bible.landing.books': '책',
	'bible.introduction': '머리말',
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
	'ccc.landing.pairTitle': '교리서와 요약본',
	'ccc.landing.tagline':
		'<strong>교리서</strong>는 가톨릭 교리를 번호가 매겨진 2,865개 항으로 제시합니다. <strong>요약</strong>은 같은 교리를 같은 얼개에 따라 598개의 문답으로 다시 제시합니다.',
	'ccc.landing.pairTagline': '가톨릭 교회 교리서 2,865항과, 그 요약본 598문답.',
	'compendium.landing.title': '교리서 요약본',
	'compendium.landing.tagline': '가톨릭 교회 교리서를 간추린 문답.',
	'compendium.question': '물음',
	'compendium.answer': '답',
	'compendium.tableOfContents': '차례',
	'compendium.prevQuestion': '이전 물음',
	'compendium.nextQuestion': '다음 물음',
	'compendium.condenses': '교리서 ¶¶ 간추림',
	'ccc.abbrev': '교리서',
	'compendium.abbrev': '요약',
	'compendium.noQuestionNumber': '이 말뭉치에는 물음 번호가 없습니다',
	'document.library.tagline': '회칙, 공의회 헌장, 교령, 그리고 교도권의 선언.',
	'doctores.landing.title': '교회 학자',
	'doctores.landing.tagline': '교부들과 교회 학자들의 신학 저작.',
	'summa.landing.title': '신학대전',
	'summa.landing.tagline': '토마스 아퀴나스, 영어와 그가 쓴 라틴어로.',
	'index.division': '구분',
	'prayers.landing.title': '일반 기도문',
	'prayers.landing.tagline': '라틴어 본문을 나란히 실은 기도문.',
	'prayers.seeAlso': '함께 보기',
	'anchor.actions': '인용에 대한 동작',
	'anchor.copy': '본문 복사',
	'anchor.copyLink': '링크 복사',
	'anchor.view': '보기',
	'anchor.copied': '복사됨',
	'anchor.copyFailed': '복사하지 못했습니다',
	'bookmark.add': '책갈피',
	'bookmark.remove': '책갈피 없애기',
	'bookmark.library': '책갈피',
	'bookmark.library.tagline': '읽으시면서 표시해 두신 모든 것.',
	'bookmark.empty': '아직 표시한 것이 없습니다.',
	'bookmark.emptyHint':
		'절이나 항의 번호를 누르고 책갈피를 고르시거나, 쪽에 있는 책갈피 단추를 쓰십시오.',
	'bookmark.deviceOnly':
		'책갈피는 이 브라우저에만 보관됩니다. 어디로도 보내지지 않으며, 브라우저 데이터를 지우면 함께 사라집니다.',
	'bookmark.unavailable': '지금 읽으시는 판본에는 없습니다',
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
	'art.about': '이 그림에 대하여',
	'art.detail': '부분',
	'colophon.typeTitle': '활자',
	'colophon.typeBody':
		'클로드 가라몽이 1590년대에 새긴 활자를 게오르크 두프너와 옥타비오 파르도가 되살린 EB Garamond로 조판했습니다 — 교회가 르네상스 이래로 인쇄해 온 인문주의 전통입니다. 그 키릴 문자는 같은 손에서 나왔으나 되살린 것은 없습니다: 키릴 가라몽은 한 번도 새겨진 적이 없어, 러시아어는 나머지 곁에 서도록 그려진 형태로 조판되었습니다.',
	'colophon.typeArabic':
		'아랍어는 그 범위를 온전히 벗어나며 Amiri로 조판했습니다 — 1905년 카이로의 불라크 인쇄소를 위해 새겨진 나스흐체를 할레드 호스니가 되살린 것으로, 본문 활자와 같은 이유로 골랐습니다: 오늘날의 도안이 아니라 특정한 역사적 책 활자라는 이유입니다.',
	'colophon.typeInitials':
		'첫머리 장식 글자는 Pirata One으로, 큰 첫 글자가 요구하는 크기에서도 대문자가 읽히는 고딕 활자이며 — 러시아어의 경우 — 시노드 인쇄소의 교회 슬라브 활자를 재현한 Ponomar입니다. Ponomar는 첫 글자만 조판하며 결코 본문을 조판하지 않습니다: 현대의 회칙을 처음부터 끝까지 시노드 활자로 조판한다면 그것이 무엇인지에 대해 참되지 않은 무언가를 말하게 될 것입니다. 모두 SIL Open Font License에 따라 사용이 허가되었고 제삼자가 아니라 이 사이트에서 제공되므로, 한 페이지를 읽는 데 다른 이의 서버에 아무것도 요구하지 않습니다.',
	'copyright.sourceTitle': '원래 출처 쪽 열기',
	'copyright.sourceLabel': '출처',
	'lang.label': '언어',
	'lang.filter': '언어 찾기',
	'lang.more': '다른 언어',
	'calendar.title': '전례력',
	'calendar.tagline': '로마 일반 전례력을 어느 날짜로든 계산합니다 — 그날의 시기, 등급, 색깔.',
	'calendar.date': '날짜',
	'calendar.calendar': '달력',
	'calendar.which.general': '로마 일반 전례력',
	'calendar.filter': '나라 검색',
	'calendar.region.europe': '유럽',
	'calendar.region.americas': '아메리카',
	'calendar.region.africa': '아프리카',
	'calendar.region.middleEast': '중동',
	'calendar.region.asia': '아시아',
	'calendar.region.oceania': '오세아니아',
	'calendar.today': '오늘',
	'calendar.previousMonth': '지난달',
	'calendar.nextMonth': '다음 달',
	'calendar.noSuchDay': '그 날짜로는 전례일이 계산되지 않습니다.',
	// `LiturgicalDayCard` prints this word and THEN the number, so it is the
	// bare noun rather than the 제…주간 the ordinal would take in running text.
	'calendar.week': '주간',
	'calendar.alsoToday': '오늘 함께 지내는 축일',
	'calendar.alsoObserved': '오늘 함께 기념하는 날',
	'calendar.obligation': '의무 축일',
	'calendar.obligationCanon': 'CIC 제1246조',
	'calendar.sundayCycle': '주일 주기',
	'calendar.weekdayCycle': '평일 주기',
	'calendar.psalterWeek': '시편 주간',
	'calendar.transferredFrom': '옮겨온 날짜',
	'calendar.season.advent': '대림 시기',
	'calendar.season.christmas': '성탄 시기',
	'calendar.season.lent': '사순 시기',
	'calendar.season.triduum': '파스카 성삼일',
	'calendar.season.easter': '부활 시기',
	'calendar.season.ordinary': '연중 시기',
	'calendar.colour.white': '흰색',
	'calendar.colour.red': '붉은색',
	'calendar.colour.green': '초록색',
	'calendar.colour.violet': '자주색',
	'calendar.colour.rose': '장미색',
	'calendar.colour.black': '검은색',
	'calendar.colour.blue': '푸른색',
	'calendar.rank.solemnity': '대축일',
	'calendar.rank.feast': '축일',
	'calendar.rank.memorial': '기념일',
	'calendar.rank.optional-memorial': '자유 기념일',
	'calendar.rank.commemoration': '기념',
	'calendar.rank.sunday': '주일',
	'calendar.rank.weekday': '평일',
	'calendar.gloss.season.advent':
		'성탄 전 네 주간. 주님의 오심을 준비하는 때이며, 교회 전례력의 시작입니다.',
	'calendar.gloss.season.christmas':
		'성탄부터 주님 세례 축일까지, 주님의 탄생과 세상에 드러나심을 기념합니다.',
	'calendar.gloss.season.lent':
		'재의 수요일부터 주님 만찬 저녁 미사까지의 사십 일. 참회와 자선, 그리고 부활을 향한 준비의 때입니다.',
	'calendar.gloss.season.triduum':
		'성목요일 저녁부터 부활 주일 저녁까지의 사흘 — 주님의 수난과 죽음과 부활이며, 한 해 전체의 정점입니다.',
	'calendar.gloss.season.easter':
		'부활부터 성령 강림까지의 오십 일. 하나의 축제로 지내며 — „하나의 큰 주일“이라 불립니다.',
	'calendar.gloss.season.ordinary':
		'다른 시기 밖의 서른세 주간 또는 서른네 주간. „평범한“ 때가 아니라 차례가 매겨진 때입니다. 주간마다 번호가 붙고, 교회는 주님의 생애와 가르침을 차례로 읽어 나갑니다. 두 토막으로 나뉘어 옵니다 — 성탄 시기 뒤부터 사순 시기까지, 그리고 성령 강림 뒤부터 대림 시기까지.',
	'calendar.gloss.rank.solemnity':
		'가장 높은 등급. 부활, 성탄, 주님 승천, 그 지역의 수호 성인 등입니다. 대영광송과 신경을 바치며, 전날 저녁부터 시작합니다.',
	'calendar.gloss.rank.feast':
		'그날 안에서 지냅니다. 사도와 복음사가, 그리고 주님과 성모님의 더 큰 날들입니다.',
	'calendar.gloss.rank.memorial':
		'성인을 그분의 날에 기억하며, 그 시기의 미사와 시간 전례 안에서 지냅니다. 지내는 곳에서는 의무입니다.',
	'calendar.gloss.rank.optional-memorial':
		'사제나 공동체의 선택에 따라 지낼 수도, 지내지 않을 수도 있습니다. 지내지 않으면 그날은 그냥 평일입니다.',
	'calendar.gloss.rank.commemoration':
		'사순 시기에 기념일이 되는 모습입니다. 평일 미사에 기도 하나를 덧붙이는 것으로, 나머지는 그 시기가 그대로 지킵니다.',
	'calendar.gloss.rank.sunday':
		'가장 처음의 축일 — 주님의 날이며, 부활 이래 매주 지내 왔습니다. 대축일이나 주님의 축일만이 이를 대신할 수 있고, 대림·사순·부활 시기에는 그것들조차 대신할 수 없습니다.',
	'calendar.gloss.rank.weekday':
		'고유한 경축이 없는 날. 미사와 시간 전례는 그 시기의 것이며 — 바로 그 때문에 시기를 아는 것이 값집니다.',
	'calendar.gloss.colour.white':
		'기쁨. 부활 시기와 성탄 시기, 수난을 제외한 주님의 날들, 성모님, 천사들, 그리고 순교자가 아닌 성인들입니다.',
	'calendar.gloss.colour.red':
		'피와 불. 주님 수난 성지 주일과 성금요일, 성령 강림, 사도와 복음사가, 그리고 순교자들입니다.',
	'calendar.gloss.colour.green': '연중 시기. 희망의 빛깔이며, 자라나는 것들의 빛깔입니다.',
	'calendar.gloss.colour.violet': '대림 시기와 사순 시기, 그리고 위령 미사에서도 입습니다.',
	'calendar.gloss.colour.rose':
		'한 해에 두 번 입습니다 — 대림 제3주일인 가우데테 주일과 사순 제4주일인 라에타레 주일. 재계가 누그러지고 끝이 보이는 날들입니다.',
	'calendar.gloss.colour.black': '위령 미사에서 입을 수 있습니다.',
	'calendar.gloss.colour.blue':
		'푸른색의 특전. 스페인과 필리핀, 그리고 성좌가 이를 허락한 소수의 지역에서 원죄 없이 잉태되신 동정 마리아 대축일에 입습니다.',
	'calendar.gloss.sundayCycle':
		'주일 독서는 세 해에 걸쳐 — 가해, 나해, 다해 — 마태오, 마르코, 루카를 차례로 읽고, 사순과 부활 시기에는 요한을 읽습니다. 주기는 교회 전례력과 함께 대림 제1주일에 바뀝니다.',
	'calendar.gloss.weekdayCycle':
		'평일 독서는 두 해에 걸쳐 홀수해와 짝수해로 나뉩니다. 제1독서는 바뀌고 복음은 바뀌지 않습니다. 전례력의 해는 그 해가 끝나는 서기 연도로 부르며 — 홀수 해가 홀수해, 짝수 해가 짝수해입니다.',
	'calendar.gloss.psalterWeek':
		'시간 전례는 시편을 네 주간, 제1주간부터 제4주간까지로 나누어 한 해 동안 되풀이합니다. 오늘의 시편이 어느 주간의 것인지를 알려 주며, 시간 전례를 바치는 이를 위한 것입니다.',
	'calendar.gloss.obligation':
		'신자들이 미사에 참여하고 이를 방해하는 노동을 삼갈 의무가 있는 날입니다. 모든 주일과, 각 주교회의가 정한 그 밖의 날들입니다.',
	'calendar.primer.title': '처음이신가요?',
	'calendar.primer.lead':
		'교회는 고유한 한 해를 지냅니다. 대림 시기에 시작하여 부활을 중심으로 돌며, 하루하루에 이름과 등급과 빛깔을 줍니다 — 그리고 그것들이 그날 미사와 시간 전례에서 무엇을 기도하고 읽을지를 정합니다. 그러므로 „연중 제23주일“은 하나의 주소입니다. 사제에게, 성가대에게, 집에서 기도하는 이에게 오늘에 속한 기도와 독서가 무엇인지를 알려 줍니다.',
	'calendar.primer.seasons': '전례 시기',
	'calendar.primer.ranks': '하루가 될 수 있는 것',
	'calendar.primer.colours': '빛깔',
	'calendar.primer.cycles': '주기',
	'calendar.primer.cyclesLead':
		'세 가지 셈이 함께 오늘에 정해진 독서와 시편이 무엇인지를 알려 줍니다.'
};
