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
 * The language names in `lang-names.ts` are written in
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
	'nav.canonLaw': 'Batas Kanoniko',
	'canonLaw.landing.title': 'Kodigo ng Batas Kanoniko',
	'canonLaw.landing.tagline': 'Ang batas ng Simbahang Latino, sa 1,752 kanon sa pitong aklat.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Nakaraang kanon',
	'canonLaw.nextCanon': 'Susunod na kanon',
	'canonLaw.readFullTitle': 'Basahin ang buong titulo',
	'canonLaw.superseded': 'Pananalitang pinalitan ng',
	'nav.prayers': 'Mga Panalangin',
	'nav.bookmarks': 'Mga Bookmark',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Magpatuloy sa pagbabasa',
	'home.tagline':
		'Isang pook-sapot na babasahin para sa Kasulatan, sa Katesismo, at sa mga dokumento ng Magisterio — libre, gumagana kahit walang koneksyon, at walang paglalagdaan.',
	'home.doors.heading': 'Saan pupunta',
	'home.find.heading': 'O mag-type ng sanggunian',
	'nav.library': 'Aklatan',
	'nav.learn': 'Matuto',
	'library.landing.tagline':
		'Ang buong koleksiyon, istante bawat istante — kasama ang huling binasa mo at ang mga minarkahan mo.',
	'schola.landing.title': 'Saan magsisimula',
	'schola.landing.tagline':
		'Isang maikling patnubay sa kung ano ang narito: kung ano ang bawat isa sa mga aklat na ito, paano isinusulat ang sanggunian dito, paano makakita ng isang bahagi, at mga ayos ng pagbabasa na iminungkahi ng Simbahan.',
	'schola.start.heading': 'Kung bago sa inyo ang lahat ng ito',
	'schola.start.body': 'Ang pinakamainam na simula ay ang ',
	'schola.start.bodyAfter':
		': ang mismong turo ng Katesismo, higit na maikli, nakasulat sa tanong at sagot. Mga ikasampung bahagi lamang ang haba nito at wala itong ipinapalagay.',
	'schola.bible.heading': 'Kung hindi pa ninyo nababasa ang Bibliya',
	'schola.bible.library':
		'Hindi ito iisang aklat kundi pitumpu’t tatlo, isinulat sa loob ng mahigit isang libong taon at tinipon sa ayos na pinanindigan ng Simbahan — hindi sa ayos ng pagkakasunod ng mga pangyayari, at hindi sa ayos na pinakamadaling basahin. Karamihan ay nagsisimula sa unang pahina at humihinto makalipas ang ilang linggo, sa mahabang kabanata ng sinaunang batas, dahil wala pang nagsabi sa kanila kung para saan ito.',
	'schola.bible.step.gospel': 'Magsimula sa isang Ebanghelyo',
	'schola.bible.start':
		'Isa sa apat na maiikling aklat tungkol sa buhay ni Jesus, malalim sa loob at hindi sa unahan. Hindi ito aming ideya: hiniling ng isang Konsilyo ng Simbahan na ituro ang wastong paggamit ng Kasulatan, „lalo na ng Bagong Tipan at higit sa lahat ng mga Ebanghelyo“. Wala itong tinukoy na isa, at hindi rin kami tutukoy.',
	'schola.bible.whichGospel':
		'Tatlo ang karaniwang iminumungkahi, sa tatlong magkaibang dahilan. Alinman sa mga ito ay mabuting kinalalagyan.',
	'schola.bible.gospel.mark':
		'Ang pinakamaikli. Mababasa ninyo ito nang buo sa isang hapon, at sa simula ay higit na mahalaga ang makatapos ng isa kaysa sa makapili ng pinakamahusay.',
	'schola.bible.gospel.luke':
		'Isinulat para sa isang nasa labas ng pananampalataya na nais na maisatitik nang maayos ang salaysay — na maaaring kayo mismo. Tuloy-tuloy itong pumapasok sa Mga Gawa ng mga Apostol, kaya sa totoo lang ay unang kalahati ito ng isang mas mahabang aklat.',
	'schola.bible.gospel.john':
		'Ang tahasang nagsasabi kung bakit ito isinulat: „upang kayo ay sumampalataya“. Payak na mga salita, at deretsong tinutungo ang tanong kung sino si Jesus.',
	'schola.bible.step.acts': 'Pagkatapos ay ang sumunod na nangyari',
	'schola.bible.thenActs':
		'Kapag natapos ninyo ang isa, basahin ninyo kung ano ang ginawa ng mga nakakilala sa kanya matapos siyang umalis.',
	'schola.bible.acts.why':
		'Ang tatlumpung taon matapos matapos ang mga Ebanghelyo: ilang dosenang takot na tao, at kung paanong ang kanilang nakita ay nakarating sa kabilang dulo ng imperyo.',
	'schola.bible.step.old': 'Pagkatapos ang mas lumang kalahati',
	'schola.bible.thenOld':
		'Hindi mula sa unang pahina, at hindi ang lahat. Iilang bahagi ang nagdadala ng salaysay, at iyon mismo ang laging binabalikan ng mga Ebanghelyo.',
	'schola.bible.ot.beginnings': 'Kung paano ito nagsisimula, at kung paano ito nasisira.',
	'schola.bible.ot.promise':
		'Isang angkan, at isang pangakong ibinigay dito na nakahihigit sa lahat ng nasa loob nito.',
	'schola.bible.ot.exodus':
		'Isang bayang inilabas mula sa pagkaalipin, at isang batas na ibinigay upang kanilang ikabuhay.',
	'schola.bible.ot.psalms':
		'Hindi salaysay: isang daan at limampung panalangin at awit. Isa-isahin ninyo, sa anumang ayos. Dinarasal pa rin ito ng Simbahan araw-araw.',
	'schola.bible.bothWays':
		'May makikilala kayong mga bagay, at iyon ang layunin at hindi pagkakataon lamang. Binabasa ng Simbahan ang mas lumang mga aklat sa liwanag ni Kristo at ang mas bago sa liwanag ng nauna — bawat kalahati ay nagpapaliwanag sa isa, at kaya walang isa man sa kanila ang binabasang mag-isa.',
	'schola.guide.heading': 'Paano mapapasok ang paligid',
	'schola.guide.lede':
		'Ang teksto ang buong pahina; ang lahat ng iba ay kontrol na maaari ninyong palampasin hanggang kailanganin ninyo.',
	'schola.guide.top.heading': 'Ang bareta sa itaas ng bawat pahina',
	'schola.guide.reading.heading': 'Ang bareta sa ibabaw ng isang teksto',
	'schola.feature.search':
		'Mag-type ng sanggunian sa kahon sa itaas — kabanata at talata, bilang ng bahagi, pangalan ng isang dokumento — at kinukumpleto ito habang nagta-type kayo. Pindutin ang / o Ctrl+K mula saanman, at ang ? para sa iba pang pindutan.',
	'schola.feature.languages':
		'Magkahiwalay na pinipili ang interface at ang teksto, kaya mababasa ninyo ang isang akda sa isang wika habang nananatili sa iba ang mga pindutan. Kung may ilang edisyon ang isang akda sa inyong wika, pumipili rin kayo sa mga iyon.',
	'schola.feature.settings':
		'Laki ng teksto, maliwanag o madilim, sepia, at kung gaano karaming tala ang nais ninyong nasa tabi ng teksto.',
	'schola.feature.offline':
		'Idagdag ninyo ang pook na ito sa inyong home screen at bubukas ito na parang app. Maaari ninyong i-download ang buong akda upang basahin nang walang koneksyon.',
	'schola.feature.contents':
		'Ang mga bahagi ng akdang kinalalagyan ninyo — mga aklat, bahagi, kabanata — upang makagalaw sa loob nito nang hindi bumabalik sa simula.',
	'schola.feature.compare':
		'Dalawang edisyon ng iisang bahagi, magkatabi — ang Latin katabi ng sarili ninyong wika, o isang salin katabi ng isa pa.',
	'schola.feature.apparatus':
		'Ang sariling mga tala ng edisyon, at anumang komentaryong isinulat sa teksto, ay inihahain sa tabi nito at hindi sa ilalim. Ang mga sipi sa loob ng teksto ay mga link, kaya ang sanggunian ay tumutungo sa itinuturo nito.',
	'schola.feature.focus':
		'Inaalis ang lahat maliban sa teksto. Nananatili ang labasan sa kinaroroonan ng bareta, upang walang makulong sa likod nito.',
	'schola.books.heading': 'Ano ang narito, at paano ito sinisipi',
	'schola.books.lede':
		'Bawat isa sa mga ito ay ibang uri ng aklat, at bawat isa ay tinutukoy sa pamamagitan ng sariling bilang. Ipinapakita ng mga halimbawa ang anyo: mag-type ng ganoon sa kahon ng paghahanap at mararating ninyo ang bahagi.',
	'schola.cite.label': 'Sinisipi bilang',
	'schola.what.scripture':
		'Ang Kasulatan gaya ng pagtanggap dito ng Simbahan, sa dalawang Tipan. Ang lahat ng iba rito ay binabasa sa liwanag nito.',
	'schola.cite.scripture':
		'aklat, kabanata at talata, sa mga daglat na inililimbag ng sarili ninyong edisyon',
	'schola.what.catechism':
		'Isang buod ng pinaniniwalaan ng Simbahang Katoliko, sa iisang tomo. Hindi ito mismo ang pinagmulan: tinitipon nito ang Kasulatan, ang mga Ama, ang liturhiya at ang turo ng Simbahan, at sinasabi ng bawat bilang kung saan nagmula ang sinasabi nito.',
	'schola.cite.catechism': 'ayon sa bilang, tuloy-tuloy mula sa unang pahina hanggang sa huli',
	'schola.what.compendium':
		'Ang mismong turo na inilahad sa tanong at sagot, mga ikasampung bahagi ng haba.',
	'schola.cite.compendium': 'ayon sa bilang ng tanong',
	'schola.what.magisterium':
		'Ang aktuwal na isinulat ng mga papa at ng mga konsilyo — mga ensiklika, konstitusyon, dekreto, deklarasyon — bawat isa ay tumutugon sa isang tiyak na sandali at isang tiyak na suliranin. Bawat isa ay kilala sa unang mga salita nito sa Latin.',
	'schola.cite.magisterium': 'ayon sa pangalan ng dokumento, saka sa bilang ng bahagi sa loob nito',
	'schola.what.social':
		'Ang turo ng Simbahan tungkol sa paggawa, ari-arian, pamilya, pulitika at kapayapaan, tinipon mula sa mga dokumentong iyon sa iisang aklat.',
	'schola.cite.social':
		'ayon sa bilang, sa ilalim ng daglat na ginagamit ng akda para sa sarili nito',
	'schola.what.law':
		'Batas at hindi doktrina. Sinasabi nito ang hinihingi ng Simbahan, at ito ay sinusugan.',
	'schola.cite.law': 'ayon sa kanon, ang tawag sa mga bilang nitong yunit',
	'schola.what.doctors':
		'Ang mga teologong ipinahayag ng Simbahan na mga Doktor. Wala itong opisyal na awtoridad, gaano man kadakila ang may-akda.',
	'schola.cite.doctors': 'ayon sa bahagi, saka sa tanong — ang sariling paghahati ng Summa',
	'schola.what.prayers': 'Ang mga salitang idinarasal ng Simbahan, kasama ang Latin sa tabi.',
	'schola.cite.prayers': 'ayon sa pangalan; walang bilang na masisipi',
	'schola.places.heading': 'Hindi mga teksto, kundi mga pook sa pahinang ito',
	'schola.what.library':
		'Lahat ng akda ng pook na ito sa iisang talaan, pinagpangkat ayon sa paksa at hindi ayon sa uri.',
	'schola.what.calendar':
		'Ang araw ng liturhiya — panahon, kulay, at kung sino ang ginugunita — para sa bansang sinusunod ninyo ang kalendaryo.',
	'schola.what.bookmarks':
		'Ang mga bahaging minarkahan ninyo, at kung saan kayo huling tumigil sa bawat akda. Parehong nananatili sa browser na ito at hindi ipinapadala kahit saan.',
	'jumpbox.placeholder': 'Pumunta sa… (hal. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Maghanap',
	'jumpbox.hint': 'Pindutin ang / o Ctrl+K upang pumunta sa isang sanggunian',
	'jumpbox.noMatch': 'Walang natagpuan',
	'jumpbox.suggestions': 'Mga mungkahi',
	'settings.label': 'Mga Setting',
	'darkMode.label': 'Madilim na anyo',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Bukas',
	'darkMode.off': 'Sarado',
	'loadFailed.title': 'Hindi iyon na-load',
	'loadFailed.hint':
		'Umiiral ang pahina — may nagkamali sa pagkuha nito. Karaniwang gumagana ang muling pagsubok.',
	'loadFailed.retry': 'Subukan muli',
	'loadFailed.retrying': 'Sinusubukan…',
	'fontSize.label': 'Laki ng teksto',
	'fontSize.larger': 'Mas malaking teksto',
	'fontSize.smaller': 'Mas maliit na teksto',
	'print.label': 'Ilimbag ang pahinang ito',
	'toTop.label': 'Bumalik sa itaas',
	'edition.label': 'Edisyon',
	'edition.select': 'Pumili ng edisyon',
	'edition.current': 'Kasalukuyang edisyon',
	'edition.filter': 'Maghanap ng edisyon',
	'menu.noMatches': 'Walang tugma',
	'unitNav.previous': 'Nakaraan',
	'unitNav.next': 'Susunod',
	'bible.prevChapter': 'Nakaraang kabanata',
	'bible.nextChapter': 'Susunod na kabanata',
	'bible.pickBook': 'Mga aklat at kabanata',
	'bible.landing.title': 'Ang Bibliya',
	'bible.landing.tagline': 'Basahin ang buong Bibliya, aklat bawat aklat, kabanata bawat kabanata.',
	'bible.landing.books': 'Mga Aklat',
	'bible.introduction': 'Panimula',
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
	'ccc.landing.pairTitle': 'Katesismo at Kompendyo',
	'ccc.landing.tagline':
		'<strong>Ang Katesismo</strong> ay naglalahad ng turong Katoliko sa 2,865 binilang na talata. <strong>Ang Kompendyo</strong> ay muling naglalahad ng gayunding turo sa 598 tanong at sagot, sa gayunding balangkas.',
	'ccc.landing.pairTagline':
		'Ang Katesismo ng Simbahang Katoliko sa 2,865 bilang, at ang Kompendyo nito sa 598 tanong.',
	'compendium.landing.title': 'Kompendyo ng Katesismo',
	'compendium.landing.tagline':
		'Mga tanong at sagot na naglalagom sa Katesismo ng Simbahang Katoliko.',
	'compendium.question': 'Tanong',
	'compendium.answer': 'Sagot',
	'compendium.tableOfContents': 'Talaan ng Nilalaman',
	'compendium.prevQuestion': 'Nakaraang tanong',
	'compendium.nextQuestion': 'Susunod na tanong',
	'compendium.condenses': 'Naglalagom sa KSK ¶¶',
	'ccc.abbrev': 'KSK',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Walang bilang ng tanong sa korpus na ito',
	'document.library.tagline':
		'Mga ensiklika, konstitusyong konsiliyar, dekreto, at pahayag ng Magisterium.',
	'doctores.landing.title': 'Mga Doktor ng Simbahan',
	'doctores.landing.tagline': 'Ang mga akdang teolohiko ng mga Ama at Doktor ng Simbahan.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomas de Aquino, sa Ingles at sa Latin na kanyang isinulat.',
	'index.division': 'Bahagi',
	'prayers.landing.title': 'Karaniwang mga Panalangin',
	'prayers.landing.tagline': 'Mga panalangin na may katabing tekstong Latin.',
	'prayers.seeAlso': 'Tingnan din',
	'anchor.actions': 'Mga gawain sa sanggunian',
	'anchor.copy': 'Kopyahin ang teksto',
	'anchor.copyLink': 'Kopyahin ang link',
	'anchor.view': 'Tingnan',
	'anchor.copied': 'Nakopya',
	'anchor.copyFailed': 'Hindi makopya',
	'bookmark.add': 'Markahan',
	'bookmark.remove': 'Alisin ang bookmark',
	'bookmark.library': 'Mga Bookmark',
	'bookmark.library.tagline': 'Lahat ng minarkahan ninyo habang nagbabasa.',
	'bookmark.empty': 'Wala pang minarkahan.',
	'bookmark.emptyHint':
		'Pindutin ang bilang ng isang talata o parapo at piliin ang Markahan, o gamitin ang pindutang bookmark sa pahina.',
	'bookmark.deviceOnly':
		'Ang mga bookmark ay nananatili sa browser na ito lamang. Hindi ipinapadala saanman, at nawawala ang mga ito kapag binura ang datos ng browser.',
	'bookmark.unavailable': 'Wala sa edisyong binabasa ninyo',
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
	'footer.notEndorsed': 'Walang pag-apruba ng Banal na Sede',
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
	'art.about': 'Tungkol sa larawang ito',
	'art.detail': 'bahagi',
	'colophon.typeTitle': 'Ang letra',
	'colophon.typeBody':
		'Nakahanay sa EB Garamond, ang muling pagbuhay nina Georg Duffner at Octavio Pardo sa mga letrang inukit ni Claude Garamont noong dekada 1590 — ang tradisyong humanista na pinaglilimbagan ng Simbahan mula pa noong Renasimyento. Ang Sirilikong letra nito ay mula sa parehong mga kamay ngunit walang binubuhay: walang Sirilikong Garamond na naukit kailanman, kaya ang Ruso ay nakahanay sa isang anyong iginuhit upang tumabi sa iba.',
	'colophon.typeArabic':
		'Ang Arabe ay lubos na lampas dito, at nakahanay sa Amiri — ang muling pagbuhay ni Khaled Hosny sa naskh na inukit para sa palimbagang Bulaq sa Cairo noong 1905, pinili sa parehong dahilan gaya ng letra ng teksto: isang tiyak na makasaysayang letra ng aklat sa halip na isang kasalukuyang guhit.',
	'colophon.typeInitials':
		'Ang mga pambungad na inisyal ay Pirata One, isang letrang gotiko na ang malalaking titik ay nananatiling mababasa sa sukat na hinihingi ng isang malaking unang titik, at — para sa Ruso — Ponomar, na muling gumagawa ng letrang Slavoniko ng Simbahan ng Palimbagang Sinodal. Ang Ponomar ay naghahanay ng inisyal at hindi kailanman ng teksto: ang isang makabagong ensiklika na buong nakahanay sa letrang Sinodal ay magsasabi ng isang bagay na hindi totoo tungkol sa kung ano ito. Lahat ay lisensiyado sa ilalim ng SIL Open Font License at inihahain mula sa pook-sapot na ito sa halip na mula sa ibang panig, kaya ang pagbabasa ng isang pahina ay walang hinihingi sa server ng iba.',
	'copyright.sourceTitle': 'Buksan ang orihinal na pahina ng pinagmulan',
	'copyright.sourceLabel': 'Pinagmulan',
	'lang.label': 'Wika',
	'lang.filter': 'Maghanap ng wika',
	'lang.more': 'iba pang wika'
};
