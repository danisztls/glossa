/**
 * Igbo UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Igbo, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, Igboland, among the most densely Catholic regions on earth. A reader gets their own chrome and English
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
 * TRANSLATION CONFIDENCE: LOW. Written by an LLM with no native reader in
 * the loop, and this is one of the five languages where that is most
 * likely to show — Igbo orthography carries dots below and tone marks that
 * a generator drops silently, and Catholic usage is regional. Treat every
 * string here as a proposal. Correcting one is a one-line change and needs
 * no permission; because `t()` falls back to English per key, DELETING a
 * doubtful line is also a valid fix and strictly better than leaving a
 * wrong one standing.
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

export const ig: Dictionary = {
	'nav.bible': 'Baịbụl',
	'nav.ccc': 'Katakizim',
	'nav.compendium': 'Nchịkọta',
	'nav.magisterium': 'Nkuzi Chọọchị',
	'nav.socialDoctrine': 'Ozizi mmekọrịta',
	'socialDoctrine.landing.title': 'Nchịkọta Ozizi Mmekọrịta nke Chọọchị',
	'socialDoctrine.landing.tagline': "Ihe Chọọchị na-akụzi banyere ndụ n'obodo, n'ime nkeji 583.",
	'nav.canonLaw': 'Iwu Kanọn',
	'canonLaw.landing.title': 'Akwụkwọ Iwu Kanọn',
	'canonLaw.landing.tagline': 'Iwu Chọọchị Latin, na kanọn 1,752 n’akwụkwọ asaa.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Kanọn gara aga',
	'canonLaw.nextCanon': 'Kanọn ọzọ',
	'canonLaw.readFullTitle': 'Gụọ aha ahụ dum',
	'canonLaw.superseded': 'Okwu dochiri anya ya site na',
	'nav.prayers': 'Ekpere',
	'nav.bookmarks': 'Akara akwụkwọ',
	'nav.menu': 'Menu',
	'nav.sections': 'Ngalaba',
	'nav.works': 'Ọrụ',
	'nav.pages': 'Ibe',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Gaa n’ihu ịgụ',
	'home.tagline':
		"Saịtị ọgụgụ maka Akwụkwọ Nsọ, Katekizim, na akwụkwọ ndị Ọrụ Nkuzi Chọọchị — n'efu, na-arụ ọrụ n'enweghị njikọ, ọ dịghịkwa ihe ị ga-edebanye aha na ya.",
	'home.doors.heading': 'Ebe ị ga-aga',
	'home.find.heading': 'Ma ọ bụ pịnye nrụtụaka',
	'nav.library': 'Ọbá akwụkwọ',
	'nav.learn': 'Mụta',
	'library.landing.tagline':
		'Nchịkọta ahụ dum, shelf n’otu n’otu — tinyere ebe ị kwụsịrị na ihe ị kara aka.',
	'schola.landing.title': 'Ebe ị ga-amalite',
	'schola.landing.tagline':
		"Nduzi dị mkpirikpi banyere ihe dị ebe a: ihe akwụkwọ ọ bụla n'ime ndị a bụ, otú e si ede nrụtụaka ya, otú i si achọta akụkụ, na usoro ọgụgụ ndị Chọọchị tụpụtara.",
	'schola.start.heading': 'Ị bụ ọhụrụ na okpukpe Katọlik?',
	'schola.start.body': 'Mmalite kacha mma bụ ',
	'schola.start.bodyAfter':
		": otu ozizi ahụ dị na Katekizim, dị mkpirikpi karị, e dere n'ajụjụ na azịza. Ọ bụ ihe dị ka otu ụzọ n'ụzọ iri nke ogologo ya, ọ dịghịkwa ihe ọ na-eche na ị maara.",
	'schola.bible.heading': 'Ị gụtụbeghị Baịbụl?',
	'schola.bible.library':
		"Ọ bụghị otu akwụkwọ kama iri asaa na atọ, ndị e dere ihe karịrị otu puku afọ ma kegbaa n'usoro Chọọchị kwadoro — ọ bụghị usoro ihe ndị ahụ mere, ọ bụghịkwa nke kacha mfe ịgụ. Ọtụtụ mmadụ na-amalite na peeji nke mbụ ma kwụsị izu ole na ole ka e mesịrị, n'ime ogologo isi nke iwu oge ochie, n'ihi na o nwebeghị onye gwara ha ihe ọ bụ maka ya.",
	'schola.bible.step.gospel': "Malite site n'otu Oziọma",
	'schola.bible.start':
		"Otu n'ime akwụkwọ mkpirikpi anọ banyere ndụ Jisọs, nke dị nnọọ n'ime ma ọ bụghị n'ihu. Ọ bụghị echiche anyị: otu Kansụl nke Chọọchị rịọrọ ka a kụziere ndị mmadụ ezi ojiji nke Akwụkwọ Nsọ, „ọkachasị Ọgbụgba Ndụ Ọhụrụ na tupu ihe niile Oziọma“. Ọ kpọghị aha nke ọ bụla n'otu n'otu, anyị agakwaghị akpọ.",
	'schola.bible.whichGospel':
		"A na-atụ aro atọ n'ọtụtụ mgbe, maka ihe atọ dị iche iche. Nke ọ bụla n'ime ha bụ ebe ọma ịnọ.",
	'schola.bible.gospel.mark':
		"Nke kacha mkpirikpi. Ị nwere ike ịgụcha ya niile n'otu ehihie, ọ dịkwa mkpa na mmalite ịgụchaa otu karịa ịhọrọ nke kacha mma.",
	'schola.bible.gospel.luke':
		"E dere ya nye onye nọ n'èzí okwukwe nke chọrọ ka e depụta akụkọ ahụ n'usoro — nke nwere ike ịbụ kpọmkwem gị. Ọ na-agabiga ozugbo n'ime Ọrụ Ndịozi, ya mere na ọ bụ n'ezie ọkara nke mbụ nke akwụkwọ dị ogologo karị.",
	'schola.bible.gospel.john':
		"Nke kwuru hoo haa ihe mere e ji dee ya: „ka unu wee kwere“. Okwu dị mfe, ọ na-agakwa kpọmkwem n'ajụjụ onye Jisọs bụ.",
	'schola.bible.step.acts': "Mgbe ahụ ihe mere n'ihu",
	'schola.bible.thenActs': 'Mgbe ị gụchara otu, gụọ ihe ndị maara ya mere mgbe ọ lawara.',
	'schola.bible.acts.why':
		"Afọ iri atọ ka Oziọma ndị ahụ kwụsịrị: mmadụ ole na ole ndị ụjọ tụrụ, na otú ihe ha hụrụ si ruo n'akụkụ nke ọzọ nke alaeze ukwu ahụ.",
	'schola.bible.step.old': 'Mgbe ahụ ọkara ochie ahụ',
	'schola.bible.thenOld':
		'Ọ bụghị site na peeji nke mbụ, ọ bụghịkwa ya niile. Ebe ole na ole na-ebu akụkọ ahụ, ọ bụkwa ha ka Oziọma na-atụgharị na-atụ aka na ha.',
	'schola.bible.ot.beginnings': 'Otú o si amalite, na otú o si emebi.',
	'schola.bible.ot.promise':
		'Otu ezinụlọ, na nkwa e kwere ya nke na-adịgide karịa mmadụ niile dị na ya.',
	'schola.bible.ot.exodus': "Ndị a kpọpụtara n'ohu, na iwu e nyere ha ka ha jiri biri ndụ.",
	'schola.bible.ot.psalms':
		"Ọ bụghị akụkọ: ekpere na abụ narị na iri ise. Gụọ otu n'otu, n'usoro ọ bụla. Chọọchị ka na-ekpe ha kwa ụbọchị.",
	'schola.bible.bothWays':
		"Ị ga-amata ihe ụfọdụ, nke ahụ bụkwa ebumnuche ọ bụghị ihe mberede. Chọọchị na-agụ akwụkwọ ndị ochie n'ìhè Kraịst, na-agụkwa ndị ọhụrụ n'ìhè nke ihe buru ụzọ — akụkụ ọ bụla na-akọwa ibe ya, ọ bụkwa ya mere na a naghị agụ nke ọ bụla naanị ya.",
	'schola.books.heading': 'Ihe dị ebe a, na otú e si amata ya',
	'schola.books.lede':
		"Nke ọ bụla n'ime ndị a bụ ụdị akwụkwọ dị iche, a na-arụtụkwa aka na nke ọ bụla site na nọmba nke ya. Ihe atụ na-egosi ụdị ya: pịnye otu dị ka ya n'igbe nchọta, ị ga-erute akụkụ ahụ.",
	'schola.cite.label': 'A na-amata ya',
	'schola.what.scripture':
		"Akwụkwọ Nsọ dị ka Chọọchị si anabata ya, n'Ọgbụgba Ndụ abụọ ahụ. Ihe niile ọzọ dị ebe a ka a na-agụ n'ìhè ha.",
	'schola.cite.scripture': "akwụkwọ, isi na amaokwu, n'ụdị mkpirisi mbipụta nke gị na-ebipụta",
	'schola.what.catechism':
		"Nchịkọta nke ihe Chọọchị Katọlik kweere, n'otu mpịakọta. Ya onwe ya abụghị isi mmalite: ọ na-achịkọta Akwụkwọ Nsọ, Nna Ochie, ememe ofufe na ozizi Chọọchị, paragraf ọ bụla na-akọwakwa ebe ihe ọ na-ekwu si bịa.",
	'schola.cite.catechism':
		"site na nọmba paragraf, nke na-aga n'usoro na-akwụsịghị site na peeji mbụ ruo nke ikpeazụ",
	'schola.what.compendium':
		"Otu ozizi ahụ e depụtara n'ajụjụ na azịza, n'ihe dị ka otu ụzọ n'ụzọ iri nke ogologo ya.",
	'schola.cite.compendium': 'site na nọmba ajụjụ',
	'schola.what.magisterium':
		"Ihe ndị popu na kansụl dere n'ezie — akwụkwọ ozi ndị popu, iwu, ikike, nkwupụta — nke ọ bụla e zigara n'otu oge na otu ajụjụ. A maara nke ọ bụla site n'okwu mmalite ya n'asụsụ Latin.",
	'schola.cite.magisterium': "site n'aha akwụkwọ ahụ, wee bụrụ nọmba akụkụ dị n'ime ya",
	'schola.what.social':
		"Ozizi Chọọchị banyere ọrụ, ihe onwunwe, ezinụlọ, ndọrọndọrọ ọchịchị na udo, nke a chịkọtara site n'akwụkwọ ndị ahụ n'otu akwụkwọ.",
	'schola.cite.social': "site na nọmba paragraf, n'okpuru mkpirisi nke ọrụ ahụ na-akpọ onwe ya",
	'schola.what.law': 'Iwu ọ bụghị ozizi. Ọ na-ekwu ihe Chọọchị chọrọ, a na-agbanwekwa ya.',
	'schola.cite.law': 'site na kanọn, nke bụ aha a na-akpọ akụkụ ya ndị nwere nọmba',
	'schola.what.doctors':
		"Ndị ọkà mmụta okpukpe ndị Chọọchị kpọrọ Ndị Ozizi. Ọ naghị ebu ikike gọọmentị Chọọchị, n'agbanyeghị ka onye dere ya si dị ukwuu.",
	'schola.cite.doctors': "site n'akụkụ, wee bụrụ ajụjụ — nkewa nke Summa n'onwe ya",
	'schola.what.prayers': "Okwu ndị Chọọchị ji ekpe ekpere, ya na Latin dị n'akụkụ ya.",
	'schola.cite.prayers': "site n'aha; ọ dịghị nọmba a ga-ehota",
	'schola.places.heading': 'Ọ bụghị ederede, kama ebe ndị dị na saịtị a',
	'schola.what.library':
		"Ọrụ niile nke saịtị a n'otu ndepụta, e kewara ha site n'isiokwu ọ bụghị site n'ụdị.",
	'schola.what.calendar':
		'Ụbọchị ememe — oge, agba, na onye a na-echeta — maka obodo nke ị na-eso kalenda ya.',
	'schola.what.bookmarks':
		"Akụkụ ndị i kara akara, na ebe ị kwụsịrị n'ikpeazụ n'ọrụ ọ bụla. Ha abụọ na-anọgide n'ihe nchọgharị a, a naghịkwa eziga ha ebe ọ bụla.",
	'ccc.noCounterpart': 'Ọ dịghị ihe yiri ya n’ọrụ nke ọzọ ahụ.',
	'jumpbox.placeholder': 'Gaa na… (dka. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Chọọ',
	'jumpbox.hint': 'Pịa / ma ọ bụ Ctrl+K ịga na nrụtụaka',
	'jumpbox.noMatch': 'Ọ dịghị ihe dabara',
	'jumpbox.suggestions': 'Aro',
	'settings.label': 'Ntọala',
	'apparatus.label': 'Ihe Odide',
	'apparatus.editionNotes': 'Nkọwa nke mbipụta a',
	'apparatus.commentary': 'Nkọwa Zuru Oke',
	'apparatus.inCommentary': 'Etinyere ya na nkọwa zuru oke dị n’elu.',
	'darkMode.label': 'Ụdị gbara ọchịchịrị',
	'darkMode.auto': 'Akpaaka',
	'darkMode.on': 'Gbanyere',
	'darkMode.off': 'Gbanyụrụ',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Naanị n’ụdị ọkụ',
	'sepia.noHue': 'Ọ dịghị n’agba otu',
	'oled.label': 'Oji OLED',
	'oled.darkOnly': 'Naanị n’ụdị gbara ọchịchịrị',
	'mono.label': 'Agba Otu',
	'mono.hint':
		'Ọ na-eme ka ibe ahụ dum bụrụ otu agba isi awọ, ka ọ ghara ịdị iche site n’agba. Sepia na-agbanyụ mgbe nke a gbanyere.',
	'advanced.label': 'Ihe Ndị Ọzọ',
	'library.title': 'Ọbá Akwụkwọ Enweghị Njikọ',
	'library.lede': 'Ederede ndị e debere n’ihe nchọgharị a na-emeghe na-enweghị netwọk ọ bụla.',
	'library.essentials': 'Ekpere na Nchịkọta',
	'library.illustrations': 'Baịbụl (ihe osise)',
	'library.illustrationsDetail': 'Baịbụl (ihe osise, doro anya nke ọma)',
	'library.other': 'Ederede Ndị Ọzọ',
	'library.everything': 'Ihe Niile',
	'library.downloadAll': 'Budata ihe niile',
	'library.download': 'Budata',
	'library.downloaded': 'N’ihe nchọgharị a',
	'library.offlineNote': 'Gbanyụọ ụdị enweghị njikọ iji budata ihe ọ bụla.',
	'library.remove': 'Wepụ n’ihe nchọgharị a',
	'library.removeConfirm': 'Wepụ?',
	'library.forget': 'Wepụ ihe ndị e budatara',
	'library.forgetConfirm': 'Wepụ ihe niile?',
	'offline.label': 'Ụdị Enweghị Njikọ',
	'offline.hint':
		'Ọ naghị eji netwọk ọ bụla eme ihe: ọ dịghị ihe a na-ebudata, a naghị elele mmelite ọ bụla, ọ dịghị ihe a na-atụ. Naanị ederede ndị dị n’ihe nchọgharị a ga-emeghe.',
	'offline.notDownloaded': 'Ọ dịghị n’ihe nchọgharị a',
	'loadFailed.title': 'Nke ahụ ebugoteghị',
	'loadFailed.hint':
		'Ibe ahụ dị — ihe adịghị mma mere mgbe a na-eweta ya. Ịnwale ọzọ na-arụkarị ọrụ.',
	'loadFailed.retry': 'Nwaa ọzọ',
	'loadFailed.retrying': 'Na-anwa…',
	'offline.turnOff': 'Gbanyụọ ụdị enweghị njikọ',
	'fontSize.label': 'Nha ederede',
	'fontSize.larger': 'Ederede buru ibu',
	'fontSize.smaller': 'Ederede dị nta',
	'print.label': 'Bipụta ibe a',
	'toTop.label': "Laghachi n'elu",
	'install.label': 'Wụnye Glossa',
	'install.hint.label': 'Tinye na Ihuenyo Mmalite',
	'install.hint.title': 'Tinye Glossa n’Ihuenyo Mmalite Gị',
	'install.hint.stepBefore': 'Ọ na-emeghe dịka ngwa, na-agụkwa n’enweghị njikọ. Pịa',
	'install.hint.stepAfter': 'wee pịa “Tinye na Ihuenyo Mmalite”.',
	'install.hint.dismiss': 'Hapụ',
	'update.label': 'Mbipụta ọhụrụ dị',
	'update.title': 'Mbipụta ọhụrụ adịla njikere',
	'update.body': 'Budata ọzọ iji nweta ederede na mmezi kacha ọhụrụ.',
	'update.action': 'Budata Ọzọ',
	'update.dismiss': 'Ọ bụghị Ugbu A',
	'edition.label': 'Mbipụta',
	'edition.select': 'Họrọ mbipụta',
	'edition.current': 'Mbipụta ugbu a',
	'edition.filter': 'Chọọ mbipụta',
	'menu.noMatches': 'Ọ dịghị ihe dabara',
	'unitNav.previous': 'Nke gara aga',
	'unitNav.next': 'Nke ọzọ',
	'bible.prevChapter': 'Isi gara aga',
	'bible.nextChapter': 'Isi na-esote',
	'bible.pickBook': 'Akwụkwọ na isi',
	'bible.landing.title': 'Baịbụl',
	'bible.landing.tagline': 'Gụọ Baịbụl niile, akwụkwọ n’akwụkwọ, isi n’isi.',
	'bible.landing.random': 'Họrọ m ihe ọ bụla',
	'bible.landing.books': 'Akwụkwọ',
	'bible.chapterUnavailable': 'Adịghị na mbipụta a',
	'bible.introduction': 'Mmalite okwu',
	'bible.introUnavailable': 'Ọ dịghị mmalite okwu n’asụsụ a ka ọ dị ugbu a',
	'bible.introSource': 'Mmalite okwu abụghị akụkụ nke ederede Akwụkwọ Nsọ.',
	'bible.testament.ot': 'Ọgbụgba Ndụ Ochie',
	'bible.testament.nt': 'Ọgbụgba Ndụ Ọhụrụ',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentatuk',
	'bible.group.historical': 'Akwụkwọ Akụkọ Ihe Mere Eme',
	'bible.group.wisdom': 'Akwụkwọ Amamihe',
	'bible.group.prophetic': 'Akwụkwọ Ndị Amụma',
	'bible.group.gospels': 'Oziọma',
	'bible.group.acts': 'Ọrụ Ndịozi',
	'bible.group.pauline': 'Akwụkwọ Ozi Pọl',
	'bible.group.catholicLetters': 'Akwụkwọ Ozi Katọlik',
	'bible.group.revelation': 'Mkpughe',
	'ccc.prevParagraph': 'Paragraf gara aga',
	'ccc.nextParagraph': 'Paragraf na-esote',
	'ccc.inBrief': 'Na Nkenke',
	'ccc.landing.title': 'Katakizim nke Chọọchị Katọlik',
	'ccc.landing.pairTitle': 'Katekizim na Nchịkọta',
	'ccc.landing.tagline':
		'<strong>Katakizim</strong> na-akọwa ozizi Katọlik n’ime paragraf 2,865 e nyere nọmba. <strong>Nchịkọta</strong> na-ekwughachi otu ozizi ahụ dịka ajụjụ na azịza 598, n’otu usoro ahụ.',
	'ccc.landing.pairTagline':
		"Katekizim nke Chọọchị Katọlik n'ọnụọgụ 2,865, na Nchịkọta ya n'ajụjụ 598.",
	'ccc.tableOfContents': 'Ndepụta ọdịnaya',
	'ccc.related': 'Lekwaa',
	'compendium.landing.title': 'Nchịkọta Katekizim',
	'compendium.landing.tagline': 'Ajụjụ na azịza na-achịkọta Katekizim nke Chọọchị Katọlik.',
	'compendium.question': 'Ajụjụ',
	'compendium.answer': 'Azịza',
	'compendium.tableOfContents': 'Ndepụta ọdịnaya',
	'compendium.prevQuestion': 'Ajụjụ gara aga',
	'compendium.nextQuestion': 'Ajụjụ na-esote',
	'compendium.condenses': 'Na-achịkọta KCK ¶¶',
	'ccc.abbrev': 'KCK',
	'ccc.condensedIn': 'Na Nchịkọta',
	'compendium.abbrev': 'Nchịk.',
	'compendium.noQuestionNumber': 'Ọ dịghị nọmba ajụjụ na nchịkọta a',
	'document.library.tagline':
		'Ensaịklikal, iwu kansụl, iwu nyefere, na nkwupụta nke Nkuzi Chọọchị.',
	'document.filter.heading': 'Nzacha',
	'document.filter.author': 'Odee',
	'document.filter.kind': 'Ụdị',
	'document.filter.subject': 'Isiokwu',
	'document.filter.search': 'Chọọ akwụkwọ ozi',
	'document.filter.clear': 'Hichapụ',
	'document.filter.results': 'Akwụkwọ ozi egosiri',
	'document.filter.noResults': 'Ọ dịghị akwụkwọ ozi dabara na nzacha ndị a.',
	'document.tableOfContents': 'Ndepụta ọdịnaya',
	'document.startReading': 'Malite ịgụ',
	'document.readFullDocument': 'Gụọ akwụkwọ ozi ahụ dum',
	'document.section': 'Ngalaba',
	'document.prevSection': 'Nke gara aga',
	'document.nextSection': 'Nke ọzọ',
	'document.kind.conciliarConstitution': 'Iwu Kansụl',
	'document.kind.conciliarDecree': 'Iwu Nyefere',
	'document.kind.conciliarDeclaration': 'Nkwupụta',
	'document.kind.encyclical': 'Ensaịklikal',
	'document.kind.apostolicExhortation': 'Mgbaume nke Ndịozi',
	'document.kind.apostolicConstitution': 'Iwu Ndịozi',
	'document.kind.cdfDeclaration': 'Nkwupụta CDF',
	'document.kind.cdfInstruction': 'Ntuziaka CDF',
	'document.kind.cdfLetter': 'Akwụkwọ Ozi CDF',
	'document.kind.cdfDoctrinalNote': 'Nkọwa Ozizi CDF',
	'document.kind.cdfResponsum': 'Azịza CDF',
	'document.kind.cdfConsiderations': 'Ntụle CDF',
	'document.kindPlural.conciliarConstitution': 'Iwu Kansụl',
	'document.kindPlural.conciliarDecree': 'Iwu Nyefere',
	'document.kindPlural.conciliarDeclaration': 'Nkwupụta',
	'document.kindPlural.encyclical': 'Ensaịklikal',
	'document.kindPlural.apostolicExhortation': 'Mgbaume nke Ndịozi',
	'document.kindPlural.apostolicConstitution': 'Iwu Ndịozi',
	'document.kindPlural.cdfDeclaration': 'Nkwupụta CDF',
	'citation.unavailable': 'Ọ dịghị ederede isi mmalite dị maka nkọwa a.',
	'doctores.landing.title': 'Ndị Ozizi Chọọchị',
	'doctores.landing.tagline': 'Ọrụ nkà mmụta okpukpe nke Ndị Nna na Ndị Ozizi Chọọchị.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tọmas Akwịnas, n’asụsụ Bekee na n’asụsụ Latin o ji dee.',
	'summa.tableOfContents': 'Ndepụta ọdịnaya',
	'summa.part': 'Akụkụ',
	'summa.question': 'Ajụjụ',
	'summa.article': 'Ngalaba',
	'summa.questionShort': 'Aj.',
	'summa.articleShort': 'Ngl.',
	'summa.titleFromEdition': 'Aha sitere na mbipụta {lang}',
	'summa.titlesFromEdition': 'Aha ndị sitere na mbipụta {lang} — nke a ebipụtaghị nke ya',
	'summa.prologue': 'Mmalite',
	'summa.objection': 'Mmegide',
	'summa.sedContra': 'N’Aka Ọzọ',
	'summa.corpus': 'Azịza M',
	'summa.reply': 'Azịza nye Mmegide',
	'summa.preamble': 'Nkọwa',
	'summa.prevQuestion': 'Ajụjụ gara aga',
	'summa.nextQuestion': 'Ajụjụ na-esote',
	'summa.noEditionInYourLanguage':
		'Summa enweghị mbipụta n’asụsụ gị. A na-egosi ya n’asụsụ {lang}.',
	'summa.noLatinSupplement':
		'Ihe agbakwunyere ahụ dị naanị n’asụsụ Bekee — e chịkọtara ya mgbe Akwịnas nwụsịrị.',
	'index.division': 'Nkewa',
	'index.showSubsections': 'Gosi nkewa nta',
	'index.hideSubsections': 'Zoo nkewa nta',
	'prayers.landing.title': 'Ekpere Nkịtị',
	'prayers.landing.tagline': 'Ekpere ya na ederede Latin n’akụkụ ya.',
	'prayers.tableOfContents': 'Ndepụta ọdịnaya',
	'prayers.gloss.versicle':
		'Ahịrị onye na-edu ekpere na-ekwu ma ọ bụ na-abụ naanị ya; ọgbakọ ahụ na-eji nzaghachi na-esote ya zaa ya.',
	'prayers.gloss.response':
		'Ahịrị ọgbakọ ahụ na-ekwu ma ọ bụ na-abụ ọnụ, na-azaghachi ahịrị onye ndu buru ya ụzọ.',
	'prayers.seeAlso': 'Lekwaa',
	'prayers.prevPrayer': 'Ekpere gara aga',
	'prayers.nextPrayer': 'Ekpere na-esote',
	'prayers.rosary.today': 'Taa',
	'prayers.rosary.todayHeading': 'Ihe Omimi nke Taa',
	'prayers.rosary.openingPrayer': 'Ekpere Mmalite',
	'prayers.rosary.decadePrayers': 'Ekpere Otu Iri',
	'ref.tooltip.loading': 'Na-ebugote…',
	'ref.tooltip.openCcc': 'Mepee na Katakizim',
	'ref.tooltip.openBible': 'Mepee na Baịbụl',
	'ref.tooltip.openCompendium': 'Mepee na Nchịkọta',
	'ref.preview.open': 'Mepee',
	'ref.cf': 'tụny.',
	'anchor.actions': 'Ihe ị ga-eme na nrụtụaka',
	'anchor.copy': 'Detuo ederede',
	'anchor.copyLink': 'Detuo njikọ',
	'anchor.view': 'Lee',
	'anchor.copied': 'Edetuola',
	'anchor.copyFailed': 'Enweghị ike idetu',
	'bookmark.add': 'Kaa akara',
	'bookmark.remove': 'Wepụ akara akwụkwọ',
	'bookmark.library': 'Akara akwụkwọ',
	'bookmark.library.tagline': 'Ihe niile i kara akara mgbe ị na-agụ.',
	'bookmark.empty': 'Ọ dịghị ihe akara ka ugbu a.',
	'bookmark.emptyHint':
		"Pịa nọmba amaokwu ma ọ bụ paragraf wee họrọ Kaa akara, ma ọ bụ jiri bọtịnụ akara akwụkwọ dị n'ibe ahụ.",
	'bookmark.about': 'Maka akara akwụkwọ ndị a',
	'bookmark.deviceOnly':
		"A na-edebe akara akwụkwọ naanị n'ihe nchọgharị a. A naghị eziga ha ebe ọ bụla, na ihichapụ data ihe nchọgharị gị na-ewepụ ha.",
	'bookmark.unavailable': 'Ọ dịghị na mbipụta ị na-agụ',
	'colophon.title': 'Kọlọfọn',
	'colophon.lede': 'Ihe saịtị a bụ, ebe ederede ya si bịa, na ebe anyị guzo banyere ịmegharị ha.',
	'colophon.whatThisIs': 'Gịnị ka nke a bụ',
	'colophon.whatThisIsBody':
		"Glossa Catholica bụ saịtị ọgụgụ maka Akwụkwọ Nsọ, Katekizim, Nchịkọta, na akwụkwọ ndị Ọrụ Nkuzi Chọọchị, n'asụsụ Bekee, Portuguese na Latin. Ọ dị ka a gụọ ya, ọ dịghịkwa ihe ọzọ a na-arịọ gị iji gụọ ya:",
	'colophon.pointFree':
		"N'efu, mgbe niile n'efu. Ọ dịghị mgbidi ụgwọ, ọ dịghị ndenye aha akwụ ụgwọ, ọ dịghị ihe a na-ere.",
	'colophon.pointNoAds': "Ọ dịghị mgbasa ozi, ọ dịghịkwa idobe ihe ọ bụla a kwadoro site n'ego.",
	'colophon.pointNoAccounts':
		'Ọ dịghị akaụntụ. Ọ dịghị ihe ị ga-edebanye aha na ya, ọ dịghị ihe ị ga-abanye na ya.',
	'colophon.pointNoTracking':
		'Ọ dịghị script nnyocha, ọ dịghị koodu ndị ọzọ, ọ dịghị kuki. Naanị ọnụọgụ ojiji na-akpọghị aha, ọ dịghị ihe ọ bụla na-egosi onye ị bụ.',
	'colophon.pointOffline':
		"E wuru ya ka ọ nọgide na-arụ ọrụ n'enweghị njikọ mgbe ị gaachaala ya otu ugboro, ka njikọ na-adịghị ike ghara ịbụ ihe mgbochi ọgụgụ.",
	'colophon.whatThisIsStanding':
		"Glossa Catholica bụ ọrụ nkeonwe nke ndị kwere ekwe na-abụghị ndị ụkọchukwu. O nweghị nkwado ọ bụla nke Chọọchị, ọ naghịkwa ekwu okwu site n'ikike nke aka ya.",
	'footer.notEndorsed': 'Oche Nsọ akwadoghị ya',
	'colophon.textsTitle': 'Ederede ndị ahụ',
	'colophon.textsBody':
		"Ederede ọ bụla si n'ebe a kpọrọ aha ya, akwụkwọ ọ bụla na-edekwa mbipụta ya, ibe si na ya bịa, na ụbọchị e wetara ya. Akwụkwọ Nsọ na-eji nsụgharị ndị dị n'aka ọha; Katekizim, Nchịkọta, na akwụkwọ ndị Ọrụ Nkuzi Chọọchị si n'ederede ndị Oche Nsọ n'onwe ya bipụtara.",
	'colophon.textsFidelity':
		"A naghị ebelata ederede ma ọlị, a naghị akọwa ya n'okwu ọzọ ma ọlị, a naghị edegharị ya ma ọlị, a naghịkwa etinye ya n'akụkụ mgbasa ozi ma ọlị. Anyị na-edozi ntụpọ ndị doro anya — okwu dapụrụ, ntụaka mebiri emebi, akara loro otu paragraf — mgbe niile n'ụzọ ihe ebe ahụ n'onwe ya bipụtara, ọ bụghị mgbe ọ bụla n'ụzọ ihe anyị chere na ọ kwesịrị ikwu.",
	'colophon.countBible': 'mbipụta Baịbụl',
	'colophon.countDocuments': 'akwụkwọ Ọrụ Nkuzi Chọọchị',
	'colophon.privacyTitle': 'Nzuzo',
	'colophon.privacyBody1':
		'Ọ dịghị akaụntụ, ọ dịghị kuki, ọ dịghị mgbasa ozi, ọ dịghịkwa koodu ndị ọzọ. Ọ dịghị ihe dị ebe a na-eso gị pụọ na saịtị a.',
	'colophon.privacyBody2':
		'Anyị na-agụta etu e si eji saịtị a: otu nlele kwa nnọ, mpaghara ọ bụla bụ oke kama nkọwa kpọmkwem — ogologo oge ị nọrọ, ugboro ole ị bịaruola ebe a, na ọrụ ndị ị meghere. A na-agụta obodo gị iche, na-enweghị ihe jikọtara ya na ihe ndị ọzọ. Ọ na-akọwa nnọ, ọ bụghị onye bịara, a na-edebekwa ya ruo ụbọchị {days}.',
	'colophon.privacyBody3':
		'Ihe a na-ezigaghị mgbe ọ bụla: ihe ị pịnyere n’igbe nchọgharị, akụkụ ị meghere, ma ọ bụ ihe ọ bụla nwere ike ịmata ngwaọrụ gị ọzọ. Ntọala gị, akara akwụkwọ gị, na ederede ị budatara na-anọgide na ngwaọrụ gị.',
	'colophon.copyrightTitle': 'Ikike nwe ederede',
	'colophon.copyrightBody1':
		'Katekizim, Nchịkọta, na akwụkwọ ndị Ọrụ Nkuzi Chọọchị bụ ihe ndị nwe ikike ha — karịsịa Libreria Editrice Vaticana na Dikasteri maka Nkwurịta Okwu.',
	'colophon.copyrightBody2':
		"Akwụkwọ ọ bụla na-egosi ọkwa ikike nwe ederede nke onye nwe ya, n'okwu ha, ma jikọọ na ibe ebe e si were ya.",
	'colophon.copyrightBody3':
		"Ọ bụrụ na ị nwere ikike n'ederede ọ bụla dị ebe a ma ị chọrọ ka a ghara ibipụta ya, degara anyị akwụkwọ.",
	'colophon.contactTitle': 'Kpọtụrụ anyị',
	'colophon.contactBody': "Maka ihe ọ bụla, tinyere ihe ndị e kwuru n'elu:",
	'colophon.contactPending':
		"A ka edobebeghị adreesị nkwurịta okwu. Ekwesịghị ime saịtị a ka ọha mara tupu o nwee otu — nkwa dị n'elu enweghị isi ma ọ bụrụ na o nweghị ụzọ e si eru anyị aka.",
	'colophon.illustrationsTitle': 'Ihe osise ndị ahụ',
	'colophon.illustrationsBody':
		"Baịbụl na-ebu ihe ọkpụkpụ Gustave Doré, e debere nke ọ bụla n'akụkụ amaokwu ọ na-egosi — nke ikpeazụ na nke kacha ukwuu n'usoro Baịbụl ya, a pịrị ya n'osisi site n'eserese ya, e bipụtara ya na ederede kama ịchịkọta ya n'azụ.",
	'colophon.illustrationsRights':
		"Ha dị n'aka ọha, dịka ụbọchị ndị dị n'okpuru na-egosi, foto e sere nke ọma nke ihe ọkpụkpụ dị n'aka ọha adịghịkwa ebute ikike ọhụrụ nke aka ya.",
	'colophon.countPlates': 'ihe ọkpụkpụ',
	'colophon.countPlateChapters': 'isi nwere ihe osise',
	'plates.scansBy': 'Onye nyere skan ndị a',
	'plates.enlarge': 'Mee {title} ka ọ buo ibu',
	'plates.zoom': 'Zuum',
	'art.about': 'Maka foto a',
	'art.detail': 'akụkụ',
	'colophon.typeTitle': 'Ụdị mkpụrụedemede',
	'colophon.typeBody':
		"E ji EB Garamond dee ya, nke bụ mweghachi Georg Duffner na Octavio Pardo nke mkpụrụedemede Claude Garamont pịrị n'afọ ndị 1590 — omenala mmadụ ahụ Chọọchị ji na-ebipụta kemgbe Renaissance. Mkpụrụedemede Cyrillic ya sitere n'otu aka ahụ mana ọ naghị eweghachi ihe ọ bụla: a pịbeghị Garamond Cyrillic mgbe ọ bụla, ya mere e ji ụdị e sere ka o guzo n'akụkụ ndị ọzọ dee asụsụ Rọshịa.",
	'colophon.typeArabic':
		"Asụsụ Arabik dị kpamkpam n'èzí ike ya, e jikwa Amiri dee ya — mweghachi Khaled Hosny nke naskh a pịrị maka ụlọ obibi akwụkwọ Bulaq na Cairo n'afọ 1905, nke a họọrọ n'otu ihe kpatara e ji họrọ ụdị ederede: otu ụdị akwụkwọ akụkọ ihe mere eme kama eserese nke oge a.",
	'colophon.typeInitials':
		"Mkpụrụedemede mmalite bụ Pirata One, ụdị Gothic nke mkpụrụedemede ukwu ya ka na-apụta ìhè n'ogo mkpụrụedemede mmalite chọrọ, na — maka asụsụ Rọshịa — Ponomar, nke na-eweghachi ụdị Slavonic Chọọchị nke Ụlọ Obibi Akwụkwọ Sinod. Ponomar na-ede mkpụrụedemede mmalite, ọ naghị ede ederede ma ọlị: akwụkwọ ozi ndị ukwu nke oge a e ji ụdị Sinod dee ya niile ga-ekwu ihe na-abụghị eziokwu banyere ihe ọ bụ. E nyere ha niile ikike n'okpuru SIL Open Font License, e si na saịtị a nye ha kama isi n'aka onye ọzọ, ya mere ịgụ otu ibe adịghị arịọ ihe ọ bụla n'aka sava onye ọzọ.",
	'refs.citedIn': 'Ebe a dọtara ya',
	'refs.externalVolume': 'Mpịakọta {volume} na {host} — PDF e sitere na skan',
	'bible.wholeChapter': 'Isi a',
	'bible.verseNotInEdition': 'Nọmba amaokwu a adịghị na mbipụta a — lee nkọwa dị n’ederede peeji a',
	'bible.verseAbbrev': 'am.',
	'bible.note': 'Nkọwa',
	'bible.noteMissing': 'Nkọwa a adịghị n’ihe e chịkọtara',
	'bible.chapterArgument': 'Nchịkọta Isi',
	'ccc.readFullChapter': 'Gụọ isi ahụ dum',
	'ccc.noParagraphNumber': 'Ọ dịghị nọmba paragraf n’ihe e chịkọtara a',
	'copyright.sourceTitle': 'Mepee ibe isi mmalite mbụ',
	'copyright.sourceLabel': 'Isi mmalite',
	'lang.label': 'Asụsụ',
	'lang.filter': 'Chọọ asụsụ',
	'lang.more': 'asụsụ ndị ọzọ',
	'notFound.title': 'Ọ dịghị ihe dị n’adreesị a',
	'notFound.lede': 'Ibe ị chọrọ adịghị ebe a.',
	'notFound.body':
		'Njikọ ahụ nwere ike bụrụ nke e dere ezighi ezi ma ọ bụ nke oge ya agafeela, ma ọ bụ na ọ na-arụtụ aka n’ederede saịtị a na-ebuteghị.',
	'notFound.searchHint':
		'Ọ bụrụ na ị maara nrụtụaka ị chọrọ — akwụkwọ na isi ya, ma ọ bụ paragraf nke Katakizim — pịnye ya n’igbe nchọgharị dị n’elu ibe a.',
	'notFound.credit': 'Dabere na British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Ma ọ bụ malite site n’otu n’ime ndị a:',
	'notFound.home': 'Ụlọ',
	'compare.enter': 'Tụnyere mbipụta',
	'compare.exit': 'Pụọ na ntụnyere',
	'compare.missing': 'Adịghị na mbipụta a',
	'compare.versificationNote':
		'Mbipụta abụọ ndị a na-ekewa amaokwu nke isi a n’ụzọ dị iche n’ebe ụfọdụ (ọdịiche dị n’ederede, ọ bụghị nhọrọ ntụgharị asụsụ) — otu nọmba amaokwu anaghị egosi mgbe niile otu ahịrị n’kọlụm abụọ ahụ.',
	'compare.loading': 'Na-ebugote asụsụ nke abụọ…',
	'ui.close': 'Mechie',
	'shortcuts.title': 'Ụzọ Mkpirisi Bọtịnụ',
	'shortcuts.betweenDocuments': 'N’agbata akwụkwọ ozi',
	'shortcuts.withinDocument': 'N’ime akwụkwọ ozi ahụ',
	'shortcuts.show': 'Gosi ndepụta a',
	'help.title': 'Enyemaka',
	'help.top.heading': "Ogwe dị n'elu peeji ọ bụla",
	'help.reading.heading': "Ogwe dị n'elu ederede",
	'help.feature.search':
		"Pịnye nrụtụaka n'igbe dị n'elu — isi na amaokwu, nọmba paragraf, aha akwụkwọ — ọ na-emecha ya ka ị na-apị.",
	'help.feature.offline':
		"Tinye saịtị a n'ihuenyo mmalite gị, ọ ga-emeghe ka ngwa. Ị nwere ike ibudata ọrụ ndị zuru ezu iji gụọ ha n'enweghị njikọ.",
	'help.feature.contents':
		"Nkewa nke ọrụ ị nọ n'ime ya — akwụkwọ, akụkụ, isi — ka ị nwee ike ịgagharị n'ime ya n'alaghachighị na mmalite.",
	'help.feature.compare':
		"Mbipụta abụọ nke otu akụkụ ahụ, n'akụkụ ibe ha — Latin n'akụkụ asụsụ nke gị, ma ọ bụ otu ntụgharị n'akụkụ ọzọ.",
	'help.feature.apparatus':
		"Ihe odide nke mbipụta n'onwe ya, na nkọwa ọ bụla e dere n'ederede, ka a na-enye n'akụkụ ya ọ bụghị n'okpuru ya. Ihe ndị e hotara n'ime ederede bụ njikọ, ya mere nrụtụaka na-aga ebe ọ na-atụ aka.",
	'help.feature.focus':
		"Na-ewepụ ihe niile ma e wezụga ederede. Ụzọ ọpụpụ na-anọgide ebe ogwe ahụ dịbu, ka ihe ọ bụla ghara ijide n'azụ ya.",
	'zen.enter': 'Ụdị Ntụkwasị Uche',
	'zen.exit': 'Pụọ na Ụdị Ntụkwasị Uche',
	'nav.calendar': 'Kalenda',
	'calendar.title': 'Kalenda Litọjị',
	'calendar.tagline':
		'Kalenda Rome Izugbe, agbakọtara maka ụbọchị ọ bụla — oge ya, ọkwa ya, agba ya.',
	'calendar.calendar': 'Kalenda',
	'calendar.which.general': 'Kalenda Rome Izugbe',
	'calendar.filter': 'Chọọ mba',
	'calendar.region.europe': 'Yurop',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrịka',
	'calendar.region.middleEast': 'Etiti Ọwụwa Anyanwụ',
	'calendar.region.asia': 'Eshia',
	'calendar.region.oceania': 'Oshenia',
	'calendar.today': 'Taa',
	'calendar.previousMonth': 'Ọnwa gara aga',
	'calendar.nextMonth': 'Ọnwa na-esote',
	'calendar.plainDays': 'Naanị Ụbọchị Nkịtị',
	'calendar.noSuchDay': 'Enweghị ụbọchị litọjị a gbakọrọ maka ụbọchị ahụ.',
	'calendar.week': 'izu',
	'calendar.alsoToday': 'A na-emekwa taa',
	'calendar.alsoObserved': 'A na-echetakwa taa',
	'calendar.obligation': 'Ụbọchị mmemme iwu',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Okirikiri Ụbọchị Ụka',
	'calendar.weekdayCycle': 'Okirikiri ụbọchị nkịtị',
	'calendar.psalterWeek': 'Izu Abụ Ọma',
	'lectionary.heading': 'Ihe Ọgụgụ na Missa',
	'lectionary.slot.reading': 'Ọgụgụ',
	'lectionary.slot.reading1': 'Ọgụgụ Nke Mbụ',
	'lectionary.slot.reading2': 'Ọgụgụ Nke Abụọ',
	'lectionary.slot.reading3': 'Ọgụgụ Nke Atọ',
	'lectionary.slot.reading4': 'Ọgụgụ Nke Anọ',
	'lectionary.slot.reading5': 'Ọgụgụ Nke Ise',
	'lectionary.slot.reading6': 'Ọgụgụ Nke Isii',
	'lectionary.slot.reading7': 'Ọgụgụ Nke Asaa',
	'lectionary.slot.psalm': 'Abụ Ọma Nzaghachi',
	'lectionary.slot.epistle': 'Akwụkwọ Ozi',
	'lectionary.slot.acclamation': 'Otuto Oziọma',
	'lectionary.slot.gospel': 'Oziọma',
	'lectionary.slot.sequence': 'Usoro Abụ',
	'lectionary.or': 'ma ọ bụ',
	'lectionary.notScripture': 'ọ bụghị ederede Akwụkwọ Nsọ',
	'lectionary.cf': 'Tụny.',
	'lectionary.about': 'Maka ọgụgụ ndị a',
	'lectionary.caveat':
		'Akụkụ ndị a họpụtara site na Ordo Lectionum Missae, jikọtara ya na mbipụta nke saịtị a n’onwe ya — ọ bụghị ntụgharị asụsụ a na-agụ n’ụka ọ bụla, ma ndị nzukọ ndị bishọp nwere ike ịgbanwe usoro ọgụgụ ahụ.',
	'calendar.transferredFrom': 'E bugharịrị site na',
	'calendar.season.advent': 'Oge Ọbịbịa',
	'calendar.season.christmas': 'Oge Ekeresimesi',
	'calendar.season.lent': 'Oge Nnọ Nri',
	'calendar.season.triduum': 'Ụbọchị Atọ Dị Nsọ',
	'calendar.season.easter': "Oge Mbilite n'Ọnwụ",
	'calendar.season.ordinary': 'Oge Nkịtị',
	'calendar.colour.white': 'Ọcha',
	'calendar.colour.red': 'Uhie',
	'calendar.colour.green': 'Ndụ ndụ',
	'calendar.colour.violet': 'Odo odo',
	'calendar.colour.rose': 'Pinki',
	'calendar.colour.black': 'Oji',
	'calendar.colour.blue': 'Anụnụ',
	'calendar.rank.solemnity': 'Nnukwu Mmemme',
	'calendar.rank.feast': 'Mmemme',
	'calendar.rank.memorial': 'Ncheta',
	'calendar.rank.optional-memorial': 'Ncheta nhọrọ',
	'calendar.rank.commemoration': 'Ichetara',
	'calendar.rank.sunday': 'Ụbọchị Ụka',
	'calendar.rank.weekday': 'Ụbọchị nkịtị',
	'calendar.gloss.season.advent':
		'Izu anọ tupu Ekeresimesi: nkwadebe maka ọbịbịa nke Onyenwe anyị, na mmalite nke afọ nke Chọọchị.',
	'calendar.gloss.season.christmas':
		'Site na Ekeresimesi ruo na Baptizim nke Onyenwe anyị, na-eme ememe ọmụmụ nke Onyenwe anyị na ngosipụta ya nye ụwa.',
	'calendar.gloss.season.lent':
		'Ụbọchị iri anọ site na Wenezdee Ntụ ruo na Emume Abalị nke Nri Anyasị Onyenwe anyị: nchegharị, inye onyinye, na nkwadebe maka Ista.',
	'calendar.gloss.season.triduum':
		'Ụbọchị atọ site na mgbede Tọzdee Dị Nsọ ruo na mgbede Sọnde Ista — ahụhụ, ọnwụ na mbilite n’ọnwụ nke Onyenwe anyị, na elu kacha elu nke afọ dum.',
	'calendar.gloss.season.easter':
		'Ụbọchị iri ise site na Ista ruo na Pentikost, nke a na-eme dịka otu ememe — „otu nnukwu Sọnde“.',
	'calendar.gloss.season.ordinary':
		'Izu iri atọ na atọ ma ọ bụ iri atọ na anọ nke dị n’èzí oge ndị ọzọ. Ọ bụghị „nkịtị“ kama e hazichara ya: a na-agụ izu ndị ahụ ọnụ, Chọọchị na-agụkwa ndụ na nkuzi Onyenwe anyị n’usoro. Ọ na-abịa n’akụkụ abụọ — mgbe oge Ekeresimesi gasịrị ruo Nnukwu Obubu Ọnụ, na mgbe Pentikost gasịrị ruo oge Advent.',
	'calendar.gloss.rank.solemnity':
		'Ọkwa kacha elu: Ista, Ekeresimesi, Ịrịgo Elu, onye nlekọta nke ebe. A na-eme ya na Otuto na Nkwenye, ọ na-amalitekwa n’abalị bu ya ụzọ.',
	'calendar.gloss.rank.feast':
		'A na-eme ya n’ime ụbọchị ahụ n’onwe ya. Ndịozi na ndị ode oziọma, na ụbọchị ndị ka ukwuu nke Onyenwe anyị na nke Nne anyị.',
	'calendar.gloss.rank.memorial':
		'Onye nsọ nke a na-echeta n’ụbọchị ya, n’ime Emume na Ekpere Awa nke oge ahụ. Ọ bụ iwu ebe ọ bụla a na-eme ya.',
	'calendar.gloss.rank.optional-memorial':
		'Enwere ike ime ya ma ọ bụ ghara ime ya, dịka ụkọchukwu ma ọ bụ ọgbakọ họọrọ. Ọ bụrụ na e meghị ya, ụbọchị ahụ bụ nanị ụbọchị nkịtị.',
	'calendar.gloss.rank.commemoration':
		'Ihe ncheta na-aghọ n’oge Nnukwu Obubu Ọnụ: ekpere e tinyekwuru na Emume nke ụbọchị nkịtị, nke oge ahụ na-echekwa ndị fọdụrụ n’uju ya.',
	'calendar.gloss.rank.sunday':
		'Ememe mbụ — Ụbọchị Onyenwe anyị, nke a na-eme kwa izu kemgbe mbilite n’ọnwụ. Naanị ememe ukwu ma ọ bụ ememe nke Onyenwe anyị nwere ike ịnọchi ya, na n’oge Advent, Nnukwu Obubu Ọnụ na oge Ista ọ bụladị ha enweghị ike.',
	'calendar.gloss.rank.weekday':
		'Ụbọchị na-enweghị ememe nke ya. Emume na Ekpere Awa bụ nke oge ahụ — nke ahụ mere oge ji bụrụ ihe kwesịrị ịmata.',
	'calendar.gloss.colour.white':
		'Ọṅụ. Oge Ista na oge Ekeresimesi, ụbọchị Onyenwe anyị na-abụghị nke ahụhụ ya, Nne anyị, ndị mmụọ ozi, na ndị nsọ na-abụghị ndị mgbochitaram.',
	'calendar.gloss.colour.red':
		'Ọbara na ọkụ. Sọnde Igu na Fraịdee Dị Nsọ, Pentikost, ndịozi na ndị ode oziọma, na ndị mgbochitaram.',
	'calendar.gloss.colour.green': 'Oge Nkịtị: agba nke olileanya, na nke ihe na-eto eto.',
	'calendar.gloss.colour.violet':
		'Advent na Nnukwu Obubu Ọnụ, a na-eyikwa ya na Emume maka ndị nwụrụ anwụ.',
	'calendar.gloss.colour.rose':
		'A na-eyi ya ugboro abụọ n’afọ — Sọnde Gaudete, nke atọ nke Advent, na Sọnde Laetare, nke anọ nke Nnukwu Obubu Ọnụ — ebe obubu ọnụ na-adị mfe, njedebe na-apụtakwa ìhè.',
	'calendar.gloss.colour.black': 'Enwere ike iyi ya na Emume maka ndị nwụrụ anwụ.',
	'calendar.gloss.colour.blue':
		'Ihe ùgwù nke acha anụnụ anụnụ: a na-eyi ya n’ememe Nchụta Na-enweghị Ntụpọ na Spen, na Filipin, na ebe ole na ole ndị ọzọ Oche Nsọ nyere ya.',
	'calendar.gloss.sundayCycle':
		'Ọgụgụ Sọnde na-agba afọ atọ — A, B na C — na-agụ Matiu, Mak na Luk n’otu n’otu, ya na Jọn n’oge Nnukwu Obubu Ọnụ na oge Ista. Okirikiri ahụ na-atụgharị na Sọnde mbụ nke Advent, ya na afọ nke Chọọchị.',
	'calendar.gloss.weekdayCycle':
		'Ọgụgụ ụbọchị nkịtị na-agba afọ abụọ, I na II: ọgụgụ mbụ na-agbanwe, Oziọma anaghị agbanwe. A na-akpọ afọ ememe aha afọ kalenda nke ọ na-akwụsị na ya — afọ ndị na-abụghị abụọ abụọ bụ I, ndị bụ abụọ abụọ bụ II.',
	'calendar.gloss.psalterWeek':
		'Ekpere Awa na-ekesa abụ ọma n’izu anọ, I ruo IV, nke na-emeghachi n’afọ dum. Nke a bụ izu nke abụ ọma ya bụ nke taa, maka onye ọ bụla na-ekpe Ekpere Awa.',
	'calendar.gloss.obligation':
		'Ụbọchị nke ndị kwere ekwe ji n’aka ịsonye na Emume na ịzere ọrụ ndị ga-egbochi ya. Sọnde ọ bụla, na ụbọchị ndị ọzọ nke ọgbakọ ndị bishọp nke ọ bụla kpebiri.',
	'calendar.primer.title': 'Ọ bụ nke mbụ gị?',
	'calendar.primer.lead':
		'Chọọchị na-edobe afọ nke ya. Ọ na-amalite na Advent, na-atụgharị gburugburu Ista, ma na-enye ụbọchị ọ bụla aha, ọkwa na agba — ndị a na-ekpebikwa ihe a na-ekpe n’ekpere ma gụọ n’ụbọchị ahụ n’Emume na n’Ekpere Awa. Ya mere „Sọnde nke iri abụọ na atọ n’Oge Nkịtị“ bụ adreesị: ọ na-agwa ụkọchukwu, ndị ọbụ abụ, ma ọ bụ onye ọ bụla na-ekpe ekpere n’ụlọ, ekpere na ọgụgụ ndị bụ nke taa.',
	'calendar.primer.seasons': 'Oge ndị ahụ',
	'calendar.primer.ranks': 'Ihe ụbọchị nwere ike ịbụ',
	'calendar.primer.colours': 'Agba ndị ahụ',
	'calendar.primer.cycles': 'Okirikiri ndị ahụ',
	'calendar.primer.cyclesLead': 'Ihe ọnụọgụ atọ nke, n’ọnụ, na-ekwu ọgụgụ na abụ ọma e debeere taa.'
};
