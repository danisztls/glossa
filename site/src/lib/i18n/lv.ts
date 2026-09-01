/**
 * Latviešu UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 20 editions in Latviešu and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback: it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content. What is
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

export const lv: Dictionary = {
	'nav.bible': 'Bībele',
	'nav.ccc': 'Katehisms',
	'nav.compendium': 'Kompendijs',
	'nav.magisterium': 'Maģistērijs',
	'nav.prayers': 'Lūgšanas',
	'nav.bookmarks': 'Grāmatzīmes',
	'nav.menu': 'Izvēlne',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Turpināt lasīt',
	'home.works': 'Bibliotēka',
	'home.ccc.heading': 'Katehisms un Kompendijs',
	'home.magisterium.mostRecent': 'Jaunākie',
	'home.prayers.heading': 'Lūgšanas',
	'unitNav.previous': 'Iepriekšējais',
	'unitNav.next': 'Nākamais',
	'bible.landing.title': 'Bībele',
	'bible.landing.tagline': 'Lasiet visu Bībeli, grāmatu pēc grāmatas, nodaļu pēc nodaļas.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateihs',
	'bible.group.historical': 'Vēsturiskās grāmatas',
	'bible.group.wisdom': 'Gudrības grāmatas',
	'bible.group.prophetic': 'Praviešu grāmatas',
	'bible.group.gospels': 'Evaņģēliji',
	'bible.group.acts': 'Apustuļu darbi',
	'bible.group.pauline': 'Pāvila vēstules',
	'bible.group.catholicLetters': 'Katoliskās vēstules',
	'bible.group.revelation': 'Atklāsmes grāmata',
	'ccc.landing.title': 'Katoliskās Baznīcas katehisms',
	'ccc.landing.tagline':
		'<strong>Katehisms</strong> izklāsta katolisko mācību 2865 numurētos punktos. <strong>Kompendijs</strong> to pašu mācību sniedz kā 598 jautājumus un atbildes pēc tā paša izkārtojuma.',
	'document.library.tagline':
		'Enciklikas, koncila konstitūcijas, dekrēti un Maģistērija deklarācijas.',
	'doctores.landing.title': 'Baznīcas doktori',
	'doctores.landing.tagline': 'Baznīcas tēvu un Baznīcas doktoru teoloģiskie darbi.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Toms Akvīnietis, angliski un latīņu valodā, kurā viņš rakstīja.',
	'prayers.landing.title': 'Ikdienas lūgšanas',
	'prayers.landing.tagline': 'Lūgšanas ar latīņu tekstu blakus.',
	'colophon.title': 'Kolofons',
	'colophon.lede':
		'Kas ir šī vietne, no kurienes nāk tās teksti un kāda ir mūsu nostāja par to atveidošanu.'
};
