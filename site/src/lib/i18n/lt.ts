/**
 * Lietuvių UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-09-04, with the other content languages that had no interface.
 * The corpus holds `compendium.lt` — one of the four Compendium editions
 * vatican.va publishes only as PDF, 598 questions — and `prayer.common.lt`,
 * and their readers were reading them inside English chrome, which is the
 * combination `../ui-langs.ts` says the interface list should never leave
 * standing. Lithuanian had also been in `sw-policy.ts`'s font table since
 * 2026-09-03 for the same corpus and by the same oversight, one layer down.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive. Deleting a doubtful line is a valid fix — English
 * fills the gap per key.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const lt: Dictionary = {
	'nav.bible': 'Šventasis Raštas',
	'nav.ccc': 'Katekizmas',
	'nav.compendium': 'Santrauka',
	'nav.magisterium': 'Magisteriumas',
	'nav.socialDoctrine': 'Socialinis mokymas',
	'socialDoctrine.landing.title': 'Bažnyčios socialinio mokymo santrauka',
	'socialDoctrine.landing.tagline':
		'Ką Bažnyčia moko apie gyvenimą visuomenėje – 583 numeruotose punktuose.',
	'nav.canonLaw': 'Kanonų teisė',
	'canonLaw.landing.title': 'Kanonų teisės kodeksas',
	'canonLaw.landing.tagline':
		'Lotynų Bažnyčios teisė – 1 752 kanonai, išdėstyti septyniose knygose.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kann.',
	'canonLaw.prevCanon': 'Ankstesnis kanonas',
	'canonLaw.nextCanon': 'Kitas kanonas',
	'canonLaw.readFullTitle': 'Skaityti visą skirsnį',
	'canonLaw.superseded': 'Formuluotė pakeista',
	'nav.prayers': 'Maldos',
	'nav.bookmarks': 'Žymelės',
	'nav.menu': 'Meniu',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Skaityti toliau',
	'nav.library': 'Biblioteka',
	'nav.learn': 'Mokytis',
	'library.landing.tagline':
		'Visas rinkinys, lentyna po lentynos — su tuo, kur baigėte skaityti, ir tuo, ką pažymėjote.',
	'unitNav.previous': 'Ankstesnis',
	'unitNav.next': 'Kitas',
	'bible.landing.title': 'Šventasis Raštas',
	'bible.landing.tagline': 'Skaitykite visą Šventąjį Raštą – knyga po knygos, skyrius po skyriaus.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Penkiaknygė',
	'bible.group.historical': 'Istorinės knygos',
	'bible.group.wisdom': 'Išminties knygos',
	'bible.group.prophetic': 'Pranašų knygos',
	'bible.group.gospels': 'Evangelijos',
	'bible.group.acts': 'Apaštalų darbai',
	'bible.group.pauline': 'Pauliaus laiškai',
	'bible.group.catholicLetters': 'Katalikiškieji laiškai',
	'bible.group.revelation': 'Apreiškimas Jonui',
	'ccc.landing.title': 'Katalikų Bažnyčios katekizmas',
	'ccc.landing.tagline':
		'<strong>Katekizmas</strong> išdėsto katalikų tikėjimo mokymą 2 865 numeruotuose punktuose. <strong>Santrauka</strong> pagal tą patį planą pateikia tą patį mokymą 598 klausimais ir atsakymais.',
	'document.library.tagline':
		'Enciklikos, Susirinkimo konstitucijos, dekretai ir Magisteriumo deklaracijos.',
	'doctores.landing.title': 'Bažnyčios mokytojai',
	'doctores.landing.tagline': 'Bažnyčios tėvų ir mokytojų teologiniai veikalai.',
	'summa.landing.title': 'Teologijos suma',
	'summa.landing.tagline': 'Tomas Akvinietis – angliškai ir ta lotynų kalba, kuria jis rašė.',
	'prayers.landing.title': 'Bendrosios maldos',
	'prayers.landing.tagline': 'Maldos su greta pateiktu lotynišku tekstu.',
	'colophon.title': 'Kolofonas',
	'colophon.lede':
		'Kas yra ši svetainė, iš kur ateina jos tekstai ir kokios laikomės nuostatos juos perspausdindami.',
	'colophon.whatThisIs': 'Kas tai yra',
	'colophon.whatThisIsBody':
		'Glossa Catholica – tai svetainė Šventajam Raštui, Katekizmui, Santraukai ir Magisteriumo dokumentams skaityti angliškai, portugališkai ir lotyniškai. Ji egzistuoja tam, kad būtų skaitoma, ir nieko daugiau iš jūsų už tai neprašo:',
	'colophon.pointFree':
		'Nemokamai ir visada nemokamai. Jokio mokamo barjero, jokios prenumeratos, nieko, ką reikėtų pirkti.',
	'colophon.pointNoAds': 'Jokios reklamos ir jokio remiamo turinio.',
	'colophon.pointNoAccounts': 'Jokių paskyrų. Nėra kur registruotis ir nėra kur prisijungti.',
	'colophon.pointNoTracking':
		'Jokių sekimo scenarijų, jokio trečiųjų šalių kodo, jokių slapukų. Tik anoniminė naudojimo statistika, kurioje nėra nieko, kas jus identifikuotų.',
	'colophon.pointOffline':
		'Sukurta taip, kad kartą apsilankius veiktų ir be interneto, kad prastas ryšys netaptų kliūtimi skaityti.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica yra privati pasauliečių iniciatyva. Ji neturi jokio bažnytinio patvirtinimo ir nekalba jokia sava valdžia.',
	'footer.notEndorsed': 'Nepatvirtinta Šventojo Sosto',
	'colophon.textsTitle': 'Tekstai',
	'colophon.textsBody':
		'Kiekvienas tekstas turi įvardytą šaltinį, o kiekvienas veikalas nurodo savo leidimą, šaltinio puslapį ir paėmimo datą. Šventasis Raštas pateikiamas viešosios srities vertimais; Katekizmas, Santrauka ir Magisteriumo dokumentai – iš paties Šventojo Sosto skelbiamų tekstų.',
	'colophon.textsFidelity':
		'Tekstas niekada nėra trumpinamas, niekada neperpasakojamas, niekada neperrašomas ir niekada nededamas šalia reklamos. Akivaizdžius trūkumus taisome – praleistą žodį, sudarkytą nuorodą, žymėjimą, prarijusį visą pastraipą – visada link to, ką spausdina pats šaltinis, o niekada link to, kas, mūsų manymu, ten turėtų būti.',
	'colophon.countBible': 'Šventojo Rašto leidimai',
	'colophon.countDocuments': 'Magisteriumo dokumentai',
	'colophon.copyrightTitle': 'Autorių teisės',
	'colophon.copyrightBody1':
		'Katekizmas, Santrauka ir Magisteriumo dokumentai priklauso jų teisių turėtojams – pirmiausia leidyklai Libreria Editrice Vaticana ir Komunikacijos dikasterijai.',
	'colophon.copyrightBody2':
		'Kiekvienas veikalas rodo savo teisių turėtojo autorių teisių įrašą jo paties formuluote ir nurodo puslapį, iš kurio buvo paimtas.',
	'colophon.copyrightBody3':
		'Jeigu turite teises į kurį nors čia esantį tekstą ir nenorėtumėte, kad jis būtų skelbiamas, parašykite mums.',
	'colophon.contactTitle': 'Kontaktai',
	'colophon.contactBody': 'Bet kokiu klausimu, taip pat ir dėl to, kas pasakyta aukščiau:',
	'colophon.contactPending':
		'Kontaktinis adresas dar nenustatytas. Kol jo nėra, ši svetainė neturėtų būti vieša – aukščiau duotas pažadas nieko nereiškia, jei nėra kaip mus pasiekti.',
	'colophon.illustrationsTitle': 'Iliustracijos',
	'colophon.illustrationsBody':
		'Šventajame Rašte yra Gustave’o Doré graviūrų, kiekviena – prie eilutės, kurią vaizduoja; tai paskutinis ir didžiausias jo Biblijos ciklas, pagal jo piešinius išraižytas medyje ir spausdintas kartu su tekstu, o ne sudėtas knygos gale.',
	'colophon.illustrationsRights':
		'Kaip rodo žemiau nurodytos datos, jos yra viešojoje srityje, o tiksli viešosios srities graviūros fotografinė reprodukcija savaime nesukuria naujų autorių teisių.',
	'colophon.countPlates': 'graviūros',
	'colophon.countPlateChapters': 'iliustruoti skyriai',
	'colophon.typeTitle': 'Šriftas',
	'colophon.typeBody':
		'Rinkta EB Garamond šriftu – Georgo Duffnerio ir Octavio Pardo atgaivintais raižiniais, kuriuos Claude’as Garamont’as išraižė XVI a. paskutiniame dešimtmetyje; tai humanistinė tradicija, kuria Bažnyčia spausdina nuo Renesanso. Jo kirilica yra tų pačių rankų darbas, bet nieko neatgaivina: kirilinis Garamond niekada nebuvo išraižytas, todėl rusiškas tekstas rinktas formomis, nupieštomis taip, kad derėtų prie viso kito.',
	'colophon.typeArabic':
		'Arabų raštas jam visiškai nepasiekiamas, todėl rinktas Amiri šriftu – Khaledo Hosny atgaivintu naschi raižiniu, sukurtu Kairo Bulako spaustuvei 1905 m., pasirinktu dėl tos pačios priežasties kaip ir pagrindinis šriftas: tai konkretus istorinis knygos šriftas, o ne šiuolaikinis piešinys.',
	'colophon.typeInitials':
		'Pradžios inicialai – Pirata One, gotikinis šriftas, kurio didžiosios raidės išlieka įskaitomos tokio dydžio, kokio reikalauja inicialas, o rusiškam tekstui – Ponomar, atkuriantis Sinodo spaustuvės bažnytinės slavų kalbos šriftą. Ponomar renka tik inicialą ir niekada teksto: moderni enciklika, ištisai surinkta Sinodo šriftu, pasakytų apie save netiesą. Visi jie licencijuoti pagal SIL Open Font License ir pateikiami iš šios svetainės, o ne iš trečiosios šalies, tad puslapio skaitymas nieko neprašo iš svetimo serverio.'
};
