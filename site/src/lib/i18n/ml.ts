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
 * likely to show — Malayalam Catholic vocabulary is Syro-Malabar and Syro-
 * Malankara usage, which differs from both Latin-rite and secular
 * Malayalam. Treat every string here as a proposal. Correcting one is a
 * one-line change and needs no permission; because `t()` falls back to
 * English per key, DELETING a doubtful line is also a valid fix and
 * strictly better than leaving a wrong one standing.
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

export const ml: Dictionary = {
	'nav.bible': 'ബൈബിൾ',
	'nav.ccc': 'മതബോധനം',
	'nav.compendium': 'സംഗ്രഹം',
	'nav.magisterium': 'സഭയുടെ പ്രബോധനാധികാരം',
	'nav.socialDoctrine': 'സാമൂഹിക പ്രബോധനം',
	'socialDoctrine.landing.title': 'സഭയുടെ സാമൂഹിക പ്രബോധന സംഗ്രഹം',
	'socialDoctrine.landing.tagline': 'സമൂഹജീവിതത്തെക്കുറിച്ചു സഭ പഠിപ്പിക്കുന്നത്, 583 ഖണ്ഡികകളിൽ.',
	'nav.canonLaw': 'കാനൻ നിയമം',
	'canonLaw.landing.title': 'കാനൻ നിയമസംഹിത',
	'canonLaw.landing.tagline': 'ലത്തീൻ സഭയുടെ നിയമം, ഏഴു ഗ്രന്ഥങ്ങളിലായി 1752 കാനോനുകളിൽ.',
	'canonLaw.canon': 'കാ.',
	'canonLaw.canons': 'കാ.',
	'canonLaw.prevCanon': 'മുൻ കാനോൻ',
	'canonLaw.nextCanon': 'അടുത്ത കാനോൻ',
	'canonLaw.readFullTitle': 'ശീർഷകം മുഴുവൻ വായിക്കുക',
	'canonLaw.superseded': 'ഈ രേഖ പകരം വച്ച പാഠം',
	'nav.prayers': 'പ്രാർഥനകൾ',
	'nav.bookmarks': 'ബുക്ക്‌മാർക്കുകൾ',
	'nav.menu': 'മെനു',
	'nav.sections': 'വിഭാഗങ്ങൾ',
	'nav.works': 'കൃതികൾ',
	'nav.pages': 'താളുകൾ',
	'nav.summa': 'സുമ്മ',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'വായന തുടരുക',
	'home.tagline':
		'വിശുദ്ധ ഗ്രന്ഥവും മതബോധനഗ്രന്ഥവും പ്രബോധനാധികാരത്തിന്റെ രേഖകളും വായിക്കാനുള്ള ഇടം — സൗജന്യം, ഇന്റർനെറ്റില്ലാതെയും പ്രവർത്തിക്കുന്നു, രജിസ്റ്റർ ചെയ്യാൻ ഒന്നുമില്ല.',
	'home.doors.heading': 'എവിടേക്കു പോകാം',
	'home.find.heading': 'അല്ലെങ്കിൽ ഒരു പരാമർശം ടൈപ്പു ചെയ്യുക',
	'nav.library': 'ഗ്രന്ഥശാല',
	'nav.learn': 'പഠിക്കുക',
	'library.landing.tagline':
		'മുഴുവൻ ശേഖരവും, തട്ടു തട്ടായി — നിങ്ങൾ നിർത്തിയ ഇടവും അടയാളപ്പെടുത്തിയവയും ചേർത്ത്.',
	'schola.landing.title': 'എവിടെ തുടങ്ങണം',
	'schola.landing.tagline':
		'ഇവിടെയുള്ളതിന്റെ ഒരു ഹ്രസ്വ വഴികാട്ടി: ഈ ഗ്രന്ഥങ്ങൾ ഓരോന്നും എന്താണ്, പത്തു കൽപനകളും സഭ ഓരോ കത്തോലിക്കനും അറിഞ്ഞിരിക്കണമെന്നു പറയുന്ന മറ്റു പട്ടികകളും, ഒപ്പം വായന എവിടെ തുടങ്ങണം എന്നും.',
	'schola.start.heading': 'കത്തോലിക്കാ വിശ്വാസം പുതിയതാണോ?',
	'schola.start.body': 'ഏറ്റവും നല്ല തുടക്കം ',
	'schola.start.bodyAfter':
		' ആണ്: മതബോധനഗ്രന്ഥത്തിലേതു തന്നെയായ പ്രബോധനം, ഏറെ ഹ്രസ്വമായി, ചോദ്യോത്തരരൂപത്തിൽ. ഏകദേശം പത്തിലൊന്നു നീളമേയുള്ളൂ; ഒന്നും മുൻകൂട്ടി കരുതുന്നുമില്ല.',
	'schola.bible.heading': 'ബൈബിൾ ഒരിക്കലും വായിച്ചിട്ടില്ലേ?',
	'schola.bible.library':
		'അതൊരു ഗ്രന്ഥമല്ല, എഴുപത്തിമൂന്നാണ് — ആയിരത്തിലേറെ വർഷങ്ങളിൽ എഴുതപ്പെട്ട്, സഭ ഉറപ്പിച്ച ക്രമത്തിൽ കൂട്ടിക്കെട്ടിയവ; സംഭവങ്ങൾ നടന്ന ക്രമമല്ല, വായിക്കാൻ ഏറ്റവും എളുപ്പമുള്ള ക്രമവുമല്ല. മിക്കവരും ഒന്നാം താളിൽ തുടങ്ങി ഏതാനും ആഴ്ചകൾക്കകം, പുരാതന നിയമത്തിന്റെ നീണ്ടൊരു അധ്യായത്തിൽ, നിർത്തുന്നു — ഇതെന്തിനാണെന്ന് ആരും അവരോട് ഇതുവരെ പറഞ്ഞിട്ടില്ലാത്തതുകൊണ്ട്.',
	'schola.bible.step.gospel': 'ഒരു സുവിശേഷത്തിൽ തുടങ്ങുക',
	'schola.bible.start':
		'യേശുവിന്റെ ജീവിതത്തെക്കുറിച്ചുള്ള നാലു ചെറുഗ്രന്ഥങ്ങളിൽ ഒന്ന് — മുന്നിലല്ല, ഏറെ ഉള്ളിൽ. ഇതു ഞങ്ങളുടെ ആശയമല്ല: സഭയുടെ ഒരു സൂനഹദോസ് വിശുദ്ധ ഗ്രന്ഥത്തിന്റെ ശരിയായ ഉപയോഗം പഠിപ്പിക്കണമെന്ന് ആവശ്യപ്പെട്ടു — „വിശേഷിച്ചും പുതിയ നിയമത്തിന്റെ, എല്ലാറ്റിനുമുപരി സുവിശേഷങ്ങളുടെ“. അതു പ്രത്യേകമായി ഒന്നിനെയും പേരെടുത്തു പറഞ്ഞില്ല; ഞങ്ങളും പറയുന്നില്ല.',
	'schola.bible.whichGospel':
		'മൂന്നെണ്ണം സാധാരണ നിർദ്ദേശിക്കപ്പെടുന്നു, മൂന്നു വ്യത്യസ്ത കാരണങ്ങളാൽ. അവയിലേതും ആയിരിക്കാൻ നല്ല ഇടമാണ്.',
	'schola.bible.gospel.mark':
		'ഏറ്റവും ഹ്രസ്വം. ഒരു ഉച്ചതിരിഞ്ഞ നേരംകൊണ്ട് മുഴുവൻ വായിക്കാം; തുടക്കത്തിൽ ഏറ്റവും നല്ലതു തിരഞ്ഞെടുത്തതിനെക്കാൾ വിലയുള്ളത് ഒന്നു വായിച്ചുതീർത്തതാണ്.',
	'schola.bible.gospel.luke':
		'കഥ ക്രമത്തിൽ എഴുതിക്കിട്ടണമെന്ന് ആഗ്രഹിച്ച, വിശ്വാസത്തിനു പുറത്തുള്ള ഒരാൾക്കായി എഴുതപ്പെട്ടത് — അതു കൃത്യമായി നിങ്ങളാകാം. അതു നേരേ അപ്പസ്തോലപ്രവൃത്തികളിലേക്കു തുടരുന്നു; അതുകൊണ്ട് വാസ്തവത്തിൽ ഒരു നീണ്ട ഗ്രന്ഥത്തിന്റെ ആദ്യപകുതിയാണ്.',
	'schola.bible.gospel.john':
		'എന്തിനെഴുതി എന്നു തുറന്നു പറയുന്നത്: „നിങ്ങൾ വിശ്വസിക്കേണ്ടതിന്“. ലളിതമായ വാക്കുകൾ; യേശു ആരാണെന്ന ചോദ്യത്തിലേക്കു നേരേ ചെല്ലുന്നു.',
	'schola.bible.step.acts': 'പിന്നെ അതിനുശേഷം എന്തു സംഭവിച്ചു',
	'schola.bible.thenActs':
		'ഒന്നു വായിച്ചുതീർന്നാൽ, അവിടുന്നു പോയശേഷം അവിടുത്തെ അറിഞ്ഞിരുന്നവർ എന്തു ചെയ്തു എന്നു വായിക്കുക.',
	'schola.bible.acts.why':
		'സുവിശേഷങ്ങൾ അവസാനിച്ചശേഷമുള്ള മുപ്പതു വർഷം: ഭയന്നുപോയ ഏതാനും ഡസൻ ആളുകൾ, അവർ കണ്ടതു സാമ്രാജ്യത്തിന്റെ മറുകരയിലെത്തിയത് എങ്ങനെ എന്നതും.',
	'schola.bible.step.old': 'പിന്നെ പഴയ പകുതി',
	'schola.bible.thenOld':
		'ഒന്നാം താളിൽനിന്നല്ല, മുഴുവനുമല്ല. ചുരുക്കം ചില ഇടങ്ങളാണു കഥ വഹിക്കുന്നത്; സുവിശേഷങ്ങൾ വീണ്ടും വീണ്ടും ചൂണ്ടിക്കാട്ടുന്നതും അവയിലേക്കുതന്നെ.',
	'schola.bible.ot.beginnings': 'എങ്ങനെ തുടങ്ങുന്നു, എങ്ങനെ പിഴയ്ക്കുന്നു.',
	'schola.bible.ot.promise':
		'ഒരു കുടുംബവും അതിനു നൽകപ്പെട്ട, അതിലുള്ള എല്ലാവരെയും അതിജീവിക്കുന്ന ഒരു വാഗ്ദാനവും.',
	'schola.bible.ot.exodus':
		'അടിമത്തത്തിൽനിന്നു പുറത്തുകൊണ്ടുവരപ്പെട്ട ഒരു ജനവും, ജീവിക്കാൻ അവർക്കു നൽകപ്പെട്ട ഒരു നിയമവും.',
	'schola.bible.ot.psalms':
		'കഥയല്ല: നൂറ്റമ്പതു പ്രാർഥനകളും ഗീതങ്ങളും. ഒന്നൊന്നായി, ഏതു ക്രമത്തിലും വായിക്കുക. സഭ ഇന്നും ദിവസവും ഇവ ചൊല്ലുന്നു.',
	'schola.bible.bothWays':
		'നിങ്ങൾ പലതും തിരിച്ചറിയും; അതു യാദൃച്ഛികമല്ല, അതാണു ലക്ഷ്യം. സഭ പഴയ ഗ്രന്ഥങ്ങളെ ക്രിസ്തുവിന്റെ വെളിച്ചത്തിലും പുതിയവയെ മുമ്പു വന്നതിന്റെ വെളിച്ചത്തിലും വായിക്കുന്നു — ഓരോ പകുതിയും മറ്റേതിനെ വിശദമാക്കുന്നു; അതുകൊണ്ടു രണ്ടും ഒറ്റയ്ക്കു വായിക്കപ്പെടുന്നില്ല.',
	'schola.books.heading': 'ഇവിടെ എന്തുണ്ട്',
	'schola.what.scripture':
		'സഭ സ്വീകരിക്കുന്ന വിധത്തിലുള്ള വിശുദ്ധ ഗ്രന്ഥം, രണ്ടു നിയമങ്ങളിലും. ഇവിടെയുള്ള മറ്റെല്ലാം അതിന്റെ വെളിച്ചത്തിലാണു വായിക്കുന്നത്.',
	'schola.what.catechism':
		'കത്തോലിക്കാ സഭ വിശ്വസിക്കുന്നതിന്റെ സംഗ്രഹം, ഒറ്റ വാല്യത്തിൽ. അതു തന്നെ ഒരു സ്രോതസ്സല്ല: വിശുദ്ധ ഗ്രന്ഥവും പിതാക്കന്മാരും ആരാധനക്രമവും സഭയുടെ പ്രബോധനവും അതു ചേർത്തുവയ്ക്കുന്നു; ഓരോ ഖണ്ഡികയും താൻ പറയുന്നത് എവിടെനിന്നു വരുന്നു എന്നു പറയുന്നു.',
	'schola.what.compendium': 'അതേ പ്രബോധനം ചോദ്യോത്തരരൂപത്തിൽ, ഏകദേശം പത്തിലൊന്നു നീളത്തിൽ.',
	'schola.what.magisterium':
		'മാർപാപ്പമാരും സൂനഹദോസുകളും യഥാർഥത്തിൽ എഴുതിയത് — ചാക്രികലേഖനങ്ങൾ, പ്രമാണരേഖകൾ, ഡിക്രികൾ, പ്രഖ്യാപനങ്ങൾ — ഓരോന്നും ഒരു പ്രത്യേക സന്ദർഭത്തെയും ഒരു പ്രത്യേക ചോദ്യത്തെയും അഭിസംബോധന ചെയ്യുന്നു. ഓരോന്നും അതിന്റെ ആദ്യ ലത്തീൻ വാക്കുകളാൽ അറിയപ്പെടുന്നു.',
	'schola.what.social':
		'അധ്വാനം, സ്വത്ത്, കുടുംബം, രാഷ്ട്രീയം, സമാധാനം എന്നിവയെക്കുറിച്ചുള്ള സഭയുടെ പ്രബോധനം, ആ രേഖകളിൽനിന്നു ശേഖരിച്ച് ഒറ്റ ഗ്രന്ഥത്തിൽ.',
	'schola.what.law':
		'പ്രബോധനമല്ല, നിയമം. സഭ എന്ത് ആവശ്യപ്പെടുന്നു എന്നു പറയുന്നു; ഭേദഗതി ചെയ്യപ്പെടുകയും ചെയ്യുന്നു.',
	'schola.what.doctors':
		'സഭ വേദപാരംഗതരെന്നു പ്രഖ്യാപിച്ച ദൈവശാസ്ത്രജ്ഞർ. ഗ്രന്ഥകർത്താവ് എത്ര വലിയവനായാലും ഇതിന് ഔദ്യോഗിക അധികാരമില്ല.',
	'schola.what.prayers': 'സഭ പ്രാർഥിക്കുന്ന വാക്കുകൾ, ഒപ്പം ലത്തീനും.',
	'schola.places.heading': 'പാഠങ്ങളല്ല, ഈ ഇടത്തിലെ സ്ഥലങ്ങൾ',
	'schola.what.library':
		'ഈ ഇടത്തിലെ എല്ലാ കൃതികളും ഒറ്റ പട്ടികയിൽ, തരമനുസരിച്ചല്ല വിഷയമനുസരിച്ചു കൂട്ടിയിരിക്കുന്നു.',
	'schola.what.questions':
		'ഒരു ചോദ്യം മാത്രമുള്ളവർക്ക്, പരാമർശമില്ലാതെ, കടക്കാനുള്ള ഒരു വഴി. ഓരോന്നും അതിന് ഉത്തരം നൽകുന്ന ഭാഗങ്ങൾ ശേഖരിക്കുന്നു — ആദ്യം മതബോധനം — അവയിലെ ഓരോ വാക്കും സഭയുടേതു തന്നെ.',
	'schola.what.calendar':
		'ആരാധനക്രമ ദിനം — കാലം, നിറം, ആരെ ഓർക്കുന്നു — നിങ്ങൾ പിന്തുടരുന്ന കലണ്ടറുള്ള രാജ്യത്തിനായി.',
	'schola.what.bookmarks':
		'നിങ്ങൾ അടയാളപ്പെടുത്തിയ ഭാഗങ്ങളും, ഓരോ കൃതിയിലും അവസാനം എവിടെ നിർത്തി എന്നതും. രണ്ടും ഈ ബ്രൗസറിൽ മാത്രം സൂക്ഷിക്കുന്നു; എങ്ങോട്ടും അയയ്ക്കുന്നില്ല.',
	'schola.what.census':
		'ഈ ഗ്രന്ഥശാലയിൽ എന്തുണ്ട്, അതെത്രത്തോളം എത്തുന്നു എന്നും — എത്ര കൃതികൾ, ഏതെല്ലാം ഭാഷകളിൽ, നിങ്ങളുടെ സ്വന്തം ഭാഷയിൽ അവയിൽ എത്രത്തോളം യഥാർഥത്തിൽ ലഭ്യമാണ് എന്നും.',
	'ccc.noCounterpart': 'മറ്റേ കൃതിയിൽ ഇതിനു തുല്യമായതില്ല',
	'jumpbox.placeholder': 'ഇങ്ങോട്ടു പോകുക… (ഉദാ. jn 3:16, ccc 1234)',
	'jumpbox.short': 'തിരയുക',
	'jumpbox.hint': 'ഒരു പരാമർശത്തിലേക്കു പോകാൻ / അല്ലെങ്കിൽ Ctrl+K അമർത്തുക',
	'jumpbox.noMatch': 'ഒന്നും കിട്ടിയില്ല',
	'jumpbox.suggestions': 'നിർദ്ദേശങ്ങൾ',
	'settings.label': 'ക്രമീകരണങ്ങൾ',
	'apparatus.label': 'അനുബന്ധം',
	'apparatus.editionNotes': 'ഈ പതിപ്പിന്റെ കുറിപ്പുകൾ',
	'apparatus.commentary': 'വ്യാഖ്യാനം',
	'apparatus.inCommentary': 'മുകളിലെ വ്യാഖ്യാനത്തിൽ ഉൾപ്പെടുത്തിയിരിക്കുന്നു.',
	'darkMode.label': 'ഇരുണ്ട രീതി',
	'darkMode.auto': 'സ്വയം',
	'darkMode.on': 'ഓൺ',
	'darkMode.off': 'ഓഫ്',
	'sepia.label': 'സെപിയ',
	'sepia.lightOnly': 'വെളുത്ത രീതിയിൽ മാത്രം',
	'sepia.noHue': 'മോണോക്രോമിൽ ഇല്ല',
	'oled.label': 'OLED കറുപ്പ്',
	'oled.darkOnly': 'ഇരുണ്ട രീതിയിൽ മാത്രം',
	'mono.label': 'മോണോക്രോം',
	'mono.hint':
		'താൾ മുഴുവൻ ഒറ്റ ചാരനിറത്തിലാക്കുന്നു, അതിനാൽ നിറം കൊണ്ട് ഒന്നും വേർതിരിച്ചറിയാനാവില്ല. ഇതു പ്രവർത്തിക്കുമ്പോൾ സെപിയ ഓഫാകും.',
	'advanced.label': 'വിപുലം',
	'library.title': 'ഓഫ്‌ലൈൻ ഗ്രന്ഥശാല',
	'library.lede': 'ഈ ഉപകരണത്തിൽ സൂക്ഷിച്ചിരിക്കുന്ന പാഠങ്ങൾ ഒരു നെറ്റ്‌വർക്കും കൂടാതെ തുറക്കുന്നു.',
	'library.essentials': 'പ്രാർഥനകളും സംഗ്രഹവും',
	'library.illustrations': 'ബൈബിൾ (ചിത്രങ്ങൾ)',
	'library.illustrationsDetail': 'ബൈബിൾ (ചിത്രങ്ങൾ, ഉയർന്ന റെസലൂഷൻ)',
	'library.other': 'മറ്റു പാഠങ്ങൾ',
	'library.everything': 'എല്ലാം',
	'library.downloadAll': 'എല്ലാം ഡൗൺലോഡ് ചെയ്യുക',
	'library.download': 'ഡൗൺലോഡ്',
	'library.downloaded': 'ഈ ഉപകരണത്തിൽ',
	'library.offlineNote': 'എന്തെങ്കിലും ഡൗൺലോഡ് ചെയ്യാൻ ഓഫ്‌ലൈൻ മോഡ് ഓഫാക്കുക.',
	'library.remove': 'ഈ ഉപകരണത്തിൽനിന്നു നീക്കുക',
	'library.removeConfirm': 'നീക്കണോ?',
	'library.forget': 'ഡൗൺലോഡുകൾ നീക്കുക',
	'library.forgetConfirm': 'എല്ലാം നീക്കണോ?',
	'offline.label': 'ഓഫ്‌ലൈൻ മോഡ്',
	'offline.hint':
		'ഒരു നെറ്റ്‌വർക്കും ഉപയോഗിക്കുന്നില്ല: ഒന്നും ഡൗൺലോഡ് ചെയ്യില്ല, പുതുക്കലുകൾ പരിശോധിക്കില്ല, ഒന്നും അളക്കില്ല. ഈ ഉപകരണത്തിൽ ഇതിനകം ഉള്ള പാഠങ്ങൾ മാത്രമേ തുറക്കൂ.',
	'offline.notDownloaded': 'ഈ ഉപകരണത്തിൽ ഇല്ല',
	'loadFailed.title': 'അതു വന്നില്ല',
	'loadFailed.hint':
		'താൾ ഉണ്ട് — അതു കൊണ്ടുവരുന്നതിൽ എന്തോ പിഴച്ചു. വീണ്ടും ശ്രമിച്ചാൽ സാധാരണ ശരിയാകും.',
	'loadFailed.retry': 'വീണ്ടും ശ്രമിക്കുക',
	'loadFailed.retrying': 'ശ്രമിക്കുന്നു…',
	'offline.turnOff': 'ഓഫ്‌ലൈൻ മോഡ് ഓഫാക്കുക',
	'type.label': 'അക്ഷരവലുപ്പവും അക്ഷരരൂപവും',
	'fontSize.label': 'അക്ഷരവലുപ്പം',
	'fontSize.small': 'ചെറുത്',
	'fontSize.medium': 'ഇടത്തരം',
	'fontSize.large': 'വലുത്',
	'fontSize.xlarge': 'വളരെ വലുത്',
	'fontSize.xxlarge': 'ഏറ്റവും വലുത്',
	'face.label': 'അക്ഷരരൂപം',
	'face.serif': 'സെരിഫ്',
	'face.sans': 'സാൻസ്',
	'print.label': 'ഈ താൾ അച്ചടിക്കുക',
	'toTop.label': 'മുകളിലേക്കു മടങ്ങുക',
	'install.label': 'Glossa ഇൻസ്റ്റാൾ ചെയ്യുക',
	'install.hint.label': 'ഹോം സ്ക്രീനിലേക്കു ചേർക്കുക',
	'install.hint.title': 'Glossa നിങ്ങളുടെ ഹോം സ്ക്രീനിലേക്കു ചേർക്കുക',
	'install.hint.stepBefore': 'ഇതൊരു ആപ്പുപോലെ തുറക്കും, ഓഫ്‌ലൈനിലും വായിക്കാം. ഞെക്കുക',
	'install.hint.stepAfter': 'എന്നിട്ട് „ഹോം സ്ക്രീനിലേക്കു ചേർക്കുക“.',
	'install.hint.dismiss': 'അവഗണിക്കുക',
	'update.label': 'ഒരു പുതിയ പതിപ്പ് ലഭ്യമാണ്',
	'update.title': 'ഒരു പുതിയ പതിപ്പ് തയ്യാറാണ്',
	'update.body': 'ഏറ്റവും പുതിയ പാഠങ്ങളും തിരുത്തലുകളും ലഭിക്കാൻ വീണ്ടും ലോഡ് ചെയ്യുക.',
	'update.action': 'വീണ്ടും ലോഡ് ചെയ്യുക',
	'update.dismiss': 'ഇപ്പോൾ വേണ്ട',
	'edition.label': 'പതിപ്പ്',
	'edition.select': 'പതിപ്പു തിരഞ്ഞെടുക്കുക',
	'edition.current': 'ഇപ്പോഴത്തെ പതിപ്പ്',
	'edition.filter': 'പതിപ്പുകൾ തിരയുക',
	'menu.noMatches': 'ഒന്നും ചേരുന്നില്ല',
	'unitNav.previous': 'മുമ്പത്തേത്',
	'unitNav.next': 'അടുത്തത്',
	'bible.prevChapter': 'മുൻ അധ്യായം',
	'bible.nextChapter': 'അടുത്ത അധ്യായം',
	'bible.pickBook': 'പുസ്തകങ്ങളും അധ്യായങ്ങളും',
	'bible.landing.title': 'ബൈബിൾ',
	'bible.landing.tagline': 'ബൈബിൾ മുഴുവൻ വായിക്കുക, പുസ്തകം പുസ്തകമായി, അധ്യായം അധ്യായമായി.',
	'bible.landing.random': 'എനിക്ക് ഭാഗ്യമുണ്ടെന്നു തോന്നുന്നു',
	'bible.landing.books': 'പുസ്തകങ്ങൾ',
	'bible.chapterUnavailable': 'ഈ പതിപ്പിൽ ലഭ്യമല്ല',
	'bible.introduction': 'ആമുഖം',
	'bible.introUnavailable': 'ഈ ഭാഷയിൽ ആമുഖം ഇതുവരെ ഇല്ല',
	'bible.introSource': 'ആമുഖങ്ങൾ വിശുദ്ധ ഗ്രന്ഥപാഠത്തിന്റെ ഭാഗമല്ല.',
	'bible.testament.ot': 'പഴയ നിയമം',
	'bible.testament.nt': 'പുതിയ നിയമം',
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
	'ccc.prevParagraph': 'മുൻ ഖണ്ഡിക',
	'ccc.nextParagraph': 'അടുത്ത ഖണ്ഡിക',
	'ccc.inBrief': 'ചുരുക്കത്തിൽ',
	'ccc.landing.title': 'കത്തോലിക്കാ സഭയുടെ മതബോധനഗ്രന്ഥം',
	'ccc.landing.pairTitle': 'മതബോധനഗ്രന്ഥവും സംഗ്രഹവും',
	'ccc.landing.tagline':
		'<strong>മതബോധനഗ്രന്ഥം</strong> കത്തോലിക്കാ പ്രബോധനം 2,865 അക്കമിട്ട ഖണ്ഡികകളിൽ അവതരിപ്പിക്കുന്നു. <strong>സംഗ്രഹം</strong> അതേ പ്രബോധനം അതേ ക്രമത്തിൽ 598 ചോദ്യോത്തരങ്ങളായി അവതരിപ്പിക്കുന്നു.',
	'ccc.landing.pairTagline':
		'കത്തോലിക്കാ സഭയുടെ മതബോധനഗ്രന്ഥം 2,865 ഖണ്ഡികകളിൽ, അതിന്റെ സംഗ്രഹം 598 ചോദ്യങ്ങളിൽ.',
	'ccc.tableOfContents': 'ഉള്ളടക്കം',
	'ccc.related': 'ഇതും കാണുക',
	'compendium.landing.title': 'മതബോധനഗ്രന്ഥത്തിന്റെ സംഗ്രഹം',
	'compendium.landing.tagline': 'കത്തോലിക്കാ സഭയുടെ മതബോധനഗ്രന്ഥം സംഗ്രഹിക്കുന്ന ചോദ്യോത്തരങ്ങൾ.',
	'compendium.question': 'ചോദ്യം',
	'compendium.answer': 'ഉത്തരം',
	'compendium.tableOfContents': 'ഉള്ളടക്കം',
	'compendium.prevQuestion': 'മുൻ ചോദ്യം',
	'compendium.nextQuestion': 'അടുത്ത ചോദ്യം',
	'compendium.condenses': 'മതബോധനം ¶¶ സംഗ്രഹിക്കുന്നു',
	'ccc.abbrev': 'മതബോധനം',
	'ccc.condensedIn': 'സംഗ്രഹത്തിൽ',
	'compendium.abbrev': 'സംഗ്രഹം',
	'compendium.noQuestionNumber': 'ഈ സഞ്ചയത്തിൽ ചോദ്യസംഖ്യയില്ല',
	'document.library.tagline':
		'ചാക്രികലേഖനങ്ങൾ, സൂനഹദോസ് പ്രമാണങ്ങൾ, ഡിക്രികൾ, സഭയുടെ പ്രഖ്യാപനങ്ങൾ.',
	'document.filter.heading': 'ഫിൽട്ടർ',
	'document.filter.author': 'ഗ്രന്ഥകർത്താവ്',
	'document.filter.kind': 'തരം',
	'document.filter.subject': 'വിഷയം',
	'document.filter.search': 'രേഖകൾ തിരയുക',
	'document.filter.clear': 'മായ്ക്കുക',
	'document.filter.results': 'കാണിക്കുന്ന രേഖകൾ',
	'document.filter.noResults': 'ഈ ഫിൽട്ടറുകൾക്കു ചേരുന്ന രേഖയില്ല.',
	'document.tableOfContents': 'ഉള്ളടക്കം',
	'document.startReading': 'വായന തുടങ്ങുക',
	'document.readFullDocument': 'രേഖ മുഴുവൻ വായിക്കുക',
	'document.section': 'വിഭാഗം',
	'document.prevSection': 'മുമ്പത്തേത്',
	'document.nextSection': 'അടുത്തത്',
	'document.kind.conciliarConstitution': 'പ്രമാണരേഖ',
	'document.kind.conciliarDecree': 'ഡിക്രി',
	'document.kind.conciliarDeclaration': 'പ്രഖ്യാപനം',
	'document.kind.encyclical': 'ചാക്രികലേഖനം',
	'document.kind.apostolicExhortation': 'അപ്പസ്തോലിക പ്രബോധനം',
	'document.kind.apostolicConstitution': 'അപ്പസ്തോലിക പ്രമാണരേഖ',
	'document.kind.apostolicLetter': 'അപ്പസ്തോലിക ലേഖനം',
	'document.kind.cdfDeclaration': 'CDF പ്രഖ്യാപനം',
	'document.kind.cdfInstruction': 'CDF നിർദേശം',
	'document.kind.cdfLetter': 'CDF ലേഖനം',
	'document.kind.cdfDoctrinalNote': 'CDF സൈദ്ധാന്തിക കുറിപ്പ്',
	'document.kind.cdfResponsum': 'CDF ഉത്തരം',
	'document.kind.cdfConsiderations': 'CDF പരിഗണനകൾ',
	'document.kindPlural.conciliarConstitution': 'പ്രമാണരേഖകൾ',
	'document.kindPlural.conciliarDecree': 'ഡിക്രികൾ',
	'document.kindPlural.conciliarDeclaration': 'പ്രഖ്യാപനങ്ങൾ',
	'document.kindPlural.encyclical': 'ചാക്രികലേഖനങ്ങൾ',
	'document.kindPlural.apostolicExhortation': 'അപ്പസ്തോലിക പ്രബോധനങ്ങൾ',
	'document.kindPlural.apostolicConstitution': 'അപ്പസ്തോലിക പ്രമാണരേഖകൾ',
	'document.kindPlural.apostolicLetter': 'അപ്പസ്തോലിക ലേഖനങ്ങൾ',
	'document.kindPlural.cdfDeclaration': 'CDF പ്രഖ്യാപനങ്ങൾ',
	'citation.unavailable': 'ഈ കുറിപ്പിന് ഉറവിട പാഠം ലഭ്യമല്ല.',
	'doctores.landing.title': 'സഭാവേദപാരംഗതർ',
	'doctores.landing.tagline': 'സഭാപിതാക്കന്മാരുടെയും വേദപാരംഗതരുടെയും ദൈവശാസ്ത്ര കൃതികൾ.',
	'summa.landing.title': 'സുമ്മ തെയോളോജിയേ',
	'summa.landing.tagline': 'തോമസ് അക്വീനാസ്, ഇംഗ്ലീഷിലും അദ്ദേഹം എഴുതിയ ലത്തീനിലും.',
	'summa.tableOfContents': 'ഉള്ളടക്കം',
	'summa.part': 'ഭാഗം',
	'summa.question': 'ചോദ്യം',
	'summa.article': 'അനുച്ഛേദം',
	'summa.questionShort': 'ചോ.',
	'summa.articleShort': 'അനു.',
	'summa.titleFromEdition': '{lang} പതിപ്പിലെ ശീർഷകം',
	'summa.titlesFromEdition': '{lang} പതിപ്പിലെ ശീർഷകങ്ങൾ — ഇതിൽ ഒന്നും അച്ചടിച്ചിട്ടില്ല',
	'summa.prologue': 'പീഠിക',
	'summa.objection': 'ആക്ഷേപം',
	'summa.sedContra': 'നേരെ മറിച്ച്',
	'summa.corpus': 'ഞാൻ ഉത്തരം പറയുന്നു',
	'summa.reply': 'ആക്ഷേപത്തിനുള്ള മറുപടി',
	'summa.preamble': 'കുറിപ്പ്',
	'summa.prevQuestion': 'മുൻ ചോദ്യം',
	'summa.nextQuestion': 'അടുത്ത ചോദ്യം',
	'summa.noEditionInYourLanguage':
		'സുമ്മയ്ക്കു നിങ്ങളുടെ ഭാഷയിൽ പതിപ്പില്ല. {lang}-ൽ കാണിക്കുന്നു.',
	'summa.noLatinSupplement':
		'അനുബന്ധഭാഗം ഇംഗ്ലീഷിൽ മാത്രമേയുള്ളൂ — അക്വീനാസിന്റെ മരണശേഷം സമാഹരിച്ചതാണ്.',
	'index.division': 'വിഭാഗം',
	'index.showSubsections': 'ഉപവിഭാഗങ്ങൾ കാണിക്കുക',
	'index.hideSubsections': 'ഉപവിഭാഗങ്ങൾ മറയ്ക്കുക',
	'prayers.landing.title': 'സാധാരണ പ്രാർഥനകൾ',
	'prayers.landing.tagline': 'ലത്തീൻ പാഠത്തോടൊപ്പമുള്ള പ്രാർഥനകൾ.',
	'prayers.tableOfContents': 'ഉള്ളടക്കം',
	'prayers.gloss.versicle':
		'പ്രാർത്ഥനയ്ക്കു നേതൃത്വം നൽകുന്നയാൾ ഒറ്റയ്ക്കു ചൊല്ലുകയോ പാടുകയോ ചെയ്യുന്ന വരി; സമൂഹം തുടർന്നുവരുന്ന മറുപടികൊണ്ട് ഉത്തരം നൽകുന്നു.',
	'prayers.gloss.response':
		'സമൂഹം ഒരുമിച്ചു ചൊല്ലുകയോ പാടുകയോ ചെയ്യുന്ന വരി — തൊട്ടുമുൻപുള്ള വരിക്കുള്ള മറുപടി.',
	'prayers.seeAlso': 'ഇതും കാണുക',
	'prayers.prevPrayer': 'മുൻ പ്രാർഥന',
	'prayers.nextPrayer': 'അടുത്ത പ്രാർഥന',
	'prayers.rosary.today': 'ഇന്ന്',
	'prayers.rosary.todayHeading': 'ഇന്നത്തെ രഹസ്യങ്ങൾ',
	'prayers.rosary.openingPrayer': 'ആരംഭ പ്രാർഥന',
	'prayers.rosary.decadePrayers': 'ഒരു ദശകത്തിന്റെ പ്രാർഥനകൾ',
	'ref.tooltip.loading': 'ലോഡ് ചെയ്യുന്നു…',
	'ref.tooltip.openCcc': 'മതബോധനത്തിൽ തുറക്കുക',
	'ref.tooltip.openBible': 'ബൈബിളിൽ തുറക്കുക',
	'ref.tooltip.openCompendium': 'സംഗ്രഹത്തിൽ തുറക്കുക',
	'ref.preview.open': 'തുറക്കുക',
	'ref.cf': 'cf.',
	'anchor.actions': 'പരാമർശത്തിന്മേലുള്ള പ്രവൃത്തികൾ',
	'anchor.copy': 'വാചകം പകർത്തുക',
	'anchor.copyLink': 'കണ്ണി പകർത്തുക',
	'anchor.view': 'കാണുക',
	'anchor.copied': 'പകർത്തി',
	'anchor.copyFailed': 'പകർത്താനായില്ല',
	'bookmark.add': 'അടയാളപ്പെടുത്തുക',
	'bookmark.remove': 'അടയാളം നീക്കുക',
	'bookmark.library': 'ബുക്ക്‌മാർക്കുകൾ',
	'bookmark.library.tagline': 'വായിക്കുമ്പോൾ നിങ്ങൾ അടയാളപ്പെടുത്തിയതെല്ലാം.',
	'bookmark.empty': 'ഇതുവരെ ഒന്നും അടയാളപ്പെടുത്തിയിട്ടില്ല.',
	'bookmark.emptyHint':
		'ഒരു വാക്യത്തിന്റെയോ ഖണ്ഡികയുടെയോ സംഖ്യയിൽ ഞെക്കി അടയാളപ്പെടുത്തുക എന്നതു തിരഞ്ഞെടുക്കുക, അല്ലെങ്കിൽ താളിലെ ബുക്ക്‌മാർക്ക് ബട്ടൺ ഉപയോഗിക്കുക.',
	'bookmark.about': 'ഈ ബുക്ക്‌മാർക്കുകളെക്കുറിച്ച്',
	'bookmark.deviceOnly':
		'ബുക്ക്‌മാർക്കുകൾ ഈ ബ്രൗസറിൽ മാത്രമേ സൂക്ഷിക്കപ്പെടുന്നുള്ളൂ. അവ എങ്ങോട്ടും അയയ്ക്കപ്പെടുന്നില്ല; ബ്രൗസറിന്റെ വിവരങ്ങൾ മായ്ച്ചാൽ അവയും പോകും.',
	'bookmark.unavailable': 'നിങ്ങൾ വായിക്കുന്ന പതിപ്പിൽ ഇല്ല',
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
	'footer.notEndorsed': 'പരിശുദ്ധ സിംഹാസനത്തിന്റെ അംഗീകാരമില്ല',
	'colophon.textsTitle': 'വാചകങ്ങൾ',
	'colophon.textsBody':
		'ഓരോ വാചകവും പേരു സൂചിപ്പിച്ച ഉറവിടത്തിൽ നിന്നു വരുന്നു; ഓരോ കൃതിയും അതിന്റെ പതിപ്പ്, ഉറവിടത്താൾ, എടുത്ത തീയതി എന്നിവ രേഖപ്പെടുത്തുന്നു. വിശുദ്ധ ഗ്രന്ഥത്തിനു പൊതുസഞ്ചയത്തിലുള്ള പരിഭാഷകൾ ഉപയോഗിക്കുന്നു; മതബോധനഗ്രന്ഥവും സംഗ്രഹവും പ്രബോധനാധികാരത്തിന്റെ രേഖകളും പരിശുദ്ധ സിംഹാസനം തന്നെ പ്രസിദ്ധീകരിച്ച വാചകങ്ങളിൽ നിന്നു വരുന്നു.',
	'colophon.textsFidelity':
		'വാചകം ഒരിക്കലും ചുരുക്കുന്നില്ല, ഒരിക്കലും സ്വന്തം വാക്കുകളിൽ പറയുന്നില്ല, ഒരിക്കലും തിരുത്തിയെഴുതുന്നില്ല, ഒരിക്കലും പരസ്യത്തിനരികെ വയ്ക്കുന്നില്ല. വ്യക്തമായ പിഴവുകൾ ഞങ്ങൾ തിരുത്തുന്നുണ്ട് — വീണുപോയ ഒരു വാക്ക്, കേടായ ഒരു ഉദ്ധരണി, ഒരു ഖണ്ഡിക വിഴുങ്ങിയ അടയാളപ്പെടുത്തൽ — എപ്പോഴും ഉറവിടം തന്നെ അച്ചടിക്കുന്നതിലേക്ക്, ഒരിക്കലും അതു പറയേണ്ടിയിരുന്നു എന്നു ഞങ്ങൾ കരുതുന്നതിലേക്കല്ല.',
	'colophon.countBible': 'ബൈബിൾ പതിപ്പുകൾ',
	'colophon.countDocuments': 'പ്രബോധനാധികാര രേഖകൾ',
	'colophon.privacyTitle': 'സ്വകാര്യത',
	'colophon.privacyBody1':
		'അക്കൗണ്ടുകളില്ല, കുക്കികളില്ല, പരസ്യങ്ങളില്ല, മൂന്നാം കക്ഷിയുടെ കോഡില്ല. ഇവിടെനിന്ന് ഒന്നും നിങ്ങളെ പിന്തുടരുന്നില്ല.',
	'colophon.privacyBody2':
		'സൈറ്റ് എങ്ങനെ ഉപയോഗിക്കുന്നു എന്നു ഞങ്ങൾ എണ്ണുന്നുണ്ട്: ഓരോ സന്ദർശനത്തിനും ഒരു അളവ്, ഓരോ മണ്ഡലവും ഒരു കൃത്യമായ മൂല്യമല്ല ഒരു പരിധിയാണ് — നിങ്ങൾ എത്ര നേരം നിന്നു, എത്ര തവണ ഇവിടെ വന്നു, ഏതു കൃതികൾ തുറന്നു എന്നിവ. നിങ്ങളുടെ രാജ്യം വേറെയായി എണ്ണുന്നു, ബാക്കിയുള്ളതുമായി ഒന്നും കൂട്ടിച്ചേർക്കാതെ. ഇതു വിവരിക്കുന്നത് ഒരു സന്ദർശനത്തെയാണ്, ഒരു സന്ദർശകനെയല്ല, {days} ദിവസത്തേക്കു സൂക്ഷിക്കുകയും ചെയ്യുന്നു.',
	'colophon.privacyBody3':
		'ഒരിക്കലും അയയ്ക്കാത്തത്: തിരയൽക്കള്ളിയിൽ നിങ്ങൾ ടൈപ്പു ചെയ്യുന്നത്, നിങ്ങൾ ഏതു ഭാഗം തുറന്നിരുന്നു എന്നത്, അല്ലെങ്കിൽ നിങ്ങളുടെ ഉപകരണത്തെ വീണ്ടും തിരിച്ചറിയാൻ കഴിയുന്ന എന്തും. നിങ്ങളുടെ ക്രമീകരണങ്ങളും ബുക്ക്‌മാർക്കുകളും ഡൗൺലോഡ് ചെയ്ത പാഠങ്ങളും നിങ്ങളുടെ ഉപകരണത്തിൽത്തന്നെ നിൽക്കുന്നു.',
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
	'plates.scansBy': 'സ്കാൻ നൽകിയത്',
	'plates.enlarge': '{title} വലുതാക്കുക',
	'plates.zoom': 'സൂം',
	'art.about': 'ഈ ചിത്രത്തെക്കുറിച്ച്',
	'art.detail': 'ഭാഗം',
	'colophon.typeTitle': 'അക്ഷരരൂപം',
	'colophon.typeBody':
		'1590-കളിൽ ക്ലോദ് ഗാരമോൻ കൊത്തിയ അക്ഷരങ്ങളുടെ ഗിയോർഗ് ഡുഫ്നറും ഒക്താവിയോ പാർദോയും നടത്തിയ പുനരുജ്ജീവനമായ EB Garamond-ൽ അച്ചുനിരത്തിയിരിക്കുന്നു — നവോത്ഥാനകാലം മുതൽ സഭ അച്ചടിച്ചുപോരുന്ന മാനവിക പാരമ്പര്യം. അതിന്റെ സിറിലിക് അതേ കൈകളുടേതാണെങ്കിലും ഒന്നിനെയും പുനരുജ്ജീവിപ്പിക്കുന്നില്ല: സിറിലിക് ഗാരമോൻ ഒരിക്കലും കൊത്തിയിട്ടില്ല, അതിനാൽ റഷ്യൻ ബാക്കിയുള്ളവയ്ക്കൊപ്പം നിൽക്കാൻ വരച്ച ഒരു രൂപത്തിലാണ് അച്ചുനിരത്തിയിരിക്കുന്നത്.',
	'colophon.typeArabic':
		'അറബി അതിന്റെ പരിധിക്കു തീർത്തും പുറത്താണ്, അത് Amiri-യിൽ അച്ചുനിരത്തിയിരിക്കുന്നു — 1905-ൽ കൈറോയിലെ ബൂലാഖ് അച്ചുകൂടത്തിനായി കൊത്തിയ നസ്ഖ് ലിപിയുടെ ഖാലിദ് ഹോസ്നി നടത്തിയ പുനരുജ്ജീവനം, വാചക അക്ഷരരൂപത്തിന്റെ അതേ ന്യായത്തിൽ തിരഞ്ഞെടുത്തത്: സമകാലിക രേഖാചിത്രമല്ല, ഒരു പ്രത്യേക ചരിത്രപരമായ ഗ്രന്ഥാക്ഷരം.',
	'colophon.typeInitials':
		'ആരംഭാക്ഷരങ്ങൾ Pirata One ആണ്, ഒരു ഗോഥിക് ലിപി; ആരംഭാക്ഷരം ആവശ്യപ്പെടുന്ന വലുപ്പത്തിലും അതിന്റെ വലിയ അക്ഷരങ്ങൾ വായിക്കാനാകും. റഷ്യനു വേണ്ടി Ponomar — സിനഡൽ അച്ചുകൂടത്തിന്റെ സഭാ സ്ലാവോണിക് അക്ഷരരൂപം പുനഃസൃഷ്ടിക്കുന്നത്. Ponomar ആരംഭാക്ഷരം മാത്രം അച്ചുനിരത്തുന്നു, ഒരിക്കലും വാചകമല്ല: ആദ്യന്തം സിനഡൽ അക്ഷരത്തിൽ അച്ചുനിരത്തിയ ഒരു ആധുനിക ചാക്രികലേഖനം അതെന്താണെന്നതിനെക്കുറിച്ച് സത്യമല്ലാത്ത ഒന്നു പറയും. എല്ലാം SIL Open Font License പ്രകാരം അനുമതിയുള്ളവയാണ്; മൂന്നാം കക്ഷിയിൽ നിന്നല്ല, ഈ ഇടത്തിൽ നിന്നുതന്നെ നൽകുന്നു, അതിനാൽ ഒരു താൾ വായിക്കുന്നത് മറ്റാരുടെയും സെർവറിനോട് ഒന്നും ആവശ്യപ്പെടുന്നില്ല.',
	'refs.citedIn': 'ഉദ്ധരണങ്ങൾ',
	'refs.externalVolume': '{host}-ൽ വാല്യം {volume} — സ്കാൻ ചെയ്ത PDF',
	'bible.wholeChapter': 'ഈ അധ്യായം',
	'bible.verseNotInEdition': 'ഈ വാക്യസംഖ്യ ഈ പതിപ്പിൽ ഇല്ല — താളിന്റെ ഉറവിടത്തിലെ കുറിപ്പു കാണുക',
	'bible.verseAbbrev': 'വാ.',
	'bible.note': 'കുറിപ്പ്',
	'bible.noteMissing': 'ഈ കുറിപ്പ് ഈ സഞ്ചയത്തിൽ ഇല്ല',
	'bible.chapterArgument': 'ആമുഖക്കുറിപ്പ്',
	'ccc.readFullChapter': 'അധ്യായം മുഴുവൻ വായിക്കുക',
	'ccc.noParagraphNumber': 'ഈ സഞ്ചയത്തിൽ ഖണ്ഡികാസംഖ്യയില്ല',
	'copyright.sourceTitle': 'മൂലസ്രോതസ്സിന്റെ താൾ തുറക്കുക',
	'copyright.sourceLabel': 'സ്രോതസ്സ്',
	'lang.label': 'ഭാഷ',
	'lang.filter': 'ഭാഷകൾ തിരയുക',
	'lang.more': 'കൂടുതൽ ഭാഷകൾ',
	'notFound.title': 'ഈ വിലാസത്തിൽ ഒന്നുമില്ല',
	'notFound.lede': 'നിങ്ങൾ ചോദിച്ച താൾ ഇവിടെ ഇല്ല.',
	'notFound.body':
		'കണ്ണി തെറ്റായി ടൈപ്പു ചെയ്തതോ കാലഹരണപ്പെട്ടതോ ആകാം, അല്ലെങ്കിൽ ഈ സൈറ്റ് സൂക്ഷിക്കാത്ത ഒരു പാഠത്തിലേക്കു ചൂണ്ടുന്നതാകാം.',
	'notFound.searchHint':
		'നിങ്ങൾക്കു വേണ്ട പരാമർശം അറിയാമെങ്കിൽ — ഒരു പുസ്തകവും അധ്യായവും, മതബോധനഗ്രന്ഥത്തിലെ ഒരു ഖണ്ഡികയും — ഈ താളിന്റെ മുകളിലുള്ള തിരയൽക്കള്ളിയിൽ അതു ടൈപ്പു ചെയ്യുക.',
	'notFound.credit': 'British Library, Royal MS 10 E IV, f. 49v എന്നതിനെ അടിസ്ഥാനമാക്കി',
	'notFound.elsewhere': 'അല്ലെങ്കിൽ ഇവയിലൊന്നിൽ നിന്നു തുടങ്ങുക:',
	'notFound.home': 'ഹോം',
	'compare.enter': 'പതിപ്പുകൾ താരതമ്യം ചെയ്യുക',
	'compare.exit': 'താരതമ്യത്തിൽ നിന്നു പുറത്തുകടക്കുക',
	'compare.missing': 'ഈ പതിപ്പിൽ ഇല്ല',
	'compare.versificationNote':
		'ഈ രണ്ടു പതിപ്പുകളും ഈ അധ്യായത്തിലെ വാക്യങ്ങളെ ചിലയിടങ്ങളിൽ വ്യത്യസ്തമായി വിഭജിക്കുന്നു (ഇതു പരിഭാഷയുടെ തിരഞ്ഞെടുപ്പല്ല, മൂലപാഠത്തിലെ വ്യത്യാസമാണ്) — ഒരേ വാക്യസംഖ്യ എപ്പോഴും രണ്ടു നിരകളിലും ഒരേ വാക്യമല്ല സൂചിപ്പിക്കുന്നത്.',
	'compare.loading': 'രണ്ടാം ഭാഷ ലോഡ് ചെയ്യുന്നു…',
	'ui.close': 'അടയ്ക്കുക',
	'shortcuts.title': 'കീബോർഡ് കുറുക്കുവഴികൾ',
	'shortcuts.betweenDocuments': 'രേഖകൾക്കിടയിൽ',
	'shortcuts.withinDocument': 'രേഖയ്ക്കുള്ളിൽ',
	'shortcuts.show': 'ഈ പട്ടിക കാണിക്കുക',
	'help.title': 'സഹായം',
	'help.reading.heading': 'ഒരു പാഠത്തിനു മുകളിലുള്ള പട്ട',
	'help.feature.offline':
		'ഈ ഇടം നിങ്ങളുടെ പ്രധാന സ്ക്രീനിൽ ചേർക്കുക; ഒരു ആപ്പുപോലെ തുറക്കും. ബന്ധമില്ലാതെ വായിക്കാൻ കൃതികൾ മുഴുവനായി ഇറക്കിവയ്ക്കാം.',
	'help.feature.contents':
		'നിങ്ങൾ നിൽക്കുന്ന കൃതിയുടെ വിഭജനങ്ങൾ — പുസ്തകങ്ങൾ, ഭാഗങ്ങൾ, അധ്യായങ്ങൾ — തുടക്കത്തിലേക്കു മടങ്ങാതെ അതിനുള്ളിൽ നീങ്ങാൻ.',
	'help.feature.compare':
		'ഒരേ ഭാഗത്തിന്റെ രണ്ടു പതിപ്പുകൾ അരികോടരികായി — നിങ്ങളുടെ ഭാഷയ്ക്കൊപ്പം ലത്തീൻ, അല്ലെങ്കിൽ ഒരു പരിഭാഷയ്ക്കൊപ്പം മറ്റൊന്ന്.',
	'help.feature.apparatus':
		'പതിപ്പിന്റെ സ്വന്തം കുറിപ്പുകളും പാഠത്തെക്കുറിച്ച് എഴുതിയ ഏതു വ്യാഖ്യാനവും അതിനു താഴെയല്ല, അതിനരികിലാണു നൽകുന്നത്. പാഠത്തിനുള്ളിലെ ഉദ്ധരണികൾ കണ്ണികളാണ്; അതിനാൽ പരാമർശം ചൂണ്ടുന്നിടത്തേക്കുതന്നെ കൊണ്ടുപോകുന്നു.',
	'help.feature.focus':
		'പാഠമൊഴികെ എല്ലാം മാറ്റുന്നു. പുറത്തേക്കുള്ള വഴി പട്ട ഉണ്ടായിരുന്നിടത്തുതന്നെ നിൽക്കുന്നു; അതിനു പിന്നിൽ ഒന്നും കുടുങ്ങിപ്പോകാതിരിക്കാൻ.',
	'zen.enter': 'ഫോക്കസ് മോഡ്',
	'zen.exit': 'ഫോക്കസ് മോഡ് വിടുക',
	'nav.calendar': 'കലണ്ടർ',
	'calendar.title': 'ആരാധനക്രമ കലണ്ടർ',
	'calendar.tagline':
		'പൊതു റോമൻ കലണ്ടർ, ഏതു ദിവസത്തിനും കണക്കാക്കിയത് — അതിന്റെ കാലം, അതിന്റെ പദവി, അതിന്റെ നിറം.',
	'calendar.national.tagline': '{name}, അതിന്റെ തനത് ആഘോഷങ്ങളോടെ, ഏതു ദിവസത്തിനും കണക്കാക്കിയത്.',
	'calendar.calendar': 'കലണ്ടർ',
	'calendar.which.general': 'പൊതു റോമൻ കലണ്ടർ',
	'calendar.filter': 'രാജ്യങ്ങൾ തിരയുക',
	'calendar.region.europe': 'യൂറോപ്പ്',
	'calendar.region.americas': 'അമേരിക്കകൾ',
	'calendar.region.africa': 'ആഫ്രിക്ക',
	'calendar.region.middleEast': 'മധ്യപൂർവദേശം',
	'calendar.region.asia': 'ഏഷ്യ',
	'calendar.region.oceania': 'ഓഷ്യാനിയ',
	'calendar.today': 'ഇന്ന്',
	'calendar.previousMonth': 'മുൻമാസം',
	'calendar.nextMonth': 'അടുത്ത മാസം',
	'calendar.plainDays': 'സാധാരണ ദിവസങ്ങൾ',
	'calendar.noSuchDay': 'ആ തീയതിക്ക് ആരാധനക്രമ ദിനം കണക്കാക്കുന്നില്ല.',
	'calendar.week': 'ആഴ്ച',
	'calendar.alsoToday': 'ഇന്ന് ഇവയും ആചരിക്കുന്നു',
	'calendar.alsoObserved': 'ഇന്ന് ഇവയും സ്മരിക്കുന്നു',
	'calendar.obligation': 'കടമയുള്ള തിരുനാൾ',
	'calendar.obligationCanon': 'CIC കാ. 1246',
	'calendar.sundayCycle': 'ഞായർ ചക്രം',
	'calendar.weekdayCycle': 'വാരദിന ചക്രം',
	'calendar.psalterWeek': 'സങ്കീർത്തന വാരം',
	'lectionary.heading': 'കുർബാനയിലെ വായനകൾ',
	'lectionary.slot.reading': 'വായന',
	'lectionary.slot.reading1': 'ഒന്നാം വായന',
	'lectionary.slot.reading2': 'രണ്ടാം വായന',
	'lectionary.slot.reading3': 'മൂന്നാം വായന',
	'lectionary.slot.reading4': 'നാലാം വായന',
	'lectionary.slot.reading5': 'അഞ്ചാം വായന',
	'lectionary.slot.reading6': 'ആറാം വായന',
	'lectionary.slot.reading7': 'ഏഴാം വായന',
	'lectionary.slot.psalm': 'പ്രതിവചന സങ്കീർത്തനം',
	'lectionary.slot.epistle': 'ലേഖനം',
	'lectionary.slot.acclamation': 'സുവിശേഷ പ്രകീർത്തനം',
	'lectionary.slot.gospel': 'സുവിശേഷം',
	'lectionary.slot.sequence': 'സീക്വൻസ്',
	'lectionary.or': 'അല്ലെങ്കിൽ',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'ഈ വായനകളെക്കുറിച്ച്',
	'lectionary.caveat':
		'Ordo Lectionum Missae നിശ്ചയിച്ച ഭാഗങ്ങൾ, ഈ സൈറ്റിന്റെ സ്വന്തം പതിപ്പുകളുമായി കണ്ണിചേർത്തത് — ഏതെങ്കിലും പ്രത്യേക സഭയിൽ വായിക്കുന്ന പരിഭാഷയല്ല, ഒരു മെത്രാൻ സമിതിക്കു ക്രമം മാറ്റാവുന്നതുമാണ്.',
	'calendar.transferredFrom': 'മാറ്റിയത്',
	'calendar.season.advent': 'ആഗമനകാലം',
	'calendar.season.christmas': 'ക്രിസ്മസ് കാലം',
	'calendar.season.lent': 'നോമ്പുകാലം',
	'calendar.season.triduum': 'പെസഹാ ത്രിദിനം',
	'calendar.season.easter': 'ഉയിർപ്പുകാലം',
	'calendar.season.ordinary': 'ആണ്ടുവട്ടക്കാലം',
	'calendar.colour.white': 'വെള്ള',
	'calendar.colour.red': 'ചുവപ്പ്',
	'calendar.colour.green': 'പച്ച',
	'calendar.colour.violet': 'വയലറ്റ്',
	'calendar.colour.rose': 'റോസ്',
	'calendar.colour.black': 'കറുപ്പ്',
	'calendar.colour.blue': 'നീല',
	'calendar.rank.solemnity': 'മഹോത്സവം',
	'calendar.rank.feast': 'തിരുനാൾ',
	'calendar.rank.memorial': 'സ്മരണ',
	'calendar.rank.optional-memorial': 'ഐച്ഛിക സ്മരണ',
	'calendar.rank.commemoration': 'അനുസ്മരണം',
	'calendar.rank.sunday': 'ഞായർ',
	'calendar.rank.weekday': 'വാരദിനം',
	'calendar.gloss.season.advent':
		'ക്രിസ്മസിനു മുമ്പുള്ള നാലാഴ്ച: കർത്താവിന്റെ ആഗമനത്തിനുള്ള ഒരുക്കവും സഭാവർഷത്തിന്റെ ആരംഭവും.',
	'calendar.gloss.season.christmas':
		'ക്രിസ്മസ് മുതൽ കർത്താവിന്റെ ജ്ഞാനസ്നാനം വരെ, കർത്താവിന്റെ ജനനവും ലോകത്തിനു മുന്നിലുള്ള അവിടുത്തെ പ്രത്യക്ഷീകരണവും ആഘോഷിക്കുന്നു.',
	'calendar.gloss.season.lent':
		'വിഭൂതി ബുധൻ മുതൽ കർത്താവിന്റെ അന്ത്യഅത്താഴത്തിന്റെ സന്ധ്യാ കുർബാന വരെയുള്ള നാൽപതു ദിവസം: അനുതാപം, ദാനധർമം, ഈസ്റ്ററിനുള്ള ഒരുക്കം.',
	'calendar.gloss.season.triduum':
		'പെസഹാ വ്യാഴാഴ്ച സന്ധ്യ മുതൽ ഉയിർപ്പു ഞായർ സന്ധ്യ വരെയുള്ള മൂന്നു ദിവസം — കർത്താവിന്റെ പീഡാനുഭവവും മരണവും ഉയിർപ്പും, വർഷം മുഴുവന്റെയും ഉച്ചകോടി.',
	'calendar.gloss.season.easter':
		'ഈസ്റ്റർ മുതൽ പെന്തക്കുസ്താ വരെയുള്ള അമ്പതു ദിവസം, ഒരൊറ്റ തിരുനാളായി ആഘോഷിക്കപ്പെടുന്നു — „ഒരൊറ്റ വലിയ ഞായർ“.',
	'calendar.gloss.season.ordinary':
		'മറ്റു കാലങ്ങൾക്കു പുറത്തുള്ള മുപ്പത്തിമൂന്നോ മുപ്പത്തിനാലോ ആഴ്ചകൾ. „സാധാരണം“ എന്നല്ല, ക്രമപ്പെടുത്തിയത് എന്നാണ്: ആഴ്ചകൾക്ക് എണ്ണമുണ്ട്, സഭ കർത്താവിന്റെ ജീവിതവും പ്രബോധനവും തുടർച്ചയായി വായിക്കുന്നു. ഇത് രണ്ടു ഘട്ടങ്ങളായി വരുന്നു — ക്രിസ്മസ് കാലത്തിനു ശേഷം നോമ്പുകാലം വരെ, പെന്തക്കുസ്തായ്ക്കു ശേഷം ആഗമനകാലം വരെ.',
	'calendar.gloss.rank.solemnity':
		'ഏറ്റവും ഉയർന്ന പദവി: ഈസ്റ്റർ, ക്രിസ്മസ്, സ്വർഗാരോഹണം, ഒരു സ്ഥലത്തിന്റെ മധ്യസ്ഥൻ. മഹത്വഗീതത്തോടും വിശ്വാസപ്രമാണത്തോടും കൂടി ആഘോഷിക്കുന്നു, തലേന്നു സന്ധ്യയിൽ ആരംഭിക്കുന്നു.',
	'calendar.gloss.rank.feast':
		'അന്നേ ദിവസത്തിനുള്ളിൽ ആഘോഷിക്കുന്നു. അപ്പസ്തോലന്മാരും സുവിശേഷകരും, കർത്താവിന്റെയും പരിശുദ്ധ അമ്മയുടെയും വലിയ ദിവസങ്ങളും.',
	'calendar.gloss.rank.memorial':
		'ഒരു വിശുദ്ധനെ അദ്ദേഹത്തിന്റെ ദിവസത്തിൽ, ആ കാലത്തിന്റെ കുർബാനയ്ക്കും യാമപ്രാർഥനയ്ക്കും ഉള്ളിൽ ഓർമിക്കുന്നു. ആഘോഷിക്കുന്നിടത്ത് നിർബന്ധം.',
	'calendar.gloss.rank.optional-memorial':
		'വൈദികന്റെയോ സമൂഹത്തിന്റെയോ തിരഞ്ഞെടുപ്പനുസരിച്ച് ആഘോഷിക്കുകയോ ചെയ്യാതിരിക്കുകയോ ആകാം. ആഘോഷിച്ചില്ലെങ്കിൽ ആ ദിവസം വെറും സാധാരണ ദിവസം.',
	'calendar.gloss.rank.commemoration':
		'നോമ്പുകാലത്ത് ഒരു ഓർമ എന്തായി മാറുന്നു എന്നത്: സാധാരണ ദിവസത്തെ കുർബാനയോടു ചേർക്കുന്ന ഒരു പ്രാർഥന; ബാക്കിയെല്ലാം ആ കാലം അതേപടി നിലനിർത്തുന്നു.',
	'calendar.gloss.rank.sunday':
		'ആദിമ തിരുനാൾ — കർത്താവിന്റെ ദിവസം, ഉയിർപ്പു മുതൽ എല്ലാ ആഴ്ചയും ആഘോഷിക്കപ്പെടുന്നു. ഒരു മഹോത്സവമോ കർത്താവിന്റെ തിരുനാളോ മാത്രമേ അതിനെ മാറ്റാൻ കഴിയൂ; ആഗമനകാലത്തും നോമ്പുകാലത്തും ഈസ്റ്റർ കാലത്തും അവയ്ക്കുപോലും കഴിയില്ല.',
	'calendar.gloss.rank.weekday':
		'സ്വന്തമായ ആഘോഷമില്ലാത്ത ദിവസം. കുർബാനയും യാമപ്രാർഥനയും ആ കാലത്തിന്റേതാണ് — അതാണ് ആ കാലത്തെ അറിയാൻ കൊള്ളാവുന്നതാക്കുന്നത്.',
	'calendar.gloss.colour.white':
		'സന്തോഷം. ഈസ്റ്റർ കാലവും ക്രിസ്മസ് കാലവും, പീഡാനുഭവത്തിനു പുറത്തുള്ള കർത്താവിന്റെ ദിവസങ്ങൾ, പരിശുദ്ധ അമ്മ, മാലാഖമാർ, രക്തസാക്ഷികളല്ലാത്ത വിശുദ്ധർ.',
	'calendar.gloss.colour.red':
		'രക്തവും അഗ്നിയും. ഓശാന ഞായറും ദുഃഖവെള്ളിയും, പെന്തക്കുസ്താ, അപ്പസ്തോലന്മാരും സുവിശേഷകരും, രക്തസാക്ഷികളും.',
	'calendar.gloss.colour.green': 'ആണ്ടുവട്ടക്കാലം: പ്രത്യാശയുടെയും വളരുന്നവയുടെയും നിറം.',
	'calendar.gloss.colour.violet':
		'ആഗമനകാലവും നോമ്പുകാലവും, മരിച്ചവർക്കുവേണ്ടിയുള്ള കുർബാനകളിലും ധരിക്കുന്നു.',
	'calendar.gloss.colour.rose':
		'വർഷത്തിൽ രണ്ടു തവണ ധരിക്കുന്നു — ആഗമനകാലത്തിലെ മൂന്നാം ഞായറായ Gaudete, നോമ്പുകാലത്തിലെ നാലാം ഞായറായ Laetare — ഉപവാസം അയയുകയും അവസാനം കാഴ്ചയിൽ വരികയും ചെയ്യുന്നിടത്ത്.',
	'calendar.gloss.colour.black': 'മരിച്ചവർക്കുവേണ്ടിയുള്ള കുർബാനകളിൽ ധരിക്കാം.',
	'calendar.gloss.colour.blue':
		'നീലയുടെ അനുവാദം: സ്പെയിനിലും ഫിലിപ്പീൻസിലും പരിശുദ്ധ സിംഹാസനം അനുവദിച്ച മറ്റു ചുരുക്കം സ്ഥലങ്ങളിലും അമലോദ്ഭവ തിരുനാളിൽ ധരിക്കുന്നു.',
	'calendar.gloss.sundayCycle':
		'ഞായറാഴ്ചത്തെ വായനകൾ മൂന്നു വർഷത്തിലൂടെ പോകുന്നു — എ, ബി, സി — മത്തായി, മർക്കോസ്, ലൂക്കാ എന്നിവരെ മാറിമാറി വായിക്കുന്നു, നോമ്പുകാലത്തും ഈസ്റ്റർ കാലത്തും യോഹന്നാനെ. ചക്രം സഭാവർഷത്തോടൊപ്പം ആഗമനകാലത്തിലെ ഒന്നാം ഞായറാഴ്ച മാറുന്നു.',
	'calendar.gloss.weekdayCycle':
		'സാധാരണ ദിവസങ്ങളിലെ വായനകൾ രണ്ടു വർഷത്തിലൂടെ പോകുന്നു, I ഉം II ഉം: ഒന്നാം വായന മാറുന്നു, സുവിശേഷം മാറുന്നില്ല. ഒരു ആരാധനക്രമ വർഷത്തിന് അത് അവസാനിക്കുന്ന കലണ്ടർ വർഷത്തിന്റെ പേരാണ് — ഒറ്റ വർഷങ്ങൾ I, ഇരട്ട വർഷങ്ങൾ II.',
	'calendar.gloss.psalterWeek':
		'യാമപ്രാർഥന സങ്കീർത്തനങ്ങളെ നാല് ആഴ്ചകളിലായി, I മുതൽ IV വരെ, വിഭജിക്കുന്നു; അവ വർഷം മുഴുവൻ ആവർത്തിക്കുന്നു. യാമപ്രാർഥന ചൊല്ലുന്നവർക്ക്, ഇന്നത്തെ സങ്കീർത്തനങ്ങൾ ഏത് ആഴ്ചയുടേതാണെന്ന് ഇത് പറയുന്നു.',
	'calendar.gloss.obligation':
		'വിശ്വാസികൾ കുർബാനയിൽ പങ്കെടുക്കാനും അതിനു തടസ്സമാകുന്ന ജോലികളിൽനിന്ന് ഒഴിഞ്ഞുനിൽക്കാനും കടപ്പെട്ട ദിവസം. എല്ലാ ഞായറാഴ്ചയും, ഓരോ മെത്രാൻ സമിതിയും നിശ്ചയിച്ച മറ്റു ദിവസങ്ങളും.',
	'calendar.primer.title': 'ആദ്യമായാണോ?',
	'calendar.primer.lead':
		'സഭയ്ക്ക് സ്വന്തമായൊരു വർഷമുണ്ട്. അത് ആഗമനകാലത്തിൽ തുടങ്ങുന്നു, ഈസ്റ്ററിനു ചുറ്റും തിരിയുന്നു, ഓരോ ദിവസത്തിനും ഒരു പേരും ഒരു പദവിയും ഒരു നിറവും നൽകുന്നു — അവയാണ് അന്ന് കുർബാനയിലും യാമപ്രാർഥനയിലും എന്തു പ്രാർഥിക്കണം, എന്തു വായിക്കണം എന്നു തീരുമാനിക്കുന്നത്. അതുകൊണ്ട് „ആണ്ടുവട്ടത്തിലെ ഇരുപത്തിമൂന്നാം ഞായർ“ ഒരു വിലാസമാണ്: വൈദികനോടും ഗായകസംഘത്തോടും വീട്ടിൽ പ്രാർഥിക്കുന്ന ആരോടും ഇന്നത്തേതു ഏതു പ്രാർഥനകളും വായനകളുമാണെന്ന് അതു പറയുന്നു.',
	'calendar.primer.seasons': 'കാലങ്ങൾ',
	'calendar.primer.ranks': 'ഒരു ദിവസം എന്താകാം',
	'calendar.primer.colours': 'നിറങ്ങൾ',
	'calendar.primer.cycles': 'ചക്രങ്ങൾ',
	'calendar.primer.cyclesLead':
		'ഇന്നത്തേക്കു നിശ്ചയിച്ച വായനകളും സങ്കീർത്തനങ്ങളും ഏതെന്ന് ഒരുമിച്ചു പറയുന്ന മൂന്ന് എണ്ണങ്ങൾ.'
};
