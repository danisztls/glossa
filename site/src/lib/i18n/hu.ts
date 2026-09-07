/**
 * Hungarian UI strings.
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

export const hu: Dictionary = {
	'nav.bible': 'Szentírás',
	'nav.ccc': 'Katekizmus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Tanítóhivatal',
	'nav.socialDoctrine': 'Társadalmi tanítás',
	'socialDoctrine.landing.title': 'Az Egyház társadalmi tanításának kompendiuma',
	'socialDoctrine.landing.tagline':
		'Amit az Egyház a társadalmi életről tanít, 583 számozott pontban.',
	'nav.canonLaw': 'Kánonjog',
	'canonLaw.landing.title': 'Az Egyházi Törvénykönyv',
	'canonLaw.landing.tagline': 'A latin egyház joga 1752 kánonban, hét könyvben.',
	'canonLaw.canon': 'Kán.',
	'canonLaw.canons': 'Kánonok',
	'canonLaw.prevCanon': 'Előző kánon',
	'canonLaw.nextCanon': 'Következő kánon',
	'canonLaw.readFullTitle': 'A teljes cím elolvasása',
	'canonLaw.superseded': 'A szöveget felváltotta',
	'nav.prayers': 'Imádságok',
	'nav.bookmarks': 'Könyvjelzők',
	'nav.menu': 'Menü',
	'nav.sections': 'Szakaszok',
	'nav.works': 'Művek',
	'nav.pages': 'Oldalak',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Olvasás folytatása',
	'home.tagline':
		'Olvasóoldal a Szentírás, a Katekizmus és a Tanítóhivatal dokumentumai számára — ingyenes, kapcsolat nélkül is működik, és semmire nem kell regisztrálni.',
	'home.doors.heading': 'Merre',
	'home.find.heading': 'Vagy írjon be egy hivatkozást',
	'nav.library': 'Könyvtár',
	'nav.learn': 'Tanulás',
	'library.landing.tagline':
		'A teljes gyűjtemény, polcról polcra — azzal együtt, hol hagyta abba, és mit jelölt meg.',
	'schola.landing.title': 'Hol kezdje',
	'schola.landing.tagline':
		'Rövid útmutató ahhoz, ami itt van: mi az egyes könyvek mivolta, hogyan írjuk le a rájuk való hivatkozást, hogyan találunk meg egy helyet, és milyen olvasási rendeket ajánlott az Egyház.',
	'schola.start.heading': 'Új Önnek a katolikus hit?',
	'schola.start.body': 'Kezdje ezzel: ',
	'schola.start.bodyAfter':
		' — ugyanaz a tanítás, mint a Katekizmusban, sokkal rövidebben, kérdésekben és feleletekben. Körülbelül tizedakkora terjedelmű, és semmit sem tételez föl.',
	'schola.bible.heading': 'Még sosem olvasta a Szentírást?',
	'schola.bible.library':
		'Nem egy könyv, hanem hetvenhárom, több mint ezer év alatt írva, és abban a rendben egybekötve, amelyben az Egyház megállapodott — nem az események rendjében, és nem is a legkönnyebben olvashatóban. A legtöbben az első lapon kezdik, és néhány héttel később abbahagyják, egy hosszú, ősi törvényről szóló fejezetben, mert még senki sem mondta meg nekik, mire való.',
	'schola.bible.step.gospel': 'Kezdje egy evangéliummal',
	'schola.bible.start':
		'Egy a négy rövid könyv közül Jézus életéről, jóval beljebb, nem elöl. Nem a mi ötletünk: az Egyház egyik zsinata kérte, hogy tanítsák a Szentírás helyes használatát, „főképpen az Újszövetségét és mindenekelőtt az evangéliumokét”. Egyiket sem nevezte meg külön, és mi sem nevezzük meg.',
	'schola.bible.whichGospel':
		'Hármat szokás ajánlani, három különböző okból. Bármelyiknél lenni jó.',
	'schola.bible.gospel.mark':
		'A legrövidebb. Egy délután alatt végigolvasható, és kezdetben többet ér egyet befejezni, mint a legjobbat kiválasztani.',
	'schola.bible.gospel.luke':
		'Egy hiten kívül álló embernek íródott, aki rendben lejegyezve akarta a történetet — ami éppen Ön is lehet. Töretlenül folytatódik az Apostolok Cselekedeteiben, tehát valójában egy hosszabb könyv első fele.',
	'schola.bible.gospel.john':
		'Az, amelyik kimondja, miért íródott: „hogy higgyetek”. Egyszerű szavakkal, és egyenest annak a kérdésére tér, ki Jézus.',
	'schola.bible.step.acts': 'Aztán ami ezután történt',
	'schola.bible.thenActs':
		'Ha befejezett egyet, olvassa el, mit tettek azok, akik ismerték őt, azután, hogy elment.',
	'schola.bible.acts.why':
		'Az evangéliumok vége utáni harminc év: néhány tucat rémült ember, és az, hogy amit láttak, hogyan jutott el a birodalom túlsó végébe.',
	'schola.bible.step.old': 'Aztán a régebbi fele',
	'schola.bible.thenOld':
		'Nem az első laptól, és nem az egészet. Néhány hely viszi a történetet, és éppen ezekre utalnak vissza folyton az evangéliumok.',
	'schola.bible.ot.beginnings': 'Hogyan kezdődik, és hogyan romlik el.',
	'schola.bible.ot.promise': 'Egy család, és a neki tett ígéret, amely mindnyájukat túléli.',
	'schola.bible.ot.exodus':
		'Egy nép, amelyet kihoztak a rabszolgaságból, és a törvény, amelyet kapott, hogy aszerint éljen.',
	'schola.bible.ot.psalms':
		'Nem történet: százötven imádság és ének. Egyszerre egyet olvasson, bármilyen sorrendben. Az Egyház mind a mai napig naponta imádkozza őket.',
	'schola.bible.bothWays':
		'Ismerős dolgokra fog bukkanni, és ez a lényeg, nem véletlen egybeesés. Az Egyház a régebbi könyveket Krisztus fényében olvassa, az újabbakat pedig annak fényében, ami előttük volt — mindegyik fél magyarázza a másikat, s ezért egyiket sem olvassuk magában.',
	'schola.books.heading': 'Mi van itt, és hogyan azonosítjuk',
	'schola.books.lede':
		'Mindegyikük másfajta könyv, és mindegyikre saját számmal hivatkozunk. A példák a formát mutatják: írjon be egy hasonlót a keresőmezőbe, és a helyre jut.',
	'schola.cite.label': 'Azonosítása',
	'schola.what.scripture':
		'A Szentírás úgy, ahogyan az Egyház elfogadja, mindkét Szövetségben. Itt minden mást ennek fényében olvasunk.',
	'schola.cite.scripture':
		'könyv, fejezet és vers, a saját kiadása által nyomtatott rövidítésekkel',
	'schola.what.catechism':
		'Annak összefoglalása, amit a Katolikus Egyház hisz, egyetlen kötetben. Maga nem forrás: összegyűjti a Szentírást, az atyákat, a liturgiát és az Egyház tanítását, és minden pont megmondja, honnan való, amit állít.',
	'schola.cite.catechism': 'pontszám szerint, megszakítás nélkül az első laptól az utolsóig',
	'schola.what.compendium':
		'Ugyanaz a tanítás kérdésekben és feleletekben, körülbelül tizedakkora terjedelemben.',
	'schola.cite.compendium': 'kérdésszám szerint',
	'schola.what.magisterium':
		'Amit a pápák és a zsinatok valóban írtak — enciklikák, konstitúciók, dekrétumok, nyilatkozatok —, mindegyik egy meghatározott pillanathoz és egy meghatározott kérdéshez szólva. Mindegyiket latin kezdőszavairól nevezzük.',
	'schola.cite.magisterium': 'a dokumentum neve, majd egy azon belüli pontszám szerint',
	'schola.what.social':
		'Az Egyház tanítása a munkáról, a tulajdonról, a családról, a politikáról és a békéről, ezekből a dokumentumokból egy könyvbe gyűjtve.',
	'schola.cite.social': 'pontszám szerint, azzal a rövidítéssel, amelyet a mű önmagára használ',
	'schola.what.law': 'Jog, nem tanítás. Azt mondja meg, mit követel az Egyház, és módosítják.',
	'schola.cite.law': 'kánon szerint — így hívják a számozott egységeit',
	'schola.what.doctors':
		'A teológusok, akiket az Egyház egyháztanítónak nyilvánított. Nem hordoz hivatalos tekintélyt, bármilyen nagy is a szerzője.',
	'schola.cite.doctors': 'rész, majd kérdés szerint — a Summa saját tagolása',
	'schola.what.prayers': 'A szavak, amelyekkel az Egyház imádkozik, a latinnal mellettük.',
	'schola.cite.prayers': 'név szerint; nincsenek idézhető számok',
	'schola.places.heading': 'Nem szövegek, hanem helyek ezen az oldalon',
	'schola.what.library':
		'Az oldal minden műve egy listában, tárgy szerint csoportosítva, nem műfaj szerint.',
	'schola.what.calendar':
		'A liturgikus nap — időszak, szín és kit ünneplünk — annak az országnak a naptára szerint, amelyet követ.',
	'schola.what.bookmarks':
		'A megjelölt helyek, és az, hol hagyta abba utoljára az egyes műveket. Mindkettő ebben a böngészőben marad, és sehová sem küldjük el.',
	'ccc.noCounterpart': 'Nincs megfelelője a másik műben',
	'jumpbox.placeholder': 'Ugrás… (pl. jános 3,16, ccc 1234)',
	'jumpbox.short': 'Keresés',
	'jumpbox.hint': 'Nyomja meg a / vagy a Ctrl+K billentyűt a hivatkozásra ugráshoz',
	'jumpbox.noMatch': 'Nincs találat',
	'jumpbox.suggestions': 'Javaslatok',
	'settings.label': 'Beállítások',
	'apparatus.label': 'Apparátus',
	'apparatus.editionNotes': 'E kiadás jegyzetei',
	'apparatus.commentary': 'Kommentár',
	'apparatus.inCommentary': 'Szerepel a fenti kommentárban.',
	'darkMode.label': 'Sötét mód',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Be',
	'darkMode.off': 'Ki',
	'sepia.label': 'Szépia',
	'sepia.lightOnly': 'Csak világosban',
	'sepia.noHue': 'Monóban nem',
	'oled.label': 'OLED-fekete',
	'oled.darkOnly': 'Csak sötétben',
	'mono.label': 'Monokróm',
	'mono.hint':
		'Az egész oldalt egyetlen szürke árnyalatba állítja, így semmit sem a szín különböztet meg. Amíg be van kapcsolva, a szépia kikapcsol.',
	'advanced.label': 'Speciális',
	'library.title': 'Kapcsolat nélküli könyvtár',
	'library.lede': 'Az ezen az eszközön tárolt szövegek hálózat nélkül is megnyílnak.',
	'library.essentials': 'Imádságok és Kompendium',
	'library.illustrations': 'Biblia (illusztrációk)',
	'library.illustrationsDetail': 'Biblia (illusztrációk, nagy felbontás)',
	'library.other': 'További szövegek',
	'library.everything': 'Minden',
	'library.downloadAll': 'Összes letöltése',
	'library.download': 'Letöltés',
	'library.downloaded': 'Ezen az eszközön',
	'library.offlineNote': 'A letöltéshez kapcsolja ki a kapcsolat nélküli módot.',
	'library.remove': 'Eltávolítás erről az eszközről',
	'library.removeConfirm': 'Eltávolítja?',
	'library.forget': 'Letöltések törlése',
	'library.forgetConfirm': 'Törli az összeset?',
	'offline.label': 'Kapcsolat nélküli mód',
	'offline.hint':
		'Egyáltalán nem használ hálózatot: nem tölt le semmit, nem keres frissítést, nem mér semmit. Csak azok a szövegek nyílnak meg, amelyek már ezen az eszközön vannak.',
	'offline.notDownloaded': 'Nincs ezen az eszközön',
	'loadFailed.title': 'Ez nem töltődött be',
	'loadFailed.hint':
		'Az oldal létezik — a letöltése közben ment félre valami. Újra próbálva rendszerint sikerül.',
	'loadFailed.retry': 'Újra',
	'loadFailed.retrying': 'Próbálkozás…',
	'offline.turnOff': 'Kapcsolat nélküli mód kikapcsolása',

	'fontSize.label': 'Betűméret',
	'fontSize.larger': 'Nagyobb betű',
	'fontSize.smaller': 'Kisebb betű',
	'print.label': 'Az oldal nyomtatása',
	'toTop.label': 'Vissza a tetejére',
	'install.label': 'A Glossa telepítése',
	'install.hint.label': 'Hozzáadás a kezdőképernyőhöz',
	'install.hint.title': 'A Glossa hozzáadása a kezdőképernyőhöz',
	'install.hint.stepBefore':
		'Alkalmazásként nyílik meg, és kapcsolat nélkül is olvasható. Koppintson erre:',
	'install.hint.stepAfter': 'majd a „Hozzáadás a kezdőképernyőhöz” lehetőségre.',
	'install.hint.dismiss': 'Bezárás',
	'update.label': 'Új kiadás érhető el',
	'update.title': 'Elkészült egy új kiadás',
	'update.body': 'Frissítse az oldalt, hogy megkapja a legújabb szövegeket és javításokat.',
	'update.action': 'Frissítés',
	'update.dismiss': 'Most nem',
	'edition.label': 'Kiadás',
	'edition.select': 'Válasszon kiadást',
	'edition.current': 'Jelenlegi kiadás',
	'edition.filter': 'Kiadások keresése',
	'menu.noMatches': 'Nincs találat',
	'unitNav.previous': 'Előző',
	'unitNav.next': 'Következő',
	'bible.prevChapter': 'Előző fejezet',
	'bible.nextChapter': 'Következő fejezet',
	'bible.pickBook': 'Könyvek és fejezetek',
	'bible.landing.title': 'A Szentírás',
	'bible.landing.tagline':
		'Olvassa végig a teljes Szentírást, könyvről könyvre, fejezetről fejezetre.',
	'bible.landing.random': 'Szerencsét próbálok',
	'bible.landing.books': 'Könyvek',
	'bible.chapterUnavailable': 'Ebben a kiadásban nem érhető el',
	'bible.introduction': 'Bevezetés',
	'bible.introUnavailable': 'Ezen a nyelven még nincs bevezetés',
	'bible.introSource': 'A bevezetések nem részei a szentírási szövegnek.',
	'bible.testament.ot': 'Ószövetség',
	'bible.testament.nt': 'Újszövetség',
	'bible.group.pentateuch': 'Mózes öt könyve',
	'bible.group.historical': 'Történeti könyvek',
	'bible.group.wisdom': 'Bölcsességi könyvek',
	'bible.group.prophetic': 'A próféták könyvei',
	'bible.group.gospels': 'Evangéliumok',
	'bible.group.acts': 'Az Apostolok Cselekedetei',
	'bible.group.pauline': 'Pál apostol levelei',
	'bible.group.catholicLetters': 'Katolikus levelek',
	'bible.group.revelation': 'Jelenések könyve',
	'ccc.prevParagraph': 'Előző szakasz',
	'ccc.nextParagraph': 'Következő szakasz',
	'ccc.inBrief': 'Összefoglalás',
	'ccc.landing.title': 'A Katolikus Egyház Katekizmusa',
	'ccc.landing.pairTitle': 'Katekizmus és Kompendium',
	'ccc.landing.tagline':
		'<strong>A Katekizmus</strong> 2865 számozott pontban fejti ki a katolikus tanítást. <strong>A Kompendium</strong> ugyanezt a tanítást 598 kérdésben és feleletben adja elő, ugyanazt a szerkezetet követve.',
	'ccc.landing.pairTagline':
		'A Katolikus Egyház Katekizmusa 2865 pontban, Kompendiuma pedig 598 kérdésben.',
	'ccc.tableOfContents': 'Tartalomjegyzék',
	'ccc.related': 'Lásd még',
	'compendium.landing.title': 'A Katekizmus Kompendiuma',
	'compendium.landing.tagline':
		'Kérdések és feleletek, amelyek összefoglalják a Katolikus Egyház Katekizmusát.',
	'compendium.question': 'Kérdés',
	'compendium.answer': 'Felelet',
	'compendium.tableOfContents': 'Tartalomjegyzék',
	'compendium.prevQuestion': 'Előző kérdés',
	'compendium.nextQuestion': 'Következő kérdés',
	'compendium.condenses': 'Összefoglalja: KEK ¶¶',
	'ccc.abbrev': 'KEK',
	'ccc.condensedIn': 'A Kompendiumban',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Ebben a korpuszban nincs kérdésszám',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Egyháztanítók',
	'doctores.landing.tagline': 'Az egyházatyák és egyháztanítók teológiai művei.',
	'summa.landing.title': 'Summa theologiae',
	'summa.landing.tagline': 'Aquinói Szent Tamás, angolul és azon a latinon, amelyen írt.',
	'summa.tableOfContents': 'Tartalomjegyzék',
	'summa.part': 'Rész',
	'summa.question': 'Kérdés',
	'summa.article': 'Cikkely',
	'summa.questionShort': 'K.',
	'summa.articleShort': 'Cikk.',
	'summa.titleFromEdition': 'A cím a(z) {lang} kiadásból',
	'summa.titlesFromEdition': 'A címek a(z) {lang} kiadásból — ez a kiadás nem közöl címeket',
	'summa.prologue': 'Prológus',
	'summa.objection': 'Ellenvetés',
	'summa.sedContra': 'Ezzel szemben áll',
	'summa.corpus': 'Válaszul ezt kell mondani',
	'summa.reply': 'Válasz az ellenvetésre',
	'summa.preamble': 'Megjegyzés',
	'summa.prevQuestion': 'Előző kérdés',
	'summa.nextQuestion': 'Következő kérdés',
	'summa.noEditionInYourLanguage':
		'A Summának nincs kiadása az Ön nyelvén. A(z) {lang} kiadás látható.',
	'summa.noLatinSupplement':
		'A Kiegészítés csak angolul létezik — Szent Tamás halála után állították össze.',
	'index.division': 'Rész',
	'index.showSubsections': 'Alfejezetek megjelenítése',
	'index.hideSubsections': 'Alfejezetek elrejtése',
	'prayers.landing.title': 'Imádságok',
	'prayers.landing.tagline': 'Imádságok a latin szöveggel együtt.',
	'prayers.gloss.versicle':
		'A verzikulus — az a sor, amelyet az imádságot vezető egyedül mond vagy énekel. A közösség az utána következő válasszal felel rá.',
	'prayers.gloss.response':
		'A válasz — az a sor, amelyet a közösség együtt mond vagy énekel, felelve az előtte álló verzikulusra.',
	'prayers.tableOfContents': 'Tartalomjegyzék',
	'prayers.seeAlso': 'Lásd még',
	'prayers.prevPrayer': 'Előző imádság',
	'prayers.nextPrayer': 'Következő imádság',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Ma',
	'prayers.rosary.todayHeading': 'A mai titkok',
	'prayers.rosary.openingPrayer': 'Kezdő ima',
	'prayers.rosary.decadePrayers': 'Egy tized imái',
	'ref.tooltip.loading': 'Betöltés…',
	'ref.tooltip.openCcc': 'Megnyitás a Katekizmusban',
	'ref.tooltip.openBible': 'Megnyitás a Szentírásban',
	'ref.tooltip.openCompendium': 'Megnyitás a Kompendiumban',
	'ref.preview.open': 'Megnyitás',
	'ref.cf': 'vö.',
	'anchor.actions': 'A hivatkozás műveletei',
	'anchor.copy': 'Szöveg másolása',
	'anchor.copyLink': 'Hivatkozás másolása',
	'anchor.view': 'Megtekintés',
	'anchor.copied': 'Másolva',
	'anchor.copyFailed': 'Nem sikerült másolni',
	'bookmark.add': 'Könyvjelző',
	'bookmark.remove': 'Könyvjelző eltávolítása',
	'bookmark.library': 'Könyvjelzők',
	'bookmark.library.tagline': 'Minden, amit olvasás közben megjelölt.',
	'bookmark.empty': 'Még nincs megjelölve semmi.',
	'bookmark.emptyHint':
		'Kattintson egy vers vagy szakasz számára, és válassza a Könyvjelző lehetőséget, vagy használja az oldal könyvjelző gombját.',
	'bookmark.about': 'A könyvjelzőkről',
	'bookmark.deviceOnly':
		'A könyvjelzők csak ebben a böngészőben maradnak meg. Sehová nem küldjük őket, és a böngészőadatok törlése eltávolítja őket.',
	'bookmark.unavailable': 'Nincs meg abban a kiadásban, amelyet olvas',
	'document.library.tagline':
		'A Tanítóhivatal enciklikái, zsinati konstitúciói, határozatai és nyilatkozatai.',
	'document.filter.heading': 'Szűrők',
	'document.filter.author': 'Szerző',
	'document.filter.kind': 'Típus',
	'document.filter.subject': 'Téma',
	'document.filter.search': 'Dokumentumok keresése',
	'document.filter.clear': 'Törlés',
	'document.filter.results': 'Megjelenített dokumentumok',
	'document.filter.noResults': 'Egyetlen dokumentum sem felel meg ezeknek a szűrőknek.',
	'document.tableOfContents': 'Tartalomjegyzék',
	'document.startReading': 'Olvasás megkezdése',
	'document.readFullDocument': 'A teljes dokumentum elolvasása',
	'document.section': 'Szakasz',
	'document.prevSection': 'Előző',
	'document.nextSection': 'Következő',
	'document.kind.conciliarConstitution': 'Konstitúció',
	'document.kind.conciliarDecree': 'Határozat',
	'document.kind.conciliarDeclaration': 'Nyilatkozat',
	'document.kind.encyclical': 'Enciklika',
	'document.kind.apostolicExhortation': 'Apostoli buzdítás',
	'document.kind.apostolicConstitution': 'Apostoli konstitúció',
	'document.kind.cdfDeclaration': 'A Hittani Kongregáció nyilatkozata',
	'document.kind.cdfInstruction': 'A Hittani Kongregáció instrukciója',
	'document.kind.cdfLetter': 'A Hittani Kongregáció levele',
	'document.kind.cdfDoctrinalNote': 'A Hittani Kongregáció tanbeli jegyzete',
	'document.kind.cdfResponsum': 'A Hittani Kongregáció válasza',
	'document.kind.cdfConsiderations': 'A Hittani Kongregáció megfontolásai',
	'document.kindPlural.conciliarConstitution': 'Konstitúciók',
	'document.kindPlural.conciliarDecree': 'Határozatok',
	'document.kindPlural.conciliarDeclaration': 'Nyilatkozatok',
	'document.kindPlural.encyclical': 'Enciklikák',
	'document.kindPlural.apostolicExhortation': 'Apostoli buzdítások',
	'document.kindPlural.apostolicConstitution': 'Apostoli konstitúciók',
	'document.kindPlural.cdfDeclaration': 'A Hittani Kongregáció nyilatkozatai',
	'citation.unavailable': 'Ehhez a jegyzethez nem áll rendelkezésre forrásszöveg.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Mi ez az oldal, honnan származnak a szövegei, és hogyan állunk a közreadásukhoz.',
	'colophon.whatThisIs': 'Mi ez',
	'colophon.whatThisIsBody':
		'A Glossa Catholica olvasóoldal a Szentírás, a Katekizmus, a Kompendium és a Tanítóhivatal dokumentumai számára, angol, portugál és latin nyelven. Azért van, hogy olvassák, és az olvasásáért semmi mást nem kérünk:',
	'colophon.pointFree':
		'Ingyenes, és mindig ingyenes marad. Nincs fizetőfal, nincs előfizetés, nincs mit megvásárolni.',
	'colophon.pointNoAds': 'Nincs reklám, és semmilyen szponzorált elhelyezés.',
	'colophon.pointNoAccounts':
		'Nincsenek fiókok. Nincs mire regisztrálni, nincs hová bejelentkezni.',
	'colophon.pointNoTracking':
		'Nincsenek nyomkövető szkriptek, nincs harmadik féltől származó kód, nincsenek sütik. Csak névtelen használati számlálók, semmi, ami azonosítaná Önt.',
	'colophon.pointOffline':
		'Úgy készült, hogy egyetlen látogatás után kapcsolat nélkül is működjön, így a gyenge internet ne legyen akadálya az olvasásnak.',
	'colophon.whatThisIsStanding':
		'A Glossa Catholica világi hívek magánkezdeményezése. Nem rendelkezik egyházi jóváhagyással, és nem szól saját tekintéllyel.',
	'footer.notEndorsed': 'A Szentszék jóváhagyása nélkül',
	'colophon.textsTitle': 'A szövegek',
	'colophon.textsBody':
		'Minden szöveg megnevezett forrásból származik, és minden mű rögzíti a kiadását, a forrásoldalát és a letöltés dátumát. A Szentírás közkincsű fordításokat használ; a Katekizmus, a Kompendium és a tanítóhivatali dokumentumok a Szentszék saját közzétett szövegeiből valók.',
	'colophon.textsFidelity':
		'A szöveget soha nem rövidítjük, soha nem fogalmazzuk át, soha nem írjuk újra, és soha nem helyezzük reklám mellé. A nyilvánvaló hibákat viszont kijavítjuk — egy kiesett szót, egy elrontott hivatkozást, egy bekezdést elnyelő jelölést — mindig afelé, amit maga a forrás nyomtat, soha nem afelé, amit szerintünk mondania kellene.',
	'colophon.countBible': 'bibliakiadás',
	'colophon.countDocuments': 'tanítóhivatali dokumentum',
	'colophon.privacyTitle': 'Adatvédelem',
	'colophon.privacyBody1':
		'Nincsenek fiókok, nincsenek sütik, nincs reklám, nincs harmadik féltől származó kód. Semmi nem követi Önt, ha elhagyja ezt az oldalt.',
	'colophon.privacyBody2':
		'Azt viszont mérjük, hogyan használják az oldalt: látogatásonként egy mérés, minden mező inkább tartomány, mint pontos érték — mennyi ideig maradt, milyen gyakran járt itt, mely műveket nyitotta meg. Az országát külön számoljuk, semmi nem köti össze a többivel. Ez egy látogatást ír le, nem egy látogatót, és {days} napig őrizzük meg.',
	'colophon.privacyBody3':
		'Soha nem küldjük el: amit a keresőmezőbe beír, melyik szakaszt nyitotta meg, vagy bármit, ami alapján az eszköze újra felismerhető lenne. A beállításai, könyvjelzői és letöltött szövegei az eszközén maradnak.',
	'colophon.copyrightTitle': 'Szerzői jog',
	'colophon.copyrightBody1':
		'A Katekizmus, a Kompendium és a tanítóhivatali dokumentumok a jogtulajdonosaik tulajdonát képezik — elsősorban a Libreria Editrice Vaticanáét és a Kommunikációs Dikasztériumét.',
	'colophon.copyrightBody2':
		'Minden mű megjeleníti a jogtulajdonosa saját szerzői jogi közleményét, az ő szavaival, és hivatkozik arra az oldalra, ahonnan származik.',
	'colophon.copyrightBody3':
		'Ha Ön jogot birtokol az itt közölt szövegek bármelyikén, és inkább nem szeretné, hogy megjelenjen, írjon nekünk.',
	'colophon.contactTitle': 'Kapcsolat',
	'colophon.contactBody': 'Bármiről, a fentieket is beleértve:',
	'colophon.contactPending':
		'Kapcsolattartási cím még nincs megadva. Ezt az oldalt addig nem szabad nyilvánossá tenni, amíg nincs — a fenti vállalás nem sokat ér, ha nincs mód elérni minket.',
	'colophon.illustrationsTitle': 'Az illusztrációk',
	'colophon.illustrationsBody':
		'A Biblia Gustave Doré metszeteit hordozza, mindegyiket annál a versnél, amelyet ábrázol — bibliai sorozatai közül az utolsó és a legnagyobb: rajzai nyomán fába metszették, és a szöveggel együtt nyomtatták, nem a kötet végére gyűjtve.',
	'colophon.illustrationsRights':
		'Közkincsek, amint az alábbi évszámok mutatják, és egy közkincs metszet hű fényképi másolata nem keletkeztet új szerzői jogot.',
	'colophon.countPlates': 'metszet',
	'colophon.countPlateChapters': 'illusztrált fejezet',
	'plates.scansBy': 'A beolvasásokat rendelkezésre bocsátotta:',
	'plates.enlarge': '{title} nagyítása',
	'plates.zoom': 'Nagyítás',
	'art.about': 'Erről a képről',
	'art.detail': 'részlet',
	'colophon.typeTitle': 'A betűk',
	'colophon.typeBody':
		'EB Garamonddal szedve, amely Georg Duffner és Octavio Pardo felújítása azokról a betűkről, amelyeket Claude Garamont metszett az 1590-es években — abban a humanista hagyományban, amelyben az Egyház a reneszánsz óta nyomtat. Cirill betűi ugyanattól a kéztől valók, de nem újítanak fel semmit: cirill Garamont soha nem metszettek, így az orosz szöveg olyan formával van szedve, amelyet a többi mellé rajzoltak.',
	'colophon.typeArabic':
		'Az arab teljesen kívül esik rajta, és Amiri betűvel van szedve — Khaled Hosny felújítása arról a naszh írásról, amelyet 1905-ben a kairói Búlák nyomdának metszettek; ugyanazzal a megfontolással választva, mint a kenyérbetűt: egy meghatározott történeti könyvbetű, nem pedig mai rajz.',
	'colophon.typeInitials':
		'A kezdőbetűk Pirata One betűvel készültek: ez egy gót betűtípus, amelynek nagybetűi olvashatók maradnak abban a méretben, amelyet az iniciálé megkíván — az oroszhoz pedig Ponomar, amely a Szinodális Nyomda egyházi szláv betűjét adja vissza. A Ponomar csak az iniciálét szedi, a szöveget soha: egy mai enciklika végig szinodális betűvel szedve valótlant állítana önmagáról. Mind SIL Open Font License alatt áll, és erről az oldalról érkezik, nem harmadik féltől, így egy oldal elolvasása senki más kiszolgálójától nem kér semmit.',
	'refs.citedIn': 'Idézi',
	'refs.externalVolume': '{volume}. kötet a(z) {host} oldalon — szkennelt PDF',
	'bible.wholeChapter': 'Ez a fejezet',
	'bible.verseNotInEdition':
		'Ez a versszám nincs meg ebben a kiadásban — lásd az oldal forrásában lévő megjegyzést',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Jegyzet',
	'bible.noteMissing': 'Ez a jegyzet hiányzik a korpuszból',
	'bible.chapterArgument': 'Tartalom',
	'ccc.readFullChapter': 'A teljes fejezet elolvasása',
	'ccc.noParagraphNumber': 'Ebben a korpuszban nincs szakaszszám',
	'copyright.sourceTitle': 'Az eredeti forrásoldal megnyitása',
	'copyright.sourceLabel': 'Forrás',
	'lang.label': 'Nyelv',
	'lang.filter': 'Nyelvek keresése',
	'lang.more': 'további nyelv',
	'notFound.title': 'Ezen a címen nincs semmi',
	'notFound.lede': 'A kért oldal nincs itt.',
	'notFound.body':
		'A hivatkozás elgépelt vagy elavult lehet, vagy olyan szövegre mutat, amelyet ez az oldal nem tartalmaz.',
	'notFound.searchHint':
		'Ha tudja, melyik helyet keresi — egy könyvet és fejezetet, a Katekizmus egy szakaszát —, írja be az oldal tetején lévő keresőmezőbe.',
	'notFound.credit': 'A British Library, Royal MS 10 E IV, f.\u200a49v nyom\u00e1n',
	'notFound.elsewhere': 'Vagy induljon el ezek egyikéről:',
	'notFound.home': 'Kezdőlap',
	'compare.enter': 'Kiadások összehasonlítása',
	'compare.exit': 'Összehasonlítás bezárása',
	'compare.missing': 'Ebben a kiadásban nem szerepel',
	'compare.versificationNote':
		'Ez a két kiadás helyenként eltérően osztja fel e fejezet verseit (szövegváltozat, nem fordítói döntés) — ugyanaz a versszám nem mindig ugyanazt a mondatot jelöli a két hasábban.',
	'compare.loading': 'A második nyelv betöltése…',
	'ui.close': 'Bezárás',
	'shortcuts.title': 'Billentyűparancsok',
	'shortcuts.betweenDocuments': 'Dokumentumok között',
	'shortcuts.withinDocument': 'A dokumentumon belül',
	'shortcuts.show': 'Lista megjelenítése',
	'help.title': 'Súgó',
	'help.top.heading': 'A sáv minden oldal tetején',
	'help.reading.heading': 'A szöveg fölötti sáv',
	'help.feature.search':
		'Írjon be egy hivatkozást a felső mezőbe — fejezetet és verset, egy pont számát, egy dokumentum nevét —, és gépelés közben kiegészíti.',
	'help.feature.offline':
		'Tegye ki az oldalt a kezdőképernyőre, és alkalmazásként nyílik meg. Egész műveket letölthet, hogy kapcsolat nélkül olvassa őket.',
	'help.feature.contents':
		'Annak a műnek a tagolása, amelyben van — könyvek, részek, fejezetek —, hogy mozogni tudjon benne anélkül, hogy visszatérne az elejére.',
	'help.feature.compare':
		'Ugyanannak a helynek két kiadása egymás mellett — a latin az Ön nyelve mellett, vagy egyik fordítás a másik mellett.',
	'help.feature.apparatus':
		'A kiadás saját jegyzetei és a szöveghez írt bármely magyarázat mellette jelenik meg, nem alatta. A szövegen belüli hivatkozások linkek, így egy utalás oda visz, ahová mutat.',
	'help.feature.focus':
		'Mindent eltüntet a szövegen kívül. A kiút ott marad, ahol a sáv volt, hogy semmi ne rekedjen mögötte.',
	'zen.enter': 'Fókusz mód',
	'zen.exit': 'Fókusz mód bezárása',
	'nav.calendar': 'Naptár',
	'calendar.title': 'Liturgikus naptár',
	'calendar.tagline':
		'Az Általános Római Naptár, bármely napra kiszámítva — az ideje, a rangja, a színe.',
	'calendar.calendar': 'Naptár',
	'calendar.which.general': 'Általános Római Naptár',
	'calendar.filter': 'Országok keresése',
	'calendar.region.europe': 'Európa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Közel-Kelet',
	'calendar.region.asia': 'Ázsia',
	'calendar.region.oceania': 'Óceánia',
	'calendar.today': 'Ma',
	'calendar.previousMonth': 'Előző hónap',
	'calendar.nextMonth': 'Következő hónap',
	'calendar.plainDays': 'Egyszerű köznapok',
	'calendar.noSuchDay': 'Arra a dátumra nem számítható liturgikus nap.',
	'calendar.week': 'hét',
	'calendar.alsoToday': 'Ma emellett ünnepeljük',
	'calendar.alsoObserved': 'Ma emellett megemlékezünk',
	'calendar.obligation': 'Parancsolt ünnep',
	'calendar.obligationCanon': 'CIC 1246. kán.',
	'calendar.sundayCycle': 'Vasárnapi ciklus',
	'calendar.weekdayCycle': 'Hétköznapi ciklus',
	'calendar.psalterWeek': 'Zsoltárhét',
	'lectionary.heading': 'A szentmise olvasmányai',
	'lectionary.slot.reading': 'Olvasmány',
	'lectionary.slot.reading1': 'Első olvasmány',
	'lectionary.slot.reading2': 'Második olvasmány',
	'lectionary.slot.reading3': 'Harmadik olvasmány',
	'lectionary.slot.reading4': 'Negyedik olvasmány',
	'lectionary.slot.reading5': 'Ötödik olvasmány',
	'lectionary.slot.reading6': 'Hatodik olvasmány',
	'lectionary.slot.reading7': 'Hetedik olvasmány',
	'lectionary.slot.psalm': 'Válaszos zsoltár',
	'lectionary.slot.epistle': 'Szentlecke',
	'lectionary.slot.acclamation': 'Evangélium előtti éneklés',
	'lectionary.slot.gospel': 'Evangélium',
	'lectionary.slot.sequence': 'Szekvencia',
	'lectionary.or': 'vagy',
	'lectionary.cf': 'Vö.',
	'lectionary.about': 'Az olvasmányokról',
	'lectionary.caveat':
		'A szakaszokat az Ordo Lectionum Missae jelöli ki, ennek az oldalnak a saját kiadásaihoz kapcsolva — nem az adott egyházban felolvasott fordítás, és egy püspöki konferencia módosíthatja a rendet.',
	'calendar.transferredFrom': 'Áthelyezve innen:',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Karácsonyi idő',
	'calendar.season.lent': 'Nagyböjt',
	'calendar.season.triduum': 'Szent Háromnap',
	'calendar.season.easter': 'Húsvéti idő',
	'calendar.season.ordinary': 'Évközi idő',
	'calendar.colour.white': 'Fehér',
	'calendar.colour.red': 'Piros',
	'calendar.colour.green': 'Zöld',
	'calendar.colour.violet': 'Lila',
	'calendar.colour.rose': 'Rózsaszín',
	'calendar.colour.black': 'Fekete',
	'calendar.colour.blue': 'Kék',
	'calendar.rank.solemnity': 'Főünnep',
	'calendar.rank.feast': 'Ünnep',
	'calendar.rank.memorial': 'Emléknap',
	'calendar.rank.optional-memorial': 'Szabadon választható emléknap',
	'calendar.rank.commemoration': 'Megemlékezés',
	'calendar.rank.sunday': 'Vasárnap',
	'calendar.rank.weekday': 'Köznap',
	'calendar.gloss.season.advent':
		'A karácsony előtti négy hét: készület az Úr eljövetelére és az egyházi év kezdete.',
	'calendar.gloss.season.christmas':
		'Karácsonytól Urunk megkeresztelkedéséig, az Úr születésének és a világ előtti megjelenésének ünneplése.',
	'calendar.gloss.season.lent':
		'A negyven nap hamvazószerdától az utolsó vacsora esti miséjéig: bűnbánat, alamizsna és készület a húsvétra.',
	'calendar.gloss.season.triduum':
		'A három nap nagycsütörtök estéjétől húsvétvasárnap estéjéig — az Úr szenvedése, halála és feltámadása, az egész év csúcsa.',
	'calendar.gloss.season.easter':
		'Az ötven nap húsvéttól pünkösdig, egyetlen ünnepként megülve — „egyetlen nagy vasárnap”.',
	'calendar.gloss.season.ordinary':
		'A harminchárom vagy harmincnégy hét a többi időszakon kívül. Nem „közönséges”, hanem rendezett: a heteket számozzák, és az Egyház folyamatosan olvassa az Úr életét és tanítását. Két szakaszban jön — a karácsonyi idő után nagyböjtig, és pünkösd után adventig.',
	'calendar.gloss.rank.solemnity':
		'A legmagasabb fokozat: húsvét, karácsony, mennybemenetel, egy hely védőszentje. Dicsőséggel és Hiszekeggyel ülik meg, és az előző este kezdődik.',
	'calendar.gloss.rank.feast':
		'Magán a napon belül ülik meg. Az apostolok és evangelisták, valamint az Úr és a Boldogságos Szűz nagyobb napjai.',
	'calendar.gloss.rank.memorial':
		'Egy szent, akiről a maga napján emlékeznek meg, az adott időszak miséjén és zsolozsmáján belül. Kötelező ott, ahol megülik.',
	'calendar.gloss.rank.optional-memorial':
		'Megülhető vagy nem, a pap vagy a közösség választása szerint. Ha nem ülik meg, a nap egyszerűen köznap.',
	'calendar.gloss.rank.commemoration':
		'Ami az emléknapból nagyböjtben lesz: egy könyörgés, amelyet a köznapi miséhez tesznek hozzá, amelyet az időszak egyébként érintetlenül hagy.',
	'calendar.gloss.rank.sunday':
		'Az eredeti ünnep — az Úr napja, a feltámadás óta minden héten megülve. Csak főünnep vagy az Úr ünnepe szoríthatja ki, adventben, nagyböjtben és a húsvéti időben pedig még azok sem.',
	'calendar.gloss.rank.weekday':
		'Nap saját ünneplés nélkül. A mise és a zsolozsma az időszaké — és éppen ez teszi az időszakot érdemessé a megismerésre.',
	'calendar.gloss.colour.white':
		'Öröm. Húsvéti és karácsonyi idő, az Úr napjai szenvedésén kívül, a Boldogságos Szűz, az angyalok és azok a szentek, akik nem voltak vértanúk.',
	'calendar.gloss.colour.red':
		'Vér és tűz. Virágvasárnap és nagypéntek, pünkösd, az apostolok és evangelisták, valamint a vértanúk.',
	'calendar.gloss.colour.green': 'Évközi idő: a remény és a növekvő dolgok színe.',
	'calendar.gloss.colour.violet':
		'Advent és nagyböjt, és viselik a halottakért mondott miséken is.',
	'calendar.gloss.colour.rose':
		'Évente kétszer viselik — Gaudete vasárnapján, advent harmadikán, és Laetare vasárnapján, nagyböjt negyedikén — ahol a böjt felderül és a vég már látszik.',
	'calendar.gloss.colour.black': 'Viselhető a halottakért mondott miséken.',
	'calendar.gloss.colour.blue':
		'A kék kiváltsága: a Szeplőtelen Fogantatás ünnepén viselik Spanyolországban, a Fülöp-szigeteken és azon a néhány más helyen, amelyeknek a Szentszék megadta.',
	'calendar.gloss.sundayCycle':
		'A vasárnapi olvasmányok három éven át futnak — A, B és C —, sorra olvasva Mátét, Márkot és Lukácsot, Jánossal nagyböjtben és a húsvéti időben. A ciklus advent első vasárnapján fordul, az egyházi évvel együtt.',
	'calendar.gloss.weekdayCycle':
		'A köznapi olvasmányok két éven át futnak, I és II: az első olvasmány változik, az evangélium nem. A liturgikus év arról a naptári évről kapja a nevét, amelyben véget ér — a páratlan évek I, a párosak II.',
	'calendar.gloss.psalterWeek':
		'A zsolozsma négy hétre osztja a zsoltárokat, I-től IV-ig, amelyek az év során ismétlődnek. Ez az a hét, amelynek zsoltárai a maiak, annak, aki a zsolozsmát végzi.',
	'calendar.gloss.obligation':
		'Nap, amelyen a hívek kötelesek részt venni a szentmisén, és tartózkodni azoktól a munkáktól, amelyek ezt megakadályoznák. Minden vasárnap, és a további napok, amelyeket az egyes püspöki konferenciák meghatároztak.',
	'calendar.primer.title': 'Először jár itt?',
	'calendar.primer.lead':
		'Az Egyház saját évet tart. Adventtel kezdődik, húsvét körül fordul, és minden napnak nevet, fokozatot és színt ad — ezek pedig eldöntik, mit imádkoznak és olvasnak azon a napon a szentmisén és a zsolozsmában. Így az „évközi huszonharmadik vasárnap” egy cím: megmondja a papnak, a kórusnak vagy bárkinek, aki otthon imádkozik, mely imádságok és olvasmányok tartoznak a mai naphoz.',
	'calendar.primer.seasons': 'Az időszakok',
	'calendar.primer.ranks': 'Mi lehet egy nap',
	'calendar.primer.colours': 'A színek',
	'calendar.primer.cycles': 'A ciklusok',
	'calendar.primer.cyclesLead':
		'Három számláló, amelyek együtt megmondják, mely olvasmányok és zsoltárok vannak mára rendelve.'
};
