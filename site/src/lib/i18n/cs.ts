/**
 * Čeština UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 17 editions in Čeština and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `site/docs/colophon.md`. IT HAS NOT BEEN READ BY A NATIVE SPEAKER.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive. Deleting a
 * doubtful line is a valid fix -- it falls back to English.
 * Every key `CHROME_KEYS` requires is here, since an unnamed chrome page fails
 * the sync rather than falling back.
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

export const cs: Dictionary = {
	'nav.bible': 'Bible',
	'nav.ccc': 'Katechismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Učitelský úřad',
	'nav.socialDoctrine': 'Sociální nauka',
	'socialDoctrine.landing.title': 'Kompendium sociální nauky církve',
	'socialDoctrine.landing.tagline': 'Co církev učí o životě ve společnosti, v 583 číslech.',
	'nav.canonLaw': 'Kanonické právo',
	'canonLaw.landing.title': 'Kodex kanonického práva',
	'canonLaw.landing.tagline': 'Právo latinské církve v 1752 kánonech v sedmi knihách.',
	'canonLaw.canon': 'Kán.',
	'canonLaw.canons': 'Kán.',
	'canonLaw.prevCanon': 'Předchozí kánon',
	'canonLaw.nextCanon': 'Následující kánon',
	'canonLaw.readFullTitle': 'Číst celý titul',
	'canonLaw.superseded': 'Znění nahrazené',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Nabídka',
	'nav.sections': 'Sekce',
	'nav.works': 'Díla',
	'nav.pages': 'Stránky',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Pokračovat ve čtení',
	'home.tagline':
		'Čtenářský web pro Písmo, Katechismus a dokumenty magisteria — zdarma, i bez připojení, a bez jakékoli registrace.',
	'home.doors.heading': 'Kam jít',
	'home.find.heading': 'Nebo napište odkaz',
	'nav.library': 'Knihovna',
	'nav.learn': 'Učení',
	'library.landing.tagline':
		'Celý korpus, polici po polici — s tím, kde jste přestali, a s tím, co jste si označili.',
	'schola.landing.title': 'Kde začít',
	'schola.landing.tagline':
		'Krátký průvodce tím, co je zde: co je každá z těchto knih, jak se zapisuje odkaz na ni, jak najít místo, a pořádky čtení, které církev navrhla.',
	'schola.start.heading': 'Nový v katolictví?',
	'schola.start.body': 'Nejlepší začátek je ',
	'schola.start.bodyAfter':
		': totéž učení jako v Katechismu, mnohem kratší, psané v otázkách a odpovědích. Má asi desetinu rozsahu a nic nepředpokládá.',
	'schola.bible.heading': 'Nikdy jste nečetli Bibli?',
	'schola.bible.library':
		'Není to jedna kniha, nýbrž sedmdesát tři, psané po více než tisíc let a svázané v pořádku, na němž se církev ustálila — ne v pořádku, v němž se věci staly, a ne v tom, který se čte nejsnáze. Většina lidí začne na první stránce a po několika týdnech přestane, v dlouhé kapitole starobylého zákona, protože jim ještě nikdo neřekl, k čemu to je.',
	'schola.bible.step.gospel': 'Začněte evangeliem',
	'schola.bible.start':
		'Jedna ze čtyř krátkých knih o Ježíšově životě, hluboko uvnitř a ne vpředu. Není to náš nápad: koncil církve žádal, aby se učilo správnému užívání Písma, „zvláště Nového zákona a především evangelií“. Žádné z nich nejmenoval zvlášť, a nejmenujeme ani my.',
	'schola.bible.whichGospel':
		'Tři se obvykle navrhují, ze tří různých důvodů. Kterékoli z nich je dobré místo, kde být.',
	'schola.bible.gospel.mark':
		'Nejkratší. Můžete je přečíst celé za jedno odpoledne, a mít jedno dočtené má na začátku větší cenu než mít vybrané to nejlepší.',
	'schola.bible.gospel.luke':
		'Napsané pro někoho mimo víru, kdo chtěl mít věc sepsanou po pořádku — což můžete být právě vy. Pokračuje přímo do Skutků apoštolů, takže je vlastně první polovinou delší knihy.',
	'schola.bible.gospel.john':
		'To, které rovnou říká, proč bylo napsáno: „abyste uvěřili“. Prostá slova, a jde přímo k otázce, kdo je Ježíš.',
	'schola.bible.step.acts': 'Pak co bylo dál',
	'schola.bible.thenActs':
		'Až jedno dočtete, přečtěte si, co po jeho odchodu udělali ti, kdo ho znali.',
	'schola.bible.acts.why':
		'Třicet let po konci evangelií: pár desítek vyděšených lidí, a jak to, co viděli, dorazilo na druhý konec říše.',
	'schola.bible.step.old': 'Pak starší polovina',
	'schola.bible.thenOld':
		'Ne od první stránky, a ne celá. Několik míst nese vyprávění, a jsou to právě ta, k nimž se evangelia stále vracejí.',
	'schola.bible.ot.beginnings': 'Jak to začíná a jak se to kazí.',
	'schola.bible.ot.promise': 'Jedna rodina a příslib jí daný, který přežije všechny v ní.',
	'schola.bible.ot.exodus': 'Lid vyvedený z otroctví a zákon, který dostal, aby podle něj žil.',
	'schola.bible.ot.psalms':
		'Ne vyprávění: sto padesát modliteb a písní. Čtěte po jedné, v libovolném pořadí. Církev se je dodnes modlí každý den.',
	'schola.bible.bothWays':
		'Budete poznávat věci, a o to jde, není to náhoda. Církev čte starší knihy ve světle Kristově a novější ve světle toho, co bylo předtím — každá polovina vysvětluje druhou, a proto se žádná nečte sama.',
	'schola.books.heading': 'Co je zde a jak se to označuje',
	'schola.books.lede':
		'Každá z těchto knih je jiného druhu a na každou se odkazuje vlastním číslem. Příklady ukazují tvar: napište podobný do vyhledávacího pole a dostanete se na místo.',
	'schola.cite.label': 'Označuje se',
	'schola.what.scripture':
		'Písmo, jak je církev přijímá, v obou Zákonech. Všechno ostatní zde se čte v jeho světle.',
	'schola.cite.scripture': 'kniha, kapitola a verš, ve zkratkách, které tiskne vaše vydání',
	'schola.what.catechism':
		'Shrnutí toho, čemu katolická církev věří, v jednom svazku. Sám není pramenem: shromažďuje Písmo, otce, liturgii a učení církve, a každý odstavec říká, odkud pochází to, co tvrdí.',
	'schola.cite.catechism':
		'podle čísla odstavce, běžícího bez přerušení od první stránky k poslední',
	'schola.what.compendium':
		'Totéž učení podané v otázkách a odpovědích, asi v desetinovém rozsahu.',
	'schola.cite.compendium': 'podle čísla otázky',
	'schola.what.magisterium':
		'To, co papežové a koncily skutečně napsali — encykliky, konstituce, dekrety, deklarace — každý dokument obrácený k určité chvíli a určité otázce. Každý je znám podle svých úvodních latinských slov.',
	'schola.cite.magisterium': 'podle názvu dokumentu, pak čísla oddílu v něm',
	'schola.what.social':
		'Učení církve o práci, vlastnictví, rodině, politice a míru, shromážděné z těch dokumentů do jedné knihy.',
	'schola.cite.social': 'podle čísla odstavce, pod zkratkou, kterou dílo užívá samo pro sebe',
	'schola.what.law': 'Právo, ne nauka. Říká, co církev vyžaduje, a bývá měněno.',
	'schola.cite.law': 'podle kánonu, tak se jmenují jeho číslované jednotky',
	'schola.what.doctors':
		'Teologové, které církev prohlásila za učitele. Nenese to žádnou úřední autoritu, jakkoli velký je jeho autor.',
	'schola.cite.doctors': 'podle části, pak otázky — vlastního členění Sumy',
	'schola.what.prayers': 'Slova, jimiž se církev modlí, s latinou vedle.',
	'schola.cite.prayers': 'podle názvu; není co citovat čísly',
	'schola.places.heading': 'Ne texty, nýbrž místa na tomto webu',
	'schola.what.library':
		'Všechna díla webu v jednom seznamu, seskupená podle předmětu, ne podle druhu.',
	'schola.what.calendar':
		'Liturgický den — období, barva a kdo se slaví — pro zemi, jejímž kalendářem se řídíte.',
	'schola.what.bookmarks':
		'Místa, která jste si označili, a kde jste naposledy skončili v každém díle. Obojí zůstává v tomto prohlížeči a nikam se neodesílá.',
	'ccc.noCounterpart': 'Nemá protějšek v druhém díle',
	'jumpbox.placeholder': 'Přejít na… (např. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Hledat',
	'jumpbox.hint': 'Stiskněte / nebo Ctrl+K pro přechod na odkaz',
	'jumpbox.noMatch': 'Nic nenalezeno',
	'jumpbox.suggestions': 'Návrhy',
	'settings.label': 'Nastavení',
	'apparatus.label': 'Aparát',
	'apparatus.editionNotes': 'Poznámky tohoto vydání',
	'apparatus.commentary': 'Komentář',
	'apparatus.inCommentary': 'Obsaženo ve výše uvedeném komentáři.',
	'darkMode.label': 'Tmavý režim',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Zapnuto',
	'darkMode.off': 'Vypnuto',
	'sepia.label': 'Sépie',
	'sepia.lightOnly': 'Jen ve světlém režimu',
	'sepia.noHue': 'Ne v odstínech šedi',
	'oled.label': 'OLED černá',
	'oled.darkOnly': 'Jen v tmavém režimu',
	'mono.label': 'Odstíny šedi',
	'mono.hint':
		'Nastaví celou stránku do jedné šedé barvy, takže nic není rozlišeno barvou. Sépie se při zapnutí vypne.',
	'advanced.label': 'Pokročilé',
	'library.title': 'Offline knihovna',
	'library.lede': 'Texty uložené v tomto zařízení se otevřou zcela bez připojení.',
	'library.essentials': 'Modlitby a Kompendium',
	'library.illustrations': 'Bible (ilustrace)',
	'library.illustrationsDetail': 'Bible (ilustrace, vysoké rozlišení)',
	'library.other': 'Ostatní texty',
	'library.everything': 'Vše',
	'library.downloadAll': 'Stáhnout vše',
	'library.download': 'Stáhnout',
	'library.downloaded': 'V tomto zařízení',
	'library.offlineNote': 'Chcete-li něco stáhnout, vypněte offline režim.',
	'library.remove': 'Odebrat z tohoto zařízení',
	'library.removeConfirm': 'Odebrat?',
	'library.forget': 'Odebrat stažené',
	'library.forgetConfirm': 'Odebrat vše?',
	'offline.label': 'Offline režim',
	'offline.hint':
		'Vůbec nevyužívá síť: nic se nestahuje, nekontrolují se aktualizace a nic se neměří. Otevřou se jen texty, které už jsou v tomto zařízení.',
	'offline.notDownloaded': 'Není v tomto zařízení',
	'loadFailed.title': 'To se nenačetlo',
	'loadFailed.hint':
		'Stránka existuje — něco se pokazilo při jejím načítání. Další pokus obvykle pomůže.',
	'loadFailed.retry': 'Zkusit znovu',
	'loadFailed.retrying': 'Zkouší se…',
	'offline.turnOff': 'Vypnout offline režim',
	'type.label': 'Velikost textu a písmo',
	'fontSize.label': 'Velikost textu',
	'fontSize.larger': 'Větší text',
	'fontSize.smaller': 'Menší text',
	'fontSize.reset': 'Výchozí velikost textu',
	'face.label': 'Písmo',
	'face.serif': 'Patkové',
	'face.sans': 'Bezpatkové',
	'print.label': 'Vytisknout tuto stránku',
	'toTop.label': 'Zpět nahoru',
	'install.label': 'Nainstalovat Glossu',
	'install.hint.label': 'Přidat na plochu',
	'install.hint.title': 'Přidejte Glossu na domovskou obrazovku',
	'install.hint.stepBefore': 'Otevře se jako aplikace a čte se i offline. Klepněte na',
	'install.hint.stepAfter': 'a pak na „Přidat na plochu“.',
	'install.hint.dismiss': 'Zavřít',
	'update.label': 'Je dostupné nové vydání',
	'update.title': 'Nové vydání je připraveno',
	'update.body': 'Načtěte stránku znovu, chcete-li získat nejnovější texty a opravy.',
	'update.action': 'Načíst znovu',
	'update.dismiss': 'Teď ne',
	'edition.label': 'Vydání',
	'edition.select': 'Zvolit vydání',
	'edition.current': 'Současné vydání',
	'edition.filter': 'Hledat vydání',
	'menu.noMatches': 'Žádné výsledky',
	'unitNav.previous': 'Předchozí',
	'unitNav.next': 'Další',
	'bible.prevChapter': 'Předchozí kapitola',
	'bible.nextChapter': 'Následující kapitola',
	'bible.pickBook': 'Knihy a kapitoly',
	'bible.landing.title': 'Bible',
	'bible.landing.tagline': 'Čtěte celou Bibli, knihu po knize, kapitolu po kapitole.',
	'bible.landing.random': 'Mám štěstí',
	'bible.landing.books': 'Knihy',
	'bible.chapterUnavailable': 'V tomto vydání není k dispozici',
	'bible.introduction': 'Úvod',
	'bible.introUnavailable': 'V tomto jazyce zatím není úvod',
	'bible.introSource': 'Úvody nejsou součástí biblického textu.',
	'bible.testament.ot': 'Starý zákon',
	'bible.testament.nt': 'Nový zákon',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Dějepisné knihy',
	'bible.group.wisdom': 'Mudroslovné knihy',
	'bible.group.prophetic': 'Prorocké knihy',
	'bible.group.gospels': 'Evangelia',
	'bible.group.acts': 'Skutky apoštolů',
	'bible.group.pauline': 'Pavlovy listy',
	'bible.group.catholicLetters': 'Katolické listy',
	'bible.group.revelation': 'Zjevení',
	'ccc.prevParagraph': 'Předchozí odstavec',
	'ccc.nextParagraph': 'Následující odstavec',
	'ccc.inBrief': 'Shrnutí',
	'ccc.landing.title': 'Katechismus katolické církve',
	'ccc.landing.pairTitle': 'Katechismus a Kompendium',
	'ccc.landing.tagline':
		'<strong>Katechismus</strong> vykládá katolickou nauku ve 2 865 číslovaných odstavcích. <strong>Kompendium</strong> tutéž nauku podává jako 598 otázek a odpovědí podle téhož uspořádání.',
	'ccc.landing.pairTagline':
		'Katechismus katolické církve ve 2 865 číslech a jeho Kompendium v 598 otázkách.',
	'ccc.tableOfContents': 'Obsah',
	'ccc.related': 'Viz také',
	'compendium.landing.title': 'Kompendium Katechismu',
	'compendium.landing.tagline': 'Otázky a odpovědi shrnující Katechismus katolické církve.',
	'compendium.question': 'Otázka',
	'compendium.answer': 'Odpověď',
	'compendium.tableOfContents': 'Obsah',
	'compendium.prevQuestion': 'Předchozí otázka',
	'compendium.nextQuestion': 'Následující otázka',
	'compendium.condenses': 'Shrnuje KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'ccc.condensedIn': 'V Kompendiu',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'V tomto korpusu chybí číslo otázky',
	'document.library.tagline':
		'Encykliky, koncilní konstituce, dekrety a deklarace učitelského úřadu církve.',
	'document.filter.heading': 'Filtr',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Typ',
	'document.filter.subject': 'Téma',
	'document.filter.search': 'Hledat dokumenty',
	'document.filter.clear': 'Vymazat',
	'document.filter.results': 'Zobrazené dokumenty',
	'document.filter.noResults': 'Těmto filtrům neodpovídá žádný dokument.',
	'document.tableOfContents': 'Obsah',
	'document.startReading': 'Začít číst',
	'document.readFullDocument': 'Číst celý dokument',
	'document.section': 'Oddíl',
	'document.prevSection': 'Předchozí',
	'document.nextSection': 'Další',
	'document.kind.conciliarConstitution': 'Konstituce',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Deklarace',
	'document.kind.encyclical': 'Encyklika',
	'document.kind.apostolicExhortation': 'Apoštolská exhortace',
	'document.kind.apostolicConstitution': 'Apoštolská konstituce',
	'document.kind.cdfDeclaration': 'Deklarace Kongregace pro nauku víry',
	'document.kind.cdfInstruction': 'Instrukce Kongregace pro nauku víry',
	'document.kind.cdfLetter': 'List Kongregace pro nauku víry',
	'document.kind.cdfDoctrinalNote': 'Doktrinální nota Kongregace pro nauku víry',
	'document.kind.cdfResponsum': 'Responsum Kongregace pro nauku víry',
	'document.kind.cdfConsiderations': 'Úvahy Kongregace pro nauku víry',
	'document.kindPlural.conciliarConstitution': 'Konstituce',
	'document.kindPlural.conciliarDecree': 'Dekrety',
	'document.kindPlural.conciliarDeclaration': 'Deklarace',
	'document.kindPlural.encyclical': 'Encykliky',
	'document.kindPlural.apostolicExhortation': 'Apoštolské exhortace',
	'document.kindPlural.apostolicConstitution': 'Apoštolské konstituce',
	'document.kindPlural.cdfDeclaration': 'Deklarace Kongregace pro nauku víry',
	'citation.unavailable': 'Pro tuto poznámku není k dispozici zdrojový text.',
	'doctores.landing.title': 'Učitelé církve',
	'doctores.landing.tagline': 'Teologická díla církevních otců a učitelů církve.',
	'summa.landing.title': 'Teologická summa',
	'summa.landing.tagline': 'Tomáš Akvinský, anglicky a v latině, kterou psal.',
	'summa.tableOfContents': 'Obsah',
	'summa.part': 'Část',
	'summa.question': 'Otázka',
	'summa.article': 'Článek',
	'summa.questionShort': 'Ot.',
	'summa.articleShort': 'Čl.',
	'summa.titleFromEdition': 'Název z vydání {lang}',
	'summa.titlesFromEdition': 'Názvy z vydání {lang} — toto vydání žádné netiskne',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Námitka',
	'summa.sedContra': 'Naproti tomu',
	'summa.corpus': 'Odpovídám',
	'summa.reply': 'Odpověď na námitku',
	'summa.preamble': 'Poznámka',
	'summa.prevQuestion': 'Předchozí otázka',
	'summa.nextQuestion': 'Následující otázka',
	'summa.noEditionInYourLanguage': 'Summa nemá vydání ve vašem jazyce. Zobrazeno v jazyce {lang}.',
	'summa.noLatinSupplement':
		'Suplement existuje jen v angličtině — byl sestaven až po Akvinského smrti.',
	'index.division': 'Oddíl',
	'index.showSubsections': 'Zobrazit pododdíly',
	'index.hideSubsections': 'Skrýt pododdíly',
	'prayers.landing.title': 'Běžné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textem vedle.',
	'prayers.tableOfContents': 'Obsah',
	'prayers.gloss.versicle':
		'Verš — řádek, který sám říká nebo zpívá ten, kdo modlitbu vede. Shromáždění mu odpovídá odpovědí, jež následuje.',
	'prayers.gloss.response':
		'Odpověď — řádek, který shromáždění říká nebo zpívá společně jako odpověď na předcházející verš.',
	'prayers.seeAlso': 'Viz také',
	'prayers.prevPrayer': 'Předchozí modlitba',
	'prayers.nextPrayer': 'Následující modlitba',
	'prayers.rosary.today': 'Dnes',
	'prayers.rosary.todayHeading': 'Dnešní tajemství',
	'prayers.rosary.openingPrayer': 'Úvodní modlitba',
	'prayers.rosary.decadePrayers': 'Modlitby desátku',
	'ref.tooltip.loading': 'Načítání…',
	'ref.tooltip.openCcc': 'Otevřít v Katechismu',
	'ref.tooltip.openBible': 'Otevřít v Bibli',
	'ref.tooltip.openCompendium': 'Otevřít v Kompendiu',
	'ref.preview.open': 'Otevřít',
	'ref.cf': 'srov.',
	'anchor.actions': 'Akce k odkazu',
	'anchor.copy': 'Kopírovat text',
	'anchor.copyLink': 'Kopírovat odkaz',
	'anchor.view': 'Zobrazit',
	'anchor.copied': 'Zkopírováno',
	'anchor.copyFailed': 'Nepodařilo se zkopírovat',
	'bookmark.add': 'Přidat záložku',
	'bookmark.remove': 'Odebrat záložku',
	'bookmark.library': 'Záložky',
	'bookmark.library.tagline': 'Vše, co jste si při čtení označili.',
	'bookmark.empty': 'Zatím nic označeno.',
	'bookmark.emptyHint':
		'Klikněte na číslo verše nebo odstavce a zvolte Přidat záložku, nebo použijte tlačítko záložky na stránce.',
	'bookmark.about': 'O těchto záložkách',
	'bookmark.deviceOnly':
		'Záložky zůstávají jen v tomto prohlížeči. Nikam se neodesílají a vymazání dat prohlížeče je odstraní.',
	'bookmark.unavailable': 'Není ve vydání, které čtete',
	'colophon.title': 'Tiráž',
	'colophon.lede':
		'Co je tento web, odkud pocházejí jeho texty a jaký je náš postoj k jejich reprodukci.',
	'colophon.whatThisIs': 'Co to je',
	'colophon.whatThisIsBody':
		'Glossa Catholica je čtenářský web pro Písmo, Katechismus, Kompendium a dokumenty magisteria, v angličtině, portugalštině a latině. Existuje proto, aby byl čten, a k jeho čtení se od vás nežádá nic jiného:',
	'colophon.pointFree': 'Zdarma, a vždy zdarma. Žádná placená zeď, žádné předplatné, nic ke koupi.',
	'colophon.pointNoAds': 'Žádná reklama a žádné sponzorované umístění jakéhokoli druhu.',
	'colophon.pointNoAccounts': 'Žádné účty. Není se kam registrovat, není se kam přihlašovat.',
	'colophon.pointNoTracking':
		'Žádné sledovací skripty, žádný kód třetích stran, žádné cookies. Pouze anonymní počty použití, bez čehokoli, co by vás identifikovalo.',
	'colophon.pointOffline':
		'Vytvořeno tak, aby po první návštěvě fungovalo i bez připojení, aby špatné spojení nemuselo být překážkou ve čtení.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica je soukromá iniciativa laických věřících. Nemá žádné církevní schválení a nemluví s žádnou vlastní autoritou.',
	'footer.notEndorsed': 'Neschváleno Svatým stolcem',
	'colophon.textsTitle': 'Texty',
	'colophon.textsBody':
		'Každý text pochází z uvedeného zdroje a každé dílo zaznamenává své vydání, svou zdrojovou stránku a datum, kdy byl získán. Písmo užívá překlady ve veřejném vlastnictví; Katechismus, Kompendium a dokumenty magisteria pocházejí z vlastních publikovaných textů Svatého stolce.',
	'colophon.textsFidelity':
		'Text není nikdy zkracován, nikdy parafrázován, nikdy přepisován a nikdy umisťován vedle reklamy. Zjevné vady opravujeme — vypadlé slovo, poškozenou citaci, značkování, které pohltilo odstavec — vždy směrem k tomu, co tiskne sám zdroj, nikdy směrem k tomu, co si myslíme, že by měl říkat.',
	'colophon.countBible': 'vydání Bible',
	'colophon.countDocuments': 'dokumentů magisteria',
	'colophon.privacyTitle': 'Ochrana soukromí',
	'colophon.privacyBody1':
		'Žádné účty, žádné cookies, žádná reklama, žádný kód třetích stran. Nic odsud vás nesleduje mimo tento web.',
	'colophon.privacyBody2':
		'Počítáme, jak je web používán: jedno měření na návštěvu, každé pole je rozsah, nikoli přesná hodnota — jak dlouho jste zůstali, jak často jste tu byli, která díla jste otevřeli. Vaše země se počítá zvlášť, aniž by cokoli spojovalo tento údaj se zbytkem. Popisuje to návštěvu, ne návštěvníka, a uchovává se to {days} dní.',
	'colophon.privacyBody3':
		'Nikdy se neodesílá: co píšete do vyhledávacího pole, jaké místo jste měli otevřené, ani nic, co by mohlo znovu rozpoznat vaše zařízení. Vaše nastavení, záložky a stažené texty zůstávají ve vašem zařízení.',
	'colophon.copyrightTitle': 'Autorská práva',
	'colophon.copyrightBody1':
		'Katechismus, Kompendium a dokumenty magisteria jsou majetkem svých držitelů práv — především Libreria Editrice Vaticana a Dikasteria pro komunikaci.',
	'colophon.copyrightBody2':
		'Každé dílo zobrazuje vlastní výhradu autorských práv svého držitele, v jeho znění, a odkazuje na stránku, z níž bylo převzato.',
	'colophon.copyrightBody3':
		'Držíte-li práva k jakémukoli zdejšímu textu a byli byste raději, aby zveřejněn nebyl, napište nám.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Pro cokoli, včetně výše uvedeného:',
	'colophon.contactPending':
		'Kontaktní adresa dosud nebyla nastavena. Tento web by neměl být zveřejněn, dokud ji nemá — závazek výše nemá smysl bez způsobu, jak nás zastihnout.',
	'colophon.illustrationsTitle': 'Ilustrace',
	'colophon.illustrationsBody':
		'Bible nese rytiny Gustava Dorého, každou umístěnou u verše, který zobrazuje — poslední a největší z jeho biblických cyklů, řezanou do dřeva podle jeho kreseb a tištěnou spolu s textem, nikoli shromážděnou vzadu.',
	'colophon.illustrationsRights':
		'Jsou ve veřejném vlastnictví, jak ukazují data níže, a věrná fotografická reprodukce rytiny ve veřejném vlastnictví nenese žádné nové vlastní autorské právo.',
	'colophon.countPlates': 'rytin',
	'colophon.countPlateChapters': 'ilustrovaných kapitol',
	'plates.scansBy': 'Skeny poskytl',
	'plates.enlarge': 'Zvětšit {title}',
	'plates.zoom': 'Přiblížit',
	'art.about': 'O tomto obrázku',
	'art.detail': 'výřez',
	'colophon.typeTitle': 'Písmo',
	'colophon.typeBody':
		'Sázeno písmem EB Garamond, obnovou Georga Duffnera a Octavia Parda typů, které Claude Garamont řezal v 90. letech 16. století — humanistické tradice, v níž Církev tiskne od renesance. Jeho cyrilice je od týchž rukou, ale neobnovuje nic: žádná garamondovská cyrilice nebyla nikdy řezána, takže ruština je sázena tvarem nakresleným tak, aby stál vedle ostatních.',
	'colophon.typeArabic':
		'Arabština je zcela mimo jeho dosah a je sázena písmem Amiri — obnovou Khaleda Hosnyho naschí řezaného pro tiskárnu Búláq v Káhiře roku 1905, zvolenou ze stejné úvahy jako textové písmo: konkrétní historické knižní písmo spíše než současná kresba.',
	'colophon.typeInitials':
		'Úvodní iniciály jsou Pirata One, lomené písmo, jehož verzálky zůstávají čitelné ve velikosti, kterou iniciála vyžaduje, a — pro ruštinu — Ponomar, který reprodukuje církevněslovanské písmo Synodální tiskárny. Ponomar sází iniciálu a nikdy text: moderní encyklika vysázená celá synodálním písmem by říkala něco nepravdivého o tom, čím je. Všechna jsou licencována pod SIL Open Font License a poskytována z tohoto webu, nikoli od třetí strany, takže čtení stránky nežádá nic po cizím serveru.',
	'refs.citedIn': 'Citováno v',
	'refs.externalVolume': 'Svazek {volume} na {host} — naskenované PDF',
	'bible.wholeChapter': 'Tato kapitola',
	'bible.verseNotInEdition':
		'Toto číslo verše není v tomto vydání — viz poznámka ve zdroji stránky',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Poznámka',
	'bible.noteMissing': 'Tato poznámka v korpusu chybí',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Číst celou kapitolu',
	'ccc.noParagraphNumber': 'V tomto korpusu chybí číslo odstavce',
	'copyright.sourceTitle': 'Otevřít původní zdrojovou stránku',
	'copyright.sourceLabel': 'Zdroj',
	'lang.label': 'Jazyk',
	'lang.filter': 'Hledat jazyky',
	'lang.more': 'další jazyky',
	'notFound.title': 'Na této adrese nic není',
	'notFound.lede': 'Stránka, kterou hledáte, tu není.',
	'notFound.body':
		'Odkaz může být přepsaný nebo zastaralý, nebo může vést na text, který tento web neobsahuje.',
	'notFound.searchHint':
		'Znáte-li odkaz, který hledáte — knihu a kapitolu, odstavec Katechismu — napište jej do vyhledávacího pole v horní části této stránky.',
	'notFound.credit': 'Podle British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Nebo začněte od jednoho z těchto:',
	'notFound.home': 'Domů',
	'compare.enter': 'Porovnat vydání',
	'compare.exit': 'Ukončit porovnání',
	'compare.missing': 'V tomto vydání není',
	'compare.versificationNote':
		'Tato dvě vydání místy dělí verše této kapitoly odlišně (jde o textovou variantu, ne o překladatelskou volbu) — stejné číslo verše neoznačuje vždy stejnou větu v obou sloupcích.',
	'compare.loading': 'Načítá se druhý jazyk…',
	'ui.close': 'Zavřít',
	'shortcuts.title': 'Klávesové zkratky',
	'shortcuts.betweenDocuments': 'Mezi dokumenty',
	'shortcuts.withinDocument': 'Uvnitř dokumentu',
	'shortcuts.show': 'Zobrazit tento seznam',
	'help.title': 'Nápověda',
	'help.top.heading': 'Lišta v záhlaví každé stránky',
	'help.reading.heading': 'Lišta nad textem',
	'help.feature.search':
		'Napište odkaz do pole nahoře — kapitolu a verš, číslo odstavce, název dokumentu — a doplní se vám během psaní.',
	'help.feature.offline':
		'Přidejte web na domovskou obrazovku a otevře se jako aplikace. Celá díla si můžete stáhnout a číst bez připojení.',
	'help.feature.contents':
		'Členění díla, v němž jste — knihy, části, kapitoly — abyste se v něm pohybovali bez návratu na začátek.',
	'help.feature.compare':
		'Dvě vydání téhož místa vedle sebe — latina vedle vašeho jazyka, nebo jeden překlad vedle druhého.',
	'help.feature.apparatus':
		'Vlastní poznámky vydání a jakýkoli komentář napsaný k textu se nabízejí vedle něj, a ne pod ním. Citace uvnitř textu jsou odkazy, takže odkaz vede tam, kam ukazuje.',
	'help.feature.focus':
		'Odklidí všechno kromě textu. Cesta ven zůstane tam, kde byla lišta, aby za ní nic neuvízlo.',
	'zen.enter': 'Režim soustředění',
	'zen.exit': 'Opustit režim soustředění',
	'nav.calendar': 'Kalendář',
	'calendar.title': 'Liturgický kalendář',
	'calendar.tagline':
		'Všeobecný římský kalendář, spočítaný pro kterýkoli den — jeho doba, jeho stupeň, jeho barva.',
	'calendar.calendar': 'Kalendář',
	'calendar.which.general': 'Všeobecný římský kalendář',
	'calendar.filter': 'Hledat země',
	'calendar.region.europe': 'Evropa',
	'calendar.region.americas': 'Ameriky',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Blízký východ',
	'calendar.region.asia': 'Asie',
	'calendar.region.oceania': 'Oceánie',
	'calendar.today': 'Dnes',
	'calendar.previousMonth': 'Předchozí měsíc',
	'calendar.nextMonth': 'Následující měsíc',
	'calendar.plainDays': 'Obyčejné všední dny',
	'calendar.noSuchDay': 'Pro toto datum se nepočítá žádný liturgický den.',
	'calendar.week': 'týden',
	'calendar.alsoToday': 'Dnes se slaví také',
	'calendar.alsoObserved': 'Dnes připadá také',
	'calendar.obligation': 'Zasvěcený svátek',
	'calendar.obligationCanon': 'CIC kán. 1246',
	'calendar.sundayCycle': 'Nedělní cyklus',
	'calendar.weekdayCycle': 'Všední cyklus',
	'calendar.psalterWeek': 'Týden žaltáře',
	'lectionary.heading': 'Čtení při mši',
	'lectionary.slot.reading': 'Čtení',
	'lectionary.slot.reading1': 'První čtení',
	'lectionary.slot.reading2': 'Druhé čtení',
	'lectionary.slot.reading3': 'Třetí čtení',
	'lectionary.slot.reading4': 'Čtvrté čtení',
	'lectionary.slot.reading5': 'Páté čtení',
	'lectionary.slot.reading6': 'Šesté čtení',
	'lectionary.slot.reading7': 'Sedmé čtení',
	'lectionary.slot.psalm': 'Responsoriální žalm',
	'lectionary.slot.epistle': 'Epištola',
	'lectionary.slot.acclamation': 'Zpěv před evangeliem',
	'lectionary.slot.gospel': 'Evangelium',
	'lectionary.slot.sequence': 'Sekvence',
	'lectionary.or': 'nebo',
	'lectionary.cf': 'Srov.',
	'lectionary.about': 'O těchto čteních',
	'lectionary.caveat':
		'Úryvky určené Ordo lectionum Missae, propojené s vlastními vydáními tohoto webu — nikoli překlad, který zaznívá v konkrétním kostele, a biskupská konference může rozpis upravit.',
	'calendar.transferredFrom': 'Přeloženo z',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Doba vánoční',
	'calendar.season.lent': 'Postní doba',
	'calendar.season.triduum': 'Velikonoční triduum',
	'calendar.season.easter': 'Doba velikonoční',
	'calendar.season.ordinary': 'Liturgické mezidobí',
	'calendar.colour.white': 'Bílá',
	'calendar.colour.red': 'Červená',
	'calendar.colour.green': 'Zelená',
	'calendar.colour.violet': 'Fialová',
	'calendar.colour.rose': 'Růžová',
	'calendar.colour.black': 'Černá',
	'calendar.colour.blue': 'Modrá',
	'calendar.rank.solemnity': 'Slavnost',
	'calendar.rank.feast': 'Svátek',
	'calendar.rank.memorial': 'Památka',
	'calendar.rank.optional-memorial': 'Nezávazná památka',
	'calendar.rank.commemoration': 'Připomínka',
	'calendar.rank.sunday': 'Neděle',
	'calendar.rank.weekday': 'Všední den',
	'calendar.gloss.season.advent':
		'Čtyři týdny před Vánocemi: příprava na příchod Páně a začátek církevního roku.',
	'calendar.gloss.season.christmas':
		'Od Narození Páně po Křest Páně, kdy se slaví narození Páně a jeho zjevení světu.',
	'calendar.gloss.season.lent':
		'Čtyřicet dní od Popeleční středy po večerní mši na Památku Večeře Páně: pokání, almužna a příprava na Velikonoce.',
	'calendar.gloss.season.triduum':
		'Tři dny od večera Zeleného čtvrtka po večer Neděle zmrtvýchvstání — utrpení, smrt a vzkříšení Páně, vrchol celého roku.',
	'calendar.gloss.season.easter':
		'Padesát dní od Velikonoc do Seslání Ducha Svatého, slavených jako jediná slavnost — „jedna veliká neděle“.',
	'calendar.gloss.season.ordinary':
		'Třicet tři nebo třicet čtyři týdnů mimo ostatní doby. Ne „obyčejné“, nýbrž uspořádané: týdny jsou počítány a církev čte průběžně život a učení Páně. Přichází ve dvou úsecích — po době vánoční až do postní doby a po Seslání Ducha Svatého až do adventu.',
	'calendar.gloss.rank.solemnity':
		'Nejvyšší stupeň: Velikonoce, Vánoce, Nanebevstoupení, patron místa. Slaví se s Gloria a Credo a začíná už předchozí večer.',
	'calendar.gloss.rank.feast':
		'Slaví se v rámci samotného dne. Apoštolové a evangelisté a větší dny Páně a Panny Marie.',
	'calendar.gloss.rank.memorial':
		'Světec připomínaný ve svůj den, uvnitř mše a officia dané doby. Závazná tam, kde se slaví.',
	'calendar.gloss.rank.optional-memorial':
		'Může se slavit i neslavit, podle volby kněze nebo společenství. Neslaví-li se, je den prostě všední den.',
	'calendar.gloss.rank.commemoration':
		'Čím se památka stává v postní době: modlitba přidaná ke mši všedního dne, kterou doba jinak ponechává celou.',
	'calendar.gloss.rank.sunday':
		'Původní svátek — den Páně, slavený každý týden od vzkříšení. Jen slavnost nebo svátek Páně jej může vytlačit, a v adventu, postní a velikonoční době ani ty ne.',
	'calendar.gloss.rank.weekday':
		'Den bez vlastní slavnosti. Mše i officium jsou z dané doby — a právě to činí dobu tím, co stojí za poznání.',
	'calendar.gloss.colour.white':
		'Radost. Velikonoční a vánoční doba, dny Páně mimo jeho utrpení, Panna Maria, andělé a světci, kteří nebyli mučedníky.',
	'calendar.gloss.colour.red':
		'Krev a oheň. Květná neděle a Velký pátek, Seslání Ducha Svatého, apoštolové a evangelisté a mučedníci.',
	'calendar.gloss.colour.green': 'Liturgické mezidobí: barva naděje a toho, co roste.',
	'calendar.gloss.colour.violet': 'Advent a postní doba, a také při mších za zemřelé.',
	'calendar.gloss.colour.rose':
		'Užívá se dvakrát do roka — o neděli Gaudete, třetí adventní, a o neděli Laetare, čtvrté postní — kde se půst rozjasňuje a konec je na dohled.',
	'calendar.gloss.colour.black': 'Smí se užít při mších za zemřelé.',
	'calendar.gloss.colour.blue':
		'Výsada modré: užívá se o Neposkvrněném početí ve Španělsku, na Filipínách a v nemnoha dalších místech, jimž ji Svatý stolec udělil.',
	'calendar.gloss.sundayCycle':
		'Nedělní čtení běží ve třech letech — A, B a C — a čtou se postupně Matouš, Marek a Lukáš, s Janem v postní a velikonoční době. Cyklus se mění o první neděli adventní, spolu s církevním rokem.',
	'calendar.gloss.weekdayCycle':
		'Čtení všedních dnů běží ve dvou letech, I a II: první čtení se mění, evangelium ne. Liturgický rok se jmenuje podle občanského roku, v němž končí — liché roky jsou I, sudé II.',
	'calendar.gloss.psalterWeek':
		'Denní modlitba církve rozděluje žalmy do čtyř týdnů, I až IV, jež se během roku opakují. Toto je týden, jehož žalmy patří dnešku, pro každého, kdo se modlí hodinky.',
	'calendar.gloss.obligation':
		'Den, kdy jsou věřící vázáni účastnit se mše a zdržet se prací, které by jim v tom bránily. Každá neděle a další dny, jež určila příslušná biskupská konference.',
	'calendar.primer.title': 'Jste tu poprvé?',
	'calendar.primer.lead':
		'Církev zachovává vlastní rok. Začíná adventem, otáčí se kolem Velikonoc a dává každému dni jméno, stupeň a barvu — a ty rozhodují, co se ten den modlí a čte při mši a v denní modlitbě církve. „Třiadvacátá neděle v mezidobí“ je tedy adresa: říká knězi, sboru nebo komukoli, kdo se modlí doma, které modlitby a čtení patří dnešku.',
	'calendar.primer.seasons': 'Liturgické doby',
	'calendar.primer.ranks': 'Čím může den být',
	'calendar.primer.colours': 'Barvy',
	'calendar.primer.cycles': 'Cykly',
	'calendar.primer.cyclesLead':
		'Tři počitadla, která dohromady říkají, která čtení a žalmy jsou určeny na dnešek.'
};
