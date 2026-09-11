/**
 * Slovenčina UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 3 editions in Slovenčina and its readers were reading
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

export const sk: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katechizmus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magistérium',
	'nav.socialDoctrine': 'Sociálna náuka',
	'socialDoctrine.landing.title': 'Kompendium sociálnej náuky Cirkvi',
	'socialDoctrine.landing.tagline': 'Čo Cirkev učí o živote v spoločnosti, v 583 číslach.',
	'nav.canonLaw': 'Kánonické právo',
	'canonLaw.landing.title': 'Kódex kánonického práva',
	'canonLaw.landing.tagline': 'Právo latinskej Cirkvi v 1752 kánonoch v siedmich knihách.',
	'canonLaw.canon': 'Kán.',
	'canonLaw.canons': 'Kán.',
	'canonLaw.prevCanon': 'Predchádzajúci kánon',
	'canonLaw.nextCanon': 'Nasledujúci kánon',
	'canonLaw.readFullTitle': 'Čítať celý titul',
	'canonLaw.superseded': 'Znenie nahradené',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Ponuka',
	'nav.sections': 'Sekcie',
	'nav.works': 'Diela',
	'nav.pages': 'Stránky',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Pokračovať v čítaní',
	'home.tagline':
		'Čitateľská stránka pre Písmo, Katechizmus a dokumenty magistéria — zadarmo, aj bez pripojenia, a bez akejkoľvek registrácie.',
	'home.doors.heading': 'Kam ísť',
	'home.find.heading': 'Alebo napíšte odkaz',
	'nav.library': 'Knižnica',
	'nav.learn': 'Učenie',
	'library.landing.tagline':
		'Celá zbierka, polica po polici — spolu s tým, kde ste prestali, a s tým, čo ste si označili.',
	'schola.landing.title': 'Kde začať',
	'schola.landing.tagline':
		'Krátky sprievodca tým, čo je tu: čo je každá z týchto kníh, desať prikázaní a ďalšie zoznamy, ktoré cirkev žiada poznať od katolíka, a odkiaľ začať čítať.',
	'schola.start.heading': 'Nový v katolicizme?',
	'schola.start.body': 'Najlepší začiatok je ',
	'schola.start.bodyAfter':
		': to isté učenie ako v Katechizme, oveľa kratšie, písané v otázkach a odpovediach. Má asi desatinu rozsahu a nič nepredpokladá.',
	'schola.bible.heading': 'Nikdy ste nečítali Bibliu?',
	'schola.bible.library':
		'Nie je to jedna kniha, ale sedemdesiattri, písané vyše tisíc rokov a zviazané v poriadku, na ktorom sa cirkev ustálila — nie v poriadku, v akom sa veci stali, a nie v tom, ktorý sa číta najľahšie. Väčšina ľudí začne na prvej strane a po pár týždňoch prestane, v dlhej kapitole starobylého zákona, lebo im ešte nikto nepovedal, na čo to je.',
	'schola.bible.step.gospel': 'Začnite evanjeliom',
	'schola.bible.start':
		'Jedna zo štyroch krátkych kníh o Ježišovom živote, hlboko vnútri a nie vpredu. Nie je to náš nápad: koncil cirkvi žiadal, aby sa učilo správnemu používaniu Písma, „najmä Nového zákona a predovšetkým evanjelií“. Ani jedno z nich nemenoval zvlášť, a nemenujeme ani my.',
	'schola.bible.whichGospel':
		'Tri sa zvyčajne navrhujú, z troch rozličných dôvodov. Ktorékoľvek z nich je dobré miesto, kde byť.',
	'schola.bible.gospel.mark':
		'Najkratšie. Môžete ho prečítať celé za jedno popoludnie, a mať jedno dočítané má na začiatku väčšiu cenu než mať vybrané to najlepšie.',
	'schola.bible.gospel.luke':
		'Napísané pre niekoho mimo viery, kto chcel mať vec spísanú po poriadku — čím môžete byť práve vy. Pokračuje priamo do Skutkov apoštolov, takže je vlastne prvou polovicou dlhšej knihy.',
	'schola.bible.gospel.john':
		'To, ktoré rovno hovorí, prečo bolo napísané: „aby ste uverili“. Prosté slová, a ide priamo k otázke, kto je Ježiš.',
	'schola.bible.step.acts': 'Potom čo bolo ďalej',
	'schola.bible.thenActs':
		'Keď jedno dočítate, prečítajte si, čo po jeho odchode urobili tí, čo ho poznali.',
	'schola.bible.acts.why':
		'Tridsať rokov po konci evanjelií: zopár desiatok vydesených ľudí, a ako to, čo videli, dorazilo na druhý koniec ríše.',
	'schola.bible.step.old': 'Potom staršia polovica',
	'schola.bible.thenOld':
		'Nie od prvej strany, a nie celá. Niekoľko miest nesie rozprávanie, a sú to práve tie, ku ktorým sa evanjeliá stále vracajú.',
	'schola.bible.ot.beginnings': 'Ako sa to začína a ako sa to kazí.',
	'schola.bible.ot.promise': 'Jedna rodina a prísľub jej daný, ktorý prežije všetkých v nej.',
	'schola.bible.ot.exodus': 'Ľud vyvedený z otroctva a zákon, ktorý dostal, aby podľa neho žil.',
	'schola.bible.ot.psalms':
		'Nie rozprávanie: stopäťdesiat modlitieb a piesní. Čítajte po jednej, v ľubovoľnom poradí. Cirkev sa ich dodnes modlí každý deň.',
	'schola.bible.bothWays':
		'Budete spoznávať veci, a o to ide, nie je to náhoda. Cirkev číta staršie knihy vo svetle Kristovom a novšie vo svetle toho, čo bolo predtým — každá polovica vysvetľuje druhú, a preto sa žiadna nečíta sama.',
	'schola.books.heading': 'Čo je tu',
	'schola.what.scripture':
		'Písmo, ako ho cirkev prijíma, v oboch Zákonoch. Všetko ostatné tu sa číta v jeho svetle.',
	'schola.what.catechism':
		'Zhrnutie toho, čomu katolícka cirkev verí, v jednom zväzku. Sám nie je prameňom: zhromažďuje Písmo, otcov, liturgiu a učenie cirkvi, a každý odsek hovorí, odkiaľ pochádza to, čo tvrdí.',
	'schola.what.compendium':
		'To isté učenie podané v otázkach a odpovediach, asi v desatinovom rozsahu.',
	'schola.what.magisterium':
		'To, čo pápeži a koncily naozaj napísali — encykliky, konštitúcie, dekréty, deklarácie — každý dokument obrátený k určitej chvíli a určitej otázke. Každý je známy podľa svojich úvodných latinských slov.',
	'schola.what.social':
		'Učenie cirkvi o práci, vlastníctve, rodine, politike a mieri, zhromaždené z tých dokumentov do jednej knihy.',
	'schola.what.law': 'Právo, nie náuka. Hovorí, čo cirkev vyžaduje, a býva menené.',
	'schola.what.doctors':
		'Teológovia, ktorých cirkev vyhlásila za učiteľov. Nenesie to nijakú úradnú autoritu, akokoľvek veľký je jeho autor.',
	'schola.what.prayers': 'Slová, ktorými sa cirkev modlí, s latinčinou vedľa.',
	'schola.places.heading': 'Nie texty, ale miesta na tomto webe',
	'schola.what.library':
		'Všetky diela webu v jednom zozname, zoskupené podľa predmetu, nie podľa druhu.',
	'schola.what.questions':
		'Vstup pre toho, kto má otázku a žiadny odkaz. Každá z nich zhromažďuje state, ktoré na ňu odpovedajú — najprv z Katechizmu — a každé ich slovo patrí samotnej cirkvi.',
	'schola.what.calendar':
		'Liturgický deň — obdobie, farba a kto sa slávi — pre krajinu, ktorej kalendárom sa riadite.',
	'schola.what.bookmarks':
		'Miesta, ktoré ste si označili, a kde ste naposledy skončili v každom diele. Oboje zostáva v tomto prehliadači a nikam sa neodosiela.',
	'schola.what.census':
		'Čo má táto knižnica a ako ďaleko siaha — koľko diel, v akých jazykoch, a koľko z každého sa naozaj dostane k tomu, kto číta vo vašom jazyku.',
	'ccc.noCounterpart': 'Bez náprotivku v druhom diele.',
	'jumpbox.placeholder': 'Prejsť na… (napr. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Hľadať',
	'jumpbox.hint': 'Stlačte / alebo Ctrl+K na prechod k odkazu',
	'jumpbox.noMatch': 'Nič sa nenašlo',
	'jumpbox.suggestions': 'Návrhy',
	'settings.label': 'Nastavenia',
	'apparatus.label': 'Aparát',
	'apparatus.editionNotes': 'Poznámky tohto vydania',
	'apparatus.commentary': 'Komentár',
	'apparatus.inCommentary': 'Zahrnuté v komentári vyššie.',
	'darkMode.label': 'Tmavý režim',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Zapnuté',
	'darkMode.off': 'Vypnuté',
	'sepia.label': 'Sépia',
	'sepia.lightOnly': 'Len vo svetlom režime',
	'sepia.noHue': 'Nie v jednofarebnom režime',
	'oled.label': 'OLED čierna',
	'oled.darkOnly': 'Len v tmavom režime',
	'mono.label': 'Jednofarebné',
	'mono.hint':
		'Celú stránku nastaví do jedného odtieňa šedej, takže farba nič nerozlišuje. Kým je zapnuté, sépia sa vypne.',
	'advanced.label': 'Rozšírené',
	'library.title': 'Knižnica offline',
	'library.lede': 'Texty uložené v tomto zariadení sa otvoria aj úplne bez pripojenia.',
	'library.essentials': 'Modlitby a Kompendium',
	'library.illustrations': 'Biblia (ilustrácie)',
	'library.illustrationsDetail': 'Biblia (ilustrácie, vysoké rozlíšenie)',
	'library.other': 'Ostatné texty',
	'library.everything': 'Všetko',
	'library.downloadAll': 'Stiahnuť všetko',
	'library.download': 'Stiahnuť',
	'library.downloaded': 'V tomto zariadení',
	'library.offlineNote': 'Na stiahnutie čohokoľvek vypnite offline režim.',
	'library.remove': 'Odstrániť z tohto zariadenia',
	'library.removeConfirm': 'Odstrániť?',
	'library.forget': 'Odstrániť stiahnuté',
	'library.forgetConfirm': 'Odstrániť všetko?',
	'offline.label': 'Offline režim',
	'offline.hint':
		'Vôbec nepoužíva sieť: nič sa nesťahuje, nekontrolujú sa aktualizácie, nič sa nemeria. Otvoria sa iba texty, ktoré už sú v tomto zariadení.',
	'offline.notDownloaded': 'Nie je v tomto zariadení',
	'loadFailed.title': 'To sa nenačítalo',
	'loadFailed.hint':
		'Stránka existuje — pri jej načítaní sa niečo pokazilo. Ďalší pokus obvykle pomôže.',
	'loadFailed.retry': 'Skúsiť znova',
	'loadFailed.retrying': 'Skúša sa…',
	'offline.turnOff': 'Vypnúť offline režim',
	'type.label': 'Veľkosť textu a písmo',
	'fontSize.label': 'Veľkosť textu',
	'fontSize.small': 'Malý',
	'fontSize.medium': 'Stredný',
	'fontSize.large': 'Veľký',
	'fontSize.xlarge': 'Veľmi veľký',
	'fontSize.xxlarge': 'Najväčší',
	'face.label': 'Písmo',
	'face.serif': 'Pätkové',
	'face.sans': 'Bezpätkové',
	'print.label': 'Vytlačiť túto stránku',
	'toTop.label': 'Späť nahor',
	'install.label': 'Nainštalovať Glossu',
	'install.hint.label': 'Pridať na plochu',
	'install.hint.title': 'Pridajte Glossu na plochu',
	'install.hint.stepBefore': 'Otvára sa ako aplikácia a číta aj offline. Klepnite na',
	'install.hint.stepAfter': 'potom „Pridať na Plochu“.',
	'install.hint.dismiss': 'Zavrieť',
	'update.label': 'Je dostupné nové vydanie',
	'update.title': 'Nové vydanie je pripravené',
	'update.body': 'Obnovte stránku, aby ste získali najnovšie texty a opravy.',
	'update.action': 'Obnoviť',
	'update.dismiss': 'Teraz nie',
	'edition.label': 'Vydanie',
	'edition.select': 'Zvoliť vydanie',
	'edition.current': 'Súčasné vydanie',
	'edition.filter': 'Hľadať vydania',
	'menu.noMatches': 'Žiadne výsledky',
	'unitNav.previous': 'Predchádzajúce',
	'unitNav.next': 'Ďalšie',
	'bible.prevChapter': 'Predchádzajúca kapitola',
	'bible.nextChapter': 'Nasledujúca kapitola',
	'bible.pickBook': 'Knihy a kapitoly',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Čítajte celú Bibliu, knihu po knihe, kapitolu po kapitole.',
	'bible.landing.random': 'Skúsiť šťastie',
	'bible.chapterUnavailable': 'Nedostupné v tomto vydaní',
	'bible.introduction': 'Úvod',
	'bible.introUnavailable': 'Úvod v tomto jazyku zatiaľ chýba',
	'bible.introSource': 'Úvody nie sú súčasťou textu Písma.',
	'bible.testament.ot': 'Starý zákon',
	'bible.testament.nt': 'Nový zákon',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Historické knihy',
	'bible.group.wisdom': 'Múdroslovné knihy',
	'bible.group.prophetic': 'Prorocké knihy',
	'bible.group.gospels': 'Evanjeliá',
	'bible.group.acts': 'Skutky apoštolov',
	'bible.group.pauline': 'Pavlove listy',
	'bible.group.catholicLetters': 'Katolícke listy',
	'bible.group.revelation': 'Zjavenie',
	'ccc.prevParagraph': 'Predchádzajúci odsek',
	'ccc.nextParagraph': 'Nasledujúci odsek',
	'ccc.inBrief': 'Zhrnutie',
	'ccc.landing.title': 'Katechizmus Katolíckej cirkvi',
	'ccc.landing.pairTitle': 'Katechizmus a Kompendium',
	'ccc.landing.tagline':
		'<strong>Katechizmus</strong> predkladá katolícku náuku v 2 865 očíslovaných odsekoch. <strong>Kompendium</strong> tú istú náuku podáva ako 598 otázok a odpovedí podľa toho istého usporiadania.',
	'ccc.landing.pairTagline':
		'Katechizmus Katolíckej cirkvi v 2 865 číslach a jeho Kompendium v 598 otázkach.',
	'ccc.tableOfContents': 'Obsah',
	'ccc.related': 'Pozri aj',
	'compendium.landing.title': 'Kompendium Katechizmu',
	'compendium.landing.tagline': 'Otázky a odpovede zhrňujúce Katechizmus Katolíckej cirkvi.',
	'compendium.question': 'Otázka',
	'compendium.answer': 'Odpoveď',
	'compendium.tableOfContents': 'Obsah',
	'compendium.prevQuestion': 'Predchádzajúca otázka',
	'compendium.nextQuestion': 'Nasledujúca otázka',
	'compendium.condenses': 'Zhŕňa KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'ccc.condensedIn': 'V Kompendiu',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'V tomto korpuse chýba číslo otázky',
	'document.library.tagline': 'Encykliky, koncilové konštitúcie, dekréty a deklarácie Magistéria.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Typ',
	'document.filter.subject': 'Téma',
	'document.filter.search': 'Hľadať dokumenty',
	'document.filter.clear': 'Vymazať',
	'document.filter.results': 'Zobrazené dokumenty',
	'document.filter.noResults': 'Žiadny dokument nezodpovedá týmto filtrom.',
	'document.tableOfContents': 'Obsah',
	'document.startReading': 'Začať čítať',
	'document.readFullDocument': 'Čítať celý dokument',
	'document.section': 'Oddiel',
	'document.prevSection': 'Predchádzajúce',
	'document.nextSection': 'Ďalšie',
	'document.kind.conciliarConstitution': 'Konštitúcia',
	'document.kind.conciliarDecree': 'Dekrét',
	'document.kind.conciliarDeclaration': 'Deklarácia',
	'document.kind.encyclical': 'Encyklika',
	'document.kind.apostolicExhortation': 'Apoštolská exhortácia',
	'document.kind.apostolicConstitution': 'Apoštolská konštitúcia',
	'document.kind.apostolicLetter': 'Apoštolský list',
	'document.kind.cdfDeclaration': 'Deklarácia KNV',
	'document.kind.cdfInstruction': 'Inštrukcia KNV',
	'document.kind.cdfLetter': 'List KNV',
	'document.kind.cdfDoctrinalNote': 'Doktrinálna nóta KNV',
	'document.kind.cdfResponsum': 'Responzum KNV',
	'document.kind.cdfConsiderations': 'Úvahy KNV',
	'document.kindPlural.conciliarConstitution': 'Konštitúcie',
	'document.kindPlural.conciliarDecree': 'Dekréty',
	'document.kindPlural.conciliarDeclaration': 'Deklarácie',
	'document.kindPlural.encyclical': 'Encykliky',
	'document.kindPlural.apostolicExhortation': 'Apoštolské exhortácie',
	'document.kindPlural.apostolicConstitution': 'Apoštolské konštitúcie',
	'document.kindPlural.apostolicLetter': 'Apoštolské listy',
	'document.kindPlural.cdfDeclaration': 'Deklarácie KNV',
	'citation.unavailable': 'Pre túto poznámku nie je k dispozícii zdrojový text.',
	'doctores.landing.title': 'Učitelia Cirkvi',
	'doctores.landing.tagline': 'Teologické diela cirkevných otcov a učiteľov Cirkvi.',
	'summa.landing.title': 'Teologická suma',
	'summa.landing.tagline': 'Tomáš Akvinský, po anglicky a v latinčine, ktorou písal.',
	'summa.tableOfContents': 'Obsah',
	'summa.part': 'Časť',
	'summa.question': 'Otázka',
	'summa.article': 'Článok',
	'summa.questionShort': 'Ot.',
	'summa.articleShort': 'Čl.',
	'summa.titleFromEdition': 'Názov z vydania {lang}',
	'summa.titlesFromEdition': 'Názvy z vydania {lang} — toto vydanie žiadne netlačí',
	'summa.prologue': 'Prológ',
	'summa.objection': 'Námietka',
	'summa.sedContra': 'Naproti tomu',
	'summa.corpus': 'Odpovedám',
	'summa.reply': 'Odpoveď na námietku',
	'summa.preamble': 'Poznámka',
	'summa.prevQuestion': 'Predchádzajúca otázka',
	'summa.nextQuestion': 'Nasledujúca otázka',
	'summa.noEditionInYourLanguage': 'Suma nemá vydanie vo vašom jazyku. Zobrazené v jazyku {lang}.',
	'summa.noLatinSupplement':
		'Dodatok existuje iba po anglicky — bol zostavený až po Akvinského smrti.',
	'index.division': 'Oddiel',
	'index.showSubsections': 'Zobraziť pododdiely',
	'index.hideSubsections': 'Skryť pododdiely',
	'prayers.landing.title': 'Bežné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textom vedľa.',
	'prayers.tableOfContents': 'Obsah',
	'prayers.gloss.versicle':
		'Verš — riadok, ktorý ten, kto vedie modlitbu, hovorí alebo spieva sám. Zhromaždenie mu odpovedá odpoveďou, ktorá nasleduje.',
	'prayers.gloss.response':
		'Odpoveď — riadok, ktorý zhromaždenie hovorí alebo spieva spoločne ako odpoveď na predchádzajúci verš.',
	'prayers.seeAlso': 'Pozri aj',
	'prayers.prevPrayer': 'Predchádzajúca modlitba',
	'prayers.nextPrayer': 'Nasledujúca modlitba',
	'prayers.rosary.today': 'Dnes',
	'prayers.rosary.todayHeading': 'Dnešné tajomstvá',
	'prayers.rosary.openingPrayer': 'Úvodná modlitba',
	'prayers.rosary.decadePrayers': 'Modlitby desiatku',
	'ref.tooltip.loading': 'Načítava sa…',
	'ref.tooltip.openCcc': 'Otvoriť v Katechizme',
	'ref.tooltip.openBible': 'Otvoriť v Biblii',
	'ref.tooltip.openCompendium': 'Otvoriť v Kompendiu',
	'ref.preview.open': 'Otvoriť',
	'ref.cf': 'porov.',
	'anchor.actions': 'Akcie k odkazu',
	'anchor.copy': 'Kopírovať text',
	'anchor.copyLink': 'Kopírovať odkaz',
	'anchor.view': 'Zobraziť',
	'anchor.copied': 'Skopírované',
	'anchor.copyFailed': 'Nepodarilo sa skopírovať',
	'bookmark.add': 'Pridať záložku',
	'bookmark.remove': 'Odstrániť záložku',
	'bookmark.library': 'Záložky',
	'bookmark.library.tagline': 'Všetko, čo ste si pri čítaní označili.',
	'bookmark.empty': 'Zatiaľ nič označené.',
	'bookmark.emptyHint':
		'Kliknite na číslo verša alebo odseku a zvoľte Pridať záložku, alebo použite tlačidlo záložky na stránke.',
	'bookmark.about': 'O týchto záložkách',
	'bookmark.deviceOnly':
		'Záložky zostávajú len v tomto prehliadači. Nikam sa neodosielajú a vymazanie údajov prehliadača ich odstráni.',
	'bookmark.unavailable': 'Nie je vo vydaní, ktoré čítate',
	'colophon.title': 'Tiráž',
	'colophon.lede':
		'Čo je táto stránka, odkiaľ pochádzajú jej texty a aký je náš postoj k ich reprodukovaniu.',
	'colophon.whatThisIs': 'Čo to je',
	'colophon.whatThisIsBody':
		'Glossa Catholica je čitateľská stránka pre Písmo, Katechizmus, Kompendium a dokumenty magistéria, v angličtine, portugalčine a latinčine. Existuje preto, aby sa čítala, a na jej čítanie sa od vás nežiada nič iné:',
	'colophon.pointFree':
		'Zadarmo, a vždy zadarmo. Žiadna platená stena, žiadne predplatné, nič na kúpu.',
	'colophon.pointNoAds': 'Žiadna reklama a žiadne sponzorované umiestnenie akéhokoľvek druhu.',
	'colophon.pointNoAccounts': 'Žiadne účty. Nie je sa kam registrovať, nie je sa kam prihlasovať.',
	'colophon.pointNoTracking':
		'Žiadne sledovacie skripty, žiadny kód tretích strán, žiadne cookies. Iba anonymné počty použití, bez čohokoľvek, čo by vás identifikovalo.',
	'colophon.pointOffline':
		'Vytvorené tak, aby po prvej návšteve fungovalo aj bez pripojenia, aby slabé spojenie nemuselo byť prekážkou v čítaní.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica je súkromná iniciatíva laických veriacich. Nemá žiadne cirkevné schválenie a nehovorí so žiadnou vlastnou autoritou.',
	'footer.notEndorsed': 'Bez schválenia Svätej stolice',
	'colophon.textsTitle': 'Texty',
	'colophon.textsBody':
		'Každý text pochádza z uvedeného zdroja a každé dielo zaznamenáva svoje vydanie, svoju zdrojovú stránku a dátum, kedy bolo získané. Písmo používa preklady vo verejnom vlastníctve; Katechizmus, Kompendium a dokumenty magistéria pochádzajú z vlastných publikovaných textov Svätej stolice.',
	'colophon.textsFidelity':
		'Text nie je nikdy skracovaný, nikdy parafrázovaný, nikdy prepisovaný a nikdy umiestňovaný vedľa reklamy. Zjavné chyby opravujeme — vypadnuté slovo, poškodenú citáciu, značkovanie, ktoré pohltilo odsek — vždy smerom k tomu, čo tlačí sám zdroj, nikdy smerom k tomu, čo si myslíme, že by mal hovoriť.',
	'colophon.countBible': 'vydaní Biblie',
	'colophon.countDocuments': 'dokumentov magistéria',
	'colophon.privacyTitle': 'Súkromie',
	'colophon.privacyBody1':
		'Žiadne účty, žiadne cookies, žiadna reklama, žiadny kód tretích strán. Nič odtiaľto vás nesleduje mimo tejto stránky.',
	'colophon.privacyBody2':
		'Meriame, ako sa stránka používa: jedno meranie na návštevu, každé pole je rozsah, nie presná hodnota — ako dlho ste tu zostali, ako často ste tu boli, ktoré diela ste otvorili. Vaša krajina sa počíta samostatne a nič ju nespája so zvyškom. Opisuje to návštevu, nie návštevníka, a uchováva sa to {days} dní.',
	'colophon.privacyBody3':
		'Nikdy sa neodosiela: čo píšete do vyhľadávacieho poľa, ktoré miesto ste mali otvorené, ani nič, čo by mohlo znova rozpoznať vaše zariadenie. Vaše nastavenia, záložky a stiahnuté texty zostávajú vo vašom zariadení.',
	'colophon.copyrightTitle': 'Autorské práva',
	'colophon.copyrightBody1':
		'Katechizmus, Kompendium a dokumenty magistéria sú majetkom svojich držiteľov práv — predovšetkým Libreria Editrice Vaticana a Dikastéria pre komunikáciu.',
	'colophon.copyrightBody2':
		'Každé dielo zobrazuje vlastnú výhradu autorských práv svojho držiteľa, v jeho znení, a odkazuje na stránku, z ktorej bolo prevzaté.',
	'colophon.copyrightBody3':
		'Ak držíte práva k akémukoľvek textu tu a boli by ste radšej, aby zverejnený nebol, napíšte nám.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Pre čokoľvek, vrátane vyššie uvedeného:',
	'colophon.contactPending':
		'Kontaktná adresa zatiaľ nebola nastavená. Táto stránka by nemala byť zverejnená, kým ju nemá — záväzok vyššie nemá zmysel bez spôsobu, ako nás zastihnúť.',
	'colophon.illustrationsTitle': 'Ilustrácie',
	'colophon.illustrationsBody':
		'Biblia nesie rytiny Gustava Dorého, každú umiestnenú pri verši, ktorý zobrazuje — poslednú a najväčšiu z jeho biblických cyklov, rezanú do dreva podľa jeho kresieb a tlačenú spolu s textom, nie zhromaždenú vzadu.',
	'colophon.illustrationsRights':
		'Sú vo verejnom vlastníctve, ako ukazujú dátumy nižšie, a verná fotografická reprodukcia rytiny vo verejnom vlastníctve nenesie žiadne nové vlastné autorské právo.',
	'colophon.countPlates': 'rytín',
	'colophon.countPlateChapters': 'ilustrovaných kapitol',
	'plates.scansBy': 'Skeny poskytuje',
	'plates.enlarge': 'Zväčšiť {title}',
	'plates.zoom': 'Priblížiť',
	'art.about': 'O tomto obrázku',
	'art.detail': 'výrez',
	'colophon.typeTitle': 'Písmo',
	'colophon.typeBody':
		'Sadzané písmom EB Garamond, obnovou Georga Duffnera a Octavia Parda typov, ktoré Claude Garamont rezal v 90. rokoch 16. storočia — humanistickej tradície, v ktorej Cirkev tlačí od renesancie. Jeho cyrilika je od tých istých rúk, ale neobnovuje nič: žiadna garamondovská cyrilika nebola nikdy rezaná, takže ruština je sadzaná tvarom nakresleným tak, aby stál vedľa ostatných.',
	'colophon.typeArabic':
		'Arabčina je celkom mimo jeho dosahu a je sadzaná písmom Amiri — obnovou Khaleda Hosnyho nashí rezaného pre tlačiareň Búláq v Káhire v roku 1905, zvolenou z tej istej úvahy ako textové písmo: konkrétne historické knižné písmo namiesto súčasnej kresby.',
	'colophon.typeInitials':
		'Úvodné iniciály sú Pirata One, lomené písmo, ktorého verzálky zostávajú čitateľné vo veľkosti, akú iniciála vyžaduje, a — pre ruštinu — Ponomar, ktorý reprodukuje cirkevnoslovanské písmo Synodálnej tlačiarne. Ponomar sadzí iniciálu a nikdy text: moderná encyklika vysadzaná celá synodálnym písmom by hovorila niečo nepravdivé o tom, čím je. Všetky sú licencované pod SIL Open Font License a poskytované z tejto stránky, nie od tretej strany, takže čítanie stránky nežiada nič od cudzieho servera.',
	'refs.citedIn': 'Citované v',
	'refs.externalVolume': 'Zväzok {volume} na {host} — naskenované PDF',
	'bible.wholeChapter': 'Táto kapitola',
	'bible.verseNotInEdition':
		'Toto číslo verša sa v tomto vydaní nenachádza — pozrite poznámku v zdroji strany',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Poznámka',
	'bible.noteMissing': 'V tomto korpuse táto poznámka chýba',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Čítať celú kapitolu',
	'ccc.noParagraphNumber': 'V tomto korpuse chýba číslo odseku',
	'copyright.sourceTitle': 'Otvoriť pôvodnú zdrojovú stránku',
	'copyright.sourceLabel': 'Zdroj',
	'lang.label': 'Jazyk',
	'lang.filter': 'Hľadať jazyky',
	'lang.more': 'ďalšie jazyky',
	'notFound.title': 'Na tejto adrese nič nie je',
	'notFound.lede': 'Stránka, ktorú ste hľadali, tu nie je.',
	'notFound.body':
		'Odkaz môže byť nesprávne napísaný alebo zastaraný, alebo môže smerovať na text, ktorý táto stránka neobsahuje.',
	'notFound.searchHint':
		'Ak poznáte odkaz, ktorý hľadáte — knihu a kapitolu, odsek Katechizmu — napíšte ho do vyhľadávacieho poľa v hornej časti tejto stránky.',
	'notFound.credit': 'Podľa British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Alebo začnite od jedného z týchto:',
	'notFound.home': 'Domov',
	'compare.enter': 'Porovnať vydania',
	'compare.exit': 'Ukončiť porovnávanie',
	'compare.missing': 'V tomto vydaní chýba',
	'compare.versificationNote':
		'Tieto dve vydania miestami delia verše tejto kapitoly inak (textový variant, nie prekladateľské rozhodnutie) — rovnaké číslo verša nemusí v oboch stĺpcoch označovať tú istú vetu.',
	'compare.loading': 'Načítava sa druhý jazyk…',
	'ui.close': 'Zavrieť',
	'shortcuts.title': 'Klávesové skratky',
	'shortcuts.betweenDocuments': 'Medzi dokumentmi',
	'shortcuts.withinDocument': 'V rámci dokumentu',
	'shortcuts.show': 'Zobraziť tento zoznam',
	'help.title': 'Pomocník',
	'help.reading.heading': 'Lišta nad textom',
	'help.feature.offline':
		'Pridajte web na domovskú obrazovku a otvorí sa ako aplikácia. Celé diela si môžete stiahnuť a čítať bez pripojenia.',
	'help.feature.contents':
		'Členenie diela, v ktorom ste — knihy, časti, kapitoly — aby ste sa v ňom pohybovali bez návratu na začiatok.',
	'help.feature.compare':
		'Dve vydania toho istého miesta vedľa seba — latinčina vedľa vášho jazyka, alebo jeden preklad vedľa druhého.',
	'help.feature.apparatus':
		'Vlastné poznámky vydania a akýkoľvek komentár napísaný k textu sa ponúkajú vedľa neho, a nie pod ním. Citácie vnútri textu sú odkazy, takže odkaz vedie tam, kam ukazuje.',
	'help.feature.focus':
		'Odprace všetko okrem textu. Cesta von zostane tam, kde bola lišta, aby za ňou nič neuviazlo.',
	'zen.enter': 'Režim sústredenia',
	'zen.exit': 'Opustiť režim sústredenia',
	'nav.calendar': 'Kalendár',
	'calendar.title': 'Liturgický kalendár',
	'calendar.tagline':
		'Všeobecný rímsky kalendár, vypočítaný pre ktorýkoľvek deň — jeho obdobie, jeho stupeň, jeho farba.',
	'calendar.national.tagline': '{name}, s vlastnými slávnosťami, vypočítaný pre ktorýkoľvek deň.',
	'calendar.calendar': 'Kalendár',
	'calendar.which.general': 'Všeobecný rímsky kalendár',
	'calendar.filter': 'Hľadať krajiny',
	'calendar.region.europe': 'Európa',
	'calendar.region.americas': 'Ameriky',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Blízky východ',
	'calendar.region.asia': 'Ázia',
	'calendar.region.oceania': 'Oceánia',
	'calendar.today': 'Dnes',
	'calendar.previousMonth': 'Predchádzajúci mesiac',
	'calendar.nextMonth': 'Nasledujúci mesiac',
	'calendar.plainDays': 'Bežné všedné dni',
	'calendar.noSuchDay': 'Pre tento dátum sa nepočíta nijaký liturgický deň.',
	'calendar.week': 'týždeň',
	'calendar.alsoToday': 'Dnes sa slávi aj',
	'calendar.alsoObserved': 'Dnes pripadá aj',
	'calendar.obligation': 'Prikázaný sviatok',
	'calendar.obligationCanon': 'CIC kán. 1246',
	'calendar.sundayCycle': 'Nedeľný cyklus',
	'calendar.weekdayCycle': 'Feriálny cyklus',
	'calendar.psalterWeek': 'Týždeň žaltára',
	'lectionary.heading': 'Čítania na svätej omši',
	'lectionary.slot.reading': 'Čítanie',
	'lectionary.slot.reading1': 'Prvé čítanie',
	'lectionary.slot.reading2': 'Druhé čítanie',
	'lectionary.slot.reading3': 'Tretie čítanie',
	'lectionary.slot.reading4': 'Štvrté čítanie',
	'lectionary.slot.reading5': 'Piate čítanie',
	'lectionary.slot.reading6': 'Šieste čítanie',
	'lectionary.slot.reading7': 'Siedme čítanie',
	'lectionary.slot.psalm': 'Responzóriový žalm',
	'lectionary.slot.epistle': 'Epištola',
	'lectionary.slot.acclamation': 'Spev pred evanjeliom',
	'lectionary.slot.gospel': 'Evanjelium',
	'lectionary.slot.sequence': 'Sekvencia',
	'lectionary.or': 'alebo',
	'lectionary.cf': 'Porov.',
	'lectionary.about': 'O týchto čítaniach',
	'lectionary.caveat':
		'Úryvky určené Ordo Lectionum Missae, prepojené na vlastné vydania tejto stránky — nie preklad, ktorý sa hlása v konkrétnom kostole, a biskupská konferencia môže harmonogram upraviť.',
	'calendar.transferredFrom': 'Preložené z',
	'calendar.season.advent': 'Adventné obdobie',
	'calendar.season.christmas': 'Vianočné obdobie',
	'calendar.season.lent': 'Pôstne obdobie',
	'calendar.season.triduum': 'Veľkonočné trojdnie',
	'calendar.season.easter': 'Veľkonočné obdobie',
	'calendar.season.ordinary': 'Cezročné obdobie',
	'calendar.colour.white': 'Biela',
	'calendar.colour.red': 'Červená',
	'calendar.colour.green': 'Zelená',
	'calendar.colour.violet': 'Fialová',
	'calendar.colour.rose': 'Ružová',
	'calendar.colour.black': 'Čierna',
	'calendar.colour.blue': 'Modrá',
	'calendar.rank.solemnity': 'Slávnosť',
	'calendar.rank.feast': 'Sviatok',
	'calendar.rank.memorial': 'Spomienka',
	'calendar.rank.optional-memorial': 'Ľubovoľná spomienka',
	'calendar.rank.commemoration': 'Pripomienka',
	'calendar.rank.sunday': 'Nedeľa',
	'calendar.rank.weekday': 'Féria',
	'calendar.gloss.season.advent':
		'Štyri týždne pred Vianocami: príprava na príchod Pána a začiatok cirkevného roka.',
	'calendar.gloss.season.christmas':
		'Od Narodenia Pána po Krst Krista Pána, keď sa slávi narodenie Pána a jeho zjavenie svetu.',
	'calendar.gloss.season.lent':
		'Štyridsať dní od Popolcovej stredy po večernú svätú omšu na Pamiatku Pánovej večere: pokánie, almužna a príprava na Veľkú noc.',
	'calendar.gloss.season.triduum':
		'Tri dni od večera Zeleného štvrtka po večer Veľkonočnej nedele — utrpenie, smrť a zmŕtvychvstanie Pána, vrchol celého roka.',
	'calendar.gloss.season.easter':
		'Päťdesiat dní od Veľkej noci po Zoslanie Ducha Svätého, slávených ako jediná slávnosť — „jedna veľká nedeľa“.',
	'calendar.gloss.season.ordinary':
		'Tridsaťtri alebo tridsaťštyri týždňov mimo ostatných období. Nie „obyčajné“, ale usporiadané: týždne sú počítané a Cirkev číta postupne život a učenie Pána. Prichádza v dvoch úsekoch — po vianočnom období až do pôstneho, a po Zoslaní Ducha Svätého až do adventu.',
	'calendar.gloss.rank.solemnity':
		'Najvyšší stupeň: Veľká noc, Vianoce, Nanebovstúpenie, patrón miesta. Slávi sa so Sláva a Verím a začína sa predchádzajúci večer.',
	'calendar.gloss.rank.feast':
		'Slávi sa v rámci samotného dňa. Apoštoli a evanjelisti a väčšie dni Pána a Panny Márie.',
	'calendar.gloss.rank.memorial':
		'Svätec pripomínaný vo svoj deň, vnútri svätej omše a ofícia daného obdobia. Záväzná tam, kde sa slávi.',
	'calendar.gloss.rank.optional-memorial':
		'Môže sa sláviť alebo nie, podľa voľby kňaza alebo spoločenstva. Ak sa neslávi, deň je jednoducho féria.',
	'calendar.gloss.rank.commemoration':
		'Čím sa spomienka stáva v pôstnom období: modlitba pridaná k omši fériového dňa, ktorú obdobie inak ponecháva celú.',
	'calendar.gloss.rank.sunday':
		'Pôvodný sviatok — deň Pána, slávený každý týždeň od zmŕtvychvstania. Iba slávnosť alebo sviatok Pána ho môže vytlačiť, a v advente, pôstnom a veľkonočnom období ani tie nie.',
	'calendar.gloss.rank.weekday':
		'Deň bez vlastného slávenia. Omša aj ofícium sú z daného obdobia — a práve to robí obdobie tým, čo stojí za poznanie.',
	'calendar.gloss.colour.white':
		'Radosť. Veľkonočné a vianočné obdobie, dni Pána mimo jeho utrpenia, Panna Mária, anjeli a svätí, ktorí neboli mučeníkmi.',
	'calendar.gloss.colour.red':
		'Krv a oheň. Kvetná nedeľa a Veľký piatok, Zoslanie Ducha Svätého, apoštoli a evanjelisti a mučeníci.',
	'calendar.gloss.colour.green': 'Obdobie cez rok: farba nádeje a toho, čo rastie.',
	'calendar.gloss.colour.violet': 'Advent a pôstne obdobie, a aj pri omšiach za zosnulých.',
	'calendar.gloss.colour.rose':
		'Používa sa dvakrát do roka — v nedeľu Gaudete, tretiu adventnú, a v nedeľu Laetare, štvrtú pôstnu — keď sa pôst rozjasňuje a koniec je na dohľad.',
	'calendar.gloss.colour.black': 'Môže sa použiť pri omšiach za zosnulých.',
	'calendar.gloss.colour.blue':
		'Výsada modrej: používa sa na Nepoškvrnené počatie v Španielsku, na Filipínach a v nemnohých ďalších miestach, ktorým ju Svätá stolica udelila.',
	'calendar.gloss.sundayCycle':
		'Nedeľné čítania bežia v troch rokoch — A, B a C — a číta sa postupne Matúš, Marek a Lukáš, s Jánom v pôstnom a veľkonočnom období. Cyklus sa mení na prvú adventnú nedeľu, spolu s cirkevným rokom.',
	'calendar.gloss.weekdayCycle':
		'Čítania na fériové dni bežia v dvoch rokoch, I a II: prvé čítanie sa mení, evanjelium nie. Liturgický rok sa volá podľa občianskeho roka, v ktorom sa končí — nepárne roky sú I, párne II.',
	'calendar.gloss.psalterWeek':
		'Liturgia hodín rozdeľuje žalmy do štyroch týždňov, I až IV, ktoré sa počas roka opakujú. Toto je týždeň, ktorého žalmy patria dnešku, pre každého, kto sa modlí hodinky.',
	'calendar.gloss.obligation':
		'Deň, keď sú veriaci viazaní zúčastniť sa na svätej omši a zdržať sa prác, ktoré by im v tom bránili. Každá nedeľa a ďalšie dni, ktoré určila príslušná biskupská konferencia.',
	'calendar.primer.title': 'Ste tu prvýkrát?',
	'calendar.primer.lead':
		'Cirkev zachováva vlastný rok. Začína adventom, otáča sa okolo Veľkej noci a dáva každému dňu meno, stupeň a farbu — a tie rozhodujú, čo sa v ten deň modlí a číta pri svätej omši a v liturgii hodín. „Dvadsiata tretia nedeľa v období cez rok“ je teda adresa: hovorí kňazovi, zboru alebo komukoľvek, kto sa modlí doma, ktoré modlitby a čítania patria dnešku.',
	'calendar.primer.seasons': 'Liturgické obdobia',
	'calendar.primer.ranks': 'Čím môže deň byť',
	'calendar.primer.colours': 'Farby',
	'calendar.primer.cycles': 'Cykly',
	'calendar.primer.cyclesLead':
		'Tri počítadlá, ktoré spolu hovoria, ktoré čítania a žalmy sú určené na dnešok.'
};
