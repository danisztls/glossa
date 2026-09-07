/**
 * Беларуская UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 31 editions in Беларуская and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
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

export const be: Dictionary = {
	'nav.bible': 'Біблія',
	'nav.ccc': 'Катэхізіс',
	'nav.compendium': 'Кампендыум',
	'nav.magisterium': 'Настаўніцтва Касцёла',
	'nav.socialDoctrine': 'Сацыяльнае вучэнне',
	'socialDoctrine.landing.title': 'Кампендыум сацыяльнага вучэння Царквы',
	'socialDoctrine.landing.tagline':
		'Чаму Царква вучыць пра жыццё ў грамадстве — 583 пранумараваныя раздзелы.',
	'nav.canonLaw': 'Кананічнае права',
	'canonLaw.landing.title': 'Кодэкс кананічнага права',
	'canonLaw.landing.tagline': 'Права Лацінскага Касцёла ў 1752 канонах у сямі кнігах.',
	'canonLaw.canon': 'Кан.',
	'canonLaw.canons': 'Кан.',
	'canonLaw.prevCanon': 'Папярэдні канон',
	'canonLaw.nextCanon': 'Наступны канон',
	'canonLaw.readFullTitle': 'Чытаць увесь тытул',
	'canonLaw.superseded': 'Фармулёўка, заменена',
	'nav.prayers': 'Малітвы',
	'nav.bookmarks': 'Закладкі',
	'nav.menu': 'Меню',
	'nav.sections': 'Раздзелы',
	'nav.works': 'Творы',
	'nav.pages': 'Старонкі',
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Працягнуць чытанне',
	'home.tagline':
		'Сайт для чытання Пісання, Катэхізіса і дакументаў Магістэрыюма — бясплатна, працуе па-за сеткай, і нідзе не трэба рэгістравацца.',
	'home.doors.heading': 'Куды пайсці',
	'home.find.heading': 'Або ўвядзіце спасылку',
	'nav.library': 'Бібліятэка',
	'nav.learn': 'Навучанне',
	'library.landing.tagline':
		'Увесь збор, паліца за паліцай — разам з тым, дзе вы спыніліся, і тым, што вы адзначылі.',
	'schola.landing.title': 'Адкуль пачаць',
	'schola.landing.tagline':
		'Кароткі даведнік па тым, што тут ёсць: чым з’яўляецца кожная з гэтых кніг, як запісваецца спасылка на яе, як знайсці месца, і парадкі чытання, якія прапанаваў Касцёл.',
	'schola.start.heading': 'Упершыню ў каталіцтве?',
	'schola.start.body': 'Найлепшы пачатак — ',
	'schola.start.bodyAfter':
		': тое самае вучэнне, што і ў Катэхізісе, значна карацейшае, выкладзенае пытаннямі і адказамі. Ён прыкладна ў дзесяць разоў меншы і нічога не мяркуе загадзя.',
	'schola.bible.heading': 'Ніколі не чыталі Біблію?',
	'schola.bible.library':
		'Гэта не адна кніга, а семдзесят тры, пісаныя болей за тысячу гадоў і сабраныя ў тым парадку, на якім спыніўся Касцёл, — не ў парадку падзей і не ў тым, які чытаецца найлягчэй. Большасць пачынае з першай старонкі і кідае праз некалькі тыдняў, пасярод доўгага раздзела старажытнага закону, бо ніхто ім яшчэ не сказаў, дзеля чаго гэта.',
	'schola.bible.step.gospel': 'Пачніце з Евангелля',
	'schola.bible.start':
		'Адна з чатырох кароткіх кніг пра жыццё Езуса, глыбока ўнутры, а не спераду. Гэта не наша выдумка: Сабор Касцёла прасіў вучыць правільнаму карыстанню Пісаннем, «асабліва Новага Запавету і перадусім Евангелляў». Ён не назваў ніводнага паасобку, і мы не назавём.',
	'schola.bible.whichGospel':
		'Тры звычайна прапануюць, з трох розных прычын. Любое з іх — добрае месца, дзе быць.',
	'schola.bible.gospel.mark':
		'Найкарацейшае. Яго можна прачытаць цалкам за адзін вечар, і дачытаць адно напачатку вартае болей, чым выбраць найлепшае.',
	'schola.bible.gospel.luke':
		'Напісана для чалавека па-за верай, які хацеў, каб усё было выкладзена па парадку, — чым, магчыма, і ёсць вы. Яно проста пераходзіць у Дзеі Апосталаў, дык гэта насамрэч першая палова даўжэйшай кнігі.',
	'schola.bible.gospel.john':
		'Тое, якое проста кажа, дзеля чаго напісана: «каб вы ўверылі». Простыя словы, і яно адразу бярэцца за пытанне, хто такі Езус.',
	'schola.bible.step.acts': 'Потым — што было далей',
	'schola.bible.thenActs':
		'Дачытаўшы адно, прачытайце, што зрабілі тыя, хто Яго ведаў, пасля таго як Ён адышоў.',
	'schola.bible.acts.why':
		'Трыццаць гадоў пасля канца Евангелляў: некалькі дзясяткаў напалоханых людзей і тое, як убачанае імі дайшло да другога краю імперыі.',
	'schola.bible.step.old': 'Потым старэйшая палова',
	'schola.bible.thenOld':
		'Не з першай старонкі і не ўся. Некалькі месцаў нясуць аповед, і гэта якраз тыя, да якіх Евангеллі раз-пораз адсылаюць.',
	'schola.bible.ot.beginnings': 'Як гэта пачынаецца і як ідзе не так.',
	'schola.bible.ot.promise': 'Адна сям’я і дадзенае ёй абяцанне, якое перажывае ўсіх у ёй.',
	'schola.bible.ot.exodus': 'Народ, выведзены з няволі, і дадзены яму закон, паводле якога жыць.',
	'schola.bible.ot.psalms':
		'Не аповед: сто пяцьдзясят малітваў і песняў. Чытайце па адной, у любым парадку. Касцёл моліцца імі кожны дзень і дагэтуль.',
	'schola.bible.bothWays':
		'Вы будзеце пазнаваць знаёмае, і ў гэтым сэнс, а не супадзенне. Касцёл чытае старажытныя кнігі ў святле Хрыста, а пазнейшыя — у святле таго, што было раней: кожная палова тлумачыць другую, і таму ніводная не чытаецца асобна.',
	'schola.books.heading': 'Што тут ёсць і як гэта абазначаецца',
	'schola.books.lede':
		'Кожная з гэтых кніг іншага роду, і на кожную спасылаюцца ўласным лікам. Прыклады паказваюць форму: набярыце падобны ў полі пошуку і трапіце на месца.',
	'schola.cite.label': 'Абазначаецца',
	'schola.what.scripture':
		'Пісанне, як яго прымае Касцёл, у абодвух Запаветах. Усё астатняе тут чытаецца ў яго святле.',
	'schola.cite.scripture': 'кніга, раздзел і верш, у скаротах, якія друкуе ваша выданне',
	'schola.what.catechism':
		'Выклад таго, у што верыць Каталіцкі Касцёл, у адным томе. Сам ён не крыніца: ён збірае Пісанне, Айцоў, літургію і вучэнне Касцёла, і кожны параграф кажа, адкуль узята тое, што ён сцвярджае.',
	'schola.cite.catechism': 'паводле нумара параграфа, які ідзе запар ад першай старонкі да апошняй',
	'schola.what.compendium':
		'Тое самае вучэнне, выкладзенае пытаннямі і адказамі, прыкладна ў дзесяць разоў карацей.',
	'schola.cite.compendium': 'паводле нумара пытання',
	'schola.what.magisterium':
		'Тое, што папы і саборы сапраўды напісалі, — энцыклікі, канстытуцыі, дэкрэты, дэкларацыі — кожны звернуты да пэўнага моманту і пэўнага пытання. Кожны вядомы паводле сваіх першых лацінскіх слоў.',
	'schola.cite.magisterium': 'паводле назвы дакумента, потым нумара раздзела ў ім',
	'schola.what.social':
		'Вучэнне Касцёла пра працу, уласнасць, сям’ю, палітыку і мір, сабранае з тых дакументаў у адну кнігу.',
	'schola.cite.social': 'паводле нумара параграфа, пад тым скаротам, якім твор пазначае сябе',
	'schola.what.law': 'Права, а не веравучэнне. Яно кажа, чаго Касцёл патрабуе, і зменьваецца.',
	'schola.cite.law': 'паводле канана — так называюцца яго нумараваныя адзінкі',
	'schola.what.doctors':
		'Багасловы, якіх Касцёл назваў Дактарамі. Гэта не нясе ніякай афіцыйнай улады, якім бы вялікім ні быў аўтар.',
	'schola.cite.doctors': 'паводле часткі, потым пытання — уласных падзелаў Сумы',
	'schola.what.prayers': 'Словы, якімі моліцца Касцёл, з лацінай побач.',
	'schola.cite.prayers': 'паводле назвы; нумароў для цытавання няма',
	'schola.places.heading': 'Не тэксты, а месцы гэтага сайта',
	'schola.what.library':
		'Усе творы сайта адным спісам, згрупаваныя паводле прадмета, а не паводле роду.',
	'schola.what.calendar':
		'Літургічны дзень — перыяд, колер і каго ўспамінаюць — для краіны, чыйго календара вы трымаецеся.',
	'schola.what.bookmarks':
		'Месцы, якія вы адзначылі, і тое, дзе вы апошні раз спыніліся ў кожным творы. І тое, і другое захоўваецца ў гэтым браўзеры і нікуды не адсылаецца.',
	'ccc.noCounterpart': 'Няма адпаведніка ў другім творы',
	'jumpbox.placeholder': 'Перайсці да… (напр. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Пошук',
	'jumpbox.hint': 'Націсніце / або Ctrl+K, каб перайсці да спасылкі',
	'jumpbox.noMatch': 'Нічога не знойдзена',
	'jumpbox.suggestions': 'Прапановы',
	'settings.label': 'Налады',
	'apparatus.label': 'Апарат',
	'apparatus.editionNotes': 'Заўвагі гэтага выдання',
	'apparatus.commentary': 'Каментар',
	'apparatus.inCommentary': 'Уключана ў каментар вышэй.',
	'darkMode.label': 'Цёмны рэжым',
	'darkMode.auto': 'Аўта',
	'darkMode.on': 'Укл.',
	'darkMode.off': 'Выкл.',
	'sepia.label': 'Сепія',
	'sepia.lightOnly': 'Толькі ў светлым рэжыме',
	'sepia.noHue': 'Не ў монахромным рэжыме',
	'oled.label': 'OLED чорны',
	'oled.darkOnly': 'Толькі ў цёмным рэжыме',
	'mono.label': 'Монахромны рэжым',
	'mono.hint':
		'Афарбоўвае ўсю старонку ў адзін шэры колер, каб нішто не адрознівалася паводле колеру. Пакуль ён уключаны, Сепія выключаецца.',
	'advanced.label': 'Дадаткова',
	'library.title': 'Бібліятэка па-за сеткай',
	'library.lede': 'Тэксты, захаваныя на гэтай прыладзе, адкрываюцца зусім без сеткі.',
	'library.essentials': 'Малітвы і Кампендыум',
	'library.illustrations': 'Біблія (ілюстрацыі)',
	'library.illustrationsDetail': 'Біблія (ілюстрацыі, высокая раздзяляльнасць)',
	'library.other': 'Іншыя тэксты',
	'library.everything': 'Усё',
	'library.downloadAll': 'Спампаваць усё',
	'library.download': 'Спампаваць',
	'library.downloaded': 'На гэтай прыладзе',
	'library.offlineNote': 'Каб нешта спампаваць, выключыце рэжым па-за сеткай.',
	'library.remove': 'Прыбраць з гэтай прылады',
	'library.removeConfirm': 'Прыбраць?',
	'library.forget': 'Прыбраць спампаванае',
	'library.forgetConfirm': 'Прыбраць усё?',
	'offline.label': 'Рэжым па-за сеткай',
	'offline.hint':
		'Зусім не выкарыстоўвае сетку: нішто не спампоўваецца, абнаўленні не правяраюцца, нічога не вымяраецца. Адкрыюцца толькі тэксты, якія ўжо ёсць на гэтай прыладзе.',
	'offline.notDownloaded': 'Няма на гэтай прыладзе',
	'loadFailed.title': 'Гэта не загрузілася',
	'loadFailed.hint':
		'Старонка існуе — нешта не спрацавала пры яе атрыманні. Паўторная спроба звычайна дапамагае.',
	'loadFailed.retry': 'Паспрабаваць зноў',
	'loadFailed.retrying': 'Спроба…',
	'offline.turnOff': 'Выключыць рэжым па-за сеткай',
	'fontSize.label': 'Памер тэксту',
	'fontSize.larger': 'Буйнейшы тэкст',
	'fontSize.smaller': 'Драбнейшы тэкст',
	'print.label': 'Надрукаваць гэтую старонку',
	'toTop.label': 'Вярнуцца ўгору',
	'install.label': 'Усталяваць Glossa',
	'install.hint.label': 'Дадаць на галоўны экран',
	'install.hint.title': 'Дадайце Glossa на свой галоўны экран',
	'install.hint.stepBefore': 'Ён адкрываецца як праграма і чытаецца па-за сеткай. Націсніце',
	'install.hint.stepAfter': 'затым «Дадаць на галоўны экран».',
	'install.hint.dismiss': 'Адхіліць',
	'update.label': 'Даступна новае выданне',
	'update.title': 'Новае выданне гатова',
	'update.body': 'Перазагрузіце старонку, каб атрымаць найноўшыя тэксты і выпраўленні.',
	'update.action': 'Перазагрузіць',
	'update.dismiss': 'Не зараз',
	'edition.label': 'Выданне',
	'edition.select': 'Выбраць выданне',
	'edition.current': 'Бягучае выданне',
	'edition.filter': 'Шукаць выданні',
	'menu.noMatches': 'Няма супадзенняў',
	'unitNav.previous': 'Папярэдняе',
	'unitNav.next': 'Наступнае',
	'bible.prevChapter': 'Папярэдні раздзел',
	'bible.nextChapter': 'Наступны раздзел',
	'bible.pickBook': 'Кнігі і раздзелы',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Чытайце ўсю Біблію, кнігу за кнігай, раздзел за раздзелам.',
	'bible.landing.random': 'Мне пашанцуе',
	'bible.landing.books': 'Кнігі',
	'bible.chapterUnavailable': 'Няма ў гэтым выданні',
	'bible.introduction': 'Уводзіны',
	'bible.introUnavailable': 'Пакуль няма ўводзінаў на гэтай мове',
	'bible.introSource': 'Уводзіны не з’яўляюцца часткай тэксту Пісання.',
	'bible.testament.ot': 'Стары Запавет',
	'bible.testament.nt': 'Новы Запавет',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Пяцікніжжа',
	'bible.group.historical': 'Гістарычныя кнігі',
	'bible.group.wisdom': 'Кнігі мудрасці',
	'bible.group.prophetic': 'Прарочыя кнігі',
	'bible.group.gospels': 'Евангеллі',
	'bible.group.acts': 'Дзеі Апосталаў',
	'bible.group.pauline': 'Пасланні Паўла',
	'bible.group.catholicLetters': 'Каталіцкія пасланні',
	'bible.group.revelation': 'Апакаліпсіс',
	'ccc.prevParagraph': 'Папярэдні параграф',
	'ccc.nextParagraph': 'Наступны параграф',
	'ccc.inBrief': 'Сцісла',
	'ccc.landing.title': 'Катэхізіс Каталіцкага Касцёла',
	'ccc.landing.pairTitle': 'Катэхізіс і Кампендыум',
	'ccc.landing.tagline':
		'<strong>Катэхізіс</strong> выкладае каталіцкае вучэнне ў 2865 пранумараваных пунктах. <strong>Кампендыум</strong> перадае тое самае вучэнне як 598 пытанняў і адказаў паводле таго ж парадку.',
	'ccc.landing.pairTagline':
		'Катэхізіс Каталіцкага Касцёла ў 2865 параграфах і яго Кампендыум у 598 пытаннях.',
	'ccc.tableOfContents': 'Змест',
	'ccc.related': 'Глядзі таксама',
	'compendium.landing.title': 'Кампендыум Катэхізіса',
	'compendium.landing.tagline':
		'Пытанні і адказы, якія сцісла падаюць Катэхізіс Каталіцкага Касцёла.',
	'compendium.question': 'Пытанне',
	'compendium.answer': 'Адказ',
	'compendium.tableOfContents': 'Змест',
	'compendium.prevQuestion': 'Папярэдняе пытанне',
	'compendium.nextQuestion': 'Наступнае пытанне',
	'compendium.condenses': 'Сцісла падае ККК ¶¶',
	'ccc.abbrev': 'ККК',
	'ccc.condensedIn': 'У Кампендыуме',
	'compendium.abbrev': 'Камп.',
	'compendium.noQuestionNumber': 'У гэтым корпусе няма нумара пытання',
	'document.library.tagline':
		'Энцыклікі, саборныя канстытуцыі, дэкрэты і дэкларацыі Настаўніцтва Касцёла.',
	'document.filter.heading': 'Фільтр',
	'document.filter.author': 'Аўтар',
	'document.filter.kind': 'Тып',
	'document.filter.subject': 'Тэма',
	'document.filter.search': 'Пошук дакументаў',
	'document.filter.clear': 'Ачысціць',
	'document.filter.results': 'Паказаныя дакументы',
	'document.filter.noResults': 'Ніводны дакумент не адпавядае гэтым фільтрам.',
	'document.tableOfContents': 'Змест',
	'document.startReading': 'Пачаць чытанне',
	'document.readFullDocument': 'Чытаць увесь дакумент',
	'document.section': 'Раздзел',
	'document.prevSection': 'Папярэдні',
	'document.nextSection': 'Наступны',
	'document.kind.conciliarConstitution': 'Канстытуцыя',
	'document.kind.conciliarDecree': 'Дэкрэт',
	'document.kind.conciliarDeclaration': 'Дэкларацыя',
	'document.kind.encyclical': 'Энцыкліка',
	'document.kind.apostolicExhortation': 'Апостальская адгартацыя',
	'document.kind.apostolicConstitution': 'Апостальская Канстытуцыя',
	'document.kind.cdfDeclaration': 'Дэкларацыя CDF',
	'document.kind.cdfInstruction': 'Інструкцыя CDF',
	'document.kind.cdfLetter': 'Ліст CDF',
	'document.kind.cdfDoctrinalNote': 'Дактрынальная нота CDF',
	'document.kind.cdfResponsum': 'Адказ CDF',
	'document.kind.cdfConsiderations': 'Меркаванні CDF',
	'document.kindPlural.conciliarConstitution': 'Канстытуцыі',
	'document.kindPlural.conciliarDecree': 'Дэкрэты',
	'document.kindPlural.conciliarDeclaration': 'Дэкларацыі',
	'document.kindPlural.encyclical': 'Энцыклікі',
	'document.kindPlural.apostolicExhortation': 'Апостальскія адгартацыі',
	'document.kindPlural.apostolicConstitution': 'Апостальскія Канстытуцыі',
	'document.kindPlural.cdfDeclaration': 'Дэкларацыі CDF',
	'citation.unavailable': 'Для гэтай заўвагі няма даступнага тэксту крыніцы.',
	'doctores.landing.title': 'Дактары Касцёла',
	'doctores.landing.tagline': 'Багаслоўскія творы Айцоў і Дактароў Касцёла.',
	'summa.landing.title': 'Сума тэалогіі',
	'summa.landing.tagline': 'Тамаш Аквінскі, па-англійску і на лаціне, на якой ён пісаў.',
	'summa.tableOfContents': 'Змест',
	'summa.part': 'Частка',
	'summa.question': 'Пытанне',
	'summa.article': 'Артыкул',
	'summa.questionShort': 'Пыт.',
	'summa.articleShort': 'Арт.',
	'summa.titleFromEdition': 'Назва з выдання на {lang}',
	'summa.titlesFromEdition': 'Назвы з выдання на {lang} — у гэтым выданні яны не друкуюцца',
	'summa.prologue': 'Пралог',
	'summa.objection': 'Пярэчанне',
	'summa.sedContra': 'Насупраць',
	'summa.corpus': 'Адказваю, што',
	'summa.reply': 'Адказ на пярэчанне',
	'summa.preamble': 'Заўвага',
	'summa.prevQuestion': 'Папярэдняе пытанне',
	'summa.nextQuestion': 'Наступнае пытанне',
	'summa.noEditionInYourLanguage': 'Сума не мае выдання на вашай мове. Паказана на {lang}.',
	'summa.noLatinSupplement':
		'Дадатак існуе толькі на англійскай мове — ён быў складзены пасля смерці Аквінскага.',
	'index.division': 'Раздзел',
	'index.showSubsections': 'Паказаць падраздзелы',
	'index.hideSubsections': 'Схаваць падраздзелы',
	'prayers.landing.title': 'Штодзённыя малітвы',
	'prayers.landing.tagline': 'Малітвы з лацінскім тэкстам побач.',
	'prayers.tableOfContents': 'Змест',
	'prayers.gloss.versicle':
		'Версікул — радок, які прамаўляе або спявае адзін той, хто вядзе малітву. Прысутныя адказваюць на яго наступным адказам.',
	'prayers.gloss.response':
		'Адказ — радок, які прысутныя прамаўляюць або спяваюць разам у адказ на папярэдні версікул.',
	'prayers.seeAlso': 'Глядзі таксама',
	'prayers.prevPrayer': 'Папярэдняя малітва',
	'prayers.nextPrayer': 'Наступная малітва',
	'prayers.rosary.today': 'Сёння',
	'prayers.rosary.todayHeading': 'Сённяшнія таямніцы',
	'prayers.rosary.openingPrayer': 'Пачатковая малітва',
	'prayers.rosary.decadePrayers': 'Малітвы дзясятка',
	'ref.tooltip.loading': 'Загрузка…',
	'ref.tooltip.openCcc': 'Адкрыць у Катэхізісе',
	'ref.tooltip.openBible': 'Адкрыць у Бібліі',
	'ref.tooltip.openCompendium': 'Адкрыць у Кампендыуме',
	'ref.preview.open': 'Адкрыць',
	'ref.cf': 'параўн.',
	'anchor.actions': 'Дзеянні са спасылкай',
	'anchor.copy': 'Скапіяваць тэкст',
	'anchor.copyLink': 'Скапіяваць спасылку',
	'anchor.view': 'Паглядзець',
	'anchor.copied': 'Скапіявана',
	'anchor.copyFailed': 'Не ўдалося скапіяваць',
	'bookmark.add': 'У закладкі',
	'bookmark.remove': 'Прыбраць закладку',
	'bookmark.library': 'Закладкі',
	'bookmark.library.tagline': 'Усё, што вы адзначылі падчас чытання.',
	'bookmark.empty': 'Пакуль нічога не адзначана.',
	'bookmark.emptyHint':
		'Націсніце на нумар верша ці абзаца і выберыце «У закладкі», або скарыстайцеся кнопкай закладкі на старонцы.',
	'bookmark.about': 'Пра гэтыя закладкі',
	'bookmark.deviceOnly':
		'Закладкі захоўваюцца толькі ў гэтым браўзеры. Яны нікуды не адсылаюцца, і ачыстка даных браўзера іх выдаляе.',
	'bookmark.unavailable': 'Няма ў выданні, якое вы чытаеце',
	'colophon.title': 'Калафон',
	'colophon.lede':
		'Чым з’яўляецца гэты сайт, адкуль паходзяць яго тэксты і якая наша пазіцыя адносна іх узнаўлення.',
	'colophon.whatThisIs': 'Што гэта такое',
	'colophon.whatThisIsBody':
		'Glossa Catholica — сайт для чытання Пісання, Катэхізіса, Кампендыюма і дакументаў Магістэрыюма на англійскай, партугальскай і лацінскай мовах. Ён існуе, каб яго чыталі, і нічога іншага ад вас за чытанне не патрабуецца:',
	'colophon.pointFree':
		'Бясплатна, і заўсёды бясплатна. Ніякай платнай сцяны, ніякай падпіскі, нічога на продаж.',
	'colophon.pointNoAds': 'Ніякай рэкламы і ніякага спонсарскага размяшчэння любога роду.',
	'colophon.pointNoAccounts':
		'Ніякіх уліковых запісаў. Няма дзе рэгістравацца, няма куды ўваходзіць.',
	'colophon.pointNoTracking':
		'Ніякіх сцяжэнных скрыптоў, ніякага староннага кода, ніякіх кукі. Толькі ананімныя падлікі выкарыстання, без нічога, што вас ідэнтыфікуе.',
	'colophon.pointOffline':
		'Зроблены так, каб працягваць працаваць па-за сеткай пасля першага наведвання, каб слабае злучэнне не мусіла быць перашкодай чытанню.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica — прыватная ініцыятыва вернікаў свецкіх. Яна не мае ніякага царкоўнага ўхвалення і не гаворыць ніякай уласнай уладай.',
	'footer.notEndorsed': 'Не ўхвалена Апостальскай Сталіцай',
	'colophon.textsTitle': 'Тэксты',
	'colophon.textsBody':
		'Кожны тэкст паходзіць з названай крыніцы, і кожны твор запісвае сваё выданне, сваю зыходную старонку і дату, калі быў атрыманы. Пісанне выкарыстоўвае пераклады ў грамадскім набытку; Катэхізіс, Кампендыюм і дакументы Магістэрыюма паходзяць з уласных апублікаваных тэкстаў Святога Пасаду.',
	'colophon.textsFidelity':
		'Тэкст ніколі не скарачаецца, ніколі не пераказваецца, ніколі не перапісваецца і ніколі не змяшчаецца побач з рэкламай. Відавочныя хібы мы выпраўляем — выпалае слова, пашкоджаную спасылку, разметку, якая праглынула абзац — заўсёды ў бок таго, што друкуе сама крыніца, ніколі ў бок таго, што, на нашу думку, яна мусіла б казаць.',
	'colophon.countBible': 'выданняў Бібліі',
	'colophon.countDocuments': 'дакументаў Магістэрыюма',
	'colophon.privacyTitle': 'Прыватнасць',
	'colophon.privacyBody1':
		'Ніякіх уліковых запісаў, ніякіх кукі, ніякай рэкламы, ніякага староннага кода. Нішто тут не сочыць за вамі па-за гэтым сайтам.',
	'colophon.privacyBody2':
		'Мы падлічваем, як выкарыстоўваецца сайт: адно вымярэнне на наведванне, і кожнае поле — дыяпазон, а не дакладнае значэнне, — колькі часу вы прабылі, як часта вы тут бывалі, якія творы адкрывалі. Ваша краіна падлічваецца асобна, і нішто не звязвае яе з астатнім. Гэта апісвае наведванне, а не наведвальніка, і захоўваецца {days} дзён.',
	'colophon.privacyBody3':
		'Ніколі не адсылаецца: тое, што вы ўводзіце ў поле пошуку, які ўрывак тэксту ў вас быў адкрыты, або штосьці, паводле чаго можна было б зноў пазнаць вашу прыладу. Вашы налады, закладкі і спампаваныя тэксты застаюцца на вашай прыладзе.',
	'colophon.copyrightTitle': 'Аўтарскае права',
	'colophon.copyrightBody1':
		'Катэхізіс, Кампендыюм і дакументы Магістэрыюма з’яўляюцца ўласнасцю сваіх праваўладальнікаў — найперш Libreria Editrice Vaticana і Дыкастэрыі камунікацыі.',
	'colophon.copyrightBody2':
		'Кожны твор паказвае ўласную заяву аб аўтарскім праве свайго праваўладальніка, у іх фармулёўцы, і спасылаецца на старонку, з якой ён узяты.',
	'colophon.copyrightBody3':
		'Калі вы валодаеце правамі на які-небудзь тэкст тут і хацелі б, каб ён не быў апублікаваны, напішыце нам.',
	'colophon.contactTitle': 'Кантакт',
	'colophon.contactBody': 'Па любым пытанні, у тым ліку па вышэйсказаным:',
	'colophon.contactPending':
		'Кантактны адрас яшчэ не ўсталяваны. Гэты сайт не павінен быць абнародаваны, пакуль яго няма — абавязацельства вышэй не мае сэнсу без спосабу да нас звярнуцца.',
	'colophon.illustrationsTitle': 'Ілюстрацыі',
	'colophon.illustrationsBody':
		'Біблія нясе гравюры Гюстава Дарэ, кожную змешчаную пры тым вершы, які яна адлюстроўвае — апошні і найбуйнейшы з яго біблейскіх цыклаў, разьбяны ў дрэве паводле яго малюнкаў і надрукаваны разам з тэкстам, а не сабраны ў канцы.',
	'colophon.illustrationsRights':
		'Яны знаходзяцца ў грамадскім набытку, як паказваюць даты ніжэй, і дакладнае фатаграфічнае ўзнаўленне гравюры ў грамадскім набытку не нясе ніякага новага ўласнага аўтарскага права.',
	'colophon.countPlates': 'гравюр',
	'colophon.countPlateChapters': 'ілюстраваных раздзелаў',
	'plates.scansBy': 'Сканы прадастаўлены',
	'plates.enlarge': 'Павялічыць {title}',
	'plates.zoom': 'Маштаб',
	'art.about': 'Пра гэты малюнак',
	'art.detail': 'фрагмент',
	'colophon.typeTitle': 'Шрыфт',
	'colophon.typeBody':
		'Набрана шрыфтам EB Garamond, адраджэннем Георга Дуфнера і Актавіа Парда тых літар, якія Клод Гарамон разаў у 1590-я гады — гуманістычнай традыцыі, у якой Царква друкуе з часоў Рэнесансу. Яго кірыліца — той жа рукі, але не адраджае нічога: кірылічны Гарамон ніколі не быў разаны, таму руская мова набрана формай, намаляванай так, каб стаяць побач з астатнім.',
	'colophon.typeArabic':
		'Арабская мова цалкам па-за яго межамі і набрана шрыфтом Amiri — адраджэннем Халеда Хосні насха, разанага для друкарні Булак у Каіры ў 1905 годзе, абраным па той жа развазе, што і тэкставы шрыфт: пэўны гістарычны кніжны шрыфт, а не сучасны малюнак.',
	'colophon.typeInitials':
		'Пачатковыя ініцыялы — Pirata One, гатычны шрыфт, чые вялікія літары застаюцца чытэльнымі ў тым памеры, якога патрабуе буквіца, і — для рускай мовы — Ponomar, які ўзнаўляе царкоўнаславянскі шрыфт Сінадальнай друкарні. Ponomar набірае ініцыял і ніколі тэкст: сучасная энцыкліка, набраная цалкам сінадальным шрыфтам, сказала б няпраўду пра тое, чым яна ёсць. Усе яны ліцэнзаваны паводле SIL Open Font License і падаюцца з гэтага сайта, а не ад трэцяга боку, так што чытанне старонкі нічога не патрабуе ад чужога сервера.',
	'refs.citedIn': 'Цытуецца ў',
	'refs.externalVolume': 'Том {volume} на {host} — сканаваны PDF',
	'bible.wholeChapter': 'Гэты раздзел',
	'bible.verseNotInEdition':
		'Гэты нумар верша адсутнічае ў гэтым выданні — глядзіце заўвагу ў зыходніку старонкі',
	'bible.verseAbbrev': 'в.',
	'bible.note': 'Заўвага',
	'bible.noteMissing': 'Гэтая заўвага адсутнічае ў корпусе',
	'bible.chapterArgument': 'Аргумент',
	'ccc.readFullChapter': 'Чытаць увесь раздзел',
	'ccc.noParagraphNumber': 'У гэтым корпусе няма нумара параграфа',
	'copyright.sourceTitle': 'Адкрыць першапачатковую зыходную старонку',
	'copyright.sourceLabel': 'Крыніца',
	'lang.label': 'Мова',
	'lang.filter': 'Шукаць мовы',
	'lang.more': 'яшчэ мовы',
	'notFound.title': 'Нічога па гэтым адрасе',
	'notFound.lede': 'Старонкі, якую вы шукалі, тут няма.',
	'notFound.body':
		'Спасылка магла быць набрана з памылкай ці ўстарэла, альбо яна вядзе да тэксту, якога няма на гэтым сайце.',
	'notFound.searchHint':
		'Калі вы ведаеце патрэбную спасылку — кнігу і раздзел, параграф Катэхізіса — увядзіце яе ў поле пошуку ўверсе гэтай старонкі.',
	'notFound.credit': 'На аснове British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Або пачніце з аднаго з гэтых:',
	'notFound.home': 'Галоўная',
	'compare.enter': 'Параўнаць выданні',
	'compare.exit': 'Выйсці з параўнання',
	'compare.missing': 'Адсутнічае ў гэтым выданні',
	'compare.versificationNote':
		'Гэтыя два выданні месцамі падзяляюць вершы гэтага раздзела па-рознаму (тэкставы варыянт, а не перакладчыцкае рашэнне) — адзін і той жа нумар верша не заўсёды пазначае адзін і той жа сказ у абедзвюх калонках.',
	'compare.loading': 'Загрузка другой мовы…',
	'ui.close': 'Закрыць',
	'shortcuts.title': 'Спалучэнні клавіш',
	'shortcuts.betweenDocuments': 'Паміж дакументамі',
	'shortcuts.withinDocument': 'Унутры дакумента',
	'shortcuts.show': 'Паказаць гэты спіс',
	'help.title': 'Дапамога',
	'help.top.heading': 'Паласа ўверсе кожнай старонкі',
	'help.reading.heading': 'Паласа над тэкстам',
	'help.feature.search':
		'Увядзіце спасылку ў поле ўверсе — раздзел і верш, нумар параграфа, назву дакумента — і яна дапоўніцца падчас набору.',
	'help.feature.offline':
		'Дадайце сайт на галоўны экран, і ён адкрыецца як праграма. Можна спампаваць цэлыя творы і чытаць без сеткі.',
	'help.feature.contents':
		'Падзелы твора, у якім вы знаходзіцеся, — кнігі, часткі, раздзелы — каб рухацца ўнутры яго, не вяртаючыся да пачатку.',
	'help.feature.compare':
		'Два выданні аднаго месца побач — лаціна побач з вашай мовай або адзін пераклад побач з другім.',
	'help.feature.apparatus':
		'Уласныя заўвагі выдання і ўсякі напісаны да тэксту каментар прапануюцца побач з ім, а не пад ім. Цытаты ўнутры тэксту — гэта спасылкі, дык адсылка вядзе туды, куды паказвае.',
	'help.feature.focus':
		'Прыбірае ўсё, апрача тэксту. Выхад застаецца там, дзе была паласа, каб нічога не апынулася замкнёным за ёй.',
	'zen.enter': 'Рэжым фокусу',
	'zen.exit': 'Выйсці з рэжыму фокусу',
	'nav.calendar': 'Каляндар',
	'calendar.title': 'Літургічны каляндар',
	'calendar.tagline':
		'Агульны Рымскі каляндар, вылічаны на любы дзень — яго час, яго ранг, яго колер.',
	'calendar.calendar': 'Каляндар',
	'calendar.which.general': 'Агульны Рымскі каляндар',
	'calendar.filter': 'Пошук краін',
	'calendar.region.europe': 'Еўропа',
	'calendar.region.americas': 'Амерыка',
	'calendar.region.africa': 'Афрыка',
	'calendar.region.middleEast': 'Блізкі Усход',
	'calendar.region.asia': 'Азія',
	'calendar.region.oceania': 'Акіянія',
	'calendar.today': 'Сёння',
	'calendar.previousMonth': 'Папярэдні месяц',
	'calendar.nextMonth': 'Наступны месяц',
	'calendar.plainDays': 'Звычайныя буднія дні',
	'calendar.noSuchDay': 'Для гэтай даты літургічны дзень не вылічаецца.',
	'calendar.week': 'тыдзень',
	'calendar.alsoToday': 'Сёння таксама святкуецца',
	'calendar.alsoObserved': 'Сёння таксама адзначаецца',
	'calendar.obligation': 'Абавязковае свята',
	'calendar.obligationCanon': 'CIC кан. 1246',
	'calendar.sundayCycle': 'Нядзельны цыкл',
	'calendar.weekdayCycle': 'Будзённы цыкл',
	'calendar.psalterWeek': 'Тыдзень псалтыра',
	'lectionary.heading': 'Чытанні на Імшы',
	'lectionary.slot.reading': 'Чытанне',
	'lectionary.slot.reading1': 'Першае чытанне',
	'lectionary.slot.reading2': 'Другое чытанне',
	'lectionary.slot.reading3': 'Трэцяе чытанне',
	'lectionary.slot.reading4': 'Чацвёртае чытанне',
	'lectionary.slot.reading5': 'Пятае чытанне',
	'lectionary.slot.reading6': 'Шостае чытанне',
	'lectionary.slot.reading7': 'Сёмае чытанне',
	'lectionary.slot.psalm': 'Адказны псальм',
	'lectionary.slot.epistle': 'Пасланне',
	'lectionary.slot.acclamation': 'Акламацыя перад Евангеллем',
	'lectionary.slot.gospel': 'Евангелле',
	'lectionary.slot.sequence': 'Секвенцыя',
	'lectionary.or': 'або',
	'lectionary.cf': 'Параўн.',
	'lectionary.about': 'Пра гэтыя чытанні',
	'lectionary.caveat':
		'Урыўкі, прызначаныя Ordo Lectionum Missae, спалучаныя з уласнымі выданнямі гэтага сайта, — не пераклад, абвешчаны ў якой-небудзь канкрэтнай царкве, і канферэнцыя біскупаў можа адаптаваць графік.',
	'calendar.transferredFrom': 'Перанесена з',
	'calendar.season.advent': 'Адвэнт',
	'calendar.season.christmas': 'Перыяд Нараджэння Пана',
	'calendar.season.lent': 'Вялікі пост',
	'calendar.season.triduum': 'Пасхальнае трохдзённе',
	'calendar.season.easter': 'Пасхальны перыяд',
	'calendar.season.ordinary': 'Звычайны перыяд',
	'calendar.colour.white': 'Белы',
	'calendar.colour.red': 'Чырвоны',
	'calendar.colour.green': 'Зялёны',
	'calendar.colour.violet': 'Фіялетавы',
	'calendar.colour.rose': 'Ружовы',
	'calendar.colour.black': 'Чорны',
	'calendar.colour.blue': 'Блакітны',
	'calendar.rank.solemnity': 'Урачыстасць',
	'calendar.rank.feast': 'Свята',
	'calendar.rank.memorial': 'Абавязковы ўспамін',
	'calendar.rank.optional-memorial': 'Неабавязковы ўспамін',
	'calendar.rank.commemoration': 'Камемарацыя',
	'calendar.rank.sunday': 'Нядзеля',
	'calendar.rank.weekday': 'Будны дзень',
	'calendar.gloss.season.advent':
		'Чатыры тыдні перад Калядамі: падрыхтоўка да прыйсця Пана і пачатак царкоўнага года.',
	'calendar.gloss.season.christmas':
		'Ад Калядаў да Хросту Пана — нараджэнне Пана і Яго з’яўленне свету.',
	'calendar.gloss.season.lent':
		'Сорак дзён ад Папяльцовай серады да вячэрняй Імшы Вячэры Пана: пакаянне, ялмужна і падрыхтоўка да Вялікадня.',
	'calendar.gloss.season.triduum':
		'Тры дні ад вечара Вялікага чацвярга да вечара Вялікоднай нядзелі — пакута, смерць і ўваскрасенне Пана, вяршыня ўсяго года.',
	'calendar.gloss.season.easter':
		'Пяцьдзясят дзён ад Вялікадня да Спаслання Святога Духа, святкаваных як адно свята — «адна вялікая нядзеля».',
	'calendar.gloss.season.ordinary':
		'Трыццаць тры або трыццаць чатыры тыдні па-за іншымі перыядамі. Не «звычайны», а ўпарадкаваны: тыдні палічаны, і Касцёл чытае жыццё і навуку Пана па парадку. Ён прыходзіць двума адрэзкамі — пасля перыяду Нараджэння да Вялікага посту і пасля Спаслання Святога Духа да Адвэнту.',
	'calendar.gloss.rank.solemnity':
		'Найвышэйшая ступень: Вялікдзень, Каляды, Унебаўшэсце, апякун месца. Спраўляецца з «Хвала на вышынях» і Вызнаннем веры і пачынаецца папярэднім вечарам.',
	'calendar.gloss.rank.feast':
		'Спраўляецца ў межах самога дня. Апосталы і евангелісты, а таксама большыя дні Пана і Найсвяцейшай Панны.',
	'calendar.gloss.rank.memorial':
		'Святы, ушанаваны ў свой дзень, унутры Імшы і Літургіі гадзінаў гэтага перыяду. Абавязковы там, дзе спраўляецца.',
	'calendar.gloss.rank.optional-memorial':
		'Можа спраўляцца або не, паводле выбару святара ці супольнасці. Калі не спраўляецца, дзень — проста будны дзень.',
	'calendar.gloss.rank.commemoration':
		'Тое, чым становіцца ўспамін у Вялікім посце: малітва, дададзеная да буднай Імшы, якую перыяд у астатнім захоўвае цэлай.',
	'calendar.gloss.rank.sunday':
		'Першаснае свята — дзень Пана, святкаваны кожны тыдзень ад уваскрасення. Толькі ўрачыстасць або свята Пана можа яго выцесніць, а ў Адвэнце, Вялікім посце і велікодным часе — нават яны не.',
	'calendar.gloss.rank.weekday':
		'Дзень без уласнага святкавання. Імша і Літургія гадзінаў — ад перыяду, і менавіта гэта робіць перыяд тым, што варта ведаць.',
	'calendar.gloss.colour.white':
		'Радасць. Велікодны і калядны час, дні Пана па-за Яго пакутай, Найсвяцейшая Панна, анёлы і святыя, якія не былі мучанікамі.',
	'calendar.gloss.colour.red':
		'Кроў і агонь. Пальмовая нядзеля і Вялікая пятніца, Спасланне Святога Духа, апосталы і евангелісты, а таксама мучанікі.',
	'calendar.gloss.colour.green': 'Звычайны перыяд: колер надзеі і таго, што расце.',
	'calendar.gloss.colour.violet': 'Адвэнт і Вялікі пост, а таксама на Імшах за памерлых.',
	'calendar.gloss.colour.rose':
		'Ужываецца двойчы на год — у нядзелю Gaudete, трэцюю Адвэнту, і ў нядзелю Laetare, чацвёртую Вялікага посту, — дзе пост святлее і канец ужо блізкі.',
	'calendar.gloss.colour.black': 'Можа ўжывацца на Імшах за памерлых.',
	'calendar.gloss.colour.blue':
		'Прывілей блакітнага: ужываецца ў свята Беззаганнага Пачацця ў Іспаніі, на Філіпінах і ў тых нямногіх іншых месцах, якім Апостальская Сталіца яго дала.',
	'calendar.gloss.sundayCycle':
		'Нядзельныя чытанні ідуць трыма гадамі — A, B і C — чытаючы па чарзе Мацвея, Марка і Луку, з Янам у Вялікім посце і велікодным часе. Цыкл змяняецца ў першую нядзелю Адвэнту, разам з царкоўным годам.',
	'calendar.gloss.weekdayCycle':
		'Будныя чытанні ідуць двума гадамі, I і II: першае чытанне змяняецца, Евангелле не. Літургічны год называецца паводле каляндарнага года, у якім заканчваецца, — няцотныя гады I, цотныя II.',
	'calendar.gloss.psalterWeek':
		'Літургія гадзінаў размяркоўвае псальмы на чатыры тыдні, ад I да IV, што паўтараюцца цягам года. Гэта тыдзень, чые псальмы прыпадаюць на сёння, для кожнага, хто моліцца гадзіны.',
	'calendar.gloss.obligation':
		'Дзень, калі вернікі абавязаны ўдзельнічаць у Імшы і ўстрымлівацца ад працы, якая б гэтаму перашкодзіла. Кожная нядзеля і астатнія дні, якія вызначыла адпаведная канферэнцыя біскупаў.',
	'calendar.primer.title': 'Упершыню тут?',
	'calendar.primer.lead':
		'Касцёл трымае ўласны год. Ён пачынаецца Адвэнтам, круціцца вакол Вялікадня і дае кожнаму дню імя, ступень і колер — а яны вырашаюць, што ў гэты дзень моліцца і чытаецца на Імшы і ў Літургіі гадзінаў. Так «дваццаць трэцяя звычайная нядзеля» — гэта адрас: яна кажа святару, хору або кожнаму, хто моліцца дома, якія малітвы і чытанні належаць сённяшняму дню.',
	'calendar.primer.seasons': 'Перыяды',
	'calendar.primer.ranks': 'Чым можа быць дзень',
	'calendar.primer.colours': 'Колеры',
	'calendar.primer.cycles': 'Цыклы',
	'calendar.primer.cyclesLead':
		'Тры лічыльнікі, якія разам кажуць, якія чытанні і псальмы прызначаны на сёння.'
};
