/**
 * Kiswahili UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 19 editions in Kiswahili and its readers were reading
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
 * rather than descriptive. What is
 * here is the chrome -- including every key `CHROME_KEYS` requires, since an
 * unnamed chrome page fails the sync rather than falling back.
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

export const sw: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katekisimu',
	'nav.compendium': 'Muhtasari',
	'nav.magisterium': 'Mafundisho ya Kanisa',
	'nav.socialDoctrine': 'Mafundisho ya kijamii',
	'socialDoctrine.landing.title': 'Muhtasari wa Mafundisho ya Kijamii ya Kanisa',
	'socialDoctrine.landing.tagline':
		'Kile Kanisa linafundisha kuhusu maisha ya kijamii, katika aya 583.',
	'nav.canonLaw': 'Sheria za Kanoni',
	'canonLaw.landing.title': 'Kanuni za Sheria za Kanoni',
	'canonLaw.landing.tagline':
		'Sheria ya Kanisa la Kilatini, katika kanoni 1,752 zilizogawanywa katika vitabu saba.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Kanoni iliyotangulia',
	'canonLaw.nextCanon': 'Kanoni inayofuata',
	'canonLaw.readFullTitle': 'Soma kichwa chote',
	'canonLaw.superseded': 'Maneno yaliyobadilishwa na',
	'nav.prayers': 'Sala',
	'nav.bookmarks': 'Alamisho',
	'nav.menu': 'Menyu',
	'nav.sections': 'Sehemu',
	'nav.works': 'Kazi',
	'nav.pages': 'Kurasa',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Endelea kusoma',
	'home.tagline':
		'Tovuti ya kusoma Maandiko, Katekisimu na nyaraka za Mafundisho ya Kanisa — bure, hufanya kazi bila mtandao, na hakuna cha kujiandikisha.',
	'home.doors.heading': 'Uende wapi',
	'nav.library': 'Maktaba',
	'nav.learn': 'Jifunze',
	'library.landing.tagline':
		'Mkusanyo mzima, rafu kwa rafu — pamoja na mahali ulipoishia na ulichoweka alama.',
	'schola.landing.title': 'Pa kuanzia',
	'schola.landing.tagline':
		'Mwongozo mfupi wa yaliyomo hapa: kila kimoja cha vitabu hivi ni nini, Amri Kumi za Mungu na orodha nyingine ambazo Kanisa linataka kila Mkatoliki azijue, na mahali pa kuanzia kusoma.',
	'schola.start.heading': 'Mgeni katika Ukatoliki?',
	'schola.start.body': 'Mwanzo ulio bora ni ',
	'schola.start.bodyAfter':
		': mafundisho yale yale ya Katekisimu, mafupi zaidi, yaliyoandikwa kwa maswali na majibu. Ni kama sehemu ya kumi ya urefu wake, wala haudhanii chochote.',
	'schola.bible.heading': 'Hujawahi kusoma Biblia?',
	'schola.bible.library':
		'Si kitabu kimoja bali sabini na vitatu, vilivyoandikwa kwa zaidi ya miaka elfu moja na kufungwa pamoja katika mpangilio ambao Kanisa lilikubaliana nao — si mpangilio wa jinsi mambo yalivyotokea, wala si ule ulio rahisi zaidi kusoma. Wengi huanza ukurasa wa kwanza na kuacha wiki chache baadaye, katikati ya sura ndefu ya sheria ya kale, kwa sababu bado hakuna aliyewaambia ni kwa ajili ya nini.',
	'schola.bible.step.gospel': 'Anza na Injili',
	'schola.bible.start':
		'Kimojawapo cha vitabu vinne vifupi kuhusu maisha ya Yesu, ndani kabisa wala si mbele. Si wazo letu: Mtaguso wa Kanisa uliomba kwamba matumizi sahihi ya Maandiko yafundishwe, „hasa ya Agano Jipya na zaidi ya yote ya Injili“. Haukutaja hata kimoja peke yake, wala sisi hatutataja.',
	'schola.bible.whichGospel':
		'Vitatu hupendekezwa kwa kawaida, kwa sababu tatu tofauti. Chochote kati yake ni mahali pazuri pa kuwako.',
	'schola.bible.gospel.mark':
		'Kifupi zaidi. Waweza kukisoma chote kwa alasiri moja, na mwanzoni kumaliza kimoja kunathamani zaidi kuliko kuchagua kilicho bora.',
	'schola.bible.gospel.luke':
		'Kiliandikwa kwa mtu wa nje ya imani aliyetaka habari iandikwe kwa mpangilio — jambo linaloweza kuwa wewe hasa. Kinaendelea moja kwa moja hadi Matendo ya Mitume, kwa hiyo kwa kweli ni nusu ya kwanza ya kitabu kirefu zaidi.',
	'schola.bible.gospel.john':
		'Kile kisemacho waziwazi kwa nini kiliandikwa: „ili mpate kuamini“. Maneno rahisi, nacho kinaenda moja kwa moja kwenye swali la Yesu ni nani.',
	'schola.bible.step.acts': 'Kisha yale yaliyofuata',
	'schola.bible.thenActs':
		'Ukiisha kumaliza kimoja, soma yale waliyoyafanya wale waliomjua baada ya kuondoka kwake.',
	'schola.bible.acts.why':
		'Miaka thelathini baada ya Injili kuisha: watu dazani chache waliokuwa na hofu, na jinsi yale waliyoyaona yalivyofika upande wa pili wa milki.',
	'schola.bible.step.old': 'Kisha nusu ya zamani zaidi',
	'schola.bible.thenOld':
		'Si kuanzia ukurasa wa kwanza, wala si yote. Mahali machache hubeba habari, nayo ndiyo yale ambayo Injili huendelea kuyaelekeza nyuma.',
	'schola.bible.ot.beginnings': 'Jinsi inavyoanza, na jinsi inavyoharibika.',
	'schola.bible.ot.promise':
		'Jamaa moja, na ahadi iliyotolewa kwake inayodumu kuliko wote waliomo.',
	'schola.bible.ot.exodus': 'Taifa lililotolewa utumwani, na sheria waliyopewa ili waishi kwayo.',
	'schola.bible.ot.psalms':
		'Si habari: sala na nyimbo mia moja na hamsini. Soma moja kwa wakati, kwa mpangilio wowote. Kanisa bado huziomba kila siku.',
	'schola.bible.bothWays':
		'Utatambua mambo, na hilo ndilo kusudi wala si sadfa. Kanisa husoma vitabu vya kale katika nuru ya Kristo na vile vipya katika nuru ya yaliyotangulia — kila nusu huieleza nyingine, na ndiyo sababu hakuna inayosomwa peke yake.',
	'schola.books.heading': 'Kilichopo hapa',
	'schola.what.scripture':
		'Maandiko kama Kanisa linavyoyapokea, katika Maagano yote mawili. Kila kingine hapa husomwa katika nuru yake.',
	'schola.what.catechism':
		'Muhtasari wa yale Kanisa Katoliki linayoamini, katika juzuu moja. Mafundisho yale yale yakiwekwa kwa maswali na majibu, kwa kama sehemu ya kumi ya urefu.',
	'schola.what.magisterium':
		'Yale ambayo mapapa na mitaguso wameandika hasa — waraka, katiba, amri, matamko — kila kimoja kikilenga wakati fulani na swali fulani. Kila kimoja hujulikana kwa maneno yake ya kwanza ya Kilatini.',
	'schola.what.social':
		'Mafundisho ya Kanisa kuhusu kazi, mali, familia, siasa na amani, yakikusanywa kutoka hati hizo katika kitabu kimoja.',
	'schola.what.law': 'Sheria wala si mafundisho. Husema yale Kanisa linayodai, nayo hurekebishwa.',
	'schola.what.doctors':
		'Wanateolojia ambao Kanisa limewatangaza kuwa Walimu. Haibebi mamlaka rasmi, hata mwandishi awe mkuu kiasi gani.',
	'schola.what.prayers': 'Maneno ambayo Kanisa huyaomba, yakiwa na Kilatini kando yake.',
	'schola.places.heading': 'Si maandishi, bali mahali pa tovuti hii',
	'schola.what.library':
		'Kazi zote za tovuti katika orodha moja, zikipangwa kwa somo wala si kwa aina.',
	'schola.what.questions':
		'Njia ya kuingia kwa msomaji aliye na swali wala hana rejeo. Kila swali hukusanya vifungu vinavyolijibu — kikianza na Katekisimu — na kila neno ndani yake ni la Kanisa lenyewe.',
	'schola.what.calendar':
		'Siku ya liturujia — majira, rangi, na anayekumbukwa — kwa nchi ambayo kalenda yake unaifuata.',
	'schola.what.bookmarks':
		'Vifungu ulivyoviweka alama, na mahali ulipoishia mwisho katika kila kazi. Vyote viwili hubaki katika kivinjari hiki wala havitumwi popote.',
	'schola.what.census':
		'Kile maktaba hii inachokihifadhi na inavyofika mbali — kazi ngapi, katika lugha zipi, na kiasi gani cha kila moja ambacho msomaji wa lugha yako mwenyewe anaweza kufikia kwa kweli.',
	'ccc.noCounterpart': 'Hakuna kinacholingana katika kazi nyingine',
	'jumpbox.placeholder': 'Nenda kwa… (mf. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Tafuta',
	'jumpbox.hint': 'Bonyeza / au Ctrl+K kwenda kwenye rejeo',
	'jumpbox.noMatch': 'Hakuna kilichopatikana',
	'jumpbox.suggestions': 'Mapendekezo',
	'settings.label': 'Mipangilio',
	'apparatus.label': 'Maelezo',
	'apparatus.editionNotes': 'Maelezo ya toleo hili',
	'apparatus.commentary': 'Ufafanuzi',
	'apparatus.inCommentary': 'Imejumuishwa katika ufafanuzi ulio hapo juu.',
	'darkMode.label': 'Hali ya giza',
	'darkMode.auto': 'Otomatiki',
	'darkMode.on': 'Imewashwa',
	'darkMode.off': 'Imezimwa',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Hali ya mwanga tu',
	'sepia.noHue': 'Si katika Rangi Moja',
	'oled.label': 'OLED nyeusi',
	'oled.darkOnly': 'Hali ya giza tu',
	'mono.label': 'Rangi Moja',
	'mono.hint':
		'Huweka ukurasa mzima katika kijivu kimoja, hivyo hakuna kinachotofautishwa kwa rangi. Sepia huzimika wakati hii imewashwa.',
	'advanced.label': 'Zaidi',
	'library.title': 'Maktaba isiyo na mtandao',
	'library.lede': 'Maandishi yaliyohifadhiwa kwenye kifaa hiki hufunguka bila mtandao wowote.',
	'library.essentials': 'Sala na Muhtasari',
	'library.illustrations': 'Biblia (michoro)',
	'library.illustrationsDetail': 'Biblia (michoro, ubora wa hali ya juu)',
	'library.other': 'Maandishi mengine',
	'library.everything': 'Kila kitu',
	'library.downloadAll': 'Pakua kila kitu',
	'library.download': 'Pakua',
	'library.downloaded': 'Kwenye kifaa hiki',
	'library.offlineNote': 'Zima hali isiyo na mtandao ili kupakua chochote.',
	'library.remove': 'Ondoa kutoka kifaa hiki',
	'library.removeConfirm': 'Ondoa?',
	'library.forget': 'Ondoa vilivyopakuliwa',
	'library.forgetConfirm': 'Ondoa kila kitu?',
	'offline.label': 'Hali isiyo na mtandao',
	'offline.hint':
		'Haitumii mtandao wowote: hakuna kinachopakuliwa, hakuna toleo jipya linalotafutwa, wala hakuna kinachopimwa. Ni maandishi yaliyo tayari kwenye kifaa hiki pekee ndiyo yatafunguka.',
	'offline.notDownloaded': 'Hakipo kwenye kifaa hiki',
	'loadFailed.title': 'Hiyo haikupakia',
	'loadFailed.hint':
		'Ukurasa upo — kitu kilikwenda vibaya wakati wa kuuleta. Kujaribu tena huwa kunatosha.',
	'loadFailed.retry': 'Jaribu tena',
	'loadFailed.retrying': 'Inajaribu…',
	'offline.turnOff': 'Zima hali isiyo na mtandao',
	'type.label': 'Ukubwa na umbo la maandishi',
	'fontSize.label': 'Ukubwa wa maandishi',
	'fontSize.small': 'Ndogo',
	'fontSize.medium': 'Wastani',
	'fontSize.large': 'Kubwa',
	'fontSize.xlarge': 'Kubwa zaidi',
	'fontSize.xxlarge': 'Kubwa sana',
	'face.label': 'Umbo la herufi',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Chapisha ukurasa huu',
	'toTop.label': 'Rudi juu',
	'install.label': 'Sakinisha Glossa',
	'install.hint.label': 'Ongeza kwenye Skrini ya Mwanzo',
	'install.hint.title': 'Ongeza Glossa kwenye Skrini yako ya Mwanzo',
	'install.hint.stepBefore': 'Hufunguka kama programu na kusomeka bila mtandao. Gusa',
	'install.hint.stepAfter': 'kisha „Ongeza kwenye Skrini ya Mwanzo“.',
	'install.hint.dismiss': 'Funga',
	'update.label': 'Toleo jipya linapatikana',
	'update.title': 'Toleo jipya liko tayari',
	'update.body': 'Pakia upya ili kupata maandishi na masahihisho ya hivi karibuni.',
	'update.action': 'Pakia upya',
	'update.dismiss': 'Si sasa',
	'edition.label': 'Toleo',
	'edition.select': 'Chagua toleo',
	'edition.current': 'Toleo la sasa',
	'edition.filter': 'Tafuta matoleo',
	'menu.noMatches': 'Hakuna kinacholingana',
	'unitNav.previous': 'Iliyotangulia',
	'unitNav.next': 'Inayofuata',
	'bible.prevChapter': 'Sura iliyotangulia',
	'bible.nextChapter': 'Sura inayofuata',
	'bible.pickBook': 'Vitabu na sura',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Soma Biblia nzima, kitabu kwa kitabu, sura kwa sura.',
	'bible.landing.random': 'Nahisi Bahati',
	'bible.chapterUnavailable': 'Haipo katika toleo hili',
	'bible.introduction': 'Utangulizi',
	'bible.introUnavailable': 'Bado hakuna utangulizi kwa lugha hii',
	'bible.introSource': 'Utangulizi si sehemu ya maandiko yenyewe.',
	'bible.testament.ot': 'Agano la Kale',
	'bible.testament.nt': 'Agano Jipya',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuki',
	'bible.group.historical': 'Vitabu vya Historia',
	'bible.group.wisdom': 'Vitabu vya Hekima',
	'bible.group.prophetic': 'Vitabu vya Manabii',
	'bible.group.gospels': 'Injili',
	'bible.group.acts': 'Matendo ya Mitume',
	'bible.group.pauline': 'Barua za Paulo',
	'bible.group.catholicLetters': 'Barua za Kikatoliki',
	'bible.group.revelation': 'Ufunuo',
	'ccc.prevParagraph': 'Kifungu kilichotangulia',
	'ccc.nextParagraph': 'Kifungu kinachofuata',
	'ccc.inBrief': 'Kwa Ufupi',
	'ccc.landing.title': 'Katekisimu ya Kanisa Katoliki',
	'ccc.landing.pairTitle': 'Katekisimu na Muhtasari',
	'ccc.landing.tagline':
		'<strong>Katekisimu</strong> inaeleza mafundisho ya Kikatoliki katika aya 2,865 zenye namba. <strong>Muhtasari</strong> unaeleza mafundisho hayo hayo kwa maswali na majibu 598, kwa mpangilio uleule.',
	'ccc.landing.pairTagline':
		'Katekisimu ya Kanisa Katoliki katika vifungu 2,865, na Muhtasari wake katika maswali 598.',
	'ccc.tableOfContents': 'Yaliyomo',
	'ccc.related': 'Tazama pia',
	'compendium.landing.title': 'Muhtasari wa Katekisimu',
	'compendium.landing.tagline': 'Maswali na majibu yanayofupisha Katekisimu ya Kanisa Katoliki.',
	'compendium.question': 'Swali',
	'compendium.answer': 'Jibu',
	'compendium.tableOfContents': 'Yaliyomo',
	'compendium.prevQuestion': 'Swali lililotangulia',
	'compendium.nextQuestion': 'Swali linalofuata',
	'compendium.condenses': 'Yafupisha KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'Katika Muhtasari',
	'compendium.abbrev': 'Muht.',
	'compendium.noQuestionNumber': 'Hakuna nambari ya swali katika korpasi hii',
	'document.library.tagline':
		'Waraka wa kipapa, katiba za mtaguso, amri na matamko ya Mafundisho ya Kanisa.',
	'document.filter.heading': 'Chuja',
	'document.filter.author': 'Mwandishi',
	'document.filter.kind': 'Aina',
	'document.filter.subject': 'Mada',
	'document.filter.search': 'Tafuta hati',
	'document.filter.clear': 'Futa',
	'document.filter.results': 'Hati zilizoonyeshwa',
	'document.filter.noResults': 'Hakuna hati inayolingana na vichujio hivi.',
	'document.tableOfContents': 'Yaliyomo',
	'document.startReading': 'Anza kusoma',
	'document.readFullDocument': 'Soma hati nzima',
	'document.section': 'Sehemu',
	'document.prevSection': 'Iliyotangulia',
	'document.nextSection': 'Inayofuata',
	'document.kind.conciliarConstitution': 'Katiba',
	'document.kind.conciliarDecree': 'Amri',
	'document.kind.conciliarDeclaration': 'Tamko',
	'document.kind.encyclical': 'Waraka',
	'document.kind.apostolicExhortation': 'Himizo la Kitume',
	'document.kind.apostolicConstitution': 'Katiba ya Kitume',
	'document.kind.apostolicLetter': 'Barua ya Kitume',
	'document.kind.cdfDeclaration': 'Tamko la CDF',
	'document.kind.cdfInstruction': 'Maelekezo ya CDF',
	'document.kind.cdfLetter': 'Barua ya CDF',
	'document.kind.cdfDoctrinalNote': 'Dokezo la Kimafundisho la CDF',
	'document.kind.cdfResponsum': 'Responsum ya CDF',
	'document.kind.cdfConsiderations': 'Mazingatio ya CDF',
	'document.kindPlural.conciliarConstitution': 'Katiba',
	'document.kindPlural.conciliarDecree': 'Amri',
	'document.kindPlural.conciliarDeclaration': 'Matamko',
	'document.kindPlural.encyclical': 'Nyaraka',
	'document.kindPlural.apostolicExhortation': 'Mahimizo ya Kitume',
	'document.kindPlural.apostolicConstitution': 'Katiba za Kitume',
	'document.kindPlural.apostolicLetter': 'Barua za Kitume',
	'document.kindPlural.cdfDeclaration': 'Matamko ya CDF',
	'citation.unavailable': 'Hakuna maandishi ya chanzo yanayopatikana kwa dokezo hili.',
	'doctores.landing.title': 'Walimu wa Kanisa',
	'doctores.landing.tagline': 'Kazi za kitaalimungu za Mababa na Walimu wa Kanisa.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomaso wa Akwino, kwa Kiingereza na kwa Kilatini alichoandika.',
	'summa.tableOfContents': 'Yaliyomo',
	'summa.part': 'Sehemu',
	'summa.question': 'Swali',
	'summa.article': 'Ibara',
	'summa.questionShort': 'Sw.',
	'summa.articleShort': 'Ib.',
	'summa.titleFromEdition': 'Kichwa kutoka toleo la {lang}',
	'summa.titlesFromEdition': 'Vichwa kutoka toleo la {lang} — toleo hili halichapishi chochote',
	'summa.prologue': 'Dibaji',
	'summa.objection': 'Pingamizi',
	'summa.sedContra': 'Lakini Kinyume Chake',
	'summa.corpus': 'Ninajibu kwamba',
	'summa.reply': 'Jibu kwa Pingamizi',
	'summa.preamble': 'Kumbuka',
	'summa.prevQuestion': 'Swali lililotangulia',
	'summa.nextQuestion': 'Swali linalofuata',
	'summa.noEditionInYourLanguage': 'Summa haina toleo katika lugha yako. Inaonyeshwa kwa {lang}.',
	'summa.noLatinSupplement':
		'Nyongeza ipo kwa Kiingereza pekee — ilikusanywa baada ya kifo cha Akwino.',
	'index.division': 'Mgawanyo',
	'index.showSubsections': 'Onyesha vijisehemu',
	'index.hideSubsections': 'Ficha vijisehemu',
	'prayers.landing.tagline': 'Sala pamoja na maandishi ya Kilatini kando.',
	'prayers.tableOfContents': 'Yaliyomo',
	'prayers.gloss.versicle':
		'Mstari ambao anayeongoza sala huusema au kuuimba peke yake; waliokusanyika hujibu kwa jibu linalofuata.',
	'prayers.gloss.response':
		'Mstari ambao waliokusanyika huusema au kuuimba pamoja, wakijibu mstari wa kiongozi uliotangulia.',
	'prayers.seeAlso': 'Tazama pia',
	'prayers.prevPrayer': 'Sala iliyotangulia',
	'prayers.nextPrayer': 'Sala inayofuata',
	'prayers.rosary.today': 'Leo',
	'prayers.rosary.todayHeading': 'Mafumbo ya Leo',
	'prayers.rosary.openingPrayer': 'Sala ya Ufunguzi',
	'prayers.rosary.decadePrayers': 'Sala za Dekedi',
	'ref.tooltip.loading': 'Inapakia…',
	'ref.tooltip.openCcc': 'Fungua katika Katekisimu',
	'ref.tooltip.openBible': 'Fungua katika Biblia',
	'ref.tooltip.openCompendium': 'Fungua katika Muhtasari',
	'ref.preview.open': 'Fungua',
	'ref.cf': 'ling.',
	'anchor.actions': 'Vitendo kwa rejeo',
	'anchor.copy': 'Nakili maandishi',
	'anchor.copyLink': 'Nakili kiungo',
	'anchor.view': 'Tazama',
	'anchor.copied': 'Imenakiliwa',
	'anchor.copyFailed': 'Haikuweza kunakili',
	'bookmark.add': 'Weka alama',
	'bookmark.remove': 'Ondoa alamisho',
	'bookmark.library': 'Alamisho',
	'bookmark.library.tagline': 'Kila kitu ulichokiweka alama ukisoma.',
	'bookmark.empty': 'Bado hakuna kilichowekwa alama.',
	'bookmark.emptyHint':
		'Bofya nambari ya mstari au ya aya kisha uchague Weka alama, au tumia kitufe cha alamisho kilicho ukurasani.',
	'bookmark.about': 'Kuhusu alamisho haya',
	'bookmark.deviceOnly':
		'Alamisho huhifadhiwa katika kivinjari hiki pekee. Hayatumwi popote, na kufuta data ya kivinjari huyaondoa.',
	'bookmark.unavailable': 'Hakipo katika toleo unalosoma',
	'colophon.title': 'Kolofoni',
	'colophon.lede':
		'Tovuti hii ni nini, maandishi yake yanatoka wapi, na msimamo wetu kuhusu kuyanakili.',
	'colophon.whatThisIs': 'Hii ni nini',
	'colophon.whatThisIsBody':
		'Glossa Catholica ni tovuti ya kusoma Maandiko, Katekisimu, Kompendiamu na nyaraka za Mafundisho ya Kanisa, kwa Kiingereza, Kireno na Kilatini. Ipo ili isomwe, na hakuna kingine unachotakiwa ili kuisoma:',
	'colophon.pointFree':
		'Bure, na daima bure. Hakuna ukuta wa malipo, hakuna usajili wa kulipia, hakuna cha kununua.',
	'colophon.pointNoAds': 'Hakuna matangazo, wala uwekaji wowote uliodhaminiwa.',
	'colophon.pointNoAccounts': 'Hakuna akaunti. Hakuna cha kujiandikisha, hakuna cha kuingia.',
	'colophon.pointNoTracking':
		'Hakuna hati za kufuatilia, hakuna msimbo wa watu wengine, hakuna vidakuzi. Hesabu za matumizi bila majina tu, bila chochote kinachokutambulisha.',
	'colophon.pointOffline':
		'Imejengwa ili iendelee kufanya kazi bila mtandao mara tu unapokuwa umeitembelea, ili muunganisho hafifu usiwe kizuizi cha kusoma.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica ni jitihada binafsi ya waamini walei. Haina idhini yoyote ya kikanisa wala haisemi kwa mamlaka yake yenyewe.',
	'footer.notEndorsed': 'Bila idhini ya Kiti Kitakatifu',
	'colophon.textsTitle': 'Maandiko',
	'colophon.textsBody':
		'Kila maandishi yanatoka katika chanzo kilichotajwa, na kila kazi inaandika toleo lake, ukurasa wake wa chanzo na tarehe iliyochukuliwa. Maandiko Matakatifu hutumia tafsiri zilizo katika umiliki wa umma; Katekisimu, Kompendiamu na nyaraka za Mafundisho ya Kanisa hutoka katika maandiko yaliyochapishwa na Kiti Kitakatifu chenyewe.',
	'colophon.textsFidelity':
		'Maandishi hayafupishwi kamwe, hayafafanuliwi upya kamwe, hayaandikwi upya kamwe, wala hayawekwi kamwe kando ya matangazo. Hata hivyo tunarekebisha kasoro dhahiri — neno lililoanguka, marejeo yaliyoharibika, alama zilizomeza aya — daima kuelekea kile chanzo chenyewe kinachochapisha, kamwe si kuelekea kile tunachofikiri kingepaswa kusema.',
	'colophon.countBible': 'matoleo ya Biblia',
	'colophon.countDocuments': 'nyaraka za Mafundisho ya Kanisa',
	'colophon.privacyTitle': 'Faragha',
	'colophon.privacyBody1':
		'Hakuna akaunti, hakuna vidakuzi, hakuna matangazo, hakuna msimbo wa watu wengine. Hakuna kitu hapa kinachokufuata ukiondoka kwenye tovuti hii.',
	'colophon.privacyBody2':
		'Tunahesabu jinsi tovuti inavyotumika: kipimo kimoja kwa kila ziara, kila sehemu ikiwa wigo badala ya thamani kamili — ulikaa muda gani, mara ngapi umekuwa hapa, na kazi zipi ulizozifungua. Nchi yako inahesabiwa kando, bila kuunganishwa na mengine yoyote. Kinaeleza ziara, wala si mtu aliyeitembelea, na kinahifadhiwa kwa siku {days}.',
	'colophon.privacyBody3':
		'Havitumwi kamwe: unachoandika kwenye kisanduku cha kutafuta, kifungu ulichokuwa umefungua, au chochote kinachoweza kukitambua kifaa chako tena. Mipangilio yako, alamisho na maandishi uliyopakua hubaki kwenye kifaa chako.',
	'colophon.copyrightTitle': 'Hakimiliki',
	'colophon.copyrightBody1':
		'Katekisimu, Kompendiamu na nyaraka za Mafundisho ya Kanisa ni mali ya wenye haki zake — hasa Libreria Editrice Vaticana na Dikasteri ya Mawasiliano.',
	'colophon.copyrightBody2':
		'Kila kazi huonyesha taarifa ya hakimiliki ya mwenye haki mwenyewe, kwa maneno yake, na huunganisha kwenye ukurasa ilikochukuliwa.',
	'colophon.copyrightBody3':
		'Kama unamiliki haki za maandishi yoyote hapa na ungependelea yasichapishwe, tuandikie.',
	'colophon.contactTitle': 'Mawasiliano',
	'colophon.contactBody': 'Kwa jambo lolote, likiwemo lililotajwa hapo juu:',
	'colophon.contactPending':
		'Anwani ya mawasiliano bado haijawekwa. Tovuti hii haipaswi kuwekwa hadharani hadi iwe nayo — ahadi iliyo hapo juu haina maana bila njia ya kutufikia.',
	'colophon.illustrationsTitle': 'Michoro',
	'colophon.illustrationsBody':
		'Biblia inabeba michoro ya Gustave Doré, kila mmoja umewekwa kwenye mstari unaouonyesha — mzunguko wa mwisho na mkubwa kuliko yote ya michoro yake ya Biblia, iliyochongwa katika mbao kutokana na michoro yake na kuchapishwa pamoja na maandishi badala ya kukusanywa mwishoni.',
	'colophon.illustrationsRights':
		'Iko katika umiliki wa umma, kama tarehe zilizo hapa chini zinavyoonyesha, na nakala ya picha ya kweli ya mchoro ulio katika umiliki wa umma haibebi hakimiliki mpya yake yenyewe.',
	'colophon.countPlates': 'michoro',
	'colophon.countPlateChapters': 'sura zilizopambwa kwa michoro',
	'plates.scansBy': 'Michoro iliyotolewa na',
	'plates.enlarge': 'Kuza {title}',
	'plates.zoom': 'Kuza',
	'art.about': 'Kuhusu picha hii',
	'art.detail': 'sehemu',
	'colophon.typeTitle': 'Herufi',
	'colophon.typeBody':
		'Imepangwa kwa EB Garamond, ufufuo wa Georg Duffner na Octavio Pardo wa herufi alizochonga Claude Garamont miaka ya 1590 — mapokeo ya kibinadamu ambayo Kanisa limekuwa likichapisha kwayo tangu Renaissance. Herufi zake za Kikirili ni za mikono ileile lakini hazifufui chochote: hakuna Garamond ya Kikirili iliyowahi kuchongwa, kwa hiyo Kirusi kimepangwa kwa umbo lililochorwa ili kusimama kando ya nyingine.',
	'colophon.typeArabic':
		'Kiarabu kiko nje ya uwezo wake kabisa, na kimepangwa kwa Amiri — ufufuo wa Khaled Hosny wa naskh iliyochongwa kwa ajili ya mtambo wa Bulaq huko Cairo mwaka 1905, iliyochaguliwa kwa sababu ileile ya herufi za maandishi: aina mahususi ya kihistoria ya kitabu badala ya mchoro wa kisasa.',
	'colophon.typeInitials':
		'Herufi za mwanzo ni Pirata One, herufi za Kigothi ambazo herufi zake kubwa hubaki kusomeka katika ukubwa ambao herufi ya kwanza inahitaji, na — kwa Kirusi — Ponomar, ambayo huiga herufi ya Kislavoni cha Kanisa ya Mtambo wa Sinodi. Ponomar hupanga herufi ya kwanza na kamwe si maandishi: waraka wa kisasa uliopangwa wote kwa herufi ya Sinodi ungesema jambo lisilo kweli kuhusu ulivyo. Zote zina leseni chini ya SIL Open Font License na hutolewa kutoka tovuti hii badala ya kutoka kwa mtu wa tatu, hivyo kusoma ukurasa hakuombi chochote kutoka kwa seva ya mtu mwingine.',
	'refs.citedIn': 'Imetajwa katika',
	'refs.externalVolume': 'Juzuu {volume} kwenye {host} — PDF iliyochanganuliwa',
	'bible.wholeChapter': 'Sura hii',
	'bible.verseNotInEdition':
		'Nambari hii ya mstari haipo katika toleo hili — tazama dokezo katika chanzo cha ukurasa',
	'bible.verseAbbrev': 'mst.',
	'bible.note': 'Dokezo',
	'bible.noteMissing': 'Dokezo hili halipo katika korpasi',
	'bible.chapterArgument': 'Muhtasari',
	'ccc.readFullChapter': 'Soma sura nzima',
	'ccc.noParagraphNumber': 'Hakuna nambari ya kifungu katika korpasi hii',
	'copyright.sourceTitle': 'Fungua ukurasa asilia wa chanzo',
	'copyright.sourceLabel': 'Chanzo',
	'lang.label': 'Lugha',
	'lang.filter': 'Tafuta lugha',
	'lang.more': 'lugha zaidi',
	'notFound.title': 'Hakuna kitu katika anwani hii',
	'notFound.lede': 'Ukurasa uliouomba haupo hapa.',
	'notFound.body':
		'Kiungo huenda kimeandikwa vibaya au kimepitwa na wakati, au huenda kinaelekeza kwenye maandishi ambayo tovuti hii haina.',
	'notFound.searchHint':
		'Kama unajua rejeo unalotaka — kitabu na sura, au kifungu cha Katekisimu — liandike kwenye kisanduku cha kutafuta kilicho juu ya ukurasa huu.',
	'notFound.credit': 'Kwa msingi wa British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Au anza kutoka mojawapo ya haya:',
	'notFound.home': 'Nyumbani',
	'compare.enter': 'Linganisha matoleo',
	'compare.exit': 'Toka kwenye ulinganisho',
	'compare.missing': 'Haipo katika toleo hili',
	'compare.versificationNote':
		'Matoleo haya mawili hugawanya mistari ya sura hii kwa njia tofauti mahali fulani (tofauti ya maandishi, wala si uamuzi wa tafsiri) — nambari ile ile ya mstari haionyeshi kila mara sentensi ile ile katika safu zote mbili.',
	'compare.loading': 'Inapakia lugha ya pili…',
	'ui.close': 'Funga',
	'shortcuts.title': 'Njia za mkato za kibodi',
	'shortcuts.betweenDocuments': 'Kati ya hati',
	'shortcuts.withinDocument': 'Ndani ya hati',
	'shortcuts.show': 'Onyesha orodha hii',
	'help.title': 'Msaada',
	'help.reading.heading': 'Utepe ulio juu ya maandishi',
	'help.feature.offline':
		'Ongeza tovuti hii kwenye skrini yako ya mwanzo nayo hufunguka kama programu. Waweza kupakua kazi nzima ili kuzisoma bila mtandao.',
	'help.feature.contents':
		'Mgawanyo wa kazi uliyomo — vitabu, sehemu, sura — ili uweze kuzunguka ndani yake bila kurudi mwanzoni.',
	'help.feature.compare':
		'Matoleo mawili ya kifungu kilekile, kando kwa kando — Kilatini kando ya lugha yako mwenyewe, au tafsiri moja kando ya nyingine.',
	'help.feature.apparatus':
		'Maelezo ya toleo lenyewe, na ufafanuzi wowote ulioandikwa juu ya maandishi, hutolewa kando yake wala si chini yake. Manukuu yaliyo ndani ya maandishi ni viungo, hivyo rejeo huelekea pale linapoashiria.',
	'help.feature.focus':
		'Huondoa kila kitu isipokuwa maandishi. Njia ya kutoka hubaki pale utepe ulipokuwa, ili kisiwepo kinachonaswa nyuma yake.',
	'zen.enter': 'Hali ya umakini',
	'zen.exit': 'Ondoka kwenye hali ya umakini',
	'nav.calendar': 'Kalenda',
	'calendar.title': 'Kalenda ya liturujia',
	'calendar.tagline':
		'Kalenda Kuu ya Kiroma, iliyokokotolewa kwa siku yoyote — kipindi chake, daraja lake, rangi yake.',
	'calendar.national.tagline':
		'{name}, pamoja na sherehe zake za pekee, iliyokokotolewa kwa siku yoyote.',
	'calendar.calendar': 'Kalenda',
	'calendar.which.general': 'Kalenda Kuu ya Kiroma',
	'calendar.filter': 'Tafuta nchi',
	'calendar.region.europe': 'Ulaya',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Mashariki ya Kati',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Leo',
	'calendar.previousMonth': 'Mwezi uliopita',
	'calendar.nextMonth': 'Mwezi ujao',
	'calendar.plainDays': 'Siku za kawaida',
	'calendar.noSuchDay': 'Hakuna siku ya liturujia inayokokotolewa kwa tarehe hiyo.',
	'calendar.week': 'juma',
	'calendar.alsoToday': 'Leo pia inaadhimishwa',
	'calendar.alsoObserved': 'Leo pia inakumbukwa',
	'calendar.obligation': 'Sikukuu ya lazima',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Mzunguko wa Dominika',
	'calendar.weekdayCycle': 'Mzunguko wa siku za juma',
	'calendar.psalterWeek': 'Juma la zaburi',
	'lectionary.heading': 'Masomo ya Misa',
	'lectionary.slot.reading': 'Somo',
	'lectionary.slot.reading1': 'Somo la Kwanza',
	'lectionary.slot.reading2': 'Somo la Pili',
	'lectionary.slot.reading3': 'Somo la Tatu',
	'lectionary.slot.reading4': 'Somo la Nne',
	'lectionary.slot.reading5': 'Somo la Tano',
	'lectionary.slot.reading6': 'Somo la Sita',
	'lectionary.slot.reading7': 'Somo la Saba',
	'lectionary.slot.psalm': 'Wimbo wa Katikati',
	'lectionary.slot.epistle': 'Barua',
	'lectionary.slot.acclamation': 'Shangwe ya Injili',
	'lectionary.slot.gospel': 'Injili',
	'lectionary.slot.sequence': 'Mfuatano',
	'lectionary.or': 'au',
	'lectionary.cf': 'Ling.',
	'lectionary.about': 'Kuhusu masomo haya',
	'lectionary.caveat':
		'Vifungu vilivyoamriwa na Ordo Lectionum Missae, vikiunganishwa na matoleo ya tovuti hii yenyewe — wala si tafsiri inayosomwa katika kanisa fulani, na baraza la maaskofu laweza kurekebisha ratiba.',
	'calendar.transferredFrom': 'Imehamishwa kutoka',
	'calendar.season.advent': 'Majilio',
	'calendar.season.christmas': 'Kipindi cha Noeli',
	'calendar.season.lent': 'Kwaresima',
	'calendar.season.triduum': 'Triduo ya Pasaka',
	'calendar.season.easter': 'Kipindi cha Pasaka',
	'calendar.season.ordinary': 'Kipindi cha Mwaka',
	'calendar.colour.white': 'Nyeupe',
	'calendar.colour.red': 'Nyekundu',
	'calendar.colour.green': 'Kijani',
	'calendar.colour.violet': 'Zambarau',
	'calendar.colour.rose': 'Waridi',
	'calendar.colour.black': 'Nyeusi',
	'calendar.colour.blue': 'Buluu',
	'calendar.rank.solemnity': 'Sherehe',
	'calendar.rank.feast': 'Sikukuu',
	'calendar.rank.memorial': 'Kumbukumbu',
	'calendar.rank.optional-memorial': 'Kumbukumbu ya hiari',
	'calendar.rank.commemoration': 'Ukumbusho',
	'calendar.rank.sunday': 'Dominika',
	'calendar.rank.weekday': 'Siku ya kawaida',
	'calendar.gloss.season.advent':
		'Majuma manne kabla ya Krismasi: maandalizi ya kuja kwa Bwana na mwanzo wa mwaka wa Kanisa.',
	'calendar.gloss.season.christmas':
		'Kutoka Krismasi hadi Ubatizo wa Bwana, kuadhimisha kuzaliwa kwa Bwana na kudhihirika kwake kwa ulimwengu.',
	'calendar.gloss.season.lent':
		'Siku arobaini kutoka Jumatano ya Majivu hadi Misa ya jioni ya Karamu ya Bwana: toba, sadaka na maandalizi ya Pasaka.',
	'calendar.gloss.season.triduum':
		'Siku tatu kutoka jioni ya Alhamisi Kuu hadi jioni ya Jumapili ya Pasaka — mateso, kifo na ufufuko wa Bwana, na kilele cha mwaka mzima.',
	'calendar.gloss.season.easter':
		'Siku hamsini kutoka Pasaka hadi Pentekoste, zikiadhimishwa kama sikukuu moja — „Jumapili moja kubwa“.',
	'calendar.gloss.season.ordinary':
		'Majuma thelathini na matatu au thelathini na manne nje ya nyakati nyingine. Si „ya kawaida“ bali yenye mpangilio: majuma yanahesabiwa, na Kanisa husoma maisha na mafundisho ya Bwana kwa mfuatano. Huja katika sehemu mbili — baada ya wakati wa Krismasi hadi Kwaresima, na baada ya Pentekoste hadi Majilio.',
	'calendar.gloss.rank.solemnity':
		'Daraja la juu kabisa: Pasaka, Krismasi, Kupaa, msimamizi wa mahali. Huadhimishwa kwa Utukufu na Kanuni ya Imani, na huanza jioni iliyotangulia.',
	'calendar.gloss.rank.feast':
		'Huadhimishwa ndani ya siku yenyewe. Mitume na wainjilisti, na siku kubwa zaidi za Bwana na za Bikira Maria.',
	'calendar.gloss.rank.memorial':
		'Mtakatifu anayekumbukwa siku yake, ndani ya Misa na Liturujia ya Vipindi ya wakati huo. Ni ya lazima pale inapoadhimishwa.',
	'calendar.gloss.rank.optional-memorial':
		'Yaweza kuadhimishwa au isiadhimishwe, kwa chaguo la padre au jumuiya. Isipoadhimishwa, siku ni siku ya kawaida tu.',
	'calendar.gloss.rank.commemoration':
		'Kile ambacho ukumbusho hugeuka kuwa wakati wa Kwaresima: sala inayoongezwa kwenye Misa ya siku ya kawaida, ambayo wakati huo huibakiza nzima.',
	'calendar.gloss.rank.sunday':
		'Sikukuu ya kwanza kabisa — Siku ya Bwana, iliyoadhimishwa kila juma tangu ufufuko. Ni sherehe tu au sikukuu ya Bwana inayoweza kuiondoa, na katika Majilio, Kwaresima na wakati wa Pasaka hata hizo haziwezi.',
	'calendar.gloss.rank.weekday':
		'Siku isiyo na adhimisho lake mwenyewe. Misa na Liturujia ya Vipindi ni za wakati huo — ndicho kinachofanya wakati kuwa kitu cha kujua.',
	'calendar.gloss.colour.white':
		'Furaha. Wakati wa Pasaka na wa Krismasi, siku za Bwana nje ya mateso yake, Bikira Maria, malaika, na watakatifu ambao hawakuwa mashahidi.',
	'calendar.gloss.colour.red':
		'Damu na moto. Jumapili ya Matawi na Ijumaa Kuu, Pentekoste, mitume na wainjilisti, na mashahidi.',
	'calendar.gloss.colour.green': 'Wakati wa Kawaida: rangi ya matumaini, na ya vinavyokua.',
	'calendar.gloss.colour.violet': 'Majilio na Kwaresima, na huvaliwa pia katika Misa za marehemu.',
	'calendar.gloss.colour.rose':
		'Huvaliwa mara mbili kwa mwaka — Jumapili ya Gaudete, ya tatu ya Majilio, na Jumapili ya Laetare, ya nne ya Kwaresima — pale mfungo unapopunguka na mwisho unaonekana.',
	'calendar.gloss.colour.black': 'Yaweza kuvaliwa katika Misa za marehemu.',
	'calendar.gloss.colour.blue':
		'Upendeleo wa bluu: huvaliwa kwa Mimba Safi nchini Hispania, Ufilipino na mahali pengine pachache ambapo Kiti Kitakatifu kimeruhusu.',
	'calendar.gloss.sundayCycle':
		'Masomo ya Jumapili hupita katika miaka mitatu — A, B na C — yakisoma Mathayo, Marko na Luka kwa zamu, pamoja na Yohane katika Kwaresima na wakati wa Pasaka. Mzunguko hugeuka Jumapili ya kwanza ya Majilio, pamoja na mwaka wa Kanisa.',
	'calendar.gloss.weekdayCycle':
		'Masomo ya siku za kawaida hupita katika miaka miwili, I na II: somo la kwanza hubadilika, Injili haibadiliki. Mwaka wa kiliturujia huitwa kwa jina la mwaka wa kalenda unaomalizikia — miaka isiyo shufwa ni I, iliyo shufwa ni II.',
	'calendar.gloss.psalterWeek':
		'Liturujia ya Vipindi hugawa zaburi katika majuma manne, I hadi IV, yanayorudiwa mwaka mzima. Hili ndilo juma ambalo zaburi zake ni za leo, kwa yeyote anayesali Vipindi.',
	'calendar.gloss.obligation':
		'Siku ambayo waamini wanawajibika kushiriki Misa na kujiepusha na kazi zinazoweza kuwazuia. Kila Jumapili, na siku nyingine ambazo kila baraza la maaskofu limeamua.',
	'calendar.primer.title': 'Ni mara yako ya kwanza?',
	'calendar.primer.lead':
		'Kanisa lina mwaka wake. Huanza kwa Majilio, huzunguka Pasaka, na humpa kila siku jina, daraja na rangi — na hivyo huamua kinachosaliwa na kusomwa siku hiyo katika Misa na katika Liturujia ya Vipindi. Hivyo „Jumapili ya ishirini na tatu ya Mwaka wa Kawaida“ ni anwani: humwambia padre, kwaya, au yeyote anayesali nyumbani ni sala zipi na masomo yapi ya leo.',
	'calendar.primer.seasons': 'Nyakati',
	'calendar.primer.ranks': 'Siku inaweza kuwa nini',
	'calendar.primer.colours': 'Rangi',
	'calendar.primer.cycles': 'Mizunguko',
	'calendar.primer.cyclesLead':
		'Vihesabu vitatu ambavyo kwa pamoja husema ni masomo yapi na zaburi zipi zilizowekwa kwa leo.'
};
