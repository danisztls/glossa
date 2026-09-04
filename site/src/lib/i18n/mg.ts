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
	'home.continueReading': 'Manohy mamaky',
	'home.works': 'Tranomboky',
	'home.ccc.heading': 'Katesizy sy Famintinana',
	'home.magisterium.mostRecent': 'Farany',
	'home.prayers.heading': 'Vavaka',
	'home.prayers.browseAll': 'Jereo ny vavaka rehetra',
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
	'fontSize.label': 'Haben’ny soratra',
	'fontSize.larger': 'Soratra lehibe kokoa',
	'fontSize.smaller': 'Soratra kely kokoa',
	'print.label': 'Atontay ity pejy ity',
	'toTop.label': 'Miverina any ambony',
	'edition.label': 'Famoahana',
	'edition.select': 'Safidio ny famoahana',
	'edition.current': 'Famoahana ampiasaina',
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
	'ccc.landing.tagline':
		'<strong>Ny Katesizy</strong> dia mametra ny fampianarana katôlika amin’ny andalana misy laharana 2.865. <strong>Ny Famintinana</strong> dia mamerina izany fampianarana izany amin’ny fanontaniana sy valiny 598, araka izany filaharana izany ihany.',
	'compendium.abbrev': 'Famint.',
	'prayers.landing.title': 'Vavaka Fahazarana',
	'prayers.landing.tagline': 'Vavaka miaraka amin’ny soratra latina eo anilany.',
	'document.library.tagline':
		'Ensiklika, lalàm-panorenan’ny Konsily, didy ary fanambaran’ny Fampianaran’ny Fiangonana.',
	'doctores.landing.title': 'Mpampianatra ny Fiangonana',
	'doctores.landing.tagline':
		'Ny asa ara-teôlôjian’ny Aban’ny Fiangonana sy ny Mpampianatra ny Fiangonana.',
	'summa.landing.title': 'Somà Teôlôjika',
	'summa.landing.tagline': 'Md Tomà Akinasy, amin’ny teny anglisy sy amin’ny latina nanoratany.',
	'bookmark.add': 'Marihina',
	'bookmark.remove': 'Esory ny marika',
	'bookmark.library': 'Fanamarihana',
	'bookmark.library.tagline': 'Izay rehetra nomarihinao teo am-pamakiana.',
	'bookmark.empty': 'Mbola tsy misy nomarihina.',
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
	'colophon.typeTitle': 'Ny endri-tsoratra',
	'colophon.typeBody':
		"Natonta tamin'ny EB Garamond, famelomana indray nataon'i Georg Duffner sy Octavio Pardo ireo endri-tsoratra nosokirin'i Claude Garamont tamin'ny taona 1590 — ilay fomban-drazana maha-olona izay anontan'ny Fiangonana hatramin'ny Renaissance. Ny sorany sirilika dia avy amin'ny tanana mitovy nefa tsy mamelona na inona na inona: tsy nisy Garamond sirilika nosokirina mihitsy, ka natonta tamin'ny endrika nosarina mba hipetraka eo akaikin'ny sisa ny teny rosiana.",
	'colophon.typeArabic':
		"Ny teny arabo dia lavitra tanteraka izany, ka natonta tamin'ny Amiri — famelomana indray nataon'i Khaled Hosny ilay naskh nosokirina ho an'ny fanontam-pirinty Bulaq tao Kairo tamin'ny 1905, nofidina noho ny antony mitovy amin'ny endri-tsoratry ny lahatsoratra: endri-tsoratra ara-tantara manokana fa tsy sary vaovao ankehitriny.",
	'colophon.typeInitials':
		"Ireo litera fanombohana dia Pirata One, endri-tsoratra gôtika izay mbola vakiana tsara ny litera lehibeny amin'ny habe ilain'ny litera voalohany, ary — ho an'ny teny rosiana — Ponomar, izay mamerina ny endri-tsoratra slavôna am-piangonana an'ny Fanontam-pirinty Sinôdaly. Ny Ponomar dia manonta ny litera voalohany fa tsy ny lahatsoratra mihitsy: ny ansiklika maoderina natonta manontolo tamin'ny endri-tsoratra sinôdaly dia hilaza zavatra tsy marina momba izay maha-izy azy. Samy nomena alalana amin'ny SIL Open Font License izy rehetra ary avy amin'ity tranonkala ity no anomezana azy fa tsy avy amin'ny hafa, ka ny famakiana pejy dia tsy mangataka na inona na inona amin'ny mpizara an'olon-kafa."
};
