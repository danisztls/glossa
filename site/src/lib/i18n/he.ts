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
	'nav.sections': 'מדורים',
	'nav.works': 'יצירות',
	'nav.pages': 'עמודים',
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
	'schola.landing.title': 'מהיכן להתחיל',
	'schola.landing.tagline':
		'מדריך קצר למה שיש כאן: מהו כל אחד מן הספרים האלה, כיצד נכתבת הפניה אליו, כיצד למצוא מקום, וסדרי קריאה שהכנסייה הציעה.',
	'schola.start.heading': 'אם כל זה חדש לכם',
	'schola.start.body': 'ההתחלה הטובה ביותר היא ',
	'schola.start.bodyAfter':
		': אותה תורה שבקטכיזם, קצרה בהרבה, כתובה בשאלות ותשובות. היקפה כעשירית, ואינה מניחה דבר מראש.',
	'schola.bible.heading': 'אם מעולם לא קראתם בכתבי הקודש',
	'schola.bible.library':
		'אין זה ספר אחד אלא שבעים ושלושה, שנכתבו במשך יותר מאלף שנים ונכרכו בסדר שהכנסייה קבעה — לא בסדר שבו התרחשו הדברים, ולא בסדר הקל ביותר לקריאה. רובם מתחילים בעמוד הראשון ופוסקים כמה שבועות אחר כך, בתוך פרק ארוך של חוק עתיק, משום שאיש עדיין לא אמר להם לשם מה זה.',
	'schola.bible.step.gospel': 'התחילו בבשורה',
	'schola.bible.start':
		'אחד מארבעה ספרים קצרים על חיי ישוע, עמוק בפנים ולא בראש. אין זה רעיוננו: ועידה של הכנסייה ביקשה שילמדו את השימוש הנכון בכתבי הקודש, „ובייחוד בברית החדשה ומעל לכול בבשורות“. היא לא נקבה באחת מהן, ואף אנו לא ננקוב.',
	'schola.bible.whichGospel':
		'שלוש מוצעות בדרך כלל, משלוש סיבות שונות. כל אחת מהן מקום טוב להיות בו.',
	'schola.bible.gospel.mark':
		'הקצרה ביותר. אפשר לקרוא אותה כולה בשעות אחר צהריים אחת, ולסיים אחת שווה בהתחלה יותר מלבחור את הטובה ביותר.',
	'schola.bible.gospel.luke':
		'נכתבה לאדם מחוץ לאמונה שביקש את הסיפור מסודר על פי הסדר — וייתכן שזה בדיוק אתם. היא ממשיכה ישירות אל מעשי השליחים, ולכן היא למעשה מחציתו הראשונה של ספר ארוך יותר.',
	'schola.bible.gospel.john':
		'זו שאומרת במפורש מדוע נכתבה: „למען תאמינו“. מילים פשוטות, והיא הולכת ישר אל השאלה מיהו ישוע.',
	'schola.bible.step.acts': 'אחר כך מה שקרה לאחר מכן',
	'schola.bible.thenActs': 'משסיימתם אחת, קראו מה עשו אלה שהכירוהו לאחר שהלך.',
	'schola.bible.acts.why':
		'שלושים השנים שאחרי סוף הבשורות: כמה עשרות אנשים מבוהלים, וכיצד הגיע מה שראו אל קצה האימפריה.',
	'schola.bible.step.old': 'אחר כך המחצית הקדומה',
	'schola.bible.thenOld':
		'לא מן העמוד הראשון, ולא כולה. מקומות מעטים נושאים את הסיפור, והם אלה שהבשורות שבות ומצביעות עליהם.',
	'schola.bible.ot.beginnings': 'כיצד זה מתחיל, וכיצד זה משתבש.',
	'schola.bible.ot.promise': 'משפחה אחת, והבטחה שניתנה לה והשורדת את כל אנשיה.',
	'schola.bible.ot.exodus': 'עם שהוצא מעבדות, וחוק שניתן לו לחיות לפיו.',
	'schola.bible.ot.psalms':
		'אין זה סיפור: מאה וחמישים תפילות ושירים. קראו אחד בכל פעם, בכל סדר. הכנסייה מתפללת אותם עד היום מדי יום.',
	'schola.bible.bothWays':
		'תזהו דברים, וזו הכוונה ולא צירוף מקרים. הכנסייה קוראת את הספרים הקדומים לאור המשיח ואת המאוחרים לאור מה שקדם — כל מחצית מסבירה את רעותה, ולכן אין קוראים אף אחת מהן לבדה.',
	'schola.guide.heading': 'כיצד להתמצא',
	'schola.guide.lede': 'הטקסט הוא כל העמוד; כל השאר הוא פקד שאפשר להתעלם ממנו עד שתרצו בו.',
	'schola.guide.top.heading': 'הסרגל בראש כל עמוד',
	'schola.guide.reading.heading': 'הסרגל מעל טקסט',
	'schola.feature.search':
		'הקלידו הפניה בתיבה שלמעלה — פרק ופסוק, מספר סעיף, שם של מסמך — והיא מושלמת תוך כדי הקלדה. הקישו / או Ctrl+K מכל מקום, ו־? לשאר הקיצורים.',
	'schola.feature.languages':
		'הממשק והטקסט נבחרים בנפרד, כך שתוכלו לקרוא יצירה בשפה אחת בעוד הכפתורים נשארים באחרת. היכן שליצירה כמה מהדורות בשפתכם, אתם בוחרים גם ביניהן.',
	'schola.feature.settings': 'גודל הטקסט, בהיר או כהה, ספיה, וכמה מן המנגנון אתם רוצים לצד הטקסט.',
	'schola.feature.offline':
		'הוסיפו את האתר למסך הבית והוא ייפתח כיישום. אפשר להוריד יצירות שלמות ולקרוא בלא חיבור.',
	'schola.feature.contents':
		'חלוקות היצירה שאתם בתוכה — ספרים, חלקים, פרקים — כדי לנוע בתוכה בלי לחזור להתחלה.',
	'schola.feature.compare':
		'שתי מהדורות של אותו מקום, זו לצד זו — הלטינית לצד שפתכם, או תרגום אחד לצד אחר.',
	'schola.feature.apparatus':
		'הערותיה של המהדורה עצמה, וכל פירוש שנכתב על הטקסט, מוצעים לצדו ולא מתחתיו. ההפניות בתוך הטקסט הן קישורים, כך שהפניה מוליכה לאן שהיא מצביעה.',
	'schola.feature.focus':
		'מפנה הכול חוץ מן הטקסט. היציאה נשארת במקום שבו היה הסרגל, כדי שדבר לא ייכלא מאחוריו.',
	'schola.books.heading': 'מה יש כאן, וכיצד מצטטים',
	'schola.books.lede':
		'כל אחד מאלה הוא סוג אחר של ספר, ולכל אחד מפנים במספר משלו. הדוגמאות מראות את הצורה: הקלידו כזו בתיבת החיפוש ותגיעו אל המקום.',
	'schola.cite.label': 'מצוטט',
	'schola.what.scripture':
		'כתבי הקודש כפי שהכנסייה מקבלת אותם, בשתי הבריתות. כל השאר כאן נקרא לאורם.',
	'schola.cite.scripture': 'ספר, פרק ופסוק, בקיצורים שמהדורתכם מדפיסה',
	'schola.what.catechism':
		'תמצית של מה שהכנסייה הקתולית מאמינה, בכרך אחד. אין הוא עצמו מקור: הוא מאסף את כתבי הקודש, את האבות, את הליטורגיה ואת תורת הכנסייה, וכל סעיף אומר מניין בא מה שהוא אומר.',
	'schola.cite.catechism': 'לפי מספר הסעיף, הרץ ברציפות מן העמוד הראשון עד האחרון',
	'schola.what.compendium': 'אותה תורה מוצגת בשאלות ותשובות, בכעשירית ההיקף.',
	'schola.cite.compendium': 'לפי מספר השאלה',
	'schola.what.magisterium':
		'מה שהאפיפיורים והוועידות אכן כתבו — אנציקליקות, חוקות, צווים, הצהרות — כל אחד מכוון לרגע מסוים ולשאלה מסוימת. כל אחד נודע לפי מילותיו הראשונות בלטינית.',
	'schola.cite.magisterium': 'לפי שם המסמך, ואחר כך מספר סעיף בתוכו',
	'schola.what.social':
		'תורת הכנסייה על העבודה, הקניין, המשפחה, הפוליטיקה והשלום, מאוספת מאותם מסמכים לספר אחד.',
	'schola.cite.social': 'לפי מספר הסעיף, תחת הקיצור שהיצירה משתמשת בו לעצמה',
	'schola.what.law': 'משפט ולא תורה. הוא אומר מה הכנסייה דורשת, והוא מתוקן.',
	'schola.cite.law': 'לפי קנון, כך נקראות יחידותיו הממוספרות',
	'schola.what.doctors':
		'התאולוגים שהכנסייה הכריזה עליהם כמלומדי הכנסייה. אין בכך סמכות רשמית, גדול ככל שיהיה המחבר.',
	'schola.cite.doctors': 'לפי חלק, ואחר כך שאלה — חלוקותיה של הסומה עצמה',
	'schola.what.prayers': 'המילים שהכנסייה מתפללת, והלטינית לצדן.',
	'schola.cite.prayers': 'לפי שם; אין מספרים לצטט',
	'schola.places.heading': 'לא טקסטים, אלא מקומות באתר הזה',
	'schola.what.library': 'כל יצירות האתר ברשימה אחת, מקובצות לפי נושא ולא לפי סוג.',
	'schola.what.calendar':
		'היום הליטורגי — התקופה, הצבע ומי נזכר — עבור המדינה שאת לוחה אתם נוהגים לפיו.',
	'schola.what.bookmarks':
		'מקומות שסימנתם, והיכן הפסקתם לאחרונה בכל יצירה. שניהם נשמרים בדפדפן הזה ואינם נשלחים לשום מקום.',
	'ccc.noCounterpart': 'אין מקבילה ביצירה האחרת',
	'jumpbox.placeholder': 'מעבר אל… (למשל jn 3:16, ccc 1234)',
	'jumpbox.short': 'חיפוש',
	'jumpbox.hint': 'הקישו / או Ctrl+K כדי לעבור להפניה',
	'jumpbox.noMatch': 'אין תוצאות',
	'jumpbox.suggestions': 'הצעות',
	'settings.label': 'הגדרות',
	'apparatus.label': 'מנגנון',
	'apparatus.editionNotes': 'הערות מהדורה זו',
	'apparatus.commentary': 'פירוש',
	'apparatus.inCommentary': 'כלול בפירוש שלמעלה.',
	'darkMode.label': 'מצב כהה',
	'darkMode.auto': 'אוטו׳',
	'darkMode.on': 'פועל',
	'darkMode.off': 'כבוי',
	'sepia.label': 'ספיה',
	'sepia.lightOnly': 'מצב בהיר בלבד',
	'sepia.noHue': 'לא במונוכרום',
	'oled.label': 'שחור OLED',
	'oled.darkOnly': 'מצב כהה בלבד',
	'mono.label': 'מונוכרום',
	'mono.hint':
		'מגדיר את העמוד כולו בגוון אפור אחד, כך שדבר אינו נבדל בצבעו. הספיה כבויה כל עוד מצב זה פעיל.',
	'advanced.label': 'מתקדם',
	'library.title': 'ספרייה לא מקוונת',
	'library.lede': 'טקסטים ששמורים במכשיר הזה נפתחים בלי כל חיבור לרשת.',
	'library.essentials': 'תפילות ותקציר',
	'library.illustrations': 'מקרא (איורים)',
	'library.illustrationsDetail': 'מקרא (איורים ברזולוציה גבוהה)',
	'library.other': 'טקסטים אחרים',
	'library.everything': 'הכול',
	'library.downloadAll': 'הורדת הכול',
	'library.download': 'הורדה',
	'library.downloaded': 'במכשיר הזה',
	'library.offlineNote': 'כדי להוריד דבר כלשהו, יש לכבות את המצב הלא מקוון.',
	'library.remove': 'הסרה מהמכשיר הזה',
	'library.removeConfirm': 'להסיר?',
	'library.forget': 'הסרת ההורדות',
	'library.forgetConfirm': 'להסיר הכול?',
	'offline.label': 'מצב לא מקוון',
	'offline.hint':
		'אינו משתמש ברשת כלל: שום דבר אינו מורד, אין בדיקת עדכונים, ושום דבר אינו נמדד. רק טקסטים שכבר במכשיר הזה ייפתחו.',
	'offline.notDownloaded': 'לא במכשיר הזה',
	'loadFailed.title': 'זה לא נטען',
	'loadFailed.hint': 'העמוד קיים — משהו השתבש בעת הבאתו. ניסיון נוסף בדרך כלל מצליח.',
	'loadFailed.retry': 'נסו שוב',
	'loadFailed.retrying': 'מנסה…',
	'offline.turnOff': 'כיבוי המצב הלא מקוון',
	'fontSize.label': 'גודל הטקסט',
	'fontSize.larger': 'טקסט גדול יותר',
	'fontSize.smaller': 'טקסט קטן יותר',
	'print.label': 'הדפסת עמוד זה',
	'toTop.label': 'חזרה למעלה',
	'install.label': 'התקנת Glossa',
	'install.hint.label': 'הוספה למסך הבית',
	'install.hint.title': 'הוספת Glossa למסך הבית שלכם',
	'install.hint.stepBefore': 'הוא נפתח כמו יישום וקורא גם ללא חיבור. הקישו על',
	'install.hint.stepAfter': 'ואז על „הוספה למסך הבית“.',
	'install.hint.dismiss': 'התעלמות',
	'update.label': 'מהדורה חדשה זמינה',
	'update.title': 'מהדורה חדשה מוכנה',
	'update.body': 'רעננו כדי לקבל את הטקסטים והתיקונים העדכניים ביותר.',
	'update.action': 'רענון',
	'update.dismiss': 'לא עכשיו',
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
	'bible.landing.random': 'בר מזל',
	'bible.landing.books': 'ספרים',
	'bible.chapterUnavailable': 'אינו זמין במהדורה זו',
	'bible.introduction': 'מבוא',
	'bible.introUnavailable': 'אין עדיין מבוא בשפה זו',
	'bible.introSource': 'המבואות אינם חלק מכתבי הקודש.',
	'bible.testament.ot': 'הברית הישנה',
	'bible.testament.nt': 'הברית החדשה',
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
	'ccc.prevParagraph': 'הפסקה הקודמת',
	'ccc.nextParagraph': 'הפסקה הבאה',
	'ccc.inBrief': 'בקצרה',
	'ccc.landing.title': 'הקטכיזם של הכנסייה הקתולית',
	'ccc.landing.pairTitle': 'הקטכיזם והתמצית',
	'ccc.landing.tagline':
		'<strong>הקטכיזם</strong> מציג את התורה הקתולית ב־2,865 פסקאות ממוספרות. <strong>התקציר</strong> מציג את אותה תורה ב־598 שאלות ותשובות, לפי אותו מבנה.',
	'ccc.landing.pairTagline': 'הקטכיזם של הכנסייה הקתולית ב־2,865 סעיפים, ותמציתו ב־598 שאלות.',
	'ccc.tableOfContents': 'תוכן העניינים',
	'ccc.related': 'ראו גם',
	'compendium.landing.title': 'תקציר הקטכיזם',
	'compendium.landing.tagline': 'שאלות ותשובות המסכמות את הקטכיזם של הכנסייה הקתולית.',
	'compendium.question': 'שאלה',
	'compendium.answer': 'תשובה',
	'compendium.tableOfContents': 'תוכן העניינים',
	'compendium.prevQuestion': 'השאלה הקודמת',
	'compendium.nextQuestion': 'השאלה הבאה',
	'compendium.condenses': 'מסכם קק״כ ¶¶',
	'ccc.abbrev': 'קק״כ',
	'ccc.condensedIn': 'בתקציר',
	'compendium.abbrev': 'תמצית',
	'compendium.noQuestionNumber': 'אין מספר שאלה במאגר זה',
	'document.library.tagline': 'אנציקליקות, חוקות מועצתיות, צווים והצהרות של המגיסטריום.',
	'document.filter.heading': 'סינון',
	'document.filter.author': 'מחבר',
	'document.filter.kind': 'סוג',
	'document.filter.subject': 'נושא',
	'document.filter.search': 'חיפוש מסמכים',
	'document.filter.clear': 'ניקוי',
	'document.filter.results': 'מסמכים מוצגים',
	'document.filter.noResults': 'אף מסמך אינו תואם לסינון הנוכחי.',
	'document.tableOfContents': 'תוכן העניינים',
	'document.startReading': 'התחלת קריאה',
	'document.readFullDocument': 'קריאת המסמך כולו',
	'document.section': 'סעיף',
	'document.prevSection': 'הקודם',
	'document.nextSection': 'הבא',
	'document.kind.conciliarConstitution': 'חוקה מועצתית',
	'document.kind.conciliarDecree': 'צו',
	'document.kind.conciliarDeclaration': 'הצהרה',
	'document.kind.encyclical': 'אנציקליקה',
	'document.kind.apostolicExhortation': 'אדהורטציה אפוסטולית',
	'document.kind.apostolicConstitution': 'חוקה אפוסטולית',
	'document.kind.cdfDeclaration': 'הצהרת ה-CDF',
	'document.kind.cdfInstruction': 'הוראת ה-CDF',
	'document.kind.cdfLetter': 'איגרת ה-CDF',
	'document.kind.cdfDoctrinalNote': 'הערת ה-CDF הדוקטרינרית',
	'document.kind.cdfResponsum': 'תשובת ה-CDF',
	'document.kind.cdfConsiderations': 'שיקולי ה-CDF',
	'document.kindPlural.conciliarConstitution': 'חוקות מועצתיות',
	'document.kindPlural.conciliarDecree': 'צווים',
	'document.kindPlural.conciliarDeclaration': 'הצהרות',
	'document.kindPlural.encyclical': 'אנציקליקות',
	'document.kindPlural.apostolicExhortation': 'אדהורטציות אפוסטוליות',
	'document.kindPlural.apostolicConstitution': 'חוקות אפוסטוליות',
	'document.kindPlural.cdfDeclaration': 'הצהרות ה-CDF',
	'citation.unavailable': 'אין טקסט מקור זמין להערה זו.',
	'doctores.landing.title': 'מלומדי הכנסייה',
	'doctores.landing.tagline': 'כתביהם התיאולוגיים של אבות הכנסייה ומלומדיה.',
	'summa.landing.title': 'סומה תיאולוגיה',
	'summa.landing.tagline': 'תומאס אקווינס, באנגלית ובלטינית שבה כתב.',
	'summa.tableOfContents': 'תוכן העניינים',
	'summa.part': 'חלק',
	'summa.question': 'שאלה',
	'summa.article': 'מאמר',
	'summa.questionShort': 'ש׳',
	'summa.articleShort': 'מאמ׳',
	'summa.titleFromEdition': 'הכותרת מן מהדורת {lang}',
	'summa.titlesFromEdition': 'הכותרות ממהדורת {lang} — מהדורה זו אינה מדפיסה אף אחת',
	'summa.prologue': 'הקדמה',
	'summa.objection': 'קושיה',
	'summa.sedContra': 'לעומת זאת',
	'summa.corpus': 'אני משיב',
	'summa.reply': 'תשובה לקושיה',
	'summa.preamble': 'הערה',
	'summa.prevQuestion': 'השאלה הקודמת',
	'summa.nextQuestion': 'השאלה הבאה',
	'summa.noEditionInYourLanguage': 'לסומה אין מהדורה בשפתכם. היא מוצגת ב{lang}.',
	'summa.noLatinSupplement': 'התוספת קיימת באנגלית בלבד — היא חוברה לאחר מותו של אקווינס.',
	'index.division': 'חלוקה',
	'index.showSubsections': 'הצגת תת-החלוקות',
	'index.hideSubsections': 'הסתרת תת-החלוקות',
	'prayers.landing.title': 'תפילות נפוצות',
	'prayers.landing.tagline': 'תפילות עם הטקסט הלטיני לצדן.',
	'prayers.tableOfContents': 'תוכן העניינים',
	'prayers.gloss.versicle': 'הפסוק שמוביל התפילה אומר או שר לבדו; הקהל משיב עליו בתשובה שאחריו.',
	'prayers.gloss.response': 'התשובה שהקהל אומר או שר יחד, בתשובה לפסוק שלפניה.',
	'prayers.seeAlso': 'ראו גם',
	'prayers.prevPrayer': 'התפילה הקודמת',
	'prayers.nextPrayer': 'התפילה הבאה',
	'prayers.rosary.today': 'היום',
	'prayers.rosary.todayHeading': 'רזי היום',
	'prayers.rosary.openingPrayer': 'תפילת הפתיחה',
	'prayers.rosary.decadePrayers': 'תפילות העשיריה',
	'ref.tooltip.loading': 'טוען…',
	'ref.tooltip.openCcc': 'פתיחה בקטכיזם',
	'ref.tooltip.openBible': 'פתיחה בכתבי הקודש',
	'ref.tooltip.openCompendium': 'פתיחה בתקציר',
	'ref.preview.open': 'פתיחה',
	'ref.cf': 'השוו׳',
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
	'bookmark.about': 'על הסימניות האלה',
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
	'colophon.privacyTitle': 'פרטיות',
	'colophon.privacyBody1':
		'אין חשבונות, אין עוגיות, אין פרסומות, ואין קוד של צד שלישי. שום דבר כאן אינו עוקב אחריכם אל מחוץ לאתר הזה.',
	'colophon.privacyBody2':
		'אנו אכן סופרים כיצד האתר משמש: מדידה אחת לכל ביקור, כשכל שדה הוא טווח ולא ערך מדויק — כמה זמן שהיתם, כמה פעמים הייתם כאן, אילו יצירות פתחתם. המדינה שלכם נספרת בנפרד, בלי שדבר מחבר אותה לשאר הנתונים. זה מתאר ביקור, לא מבקר, ונשמר במשך {days} ימים.',
	'colophon.privacyBody3':
		'לעולם אינו נשלח: מה שאתם מקלידים בתיבת החיפוש, איזה קטע היה פתוח אצלכם, או כל דבר שיכול לזהות את המכשיר שלכם שוב. ההגדרות, הסימניות והטקסטים שהורדתם נשארים במכשיר שלכם.',
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
	'plates.scansBy': 'הסריקות באדיבות',
	'plates.enlarge': 'הגדלת {title}',
	'plates.zoom': 'תקריב',
	'art.about': 'על התמונה הזו',
	'art.detail': 'פרט',
	'colophon.typeTitle': 'הגופן',
	'colophon.typeBody':
		'סודר בגופן EB Garamond, החייאתם של גאורג דופנר ואוקטביו פרדו לאותיות שחתך קלוד גארמון בשנות ה-1590 — המסורת ההומניסטית שבה מדפיסה הכנסייה מאז הרנסנס. הכתב הקירילי שלו הוא מאותן ידיים אך אינו מחיה דבר: גארמון קירילי מעולם לא נחתך, ולכן הרוסית מסודרת בצורה שצוירה כדי לעמוד לצד השאר.',
	'colophon.typeArabic':
		"הערבית מצויה מחוץ להישג ידו לחלוטין, והיא מסודרת בגופן Amiri — החייאתו של ח'אלד חוסני לכתב הנסח' שנחתך עבור בית הדפוס בולאק בקהיר בשנת 1905, שנבחר מאותו נימוק כמו גופן הטקסט: כתב ספר היסטורי מסוים ולא רישום בן זמננו.",
	'colophon.typeInitials':
		'אותיות הפתיחה הן Pirata One, כתב גותי שאותיותיו הגדולות נותרות קריאות בגודל שאות פתיחה דורשת, ו— עבור הרוסית — Ponomar, המשחזר את הכתב הסלאבי-כנסייתי של דפוס הסינוד. Ponomar מסדר את אות הפתיחה ולעולם לא את הטקסט: אנציקליקה מודרנית שתסודר כולה בכתב הסינוד תאמר דבר שאינו נכון על מה שהיא. כולם מורשים תחת SIL Open Font License ומוגשים מאתר זה ולא מצד שלישי, כך שקריאת עמוד אינה מבקשת דבר משרת של אחר.',
	'refs.citedIn': 'מוזכר ב',
	'refs.externalVolume': 'כרך {volume} ב{host} — PDF סרוק',
	'bible.wholeChapter': 'הפרק הזה',
	'bible.verseNotInEdition': 'מספר פסוק זה אינו קיים במהדורה זו — ראו ההערה במקור העמוד',
	'bible.verseAbbrev': 'פס׳',
	'bible.note': 'הערה',
	'bible.noteMissing': 'הערה זו חסרה מן המאגר',
	'bible.chapterArgument': 'תמצית',
	'ccc.readFullChapter': 'קריאת הפרק כולו',
	'ccc.noParagraphNumber': 'אין מספר פסקה במאגר זה',
	'copyright.sourceTitle': 'פתיחת עמוד המקור',
	'copyright.sourceLabel': 'מקור',
	'lang.label': 'שפה',
	'lang.filter': 'חיפוש שפות',
	'lang.more': 'שפות נוספות',
	'notFound.title': 'אין דבר בכתובת הזו',
	'notFound.lede': 'העמוד שביקשתם אינו כאן.',
	'notFound.body': 'ייתכן שהקישור שגוי או מיושן, או שהוא מצביע על טקסט שאתר זה אינו מכיל.',
	'notFound.searchHint':
		'אם אתם יודעים את ההפניה שאתם מחפשים — ספר ופרק, פסקה בקטכיזם — הקלידו אותה בתיבת החיפוש בראש עמוד זה.',
	'notFound.credit': 'מבוסס על British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'או התחילו מאחת מאלה:',
	'notFound.home': 'בית',
	'compare.enter': 'השוואת מהדורות',
	'compare.exit': 'יציאה מההשוואה',
	'compare.missing': 'אינו נמצא במהדורה זו',
	'compare.versificationNote':
		'שתי המהדורות האלה מחלקות את פסוקי הפרק הזה אחרת במקומות מסוימים (שינוי נוסח ולא בחירת תרגום) — אותו מספר פסוק אינו תמיד מסמן את אותו משפט בשני הטורים.',
	'compare.loading': 'טוען את השפה השנייה…',
	'ui.close': 'סגירה',
	'shortcuts.title': 'קיצורי מקלדת',
	'shortcuts.betweenDocuments': 'בין מסמכים',
	'shortcuts.withinDocument': 'בתוך המסמך',
	'shortcuts.show': 'הצגת הרשימה הזאת',
	'zen.enter': 'מצב מיקוד',
	'zen.exit': 'יציאה ממצב המיקוד',
	'nav.calendar': 'לוח שנה',
	'calendar.title': 'לוח השנה הליטורגי',
	'calendar.tagline': 'לוח השנה הרומי הכללי, מחושב לכל יום — תקופתו, דרגתו, צבעו.',
	'calendar.calendar': 'לוח שנה',
	'calendar.which.general': 'לוח השנה הרומי הכללי',
	'calendar.filter': 'חיפוש מדינות',
	'calendar.region.europe': 'אירופה',
	'calendar.region.americas': 'אמריקה',
	'calendar.region.africa': 'אפריקה',
	'calendar.region.middleEast': 'המזרח התיכון',
	'calendar.region.asia': 'אסיה',
	'calendar.region.oceania': 'אוקיאניה',
	'calendar.today': 'היום',
	'calendar.previousMonth': 'החודש הקודם',
	'calendar.nextMonth': 'החודש הבא',
	'calendar.plainDays': 'ימי חול פשוטים',
	'calendar.noSuchDay': 'לא מחושב יום ליטורגי לתאריך זה.',
	'calendar.week': 'שבוע',
	'calendar.alsoToday': 'נחגג היום גם',
	'calendar.alsoObserved': 'מצוין היום גם',
	'calendar.obligation': 'יום חג שחובה לקיימו',
	'calendar.obligationCanon': 'CIC קנון 1246',
	'calendar.sundayCycle': 'מחזור ימי ראשון',
	'calendar.weekdayCycle': 'מחזור ימות החול',
	'calendar.psalterWeek': 'שבוע התהילים',
	'lectionary.heading': 'קריאות במיסה',
	'lectionary.slot.reading': 'קריאה',
	'lectionary.slot.reading1': 'הקריאה הראשונה',
	'lectionary.slot.reading2': 'הקריאה השנייה',
	'lectionary.slot.reading3': 'הקריאה השלישית',
	'lectionary.slot.reading4': 'הקריאה הרביעית',
	'lectionary.slot.reading5': 'הקריאה החמישית',
	'lectionary.slot.reading6': 'הקריאה השישית',
	'lectionary.slot.reading7': 'הקריאה השביעית',
	'lectionary.slot.psalm': 'מזמור תשובה',
	'lectionary.slot.epistle': 'איגרת',
	'lectionary.slot.acclamation': 'תרועת הבשורה',
	'lectionary.slot.gospel': 'בשורה',
	'lectionary.slot.sequence': 'רצף',
	'lectionary.or': 'או',
	'lectionary.notScripture': 'אינו טקסט מקראי',
	'lectionary.cf': 'השוו׳',
	'lectionary.about': 'על הקריאות האלה',
	'lectionary.caveat':
		'הקטעים שנקבעו על ידי ה-Ordo Lectionum Missae, מקושרים למהדורות של האתר הזה עצמו — לא לתרגום המוכרז בכנסייה מסוימת כלשהי, וכל ועידת בישופים רשאית להתאים את הסדר.',
	'calendar.transferredFrom': 'הועבר מן',
	'calendar.season.advent': 'זמן האדוונט',
	'calendar.season.christmas': 'זמן חג המולד',
	'calendar.season.lent': 'זמן הצום',
	'calendar.season.triduum': 'שלושת ימי הפסחא',
	'calendar.season.easter': 'זמן הפסחא',
	'calendar.season.ordinary': 'הזמן שבמהלך השנה',
	'calendar.colour.white': 'לבן',
	'calendar.colour.red': 'אדום',
	'calendar.colour.green': 'ירוק',
	'calendar.colour.violet': 'סגול',
	'calendar.colour.rose': 'ורוד',
	'calendar.colour.black': 'שחור',
	'calendar.colour.blue': 'כחול',
	'calendar.rank.solemnity': 'חגיגה',
	'calendar.rank.feast': 'חג',
	'calendar.rank.memorial': 'זיכרון',
	'calendar.rank.optional-memorial': 'זיכרון רשות',
	'calendar.rank.commemoration': 'אזכרה',
	'calendar.rank.sunday': 'יום ראשון',
	'calendar.rank.weekday': 'יום חול',
	'calendar.gloss.season.advent':
		'ארבעת השבועות שלפני חג המולד: הכנה לבואו של האדון, וראשית שנת הכנסייה.',
	'calendar.gloss.season.christmas':
		'מחג המולד ועד חג טבילת האדון, שבו נחוגים הולדת האדון והתגלותו לעולם.',
	'calendar.gloss.season.lent':
		'ארבעים הימים מיום רביעי של האפר ועד מיסת הערב של סעודת האדון: תשובה, צדקה והכנה לפסחא.',
	'calendar.gloss.season.triduum':
		'שלושת הימים מערב יום חמישי הקדוש ועד ערב יום ראשון של הפסחא — ייסוריו של האדון, מותו ותחייתו, ופסגת השנה כולה.',
	'calendar.gloss.season.easter':
		'חמישים הימים מן הפסחא ועד חג השבועות הנוצרי, הנחוגים כחג אחד — „יום ראשון גדול אחד“.',
	'calendar.gloss.season.ordinary':
		'שלושים ושלושה או שלושים וארבעה השבועות שמחוץ לשאר העונות. לא „רגילה“ אלא מסודרת: השבועות ממוספרים, והכנסייה קוראת ברצף את חיי האדון ותורתו. היא באה בשני מקטעים — אחרי עונת המולד ועד תקופת התענית, ואחרי חג השבועות ועד האדוונט.',
	'calendar.gloss.rank.solemnity':
		'הדרגה הגבוהה ביותר: הפסחא, חג המולד, העלייה השמימה, פטרון המקום. נחוגה עם „כבוד לאל“ ועם אני מאמין, ומתחילה בערב שלפניה.',
	'calendar.gloss.rank.feast':
		'נחוג בתוך היום עצמו. השליחים והמבשרים, והימים הגדולים יותר של האדון ושל הבתולה.',
	'calendar.gloss.rank.memorial':
		'קדוש הנזכר ביומו, בתוך המיסה ותפילת השעות של אותה עונה. חובה במקום שבו הוא נחוג.',
	'calendar.gloss.rank.optional-memorial':
		'אפשר לחוג אותו או לא, לפי בחירת הכומר או הקהילה. אם אינו נחוג, היום הוא פשוט יום חול.',
	'calendar.gloss.rank.commemoration':
		'מה שנעשה מזיכרון בתקופת התענית: תפילה הנוספת למיסת יום החול, שהעונה שומרת אותה בשאר הדברים בשלמותה.',
	'calendar.gloss.rank.sunday':
		'החג הראשון — יום האדון, הנחוג מדי שבוע מאז התחייה. רק חג עליון או חג של האדון רשאי לדחותו, ובאדוונט, בתקופת התענית ובעונת הפסחא אף לא הם.',
	'calendar.gloss.rank.weekday':
		'יום בלי חגיגה משלו. המיסה ותפילת השעות הן של העונה — וזה מה שהופך את העונה לדבר שכדאי להכיר.',
	'calendar.gloss.colour.white':
		'שמחה. עונת הפסחא ועונת המולד, ימי האדון שמחוץ לייסוריו, הבתולה, המלאכים, והקדושים שלא היו קדושים מעונים.',
	'calendar.gloss.colour.red':
		'דם ואש. יום ראשון של כפות התמרים ויום שישי הקדוש, חג השבועות הנוצרי, השליחים והמבשרים, והקדושים המעונים.',
	'calendar.gloss.colour.green': 'העונה הרגילה: צבע התקווה, וצבע הדברים הצומחים.',
	'calendar.gloss.colour.violet': 'אדוונט ותקופת התענית, ונלבש גם במיסות לזכר המתים.',
	'calendar.gloss.colour.rose':
		'נלבש פעמיים בשנה — ביום ראשון Gaudete, השלישי של האדוונט, וביום ראשון Laetare, הרביעי של תקופת התענית — שבהם הצום מקל והסוף נראה לעין.',
	'calendar.gloss.colour.black': 'מותר ללבשו במיסות לזכר המתים.',
	'calendar.gloss.colour.blue':
		'זכות התכלת: נלבשת בחג ההיריון ללא חטא בספרד, בפיליפינים ובמקומות המעטים האחרים שהכס הקדוש העניק להם זאת.',
	'calendar.gloss.sundayCycle':
		'קריאות יום ראשון רצות על פני שלוש שנים — א, ב ו‑ג — וקוראות את מתי, מרקוס ולוקאס לסירוגין, ואת יוחנן בתקופת התענית ובעונת הפסחא. המחזור מתחלף ביום ראשון הראשון של האדוונט, יחד עם שנת הכנסייה.',
	'calendar.gloss.weekdayCycle':
		'קריאות ימי החול רצות על פני שנתיים, I ו‑II: הקריאה הראשונה מתחלפת, הבשורה לא. שנה ליטורגית קרויה על שם השנה האזרחית שבה היא מסתיימת — שנים אי‑זוגיות הן I, זוגיות II.',
	'calendar.gloss.psalterWeek':
		'תפילת השעות מחלקת את המזמורים על פני ארבעה שבועות, I עד IV, החוזרים לאורך השנה. זהו השבוע שמזמוריו הם של היום, לכל המתפלל את השעות.',
	'calendar.gloss.obligation':
		'יום שבו המאמינים חייבים להשתתף במיסה ולהימנע ממלאכה שתמנע זאת מהם. כל יום ראשון, ושאר הימים שקבעה כל ועידת בישופים.',
	'calendar.primer.title': 'פעם ראשונה כאן?',
	'calendar.primer.lead':
		'לכנסייה שנה משלה. היא מתחילה באדוונט, סובבת סביב הפסחא, ונותנת לכל יום שם, דרגה וצבע — ואלה קובעים מה מתפללים וקוראים באותו יום במיסה ובתפילת השעות. כך „יום ראשון העשרים ושלושה של העונה הרגילה“ הוא כתובת: הוא אומר לכומר, למקהלה, או לכל המתפלל בביתו, אילו תפילות ואילו קריאות שייכות להיום.',
	'calendar.primer.seasons': 'העונות',
	'calendar.primer.ranks': 'מה יום יכול להיות',
	'calendar.primer.colours': 'הצבעים',
	'calendar.primer.cycles': 'המחזורים',
	'calendar.primer.cyclesLead': 'שלושה מונים שיחד אומרים אילו קריאות ואילו מזמורים נקבעו להיום.'
};
