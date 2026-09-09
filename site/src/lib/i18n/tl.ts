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
	'nav.sections': 'Mga Seksyon',
	'nav.works': 'Mga Akda',
	'nav.pages': 'Mga Pahina',
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
	'schola.start.heading': 'Bago sa Katolisismo?',
	'schola.start.body': 'Ang pinakamainam na simula ay ang ',
	'schola.start.bodyAfter':
		': ang mismong turo ng Katesismo, higit na maikli, nakasulat sa tanong at sagot. Mga ikasampung bahagi lamang ang haba nito at wala itong ipinapalagay.',
	'schola.bible.heading': 'Hindi pa nababasa ang Bibliya?',
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
	'schola.books.heading': 'Ano ang narito, at paano ito tinutukoy',
	'schola.books.lede':
		'Bawat isa sa mga ito ay ibang uri ng aklat, at bawat isa ay tinutukoy sa pamamagitan ng sariling bilang. Ipinapakita ng mga halimbawa ang anyo: mag-type ng ganoon sa kahon ng paghahanap at mararating ninyo ang bahagi.',
	'schola.cite.label': 'Tinutukoy',
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
	'ccc.noCounterpart': 'Walang katumbas sa kabilang akda',
	'jumpbox.placeholder': 'Pumunta sa… (hal. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Maghanap',
	'jumpbox.hint': 'Pindutin ang / o Ctrl+K upang pumunta sa isang sanggunian',
	'jumpbox.noMatch': 'Walang natagpuan',
	'jumpbox.suggestions': 'Mga mungkahi',
	'settings.label': 'Mga Setting',
	'apparatus.label': 'Apparatus',
	'apparatus.editionNotes': 'Mga tala ng edisyong ito',
	'apparatus.commentary': 'Komentaryo',
	'apparatus.inCommentary': 'Kasama na sa komentaryong nasa itaas.',
	'darkMode.label': 'Madilim na anyo',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Bukas',
	'darkMode.off': 'Sarado',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Sa maliwanag na anyo lamang',
	'sepia.noHue': 'Wala sa Iisang Kulay',
	'oled.label': 'Itim na OLED',
	'oled.darkOnly': 'Sa madilim na anyo lamang',
	'mono.label': 'Iisang Kulay',
	'mono.hint':
		'Isinasaayos nito ang buong pahina sa iisang kulay-abo, kaya walang natatanging bagay ayon sa kulay. Namamatay ang sepia habang ito ay bukas.',
	'advanced.label': 'Advanced',
	'library.title': 'Aklatang Walang-Koneksyon',
	'library.lede': 'Ang mga tekstong nasa device na ito ay bumubukas nang walang anumang koneksyon.',
	'library.essentials': 'Mga Panalangin at Kompendyo',
	'library.illustrations': 'Bibliya (mga larawan)',
	'library.illustrationsDetail': 'Bibliya (mga larawan, mataas na resolusyon)',
	'library.other': 'Iba pang teksto',
	'library.everything': 'Lahat',
	'library.downloadAll': 'I-download ang lahat',
	'library.download': 'I-download',
	'library.downloaded': 'Nasa device na ito',
	'library.offlineNote': 'Isara ang Offline mode upang makapag-download ng anuman.',
	'library.remove': 'Alisin mula sa device na ito',
	'library.removeConfirm': 'Alisin?',
	'library.forget': 'Alisin ang mga na-download',
	'library.forgetConfirm': 'Alisin ang lahat?',
	'offline.label': 'Offline mode',
	'offline.hint':
		'Hindi gumagamit ng anumang network: walang dina-download, walang sinusuring update, walang sinusukat. Ang mga tekstong nasa device na ito na lamang ang bubukas.',
	'offline.notDownloaded': 'Wala sa device na ito',
	'loadFailed.title': 'Hindi iyon na-load',
	'loadFailed.hint':
		'Umiiral ang pahina — may nagkamali sa pagkuha nito. Karaniwang gumagana ang muling pagsubok.',
	'loadFailed.retry': 'Subukan muli',
	'loadFailed.retrying': 'Sinusubukan…',
	'offline.turnOff': 'Isara ang offline mode',
	'type.label': 'Laki at uri ng letra',
	'fontSize.label': 'Laki ng teksto',
	'fontSize.small': 'Maliit',
	'fontSize.medium': 'Katamtaman',
	'fontSize.large': 'Malaki',
	'fontSize.xlarge': 'Napakalaki',
	'fontSize.xxlarge': 'Pinakamalaki',
	'face.label': 'Uri ng letra',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Ilimbag ang pahinang ito',
	'toTop.label': 'Bumalik sa itaas',
	'install.label': 'I-install ang Glossa',
	'install.hint.label': 'Idagdag sa Home Screen',
	'install.hint.title': 'Idagdag ang Glossa sa inyong Home Screen',
	'install.hint.stepBefore':
		'Bumubukas ito na parang app at nababasa kahit walang koneksyon. Pindutin ang',
	'install.hint.stepAfter': 'pagkatapos ay „Idagdag sa Home Screen“.',
	'install.hint.dismiss': 'Isara',
	'update.label': 'May bagong edisyong magagamit',
	'update.title': 'Handa na ang bagong edisyon',
	'update.body': 'Mag-reload upang makuha ang mga pinakabagong teksto at pagwawasto.',
	'update.action': 'I-reload',
	'update.dismiss': 'Huwag muna',
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
	'bible.landing.random': 'Susubok ng Suwerte',
	'bible.landing.books': 'Mga Aklat',
	'bible.chapterUnavailable': 'Wala sa edisyong ito',
	'bible.introduction': 'Panimula',
	'bible.introUnavailable': 'Wala pang panimula sa wikang ito',
	'bible.introSource': 'Ang mga panimula ay hindi bahagi ng tekstong Kasulatan.',
	'bible.testament.ot': 'Lumang Tipan',
	'bible.testament.nt': 'Bagong Tipan',
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
	'ccc.prevParagraph': 'Nakaraang talata',
	'ccc.nextParagraph': 'Susunod na talata',
	'ccc.inBrief': 'Sa Madaling Sabi',
	'ccc.landing.title': 'Katesismo ng Simbahang Katoliko',
	'ccc.landing.pairTitle': 'Katesismo at Kompendyo',
	'ccc.landing.tagline':
		'<strong>Ang Katesismo</strong> ay naglalahad ng turong Katoliko sa 2,865 binilang na talata. <strong>Ang Kompendyo</strong> ay muling naglalahad ng gayunding turo sa 598 tanong at sagot, sa gayunding balangkas.',
	'ccc.landing.pairTagline':
		'Ang Katesismo ng Simbahang Katoliko sa 2,865 bilang, at ang Kompendyo nito sa 598 tanong.',
	'ccc.tableOfContents': 'Talaan ng Nilalaman',
	'ccc.related': 'Tingnan din',
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
	'ccc.condensedIn': 'Sa Kompendyo',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Walang bilang ng tanong sa korpus na ito',
	'document.library.tagline':
		'Mga ensiklika, konstitusyong konsiliyar, dekreto, at pahayag ng Magisterium.',
	'document.filter.heading': 'Filtro',
	'document.filter.author': 'May-akda',
	'document.filter.kind': 'Uri',
	'document.filter.subject': 'Paksa',
	'document.filter.search': 'Maghanap ng dokumento',
	'document.filter.clear': 'Burahin',
	'document.filter.results': 'Mga dokumentong ipinapakita',
	'document.filter.noResults': 'Walang dokumentong tumutugma sa mga filtrong ito.',
	'document.tableOfContents': 'Talaan ng Nilalaman',
	'document.startReading': 'Simulan ang pagbabasa',
	'document.readFullDocument': 'Basahin ang buong dokumento',
	'document.section': 'Seksyon',
	'document.prevSection': 'Nakaraan',
	'document.nextSection': 'Susunod',
	'document.kind.conciliarConstitution': 'Konstitusyon',
	'document.kind.conciliarDecree': 'Dekreto',
	'document.kind.conciliarDeclaration': 'Pahayag',
	'document.kind.encyclical': 'Ensiklika',
	'document.kind.apostolicExhortation': 'Apostolikong Eksortasyon',
	'document.kind.apostolicConstitution': 'Apostolikong Konstitusyon',
	'document.kind.apostolicLetter': 'Apostolikong Liham',
	'document.kind.cdfDeclaration': 'Pahayag ng CDF',
	'document.kind.cdfInstruction': 'Tagubilin ng CDF',
	'document.kind.cdfLetter': 'Liham ng CDF',
	'document.kind.cdfDoctrinalNote': 'Doktrinal na Tala ng CDF',
	'document.kind.cdfResponsum': 'Responsum ng CDF',
	'document.kind.cdfConsiderations': 'Mga Konsiderasyon ng CDF',
	'document.kindPlural.conciliarConstitution': 'Mga Konstitusyon',
	'document.kindPlural.conciliarDecree': 'Mga Dekreto',
	'document.kindPlural.conciliarDeclaration': 'Mga Pahayag',
	'document.kindPlural.encyclical': 'Mga Ensiklika',
	'document.kindPlural.apostolicExhortation': 'Mga Apostolikong Eksortasyon',
	'document.kindPlural.apostolicConstitution': 'Mga Apostolikong Konstitusyon',
	'document.kindPlural.apostolicLetter': 'Mga Apostolikong Liham',
	'document.kindPlural.cdfDeclaration': 'Mga Pahayag ng CDF',
	'citation.unavailable': 'Walang tekstong pinagkunan na makukuha para sa talang ito.',
	'doctores.landing.title': 'Mga Doktor ng Simbahan',
	'doctores.landing.tagline': 'Ang mga akdang teolohiko ng mga Ama at Doktor ng Simbahan.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomas de Aquino, sa Ingles at sa Latin na kanyang isinulat.',
	'summa.tableOfContents': 'Talaan ng Nilalaman',
	'summa.part': 'Bahagi',
	'summa.question': 'Tanong',
	'summa.article': 'Artikulo',
	'summa.questionShort': 'T',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titulo mula sa edisyong {lang}',
	'summa.titlesFromEdition': 'Mga titulo mula sa edisyong {lang} — wala itong inilalathala',
	'summa.prologue': 'Prologo',
	'summa.objection': 'Pagtutol',
	'summa.sedContra': 'Bagkus',
	'summa.corpus': 'Sumasagot Ako',
	'summa.reply': 'Sagot sa Pagtutol',
	'summa.preamble': 'Tala',
	'summa.prevQuestion': 'Nakaraang tanong',
	'summa.nextQuestion': 'Susunod na tanong',
	'summa.noEditionInYourLanguage': 'Walang edisyon ng Summa sa inyong wika. Ipinapakita sa {lang}.',
	'summa.noLatinSupplement':
		'Ang Supplement ay nasa Ingles lamang — natipon ito pagkatapos mamatay si Aquino.',
	'index.division': 'Bahagi',
	'index.showSubsections': 'Ipakita ang mga subseksyon',
	'index.hideSubsections': 'Itago ang mga subseksyon',
	'prayers.landing.title': 'Karaniwang mga Panalangin',
	'prayers.landing.tagline': 'Mga panalangin na may katabing tekstong Latin.',
	'prayers.tableOfContents': 'Talaan ng Nilalaman',
	'prayers.gloss.versicle':
		'Ang linyang binibigkas o inaawit nang mag-isa ng namumuno sa panalangin; sinasagot ito ng kapulungan sa sagot na kasunod.',
	'prayers.gloss.response':
		'Ang linyang binibigkas o inaawit nang sabay-sabay ng kapulungan, bilang sagot sa linyang nauna rito.',
	'prayers.seeAlso': 'Tingnan din',
	'prayers.prevPrayer': 'Nakaraang panalangin',
	'prayers.nextPrayer': 'Susunod na panalangin',
	'prayers.rosary.today': 'Ngayon',
	'prayers.rosary.todayHeading': 'Ang mga misteryo ngayon',
	'prayers.rosary.openingPrayer': 'Pambungad na panalangin',
	'prayers.rosary.decadePrayers': 'Ang mga panalangin ng dekada',
	'ref.tooltip.loading': 'Naglo-load…',
	'ref.tooltip.openCcc': 'Buksan sa Katesismo',
	'ref.tooltip.openBible': 'Buksan sa Bibliya',
	'ref.tooltip.openCompendium': 'Buksan sa Kompendyo',
	'ref.preview.open': 'Buksan',
	'ref.cf': 'cf.',
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
	'bookmark.about': 'Tungkol sa mga bookmark na ito',
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
	'colophon.privacyTitle': 'Pagkapribado',
	'colophon.privacyBody1':
		'Walang account, walang cookies, walang patalastas, walang code mula sa ibang panig. Walang sumusunod sa inyo palabas ng pook-sapot na ito.',
	'colophon.privacyBody2':
		'Binibilang namin kung paano ginagamit ang pook-sapot na ito: isang sukat kada pagdalaw, bawat patlang ay saklaw sa halip na tiyak na halaga — kung gaano katagal kayong nanatili, kung gaano kadalas kayo narito, at aling mga akda ang binuksan ninyo. Ang inyong bansa ay binibilang nang hiwalay, na walang naguugnay dito sa iba pa. Naglalarawan ito ng isang pagdalaw, hindi ng isang bisita, at itinatago nang {days} araw.',
	'colophon.privacyBody3':
		'Hindi kailanman ipinapadala: ang inyong itine-type sa kahon ng paghahanap, kung aling bahagi ang bukas ninyo, o anumang makakakilala muli sa inyong device. Ang inyong mga setting, bookmark, at na-download na teksto ay nananatili sa inyong device.',
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
	'plates.scansBy': 'Mga scan na ibinigay ni',
	'plates.enlarge': 'Palakihin ang {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Tungkol sa larawang ito',
	'art.detail': 'bahagi',
	'colophon.typeTitle': 'Ang letra',
	'colophon.typeBody':
		'Nakahanay sa EB Garamond, ang muling pagbuhay nina Georg Duffner at Octavio Pardo sa mga letrang inukit ni Claude Garamont noong dekada 1590 — ang tradisyong humanista na pinaglilimbagan ng Simbahan mula pa noong Renasimyento. Ang Sirilikong letra nito ay mula sa parehong mga kamay ngunit walang binubuhay: walang Sirilikong Garamond na naukit kailanman, kaya ang Ruso ay nakahanay sa isang anyong iginuhit upang tumabi sa iba.',
	'colophon.typeArabic':
		'Ang Arabe ay lubos na lampas dito, at nakahanay sa Amiri — ang muling pagbuhay ni Khaled Hosny sa naskh na inukit para sa palimbagang Bulaq sa Cairo noong 1905, pinili sa parehong dahilan gaya ng letra ng teksto: isang tiyak na makasaysayang letra ng aklat sa halip na isang kasalukuyang guhit.',
	'colophon.typeInitials':
		'Ang mga pambungad na inisyal ay Pirata One, isang letrang gotiko na ang malalaking titik ay nananatiling mababasa sa sukat na hinihingi ng isang malaking unang titik, at — para sa Ruso — Ponomar, na muling gumagawa ng letrang Slavoniko ng Simbahan ng Palimbagang Sinodal. Ang Ponomar ay naghahanay ng inisyal at hindi kailanman ng teksto: ang isang makabagong ensiklika na buong nakahanay sa letrang Sinodal ay magsasabi ng isang bagay na hindi totoo tungkol sa kung ano ito. Lahat ay lisensiyado sa ilalim ng SIL Open Font License at inihahain mula sa pook-sapot na ito sa halip na mula sa ibang panig, kaya ang pagbabasa ng isang pahina ay walang hinihingi sa server ng iba.',
	'refs.citedIn': 'Sinipi sa',
	'refs.externalVolume': 'Tomo {volume} sa {host} — na-scan na PDF',
	'bible.wholeChapter': 'Ang kabanatang ito',
	'bible.verseNotInEdition':
		'Ang bilang ng talatang ito ay wala sa edisyong ito — tingnan ang tala sa pinagmulan ng pahina',
	'bible.verseAbbrev': 'tal.',
	'bible.note': 'Tala',
	'bible.noteMissing': 'Nawawala ang talang ito sa korpus',
	'bible.chapterArgument': 'Argumento',
	'ccc.readFullChapter': 'Basahin ang buong kabanata',
	'ccc.noParagraphNumber': 'Walang bilang ng talata sa korpus na ito',
	'copyright.sourceTitle': 'Buksan ang orihinal na pahina ng pinagmulan',
	'copyright.sourceLabel': 'Pinagmulan',
	'lang.label': 'Wika',
	'lang.filter': 'Maghanap ng wika',
	'lang.more': 'iba pang wika',
	'notFound.title': 'Walang anuman sa tirahang ito',
	'notFound.lede': 'Wala rito ang pahinang hinahanap ninyo.',
	'notFound.body':
		'Maaaring mali ang pagkasulat ng link o luma na ito, o maaaring itinuturo nito ang isang tekstong wala sa pook-sapot na ito.',
	'notFound.searchHint':
		'Kung alam ninyo ang sanggunian na gusto ninyo — isang aklat at kabanata, isang talata ng Katesismo — i-type ito sa kahon ng paghahanap sa itaas ng pahinang ito.',
	'notFound.credit': 'Batay sa British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'O magsimula sa isa sa mga ito:',
	'notFound.home': 'Tahanan',
	'compare.enter': 'Ihambing ang mga edisyon',
	'compare.exit': 'Lumabas sa paghahambing',
	'compare.missing': 'Wala sa edisyong ito',
	'compare.versificationNote':
		'Magkaiba ang paghahati ng dalawang edisyong ito sa mga talata ng kabanatang ito sa ilang bahagi (isang pagkakaiba sa teksto, hindi pagpili sa pagsasalin) — hindi laging tumutukoy ang parehong bilang ng talata sa parehong pangungusap sa magkabilang hanay.',
	'compare.loading': 'Naglo-load ng pangalawang wika…',
	'ui.close': 'Isara',
	'shortcuts.title': 'Mga shortcut sa keyboard',
	'shortcuts.betweenDocuments': 'Sa pagitan ng mga dokumento',
	'shortcuts.withinDocument': 'Sa loob ng dokumento',
	'shortcuts.show': 'Ipakita ang talaang ito',
	'help.title': 'Tulong',
	'help.reading.heading': 'Ang bareta sa ibabaw ng isang teksto',
	'help.feature.search':
		'Mag-type ng sanggunian sa kahon sa itaas — kabanata at talata, bilang ng bahagi, pangalan ng isang dokumento — at kinukumpleto ito habang nagta-type kayo.',
	'help.feature.offline':
		'Idagdag ninyo ang pook na ito sa inyong home screen at bubukas ito na parang app. Maaari ninyong i-download ang buong akda upang basahin nang walang koneksyon.',
	'help.feature.contents':
		'Ang mga bahagi ng akdang kinalalagyan ninyo — mga aklat, bahagi, kabanata — upang makagalaw sa loob nito nang hindi bumabalik sa simula.',
	'help.feature.compare':
		'Dalawang edisyon ng iisang bahagi, magkatabi — ang Latin katabi ng sarili ninyong wika, o isang salin katabi ng isa pa.',
	'help.feature.apparatus':
		'Ang sariling mga tala ng edisyon, at anumang komentaryong isinulat sa teksto, ay inihahain sa tabi nito at hindi sa ilalim. Ang mga sipi sa loob ng teksto ay mga link, kaya ang sanggunian ay tumutungo sa itinuturo nito.',
	'help.feature.focus':
		'Inaalis ang lahat maliban sa teksto. Nananatili ang labasan sa kinaroroonan ng bareta, upang walang makulong sa likod nito.',
	'zen.enter': 'Anyo ng Pagtutok',
	'zen.exit': 'Umalis sa Anyo ng Pagtutok',
	'nav.calendar': 'Kalendaryo',
	'calendar.title': 'Kalendaryong liturhiko',
	'calendar.tagline':
		'Ang Pangkalahatang Kalendaryong Romano, tinutuos para sa alinmang araw — ang panahon nito, ang antas nito, ang kulay nito.',
	'calendar.calendar': 'Kalendaryo',
	'calendar.which.general': 'Pangkalahatang Kalendaryong Romano',
	'calendar.filter': 'Maghanap ng bansa',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Aprika',
	'calendar.region.middleEast': 'Gitnang Silangan',
	'calendar.region.asia': 'Asya',
	'calendar.region.oceania': 'Oseanya',
	'calendar.today': 'Ngayon',
	'calendar.previousMonth': 'Nakaraang buwan',
	'calendar.nextMonth': 'Susunod na buwan',
	'calendar.plainDays': 'Mga Karaniwang Araw',
	'calendar.noSuchDay': 'Walang araw na liturhiko ang natutuos para sa petsang iyon.',
	'calendar.week': 'linggo',
	'calendar.alsoToday': 'Ipinagdiriwang din ngayon',
	'calendar.alsoObserved': 'Ginugunita rin ngayon',
	'calendar.obligation': 'Banal na araw ng pananagutan',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Siklo ng Linggo',
	'calendar.weekdayCycle': 'Siklo ng karaniwang araw',
	'calendar.psalterWeek': 'Linggo ng salterio',
	'lectionary.heading': 'Mga Pagbasa sa Misa',
	'lectionary.slot.reading': 'Pagbasa',
	'lectionary.slot.reading1': 'Unang Pagbasa',
	'lectionary.slot.reading2': 'Ikalawang Pagbasa',
	'lectionary.slot.reading3': 'Ikatlong Pagbasa',
	'lectionary.slot.reading4': 'Ikaapat na Pagbasa',
	'lectionary.slot.reading5': 'Ikalimang Pagbasa',
	'lectionary.slot.reading6': 'Ikaanim na Pagbasa',
	'lectionary.slot.reading7': 'Ikapitong Pagbasa',
	'lectionary.slot.psalm': 'Salmong Tugunan',
	'lectionary.slot.epistle': 'Sulat',
	'lectionary.slot.acclamation': 'Pambungad sa Ebanghelyo',
	'lectionary.slot.gospel': 'Ebanghelyo',
	'lectionary.slot.sequence': 'Sekwensya',
	'lectionary.or': 'o',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'Tungkol sa mga pagbasang ito',
	'lectionary.caveat':
		'Ang mga bahaging itinalaga ng Ordo Lectionum Missae, naka-link sa sariling mga edisyon ng pook-sapot na ito — hindi ang salin na binibigkas sa alinmang partikular na simbahan, at maaaring iakma ng isang kumperensya ang iskedyul.',
	'calendar.transferredFrom': 'Inilipat mula',
	'calendar.season.advent': 'Adbiyento',
	'calendar.season.christmas': 'Panahon ng Pasko',
	'calendar.season.lent': 'Kuwaresma',
	'calendar.season.triduum': 'Tatlong Araw ng Pagkabuhay',
	'calendar.season.easter': 'Panahon ng Pagkabuhay',
	'calendar.season.ordinary': 'Karaniwang Panahon',
	'calendar.colour.white': 'Puti',
	'calendar.colour.red': 'Pula',
	'calendar.colour.green': 'Berde',
	'calendar.colour.violet': 'Lila',
	'calendar.colour.rose': 'Rosas',
	'calendar.colour.black': 'Itim',
	'calendar.colour.blue': 'Asul',
	'calendar.rank.solemnity': 'Dakilang Kapistahan',
	'calendar.rank.feast': 'Kapistahan',
	'calendar.rank.memorial': 'Paggunita',
	'calendar.rank.optional-memorial': 'Malayang paggunita',
	'calendar.rank.commemoration': 'Pag-alaala',
	'calendar.rank.sunday': 'Linggo',
	'calendar.rank.weekday': 'Karaniwang araw',
	'calendar.gloss.season.advent':
		'Ang apat na linggo bago ang Pasko: paghahanda sa pagdating ng Panginoon, at simula ng taon ng Simbahan.',
	'calendar.gloss.season.christmas':
		'Mula sa Pasko hanggang sa Pagbibinyag sa Panginoon, ipinagdiriwang ang pagsilang ng Panginoon at ang kanyang pagpapakita sa sanlibutan.',
	'calendar.gloss.season.lent':
		'Ang apatnapung araw mula Miyerkules ng Abo hanggang sa Misa sa gabi ng Huling Hapunan ng Panginoon: pagsisisi, limos, at paghahanda sa Pasko ng Pagkabuhay.',
	'calendar.gloss.season.triduum':
		'Ang tatlong araw mula sa gabi ng Huwebes Santo hanggang sa gabi ng Linggo ng Pagkabuhay — ang pagpapakasakit, kamatayan at muling pagkabuhay ng Panginoon, at ang rurok ng buong taon.',
	'calendar.gloss.season.easter':
		'Ang limampung araw mula sa Pasko ng Pagkabuhay hanggang Pentekostes, ipinagdiriwang bilang iisang kapistahan — „iisang malaking Linggo“.',
	'calendar.gloss.season.ordinary':
		'Ang tatlumpu’t tatlo o tatlumpu’t apat na linggo sa labas ng ibang panahon. Hindi „pangkaraniwan“ kundi nakaayos: binibilang ang mga linggo, at sunud-sunod na binabasa ng Simbahan ang buhay at aral ng Panginoon. Dumarating ito sa dalawang bahagi — pagkatapos ng Panahon ng Pasko hanggang sa Kuwaresma, at pagkatapos ng Pentekostes hanggang sa Adbiyento.',
	'calendar.gloss.rank.solemnity':
		'Ang pinakamataas na antas: ang Pasko ng Pagkabuhay, ang Pasko, ang Pag-akyat sa Langit, ang patron ng isang lugar. Ipinagdiriwang nang may Papuri at Sumasampalataya, at nagsisimula sa gabi bago nito.',
	'calendar.gloss.rank.feast':
		'Ipinagdiriwang sa loob mismo ng araw. Ang mga apostol at ebanghelista, at ang mas malalaking araw ng Panginoon at ng Mahal na Birhen.',
	'calendar.gloss.rank.memorial':
		'Isang santong ginugunita sa kanyang araw, sa loob ng Misa at Liturhiya ng mga Oras ng panahong iyon. Sapilitan saanman ito ipinagdiriwang.',
	'calendar.gloss.rank.optional-memorial':
		'Maaaring ipagdiwang o hindi, ayon sa pili ng pari o ng pamayanan. Kung hindi ipinagdiwang, ang araw ay simpleng araw ng linggo.',
	'calendar.gloss.rank.commemoration':
		'Ang nagiging anyo ng paggunita sa Kuwaresma: isang panalanging idinaragdag sa Misa ng karaniwang araw, na buo namang pinananatili ng panahon.',
	'calendar.gloss.rank.sunday':
		'Ang unang kapistahan — ang Araw ng Panginoon, ipinagdiriwang tuwing linggo mula pa sa muling pagkabuhay. Dakilang kapistahan lamang o kapistahan ng Panginoon ang makapagpapalit nito, at sa Adbiyento, Kuwaresma at Panahon ng Pagkabuhay ay kahit ang mga iyon ay hindi.',
	'calendar.gloss.rank.weekday':
		'Araw na walang sariling pagdiriwang. Ang Misa at ang Liturhiya ng mga Oras ay sa panahon — na siyang dahilan kung bakit sulit malaman ang panahon.',
	'calendar.gloss.colour.white':
		'Galak. Panahon ng Pagkabuhay at ng Pasko, ang mga araw ng Panginoon maliban sa kanyang pagpapakasakit, ang Mahal na Birhen, ang mga anghel, at ang mga santong hindi martir.',
	'calendar.gloss.colour.red':
		'Dugo at apoy. Linggo ng Palaspas at Biyernes Santo, Pentekostes, ang mga apostol at ebanghelista, at ang mga martir.',
	'calendar.gloss.colour.green':
		'Karaniwang Panahon: ang kulay ng pag-asa, at ng mga bagay na lumalago.',
	'calendar.gloss.colour.violet':
		'Adbiyento at Kuwaresma, at isinusuot din sa mga Misa para sa mga yumao.',
	'calendar.gloss.colour.rose':
		'Isinusuot dalawang beses sa isang taon — sa Linggong Gaudete, ang ikatlo ng Adbiyento, at sa Linggong Laetare, ang ikaapat ng Kuwaresma — kung saan gumagaan ang pag-aayuno at natatanaw na ang wakas.',
	'calendar.gloss.colour.black': 'Maaaring isuot sa mga Misa para sa mga yumao.',
	'calendar.gloss.colour.blue':
		'Ang pribilehiyo ng asul: isinusuot sa Kalinis-linisang Paglilihi sa Espanya, sa Pilipinas, at sa iilang ibang pook na pinagkalooban nito ng Santa Sede.',
	'calendar.gloss.sundayCycle':
		'Ang mga pagbasa sa Linggo ay umiikot sa tatlong taon — A, B at C — sunod-sunod na binabasa sina Mateo, Marcos at Lucas, kasama si Juan sa Kuwaresma at Panahon ng Pagkabuhay. Nagpapalit ang siklo sa unang Linggo ng Adbiyento, kasabay ng taon ng Simbahan.',
	'calendar.gloss.weekdayCycle':
		'Ang mga pagbasa sa karaniwang araw ay umiikot sa dalawang taon, I at II: nagbabago ang unang pagbasa, ang Ebanghelyo ay hindi. Ang isang taong liturhiko ay ipinapangalan sa taong pansibil na kinatatapusan nito — ang mga taong gansal ay I, ang mga taong pares ay II.',
	'calendar.gloss.psalterWeek':
		'Hinahati ng Liturhiya ng mga Oras ang mga salmo sa apat na linggo, I hanggang IV, na inuulit sa buong taon. Ito ang linggo na ang mga salmo ay para sa ngayon, para sa sinumang dumadalangin ng mga Oras.',
	'calendar.gloss.obligation':
		'Araw na obligado ang mga mananampalatayang makibahagi sa Misa at umiwas sa mga gawaing hahadlang dito. Bawat Linggo, at ang iba pang araw na itinakda ng bawat kumperensya ng mga obispo.',
	'calendar.primer.title': 'Bago ka rito?',
	'calendar.primer.lead':
		'May sariling taon ang Simbahan. Nagsisimula ito sa Adbiyento, umiikot sa Pasko ng Pagkabuhay, at binibigyan ang bawat araw ng pangalan, antas at kulay — at ang mga ito ang nagpapasya kung ano ang idinadalangin at binabasa sa araw na iyon sa Misa at sa Liturhiya ng mga Oras. Kaya ang „ikadalawampu’t tatlong Linggo sa Karaniwang Panahon“ ay isang adres: sinasabi nito sa pari, sa koro, o sa sinumang nagdarasal sa bahay kung aling mga panalangin at pagbasa ang para sa araw na ito.',
	'calendar.primer.seasons': 'Ang mga panahon',
	'calendar.primer.ranks': 'Ano ang maaaring maging isang araw',
	'calendar.primer.colours': 'Ang mga kulay',
	'calendar.primer.cycles': 'Ang mga siklo',
	'calendar.primer.cyclesLead':
		'Tatlong pambilang na sama-samang nagsasabi kung aling mga pagbasa at salmo ang nakatakda para sa araw na ito.'
};
