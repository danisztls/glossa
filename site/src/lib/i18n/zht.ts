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
	'nav.sections': '章節',
	'nav.works': '作品',
	'nav.pages': '頁面',
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
		'對此處所有內容的簡要指引：這些書各是什麼，十誡及教會要求天主教徒知曉的其他清單，以及從何處開始閱讀。',
	'schola.start.heading': '初次接觸天主教？',
	'schola.start.body': '最好的起點是',
	'schola.start.bodyAfter':
		'：與《天主教教理》相同的道理，篇幅短得多，以問答寫成。約為其十分之一長，且不預設任何前提。',
	'schola.bible.heading': '從未讀過聖經？',
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
	'schola.books.heading': '此處有什麼',
	'schola.what.scripture': '教會所領受的聖經，包括新舊兩約。此處其餘一切都在其光中閱讀。',
	'schola.what.catechism':
		'天主教會所信的撮要，合為一冊。它本身不是源頭：它匯集聖經、教父、禮儀與教會的訓導，而每一條都指明其所言出自何處。',
	'schola.what.compendium': '同一道理以問答陳述，篇幅約為十分之一。',
	'schola.what.magisterium':
		'教宗與大公會議實際所寫的——通諭、憲章、法令、宣言——各自針對特定的時刻與特定的問題。每一份都以其拉丁文起首之語為名。',
	'schola.what.social': '教會關於勞動、財產、家庭、政治與和平的訓導，自那些文獻中輯成一書。',
	'schola.what.law': '是法律而非教義。它規定教會所要求的，並且會被修訂。',
	'schola.what.doctors': '教會所冊封為聖師的神學家。無論作者何等偉大，這都不具官方權威。',
	'schola.what.prayers': '教會所祈禱的言辭，旁附拉丁文。',
	'schola.places.heading': '不是文本，而是本站的去處',
	'schola.what.library': '本站所有作品彙為一表，按主題而非按種類分組。',
	'schola.what.questions':
		'為持有問題卻沒有引處的讀者提供的入口。每個問題都彙集了回答它的段落——首先是《教理》——其中每一個字都出自教會本身。',
	'schola.what.calendar': '禮儀日——節期、顏色與所紀念者——依您所遵循之國家的日曆。',
	'schola.what.bookmarks':
		'您所標記的經文，以及您在每部作品中上次讀到之處。二者都保存在此瀏覽器中，不發往任何地方。',
	'schola.what.census':
		'本書庫收藏了什麼，覆蓋範圍有多廣——有多少部作品，涉及哪些語言，以及您自己語言的讀者實際能讀到每部作品的多少。',
	'schola.formulas.heading': '十誡',
	'ccc.noCounterpart': '另一部作品中無相應內容',
	'jumpbox.placeholder': '前往…（例：若 3:16、ccc 1234）',
	'jumpbox.short': '搜尋',
	'jumpbox.hint': '按 / 或 Ctrl+K 跳至引處',
	'jumpbox.noMatch': '無相符者',
	'jumpbox.suggestions': '建議',
	'settings.label': '設定',
	'apparatus.label': '註釋',
	'apparatus.editionNotes': '本版註釋',
	'apparatus.commentary': '註疏',
	'apparatus.inCommentary': '已收錄於上方註疏。',
	'darkMode.label': '深色模式',
	'darkMode.auto': '自動',
	'darkMode.on': '開',
	'darkMode.off': '關',
	'sepia.label': '棕褐',
	'sepia.lightOnly': '僅限淺色模式',
	'sepia.noHue': '單色模式中不適用',
	'oled.label': 'OLED 純黑',
	'oled.darkOnly': '僅限深色模式',
	'mono.label': '單色',
	'mono.hint': '將整頁設為單一灰階，不再以顏色區分內容。啟用時棕褐模式會關閉。',
	'advanced.label': '進階',
	'library.title': '離線書庫',
	'library.lede': '保存在此裝置上的文本，完全無須連線即可開啟。',
	'library.essentials': '祈禱經文與簡編',
	'library.illustrations': '聖經（附插圖）',
	'library.illustrationsDetail': '聖經（附插圖，高解析度）',
	'library.other': '其他文本',
	'library.everything': '全部內容',
	'library.downloadAll': '下載全部內容',
	'library.download': '下載',
	'library.downloaded': '已在此裝置',
	'library.offlineNote': '請先關閉離線模式才能下載內容。',
	'library.remove': '自此裝置移除',
	'library.removeConfirm': '確定移除？',
	'library.forget': '移除已下載內容',
	'library.forgetConfirm': '確定移除全部內容？',
	'offline.label': '離線模式',
	'offline.hint':
		'完全不使用網路：不下載任何內容，不檢查更新，也不進行任何統計。只能開啟已存於此裝置上的文本。',
	'offline.notDownloaded': '尚未存於此裝置',
	'loadFailed.title': '這未能載入',
	'loadFailed.hint': '該頁面是存在的——只是取回時出了差錯。再試一次通常即可。',
	'loadFailed.retry': '再試一次',
	'loadFailed.retrying': '正在嘗試…',
	'offline.turnOff': '關閉離線模式',
	'type.label': '字級與字體',
	'fontSize.label': '字級',
	'fontSize.small': '小',
	'fontSize.medium': '中',
	'fontSize.large': '大',
	'fontSize.xlarge': '特大',
	'fontSize.xxlarge': '最大',
	'face.label': '字體',
	'face.serif': '襯線',
	'face.sans': '無襯線',
	'print.label': '列印本頁',
	'toTop.label': '回到頂端',
	'install.label': '安裝 Glossa',
	'install.hint.label': '加入主畫面',
	'install.hint.title': '將 Glossa 加入您的主畫面',
	'install.hint.stepBefore': '它會像應用程式一樣開啟，並可離線閱讀。點按',
	'install.hint.stepAfter': '然後選擇「加入主畫面」。',
	'install.hint.dismiss': '關閉',
	'update.label': '有新版本可用',
	'update.title': '新版本已就緒',
	'update.body': '重新載入以取得最新的文本與修正。',
	'update.action': '重新載入',
	'update.dismiss': '暫時不要',
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
	'bible.landing.random': '好手氣',
	'bible.landing.books': '書卷',
	'bible.chapterUnavailable': '此版本未收錄',
	'bible.introduction': '導言',
	'bible.introUnavailable': '此語言尚無導言',
	'bible.introSource': '導言並非聖經正文的一部分。',
	'bible.testament.ot': '舊約',
	'bible.testament.nt': '新約',
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
	'ccc.prevParagraph': '上一段',
	'ccc.nextParagraph': '下一段',
	'ccc.inBrief': '撮要',
	'ccc.landing.title': '天主教教理',
	'ccc.landing.pairTitle': '教理與簡編',
	'ccc.landing.tagline':
		'<strong>《教理》</strong>以 2,865 個編號段落闡述天主教教義。<strong>《簡編》</strong>依同一綱目，以 598 個問答重述同一教義。',
	'ccc.landing.pairTagline': '《天主教教理》共 2,865 條，其《簡編》共 598 問。',
	'ccc.tableOfContents': '目錄',
	'ccc.related': '另見',
	'compendium.landing.title': '教理簡編',
	'compendium.landing.tagline': '以問答方式撮述《天主教教理》。',
	'compendium.question': '問',
	'compendium.answer': '答',
	'compendium.tableOfContents': '目錄',
	'compendium.prevQuestion': '上一問',
	'compendium.nextQuestion': '下一問',
	'compendium.condenses': '撮述教理 ¶¶',
	'ccc.abbrev': '教理',
	'ccc.condensedIn': '在《簡編》中',
	'compendium.abbrev': '簡編',
	'compendium.noQuestionNumber': '此文庫中沒有問題編號',
	'document.library.tagline': '通諭、大公會議憲章、法令，以及訓導權的宣言。',
	'document.filter.heading': '篩選',
	'document.filter.author': '作者',
	'document.filter.kind': '類型',
	'document.filter.subject': '主題',
	'document.filter.search': '搜尋文獻',
	'document.filter.clear': '清除',
	'document.filter.results': '顯示的文獻',
	'document.filter.noResults': '沒有符合篩選條件的文獻。',
	'document.tableOfContents': '目錄',
	'document.startReading': '開始閱讀',
	'document.readFullDocument': '閱讀整份文獻',
	'document.section': '節',
	'document.prevSection': '上一節',
	'document.nextSection': '下一節',
	'document.kind.conciliarConstitution': '憲章',
	'document.kind.conciliarDecree': '法令',
	'document.kind.conciliarDeclaration': '宣言',
	'document.kind.encyclical': '通諭',
	'document.kind.apostolicExhortation': '宗座勸諭',
	'document.kind.apostolicConstitution': '宗座憲令',
	'document.kind.apostolicLetter': '宗座牧函',
	'document.kind.cdfDeclaration': '信理部宣言',
	'document.kind.cdfInstruction': '信理部訓令',
	'document.kind.cdfLetter': '信理部信函',
	'document.kind.cdfDoctrinalNote': '信理部教義說明',
	'document.kind.cdfResponsum': '信理部答覆',
	'document.kind.cdfConsiderations': '信理部省思',
	'document.kindPlural.conciliarConstitution': '憲章',
	'document.kindPlural.conciliarDecree': '法令',
	'document.kindPlural.conciliarDeclaration': '宣言',
	'document.kindPlural.encyclical': '通諭',
	'document.kindPlural.apostolicExhortation': '宗座勸諭',
	'document.kindPlural.apostolicConstitution': '宗座憲令',
	'document.kindPlural.apostolicLetter': '宗座牧函',
	'document.kindPlural.cdfDeclaration': '信理部宣言',
	'citation.unavailable': '此註解沒有可用的原文。',
	'doctores.landing.title': '教會聖師',
	'doctores.landing.tagline': '教會教父與聖師的神學著作。',
	'summa.landing.title': '神學大全',
	'summa.landing.tagline': '多瑪斯·阿奎那，英文本與他所寫的拉丁文本。',
	'summa.tableOfContents': '目錄',
	'summa.part': '部',
	'summa.question': '題',
	'summa.article': '節',
	'summa.questionShort': '題',
	'summa.articleShort': '節',
	'summa.titleFromEdition': '標題取自{lang}版',
	'summa.titlesFromEdition': '標題取自{lang}版——本版未印標題',
	'summa.prologue': '引言',
	'summa.objection': '質疑',
	'summa.sedContra': '反之',
	'summa.corpus': '正解',
	'summa.reply': '釋疑',
	'summa.preamble': '說明',
	'summa.prevQuestion': '上一題',
	'summa.nextQuestion': '下一題',
	'summa.noEditionInYourLanguage': '《神學大全》沒有您所用語言的版本，現以{lang}顯示。',
	'summa.noLatinSupplement': '《補編》僅有英文版——它是在阿奎那逝世後編成的。',
	'index.division': '分部',
	'index.showSubsections': '顯示子項',
	'index.hideSubsections': '隱藏子項',
	'prayers.landing.title': '常用祈禱經文',
	'prayers.landing.tagline': '祈禱經文並列拉丁文本。',
	'prayers.tableOfContents': '目錄',
	'prayers.gloss.versicle': '啟應中的啟句——由領禱者獨自誦念或詠唱的一行，會眾以隨後的答句回應。',
	'prayers.gloss.response': '啟應中的答句——由會眾一同誦念或詠唱的一行，回應前面的啟句。',
	'prayers.seeAlso': '另見',
	'prayers.prevPrayer': '上一篇經文',
	'prayers.nextPrayer': '下一篇經文',
	'prayers.rosary.today': '今天',
	'prayers.rosary.todayHeading': '今日奧蹟',
	'prayers.rosary.openingPrayer': '開端禱文',
	'prayers.rosary.decadePrayers': '一端的禱文',
	'ref.tooltip.loading': '載入中…',
	'ref.tooltip.openCcc': '在教理中開啟',
	'ref.tooltip.openBible': '在聖經中開啟',
	'ref.tooltip.openCompendium': '在簡編中開啟',
	'ref.preview.open': '開啟',
	'ref.cf': '參',
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
	'bookmark.about': '關於這些書籤',
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
	'colophon.privacyTitle': '隱私',
	'colophon.privacyBody1':
		'沒有帳戶，沒有 cookie，沒有廣告，也沒有第三方程式碼。這裡的任何東西都不會在您離開本站後繼續追蹤您。',
	'colophon.privacyBody2':
		'我們確實會統計本站的使用情形：每次造訪記錄一筆數據，每個欄位都是區間而非確切數值——您停留了多久、您來過幾次、您開啟過哪些作品。您所在的國家會另外計算，且不與其餘資料相連。這描述的是一次造訪，而非一位造訪者，並保留{days}天。',
	'colophon.privacyBody3':
		'絕不傳送：您在搜尋框中輸入的內容、您開啟過的段落，或任何足以再次辨識您裝置的資訊。您的設定、書籤與已下載的文本都保留在您的裝置上。',
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
	'plates.scansBy': '掃描提供',
	'plates.enlarge': '放大{title}',
	'plates.zoom': '縮放',
	'art.about': '關於這幅圖畫',
	'art.detail': '局部',
	'colophon.typeTitle': '字體',
	'colophon.typeBody':
		'以 EB Garamond 排印，這是 Georg Duffner 與 Octavio Pardo 對克洛德·加拉蒙於一五九〇年代所刻字體的復刻——教會自文藝復興以來即以此人文主義傳統付印。其西里爾字母出自同一雙手，卻未復刻任何東西：從未有人刻過西里爾文的加拉蒙體，因此俄文所用的是為與其餘字體並立而繪的形體。',
	'colophon.typeArabic':
		'阿拉伯文全然超出其範圍，改以 Amiri 排印——這是 Khaled Hosny 對一九〇五年為開羅布拉克印刷所所刻納斯赫體的復刻，選用的理由與正文字體相同：取一種特定的歷史書籍字體，而非當代的新繪。',
	'colophon.typeInitials':
		'開頭的首字母為 Pirata One，一種哥德體，其大寫字母在首字母所需的尺寸下仍然易讀；俄文則用 Ponomar，重現聖議會印刷所的教會斯拉夫字體。Ponomar 只排首字母，絕不排正文：一份現代通諭若通篇以聖議會字體排印，便會就其本質說出不實之言。以上皆依 SIL Open Font License 授權，並自本站提供而非取自第三方，因此閱讀一個頁面不向他人的伺服器索求任何東西。',
	'refs.citedIn': '引用於',
	'refs.externalVolume': '第{volume}卷，於{host}——掃描版 PDF',
	'bible.wholeChapter': '本章',
	'bible.verseNotInEdition': '本版本中沒有此節號——詳見頁面原始碼中的註記',
	'bible.verseAbbrev': '節',
	'bible.note': '註',
	'bible.noteMissing': '語料庫中缺少此註',
	'bible.chapterArgument': '提要',
	'ccc.readFullChapter': '閱讀全章',
	'ccc.noParagraphNumber': '語料庫中無段落編號',
	'copyright.sourceTitle': '開啟原始來源頁面',
	'copyright.sourceLabel': '來源',
	'lang.label': '語言',
	'lang.filter': '搜尋語言',
	'lang.more': '更多語言',
	'notFound.title': '此網址沒有內容',
	'notFound.lede': '您所要求的頁面不在這裡。',
	'notFound.body': '連結可能輸入錯誤或已經過時，也可能指向本站未收錄的文本。',
	'notFound.searchHint':
		'如果您知道想找的引處——某卷某章，或教理的某一段——請在本頁頂端的搜尋框中輸入。',
	'notFound.credit': '取材自大英圖書館 Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': '或從以下項目開始：',
	'notFound.home': '首頁',
	'compare.enter': '比較版本',
	'compare.exit': '結束比較',
	'compare.missing': '此版本未收錄',
	'compare.versificationNote':
		'這兩個版本在本章某些地方的分節方式不同（屬版本差異，而非翻譯取捨）——同一節號在兩欄中未必對應同一句話。',
	'compare.loading': '正在載入第二種語言…',
	'ui.close': '關閉',
	'shortcuts.title': '鍵盤快捷鍵',
	'shortcuts.betweenDocuments': '在文獻之間',
	'shortcuts.withinDocument': '在文獻之內',
	'shortcuts.show': '顯示此清單',
	'help.title': '說明',
	'help.reading.heading': '正文上方的列',
	'help.feature.offline':
		'把本站加到主畫面，它便如應用程式一般開啟。您可下載整部作品，在沒有連線時閱讀。',
	'help.feature.contents': '您所在作品的分部——卷、部、章——以便在其中移動而不必回到開頭。',
	'help.feature.compare':
		'同一處經文的兩個版本並列——拉丁文與您自己的語言並列，或一種譯本與另一種並列。',
	'help.feature.apparatus':
		'版本自身的註釋，以及為正文所寫的任何註解，都置於正文之旁而非其下。正文之內的引證是連結，因此引文所指即所至。',
	'help.feature.focus': '清去正文以外的一切。出口仍留在列原本的位置，使一切不致被關在其後。',
	'zen.enter': '專注模式',
	'zen.exit': '離開專注模式',
	'nav.calendar': '日曆',
	'calendar.title': '禮儀日曆',
	'calendar.tagline': '羅馬通用日曆，可推算任何一天——那一天的時期、等級與顏色。',
	'calendar.national.tagline': '{name}及其專有慶日，可推算任何一天。',
	'calendar.calendar': '日曆',
	'calendar.which.general': '羅馬通用日曆',
	'calendar.filter': '搜尋國家或地區',
	'calendar.region.europe': '歐洲',
	'calendar.region.americas': '美洲',
	'calendar.region.africa': '非洲',
	'calendar.region.middleEast': '中東',
	'calendar.region.asia': '亞洲',
	'calendar.region.oceania': '大洋洲',
	'calendar.today': '今天',
	'calendar.previousMonth': '上個月',
	'calendar.nextMonth': '下個月',
	'calendar.plainDays': '普通平日',
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
	'lectionary.heading': '彌撒讀經',
	'lectionary.slot.reading': '讀經',
	'lectionary.slot.reading1': '讀經一',
	'lectionary.slot.reading2': '讀經二',
	'lectionary.slot.reading3': '讀經三',
	'lectionary.slot.reading4': '讀經四',
	'lectionary.slot.reading5': '讀經五',
	'lectionary.slot.reading6': '讀經六',
	'lectionary.slot.reading7': '讀經七',
	'lectionary.slot.psalm': '答唱詠',
	'lectionary.slot.epistle': '書信',
	'lectionary.slot.acclamation': '福音前歡呼',
	'lectionary.slot.gospel': '福音',
	'lectionary.slot.sequence': '繼抒詠',
	'lectionary.or': '或',
	'lectionary.cf': '參',
	'lectionary.about': '關於這些讀經',
	'lectionary.caveat':
		'這些經文段落由《彌撒讀經集》所指定，連結至本站所用的版本——並非任何特定教會誦讀時採用的譯本，各主教團也可能調整其編排。',
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
	'calendar.rank.weekday': '平日',
	'calendar.gloss.season.advent': '聖誕節前的四週：預備主的來臨，也是教會年度的開始。',
	'calendar.gloss.season.christmas': '從聖誕節到主受洗節，慶祝主的誕生和祂向世界的顯現。',
	'calendar.gloss.season.lent':
		'從聖灰禮儀星期三到主的晚餐彌撒的四十天：補贖、施捨，以及為復活節的預備。',
	'calendar.gloss.season.triduum':
		'從聖週四晚上到復活主日晚上的三天——主的苦難、死亡與復活，是整個年度的頂峰。',
	'calendar.gloss.season.easter':
		'從復活節到聖神降臨節的五十天，作為一個整體的慶節來慶祝——「一個偉大的主日」。',
	'calendar.gloss.season.ordinary':
		'在其他時期以外的三十三或三十四週。不是「平常」，而是有次序的：週次是編號的，教會依次誦讀主的生平與教導。它分兩段而來——聖誕期之後直到四旬期，以及聖神降臨節之後直到將臨期。',
	'calendar.gloss.rank.solemnity':
		'最高的等級：復活節、聖誕節、耶穌升天、一地的主保。以光榮頌和信經慶祝，並從前一日晚上開始。',
	'calendar.gloss.rank.feast': '在當日之內慶祝。宗徒與聖史，以及主和聖母較大的日子。',
	'calendar.gloss.rank.memorial':
		'在聖人自己的日子紀念他，在該時期本有的彌撒與日課之內。凡舉行之處皆有義務。',
	'calendar.gloss.rank.optional-memorial':
		'可舉行也可不舉行，由司鐸或團體選擇。若不舉行，該日便只是平日。',
	'calendar.gloss.rank.commemoration':
		'紀念在四旬期中所變成的樣子：在平日彌撒中加上一段禱詞，其餘仍保持該時期的完整。',
	'calendar.gloss.rank.sunday':
		'最初的慶節——主的日子，自復活以來每週慶祝。只有節日或主的慶日可以取代它，而在將臨期、四旬期和復活期，連這些也不可以。',
	'calendar.gloss.rank.weekday':
		'沒有自身慶祝的日子。彌撒與日課都屬於該時期——這正是使時期值得認識的地方。',
	'calendar.gloss.colour.white':
		'喜樂。復活期與聖誕期，主的日子（苦難以外者）、聖母、天使，以及並非殉道者的聖人。',
	'calendar.gloss.colour.red': '血與火。聖枝主日與聖週五、聖神降臨節、宗徒與聖史，以及殉道者。',
	'calendar.gloss.colour.green': '常年期：希望的顏色，也是生長之物的顏色。',
	'calendar.gloss.colour.violet': '將臨期與四旬期，也用於為亡者舉行的彌撒。',
	'calendar.gloss.colour.rose':
		'一年用兩次——將臨期第三主日（Gaudete）與四旬期第四主日（Laetare）——齋戒轉輕、終點在望之時。',
	'calendar.gloss.colour.black': '可用於為亡者舉行的彌撒。',
	'calendar.gloss.colour.blue':
		'藍色的特權：在西班牙、菲律賓以及聖座所准許的少數其他地方，於聖母無染原罪節使用。',
	'calendar.gloss.sundayCycle':
		'主日讀經歷三年而行——甲年、乙年、丙年——依次誦讀瑪竇、馬爾谷與路加，四旬期與復活期則讀若望。週期在將臨期第一主日隨教會年度更換。',
	'calendar.gloss.weekdayCycle':
		'平日讀經歷兩年而行，單年與雙年：第一篇讀經更換，福音不換。禮儀年以其結束的公曆年份命名——奇數年為單年，偶數年為雙年。',
	'calendar.gloss.psalterWeek':
		'時辰頌禱將聖詠分佈於四週，第一週至第四週，全年循環。這是說今天的聖詠屬於哪一週，為誦念時辰頌禱的人而設。',
	'calendar.gloss.obligation':
		'信友有義務參與彌撒、並避免妨礙參與的工作的日子。每個主日，以及各主教團所規定的其他日子。',
	'calendar.primer.title': '初次接觸？',
	'calendar.primer.lead':
		'教會守著自己的一年。它從將臨期開始，環繞復活節而轉，並給每一天一個名稱、一個等級和一種顏色——這些決定了當天在彌撒和時辰頌禱中所祈禱與誦讀的內容。因此「常年期第二十三主日」是一個地址：它告訴司鐸、唱經班，或在家祈禱的人，哪些禱文與讀經屬於今天。',
	'calendar.primer.seasons': '禮儀時期',
	'calendar.primer.ranks': '一天可以是什麼',
	'calendar.primer.colours': '顏色',
	'calendar.primer.cycles': '週期',
	'calendar.primer.cyclesLead': '三個計數，合起來說明今天所指定的讀經與聖詠。'
};
