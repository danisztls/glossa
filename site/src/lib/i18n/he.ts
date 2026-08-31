/**
 * עברית UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 2 editions in עברית and its readers were reading
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
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const he: Dictionary = {
	'nav.bible': 'כתבי הקודש',
	'nav.ccc': 'קטכיזם',
	'nav.compendium': 'תקציר',
	'nav.magisterium': 'המגיסטריום',
	'nav.prayers': 'תפילות',
	'nav.bookmarks': 'סימניות',
	'nav.menu': 'תפריט',
	'nav.summa': 'סומה',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'המשך קריאה',
	'home.works': 'ספרייה',
	'home.ccc.heading': 'הקטכיזם והתקציר',
	'home.magisterium.mostRecent': 'החדשים ביותר',
	'home.prayers.heading': 'תפילות',
	'unitNav.previous': 'הקודם',
	'unitNav.next': 'הבא',
	'bible.landing.title': 'כתבי הקודש',
	'bible.landing.tagline': 'קראו את כתבי הקודש כולם, ספר אחר ספר, פרק אחר פרק.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'חמישה חומשי תורה',
	'bible.group.historical': 'ספרים היסטוריים',
	'bible.group.wisdom': 'ספרי חוכמה',
	'bible.group.prophetic': 'ספרי נבואה',
	'bible.group.gospels': 'הבשורות',
	'bible.group.acts': 'מעשי השליחים',
	'bible.group.pauline': 'איגרות פאולוס',
	'bible.group.catholicLetters': 'איגרות קתוליות',
	'bible.group.revelation': 'חזון יוחנן',
	'ccc.landing.title': 'הקטכיזם של הכנסייה הקתולית',
	'ccc.landing.tagline':
		'<strong>הקטכיזם</strong> מציג את התורה הקתולית ב־2,865 פסקאות ממוספרות. <strong>התקציר</strong> מציג את אותה תורה ב־598 שאלות ותשובות, לפי אותו מבנה.',
	'document.library.tagline': 'אנציקליקות, חוקות מועצתיות, צווים והצהרות של המגיסטריום.',
	'doctores.landing.title': 'מלומדי הכנסייה',
	'doctores.landing.tagline': 'כתביהם התיאולוגיים של אבות הכנסייה ומלומדיה.',
	'summa.landing.title': 'סומה תיאולוגיה',
	'summa.landing.tagline': 'תומאס אקווינס, באנגלית ובלטינית שבה כתב.',
	'prayers.landing.title': 'תפילות נפוצות',
	'prayers.landing.tagline': 'תפילות עם הטקסט הלטיני לצדן.',
	'colophon.title': 'קולופון',
	'colophon.lede': 'מהו אתר זה, מהיכן באים הטקסטים שלו, ומהי עמדתנו בנוגע לשעתוקם.'
};
