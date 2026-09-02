/**
 * Latviešu UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 20 editions in Latviešu and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` (the canonical standing statement, Can. 216
 * CIC) and `colophon.copyrightBody3` (how a rights holder reaches us) are the
 * two to check first: both are operative rather than descriptive.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const lv: Dictionary = {
	'nav.bible': 'Bībele',
	'nav.ccc': 'Katehisms',
	'nav.compendium': 'Kompendijs',
	'nav.magisterium': 'Maģistērijs',
	'nav.prayers': 'Lūgšanas',
	'nav.bookmarks': 'Grāmatzīmes',
	'nav.menu': 'Izvēlne',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Turpināt lasīt',
	'home.works': 'Bibliotēka',
	'home.ccc.heading': 'Katehisms un Kompendijs',
	'home.magisterium.mostRecent': 'Jaunākie',
	'home.prayers.heading': 'Lūgšanas',
	'unitNav.previous': 'Iepriekšējais',
	'unitNav.next': 'Nākamais',
	'bible.landing.title': 'Bībele',
	'bible.landing.tagline': 'Lasiet visu Bībeli, grāmatu pēc grāmatas, nodaļu pēc nodaļas.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateihs',
	'bible.group.historical': 'Vēsturiskās grāmatas',
	'bible.group.wisdom': 'Gudrības grāmatas',
	'bible.group.prophetic': 'Praviešu grāmatas',
	'bible.group.gospels': 'Evaņģēliji',
	'bible.group.acts': 'Apustuļu darbi',
	'bible.group.pauline': 'Pāvila vēstules',
	'bible.group.catholicLetters': 'Katoliskās vēstules',
	'bible.group.revelation': 'Atklāsmes grāmata',
	'ccc.landing.title': 'Katoliskās Baznīcas katehisms',
	'ccc.landing.tagline':
		'<strong>Katehisms</strong> izklāsta katolisko mācību 2865 numurētos punktos. <strong>Kompendijs</strong> to pašu mācību sniedz kā 598 jautājumus un atbildes pēc tā paša izkārtojuma.',
	'document.library.tagline':
		'Enciklikas, koncila konstitūcijas, dekrēti un Maģistērija deklarācijas.',
	'doctores.landing.title': 'Baznīcas doktori',
	'doctores.landing.tagline': 'Baznīcas tēvu un Baznīcas doktoru teoloģiskie darbi.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Toms Akvīnietis, angliski un latīņu valodā, kurā viņš rakstīja.',
	'prayers.landing.title': 'Ikdienas lūgšanas',
	'prayers.landing.tagline': 'Lūgšanas ar latīņu tekstu blakus.',
	'colophon.title': 'Kolofons',
	'colophon.lede':
		'Kas ir šī vietne, no kurienes nāk tās teksti un kāda ir mūsu nostāja par to atveidošanu.',
	'colophon.whatThisIs': 'Kas tas ir',
	'colophon.whatThisIsBody':
		'Glossa Catholica ir lasīšanas vietne Svētajiem Rakstiem, Katehismam, Kompendijam un Maģistērija dokumentiem angļu, portugāļu un latīņu valodā. Tā pastāv, lai to lasītu, un neko citu no jums par tās lasīšanu neprasa:',
	'colophon.pointFree':
		'Bez maksas, un vienmēr bez maksas. Nav maksas sienas, nav abonementa, nav nekā, ko pirkt.',
	'colophon.pointNoAds': 'Nav reklāmas un nav nekāda veida sponsorēta izvietojuma.',
	'colophon.pointNoAccounts': 'Nav kontu. Nav kur reģistrēties, nav kur pieteikties.',
	'colophon.pointNoTracking':
		'Nav izsekošanas skriptu, nav trešo pušu koda, nav sīkdatņu. Tikai anonīmi lietojuma skaitļi, bez nekā, kas jūs identificētu.',
	'colophon.pointOffline':
		'Veidota tā, lai pēc pirmās apmeklēšanas turpinātu darboties bezsaistē, lai vājš savienojums nebūtu šķērslis lasīšanai.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica ir laju ticīgo privāta iniciatīva. Tai nav nekāda baznīcas apstiprinājuma, un tā nerunā ar nekādu savu autoritāti.',
	'colophon.textsTitle': 'Teksti',
	'colophon.textsBody':
		'Katrs teksts nāk no nosaukta avota, un katrs darbs norāda savu izdevumu, savu avota lapu un datumu, kad tas iegūts. Svētie Raksti izmanto tulkojumus, kas ir publiskajā īpašumā; Katehisms, Kompendijs un Maģistērija dokumenti nāk no Svētā Krēsla paša publicētajiem tekstiem.',
	'colophon.textsFidelity':
		'Teksts nekad netiek saīsināts, nekad pārstāstīts, nekad pārrakstīts un nekad novietots blakus reklāmai. Acīmredzamus defektus mēs gan labojam — izkritušu vārdu, sabojātu atsauci, marķējumu, kas norijis rindkopu — vienmēr virzienā uz to, ko avots pats iespiež, nekad virzienā uz to, kā, mūsuprāt, tam vajadzētu skanēt.',
	'colophon.countBible': 'Bībeles izdevumi',
	'colophon.countDocuments': 'Maģistērija dokumenti',
	'colophon.copyrightTitle': 'Autortiesības',
	'colophon.copyrightBody1':
		'Katehisms, Kompendijs un Maģistērija dokumenti ir to tiesību turētāju īpašums — galvenokārt Libreria Editrice Vaticana un Komunikācijas dikastērija.',
	'colophon.copyrightBody2':
		'Katrs darbs rāda sava tiesību turētāja paša autortiesību paziņojumu viņu formulējumā un saista uz lapu, no kuras tas ņemts.',
	'colophon.copyrightBody3':
		'Ja jums pieder tiesības uz kādu šeit esošu tekstu un jūs labāk vēlētos, lai tas netiktu publicēts, rakstiet mums.',
	'colophon.contactTitle': 'Kontakti',
	'colophon.contactBody': 'Par jebko, arī par iepriekš minēto:',
	'colophon.contactPending':
		'Kontaktadrese vēl nav iestatīta. Šo vietni nevajadzētu publiskot, kamēr tādas nav — iepriekšējā apņemšanās nav jēgpilna bez veida, kā mūs sasniegt.',
	'colophon.illustrationsTitle': 'Ilustrācijas',
	'colophon.illustrationsBody':
		'Bībele nes Gistava Dorē gravīras, katru novietotu pie tā panta, ko tā attēlo — pēdējais un lielākais no viņa Bībeles cikliem, grieztu kokā pēc viņa zīmējumiem un iespiestu kopā ar tekstu, nevis savāktu beigās.',
	'colophon.illustrationsRights':
		'Tās ir publiskajā īpašumā, kā rāda zemāk esošie datumi, un uzticīga fotogrāfiska publiskajā īpašumā esošas gravīras reprodukcija nenes nekādas jaunas savas autortiesības.',
	'colophon.countPlates': 'gravīras',
	'colophon.countPlateChapters': 'ilustrētas nodaļas',
	'colophon.typeTitle': 'Burti',
	'colophon.typeBody':
		'Salikts ar EB Garamond, Georga Dufnera un Oktavio Pardo atdzīvinājumu burtiem, ko Klods Garamons grieza 1590. gados — humānistiskajā tradīcijā, kurā Baznīca iespiež kopš renesanses. Tā kirilica ir to pašu roku darbs, bet neatdzīvina neko: kirilisks Garamonds nekad nav ticis griezts, tāpēc krievu valoda ir salikta formā, kas zīmēta, lai stāvētu blakus pārējam.',
	'colophon.typeArabic':
		'Arābu valoda tam ir pavisam nesasniedzama un ir salikta ar Amiri — Haleda Hosnija atdzīvinājumu nashi rakstam, kas 1905. gadā griezts Bulakas spiestuvei Kairā, izvēlētu tā paša apsvēruma dēļ kā teksta burti: konkrēts vēsturisks grāmatu raksts, nevis mūsdienu zīmējums.',
	'colophon.typeInitials':
		'Sākuma iniciāļi ir Pirata One, gotisks raksts, kura lielie burti paliek salasāmi tajā izmērā, ko iniciālis prasa, un — krievu valodai — Ponomar, kas atveido Sinodālās spiestuves baznīcslāvu rakstu. Ponomar liek iniciāli un nekad tekstu: mūsdienu enciklika, salikta cauri sinodālajā rakstā, teiktu kaut ko nepatiesu par to, kas tā ir. Visi ir licencēti ar SIL Open Font License un tiek pasniegti no šīs vietnes, nevis no trešās puses, tāpēc lapas lasīšana neprasa neko no kāda cita servera.'
};
