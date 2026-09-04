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
	'home.continueReading': 'Vazhdo leximin',
	'home.works': 'Biblioteka',
	'home.ccc.heading': 'Katekizmi dhe Përmbledhja',
	'home.magisterium.mostRecent': 'Më të rejat',
	'home.prayers.heading': 'Lutje',
	'unitNav.previous': 'I mëparshmi',
	'unitNav.next': 'Në vijim',
	'bible.landing.title': 'Bibla',
	'bible.landing.tagline': 'Lexoni tërë Biblën, libër pas libri, kapitull pas kapitulli.',
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
	'ccc.landing.tagline':
		'<strong>Katekizmi</strong> e parashtron doktrinën katolike në 2.865 paragrafë të numëruar. <strong>Përmbledhja</strong> e rithotë të njëjtën doktrinë në 598 pyetje e përgjigje, sipas së njëjtës skemë.',
	'document.library.tagline':
		'Enciklika, kushtetuta koncilore, dekrete dhe deklarata të Magjisterit.',
	'doctores.landing.title': 'Doktorët e Kishës',
	'doctores.landing.tagline': 'Veprat teologjike të Etërve dhe Doktorëve të Kishës.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Toma Akuini, në anglisht dhe në latinishten që shkroi vetë.',
	'prayers.landing.title': 'Lutje të përbashkëta',
	'prayers.landing.tagline': 'Lutje me tekstin latin përkrah.',
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
	'colophon.typeTitle': 'Shkronjat',
	'colophon.typeBody':
		'Radhitur me EB Garamond, ringjallja nga Georg Duffner dhe Octavio Pardo e shkronjave që Claude Garamont gdhendi në vitet 1590 — tradita humaniste me të cilën Kisha shtyp që nga Rilindja. Cirilikja e saj është nga të njëjtat duar, por nuk ringjall asgjë: një Garamond cirilik nuk u gdhend kurrë, prandaj rusishtja radhitet në forma të vizatuara që të qëndrojnë pranë të tjerave.',
	'colophon.typeArabic':
		'Arabishtja e kalon krejtësisht, dhe radhitet me Amiri — ringjallja nga Khaled Hosny e naskhit të gdhendur për shtypshkronjën Bulaq në Kajro më 1905, zgjedhur me të njëjtin arsyetim si shkronja e tekstit: një shkronjë libri e caktuar historikisht, e jo një vizatim bashkëkohor.',
	'colophon.typeInitials':
		'Nistoret hapëse janë Pirata One, një gjermanike gotike shkronjat e mëdha të së cilës mbeten të lexueshme në përmasën që kërkon një nistore e madhe, dhe — për rusishten — Ponomar, që riprodhon shkronjën sllavo-kishtare të Shtypshkronjës Sinodale. Ponomar radhit nistoren dhe kurrë tekstin: një enciklikë moderne e radhitur tërësisht me shkronjë sinodale do të thoshte diçka të pavërtetë për atë çfarë është. Të gjitha janë të licencuara nën SIL Open Font License dhe shërbehen nga kjo faqe e jo nga një palë e tretë, kështu që leximi i një faqeje nuk i kërkon asgjë serverit të askujt tjetër.'
};
