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
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` (the canonical standing statement, Can. 216
 * CIC) and `colophon.copyrightBody3` (how a rights holder reaches us) are the
 * two to check first: both are operative rather than descriptive.
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

export const zh: Dictionary = {
	'nav.bible': '圣经',
	'nav.ccc': '教理',
	'nav.compendium': '简编',
	'nav.magisterium': '训导权',
	'nav.socialDoctrine': '社会训导',
	'socialDoctrine.landing.title': '教会社会训导汇编',
	'socialDoctrine.landing.tagline': '教会关于社会生活的训导，共583个编号段落。',
	'socialDoctrine.backMatter': '前置内容与索引',
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
	'colophon.lede': '本站是什么，文本从何而来，以及我们对复制这些文本的立场。',
	'colophon.whatThisIs': '本站是什麼',
	'colophon.whatThisIsBody':
		'Glossa Catholica 是閱讀聖經、《天主教教理》、《教理簡編》及訓導文獻的網站，備有英文、葡文與拉丁文。它為被閱讀而存在，除此之外不向您索求任何東西：',
	'colophon.pointFree': '免費，且永遠免費。沒有付費牆，沒有訂閱，沒有任何東西出售。',
	'colophon.pointNoAds': '沒有廣告，也沒有任何形式的贊助置入。',
	'colophon.pointNoAccounts': '沒有帳戶。無須註冊，無須登入。',
	'colophon.pointNoTracking':
		'沒有追蹤指令碼，沒有第三方程式碼，沒有 cookie。僅有匿名的使用次數統計，不含任何足以辨識您的資料。',
	'colophon.pointOffline': '設計為在您造訪過之後仍能離線運作，使不良的連線不致成為閱讀的障礙。',
	'colophon.whatThisIsStanding':
		'Glossa Catholica 是平信徒的私人事業。它未獲任何教會批准，也不以自身的任何權威發言。',
	'colophon.textsTitle': '文本',
	'colophon.textsBody':
		'每一份文本都出自具名的來源，每一部作品都記載其版本、來源頁面與取得的日期。聖經採用公有領域的譯本；《天主教教理》、《教理簡編》與訓導文獻均出自聖座自己刊行的文本。',
	'colophon.textsFidelity':
		'文本從不刪節、從不意譯、從不改寫，也從不與廣告並陳。我們確實修補明顯的瑕疵——脫落的字、殘缺的引註、吞沒整段的標記——一律朝著來源自身所印的樣子，絕不朝著我們認為它該說的樣子。',
	'colophon.countBible': '種聖經版本',
	'colophon.countDocuments': '份訓導文獻',
	'colophon.copyrightTitle': '版權',
	'colophon.copyrightBody1':
		'《天主教教理》、《教理簡編》與訓導文獻屬於其權利人所有——主要是梵蒂岡書局（Libreria Editrice Vaticana）與傳播部。',
	'colophon.copyrightBody2': '每一部作品都以權利人自己的措辭顯示其版權聲明，並連結至取用的頁面。',
	'colophon.copyrightBody3': '若您擁有此處任何文本的權利，而寧願它不被刊出，請寫信給我們。',
	'colophon.contactTitle': '聯絡',
	'colophon.contactBody': '任何事情皆可，包括上述事項：',
	'colophon.contactPending':
		'尚未設定聯絡地址。在具備聯絡方式之前，本站不應公開——若無管道可以聯繫我們，上述承諾便毫無意義。',
	'colophon.illustrationsTitle': '插圖',
	'colophon.illustrationsBody':
		'聖經載有古斯塔夫·多雷的版畫，每一幅都置於其所描繪的那一節旁——這是他聖經系列中最後也最龐大的一套，依他的素描刻於木板，與正文一同印出，而非集中置於卷末。',
	'colophon.illustrationsRights':
		'如下方年份所示，它們皆屬公有領域；忠實拍攝公有領域版畫所得的複製品，本身不產生新的版權。',
	'colophon.countPlates': '幅版畫',
	'colophon.countPlateChapters': '章附有插圖',
	'colophon.typeTitle': '字體',
	'colophon.typeBody':
		'以 EB Garamond 排印，這是 Georg Duffner 與 Octavio Pardo 對克洛德·加拉蒙於一五九〇年代所刻字體的復刻——教會自文藝復興以來即以此人文主義傳統付印。其西里爾字母出自同一雙手，卻未復刻任何東西：從未有人刻過西里爾文的加拉蒙體，因此俄文所用的是為與其餘字體並立而繪的形體。',
	'colophon.typeArabic':
		'阿拉伯文全然超出其範圍，改以 Amiri 排印——這是 Khaled Hosny 對一九〇五年為開羅布拉克印刷所所刻納斯赫體的復刻，選用的理由與正文字體相同：取一種特定的歷史書籍字體，而非當代的新繪。',
	'colophon.typeInitials':
		'開頭的首字母為 Pirata One，一種哥德體，其大寫字母在首字母所需的尺寸下仍然易讀；俄文則用 Ponomar，重現聖議會印刷所的教會斯拉夫字體。Ponomar 只排首字母，絕不排正文：一份現代通諭若通篇以聖議會字體排印，便會就其本質說出不實之言。以上皆依 SIL Open Font License 授權，並自本站提供而非取自第三方，因此閱讀一個頁面不向他人的伺服器索求任何東西。'
};
