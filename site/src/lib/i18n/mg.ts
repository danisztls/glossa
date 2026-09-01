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
 * DELIBERATELY PARTIAL, and not as a placeholder. The long colophon prose is
 * absent, so it renders in English through `t()`'s per-key fallback: it is the
 * page explaining how carefully this site handles other people's words, and a
 * machine translation of it would be the one page whose form contradicts its
 * content. Anything else missing here is a phrase this file was not confident
 * enough about to print to a reader who would know better. Filling those in
 * is welcome; guessing at them is not.
 *
 * TRANSLATION CONFIDENCE: LOW. Written by an LLM with no native reader in
 * the loop, and this is one of the five languages where that is most
 * likely to show — only the terms read off `ccc.mg` above are grounded,
 * and the rest of this file is not. Treat every string here as a proposal.
 * Correcting one is a one-line change and needs no permission; because
 * `t()` falls back to English per key, DELETING a doubtful line is also a
 * valid fix and strictly better than leaving a wrong one standing.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const mg: Dictionary = {
	'nav.bible': 'Baiboly',
	'nav.ccc': 'Katesizy',
	'nav.compendium': 'Famintinana',
	'nav.magisterium': 'Fampianaran’ny Fiangonana',
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
	'appearance.label': 'Endrika',
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
		'Ny amin’ity tranonkala ity, ny niavian’ny soratra ao aminy, ary ny toerana ijoroanay amin’ny famerenana azy ireo.'
};
