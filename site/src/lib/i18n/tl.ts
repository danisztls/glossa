/**
 * Tagalog UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Tagalog, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, the Philippines, the third-largest Catholic country in the world. A reader gets their own chrome and English
 * content through `CONTENT_LANG_FALLBACK`, which is the honest state of it:
 * the alternative is not better content, it is the same content behind a
 * language they do not read.
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

export const tl: Dictionary = {
	'nav.bible': 'Bibliya',
	'nav.ccc': 'Katesismo',
	'nav.compendium': 'Kompendyo',
	'nav.magisterium': 'Magisterium',
	'nav.socialDoctrine': 'Aral panlipunan',
	'socialDoctrine.landing.title': 'Kompendyo ng Panlipunang Aral ng Simbahan',
	'socialDoctrine.landing.tagline':
		'Ang itinuturo ng Simbahan tungkol sa buhay sa lipunan, sa 583 bilang.',
	'nav.prayers': 'Mga Panalangin',
	'nav.bookmarks': 'Mga Bookmark',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Magpatuloy sa pagbabasa',
	'home.works': 'Aklatan',
	'home.ccc.heading': 'Katesismo at Kompendyo',
	'home.magisterium.mostRecent': 'Pinakabago',
	'home.prayers.heading': 'Mga Panalangin',
	'unitNav.previous': 'Nakaraan',
	'unitNav.next': 'Susunod',
	'bible.landing.title': 'Ang Bibliya',
	'bible.landing.tagline': 'Basahin ang buong Bibliya, aklat bawat aklat, kabanata bawat kabanata.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentateuko',
	'bible.group.historical': 'Mga Aklat ng Kasaysayan',
	'bible.group.wisdom': 'Mga Aklat ng Karunungan',
	'bible.group.prophetic': 'Mga Aklat ng Propeta',
	'bible.group.gospels': 'Mga Ebanghelyo',
	'bible.group.acts': 'Mga Gawa ng mga Apostol',
	'bible.group.pauline': 'Mga Sulat ni Pablo',
	'bible.group.catholicLetters': 'Mga Sulat Katoliko',
	'bible.group.revelation': 'Pahayag',
	'ccc.landing.title': 'Katesismo ng Simbahang Katoliko',
	'ccc.landing.tagline':
		'<strong>Ang Katesismo</strong> ay naglalahad ng turong Katoliko sa 2,865 binilang na talata. <strong>Ang Kompendyo</strong> ay muling naglalahad ng gayunding turo sa 598 tanong at sagot, sa gayunding balangkas.',
	'document.library.tagline':
		'Mga ensiklika, konstitusyong konsiliyar, dekreto, at pahayag ng Magisterium.',
	'doctores.landing.title': 'Mga Doktor ng Simbahan',
	'doctores.landing.tagline': 'Ang mga akdang teolohiko ng mga Ama at Doktor ng Simbahan.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomas de Aquino, sa Ingles at sa Latin na kanyang isinulat.',
	'prayers.landing.title': 'Karaniwang mga Panalangin',
	'prayers.landing.tagline': 'Mga panalangin na may katabing tekstong Latin.',
	'colophon.title': 'Kolopon',
	'colophon.lede':
		'Kung ano ang sityong ito, kung saan nanggaling ang mga teksto nito, at ang aming paninindigan sa paglalathala ng mga ito.',
	'colophon.whatThisIs': 'Ano ito',
	'colophon.whatThisIsBody':
		'Ang Glossa Catholica ay isang pook-sapot na babasahin para sa Kasulatan, sa Katesismo, sa Kompendyo, at sa mga dokumento ng Magisterio, sa Ingles, Portuges at Latin. Umiiral ito upang basahin, at wala nang ibang hinihingi sa inyo upang mabasa ito:',
	'colophon.pointFree':
		'Libre, at laging libre. Walang bayad na hadlang, walang suskrisyon, walang binebenta.',
	'colophon.pointNoAds': 'Walang patalastas, at walang anumang uri ng bayad na paglalagay.',
	'colophon.pointNoAccounts':
		'Walang account. Walang paglalagdaan, walang paglalagyan ng password.',
	'colophon.pointNoTracking':
		'Walang sumusubaybay na script, walang code mula sa ibang panig, walang cookies. Bilang na walang pangalan lamang ng paggamit, na walang anumang nagpapakilala sa inyo.',
	'colophon.pointOffline':
		'Ginawa upang magpatuloy kahit walang koneksyon matapos ninyong dalawin, upang ang mahinang koneksyon ay hindi maging sagabal sa pagbabasa.',
	'colophon.whatThisIsStanding':
		'Ang Glossa Catholica ay isang pribadong pagsisikap ng mga layko. Wala itong anumang pagsang-ayon ng Simbahan at hindi nagsasalita sa anumang sariling awtoridad.',
	'colophon.textsTitle': 'Ang mga teksto',
	'colophon.textsBody':
		'Bawat teksto ay nagmumula sa isang pinangalanang pinagkunan, at bawat akda ay nagtatala ng edisyon nito, ng pahina ng pinagkunan nito, at ng petsang kinuha ito. Ang Kasulatan ay gumagamit ng mga saling nasa pambayang ari; ang Katesismo, ang Kompendyo at ang mga dokumento ng Magisterio ay nagmumula sa mismong mga tekstong inilathala ng Banal na Sede.',
	'colophon.textsFidelity':
		'Ang teksto ay hindi kailanman pinapaikli, hindi kailanman ibinubuod sa ibang salita, hindi kailanman muling isinusulat, at hindi kailanman inilalagay sa tabi ng patalastas. Inaayos nga namin ang malinaw na mga depekto — isang nalaglag na salita, isang nasirang sipi, isang markang lumamon ng talata — laging patungo sa kung ano ang inilimbag mismo ng pinagkunan, hindi kailanman patungo sa inaakala naming dapat nitong sabihin.',
	'colophon.countBible': 'edisyon ng Bibliya',
	'colophon.countDocuments': 'dokumento ng Magisterio',
	'colophon.copyrightTitle': 'Karapatang-ari',
	'colophon.copyrightBody1':
		'Ang Katesismo, ang Kompendyo at ang mga dokumento ng Magisterio ay pag-aari ng mga may hawak ng karapatan sa mga ito — pangunahin ang Libreria Editrice Vaticana at ang Dikasteryo para sa Komunikasyon.',
	'colophon.copyrightBody2':
		'Ipinapakita ng bawat akda ang sariling paunawa ng karapatang-ari ng may hawak nito, sa kanilang sariling pananalita, at nag-uugnay sa pahinang pinagkunan nito.',
	'colophon.copyrightBody3':
		'Kung may hawak kayong karapatan sa alinmang teksto rito at mas nanaisin ninyong huwag itong ilathala, sumulat kayo sa amin.',
	'colophon.contactTitle': 'Ugnayan',
	'colophon.contactBody': 'Para sa anumang bagay, kabilang ang nasa itaas:',
	'colophon.contactPending':
		"Wala pang naitatakdang tirahan para sa ugnayan. Hindi dapat ilathala sa publiko ang pook-sapot na ito hangga't wala nito — ang pangakong nasa itaas ay walang kabuluhan kung walang paraan upang kami ay maabot.",
	'colophon.illustrationsTitle': 'Ang mga larawan',
	'colophon.illustrationsBody':
		"Taglay ng Bibliya ang mga ukit ni Gustave Doré, bawat isa'y nakalagay sa talatang inilalarawan nito — ang huli at pinakamalaki sa kanyang mga siklo sa Bibliya, inukit sa kahoy mula sa kanyang mga guhit at inilimbag kasama ng teksto sa halip na tipunin sa likuran.",
	'colophon.illustrationsRights':
		'Nasa pambayang ari ang mga ito, gaya ng ipinapakita ng mga petsa sa ibaba, at ang tapat na larawang kopya ng isang ukit na nasa pambayang ari ay walang dalang bagong sariling karapatang-ari.',
	'colophon.countPlates': 'ukit',
	'colophon.countPlateChapters': 'kabanatang may larawan',
	'colophon.typeTitle': 'Ang letra',
	'colophon.typeBody':
		'Nakahanay sa EB Garamond, ang muling pagbuhay nina Georg Duffner at Octavio Pardo sa mga letrang inukit ni Claude Garamont noong dekada 1590 — ang tradisyong humanista na pinaglilimbagan ng Simbahan mula pa noong Renasimyento. Ang Sirilikong letra nito ay mula sa parehong mga kamay ngunit walang binubuhay: walang Sirilikong Garamond na naukit kailanman, kaya ang Ruso ay nakahanay sa isang anyong iginuhit upang tumabi sa iba.',
	'colophon.typeArabic':
		'Ang Arabe ay lubos na lampas dito, at nakahanay sa Amiri — ang muling pagbuhay ni Khaled Hosny sa naskh na inukit para sa palimbagang Bulaq sa Cairo noong 1905, pinili sa parehong dahilan gaya ng letra ng teksto: isang tiyak na makasaysayang letra ng aklat sa halip na isang kasalukuyang guhit.',
	'colophon.typeInitials':
		'Ang mga pambungad na inisyal ay Pirata One, isang letrang gotiko na ang malalaking titik ay nananatiling mababasa sa sukat na hinihingi ng isang malaking unang titik, at — para sa Ruso — Ponomar, na muling gumagawa ng letrang Slavoniko ng Simbahan ng Palimbagang Sinodal. Ang Ponomar ay naghahanay ng inisyal at hindi kailanman ng teksto: ang isang makabagong ensiklika na buong nakahanay sa letrang Sinodal ay magsasabi ng isang bagay na hindi totoo tungkol sa kung ano ito. Lahat ay lisensiyado sa ilalim ng SIL Open Font License at inihahain mula sa pook-sapot na ito sa halip na mula sa ibang panig, kaya ang pagbabasa ng isang pahina ay walang hinihingi sa server ng iba.'
};
