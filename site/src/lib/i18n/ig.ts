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
 * `docs/decisions.md`. The confidence note below governs
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
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
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
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Gaa n’ihu ịgụ',
	'home.works': 'Ọbá akwụkwọ',
	'home.ccc.heading': 'Katakizim na Nchịkọta',
	'home.magisterium.mostRecent': 'Ọhụrụ',
	'home.prayers.heading': 'Ekpere',
	'unitNav.previous': 'Nke gara aga',
	'unitNav.next': 'Nke ọzọ',
	'bible.landing.title': 'Baịbụl',
	'bible.landing.tagline': 'Gụọ Baịbụl niile, akwụkwọ n’akwụkwọ, isi n’isi.',
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
	'ccc.landing.title': 'Katakizim nke Chọọchị Katọlik',
	'ccc.landing.tagline':
		'<strong>Katakizim</strong> na-akọwa ozizi Katọlik n’ime paragraf 2,865 e nyere nọmba. <strong>Nchịkọta</strong> na-ekwughachi otu ozizi ahụ dịka ajụjụ na azịza 598, n’otu usoro ahụ.',
	'document.library.tagline':
		'Ensaịklikal, iwu kansụl, iwu nyefere, na nkwupụta nke Nkuzi Chọọchị.',
	'doctores.landing.title': 'Ndị Ozizi Chọọchị',
	'doctores.landing.tagline': 'Ọrụ nkà mmụta okpukpe nke Ndị Nna na Ndị Ozizi Chọọchị.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tọmas Akwịnas, n’asụsụ Bekee na n’asụsụ Latin o ji dee.',
	'prayers.landing.title': 'Ekpere Nkịtị',
	'prayers.landing.tagline': 'Ekpere ya na ederede Latin n’akụkụ ya.',
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
	'colophon.typeTitle': 'Ụdị mkpụrụedemede',
	'colophon.typeBody':
		"E ji EB Garamond dee ya, nke bụ mweghachi Georg Duffner na Octavio Pardo nke mkpụrụedemede Claude Garamont pịrị n'afọ ndị 1590 — omenala mmadụ ahụ Chọọchị ji na-ebipụta kemgbe Renaissance. Mkpụrụedemede Cyrillic ya sitere n'otu aka ahụ mana ọ naghị eweghachi ihe ọ bụla: a pịbeghị Garamond Cyrillic mgbe ọ bụla, ya mere e ji ụdị e sere ka o guzo n'akụkụ ndị ọzọ dee asụsụ Rọshịa.",
	'colophon.typeArabic':
		"Asụsụ Arabik dị kpamkpam n'èzí ike ya, e jikwa Amiri dee ya — mweghachi Khaled Hosny nke naskh a pịrị maka ụlọ obibi akwụkwọ Bulaq na Cairo n'afọ 1905, nke a họọrọ n'otu ihe kpatara e ji họrọ ụdị ederede: otu ụdị akwụkwọ akụkọ ihe mere eme kama eserese nke oge a.",
	'colophon.typeInitials':
		"Mkpụrụedemede mmalite bụ Pirata One, ụdị Gothic nke mkpụrụedemede ukwu ya ka na-apụta ìhè n'ogo mkpụrụedemede mmalite chọrọ, na — maka asụsụ Rọshịa — Ponomar, nke na-eweghachi ụdị Slavonic Chọọchị nke Ụlọ Obibi Akwụkwọ Sinod. Ponomar na-ede mkpụrụedemede mmalite, ọ naghị ede ederede ma ọlị: akwụkwọ ozi ndị ukwu nke oge a e ji ụdị Sinod dee ya niile ga-ekwu ihe na-abụghị eziokwu banyere ihe ọ bụ. E nyere ha niile ikike n'okpuru SIL Open Font License, e si na saịtị a nye ha kama isi n'aka onye ọzọ, ya mere ịgụ otu ibe adịghị arịọ ihe ọ bụla n'aka sava onye ọzọ."
};
