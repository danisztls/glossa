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

export const uk: Dictionary = {
	'nav.bible': 'Біблія',
	'nav.ccc': 'Катехизм',
	'nav.compendium': 'Компендіум',
	'nav.magisterium': 'Учительство Церкви',
	'nav.socialDoctrine': 'Соціальне вчення',
	'socialDoctrine.landing.title': 'Компендіум соціального вчення Церкви',
	'socialDoctrine.landing.tagline':
		'Чого Церква вчить про життя в суспільстві — 583 пронумеровані розділи.',
	'nav.canonLaw': 'Канонічне право',
	'canonLaw.landing.title': 'Кодекс канонічного права',
	'canonLaw.landing.tagline': 'Право Латинської Церкви у 1752 канонах, поділених на сім книг.',
	'canonLaw.canon': 'Кан.',
	'canonLaw.canons': 'Кан.',
	'canonLaw.prevCanon': 'Попередній канон',
	'canonLaw.nextCanon': 'Наступний канон',
	'canonLaw.readFullTitle': 'Читати весь титул',
	'canonLaw.superseded': 'Формулювання замінено',
	'nav.prayers': 'Молитви',
	'nav.bookmarks': 'Закладки',
	'nav.menu': 'Меню',
	'nav.sections': 'Розділи',
	'nav.works': 'Твори',
	'nav.pages': 'Сторінки',
	'nav.summa': 'Сума',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Продовжити читання',
	'home.tagline':
		'Сайт для читання Писання, Катехизму та документів Магістеріуму — безкоштовно, працює без мережі, і ніде не треба реєструватися.',
	'home.doors.heading': 'Куди піти',
	'home.find.heading': 'Або введіть посилання',
	'nav.library': 'Бібліотека',
	'nav.learn': 'Навчання',
	'library.landing.tagline':
		'Усе зібрання, полиця за полицею — разом із тим, де ви зупинилися, і тим, що позначили.',
	'schola.landing.title': 'З чого почати',
	'schola.landing.tagline':
		'Короткий провідник по тому, що тут є: чим є кожна з цих книг, як записується посилання на неї, як знайти місце, і порядки читання, які запропонувала Церква.',
	'schola.start.heading': 'Уперше в католицтві?',
	'schola.start.body': 'Найкраще почати з цієї книги: ',
	'schola.start.bodyAfter':
		' — те саме вчення, що й у Катехизмі, значно коротше, викладене запитаннями й відповідями. Він приблизно вдесятеро менший і нічого не припускає наперед.',
	'schola.bible.heading': 'Ніколи не читали Біблії?',
	'schola.bible.library':
		'Це не одна книга, а сімдесят три, писані понад тисячу років і зібрані в порядку, на якому спинилася Церква, — не в порядку подій і не в тому, що читається найлегше. Більшість починає з першої сторінки і кидає за кілька тижнів, посеред довгого розділу давнього закону, бо ніхто ще не сказав їм, для чого це.',
	'schola.bible.step.gospel': 'Почніть з Євангелія',
	'schola.bible.start':
		'Одна з чотирьох коротких книг про життя Ісуса, глибоко всередині, а не спереду. Це не наша вигадка: Собор Церкви просив навчати правильного користування Писанням, «особливо Нового Завіту і передусім Євангелій». Він не назвав жодного окремо, і ми не назвемо.',
	'schola.bible.whichGospel':
		'Зазвичай пропонують три, з трьох різних причин. Будь-яке з них — добре місце, де бути.',
	'schola.bible.gospel.mark':
		'Найкоротше. Його можна прочитати цілком за один вечір, а дочитати одне на початку варте більше, ніж вибрати найкраще.',
	'schola.bible.gospel.luke':
		'Написане для людини поза вірою, яка хотіла, щоб усе було викладено по порядку, — чим, можливо, є саме ви. Воно прямо переходить у Діяння апостолів, тож насправді це перша половина довшої книги.',
	'schola.bible.gospel.john':
		'Те, яке прямо каже, навіщо написане: «щоб ви увірували». Прості слова, і воно одразу береться до питання, ким є Ісус.',
	'schola.bible.step.acts': 'Потім — що сталося далі',
	'schola.bible.thenActs':
		'Дочитавши одне, прочитайте, що зробили ті, хто Його знав, після того як Він відійшов.',
	'schola.bible.acts.why':
		'Тридцять років після кінця Євангелій: кілька десятків наляканих людей і те, як побачене ними дійшло до іншого краю імперії.',
	'schola.bible.step.old': 'Потім давніша половина',
	'schola.bible.thenOld':
		'Не з першої сторінки і не вся. Кілька місць несуть оповідь, і це саме ті, до яких Євангелія раз у раз відсилають.',
	'schola.bible.ot.beginnings': 'Як це починається і як іде не так.',
	'schola.bible.ot.promise': 'Одна родина і дана їй обітниця, що переживає всіх у ній.',
	'schola.bible.ot.exodus': 'Народ, виведений з рабства, і даний йому закон, за яким жити.',
	'schola.bible.ot.psalms':
		'Не оповідь: сто п’ятдесят молитов і пісень. Читайте по одному, в будь-якому порядку. Церква молиться ними щодня й донині.',
	'schola.bible.bothWays':
		'Ви впізнаватимете знайоме, і в цьому суть, а не збіг. Церква читає давніші книги у світлі Христа, а пізніші — у світлі того, що було раніше: кожна половина пояснює другу, і тому жодна не читається окремо.',
	'schola.books.heading': 'Що тут є і як це позначається',
	'schola.books.lede':
		'Кожна з цих книг іншого роду, і на кожну посилаються власним числом. Приклади показують форму: наберіть подібне в полі пошуку і потрапите на місце.',
	'schola.cite.label': 'Позначається',
	'schola.what.scripture':
		'Писання, як його приймає Церква, в обох Завітах. Усе інше тут читається в його світлі.',
	'schola.cite.scripture': 'книга, розділ і вірш, у скороченнях, які друкує ваше видання',
	'schola.what.catechism':
		'Виклад того, у що вірує Католицька Церква, в одному томі. Сам він не джерело: він збирає Писання, Отців, літургію і вчення Церкви, і кожен параграф каже, звідки взято те, що він стверджує.',
	'schola.cite.catechism': 'за номером параграфа, що йде поспіль від першої сторінки до останньої',
	'schola.what.compendium':
		'Те саме вчення, викладене запитаннями й відповідями, приблизно вдесятеро коротше.',
	'schola.cite.compendium': 'за номером запитання',
	'schola.what.magisterium':
		'Те, що папи і собори справді написали, — енцикліки, конституції, декрети, декларації — кожне звернене до певної миті й певного питання. Кожне відоме за своїми першими латинськими словами.',
	'schola.cite.magisterium': 'за назвою документа, потім за номером розділу в ньому',
	'schola.what.social':
		'Учення Церкви про працю, власність, сім’ю, політику і мир, зібране з тих документів в одну книгу.',
	'schola.cite.social': 'за номером параграфа, під тим скороченням, яким твір позначає себе',
	'schola.what.law': 'Право, а не віровчення. Воно каже, чого Церква вимагає, і зазнає змін.',
	'schola.cite.law': 'за каноном — так називаються його нумеровані одиниці',
	'schola.what.doctors':
		'Богослови, яких Церква назвала Учителями. Це не несе жодної офіційної влади, хоч би яким великим був автор.',
	'schola.cite.doctors': 'за частиною, потім питанням — власними поділами Суми',
	'schola.what.prayers': 'Слова, якими молиться Церква, з латиною поруч.',
	'schola.cite.prayers': 'за назвою; нумерованого для цитування немає',
	'schola.places.heading': 'Не тексти, а місця цього сайту',
	'schola.what.library': 'Усі твори сайту одним переліком, згруповані за предметом, а не за родом.',
	'schola.what.calendar':
		'Літургійний день — період, колір і кого згадують — для країни, чийого календаря ви тримаєтеся.',
	'schola.what.bookmarks':
		'Місця, які ви позначили, і те, де ви востаннє спинилися в кожному творі. І те, і те зберігається в цьому браузері й нікуди не надсилається.',
	'ccc.noCounterpart': 'Немає відповідника в іншому творі',
	'jumpbox.placeholder': 'Перейти до… (напр. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Пошук',
	'jumpbox.hint': 'Натисніть / або Ctrl+K, щоб перейти до посилання',
	'jumpbox.noMatch': 'Нічого не знайдено',
	'jumpbox.suggestions': 'Пропозиції',
	'settings.label': 'Налаштування',
	'apparatus.label': 'Апарат',
	'apparatus.editionNotes': 'Примітки цього видання',
	'apparatus.commentary': 'Коментар',
	'apparatus.inCommentary': 'Уміщено в коментарі вище.',
	'darkMode.label': 'Темний режим',
	'darkMode.auto': 'Авто',
	'darkMode.on': 'Увімк.',
	'darkMode.off': 'Вимк.',
	'sepia.label': 'Сепія',
	'sepia.lightOnly': 'Лише у світлому режимі',
	'sepia.noHue': 'Немає в монохромі',
	'oled.label': 'Чорний OLED',
	'oled.darkOnly': 'Лише в темному режимі',
	'mono.label': 'Монохром',
	'mono.hint':
		'Робить усю сторінку одним відтінком сірого, тож колір більше нічого не розрізняє. Поки він увімкнений, сепія вимикається.',
	'advanced.label': 'Додатково',
	'library.title': 'Офлайн-бібліотека',
	'library.lede': 'Тексти, збережені на цьому пристрої, відкриваються зовсім без мережі.',
	'library.essentials': 'Молитви і Компендіум',
	'library.illustrations': 'Біблія (ілюстрації)',
	'library.illustrationsDetail': 'Біблія (ілюстрації, висока роздільна здатність)',
	'library.other': 'Інші тексти',
	'library.everything': 'Усе',
	'library.downloadAll': 'Завантажити все',
	'library.download': 'Завантажити',
	'library.downloaded': 'На цьому пристрої',
	'library.offlineNote': 'Щоб щось завантажити, вимкніть офлайн-режим.',
	'library.remove': 'Прибрати з цього пристрою',
	'library.removeConfirm': 'Прибрати?',
	'library.forget': 'Прибрати завантаження',
	'library.forgetConfirm': 'Прибрати все?',
	'offline.label': 'Офлайн-режим',
	'offline.hint':
		'Зовсім не використовує мережу: нічого не завантажується, оновлення не перевіряються, нічого не вимірюється. Відкриються лише тексти, які вже є на цьому пристрої.',
	'offline.notDownloaded': 'Немає на цьому пристрої',
	'loadFailed.title': 'Це не завантажилося',
	'loadFailed.hint':
		'Сторінка існує — щось пішло не так під час її отримання. Повторна спроба зазвичай допомагає.',
	'loadFailed.retry': 'Спробувати знову',
	'loadFailed.retrying': 'Спроба…',
	'offline.turnOff': 'Вимкнути офлайн-режим',
	'type.label': 'Розмір тексту і шрифт',
	'fontSize.label': 'Розмір тексту',
	'fontSize.small': 'Дрібний',
	'fontSize.medium': 'Середній',
	'fontSize.large': 'Великий',
	'fontSize.xlarge': 'Дуже великий',
	'fontSize.xxlarge': 'Найбільший',
	'face.label': 'Шрифт',
	'face.serif': 'Антиква',
	'face.sans': 'Гротеск',
	'print.label': 'Надрукувати цю сторінку',
	'toTop.label': 'Повернутися вгору',
	'install.label': 'Встановити Glossa',
	'install.hint.label': 'Додати на головний екран',
	'install.hint.title': 'Додайте Glossa на головний екран',
	'install.hint.stepBefore': 'Він відкривається як застосунок і читається офлайн. Натисніть',
	'install.hint.stepAfter': 'потім «Додати на головний екран».',
	'install.hint.dismiss': 'Закрити',
	'update.label': 'Доступне нове видання',
	'update.title': 'Нове видання готове',
	'update.body': 'Перезавантажте сторінку, щоб отримати найновіші тексти та виправлення.',
	'update.action': 'Перезавантажити',
	'update.dismiss': 'Не зараз',
	'edition.label': 'Видання',
	'edition.select': 'Обрати видання',
	'edition.current': 'Поточне видання',
	'edition.filter': 'Шукати видання',
	'menu.noMatches': 'Збігів немає',
	'unitNav.previous': 'Попереднє',
	'unitNav.next': 'Наступне',
	'bible.prevChapter': 'Попередній розділ',
	'bible.nextChapter': 'Наступний розділ',
	'bible.pickBook': 'Книги і розділи',
	'bible.landing.title': 'Біблія',
	'bible.landing.tagline': 'Читайте всю Біблію, книгу за книгою, розділ за розділом.',
	'bible.landing.random': 'Мені пощастить',
	'bible.landing.books': 'Книги',
	'bible.chapterUnavailable': 'Немає в цьому виданні',
	'bible.introduction': 'Вступ',
	'bible.introUnavailable': 'Поки немає вступу цією мовою',
	'bible.introSource': 'Вступи не є частиною тексту Писання.',
	'bible.testament.ot': 'Старий Завіт',
	'bible.testament.nt': 'Новий Завіт',
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
	'ccc.prevParagraph': 'Попередній параграф',
	'ccc.nextParagraph': 'Наступний параграф',
	'ccc.inBrief': 'Коротко',
	'ccc.landing.title': 'Катехизм Католицької Церкви',
	'ccc.landing.pairTitle': 'Катехизм і Компендіум',
	'ccc.landing.tagline':
		'<strong>Катехизм</strong> викладає католицьке вчення у 2865 пронумерованих пунктах. <strong>Компендіум</strong> подає те саме вчення як 598 запитань і відповідей за тим самим порядком.',
	'ccc.landing.pairTagline':
		'Катехизм Католицької Церкви у 2865 параграфах і його Компендіум у 598 питаннях.',
	'ccc.tableOfContents': 'Зміст',
	'ccc.related': 'Див. також',
	'compendium.landing.title': 'Компендіум Катехизму',
	'compendium.landing.tagline':
		'Запитання і відповіді, що стисло викладають Катехизм Католицької Церкви.',
	'compendium.question': 'Запитання',
	'compendium.answer': 'Відповідь',
	'compendium.tableOfContents': 'Зміст',
	'compendium.prevQuestion': 'Попереднє запитання',
	'compendium.nextQuestion': 'Наступне запитання',
	'compendium.condenses': 'Стисло викладає ККЦ ¶¶',
	'ccc.abbrev': 'ККЦ',
	'ccc.condensedIn': 'У Компендіумі',
	'compendium.abbrev': 'Комп.',
	'compendium.noQuestionNumber': 'У цьому корпусі немає номера запитання',
	'document.library.tagline':
		'Енцикліки, соборові конституції, декрети та декларації Учительства Церкви.',
	'document.filter.heading': 'Фільтр',
	'document.filter.author': 'Автор',
	'document.filter.kind': 'Тип',
	'document.filter.subject': 'Тема',
	'document.filter.search': 'Пошук документів',
	'document.filter.clear': 'Очистити',
	'document.filter.results': 'Показано документів',
	'document.filter.noResults': 'Жоден документ не відповідає цим фільтрам.',
	'document.tableOfContents': 'Зміст',
	'document.startReading': 'Почати читання',
	'document.readFullDocument': 'Читати весь документ',
	'document.section': 'Розділ',
	'document.prevSection': 'Попередній',
	'document.nextSection': 'Наступний',
	'document.kind.conciliarConstitution': 'Конституція',
	'document.kind.conciliarDecree': 'Декрет',
	'document.kind.conciliarDeclaration': 'Декларація',
	'document.kind.encyclical': 'Енцикліка',
	'document.kind.apostolicExhortation': 'Апостольське повчання',
	'document.kind.apostolicConstitution': 'Апостольська конституція',
	'document.kind.apostolicLetter': 'Апостольський лист',
	'document.kind.cdfDeclaration': 'Декларація Конгр. віровчення',
	'document.kind.cdfInstruction': 'Інструкція Конгр. віровчення',
	'document.kind.cdfLetter': 'Лист Конгр. віровчення',
	'document.kind.cdfDoctrinalNote': 'Доктринальна нота Конгр. віровчення',
	'document.kind.cdfResponsum': 'Респонсум Конгр. віровчення',
	'document.kind.cdfConsiderations': 'Міркування Конгр. віровчення',
	'document.kindPlural.conciliarConstitution': 'Конституції',
	'document.kindPlural.conciliarDecree': 'Декрети',
	'document.kindPlural.conciliarDeclaration': 'Декларації',
	'document.kindPlural.encyclical': 'Енцикліки',
	'document.kindPlural.apostolicExhortation': 'Апостольські повчання',
	'document.kindPlural.apostolicConstitution': 'Апостольські конституції',
	'document.kindPlural.apostolicLetter': 'Апостольські листи',
	'document.kindPlural.cdfDeclaration': 'Декларації Конгр. віровчення',
	'citation.unavailable': 'Для цієї примітки немає джерельного тексту.',
	'doctores.landing.title': 'Учителі Церкви',
	'doctores.landing.tagline': 'Богословські твори Отців та Учителів Церкви.',
	'summa.landing.title': 'Сума теології',
	'summa.landing.tagline': 'Тома Аквінський, англійською і латиною, якою він писав.',
	'summa.tableOfContents': 'Зміст',
	'summa.part': 'Частина',
	'summa.question': 'Питання',
	'summa.article': 'Артикул',
	'summa.questionShort': 'Пит.',
	'summa.articleShort': 'Арт.',
	'summa.titleFromEdition': 'Назва з видання {lang}',
	'summa.titlesFromEdition': 'Назви з видання {lang} — тут вони не друкуються',
	'summa.prologue': 'Пролог',
	'summa.objection': 'Заперечення',
	'summa.sedContra': 'Але навпаки',
	'summa.corpus': 'Відповідаю',
	'summa.reply': 'Відповідь на заперечення',
	'summa.preamble': 'Примітка',
	'summa.prevQuestion': 'Попереднє питання',
	'summa.nextQuestion': 'Наступне питання',
	'summa.noEditionInYourLanguage': 'Сума не має видання вашою мовою. Показано {lang}.',
	'summa.noLatinSupplement':
		'Додаток існує лише англійською — його уклали після смерті Аквінського.',
	'index.division': 'Розділ',
	'index.showSubsections': 'Показати підрозділи',
	'index.hideSubsections': 'Сховати підрозділи',
	'prayers.landing.title': 'Звичайні молитви',
	'prayers.landing.tagline': 'Молитви з латинським текстом поруч.',
	'prayers.tableOfContents': 'Зміст',
	'prayers.gloss.versicle':
		'Версикул — рядок, який той, хто провадить молитву, промовляє або співає сам. Присутні відповідають на нього дальшою відповіддю.',
	'prayers.gloss.response':
		'Відповідь — рядок, який присутні промовляють або співають разом, відповідаючи на попередній версикул.',
	'prayers.seeAlso': 'Див. також',
	'prayers.prevPrayer': 'Попередня молитва',
	'prayers.nextPrayer': 'Наступна молитва',
	'prayers.rosary.today': 'Сьогодні',
	'prayers.rosary.todayHeading': 'Сьогоднішні таємниці',
	'prayers.rosary.openingPrayer': 'Вступна молитва',
	'prayers.rosary.decadePrayers': 'Молитви десятка',
	'ref.tooltip.loading': 'Завантаження…',
	'ref.tooltip.openCcc': 'Відкрити в Катехизмі',
	'ref.tooltip.openBible': 'Відкрити в Біблії',
	'ref.tooltip.openCompendium': 'Відкрити в Компендіумі',
	'ref.preview.open': 'Відкрити',
	'ref.cf': 'пор.',
	'anchor.actions': 'Дії з посиланням',
	'anchor.copy': 'Копіювати текст',
	'anchor.copyLink': 'Копіювати посилання',
	'anchor.view': 'Переглянути',
	'anchor.copied': 'Скопійовано',
	'anchor.copyFailed': 'Не вдалося скопіювати',
	'bookmark.add': 'У закладки',
	'bookmark.remove': 'Прибрати закладку',
	'bookmark.library': 'Закладки',
	'bookmark.library.tagline': 'Усе, що ви позначили під час читання.',
	'bookmark.empty': 'Поки нічого не позначено.',
	'bookmark.emptyHint':
		'Натисніть на номер вірша чи абзацу і виберіть «У закладки», або скористайтеся кнопкою закладки на сторінці.',
	'bookmark.about': 'Про ці закладки',
	'bookmark.deviceOnly':
		'Закладки зберігаються лише в цьому браузері. Вони нікуди не надсилаються, і очищення даних браузера їх видаляє.',
	'bookmark.unavailable': 'Немає у виданні, яке ви читаєте',
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
	'footer.notEndorsed': 'Без схвалення Святого Престолу',
	'colophon.textsTitle': 'Тексти',
	'colophon.textsBody':
		'Кожен текст походить із названого джерела, і кожен твір записує своє видання, свою вихідну сторінку та дату, коли його було отримано. Писання використовує переклади в суспільному надбанні; Катехизм, Компендіум і документи Магістеріуму походять із власних опублікованих текстів Святого Престолу.',
	'colophon.textsFidelity':
		'Текст ніколи не скорочується, ніколи не переказується, ніколи не переписується і ніколи не вміщується поруч із рекламою. Явні вади ми таки виправляємо — випале слово, спотворене посилання, розмітку, що поглинула абзац — завжди у бік того, що друкує саме джерело, ніколи у бік того, що, на нашу думку, воно мало б казати.',
	'colophon.countBible': 'видань Біблії',
	'colophon.countDocuments': 'документів Магістеріуму',
	'colophon.privacyTitle': 'Приватність',
	'colophon.privacyBody1':
		'Жодних облікових записів, жодних файлів cookie, жодної реклами, жодного стороннього коду. Ніщо тут не переслідує вас за межами цього сайту.',
	'colophon.privacyBody2':
		'Ми таки підраховуємо, як використовується сайт: один вимір на відвідування, кожне поле — діапазон, а не точне значення, — скільки часу ви провели, як часто ви тут були, які твори відкривали. Ваша країна підраховується окремо, і ніщо не з’єднує її з рештою. Це опис відвідування, а не відвідувача, і зберігається {days} днів.',
	'colophon.privacyBody3':
		'Ніколи не надсилається: що ви вводите в поле пошуку, яке місце ви читали, чи будь-що, за чим можна впізнати ваш пристрій знову. Ваші налаштування, закладки і завантажені тексти лишаються на вашому пристрої.',
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
	'plates.scansBy': 'Скани надані',
	'plates.enlarge': 'Збільшити {title}',
	'plates.zoom': 'Збільшення',
	'art.about': 'Про це зображення',
	'art.detail': 'фрагмент',
	'colophon.typeTitle': 'Шрифт',
	'colophon.typeBody':
		'Набрано шрифтом EB Garamond, відродженням Ґеорґа Дуфнера й Октавіо Пардо тих літер, які Клод Ґарамон різьбив у 1590-х роках — гуманістичної традиції, у якій Церква друкує від часів Ренесансу. Його кирилиця — тієї ж руки, але не відроджує нічого: кириличного Ґарамона ніколи не різьбили, тож російська набрана формою, намальованою так, щоб стояти поруч з рештою.',
	'colophon.typeArabic':
		'Арабська цілком поза його межами і набрана шрифтом Amiri — відродженням Халеда Хосні насха, різьбленого для друкарні Булак у Каїрі 1905 року, обраним з того ж міркування, що й текстовий шрифт: певний історичний книжковий шрифт, а не сучасний малюнок.',
	'colophon.typeInitials':
		'Початкові ініціали — Pirata One, готичний шрифт, чиї великі літери лишаються читними в тому розмірі, якого вимагає буквиця, і — для російської — Ponomar, який відтворює церковнослов’янський шрифт Синодальної друкарні. Ponomar набирає ініціал і ніколи текст: сучасна енцикліка, набрана суцільно синодальним шрифтом, сказала б неправду про те, чим вона є. Усі вони ліцензовані за SIL Open Font License і подаються з цього сайту, а не від третьої сторони, тож читання сторінки нічого не вимагає від чужого сервера.',
	'refs.citedIn': 'Цитується в',
	'refs.externalVolume': 'Том {volume} на {host} — скановане PDF',
	'bible.wholeChapter': 'Цей розділ',
	'bible.verseNotInEdition':
		'Цього номера вірша немає в цьому виданні — див. примітку в джерелі сторінки',
	'bible.verseAbbrev': 'в.',
	'bible.note': 'Примітка',
	'bible.noteMissing': 'Цієї примітки немає в корпусі',
	'bible.chapterArgument': 'Аргумент',
	'ccc.readFullChapter': 'Читати весь розділ',
	'ccc.noParagraphNumber': 'У цьому корпусі немає номера параграфа',
	'copyright.sourceTitle': 'Відкрити первісну сторінку джерела',
	'copyright.sourceLabel': 'Джерело',
	'lang.label': 'Мова',
	'lang.filter': 'Шукати мови',
	'lang.more': 'ще мови',
	'notFound.title': 'За цією адресою нічого немає',
	'notFound.lede': 'Сторінки, яку ви шукали, тут немає.',
	'notFound.body':
		'Посилання могло бути набране з помилкою чи застаріти, або вказувати на текст, якого немає на цьому сайті.',
	'notFound.searchHint':
		'Якщо ви знаєте потрібне посилання — книгу і розділ, параграф Катехизму — введіть його в поле пошуку вгорі цієї сторінки.',
	'notFound.credit': 'За мотивами British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Або почніть з одного з цих:',
	'notFound.home': 'Головна',
	'compare.enter': 'Порівняти видання',
	'compare.exit': 'Вийти з порівняння',
	'compare.missing': 'Немає в цьому виданні',
	'compare.versificationNote':
		'Ці два видання подекуди по-різному ділять вірші цього розділу (текстологічний варіант, а не перекладацьке рішення) — той самий номер вірша не завжди позначає те саме речення в обох колонках.',
	'compare.loading': 'Завантаження другої мови…',
	'ui.close': 'Закрити',
	'shortcuts.title': 'Клавіатурні скорочення',
	'shortcuts.betweenDocuments': 'Між документами',
	'shortcuts.withinDocument': 'Усередині документа',
	'shortcuts.show': 'Показати цей список',
	'help.title': 'Довідка',
	'help.reading.heading': 'Смуга над текстом',
	'help.feature.offline':
		'Додайте сайт на головний екран, і він відкриється як застосунок. Можна завантажити цілі твори й читати без мережі.',
	'help.feature.contents':
		'Поділи твору, у якому ви є, — книги, частини, розділи — щоб рухатися всередині нього, не повертаючись на початок.',
	'help.feature.compare':
		'Два видання того самого місця поруч — латина поряд із вашою мовою або один переклад поряд з іншим.',
	'help.feature.apparatus':
		'Власні примітки видання і будь-який написаний до тексту коментар подаються поруч із ним, а не під ним. Цитати всередині тексту — це посилання, тож відсилання веде туди, куди вказує.',
	'help.feature.focus':
		'Прибирає все, крім тексту. Вихід лишається там, де була смуга, тож ніщо не замикається за нею.',
	'zen.enter': 'Режим фокусу',
	'zen.exit': 'Вийти з режиму фокусу',
	'nav.calendar': 'Календар',
	'calendar.title': 'Літургійний календар',
	'calendar.tagline':
		'Загальний Римський календар, обчислений на будь-який день — його час, його ранг, його колір.',
	'calendar.national.tagline': '{name} із власними святкуваннями, обчислений на будь-який день.',
	'calendar.calendar': 'Календар',
	'calendar.which.general': 'Загальний Римський календар',
	'calendar.filter': 'Пошук країн',
	'calendar.region.europe': 'Європа',
	'calendar.region.americas': 'Америки',
	'calendar.region.africa': 'Африка',
	'calendar.region.middleEast': 'Близький Схід',
	'calendar.region.asia': 'Азія',
	'calendar.region.oceania': 'Океанія',
	'calendar.today': 'Сьогодні',
	'calendar.previousMonth': 'Попередній місяць',
	'calendar.nextMonth': 'Наступний місяць',
	'calendar.plainDays': 'Звичайні будні дні',
	'calendar.noSuchDay': 'Для цієї дати літургійний день не обчислюється.',
	'calendar.week': 'тиждень',
	'calendar.alsoToday': 'Сьогодні також святкується',
	'calendar.alsoObserved': 'Сьогодні також відзначається',
	'calendar.obligation': 'Обов’язкове свято',
	'calendar.obligationCanon': 'CIC кан. 1246',
	'calendar.sundayCycle': 'Недільний цикл',
	'calendar.weekdayCycle': 'Буденний цикл',
	'calendar.psalterWeek': 'Тиждень псалтиря',
	'lectionary.heading': 'Читання на Месі',
	'lectionary.slot.reading': 'Читання',
	'lectionary.slot.reading1': 'Перше читання',
	'lectionary.slot.reading2': 'Друге читання',
	'lectionary.slot.reading3': 'Третє читання',
	'lectionary.slot.reading4': 'Четверте читання',
	'lectionary.slot.reading5': 'П’яте читання',
	'lectionary.slot.reading6': 'Шосте читання',
	'lectionary.slot.reading7': 'Сьоме читання',
	'lectionary.slot.psalm': 'Респонсорний псалом',
	'lectionary.slot.epistle': 'Послання',
	'lectionary.slot.acclamation': 'Акламація перед Євангелієм',
	'lectionary.slot.gospel': 'Євангеліє',
	'lectionary.slot.sequence': 'Секвенція',
	'lectionary.or': 'або',
	'lectionary.cf': 'Пор.',
	'lectionary.about': 'Про ці читання',
	'lectionary.caveat':
		'Уривки, призначені Ordo Lectionum Missae, пов’язані з власними виданнями цього сайту — це не переклад, який проголошується в конкретній церкві, і конференція єпископів може адаптувати розклад.',
	'calendar.transferredFrom': 'Перенесено з',
	'calendar.season.advent': 'Адвент',
	'calendar.season.christmas': 'Різдвяний час',
	'calendar.season.lent': 'Великий піст',
	'calendar.season.triduum': 'Пасхальне тридення',
	'calendar.season.easter': 'Пасхальний час',
	'calendar.season.ordinary': 'Звичайний час',
	'calendar.colour.white': 'Білий',
	'calendar.colour.red': 'Червоний',
	'calendar.colour.green': 'Зелений',
	'calendar.colour.violet': 'Фіолетовий',
	'calendar.colour.rose': 'Рожевий',
	'calendar.colour.black': 'Чорний',
	'calendar.colour.blue': 'Блакитний',
	'calendar.rank.solemnity': 'Урочистість',
	'calendar.rank.feast': 'Свято',
	'calendar.rank.memorial': 'Обов’язковий спомин',
	'calendar.rank.optional-memorial': 'Необов’язковий спомин',
	'calendar.rank.commemoration': 'Комеморація',
	'calendar.rank.sunday': 'Неділя',
	'calendar.rank.weekday': 'Будній день',
	'calendar.gloss.season.advent':
		'Чотири тижні перед Різдвом: приготування до приходу Господнього і початок церковного року.',
	'calendar.gloss.season.christmas':
		'Від Різдва до Хрещення Господнього — народження Господа і Його з’явлення світові.',
	'calendar.gloss.season.lent':
		'Сорок днів від Попільної середи до вечірньої Меси Вечері Господньої: покаяння, милостиня і приготування до Пасхи.',
	'calendar.gloss.season.triduum':
		'Три дні від вечора Великого четверга до вечора Пасхальної неділі — страждання, смерть і воскресіння Господа, вершина цілого року.',
	'calendar.gloss.season.easter':
		'П’ятдесят днів від Пасхи до Зіслання Святого Духа, святкованих як одне свято — «одна велика неділя».',
	'calendar.gloss.season.ordinary':
		'Тридцять три або тридцять чотири тижні поза іншими періодами. Не «звичайний», а впорядкований: тижні полічені, і Церква читає життя й науку Господа по порядку. Він приходить двома відтинками — після різдвяного часу до Великого посту і після Зіслання Святого Духа до Адвенту.',
	'calendar.gloss.rank.solemnity':
		'Найвищий ступінь: Пасха, Різдво, Вознесіння, покровитель місця. Звершується зі «Слава во вишніх» і Символом віри й починається напередодні ввечері.',
	'calendar.gloss.rank.feast':
		'Звершується в межах самого дня. Апостоли та євангелисти, а також більші дні Господні й Богородичні.',
	'calendar.gloss.rank.memorial':
		'Святий, згадуваний у свій день, усередині Меси і Літургії годин даного періоду. Обов’язковий там, де звершується.',
	'calendar.gloss.rank.optional-memorial':
		'Може звершуватися або ні, за вибором священника чи спільноти. Якщо не звершується, день — просто буденний.',
	'calendar.gloss.rank.commemoration':
		'Те, чим стає спомин у Великому пості: молитва, додана до буденної Меси, яку період в іншому зберігає цілою.',
	'calendar.gloss.rank.sunday':
		'Первісне свято — день Господній, святкований щотижня від воскресіння. Лише урочистість або свято Господнє може його витіснити, а в Адвенті, Великому пості й пасхальному часі — навіть вони ні.',
	'calendar.gloss.rank.weekday':
		'День без власного святкування. Меса і Літургія годин — від періоду, і саме це робить період тим, що варто знати.',
	'calendar.gloss.colour.white':
		'Радість. Пасхальний і різдвяний час, дні Господні поза Його стражданням, Богородиця, ангели й святі, які не були мучениками.',
	'calendar.gloss.colour.red':
		'Кров і вогонь. Вербна неділя і Велика п’ятниця, Зіслання Святого Духа, апостоли та євангелисти, а також мученики.',
	'calendar.gloss.colour.green': 'Звичайний час: колір надії і того, що росте.',
	'calendar.gloss.colour.violet': 'Адвент і Великий піст, а також на Месах за померлих.',
	'calendar.gloss.colour.rose':
		'Уживається двічі на рік — у неділю Gaudete, третю Адвенту, і в неділю Laetare, четверту Великого посту, — де піст світлішає і кінець уже видно.',
	'calendar.gloss.colour.black': 'Може вживатися на Месах за померлих.',
	'calendar.gloss.colour.blue':
		'Привілей блакитного: уживається у свято Непорочного Зачаття в Іспанії, на Філіппінах і в тих небагатьох інших місцях, яким Апостольський Престол його надав.',
	'calendar.gloss.sundayCycle':
		'Недільні читання йдуть трьома роками — A, B і C — читаючи по черзі Матея, Марка і Луку, з Іваном у Великому пості й пасхальному часі. Цикл змінюється в першу неділю Адвенту, разом із церковним роком.',
	'calendar.gloss.weekdayCycle':
		'Буденні читання йдуть двома роками, I і II: перше читання змінюється, Євангеліє ні. Літургійний рік називається за календарним роком, у якому закінчується, — непарні роки I, парні II.',
	'calendar.gloss.psalterWeek':
		'Літургія годин розподіляє псалми на чотири тижні, від I до IV, які повторюються протягом року. Це тиждень, чиї псалми припадають на сьогодні, для кожного, хто молиться години.',
	'calendar.gloss.obligation':
		'День, коли вірні зобов’язані брати участь у Месі й утримуватися від праць, що цьому завадили б. Кожна неділя і решта днів, які визначила відповідна конференція єпископів.',
	'calendar.primer.title': 'Уперше тут?',
	'calendar.primer.lead':
		'Церква тримає власний рік. Він починається Адвентом, обертається довкола Пасхи і дає кожному дневі ім’я, ступінь і колір — а вони вирішують, що того дня молиться і читається на Месі та в Літургії годин. Тож «двадцять третя звичайна неділя» — це адреса: вона каже священникові, хорові чи будь-кому, хто молиться вдома, які молитви й читання належать сьогоднішньому дневі.',
	'calendar.primer.seasons': 'Періоди',
	'calendar.primer.ranks': 'Чим може бути день',
	'calendar.primer.colours': 'Кольори',
	'calendar.primer.cycles': 'Цикли',
	'calendar.primer.cyclesLead':
		'Три лічильники, які разом кажуть, які читання і псалми призначені на сьогодні.'
};
