/**
 * Hrvatski UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 5 editions in Hrvatski and its readers were reading
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

export const hr: Dictionary = {
	'nav.bible': 'Biblija',
	'nav.ccc': 'Katekizam',
	'nav.compendium': 'Kompendij',
	'nav.magisterium': 'Učiteljstvo',
	'nav.socialDoctrine': 'Socijalni nauk',
	'socialDoctrine.landing.title': 'Kompendij socijalnog nauka Crkve',
	'socialDoctrine.landing.tagline': 'Što Crkva uči o životu u društvu, u 583 broja.',
	'nav.canonLaw': 'Kanonsko pravo',
	'canonLaw.landing.title': 'Zakonik kanonskoga prava',
	'canonLaw.landing.tagline': 'Pravo latinske Crkve u 1752 kanona u sedam knjiga.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kann.',
	'canonLaw.prevCanon': 'Prethodni kanon',
	'canonLaw.nextCanon': 'Sljedeći kanon',
	'canonLaw.readFullTitle': 'Pročitaj cijeli naslov',
	'canonLaw.superseded': 'Tekst zamijenjen aktom',
	'nav.prayers': 'Molitve',
	'nav.bookmarks': 'Oznake',
	'nav.menu': 'Izbornik',
	'nav.sections': 'Odjeljci',
	'nav.works': 'Djela',
	'nav.pages': 'Stranice',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Nastavi čitati',
	'home.tagline':
		'Stranica za čitanje Pisma, Katekizma i dokumenata Učiteljstva — besplatno, radi i izvan mreže, i nema se za što registrirati.',
	'home.doors.heading': 'Kamo poći',
	'home.find.heading': 'Ili upišite navod',
	'nav.library': 'Knjižnica',
	'nav.learn': 'Učenje',
	'library.landing.tagline':
		'Cijeli korpus, polica po polica — s mjestom na kojem ste stali i onim što ste označili.',
	'schola.landing.title': 'Odakle početi',
	'schola.landing.tagline':
		'Kratak vodič kroz ono što je ovdje: što je svaka od ovih knjiga, kako se piše navod za nju, kako naći mjesto, i redoslijedi čitanja koje je Crkva predložila.',
	'schola.start.heading': 'Novi u katoličanstvu?',
	'schola.start.body': 'Najbolji je početak ',
	'schola.start.bodyAfter':
		': isti nauk kao u Katekizmu, mnogo kraći, pisan u pitanjima i odgovorima. Otprilike je desetinu duljine i ništa ne pretpostavlja.',
	'schola.bible.heading': 'Nikada niste čitali Bibliju?',
	'schola.bible.library':
		'Nije jedna knjiga nego sedamdeset i tri, pisane kroz više od tisuću godina i uvezane redom koji je Crkva ustalila — ne redom kojim su se stvari zbile, ni onim koji se najlakše čita. Većina počne na prvoj stranici i prestane nekoliko tjedana poslije, usred dugoga poglavlja drevnoga zakona, jer im nitko još nije rekao čemu to služi.',
	'schola.bible.step.gospel': 'Počnite evanđeljem',
	'schola.bible.start':
		'Jedna od četiri kratke knjige o Isusovu životu, duboko unutra a ne sprijeda. Nije to naša zamisao: sabor Crkve tražio je da se poučava pravilna uporaba Pisma, „osobito Novoga zavjeta i prije svega evanđelja“. Nijedno nije imenovao posebno, pa nećemo ni mi.',
	'schola.bible.whichGospel':
		'Tri se obično predlažu, iz triju različitih razloga. Bilo koje od njih dobro je mjesto na kojem biti.',
	'schola.bible.gospel.mark':
		'Najkraće. Možete ga pročitati cijelo u jedno poslijepodne, a dovršiti jedno na početku vrijedi više nego izabrati najbolje.',
	'schola.bible.gospel.luke':
		'Napisano za nekoga izvan vjere tko je htio priču zapisanu redom — što možete biti upravo vi. Nastavlja se ravno u Djela apostolska, pa je zapravo prva polovica dulje knjige.',
	'schola.bible.gospel.john':
		'Ono koje otvoreno kaže zašto je napisano: „da vjerujete“. Jednostavne riječi, i ide ravno na pitanje tko je Isus.',
	'schola.bible.step.acts': 'Zatim što se dogodilo poslije',
	'schola.bible.thenActs':
		'Kad dovršite jedno, pročitajte što su, nakon njegova odlaska, učinili oni koji su ga poznavali.',
	'schola.bible.acts.why':
		'Trideset godina nakon svršetka evanđelja: nekoliko desetaka uplašenih ljudi, i kako je ono što su vidjeli doprlo do drugoga kraja carstva.',
	'schola.bible.step.old': 'Zatim starija polovica',
	'schola.bible.thenOld':
		'Ne od prve stranice, i ne cijela. Nekoliko mjesta nosi pripovijest, i upravo su to ona na koja se evanđelja neprestano vraćaju.',
	'schola.bible.ot.beginnings': 'Kako počinje i kako pođe po zlu.',
	'schola.bible.ot.promise': 'Jedna obitelj i obećanje dano njoj koje nadživi sve u njoj.',
	'schola.bible.ot.exodus': 'Narod izveden iz ropstva i zakon dan mu da po njemu živi.',
	'schola.bible.ot.psalms':
		'Nije pripovijest: sto pedeset molitava i pjesama. Čitajte po jedan, bilo kojim redom. Crkva ih i danas moli svaki dan.',
	'schola.bible.bothWays':
		'Prepoznavat ćete stvari, i u tome je smisao, a nije slučajnost. Crkva čita starije knjige u svjetlu Kristovu a novije u svjetlu onoga što je bilo prije — svaka polovica objašnjava drugu, i zato se nijedna ne čita sama.',
	'schola.books.heading': 'Što je ovdje i kako se određuje',
	'schola.books.lede':
		'Svaka je od ovih knjiga druge vrste, i na svaku se upućuje vlastitim brojem. Primjeri pokazuju oblik: upišite takav u okvir za traženje i stižete na mjesto.',
	'schola.cite.label': 'Određuje se',
	'schola.what.scripture':
		'Pismo kako ga Crkva prima, u oba Zavjeta. Sve ostalo ovdje čita se u njegovu svjetlu.',
	'schola.cite.scripture': 'knjiga, poglavlje i redak, u kraticama koje tiska vaše izdanje',
	'schola.what.catechism':
		'Sažetak onoga u što Katolička Crkva vjeruje, u jednom svesku. Sam nije vrelo: prikuplja Pismo, oce, bogoslužje i nauk Crkve, i svaki broj kaže odakle dolazi ono što tvrdi.',
	'schola.cite.catechism': 'po broju, koji teče neprekinuto od prve stranice do posljednje',
	'schola.what.compendium':
		'Isti nauk izložen u pitanjima i odgovorima, otprilike u desetini duljine.',
	'schola.cite.compendium': 'po broju pitanja',
	'schola.what.magisterium':
		'Ono što su pape i sabori doista napisali — enciklike, konstitucije, dekreti, deklaracije — svaki upravljen određenom trenutku i određenom pitanju. Svaki je poznat po svojim početnim latinskim riječima.',
	'schola.cite.magisterium': 'po imenu dokumenta, zatim broju odjeljka u njemu',
	'schola.what.social':
		'Nauk Crkve o radu, vlasništvu, obitelji, politici i miru, prikupljen iz tih dokumenata u jednu knjigu.',
	'schola.cite.social': 'po broju, pod kraticom kojom se djelo samo označuje',
	'schola.what.law': 'Pravo a ne nauk. Kaže što Crkva traži, i mijenja se.',
	'schola.cite.law': 'po kanonu, kako se zovu njegove brojčane jedinice',
	'schola.what.doctors':
		'Bogoslovi koje je Crkva proglasila naučiteljima. Ne nosi nikakvu službenu vlast, koliko god velik bio pisac.',
	'schola.cite.doctors': 'po dijelu, zatim pitanju — vlastitim podjelama Sume',
	'schola.what.prayers': 'Riječi kojima se Crkva moli, s latinskim uz njih.',
	'schola.cite.prayers': 'po imenu; nema brojeva za navođenje',
	'schola.places.heading': 'Ne tekstovi, nego mjesta na ovoj stranici',
	'schola.what.library': 'Sva djela stranice u jednom popisu, skupljena po predmetu a ne po vrsti.',
	'schola.what.calendar':
		'Bogoslužni dan — vrijeme, boja i tko se slavi — za zemlju čiji kalendar slijedite.',
	'schola.what.bookmarks':
		'Mjesta koja ste označili, i gdje ste posljednji put stali u svakom djelu. Oboje ostaje u ovom pregledniku i ne šalje se nikamo.',
	'ccc.noCounterpart': 'Nema odgovarajućeg mjesta u drugom djelu',
	'jumpbox.placeholder': 'Idi na… (npr. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Traži',
	'jumpbox.hint': 'Pritisnite / ili Ctrl+K za skok na navod',
	'jumpbox.noMatch': 'Nema pogodaka',
	'jumpbox.suggestions': 'Prijedlozi',
	'settings.label': 'Postavke',
	'apparatus.label': 'Aparat',
	'apparatus.editionNotes': 'Bilješke ovog izdanja',
	'apparatus.commentary': 'Komentar',
	'apparatus.inCommentary': 'Uključeno u komentar iznad.',
	'darkMode.label': 'Tamni način',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Uključeno',
	'darkMode.off': 'Isključeno',
	'sepia.label': 'Sepija',
	'sepia.lightOnly': 'Samo u svijetlom načinu',
	'sepia.noHue': 'Nije dostupno u jednobojnom prikazu',
	'oled.label': 'OLED crna',
	'oled.darkOnly': 'Samo u tamnom načinu',
	'mono.label': 'Jednobojno',
	'mono.hint':
		'Postavlja cijelu stranicu u jednu nijansu sive, tako da se ništa ne razlikuje bojom. Sepija se isključuje dok je ovo uključeno.',
	'advanced.label': 'Napredno',
	'library.title': 'Knjižnica izvan mreže',
	'library.lede': 'Tekstovi pohranjeni na ovom uređaju otvaraju se posve bez veze.',
	'library.essentials': 'Molitve i Kompendij',
	'library.illustrations': 'Biblija (ilustracije)',
	'library.illustrationsDetail': 'Biblija (ilustracije, visoka razlučivost)',
	'library.other': 'Ostali tekstovi',
	'library.everything': 'Sve',
	'library.downloadAll': 'Preuzmi sve',
	'library.download': 'Preuzmi',
	'library.downloaded': 'Na ovom uređaju',
	'library.offlineNote': 'Isključite način rada bez mreže da biste išta preuzeli.',
	'library.remove': 'Ukloni s ovog uređaja',
	'library.removeConfirm': 'Ukloniti?',
	'library.forget': 'Ukloni preuzimanja',
	'library.forgetConfirm': 'Ukloniti sve?',
	'offline.label': 'Način rada bez mreže',
	'offline.hint':
		'Uopće ne koristi mrežu: ništa se ne preuzima, ne provjeravaju se nadopune, ništa se ne mjeri. Otvaraju se samo tekstovi koji su već na ovom uređaju.',
	'offline.notDownloaded': 'Nije na ovom uređaju',
	'loadFailed.title': 'To se nije učitalo',
	'loadFailed.hint':
		'Stranica postoji — nešto je pošlo po zlu pri njezinu dohvaćanju. Ponovni pokušaj obično uspije.',
	'loadFailed.retry': 'Pokušaj ponovno',
	'loadFailed.retrying': 'Pokušavam…',
	'offline.turnOff': 'Isključi način rada bez mreže',
	'type.label': 'Veličina teksta i pismo',
	'fontSize.label': 'Veličina teksta',
	'fontSize.small': 'Mali',
	'fontSize.medium': 'Srednji',
	'fontSize.large': 'Veliki',
	'fontSize.xlarge': 'Vrlo velik',
	'face.label': 'Pismo',
	'face.serif': 'Serifno',
	'face.sans': 'Bezserifno',
	'print.label': 'Ispiši ovu stranicu',
	'toTop.label': 'Natrag na vrh',
	'install.label': 'Instaliraj Glossu',
	'install.hint.label': 'Dodaj na početni zaslon',
	'install.hint.title': 'Dodaj Glossu na svoj početni zaslon',
	'install.hint.stepBefore': 'Otvara se kao aplikacija i čita se bez mreže. Dodirnite',
	'install.hint.stepAfter': 'a zatim „Dodaj na početni zaslon“.',
	'install.hint.dismiss': 'Odbaci',
	'update.label': 'Dostupno je novo izdanje',
	'update.title': 'Novo izdanje je spremno',
	'update.body': 'Ponovno učitajte stranicu za najnovije tekstove i ispravke.',
	'update.action': 'Ponovno učitaj',
	'update.dismiss': 'Ne sada',
	'edition.label': 'Izdanje',
	'edition.select': 'Odaberi izdanje',
	'edition.current': 'Trenutno izdanje',
	'edition.filter': 'Traži izdanja',
	'menu.noMatches': 'Nema pogodaka',
	'unitNav.previous': 'Prethodno',
	'unitNav.next': 'Sljedeće',
	'bible.prevChapter': 'Prethodno poglavlje',
	'bible.nextChapter': 'Sljedeće poglavlje',
	'bible.pickBook': 'Knjige i poglavlja',
	'bible.landing.title': 'Biblija',
	'bible.landing.tagline': 'Čitajte cijelu Bibliju, knjigu po knjigu, poglavlje po poglavlje.',
	'bible.landing.random': 'Iznenadi me',
	'bible.landing.books': 'Knjige',
	'bible.chapterUnavailable': 'Nije dostupno u ovom izdanju',
	'bible.introduction': 'Uvod',
	'bible.introUnavailable': 'Uvod još nije dostupan na ovom jeziku',
	'bible.introSource': 'Uvodi nisu dio biblijskog teksta.',
	'bible.testament.ot': 'Stari zavjet',
	'bible.testament.nt': 'Novi zavjet',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Petoknjižje',
	'bible.group.historical': 'Povijesne knjige',
	'bible.group.wisdom': 'Mudrosne knjige',
	'bible.group.prophetic': 'Proročke knjige',
	'bible.group.gospels': 'Evanđelja',
	'bible.group.acts': 'Djela apostolska',
	'bible.group.pauline': 'Pavlove poslanice',
	'bible.group.catholicLetters': 'Katoličke poslanice',
	'bible.group.revelation': 'Otkrivenje',
	'ccc.prevParagraph': 'Prethodni odlomak',
	'ccc.nextParagraph': 'Sljedeći odlomak',
	'ccc.inBrief': 'Ukratko',
	'ccc.landing.title': 'Katekizam Katoličke Crkve',
	'ccc.landing.pairTitle': 'Katekizam i Kompendij',
	'ccc.landing.tagline':
		'<strong>Katekizam</strong> izlaže katolički nauk u 2865 numeriranih odlomaka. <strong>Kompendij</strong> isti nauk donosi kao 598 pitanja i odgovora, prema istom rasporedu.',
	'ccc.landing.pairTagline':
		'Katekizam Katoličke Crkve u 2865 brojeva i njegov Kompendij u 598 pitanja.',
	'ccc.tableOfContents': 'Sadržaj',
	'ccc.related': 'Vidi također',
	'compendium.landing.title': 'Kompendij Katekizma',
	'compendium.landing.tagline': 'Pitanja i odgovori koji sažimlju Katekizam Katoličke Crkve.',
	'compendium.question': 'Pitanje',
	'compendium.answer': 'Odgovor',
	'compendium.tableOfContents': 'Sadržaj',
	'compendium.prevQuestion': 'Prethodno pitanje',
	'compendium.nextQuestion': 'Sljedeće pitanje',
	'compendium.condenses': 'Sažimlje KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'ccc.condensedIn': 'U Kompendiju',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'U ovom korpusu nema broja pitanja',
	'document.library.tagline':
		'Enciklike, koncilske konstitucije, dekreti i deklaracije Učiteljstva.',
	'document.filter.heading': 'Filtar',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Vrsta',
	'document.filter.subject': 'Tema',
	'document.filter.search': 'Pretraži dokumente',
	'document.filter.clear': 'Poništi',
	'document.filter.results': 'Prikazani dokumenti',
	'document.filter.noResults': 'Nijedan dokument ne odgovara ovim filtrima.',
	'document.tableOfContents': 'Sadržaj',
	'document.startReading': 'Počni čitati',
	'document.readFullDocument': 'Pročitaj cijeli dokument',
	'document.section': 'Odjeljak',
	'document.prevSection': 'Prethodno',
	'document.nextSection': 'Sljedeće',
	'document.kind.conciliarConstitution': 'Konstitucija',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Deklaracija',
	'document.kind.encyclical': 'Enciklika',
	'document.kind.apostolicExhortation': 'Apostolska pobudnica',
	'document.kind.apostolicConstitution': 'Apostolska konstitucija',
	'document.kind.cdfDeclaration': 'Deklaracija Kongregacije za nauk vjere',
	'document.kind.cdfInstruction': 'Uputa Kongregacije za nauk vjere',
	'document.kind.cdfLetter': 'Pismo Kongregacije za nauk vjere',
	'document.kind.cdfDoctrinalNote': 'Doktrinarna nota Kongregacije za nauk vjere',
	'document.kind.cdfResponsum': 'Responsum Kongregacije za nauk vjere',
	'document.kind.cdfConsiderations': 'Razmatranja Kongregacije za nauk vjere',
	'document.kindPlural.conciliarConstitution': 'Konstitucije',
	'document.kindPlural.conciliarDecree': 'Dekreti',
	'document.kindPlural.conciliarDeclaration': 'Deklaracije',
	'document.kindPlural.encyclical': 'Enciklike',
	'document.kindPlural.apostolicExhortation': 'Apostolske pobudnice',
	'document.kindPlural.apostolicConstitution': 'Apostolske konstitucije',
	'document.kindPlural.cdfDeclaration': 'Deklaracije Kongregacije za nauk vjere',
	'citation.unavailable': 'Izvorni tekst za ovu bilješku nije dostupan.',
	'doctores.landing.title': 'Naučitelji Crkve',
	'doctores.landing.tagline': 'Teološka djela crkvenih otaca i naučitelja Crkve.',
	'summa.landing.title': 'Suma teologije',
	'summa.landing.tagline': 'Toma Akvinski, na engleskom i na latinskom kojim je pisao.',
	'summa.tableOfContents': 'Sadržaj',
	'summa.part': 'Dio',
	'summa.question': 'Pitanje',
	'summa.article': 'Članak',
	'summa.questionShort': 'Pit.',
	'summa.articleShort': 'Čl.',
	'summa.titleFromEdition': 'Naslov iz izdanja na jeziku {lang}',
	'summa.titlesFromEdition': 'Naslovi iz izdanja na jeziku {lang} — ovo ih ne donosi',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Prigovor',
	'summa.sedContra': 'Naprotiv',
	'summa.corpus': 'Odgovaram',
	'summa.reply': 'Odgovor na prigovor',
	'summa.preamble': 'Napomena',
	'summa.prevQuestion': 'Prethodno pitanje',
	'summa.nextQuestion': 'Sljedeće pitanje',
	'summa.noEditionInYourLanguage':
		'Summa nema izdanje na vašem jeziku. Prikazano na jeziku {lang}.',
	'summa.noLatinSupplement':
		'Dodatak postoji samo na engleskom jeziku — sastavljen je nakon Akvinčeve smrti.',
	'index.division': 'Dioba',
	'index.showSubsections': 'Prikaži pododjeljke',
	'index.hideSubsections': 'Sakrij pododjeljke',
	'prayers.landing.title': 'Uobičajene molitve',
	'prayers.landing.tagline': 'Molitve s latinskim tekstom uz njih.',
	'prayers.tableOfContents': 'Sadržaj',
	'prayers.gloss.versicle':
		'Redak koji sam izgovara ili pjeva onaj tko predvodi molitvu; zajednica mu odgovara odgovorom koji slijedi.',
	'prayers.gloss.response':
		'Redak koji zajednica izgovara ili pjeva zajedno, odgovarajući na redak predvoditelja prije njega.',
	'prayers.seeAlso': 'Vidi također',
	'prayers.prevPrayer': 'Prethodna molitva',
	'prayers.nextPrayer': 'Sljedeća molitva',
	'prayers.rosary.today': 'Danas',
	'prayers.rosary.todayHeading': 'Današnja otajstva',
	'prayers.rosary.openingPrayer': 'Početna molitva',
	'prayers.rosary.decadePrayers': 'Molitve desetice',
	'ref.tooltip.loading': 'Učitavanje…',
	'ref.tooltip.openCcc': 'Otvori u Katekizmu',
	'ref.tooltip.openBible': 'Otvori u Bibliji',
	'ref.tooltip.openCompendium': 'Otvori u Kompendiju',
	'ref.preview.open': 'Otvori',
	'ref.cf': 'usp.',
	'anchor.actions': 'Radnje nad navodom',
	'anchor.copy': 'Kopiraj tekst',
	'anchor.copyLink': 'Kopiraj poveznicu',
	'anchor.view': 'Prikaži',
	'anchor.copied': 'Kopirano',
	'anchor.copyFailed': 'Kopiranje nije uspjelo',
	'bookmark.add': 'Označi',
	'bookmark.remove': 'Ukloni oznaku',
	'bookmark.library': 'Oznake',
	'bookmark.library.tagline': 'Sve što ste označili dok ste čitali.',
	'bookmark.empty': 'Još ništa nije označeno.',
	'bookmark.emptyHint':
		'Kliknite na broj retka ili odlomka i odaberite Označi, ili se poslužite gumbom za oznaku na stranici.',
	'bookmark.about': 'O ovim oznakama',
	'bookmark.deviceOnly':
		'Oznake se čuvaju samo u ovom pregledniku. Nikamo se ne šalju, a brisanje podataka preglednika ih uklanja.',
	'bookmark.unavailable': 'Nema toga u izdanju koje čitate',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Što je ova stranica, odakle dolaze njezini tekstovi i kakav je naš stav o njihovu reproduciranju.',
	'colophon.whatThisIs': 'Što je ovo',
	'colophon.whatThisIsBody':
		'Glossa Catholica je stranica za čitanje Pisma, Katekizma, Kompendija i dokumenata Učiteljstva, na engleskom, portugalskom i latinskom. Postoji da bi se čitala, i ništa se drugo od vas ne traži da biste je čitali:',
	'colophon.pointFree':
		'Besplatno, i uvijek besplatno. Nema plaćenog zida, nema pretplate, nema ničega za kupiti.',
	'colophon.pointNoAds': 'Nema oglašavanja ni sponzoriranog postavljanja bilo koje vrste.',
	'colophon.pointNoAccounts': 'Nema računa. Nema se za što registrirati, nema se na što prijaviti.',
	'colophon.pointNoTracking':
		'Nema skripti za praćenje, nema koda trećih strana, nema kolačića. Samo anonimna brojanja upotrebe, bez ičega što vas identificira.',
	'colophon.pointOffline':
		'Napravljena da nastavi raditi izvan mreže nakon što ste je posjetili, kako slaba veza ne bi morala biti prepreka čitanju.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica privatni je pothvat vjernika laika. Nema nikakvo crkveno odobrenje i ne govori nikakvom vlastitom vlašću.',
	'footer.notEndorsed': 'Bez odobrenja Svete Stolice',
	'colophon.textsTitle': 'Tekstovi',
	'colophon.textsBody':
		'Svaki tekst dolazi iz imenovanog izvora, a svako djelo bilježi svoje izdanje, svoju izvornu stranicu i datum kada je preuzeto. Pismo koristi prijevode u javnom vlasništvu; Katekizam, Kompendij i dokumenti Učiteljstva dolaze iz vlastitih objavljenih tekstova Svete Stolice.',
	'colophon.textsFidelity':
		'Tekst se nikada ne skraćuje, nikada ne parafrazira, nikada ne prepisuje i nikada ne stavlja uz oglase. Očite nedostatke ipak popravljamo — ispalu riječ, iskvaren navod, oznake koje su progutale odlomak — uvijek prema onome što izvor sam tiska, nikada prema onome što mislimo da bi trebao reći.',
	'colophon.countBible': 'izdanja Biblije',
	'colophon.countDocuments': 'dokumenata Učiteljstva',
	'colophon.privacyTitle': 'Privatnost',
	'colophon.privacyBody1':
		'Nema računa, nema kolačića, nema oglašavanja, nema koda trećih strana. Ništa ovdje ne prati vas izvan ove stranice.',
	'colophon.privacyBody2':
		'Brojimo kako se stranica koristi: jedno mjerenje po posjetu, svako polje raspon a ne točna vrijednost — koliko ste dugo ostali, koliko ste često ovdje bili, koja ste djela otvorili. Vaša se zemlja broji zasebno, bez ičega što je povezuje s ostatkom. To opisuje posjet, a ne posjetitelja, i čuva se {days} dana.',
	'colophon.privacyBody3':
		'Nikada se ne šalje: ono što upišete u okvir za traženje, koji ste odlomak imali otvoren, ili išta što bi moglo ponovno prepoznati vaš uređaj. Vaše postavke, oznake i preuzeti tekstovi ostaju na vašem uređaju.',
	'colophon.copyrightTitle': 'Autorska prava',
	'colophon.copyrightBody1':
		'Katekizam, Kompendij i dokumenti Učiteljstva vlasništvo su svojih nositelja prava — ponajprije Libreria Editrice Vaticana i Dikasterija za komunikaciju.',
	'colophon.copyrightBody2':
		'Svako djelo prikazuje vlastitu obavijest o autorskim pravima svojega nositelja prava, njegovim riječima, i povezuje na stranicu s koje je preuzeto.',
	'colophon.copyrightBody3':
		'Ako držite prava na bilo koji ovdašnji tekst i radije ne biste da bude objavljen, pišite nam.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Za bilo što, uključujući gore navedeno:',
	'colophon.contactPending':
		'Kontaktna adresa još nije postavljena. Ova stranica ne bi smjela biti objavljena dok je nema — obveza iznad nema smisla bez načina da nas se dosegne.',
	'colophon.illustrationsTitle': 'Ilustracije',
	'colophon.illustrationsBody':
		'Biblija nosi gravure Gustavea Doréa, svaku smještenu uz redak koji prikazuje — posljednji i najveći od njegovih biblijskih ciklusa, rezan u drvu prema njegovim crtežima i tiskan uz tekst, a ne skupljen na kraju.',
	'colophon.illustrationsRights':
		'U javnom su vlasništvu, kako pokazuju datumi niže, a vjerna fotografska reprodukcija gravure u javnom vlasništvu ne nosi nikakvo novo vlastito autorsko pravo.',
	'colophon.countPlates': 'gravura',
	'colophon.countPlateChapters': 'ilustriranih poglavlja',
	'plates.scansBy': 'Skenovi ljubaznošću',
	'plates.enlarge': 'Povećaj {title}',
	'plates.zoom': 'Zumiraj',
	'art.about': 'O ovoj slici',
	'art.detail': 'isječak',
	'colophon.typeTitle': 'Slova',
	'colophon.typeBody':
		'Slog je u pismu EB Garamond, obnovi Georga Duffnera i Octavija Parda slova koja je Claude Garamont rezao 1590-ih — humanističke tradicije u kojoj Crkva tiska od renesanse. Njegova je ćirilica istih ruku, ali ne obnavlja ništa: garamondovska ćirilica nikada nije bila rezana, pa je ruski složen oblikom nacrtanim da stoji uz ostalo.',
	'colophon.typeArabic':
		'Arapski je posve izvan njegova dosega i složen je u pismu Amiri — obnovi Khaleda Hosnyja naskha rezanog za tiskaru Bulaq u Kairu 1905., odabranoj po istom razlogu kao i tekstovno pismo: određeno povijesno knjižno pismo, a ne suvremeni crtež.',
	'colophon.typeInitials':
		'Početna su slova Pirata One, gotičko pismo čije verzalne ostaju čitljive u veličini koju inicijal traži, i — za ruski — Ponomar, koje reproducira crkvenoslavensko pismo Sinodalne tiskare. Ponomar slaže inicijal, a nikada tekst: moderna enciklika složena cijela u sinodalnom pismu rekla bi nešto neistinito o tome što jest. Sva su licencirana pod SIL Open Font License i posluživana s ove stranice, a ne od treće strane, tako da čitanje stranice ne traži ništa od tuđeg poslužitelja.',
	'refs.citedIn': 'Navedeno u',
	'refs.externalVolume': 'Svezak {volume} na {host} — skenirani PDF',
	'bible.wholeChapter': 'Ovo poglavlje',
	'bible.verseNotInEdition':
		'Ovaj broj retka nije u ovom izdanju — pogledajte bilješku u izvoru stranice',
	'bible.verseAbbrev': 'r.',
	'bible.note': 'Bilješka',
	'bible.noteMissing': 'Ova bilješka nedostaje u korpusu',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Pročitaj cijelo poglavlje',
	'ccc.noParagraphNumber': 'Bez broja odlomka u ovom korpusu',
	'copyright.sourceTitle': 'Otvori izvornu stranicu',
	'copyright.sourceLabel': 'Izvor',
	'lang.label': 'Jezik',
	'lang.filter': 'Traži jezike',
	'lang.more': 'još jezika',
	'notFound.title': 'Ovdje nema ničega',
	'notFound.lede': 'Stranica koju tražite ovdje ne postoji.',
	'notFound.body':
		'Poveznica je možda pogrešno upisana ili zastarjela, ili upućuje na tekst koji ova stranica ne sadrži.',
	'notFound.searchHint':
		'Ako znate navod koji tražite — knjigu i poglavlje, broj odlomka Katekizma — upišite ga u okvir za traženje na vrhu ove stranice.',
	'notFound.credit': 'Prema British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Ili počnite od jednog od ovih:',
	'notFound.home': 'Početna',
	'compare.enter': 'Usporedi izdanja',
	'compare.exit': 'Izađi iz usporedbe',
	'compare.missing': 'Nije prisutno u ovom izdanju',
	'compare.versificationNote':
		'Ova dva izdanja mjestimice drukčije dijele retke ovog poglavlja (tekstovna varijanta, a ne prevoditeljski izbor) — isti broj retka ne označuje uvijek istu rečenicu u oba stupca.',
	'compare.loading': 'Učitavanje drugog jezika…',
	'ui.close': 'Zatvori',
	'shortcuts.title': 'Tipkovnički prečaci',
	'shortcuts.betweenDocuments': 'Između dokumenata',
	'shortcuts.withinDocument': 'Unutar dokumenta',
	'shortcuts.show': 'Prikaži ovaj popis',
	'help.title': 'Pomoć',
	'help.top.heading': 'Traka na vrhu svake stranice',
	'help.reading.heading': 'Traka iznad teksta',
	'help.feature.search':
		'Upišite navod u okvir na vrhu — poglavlje i redak, broj odlomka, ime dokumenta — i dovršava ga dok tipkate.',
	'help.feature.offline':
		'Dodajte stranicu na početni zaslon i otvara se kao aplikacija. Cijela djela možete preuzeti i čitati bez veze.',
	'help.feature.contents':
		'Podjele djela u kojem ste — knjige, dijelovi, poglavlja — da se krećete unutar njega bez vraćanja na početak.',
	'help.feature.compare':
		'Dva izdanja istoga mjesta jedno uz drugo — latinski uz vaš vlastiti jezik, ili jedan prijevod uz drugi.',
	'help.feature.apparatus':
		'Vlastite bilješke izdanja i svaki komentar napisan uz tekst nude se pokraj njega, a ne ispod. Navodi unutar teksta su poveznice, pa uputnica vodi onamo kamo pokazuje.',
	'help.feature.focus':
		'Ukloni sve osim teksta. Izlaz ostaje gdje je bila traka, da ništa ne ostane zarobljeno iza nje.',
	'zen.enter': 'Način fokusa',
	'zen.exit': 'Izađi iz načina fokusa',
	'nav.calendar': 'Kalendar',
	'calendar.title': 'Liturgijski kalendar',
	'calendar.tagline':
		'Opći rimski kalendar, izračunan za bilo koji dan — njegovo vrijeme, njegov stupanj, njegova boja.',
	'calendar.calendar': 'Kalendar',
	'calendar.which.general': 'Opći rimski kalendar',
	'calendar.filter': 'Traži zemlje',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerike',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Bliski istok',
	'calendar.region.asia': 'Azija',
	'calendar.region.oceania': 'Oceanija',
	'calendar.today': 'Danas',
	'calendar.previousMonth': 'Prethodni mjesec',
	'calendar.nextMonth': 'Sljedeći mjesec',
	'calendar.plainDays': 'Obične ferije',
	'calendar.noSuchDay': 'Za taj datum ne računa se nijedan liturgijski dan.',
	'calendar.week': 'tjedan',
	'calendar.alsoToday': 'Danas se slavi i',
	'calendar.alsoObserved': 'Danas pada i',
	'calendar.obligation': 'Zapovijedani blagdan',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Nedjeljni ciklus',
	'calendar.weekdayCycle': 'Ferijalni ciklus',
	'calendar.psalterWeek': 'Tjedan psaltira',
	'lectionary.heading': 'Čitanja na misi',
	'lectionary.slot.reading': 'Čitanje',
	'lectionary.slot.reading1': 'Prvo čitanje',
	'lectionary.slot.reading2': 'Drugo čitanje',
	'lectionary.slot.reading3': 'Treće čitanje',
	'lectionary.slot.reading4': 'Četvrto čitanje',
	'lectionary.slot.reading5': 'Peto čitanje',
	'lectionary.slot.reading6': 'Šesto čitanje',
	'lectionary.slot.reading7': 'Sedmo čitanje',
	'lectionary.slot.psalm': 'Otpjevni psalam',
	'lectionary.slot.epistle': 'Poslanica',
	'lectionary.slot.acclamation': 'Pjesma prije evanđelja',
	'lectionary.slot.gospel': 'Evanđelje',
	'lectionary.slot.sequence': 'Sekvencija',
	'lectionary.or': 'ili',
	'lectionary.cf': 'Usp.',
	'lectionary.about': 'O ovim čitanjima',
	'lectionary.caveat':
		'Odlomci propisani Redom čitanja na misi (Ordo Lectionum Missae), povezani s vlastitim izdanjima ove stranice — a ne prijevod koji se proglašuje u pojedinoj crkvi, a biskupska konferencija može prilagoditi raspored.',
	'calendar.transferredFrom': 'Premješteno s',
	'calendar.season.advent': 'Došašće',
	'calendar.season.christmas': 'Božićno vrijeme',
	'calendar.season.lent': 'Korizma',
	'calendar.season.triduum': 'Vazmeno trodnevlje',
	'calendar.season.easter': 'Vazmeno vrijeme',
	'calendar.season.ordinary': 'Vrijeme kroz godinu',
	'calendar.colour.white': 'Bijela',
	'calendar.colour.red': 'Crvena',
	'calendar.colour.green': 'Zelena',
	'calendar.colour.violet': 'Ljubičasta',
	'calendar.colour.rose': 'Ružičasta',
	'calendar.colour.black': 'Crna',
	'calendar.colour.blue': 'Plava',
	'calendar.rank.solemnity': 'Svetkovina',
	'calendar.rank.feast': 'Blagdan',
	'calendar.rank.memorial': 'Obvezni spomendan',
	'calendar.rank.optional-memorial': 'Neobvezni spomendan',
	'calendar.rank.commemoration': 'Spomen',
	'calendar.rank.sunday': 'Nedjelja',
	'calendar.rank.weekday': 'Ferija',
	'calendar.gloss.season.advent':
		'Četiri tjedna prije Božića: priprava za dolazak Gospodnji i početak crkvene godine.',
	'calendar.gloss.season.christmas':
		'Od Božića do Krštenja Gospodinova, u slavljenju Gospodinova rođenja i njegova očitovanja svijetu.',
	'calendar.gloss.season.lent':
		'Četrdeset dana od Pepelnice do večernje mise Večere Gospodnje: pokora, milostinja i priprava za Uskrs.',
	'calendar.gloss.season.triduum':
		'Tri dana od večeri Velikoga četvrtka do večeri Uskrsne nedjelje — muka, smrt i uskrsnuće Gospodnje, vrhunac cijele godine.',
	'calendar.gloss.season.easter':
		'Pedeset dana od Uskrsa do Duhova, slavljenih kao jedna jedina svetkovina — „jedna velika nedjelja”.',
	'calendar.gloss.season.ordinary':
		'Trideset tri ili trideset četiri tjedna izvan ostalih vremena. Nije „obično” nego uređeno: tjedni su izbrojeni, a Crkva čita redom život i nauk Gospodnji. Dolazi u dva dijela — poslije božićnoga vremena do korizme, i poslije Duhova do došašća.',
	'calendar.gloss.rank.solemnity':
		'Najviši stupanj: Uskrs, Božić, Uzašašće, zaštitnik mjesta. Slavi se sa Slava i Vjerovanjem i počinje prethodne večeri.',
	'calendar.gloss.rank.feast':
		'Slavi se unutar samoga dana. Apostoli i evanđelisti te veći dani Gospodnji i Gospini.',
	'calendar.gloss.rank.memorial':
		'Svetac koji se spominje na svoj dan, unutar mise i časoslova toga vremena. Obvezan ondje gdje se slavi.',
	'calendar.gloss.rank.optional-memorial':
		'Može se slaviti ili ne, po izboru svećenika ili zajednice. Ako se ne slavi, dan je jednostavno svagdan.',
	'calendar.gloss.rank.commemoration':
		'Ono što spomendan postaje u korizmi: molitva pridodana svagdanjoj misi, koju vrijeme inače čuva cijelu.',
	'calendar.gloss.rank.sunday':
		'Prvotni blagdan — dan Gospodnji, slavljen svakoga tjedna od uskrsnuća. Samo svetkovina ili blagdan Gospodnji smiju ga potisnuti, a u došašću, korizmi i vazmenom vremenu ni oni.',
	'calendar.gloss.rank.weekday':
		'Dan bez vlastita slavlja. Misa i časoslov jesu oni od vremena — a to je ono što vrijeme čini vrijednim poznavanja.',
	'calendar.gloss.colour.white':
		'Radost. Vazmeno i božićno vrijeme, dani Gospodnji izvan njegove muke, Gospa, anđeli i sveci koji nisu bili mučenici.',
	'calendar.gloss.colour.red':
		'Krv i oganj. Cvjetnica i Veliki petak, Duhovi, apostoli i evanđelisti te mučenici.',
	'calendar.gloss.colour.green': 'Vrijeme kroz godinu: boja nade i onoga što raste.',
	'calendar.gloss.colour.violet': 'Došašće i korizma, a nosi se i u misama za pokojne.',
	'calendar.gloss.colour.rose':
		'Nosi se dvaput godišnje — u nedjelju Gaudete, treću došašća, i u nedjelju Laetare, četvrtu korizme — gdje se post razvedrava i kraj je na vidiku.',
	'calendar.gloss.colour.black': 'Smije se nositi u misama za pokojne.',
	'calendar.gloss.colour.blue':
		'Povlastica plave: nosi se na Bezgrešno začeće u Španjolskoj, na Filipinima i u ono malo drugih mjesta kojima ju je Sveta Stolica podijelila.',
	'calendar.gloss.sundayCycle':
		'Nedjeljna čitanja teku kroz tri godine — A, B i C — čitajući redom Mateja, Marka i Luku, s Ivanom kroz korizmu i vazmeno vrijeme. Ciklus se mijenja prve nedjelje došašća, zajedno s crkvenom godinom.',
	'calendar.gloss.weekdayCycle':
		'Svagdanja čitanja teku kroz dvije godine, I i II: prvo čitanje se mijenja, evanđelje ne. Liturgijska godina nosi ime građanske godine u kojoj završava — neparne godine su I, parne II.',
	'calendar.gloss.psalterWeek':
		'Časoslov raspoređuje psalme na četiri tjedna, od I do IV, koji se ponavljaju kroz godinu. Ovo je tjedan čiji su psalmi današnji, za svakoga tko moli časoslov.',
	'calendar.gloss.obligation':
		'Dan u koji su vjernici dužni sudjelovati na misi i suzdržati se od poslova koji bi ih u tome priječili. Svaka nedjelja i ostali dani koje je odredila pojedina biskupska konferencija.',
	'calendar.primer.title': 'Prvi put ovdje?',
	'calendar.primer.lead':
		'Crkva čuva vlastitu godinu. Počinje došašćem, okreće se oko Uskrsa i svakomu danu daje ime, stupanj i boju — a oni odlučuju što se toga dana moli i čita na misi i u časoslovu. Tako je „dvadeset treća nedjelja kroz godinu” adresa: govori svećeniku, zboru ili bilo komu tko moli kod kuće koje molitve i koja čitanja pripadaju današnjem danu.',
	'calendar.primer.seasons': 'Liturgijska vremena',
	'calendar.primer.ranks': 'Što dan može biti',
	'calendar.primer.colours': 'Boje',
	'calendar.primer.cycles': 'Ciklusi',
	'calendar.primer.cyclesLead':
		'Tri brojača koji zajedno kazuju koja su čitanja i psalmi određeni za danas.'
};
