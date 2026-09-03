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
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
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
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Працягнуць чытанне',
	'home.works': 'Бібліятэка',
	'home.ccc.heading': 'Катэхізіс і Кампендыум',
	'home.magisterium.mostRecent': 'Найноўшыя',
	'home.prayers.heading': 'Малітвы',
	'unitNav.previous': 'Папярэдняе',
	'unitNav.next': 'Наступнае',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Чытайце ўсю Біблію, кнігу за кнігай, раздзел за раздзелам.',
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
	'ccc.landing.title': 'Катэхізіс Каталіцкага Касцёла',
	'ccc.landing.tagline':
		'<strong>Катэхізіс</strong> выкладае каталіцкае вучэнне ў 2865 пранумараваных пунктах. <strong>Кампендыум</strong> перадае тое самае вучэнне як 598 пытанняў і адказаў паводле таго ж парадку.',
	'document.library.tagline':
		'Энцыклікі, саборныя канстытуцыі, дэкрэты і дэкларацыі Настаўніцтва Касцёла.',
	'doctores.landing.title': 'Дактары Касцёла',
	'doctores.landing.tagline': 'Багаслоўскія творы Айцоў і Дактароў Касцёла.',
	'summa.landing.title': 'Сума тэалогіі',
	'summa.landing.tagline': 'Тамаш Аквінскі, па-англійску і на лаціне, на якой ён пісаў.',
	'prayers.landing.title': 'Штодзённыя малітвы',
	'prayers.landing.tagline': 'Малітвы з лацінскім тэкстам побач.',
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
	'colophon.typeTitle': 'Шрыфт',
	'colophon.typeBody':
		'Набрана шрыфтам EB Garamond, адраджэннем Георга Дуфнера і Актавіа Парда тых літар, якія Клод Гарамон разаў у 1590-я гады — гуманістычнай традыцыі, у якой Царква друкуе з часоў Рэнесансу. Яго кірыліца — той жа рукі, але не адраджае нічога: кірылічны Гарамон ніколі не быў разаны, таму руская мова набрана формай, намаляванай так, каб стаяць побач з астатнім.',
	'colophon.typeArabic':
		'Арабская мова цалкам па-за яго межамі і набрана шрыфтом Amiri — адраджэннем Халеда Хосні насха, разанага для друкарні Булак у Каіры ў 1905 годзе, абраным па той жа развазе, што і тэкставы шрыфт: пэўны гістарычны кніжны шрыфт, а не сучасны малюнак.',
	'colophon.typeInitials':
		'Пачатковыя ініцыялы — Pirata One, гатычны шрыфт, чые вялікія літары застаюцца чытэльнымі ў тым памеры, якога патрабуе буквіца, і — для рускай мовы — Ponomar, які ўзнаўляе царкоўнаславянскі шрыфт Сінадальнай друкарні. Ponomar набірае ініцыял і ніколі тэкст: сучасная энцыкліка, набраная цалкам сінадальным шрыфтам, сказала б няпраўду пра тое, чым яна ёсць. Усе яны ліцэнзаваны паводле SIL Open Font License і падаюцца з гэтага сайта, а не ад трэцяга боку, так што чытанне старонкі нічога не патрабуе ад чужога сервера.'
};
