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
	'colophon.typeTitle': '字体',
	'colophon.typeBody':
		'以 EB Garamond 排印，这是 Georg Duffner 与 Octavio Pardo 对克洛德·加拉蒙于一五九〇年代所刻字体的复刻——教会自文艺复兴以来即以此人文主义传统付印。其西里尔字母出自同一双手，却未复刻任何东西：从未有人刻过西里尔文的加拉蒙体，因此俄文所用的是为与其余字体并立而绘的形体。',
	'colophon.typeArabic':
		'阿拉伯文全然超出其范围，改以 Amiri 排印——这是 Khaled Hosny 对一九〇五年为开罗布拉克印刷所所刻纳斯赫体的复刻，选用的理由与正文字体相同：取一种特定的历史书籍字体，而非当代的新绘。',
	'colophon.typeInitials':
		'开头的首字母为 Pirata One，一种哥德体，其大写字母在首字母所需的尺寸下仍然易读；俄文则用 Ponomar，重现圣议会印刷所的教会斯拉夫字体。Ponomar 只排首字母，绝不排正文：一份现代通谕若通篇以圣议会字体排印，便会就其本质说出不实之言。以上皆依 SIL Open Font License 授权，并自本站提供而非取自第三方，因此阅读一个页面不向他人的服务器索求任何东西。'
};
