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
 * `docs/decisions.md`. IT HAS NOT BEEN READ BY A NATIVE SPEAKER.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive. Deleting a
 * doubtful line is a valid fix -- it falls back to English.
 * Every key `CHROME_KEYS` requires is here, since an unnamed chrome page fails
 * the sync rather than falling back.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
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
	'nav.prayers': 'Molitve',
	'nav.bookmarks': 'Oznake',
	'nav.menu': 'Izbornik',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Nastavi čitati',
	'home.works': 'Knjižnica',
	'home.ccc.heading': 'Katekizam i Kompendij',
	'home.magisterium.mostRecent': 'Najnovije',
	'home.prayers.heading': 'Molitve',
	'unitNav.previous': 'Prethodno',
	'unitNav.next': 'Sljedeće',
	'bible.landing.title': 'Biblija',
	'bible.landing.tagline': 'Čitajte cijelu Bibliju, knjigu po knjigu, poglavlje po poglavlje.',
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
	'ccc.landing.tagline':
		'<strong>Katekizam</strong> izlaže katolički nauk u 2865 numeriranih odlomaka. <strong>Kompendij</strong> isti nauk donosi kao 598 pitanja i odgovora, prema istom rasporedu.',
	'document.library.tagline':
		'Enciklike, koncilske konstitucije, dekreti i deklaracije Učiteljstva.',
	'doctores.landing.title': 'Naučitelji Crkve',
	'doctores.landing.tagline': 'Teološka djela crkvenih otaca i naučitelja Crkve.',
	'summa.landing.title': 'Suma teologije',
	'summa.landing.tagline': 'Toma Akvinski, na engleskom i na latinskom kojim je pisao.',
	'prayers.landing.title': 'Uobičajene molitve',
	'prayers.landing.tagline': 'Molitve s latinskim tekstom uz njih.',
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
	'footer.notEndorsed': 'Neovisno, bez odobrenja Svete Stolice.',
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
	'colophon.typeTitle': 'Slova',
	'colophon.typeBody':
		'Slog je u pismu EB Garamond, obnovi Georga Duffnera i Octavija Parda slova koja je Claude Garamont rezao 1590-ih — humanističke tradicije u kojoj Crkva tiska od renesanse. Njegova je ćirilica istih ruku, ali ne obnavlja ništa: garamondovska ćirilica nikada nije bila rezana, pa je ruski složen oblikom nacrtanim da stoji uz ostalo.',
	'colophon.typeArabic':
		'Arapski je posve izvan njegova dosega i složen je u pismu Amiri — obnovi Khaleda Hosnyja naskha rezanog za tiskaru Bulaq u Kairu 1905., odabranoj po istom razlogu kao i tekstovno pismo: određeno povijesno knjižno pismo, a ne suvremeni crtež.',
	'colophon.typeInitials':
		'Početna su slova Pirata One, gotičko pismo čije verzalne ostaju čitljive u veličini koju inicijal traži, i — za ruski — Ponomar, koje reproducira crkvenoslavensko pismo Sinodalne tiskare. Ponomar slaže inicijal, a nikada tekst: moderna enciklika složena cijela u sinodalnom pismu rekla bi nešto neistinito o tome što jest. Sva su licencirana pod SIL Open Font License i posluživana s ove stranice, a ne od treće strane, tako da čitanje stranice ne traži ništa od tuđeg poslužitelja.'
};
