/**
 * Polish UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
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

export const pl: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katechizm',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magisterium',
	'nav.socialDoctrine': 'Nauka społeczna',
	'socialDoctrine.landing.title': 'Kompendium nauki społecznej Kościoła',
	'socialDoctrine.landing.tagline': 'Czego Kościół naucza o życiu społecznym, w 583 numerach.',
	'nav.canonLaw': 'Prawo kanoniczne',
	'canonLaw.landing.title': 'Kodeks Prawa Kanonicznego',
	'canonLaw.landing.tagline': 'Prawo Kościoła łacińskiego w 1752 kanonach w siedmiu księgach.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Poprzedni kanon',
	'canonLaw.nextCanon': 'Następny kanon',
	'canonLaw.readFullTitle': 'Przeczytaj cały tytuł',
	'canonLaw.superseded': 'Brzmienie zastąpione przez',
	'nav.prayers': 'Modlitwy',
	'nav.bookmarks': 'Zakładki',
	'nav.menu': 'Menu',
	'nav.sections': 'Sekcje',
	'nav.works': 'Dzieła',
	'nav.pages': 'Strony',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Czytaj dalej',
	'home.tagline':
		'Strona do czytania Pisma Świętego, Katechizmu i dokumentów Magisterium — bezpłatna, działająca bez połączenia i bez żadnej rejestracji.',
	'home.doors.heading': 'Dokąd pójść',
	'home.find.heading': 'Albo wpisz odsyłacz',
	'nav.library': 'Biblioteka',
	'nav.learn': 'Nauka',
	'library.landing.tagline':
		'Cały zbiór, półka po półce — wraz z miejscem, w którym przerwałeś, i tym, co zaznaczyłeś.',
	'schola.landing.title': 'Od czego zacząć',
	'schola.landing.tagline':
		'Krótki przewodnik po tym, co tu jest: czym jest każda z tych ksiąg, jak zapisuje się jej odsyłacz, jak znaleźć fragment, i porządki czytania, które Kościół zaproponował.',
	'schola.start.heading': 'Nowy w katolicyzmie?',
	'schola.start.body': 'Zacznij od ',
	'schola.start.bodyAfter':
		': ta sama nauka co w Katechizmie, o wiele krótsza, zapisana w pytaniach i odpowiedziach. Ma około jednej dziesiątej objętości i niczego nie zakłada.',
	'schola.bible.heading': 'Nigdy nie czytałeś Biblii?',
	'schola.bible.library':
		'To nie jedna księga, lecz siedemdziesiąt trzy, pisane przez ponad tysiąc lat i zebrane w porządku, który ustalił Kościół — nie w porządku, w jakim rzeczy się działy, i nie w tym, który czyta się najłatwiej. Większość zaczyna od pierwszej strony i przerywa kilka tygodni później, w długim rozdziale starożytnego prawa, bo nic im jeszcze nie powiedziało, po co to jest.',
	'schola.bible.step.gospel': 'Zacznij od Ewangelii',
	'schola.bible.start':
		'Jedna z czterech krótkich ksiąg o życiu Jezusa, głęboko w środku, a nie na początku. To nie nasz pomysł: Sobór Kościoła prosił, by uczono właściwego korzystania z Pisma, „zwłaszcza Nowego Testamentu, a przede wszystkim Ewangelii”. Nie wskazał żadnej z osobna, i my też nie wskażemy.',
	'schola.bible.whichGospel':
		'Trzy bywają zwykle proponowane, z trzech różnych powodów. Każda z nich jest dobrym miejscem, by w nim być.',
	'schola.bible.gospel.mark':
		'Najkrótsza. Możesz ją przeczytać w całości w jedno popołudnie, a skończyć jedną znaczy na początku więcej niż wybrać najlepszą.',
	'schola.bible.gospel.luke':
		'Napisana dla kogoś spoza wiary, kto chciał mieć rzecz spisaną po kolei — czym możesz być właśnie Ty. Przechodzi wprost w Dzieje Apostolskie, jest więc naprawdę pierwszą połową dłuższej księgi.',
	'schola.bible.gospel.john':
		'Ta, która wprost mówi, po co została napisana: „abyście wierzyli”. Proste słowa, i idzie prosto do pytania, kim jest Jezus.',
	'schola.bible.step.acts': 'Potem, co stało się dalej',
	'schola.bible.thenActs':
		'Gdy skończysz jedną, przeczytaj, co po Jego odejściu robili ci, którzy Go znali.',
	'schola.bible.acts.why':
		'Trzydzieści lat po końcu Ewangelii: kilkadziesiąt przestraszonych osób i to, jak, co widzieli, dotarło na drugi kraniec cesarstwa.',
	'schola.bible.step.old': 'Potem starsza połowa',
	'schola.bible.thenOld':
		'Nie od pierwszej strony i nie w całości. Kilka miejsc niesie opowieść, i są to te, do których Ewangelie wciąż odsyłają.',
	'schola.bible.ot.beginnings': 'Jak się zaczyna i jak się psuje.',
	'schola.bible.ot.promise':
		'Jedna rodzina i dana jej obietnica, która przeżywa wszystkich w niej.',
	'schola.bible.ot.exodus': 'Lud wyprowadzony z niewoli i dane mu prawo, wedle którego ma żyć.',
	'schola.bible.ot.psalms':
		'Nie opowieść: sto pięćdziesiąt modlitw i pieśni. Czytaj po jednym, w dowolnej kolejności. Kościół wciąż odmawia je codziennie.',
	'schola.bible.bothWays':
		'Będziesz rozpoznawał rzeczy, i o to właśnie chodzi, a nie o zbieg okoliczności. Kościół czyta księgi starsze w świetle Chrystusa, a nowsze w świetle tego, co było przedtem — każda połowa tłumaczy drugą, i dlatego żadnej nie czyta się osobno.',
	'schola.books.heading': 'Co tu jest i jak się to oznacza',
	'schola.books.lede':
		'Każda z tych ksiąg jest innego rodzaju i do każdej odsyła się własnym numerem. Przykłady pokazują postać: wpisz podobny w pole wyszukiwania, a trafisz na miejsce.',
	'schola.cite.label': 'Oznaczane',
	'schola.what.scripture':
		'Pismo Święte, jak je Kościół przyjmuje, w obu Testamentach. Wszystko inne tutaj czyta się w jego świetle.',
	'schola.cite.scripture': 'księga, rozdział i werset, w skrótach, które drukuje Twoje wydanie',
	'schola.what.catechism':
		'Streszczenie tego, w co wierzy Kościół katolicki, w jednym tomie. Sam nie jest źródłem: zbiera Pismo, Ojców, liturgię i nauczanie Kościoła, a każdy punkt mówi, skąd pochodzi to, co głosi.',
	'schola.cite.catechism':
		'według numeru punktu, biegnącego bez przerwy od pierwszej strony do ostatniej',
	'schola.what.compendium':
		'Ta sama nauka wyłożona w pytaniach i odpowiedziach, mniej więcej dziesięciokrotnie krótsza.',
	'schola.cite.compendium': 'według numeru pytania',
	'schola.what.magisterium':
		'To, co papieże i sobory rzeczywiście napisali — encykliki, konstytucje, dekrety, deklaracje — każde skierowane do określonej chwili i określonej sprawy. Każde znane jest po swoich pierwszych słowach po łacinie.',
	'schola.cite.magisterium': 'według nazwy dokumentu, a potem numeru punktu w nim',
	'schola.what.social':
		'Nauczanie Kościoła o pracy, własności, rodzinie, polityce i pokoju, zebrane z tych dokumentów w jedną księgę.',
	'schola.cite.social': 'według numeru punktu, pod skrótem, którym dzieło samo się określa',
	'schola.what.law': 'Prawo, a nie doktryna. Mówi, czego Kościół wymaga, i bywa nowelizowane.',
	'schola.cite.law': 'według kanonu, bo tak nazywają się jego numerowane jednostki',
	'schola.what.doctors':
		'Teologowie, których Kościół ogłosił Doktorami. Nie niesie to żadnej urzędowej powagi, jakkolwiek wielki byłby autor.',
	'schola.cite.doctors': 'według części, potem kwestii — własnych podziałów Sumy',
	'schola.what.prayers': 'Słowa, którymi Kościół się modli, z łaciną obok.',
	'schola.cite.prayers': 'po nazwie; nie ma numerów do cytowania',
	'schola.places.heading': 'Nie teksty, lecz miejsca na tej stronie',
	'schola.what.library':
		'Wszystkie dzieła strony w jednym wykazie, pogrupowane według przedmiotu, a nie rodzaju.',
	'schola.what.calendar':
		'Dzień liturgiczny — okres, kolor i kogo się wspomina — dla kraju, którego kalendarz zachowujesz.',
	'schola.what.bookmarks':
		'Fragmenty, które zaznaczyłeś, i miejsce, na którym ostatnio stanąłeś w każdym dziele. Jedno i drugie zostaje w tej przeglądarce i nigdzie nie jest wysyłane.',
	'ccc.noCounterpart': 'Brak odpowiednika w drugim dziele',
	'jumpbox.placeholder': 'Przejdź do… (np. jan 3,16, ccc 1234)',
	'jumpbox.short': 'Szukaj',
	'jumpbox.hint': 'Naciśnij / lub Ctrl+K, aby przejść do odsyłacza',
	'jumpbox.noMatch': 'Brak wyników',
	'jumpbox.suggestions': 'Podpowiedzi',
	'settings.label': 'Ustawienia',
	'apparatus.label': 'Aparat',
	'apparatus.editionNotes': 'Przypisy tego wydania',
	'apparatus.commentary': 'Komentarz',
	'apparatus.inCommentary': 'Uwzględnione w komentarzu powyżej.',
	'darkMode.label': 'Tryb ciemny',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Tak',
	'darkMode.off': 'Nie',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Tylko tryb jasny',
	'sepia.noHue': 'Nie w mono',
	'oled.label': 'Czerń OLED',
	'oled.darkOnly': 'Tylko tryb ciemny',
	'mono.label': 'Monochromatyczny',
	'mono.hint':
		'Składa całą stronę w jednym odcieniu szarości, więc nic nie jest rozróżniane kolorem. Sepia jest wyłączona, gdy tryb działa.',
	'advanced.label': 'Zaawansowane',
	'library.title': 'Biblioteka offline',
	'library.lede': 'Teksty zapisane na tym urządzeniu otwierają się zupełnie bez sieci.',
	'library.essentials': 'Modlitwy i Kompendium',
	'library.illustrations': 'Biblia (ilustracje)',
	'library.illustrationsDetail': 'Biblia (ilustracje, wysoka rozdzielczość)',
	'library.other': 'Inne teksty',
	'library.everything': 'Wszystko',
	'library.downloadAll': 'Pobierz wszystko',
	'library.download': 'Pobierz',
	'library.downloaded': 'Na tym urządzeniu',
	'library.offlineNote': 'Wyłącz tryb offline, aby pobierać.',
	'library.remove': 'Usuń z tego urządzenia',
	'library.removeConfirm': 'Usunąć?',
	'library.forget': 'Usuń pobrane',
	'library.forgetConfirm': 'Usunąć wszystko?',
	'offline.label': 'Tryb offline',
	'offline.hint':
		'W ogóle nie korzysta z sieci: nic nie jest pobierane, aktualizacje nie są sprawdzane, nic nie jest mierzone. Otwierają się tylko teksty, które są już na tym urządzeniu.',
	'offline.notDownloaded': 'Nie ma na tym urządzeniu',
	'loadFailed.title': 'To się nie wczytało',
	'loadFailed.hint':
		'Strona istnieje — coś poszło nie tak przy jej pobieraniu. Ponowna próba zwykle wystarcza.',
	'loadFailed.retry': 'Spróbuj ponownie',
	'loadFailed.retrying': 'Próba…',
	'offline.turnOff': 'Wyłącz tryb offline',

	'type.label': 'Wielkość tekstu i krój pisma',
	'fontSize.label': 'Wielkość tekstu',
	'fontSize.small': 'Mały',
	'fontSize.medium': 'Średni',
	'fontSize.large': 'Duży',
	'fontSize.xlarge': 'Bardzo duży',
	'fontSize.xxlarge': 'Największy',
	'face.label': 'Krój pisma',
	'face.serif': 'Szeryf',
	'face.sans': 'Groteska',
	'print.label': 'Drukuj tę stronę',
	'toTop.label': 'Powrót na górę',
	'install.label': 'Zainstaluj Glossę',
	'install.hint.label': 'Dodaj do ekranu głównego',
	'install.hint.title': 'Dodaj Glossę do ekranu głównego',
	'install.hint.stepBefore': 'Otwiera się jak aplikacja i czyta się bez połączenia. Dotknij',
	'install.hint.stepAfter': 'a potem „Dodaj do ekranu głównego”.',
	'install.hint.dismiss': 'Zamknij',
	'update.label': 'Dostępne jest nowe wydanie',
	'update.title': 'Nowe wydanie jest gotowe',
	'update.body': 'Odśwież, aby pobrać najnowsze teksty i poprawki.',
	'update.action': 'Odśwież',
	'update.dismiss': 'Nie teraz',
	'edition.label': 'Wydanie',
	'edition.select': 'Wybierz wydanie',
	'edition.current': 'Obecne wydanie',
	'edition.filter': 'Szukaj wydań',
	'menu.noMatches': 'Brak wyników',
	'unitNav.previous': 'Poprzedni',
	'unitNav.next': 'Następny',
	'bible.prevChapter': 'Poprzedni rozdział',
	'bible.nextChapter': 'Następny rozdział',
	'bible.pickBook': 'Księgi i rozdziały',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Czytaj całą Biblię, księga po księdze, rozdział po rozdziale.',
	'bible.landing.random': 'Szczęśliwy traf',
	'bible.landing.books': 'Księgi',
	'bible.chapterUnavailable': 'Niedostępne w tym wydaniu',
	'bible.introduction': 'Wprowadzenie',
	'bible.introUnavailable': 'Brak jeszcze wprowadzenia w tym języku',
	'bible.introSource': 'Wprowadzenia nie należą do tekstu Pisma.',
	'bible.testament.ot': 'Stary Testament',
	'bible.testament.nt': 'Nowy Testament',
	'bible.group.pentateuch': 'Pięcioksiąg',
	'bible.group.historical': 'Księgi historyczne',
	'bible.group.wisdom': 'Księgi dydaktyczne',
	'bible.group.prophetic': 'Księgi prorockie',
	'bible.group.gospels': 'Ewangelie',
	'bible.group.acts': 'Dzieje Apostolskie',
	'bible.group.pauline': 'Listy Pawła',
	'bible.group.catholicLetters': 'Listy powszechne',
	'bible.group.revelation': 'Apokalipsa św. Jana',
	'ccc.prevParagraph': 'Poprzedni akapit',
	'ccc.nextParagraph': 'Następny akapit',
	'ccc.inBrief': 'W skrócie',
	'ccc.landing.title': 'Katechizm Kościoła Katolickiego',
	'ccc.landing.pairTitle': 'Katechizm i Kompendium',
	'ccc.landing.tagline':
		'<strong>Katechizm</strong> wykłada naukę katolicką w 2865 numerowanych punktach. <strong>Kompendium</strong> przedstawia tę samą naukę w 598 pytaniach i odpowiedziach, według tego samego układu.',
	'ccc.landing.pairTagline':
		'Katechizm Kościoła Katolickiego w 2865 punktach i jego Kompendium w 598 pytaniach.',
	'ccc.tableOfContents': 'Spis treści',
	'ccc.related': 'Zobacz także',
	'compendium.landing.title': 'Kompendium Katechizmu',
	'compendium.landing.tagline':
		'Pytania i odpowiedzi streszczające Katechizm Kościoła Katolickiego.',
	'compendium.question': 'Pytanie',
	'compendium.answer': 'Odpowiedź',
	'compendium.tableOfContents': 'Spis treści',
	'compendium.prevQuestion': 'Poprzednie pytanie',
	'compendium.nextQuestion': 'Następne pytanie',
	'compendium.condenses': 'Streszcza KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'W Kompendium',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Brak numeru pytania w tym korpusie',
	'nav.summa': 'Suma',
	'doctores.landing.title': 'Doktorzy Kościoła',
	'doctores.landing.tagline': 'Dzieła teologiczne Ojców i Doktorów Kościoła.',
	'summa.landing.title': 'Suma teologiczna',
	'summa.landing.tagline': 'Tomasz z Akwinu, po angielsku i po łacinie, w której pisał.',
	'summa.tableOfContents': 'Spis treści',
	'summa.part': 'Część',
	'summa.question': 'Kwestia',
	'summa.article': 'Artykuł',
	'summa.questionShort': 'Kw.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Tytuł z wydania w języku: {lang}',
	'summa.titlesFromEdition': 'Tytuły z wydania w języku: {lang} — to wydanie ich nie podaje',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Zarzut',
	'summa.sedContra': 'Przeciwnie',
	'summa.corpus': 'Odpowiadam',
	'summa.reply': 'Odpowiedź na zarzut',
	'summa.preamble': 'Uwaga',
	'summa.prevQuestion': 'Poprzednia kwestia',
	'summa.nextQuestion': 'Następna kwestia',
	'summa.noEditionInYourLanguage': 'Suma nie ma wydania w Twoim języku. Pokazana w języku: {lang}.',
	'summa.noLatinSupplement':
		'Suplement istnieje tylko po angielsku — zestawiono go po śmierci Akwinaty.',
	'index.division': 'Podział',
	'index.showSubsections': 'Pokaż podrozdziały',
	'index.hideSubsections': 'Ukryj podrozdziały',
	'prayers.landing.title': 'Modlitwy codzienne',
	'prayers.landing.tagline': 'Modlitwy z tekstem łacińskim obok.',
	'prayers.gloss.versicle':
		'Werset — wers, który prowadzący modlitwę mówi lub śpiewa sam. Zgromadzenie odpowiada na niego następującą dalej odpowiedzią.',
	'prayers.gloss.response':
		'Odpowiedź — wers, który zgromadzenie mówi lub śpiewa razem, odpowiadając na poprzedzający go werset.',
	'prayers.tableOfContents': 'Spis treści',
	'prayers.seeAlso': 'Zobacz także',
	'prayers.prevPrayer': 'Poprzednia modlitwa',
	'prayers.nextPrayer': 'Następna modlitwa',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Dziś',
	'prayers.rosary.todayHeading': 'Tajemnice na dziś',
	'prayers.rosary.openingPrayer': 'Modlitwa początkowa',
	'prayers.rosary.decadePrayers': 'Modlitwy jednej dziesiątki',
	'ref.tooltip.loading': 'Wczytywanie…',
	'ref.tooltip.openCcc': 'Otwórz w Katechizmie',
	'ref.tooltip.openBible': 'Otwórz w Biblii',
	'ref.tooltip.openCompendium': 'Otwórz w Kompendium',
	'ref.preview.open': 'Otwórz',
	'ref.cf': 'por.',
	'anchor.actions': 'Działania na odsyłaczu',
	'anchor.copy': 'Kopiuj tekst',
	'anchor.copyLink': 'Kopiuj odnośnik',
	'anchor.view': 'Pokaż',
	'anchor.copied': 'Skopiowano',
	'anchor.copyFailed': 'Nie udało się skopiować',
	'bookmark.add': 'Zapisz',
	'bookmark.remove': 'Usuń zakładkę',
	'bookmark.library': 'Zakładki',
	'bookmark.library.tagline': 'Wszystko, co zaznaczyłeś podczas czytania.',
	'bookmark.empty': 'Nic jeszcze nie zaznaczono.',
	'bookmark.emptyHint':
		'Kliknij numer wersetu lub akapitu i wybierz Zapisz, albo użyj przycisku zakładki na stronie.',
	'bookmark.about': 'O tych zakładkach',
	'bookmark.deviceOnly':
		'Zakładki są przechowywane tylko w tej przeglądarce. Nie są nigdzie wysyłane, a wyczyszczenie danych przeglądarki je usuwa.',
	'bookmark.unavailable': 'Nie ma tego w wydaniu, które czytasz',
	'document.library.tagline': 'Encykliki, konstytucje soborowe, dekrety i deklaracje Magisterium.',
	'document.filter.heading': 'Filtry',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Rodzaj',
	'document.filter.subject': 'Temat',
	'document.filter.search': 'Szukaj dokumentów',
	'document.filter.clear': 'Wyczyść',
	'document.filter.results': 'Wyświetlone dokumenty',
	'document.filter.noResults': 'Żaden dokument nie odpowiada tym filtrom.',
	'document.tableOfContents': 'Spis treści',
	'document.startReading': 'Zacznij czytać',
	'document.readFullDocument': 'Czytaj cały dokument',
	'document.section': 'Sekcja',
	'document.prevSection': 'Poprzednia',
	'document.nextSection': 'Następna',
	'document.kind.conciliarConstitution': 'Konstytucja',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Deklaracja',
	'document.kind.encyclical': 'Encyklika',
	'document.kind.apostolicExhortation': 'Adhortacja apostolska',
	'document.kind.apostolicConstitution': 'Konstytucja apostolska',
	'document.kind.apostolicLetter': 'List apostolski',
	'document.kind.cdfDeclaration': 'Deklaracja KNW',
	'document.kind.cdfInstruction': 'Instrukcja KNW',
	'document.kind.cdfLetter': 'List KNW',
	'document.kind.cdfDoctrinalNote': 'Nota doktrynalna KNW',
	'document.kind.cdfResponsum': 'Responsum KNW',
	'document.kind.cdfConsiderations': 'Rozważania KNW',
	'document.kindPlural.conciliarConstitution': 'Konstytucje',
	'document.kindPlural.conciliarDecree': 'Dekrety',
	'document.kindPlural.conciliarDeclaration': 'Deklaracje',
	'document.kindPlural.encyclical': 'Encykliki',
	'document.kindPlural.apostolicExhortation': 'Adhortacje apostolskie',
	'document.kindPlural.apostolicConstitution': 'Konstytucje apostolskie',
	'document.kindPlural.apostolicLetter': 'Listy apostolskie',
	'document.kindPlural.cdfDeclaration': 'Deklaracje KNW',
	'citation.unavailable': 'Brak tekstu źródłowego dla tego przypisu.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Czym jest ta strona, skąd pochodzą jej teksty i jakie jest nasze stanowisko wobec ich publikowania.',
	'colophon.whatThisIs': 'Czym to jest',
	'colophon.whatThisIsBody':
		'Glossa Catholica to strona do czytania Pisma Świętego, Katechizmu, Kompendium i dokumentów Magisterium, po angielsku, portugalsku i łacinie. Istnieje po to, by ją czytać, i nic więcej nie jest od Ciebie wymagane:',
	'colophon.pointFree':
		'Bezpłatna i zawsze bezpłatna. Bez opłat, bez abonamentu, bez niczego do kupienia.',
	'colophon.pointNoAds': 'Bez reklam i bez jakiegokolwiek płatnego eksponowania treści.',
	'colophon.pointNoAccounts': 'Bez kont. Nie ma się do czego rejestrować ani logować.',
	'colophon.pointNoTracking':
		'Bez skryptów śledzących, bez kodu osób trzecich, bez ciasteczek. Wyłącznie anonimowe liczniki użycia, nic, co pozwoliłoby Cię zidentyfikować.',
	'colophon.pointOffline':
		'Zbudowana tak, by po odwiedzeniu działała dalej bez połączenia, aby słabe łącze nie było przeszkodą w czytaniu.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica jest prywatną inicjatywą wiernych świeckich. Nie posiada żadnej aprobaty kościelnej i nie przemawia własnym autorytetem.',
	'footer.notEndorsed': 'Bez aprobaty Stolicy Apostolskiej',
	'colophon.textsTitle': 'Teksty',
	'colophon.textsBody':
		'Każdy tekst pochodzi z wskazanego źródła, a każde dzieło odnotowuje swoje wydanie, stronę źródłową i datę pobrania. Pismo Święte korzysta z przekładów w domenie publicznej; Katechizm, Kompendium i dokumenty Magisterium pochodzą z tekstów opublikowanych przez samą Stolicę Apostolską.',
	'colophon.textsFidelity':
		'Tekst nigdy nie jest skracany, nigdy parafrazowany, nigdy przepisywany i nigdy nie sąsiaduje z reklamą. Naprawiamy natomiast oczywiste usterki — zgubione słowo, zniekształcony odsyłacz, znaczniki, które połknęły akapit — zawsze w stronę tego, co drukuje samo źródło, nigdy w stronę tego, co naszym zdaniem powinno tam być.',
	'colophon.countBible': 'wydania Biblii',
	'colophon.countDocuments': 'dokumenty Magisterium',
	'colophon.privacyTitle': 'Prywatność',
	'colophon.privacyBody1':
		'Bez kont, bez ciasteczek, bez reklam i bez kodu osób trzecich. Nic tutaj nie podąża za Tobą poza tę stronę.',
	'colophon.privacyBody2':
		'Liczymy jednak, jak strona jest używana: jeden pomiar na odwiedziny, w którym każde pole jest przedziałem, a nie wartością — jak długo tu byłeś, jak często tu bywasz, które dzieła otworzyłeś. Twój kraj liczony jest osobno, bez łączenia go z resztą. Opisuje to odwiedziny, a nie odwiedzającego, i jest przechowywane przez {days} dni.',
	'colophon.privacyBody3':
		'Nigdy nie wysyłane: to, co wpisujesz w pole wyszukiwania, który fragment miałeś otwarty, ani nic, co mogłoby ponownie rozpoznać Twoje urządzenie. Twoje ustawienia, zakładki i pobrane teksty pozostają na Twoim urządzeniu.',
	'colophon.copyrightTitle': 'Prawa autorskie',
	'colophon.copyrightBody1':
		'Katechizm, Kompendium i dokumenty Magisterium są własnością podmiotów praw autorskich — głównie Libreria Editrice Vaticana i Dykasterii ds. Komunikacji.',
	'colophon.copyrightBody2':
		'Każde dzieło wyświetla notę praw autorskich swojego podmiotu, jego własnymi słowami, i odsyła do strony, z której zostało wzięte.',
	'colophon.copyrightBody3':
		'Jeśli posiadasz prawa do któregokolwiek z tekstów i wolisz, by nie był publikowany, napisz do nas.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'W każdej sprawie, także w powyższej:',
	'colophon.contactPending':
		'Adres kontaktowy nie został jeszcze ustalony. Ta strona nie powinna być publiczna, dopóki go nie ma — powyższe zobowiązanie nic nie znaczy bez sposobu, by się z nami skontaktować.',
	'colophon.illustrationsTitle': 'Ilustracje',
	'colophon.illustrationsBody':
		'Biblia niesie ryciny Gustave’a Doré, każdą przy wersecie, który przedstawia — ostatni i największy z jego cykli biblijnych, rytowany w drewnie według jego rysunków i drukowany wraz z tekstem, a nie zebrany na końcu tomu.',
	'colophon.illustrationsRights':
		'Należą do domeny publicznej, jak pokazują daty poniżej, a wierna fotograficzna reprodukcja ryciny z domeny publicznej nie tworzy nowego prawa autorskiego.',
	'colophon.countPlates': 'ryciny',
	'colophon.countPlateChapters': 'zilustrowane rozdziały',
	'plates.scansBy': 'Skany udostępnione przez',
	'plates.enlarge': 'Powiększ {title}',
	'plates.zoom': 'Powiększenie',
	'art.about': 'O tym obrazie',
	'art.detail': 'fragment',
	'colophon.typeTitle': 'Krój pisma',
	'colophon.typeBody':
		'Złożono krojem EB Garamond, odnowieniem przez Georga Duffnera i Octavia Parda czcionek, które Claude Garamont wyciął w latach dziewięćdziesiątych XVI wieku — tradycji humanistycznej, w której Kościół drukuje od czasów renesansu. Jego cyrylica wyszła spod tych samych rąk, ale niczego nie wskrzesza: cyrylickiego Garamonda nigdy nie wycięto, więc rosyjski składany jest formą narysowaną tak, by stanęła obok reszty.',
	'colophon.typeArabic':
		'Arabski jest całkowicie poza jego zasięgiem i składany jest krojem Amiri — odnowieniem przez Khaleda Hosny’ego naschi wyciętego dla drukarni Bulaq w Kairze w 1905 roku, wybranym z tego samego powodu co krój tekstowy: konkretny historyczny krój książkowy, a nie współczesny rysunek.',
	'colophon.typeInitials':
		'Inicjały to Pirata One, gotyk, którego wersaliki pozostają czytelne w rozmiarze, jakiego wymaga inicjał, oraz — dla rosyjskiego — Ponomar, odtwarzający cerkiewnosłowiański krój Drukarni Synodalnej. Ponomar składa inicjał, nigdy tekst: nowoczesna encyklika złożona w całości krojem synodalnym mówiłaby o sobie nieprawdę. Wszystkie są na licencji SIL Open Font License i serwowane z tej strony, a nie przez osoby trzecie, więc czytanie strony niczego nie wymaga od cudzego serwera.',
	'refs.citedIn': 'Cytowane w',
	'refs.externalVolume': 'Tom {volume} na {host} — skan PDF',
	'bible.wholeChapter': 'Ten rozdział',
	'bible.verseNotInEdition':
		'Tego numeru wersetu nie ma w tym wydaniu — zob. uwagę w źródle strony',
	'bible.verseAbbrev': 'w.',
	'bible.note': 'Przypis',
	'bible.noteMissing': 'Brak tego przypisu w korpusie',
	'bible.chapterArgument': 'Streszczenie',
	'ccc.readFullChapter': 'Czytaj cały rozdział',
	'ccc.noParagraphNumber': 'Brak numeru akapitu w tym korpusie',
	'copyright.sourceTitle': 'Otwórz pierwotną stronę źródłową',
	'copyright.sourceLabel': 'Źródło',
	'lang.label': 'Język',
	'lang.filter': 'Szukaj języków',
	'lang.more': 'więcej języków',
	'notFound.title': 'Pod tym adresem nic nie ma',
	'notFound.lede': 'Strony, o którą prosiłeś, tutaj nie ma.',
	'notFound.body':
		'Odnośnik może być błędnie wpisany lub nieaktualny, albo wskazywać tekst, którego ta strona nie zawiera.',
	'notFound.searchHint':
		'Jeśli znasz szukane miejsce — księgę i rozdział, numer akapitu Katechizmu — wpisz je w pole wyszukiwania na górze tej strony.',
	'notFound.credit': 'Na podstawie British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Albo zacznij od jednego z tych:',
	'notFound.home': 'Strona główna',
	'compare.enter': 'Porównaj wydania',
	'compare.exit': 'Zakończ porównanie',
	'compare.missing': 'Nie występuje w tym wydaniu',
	'compare.versificationNote':
		'Te dwa wydania miejscami inaczej dzielą wersety tego rozdziału (to wariant tekstu, a nie decyzja tłumacza) — ten sam numer wersetu nie zawsze wskazuje to samo zdanie w obu kolumnach.',
	'compare.loading': 'Wczytywanie drugiego języka…',
	'ui.close': 'Zamknij',
	'shortcuts.title': 'Skróty klawiszowe',
	'shortcuts.betweenDocuments': 'Między dokumentami',
	'shortcuts.withinDocument': 'W dokumencie',
	'shortcuts.show': 'Pokaż tę listę',
	'help.title': 'Pomoc',
	'help.reading.heading': 'Pasek nad tekstem',
	'help.feature.search':
		'Wpisz odsyłacz w pole u góry — rozdział i werset, numer punktu, nazwę dokumentu — a uzupełni go w trakcie pisania.',
	'help.feature.offline':
		'Dodaj stronę do ekranu głównego, a otworzy się jak aplikacja. Możesz pobrać całe dzieła i czytać bez połączenia.',
	'help.feature.contents':
		'Podziały dzieła, w którym jesteś — księgi, części, rozdziały — byś mógł poruszać się w nim bez wracania na początek.',
	'help.feature.compare':
		'Dwa wydania tego samego miejsca obok siebie — łacina obok Twojego języka albo jeden przekład obok drugiego.',
	'help.feature.apparatus':
		'Własne przypisy wydania i wszelki komentarz napisany do tekstu są podawane obok niego, a nie pod nim. Cytaty wewnątrz tekstu są odnośnikami, więc odsyłacz prowadzi tam, gdzie wskazuje.',
	'help.feature.focus':
		'Usuwa wszystko poza tekstem. Wyjście zostaje tam, gdzie był pasek, żeby nic nie zostało za nim uwięzione.',
	'zen.enter': 'Tryb skupienia',
	'zen.exit': 'Zakończ tryb skupienia',
	'nav.calendar': 'Kalendarz',
	'calendar.title': 'Kalendarz liturgiczny',
	'calendar.tagline':
		'Ogólny kalendarz rzymski, obliczony na dowolny dzień — jego okres, jego stopień, jego kolor.',
	'calendar.national.tagline': '{name} z własnymi obchodami, obliczony na dowolny dzień.',
	'calendar.calendar': 'Kalendarz',
	'calendar.which.general': 'Ogólny kalendarz rzymski',
	'calendar.filter': 'Szukaj krajów',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Ameryki',
	'calendar.region.africa': 'Afryka',
	'calendar.region.middleEast': 'Bliski Wschód',
	'calendar.region.asia': 'Azja',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Dziś',
	'calendar.previousMonth': 'Poprzedni miesiąc',
	'calendar.nextMonth': 'Następny miesiąc',
	'calendar.plainDays': 'Same dni powszednie',
	'calendar.noSuchDay': 'Dla tej daty nie jest obliczany żaden dzień liturgiczny.',
	'calendar.week': 'tydzień',
	'calendar.alsoToday': 'Dziś obchodzi się także',
	'calendar.alsoObserved': 'Dziś przypada także',
	'calendar.obligation': 'Święto nakazane',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Cykl niedzielny',
	'calendar.weekdayCycle': 'Cykl na dni powszednie',
	'calendar.psalterWeek': 'Tydzień psałterza',
	'lectionary.heading': 'Czytania mszalne',
	'lectionary.slot.reading': 'Czytanie',
	'lectionary.slot.reading1': 'Pierwsze czytanie',
	'lectionary.slot.reading2': 'Drugie czytanie',
	'lectionary.slot.reading3': 'Trzecie czytanie',
	'lectionary.slot.reading4': 'Czwarte czytanie',
	'lectionary.slot.reading5': 'Piąte czytanie',
	'lectionary.slot.reading6': 'Szóste czytanie',
	'lectionary.slot.reading7': 'Siódme czytanie',
	'lectionary.slot.psalm': 'Psalm responsoryjny',
	'lectionary.slot.epistle': 'Epistoła',
	'lectionary.slot.acclamation': 'Aklamacja przed Ewangelią',
	'lectionary.slot.gospel': 'Ewangelia',
	'lectionary.slot.sequence': 'Sekwencja',
	'lectionary.or': 'lub',
	'lectionary.cf': 'Por.',
	'lectionary.about': 'O tych czytaniach',
	'lectionary.caveat':
		'Fragmenty wyznaczone przez Ordo Lectionum Missae, powiązane z własnymi wydaniami tej strony — nie z przekładem czytanym w konkretnym kościele, a konferencja episkopatu może dostosować ten porządek.',
	'calendar.transferredFrom': 'Przeniesione z',
	'calendar.season.advent': 'Adwent',
	'calendar.season.christmas': 'Okres Bożego Narodzenia',
	'calendar.season.lent': 'Wielki Post',
	'calendar.season.triduum': 'Triduum Paschalne',
	'calendar.season.easter': 'Okres Wielkanocny',
	'calendar.season.ordinary': 'Okres Zwykły',
	'calendar.colour.white': 'Biały',
	'calendar.colour.red': 'Czerwony',
	'calendar.colour.green': 'Zielony',
	'calendar.colour.violet': 'Fioletowy',
	'calendar.colour.rose': 'Różowy',
	'calendar.colour.black': 'Czarny',
	'calendar.colour.blue': 'Błękitny',
	'calendar.rank.solemnity': 'Uroczystość',
	'calendar.rank.feast': 'Święto',
	'calendar.rank.memorial': 'Wspomnienie obowiązkowe',
	'calendar.rank.optional-memorial': 'Wspomnienie dowolne',
	'calendar.rank.commemoration': 'Komemoracja',
	'calendar.rank.sunday': 'Niedziela',
	'calendar.rank.weekday': 'Dzień powszedni',
	'calendar.gloss.season.advent':
		'Cztery tygodnie przed Bożym Narodzeniem: przygotowanie na przyjście Pana i początek roku Kościoła.',
	'calendar.gloss.season.christmas':
		'Od Bożego Narodzenia do Chrztu Pańskiego, w obchodzie narodzenia Pana i Jego objawienia się światu.',
	'calendar.gloss.season.lent':
		'Czterdzieści dni od Środy Popielcowej do Mszy Wieczerzy Pańskiej: pokuta, jałmużna i przygotowanie do Wielkanocy.',
	'calendar.gloss.season.triduum':
		'Trzy dni od wieczoru Wielkiego Czwartku do wieczoru Niedzieli Wielkanocnej — męka, śmierć i zmartwychwstanie Pana, szczyt całego roku.',
	'calendar.gloss.season.easter':
		'Pięćdziesiąt dni od Wielkanocy do Zesłania Ducha Świętego, obchodzonych jako jedno święto — „jedna wielka niedziela”.',
	'calendar.gloss.season.ordinary':
		'Trzydzieści trzy albo trzydzieści cztery tygodnie poza pozostałymi okresami. Nie „zwyczajny” w sensie byle jaki, lecz uporządkowany: tygodnie są policzone, a Kościół czyta po kolei życie i naukę Pana. Przychodzi w dwóch odcinkach — po okresie Narodzenia aż do Wielkiego Postu, i po Zesłaniu Ducha Świętego aż do Adwentu.',
	'calendar.gloss.rank.solemnity':
		'Najwyższy stopień: Wielkanoc, Boże Narodzenie, Wniebowstąpienie, patron miejsca. Obchodzona z Chwała i Wierzę, i zaczyna się poprzedniego wieczoru.',
	'calendar.gloss.rank.feast':
		'Obchodzone w obrębie samego dnia. Apostołowie i ewangeliści oraz większe dni Pańskie i maryjne.',
	'calendar.gloss.rank.memorial':
		'Święty wspominany w swoim dniu, wewnątrz Mszy i Oficjum danego okresu. Obowiązkowe tam, gdzie jest obchodzone.',
	'calendar.gloss.rank.optional-memorial':
		'Można je obchodzić albo nie, wedle wyboru kapłana lub wspólnoty. Nieobchodzone, dzień jest po prostu dniem powszednim.',
	'calendar.gloss.rank.commemoration':
		'To, czym staje się wspomnienie w Wielkim Poście: modlitwa dodana do Mszy dnia powszedniego, którą okres poza tym zachowuje w całości.',
	'calendar.gloss.rank.sunday':
		'Pierwotne święto — Dzień Pański, obchodzony co tydzień od zmartwychwstania. Tylko uroczystość albo święto Pańskie może go ustąpić, a w Adwencie, Wielkim Poście i okresie wielkanocnym nawet one nie.',
	'calendar.gloss.rank.weekday':
		'Dzień bez własnego obchodu. Msza i Oficjum są te z okresu — i to właśnie czyni okres rzeczą wartą poznania.',
	'calendar.gloss.colour.white':
		'Radość. Okres wielkanocny i Narodzenia, dni Pańskie poza Jego męką, Matka Boża, aniołowie i święci, którzy nie byli męczennikami.',
	'calendar.gloss.colour.red':
		'Krew i ogień. Niedziela Palmowa i Wielki Piątek, Zesłanie Ducha Świętego, apostołowie i ewangeliści oraz męczennicy.',
	'calendar.gloss.colour.green': 'Okres zwykły: barwa nadziei i tego, co rośnie.',
	'calendar.gloss.colour.violet': 'Adwent i Wielki Post, a także we Mszach za zmarłych.',
	'calendar.gloss.colour.rose':
		'Używana dwa razy w roku — w niedzielę Gaudete, trzecią Adwentu, i w niedzielę Laetare, czwartą Wielkiego Postu — gdy post się rozjaśnia, a koniec jest już blisko.',
	'calendar.gloss.colour.black': 'Może być używana we Mszach za zmarłych.',
	'calendar.gloss.colour.blue':
		'Przywilej błękitu: używany w uroczystość Niepokalanego Poczęcia w Hiszpanii, na Filipinach i w nielicznych innych miejscach, którym Stolica Apostolska go udzieliła.',
	'calendar.gloss.sundayCycle':
		'Czytania niedzielne biegną przez trzy lata — A, B i C — czytając kolejno Mateusza, Marka i Łukasza, a Jana w Wielkim Poście i okresie wielkanocnym. Cykl zmienia się w pierwszą niedzielę Adwentu, wraz z rokiem Kościoła.',
	'calendar.gloss.weekdayCycle':
		'Czytania dni powszednich biegną przez dwa lata, I i II: pierwsze czytanie się zmienia, Ewangelia nie. Rok liturgiczny bierze nazwę od roku kalendarzowego, w którym się kończy — lata nieparzyste to I, parzyste II.',
	'calendar.gloss.psalterWeek':
		'Liturgia godzin rozkłada psalmy na cztery tygodnie, od I do IV, powtarzające się przez rok. To jest tydzień, którego psalmy przypadają na dziś, dla każdego, kto odmawia godziny.',
	'calendar.gloss.obligation':
		'Dzień, w którym wierni są zobowiązani uczestniczyć we Mszy i powstrzymać się od prac, które by im to uniemożliwiły. Każda niedziela oraz pozostałe dni, które wyznaczyła dana konferencja biskupów.',
	'calendar.primer.title': 'Pierwszy raz tutaj?',
	'calendar.primer.lead':
		'Kościół zachowuje własny rok. Zaczyna się Adwentem, obraca się wokół Wielkanocy i daje każdemu dniowi nazwę, stopień i barwę — a te rozstrzygają, co danego dnia modli się i czyta we Mszy i w Liturgii godzin. Tak więc „dwudziesta trzecia niedziela okresu zwykłego” jest adresem: mówi kapłanowi, scholi albo każdemu modlącemu się w domu, które modlitwy i czytania należą do dzisiaj.',
	'calendar.primer.seasons': 'Okresy',
	'calendar.primer.ranks': 'Czym może być dzień',
	'calendar.primer.colours': 'Barwy',
	'calendar.primer.cycles': 'Cykle',
	'calendar.primer.cyclesLead':
		'Trzy liczniki, które razem mówią, jakie czytania i psalmy przypadają na dziś.'
};
