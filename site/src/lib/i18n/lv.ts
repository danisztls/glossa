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
 * `site/docs/colophon.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
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

export const lv: Dictionary = {
	'nav.bible': 'Bībele',
	'nav.ccc': 'Katehisms',
	'nav.compendium': 'Kompendijs',
	'nav.magisterium': 'Maģistērijs',
	'nav.socialDoctrine': 'Sociālā mācība',
	'socialDoctrine.landing.title': 'Baznīcas sociālās mācības kompendijs',
	'socialDoctrine.landing.tagline': 'Ko Baznīca māca par dzīvi sabiedrībā, 583 numuros.',
	'nav.canonLaw': 'Kanoniskās tiesības',
	'canonLaw.landing.title': 'Kanonisko tiesību kodekss',
	'canonLaw.landing.tagline': 'Latīņu Baznīcas tiesības 1752 kanonos septiņās grāmatās.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Iepriekšējais kanons',
	'canonLaw.nextCanon': 'Nākamais kanons',
	'canonLaw.readFullTitle': 'Lasīt visu sadaļu',
	'canonLaw.superseded': 'Redakciju aizstāja',
	'nav.prayers': 'Lūgšanas',
	'nav.bookmarks': 'Grāmatzīmes',
	'nav.menu': 'Izvēlne',
	'nav.sections': 'Sadaļas',
	'nav.works': 'Darbi',
	'nav.pages': 'Lapas',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Turpināt lasīt',
	'home.tagline':
		'Lasīšanas vietne Svētajiem Rakstiem, Katehismam un Maģistērija dokumentiem — bez maksas, darbojas arī bezsaistē, un nekur nav jāreģistrējas.',
	'home.doors.heading': 'Kurp doties',
	'home.find.heading': 'Vai ierakstiet atsauci',
	'nav.library': 'Bibliotēka',
	'nav.learn': 'Mācīties',
	'library.landing.tagline':
		'Viss krājums, plaukts pēc plaukta — kopā ar to, kur apstājāties, un to, ko esat atzīmējis.',
	'schola.landing.title': 'Ar ko sākt',
	'schola.landing.tagline':
		'Īss ceļvedis pa to, kas šeit ir: kas ir katra no šīm grāmatām, desmit baušļi un citi saraksti, ko Baznīca prasa zināt katram katolim, un no kurienes sākt lasīt.',
	'schola.start.heading': 'Vai katolicisms jums ir jauns?',
	'schola.start.body': 'Vislabākais sākums ir ',
	'schola.start.bodyAfter':
		': tā pati mācība, kas katehismā, daudz īsāka, uzrakstīta jautājumos un atbildēs. Tā ir apmēram desmito daļu gara un neko nepieņem par pašsaprotamu.',
	'schola.bible.heading': 'Nekad neesat lasījis Bībeli?',
	'schola.bible.library':
		'Tā nav viena grāmata, bet septiņdesmit trīs, rakstītas vairāk nekā tūkstoš gadu garumā un sakārtotas tajā secībā, pie kuras Baznīca apstājās — nevis tajā, kādā notikumi risinājās, un ne tajā, kuru ir visvieglāk lasīt. Vairums sāk pirmajā lappusē un pēc dažām nedēļām beidz, garā senā likuma nodaļā, jo neviens vēl nav pateicis, kam tas domāts.',
	'schola.bible.step.gospel': 'Sāciet ar evaņģēliju',
	'schola.bible.start':
		'Viena no četrām īsām grāmatām par Jēzus dzīvi, dziļi iekšpusē, nevis priekšgalā. Doma nav mūsu: Baznīcas koncils lūdza mācīt pareizu Rakstu lietošanu, „īpaši Jaunās Derības un pirmām kārtām evaņģēliju“. Tas nenosauca nevienu atsevišķi, un mēs arī nenosauksim.',
	'schola.bible.whichGospel':
		'Trīs parasti tiek ieteikti, trīs dažādu iemeslu dēļ. Jebkurš no tiem ir laba vieta, kur būt.',
	'schola.bible.gospel.mark':
		'Īsākais. Jūs varat izlasīt to visu vienā pēcpusdienā, un sākumā vairāk vērts ir vienu pabeigt nekā izvēlēties labāko.',
	'schola.bible.gospel.luke':
		'Rakstīts kādam ārpus ticības, kas gribēja stāstu pierakstītu pēc kārtas — kas varētu būt tieši jūs. Tas turpinās tieši Apustuļu darbos, tāpēc patiesībā ir garākas grāmatas pirmā puse.',
	'schola.bible.gospel.john':
		'Tas, kurš atklāti pasaka, kāpēc uzrakstīts: „lai jūs ticētu“. Vienkārši vārdi, un tas iet taisni pie jautājuma, kas ir Jēzus.',
	'schola.bible.step.acts': 'Tad — kas notika pēc tam',
	'schola.bible.thenActs':
		'Kad esat vienu pabeidzis, izlasiet, ko darīja tie, kas viņu pazina, pēc tam kad viņš bija aizgājis.',
	'schola.bible.acts.why':
		'Trīsdesmit gadi pēc evaņģēliju beigām: pāris desmiti nobijušos cilvēku, un tas, kā redzētais sasniedza impērijas otru malu.',
	'schola.bible.step.old': 'Tad senākā puse',
	'schola.bible.thenOld':
		'Ne no pirmās lappuses, un ne visa. Dažas vietas nes stāstu, un tieši uz tām evaņģēliji atkal un atkal atsaucas atpakaļ.',
	'schola.bible.ot.beginnings': 'Kā tas sākas un kā aiziet greizi.',
	'schola.bible.ot.promise': 'Viena ģimene un tai dots apsolījums, kas pārdzīvo visus tajā.',
	'schola.bible.ot.exodus':
		'Tauta, izvesta no verdzības, un likums, kas tai dots, lai pēc tā dzīvotu.',
	'schola.bible.ot.psalms':
		'Nav stāsts: simt piecdesmit lūgšanu un dziesmu. Lasiet pa vienai, jebkurā secībā. Baznīca tās joprojām lūdz katru dienu.',
	'schola.bible.bothWays':
		'Jūs atpazīsiet lietas, un tā ir jēga, nevis sakritība. Baznīca senākās grāmatas lasa Kristus gaismā un jaunākās — tā gaismā, kas bija pirms tam: katra puse skaidro otru, un tāpēc neviena netiek lasīta viena pati.',
	'schola.books.heading': 'Kas šeit ir',
	'schola.what.scripture':
		'Raksti tādi, kādus tos saņem Baznīca, abās Derībās. Viss pārējais šeit tiek lasīts to gaismā.',
	'schola.what.catechism':
		'Kopsavilkums tam, ko tic Katoliskā Baznīca, vienā sējumā. Pats tas nav avots: tas savāc Rakstus, tēvus, liturģiju un Baznīcas mācību, un katra rindkopa pasaka, no kurienes nāk tas, ko tā apgalvo.',
	'schola.what.compendium':
		'Tā pati mācība, izklāstīta jautājumos un atbildēs, apmēram desmitajā daļā apjoma.',
	'schola.what.magisterium':
		'Tas, ko pāvesti un koncili patiešām ir rakstījuši — enciklikas, konstitūcijas, dekrēti, deklarācijas — katrs adresēts noteiktam brīdim un noteiktam jautājumam. Katrs pazīstams pēc saviem pirmajiem latīņu vārdiem.',
	'schola.what.social':
		'Baznīcas mācība par darbu, īpašumu, ģimeni, politiku un mieru, savākta no tiem dokumentiem vienā grāmatā.',
	'schola.what.law': 'Tiesības, nevis mācība. Tās saka, ko Baznīca prasa, un tiek grozītas.',
	'schola.what.doctors':
		'Teologi, kurus Baznīca ir nosaukusi par Baznīcas doktoriem. Tas nenes nekādu oficiālu autoritāti, lai cik liels būtu autors.',
	'schola.what.prayers': 'Vārdi, ar kuriem Baznīca lūdzas, ar latīņu valodu blakus.',
	'schola.places.heading': 'Ne teksti, bet vietas šajā vietnē',
	'schola.what.library':
		'Visi vietnes darbi vienā sarakstā, sagrupēti pēc priekšmeta, nevis pēc veida.',
	'schola.what.questions':
		'Ieeja lasītājam, kam ir jautājums, bet nav atsauces. Katrs no tiem apkopo fragmentus, kas uz to atbild — vispirms no katehisma — un katrs to vārds ir pašas Baznīcas.',
	'schola.what.calendar':
		'Liturģiskā diena — laiks, krāsa un kas tiek svinēts — tai valstij, kuras kalendāram sekojat.',
	'schola.what.bookmarks':
		'Vietas, ko esat atzīmējis, un kur pēdējoreiz palikāt katrā darbā. Abas paliek šajā pārlūkā un netiek nekur sūtītas.',
	'schola.what.census':
		'Ko šī bibliotēka satur un cik tālu tā sniedzas — cik darbu tajā ir, kādās valodās, un cik daudz no katra jūsu paša valodas lasītājs patiesībā var sasniegt.',
	'ccc.noCounterpart': 'Nav atbilsmes otrā darbā',
	'jumpbox.placeholder': 'Pāriet uz… (piem. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Meklēt',
	'jumpbox.hint': 'Nospiediet / vai Ctrl+K, lai pārietu uz atsauci',
	'jumpbox.noMatch': 'Nekas nav atrasts',
	'jumpbox.suggestions': 'Ieteikumi',
	'settings.label': 'Iestatījumi',
	'apparatus.label': 'Aparāts',
	'apparatus.editionNotes': 'Šī izdevuma piezīmes',
	'apparatus.commentary': 'Komentārs',
	'apparatus.inCommentary': 'Iekļauts iepriekš minētajā komentārā.',
	'darkMode.label': 'Tumšais režīms',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Ieslēgts',
	'darkMode.off': 'Izslēgts',
	'sepia.label': 'Sēpija',
	'sepia.lightOnly': 'Tikai gaišajā režīmā',
	'sepia.noHue': 'Nav pieejams monohromajā režīmā',
	'oled.label': 'OLED melnais',
	'oled.darkOnly': 'Tikai tumšajā režīmā',
	'mono.label': 'Monohroms',
	'mono.hint':
		'Iestata visu lapu vienā pelēkā tonī, lai nekas netiktu atšķirts pēc krāsas. Sēpija izslēdzas, kamēr tas ir ieslēgts.',
	'advanced.label': 'Papildu',
	'library.title': 'Bezsaistes bibliotēka',
	'library.lede': 'Šajā ierīcē saglabātie teksti tiek atvērti pilnīgi bez interneta savienojuma.',
	'library.essentials': 'Lūgšanas un Kompendijs',
	'library.illustrations': 'Bībele (ilustrācijas)',
	'library.illustrationsDetail': 'Bībele (ilustrācijas, augsta izšķirtspēja)',
	'library.other': 'Citi teksti',
	'library.everything': 'Viss',
	'library.downloadAll': 'Lejupielādēt visu',
	'library.download': 'Lejupielādēt',
	'library.downloaded': 'Šajā ierīcē',
	'library.offlineNote': 'Lai kaut ko lejupielādētu, izslēdziet bezsaistes režīmu.',
	'library.remove': 'Noņemt no šīs ierīces',
	'library.removeConfirm': 'Noņemt?',
	'library.forget': 'Noņemt lejupielādes',
	'library.forgetConfirm': 'Noņemt visu?',
	'offline.label': 'Bezsaistes režīms',
	'offline.hint':
		'Nelieto internetu vispār: nekas netiek lejupielādēts, nekas netiek pārbaudīts atjauninājumiem, nekas netiek mērīts. Atvērsies tikai teksti, kas jau ir šajā ierīcē.',
	'offline.notDownloaded': 'Nav šajā ierīcē',
	'loadFailed.title': 'Tas neielādējās',
	'loadFailed.hint':
		'Lapa pastāv — kaut kas nogāja greizi, to ielādējot. Mēģinot vēlreiz, parasti izdodas.',
	'loadFailed.retry': 'Mēģināt vēlreiz',
	'loadFailed.retrying': 'Notiek mēģinājums…',
	'offline.turnOff': 'Izslēgt bezsaistes režīmu',
	'type.label': 'Teksta lielums un fonts',
	'fontSize.label': 'Teksta lielums',
	'fontSize.small': 'Mazs',
	'fontSize.medium': 'Vidējs',
	'fontSize.large': 'Liels',
	'fontSize.xlarge': 'Ļoti liels',
	'fontSize.xxlarge': 'Lielākais',
	'face.label': 'Fonts',
	'face.serif': 'Šerifi',
	'face.sans': 'Bez šerifiem',
	'print.label': 'Drukāt šo lapu',
	'toTop.label': 'Atpakaļ uz augšu',
	'install.label': 'Instalēt Glossa',
	'install.hint.label': 'Pievienot sākuma ekrānam',
	'install.hint.title': 'Pievienojiet Glossa savam sākuma ekrānam',
	'install.hint.stepBefore': 'Tā atveras kā lietotne un lasa bezsaistē. Pieskarieties',
	'install.hint.stepAfter': 'tad „Pievienot sākuma ekrānam”.',
	'install.hint.dismiss': 'Nerādīt',
	'update.label': 'Pieejams jauns izdevums',
	'update.title': 'Jauns izdevums ir gatavs',
	'update.body': 'Pārlādējiet, lai iegūtu jaunākos tekstus un labojumus.',
	'update.action': 'Pārlādēt',
	'update.dismiss': 'Ne tagad',
	'edition.label': 'Izdevums',
	'edition.select': 'Izvēlēties izdevumu',
	'edition.current': 'Pašreizējais izdevums',
	'edition.filter': 'Meklēt izdevumus',
	'menu.noMatches': 'Nav atbilsmju',
	'unitNav.previous': 'Iepriekšējais',
	'unitNav.next': 'Nākamais',
	'bible.prevChapter': 'Iepriekšējā nodaļa',
	'bible.nextChapter': 'Nākamā nodaļa',
	'bible.pickBook': 'Grāmatas un nodaļas',
	'bible.landing.title': 'Bībele',
	'bible.landing.tagline': 'Lasiet visu Bībeli, grāmatu pēc grāmatas, nodaļu pēc nodaļas.',
	'bible.landing.random': 'Man paveiksies',
	'bible.landing.books': 'Grāmatas',
	'bible.chapterUnavailable': 'Nav pieejams šajā izdevumā',
	'bible.introduction': 'Ievads',
	'bible.introUnavailable': 'Ievads šajā valodā vēl nav pieejams',
	'bible.introSource': 'Ievadi nav Svēto Rakstu teksta daļa.',
	'bible.testament.ot': 'Vecā Derība',
	'bible.testament.nt': 'Jaunā Derība',
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
	'ccc.prevParagraph': 'Iepriekšējā rindkopa',
	'ccc.nextParagraph': 'Nākamā rindkopa',
	'ccc.inBrief': 'Īsumā',
	'ccc.landing.title': 'Katoliskās Baznīcas katehisms',
	'ccc.landing.pairTitle': 'Katehisms un Kompendijs',
	'ccc.landing.tagline':
		'<strong>Katehisms</strong> izklāsta katolisko mācību 2865 numurētos punktos. <strong>Kompendijs</strong> to pašu mācību sniedz kā 598 jautājumus un atbildes pēc tā paša izkārtojuma.',
	'ccc.landing.pairTagline':
		'Katoliskās Baznīcas katehisms 2865 numuros un tā Kompendijs 598 jautājumos.',
	'ccc.tableOfContents': 'Saturs',
	'ccc.related': 'Skatiet arī',
	'compendium.landing.title': 'Katehisma kompendijs',
	'compendium.landing.tagline': 'Jautājumi un atbildes, kas apkopo Katoliskās Baznīcas katehismu.',
	'compendium.question': 'Jautājums',
	'compendium.answer': 'Atbilde',
	'compendium.tableOfContents': 'Saturs',
	'compendium.prevQuestion': 'Iepriekšējais jautājums',
	'compendium.nextQuestion': 'Nākamais jautājums',
	'compendium.condenses': 'Apkopo KBK ¶¶',
	'ccc.abbrev': 'KBK',
	'ccc.condensedIn': 'Kompendijā',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Šajā korpusā nav jautājuma numura',
	'document.library.tagline':
		'Enciklikas, koncila konstitūcijas, dekrēti un Maģistērija deklarācijas.',
	'document.filter.heading': 'Filtrs',
	'document.filter.author': 'Autors',
	'document.filter.kind': 'Veids',
	'document.filter.subject': 'Tēma',
	'document.filter.search': 'Meklēt dokumentus',
	'document.filter.clear': 'Notīrīt',
	'document.filter.results': 'Rādītie dokumenti',
	'document.filter.noResults': 'Neviens dokuments neatbilst šiem filtriem.',
	'document.tableOfContents': 'Saturs',
	'document.startReading': 'Sākt lasīt',
	'document.readFullDocument': 'Lasīt visu dokumentu',
	'document.section': 'Sadaļa',
	'document.prevSection': 'Iepriekšējā',
	'document.nextSection': 'Nākamā',
	'document.kind.conciliarConstitution': 'Konstitūcija',
	'document.kind.conciliarDecree': 'Dekrēts',
	'document.kind.conciliarDeclaration': 'Deklarācija',
	'document.kind.encyclical': 'Enciklika',
	'document.kind.apostolicExhortation': 'Apustuliskais pamudinājums',
	'document.kind.apostolicConstitution': 'Apustuliskā konstitūcija',
	'document.kind.apostolicLetter': 'Apustuliskā vēstule',
	'document.kind.cdfDeclaration': 'TMK deklarācija',
	'document.kind.cdfInstruction': 'TMK instrukcija',
	'document.kind.cdfLetter': 'TMK vēstule',
	'document.kind.cdfDoctrinalNote': 'TMK doktrinālā piezīme',
	'document.kind.cdfResponsum': 'TMK Responsum',
	'document.kind.cdfConsiderations': 'TMK apsvērumi',
	'document.kindPlural.conciliarConstitution': 'Konstitūcijas',
	'document.kindPlural.conciliarDecree': 'Dekrēti',
	'document.kindPlural.conciliarDeclaration': 'Deklarācijas',
	'document.kindPlural.encyclical': 'Enciklikas',
	'document.kindPlural.apostolicExhortation': 'Apustuliskie pamudinājumi',
	'document.kindPlural.apostolicConstitution': 'Apustuliskās konstitūcijas',
	'document.kindPlural.apostolicLetter': 'Apustuliskās vēstules',
	'document.kindPlural.cdfDeclaration': 'TMK deklarācijas',
	'citation.unavailable': 'Šai piezīmei nav pieejams avota teksts.',
	'doctores.landing.title': 'Baznīcas doktori',
	'doctores.landing.tagline': 'Baznīcas tēvu un Baznīcas doktoru teoloģiskie darbi.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Toms Akvīnietis, angliski un latīņu valodā, kurā viņš rakstīja.',
	'summa.tableOfContents': 'Saturs',
	'summa.part': 'Daļa',
	'summa.question': 'Jautājums',
	'summa.article': 'Artikuls',
	'summa.questionShort': 'J',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Nosaukums no {lang} izdevuma',
	'summa.titlesFromEdition': 'Nosaukumi no {lang} izdevuma — šis neizdrukā nevienu',
	'summa.prologue': 'Prologs',
	'summa.objection': 'Iebildums',
	'summa.sedContra': 'Turpretī',
	'summa.corpus': 'Es atbildu, ka',
	'summa.reply': 'Atbilde uz iebildumu',
	'summa.preamble': 'Piezīme',
	'summa.prevQuestion': 'Iepriekšējais jautājums',
	'summa.nextQuestion': 'Nākamais jautājums',
	'summa.noEditionInYourLanguage': 'Summai nav izdevuma jūsu valodā. Rādīts {lang} valodā.',
	'summa.noLatinSupplement':
		'Papildinājums pastāv tikai angļu valodā — tas tika sastādīts pēc Akvīnieša nāves.',
	'index.division': 'Iedaļa',
	'index.showSubsections': 'Rādīt apakšsadaļas',
	'index.hideSubsections': 'Slēpt apakšsadaļas',
	'prayers.landing.title': 'Ikdienas lūgšanas',
	'prayers.landing.tagline': 'Lūgšanas ar latīņu tekstu blakus.',
	'prayers.tableOfContents': 'Saturs',
	'prayers.gloss.versicle':
		'Versikuls — rinda, ko lūgšanas vadītājs saka vai dzied viens pats. Draudze atbild ar tālāk sekojošo atbildi.',
	'prayers.gloss.response':
		'Atbilde — rinda, ko draudze saka vai dzied kopā, atbildot uz iepriekšējo versikulu.',
	'prayers.seeAlso': 'Skatiet arī',
	'prayers.prevPrayer': 'Iepriekšējā lūgšana',
	'prayers.nextPrayer': 'Nākamā lūgšana',
	'prayers.rosary.today': 'Šodien',
	'prayers.rosary.todayHeading': 'Šodienas noslēpumi',
	'prayers.rosary.openingPrayer': 'Ievada lūgšana',
	'prayers.rosary.decadePrayers': 'Vienas desmitiņas lūgšanas',
	'ref.tooltip.loading': 'Ielādē…',
	'ref.tooltip.openCcc': 'Atvērt Katehismā',
	'ref.tooltip.openBible': 'Atvērt Bībelē',
	'ref.tooltip.openCompendium': 'Atvērt Kompendijā',
	'ref.preview.open': 'Atvērt',
	'ref.cf': 'sal.',
	'anchor.actions': 'Darbības ar atsauci',
	'anchor.copy': 'Kopēt tekstu',
	'anchor.copyLink': 'Kopēt saiti',
	'anchor.view': 'Skatīt',
	'anchor.copied': 'Nokopēts',
	'anchor.copyFailed': 'Neizdevās nokopēt',
	'bookmark.add': 'Atzīmēt',
	'bookmark.remove': 'Noņemt grāmatzīmi',
	'bookmark.library': 'Grāmatzīmes',
	'bookmark.library.tagline': 'Viss, ko esat atzīmējis lasot.',
	'bookmark.empty': 'Pagaidām nekas nav atzīmēts.',
	'bookmark.emptyHint':
		'Noklikšķiniet uz panta vai rindkopas numura un izvēlieties Atzīmēt, vai izmantojiet lapas grāmatzīmes pogu.',
	'bookmark.about': 'Par šīm grāmatzīmēm',
	'bookmark.deviceOnly':
		'Grāmatzīmes glabājas tikai šajā pārlūkā. Tās nekur netiek sūtītas, un pārlūka datu dzēšana tās noņem.',
	'bookmark.unavailable': 'Nav tajā izdevumā, ko lasāt',
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
	'footer.notEndorsed': 'Bez Svētā Krēsla apstiprinājuma',
	'colophon.textsTitle': 'Teksti',
	'colophon.textsBody':
		'Katrs teksts nāk no nosaukta avota, un katrs darbs norāda savu izdevumu, savu avota lapu un datumu, kad tas iegūts. Svētie Raksti izmanto tulkojumus, kas ir publiskajā īpašumā; Katehisms, Kompendijs un Maģistērija dokumenti nāk no Svētā Krēsla paša publicētajiem tekstiem.',
	'colophon.textsFidelity':
		'Teksts nekad netiek saīsināts, nekad pārstāstīts, nekad pārrakstīts un nekad novietots blakus reklāmai. Acīmredzamus defektus mēs gan labojam — izkritušu vārdu, sabojātu atsauci, marķējumu, kas norijis rindkopu — vienmēr virzienā uz to, ko avots pats iespiež, nekad virzienā uz to, kā, mūsuprāt, tam vajadzētu skanēt.',
	'colophon.countBible': 'Bībeles izdevumi',
	'colophon.countDocuments': 'Maģistērija dokumenti',
	'colophon.privacyTitle': 'Privātums',
	'colophon.privacyBody1':
		'Nav kontu, nav sīkdatņu, nav reklāmas, nav trešo pušu koda. Nekas šeit jums neseko prom no šīs vietnes.',
	'colophon.privacyBody2':
		'Mēs gan skaitām, kā vietne tiek izmantota: viens mērījums par vienu apmeklējumu, katrs lauks kā diapazons, nevis precīza vērtība — cik ilgi paliekat, cik bieži esat bijis šeit, kurus darbus esat atvēris. Jūsu valsts tiek skaitīta atsevišķi, nekādā veidā nesaistot to ar pārējo. Tas apraksta apmeklējumu, nevis apmeklētāju, un tiek glabāts {days} dienas.',
	'colophon.privacyBody3':
		'Nekad netiek sūtīts: tas, ko ierakstāt meklēšanas laukā, kuru fragmentu esat atvēris, vai jebkas, kas varētu atkārtoti atpazīt jūsu ierīci. Jūsu iestatījumi, grāmatzīmes un lejupielādētie teksti paliek jūsu ierīcē.',
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
	'plates.scansBy': 'Skenējumus nodrošinājis',
	'plates.enlarge': 'Palielināt {title}',
	'plates.zoom': 'Tuvināt',
	'art.about': 'Par šo attēlu',
	'art.detail': 'fragments',
	'colophon.typeTitle': 'Burti',
	'colophon.typeBody':
		'Salikts ar EB Garamond, Georga Dufnera un Oktavio Pardo atdzīvinājumu burtiem, ko Klods Garamons grieza 1590. gados — humānistiskajā tradīcijā, kurā Baznīca iespiež kopš renesanses. Tā kirilica ir to pašu roku darbs, bet neatdzīvina neko: kirilisks Garamonds nekad nav ticis griezts, tāpēc krievu valoda ir salikta formā, kas zīmēta, lai stāvētu blakus pārējam.',
	'colophon.typeArabic':
		'Arābu valoda tam ir pavisam nesasniedzama un ir salikta ar Amiri — Haleda Hosnija atdzīvinājumu nashi rakstam, kas 1905. gadā griezts Bulakas spiestuvei Kairā, izvēlētu tā paša apsvēruma dēļ kā teksta burti: konkrēts vēsturisks grāmatu raksts, nevis mūsdienu zīmējums.',
	'colophon.typeInitials':
		'Sākuma iniciāļi ir Pirata One, gotisks raksts, kura lielie burti paliek salasāmi tajā izmērā, ko iniciālis prasa, un — krievu valodai — Ponomar, kas atveido Sinodālās spiestuves baznīcslāvu rakstu. Ponomar liek iniciāli un nekad tekstu: mūsdienu enciklika, salikta cauri sinodālajā rakstā, teiktu kaut ko nepatiesu par to, kas tā ir. Visi ir licencēti ar SIL Open Font License un tiek pasniegti no šīs vietnes, nevis no trešās puses, tāpēc lapas lasīšana neprasa neko no kāda cita servera.',
	'refs.citedIn': 'Citēts',
	'refs.externalVolume': '{volume}. sējums vietnē {host} — skenēts PDF',
	'bible.wholeChapter': 'Šī nodaļa',
	'bible.verseNotInEdition': 'Šis panta numurs nav šajā izdevumā — skatiet piezīmi lapas avotā',
	'bible.verseAbbrev': 'p.',
	'bible.note': 'Piezīme',
	'bible.noteMissing': 'Šīs piezīmes korpusā nav',
	'bible.chapterArgument': 'Kopsavilkums',
	'ccc.readFullChapter': 'Lasīt visu nodaļu',
	'ccc.noParagraphNumber': 'Šajā korpusā nav rindkopas numura',
	'copyright.sourceTitle': 'Atvērt sākotnējo avota lapu',
	'copyright.sourceLabel': 'Avots',
	'lang.label': 'Valoda',
	'lang.filter': 'Meklēt valodas',
	'lang.more': 'vairāk valodu',
	'notFound.title': 'Šajā adresē nekā nav',
	'notFound.lede': 'Lapa, ko meklējat, šeit neatrodas.',
	'notFound.body':
		'Saite var būt kļūdaina vai novecojusi, vai arī tā norāda uz tekstu, kura šajā vietnē nav.',
	'notFound.searchHint':
		'Ja zināt vēlamo atsauci — grāmatu un nodaļu, Katehisma rindkopu — ierakstiet to meklēšanas laukā šīs lapas augšpusē.',
	'notFound.credit': 'Balstīts uz British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Vai sāciet no kāda no šiem:',
	'notFound.home': 'Sākums',
	'compare.enter': 'Salīdzināt izdevumus',
	'compare.exit': 'Iziet no salīdzināšanas',
	'compare.missing': 'Nav šajā izdevumā',
	'compare.versificationNote':
		'Šie divi izdevumi dažviet dala šīs nodaļas pantus atšķirīgi (teksta variants, nevis tulkojuma izvēle) — vienādais panta numurs abās kolonnās ne vienmēr apzīmē to pašu teikumu.',
	'compare.loading': 'Ielādē otro valodu…',
	'ui.close': 'Aizvērt',
	'shortcuts.title': 'Tastatūras saīsnes',
	'shortcuts.betweenDocuments': 'Starp dokumentiem',
	'shortcuts.withinDocument': 'Dokumenta iekšienē',
	'shortcuts.show': 'Rādīt šo sarakstu',
	'help.title': 'Palīdzība',
	'help.reading.heading': 'Josla virs teksta',
	'help.feature.offline':
		'Pievienojiet vietni sākuma ekrānam, un tā atvērsies kā lietotne. Varat lejupielādēt veselus darbus, lai lasītu bez savienojuma.',
	'help.feature.contents':
		'Tā darba dalījums, kurā atrodaties — grāmatas, daļas, nodaļas — lai pārvietotos tā iekšienē, neatgriežoties pie sākuma.',
	'help.feature.compare':
		'Divi viena un tā paša fragmenta izdevumi blakus — latīņu valoda blakus jūsu pašu valodai, vai viens tulkojums blakus citam.',
	'help.feature.apparatus':
		'Izdevuma paša piezīmes un jebkurš tekstam rakstīts komentārs tiek piedāvāti tam blakus, nevis zem tā. Atsauces teksta iekšienē ir saites, tāpēc norāde ved turp, kurp tā rāda.',
	'help.feature.focus':
		'Notīra visu, izņemot tekstu. Izeja paliek tur, kur bija josla, lai nekas neieslēgtos aiz tās.',
	'zen.enter': 'Fokusa režīms',
	'zen.exit': 'Iziet no fokusa režīma',
	'nav.calendar': 'Kalendārs',
	'calendar.title': 'Liturģiskais kalendārs',
	'calendar.tagline':
		'Vispārējais Romas kalendārs, aprēķināts jebkurai dienai — tās laiks, tās pakāpe, tās krāsa.',
	'calendar.national.tagline': '{name} ar savām svinībām, aprēķināts jebkurai dienai.',
	'calendar.calendar': 'Kalendārs',
	'calendar.which.general': 'Vispārējais Romas kalendārs',
	'calendar.filter': 'Meklēt valstis',
	'calendar.region.europe': 'Eiropa',
	'calendar.region.americas': 'Amerikas',
	'calendar.region.africa': 'Āfrika',
	'calendar.region.middleEast': 'Tuvie Austrumi',
	'calendar.region.asia': 'Āzija',
	'calendar.region.oceania': 'Okeānija',
	'calendar.today': 'Šodien',
	'calendar.previousMonth': 'Iepriekšējais mēnesis',
	'calendar.nextMonth': 'Nākamais mēnesis',
	'calendar.plainDays': 'Vienkāršās darbdienas',
	'calendar.noSuchDay': 'Šim datumam liturģiskā diena netiek aprēķināta.',
	'calendar.week': 'nedēļa',
	'calendar.alsoToday': 'Šodien svin arī',
	'calendar.alsoObserved': 'Šodien atzīmē arī',
	'calendar.obligation': 'Obligātie svētki',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Svētdienu cikls',
	'calendar.weekdayCycle': 'Darbdienu cikls',
	'calendar.psalterWeek': 'Psalmu nedēļa',
	'lectionary.heading': 'Mises lasījumi',
	'lectionary.slot.reading': 'Lasījums',
	'lectionary.slot.reading1': 'Pirmais lasījums',
	'lectionary.slot.reading2': 'Otrais lasījums',
	'lectionary.slot.reading3': 'Trešais lasījums',
	'lectionary.slot.reading4': 'Ceturtais lasījums',
	'lectionary.slot.reading5': 'Piektais lasījums',
	'lectionary.slot.reading6': 'Sestais lasījums',
	'lectionary.slot.reading7': 'Septītais lasījums',
	'lectionary.slot.psalm': 'Atbildes psalms',
	'lectionary.slot.epistle': 'Vēstule',
	'lectionary.slot.acclamation': 'Evaņģēlija aklamācija',
	'lectionary.slot.gospel': 'Evaņģēlijs',
	'lectionary.slot.sequence': 'Sekvence',
	'lectionary.or': 'vai',
	'lectionary.cf': 'Sal.',
	'lectionary.about': 'Par šiem lasījumiem',
	'lectionary.caveat':
		'Fragmenti, ko noteikusi Ordo Lectionum Missae, saistīti ar šīs vietnes pašas izdevumiem — nevis tulkojums, kas tiek pasludināts kādā konkrētā baznīcā, un konference var pielāgot grafiku.',
	'calendar.transferredFrom': 'Pārcelts no',
	'calendar.season.advent': 'Adventa laiks',
	'calendar.season.christmas': 'Ziemsvētku laiks',
	'calendar.season.lent': 'Gavēņa laiks',
	'calendar.season.triduum': 'Lieldienu tridijs',
	'calendar.season.easter': 'Lieldienu laiks',
	'calendar.season.ordinary': 'Parastais liturģiskais laiks',
	'calendar.colour.white': 'Balta',
	'calendar.colour.red': 'Sarkana',
	'calendar.colour.green': 'Zaļa',
	'calendar.colour.violet': 'Violeta',
	'calendar.colour.rose': 'Rozā',
	'calendar.colour.black': 'Melna',
	'calendar.colour.blue': 'Zila',
	'calendar.rank.solemnity': 'Lieli svētki',
	'calendar.rank.feast': 'Svētki',
	'calendar.rank.memorial': 'Piemiņas diena',
	'calendar.rank.optional-memorial': 'Brīvas izvēles piemiņas diena',
	'calendar.rank.commemoration': 'Piemiņa',
	'calendar.rank.sunday': 'Svētdiena',
	'calendar.rank.weekday': 'Darbdiena',
	'calendar.gloss.season.advent':
		'Četras nedēļas pirms Ziemassvētkiem: sagatavošanās Kunga atnākšanai un Baznīcas gada sākums.',
	'calendar.gloss.season.christmas':
		'No Ziemassvētkiem līdz Kunga kristīšanai, svinot Kunga dzimšanu un viņa parādīšanos pasaulei.',
	'calendar.gloss.season.lent':
		'Četrdesmit dienas no Pelnu trešdienas līdz Kunga Vakarēdiena vakara Misei: gandarīšana, žēlsirdības dāvanas un sagatavošanās Lieldienām.',
	'calendar.gloss.season.triduum':
		'Trīs dienas no Lielās ceturtdienas vakara līdz Lieldienu svētdienas vakaram — Kunga ciešanas, nāve un augšāmcelšanās, visa gada virsotne.',
	'calendar.gloss.season.easter':
		'Piecdesmit dienas no Lieldienām līdz Vasarsvētkiem, svinētas kā vieni vienīgi svētki — „viena liela svētdiena”.',
	'calendar.gloss.season.ordinary':
		'Trīsdesmit trīs vai trīsdesmit četras nedēļas ārpus pārējiem laikiem. Nevis „parasts”, bet sakārtots: nedēļas ir skaitītas, un Baznīca pēc kārtas lasa Kunga dzīvi un mācību. Tas nāk divos posmos — pēc Ziemassvētku laika līdz gavēnim, un pēc Vasarsvētkiem līdz Adventam.',
	'calendar.gloss.rank.solemnity':
		'Augstākā pakāpe: Lieldienas, Ziemassvētki, Debeskāpšana, vietas aizbildnis. Svin ar Gods Dievam un Ticības apliecinājumu, un sākas iepriekšējā vakarā.',
	'calendar.gloss.rank.feast':
		'Svin pašā dienā. Apustuļi un evaņģēlisti, kā arī lielākās Kunga un Dievmātes dienas.',
	'calendar.gloss.rank.memorial':
		'Svētais, ko piemin viņa dienā, attiecīgā laika Mises un Stundu liturģijas ietvaros. Obligāta tur, kur to svin.',
	'calendar.gloss.rank.optional-memorial':
		'Var svinēt vai nesvinēt, pēc priestera vai kopienas izvēles. Ja nesvin, diena ir vienkārši darbdiena.',
	'calendar.gloss.rank.commemoration':
		'Tas, par ko piemiņas diena kļūst gavēnī: lūgšana, kas pievienota darbdienas Misei, kuru laiks citādi patur veselu.',
	'calendar.gloss.rank.sunday':
		'Pirmatnējie svētki — Kunga diena, svinēta ik nedēļu kopš augšāmcelšanās. Tikai lieli svētki vai Kunga svētki drīkst to aizstāt, bet Adventā, gavēnī un Lieldienu laikā pat tie ne.',
	'calendar.gloss.rank.weekday':
		'Diena bez pašas svinēšanas. Mise un Stundu liturģija ir no attiecīgā laika — un tieši tas padara laiku vērtu zināšanas.',
	'calendar.gloss.colour.white':
		'Prieks. Lieldienu un Ziemassvētku laiks, Kunga dienas ārpus viņa ciešanām, Dievmāte, eņģeļi un tie svētie, kas nebija mocekļi.',
	'calendar.gloss.colour.red':
		'Asinis un uguns. Pūpolsvētdiena un Lielā piektdiena, Vasarsvētki, apustuļi un evaņģēlisti, kā arī mocekļi.',
	'calendar.gloss.colour.green': 'Parastais liturģiskais laiks: cerības krāsa un tā, kas aug.',
	'calendar.gloss.colour.violet': 'Advents un gavēnis, un to nēsā arī Misēs par mirušajiem.',
	'calendar.gloss.colour.rose':
		'Nēsā divreiz gadā — Gaudete svētdienā, trešajā Adventa, un Laetare svētdienā, ceturtajā gavēņa — kur gavēnis atvieglojas un beigas ir redzamas.',
	'calendar.gloss.colour.black': 'Drīkst nēsāt Misēs par mirušajiem.',
	'calendar.gloss.colour.blue':
		'Zilās krāsas privilēģija: nēsā Vissvētākās Jaunavas Marijas bezvainīgās ieņemšanas svētkos Spānijā, Filipīnās un tajās nedaudzajās citās vietās, kurām Svētais Krēsls to piešķīris.',
	'calendar.gloss.sundayCycle':
		'Svētdienas lasījumi rit trīs gados — A, B un C — pēc kārtas lasot Mateju, Marku un Lūkasu, ar Jāni gavēnī un Lieldienu laikā. Cikls mainās pirmajā Adventa svētdienā, kopā ar Baznīcas gadu.',
	'calendar.gloss.weekdayCycle':
		'Darbdienu lasījumi rit divos gados, I un II: pirmais lasījums mainās, Evaņģēlijs ne. Liturģiskais gads tiek nosaukts pēc kalendārā gada, kurā tas beidzas — nepāra gadi ir I, pāra gadi II.',
	'calendar.gloss.psalterWeek':
		'Stundu liturģija sadala psalmus četrās nedēļās, no I līdz IV, kas atkārtojas visu gadu. Šī ir nedēļa, kuras psalmi ir šodienas, ikvienam, kas lūdzas stundas.',
	'calendar.gloss.obligation':
		'Diena, kurā ticīgajiem ir pienākums piedalīties Misē un atturēties no darbiem, kas to traucētu. Katra svētdiena, un pārējās dienas, ko noteikusi attiecīgā bīskapu konference.',
	'calendar.primer.title': 'Pirmo reizi šeit?',
	'calendar.primer.lead':
		'Baznīca tur savu gadu. Tas sākas ar Adventu, griežas ap Lieldienām un dod katrai dienai vārdu, pakāpi un krāsu — un tie izšķir, ko šajā dienā lūdz un lasa Misē un Stundu liturģijā. Tā „divdesmit trešā parastā liturģiskā laika svētdiena” ir adrese: tā pasaka priesterim, korim vai ikvienam, kas lūdzas mājās, kuras lūgšanas un lasījumi pieder šodienai.',
	'calendar.primer.seasons': 'Liturģiskie laiki',
	'calendar.primer.ranks': 'Kas diena var būt',
	'calendar.primer.colours': 'Krāsas',
	'calendar.primer.cycles': 'Cikli',
	'calendar.primer.cyclesLead':
		'Trīs skaitītāji, kas kopā pasaka, kuri lasījumi un psalmi ir noteikti šodienai.'
};
