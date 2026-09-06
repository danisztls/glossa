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
 * rather than descriptive. What is
 * here is the chrome -- including every key `CHROME_KEYS` requires, since an
 * unnamed chrome page fails the sync rather than falling back.
 *
 * TRANSLATION CONFIDENCE: LOW. Written by an LLM with no native reader in
 * the loop, and this is one of the five languages where that is most
 * likely to show — Hebrew Catholic terminology is a small, specific
 * register, and the obvious dictionary word is often not the one the
 * Church uses. Treat every string here as a proposal. Correcting one is a
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
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const he: Dictionary = {
	'nav.bible': 'כתבי הקודש',
	'nav.ccc': 'קטכיזם',
	'nav.compendium': 'תקציר',
	'nav.magisterium': 'המגיסטריום',
	'nav.socialDoctrine': 'תורה חברתית',
	'socialDoctrine.landing.title': 'קומפנדיום התורה החברתית של הכנסייה',
	'socialDoctrine.landing.tagline': 'מה שהכנסייה מלמדת על החיים בחברה, ב־583 סעיפים ממוספרים.',
	'nav.canonLaw': 'משפט קנוני',
	'canonLaw.landing.title': 'קודקס המשפט הקנוני',
	'canonLaw.landing.tagline': 'משפטה של הכנסייה הלטינית, ב־1752 קנונים בשבעה ספרים.',
	'canonLaw.canon': 'קנון',
	'canonLaw.canons': 'קנונים',
	'canonLaw.prevCanon': 'הקנון הקודם',
	'canonLaw.nextCanon': 'הקנון הבא',
	'canonLaw.readFullTitle': 'קריאת הכותר כולו',
	'canonLaw.superseded': 'נוסח שהוחלף על ידי',
	'nav.prayers': 'תפילות',
	'nav.bookmarks': 'סימניות',
	'nav.menu': 'תפריט',
	'nav.summa': 'סומה',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'המשך קריאה',
	'home.tagline':
		'אתר לקריאת כתבי הקודש, הקטכיזם ומסמכי המגיסטריום — חינם, פועל גם ללא חיבור, ואין להירשם לדבר.',
	'home.doors.heading': 'לאן ללכת',
	'home.find.heading': 'או הקלידו הפניה',
	'nav.library': 'ספרייה',
	'nav.learn': 'ללמוד',
	'library.landing.tagline': 'כל האוסף, מדף אחר מדף — עם המקום שבו הפסקת ועם מה שסימנת.',
	'jumpbox.placeholder': 'מעבר אל… (למשל jn 3:16, ccc 1234)',
	'jumpbox.short': 'חיפוש',
	'jumpbox.hint': 'הקישו / או Ctrl+K כדי לעבור להפניה',
	'jumpbox.noMatch': 'אין תוצאות',
	'jumpbox.suggestions': 'הצעות',
	'settings.label': 'הגדרות',
	'darkMode.label': 'מצב כהה',
	'darkMode.auto': 'אוטו׳',
	'darkMode.on': 'פועל',
	'darkMode.off': 'כבוי',
	'loadFailed.title': 'זה לא נטען',
	'loadFailed.hint': 'העמוד קיים — משהו השתבש בעת הבאתו. ניסיון נוסף בדרך כלל מצליח.',
	'loadFailed.retry': 'נסו שוב',
	'loadFailed.retrying': 'מנסה…',
	'fontSize.label': 'גודל הטקסט',
	'fontSize.larger': 'טקסט גדול יותר',
	'fontSize.smaller': 'טקסט קטן יותר',
	'print.label': 'הדפסת עמוד זה',
	'toTop.label': 'חזרה למעלה',
	'edition.label': 'מהדורה',
	'edition.select': 'בחירת מהדורה',
	'edition.current': 'המהדורה הנוכחית',
	'edition.filter': 'חיפוש מהדורות',
	'menu.noMatches': 'אין התאמות',
	'unitNav.previous': 'הקודם',
	'unitNav.next': 'הבא',
	'bible.prevChapter': 'הפרק הקודם',
	'bible.nextChapter': 'הפרק הבא',
	'bible.pickBook': 'ספרים ופרקים',
	'bible.landing.title': 'כתבי הקודש',
	'bible.landing.tagline': 'קראו את כתבי הקודש כולם, ספר אחר ספר, פרק אחר פרק.',
	'bible.landing.books': 'ספרים',
	'bible.introduction': 'מבוא',
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
	'ccc.landing.pairTitle': 'הקטכיזם והתמצית',
	'ccc.landing.tagline':
		'<strong>הקטכיזם</strong> מציג את התורה הקתולית ב־2,865 פסקאות ממוספרות. <strong>התקציר</strong> מציג את אותה תורה ב־598 שאלות ותשובות, לפי אותו מבנה.',
	'ccc.landing.pairTagline': 'הקטכיזם של הכנסייה הקתולית ב־2,865 סעיפים, ותמציתו ב־598 שאלות.',
	'ccc.abbrev': 'קק״כ',
	'compendium.abbrev': 'תמצית',
	'document.library.tagline': 'אנציקליקות, חוקות מועצתיות, צווים והצהרות של המגיסטריום.',
	'doctores.landing.title': 'מלומדי הכנסייה',
	'doctores.landing.tagline': 'כתביהם התיאולוגיים של אבות הכנסייה ומלומדיה.',
	'summa.landing.title': 'סומה תיאולוגיה',
	'summa.landing.tagline': 'תומאס אקווינס, באנגלית ובלטינית שבה כתב.',
	'index.division': 'חלוקה',
	'prayers.landing.title': 'תפילות נפוצות',
	'prayers.landing.tagline': 'תפילות עם הטקסט הלטיני לצדן.',
	'prayers.seeAlso': 'ראו גם',
	'anchor.actions': 'פעולות על ההפניה',
	'anchor.copy': 'העתקת הטקסט',
	'anchor.copyLink': 'העתקת הקישור',
	'anchor.view': 'הצגה',
	'anchor.copied': 'הועתק',
	'anchor.copyFailed': 'ההעתקה נכשלה',
	'bookmark.add': 'סימנייה',
	'bookmark.remove': 'הסרת הסימנייה',
	'bookmark.library': 'סימניות',
	'bookmark.library.tagline': 'כל מה שסימנתם בשעת הקריאה.',
	'bookmark.empty': 'עדיין לא סומן דבר.',
	'bookmark.emptyHint':
		'לחצו על מספר של פסוק או של פסקה ובחרו בסימנייה, או השתמשו בכפתור הסימנייה שבעמוד.',
	'bookmark.deviceOnly':
		'הסימניות נשמרות בדפדפן זה בלבד. הן אינן נשלחות לשום מקום, וניקוי נתוני הדפדפן מוחק אותן.',
	'bookmark.unavailable': 'אינו במהדורה שאתם קוראים',
	'colophon.title': 'קולופון',
	'colophon.lede': 'מהו אתר זה, מהיכן באים הטקסטים שלו, ומהי עמדתנו בנוגע לשעתוקם.',
	'colophon.whatThisIs': 'מה זה',
	'colophon.whatThisIsBody':
		'Glossa Catholica הוא אתר לקריאת כתבי הקודש, הקטכיזם, התמצית ומסמכי המגיסטריום, באנגלית, בפורטוגזית ובלטינית. הוא קיים כדי שייקרא, ולא נדרש ממך דבר נוסף כדי לקרוא בו:',
	'colophon.pointFree': 'חינם, ותמיד חינם. אין חומת תשלום, אין מנוי, אין דבר למכירה.',
	'colophon.pointNoAds': 'אין פרסומות, ואין מיקום ממומן מכל סוג שהוא.',
	'colophon.pointNoAccounts': 'אין חשבונות. אין להירשם לדבר, אין להתחבר לדבר.',
	'colophon.pointNoTracking':
		'אין סקריפטים למעקב, אין קוד של צד שלישי, אין עוגיות. רק ספירות שימוש אנונימיות, בלי דבר שמזהה אותך.',
	'colophon.pointOffline':
		'נבנה כך שימשיך לפעול גם ללא חיבור לאחר שביקרת בו, כדי שחיבור לקוי לא יהיה מכשול לקריאה.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica הוא מפעל פרטי של מאמינים הדיוטות. אין לו כל אישור כנסייתי והוא אינו מדבר בשום סמכות משל עצמו.',
	'footer.notEndorsed': 'ללא אישור הכס הקדוש',
	'colophon.textsTitle': 'הטקסטים',
	'colophon.textsBody':
		'כל טקסט בא ממקור נקוב בשם, וכל יצירה רושמת את מהדורתה, את עמוד המקור שלה ואת התאריך שבו הובאה. כתבי הקודש משתמשים בתרגומים שברשות הרבים; הקטכיזם, התמצית ומסמכי המגיסטריום באים מן הטקסטים שהכס הקדוש עצמו פרסם.',
	'colophon.textsFidelity':
		'הטקסט לעולם אינו מקוצר, לעולם אינו מנוסח מחדש, לעולם אינו נכתב מחדש, ולעולם אינו מוצב לצד פרסומת. אנו כן מתקנים פגמים גלויים — מילה שנשמטה, ציטוט שנפגם, תגיות שבלעו פסקה — תמיד לכיוון מה שהמקור עצמו מדפיס, לעולם לא לכיוון מה שנראה לנו שהיה צריך לומר.',
	'colophon.countBible': 'מהדורות של המקרא',
	'colophon.countDocuments': 'מסמכי מגיסטריום',
	'colophon.copyrightTitle': 'זכויות יוצרים',
	'colophon.copyrightBody1':
		'הקטכיזם, התמצית ומסמכי המגיסטריום הם רכושם של בעלי הזכויות בהם — בעיקר Libreria Editrice Vaticana והדיקסטריה לתקשורת.',
	'colophon.copyrightBody2':
		'כל יצירה מציגה את הודעת זכויות היוצרים של בעל הזכויות שלה, בניסוחו שלו, ומקשרת אל העמוד שממנו נלקחה.',
	'colophon.copyrightBody3': 'אם יש בידך זכויות בטקסט כלשהו כאן ואתה מעדיף שלא יפורסם, כתוב לנו.',
	'colophon.contactTitle': 'יצירת קשר',
	'colophon.contactBody': 'לכל דבר שהוא, ובכלל זה האמור לעיל:',
	'colophon.contactPending':
		'עדיין לא נקבעה כתובת ליצירת קשר. אין לפרסם אתר זה לציבור עד שתהיה לו אחת — ההתחייבות שלעיל חסרת משמעות בלי דרך להגיע אלינו.',
	'colophon.illustrationsTitle': 'האיורים',
	'colophon.illustrationsBody':
		'המקרא נושא את תחריטיו של גוסטב דורה, כל אחד מוצב אצל הפסוק שהוא מתאר — האחרון והגדול שבמחזורי המקרא שלו, חתוך בעץ על פי רישומיו ומודפס יחד עם הטקסט ולא מקובץ בסוף.',
	'colophon.illustrationsRights':
		'הם ברשות הרבים, כפי שמראים התאריכים שלהלן, ושעתוק צילומי נאמן של תחריט שברשות הרבים אינו נושא זכות יוצרים חדשה משלו.',
	'colophon.countPlates': 'תחריטים',
	'colophon.countPlateChapters': 'פרקים מאוירים',
	'art.about': 'על התמונה הזו',
	'art.detail': 'פרט',
	'colophon.typeTitle': 'הגופן',
	'colophon.typeBody':
		'סודר בגופן EB Garamond, החייאתם של גאורג דופנר ואוקטביו פרדו לאותיות שחתך קלוד גארמון בשנות ה-1590 — המסורת ההומניסטית שבה מדפיסה הכנסייה מאז הרנסנס. הכתב הקירילי שלו הוא מאותן ידיים אך אינו מחיה דבר: גארמון קירילי מעולם לא נחתך, ולכן הרוסית מסודרת בצורה שצוירה כדי לעמוד לצד השאר.',
	'colophon.typeArabic':
		"הערבית מצויה מחוץ להישג ידו לחלוטין, והיא מסודרת בגופן Amiri — החייאתו של ח'אלד חוסני לכתב הנסח' שנחתך עבור בית הדפוס בולאק בקהיר בשנת 1905, שנבחר מאותו נימוק כמו גופן הטקסט: כתב ספר היסטורי מסוים ולא רישום בן זמננו.",
	'colophon.typeInitials':
		'אותיות הפתיחה הן Pirata One, כתב גותי שאותיותיו הגדולות נותרות קריאות בגודל שאות פתיחה דורשת, ו— עבור הרוסית — Ponomar, המשחזר את הכתב הסלאבי-כנסייתי של דפוס הסינוד. Ponomar מסדר את אות הפתיחה ולעולם לא את הטקסט: אנציקליקה מודרנית שתסודר כולה בכתב הסינוד תאמר דבר שאינו נכון על מה שהיא. כולם מורשים תחת SIL Open Font License ומוגשים מאתר זה ולא מצד שלישי, כך שקריאת עמוד אינה מבקשת דבר משרת של אחר.',
	'copyright.sourceTitle': 'פתיחת עמוד המקור',
	'copyright.sourceLabel': 'מקור',
	'lang.label': 'שפה',
	'lang.filter': 'חיפוש שפות',
	'lang.more': 'שפות נוספות'
};
