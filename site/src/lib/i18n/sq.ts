/**
 * Shqip UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-09-04, with the other content languages that had no interface.
 * The corpus holds `csdc.sq` — the whole Compendium of the Social Doctrine,
 * 583 paragraphs — and nothing else, Albanian being the one language
 * vatican.va publishes that work in and no other work here. Its readers were
 * reading it inside English chrome, which is the combination `../ui-langs.ts`
 * says the interface list should never leave standing.
 *
 * NO ENTRY IN `sw-policy.ts`'s font table, and that is correct rather than
 * the same omission one layer down: Albanian's `ë` and `ç` are Latin-1
 * Supplement, which the core `latin` subset carries, so nothing here needs a
 * deferred face. Compare `lt`, whose `ė ų ū č š ž` are Latin Extended-A and
 * do.
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

export const sq: Dictionary = {
	'nav.bible': 'Bibla',
	'nav.ccc': 'Katekizmi',
	'nav.compendium': 'Përmbledhja',
	'nav.magisterium': 'Magjisteri',
	'nav.socialDoctrine': 'Doktrina shoqërore',
	'socialDoctrine.landing.title': 'Përmbledhje e doktrinës shoqërore të Kishës',
	'socialDoctrine.landing.tagline':
		'Çfarë mëson Kisha për jetën në shoqëri, në 583 paragrafë të numëruar.',
	'nav.canonLaw': 'E drejta kanonike',
	'canonLaw.landing.title': 'Kodi i së Drejtës Kanonike',
	'canonLaw.landing.tagline': 'Ligji i Kishës Latine, në 1.752 kanone të ndara në shtatë libra.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kann.',
	'canonLaw.prevCanon': 'Kanoni i mëparshëm',
	'canonLaw.nextCanon': 'Kanoni në vijim',
	'canonLaw.readFullTitle': 'Lexo titullin e plotë',
	'canonLaw.superseded': 'Formulim i zëvendësuar nga',
	'nav.prayers': 'Lutje',
	'nav.bookmarks': 'Faqeshënues',
	'nav.menu': 'Menyja',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Vazhdo leximin',
	'home.tagline':
		'Një faqe leximi për Shkrimet, Katekizmin dhe dokumentet e Magjisterit — falas, punon edhe pa internet, dhe s’ka asgjë për t’u regjistruar.',
	'home.doors.heading': 'Ku të shkoni',
	'home.find.heading': 'Ose shkruani një referencë',
	'nav.library': 'Biblioteka',
	'nav.learn': 'Mëso',
	'library.landing.tagline':
		'I gjithë korpusi, raft pas rafti — bashkë me vendin ku e latë dhe me atë që keni shënuar.',
	'schola.landing.title': 'Nga t’ia nisni',
	'schola.landing.tagline':
		'Një udhërrëfyes i shkurtër për atë që gjendet këtu: çfarë është secili prej këtyre librave, si shkruhet një referencë për të, si gjendet një pasazh, dhe radhë leximi që Kisha ka propozuar.',
	'schola.start.heading': 'Nëse e gjitha kjo është e re për ju',
	'schola.start.body': 'Fillimi më i mirë është ',
	'schola.start.bodyAfter':
		': i njëjti mësim si i Katekizmit, shumë më i shkurtër, shkruar në pyetje dhe përgjigje. Është rreth një e dhjeta e gjatësisë dhe nuk merr asgjë të mirëqenë.',
	'schola.bible.heading': 'Nëse nuk e keni lexuar kurrë Biblën',
	'schola.bible.library':
		'Nuk është një libër por shtatëdhjetë e tre, shkruar përgjatë më shumë se një mijë vjetësh dhe të lidhur në atë radhë ku Kisha u ndal — jo radha në të cilën ndodhën gjërat, dhe jo ajo që lexohet më lehtë. Shumica fillon në faqen e parë dhe ndalet ca javë më vonë, në një kapitull të gjatë ligji të lashtë, sepse askush nuk u ka thënë ende përse shërben.',
	'schola.bible.step.gospel': 'Filloni me një Ungjill',
	'schola.bible.start':
		'Një nga katër libra të shkurtër për jetën e Jezusit, thellë brenda dhe jo në ballë. Nuk është ideja jonë: një Koncil i Kishës kërkoi që të mësohej përdorimi i drejtë i Shkrimit, „sidomos i Besëlidhjes së Re dhe mbi të gjitha i Ungjijve“. Nuk emëroi asnjë veç e veç, dhe as ne nuk do të emërojmë.',
	'schola.bible.whichGospel':
		'Tre zakonisht propozohen, për tri arsye të ndryshme. Cilido prej tyre është një vend i mirë ku të jesh.',
	'schola.bible.gospel.mark':
		'Më i shkurtri. Mund ta lexoni të tërin në një pasdite, dhe të kesh mbaruar një vlen më shumë, në fillim, sesa të kesh zgjedhur më të mirin.',
	'schola.bible.gospel.luke':
		'Shkruar për dikë jashtë besimit që donte historinë të vënë me radhë — që mund të jeni pikërisht ju. Vazhdon drejtpërdrejt në Veprat e Apostujve, prandaj është në të vërtetë gjysma e parë e një libri më të gjatë.',
	'schola.bible.gospel.john':
		'Ai që e thotë hapur pse u shkrua: „që ju të besoni“. Fjalë të thjeshta, dhe shkon drejt te pyetja se kush është Jezusi.',
	'schola.bible.step.acts': 'Pastaj çfarë ndodhi më tej',
	'schola.bible.thenActs':
		'Kur të keni mbaruar një, lexoni çfarë bënë ata që e njihnin, pasi ai iku.',
	'schola.bible.acts.why':
		'Tridhjetë vjetët pas fundit të Ungjijve: ca dhjetëra njerëz të frikësuar, dhe si ajo që kishin parë arriti në skajin tjetër të perandorisë.',
	'schola.bible.step.old': 'Pastaj gjysma më e vjetër',
	'schola.bible.thenOld':
		'Jo nga faqja e parë, dhe jo e gjitha. Pak vende e mbajnë rrëfimin, dhe pikërisht tek ato Ungjijtë kthehen vazhdimisht.',
	'schola.bible.ot.beginnings': 'Si fillon, dhe si shkon keq.',
	'schola.bible.ot.promise':
		'Një familje, dhe një premtim dhënë asaj që i mbijeton të gjithëve në të.',
	'schola.bible.ot.exodus':
		'Një popull i nxjerrë nga skllavëria, dhe një ligj dhënë atij për të jetuar.',
	'schola.bible.ot.psalms':
		'Jo një rrëfim: njëqind e pesëdhjetë lutje dhe këngë. Lexoni një nga një, në çfarëdo radhe. Kisha i lutet ende çdo ditë.',
	'schola.bible.bothWays':
		'Do të njihni gjëra, dhe kjo është qëllimi e jo një rastësi. Kisha i lexon librat më të vjetër në dritën e Krishtit dhe ata më të rinj në dritën e asaj që erdhi më parë — secila gjysmë shpjegon tjetrën, dhe prandaj asnjëra nuk lexohet vetëm.',
	'schola.guide.heading': 'Si të orientoheni',
	'schola.guide.lede':
		'Teksti është e gjithë faqja; gjithçka tjetër është një komandë që mund ta shpërfillni derisa ta doni.',
	'schola.guide.top.heading': 'Shiriti në krye të çdo faqeje',
	'schola.guide.reading.heading': 'Shiriti mbi një tekst',
	'schola.feature.search':
		'Shkruani një referencë në kutinë lart — kapitull dhe varg, një numër paragrafi, emrin e një dokumenti — dhe e plotëson ndërsa shkruani. Shtypni / ose Ctrl+K nga kudo, dhe ? për shkurtoret e tjera.',
	'schola.feature.languages':
		'Ndërfaqja dhe teksti zgjidhen veç e veç, kështu që mund të lexoni një vepër në një gjuhë ndërsa butonat mbeten në një tjetër. Aty ku një vepër ka disa botime në gjuhën tuaj, zgjidhni edhe midis tyre.',
	'schola.feature.settings':
		'Madhësia e tekstit, e çelët apo e errët, sepia, dhe sa nga aparati doni pranë tekstit.',
	'schola.feature.offline':
		'Shtojeni faqen në ekranin kryesor dhe hapet si një aplikacion. Mund të shkarkoni vepra të tëra për t’i lexuar pa lidhje.',
	'schola.feature.contents':
		'Ndarjet e veprës ku ndodheni — libra, pjesë, kapituj — që të lëvizni brenda saj pa u kthyer në fillim.',
	'schola.feature.compare':
		'Dy botime të të njëjtit pasazh, krah për krah — latinishtja pranë gjuhës suaj, ose një përkthim pranë një tjetri.',
	'schola.feature.apparatus':
		'Shënimet e vetë botimit, dhe çdo koment i shkruar mbi tekstin, ofrohen pranë tij e jo poshtë tij. Citimet brenda tekstit janë lidhje, kështu që një referencë të çon aty ku tregon.',
	'schola.feature.focus':
		'Pastron gjithçka veç tekstit. Dalja mbetet aty ku ishte shiriti, që asgjë të mos mbetet e zënë pas tij.',
	'schola.books.heading': 'Çfarë gjendet këtu, dhe si citohet',
	'schola.books.lede':
		'Secili prej tyre është një lloj tjetër libri, dhe secilit i referohemi me një numër të vetin. Shembujt tregojnë formën: shkruani një të tillë në kutinë e kërkimit dhe mbërrini te pasazhi.',
	'schola.cite.label': 'Citohet',
	'schola.what.scripture':
		'Shkrimet ashtu si i merr Kisha, në të dyja Besëlidhjet. Gjithçka tjetër këtu lexohet në dritën e tyre.',
	'schola.cite.scripture': 'libri, kapitulli dhe vargu, në shkurtesat që shtyp botimi juaj',
	'schola.what.catechism':
		'Një përmbledhje e asaj që beson Kisha Katolike, në një vëllim të vetëm. Ai vetë nuk është burim: mbledh Shkrimin, Etërit, liturgjinë dhe mësimin e Kishës, dhe çdo numër thotë prej nga vjen ajo që pohon.',
	'schola.cite.catechism': 'sipas numrit, që rrjedh pa ndërprerje nga faqja e parë te e fundit',
	'schola.what.compendium':
		'I njëjti mësim i paraqitur në pyetje dhe përgjigje, në rreth një të dhjetën e gjatësisë.',
	'schola.cite.compendium': 'sipas numrit të pyetjes',
	'schola.what.magisterium':
		'Ajo që papët dhe koncilet kanë shkruar në të vërtetë — enciklika, kushtetuta, dekrete, deklarata — secila drejtuar një çasti të caktuar dhe një çështjeje të caktuar. Secila njihet nga fjalët e saj të para në latinisht.',
	'schola.cite.magisterium': 'sipas emrit të dokumentit, pastaj një numri seksioni brenda tij',
	'schola.what.social':
		'Mësimi i Kishës për punën, pronën, familjen, politikën dhe paqen, mbledhur prej atyre dokumenteve në një libër të vetëm.',
	'schola.cite.social': 'sipas numrit, nën siglën që vepra përdor për vetveten',
	'schola.what.law': 'Ligj e jo doktrinë. Thotë çfarë kërkon Kisha, dhe ndryshohet.',
	'schola.cite.law': 'sipas kanonit, siç quhen njësitë e tij të numëruara',
	'schola.what.doctors':
		'Teologët që Kisha i ka shpallur Doktorë. Nuk mbart asnjë autoritet zyrtar, sado i madh të jetë autori.',
	'schola.cite.doctors': 'sipas pjesës, pastaj çështjes — ndarjet e vetë Summa-s',
	'schola.what.prayers': 'Fjalët me të cilat lutet Kisha, me latinishten pranë.',
	'schola.cite.prayers': 'sipas emrit; nuk ka numra për të cituar',
	'schola.places.heading': 'Jo tekste, por vende të kësaj faqeje',
	'schola.what.library':
		'Të gjitha veprat e faqes në një listë, të grupuara sipas lëndës e jo sipas llojit.',
	'schola.what.calendar':
		'Dita liturgjike — koha, ngjyra dhe kush kremtohet — për vendin kalendarin e të cilit ndiqni.',
	'schola.what.bookmarks':
		'Pasazhet që keni shënuar, dhe ku e latë së fundi në secilën vepër. Të dyja mbeten në këtë shfletues dhe nuk dërgohen askund.',
	'jumpbox.placeholder': 'Shko te… (p.sh. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Kërko',
	'jumpbox.hint': 'Shtypni / ose Ctrl+K për të shkuar te një referencë',
	'jumpbox.noMatch': 'Asgjë e gjetur',
	'jumpbox.suggestions': 'Sugjerime',
	'settings.label': 'Cilësimet',
	'darkMode.label': 'Mënyra e errët',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Ndezur',
	'darkMode.off': 'Fikur',
	'loadFailed.title': 'Kjo nuk u ngarkua',
	'loadFailed.hint':
		'Faqja ekziston — diçka shkoi keq gjatë marrjes së saj. Një provë e dytë zakonisht mjafton.',
	'loadFailed.retry': 'Provo përsëri',
	'loadFailed.retrying': 'Po provohet…',
	'fontSize.label': 'Madhësia e tekstit',
	'fontSize.larger': 'Tekst më i madh',
	'fontSize.smaller': 'Tekst më i vogël',
	'print.label': 'Shtypni këtë faqe',
	'toTop.label': 'Kthehu lart',
	'edition.label': 'Botimi',
	'edition.select': 'Zgjidhni botimin',
	'edition.current': 'Botimi i tanishëm',
	'edition.filter': 'Kërko botime',
	'menu.noMatches': 'Asnjë përputhje',
	'unitNav.previous': 'I mëparshmi',
	'unitNav.next': 'Në vijim',
	'bible.prevChapter': 'Kapitulli i mëparshëm',
	'bible.nextChapter': 'Kapitulli në vijim',
	'bible.pickBook': 'Libra dhe kapituj',
	'bible.landing.title': 'Bibla',
	'bible.landing.tagline': 'Lexoni tërë Biblën, libër pas libri, kapitull pas kapitulli.',
	'bible.landing.books': 'Libra',
	'bible.introduction': 'Hyrje',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentateuku',
	'bible.group.historical': 'Librat historikë',
	'bible.group.wisdom': 'Librat e urtisë',
	'bible.group.prophetic': 'Librat profetikë',
	'bible.group.gospels': 'Ungjijtë',
	'bible.group.acts': 'Veprat e Apostujve',
	'bible.group.pauline': 'Letrat e Shën Palit',
	'bible.group.catholicLetters': 'Letrat katolike',
	'bible.group.revelation': 'Zbulesa',
	'ccc.landing.title': 'Katekizmi i Kishës Katolike',
	'ccc.landing.pairTitle': 'Katekizmi dhe Përmbledhja',
	'ccc.landing.tagline':
		'<strong>Katekizmi</strong> e parashtron doktrinën katolike në 2.865 paragrafë të numëruar. <strong>Përmbledhja</strong> e rithotë të njëjtën doktrinë në 598 pyetje e përgjigje, sipas së njëjtës skemë.',
	'ccc.landing.pairTagline':
		'Katekizmi i Kishës Katolike në 2 865 numra, dhe Përmbledhja e tij në 598 pyetje.',
	'compendium.landing.title': 'Përmbledhja e Katekizmit',
	'compendium.landing.tagline': 'Pyetje dhe përgjigje që përmbledhin Katekizmin e Kishës Katolike.',
	'compendium.question': 'Pyetje',
	'compendium.answer': 'Përgjigje',
	'compendium.tableOfContents': 'Përmbajtja',
	'compendium.prevQuestion': 'Pyetja e mëparshme',
	'compendium.nextQuestion': 'Pyetja në vijim',
	'compendium.condenses': 'Përmbledh KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'compendium.abbrev': 'Përmbl.',
	'compendium.noQuestionNumber': 'Pa numër pyetjeje në këtë korpus',
	'document.library.tagline':
		'Enciklika, kushtetuta koncilore, dekrete dhe deklarata të Magjisterit.',
	'doctores.landing.title': 'Doktorët e Kishës',
	'doctores.landing.tagline': 'Veprat teologjike të Etërve dhe Doktorëve të Kishës.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Toma Akuini, në anglisht dhe në latinishten që shkroi vetë.',
	'index.division': 'Ndarja',
	'prayers.landing.title': 'Lutje të përbashkëta',
	'prayers.landing.tagline': 'Lutje me tekstin latin përkrah.',
	'prayers.gloss.versicle':
		'Vargu që e thotë ose e këndon vetëm ai që drejton lutjen; bashkësia i përgjigjet me përgjigjen që vjen më pas.',
	'prayers.gloss.response':
		'Vargu që bashkësia e thotë ose e këndon së bashku, si përgjigje ndaj vargut para tij.',
	'prayers.seeAlso': 'Shih edhe',
	'anchor.actions': 'Veprime mbi referencën',
	'anchor.copy': 'Kopjo tekstin',
	'anchor.copyLink': 'Kopjo lidhjen',
	'anchor.view': 'Shiko',
	'anchor.copied': 'U kopjua',
	'anchor.copyFailed': 'Nuk u kopjua dot',
	'bookmark.add': 'Shëno',
	'bookmark.remove': 'Hiqe shënimin',
	'bookmark.library': 'Faqeshënues',
	'bookmark.library.tagline': 'Gjithçka që keni shënuar gjatë leximit.',
	'bookmark.empty': 'Ende asgjë e shënuar.',
	'bookmark.emptyHint':
		'Klikoni numrin e një vargu ose paragrafi dhe zgjidhni Shëno, ose përdorni butonin e faqeshënuesit në faqe.',
	'bookmark.deviceOnly':
		'Faqeshënuesit ruhen vetëm në këtë shfletues. Nuk dërgohen askund, dhe fshirja e të dhënave të shfletuesit i heq.',
	'bookmark.unavailable': 'Nuk gjendet në botimin që po lexoni',
	'colophon.title': 'Kolofoni',
	'colophon.lede':
		'Çfarë është kjo faqe, nga vijnë tekstet e saj dhe si qëndrojmë ndaj riprodhimit të tyre.',
	'colophon.whatThisIs': 'Çfarë është kjo',
	'colophon.whatThisIsBody':
		'Glossa Catholica është një faqe leximi për Shkrimet, Katekizmin, Përmbledhjen dhe dokumentet e Magjisterit, në anglisht, portugalisht dhe latinisht. Ajo ekziston për t’u lexuar, dhe asgjë tjetër nuk kërkohet prej jush që ta lexoni:',
	'colophon.pointFree':
		'Falas, dhe përherë falas. Asnjë pagesë, asnjë abonim, asgjë për t’u blerë.',
	'colophon.pointNoAds': 'Asnjë reklamë dhe asnjë vendosje e sponsorizuar e çfarëdo lloji.',
	'colophon.pointNoAccounts': 'Asnjë llogari. Asgjë për t’u regjistruar, asgjë për t’u kyçur.',
	'colophon.pointNoTracking':
		'Asnjë skript gjurmimi, asnjë kod të palëve të treta, asnjë cookie. Vetëm numërime anonime të përdorimit, pa asgjë që ju identifikon.',
	'colophon.pointOffline':
		'Ndërtuar që të vazhdojë të punojë edhe pa internet pasi ta keni vizituar një herë, që një lidhje e dobët të mos jetë pengesë për leximin.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica është një nismë private e besimtarëve laikë. Ajo nuk mbart asnjë miratim kishtar dhe nuk flet me asnjë autoritet të vetin.',
	'footer.notEndorsed': 'E pamiratuar nga Selia e Shenjtë',
	'colophon.textsTitle': 'Tekstet',
	'colophon.textsBody':
		'Çdo tekst vjen nga një burim i emërtuar, dhe çdo vepër shënon botimin e vet, faqen e burimit dhe datën kur u mor. Shkrimi përdor përkthime në zotërim publik; Katekizmi, Përmbledhja dhe dokumentet e Magjisterit vijnë nga tekstet e botuara nga vetë Selia e Shenjtë.',
	'colophon.textsFidelity':
		'Teksti nuk shkurtohet kurrë, nuk parafrazohet kurrë, nuk rishkruhet kurrë dhe nuk vendoset kurrë pranë reklamave. Ne i ndreqim të metat e dukshme — një fjalë e rënë, një citim i cunguar, një shënjim që ka gëlltitur një paragraf — gjithnjë drejt asaj që shtyp vetë burimi, kurrë drejt asaj që mendojmë ne se duhej të thoshte.',
	'colophon.countBible': 'botime të Biblës',
	'colophon.countDocuments': 'dokumente të Magjisterit',
	'colophon.copyrightTitle': 'E drejta e autorit',
	'colophon.copyrightBody1':
		'Katekizmi, Përmbledhja dhe dokumentet e Magjisterit janë pronë e mbajtësve të të drejtave — kryesisht Libreria Editrice Vaticana dhe Dikasteri për Komunikimin.',
	'colophon.copyrightBody2':
		'Çdo vepër shfaq shënimin e së drejtës së autorit me fjalët e vetë mbajtësit të saj dhe lidhet me faqen prej së cilës u mor.',
	'colophon.copyrightBody3':
		'Nëse mbani të drejta mbi ndonjë tekst këtu dhe do të parapëlqenit që të mos botohej, na shkruani.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Për çfarëdo gjëje, përfshirë sa më sipër:',
	'colophon.contactPending':
		'Ende nuk është caktuar një adresë kontakti. Kjo faqe nuk duhet bërë publike pa e pasur atë — zotimi më sipër nuk ka kuptim pa një mënyrë për të na kontaktuar.',
	'colophon.illustrationsTitle': 'Ilustrimet',
	'colophon.illustrationsBody':
		'Bibla mbart gravurat e Gustave Doré-së, secila e vendosur te vargu që paraqet — cikli i fundit dhe më i madh i tij biblik, gdhendur në dru sipas vizatimeve të tij dhe shtypur bashkë me tekstin, e jo i mbledhur në fund.',
	'colophon.illustrationsRights':
		'Ato janë në zotërim publik, siç e tregojnë datat më poshtë, dhe një riprodhim besnik fotografik i një gravure në zotërim publik nuk krijon një të drejtë të re autoriale të vetën.',
	'colophon.countPlates': 'gravura',
	'colophon.countPlateChapters': 'kapituj të ilustruar',
	'art.about': 'Rreth kësaj pamjeje',
	'art.detail': 'detaj',
	'colophon.typeTitle': 'Shkronjat',
	'colophon.typeBody':
		'Radhitur me EB Garamond, ringjallja nga Georg Duffner dhe Octavio Pardo e shkronjave që Claude Garamont gdhendi në vitet 1590 — tradita humaniste me të cilën Kisha shtyp që nga Rilindja. Cirilikja e saj është nga të njëjtat duar, por nuk ringjall asgjë: një Garamond cirilik nuk u gdhend kurrë, prandaj rusishtja radhitet në forma të vizatuara që të qëndrojnë pranë të tjerave.',
	'colophon.typeArabic':
		'Arabishtja e kalon krejtësisht, dhe radhitet me Amiri — ringjallja nga Khaled Hosny e naskhit të gdhendur për shtypshkronjën Bulaq në Kajro më 1905, zgjedhur me të njëjtin arsyetim si shkronja e tekstit: një shkronjë libri e caktuar historikisht, e jo një vizatim bashkëkohor.',
	'colophon.typeInitials':
		'Nistoret hapëse janë Pirata One, një gjermanike gotike shkronjat e mëdha të së cilës mbeten të lexueshme në përmasën që kërkon një nistore e madhe, dhe — për rusishten — Ponomar, që riprodhon shkronjën sllavo-kishtare të Shtypshkronjës Sinodale. Ponomar radhit nistoren dhe kurrë tekstin: një enciklikë moderne e radhitur tërësisht me shkronjë sinodale do të thoshte diçka të pavërtetë për atë çfarë është. Të gjitha janë të licencuara nën SIL Open Font License dhe shërbehen nga kjo faqe e jo nga një palë e tretë, kështu që leximi i një faqeje nuk i kërkon asgjë serverit të askujt tjetër.',
	'copyright.sourceTitle': 'Hapni faqen origjinale të burimit',
	'copyright.sourceLabel': 'Burimi',
	'lang.label': 'Gjuha',
	'lang.filter': 'Kërko gjuhë',
	'lang.more': 'gjuhë të tjera',
	'calendar.title': 'Kalendari liturgjik',
	'calendar.tagline':
		'Kalendari i Përgjithshëm Roman, i llogaritur për çdo ditë — koha e saj, grada e saj, ngjyra e saj.',
	'calendar.date': 'Data',
	'calendar.calendar': 'Kalendari',
	'calendar.which.general': 'Kalendari i Përgjithshëm Roman',
	'calendar.filter': 'Kërko vende',
	'calendar.region.europe': 'Evropa',
	'calendar.region.americas': 'Amerikat',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Lindja e Mesme',
	'calendar.region.asia': 'Azia',
	'calendar.region.oceania': 'Oqeania',
	'calendar.today': 'Sot',
	'calendar.previousMonth': 'Muaji i kaluar',
	'calendar.nextMonth': 'Muaji i ardhshëm',
	'calendar.noSuchDay': 'Për atë datë nuk llogaritet asnjë ditë liturgjike.',
	'calendar.week': 'java',
	'calendar.alsoToday': 'Sot kremtohet edhe',
	'calendar.alsoObserved': 'Sot kujtohet edhe',
	'calendar.obligation': 'Festë e detyrueshme',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Cikli i së dielës',
	'calendar.weekdayCycle': 'Cikli i ditëve të javës',
	'calendar.psalterWeek': 'Java e psalterit',
	'calendar.transferredFrom': 'Zhvendosur nga',
	'calendar.season.advent': 'Ardhja',
	'calendar.season.christmas': 'Koha e Krishtlindjes',
	'calendar.season.lent': 'Kreshma',
	'calendar.season.triduum': 'Tridita e Pashkës',
	'calendar.season.easter': 'Koha e Pashkës',
	'calendar.season.ordinary': 'Koha gjatë vitit',
	'calendar.colour.white': 'E bardhë',
	'calendar.colour.red': 'E kuqe',
	'calendar.colour.green': 'E gjelbër',
	'calendar.colour.violet': 'Vjollcë',
	'calendar.colour.rose': 'Rozë',
	'calendar.colour.black': 'E zezë',
	'calendar.colour.blue': 'Blu',
	'calendar.rank.solemnity': 'Kremte',
	'calendar.rank.feast': 'Festë',
	'calendar.rank.memorial': 'Kujtim i detyrueshëm',
	'calendar.rank.optional-memorial': 'Kujtim i lirë',
	'calendar.rank.commemoration': 'Përkujtim',
	'calendar.rank.sunday': 'E diel',
	'calendar.rank.weekday': 'Ditë jave',
	'calendar.gloss.season.advent':
		'Katër javët para Krishtlindjes: përgatitje për ardhjen e Zotit dhe fillimi i vitit të Kishës.',
	'calendar.gloss.season.christmas':
		'Nga Krishtlindja deri te Pagëzimi i Zotit, duke kremtuar lindjen e Zotit dhe shfaqjen e tij para botës.',
	'calendar.gloss.season.lent':
		'Dyzet ditët nga e Mërkura e Përhirit deri te Mesha e mbrëmjes së Darkës së Zotit: pendesë, lëmoshë dhe përgatitje për Pashkët.',
	'calendar.gloss.season.triduum':
		'Tri ditët nga mbrëmja e së Enjtes së Madhe deri në mbrëmjen e së Dielës së Pashkëve — vuajtja, vdekja dhe ngjallja e Zotit, kulmi i tërë vitit.',
	'calendar.gloss.season.easter':
		'Të pesëdhjetë ditët nga Pashkët deri te Rrëshajët, të kremtuara si një festë e vetme — „një e diel e madhe“.',
	'calendar.gloss.season.ordinary':
		'Tridhjetë e tri ose tridhjetë e katër javët jashtë kohëve të tjera. Jo „e zakonshme“ por e renditur: javët numërohen dhe Kisha lexon me radhë jetën dhe mësimin e Zotit. Vjen në dy pjesë — pas kohës së Krishtlindjes deri në Kreshmë, dhe pas Rrëshajëve deri në Ardhje.',
	'calendar.gloss.rank.solemnity':
		'Shkalla më e lartë: Pashkët, Krishtlindja, Ngjitja në qiell, shenjtori mbrojtës i një vendi. Kremtohet me Lavdi dhe Kredo dhe fillon mbrëmjen paraardhëse.',
	'calendar.gloss.rank.feast':
		'Kremtohet brenda vetë ditës. Apostujt dhe ungjilltarët, dhe ditët më të mëdha të Zotit dhe të Zojës.',
	'calendar.gloss.rank.memorial':
		'Një shenjtor i kujtuar në ditën e tij, brenda Meshës dhe Liturgjisë së Orëve të asaj kohe. E detyrueshme atje ku kremtohet.',
	'calendar.gloss.rank.optional-memorial':
		'Mund të kremtohet ose jo, sipas zgjedhjes së priftit apo bashkësisë. Nëse nuk kremtohet, dita është thjesht ditë e javës.',
	'calendar.gloss.rank.commemoration':
		'Ajo në të cilën kthehet një përkujtim gjatë Kreshmës: një lutje e shtuar Meshës së ditës, të cilën koha përndryshe e ruan të plotë.',
	'calendar.gloss.rank.sunday':
		'Festa e parë — dita e Zotit, e kremtuar çdo javë që nga ngjallja. Vetëm një kremte ose një festë e Zotit mund ta zhvendosë, dhe në Ardhje, Kreshmë e kohë pashkësh as ato.',
	'calendar.gloss.rank.weekday':
		'Ditë pa kremtim të vetin. Mesha dhe Liturgjia e Orëve janë të asaj kohe — dhe pikërisht kjo e bën kohën diçka që ia vlen të njihet.',
	'calendar.gloss.colour.white':
		'Gëzim. Koha e Pashkëve dhe e Krishtlindjes, ditët e Zotit jashtë vuajtjes së tij, Zoja, engjëjt, dhe shenjtorët që nuk qenë martirë.',
	'calendar.gloss.colour.red':
		'Gjak dhe zjarr. E diela e Palmave dhe e Premtja e Madhe, Rrëshajët, apostujt dhe ungjilltarët, dhe martirët.',
	'calendar.gloss.colour.green': 'Koha e zakonshme: ngjyra e shpresës dhe e asaj që rritet.',
	'calendar.gloss.colour.violet': 'Ardhja dhe Kreshma, dhe vishet edhe në Meshët për të vdekurit.',
	'calendar.gloss.colour.rose':
		'Vishet dy herë në vit — të dielën Gaudete, të tretën e Ardhjes, dhe të dielën Laetare, të katërtën e Kreshmës — ku agjërimi zbutet dhe fundi duket.',
	'calendar.gloss.colour.black': 'Mund të vishet në Meshët për të vdekurit.',
	'calendar.gloss.colour.blue':
		'Privilegji i së kaltrës: vishet për Zanafillën e Papërlyer në Spanjë, në Filipine dhe në ato pak vende të tjera që Selia e Shenjtë ua ka dhënë.',
	'calendar.gloss.sundayCycle':
		'Leximet e së dielës rrjedhin në tre vjet — A, B dhe C — duke lexuar me radhë Mateun, Markun dhe Lukën, me Gjonin gjatë Kreshmës dhe kohës së Pashkëve. Cikli ndërrohet të dielën e parë të Ardhjes, bashkë me vitin e Kishës.',
	'calendar.gloss.weekdayCycle':
		'Leximet e ditëve të javës rrjedhin në dy vjet, I dhe II: leximi i parë ndryshon, Ungjilli jo. Viti liturgjik merr emrin e vitit civil në të cilin mbaron — vitet tek janë I, ato çift II.',
	'calendar.gloss.psalterWeek':
		'Liturgjia e Orëve i shpërndan psalmet në katër javë, nga I te IV, që përsëriten gjatë vitit. Kjo është java, psalmet e së cilës janë të sotmet, për këdo që lut Orët.',
	'calendar.gloss.obligation':
		'Ditë në të cilën besimtarët janë të detyruar të marrin pjesë në Meshë dhe të përmbahen nga punët që do t’ua pengonin. Çdo e diel, dhe ditët e tjera që ka caktuar secila konferencë ipeshkvnore.',
	'calendar.primer.title': 'Për herë të parë këtu?',
	'calendar.primer.lead':
		'Kisha mban një vit të vetin. Fillon me Ardhjen, rrotullohet rreth Pashkëve dhe i jep secilës ditë një emër, një shkallë dhe një ngjyrë — dhe këto vendosin çfarë lutet e lexohet atë ditë në Meshë dhe në Liturgjinë e Orëve. Kështu „e diela e njëzet e tretë e kohës së zakonshme“ është një adresë: i thotë një prifti, një kori ose kujtdo që lutet në shtëpi cilat lutje dhe lexime i përkasin sotit.',
	'calendar.primer.seasons': 'Kohët',
	'calendar.primer.ranks': 'Çfarë mund të jetë një ditë',
	'calendar.primer.colours': 'Ngjyrat',
	'calendar.primer.cycles': 'Ciklet',
	'calendar.primer.cyclesLead':
		'Tre numërues që, së bashku, thonë cilat lexime dhe psalme janë caktuar për sot.'
};
