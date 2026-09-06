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
	'reading.continue': 'Skaityti toliau',
	'home.tagline':
		'Svetainė Šventajam Raštui, Katekizmui ir Magisteriumo dokumentams skaityti — nemokamai, veikia ir be interneto, ir niekur nereikia registruotis.',
	'home.doors.heading': 'Kur eiti',
	'home.find.heading': 'Arba įrašykite nuorodą',
	'nav.library': 'Biblioteka',
	'nav.learn': 'Mokytis',
	'library.landing.tagline':
		'Visas rinkinys, lentyna po lentynos — su tuo, kur baigėte skaityti, ir tuo, ką pažymėjote.',
	'schola.landing.title': 'Nuo ko pradėti',
	'schola.landing.tagline':
		'Trumpas vadovas po tai, kas čia yra: kas yra kiekviena iš šių knygų, kaip užrašoma nuoroda į ją, kaip rasti vietą, ir skaitymo tvarkos, kurias Bažnyčia yra pasiūliusi.',
	'schola.start.heading': 'Jei visa tai jums nauja',
	'schola.start.body': 'Geriausia pradžia — ',
	'schola.start.bodyAfter':
		': tas pats mokymas kaip Katekizme, kur kas trumpesnis, surašytas klausimais ir atsakymais. Jis maždaug dešimt kartų trumpesnis ir nieko iš anksto nesuponuoja.',
	'schola.bible.heading': 'Jei niekada neskaitėte Šventojo Rašto',
	'schola.bible.library':
		'Tai ne viena knyga, o septyniasdešimt trys, rašytos daugiau nei tūkstantį metų ir surinktos ta tvarka, kurią nustatė Bažnyčia — ne ta, kuria įvykiai vyko, ir ne ta, kurią lengviausia skaityti. Daugelis pradeda nuo pirmo puslapio ir po kelių savaičių liaujasi, ilgame senovinio įstatymo skyriuje, nes niekas jiems dar nepasakė, kam tai skirta.',
	'schola.bible.step.gospel': 'Pradėkite nuo Evangelijos',
	'schola.bible.start':
		'Viena iš keturių trumpų knygų apie Jėzaus gyvenimą, giliai viduje, o ne priekyje. Tai ne mūsų sumanymas: Bažnyčios Susirinkimas prašė mokyti teisingai naudotis Šventuoju Raštu, „ypač Naujuoju Testamentu ir pirmiausia Evangelijomis“. Jis neįvardijo nė vienos atskirai, ir mes neįvardysime.',
	'schola.bible.whichGospel':
		'Trys paprastai siūlomos, dėl trijų skirtingų priežasčių. Bet kuri iš jų yra gera vieta būti.',
	'schola.bible.gospel.mark':
		'Trumpiausia. Ją galite perskaityti visą per vieną popietę, o pabaigti vieną pradžioje vertingiau, negu išsirinkti geriausią.',
	'schola.bible.gospel.luke':
		'Parašyta žmogui už tikėjimo ribų, norėjusiam, kad viskas būtų surašyta iš eilės — o tai galbūt esate būtent jūs. Ji tiesiog pereina į Apaštalų darbus, taigi iš tikrųjų yra ilgesnės knygos pirmoji pusė.',
	'schola.bible.gospel.john':
		'Ta, kuri tiesiai pasako, kodėl parašyta: „kad tikėtumėte“. Paprasti žodžiai, ir eina tiesiai prie klausimo, kas yra Jėzus.',
	'schola.bible.step.acts': 'Paskui — kas buvo toliau',
	'schola.bible.thenActs':
		'Pabaigę vieną, perskaitykite, ką po jo išėjimo padarė tie, kurie jį pažinojo.',
	'schola.bible.acts.why':
		'Trisdešimt metų po Evangelijų pabaigos: keliolika išsigandusių žmonių ir tai, kaip tai, ką jie matė, pasiekė kitą imperijos galą.',
	'schola.bible.step.old': 'Paskui senesnioji pusė',
	'schola.bible.thenOld':
		'Ne nuo pirmo puslapio ir ne visa. Kelios vietos neša pasakojimą, ir būtent į jas Evangelijos nuolat grąžina.',
	'schola.bible.ot.beginnings': 'Kaip prasideda ir kaip nueina šuniui ant uodegos.',
	'schola.bible.ot.promise': 'Viena šeima ir jai duotas pažadas, pergyvenantis visus joje.',
	'schola.bible.ot.exodus':
		'Tauta, išvesta iš vergovės, ir jai duotas įstatymas, pagal kurį gyventi.',
	'schola.bible.ot.psalms':
		'Ne pasakojimas: šimtas penkiasdešimt maldų ir giesmių. Skaitykite po vieną, bet kokia tvarka. Bažnyčia jas tebekalba kasdien.',
	'schola.bible.bothWays':
		'Atpažinsite dalykus, ir tai yra esmė, o ne sutapimas. Bažnyčia senesnes knygas skaito Kristaus šviesoje, o naujesnes — to, kas buvo anksčiau, šviesoje: kiekviena pusė aiškina kitą, ir todėl nė viena neskaitoma viena.',
	'schola.guide.heading': 'Kaip čia susigaudyti',
	'schola.guide.lede':
		'Tekstas yra visas puslapis; visa kita — valdiklis, kurio galite nepaisyti, kol jo neprireiks.',
	'schola.guide.top.heading': 'Juosta kiekvieno puslapio viršuje',
	'schola.guide.reading.heading': 'Juosta virš teksto',
	'schola.feature.search':
		'Įrašykite nuorodą į viršuje esantį langelį — skyrių ir eilutę, pastraipos numerį, dokumento pavadinimą — ir ji papildoma jums berašant. Iš bet kur spauskite / arba Ctrl+K, o ? parodo kitus trumpinius.',
	'schola.feature.languages':
		'Sąsaja ir tekstas renkami atskirai, tad veikalą galite skaityti viena kalba, o mygtukai lieka kita. Kur veikalas turi kelis leidimus jūsų kalba, renkatės ir tarp jų.',
	'schola.feature.settings':
		'Teksto dydis, šviesus ar tamsus, sepija, ir kiek aparato norite šalia teksto.',
	'schola.feature.offline':
		'Pridėkite svetainę prie pradžios ekrano ir ji atsivers kaip programėlė. Ištisus veikalus galite atsisiųsti ir skaityti be ryšio.',
	'schola.feature.contents':
		'Veikalo, kuriame esate, skirstymas — knygos, dalys, skyriai — kad judėtumėte jo viduje negrįždami į pradžią.',
	'schola.feature.compare':
		'Du to paties teksto leidimai greta — lotynų kalba šalia jūsų pačių kalbos, arba vienas vertimas šalia kito.',
	'schola.feature.apparatus':
		'Leidimo paties pastabos ir bet koks tekstui parašytas komentaras siūlomi šalia jo, o ne po juo. Citatos teksto viduje yra nuorodos, tad nuoroda veda ten, kur rodo.',
	'schola.feature.focus':
		'Nuvalo viską, išskyrus tekstą. Išėjimas lieka ten, kur buvo juosta, kad niekas neliktų už jos.',
	'schola.books.heading': 'Kas čia yra ir kaip cituojama',
	'schola.books.lede':
		'Kiekviena iš jų yra kitokios rūšies knyga, ir į kiekvieną nurodoma savu skaičiumi. Pavyzdžiai rodo formą: įrašykite panašų į paieškos langelį ir atsidursite prie vietos.',
	'schola.cite.label': 'Cituojama',
	'schola.what.scripture':
		'Šventasis Raštas, kaip jį priima Bažnyčia, abiejuose Testamentuose. Visa kita čia skaitoma jo šviesoje.',
	'schola.cite.scripture':
		'knyga, skyrius ir eilutė, tais trumpiniais, kuriuos spausdina jūsų leidimas',
	'schola.what.catechism':
		'Santrauka to, kuo tiki Katalikų Bažnyčia, viename tome. Pats jis nėra šaltinis: jis sutelkia Šventąjį Raštą, Tėvus, liturgiją ir Bažnyčios mokymą, ir kiekviena pastraipa nurodo, iš kur tai, ką ji teigia.',
	'schola.cite.catechism':
		'pagal pastraipos numerį, einantį be pertrūkio nuo pirmo puslapio iki paskutinio',
	'schola.what.compendium':
		'Tas pats mokymas, išdėstytas klausimais ir atsakymais, maždaug dešimtadaliu apimties.',
	'schola.cite.compendium': 'pagal klausimo numerį',
	'schola.what.magisterium':
		'Tai, ką popiežiai ir susirinkimai iš tikrųjų parašė — enciklikos, konstitucijos, dekretai, deklaracijos — kiekvienas skirtas tam tikrai akimirkai ir tam tikram klausimui. Kiekvienas žinomas pagal savo pirmuosius lotyniškus žodžius.',
	'schola.cite.magisterium': 'pagal dokumento pavadinimą, paskui skirsnio numerį jame',
	'schola.what.social':
		'Bažnyčios mokymas apie darbą, nuosavybę, šeimą, politiką ir taiką, surinktas iš tų dokumentų į vieną knygą.',
	'schola.cite.social': 'pagal pastraipos numerį, po ta santrumpa, kuria veikalas vadina pats save',
	'schola.what.law': 'Teisė, o ne mokymas. Ji sako, ko Bažnyčia reikalauja, ir yra keičiama.',
	'schola.cite.law': 'pagal kanoną — taip vadinami jos sunumeruoti vienetai',
	'schola.what.doctors':
		'Teologai, kuriuos Bažnyčia paskelbė mokytojais. Tai neturi jokios oficialios galios, koks didis bebūtų autorius.',
	'schola.cite.doctors': 'pagal dalį, paskui klausimą — pačios Sumos skirstymą',
	'schola.what.prayers': 'Žodžiai, kuriais meldžiasi Bažnyčia, su lotyniškais greta.',
	'schola.cite.prayers': 'pagal pavadinimą; nėra numerių, kuriuos būtų galima cituoti',
	'schola.places.heading': 'Ne tekstai, o šios svetainės vietos',
	'schola.what.library':
		'Visi svetainės veikalai viename sąraše, sugrupuoti pagal dalyką, o ne pagal rūšį.',
	'schola.what.calendar':
		'Liturginė diena — laikas, spalva ir kas minimas — tos šalies, kurios kalendoriaus laikotės.',
	'schola.what.bookmarks':
		'Vietos, kurias pažymėjote, ir ties kuo paskutinį kartą sustojote kiekviename veikale. Abu dalykai lieka šioje naršyklėje ir niekur nesiunčiami.',
	'jumpbox.placeholder': 'Pereiti prie… (pvz. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Ieškoti',
	'jumpbox.hint': 'Paspauskite / arba Ctrl+K, kad pereitumėte prie nuorodos',
	'jumpbox.noMatch': 'Nieko nerasta',
	'jumpbox.suggestions': 'Pasiūlymai',
	'settings.label': 'Nuostatos',
	'darkMode.label': 'Tamsi veiksena',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Įjungta',
	'darkMode.off': 'Išjungta',
	'loadFailed.title': 'Tai neįsikėlė',
	'loadFailed.hint':
		'Puslapis yra — kažkas nepavyko jį parsiunčiant. Pabandžius dar kartą paprastai pavyksta.',
	'loadFailed.retry': 'Bandyti dar kartą',
	'loadFailed.retrying': 'Bandoma…',
	'fontSize.label': 'Teksto dydis',
	'fontSize.larger': 'Didesnis tekstas',
	'fontSize.smaller': 'Mažesnis tekstas',
	'print.label': 'Spausdinti šį puslapį',
	'toTop.label': 'Atgal į viršų',
	'edition.label': 'Leidimas',
	'edition.select': 'Pasirinkti leidimą',
	'edition.current': 'Dabartinis leidimas',
	'edition.filter': 'Ieškoti leidimų',
	'menu.noMatches': 'Atitikmenų nėra',
	'unitNav.previous': 'Ankstesnis',
	'unitNav.next': 'Kitas',
	'bible.prevChapter': 'Ankstesnis skyrius',
	'bible.nextChapter': 'Kitas skyrius',
	'bible.pickBook': 'Knygos ir skyriai',
	'bible.landing.title': 'Šventasis Raštas',
	'bible.landing.tagline': 'Skaitykite visą Šventąjį Raštą – knyga po knygos, skyrius po skyriaus.',
	'bible.landing.books': 'Knygos',
	'bible.introduction': 'Įvadas',
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
	'ccc.landing.pairTitle': 'Katekizmas ir Santrauka',
	'ccc.landing.tagline':
		'<strong>Katekizmas</strong> išdėsto katalikų tikėjimo mokymą 2 865 numeruotuose punktuose. <strong>Santrauka</strong> pagal tą patį planą pateikia tą patį mokymą 598 klausimais ir atsakymais.',
	'ccc.landing.pairTagline':
		'Katalikų Bažnyčios katekizmas 2865 numeriuose ir jo Santrauka 598 klausimuose.',
	'compendium.landing.title': 'Katekizmo santrauka',
	'compendium.landing.tagline':
		'Klausimai ir atsakymai, glaustai perteikiantys Katalikų Bažnyčios katekizmą.',
	'compendium.question': 'Klausimas',
	'compendium.answer': 'Atsakymas',
	'compendium.tableOfContents': 'Turinys',
	'compendium.prevQuestion': 'Ankstesnis klausimas',
	'compendium.nextQuestion': 'Kitas klausimas',
	'compendium.condenses': 'Glaudžia KBK ¶¶',
	'ccc.abbrev': 'KBK',
	'compendium.abbrev': 'Santr.',
	'compendium.noQuestionNumber': 'Šiame tekstyne nėra klausimo numerio',
	'document.library.tagline':
		'Enciklikos, Susirinkimo konstitucijos, dekretai ir Magisteriumo deklaracijos.',
	'doctores.landing.title': 'Bažnyčios mokytojai',
	'doctores.landing.tagline': 'Bažnyčios tėvų ir mokytojų teologiniai veikalai.',
	'summa.landing.title': 'Teologijos suma',
	'summa.landing.tagline': 'Tomas Akvinietis – angliškai ir ta lotynų kalba, kuria jis rašė.',
	'index.division': 'Dalis',
	'prayers.landing.title': 'Bendrosios maldos',
	'prayers.landing.tagline': 'Maldos su greta pateiktu lotynišku tekstu.',
	'prayers.seeAlso': 'Taip pat žiūrėkite',
	'anchor.actions': 'Veiksmai su nuoroda',
	'anchor.copy': 'Kopijuoti tekstą',
	'anchor.copyLink': 'Kopijuoti saitą',
	'anchor.view': 'Peržiūrėti',
	'anchor.copied': 'Nukopijuota',
	'anchor.copyFailed': 'Nepavyko nukopijuoti',
	'bookmark.add': 'Pažymėti',
	'bookmark.remove': 'Pašalinti žymelę',
	'bookmark.library': 'Žymelės',
	'bookmark.library.tagline': 'Visa, ką pažymėjote skaitydami.',
	'bookmark.empty': 'Kol kas nieko nepažymėta.',
	'bookmark.emptyHint':
		'Spustelėkite eilutės ar pastraipos numerį ir pasirinkite Pažymėti arba pasinaudokite puslapio žymelės mygtuku.',
	'bookmark.deviceOnly':
		'Žymelės laikomos tik šioje naršyklėje. Jos niekur nesiunčiamos, o išvalius naršyklės duomenis dingsta.',
	'bookmark.unavailable': 'Nėra tame leidime, kurį skaitote',
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
	'art.about': 'Apie šį paveikslą',
	'art.detail': 'fragmentas',
	'colophon.typeTitle': 'Šriftas',
	'colophon.typeBody':
		'Rinkta EB Garamond šriftu – Georgo Duffnerio ir Octavio Pardo atgaivintais raižiniais, kuriuos Claude’as Garamont’as išraižė XVI a. paskutiniame dešimtmetyje; tai humanistinė tradicija, kuria Bažnyčia spausdina nuo Renesanso. Jo kirilica yra tų pačių rankų darbas, bet nieko neatgaivina: kirilinis Garamond niekada nebuvo išraižytas, todėl rusiškas tekstas rinktas formomis, nupieštomis taip, kad derėtų prie viso kito.',
	'colophon.typeArabic':
		'Arabų raštas jam visiškai nepasiekiamas, todėl rinktas Amiri šriftu – Khaledo Hosny atgaivintu naschi raižiniu, sukurtu Kairo Bulako spaustuvei 1905 m., pasirinktu dėl tos pačios priežasties kaip ir pagrindinis šriftas: tai konkretus istorinis knygos šriftas, o ne šiuolaikinis piešinys.',
	'colophon.typeInitials':
		'Pradžios inicialai – Pirata One, gotikinis šriftas, kurio didžiosios raidės išlieka įskaitomos tokio dydžio, kokio reikalauja inicialas, o rusiškam tekstui – Ponomar, atkuriantis Sinodo spaustuvės bažnytinės slavų kalbos šriftą. Ponomar renka tik inicialą ir niekada teksto: moderni enciklika, ištisai surinkta Sinodo šriftu, pasakytų apie save netiesą. Visi jie licencijuoti pagal SIL Open Font License ir pateikiami iš šios svetainės, o ne iš trečiosios šalies, tad puslapio skaitymas nieko neprašo iš svetimo serverio.',
	'copyright.sourceTitle': 'Atverti pirminį šaltinio puslapį',
	'copyright.sourceLabel': 'Šaltinis',
	'lang.label': 'Kalba',
	'lang.filter': 'Ieškoti kalbų',
	'lang.more': 'daugiau kalbų',
	'calendar.title': 'Liturginis kalendorius',
	'calendar.tagline':
		'Bendrasis Romos kalendorius, apskaičiuotas bet kuriai dienai — jos laikas, jos laipsnis, jos spalva.',
	'calendar.date': 'Data',
	'calendar.calendar': 'Kalendorius',
	'calendar.which.general': 'Bendrasis Romos kalendorius',
	'calendar.filter': 'Ieškoti šalių',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerikos',
	'calendar.region.africa': 'Afrika',
	'calendar.region.asia': 'Azija',
	'calendar.region.oceania': 'Okeanija',
	'calendar.today': 'Šiandien',
	'calendar.previousMonth': 'Ankstesnis mėnuo',
	'calendar.nextMonth': 'Kitas mėnuo',
	'calendar.noSuchDay': 'Tai datai liturginė diena neskaičiuojama.',
	'calendar.week': 'savaitė',
	'calendar.alsoToday': 'Šiandien taip pat švenčiama',
	'calendar.alsoObserved': 'Šiandien taip pat minima',
	'calendar.obligation': 'Privaloma šventė',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Sekmadienių ciklas',
	'calendar.weekdayCycle': 'Šiokiadienių ciklas',
	'calendar.psalterWeek': 'Psalmyno savaitė',
	'calendar.transferredFrom': 'Perkelta iš',
	'calendar.season.advent': 'Adventas',
	'calendar.season.christmas': 'Kalėdų laikas',
	'calendar.season.lent': 'Gavėnia',
	'calendar.season.triduum': 'Velykų tridienis',
	'calendar.season.easter': 'Velykų laikas',
	'calendar.season.ordinary': 'Eilinis laikas',
	'calendar.colour.white': 'Balta',
	'calendar.colour.red': 'Raudona',
	'calendar.colour.green': 'Žalia',
	'calendar.colour.violet': 'Violetinė',
	'calendar.colour.rose': 'Rožinė',
	'calendar.colour.black': 'Juoda',
	'calendar.colour.blue': 'Mėlyna',
	'calendar.rank.solemnity': 'Iškilmė',
	'calendar.rank.feast': 'Šventė',
	'calendar.rank.memorial': 'Privalomas minėjimas',
	'calendar.rank.optional-memorial': 'Neprivalomas minėjimas',
	'calendar.rank.commemoration': 'Paminėjimas',
	'calendar.rank.sunday': 'Sekmadienis',
	'calendar.rank.weekday': 'Šiokiadienis',
	'calendar.gloss.season.advent':
		'Keturios savaitės prieš Kalėdas: pasirengimas Viešpaties atėjimui ir Bažnyčios metų pradžia.',
	'calendar.gloss.season.christmas':
		'Nuo Kalėdų iki Kristaus Krikšto, švenčiant Viešpaties gimimą ir jo apsireiškimą pasauliui.',
	'calendar.gloss.season.lent':
		'Keturiasdešimt dienų nuo Pelenų trečiadienio iki vakarinių Viešpaties Vakarienės Mišių: atgaila, išmalda ir pasirengimas Velykoms.',
	'calendar.gloss.season.triduum':
		'Trys dienos nuo Didžiojo ketvirtadienio vakaro iki Velykų sekmadienio vakaro — Viešpaties kančia, mirtis ir prisikėlimas, viso ligurginių metų viršūnė.',
	'calendar.gloss.season.easter':
		'Penkiasdešimt dienų nuo Velykų iki Sekminių, švenčiamų kaip viena vienintelė šventė — „vienas didis sekmadienis“.',
	'calendar.gloss.season.ordinary':
		'Trisdešimt trys arba trisdešimt keturios savaitės už kitų laikotarpių ribų. Ne „paprastas“, o sutvarkytas: savaitės suskaičiuotos, o Bažnyčia iš eilės skaito Viešpaties gyvenimą ir mokymą. Ateina dviem tarpsniais — po Kalėdų laiko iki gavėnios, ir po Sekminių iki advento.',
	'calendar.gloss.rank.solemnity':
		'Aukščiausias laipsnis: Velykos, Kalėdos, Žengimas į dangų, vietos globėjas. Švenčiama su Garbė ir Tikiu, ir prasideda ankstesnį vakarą.',
	'calendar.gloss.rank.feast':
		'Švenčiama pačios dienos ribose. Apaštalai ir evangelistai bei didesnės Viešpaties ir Švč. Mergelės Marijos dienos.',
	'calendar.gloss.rank.memorial':
		'Šventasis, minimas savo dieną, to laikotarpio Mišiose ir Valandų liturgijoje. Privalomas ten, kur švenčiamas.',
	'calendar.gloss.rank.optional-memorial':
		'Gali būti švenčiamas arba ne, kunigo ar bendruomenės pasirinkimu. Nešvenčiamas, diena yra tiesiog šiokiadienis.',
	'calendar.gloss.rank.commemoration':
		'Kuo minėjimas tampa gavėnioje: malda, pridėta prie šiokiadienio Mišių, kurias laikotarpis kitaip išlaiko visas.',
	'calendar.gloss.rank.sunday':
		'Pirmoji šventė — Viešpaties diena, švenčiama kas savaitę nuo prisikėlimo. Tik iškilmė arba Viešpaties šventė gali ją nustumti, o advente, gavėnioje ir Velykų laike net ir tos ne.',
	'calendar.gloss.rank.weekday':
		'Diena be savo šventimo. Mišios ir Valandų liturgija yra to laikotarpio — būtent tai ir daro laikotarpį vertą pažinti.',
	'calendar.gloss.colour.white':
		'Džiaugsmas. Velykų ir Kalėdų laikas, Viešpaties dienos už jo kančios ribų, Švč. Mergelė Marija, angelai ir šventieji, kurie nebuvo kankiniai.',
	'calendar.gloss.colour.red':
		'Kraujas ir ugnis. Verbų sekmadienis ir Didysis penktadienis, Sekminės, apaštalai ir evangelistai bei kankiniai.',
	'calendar.gloss.colour.green': 'Eilinis laikas: vilties ir to, kas auga, spalva.',
	'calendar.gloss.colour.violet': 'Adventas ir gavėnia, taip pat dėvima Mišiose už mirusiuosius.',
	'calendar.gloss.colour.rose':
		'Dėvima du kartus per metus — Gaudete sekmadienį, trečiąjį advento, ir Laetare sekmadienį, ketvirtąjį gavėnios — kur pasninkas prašviesėja ir pabaiga jau matoma.',
	'calendar.gloss.colour.black': 'Gali būti dėvima Mišiose už mirusiuosius.',
	'calendar.gloss.colour.blue':
		'Mėlynos privilegija: dėvima per Švč. Mergelės Marijos Nekaltąjį Prasidėjimą Ispanijoje, Filipinuose ir tose nedaugelyje kitų vietų, kurioms Šventasis Sostas ją suteikė.',
	'calendar.gloss.sundayCycle':
		'Sekmadienio skaitiniai eina per trejus metus — A, B ir C — paeiliui skaitant Matą, Morkų ir Luką, o Joną gavėnioje ir Velykų laike. Ciklas keičiasi pirmąjį advento sekmadienį, kartu su Bažnyčios metais.',
	'calendar.gloss.weekdayCycle':
		'Šiokiadienių skaitiniai eina per dvejus metus, I ir II: pirmasis skaitinys keičiasi, Evangelija ne. Liturginiai metai vadinami pagal kalendorinius metus, kuriais baigiasi — nelyginiai metai yra I, lyginiai II.',
	'calendar.gloss.psalterWeek':
		'Valandų liturgija paskirsto psalmes per keturias savaites, nuo I iki IV, kurios kartojasi visus metus. Tai savaitė, kurios psalmės yra šiandienos, kiekvienam, kas kalba valandas.',
	'calendar.gloss.obligation':
		'Diena, kurią tikintieji privalo dalyvauti Mišiose ir susilaikyti nuo darbų, kurie tam trukdytų. Kiekvienas sekmadienis ir kitos dienos, kurias nustatė kiekviena vyskupų konferencija.',
	'calendar.primer.title': 'Pirmą kartą čia?',
	'calendar.primer.lead':
		'Bažnyčia laikosi savo metų. Jie prasideda adventu, sukasi apie Velykas ir kiekvienai dienai duoda vardą, laipsnį ir spalvą — o šie nulemia, kas tą dieną meldžiama ir skaitoma Mišiose bei Valandų liturgijoje. Taigi „dvidešimt trečiasis eilinis sekmadienis“ yra adresas: jis kunigui, chorui ar kiekvienam, kas meldžiasi namuose, pasako, kurios maldos ir kurie skaitiniai priklauso šiandienai.',
	'calendar.primer.seasons': 'Liturginiai laikotarpiai',
	'calendar.primer.ranks': 'Kuo diena gali būti',
	'calendar.primer.colours': 'Spalvos',
	'calendar.primer.cycles': 'Ciklai',
	'calendar.primer.cyclesLead':
		'Trys skaitikliai, kurie kartu pasako, kurie skaitiniai ir psalmės skirti šiandienai.'
};
