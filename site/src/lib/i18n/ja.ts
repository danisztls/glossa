/**
 * 日本語 UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * ADDED 2026-09-06, and the reason is the calendar. `calendar/names/ja.ts`
 * holds the General Roman Calendar's 218 celebrations and the whole Proper of
 * Time in 日本語, read off the calendar GCatholic publishes for this
 * language — so the site could name every day of the year in it and had no
 * chrome to put around them. That is the combination `../ui-langs.ts` says the
 * interface list should never leave standing, arriving from the calendar's
 * side rather than the corpus's.
 *
 * The same 280 keys the other tail dictionaries carry: every chrome page's
 * name and description, the reader-facing controls, the colophon, and all 75
 * `calendar.*` keys — the 44 the calendar page labels itself with and the 31
 * that teach what those labels mean. IT HAS NOT BEEN READ BY A NATIVE
 * SPEAKER. `colophon.whatThisIsStanding` and `footer.notEndorsed` (the
 * canonical standing statement, Can. 216 CIC, at full length and in the one
 * line the footer of every page carries) and `colophon.copyrightBody3` (how a
 * rights holder reaches us) are the ones to check first: all three are
 * operative rather than descriptive. Deleting a doubtful line is a valid fix —
 * it falls back to English.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const ja: Dictionary = {
	'nav.bible': '聖書',
	'nav.ccc': 'カテキズム',
	'nav.compendium': '要約',
	'nav.magisterium': '教導職',
	'nav.socialDoctrine': '社会教説',
	'socialDoctrine.landing.title': '教会の社会教説綱要',
	'socialDoctrine.landing.tagline': '社会における生について教会が教えることを、583の番号付き項に。',
	'nav.canonLaw': '教会法',
	'canonLaw.landing.title': '教会法典',
	'canonLaw.landing.tagline': 'ラテン教会の法。七巻・1,752条。',
	'canonLaw.canon': '第',
	'canonLaw.canons': '第',
	'canonLaw.prevCanon': '前の条',
	'canonLaw.nextCanon': '次の条',
	'canonLaw.readFullTitle': 'この題全体を読む',
	'canonLaw.superseded': '次の文言に置き換えられました',
	'nav.prayers': '祈り',
	'nav.bookmarks': 'しおり',
	'nav.menu': 'メニュー',
	'home.title': 'Glossa Catholica',
	'reading.continue': '読書を続ける',
	'home.tagline':
		'聖書とカテキズムと教導職の文書を読むためのサイト。無料で、オフラインでも読め、登録は要りません。',
	'home.doors.heading': 'どこへ行きますか',
	'home.find.heading': 'あるいは参照を入力',
	'nav.library': '書庫',
	'nav.learn': '学ぶ',
	'library.landing.tagline': '全所蔵を棚ごとに。あなたが印を付けたものも。',
	'schola.landing.title': 'どこから始めるか',
	'schola.landing.tagline':
		'ここにあるものの短い案内 — それぞれの書物が何であるか、その引用はどう書かれるか、箇所をどう探すか、そして教会が示してきた読書の順序。',
	'schola.start.heading': 'はじめての方へ',
	'schola.start.body': 'まずは',
	'schola.start.bodyAfter':
		'から。カテキズムと同じ教えを、はるかに短く、問いと答えの形で述べたものです。分量はおよそ十分の一で、前提知識を求めません。',
	'schola.bible.heading': '聖書を読んだことがない方へ',
	'schola.bible.library':
		'聖書は一冊の本ではなく七十三の書物です。千年以上をかけて書かれ、教会が定めた順に綴じられています — 出来事の起こった順でも、読みやすい順でもありません。多くの人は最初の頁から読み始め、数週間後、古代の律法の長い章のなかで止めてしまいます。それが何のためのものか、まだ誰も告げていないからです。',
	'schola.bible.step.gospel': '福音書から始める',
	'schola.bible.start':
		'イエスの生涯についての四つの短い書のひとつ。冒頭ではなく、ずっと先にあります。これは私たちの思いつきではありません。教会の公会議が、人々に聖書の正しい用い方を教えるよう求め、「とりわけ新約聖書を、なかでも福音書を」と言いました。どれか一つを名指しはせず、私たちもしません。',
	'schola.bible.whichGospel':
		'三つがよく勧められます。理由はそれぞれ違います。どれから始めても良い場所です。',
	'schola.bible.gospel.mark':
		'いちばん短い書。午後のうちに読み通せます。始めにおいては、最良の一つを選んだことよりも、一つを読み終えたことのほうが値打ちがあります。',
	'schola.bible.gospel.luke':
		'信仰の外にいて、話を順序立てて知りたいと願った人のために書かれました — それはまさにあなたかもしれません。そのまま使徒言行録へと続くので、実際にはより長い書の前半です。',
	'schola.bible.gospel.john':
		'何のために書かれたかを自ら言う書 — 「あなたがたが信じるため」。平易な言葉で、イエスとは誰かという問いへまっすぐ向かいます。',
	'schola.bible.step.acts': 'その次に起こったこと',
	'schola.bible.thenActs':
		'一つ読み終えたら、彼を知っていた人々が、彼が去ったあとに何をしたかを読んでください。',
	'schola.bible.acts.why':
		'福音書が終わってからの三十年 — おびえた数十人の人々と、彼らが見たものが帝国の反対側にまで届いた次第。',
	'schola.bible.step.old': 'それから古い方の半分へ',
	'schola.bible.thenOld':
		'最初の頁からではなく、全部でもありません。物語を担ういくつかの箇所があり、それこそ福音書が繰り返し指し示す場所です。',
	'schola.bible.ot.beginnings': 'どのように始まり、どのように狂っていくか。',
	'schola.bible.ot.promise': '一つの家族と、そこにいる誰よりも長く生き延びる約束。',
	'schola.bible.ot.exodus': '奴隷の身から導き出された民と、生きるために与えられた律法。',
	'schola.bible.ot.psalms':
		'物語ではありません。百五十の祈りと歌です。一つずつ、どの順でも読めます。教会は今も毎日これを祈っています。',
	'schola.bible.bothWays':
		'見覚えのあるものに出会うはずです。それは偶然ではなく、むしろ要点です。教会は古い書をキリストの光のもとで読み、新しい書を先立つものの光のもとで読みます — 互いが互いを説き明かすので、どちらも単独では読まれません。',
	'schola.guide.heading': 'この場所の歩き方',
	'schola.guide.lede':
		'本文がページのすべてです。それ以外はすべて操作であり、必要になるまで無視して構いません。',
	'schola.guide.top.heading': 'どのページにもある上のバー',
	'schola.guide.reading.heading': '本文の上のバー',
	'schola.feature.search':
		'上の欄に参照を入力してください — 章と節、項の番号、文書の名前 — 入力しながら補完されます。どこからでも / か Ctrl+K を、他のショートカットは ? を押してください。',
	'schola.feature.languages':
		'インターフェースと本文は別々に選べます。ボタンは一つの言語のまま、作品を別の言語で読めます。あなたの言語に版が複数あるときは、そのなかからも選べます。',
	'schola.feature.settings':
		'文字の大きさ、明暗、セピア、そして本文のかたわらにどれだけの註を置くか。',
	'schola.feature.offline':
		'ホーム画面に追加すればアプリのように開きます。作品をまるごとダウンロードして、接続なしで読めます。',
	'schola.feature.contents':
		'いま開いている作品の区分 — 巻、部、章 — 最初に戻らずに内部を移動できます。',
	'schola.feature.compare':
		'同じ箇所の二つの版を並べて — ラテン語をあなたの言語のかたわらに、あるいは一つの翻訳を別の翻訳のかたわらに。',
	'schola.feature.apparatus':
		'版そのものの脚註と、本文に書かれた注解は、下ではなくかたわらに置かれます。本文中の引用はリンクなので、参照はそれが指す先へ運びます。',
	'schola.feature.focus':
		'本文以外をすべて消します。出口はバーのあった場所に残るので、何も閉じ込められません。',
	'schola.books.heading': 'ここにあるものと、その引用のしかた',
	'schola.books.lede':
		'これらはそれぞれ種類の異なる書物であり、それぞれ固有の番号で参照されます。例はその形を示しています。同じように検索欄に入力すれば、その箇所に着きます。',
	'schola.cite.label': '引用の形',
	'schola.what.scripture':
		'教会が受け取ったままの聖書、旧新両約。ここにある他のすべては、その光のもとで読まれます。',
	'schola.cite.scripture': '書名・章・節。あなたの版が印刷している略号で',
	'schola.what.catechism':
		'カトリック教会が信じることを一巻にまとめたもの。それ自体は源泉ではありません。聖書、教父、典礼、教会の教えを集めたものであり、どの項も自らの述べることの出どころを示します。',
	'schola.cite.catechism': '項番号で。最初の頁から最後まで途切れず続きます',
	'schola.what.compendium': '同じ教えを問いと答えの形にしたもの。分量はおよそ十分の一です。',
	'schola.cite.compendium': '問いの番号で',
	'schola.what.magisterium':
		'教皇と公会議が実際に書いたもの — 回勅、憲章、教令、宣言 — それぞれが特定の時と特定の問いに向けられています。それぞれラテン語の冒頭の語で呼ばれます。',
	'schola.cite.magisterium': '文書の名前、次にその中の節番号で',
	'schola.what.social':
		'労働、所有、家庭、政治、平和についての教会の教えを、それらの文書から集めて一巻にしたもの。',
	'schola.cite.social': '項番号で。作品が自らに用いる略号のもとに',
	'schola.what.law': '教義ではなく法。教会が何を求めるかを述べるものであり、改正されます。',
	'schola.cite.law': '条で。番号の付いた単位はそう呼ばれます',
	'schola.what.doctors':
		'教会が教会博士と名づけた神学者たち。著者がいかに偉大であれ、公の権威を帯びるものではありません。',
	'schola.cite.doctors': '部、次に問で — 『神学大全』自身の区分',
	'schola.what.prayers': '教会が祈る言葉を、ラテン語をかたわらに置いて。',
	'schola.cite.prayers': '名前で。引用すべき番号はありません',
	'schola.places.heading': '本文ではなく、このサイトの場所',
	'schola.what.library': 'サイト上のすべての作品を一覧に。種類ではなく主題ごとに分けてあります。',
	'schola.what.calendar': '典礼の日 — 季節、色、誰が記念されるか — あなたが従う国の暦で。',
	'schola.what.bookmarks':
		'印を付けた箇所と、各作品でどこまで読んだか。どちらもこのブラウザに保存され、どこにも送られません。',
	'jumpbox.placeholder': '移動先… （例 john 3:16、ccc 1234）',
	'jumpbox.short': '検索',
	'jumpbox.hint': '/ か Ctrl+K で参照へ移動',
	'jumpbox.noMatch': '一致なし',
	'jumpbox.suggestions': '候補',
	'settings.label': '設定',
	'darkMode.label': 'ダークモード',
	'darkMode.auto': '自動',
	'darkMode.on': 'オン',
	'darkMode.off': 'オフ',
	'loadFailed.title': '読み込めませんでした',
	'loadFailed.hint':
		'ページは存在します。取得の途中で何かが起きました。もう一度試すとたいてい成功します。',
	'loadFailed.retry': 'もう一度',
	'loadFailed.retrying': '試しています…',
	'fontSize.label': '文字の大きさ',
	'fontSize.larger': '大きく',
	'fontSize.smaller': '小さく',
	'print.label': 'このページを印刷',
	'toTop.label': '先頭へ戻る',
	'edition.label': '版',
	'edition.select': '版を選ぶ',
	'edition.current': '現在の版',
	'edition.filter': '版を検索',
	'menu.noMatches': '一致なし',
	'unitNav.previous': '前へ',
	'unitNav.next': '次へ',
	'bible.prevChapter': '前の章',
	'bible.nextChapter': '次の章',
	'bible.pickBook': '書と章',
	'bible.landing.title': '聖書',
	'bible.landing.tagline': '聖書全体を、書ごとに、章ごとに読む。',
	'bible.landing.books': '書',
	'bible.introduction': '序',
	'bible.group.pentateuch': 'モーセ五書',
	'bible.group.historical': '歴史書',
	'bible.group.wisdom': '知恵文学',
	'bible.group.prophetic': '預言書',
	'bible.group.gospels': '福音書',
	'bible.group.acts': '使徒言行録',
	'bible.group.pauline': 'パウロ書簡',
	'bible.group.catholicLetters': '公同書簡',
	'bible.group.revelation': 'ヨハネの黙示録',
	'ccc.landing.title': 'カトリック教会のカテキズム',
	'ccc.landing.pairTitle': 'カテキズムと要約',
	'ccc.landing.tagline':
		'<strong>カテキズム</strong>はカトリックの教義を2,865の番号付き項に述べます。<strong>要約</strong>は同じ教義を、同じ骨組みのうえで598の問いと答えとして述べ直します。',
	'ccc.landing.pairTagline': '『カトリック教会のカテキズム』2,865項と、その『要約』598問。',
	'compendium.landing.title': 'カテキズム要約',
	'compendium.landing.tagline': '『カトリック教会のカテキズム』を要約した問いと答え。',
	'compendium.question': '問',
	'compendium.answer': '答',
	'compendium.tableOfContents': '目次',
	'compendium.prevQuestion': '前の問',
	'compendium.nextQuestion': '次の問',
	'compendium.condenses': 'カテキズム ¶¶ の要約',
	'ccc.abbrev': 'CCC',
	'compendium.abbrev': '要約',
	'compendium.noQuestionNumber': 'この所蔵には問いの番号がありません',
	'nav.summa': '神学大全',
	'doctores.landing.title': '教会博士',
	'doctores.landing.tagline': '教会の教父と博士たちの神学的著作。',
	'summa.landing.title': '神学大全',
	'summa.landing.tagline': 'トマス・アクィナス。英語と、彼が書いたラテン語で。',
	'index.division': '区分',
	'prayers.landing.title': '共通の祈り',
	'prayers.landing.tagline': 'ラテン語の本文をかたわらに置いた祈り。',
	'prayers.seeAlso': 'あわせて',
	'anchor.actions': '参照の操作',
	'anchor.copy': '本文をコピー',
	'anchor.copyLink': 'リンクをコピー',
	'anchor.view': '表示',
	'anchor.copied': 'コピーしました',
	'anchor.copyFailed': 'コピーできませんでした',
	'bookmark.add': 'しおりを挟む',
	'bookmark.remove': 'しおりを外す',
	'bookmark.library': 'しおり',
	'bookmark.library.tagline': '読みながら印を付けたすべて。',
	'bookmark.empty': 'まだ何も印が付いていません。',
	'bookmark.emptyHint':
		'節や項の番号をクリックして「しおりを挟む」を選ぶか、ページのしおりボタンを使ってください。',
	'bookmark.deviceOnly':
		'しおりはこのブラウザにのみ保存されます。どこにも送られず、ブラウザのデータを消すと失われます。',
	'bookmark.unavailable': 'いま読んでいる版にはありません',
	'document.library.tagline': '回勅、公会議憲章、教令、そして教導職の宣言。',
	'colophon.title': '奥付',
	'colophon.lede':
		'このサイトが何であるか、本文がどこから来ているか、それを複製することについて私たちがどう考えているか。',
	'colophon.whatThisIs': 'これは何か',
	'colophon.whatThisIsBody':
		'Glossa Catholica は、聖書、カテキズム、要約、そして教導職の文書を、英語・ポルトガル語・ラテン語で読むためのサイトです。読まれるために存在し、読むにあたって他に何も求めません。',
	'colophon.pointFree': '無料、そして常に無料。有料の壁も、購読も、買うものもありません。',
	'colophon.pointNoAds': '広告なし。いかなる種類の有料掲載もありません。',
	'colophon.pointNoAccounts': 'アカウントなし。登録するものも、ログインするものもありません。',
	'colophon.pointNoTracking':
		'追跡スクリプトなし、第三者のコードなし、クッキーなし。あなたを特定するものを何も含まない匿名の利用回数のみ。',
	'colophon.pointOffline':
		'一度訪れればオフラインでも動き続けるように作られています。回線の悪さが読書の壁になる必要はありません。',
	'colophon.whatThisIsStanding':
		'Glossa Catholica は信徒による私的な事業です。教会の認可を帯びておらず、それ自身の権威をもって語るものではありません。',
	'footer.notEndorsed': '教皇庁の承認によるものではありません',
	'colophon.textsTitle': '本文',
	'colophon.textsBody':
		'すべての本文には名の明かされた出所があり、どの作品もその版、出所のページ、取得した日付を記録しています。聖書はパブリックドメインの翻訳を用い、カテキズム、要約、教導職の文書は教皇庁自身が公にした本文から来ています。',
	'colophon.textsFidelity':
		'本文を省略せず、言い換えず、書き換えず、広告のかたわらに置きません。明らかな瑕疵は直します — 落ちた語、壊れた引用、段落を飲み込んだマークアップ — 常に出所そのものが印刷しているものへ向けて直すのであり、こうあるべきだと私たちが思うものへ向けてではありません。',
	'colophon.countBible': '聖書の版',
	'colophon.countDocuments': '教導職の文書',
	'colophon.copyrightTitle': '著作権',
	'colophon.copyrightBody1':
		'カテキズム、要約、教導職の文書は、それぞれの権利者 — 主としてバチカン出版局と広報のためのディカステリウム — に帰属します。',
	'colophon.copyrightBody2':
		'どの作品も権利者自身の著作権表示を、その文言のまま掲げ、取得元のページへ結んでいます。',
	'colophon.copyrightBody3':
		'ここにある本文の権利をお持ちで、公開を望まれない場合は、ご連絡ください。',
	'colophon.contactTitle': '連絡先',
	'colophon.contactBody': '上記を含め、どのようなことでも：',
	'colophon.contactPending':
		'連絡先はまだ設定されていません。それが定まるまで、このサイトは公開されるべきではありません — 連絡の手段のない約束には意味がないからです。',
	'colophon.illustrationsTitle': '挿絵',
	'colophon.illustrationsBody':
		'聖書にはギュスターヴ・ドレの木口木版が、それぞれ描かれた節の位置に置かれています — 彼の聖書連作の最後にして最大のもので、下絵から木に彫られ、巻末にまとめられるのではなく本文とともに刷られました。',
	'colophon.illustrationsRights':
		'以下の年代が示すとおりパブリックドメインにあり、パブリックドメインの版画を忠実に写真複製したものは、それ自体の新たな著作権を帯びません。',
	'colophon.countPlates': '図版',
	'colophon.countPlateChapters': '挿絵のある章',
	'art.about': 'この絵について',
	'art.detail': '部分',
	'colophon.typeTitle': '書体',
	'colophon.typeBody':
		'本文は EB Garamond。1590年代にクロード・ガラモンが彫った活字を、ゲオルク・ドゥフナーとオクタビオ・パルドが復刻したもので、教会がルネサンス以来印刷してきた人文主義の系譜です。キリル文字は同じ手によりますが復刻ではありません。ガラモンのキリル文字は彫られたことがないので、ロシア語は他と並ぶよう描かれた形で組まれています。',
	'colophon.typeArabic':
		'アラビア文字はそれもかなわず、Amiri で組まれています — ハーレド・ホスニーによる、1905年カイロのブーラーク印刷所のために彫られたナスフ体の復刻で、本文書体と同じ考えから選ばれました。現代の描き文字ではなく、特定の歴史的な書物の活字であるということです。',
	'colophon.typeInitials':
		'冒頭の飾り文字は Pirata One。ドロップキャップが求める大きさで大文字が読みやすく保たれるブラックレターです。ロシア語には Ponomar を用い、これはシノド印刷所の教会スラヴ語活字を再現します。Ponomar は飾り文字にのみ用い、本文には決して用いません — 現代の回勅をシノド活字で通して組めば、それが何であるかについて偽りを語ることになるからです。いずれも SIL オープンフォントライセンスのもとにあり、第三者ではなくこのサイトから配信されるので、ページを読むのに他者のサーバーを煩わせません。',
	'copyright.sourceTitle': '元の出所ページを開く',
	'copyright.sourceLabel': '出所',
	'lang.label': '言語',
	'lang.filter': '言語を検索',
	'lang.more': '他の言語',
	'calendar.title': '典礼暦',
	'calendar.tagline': 'ローマ一般暦を任意の日について計算します — その季節、その等級、その色。',
	'calendar.date': '日付',
	'calendar.calendar': '暦',
	'calendar.which.general': 'ローマ一般暦',
	'calendar.filter': '国を検索',
	'calendar.region.europe': 'ヨーロッパ',
	'calendar.region.americas': 'アメリカ大陸',
	'calendar.region.africa': 'アフリカ',
	'calendar.region.asia': 'アジア',
	'calendar.region.oceania': 'オセアニア',
	'calendar.today': '今日',
	'calendar.previousMonth': '前の月',
	'calendar.nextMonth': '次の月',
	'calendar.noSuchDay': 'その日付について典礼日は計算されません。',
	'calendar.week': '週',
	'calendar.alsoToday': '今日あわせて祝われるもの',
	'calendar.alsoObserved': '今日あわせて記念されるもの',
	'calendar.obligation': '守るべき祝日',
	'calendar.obligationCanon': '教会法 第1246条',
	'calendar.sundayCycle': '主日の周期',
	'calendar.weekdayCycle': '週日の周期',
	'calendar.psalterWeek': '詩編週',
	'calendar.transferredFrom': '移された元の日',
	'calendar.season.advent': '待降節',
	'calendar.season.christmas': '降誕節',
	'calendar.season.lent': '四旬節',
	'calendar.season.triduum': '過越の聖なる三日間',
	'calendar.season.easter': '復活節',
	'calendar.season.ordinary': '年間',
	'calendar.colour.white': '白',
	'calendar.colour.red': '赤',
	'calendar.colour.green': '緑',
	'calendar.colour.violet': '紫',
	'calendar.colour.rose': 'バラ色',
	'calendar.colour.black': '黒',
	'calendar.colour.blue': '青',
	'calendar.rank.solemnity': '祭日',
	'calendar.rank.feast': '祝日',
	'calendar.rank.memorial': '記念日',
	'calendar.rank.optional-memorial': '任意の記念日',
	'calendar.rank.commemoration': '記念',
	'calendar.rank.sunday': '主日',
	'calendar.rank.weekday': '週日',
	'calendar.gloss.season.advent':
		'降誕祭の前の四週間。主の来臨に備える時であり、教会の一年の始まりです。',
	'calendar.gloss.season.christmas':
		'降誕祭から主の洗礼まで。主の誕生と、世に対するその現れを祝います。',
	'calendar.gloss.season.lent':
		'灰の水曜日から主の晩餐の夕べのミサまでの四十日。悔い改め、施し、そして復活祭への備えの時です。',
	'calendar.gloss.season.triduum':
		'聖木曜日の夕べから復活の主日の夕べまでの三日間 — 主の受難と死と復活であり、一年全体の頂です。',
	'calendar.gloss.season.easter':
		'復活祭から聖霊降臨までの五十日。ひとつの祝祭として祝われ — 「ひとつの大いなる主日」と呼ばれます。',
	'calendar.gloss.season.ordinary':
		'他の季節の外にある三十三または三十四週間。「ふつう」ではなく、順序づけられているという意味です。週には番号が付され、教会は主の生涯と教えを順に読み進めます。二つの区間に分かれて来ます — 降誕節のあと四旬節まで、そして聖霊降臨のあと待降節まで。',
	'calendar.gloss.rank.solemnity':
		'最も高い等級。復活祭、降誕祭、主の昇天、その土地の保護の聖人など。栄光の賛歌と信仰宣言を伴い、前日の夕べから始まります。',
	'calendar.gloss.rank.feast':
		'その日のうちに祝われます。使徒と福音記者、そして主と聖母のより大きな日々。',
	'calendar.gloss.rank.memorial':
		'聖人をその日に記念します。その季節自身のミサと聖務日課のうちで行われます。行われる場所では義務です。',
	'calendar.gloss.rank.optional-memorial':
		'司祭または共同体の選びにより、行っても行わなくてもかまいません。行わなければ、その日はただの週日です。',
	'calendar.gloss.rank.commemoration':
		'四旬節において記念日が変わる姿。週日のミサに祈りを一つ加えるもので、季節はそれ以外をそのまま保ちます。',
	'calendar.gloss.rank.sunday':
		'最初の祝日 — 主の日であり、復活以来毎週祝われてきました。祭日または主の祝日のみがこれに代わることができ、待降節・四旬節・復活節にはそれらでさえ代われません。',
	'calendar.gloss.rank.weekday':
		'固有の祝いのない日。ミサも聖務日課もその季節のものであり — だからこそ季節を知ることに値打ちがあります。',
	'calendar.gloss.colour.white':
		'喜び。復活節と降誕節、受難以外の主の日々、聖母、天使たち、そして殉教者でなかった聖人たち。',
	'calendar.gloss.colour.red':
		'血と火。受難の主日と聖金曜日、聖霊降臨、使徒と福音記者、そして殉教者たち。',
	'calendar.gloss.colour.green': '年間。希望の色であり、育つものの色です。',
	'calendar.gloss.colour.violet': '待降節と四旬節。死者のためのミサでも用いられます。',
	'calendar.gloss.colour.rose':
		'年に二度用いられます — 待降節第三主日のガウデーテと、四旬節第四主日のレターレ — 節制がやわらぎ、終わりが見えてくる日です。',
	'calendar.gloss.colour.black': '死者のためのミサで用いることができます。',
	'calendar.gloss.colour.blue':
		'青の特権。スペイン、フィリピン、そして教皇庁がこれを認めたわずかな地で、無原罪の御宿りに用いられます。',
	'calendar.gloss.sundayCycle':
		'主日の朗読は三年 — A年、B年、C年 — にわたり、マタイ、マルコ、ルカを順に読み、四旬節と復活節にはヨハネを読みます。周期は教会の一年とともに待降節第一主日に変わります。',
	'calendar.gloss.weekdayCycle':
		'週日の朗読は二年、I年とII年にわたります。第一朗読は変わり、福音は変わりません。典礼暦年は、それが終わる西暦年で呼ばれます — 奇数年がI、偶数年がIIです。',
	'calendar.gloss.psalterWeek':
		'教会の祈りは詩編を四週間、第一週から第四週に配分し、一年を通じて繰り返します。今日の詩編がどの週のものかを示すもので、時課を祈る人のためのものです。',
	'calendar.gloss.obligation':
		'信者がミサにあずかり、それを妨げる労働を控える義務のある日。すべての主日と、各司教協議会が定めたその他の日です。',
	'calendar.primer.title': 'はじめてですか',
	'calendar.primer.lead':
		'教会は固有の一年を保っています。待降節に始まり、復活祭を軸に回り、一日ごとに名前と等級と色を与えます — そしてそれらが、その日ミサと教会の祈りで何を祈り何を読むかを定めます。ですから「年間第二十三主日」は住所です。司祭にも、聖歌隊にも、家で祈る人にも、今日に属する祈りと朗読がどれかを告げます。',
	'calendar.primer.seasons': '季節',
	'calendar.primer.ranks': '一日がなりうるもの',
	'calendar.primer.colours': '色',
	'calendar.primer.cycles': '周期',
	'calendar.primer.cyclesLead':
		'三つの数え。合わせて、今日に定められた朗読と詩編がどれかを告げます。'
};
