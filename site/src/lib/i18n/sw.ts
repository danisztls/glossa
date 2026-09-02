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
 * `docs/decisions.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` (the canonical standing statement, Can. 216
 * CIC) and `colophon.copyrightBody3` (how a rights holder reaches us) are the
 * two to check first: both are operative rather than descriptive. What is
 * here is the chrome -- including every key `CHROME_KEYS` requires, since an
 * unnamed chrome page fails the sync rather than falling back.
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

export const sw: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Katekisimu',
	'nav.compendium': 'Muhtasari',
	'nav.magisterium': 'Mafundisho ya Kanisa',
	'nav.socialDoctrine': 'Mafundisho ya kijamii',
	'socialDoctrine.landing.title': 'Muhtasari wa Mafundisho ya Kijamii ya Kanisa',
	'socialDoctrine.landing.tagline':
		'Kile Kanisa linafundisha kuhusu maisha ya kijamii, katika aya 583.',
	'nav.prayers': 'Sala',
	'nav.bookmarks': 'Alamisho',
	'nav.menu': 'Menyu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Endelea kusoma',
	'home.works': 'Maktaba',
	'home.ccc.heading': 'Katekisimu na Muhtasari',
	'home.magisterium.mostRecent': 'Mpya zaidi',
	'home.prayers.heading': 'Sala',
	'unitNav.previous': 'Iliyotangulia',
	'unitNav.next': 'Inayofuata',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Soma Biblia nzima, kitabu kwa kitabu, sura kwa sura.',
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
	'ccc.landing.title': 'Katekisimu ya Kanisa Katoliki',
	'ccc.landing.tagline':
		'<strong>Katekisimu</strong> inaeleza mafundisho ya Kikatoliki katika aya 2,865 zenye namba. <strong>Muhtasari</strong> unaeleza mafundisho hayo hayo kwa maswali na majibu 598, kwa mpangilio uleule.',
	'document.library.tagline':
		'Waraka wa kipapa, katiba za mtaguso, amri na matamko ya Mafundisho ya Kanisa.',
	'doctores.landing.title': 'Walimu wa Kanisa',
	'doctores.landing.tagline': 'Kazi za kitaalimungu za Mababa na Walimu wa Kanisa.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tomaso wa Akwino, kwa Kiingereza na kwa Kilatini alichoandika.',
	'prayers.landing.title': 'Sala za Kawaida',
	'prayers.landing.tagline': 'Sala pamoja na maandishi ya Kilatini kando.',
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
	'colophon.textsTitle': 'Maandiko',
	'colophon.textsBody':
		'Kila maandishi yanatoka katika chanzo kilichotajwa, na kila kazi inaandika toleo lake, ukurasa wake wa chanzo na tarehe iliyochukuliwa. Maandiko Matakatifu hutumia tafsiri zilizo katika umiliki wa umma; Katekisimu, Kompendiamu na nyaraka za Mafundisho ya Kanisa hutoka katika maandiko yaliyochapishwa na Kiti Kitakatifu chenyewe.',
	'colophon.textsFidelity':
		'Maandishi hayafupishwi kamwe, hayafafanuliwi upya kamwe, hayaandikwi upya kamwe, wala hayawekwi kamwe kando ya matangazo. Hata hivyo tunarekebisha kasoro dhahiri — neno lililoanguka, marejeo yaliyoharibika, alama zilizomeza aya — daima kuelekea kile chanzo chenyewe kinachochapisha, kamwe si kuelekea kile tunachofikiri kingepaswa kusema.',
	'colophon.countBible': 'matoleo ya Biblia',
	'colophon.countDocuments': 'nyaraka za Mafundisho ya Kanisa',
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
	'colophon.typeTitle': 'Herufi',
	'colophon.typeBody':
		'Imepangwa kwa EB Garamond, ufufuo wa Georg Duffner na Octavio Pardo wa herufi alizochonga Claude Garamont miaka ya 1590 — mapokeo ya kibinadamu ambayo Kanisa limekuwa likichapisha kwayo tangu Renaissance. Herufi zake za Kikirili ni za mikono ileile lakini hazifufui chochote: hakuna Garamond ya Kikirili iliyowahi kuchongwa, kwa hiyo Kirusi kimepangwa kwa umbo lililochorwa ili kusimama kando ya nyingine.',
	'colophon.typeArabic':
		'Kiarabu kiko nje ya uwezo wake kabisa, na kimepangwa kwa Amiri — ufufuo wa Khaled Hosny wa naskh iliyochongwa kwa ajili ya mtambo wa Bulaq huko Cairo mwaka 1905, iliyochaguliwa kwa sababu ileile ya herufi za maandishi: aina mahususi ya kihistoria ya kitabu badala ya mchoro wa kisasa.',
	'colophon.typeInitials':
		'Herufi za mwanzo ni Pirata One, herufi za Kigothi ambazo herufi zake kubwa hubaki kusomeka katika ukubwa ambao herufi ya kwanza inahitaji, na — kwa Kirusi — Ponomar, ambayo huiga herufi ya Kislavoni cha Kanisa ya Mtambo wa Sinodi. Ponomar hupanga herufi ya kwanza na kamwe si maandishi: waraka wa kisasa uliopangwa wote kwa herufi ya Sinodi ungesema jambo lisilo kweli kuhusu ulivyo. Zote zina leseni chini ya SIL Open Font License na hutolewa kutoka tovuti hii badala ya kutoka kwa mtu wa tatu, hivyo kusoma ukurasa hakuombi chochote kutoka kwa seva ya mtu mwingine.'
};
