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
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback -- it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content.
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
	'colophon.lede': 'Ihe saịtị a bụ, ebe ederede ya si bịa, na ebe anyị guzo banyere ịmegharị ha.'
};
