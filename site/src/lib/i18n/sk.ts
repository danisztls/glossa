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
		'Krátky sprievodca tým, čo je tu: čo je každá z týchto kníh, ako sa zapisuje odkaz na ňu, ako nájsť miesto, a poriadky čítania, ktoré cirkev navrhla.',
	'schola.start.heading': 'Ak je vám to všetko nové',
	'schola.start.body': 'Najlepší začiatok je ',
	'schola.start.bodyAfter':
		': to isté učenie ako v Katechizme, oveľa kratšie, písané v otázkach a odpovediach. Má asi desatinu rozsahu a nič nepredpokladá.',
	'schola.bible.heading': 'Ak ste nikdy nečítali Bibliu',
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
	'schola.guide.heading': 'Ako sa tu vyznať',
	'schola.guide.lede':
		'Text je celá stránka; všetko ostatné je ovládací prvok, ktorý môžete prehliadať, kým ho nebudete chcieť.',
	'schola.guide.top.heading': 'Lišta v hlavičke každej stránky',
	'schola.guide.reading.heading': 'Lišta nad textom',
	'schola.feature.search':
		'Napíšte odkaz do poľa hore — kapitolu a verš, číslo odseku, názov dokumentu — a doplní sa vám počas písania. Odkiaľkoľvek stlačte / alebo Ctrl+K, a ? pre ostatné skratky.',
	'schola.feature.languages':
		'Rozhranie a text sa volia osobitne, takže môžete čítať dielo v jednom jazyku, kým tlačidlá zostanú v inom. Kde má dielo vo vašom jazyku niekoľko vydaní, vyberáte aj medzi nimi.',
	'schola.feature.settings':
		'Veľkosť textu, svetlý či tmavý režim, sépia, a koľko poznámkového aparátu chcete vedľa textu.',
	'schola.feature.offline':
		'Pridajte web na domovskú obrazovku a otvorí sa ako aplikácia. Celé diela si môžete stiahnuť a čítať bez pripojenia.',
	'schola.feature.contents':
		'Členenie diela, v ktorom ste — knihy, časti, kapitoly — aby ste sa v ňom pohybovali bez návratu na začiatok.',
	'schola.feature.compare':
		'Dve vydania toho istého miesta vedľa seba — latinčina vedľa vášho jazyka, alebo jeden preklad vedľa druhého.',
	'schola.feature.apparatus':
		'Vlastné poznámky vydania a akýkoľvek komentár napísaný k textu sa ponúkajú vedľa neho, a nie pod ním. Citácie vnútri textu sú odkazy, takže odkaz vedie tam, kam ukazuje.',
	'schola.feature.focus':
		'Odprace všetko okrem textu. Cesta von zostane tam, kde bola lišta, aby za ňou nič neuviazlo.',
	'schola.books.heading': 'Čo je tu a ako sa to cituje',
	'schola.books.lede':
		'Každá z týchto kníh je iného druhu a na každú sa odkazuje vlastným číslom. Príklady ukazujú tvar: napíšte podobný do vyhľadávacieho poľa a dostanete sa na miesto.',
	'schola.cite.label': 'Cituje sa',
	'schola.what.scripture':
		'Písmo, ako ho cirkev prijíma, v oboch Zákonoch. Všetko ostatné tu sa číta v jeho svetle.',
	'schola.cite.scripture': 'kniha, kapitola a verš, v skratkách, ktoré tlačí vaše vydanie',
	'schola.what.catechism':
		'Zhrnutie toho, čomu katolícka cirkev verí, v jednom zväzku. Sám nie je prameňom: zhromažďuje Písmo, otcov, liturgiu a učenie cirkvi, a každý odsek hovorí, odkiaľ pochádza to, čo tvrdí.',
	'schola.cite.catechism':
		'podľa čísla odseku, bežiaceho bez prerušenia od prvej strany k poslednej',
	'schola.what.compendium':
		'To isté učenie podané v otázkach a odpovediach, asi v desatinovom rozsahu.',
	'schola.cite.compendium': 'podľa čísla otázky',
	'schola.what.magisterium':
		'To, čo pápeži a koncily naozaj napísali — encykliky, konštitúcie, dekréty, deklarácie — každý dokument obrátený k určitej chvíli a určitej otázke. Každý je známy podľa svojich úvodných latinských slov.',
	'schola.cite.magisterium': 'podľa názvu dokumentu, potom čísla oddielu v ňom',
	'schola.what.social':
		'Učenie cirkvi o práci, vlastníctve, rodine, politike a mieri, zhromaždené z tých dokumentov do jednej knihy.',
	'schola.cite.social': 'podľa čísla odseku, pod skratkou, ktorú dielo používa samo pre seba',
	'schola.what.law': 'Právo, nie náuka. Hovorí, čo cirkev vyžaduje, a býva menené.',
	'schola.cite.law': 'podľa kánonu, tak sa volajú jeho číslované jednotky',
	'schola.what.doctors':
		'Teológovia, ktorých cirkev vyhlásila za učiteľov. Nenesie to nijakú úradnú autoritu, akokoľvek veľký je jeho autor.',
	'schola.cite.doctors': 'podľa časti, potom otázky — vlastného členenia Sumy',
	'schola.what.prayers': 'Slová, ktorými sa cirkev modlí, s latinčinou vedľa.',
	'schola.cite.prayers': 'podľa názvu; nie je čo citovať číslami',
	'schola.places.heading': 'Nie texty, ale miesta na tomto webe',
	'schola.what.library':
		'Všetky diela webu v jednom zozname, zoskupené podľa predmetu, nie podľa druhu.',
	'schola.what.calendar':
		'Liturgický deň — obdobie, farba a kto sa slávi — pre krajinu, ktorej kalendárom sa riadite.',
	'schola.what.bookmarks':
		'Miesta, ktoré ste si označili, a kde ste naposledy skončili v každom diele. Oboje zostáva v tomto prehliadači a nikam sa neodosiela.',
	'jumpbox.placeholder': 'Prejsť na… (napr. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Hľadať',
	'jumpbox.hint': 'Stlačte / alebo Ctrl+K na prechod k odkazu',
	'jumpbox.noMatch': 'Nič sa nenašlo',
	'jumpbox.suggestions': 'Návrhy',
	'settings.label': 'Nastavenia',
	'darkMode.label': 'Tmavý režim',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Zapnuté',
	'darkMode.off': 'Vypnuté',
	'loadFailed.title': 'To sa nenačítalo',
	'loadFailed.hint':
		'Stránka existuje — pri jej načítaní sa niečo pokazilo. Ďalší pokus obvykle pomôže.',
	'loadFailed.retry': 'Skúsiť znova',
	'loadFailed.retrying': 'Skúša sa…',
	'fontSize.label': 'Veľkosť textu',
	'fontSize.larger': 'Väčší text',
	'fontSize.smaller': 'Menší text',
	'print.label': 'Vytlačiť túto stránku',
	'toTop.label': 'Späť nahor',
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
	'bible.landing.books': 'Knihy',
	'bible.introduction': 'Úvod',
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
	'ccc.landing.title': 'Katechizmus Katolíckej cirkvi',
	'ccc.landing.pairTitle': 'Katechizmus a Kompendium',
	'ccc.landing.tagline':
		'<strong>Katechizmus</strong> predkladá katolícku náuku v 2 865 očíslovaných odsekoch. <strong>Kompendium</strong> tú istú náuku podáva ako 598 otázok a odpovedí podľa toho istého usporiadania.',
	'ccc.landing.pairTagline':
		'Katechizmus Katolíckej cirkvi v 2 865 číslach a jeho Kompendium v 598 otázkach.',
	'compendium.landing.title': 'Kompendium Katechizmu',
	'compendium.landing.tagline': 'Otázky a odpovede zhrňujúce Katechizmus Katolíckej cirkvi.',
	'compendium.question': 'Otázka',
	'compendium.answer': 'Odpoveď',
	'compendium.tableOfContents': 'Obsah',
	'compendium.prevQuestion': 'Predchádzajúca otázka',
	'compendium.nextQuestion': 'Nasledujúca otázka',
	'compendium.condenses': 'Zhŕňa KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'V tomto korpuse chýba číslo otázky',
	'document.library.tagline': 'Encykliky, koncilové konštitúcie, dekréty a deklarácie Magistéria.',
	'doctores.landing.title': 'Učitelia Cirkvi',
	'doctores.landing.tagline': 'Teologické diela cirkevných otcov a učiteľov Cirkvi.',
	'summa.landing.title': 'Teologická suma',
	'summa.landing.tagline': 'Tomáš Akvinský, po anglicky a v latinčine, ktorou písal.',
	'index.division': 'Oddiel',
	'prayers.landing.title': 'Bežné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textom vedľa.',
	'prayers.seeAlso': 'Pozri aj',
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
	'art.about': 'O tomto obrázku',
	'art.detail': 'výrez',
	'colophon.typeTitle': 'Písmo',
	'colophon.typeBody':
		'Sadzané písmom EB Garamond, obnovou Georga Duffnera a Octavia Parda typov, ktoré Claude Garamont rezal v 90. rokoch 16. storočia — humanistickej tradície, v ktorej Cirkev tlačí od renesancie. Jeho cyrilika je od tých istých rúk, ale neobnovuje nič: žiadna garamondovská cyrilika nebola nikdy rezaná, takže ruština je sadzaná tvarom nakresleným tak, aby stál vedľa ostatných.',
	'colophon.typeArabic':
		'Arabčina je celkom mimo jeho dosahu a je sadzaná písmom Amiri — obnovou Khaleda Hosnyho nashí rezaného pre tlačiareň Búláq v Káhire v roku 1905, zvolenou z tej istej úvahy ako textové písmo: konkrétne historické knižné písmo namiesto súčasnej kresby.',
	'colophon.typeInitials':
		'Úvodné iniciály sú Pirata One, lomené písmo, ktorého verzálky zostávajú čitateľné vo veľkosti, akú iniciála vyžaduje, a — pre ruštinu — Ponomar, ktorý reprodukuje cirkevnoslovanské písmo Synodálnej tlačiarne. Ponomar sadzí iniciálu a nikdy text: moderná encyklika vysadzaná celá synodálnym písmom by hovorila niečo nepravdivé o tom, čím je. Všetky sú licencované pod SIL Open Font License a poskytované z tejto stránky, nie od tretej strany, takže čítanie stránky nežiada nič od cudzieho servera.',
	'copyright.sourceTitle': 'Otvoriť pôvodnú zdrojovú stránku',
	'copyright.sourceLabel': 'Zdroj',
	'lang.label': 'Jazyk',
	'lang.filter': 'Hľadať jazyky',
	'lang.more': 'ďalšie jazyky',
	'calendar.title': 'Liturgický kalendár',
	'calendar.tagline':
		'Všeobecný rímsky kalendár, vypočítaný pre ktorýkoľvek deň — jeho obdobie, jeho stupeň, jeho farba.',
	'calendar.date': 'Dátum',
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
	'calendar.noSuchDay': 'Pre tento dátum sa nepočíta nijaký liturgický deň.',
	'calendar.week': 'týždeň',
	'calendar.alsoToday': 'Dnes sa slávi aj',
	'calendar.alsoObserved': 'Dnes pripadá aj',
	'calendar.obligation': 'Prikázaný sviatok',
	'calendar.obligationCanon': 'CIC kán. 1246',
	'calendar.sundayCycle': 'Nedeľný cyklus',
	'calendar.weekdayCycle': 'Feriálny cyklus',
	'calendar.psalterWeek': 'Týždeň žaltára',
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
