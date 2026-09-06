/**
 * Malagasy UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * THE FIRST DICTIONARY WRITTEN FOR A LANGUAGE NOBODY WORKING HERE READS, and
 * the reason it was owed is recorded in `../types.ts`: vatican.va publishes
 * the Catechism in Malagasy, so `ccc.mg` has been in the corpus since
 * 2026-08-26 — 2,865 paragraphs, a whole work — and its readers had it inside
 * English chrome, which is the one combination `../ui-langs.ts` says the
 * interface list should never leave standing.
 *
 * ITS VOCABULARY IS READ OFF THAT EDITION RATHER THAN INVENTED. The corpus is
 * the authority for how Malagasy Catholic usage actually names these things,
 * and it settles the words that matter most here: `Katesizin'ny Fiangonana
 * Katôlika` is the Catechism's own title in `ccc.mg/manifest.json`, and
 * `Toko` (chapter), `Fizarana` (part), `Sampana` (section) and `finoana`
 * (faith) are its own division headings. Where this file guesses instead, it
 * omits the key — see below.
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
 * TRANSLATION CONFIDENCE: LOW. Written by an LLM with no native reader in
 * the loop, and this is one of the five languages where that is most
 * likely to show — only the terms read off `ccc.mg` above are grounded,
 * and the rest of this file is not. Treat every string here as a proposal.
 * Correcting one is a one-line change and needs no permission; because
 * `t()` falls back to English per key, DELETING a doubtful line is also a
 * valid fix and strictly better than leaving a wrong one standing.
 *
 * THE REFERENCE MENU AND THE LANGUAGE PICKER ARRIVED 2026-09-06, with the
 * bookmark panel's own hints -- this file had the settings and the jump box
 * already. Same caveat as everything above: not read by a native speaker.
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

export const mg: Dictionary = {
	'nav.bible': 'Baiboly',
	'nav.ccc': 'Katesizy',
	'nav.compendium': 'Famintinana',
	'nav.magisterium': 'Fampianaran’ny Fiangonana',
	'nav.socialDoctrine': 'Fampianarana sosialy',
	'socialDoctrine.landing.title': "Fintina ny Fampianarana Sosialin'ny Fiangonana",
	'socialDoctrine.landing.tagline':
		"Izay ampianarin'ny Fiangonana momba ny fiainana iarahana, ao anatin'ny laharana 583.",
	'nav.canonLaw': 'Lalàna kanonika',
	'canonLaw.landing.title': 'Fehezan-dalàna Kanonika',
	'canonLaw.landing.tagline':
		'Ny lalàn’ny Fiangonana latina, ao anatin’ny kanôna 1752 mizara ho boky fito.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Kanôna teo aloha',
	'canonLaw.nextCanon': 'Kanôna manaraka',
	'canonLaw.readFullTitle': 'Vakio ny lohateny manontolo',
	'canonLaw.superseded': 'Andalana nosoloin’ny',
	'nav.prayers': 'Vavaka',
	'nav.bookmarks': 'Fanamarihana',
	'nav.menu': 'Karazana',
	'nav.summa': 'Somà',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Manohy mamaky',
	'home.tagline':
		'Tranonkala famakiana ny Soratra Masina, ny Katesizy ary ny antontan-taratasin’ny Fampianarana Ofisialy — maimaim-poana, mandeha na tsy misy fifandraisana aza, ary tsy misy hisoratana anarana.',
	'home.doors.heading': 'Aiza no handeha',
	'home.find.heading': 'Na soraty ny fanondroana',
	'nav.library': 'Tranomboky',
	'nav.learn': 'Mianara',
	'library.landing.tagline':
		'Ny fitambarany manontolo, isaky ny talantalana — miaraka amin’izay nijanonanao sy izay nomarihinao.',
	'schola.landing.title': 'Aiza no hanombohana',
	'schola.landing.tagline':
		'Torolàlana fohy momba izay eto: inona avy ireo boky ireo, ahoana no anoratana ny fanondroana azy, ahoana no ahitana andalana, ary filaharam-pamakiana natolotry ny Fiangonana.',
	'schola.start.heading': 'Raha vaovao aminao izany rehetra izany',
	'schola.start.body': 'Ny fiandohana tsara indrindra dia ny ',
	'schola.start.bodyAfter':
		': izany fampianarana izany ihany ao amin’ny Katesizy, fohy kokoa lavitra, voasoratra amin’ny fanontaniana sy valiny. Ampahafolon’ny halavany eo ho eo izy, ary tsy mihevitra mialoha na inona na inona.',
	'schola.bible.heading': 'Raha tsy namaky Baiboly mihitsy ianao',
	'schola.bible.library':
		'Tsy boky iray izy fa telo amby fitopolo, nosoratana nandritra ny arivo taona mahery ary nafatotra araka ny filaharana nifikiran’ny Fiangonana — tsy ny filaharan’ny zava-nitranga, ary tsy ny mora vakiana indrindra. Ny ankamaroan’ny olona manomboka amin’ny pejy voalohany ka mijanona herinandro vitsivitsy any aoriana, ao anaty toko lava iray misy lalàna fahiny, satria mbola tsy nisy nilaza taminy hoe ho an’ny inona izany.',
	'schola.bible.step.gospel': 'Manombohana amin’ny Evanjely',
	'schola.bible.start':
		'Iray amin’ireo boky fohy efatra momba ny fiainan’i Jesoa, lalina any anatiny fa tsy eo aloha. Tsy hevitray izany: nangataka ny Konsily iray ny Fiangonana mba hampianarina ny fampiasana marina ny Soratra Masina, „indrindra ny Testamenta Vaovao ary ambonin’ny zava-drehetra ny Evanjely“. Tsy nanonona iray manokana izy, ary tsy hanonona koa izahay.',
	'schola.bible.whichGospel':
		'Telo no matetika atolotra, noho ny antony telo samy hafa. Na iza na iza amin’izy ireo dia toerana tsara hisy anao.',
	'schola.bible.gospel.mark':
		'Ny fohy indrindra. Azonao vakiana manontolo ao anatin’ny tolakandro iray izy, ary ny nahavita iray dia sarobidy kokoa amin’ny fiandohana noho ny nifidy ny tsara indrindra.',
	'schola.bible.gospel.luke':
		'Nosoratana ho an’ny olona ivelan’ny finoana izay naniry ny tantara voarakitra araka ny filaharany — izay mety ho ianao mihitsy. Mitohy mivantana amin’ny Asan’ny Apostoly izy, ka ny marina dia antsasany voalohan’ny boky lavalava kokoa.',
	'schola.bible.gospel.john':
		'Ilay milaza mazava tsara ny antony nanoratana azy: „mba hinoanareo“. Teny tsotra, ary mankany amin’ny fanontaniana hoe iza moa i Jesoa mivantana.',
	'schola.bible.step.acts': 'Avy eo izay nitranga taorian’izay',
	'schola.bible.thenActs':
		'Rehefa vitanao ny iray, dia vakio izay nataon’ireo nahalala Azy taorian’ny nandehanany.',
	'schola.bible.acts.why':
		'Ny telopolo taona taorian’ny fiafaran’ny Evanjely: olona am-polony vitsivitsy natahotra, sy ny fomba nahatongavan’izay hitany tany amin’ny farany ilan’ny fanjakana.',
	'schola.bible.step.old': 'Avy eo ny antsasany taloha kokoa',
	'schola.bible.thenOld':
		'Tsy avy amin’ny pejy voalohany, ary tsy izy manontolo. Toerana vitsivitsy no mitondra ny tantara, ary izy ireo mihitsy no tsy tapaka asian’ny Evanjely fanondroana miverina.',
	'schola.bible.ot.beginnings': 'Ny fomba niandohany, sy ny fomba nahasimba azy.',
	'schola.bible.ot.promise':
		'Fianakaviana iray, sy fampanantenana natao taminy izay mahavelona mihoatra noho ny olona rehetra ao anatiny.',
	'schola.bible.ot.exodus':
		'Vahoaka nentina nivoaka ny fanandevozana, sy lalàna nomena azy ho fiainany.',
	'schola.bible.ot.psalms':
		'Tsy tantara: vavaka sy hira dimam-polo amby zato. Vakio tsirairay, na amin’ny filaharana inona na inona. Mbola vakin’ny Fiangonana isan’andro izy ireo.',
	'schola.bible.bothWays':
		'Hahafantatra zavatra ianao, ary izany no tanjona fa tsy kisendrasendra. Ny Fiangonana mamaky ny boky taloha amin’ny fahazavan’i Kristy ary ny vaovao kokoa amin’ny fahazavan’izay teo aloha — samy manazava ny hafa ny antsasany tsirairay, ka izany no tsy amakiana na dia iray aza irery.',
	'schola.guide.heading': 'Ny fomba hitadiavana lalana',
	'schola.guide.lede':
		'Ny lahatsoratra no pejy manontolo; izay rehetra sisa dia fitaovana azonao hodian-tsy hita mandra-pilanao azy.',
	'schola.guide.top.heading': 'Ny tsipika eo an-tampon’ny pejy tsirairay',
	'schola.guide.reading.heading': 'Ny tsipika eo ambonin’ny lahatsoratra',
	'schola.feature.search':
		'Soraty ao amin’ny boaty ambony ny fanondroana — toko sy andininy, laharan’andalana, anaran’antontan-taratasy — dia tanterahiny izany rehefa manoratra ianao. Tsindrio ny / na Ctrl+K avy aiza avy aiza, ary ny ? ho an’ny hafa.',
	'schola.feature.languages':
		'Misaraka ny fifidianana ny endrika sy ny lahatsoratra, ka azonao vakiana amin’ny fiteny iray ny asa soratra nefa mijanona amin’ny hafa ny bokotra. Rehefa manana famoahana maromaro amin’ny fiteninao ny asa soratra, dia misafidy eo amin’izy ireo koa ianao.',
	'schola.feature.settings':
		'Haben’ny soratra, mazava na maizina, sepia, ary ny habetsahan’ny fanamarihana tianao eo anilan’ny lahatsoratra.',
	'schola.feature.offline':
		'Ampio amin’ny efijerinao voalohany ity tranonkala ity dia hisokatra toy ny rindrankajy. Azonao alaina manontolo ny asa soratra mba hovakiana na tsy misy fifandraisana aza.',
	'schola.feature.contents':
		'Ny fizaran’ny asa soratra misy anao — boky, fizarana, toko — mba hifindranao ao anatiny nefa tsy miverina any am-piandohana.',
	'schola.feature.compare':
		'Famoahana roa amin’ny andalana iray ihany, mifanila — ny latina eo anilan’ny fiteninao, na ny fandikan-teny iray eo anilan’ny hafa.',
	'schola.feature.apparatus':
		'Ny fanamarihan’ny famoahana sy izay fanazavana rehetra nosoratana momba ny lahatsoratra dia atolotra eo anilany fa tsy eo ambaniny. Rohy ny teny nalaina ao anatin’ny lahatsoratra, ka mankany amin’izay tondroiny ny fanondroana.',
	'schola.feature.focus':
		'Manesotra ny zavatra rehetra afa-tsy ny lahatsoratra. Mijanona eo amin’ny toerana nisy ny tsipika ny fivoahana, mba tsy hisy voafandrika ao ambadika.',
	'schola.books.heading': 'Izay eto, sy ny fomba anondroana azy',
	'schola.books.lede':
		'Samy karazana boky hafa avy ireo, ary samy tondroina amin’ny laharana manokana. Ny ohatra dia mampiseho ny endriny: soraty ao amin’ny boaty fikarohana ny toy izany dia ho tonga eo amin’ilay andalana ianao.',
	'schola.cite.label': 'Tondroina hoe',
	'schola.what.scripture':
		'Ny Soratra Masina araka ny andraisan’ny Fiangonana azy, amin’ny Testamenta roa. Ny zavatra rehetra hafa eto dia vakiana amin’ny fahazavany.',
	'schola.cite.scripture':
		'boky, toko ary andininy, amin’ny fanafohezana vitan’ny famoahana anananao',
	'schola.what.catechism':
		'Famintinana izay inoan’ny Fiangonana Katôlika, ao anaty boky iray. Tsy loharano izy: manangona ny Soratra Masina, ny Aba, ny litorjia sy ny fampianaran’ny Fiangonana, ary milaza ny andalana tsirairay hoe avy aiza izay lazainy.',
	'schola.cite.catechism':
		'araka ny laharan’andalana, mitohy tsy tapaka hatramin’ny pejy voalohany ka hatramin’ny farany',
	'schola.what.compendium':
		'Izany fampianarana izany ihany amin’ny fanontaniana sy valiny, amin’ny ampahafolon’ny halavany eo ho eo.',
	'schola.cite.compendium': 'araka ny laharam-panontaniana',
	'schola.what.magisterium':
		'Izay nosoratan’ny papa sy ny konsily marina tokoa — taratasy ansiklika, konstitosiona, dekre, fanambarana — samy natao ho amin’ny fotoana iray sy fanontaniana iray voafaritra. Samy fantatra amin’ny teny latina voalohany ao aminy izy ireo.',
	'schola.cite.magisterium':
		'araka ny anaran’ny antontan-taratasy, avy eo ny laharan’ny fizarana ao anatiny',
	'schola.what.social':
		'Ny fampianaran’ny Fiangonana momba ny asa, ny fananana, ny fianakaviana, ny politika sy ny fandriampahalemana, nangonina avy amin’ireo antontan-taratasy ho boky iray.',
	'schola.cite.social':
		'araka ny laharan’andalana, ambanin’ny fanafohezana ampiasain’ny asa soratra ho azy',
	'schola.what.law': 'Lalàna fa tsy fampianarana. Milaza izay takin’ny Fiangonana izy, ary ovaina.',
	'schola.cite.law': 'araka ny kanôna, izay anaran’ny fizarany misy laharana',
	'schola.what.doctors':
		'Ireo teôlôjiana nantsoin’ny Fiangonana hoe Mpampianatra. Tsy mitondra fahefana ofisialy izany, na dia lehibe toy inona aza ny mpanoratra.',
	'schola.cite.doctors': 'araka ny fizarana, avy eo ny fanontaniana — ny fizaran’ny Somà ihany',
	'schola.what.prayers': 'Ny teny ivavahan’ny Fiangonana, miaraka amin’ny latina eo anilany.',
	'schola.cite.prayers': 'araka ny anarana; tsy misy laharana hotondroina',
	'schola.places.heading': 'Tsy lahatsoratra, fa toerana amin’ity tranonkala ity',
	'schola.what.library':
		'Ny asa soratra rehetra eto amin’ny lisitra iray, voasokajy araka ny lohahevitra fa tsy araka ny karazana.',
	'schola.what.calendar':
		'Ny andro litorjika — vanim-potoana, loko, ary izay ankalazaina — ho an’ny firenena arahinao ny tetiandrony.',
	'schola.what.bookmarks':
		'Ny andalana nomarihinao, sy ny toerana nijanonanao farany tamin’ny asa soratra tsirairay. Samy mijanona ao amin’ity navigateur ity izy ireo ary tsy alefa na aiza na aiza.',
	'jumpbox.placeholder': 'Mankanesa any… (ohatra: joany 3:16, ccc 1234)',
	'jumpbox.short': 'Karohy',
	'jumpbox.hint': 'Tsindrio / na Ctrl+K hankany amin’ny fanondroana',
	'jumpbox.noMatch': 'Tsy misy mifanaraka',
	'jumpbox.suggestions': 'Soso-kevitra',
	'settings.label': 'Fandrindrana',
	'darkMode.label': 'Endrika maizina',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Mandeha',
	'darkMode.off': 'Mijanona',
	'loadFailed.title': 'Tsy tafiditra izany',
	'loadFailed.hint':
		'Misy ilay pejy — nisy tsy nety teo am-pakana azy. Matetika dia mety ny manandrana indray.',
	'loadFailed.retry': 'Andramo indray',
	'loadFailed.retrying': 'Manandrana…',
	'fontSize.label': 'Haben’ny soratra',
	'fontSize.larger': 'Soratra lehibe kokoa',
	'fontSize.smaller': 'Soratra kely kokoa',
	'print.label': 'Atontay ity pejy ity',
	'toTop.label': 'Miverina any ambony',
	'edition.label': 'Famoahana',
	'edition.select': 'Safidio ny famoahana',
	'edition.current': 'Famoahana ampiasaina',
	'edition.filter': 'Hitady famoahana',
	'menu.noMatches': 'Tsy misy mifanaraka',
	'unitNav.previous': 'Teo aloha',
	'unitNav.next': 'Manaraka',
	'bible.prevChapter': 'Toko teo aloha',
	'bible.nextChapter': 'Toko manaraka',
	'bible.pickBook': 'Boky sy toko',
	'bible.landing.title': 'Ny Baiboly',
	'bible.landing.tagline': 'Vakio manontolo ny Baiboly, boky isaky ny boky, toko isaky ny toko.',
	'bible.landing.books': 'Boky',
	'bible.introduction': 'Teny mialoha',
	// All nine, because `bible-groups.test.ts` requires the set to be complete
	// in every interface language rather than partial: one English heading
	// among eight Malagasy ones reads as a bug, not as a fallback.
	'bible.group.pentateuch': 'Ny Pentateoka',
	'bible.group.historical': 'Boky Ara-tantara',
	'bible.group.wisdom': 'Boky Fahendrena',
	'bible.group.prophetic': 'Bokin’ny Mpaminany',
	'bible.group.gospels': 'Evanjely',
	'bible.group.acts': 'Asan’ny Apôstôly',
	'bible.group.pauline': 'Taratasin’i Md Paoly',
	'bible.group.catholicLetters': 'Taratasy Katôlika',
	'bible.group.revelation': 'Apôkalipsy',
	'ccc.abbrev': 'CCC',
	'ccc.landing.title': 'Katesizin’ny Fiangonana Katôlika',
	'ccc.landing.pairTitle': 'Katesizy sy Famintinana',
	'ccc.landing.tagline':
		'<strong>Ny Katesizy</strong> dia mametra ny fampianarana katôlika amin’ny andalana misy laharana 2.865. <strong>Ny Famintinana</strong> dia mamerina izany fampianarana izany amin’ny fanontaniana sy valiny 598, araka izany filaharana izany ihany.',
	'ccc.landing.pairTagline':
		'Ny Katesizin’ny Fiangonana Katôlika amin’ny andalana 2.865, ary ny Famintinana azy amin’ny fanontaniana 598.',
	'compendium.landing.title': 'Famintinana ny Katesizy',
	'compendium.landing.tagline':
		'Fanontaniana sy valiny mamintina ny Katesizin’ny Fiangonana Katôlika.',
	'compendium.question': 'Fanontaniana',
	'compendium.answer': 'Valiny',
	'compendium.tableOfContents': 'Votoatiny',
	'compendium.prevQuestion': 'Fanontaniana teo aloha',
	'compendium.nextQuestion': 'Fanontaniana manaraka',
	'compendium.condenses': 'Mamintina CCC ¶¶',
	'compendium.abbrev': 'Famint.',
	'compendium.noQuestionNumber': 'Tsy misy laharana fanontaniana amin’ity vondron-dahatsoratra ity',
	'prayers.landing.title': 'Vavaka Fahazarana',
	'prayers.landing.tagline': 'Vavaka miaraka amin’ny soratra latina eo anilany.',
	'prayers.gloss.versicle':
		'Ny andalana tononin’ny mpitarika ny vavaka na hirainy irery; valian’ny mpivavaka amin’ny valiny manaraka izany.',
	'prayers.gloss.response':
		'Ny andalana tononin’ny mpivavaka rehetra miaraka na hirainy, ho valin’ny andalan’ny mpitarika teo aloha.',
	'prayers.seeAlso': 'Jereo koa',
	'anchor.actions': 'Asa amin’ny fanondroana',
	'anchor.copy': 'Adikao ny lahatsoratra',
	'anchor.copyLink': 'Adikao ny rohy',
	'anchor.view': 'Jereo',
	'anchor.copied': 'Voadika',
	'anchor.copyFailed': 'Tsy afaka nadika',
	'document.library.tagline':
		'Ensiklika, lalàm-panorenan’ny Konsily, didy ary fanambaran’ny Fampianaran’ny Fiangonana.',
	'doctores.landing.title': 'Mpampianatra ny Fiangonana',
	'doctores.landing.tagline':
		'Ny asa ara-teôlôjian’ny Aban’ny Fiangonana sy ny Mpampianatra ny Fiangonana.',
	'summa.landing.title': 'Somà Teôlôjika',
	'summa.landing.tagline': 'Md Tomà Akinasy, amin’ny teny anglisy sy amin’ny latina nanoratany.',
	'index.division': 'Fizarana',
	'bookmark.add': 'Marihina',
	'bookmark.remove': 'Esory ny marika',
	'bookmark.library': 'Fanamarihana',
	'bookmark.library.tagline': 'Izay rehetra nomarihinao teo am-pamakiana.',
	'bookmark.empty': 'Mbola tsy misy nomarihina.',
	'bookmark.emptyHint':
		'Tsindrio ny laharan’ny andininy na ny andalana ka safidio ny “Marihina”, na ampiasao ny bokotra fanamarihana eo amin’ny pejy.',
	'bookmark.deviceOnly':
		'Ny fanamarihana dia mitoetra ao amin’ity navigateur ity ihany. Tsy alefa na aiza na aiza izy ireo, ary ny famafana ny angon-drakitry ny navigateur dia mamafa azy.',
	'bookmark.unavailable': 'Tsy ao amin’ny famoahana vakianao',
	'colophon.title': 'Kôlôfôna',
	'colophon.lede':
		'Ny amin’ity tranonkala ity, ny niavian’ny soratra ao aminy, ary ny toerana ijoroanay amin’ny famerenana azy ireo.',
	'colophon.whatThisIs': 'Inona ity',
	'colophon.whatThisIsBody':
		"Ny Glossa Catholica dia tranonkala famakiana ny Soratra Masina, ny Katesizin'ny Fiangonana Katôlika, ny Famintinana ary ireo antontan-taratasin'ny Fampianarana Ofisialy, amin'ny teny anglisy, portogey ary latina. Misy izy mba hovakiana, ary tsy misy zavatra hafa angatahina aminao mba hamakiana azy:",
	'colophon.pointFree':
		'Maimaim-poana, ary maimaim-poana mandrakariva. Tsy misy rindrina fandoavam-bola, tsy misy famandrihana andoavam-bola, tsy misy zavatra amidy.',
	'colophon.pointNoAds':
		'Tsy misy dokam-barotra, ary tsy misy fametrahana voatohana vola na inona na inona.',
	'colophon.pointNoAccounts': 'Tsy misy kaonty. Tsy misy hisoratana anarana, tsy misy hidirana.',
	'colophon.pointNoTracking':
		"Tsy misy script fanaraha-dia, tsy misy kaody avy amin'ny hafa, tsy misy cookie. Isa tsy manonona anarana momba ny fampiasana ihany, ka tsy misy manondro anao.",
	'colophon.pointOffline':
		"Namboarina mba hanohy hiasa na dia tsy misy fifandraisana aza rehefa avy nitsidika ianao, mba tsy ho sakana amin'ny famakiana ny fifandraisana malemy.",
	'colophon.whatThisIsStanding':
		"Ny Glossa Catholica dia hetsika manokana ataon'ny kristianina laika. Tsy manana fankatoavana ara-piangonana izy ary tsy miteny amin'ny fahefany manokana.",
	'footer.notEndorsed': "Tsy nankatoavin'ny Fiketrahana Masina",
	'colophon.textsTitle': 'Ireo lahatsoratra',
	'colophon.textsBody':
		"Ny lahatsoratra tsirairay dia avy amin'ny loharano voatonona anarana, ary ny asa soratra tsirairay dia mirakitra ny fanontany, ny pejy niaviany ary ny daty nakana azy. Ny Soratra Masina dia mampiasa fandikan-teny efa an'ny besinimaro; ny Katesizy, ny Famintinana ary ireo antontan-taratasin'ny Fampianarana Ofisialy dia avy amin'ny lahatsoratra navoakan'ny Fiketrahana Masina ihany.",
	'colophon.textsFidelity':
		"Tsy fohezina mihitsy ny lahatsoratra, tsy averina lazaina amin'ny teny hafa mihitsy, tsy soratana indray mihitsy, ary tsy apetraka eo akaikin'ny dokam-barotra mihitsy. Amboarinay kosa ny kilema miharihary — teny latsaka, teny nalaina simba, marika nitelina andalana — mankany amin'izay atontan'ny loharano ihany foana, fa tsy mankany amin'izay heverinay tokony holazainy.",
	'colophon.countBible': 'fanontana Baiboly',
	'colophon.countDocuments': "antontan-taratasin'ny Fampianarana Ofisialy",
	'colophon.copyrightTitle': "Zon'ny mpamorona",
	'colophon.copyrightBody1':
		"Ny Katesizy, ny Famintinana ary ireo antontan-taratasin'ny Fampianarana Ofisialy dia fananan'ireo tompon'ny zo aminy — indrindra ny Libreria Editrice Vaticana sy ny Dikasteria momba ny Fifandraisana.",
	'colophon.copyrightBody2':
		"Ny asa soratra tsirairay dia mampiseho ny fanambaran'ny tompon'ny zo momba ny zon'ny mpamorona, araka ny teniny ihany, ary mampifandray amin'ny pejy nangalana azy.",
	'colophon.copyrightBody3':
		"Raha manana zo amin'ny lahatsoratra rehetra eto ianao ka aleonao tsy havoaka izany, dia soratanao aminay.",
	'colophon.contactTitle': 'Fifandraisana',
	'colophon.contactBody': "Ho an'ny zavatra rehetra, anisan'izany ireo voalaza etsy ambony:",
	'colophon.contactPending':
		'Mbola tsy voapetraka ny adiresy fifandraisana. Tsy tokony hampahafantarina ampahibemaso ity tranonkala ity raha tsy efa manana izany — tsy misy dikany ny fanoloran-tena etsy ambony raha tsy misy fomba hahatratrarana anay.',
	'colophon.illustrationsTitle': 'Ireo sary',
	'colophon.illustrationsBody':
		"Mitondra ny sary sokitr'i Gustave Doré ny Baiboly, ka ny tsirairay dia apetraka eo amin'ny andininy asehony — ny farany sy ny lehibe indrindra amin'ireo andiany momba ny Baiboly nataony, nosokirina tamin'ny hazo avy amin'ny sariny ary natonta niaraka tamin'ny lahatsoratra fa tsy nangonina tany aoriana.",
	'colophon.illustrationsRights':
		"An'ny besinimaro izy ireo, araka ny asehon'ireo daty etsy ambany, ary ny sary nalaina marina tamin'ny sary sokitra an'ny besinimaro dia tsy mitondra zon'ny mpamorona vaovao manokana.",
	'colophon.countPlates': 'sary sokitra',
	'colophon.countPlateChapters': 'toko misy sary',
	'art.about': 'Momba ity sary ity',
	'art.detail': 'ampahany',
	'colophon.typeTitle': 'Ny endri-tsoratra',
	'colophon.typeBody':
		"Natonta tamin'ny EB Garamond, famelomana indray nataon'i Georg Duffner sy Octavio Pardo ireo endri-tsoratra nosokirin'i Claude Garamont tamin'ny taona 1590 — ilay fomban-drazana maha-olona izay anontan'ny Fiangonana hatramin'ny Renaissance. Ny sorany sirilika dia avy amin'ny tanana mitovy nefa tsy mamelona na inona na inona: tsy nisy Garamond sirilika nosokirina mihitsy, ka natonta tamin'ny endrika nosarina mba hipetraka eo akaikin'ny sisa ny teny rosiana.",
	'colophon.typeArabic':
		"Ny teny arabo dia lavitra tanteraka izany, ka natonta tamin'ny Amiri — famelomana indray nataon'i Khaled Hosny ilay naskh nosokirina ho an'ny fanontam-pirinty Bulaq tao Kairo tamin'ny 1905, nofidina noho ny antony mitovy amin'ny endri-tsoratry ny lahatsoratra: endri-tsoratra ara-tantara manokana fa tsy sary vaovao ankehitriny.",
	'colophon.typeInitials':
		"Ireo litera fanombohana dia Pirata One, endri-tsoratra gôtika izay mbola vakiana tsara ny litera lehibeny amin'ny habe ilain'ny litera voalohany, ary — ho an'ny teny rosiana — Ponomar, izay mamerina ny endri-tsoratra slavôna am-piangonana an'ny Fanontam-pirinty Sinôdaly. Ny Ponomar dia manonta ny litera voalohany fa tsy ny lahatsoratra mihitsy: ny ansiklika maoderina natonta manontolo tamin'ny endri-tsoratra sinôdaly dia hilaza zavatra tsy marina momba izay maha-izy azy. Samy nomena alalana amin'ny SIL Open Font License izy rehetra ary avy amin'ity tranonkala ity no anomezana azy fa tsy avy amin'ny hafa, ka ny famakiana pejy dia tsy mangataka na inona na inona amin'ny mpizara an'olon-kafa.",
	'copyright.sourceTitle': 'Sokafy ny pejy loharano tany am-boalohany',
	'copyright.sourceLabel': 'Loharano',
	'lang.label': 'Fiteny',
	'lang.filter': 'Hitady fiteny',
	'lang.more': 'fiteny hafa',
	'calendar.title': 'Tetiandro litorzika',
	'calendar.tagline':
		'Ny Tetiandro Romana Ankapobeny, kajiana ho amin’ny andro rehetra — ny fotoanany, ny laharany, ny lokony.',
	'calendar.date': 'Daty',
	'calendar.calendar': 'Tetiandro',
	'calendar.which.general': 'Tetiandro Romana Ankapobeny',
	'calendar.filter': 'Hitady firenena',
	'calendar.region.europe': 'Eoropa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Afovoany Atsinanana',
	'calendar.region.asia': 'Azia',
	'calendar.region.oceania': 'Oseania',
	'calendar.today': 'Androany',
	'calendar.previousMonth': 'Volana teo aloha',
	'calendar.nextMonth': 'Volana manaraka',
	'calendar.noSuchDay': 'Tsy misy andro litorzika voakajy ho amin’io daty io.',
	'calendar.week': 'herinandro',
	'calendar.alsoToday': 'Ankalazaina koa androany',
	'calendar.alsoObserved': 'Tsaroana koa androany',
	'calendar.obligation': 'Fety voadidy',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Tsingerin’ny alahady',
	'calendar.weekdayCycle': 'Tsingerin’ny andro tsotra',
	'calendar.psalterWeek': 'Herinandron’ny salamo',
	'calendar.transferredFrom': 'Nafindra avy tamin’ny',
	'calendar.season.advent': 'Fiaviana',
	'calendar.season.christmas': 'Fotoanan’ny Noely',
	'calendar.season.lent': 'Karemy',
	'calendar.season.triduum': 'Telo Andro Masin’ny Paka',
	'calendar.season.easter': 'Fotoanan’ny Paka',
	'calendar.season.ordinary': 'Fotoana Tsotra',
	'calendar.colour.white': 'Fotsy',
	'calendar.colour.red': 'Mena',
	'calendar.colour.green': 'Maitso',
	'calendar.colour.violet': 'Volomparasy',
	'calendar.colour.rose': 'Mavokely',
	'calendar.colour.black': 'Mainty',
	'calendar.colour.blue': 'Manga',
	'calendar.rank.solemnity': 'Fety lehibe',
	'calendar.rank.feast': 'Fety',
	'calendar.rank.memorial': 'Fahatsiarovana',
	'calendar.rank.optional-memorial': 'Fahatsiarovana an-tsitrapo',
	'calendar.rank.commemoration': 'Fampahatsiarovana',
	'calendar.rank.sunday': 'Alahady',
	'calendar.rank.weekday': 'Andro tsotra',
	'calendar.gloss.season.advent':
		'Ny herinandro efatra alohan’ny Noely: fiomanana amin’ny fahatongavan’ny Tompo sy fiandohan’ny taonan’ny Fiangonana.',
	'calendar.gloss.season.christmas':
		'Manomboka amin’ny Noely ka hatramin’ny Batemin’ny Tompo, ankalazana ny nahaterahan’ny Tompo sy ny nisehoany tamin’izao tontolo izao.',
	'calendar.gloss.season.lent':
		'Ny efapolo andro manomboka amin’ny Alarobian’ny Lavenona ka hatramin’ny Lamesan’ny hariva amin’ny Fanasan’ny Tompo: fivalozana, fiantrana ary fiomanana ho amin’ny Paska.',
	'calendar.gloss.season.triduum':
		'Ny telo andro manomboka amin’ny harivan’ny Alakamisy Masina ka hatramin’ny harivan’ny Alahadin’ny Paska — ny fijalian’ny Tompo, ny fahafatesany sy ny fitsanganany, tampon’ny taona manontolo.',
	'calendar.gloss.season.easter':
		'Ny dimampolo andro manomboka amin’ny Paska ka hatramin’ny Pantekôty, ankalazaina toy ny fety tokana — „Alahady lehibe iray“.',
	'calendar.gloss.season.ordinary':
		'Ny herinandro telopolo sy telo na telopolo sy efatra ivelan’ny fotoana hafa. Tsy „tsotra“ fa milamina: isaina ny herinandro, ary vakin’ny Fiangonana misesy ny fiainana sy ny fampianaran’ny Tompo. Tonga amin’ny fizarana roa izy — aorian’ny fotoan’ny Noely ka hatramin’ny Karemy, ary aorian’ny Pantekôty ka hatramin’ny Fiaviana.',
	'calendar.gloss.rank.solemnity':
		'Ny ambaratonga ambony indrindra: ny Paska, ny Noely, ny Niakarana, ny mpiaro ny toerana iray. Ankalazaina miaraka amin’ny Voninahitra sy ny Fanekem-pinoana, ary manomboka ny harivan’ny andro alohany.',
	'calendar.gloss.rank.feast':
		'Ankalazaina ao anatin’ny andro ihany. Ny apôstôly sy ny evanjelista, ary ny andro lehibe kokoa an’ny Tompo sy ny Masina Maria.',
	'calendar.gloss.rank.memorial':
		'Olomasina tsarovana amin’ny androny, ao anatin’ny Lamesa sy ny Litorjian’ny Ora amin’io fotoana io. Voatery any amin’izay ankalazana azy.',
	'calendar.gloss.rank.optional-memorial':
		'Azo ankalazaina na tsia, arakaraka ny safidin’ny pretra na ny fiangonana. Raha tsy ankalazaina, dia andro tsotra fotsiny ilay andro.',
	'calendar.gloss.rank.commemoration':
		'Izay ivadihan’ny fahatsiarovana mandritra ny Karemy: vavaka ampiana amin’ny Lamesan’ny andro tsotra, izay tazomin’ny fotoana manontolo raha tsy izany.',
	'calendar.gloss.rank.sunday':
		'Ny fety voalohany — ny Andron’ny Tompo, ankalazaina isan-kerinandro hatramin’ny fitsanganana tamin’ny maty. Ny fety lehibe na ny fetin’ny Tompo ihany no afaka manesotra azy, ary amin’ny Fiaviana, ny Karemy sy ny fotoam-Paska dia na dia ireo aza tsia.',
	'calendar.gloss.rank.weekday':
		'Andro tsy manana fankalazana manokana. Ny Lamesa sy ny Litorjian’ny Ora dia an’ilay fotoana — ka izany no mahatonga ilay fotoana ho zavatra tokony ho fantatra.',
	'calendar.gloss.colour.white':
		'Fifaliana. Ny fotoam-Paska sy ny fotoan’ny Noely, ny andron’ny Tompo ivelan’ny fijaliany, ny Masina Maria, ny anjely, ary ny olomasina izay tsy maritiora.',
	'calendar.gloss.colour.red':
		'Ra sy afo. Ny Alahadin’ny Sampankazo sy ny Zoma Masina, ny Pantekôty, ny apôstôly sy ny evanjelista, ary ny maritiora.',
	'calendar.gloss.colour.green': 'Ny Fotoana Tsotra: ny lokon’ny fanantenana sy ny zavatra maniry.',
	'calendar.gloss.colour.violet':
		'Ny Fiaviana sy ny Karemy, ary anaovana koa amin’ny Lamesa ho an’ny maty.',
	'calendar.gloss.colour.rose':
		'Anaovana indroa isan-taona — amin’ny Alahady Gaudete, fahatelon’ny Fiaviana, sy amin’ny Alahady Laetare, fahefatry ny Karemy — izay ihamaivanan’ny fifadian-kanina ka hita ny fiafarany.',
	'calendar.gloss.colour.black': 'Azo anaovana amin’ny Lamesa ho an’ny maty.',
	'calendar.gloss.colour.blue':
		'Ny tombontsoan’ny manga: anaovana amin’ny Fitorontoronana tsy voaloto tany Espaina, any Filipina ary any amin’ireo toerana vitsy hafa nomen’ny Fiketrahana Masina izany.',
	'calendar.gloss.sundayCycle':
		'Ny vakiteny amin’ny Alahady dia mandeha mandritra ny telo taona — A, B ary C — mamaky tsirairay an’i Matio, Marka ary Lioka, miaraka amin’i Joany mandritra ny Karemy sy ny fotoam-Paska. Miova ny tsingerina amin’ny Alahady voalohan’ny Fiaviana, miaraka amin’ny taonan’ny Fiangonana.',
	'calendar.gloss.weekdayCycle':
		'Ny vakiteny amin’ny andro tsotra dia mandeha mandritra ny roa taona, I sy II: miova ny vakiteny voalohany, fa ny Evanjely tsia. Ny taona litorjika dia antsoina araka ny taona sivily iafarany — ny taona tsy ankasa dia I, ny ankasa dia II.',
	'calendar.gloss.psalterWeek':
		'Mizara ny salamo amin’ny herinandro efatra ny Litorjian’ny Ora, I ka hatramin’ny IV, izay miverimberina mandritra ny taona. Ity no herinandro izay salamo androany, ho an’izay rehetra mivavaka ny Ora.',
	'calendar.gloss.obligation':
		'Andro izay tsy maintsy andraisan’ny mpino anjara amin’ny Lamesa sy ifadiany ny asa izay hisakana izany. Ny Alahady rehetra, sy ireo andro hafa notapahin’ny kaonferansan’ny eveka tsirairay.',
	'calendar.primer.title': 'Vao tonga eto?',
	'calendar.primer.lead':
		'Manana taona manokana ny Fiangonana. Manomboka amin’ny Fiaviana izy, mihodina manodidina ny Paska, ary manome anarana, ambaratonga sy loko ho an’ny andro tsirairay — ary ireo no mamaritra izay ivavahana sy vakiana amin’io andro io amin’ny Lamesa sy ny Litorjian’ny Ora. Koa ny „Alahady fahatelo amby roapolo mandavantaona“ dia adiresy: milaza amin’ny pretra, amin’ny antoko mpihira, na amin’izay mivavaka an-trano, izay vavaka sy vakiteny an’ny androany.',
	'calendar.primer.seasons': 'Ny fotoana',
	'calendar.primer.ranks': 'Izay mety ho andro iray',
	'calendar.primer.colours': 'Ny loko',
	'calendar.primer.cycles': 'Ny tsingerina',
	'calendar.primer.cyclesLead':
		'Mpanisa telo izay milaza miaraka izay vakiteny sy salamo voatendry ho androany.'
};
