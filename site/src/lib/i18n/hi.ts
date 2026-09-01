/**
 * हिन्दी UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in हिन्दी, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, the Hindi belt, and the widest reach across northern India. A reader gets their own chrome and English
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
 * likely to show — Hindi Catholic vocabulary is a minority register
 * competing with better-known Hindu and Protestant words for the same
 * concepts. Treat every string here as a proposal. Correcting one is a
 * one-line change and needs no permission; because `t()` falls back to
 * English per key, DELETING a doubtful line is also a valid fix and
 * strictly better than leaving a wrong one standing.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const hi: Dictionary = {
	'nav.bible': 'बाइबिल',
	'nav.ccc': 'धर्मशिक्षा',
	'nav.compendium': 'संक्षेप',
	'nav.magisterium': 'कलीसिया का शिक्षण',
	'nav.prayers': 'प्रार्थनाएँ',
	'nav.bookmarks': 'चिह्न',
	'nav.menu': 'मेन्यू',
	'nav.summa': 'सुम्मा',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'पढ़ना जारी रखें',
	'home.works': 'पुस्तकालय',
	'home.ccc.heading': 'धर्मशिक्षा और संक्षेप',
	'home.magisterium.mostRecent': 'नवीनतम',
	'home.prayers.heading': 'प्रार्थनाएँ',
	'unitNav.previous': 'पिछला',
	'unitNav.next': 'अगला',
	'bible.landing.title': 'बाइबिल',
	'bible.landing.tagline': 'पूरी बाइबिल पढ़ें, पुस्तक दर पुस्तक, अध्याय दर अध्याय।',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'पंचग्रंथ',
	'bible.group.historical': 'ऐतिहासिक ग्रंथ',
	'bible.group.wisdom': 'ज्ञान ग्रंथ',
	'bible.group.prophetic': 'भविष्यद्वक्ता ग्रंथ',
	'bible.group.gospels': 'सुसमाचार',
	'bible.group.acts': 'प्रेरित-चरित',
	'bible.group.pauline': 'पौलुस के पत्र',
	'bible.group.catholicLetters': 'काथलिक पत्र',
	'bible.group.revelation': 'प्रकाशना',
	'ccc.landing.title': 'काथलिक कलीसिया की धर्मशिक्षा',
	'ccc.landing.tagline':
		'<strong>धर्मशिक्षा</strong> काथलिक शिक्षा को 2,865 क्रमांकित अनुच्छेदों में प्रस्तुत करती है। <strong>संक्षेप</strong> उसी शिक्षा को उसी क्रम के अनुसार 598 प्रश्नोत्तरों में प्रस्तुत करता है।',
	'document.library.tagline': 'विश्वपत्र, महासभा के संविधान, आदेश और कलीसियाई शिक्षण की घोषणाएँ।',
	'doctores.landing.title': 'कलीसिया के आचार्य',
	'doctores.landing.tagline': 'कलीसिया के पिताओं और आचार्यों की धर्मशास्त्रीय रचनाएँ।',
	'summa.landing.title': 'सुम्मा थेओलोजीए',
	'summa.landing.tagline': 'थॉमस अक्विनास, अंग्रेज़ी में और उस लातीनी में जो उन्होंने लिखी।',
	'prayers.landing.title': 'सामान्य प्रार्थनाएँ',
	'prayers.landing.tagline': 'लातीनी पाठ के साथ प्रार्थनाएँ।',
	'colophon.title': 'कोलोफ़ोन',
	'colophon.lede': 'यह साइट क्या है, इसके पाठ कहाँ से आते हैं, और उनके पुनरुत्पादन पर हमारा रुख।'
};
