/**
 * Українська UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Українська, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, the Ukrainian Greek Catholic Church, the largest Eastern Catholic church. A reader gets their own chrome and English
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

export const uk: Dictionary = {
	'nav.bible': 'Біблія',
	'nav.ccc': 'Катехизм',
	'nav.compendium': 'Компендіум',
	'nav.magisterium': 'Учительство Церкви',
	'nav.prayers': 'Молитви',
	'nav.bookmarks': 'Закладки',
	'nav.menu': 'Меню',
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Продовжити читання',
	'home.works': 'Бібліотека',
	'home.ccc.heading': 'Катехизм і Компендіум',
	'home.magisterium.mostRecent': 'Найновіші',
	'home.prayers.heading': 'Молитви',
	'unitNav.previous': 'Попереднє',
	'unitNav.next': 'Наступне',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Читайте всю Біблію, книгу за книгою, розділ за розділом.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'П’ятикнижжя',
	'bible.group.historical': 'Історичні книги',
	'bible.group.wisdom': 'Книги мудрості',
	'bible.group.prophetic': 'Пророчі книги',
	'bible.group.gospels': 'Євангелія',
	'bible.group.acts': 'Діяння апостолів',
	'bible.group.pauline': 'Послання Павла',
	'bible.group.catholicLetters': 'Католицькі послання',
	'bible.group.revelation': 'Одкровення',
	'ccc.landing.title': 'Катехизм Католицької Церкви',
	'ccc.landing.tagline':
		'<strong>Катехизм</strong> викладає католицьке вчення у 2865 пронумерованих пунктах. <strong>Компендіум</strong> подає те саме вчення як 598 запитань і відповідей за тим самим порядком.',
	'document.library.tagline':
		'Енцикліки, соборові конституції, декрети та декларації Учительства Церкви.',
	'doctores.landing.title': 'Учителі Церкви',
	'doctores.landing.tagline': 'Богословські твори Отців та Учителів Церкви.',
	'summa.landing.title': 'Сума теології',
	'summa.landing.tagline': 'Тома Аквінський, англійською і латиною, якою він писав.',
	'prayers.landing.title': 'Звичайні молитви',
	'prayers.landing.tagline': 'Молитви з латинським текстом поруч.',
	'colophon.title': 'Колофон',
	'colophon.lede':
		'Чим є цей сайт, звідки походять його тексти і яка наша позиція щодо їх відтворення.',
	'colophon.whatThisIs': 'Що це таке',
	'colophon.whatThisIsBody':
		'Glossa Catholica — сайт для читання Писання, Катехизму, Компендіуму та документів Магістеріуму англійською, португальською та латинською мовами. Він існує, щоб його читали, і нічого іншого від вас за читання не вимагається:',
	'colophon.pointFree':
		'Безкоштовно, і завжди безкоштовно. Жодної платної стіни, жодної підписки, нічого на продаж.',
	'colophon.pointNoAds': 'Жодної реклами і жодного спонсорського розміщення будь-якого роду.',
	'colophon.pointNoAccounts':
		'Жодних облікових записів. Немає де реєструватися, немає куди входити.',
	'colophon.pointNoTracking':
		'Жодних скриптів стеження, жодного стороннього коду, жодних файлів cookie. Лише анонімні підрахунки використання, без нічого, що вас ідентифікує.',
	'colophon.pointOffline':
		'Зроблений так, щоб продовжувати працювати без мережі після першого відвідування, аби слабке з’єднання не мусило бути перешкодою для читання.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica — приватна ініціатива вірних мирян. Вона не має жодного церковного схвалення і не говорить жодною власною владою.',
	'colophon.textsTitle': 'Тексти',
	'colophon.textsBody':
		'Кожен текст походить із названого джерела, і кожен твір записує своє видання, свою вихідну сторінку та дату, коли його було отримано. Писання використовує переклади в суспільному надбанні; Катехизм, Компендіум і документи Магістеріуму походять із власних опублікованих текстів Святого Престолу.',
	'colophon.textsFidelity':
		'Текст ніколи не скорочується, ніколи не переказується, ніколи не переписується і ніколи не вміщується поруч із рекламою. Явні вади ми таки виправляємо — випале слово, спотворене посилання, розмітку, що поглинула абзац — завжди у бік того, що друкує саме джерело, ніколи у бік того, що, на нашу думку, воно мало б казати.',
	'colophon.countBible': 'видань Біблії',
	'colophon.countDocuments': 'документів Магістеріуму',
	'colophon.copyrightTitle': 'Авторське право',
	'colophon.copyrightBody1':
		'Катехизм, Компендіум і документи Магістеріуму є власністю своїх правовласників — насамперед Libreria Editrice Vaticana та Дикастерії комунікації.',
	'colophon.copyrightBody2':
		'Кожен твір показує власне повідомлення про авторське право свого правовласника, у їхньому формулюванні, і посилається на сторінку, з якої його взято.',
	'colophon.copyrightBody3':
		'Якщо ви володієте правами на будь-який тут текст і воліли б, щоб він не був опублікований, напишіть нам.',
	'colophon.contactTitle': 'Контакт',
	'colophon.contactBody': 'З будь-якого питання, зокрема із зазначеного вище:',
	'colophon.contactPending':
		'Контактну адресу ще не встановлено. Цей сайт не слід оприлюднювати, доки її немає — зобов’язання вище не має сенсу без способу з нами зв’язатися.',
	'colophon.illustrationsTitle': 'Ілюстрації',
	'colophon.illustrationsBody':
		'Біблія несе гравюри Гюстава Доре, кожну вміщену при тому вірші, який вона зображує — останній і найбільший з його біблійних циклів, різьблений у дереві за його малюнками і надрукований разом із текстом, а не зібраний наприкінці.',
	'colophon.illustrationsRights':
		'Вони перебувають у суспільному надбанні, як показують дати нижче, і точне фотографічне відтворення гравюри в суспільному надбанні не несе жодного нового власного авторського права.',
	'colophon.countPlates': 'гравюр',
	'colophon.countPlateChapters': 'ілюстрованих розділів',
	'colophon.typeTitle': 'Шрифт',
	'colophon.typeBody':
		'Набрано шрифтом EB Garamond, відродженням Ґеорґа Дуфнера й Октавіо Пардо тих літер, які Клод Ґарамон різьбив у 1590-х роках — гуманістичної традиції, у якій Церква друкує від часів Ренесансу. Його кирилиця — тієї ж руки, але не відроджує нічого: кириличного Ґарамона ніколи не різьбили, тож російська набрана формою, намальованою так, щоб стояти поруч з рештою.',
	'colophon.typeArabic':
		'Арабська цілком поза його межами і набрана шрифтом Amiri — відродженням Халеда Хосні насха, різьбленого для друкарні Булак у Каїрі 1905 року, обраним з того ж міркування, що й текстовий шрифт: певний історичний книжковий шрифт, а не сучасний малюнок.',
	'colophon.typeInitials':
		'Початкові ініціали — Pirata One, готичний шрифт, чиї великі літери лишаються читними в тому розмірі, якого вимагає буквиця, і — для російської — Ponomar, який відтворює церковнослов’янський шрифт Синодальної друкарні. Ponomar набирає ініціал і ніколи текст: сучасна енцикліка, набрана суцільно синодальним шрифтом, сказала б неправду про те, чим вона є. Усі вони ліцензовані за SIL Open Font License і подаються з цього сайту, а не від третьої сторони, тож читання сторінки нічого не вимагає від чужого сервера.'
};
