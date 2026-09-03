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

export const sk: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katechizmus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magistérium',
	'nav.socialDoctrine': 'Sociálna náuka',
	'socialDoctrine.landing.title': 'Kompendium sociálnej náuky Cirkvi',
	'socialDoctrine.landing.tagline': 'Čo Cirkev učí o živote v spoločnosti, v 583 číslach.',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Ponuka',
	'nav.summa': 'Suma',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Pokračovať v čítaní',
	'home.works': 'Knižnica',
	'home.ccc.heading': 'Katechizmus a Kompendium',
	'home.magisterium.mostRecent': 'Najnovšie',
	'home.prayers.heading': 'Modlitby',
	'unitNav.previous': 'Predchádzajúce',
	'unitNav.next': 'Ďalšie',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Čítajte celú Bibliu, knihu po knihe, kapitolu po kapitole.',
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
	'ccc.landing.tagline':
		'<strong>Katechizmus</strong> predkladá katolícku náuku v 2 865 očíslovaných odsekoch. <strong>Kompendium</strong> tú istú náuku podáva ako 598 otázok a odpovedí podľa toho istého usporiadania.',
	'document.library.tagline': 'Encykliky, koncilové konštitúcie, dekréty a deklarácie Magistéria.',
	'doctores.landing.title': 'Učitelia Cirkvi',
	'doctores.landing.tagline': 'Teologické diela cirkevných otcov a učiteľov Cirkvi.',
	'summa.landing.title': 'Teologická suma',
	'summa.landing.tagline': 'Tomáš Akvinský, po anglicky a v latinčine, ktorou písal.',
	'prayers.landing.title': 'Bežné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textom vedľa.',
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
	'footer.notEndorsed': 'Nezávislé, bez schválenia Svätej stolice.',
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
	'colophon.typeTitle': 'Písmo',
	'colophon.typeBody':
		'Sadzané písmom EB Garamond, obnovou Georga Duffnera a Octavia Parda typov, ktoré Claude Garamont rezal v 90. rokoch 16. storočia — humanistickej tradície, v ktorej Cirkev tlačí od renesancie. Jeho cyrilika je od tých istých rúk, ale neobnovuje nič: žiadna garamondovská cyrilika nebola nikdy rezaná, takže ruština je sadzaná tvarom nakresleným tak, aby stál vedľa ostatných.',
	'colophon.typeArabic':
		'Arabčina je celkom mimo jeho dosahu a je sadzaná písmom Amiri — obnovou Khaleda Hosnyho nashí rezaného pre tlačiareň Búláq v Káhire v roku 1905, zvolenou z tej istej úvahy ako textové písmo: konkrétne historické knižné písmo namiesto súčasnej kresby.',
	'colophon.typeInitials':
		'Úvodné iniciály sú Pirata One, lomené písmo, ktorého verzálky zostávajú čitateľné vo veľkosti, akú iniciála vyžaduje, a — pre ruštinu — Ponomar, ktorý reprodukuje cirkevnoslovanské písmo Synodálnej tlačiarne. Ponomar sadzí iniciálu a nikdy text: moderná encyklika vysadzaná celá synodálnym písmom by hovorila niečo nepravdivé o tom, čím je. Všetky sú licencované pod SIL Open Font License a poskytované z tejto stránky, nie od tretej strany, takže čítanie stránky nežiada nič od cudzieho servera.'
};
