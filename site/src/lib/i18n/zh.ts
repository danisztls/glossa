/**
 * 中文 UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * WRITTEN AS A REACH LANGUAGE ON 2026-08-31 — chrome for a corpus that held
 * nothing in it — AND IT STOPPED BEING ONE ON 2026-09-04, when the curated
 * prayers brought `prayer.common.zh`. Nothing about the file changes; what
 * changes is that its readers now have a text of their own, and that
 * `CONTENT_LANG_FALLBACK` gives them `zht` before English.
 *
 * SIMPLIFIED, AND `zht.ts` BESIDE IT IS TRADITIONAL. That file was written on
 * 2026-09-04 and writing it is what revealed that this one had drifted: the
 * whole colophon and the entire canon-law block were in Traditional
 * characters, added by two later commits that took "Chinese" for one script.
 * Both were corrected here in the same breath. The drift is invisible to
 * everything mechanical — same key, same encoding, same length — and obvious
 * to any reader of either script, which is why the answer is two files and
 * not one with a converter.
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

export const zh: Dictionary = {
	'nav.bible': '圣经',
	'nav.ccc': '教理',
	'nav.compendium': '简编',
	'nav.magisterium': '训导权',
	'nav.socialDoctrine': '社会训导',
	'socialDoctrine.landing.title': '教会社会训导汇编',
	'socialDoctrine.landing.tagline': '教会关于社会生活的训导，共583个编号段落。',
	'nav.canonLaw': '教会法',
	'canonLaw.landing.title': '天主教法典',
	'canonLaw.landing.tagline': '拉丁教会的法律，共一千七百五十二条，分为七卷。',
	'canonLaw.canon': '第',
	'canonLaw.canons': '第',
	'canonLaw.prevCanon': '上一条',
	'canonLaw.nextCanon': '下一条',
	'canonLaw.readFullTitle': '阅读整篇',
	'canonLaw.superseded': '被取代的条文，依据',
	'nav.prayers': '祈祷文',
	'nav.bookmarks': '书签',
	'nav.menu': '菜单',
	'nav.sections': '版块',
	'nav.works': '作品',
	'nav.pages': '页面',
	'nav.summa': '神学大全',
	'home.title': 'Glossa Catholica',
	'reading.continue': '继续阅读',
	'home.tagline':
		'阅读圣经、《天主教教理》及训导文献的网站——免费，离线亦可使用，无须注册任何东西。',
	'home.doors.heading': '何处可去',
	'home.find.heading': '或键入一处引文',
	'nav.library': '书库',
	'nav.learn': '学习',
	'library.landing.tagline': '全部书目，一架一架——连同你读到的地方和你标记的内容。',
	'schola.landing.title': '从何处入手',
	'schola.landing.tagline':
		'对此处所有内容的简要指引：这些书各是什么，其引文如何书写，如何找到一处经文，以及教会所提出的阅读次第。',
	'schola.start.heading': '初次接触天主教？',
	'schola.start.body': '最好的起点是',
	'schola.start.bodyAfter':
		'：与《天主教教理》相同的道理，篇幅短得多，以问答写成。约为其十分之一长，且不预设任何前提。',
	'schola.bible.heading': '从未读过圣经？',
	'schola.bible.library':
		'它不是一部书，而是七十三部，写成于一千多年之间，依教会所定的次序编在一起——不是事情发生的次序，也不是最易阅读的次序。多数人从第一页开始，几周后便停在古代律法的某个长章里，因为还没有人告诉他们这是为了什么。',
	'schola.bible.step.gospel': '从一部福音开始',
	'schola.bible.start':
		'关于耶稣生平的四部短书之一，位置颇靠里，而非在最前。这并非我们的主意：教会的一次大公会议要求教导正确使用圣经，「尤其是新约，而首要的是福音」。它没有单独指名哪一部，我们也不指名。',
	'schola.bible.whichGospel': '通常推荐三部，各有不同的理由。其中任何一部都是好的所在。',
	'schola.bible.gospel.mark':
		'最短的一部。一个下午即可读完，而在起头，读完一部比选中最好的一部更有价值。',
	'schola.bible.gospel.luke':
		'为一位信仰之外、想要把事情按次序记下来的人而写——那也许正是您。它径直接入宗徒大事录，所以实际上是一部更长的书的前半。',
	'schola.bible.gospel.john':
		'直言其写作缘由的一部：「为叫你们信」。文辞平易，直趋耶稣是谁这一问题。',
	'schola.bible.step.acts': '然后是此后所发生的事',
	'schola.bible.thenActs': '读完一部之后，再读那些认识他的人在他离去以后做了什么。',
	'schola.bible.acts.why':
		'福音结束后的三十年：数十个惊惶的人，以及他们所见之事如何传到帝国的另一端。',
	'schola.bible.step.old': '然后是更古的那一半',
	'schola.bible.thenOld':
		'不从第一页起，也不必全读。有几处承载着这个故事，正是福音一再回指的地方。',
	'schola.bible.ot.beginnings': '起初如何，又如何败坏。',
	'schola.bible.ot.promise': '一个家族，以及向它所许的、比其中所有人都长久的应许。',
	'schola.bible.ot.exodus': '一个民族被领出为奴之地，并领受了赖以生活的法律。',
	'schola.bible.ot.psalms':
		'不是故事：一百五十篇祈祷与歌咏。一次读一篇，次序不拘。教会至今每日仍以此祈祷。',
	'schola.bible.bothWays':
		'您会认出一些东西，这正是用意所在，而非巧合。教会在基督的光中读较古的书卷，又在此前所有的光中读较新的书卷——两半彼此解释，因此没有一半是独自阅读的。',
	'schola.books.heading': '此处有什么，以及如何标识',
	'schola.books.lede':
		'这些各是不同种类的书，各以自己的编号被引用。示例显示其形式：照样在搜索框中键入，便可抵达那一处。',
	'schola.cite.label': '标识',
	'schola.what.scripture': '教会所领受的圣经，包括新旧两约。此处其余一切都在其光中阅读。',
	'schola.cite.scripture': '书卷、章与节，用您自己的版本所印的简称',
	'schola.what.catechism':
		'天主教会所信的撮要，合为一册。它本身不是源头：它汇集圣经、教父、礼仪与教会的训导，而每一条都指明其所言出自何处。',
	'schola.cite.catechism': '按条目编号，自首页至末页连续不断',
	'schola.what.compendium': '同一道理以问答陈述，篇幅约为十分之一。',
	'schola.cite.compendium': '按问题编号',
	'schola.what.magisterium':
		'教宗与大公会议实际所写的——通谕、宪章、法令、宣言——各自针对特定的时刻与特定的问题。每一份都以其拉丁文起首之语为名。',
	'schola.cite.magisterium': '按文献名称，再按其中的节次编号',
	'schola.what.social': '教会关于劳动、财产、家庭、政治与和平的训导，自那些文献中辑成一书。',
	'schola.cite.social': '按条目编号，并冠以该书自用的简称',
	'schola.what.law': '是法律而非教义。它规定教会所要求的，并且会被修订。',
	'schola.cite.law': '按条，此即其编号单位之名',
	'schola.what.doctors': '教会所册封为圣师的神学家。无论作者何等伟大，这都不具官方权威。',
	'schola.cite.doctors': '按部，再按题——《神学大全》自身的分法',
	'schola.what.prayers': '教会所祈祷的言辞，旁附拉丁文。',
	'schola.cite.prayers': '按名称；无编号可引',
	'schola.places.heading': '不是文本，而是本站的去处',
	'schola.what.library': '本站所有作品汇为一表，按主题而非按种类分组。',
	'schola.what.calendar': '礼仪日——节期、颜色与所纪念者——依您所遵循之国家的日历。',
	'schola.what.bookmarks':
		'您所标记的经文，以及您在每部作品中上次读到之处。二者都保存在此浏览器中，不发往任何地方。',
	'ccc.noCounterpart': '另一部作品中没有对应内容',
	'jumpbox.placeholder': '前往…（例：jn 3:16、ccc 1234）',
	'jumpbox.short': '搜索',
	'jumpbox.hint': '按 / 或 Ctrl+K 跳至引处',
	'jumpbox.noMatch': '无匹配',
	'jumpbox.suggestions': '建议',
	'settings.label': '设置',
	'apparatus.label': '附注',
	'apparatus.editionNotes': '本版注释',
	'apparatus.commentary': '评注',
	'apparatus.inCommentary': '已收录于上方评注中。',
	'darkMode.label': '深色模式',
	'darkMode.auto': '自动',
	'darkMode.on': '开',
	'darkMode.off': '关',
	'sepia.label': '棕褐',
	'sepia.lightOnly': '仅浅色模式可用',
	'sepia.noHue': '单色模式下不可用',
	'oled.label': 'OLED 黑',
	'oled.darkOnly': '仅深色模式可用',
	'mono.label': '单色',
	'mono.hint': '将整页设为单一灰阶，不再以颜色区分任何内容；开启后棕褐色会自动关闭。',
	'advanced.label': '高级',
	'library.title': '离线书库',
	'library.lede': '保存在此设备上的文本，完全无需网络即可打开。',
	'library.essentials': '祈祷文与简编',
	'library.illustrations': '圣经（插图）',
	'library.illustrationsDetail': '圣经（插图，高分辨率）',
	'library.other': '其他文本',
	'library.everything': '全部',
	'library.downloadAll': '下载全部',
	'library.download': '下载',
	'library.downloaded': '已在此设备上',
	'library.offlineNote': '关闭离线模式后方可下载任何内容。',
	'library.remove': '从此设备移除',
	'library.removeConfirm': '移除？',
	'library.forget': '移除全部下载',
	'library.forgetConfirm': '移除全部内容？',
	'offline.label': '离线模式',
	'offline.hint':
		'完全不使用网络：不下载任何内容，不检查更新，也不进行任何统计。只能打开已保存在此设备上的文本。',
	'offline.notDownloaded': '尚未存于此设备',
	'loadFailed.title': '这未能载入',
	'loadFailed.hint': '该页面是存在的——只是取回时出了差错。再试一次通常即可。',
	'loadFailed.retry': '再试一次',
	'loadFailed.retrying': '正在尝试…',
	'offline.turnOff': '关闭离线模式',
	'type.label': '字号与字体',
	'fontSize.label': '字号',
	'fontSize.small': '小',
	'fontSize.medium': '中',
	'fontSize.large': '大',
	'fontSize.xlarge': '特大',
	'fontSize.xxlarge': '最大',
	'face.label': '字体',
	'face.serif': '衬线',
	'face.sans': '无衬线',
	'print.label': '打印本页',
	'toTop.label': '回到顶部',
	'install.label': '安装 Glossa',
	'install.hint.label': '添加到主屏幕',
	'install.hint.title': '将 Glossa 添加到主屏幕',
	'install.hint.stepBefore': '它如同应用程序般打开，并可离线阅读。点按',
	'install.hint.stepAfter': '，然后选择「添加到主屏幕」。',
	'install.hint.dismiss': '知道了',
	'update.label': '有新版本可用',
	'update.title': '新版本已就绪',
	'update.body': '重新加载以获取最新的文本与修订。',
	'update.action': '重新加载',
	'update.dismiss': '以后再说',
	'edition.label': '版本',
	'edition.select': '选择版本',
	'edition.current': '当前版本',
	'edition.filter': '搜索版本',
	'menu.noMatches': '无匹配项',
	'unitNav.previous': '上一个',
	'unitNav.next': '下一个',
	'bible.prevChapter': '上一章',
	'bible.nextChapter': '下一章',
	'bible.pickBook': '书卷与章',
	'bible.landing.title': '圣经',
	'bible.landing.tagline': '通读全部圣经，一卷一卷，一章一章。',
	'bible.landing.random': '手气不错',
	'bible.landing.books': '书卷',
	'bible.chapterUnavailable': '此版本未收录此内容',
	'bible.introduction': '导言',
	'bible.introUnavailable': '尚无此语言的导言',
	'bible.introSource': '导言不属于经文本身。',
	'bible.testament.ot': '旧约',
	'bible.testament.nt': '新约',
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
	'ccc.prevParagraph': '上一条目',
	'ccc.nextParagraph': '下一条目',
	'ccc.inBrief': '撮要',
	'ccc.landing.title': '天主教教理',
	'ccc.landing.pairTitle': '教理与简编',
	'ccc.landing.tagline':
		'<strong>《教理》</strong>以 2,865 个编号段落阐述天主教教义。<strong>《简编》</strong>依同一纲目，以 598 个问答重述同一教义。',
	'ccc.landing.pairTagline': '《天主教教理》共 2,865 条，其《简编》共 598 问。',
	'ccc.tableOfContents': '目录',
	'ccc.related': '另见',
	'compendium.landing.title': '教理简编',
	'compendium.landing.tagline': '以问答方式撮述《天主教教理》。',
	'compendium.question': '问',
	'compendium.answer': '答',
	'compendium.tableOfContents': '目录',
	'compendium.prevQuestion': '上一问',
	'compendium.nextQuestion': '下一问',
	'compendium.condenses': '撮述教理 ¶¶',
	'ccc.abbrev': '教理',
	'ccc.condensedIn': '见简编',
	'compendium.abbrev': '简编',
	'compendium.noQuestionNumber': '此文库中没有问题编号',
	'document.library.tagline': '通谕、大公会议宪章、法令，以及训导权的宣言。',
	'document.filter.heading': '筛选',
	'document.filter.author': '作者',
	'document.filter.kind': '类型',
	'document.filter.subject': '主题',
	'document.filter.search': '搜索文献',
	'document.filter.clear': '清除',
	'document.filter.results': '显示的文献',
	'document.filter.noResults': '没有文献符合这些筛选条件。',
	'document.tableOfContents': '目录',
	'document.startReading': '开始阅读',
	'document.readFullDocument': '阅读全文',
	'document.section': '节',
	'document.prevSection': '上一节',
	'document.nextSection': '下一节',
	'document.kind.conciliarConstitution': '宪章',
	'document.kind.conciliarDecree': '法令',
	'document.kind.conciliarDeclaration': '宣言',
	'document.kind.encyclical': '通谕',
	'document.kind.apostolicExhortation': '劝谕',
	'document.kind.apostolicConstitution': '宗座宪令',
	'document.kind.apostolicLetter': '宗座牧函',
	'document.kind.cdfDeclaration': '信理部宣言',
	'document.kind.cdfInstruction': '信理部训令',
	'document.kind.cdfLetter': '信理部书信',
	'document.kind.cdfDoctrinalNote': '信理部教义说明',
	'document.kind.cdfResponsum': '信理部答复',
	'document.kind.cdfConsiderations': '信理部反思',
	'document.kindPlural.conciliarConstitution': '宪章',
	'document.kindPlural.conciliarDecree': '法令',
	'document.kindPlural.conciliarDeclaration': '宣言',
	'document.kindPlural.encyclical': '通谕',
	'document.kindPlural.apostolicExhortation': '劝谕',
	'document.kindPlural.apostolicConstitution': '宗座宪令',
	'document.kindPlural.apostolicLetter': '宗座牧函',
	'document.kindPlural.cdfDeclaration': '信理部宣言',
	'citation.unavailable': '本注释无可用的原文来源。',
	'doctores.landing.title': '教会圣师',
	'doctores.landing.tagline': '教会教父与圣师的神学著作。',
	'summa.landing.title': '神学大全',
	'summa.landing.tagline': '多玛斯·阿奎那，英文本与他所写的拉丁文本。',
	'summa.tableOfContents': '目录',
	'summa.part': '部',
	'summa.question': '题',
	'summa.article': '节',
	'summa.questionShort': '题',
	'summa.articleShort': '节',
	'summa.titleFromEdition': '标题引自{lang}版',
	'summa.titlesFromEdition': '标题引自{lang}版——本版未印标题',
	'summa.prologue': '绪论',
	'summa.objection': '质疑',
	'summa.sedContra': '反之',
	'summa.corpus': '正解',
	'summa.reply': '释疑',
	'summa.preamble': '说明',
	'summa.prevQuestion': '上一题',
	'summa.nextQuestion': '下一题',
	'summa.noEditionInYourLanguage': '《神学大全》没有您所用语言的版本，现以{lang}显示。',
	'summa.noLatinSupplement': '《补编》仅有英文版——它是在阿奎那逝世后编纂的。',
	'index.division': '分部',
	'index.showSubsections': '显示子章节',
	'index.hideSubsections': '隐藏子章节',
	'prayers.landing.title': '常用祈祷文',
	'prayers.landing.tagline': '祈祷文并列拉丁文本。',
	'prayers.tableOfContents': '目录',
	'prayers.gloss.versicle': '启应中的启句——由领祷者独自诵念或咏唱的一行，会众以随后的答句回应。',
	'prayers.gloss.response': '启应中的答句——由会众一同诵念或咏唱的一行，回应前面的启句。',
	'prayers.seeAlso': '另见',
	'prayers.prevPrayer': '上一篇祈祷文',
	'prayers.nextPrayer': '下一篇祈祷文',
	'prayers.rosary.today': '今天',
	'prayers.rosary.todayHeading': '今日的奥迹',
	'prayers.rosary.openingPrayer': '开始祷文',
	'prayers.rosary.decadePrayers': '一端经文',
	'ref.tooltip.loading': '载入中…',
	'ref.tooltip.openCcc': '在教理中打开',
	'ref.tooltip.openBible': '在圣经中打开',
	'ref.tooltip.openCompendium': '在简编中打开',
	'ref.preview.open': '打开',
	'ref.cf': '参',
	'anchor.actions': '对该引处的操作',
	'anchor.copy': '复制文本',
	'anchor.copyLink': '复制链接',
	'anchor.view': '查看',
	'anchor.copied': '已复制',
	'anchor.copyFailed': '无法复制',
	'bookmark.add': '加书签',
	'bookmark.remove': '移除书签',
	'bookmark.library': '书签',
	'bookmark.library.tagline': '您在阅读时标记过的一切。',
	'bookmark.empty': '尚未标记任何内容。',
	'bookmark.emptyHint': '点击节或段的号码并选择「加书签」，或使用页面上的书签按钮。',
	'bookmark.about': '关于这些书签',
	'bookmark.deviceOnly':
		'书签只保存在此浏览器中。它们不会被送往任何地方，清除浏览器数据即会将其删除。',
	'bookmark.unavailable': '您所读的版本中没有',
	'colophon.title': '版本说明',
	'colophon.lede': '本站是什么，文本从何而来，以及我们对复制这些文本的立场。',
	'colophon.whatThisIs': '本站是什么',
	'colophon.whatThisIsBody':
		'Glossa Catholica 是阅读圣经、《天主教教理》、《教理简编》及训导文献的网站，备有英文、葡文与拉丁文。它为被阅读而存在，除此之外不向您索求任何东西：',
	'colophon.pointFree': '免费，且永远免费。没有付费墙，没有订阅，没有任何东西出售。',
	'colophon.pointNoAds': '没有广告，也没有任何形式的赞助置入。',
	'colophon.pointNoAccounts': '没有账户。无须注册，无须登录。',
	'colophon.pointNoTracking':
		'没有跟踪脚本，没有第三方代码，没有 cookie。仅有匿名的使用次数统计，不含任何足以识别您的资料。',
	'colophon.pointOffline': '设计为在您访问过之后仍能离线运作，使不良的连接不致成为阅读的障碍。',
	'colophon.whatThisIsStanding':
		'Glossa Catholica 是平信徒的私人事业。它未获任何教会批准，也不以自身的任何权威发言。',
	'footer.notEndorsed': '未经圣座认可',
	'colophon.textsTitle': '文本',
	'colophon.textsBody':
		'每一份文本都出自具名的来源，每一部作品都记载其版本、来源页面与取得的日期。圣经采用公有领域的译本；《天主教教理》、《教理简编》与训导文献均出自圣座自己刊行的文本。',
	'colophon.textsFidelity':
		'文本从不删节、从不意译、从不改写，也从不与广告并陈。我们确实修补明显的瑕疵——脱落的字、残缺的引注、吞没整段的标记——一律朝着来源自身所印的样子，绝不朝着我们认为它该说的样子。',
	'colophon.countBible': '种圣经版本',
	'colophon.countDocuments': '份训导文献',
	'colophon.privacyTitle': '隐私',
	'colophon.privacyBody1':
		'没有账户，没有 cookie，没有广告，没有第三方代码。此处没有任何东西会在您离开本站后继续跟踪您。',
	'colophon.privacyBody2':
		'我们确实统计本站的使用情况：每次访问记录一项测量，每个字段都是一个区间而非确切数值——您停留了多久、您来访的频率、您打开过哪些作品。您的国家单独统计，且不与其余数据相连。它描述的是一次访问，而非访问者本人，保留 {days} 天。',
	'colophon.privacyBody3':
		'绝不发送：您在搜索框中键入的内容、您打开过的段落，或任何足以再次识别您设备的信息。您的设置、书签与已下载的文本都保存在您的设备上。',
	'colophon.copyrightTitle': '版权',
	'colophon.copyrightBody1':
		'《天主教教理》、《教理简编》与训导文献属于其权利人所有——主要是梵蒂冈书局（Libreria Editrice Vaticana）与传播部。',
	'colophon.copyrightBody2': '每一部作品都以权利人自己的措辞显示其版权声明，并链接至取用的页面。',
	'colophon.copyrightBody3': '若您拥有此处任何文本的权利，而宁愿它不被刊出，请写信给我们。',
	'colophon.contactTitle': '联络',
	'colophon.contactBody': '任何事情皆可，包括上述事项：',
	'colophon.contactPending':
		'尚未设定联络地址。在具备联络方式之前，本站不应公开——若无渠道可以联系我们，上述承诺便毫无意义。',
	'colophon.illustrationsTitle': '插图',
	'colophon.illustrationsBody':
		'圣经载有古斯塔夫·多雷的版画，每一幅都置于其所描绘的那一节旁——这是他圣经系列中最后也最庞大的一套，依他的素描刻于木板，与正文一同印出，而非集中置于卷末。',
	'colophon.illustrationsRights':
		'如下方年份所示，它们皆属公有领域；忠实拍摄公有领域版画所得的复制品，本身不产生新的版权。',
	'colophon.countPlates': '幅版画',
	'colophon.countPlateChapters': '章附有插图',
	'plates.scansBy': '扫描图片提供',
	'plates.enlarge': '放大{title}',
	'plates.zoom': '缩放',
	'art.about': '关于这幅图画',
	'art.detail': '局部',
	'colophon.typeTitle': '字体',
	'colophon.typeBody':
		'以 EB Garamond 排印，这是 Georg Duffner 与 Octavio Pardo 对克洛德·加拉蒙于一五九〇年代所刻字体的复刻——教会自文艺复兴以来即以此人文主义传统付印。其西里尔字母出自同一双手，却未复刻任何东西：从未有人刻过西里尔文的加拉蒙体，因此俄文所用的是为与其余字体并立而绘的形体。',
	'colophon.typeArabic':
		'阿拉伯文全然超出其范围，改以 Amiri 排印——这是 Khaled Hosny 对一九〇五年为开罗布拉克印刷所所刻纳斯赫体的复刻，选用的理由与正文字体相同：取一种特定的历史书籍字体，而非当代的新绘。',
	'colophon.typeInitials':
		'开头的首字母为 Pirata One，一种哥德体，其大写字母在首字母所需的尺寸下仍然易读；俄文则用 Ponomar，重现圣议会印刷所的教会斯拉夫字体。Ponomar 只排首字母，绝不排正文：一份现代通谕若通篇以圣议会字体排印，便会就其本质说出不实之言。以上皆依 SIL Open Font License 授权，并自本站提供而非取自第三方，因此阅读一个页面不向他人的服务器索求任何东西。',
	'refs.citedIn': '引用于',
	'refs.externalVolume': '{host} 上的第{volume}卷——扫描版 PDF',
	'bible.wholeChapter': '本章',
	'bible.verseNotInEdition': '此版本没有这一节的编号——详见来源页面中的说明。',
	'bible.verseAbbrev': '节',
	'bible.note': '注释',
	'bible.noteMissing': '此文库中没有这条注释',
	'bible.chapterArgument': '提要',
	'ccc.readFullChapter': '阅读整章',
	'ccc.noParagraphNumber': '此文库中没有条目编号',
	'copyright.sourceTitle': '打开原始来源页面',
	'copyright.sourceLabel': '来源',
	'lang.label': '语言',
	'lang.filter': '搜索语言',
	'lang.more': '更多语言',
	'notFound.title': '此地址没有内容',
	'notFound.lede': '您所寻找的页面不在此处。',
	'notFound.body': '链接可能拼写有误或已经过期，也可能指向本站未收录的文本。',
	'notFound.searchHint':
		'如果您知道想要查找的引文——书卷与章节，或教理的某一条目——请在本页顶部的搜索框中输入。',
	'notFound.credit': '取材自大英图书馆 Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': '或从以下页面开始：',
	'notFound.home': '首页',
	'compare.enter': '比较版本',
	'compare.exit': '退出比较',
	'compare.missing': '此版本未收录此内容',
	'compare.versificationNote':
		'这两个版本在本章某些地方对经文分节的方式不同（这是文本上的差异，而非翻译上的选择）——同一节号在两栏中未必对应同一句经文。',
	'compare.loading': '正在载入第二种语言…',
	'ui.close': '关闭',
	'shortcuts.title': '键盘快捷键',
	'shortcuts.betweenDocuments': '在文献之间',
	'shortcuts.withinDocument': '在文献内部',
	'shortcuts.show': '显示此列表',
	'help.title': '帮助',
	'help.reading.heading': '正文上方的栏',
	'help.feature.offline':
		'把本站加到主屏幕，它便如应用一般开启。您可下载整部作品，在没有连接时阅读。',
	'help.feature.contents': '您所在作品的分部——卷、部、章——以便在其中移动而不必回到开头。',
	'help.feature.compare':
		'同一处经文的两个版本并列——拉丁文与您自己的语言并列，或一种译本与另一种并列。',
	'help.feature.apparatus':
		'版本自身的注释，以及为正文所写的任何注解，都置于正文之旁而非其下。正文之内的引证是链接，因此引文所指即所至。',
	'help.feature.focus': '清去正文以外的一切。出口仍留在栏原本的位置，使一切不致被关在其后。',
	'zen.enter': '专注模式',
	'zen.exit': '退出专注模式',
	'nav.calendar': '日历',
	'calendar.title': '礼仪日历',
	'calendar.tagline': '罗马通用日历，可推算任何一天——那一天的时期、等级与颜色。',
	'calendar.national.tagline': '{name}及其专有庆日，可推算任何一天。',
	'calendar.calendar': '日历',
	'calendar.which.general': '罗马通用日历',
	'calendar.filter': '搜索国家或地区',
	'calendar.region.europe': '欧洲',
	'calendar.region.americas': '美洲',
	'calendar.region.africa': '非洲',
	'calendar.region.middleEast': '中东',
	'calendar.region.asia': '亚洲',
	'calendar.region.oceania': '大洋洲',
	'calendar.today': '今天',
	'calendar.previousMonth': '上个月',
	'calendar.nextMonth': '下个月',
	'calendar.plainDays': '普通平日',
	'calendar.noSuchDay': '该日期没有推算出礼仪日。',
	// `LiturgicalDayCard` prints this word and THEN the number, so it is the
	// bare noun rather than the 第…周 the ordinal would take in running text.
	'calendar.week': '周',
	'calendar.alsoToday': '今日同时庆祝',
	'calendar.alsoObserved': '今日同时纪念',
	'calendar.obligation': '当守瞻礼',
	'calendar.obligationCanon': 'CIC 第1246条',
	'calendar.sundayCycle': '主日周期',
	'calendar.weekdayCycle': '平日周期',
	'calendar.psalterWeek': '圣咏集周次',
	'lectionary.heading': '弥撒读经',
	'lectionary.slot.reading': '读经',
	'lectionary.slot.reading1': '读经一',
	'lectionary.slot.reading2': '读经二',
	'lectionary.slot.reading3': '读经三',
	'lectionary.slot.reading4': '读经四',
	'lectionary.slot.reading5': '读经五',
	'lectionary.slot.reading6': '读经六',
	'lectionary.slot.reading7': '读经七',
	'lectionary.slot.psalm': '答唱咏',
	'lectionary.slot.epistle': '书信',
	'lectionary.slot.acclamation': '福音前欢呼',
	'lectionary.slot.gospel': '福音',
	'lectionary.slot.sequence': '继抒咏',
	'lectionary.or': '或',
	'lectionary.cf': '参',
	'lectionary.about': '关于这些读经',
	'lectionary.caveat':
		'读经篇目由《弥撒读经总目》（Ordo Lectionum Missae）所定，链接至本站自己的版本——并非任何特定教会所诵读的译本，主教团也可能调整其编排。',
	'calendar.transferredFrom': '移自',
	'calendar.season.advent': '将临期',
	'calendar.season.christmas': '圣诞期',
	'calendar.season.lent': '四旬期',
	'calendar.season.triduum': '逾越节三日庆典',
	'calendar.season.easter': '复活期',
	'calendar.season.ordinary': '常年期',
	'calendar.colour.white': '白色',
	'calendar.colour.red': '红色',
	'calendar.colour.green': '绿色',
	'calendar.colour.violet': '紫色',
	'calendar.colour.rose': '玫瑰色',
	'calendar.colour.black': '黑色',
	'calendar.colour.blue': '蓝色',
	'calendar.rank.solemnity': '节日',
	'calendar.rank.feast': '庆日',
	'calendar.rank.memorial': '纪念',
	'calendar.rank.optional-memorial': '自由纪念',
	'calendar.rank.commemoration': '纪念礼',
	'calendar.rank.sunday': '主日',
	'calendar.rank.weekday': '平日',
	'calendar.gloss.season.advent': '圣诞节前的四周：预备主的来临，也是教会年度的开始。',
	'calendar.gloss.season.christmas': '从圣诞节到主受洗节，庆祝主的诞生和祂向世界的显现。',
	'calendar.gloss.season.lent':
		'从圣灰礼仪星期三到主的晚餐弥撒的四十天：补赎、施舍，以及为复活节的预备。',
	'calendar.gloss.season.triduum':
		'从圣周四晚上到复活主日晚上的三天——主的苦难、死亡与复活，是整个年度的顶峰。',
	'calendar.gloss.season.easter':
		'从复活节到圣神降临节的五十天，作为一个整体的庆节来庆祝——「一个伟大的主日」。',
	'calendar.gloss.season.ordinary':
		'在其他时期以外的三十三或三十四周。不是「平常」，而是有次序的：周次是编号的，教会依次诵读主的生平与教导。它分两段而来——圣诞期之后直到四旬期，以及圣神降临节之后直到将临期。',
	'calendar.gloss.rank.solemnity':
		'最高的等级：复活节、圣诞节、耶稣升天、一地的主保。以光荣颂和信经庆祝，并从前一日晚上开始。',
	'calendar.gloss.rank.feast': '在当日之内庆祝。宗徒与圣史，以及主和圣母较大的日子。',
	'calendar.gloss.rank.memorial':
		'在圣人自己的日子纪念他，在该时期本有的弥撒与日课之内。凡举行之处皆有义务。',
	'calendar.gloss.rank.optional-memorial':
		'可举行也可不举行，由司铎或团体选择。若不举行，该日便只是平日。',
	'calendar.gloss.rank.commemoration':
		'纪念在四旬期中所变成的样子：在平日弥撒中加上一段祷词，其余仍保持该时期的完整。',
	'calendar.gloss.rank.sunday':
		'最初的庆节——主的日子，自复活以来每周庆祝。只有节日或主的庆日可以取代它，而在将临期、四旬期和复活期，连这些也不可以。',
	'calendar.gloss.rank.weekday':
		'没有自身庆祝的日子。弥撒与日课都属于该时期——这正是使时期值得认识的地方。',
	'calendar.gloss.colour.white':
		'喜乐。复活期与圣诞期，主的日子（苦难以外者）、圣母、天使，以及并非殉道者的圣人。',
	'calendar.gloss.colour.red': '血与火。圣枝主日与圣周五、圣神降临节、宗徒与圣史，以及殉道者。',
	'calendar.gloss.colour.green': '常年期：希望的颜色，也是生长之物的颜色。',
	'calendar.gloss.colour.violet': '将临期与四旬期，也用于为亡者举行的弥撒。',
	'calendar.gloss.colour.rose':
		'一年用两次——将临期第三主日（Gaudete）与四旬期第四主日（Laetare）——斋戒转轻、终点在望之时。',
	'calendar.gloss.colour.black': '可用于为亡者举行的弥撒。',
	'calendar.gloss.colour.blue':
		'蓝色的特权：在西班牙、菲律宾以及圣座所准许的少数其他地方，于圣母无染原罪节使用。',
	'calendar.gloss.sundayCycle':
		'主日读经历三年而行——甲年、乙年、丙年——依次诵读玛窦、马尔谷与路加，四旬期与复活期则读若望。周期在将临期第一主日随教会年度更换。',
	'calendar.gloss.weekdayCycle':
		'平日读经历两年而行，单年与双年：第一篇读经更换，福音不换。礼仪年以其结束的公历年份命名——奇数年为单年，偶数年为双年。',
	'calendar.gloss.psalterWeek':
		'时辰颂祷将圣咏分布于四周，第一周至第四周，全年循环。这是说今天的圣咏属于哪一周，为诵念时辰颂祷的人而设。',
	'calendar.gloss.obligation':
		'信友有义务参与弥撒、并避免妨碍参与的工作的日子。每个主日，以及各主教团所规定的其他日子。',
	'calendar.primer.title': '初次接触？',
	'calendar.primer.lead':
		'教会守着自己的一年。它从将临期开始，环绕复活节而转，并给每一天一个名称、一个等级和一种颜色——这些决定了当天在弥撒和时辰颂祷中所祈祷与诵读的内容。因此「常年期第二十三主日」是一个地址：它告诉司铎、唱经班，或在家祈祷的人，哪些祷文与读经属于今天。',
	'calendar.primer.seasons': '礼仪时期',
	'calendar.primer.ranks': '一天可以是什么',
	'calendar.primer.colours': '颜色',
	'calendar.primer.cycles': '周期',
	'calendar.primer.cyclesLead': '三个计数，合起来说明今天所指定的读经与圣咏。'
};
