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
 * THE CALENDAR'S CONTROLS ARRIVED 2026-09-06 -- the 44 `calendar.*` keys
 * `/calendarium` labels itself with, its seasons, ranks and colours among
 * them. The 31 that TEACH those words (`calendar.gloss.*`,
 * `calendar.primer.*`) are prose rather than labels and are left to English
 * for now, by direction; the page stays unpublished until they are written.
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
	'schola.start.heading': 'Ako vam je sve ovo novo',
	'schola.start.body': 'Najbolji je početak ',
	'schola.start.bodyAfter':
		': isti nauk kao u Katekizmu, mnogo kraći, pisan u pitanjima i odgovorima. Otprilike je desetinu duljine i ništa ne pretpostavlja.',
	'schola.bible.heading': 'Ako nikada niste čitali Bibliju',
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
	'schola.guide.heading': 'Kako se snaći',
	'schola.guide.lede':
		'Tekst je cijela stranica; sve ostalo je naredba koju možete zanemariti dok je ne poželite.',
	'schola.guide.top.heading': 'Traka na vrhu svake stranice',
	'schola.guide.reading.heading': 'Traka iznad teksta',
	'schola.feature.search':
		'Upišite navod u okvir na vrhu — poglavlje i redak, broj odlomka, ime dokumenta — i dovršava ga dok tipkate. Pritisnite / ili Ctrl+K odakle god, i ? za ostale prečace.',
	'schola.feature.languages':
		'Sučelje i tekst biraju se odvojeno, pa možete čitati djelo na jednom jeziku dok gumbi ostaju na drugom. Gdje djelo ima više izdanja na vašem jeziku, birate i među njima.',
	'schola.feature.settings':
		'Veličina teksta, svijetlo ili tamno, sepija, i koliko aparata želite uz tekst.',
	'schola.feature.offline':
		'Dodajte stranicu na početni zaslon i otvara se kao aplikacija. Cijela djela možete preuzeti i čitati bez veze.',
	'schola.feature.contents':
		'Podjele djela u kojem ste — knjige, dijelovi, poglavlja — da se krećete unutar njega bez vraćanja na početak.',
	'schola.feature.compare':
		'Dva izdanja istoga mjesta jedno uz drugo — latinski uz vaš vlastiti jezik, ili jedan prijevod uz drugi.',
	'schola.feature.apparatus':
		'Vlastite bilješke izdanja i svaki komentar napisan uz tekst nude se pokraj njega, a ne ispod. Navodi unutar teksta su poveznice, pa uputnica vodi onamo kamo pokazuje.',
	'schola.feature.focus':
		'Ukloni sve osim teksta. Izlaz ostaje gdje je bila traka, da ništa ne ostane zarobljeno iza nje.',
	'schola.books.heading': 'Što je ovdje i kako se navodi',
	'schola.books.lede':
		'Svaka je od ovih knjiga druge vrste, i na svaku se upućuje vlastitim brojem. Primjeri pokazuju oblik: upišite takav u okvir za traženje i stižete na mjesto.',
	'schola.cite.label': 'Navodi se',
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
	'jumpbox.placeholder': 'Idi na… (npr. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Traži',
	'jumpbox.hint': 'Pritisnite / ili Ctrl+K za skok na navod',
	'jumpbox.noMatch': 'Nema pogodaka',
	'jumpbox.suggestions': 'Prijedlozi',
	'settings.label': 'Postavke',
	'darkMode.label': 'Tamni način',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Uključeno',
	'darkMode.off': 'Isključeno',
	'loadFailed.title': 'To se nije učitalo',
	'loadFailed.hint':
		'Stranica postoji — nešto je pošlo po zlu pri njezinu dohvaćanju. Ponovni pokušaj obično uspije.',
	'loadFailed.retry': 'Pokušaj ponovno',
	'loadFailed.retrying': 'Pokušavam…',
	'fontSize.label': 'Veličina teksta',
	'fontSize.larger': 'Veći tekst',
	'fontSize.smaller': 'Manji tekst',
	'print.label': 'Ispiši ovu stranicu',
	'toTop.label': 'Natrag na vrh',
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
	'bible.landing.books': 'Knjige',
	'bible.introduction': 'Uvod',
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
	'ccc.landing.title': 'Katekizam Katoličke Crkve',
	'ccc.landing.pairTitle': 'Katekizam i Kompendij',
	'ccc.landing.tagline':
		'<strong>Katekizam</strong> izlaže katolički nauk u 2865 numeriranih odlomaka. <strong>Kompendij</strong> isti nauk donosi kao 598 pitanja i odgovora, prema istom rasporedu.',
	'ccc.landing.pairTagline':
		'Katekizam Katoličke Crkve u 2865 brojeva i njegov Kompendij u 598 pitanja.',
	'compendium.landing.title': 'Kompendij Katekizma',
	'compendium.landing.tagline': 'Pitanja i odgovori koji sažimlju Katekizam Katoličke Crkve.',
	'compendium.question': 'Pitanje',
	'compendium.answer': 'Odgovor',
	'compendium.tableOfContents': 'Sadržaj',
	'compendium.prevQuestion': 'Prethodno pitanje',
	'compendium.nextQuestion': 'Sljedeće pitanje',
	'compendium.condenses': 'Sažimlje KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'U ovom korpusu nema broja pitanja',
	'document.library.tagline':
		'Enciklike, koncilske konstitucije, dekreti i deklaracije Učiteljstva.',
	'doctores.landing.title': 'Naučitelji Crkve',
	'doctores.landing.tagline': 'Teološka djela crkvenih otaca i naučitelja Crkve.',
	'summa.landing.title': 'Suma teologije',
	'summa.landing.tagline': 'Toma Akvinski, na engleskom i na latinskom kojim je pisao.',
	'index.division': 'Dioba',
	'prayers.landing.title': 'Uobičajene molitve',
	'prayers.landing.tagline': 'Molitve s latinskim tekstom uz njih.',
	'prayers.seeAlso': 'Vidi također',
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
	'art.about': 'O ovoj slici',
	'art.detail': 'isječak',
	'colophon.typeTitle': 'Slova',
	'colophon.typeBody':
		'Slog je u pismu EB Garamond, obnovi Georga Duffnera i Octavija Parda slova koja je Claude Garamont rezao 1590-ih — humanističke tradicije u kojoj Crkva tiska od renesanse. Njegova je ćirilica istih ruku, ali ne obnavlja ništa: garamondovska ćirilica nikada nije bila rezana, pa je ruski složen oblikom nacrtanim da stoji uz ostalo.',
	'colophon.typeArabic':
		'Arapski je posve izvan njegova dosega i složen je u pismu Amiri — obnovi Khaleda Hosnyja naskha rezanog za tiskaru Bulaq u Kairu 1905., odabranoj po istom razlogu kao i tekstovno pismo: određeno povijesno knjižno pismo, a ne suvremeni crtež.',
	'colophon.typeInitials':
		'Početna su slova Pirata One, gotičko pismo čije verzalne ostaju čitljive u veličini koju inicijal traži, i — za ruski — Ponomar, koje reproducira crkvenoslavensko pismo Sinodalne tiskare. Ponomar slaže inicijal, a nikada tekst: moderna enciklika složena cijela u sinodalnom pismu rekla bi nešto neistinito o tome što jest. Sva su licencirana pod SIL Open Font License i posluživana s ove stranice, a ne od treće strane, tako da čitanje stranice ne traži ništa od tuđeg poslužitelja.',
	'copyright.sourceTitle': 'Otvori izvornu stranicu',
	'copyright.sourceLabel': 'Izvor',
	'lang.label': 'Jezik',
	'lang.filter': 'Traži jezike',
	'lang.more': 'još jezika',
	'calendar.title': 'Liturgijski kalendar',
	'calendar.tagline':
		'Opći rimski kalendar, izračunan za bilo koji dan — njegovo vrijeme, njegov stupanj, njegova boja.',
	'calendar.date': 'Datum',
	'calendar.calendar': 'Kalendar',
	'calendar.which.general': 'Opći rimski kalendar',
	'calendar.filter': 'Traži zemlje',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerike',
	'calendar.region.africa': 'Afrika',
	'calendar.region.asia': 'Azija',
	'calendar.region.oceania': 'Oceanija',
	'calendar.today': 'Danas',
	'calendar.previousMonth': 'Prethodni mjesec',
	'calendar.nextMonth': 'Sljedeći mjesec',
	'calendar.noSuchDay': 'Za taj datum ne računa se nijedan liturgijski dan.',
	'calendar.week': 'tjedan',
	'calendar.alsoToday': 'Danas se slavi i',
	'calendar.alsoObserved': 'Danas pada i',
	'calendar.obligation': 'Zapovijedani blagdan',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Nedjeljni ciklus',
	'calendar.weekdayCycle': 'Ferijalni ciklus',
	'calendar.psalterWeek': 'Tjedan psaltira',
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
	'calendar.rank.weekday': 'Ferija'
};
