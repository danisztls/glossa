/**
 * മലയാളം UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in മലയാളം, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, Kerala, home of the Syro-Malabar and Syro-Malankara Catholic churches. A reader gets their own chrome and English
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
 * TRANSLATION CONFIDENCE: LOW. Written by an LLM with no native reader in
 * the loop, and this is one of the five languages where that is most
 * likely to show — Malayalam Catholic vocabulary is Syro-Malabar and Syro-
 * Malankara usage, which differs from both Latin-rite and secular
 * Malayalam. Treat every string here as a proposal. Correcting one is a
 * one-line change and needs no permission; because `t()` falls back to
 * English per key, DELETING a doubtful line is also a valid fix and
 * strictly better than leaving a wrong one standing.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const ml: Dictionary = {
	'nav.bible': 'ബൈബിൾ',
	'nav.ccc': 'മതബോധനം',
	'nav.compendium': 'സംഗ്രഹം',
	'nav.magisterium': 'സഭയുടെ പ്രബോധനാധികാരം',
	'nav.socialDoctrine': 'സാമൂഹിക പ്രബോധനം',
	'socialDoctrine.landing.title': 'സഭയുടെ സാമൂഹിക പ്രബോധന സംഗ്രഹം',
	'socialDoctrine.landing.tagline': 'സമൂഹജീവിതത്തെക്കുറിച്ചു സഭ പഠിപ്പിക്കുന്നത്, 583 ഖണ്ഡികകളിൽ.',
	'nav.prayers': 'പ്രാർഥനകൾ',
	'nav.bookmarks': 'ബുക്ക്‌മാർക്കുകൾ',
	'nav.menu': 'മെനു',
	'nav.summa': 'സുമ്മ',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'വായന തുടരുക',
	'home.works': 'ഗ്രന്ഥശാല',
	'home.ccc.heading': 'മതബോധനവും സംഗ്രഹവും',
	'home.magisterium.mostRecent': 'ഏറ്റവും പുതിയത്',
	'home.prayers.heading': 'പ്രാർഥനകൾ',
	'unitNav.previous': 'മുമ്പത്തേത്',
	'unitNav.next': 'അടുത്തത്',
	'bible.landing.title': 'ബൈബിൾ',
	'bible.landing.tagline': 'ബൈബിൾ മുഴുവൻ വായിക്കുക, പുസ്തകം പുസ്തകമായി, അധ്യായം അധ്യായമായി.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'പഞ്ചഗ്രന്ഥി',
	'bible.group.historical': 'ചരിത്രഗ്രന്ഥങ്ങൾ',
	'bible.group.wisdom': 'ജ്ഞാനഗ്രന്ഥങ്ങൾ',
	'bible.group.prophetic': 'പ്രവാചകഗ്രന്ഥങ്ങൾ',
	'bible.group.gospels': 'സുവിശേഷങ്ങൾ',
	'bible.group.acts': 'അപ്പസ്തോലപ്രവർത്തനങ്ങൾ',
	'bible.group.pauline': 'പൗലോസിന്റെ ലേഖനങ്ങൾ',
	'bible.group.catholicLetters': 'കത്തോലിക്കാ ലേഖനങ്ങൾ',
	'bible.group.revelation': 'വെളിപാട്',
	'ccc.landing.title': 'കത്തോലിക്കാ സഭയുടെ മതബോധനഗ്രന്ഥം',
	'ccc.landing.tagline':
		'<strong>മതബോധനഗ്രന്ഥം</strong> കത്തോലിക്കാ പ്രബോധനം 2,865 അക്കമിട്ട ഖണ്ഡികകളിൽ അവതരിപ്പിക്കുന്നു. <strong>സംഗ്രഹം</strong> അതേ പ്രബോധനം അതേ ക്രമത്തിൽ 598 ചോദ്യോത്തരങ്ങളായി അവതരിപ്പിക്കുന്നു.',
	'document.library.tagline':
		'ചാക്രികലേഖനങ്ങൾ, സൂനഹദോസ് പ്രമാണങ്ങൾ, ഡിക്രികൾ, സഭയുടെ പ്രഖ്യാപനങ്ങൾ.',
	'doctores.landing.title': 'സഭാവേദപാരംഗതർ',
	'doctores.landing.tagline': 'സഭാപിതാക്കന്മാരുടെയും വേദപാരംഗതരുടെയും ദൈവശാസ്ത്ര കൃതികൾ.',
	'summa.landing.title': 'സുമ്മ തെയോളോജിയേ',
	'summa.landing.tagline': 'തോമസ് അക്വീനാസ്, ഇംഗ്ലീഷിലും അദ്ദേഹം എഴുതിയ ലത്തീനിലും.',
	'prayers.landing.title': 'സാധാരണ പ്രാർഥനകൾ',
	'prayers.landing.tagline': 'ലത്തീൻ പാഠത്തോടൊപ്പമുള്ള പ്രാർഥനകൾ.',
	'colophon.title': 'കോളഫോൺ',
	'colophon.lede':
		'ഈ സൈറ്റ് എന്താണ്, അതിലെ പാഠങ്ങൾ എവിടെനിന്നു വരുന്നു, അവ പുനഃപ്രസിദ്ധീകരിക്കുന്നതിൽ നമ്മുടെ നിലപാട്.',
	'colophon.whatThisIs': 'ഇത് എന്താണ്',
	'colophon.whatThisIsBody':
		'വിശുദ്ധ ഗ്രന്ഥം, മതബോധനഗ്രന്ഥം, സംഗ്രഹം, പ്രബോധനാധികാരത്തിന്റെ രേഖകൾ എന്നിവ ഇംഗ്ലീഷിലും പോർച്ചുഗീസിലും ലത്തീനിലും വായിക്കാനുള്ള ഒരു ഇടമാണ് ഗ്ലോസ്സാ കത്തോലിക്ക. വായിക്കപ്പെടാൻ വേണ്ടിയാണ് ഇതു നിലകൊള്ളുന്നത്; ഇതു വായിക്കാൻ നിങ്ങളിൽ നിന്നു മറ്റൊന്നും ആവശ്യപ്പെടുന്നില്ല:',
	'colophon.pointFree':
		'സൗജന്യം, എന്നും സൗജന്യം. പണം നൽകേണ്ട തടസ്സമില്ല, വരിസംഖ്യയില്ല, വാങ്ങാൻ ഒന്നുമില്ല.',
	'colophon.pointNoAds': 'പരസ്യങ്ങളില്ല, ഒരുതരത്തിലുമുള്ള സ്പോൺസർ ചെയ്ത ഉള്ളടക്കവുമില്ല.',
	'colophon.pointNoAccounts':
		'അക്കൗണ്ടുകളില്ല. രജിസ്റ്റർ ചെയ്യാൻ ഒന്നുമില്ല, ലോഗിൻ ചെയ്യാൻ ഒന്നുമില്ല.',
	'colophon.pointNoTracking':
		'പിന്തുടരുന്ന സ്ക്രിപ്റ്റുകളില്ല, മൂന്നാം കക്ഷിയുടെ കോഡില്ല, കുക്കികളില്ല. പേരു വെളിപ്പെടുത്താത്ത ഉപയോഗക്കണക്കുകൾ മാത്രം, നിങ്ങളെ തിരിച്ചറിയിക്കുന്ന ഒന്നുമില്ലാതെ.',
	'colophon.pointOffline':
		'ഒരിക്കൽ സന്ദർശിച്ചാൽ ഇന്റർനെറ്റില്ലാതെയും പ്രവർത്തിക്കുംവിധം നിർമ്മിച്ചിരിക്കുന്നു, ദുർബലമായ ബന്ധം വായനയ്ക്കു തടസ്സമാകാതിരിക്കാൻ.',
	'colophon.whatThisIsStanding':
		'ഗ്ലോസ്സാ കത്തോലിക്ക അല്മായ വിശ്വാസികളുടെ ഒരു സ്വകാര്യ സംരംഭമാണ്. ഇതിന് സഭാപരമായ യാതൊരു അംഗീകാരവുമില്ല; സ്വന്തമായ യാതൊരു അധികാരത്തിലും ഇതു സംസാരിക്കുന്നില്ല.',
	'colophon.textsTitle': 'വാചകങ്ങൾ',
	'colophon.textsBody':
		'ഓരോ വാചകവും പേരു സൂചിപ്പിച്ച ഉറവിടത്തിൽ നിന്നു വരുന്നു; ഓരോ കൃതിയും അതിന്റെ പതിപ്പ്, ഉറവിടത്താൾ, എടുത്ത തീയതി എന്നിവ രേഖപ്പെടുത്തുന്നു. വിശുദ്ധ ഗ്രന്ഥത്തിനു പൊതുസഞ്ചയത്തിലുള്ള പരിഭാഷകൾ ഉപയോഗിക്കുന്നു; മതബോധനഗ്രന്ഥവും സംഗ്രഹവും പ്രബോധനാധികാരത്തിന്റെ രേഖകളും പരിശുദ്ധ സിംഹാസനം തന്നെ പ്രസിദ്ധീകരിച്ച വാചകങ്ങളിൽ നിന്നു വരുന്നു.',
	'colophon.textsFidelity':
		'വാചകം ഒരിക്കലും ചുരുക്കുന്നില്ല, ഒരിക്കലും സ്വന്തം വാക്കുകളിൽ പറയുന്നില്ല, ഒരിക്കലും തിരുത്തിയെഴുതുന്നില്ല, ഒരിക്കലും പരസ്യത്തിനരികെ വയ്ക്കുന്നില്ല. വ്യക്തമായ പിഴവുകൾ ഞങ്ങൾ തിരുത്തുന്നുണ്ട് — വീണുപോയ ഒരു വാക്ക്, കേടായ ഒരു ഉദ്ധരണി, ഒരു ഖണ്ഡിക വിഴുങ്ങിയ അടയാളപ്പെടുത്തൽ — എപ്പോഴും ഉറവിടം തന്നെ അച്ചടിക്കുന്നതിലേക്ക്, ഒരിക്കലും അതു പറയേണ്ടിയിരുന്നു എന്നു ഞങ്ങൾ കരുതുന്നതിലേക്കല്ല.',
	'colophon.countBible': 'ബൈബിൾ പതിപ്പുകൾ',
	'colophon.countDocuments': 'പ്രബോധനാധികാര രേഖകൾ',
	'colophon.copyrightTitle': 'പകർപ്പവകാശം',
	'colophon.copyrightBody1':
		'മതബോധനഗ്രന്ഥവും സംഗ്രഹവും പ്രബോധനാധികാരത്തിന്റെ രേഖകളും അവയുടെ അവകാശികളുടെ സ്വത്താണ് — മുഖ്യമായും Libreria Editrice Vaticana-യുടെയും വിനിമയത്തിനുള്ള ഡികാസ്റ്ററിയുടെയും.',
	'colophon.copyrightBody2':
		'ഓരോ കൃതിയും അതിന്റെ അവകാശിയുടെ സ്വന്തം പകർപ്പവകാശ അറിയിപ്പ് അവരുടെ വാക്കുകളിൽത്തന്നെ കാണിക്കുന്നു, എടുത്ത താളിലേക്കു കണ്ണി ചേർക്കുകയും ചെയ്യുന്നു.',
	'colophon.copyrightBody3':
		'ഇവിടെയുള്ള ഏതെങ്കിലും വാചകത്തിൽ നിങ്ങൾക്ക് അവകാശമുണ്ടെങ്കിൽ, അതു പ്രസിദ്ധീകരിക്കാതിരിക്കാനാണു നിങ്ങൾ ആഗ്രഹിക്കുന്നതെങ്കിൽ, ഞങ്ങൾക്ക് എഴുതുക.',
	'colophon.contactTitle': 'ബന്ധപ്പെടുക',
	'colophon.contactBody': 'എന്തിനും, മുകളിൽ പറഞ്ഞതുൾപ്പെടെ:',
	'colophon.contactPending':
		'ബന്ധപ്പെടാനുള്ള വിലാസം ഇതുവരെ നിശ്ചയിച്ചിട്ടില്ല. അതു ലഭിക്കുന്നതുവരെ ഈ ഇടം പരസ്യമാക്കരുത് — ഞങ്ങളിലേക്ക് എത്താൻ ഒരു വഴിയില്ലാതെ മുകളിലെ വാഗ്ദാനത്തിന് അർത്ഥമില്ല.',
	'colophon.illustrationsTitle': 'ചിത്രങ്ങൾ',
	'colophon.illustrationsBody':
		'ബൈബിളിൽ ഗുസ്താവ് ദോറെയുടെ കൊത്തുപണികളുണ്ട്, ഓരോന്നും അതു ചിത്രീകരിക്കുന്ന വാക്യത്തിനരികെ വച്ചിരിക്കുന്നു — അദ്ദേഹത്തിന്റെ ബൈബിൾ പരമ്പരകളിൽ അവസാനത്തേതും ഏറ്റവും വലുതും, അദ്ദേഹത്തിന്റെ രേഖാചിത്രങ്ങളിൽ നിന്നു മരത്തിൽ കൊത്തി, അവസാനം ഒരുമിച്ചു ചേർക്കാതെ വാചകത്തോടൊപ്പം അച്ചടിച്ചത്.',
	'colophon.illustrationsRights':
		'താഴെയുള്ള തീയതികൾ കാണിക്കുന്നതുപോലെ അവ പൊതുസഞ്ചയത്തിലാണ്; പൊതുസഞ്ചയത്തിലുള്ള ഒരു കൊത്തുപണിയുടെ വിശ്വസ്തമായ ഛായാഗ്രഹണ പകർപ്പിനു സ്വന്തമായ പുതിയ പകർപ്പവകാശമില്ല.',
	'colophon.countPlates': 'കൊത്തുപണികൾ',
	'colophon.countPlateChapters': 'ചിത്രങ്ങളുള്ള അധ്യായങ്ങൾ',
	'colophon.typeTitle': 'അക്ഷരരൂപം',
	'colophon.typeBody':
		'1590-കളിൽ ക്ലോദ് ഗാരമോൻ കൊത്തിയ അക്ഷരങ്ങളുടെ ഗിയോർഗ് ഡുഫ്നറും ഒക്താവിയോ പാർദോയും നടത്തിയ പുനരുജ്ജീവനമായ EB Garamond-ൽ അച്ചുനിരത്തിയിരിക്കുന്നു — നവോത്ഥാനകാലം മുതൽ സഭ അച്ചടിച്ചുപോരുന്ന മാനവിക പാരമ്പര്യം. അതിന്റെ സിറിലിക് അതേ കൈകളുടേതാണെങ്കിലും ഒന്നിനെയും പുനരുജ്ജീവിപ്പിക്കുന്നില്ല: സിറിലിക് ഗാരമോൻ ഒരിക്കലും കൊത്തിയിട്ടില്ല, അതിനാൽ റഷ്യൻ ബാക്കിയുള്ളവയ്ക്കൊപ്പം നിൽക്കാൻ വരച്ച ഒരു രൂപത്തിലാണ് അച്ചുനിരത്തിയിരിക്കുന്നത്.',
	'colophon.typeArabic':
		'അറബി അതിന്റെ പരിധിക്കു തീർത്തും പുറത്താണ്, അത് Amiri-യിൽ അച്ചുനിരത്തിയിരിക്കുന്നു — 1905-ൽ കൈറോയിലെ ബൂലാഖ് അച്ചുകൂടത്തിനായി കൊത്തിയ നസ്ഖ് ലിപിയുടെ ഖാലിദ് ഹോസ്നി നടത്തിയ പുനരുജ്ജീവനം, വാചക അക്ഷരരൂപത്തിന്റെ അതേ ന്യായത്തിൽ തിരഞ്ഞെടുത്തത്: സമകാലിക രേഖാചിത്രമല്ല, ഒരു പ്രത്യേക ചരിത്രപരമായ ഗ്രന്ഥാക്ഷരം.',
	'colophon.typeInitials':
		'ആരംഭാക്ഷരങ്ങൾ Pirata One ആണ്, ഒരു ഗോഥിക് ലിപി; ആരംഭാക്ഷരം ആവശ്യപ്പെടുന്ന വലുപ്പത്തിലും അതിന്റെ വലിയ അക്ഷരങ്ങൾ വായിക്കാനാകും. റഷ്യനു വേണ്ടി Ponomar — സിനഡൽ അച്ചുകൂടത്തിന്റെ സഭാ സ്ലാവോണിക് അക്ഷരരൂപം പുനഃസൃഷ്ടിക്കുന്നത്. Ponomar ആരംഭാക്ഷരം മാത്രം അച്ചുനിരത്തുന്നു, ഒരിക്കലും വാചകമല്ല: ആദ്യന്തം സിനഡൽ അക്ഷരത്തിൽ അച്ചുനിരത്തിയ ഒരു ആധുനിക ചാക്രികലേഖനം അതെന്താണെന്നതിനെക്കുറിച്ച് സത്യമല്ലാത്ത ഒന്നു പറയും. എല്ലാം SIL Open Font License പ്രകാരം അനുമതിയുള്ളവയാണ്; മൂന്നാം കക്ഷിയിൽ നിന്നല്ല, ഈ ഇടത്തിൽ നിന്നുതന്നെ നൽകുന്നു, അതിനാൽ ഒരു താൾ വായിക്കുന്നത് മറ്റാരുടെയും സെർവറിനോട് ഒന്നും ആവശ്യപ്പെടുന്നില്ല.'
};
