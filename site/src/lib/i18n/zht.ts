/**
 * 繁體中文 UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-09-04, with the other content languages that had no interface.
 * The corpus holds `prayer.common.zht` — the curated prayers as Vatican News
 * publishes them in Traditional Chinese — and its readers were reading them
 * inside English chrome, which is the combination `../ui-langs.ts` says the
 * interface list should never leave standing.
 *
 * THE TAG IS `zht` AND THE `lang` ATTRIBUTE IS `zh-Hant`, and the split is
 * deliberate: `zht` is Vatican News's own spelling, which the corpus is keyed
 * on, and `bcp47` in `../ui-langs.ts` converts it at the four points where a
 * tag leaves the app for a machine to read. `direction.css` therefore matches
 * `:lang(zh-Hant)` — and must sit after `:lang(zh)`, which also matches it.
 *
 * THE SIBLING FILE IS `zh.ts` AND THE TWO ARE NOT INTERCHANGEABLE. Simplified
 * and Traditional differ in most of the characters here, and a reader of
 * either can tell at a glance which they have been given. `zh.ts` had drifted
 * into Traditional across the whole colophon and the canon-law block when this
 * file was written, which is the clearest possible argument that the two want
 * separate files rather than one and a converter.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop, in the vocabulary the Church in Taiwan and Hong Kong prints
 * (梅瑟五書, 宗徒大事錄, 保祿書信 — the Catholic renderings, not the
 * Protestant ones). `colophon.whatThisIsStanding` and `footer.notEndorsed`
 * (the canonical standing statement, Can. 216 CIC, at full length and in the
 * one line the footer of every page carries) and `colophon.copyrightBody3`
 * (how a rights holder reaches us) are the ones to check first: all three are
 * operative rather than descriptive. Deleting a doubtful line is a valid fix —
 * English fills the gap per key.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const zht: Dictionary = {
	'nav.bible': '聖經',
	'nav.ccc': '教理',
	'nav.compendium': '簡編',
	'nav.magisterium': '訓導權',
	'nav.socialDoctrine': '社會訓導',
	'socialDoctrine.landing.title': '教會社會訓導彙編',
	'socialDoctrine.landing.tagline': '教會關於社會生活的訓導，共583個編號段落。',
	'nav.canonLaw': '教會法',
	'canonLaw.landing.title': '天主教法典',
	'canonLaw.landing.tagline': '拉丁教會的法律，共一千七百五十二條，分為七卷。',
	'canonLaw.canon': '第',
	'canonLaw.canons': '第',
	'canonLaw.prevCanon': '上一條',
	'canonLaw.nextCanon': '下一條',
	'canonLaw.readFullTitle': '閱讀整篇',
	'canonLaw.superseded': '被取代的條文，依據',
	'nav.prayers': '祈禱經文',
	'nav.bookmarks': '書籤',
	'nav.menu': '選單',
	'nav.summa': '神學大全',
	'home.title': 'Glossa Catholica',
	'home.continueReading': '繼續閱讀',
	'home.works': '書庫',
	'home.ccc.heading': '教理與簡編',
	'home.magisterium.mostRecent': '最新',
	'home.prayers.heading': '祈禱經文',
	'unitNav.previous': '上一個',
	'unitNav.next': '下一個',
	'bible.landing.title': '聖經',
	'bible.landing.tagline': '通讀全部聖經，一卷一卷，一章一章。',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': '梅瑟五書',
	'bible.group.historical': '歷史書',
	'bible.group.wisdom': '智慧書',
	'bible.group.prophetic': '先知書',
	'bible.group.gospels': '福音',
	'bible.group.acts': '宗徒大事錄',
	'bible.group.pauline': '保祿書信',
	'bible.group.catholicLetters': '公函',
	'bible.group.revelation': '默示錄',
	'ccc.landing.title': '天主教教理',
	'ccc.landing.tagline':
		'<strong>《教理》</strong>以 2,865 個編號段落闡述天主教教義。<strong>《簡編》</strong>依同一綱目，以 598 個問答重述同一教義。',
	'document.library.tagline': '通諭、大公會議憲章、法令，以及訓導權的宣言。',
	'doctores.landing.title': '教會聖師',
	'doctores.landing.tagline': '教會教父與聖師的神學著作。',
	'summa.landing.title': '神學大全',
	'summa.landing.tagline': '多瑪斯·阿奎那，英文本與他所寫的拉丁文本。',
	'prayers.landing.title': '常用祈禱經文',
	'prayers.landing.tagline': '祈禱經文並列拉丁文本。',
	'colophon.title': '版本說明',
	'colophon.lede': '本站是什麼，文本從何而來，以及我們對複製這些文本的立場。',
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
	'footer.notEndorsed': '未獲聖座認可',
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
