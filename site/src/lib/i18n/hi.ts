/**
 * हिन्दी UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * WRITTEN AS A REACH LANGUAGE ON 2026-08-31 — chrome for a corpus that held
 * nothing in it, chosen by Catholic population: the Hindi belt, and the
 * widest reach across northern India. IT STOPPED BEING ONE ON 2026-09-04,
 * when the curated prayers brought `prayer.common.hi` from Vatican News.
 * Everything else the corpus holds still reaches a Hindi reader in English
 * through `CONTENT_LANG_FALLBACK`, which is the honest state of it: the
 * alternative is not better content, it is the same content behind a
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
 * likely to show — Hindi Catholic vocabulary is a minority register
 * competing with better-known Hindu and Protestant words for the same
 * concepts. Treat every string here as a proposal. Correcting one is a
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

export const hi: Dictionary = {
	'nav.bible': 'बाइबिल',
	'nav.ccc': 'धर्मशिक्षा',
	'nav.compendium': 'संक्षेप',
	'nav.magisterium': 'कलीसिया का शिक्षण',
	'nav.socialDoctrine': 'सामाजिक शिक्षा',
	'socialDoctrine.landing.title': 'कलीसिया की सामाजिक शिक्षा का संग्रह',
	'socialDoctrine.landing.tagline':
		'समाज में जीवन के विषय में कलीसिया की शिक्षा, 583 क्रमांकित अनुच्छेदों में।',
	'nav.canonLaw': 'कैनन विधि',
	'canonLaw.landing.title': 'कैनन विधि संहिता',
	'canonLaw.landing.tagline': 'लातीनी कलीसिया की विधि, सात पुस्तकों में 1752 कैननों में।',
	'canonLaw.canon': 'कै.',
	'canonLaw.canons': 'कै.',
	'canonLaw.prevCanon': 'पिछला कैनन',
	'canonLaw.nextCanon': 'अगला कैनन',
	'canonLaw.readFullTitle': 'पूरा शीर्षक पढ़ें',
	'canonLaw.superseded': 'इस अधिनियम द्वारा प्रतिस्थापित पाठ',
	'nav.prayers': 'प्रार्थनाएँ',
	'nav.bookmarks': 'चिह्न',
	'nav.menu': 'मेन्यू',
	'nav.sections': 'अनुभाग',
	'nav.works': 'कृतियाँ',
	'nav.pages': 'पृष्ठ',
	'nav.summa': 'सुम्मा',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'पढ़ना जारी रखें',
	'home.tagline':
		'पवित्र धर्मग्रंथ, धर्मशिक्षा और धर्मशिक्षण-अधिकार के दस्तावेज़ों को पढ़ने का स्थल — निःशुल्क, बिना संबंध के भी चलता है, और पंजीकरण के लिए कुछ नहीं।',
	'home.doors.heading': 'कहाँ जाएँ',
	'home.find.heading': 'अथवा कोई सन्दर्भ लिखें',
	'nav.library': 'पुस्तकालय',
	'nav.learn': 'सीखें',
	'library.landing.tagline':
		'पूरा संग्रह, अलमारी दर अलमारी — आपने कहाँ छोड़ा था और क्या चिह्नित किया, उसके साथ।',
	'schola.landing.title': 'कहाँ से आरंभ करें',
	'schola.landing.tagline':
		'यहाँ जो कुछ है उसका संक्षिप्त परिचय: इनमें से हर ग्रंथ क्या है, उसका सन्दर्भ कैसे लिखा जाता है, कोई अंश कैसे खोजें, और पढ़ने के वे क्रम जो कलीसिया ने सुझाए हैं।',
	'schola.start.heading': 'कैथोलिक धर्म में नए हैं?',
	'schola.start.body': 'सबसे अच्छी शुरुआत है ',
	'schola.start.bodyAfter':
		': वही शिक्षा जो धर्मशिक्षा में है, कहीं छोटी, प्रश्न और उत्तर में लिखी हुई। यह लगभग दसवें भाग की है और कुछ भी पहले से नहीं मान लेती।',
	'schola.bible.heading': 'बाइबिल कभी नहीं पढ़ी?',
	'schola.bible.library':
		'यह एक ग्रंथ नहीं, तिहत्तर हैं, जो एक हज़ार वर्ष से अधिक में लिखे गए और उस क्रम में बाँधे गए जिस पर कलीसिया ठहरी — न उस क्रम में जिसमें घटनाएँ हुईं, न उस क्रम में जो पढ़ने में सबसे सरल है। अधिकांश लोग पहले पृष्ठ से आरंभ करते हैं और कुछ सप्ताह बाद, प्राचीन विधान के किसी लंबे अध्याय में, छोड़ देते हैं, क्योंकि किसी ने अभी तक उन्हें यह नहीं बताया कि यह किसलिए है।',
	'schola.bible.step.gospel': 'किसी सुसमाचार से आरंभ करें',
	'schola.bible.start':
		'येशु के जीवन पर चार छोटे ग्रंथों में से एक, बहुत भीतर, आगे नहीं। यह हमारा विचार नहीं: कलीसिया की एक महासभा ने कहा कि धर्मग्रंथ का सम्यक् उपयोग सिखाया जाए, „विशेषकर नए विधान का और सबसे बढ़कर सुसमाचारों का“। उसने किसी एक का नाम नहीं लिया, और हम भी नहीं लेंगे।',
	'schola.bible.whichGospel':
		'तीन प्रायः सुझाए जाते हैं, तीन भिन्न कारणों से। इनमें से कोई भी रहने के लिए अच्छी जगह है।',
	'schola.bible.gospel.mark':
		'सबसे छोटा। आप इसे एक ही दोपहर में पूरा पढ़ सकते हैं, और आरंभ में एक पूरा कर लेना सर्वोत्तम चुन लेने से अधिक मूल्यवान है।',
	'schola.bible.gospel.luke':
		'किसी विश्वास से बाहर के व्यक्ति के लिए लिखा गया जो कथा को क्रम से लिखा हुआ चाहता था — जो ठीक आप हो सकते हैं। यह सीधे प्रेरित-चरित में चलता जाता है, इसलिए वास्तव में एक लंबे ग्रंथ का पहला भाग है।',
	'schola.bible.gospel.john':
		'वह जो खुलकर कहता है कि वह क्यों लिखा गया: „ताकि तुम विश्वास करो“। सरल शब्द, और वह सीधे इस प्रश्न पर आता है कि येशु कौन हैं।',
	'schola.bible.step.acts': 'फिर उसके बाद जो हुआ',
	'schola.bible.thenActs':
		'जब आप एक पूरा कर लें, तो पढ़िए कि उनके जाने के बाद उन लोगों ने क्या किया जो उन्हें जानते थे।',
	'schola.bible.acts.why':
		'सुसमाचारों के अंत के बाद के तीस वर्ष: कुछ दर्जन भयभीत लोग, और यह कि जो उन्होंने देखा था वह साम्राज्य के दूसरे छोर तक कैसे पहुँचा।',
	'schola.bible.step.old': 'फिर पुराना आधा भाग',
	'schola.bible.thenOld':
		'पहले पृष्ठ से नहीं, और पूरा भी नहीं। कुछ ही स्थान कथा को ले चलते हैं, और वही हैं जिनकी ओर सुसमाचार बार-बार लौटते हैं।',
	'schola.bible.ot.beginnings': 'यह कैसे आरंभ होता है, और कैसे बिगड़ता है।',
	'schola.bible.ot.promise':
		'एक परिवार, और उसे दी गई एक प्रतिज्ञा जो उसके सब लोगों से आगे बनी रहती है।',
	'schola.bible.ot.exodus': 'दासता से निकाला गया एक जन, और जीने के लिए दी गई एक विधि।',
	'schola.bible.ot.psalms':
		'कथा नहीं: एक सौ पचास प्रार्थनाएँ और गीत। एक-एक करके पढ़िए, किसी भी क्रम में। कलीसिया आज भी इन्हें प्रतिदिन पढ़ती है।',
	'schola.bible.bothWays':
		'आप बहुत कुछ पहचानेंगे, और यही उद्देश्य है, संयोग नहीं। कलीसिया पुराने ग्रंथों को मसीह के प्रकाश में और नए ग्रंथों को उससे पहले जो था उसके प्रकाश में पढ़ती है — प्रत्येक आधा दूसरे को समझाता है, और इसीलिए कोई भी अकेला नहीं पढ़ा जाता।',
	'schola.books.heading': 'यहाँ क्या है, और उसकी पहचान कैसे होती है',
	'schola.books.lede':
		'इनमें से हर एक भिन्न प्रकार का ग्रंथ है, और हर एक का सन्दर्भ अपनी ही संख्या से दिया जाता है। उदाहरण रूप दिखाते हैं: वैसा ही कोई खोज-खाने में लिखिए और आप उस अंश पर पहुँच जाएँगे।',
	'schola.cite.label': 'पहचान',
	'schola.what.scripture':
		'धर्मग्रंथ जैसा कलीसिया उसे ग्रहण करती है, दोनों विधानों में। यहाँ का शेष सब उसी के प्रकाश में पढ़ा जाता है।',
	'schola.cite.scripture': 'ग्रंथ, अध्याय और पद, उन संक्षेपों में जो आपका संस्करण छापता है',
	'schola.what.catechism':
		'काथलिक कलीसिया जो विश्वास करती है उसका सार, एक ही खंड में। वह स्वयं स्रोत नहीं है: वह धर्मग्रंथ, पिताओं, आराधना-विधि और कलीसिया की शिक्षा को एकत्र करता है, और हर अनुच्छेद बताता है कि जो वह कहता है वह कहाँ से आया है।',
	'schola.cite.catechism': 'अनुच्छेद संख्या से, जो पहले पृष्ठ से अंतिम तक अटूट चलती है',
	'schola.what.compendium': 'वही शिक्षा प्रश्न और उत्तर में रखी हुई, लगभग दसवें भाग में।',
	'schola.cite.compendium': 'प्रश्न संख्या से',
	'schola.what.magisterium':
		'पोपों और महासभाओं ने वास्तव में जो लिखा — विश्वपत्र, संविधान, आदेश, घोषणाएँ — हर एक किसी विशेष क्षण और किसी विशेष प्रश्न को संबोधित। हर एक अपने आरंभिक लातीनी शब्दों से जाना जाता है।',
	'schola.cite.magisterium': 'दस्तावेज़ के नाम से, फिर उसके भीतर की खंड संख्या से',
	'schola.what.social':
		'श्रम, संपत्ति, परिवार, राजनीति और शांति पर कलीसिया की शिक्षा, उन दस्तावेज़ों से एकत्र करके एक ग्रंथ में।',
	'schola.cite.social':
		'अनुच्छेद संख्या से, उस संक्षेप के अंतर्गत जो कृति स्वयं अपने लिए प्रयोग करती है',
	'schola.what.law':
		'विधि, सिद्धांत नहीं। यह बताती है कि कलीसिया क्या अपेक्षा करती है, और इसमें संशोधन होता है।',
	'schola.cite.law': 'कानोन से, जो इसकी क्रमांकित इकाइयों का नाम है',
	'schola.what.doctors':
		'वे धर्मशास्त्री जिन्हें कलीसिया ने आचार्य घोषित किया। इसमें कोई आधिकारिक अधिकार नहीं, लेखक चाहे कितना ही महान हो।',
	'schola.cite.doctors': 'भाग से, फिर प्रश्न से — सुम्मा के अपने विभाग',
	'schola.what.prayers': 'वे शब्द जिनसे कलीसिया प्रार्थना करती है, साथ में लातीनी।',
	'schola.cite.prayers': 'नाम से; उद्धृत करने को कोई संख्या नहीं',
	'schola.places.heading': 'पाठ नहीं, इस स्थल के स्थान',
	'schola.what.library':
		'इस स्थल की सब कृतियाँ एक सूची में, प्रकार से नहीं बल्कि विषय से समूहबद्ध।',
	'schola.what.calendar':
		'आराधना-दिवस — ऋतु, रंग और किसका स्मरण — उस देश के लिए जिसका पंचांग आप मानते हैं।',
	'schola.what.bookmarks':
		'जिन अंशों को आपने चिह्नित किया, और हर कृति में आप अंतिम बार कहाँ रुके। दोनों इसी ब्राउज़र में रहते हैं और कहीं नहीं भेजे जाते।',
	'ccc.noCounterpart': 'दूसरी कृति में इसका कोई समकक्ष नहीं',
	'jumpbox.placeholder': 'यहाँ जाएँ… (जैसे jn 3:16, ccc 1234)',
	'jumpbox.short': 'खोज',
	'jumpbox.hint': 'किसी सन्दर्भ पर जाने के लिए / या Ctrl+K दबाएँ',
	'jumpbox.noMatch': 'कुछ नहीं मिला',
	'jumpbox.suggestions': 'सुझाव',
	'settings.label': 'सेटिंग्स',
	'apparatus.label': 'टिप्पणी सामग्री',
	'apparatus.editionNotes': 'इस संस्करण की टिप्पणियाँ',
	'apparatus.commentary': 'टीका',
	'apparatus.inCommentary': 'ऊपर की टीका में सम्मिलित है।',
	'darkMode.label': 'गहरा रूप',
	'darkMode.auto': 'स्वतः',
	'darkMode.on': 'चालू',
	'darkMode.off': 'बंद',
	'sepia.label': 'सीपिया',
	'sepia.lightOnly': 'केवल उजले रूप में',
	'sepia.noHue': 'मोनोक्रोम में नहीं',
	'oled.label': 'OLED काला',
	'oled.darkOnly': 'केवल गहरे रूप में',
	'mono.label': 'मोनोक्रोम',
	'mono.hint':
		'पूरे पृष्ठ को एक ही धूसर रंग में रखता है, ताकि कोई भी वस्तु रंग से अलग न पहचानी जाए। यह चालू रहते समय सीपिया बंद हो जाती है।',
	'advanced.label': 'उन्नत',
	'library.title': 'ऑफ़लाइन पुस्तकालय',
	'library.lede': 'इस उपकरण पर रखे गए पाठ बिना किसी संबंध के भी खुलते हैं।',
	'library.essentials': 'प्रार्थनाएँ और संक्षेप',
	'library.illustrations': 'बाइबिल (चित्र)',
	'library.illustrationsDetail': 'बाइबिल (चित्र, उच्च रिज़ॉल्यूशन)',
	'library.other': 'अन्य पाठ',
	'library.everything': 'सब कुछ',
	'library.downloadAll': 'सब कुछ डाउनलोड करें',
	'library.download': 'डाउनलोड करें',
	'library.downloaded': 'इस उपकरण पर',
	'library.offlineNote': 'कुछ भी डाउनलोड करने के लिए ऑफ़लाइन मोड बंद करें।',
	'library.remove': 'इस उपकरण से हटाएँ',
	'library.removeConfirm': 'हटाएँ?',
	'library.forget': 'डाउनलोड हटाएँ',
	'library.forgetConfirm': 'सब कुछ हटाएँ?',
	'offline.label': 'ऑफ़लाइन मोड',
	'offline.hint':
		'बिल्कुल किसी संबंध का उपयोग नहीं करता: कुछ भी डाउनलोड नहीं होता, किसी अद्यतन की जाँच नहीं होती, कुछ भी मापा नहीं जाता। केवल वे पाठ खुलेंगे जो पहले से इस उपकरण पर हैं।',
	'offline.notDownloaded': 'इस उपकरण पर नहीं है',
	'loadFailed.title': 'यह नहीं खुला',
	'loadFailed.hint':
		'पृष्ठ मौजूद है — उसे लाने में कुछ गड़बड़ हुई। फिर से प्रयास करने पर प्रायः काम बन जाता है।',
	'loadFailed.retry': 'फिर से प्रयास करें',
	'loadFailed.retrying': 'प्रयास हो रहा है…',
	'offline.turnOff': 'ऑफ़लाइन मोड बंद करें',
	'type.label': 'पाठ का आकार और फ़ॉन्ट',
	'fontSize.label': 'पाठ का आकार',
	'fontSize.small': 'छोटा',
	'fontSize.medium': 'मध्यम',
	'fontSize.large': 'बड़ा',
	'fontSize.xlarge': 'बहुत बड़ा',
	'fontSize.xxlarge': 'सबसे बड़ा',
	'face.label': 'फ़ॉन्ट',
	'face.serif': 'सेरिफ़',
	'face.sans': 'सैन्स',
	'print.label': 'यह पृष्ठ छापें',
	'toTop.label': 'ऊपर लौटें',
	'install.label': 'Glossa इंस्टॉल करें',
	'install.hint.label': 'मुख्य स्क्रीन पर जोड़ें',
	'install.hint.title': 'Glossa को अपनी मुख्य स्क्रीन पर जोड़ें',
	'install.hint.stepBefore': 'यह किसी ऐप की तरह खुलता है और बिना संबंध के पढ़ा जा सकता है। दबाएँ',
	'install.hint.stepAfter': 'फिर „मुख्य स्क्रीन पर जोड़ें“।',
	'install.hint.dismiss': 'अनदेखा करें',
	'update.label': 'एक नया संस्करण उपलब्ध है',
	'update.title': 'एक नया संस्करण तैयार है',
	'update.body': 'नवीनतम पाठ और सुधार पाने के लिए पुनः लोड करें।',
	'update.action': 'पुनः लोड करें',
	'update.dismiss': 'अभी नहीं',
	'edition.label': 'संस्करण',
	'edition.select': 'संस्करण चुनें',
	'edition.current': 'वर्तमान संस्करण',
	'edition.filter': 'संस्करण खोजें',
	'menu.noMatches': 'कोई मेल नहीं',
	'unitNav.previous': 'पिछला',
	'unitNav.next': 'अगला',
	'bible.prevChapter': 'पिछला अध्याय',
	'bible.nextChapter': 'अगला अध्याय',
	'bible.pickBook': 'ग्रंथ और अध्याय',
	'bible.landing.title': 'बाइबिल',
	'bible.landing.tagline': 'पूरी बाइबिल पढ़ें, पुस्तक दर पुस्तक, अध्याय दर अध्याय।',
	'bible.landing.random': 'भाग्य आज़माएँ',
	'bible.landing.books': 'ग्रंथ',
	'bible.chapterUnavailable': 'इस संस्करण में उपलब्ध नहीं',
	'bible.introduction': 'प्रस्तावना',
	'bible.introUnavailable': 'इस भाषा में अभी तक कोई प्रस्तावना नहीं',
	'bible.introSource': 'प्रस्तावनाएँ धर्मग्रंथ पाठ का भाग नहीं हैं।',
	'bible.testament.ot': 'पुराना विधान',
	'bible.testament.nt': 'नया विधान',
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
	'ccc.prevParagraph': 'पिछला अनुच्छेद',
	'ccc.nextParagraph': 'अगला अनुच्छेद',
	'ccc.inBrief': 'सार में',
	'ccc.landing.title': 'काथलिक कलीसिया की धर्मशिक्षा',
	'ccc.landing.pairTitle': 'धर्मशिक्षा और संक्षेपिका',
	'ccc.landing.tagline':
		'<strong>धर्मशिक्षा</strong> काथलिक शिक्षा को 2,865 क्रमांकित अनुच्छेदों में प्रस्तुत करती है। <strong>संक्षेप</strong> उसी शिक्षा को उसी क्रम के अनुसार 598 प्रश्नोत्तरों में प्रस्तुत करता है।',
	'ccc.landing.pairTagline':
		'काथलिक कलीसिया की धर्मशिक्षा 2,865 अनुच्छेदों में, और उसकी संक्षेपिका 598 प्रश्नों में।',
	'ccc.tableOfContents': 'विषय-सूची',
	'ccc.related': 'यह भी देखें',
	'compendium.landing.title': 'धर्मशिक्षा की संक्षेपिका',
	'compendium.landing.tagline': 'काथलिक कलीसिया की धर्मशिक्षा का सार देते प्रश्न और उत्तर।',
	'compendium.question': 'प्रश्न',
	'compendium.answer': 'उत्तर',
	'compendium.tableOfContents': 'विषय-सूची',
	'compendium.prevQuestion': 'पिछला प्रश्न',
	'compendium.nextQuestion': 'अगला प्रश्न',
	'compendium.condenses': 'धर्मशिक्षा ¶¶ का सार',
	'ccc.abbrev': 'धर्मशिक्षा',
	'ccc.condensedIn': 'संक्षेपिका में',
	'compendium.abbrev': 'संक्षेप',
	'compendium.noQuestionNumber': 'इस संग्रह में प्रश्न संख्या नहीं है',
	'document.library.tagline': 'विश्वपत्र, महासभा के संविधान, आदेश और कलीसियाई शिक्षण की घोषणाएँ।',
	'document.filter.heading': 'फ़िल्टर',
	'document.filter.author': 'लेखक',
	'document.filter.kind': 'प्रकार',
	'document.filter.subject': 'विषय',
	'document.filter.search': 'दस्तावेज़ खोजें',
	'document.filter.clear': 'साफ़ करें',
	'document.filter.results': 'दिखाए गए दस्तावेज़',
	'document.filter.noResults': 'इन फ़िल्टरों से कोई दस्तावेज़ मेल नहीं खाता।',
	'document.tableOfContents': 'विषय-सूची',
	'document.startReading': 'पढ़ना आरंभ करें',
	'document.readFullDocument': 'पूरा दस्तावेज़ पढ़ें',
	'document.section': 'खंड',
	'document.prevSection': 'पिछला',
	'document.nextSection': 'अगला',
	'document.kind.conciliarConstitution': 'संविधान',
	'document.kind.conciliarDecree': 'आदेश',
	'document.kind.conciliarDeclaration': 'घोषणा',
	'document.kind.encyclical': 'विश्वपत्र',
	'document.kind.apostolicExhortation': 'प्रेरितिक प्रबोधन',
	'document.kind.apostolicConstitution': 'प्रेरितिक संविधान',
	'document.kind.cdfDeclaration': 'सिद्धांत मण्डली की घोषणा',
	'document.kind.cdfInstruction': 'सिद्धांत मण्डली का अनुदेश',
	'document.kind.cdfLetter': 'सिद्धांत मण्डली का पत्र',
	'document.kind.cdfDoctrinalNote': 'सिद्धांत मण्डली की सैद्धांतिक टिप्पणी',
	'document.kind.cdfResponsum': 'सिद्धांत मण्डली का उत्तर',
	'document.kind.cdfConsiderations': 'सिद्धांत मण्डली के विचार',
	'document.kindPlural.conciliarConstitution': 'संविधान',
	'document.kindPlural.conciliarDecree': 'आदेश',
	'document.kindPlural.conciliarDeclaration': 'घोषणाएँ',
	'document.kindPlural.encyclical': 'विश्वपत्र',
	'document.kindPlural.apostolicExhortation': 'प्रेरितिक प्रबोधन',
	'document.kindPlural.apostolicConstitution': 'प्रेरितिक संविधान',
	'document.kindPlural.cdfDeclaration': 'सिद्धांत मण्डली की घोषणाएँ',
	'citation.unavailable': 'इस टिप्पणी के लिए कोई स्रोत पाठ उपलब्ध नहीं है।',
	'doctores.landing.title': 'कलीसिया के आचार्य',
	'doctores.landing.tagline': 'कलीसिया के पिताओं और आचार्यों की धर्मशास्त्रीय रचनाएँ।',
	'summa.landing.title': 'सुम्मा थेओलोजीए',
	'summa.landing.tagline': 'थॉमस अक्विनास, अंग्रेज़ी में और उस लातीनी में जो उन्होंने लिखी।',
	'summa.tableOfContents': 'विषय-सूची',
	'summa.part': 'भाग',
	'summa.question': 'प्रश्न',
	'summa.article': 'अनुच्छेद',
	'summa.questionShort': 'प्र.',
	'summa.articleShort': 'अनु.',
	'summa.titleFromEdition': '{lang} संस्करण से शीर्षक',
	'summa.titlesFromEdition': '{lang} संस्करण से शीर्षक — यह कोई नहीं छापता',
	'summa.prologue': 'भूमिका',
	'summa.objection': 'आपत्ति',
	'summa.sedContra': 'इसके विपरीत',
	'summa.corpus': 'मैं उत्तर देता हूँ कि',
	'summa.reply': 'आपत्ति का उत्तर',
	'summa.preamble': 'टिप्पणी',
	'summa.prevQuestion': 'पिछला प्रश्न',
	'summa.nextQuestion': 'अगला प्रश्न',
	'summa.noEditionInYourLanguage':
		'सुम्मा का आपकी भाषा में कोई संस्करण नहीं है। {lang} में दिखाया गया है।',
	'summa.noLatinSupplement':
		'अनुपूरक केवल अंग्रेज़ी में उपलब्ध है — इसे अक्विनास की मृत्यु के बाद संकलित किया गया था।',
	'index.division': 'विभाग',
	'index.showSubsections': 'उपखंड दिखाएँ',
	'index.hideSubsections': 'उपखंड छिपाएँ',
	'prayers.landing.title': 'सामान्य प्रार्थनाएँ',
	'prayers.landing.tagline': 'लातीनी पाठ के साथ प्रार्थनाएँ।',
	'prayers.tableOfContents': 'विषय-सूची',
	'prayers.gloss.versicle':
		'वह पंक्ति जिसे प्रार्थना का संचालन करने वाला अकेले कहता या गाता है; उपस्थित लोग आगे आने वाले उत्तर से इसका जवाब देते हैं।',
	'prayers.gloss.response':
		'वह पंक्ति जिसे उपस्थित लोग एक साथ कहते या गाते हैं, अपने से पहले की पंक्ति के उत्तर में।',
	'prayers.seeAlso': 'यह भी देखें',
	'prayers.prevPrayer': 'पिछली प्रार्थना',
	'prayers.nextPrayer': 'अगली प्रार्थना',
	'prayers.rosary.today': 'आज',
	'prayers.rosary.todayHeading': 'आज के रहस्य',
	'prayers.rosary.openingPrayer': 'आरंभिक प्रार्थना',
	'prayers.rosary.decadePrayers': 'एक दहाई की प्रार्थनाएँ',
	'ref.tooltip.loading': 'लोड हो रहा है…',
	'ref.tooltip.openCcc': 'धर्मशिक्षा में खोलें',
	'ref.tooltip.openBible': 'बाइबिल में खोलें',
	'ref.tooltip.openCompendium': 'संक्षेप में खोलें',
	'ref.preview.open': 'खोलें',
	'ref.cf': 'तु.',
	'anchor.actions': 'सन्दर्भ पर कार्य',
	'anchor.copy': 'पाठ की नकल करें',
	'anchor.copyLink': 'कड़ी की नकल करें',
	'anchor.view': 'देखें',
	'anchor.copied': 'नकल हो गई',
	'anchor.copyFailed': 'नकल नहीं हो सकी',
	'bookmark.add': 'चिह्नित करें',
	'bookmark.remove': 'चिह्न हटाएँ',
	'bookmark.library': 'चिह्न',
	'bookmark.library.tagline': 'पढ़ते समय आपने जो कुछ चिह्नित किया है।',
	'bookmark.empty': 'अभी कुछ चिह्नित नहीं है।',
	'bookmark.emptyHint':
		'किसी पद या अनुच्छेद की संख्या पर क्लिक करें और चिह्नित करें चुनें, या पृष्ठ का चिह्न बटन काम में लें।',
	'bookmark.about': 'इन चिह्नों के विषय में',
	'bookmark.deviceOnly':
		'चिह्न केवल इसी ब्राउज़र में रहते हैं। वे कहीं नहीं भेजे जाते, और ब्राउज़र का डेटा साफ़ करने पर मिट जाते हैं।',
	'bookmark.unavailable': 'आप जो संस्करण पढ़ रहे हैं उसमें नहीं',
	'colophon.title': 'कोलोफ़ोन',
	'colophon.lede': 'यह साइट क्या है, इसके पाठ कहाँ से आते हैं, और उनके पुनरुत्पादन पर हमारा रुख।',
	'colophon.whatThisIs': 'यह क्या है',
	'colophon.whatThisIsBody':
		'ग्लोसा कैथोलिका पवित्र धर्मग्रंथ, धर्मशिक्षा, संक्षेपिका तथा धर्मशिक्षण-अधिकार के दस्तावेज़ों को पढ़ने का स्थल है, अंग्रेज़ी, पुर्तगाली और लातीनी में। यह पढ़े जाने के लिए है, और इसे पढ़ने के लिए आपसे और कुछ नहीं माँगा जाता:',
	'colophon.pointFree':
		'निःशुल्क, और सदा निःशुल्क। कोई शुल्क-दीवार नहीं, कोई सदस्यता नहीं, खरीदने को कुछ नहीं।',
	'colophon.pointNoAds': 'कोई विज्ञापन नहीं, और किसी भी प्रकार का प्रायोजित प्रस्तुतीकरण नहीं।',
	'colophon.pointNoAccounts':
		'कोई खाता नहीं। पंजीकरण के लिए कुछ नहीं, प्रवेश करने के लिए कुछ नहीं।',
	'colophon.pointNoTracking':
		'कोई अनुसरण करने वाली स्क्रिप्ट नहीं, कोई तृतीय-पक्ष कोड नहीं, कोई कुकी नहीं। केवल गुमनाम उपयोग-गणनाएँ, ऐसा कुछ नहीं जो आपकी पहचान बताए।',
	'colophon.pointOffline':
		'एक बार आने के बाद बिना संबंध के भी चलता रहे, ऐसा बनाया गया है, ताकि कमज़ोर संबंध पढ़ने में बाधा न बने।',
	'colophon.whatThisIsStanding':
		'ग्लोसा कैथोलिका लोकधर्मी विश्वासियों का एक निजी प्रयास है। इसे कोई कलीसियाई अनुमोदन प्राप्त नहीं है और यह अपने किसी अधिकार से नहीं बोलता।',
	'footer.notEndorsed': 'परमधर्मपीठ द्वारा अनुमोदित नहीं',
	'colophon.textsTitle': 'पाठ',
	'colophon.textsBody':
		'प्रत्येक पाठ एक नामित स्रोत से आता है, और प्रत्येक कृति अपना संस्करण, अपना स्रोत-पृष्ठ और वह तिथि अंकित करती है जब उसे लिया गया। धर्मग्रंथ सार्वजनिक अधिकार-क्षेत्र के अनुवादों का उपयोग करता है; धर्मशिक्षा, संक्षेपिका और धर्मशिक्षण-अधिकार के दस्तावेज़ परमधर्मपीठ के अपने प्रकाशित पाठों से आते हैं।',
	'colophon.textsFidelity':
		'पाठ को कभी संक्षिप्त नहीं किया जाता, कभी भावार्थ में नहीं बदला जाता, कभी पुनर्लिखित नहीं किया जाता, और कभी विज्ञापन के पास नहीं रखा जाता। हम स्पष्ट त्रुटियाँ अवश्य सुधारते हैं — छूटा हुआ शब्द, बिगड़ा हुआ संदर्भ, ऐसी संरचना जो एक अनुच्छेद निगल गई हो — सदा उसी ओर जो स्रोत स्वयं छापता है, कभी उस ओर नहीं जो हमारे विचार में उसे कहना चाहिए।',
	'colophon.countBible': 'बाइबिल संस्करण',
	'colophon.countDocuments': 'धर्मशिक्षण-अधिकार के दस्तावेज़',
	'colophon.privacyTitle': 'गोपनीयता',
	'colophon.privacyBody1':
		'कोई खाता नहीं, कोई कुकी नहीं, कोई विज्ञापन नहीं, कोई तृतीय-पक्ष कोड नहीं। यहाँ कुछ भी इस स्थल से बाहर आपका पीछा नहीं करता।',
	'colophon.privacyBody2':
		'हम स्थल के उपयोग की गणना अवश्य करते हैं: प्रत्येक भेंट पर एक मापन, हर क्षेत्र एक मान नहीं बल्कि एक सीमा — आप कितनी देर रुके, आप यहाँ कितनी बार आए, आपने कौन-सी कृतियाँ खोलीं। आपका देश अलग से गिना जाता है, बिना उसे शेष से जोड़े। यह एक भेंट का वर्णन करता है, किसी भेंट करने वाले का नहीं, और इसे {days} दिनों तक रखा जाता है।',
	'colophon.privacyBody3':
		'कभी नहीं भेजा जाता: आप खोज-खाने में क्या लिखते हैं, आपने कौन-सा अंश खोल रखा था, या ऐसा कुछ भी जो आपके उपकरण को फिर से पहचान सके। आपकी सेटिंग्स, चिह्न और डाउनलोड किए गए पाठ आपके उपकरण पर ही रहते हैं।',
	'colophon.copyrightTitle': 'सर्वाधिकार',
	'colophon.copyrightBody1':
		'धर्मशिक्षा, संक्षेपिका और धर्मशिक्षण-अधिकार के दस्तावेज़ अपने अधिकार-धारकों की संपत्ति हैं — मुख्यतः Libreria Editrice Vaticana और संचार हेतु परिषद् की।',
	'colophon.copyrightBody2':
		'प्रत्येक कृति अपने अधिकार-धारक की अपनी सर्वाधिकार सूचना, उन्हीं के शब्दों में, दिखाती है, और उस पृष्ठ से जोड़ती है जहाँ से वह ली गई।',
	'colophon.copyrightBody3':
		'यदि यहाँ किसी पाठ पर आपके अधिकार हैं और आप चाहते हैं कि वह प्रकाशित न हो, तो हमें लिखें।',
	'colophon.contactTitle': 'संपर्क',
	'colophon.contactBody': 'किसी भी बात के लिए, उपर्युक्त सहित:',
	'colophon.contactPending':
		'संपर्क का पता अभी निर्धारित नहीं हुआ है। जब तक वह न हो, यह स्थल सार्वजनिक नहीं किया जाना चाहिए — हम तक पहुँचने का मार्ग हुए बिना उपर्युक्त वचन का कोई अर्थ नहीं।',
	'colophon.illustrationsTitle': 'चित्र',
	'colophon.illustrationsBody':
		'बाइबिल में ग्युस्ताव दोरे की उत्कीर्ण कृतियाँ हैं, प्रत्येक उसी पद के पास रखी गई जिसे वह चित्रित करती है — उनकी बाइबिल-शृंखलाओं में अंतिम और सबसे बड़ी, उनके रेखाचित्रों से लकड़ी पर उकेरी गई और अंत में एकत्र करने के बजाय पाठ के साथ ही छापी गई।',
	'colophon.illustrationsRights':
		'नीचे दी गई तिथियों के अनुसार वे सार्वजनिक अधिकार-क्षेत्र में हैं, और सार्वजनिक अधिकार-क्षेत्र की उत्कीर्ण कृति की निष्ठापूर्ण छायाचित्रीय प्रतिकृति अपना कोई नया सर्वाधिकार नहीं रखती।',
	'colophon.countPlates': 'उत्कीर्ण कृतियाँ',
	'colophon.countPlateChapters': 'सचित्र अध्याय',
	'plates.scansBy': 'स्कैन के प्रदाता',
	'plates.enlarge': '{title} बड़ा करें',
	'plates.zoom': 'ज़ूम',
	'art.about': 'इस चित्र के विषय में',
	'art.detail': 'अंश',
	'colophon.typeTitle': 'अक्षर',
	'colophon.typeBody':
		'EB Garamond में संयोजित, जो क्लोद गारामों द्वारा 1590 के दशक में उकेरे गए अक्षरों का गेओर्ग डुफ़्नर और ओक्ताविओ पार्दो द्वारा किया गया पुनरुद्धार है — वही मानवतावादी परंपरा जिसमें कलीसिया पुनर्जागरण से छापती आई है। इसकी सिरिलिक लिपि उन्हीं हाथों की है पर किसी का पुनरुद्धार नहीं करती: सिरिलिक गारामों कभी उकेरा ही नहीं गया, इसलिए रूसी उस रूप में संयोजित है जो शेष के साथ खड़े होने के लिए बनाया गया।',
	'colophon.typeArabic':
		'अरबी इसकी पहुँच से पूर्णतः बाहर है, और Amiri में संयोजित है — 1905 में क़ाहिरा के बूलाक़ मुद्रणालय के लिए उकेरी गई नस्ख़ लिपि का ख़ालिद होस्नी द्वारा किया गया पुनरुद्धार, जिसे पाठ-अक्षर के समान ही तर्क से चुना गया: कोई समकालीन रेखांकन नहीं, बल्कि एक विशिष्ट ऐतिहासिक पुस्तक-अक्षर।',
	'colophon.typeInitials':
		'आरंभिक अक्षर Pirata One हैं, एक गॉथिक लिपि जिसके बड़े अक्षर उस आकार में भी पठनीय रहते हैं जिसकी आरंभिक अक्षर माँग करता है, और — रूसी के लिए — Ponomar, जो धर्मसभा मुद्रणालय की कलीसियाई स्लावोनिक लिपि को पुनः प्रस्तुत करता है। Ponomar केवल आरंभिक अक्षर संयोजित करता है, कभी पाठ नहीं: पूरी तरह धर्मसभा लिपि में संयोजित कोई आधुनिक विश्वपत्र अपने विषय में कुछ असत्य कहेगा। ये सभी SIL Open Font License के अंतर्गत अनुज्ञप्त हैं और किसी तृतीय पक्ष के बजाय इसी स्थल से दिए जाते हैं, इसलिए कोई पृष्ठ पढ़ना किसी और के सर्वर से कुछ नहीं माँगता।',
	'refs.citedIn': 'जहाँ उद्धृत है',
	'refs.externalVolume': '{host} पर खंड {volume} — स्कैन किया गया PDF',
	'bible.wholeChapter': 'यह अध्याय',
	'bible.verseNotInEdition':
		'यह पद-संख्या इस संस्करण में नहीं है — पृष्ठ-स्रोत में दी गई टिप्पणी देखें',
	'bible.verseAbbrev': 'प.',
	'bible.note': 'टिप्पणी',
	'bible.noteMissing': 'यह टिप्पणी संग्रह में उपलब्ध नहीं है',
	'bible.chapterArgument': 'सारांश',
	'ccc.readFullChapter': 'पूरा अध्याय पढ़ें',
	'ccc.noParagraphNumber': 'इस संग्रह में अनुच्छेद संख्या नहीं है',
	'copyright.sourceTitle': 'मूल स्रोत पृष्ठ खोलें',
	'copyright.sourceLabel': 'स्रोत',
	'lang.label': 'भाषा',
	'lang.filter': 'भाषाएँ खोजें',
	'lang.more': 'और भाषाएँ',
	'notFound.title': 'इस पते पर कुछ नहीं है',
	'notFound.lede': 'आपने जिस पृष्ठ के लिए कहा वह यहाँ नहीं है।',
	'notFound.body':
		'कड़ी ग़लत टाइप की गई हो सकती है या पुरानी हो सकती है, या यह किसी ऐसे पाठ की ओर संकेत कर सकती है जो यह स्थल नहीं रखता।',
	'notFound.searchHint':
		'यदि आप जानते हैं कि आपको कौन-सा सन्दर्भ चाहिए — कोई ग्रंथ और अध्याय, धर्मशिक्षा का कोई अनुच्छेद — तो इसे इस पृष्ठ के ऊपर के खोज-खाने में लिखें।',
	'notFound.credit': 'British Library, Royal MS 10 E IV, f. 49v पर आधारित',
	'notFound.elsewhere': 'या इनमें से किसी एक से आरंभ करें:',
	'notFound.home': 'मुखपृष्ठ',
	'compare.enter': 'संस्करणों की तुलना करें',
	'compare.exit': 'तुलना से बाहर निकलें',
	'compare.missing': 'इस संस्करण में मौजूद नहीं है',
	'compare.versificationNote':
		'ये दोनों संस्करण कहीं-कहीं इस अध्याय के पदों को अलग ढंग से बाँटते हैं (यह पाठ-भेद है, अनुवाद का चुनाव नहीं) — एक ही पद-संख्या दोनों स्तंभों में सदैव एक ही वाक्य को चिह्नित नहीं करती।',
	'compare.loading': 'दूसरी भाषा लोड हो रही है…',
	'ui.close': 'बंद करें',
	'shortcuts.title': 'कीबोर्ड शॉर्टकट',
	'shortcuts.betweenDocuments': 'दस्तावेज़ों के बीच',
	'shortcuts.withinDocument': 'दस्तावेज़ के भीतर',
	'shortcuts.show': 'यह सूची दिखाएँ',
	'help.title': 'सहायता',
	'help.top.heading': 'हर पृष्ठ के शीर्ष की पट्टी',
	'help.reading.heading': 'पाठ के ऊपर की पट्टी',
	'help.feature.search':
		'ऊपर के खाने में कोई सन्दर्भ लिखिए — अध्याय और पद, अनुच्छेद संख्या, किसी दस्तावेज़ का नाम — और वह लिखते-लिखते पूरा हो जाता है।',
	'help.feature.offline':
		'इस स्थल को अपनी मुख्य स्क्रीन पर जोड़िए और यह किसी ऐप की तरह खुलेगा। आप पूरी कृतियाँ उतार कर बिना संबंध के पढ़ सकते हैं।',
	'help.feature.contents':
		'जिस कृति में आप हैं उसके विभाग — ग्रंथ, भाग, अध्याय — ताकि आप आरंभ पर लौटे बिना उसके भीतर चल सकें।',
	'help.feature.compare':
		'एक ही अंश के दो संस्करण, साथ-साथ — लातीनी आपकी अपनी भाषा के साथ, या एक अनुवाद दूसरे के साथ।',
	'help.feature.apparatus':
		'संस्करण की अपनी टिप्पणियाँ, और पाठ पर लिखी कोई भी व्याख्या, उसके नीचे नहीं बल्कि उसके साथ दी जाती हैं। पाठ के भीतर के उद्धरण कड़ियाँ हैं, इसलिए सन्दर्भ वहीं ले जाता है जहाँ वह संकेत करता है।',
	'help.feature.focus':
		'पाठ के सिवा सब हटा देता है। बाहर निकलने का रास्ता वहीं रहता है जहाँ पट्टी थी, ताकि कुछ भी उसके पीछे बंद न रह जाए।',
	'zen.enter': 'एकाग्रता मोड',
	'zen.exit': 'एकाग्रता मोड से बाहर निकलें',
	'nav.calendar': 'पंचांग',
	'calendar.title': 'धर्मविधि पंचांग',
	'calendar.tagline':
		'सामान्य रोमन पंचांग, किसी भी दिन के लिए गणना किया गया — उसका काल, उसका दर्जा, उसका रंग।',
	'calendar.calendar': 'पंचांग',
	'calendar.which.general': 'सामान्य रोमन पंचांग',
	'calendar.filter': 'देश खोजें',
	'calendar.region.europe': 'यूरोप',
	'calendar.region.americas': 'अमेरिका',
	'calendar.region.africa': 'अफ्रीका',
	'calendar.region.middleEast': 'मध्य पूर्व',
	'calendar.region.asia': 'एशिया',
	'calendar.region.oceania': 'ओशिनिया',
	'calendar.today': 'आज',
	'calendar.previousMonth': 'पिछला महीना',
	'calendar.nextMonth': 'अगला महीना',
	'calendar.plainDays': 'साधारण दिन',
	'calendar.noSuchDay': 'उस तिथि के लिए कोई धर्मविधि दिवस गणना में नहीं आता।',
	'calendar.week': 'सप्ताह',
	'calendar.alsoToday': 'आज यह भी मनाया जाता है',
	'calendar.alsoObserved': 'आज यह भी स्मरण किया जाता है',
	'calendar.obligation': 'अनिवार्य पर्व',
	'calendar.obligationCanon': 'CIC कै. 1246',
	'calendar.sundayCycle': 'रविवारीय चक्र',
	'calendar.weekdayCycle': 'साप्ताहिक दिवस चक्र',
	'calendar.psalterWeek': 'भजन सप्ताह',
	'lectionary.heading': 'मिस्सा के पाठ',
	'lectionary.slot.reading': 'पाठ',
	'lectionary.slot.reading1': 'पहला पाठ',
	'lectionary.slot.reading2': 'दूसरा पाठ',
	'lectionary.slot.reading3': 'तीसरा पाठ',
	'lectionary.slot.reading4': 'चौथा पाठ',
	'lectionary.slot.reading5': 'पाँचवाँ पाठ',
	'lectionary.slot.reading6': 'छठा पाठ',
	'lectionary.slot.reading7': 'सातवाँ पाठ',
	'lectionary.slot.psalm': 'उत्तर भजन',
	'lectionary.slot.epistle': 'पत्री',
	'lectionary.slot.acclamation': 'सुसमाचार जयघोष',
	'lectionary.slot.gospel': 'सुसमाचार',
	'lectionary.slot.sequence': 'अनुक्रम',
	'lectionary.or': 'अथवा',
	'lectionary.cf': 'तु.',
	'lectionary.about': 'इन पाठों के विषय में',
	'lectionary.caveat':
		'ऑर्दो लेक्सियोनुम मिस्साए द्वारा नियत अंश, इस स्थल के अपने संस्करणों से जोड़े गए — न कि वह अनुवाद जो किसी विशेष गिरजाघर में उच्चरित होता है, और कोई धर्माध्यक्षीय सम्मेलन इस अनुसूची को अनुकूलित कर सकता है।',
	'calendar.transferredFrom': 'स्थानांतरित',
	'calendar.season.advent': 'आगमन काल',
	'calendar.season.christmas': 'क्रिसमस काल',
	'calendar.season.lent': 'चालीसा काल',
	'calendar.season.triduum': 'पास्का त्रिदिवस',
	'calendar.season.easter': 'पास्का काल',
	'calendar.season.ordinary': 'सामान्य काल',
	'calendar.colour.white': 'श्वेत',
	'calendar.colour.red': 'लाल',
	'calendar.colour.green': 'हरा',
	'calendar.colour.violet': 'बैंगनी',
	'calendar.colour.rose': 'गुलाबी',
	'calendar.colour.black': 'काला',
	'calendar.colour.blue': 'नीला',
	'calendar.rank.solemnity': 'महापर्व',
	'calendar.rank.feast': 'पर्व',
	'calendar.rank.memorial': 'स्मृति',
	'calendar.rank.optional-memorial': 'ऐच्छिक स्मृति',
	'calendar.rank.commemoration': 'स्मरण',
	'calendar.rank.sunday': 'रविवार',
	'calendar.rank.weekday': 'साधारण दिन',
	'calendar.gloss.season.advent':
		'क्रिसमस से पहले के चार सप्ताह: प्रभु के आगमन की तैयारी, और कलीसिया के वर्ष का आरम्भ।',
	'calendar.gloss.season.christmas':
		'क्रिसमस से प्रभु के बपतिस्मा तक, जिसमें प्रभु के जन्म और संसार के सामने उनके प्रकट होने का उत्सव मनाया जाता है।',
	'calendar.gloss.season.lent':
		'राख बुधवार से प्रभु भोज की सांध्य मिस्सा तक के चालीस दिन: पश्चात्ताप, दान, और पास्का की तैयारी।',
	'calendar.gloss.season.triduum':
		'पवित्र बृहस्पतिवार की संध्या से पास्का रविवार की संध्या तक के तीन दिन — प्रभु का दुःखभोग, मरण और पुनरुत्थान, और समूचे वर्ष का शिखर।',
	'calendar.gloss.season.easter':
		'पास्का से पेन्तेकोस्त तक के पचास दिन, जो एक ही पर्व के रूप में मनाए जाते हैं — „एक ही महान रविवार“।',
	'calendar.gloss.season.ordinary':
		'अन्य कालों के बाहर के तैंतीस या चौंतीस सप्ताह। „साधारण“ नहीं बल्कि क्रमबद्ध: सप्ताह गिने जाते हैं, और कलीसिया प्रभु के जीवन और शिक्षा को क्रम से पढ़ती है। यह दो खण्डों में आता है — क्रिसमस काल के बाद चालीसा तक, और पेन्तेकोस्त के बाद आगमन काल तक।',
	'calendar.gloss.rank.solemnity':
		'सर्वोच्च श्रेणी: पास्का, क्रिसमस, स्वर्गारोहण, किसी स्थान का अपना संरक्षक संत। महिमागान और विश्वास-प्रतिज्ञा के साथ मनाया जाता है, और एक दिन पहले की संध्या से आरम्भ होता है।',
	'calendar.gloss.rank.feast':
		'उसी दिन के भीतर मनाया जाता है। प्रेरित और सुसमाचार-लेखक, तथा प्रभु और माता मरियम के बड़े दिन।',
	'calendar.gloss.rank.memorial':
		'कोई संत, जिसे उनके अपने दिन उस काल की मिस्सा और घण्टों की प्रार्थना के भीतर स्मरण किया जाता है। जहाँ मनाया जाता है वहाँ अनिवार्य।',
	'calendar.gloss.rank.optional-memorial':
		'पुरोहित या समुदाय की इच्छा से मनाया जा सकता है या नहीं भी। न मनाया जाए तो वह दिन साधारण दिन ही रहता है।',
	'calendar.gloss.rank.commemoration':
		'चालीसे में स्मृति-दिवस जो बन जाता है: साधारण दिन की मिस्सा में जोड़ी गई एक प्रार्थना, जिसे यह काल शेष रूप में अक्षुण्ण रखता है।',
	'calendar.gloss.rank.sunday':
		'मूल पर्व-दिन — प्रभु का दिन, पुनरुत्थान के बाद से हर सप्ताह मनाया जाता है। केवल कोई महापर्व या प्रभु का पर्व ही इसे हटा सकता है, और आगमन, चालीसा तथा पास्का काल में वे भी नहीं।',
	'calendar.gloss.rank.weekday':
		'ऐसा दिन जिसका अपना कोई उत्सव नहीं। मिस्सा और घण्टों की प्रार्थना उस काल की होती है — और यही उस काल को जानने योग्य बनाता है।',
	'calendar.gloss.colour.white':
		'आनन्द। पास्का काल और क्रिसमस काल, प्रभु के दुःखभोग के अतिरिक्त उनके दिन, माता मरियम, स्वर्गदूत, और वे संत जो शहीद नहीं थे।',
	'calendar.gloss.colour.red':
		'रक्त और अग्नि। खजूर रविवार और पुण्य शुक्रवार, पेन्तेकोस्त, प्रेरित और सुसमाचार-लेखक, तथा शहीद।',
	'calendar.gloss.colour.green': 'सामान्य काल: आशा का रंग, और बढ़ती हुई वस्तुओं का।',
	'calendar.gloss.colour.violet': 'आगमन और चालीसा, तथा मृतकों के लिए की जाने वाली मिस्साओं में भी।',
	'calendar.gloss.colour.rose':
		'वर्ष में दो बार पहना जाता है — Gaudete रविवार, आगमन का तीसरा, और Laetare रविवार, चालीसे का चौथा — जहाँ उपवास हल्का पड़ता है और अन्त दिखाई देने लगता है।',
	'calendar.gloss.colour.black': 'मृतकों के लिए की जाने वाली मिस्साओं में पहना जा सकता है।',
	'calendar.gloss.colour.blue':
		'नीले का विशेषाधिकार: स्पेन, फिलीपींस और उन थोड़े अन्य स्थानों में निष्कलंक गर्भागमन के पर्व पर पहना जाता है जिन्हें परमधर्मपीठ ने यह अनुमति दी है।',
	'calendar.gloss.sundayCycle':
		'रविवार के पाठ तीन वर्षों में चलते हैं — अ, ब और स — बारी-बारी से मत्ती, मरकुस और लूकस पढ़े जाते हैं, और चालीसे तथा पास्का काल में योहन। यह चक्र आगमन के पहले रविवार को, कलीसिया के वर्ष के साथ बदलता है।',
	'calendar.gloss.weekdayCycle':
		'साधारण दिनों के पाठ दो वर्षों में चलते हैं, I और II: पहला पाठ बदलता है, सुसमाचार नहीं। धर्मविधिक वर्ष का नाम उस पंचांग वर्ष पर पड़ता है जिसमें वह समाप्त होता है — विषम वर्ष I हैं, सम वर्ष II।',
	'calendar.gloss.psalterWeek':
		'घण्टों की प्रार्थना भजनों को चार सप्ताहों में, I से IV तक, बाँटती है, जो वर्ष भर दुहराए जाते हैं। यह वह सप्ताह है जिसके भजन आज के हैं, उनके लिए जो घण्टों की प्रार्थना करते हैं।',
	'calendar.gloss.obligation':
		'वह दिन जिसमें विश्वासी मिस्सा में भाग लेने और ऐसे कामों से दूर रहने के लिए बाध्य हैं जो इसमें बाधा डालें। हर रविवार, और वे अन्य दिन जो प्रत्येक धर्माध्यक्षीय सम्मेलन ने निर्धारित किए हैं।',
	'calendar.primer.title': 'पहली बार यहाँ?',
	'calendar.primer.lead':
		'कलीसिया अपना एक वर्ष रखती है। वह आगमन से आरम्भ होता है, पास्का के चारों ओर घूमता है, और हर दिन को एक नाम, एक श्रेणी और एक रंग देता है — और वही तय करते हैं कि उस दिन मिस्सा में और घण्टों की प्रार्थना में क्या प्रार्थना और पाठ होगा। इसलिए „सामान्य काल का तेईसवाँ रविवार“ एक पता है: यह पुरोहित को, गायक-मण्डली को, या घर पर प्रार्थना करने वाले किसी को भी बताता है कि आज की प्रार्थनाएँ और पाठ कौन-से हैं।',
	'calendar.primer.seasons': 'काल',
	'calendar.primer.ranks': 'एक दिन क्या हो सकता है',
	'calendar.primer.colours': 'रंग',
	'calendar.primer.cycles': 'चक्र',
	'calendar.primer.cyclesLead':
		'तीन गणक, जो मिलकर बताते हैं कि आज के लिए कौन-से पाठ और भजन नियत हैं।'
};
