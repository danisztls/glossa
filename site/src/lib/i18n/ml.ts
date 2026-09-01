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
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback -- it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content.
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
		'ഈ സൈറ്റ് എന്താണ്, അതിലെ പാഠങ്ങൾ എവിടെനിന്നു വരുന്നു, അവ പുനഃപ്രസിദ്ധീകരിക്കുന്നതിൽ നമ്മുടെ നിലപാട്.'
};
