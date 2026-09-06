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
 * THE READER-FACING CONTROLS ARRIVED 2026-09-06 -- the jump box, settings,
 * dark mode, text size, the edition and language pickers, chapter navigation
 * and bookmarks. This file was the shelf titles and the colophon until then,
 * so its reader met their own language around an English interface. Same
 * caveat as everything above: not read by a native speaker.
 *
 * THE CALENDAR'S CONTROLS ARRIVED 2026-09-06 -- the 44 `calendar.*` keys
 * `/calendarium` labels itself with, its seasons, ranks and colours among
 * them. The 31 that TEACH those words (`calendar.gloss.*`,
 * `calendar.primer.*`) are prose rather than labels and are left to English
 * for now, by direction; the page stays unpublished until they are written.
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
	'reading.continue': '繼續閱讀',
	'home.tagline':
		'閱讀聖經、《天主教教理》及訓導文獻的網站——免費，離線亦可使用，無須註冊任何東西。',
	'home.doors.heading': '何處可去',
	'home.find.heading': '或鍵入一處引文',
	'nav.library': '書庫',
	'nav.learn': '學習',
	'library.landing.tagline': '全部書目，一架一架——連同你讀到的地方和你標記的內容。',
	'schola.landing.title': '從何處入手',
	'schola.landing.tagline':
		'對此處所有內容的簡要指引：這些書各是什麼，其引文如何書寫，如何找到一處經文，以及教會所提出的閱讀次第。',
	'schola.start.heading': '若這一切對您都是新的',
	'schola.start.body': '最好的起點是',
	'schola.start.bodyAfter':
		'：與《天主教教理》相同的道理，篇幅短得多，以問答寫成。約為其十分之一長，且不預設任何前提。',
	'schola.bible.heading': '若您從未讀過聖經',
	'schola.bible.library':
		'它不是一部書，而是七十三部，寫成於一千多年之間，依教會所定的次序編在一起——不是事情發生的次序，也不是最易閱讀的次序。多數人從第一頁開始，幾週後便停在古代律法的某個長章裡，因為還沒有人告訴他們這是為了什麼。',
	'schola.bible.step.gospel': '從一部福音開始',
	'schola.bible.start':
		'關於耶穌生平的四部短書之一，位置頗靠裡，而非在最前。這並非我們的主意：教會的一次大公會議要求教導正確使用聖經，「尤其是新約，而首要的是福音」。它沒有單獨指名哪一部，我們也不指名。',
	'schola.bible.whichGospel': '通常推薦三部，各有不同的理由。其中任何一部都是好的所在。',
	'schola.bible.gospel.mark':
		'最短的一部。一個下午即可讀完，而在起頭，讀完一部比選中最好的一部更有價值。',
	'schola.bible.gospel.luke':
		'為一位信仰之外、想要把事情按次序記下來的人而寫——那也許正是您。它徑直接入宗徒大事錄，所以實際上是一部更長的書的前半。',
	'schola.bible.gospel.john':
		'直言其寫作緣由的一部：「為叫你們信」。文辭平易，直趨耶穌是誰這一問題。',
	'schola.bible.step.acts': '然後是此後所發生的事',
	'schola.bible.thenActs': '讀完一部之後，再讀那些認識他的人在他離去以後做了什麼。',
	'schola.bible.acts.why':
		'福音結束後的三十年：數十個驚惶的人，以及他們所見之事如何傳到帝國的另一端。',
	'schola.bible.step.old': '然後是更古的那一半',
	'schola.bible.thenOld':
		'不從第一頁起，也不必全讀。有幾處承載著這個故事，正是福音一再回指的地方。',
	'schola.bible.ot.beginnings': '起初如何，又如何敗壞。',
	'schola.bible.ot.promise': '一個家族，以及向它所許的、比其中所有人都長久的應許。',
	'schola.bible.ot.exodus': '一個民族被領出為奴之地，並領受了賴以生活的法律。',
	'schola.bible.ot.psalms':
		'不是故事：一百五十篇祈禱與歌詠。一次讀一篇，次序不拘。教會至今每日仍以此祈禱。',
	'schola.bible.bothWays':
		'您會認出一些東西，這正是用意所在，而非巧合。教會在基督的光中讀較古的書卷，又在此前所有的光中讀較新的書卷——兩半彼此解釋，因此沒有一半是獨自閱讀的。',
	'schola.guide.heading': '如何找到方向',
	'schola.guide.lede': '正文即是整頁；其餘一切都是控制項，在您想用之前盡可不理。',
	'schola.guide.top.heading': '每頁頂端的列',
	'schola.guide.reading.heading': '正文上方的列',
	'schola.feature.search':
		'在頂端的框中鍵入一處引文——章與節、條目編號、某份文獻的名稱——它會隨打隨補全。在任何地方按 / 或 Ctrl+K，按 ? 可見其餘快捷鍵。',
	'schola.feature.languages':
		'介面與正文分別選擇，因此您可用一種語言閱讀作品，而按鈕仍留在另一種語言。若某作品在您的語言中有數個版本，您也可在其間選擇。',
	'schola.feature.settings': '字級，淺色或深色，棕褐色，以及您希望在正文旁保留多少註釋。',
	'schola.feature.offline':
		'把本站加到主畫面，它便如應用程式一般開啟。您可下載整部作品，在沒有連線時閱讀。',
	'schola.feature.contents': '您所在作品的分部——卷、部、章——以便在其中移動而不必回到開頭。',
	'schola.feature.compare':
		'同一處經文的兩個版本並列——拉丁文與您自己的語言並列，或一種譯本與另一種並列。',
	'schola.feature.apparatus':
		'版本自身的註釋，以及為正文所寫的任何註解，都置於正文之旁而非其下。正文之內的引證是連結，因此引文所指即所至。',
	'schola.feature.focus': '清去正文以外的一切。出口仍留在列原本的位置，使一切不致被關在其後。',
	'schola.books.heading': '此處有什麼，以及如何引用',
	'schola.books.lede':
		'這些各是不同種類的書，各以自己的編號被引用。示例顯示其形式：照樣在搜尋框中鍵入，便可抵達那一處。',
	'schola.cite.label': '引用作',
	'schola.what.scripture': '教會所領受的聖經，包括新舊兩約。此處其餘一切都在其光中閱讀。',
	'schola.cite.scripture': '書卷、章與節，用您自己的版本所印的簡稱',
	'schola.what.catechism':
		'天主教會所信的撮要，合為一冊。它本身不是源頭：它匯集聖經、教父、禮儀與教會的訓導，而每一條都指明其所言出自何處。',
	'schola.cite.catechism': '按條目編號，自首頁至末頁連續不斷',
	'schola.what.compendium': '同一道理以問答陳述，篇幅約為十分之一。',
	'schola.cite.compendium': '按問題編號',
	'schola.what.magisterium':
		'教宗與大公會議實際所寫的——通諭、憲章、法令、宣言——各自針對特定的時刻與特定的問題。每一份都以其拉丁文起首之語為名。',
	'schola.cite.magisterium': '按文獻名稱，再按其中的節次編號',
	'schola.what.social': '教會關於勞動、財產、家庭、政治與和平的訓導，自那些文獻中輯成一書。',
	'schola.cite.social': '按條目編號，並冠以該書自用的簡稱',
	'schola.what.law': '是法律而非教義。它規定教會所要求的，並且會被修訂。',
	'schola.cite.law': '按條，此即其編號單位之名',
	'schola.what.doctors': '教會所冊封為聖師的神學家。無論作者何等偉大，這都不具官方權威。',
	'schola.cite.doctors': '按部，再按題——《神學大全》自身的分法',
	'schola.what.prayers': '教會所祈禱的言辭，旁附拉丁文。',
	'schola.cite.prayers': '按名稱；無編號可引',
	'schola.places.heading': '不是文本，而是本站的去處',
	'schola.what.library': '本站所有作品彙為一表，按主題而非按種類分組。',
	'schola.what.calendar': '禮儀日——節期、顏色與所紀念者——依您所遵循之國家的日曆。',
	'schola.what.bookmarks':
		'您所標記的經文，以及您在每部作品中上次讀到之處。二者都保存在此瀏覽器中，不發往任何地方。',
	'jumpbox.placeholder': '前往…（例：若 3:16、ccc 1234）',
	'jumpbox.short': '搜尋',
	'jumpbox.hint': '按 / 或 Ctrl+K 跳至引處',
	'jumpbox.noMatch': '無相符者',
	'jumpbox.suggestions': '建議',
	'settings.label': '設定',
	'darkMode.label': '深色模式',
	'darkMode.auto': '自動',
	'darkMode.on': '開',
	'darkMode.off': '關',
	'loadFailed.title': '這未能載入',
	'loadFailed.hint': '該頁面是存在的——只是取回時出了差錯。再試一次通常即可。',
	'loadFailed.retry': '再試一次',
	'loadFailed.retrying': '正在嘗試…',
	'fontSize.label': '字級',
	'fontSize.larger': '更大的字',
	'fontSize.smaller': '更小的字',
	'print.label': '列印本頁',
	'toTop.label': '回到頂端',
	'edition.label': '版本',
	'edition.select': '選擇版本',
	'edition.current': '目前版本',
	'edition.filter': '搜尋版本',
	'menu.noMatches': '無相符項',
	'unitNav.previous': '上一個',
	'unitNav.next': '下一個',
	'bible.prevChapter': '上一章',
	'bible.nextChapter': '下一章',
	'bible.pickBook': '書卷與章',
	'bible.landing.title': '聖經',
	'bible.landing.tagline': '通讀全部聖經，一卷一卷，一章一章。',
	'bible.landing.books': '書卷',
	'bible.introduction': '導言',
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
	'ccc.landing.pairTitle': '教理與簡編',
	'ccc.landing.tagline':
		'<strong>《教理》</strong>以 2,865 個編號段落闡述天主教教義。<strong>《簡編》</strong>依同一綱目，以 598 個問答重述同一教義。',
	'ccc.landing.pairTagline': '《天主教教理》共 2,865 條，其《簡編》共 598 問。',
	'compendium.landing.title': '教理簡編',
	'compendium.landing.tagline': '以問答方式撮述《天主教教理》。',
	'compendium.question': '問',
	'compendium.answer': '答',
	'compendium.tableOfContents': '目錄',
	'compendium.prevQuestion': '上一問',
	'compendium.nextQuestion': '下一問',
	'compendium.condenses': '撮述教理 ¶¶',
	'ccc.abbrev': '教理',
	'compendium.abbrev': '簡編',
	'compendium.noQuestionNumber': '此文庫中沒有問題編號',
	'document.library.tagline': '通諭、大公會議憲章、法令，以及訓導權的宣言。',
	'doctores.landing.title': '教會聖師',
	'doctores.landing.tagline': '教會教父與聖師的神學著作。',
	'summa.landing.title': '神學大全',
	'summa.landing.tagline': '多瑪斯·阿奎那，英文本與他所寫的拉丁文本。',
	'index.division': '分部',
	'prayers.landing.title': '常用祈禱經文',
	'prayers.landing.tagline': '祈禱經文並列拉丁文本。',
	'prayers.seeAlso': '另見',
	'anchor.actions': '對該引處的操作',
	'anchor.copy': '複製文本',
	'anchor.copyLink': '複製連結',
	'anchor.view': '檢視',
	'anchor.copied': '已複製',
	'anchor.copyFailed': '無法複製',
	'bookmark.add': '加書籤',
	'bookmark.remove': '移除書籤',
	'bookmark.library': '書籤',
	'bookmark.library.tagline': '您在閱讀時標記過的一切。',
	'bookmark.empty': '尚未標記任何內容。',
	'bookmark.emptyHint': '點選節或段的號碼並選擇「加書籤」，或使用頁面上的書籤按鈕。',
	'bookmark.deviceOnly':
		'書籤只保存在此瀏覽器中。它們不會被送往任何地方，清除瀏覽器資料即會將其刪除。',
	'bookmark.unavailable': '您所讀的版本中沒有',
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
	'art.about': '關於這幅圖畫',
	'art.detail': '局部',
	'colophon.typeTitle': '字體',
	'colophon.typeBody':
		'以 EB Garamond 排印，這是 Georg Duffner 與 Octavio Pardo 對克洛德·加拉蒙於一五九〇年代所刻字體的復刻——教會自文藝復興以來即以此人文主義傳統付印。其西里爾字母出自同一雙手，卻未復刻任何東西：從未有人刻過西里爾文的加拉蒙體，因此俄文所用的是為與其餘字體並立而繪的形體。',
	'colophon.typeArabic':
		'阿拉伯文全然超出其範圍，改以 Amiri 排印——這是 Khaled Hosny 對一九〇五年為開羅布拉克印刷所所刻納斯赫體的復刻，選用的理由與正文字體相同：取一種特定的歷史書籍字體，而非當代的新繪。',
	'colophon.typeInitials':
		'開頭的首字母為 Pirata One，一種哥德體，其大寫字母在首字母所需的尺寸下仍然易讀；俄文則用 Ponomar，重現聖議會印刷所的教會斯拉夫字體。Ponomar 只排首字母，絕不排正文：一份現代通諭若通篇以聖議會字體排印，便會就其本質說出不實之言。以上皆依 SIL Open Font License 授權，並自本站提供而非取自第三方，因此閱讀一個頁面不向他人的伺服器索求任何東西。',
	'copyright.sourceTitle': '開啟原始來源頁面',
	'copyright.sourceLabel': '來源',
	'lang.label': '語言',
	'lang.filter': '搜尋語言',
	'lang.more': '更多語言',
	'calendar.title': '禮儀日曆',
	'calendar.tagline': '羅馬通用日曆，可推算任何一天——那一天的時期、等級與顏色。',
	'calendar.date': '日期',
	'calendar.calendar': '日曆',
	'calendar.which.general': '羅馬通用日曆',
	'calendar.filter': '搜尋國家或地區',
	'calendar.region.europe': '歐洲',
	'calendar.region.americas': '美洲',
	'calendar.region.africa': '非洲',
	'calendar.region.asia': '亞洲',
	'calendar.region.oceania': '大洋洲',
	'calendar.today': '今天',
	'calendar.previousMonth': '上個月',
	'calendar.nextMonth': '下個月',
	'calendar.noSuchDay': '該日期沒有推算出禮儀日。',
	// `LiturgicalDayCard` prints this word and THEN the number, so it is the
	// bare noun rather than the 第…週 the ordinal would take in running text.
	'calendar.week': '週',
	'calendar.alsoToday': '今日同時慶祝',
	'calendar.alsoObserved': '今日同時紀念',
	'calendar.obligation': '當守瞻禮',
	'calendar.obligationCanon': 'CIC 第1246條',
	'calendar.sundayCycle': '主日週期',
	'calendar.weekdayCycle': '平日週期',
	'calendar.psalterWeek': '聖詠集週次',
	'calendar.transferredFrom': '移自',
	'calendar.season.advent': '將臨期',
	'calendar.season.christmas': '聖誕期',
	'calendar.season.lent': '四旬期',
	'calendar.season.triduum': '逾越節三日慶典',
	'calendar.season.easter': '復活期',
	'calendar.season.ordinary': '常年期',
	'calendar.colour.white': '白色',
	'calendar.colour.red': '紅色',
	'calendar.colour.green': '綠色',
	'calendar.colour.violet': '紫色',
	'calendar.colour.rose': '玫瑰色',
	'calendar.colour.black': '黑色',
	'calendar.colour.blue': '藍色',
	'calendar.rank.solemnity': '節日',
	'calendar.rank.feast': '慶日',
	'calendar.rank.memorial': '紀念',
	'calendar.rank.optional-memorial': '自由紀念',
	'calendar.rank.commemoration': '紀念禮',
	'calendar.rank.sunday': '主日',
	'calendar.rank.weekday': '平日'
};
