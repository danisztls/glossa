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
 * THE CALENDAR'S CONTROLS ARRIVED 2026-09-06 -- the 44 `calendar.*` keys
 * `/calendarium` labels itself with, its seasons, ranks and colours among
 * them. The 31 that TEACH those words (`calendar.gloss.*`,
 * `calendar.primer.*`) are prose rather than labels and are left to English
 * for now, by direction; the page stays unpublished until they are written.
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
	'schola.start.heading': 'यदि यह सब आपके लिए नया है',
	'schola.start.body': 'सबसे अच्छी शुरुआत है ',
	'schola.start.bodyAfter':
		': वही शिक्षा जो धर्मशिक्षा में है, कहीं छोटी, प्रश्न और उत्तर में लिखी हुई। यह लगभग दसवें भाग की है और कुछ भी पहले से नहीं मान लेती।',
	'schola.bible.heading': 'यदि आपने बाइबिल कभी नहीं पढ़ी',
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
	'schola.guide.heading': 'यहाँ अपनी राह पाना',
	'schola.guide.lede':
		'पाठ ही पूरा पृष्ठ है; शेष सब एक नियंत्रण है जिसे आप तब तक अनदेखा कर सकते हैं जब तक वह न चाहिए।',
	'schola.guide.top.heading': 'हर पृष्ठ के शीर्ष की पट्टी',
	'schola.guide.reading.heading': 'पाठ के ऊपर की पट्टी',
	'schola.feature.search':
		'ऊपर के खाने में कोई सन्दर्भ लिखिए — अध्याय और पद, अनुच्छेद संख्या, किसी दस्तावेज़ का नाम — और वह लिखते-लिखते पूरा हो जाता है। कहीं से भी / या Ctrl+K दबाइए, और शेष संक्षिप्त कुंजियों के लिए ?।',
	'schola.feature.languages':
		'अंतरफलक और पाठ अलग-अलग चुने जाते हैं, इसलिए आप किसी कृति को एक भाषा में पढ़ सकते हैं जबकि बटन दूसरी में बने रहें। जहाँ किसी कृति के आपकी भाषा में कई संस्करण हैं, वहाँ आप उनमें से भी चुनते हैं।',
	'schola.feature.settings':
		'पाठ का आकार, उजला या गहरा, सीपिया, और पाठ के साथ कितनी टीका आप चाहते हैं।',
	'schola.feature.offline':
		'इस स्थल को अपनी मुख्य स्क्रीन पर जोड़िए और यह किसी ऐप की तरह खुलेगा। आप पूरी कृतियाँ उतार कर बिना संबंध के पढ़ सकते हैं।',
	'schola.feature.contents':
		'जिस कृति में आप हैं उसके विभाग — ग्रंथ, भाग, अध्याय — ताकि आप आरंभ पर लौटे बिना उसके भीतर चल सकें।',
	'schola.feature.compare':
		'एक ही अंश के दो संस्करण, साथ-साथ — लातीनी आपकी अपनी भाषा के साथ, या एक अनुवाद दूसरे के साथ।',
	'schola.feature.apparatus':
		'संस्करण की अपनी टिप्पणियाँ, और पाठ पर लिखी कोई भी व्याख्या, उसके नीचे नहीं बल्कि उसके साथ दी जाती हैं। पाठ के भीतर के उद्धरण कड़ियाँ हैं, इसलिए सन्दर्भ वहीं ले जाता है जहाँ वह संकेत करता है।',
	'schola.feature.focus':
		'पाठ के सिवा सब हटा देता है। बाहर निकलने का रास्ता वहीं रहता है जहाँ पट्टी थी, ताकि कुछ भी उसके पीछे बंद न रह जाए।',
	'schola.books.heading': 'यहाँ क्या है, और उसका सन्दर्भ कैसे दिया जाता है',
	'schola.books.lede':
		'इनमें से हर एक भिन्न प्रकार का ग्रंथ है, और हर एक का सन्दर्भ अपनी ही संख्या से दिया जाता है। उदाहरण रूप दिखाते हैं: वैसा ही कोई खोज-खाने में लिखिए और आप उस अंश पर पहुँच जाएँगे।',
	'schola.cite.label': 'सन्दर्भ',
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
	'jumpbox.placeholder': 'यहाँ जाएँ… (जैसे jn 3:16, ccc 1234)',
	'jumpbox.short': 'खोज',
	'jumpbox.hint': 'किसी सन्दर्भ पर जाने के लिए / या Ctrl+K दबाएँ',
	'jumpbox.noMatch': 'कुछ नहीं मिला',
	'jumpbox.suggestions': 'सुझाव',
	'settings.label': 'सेटिंग्स',
	'darkMode.label': 'गहरा रूप',
	'darkMode.auto': 'स्वतः',
	'darkMode.on': 'चालू',
	'darkMode.off': 'बंद',
	'loadFailed.title': 'यह नहीं खुला',
	'loadFailed.hint':
		'पृष्ठ मौजूद है — उसे लाने में कुछ गड़बड़ हुई। फिर से प्रयास करने पर प्रायः काम बन जाता है।',
	'loadFailed.retry': 'फिर से प्रयास करें',
	'loadFailed.retrying': 'प्रयास हो रहा है…',
	'fontSize.label': 'पाठ का आकार',
	'fontSize.larger': 'बड़ा पाठ',
	'fontSize.smaller': 'छोटा पाठ',
	'print.label': 'यह पृष्ठ छापें',
	'toTop.label': 'ऊपर लौटें',
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
	'bible.landing.books': 'ग्रंथ',
	'bible.introduction': 'प्रस्तावना',
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
	'ccc.landing.pairTitle': 'धर्मशिक्षा और संक्षेपिका',
	'ccc.landing.tagline':
		'<strong>धर्मशिक्षा</strong> काथलिक शिक्षा को 2,865 क्रमांकित अनुच्छेदों में प्रस्तुत करती है। <strong>संक्षेप</strong> उसी शिक्षा को उसी क्रम के अनुसार 598 प्रश्नोत्तरों में प्रस्तुत करता है।',
	'ccc.landing.pairTagline':
		'काथलिक कलीसिया की धर्मशिक्षा 2,865 अनुच्छेदों में, और उसकी संक्षेपिका 598 प्रश्नों में।',
	'compendium.landing.title': 'धर्मशिक्षा की संक्षेपिका',
	'compendium.landing.tagline': 'काथलिक कलीसिया की धर्मशिक्षा का सार देते प्रश्न और उत्तर।',
	'compendium.question': 'प्रश्न',
	'compendium.answer': 'उत्तर',
	'compendium.tableOfContents': 'विषय-सूची',
	'compendium.prevQuestion': 'पिछला प्रश्न',
	'compendium.nextQuestion': 'अगला प्रश्न',
	'compendium.condenses': 'धर्मशिक्षा ¶¶ का सार',
	'ccc.abbrev': 'धर्मशिक्षा',
	'compendium.abbrev': 'संक्षेप',
	'compendium.noQuestionNumber': 'इस संग्रह में प्रश्न संख्या नहीं है',
	'document.library.tagline': 'विश्वपत्र, महासभा के संविधान, आदेश और कलीसियाई शिक्षण की घोषणाएँ।',
	'doctores.landing.title': 'कलीसिया के आचार्य',
	'doctores.landing.tagline': 'कलीसिया के पिताओं और आचार्यों की धर्मशास्त्रीय रचनाएँ।',
	'summa.landing.title': 'सुम्मा थेओलोजीए',
	'summa.landing.tagline': 'थॉमस अक्विनास, अंग्रेज़ी में और उस लातीनी में जो उन्होंने लिखी।',
	'index.division': 'विभाग',
	'prayers.landing.title': 'सामान्य प्रार्थनाएँ',
	'prayers.landing.tagline': 'लातीनी पाठ के साथ प्रार्थनाएँ।',
	'prayers.seeAlso': 'यह भी देखें',
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
	'art.about': 'इस चित्र के विषय में',
	'art.detail': 'अंश',
	'colophon.typeTitle': 'अक्षर',
	'colophon.typeBody':
		'EB Garamond में संयोजित, जो क्लोद गारामों द्वारा 1590 के दशक में उकेरे गए अक्षरों का गेओर्ग डुफ़्नर और ओक्ताविओ पार्दो द्वारा किया गया पुनरुद्धार है — वही मानवतावादी परंपरा जिसमें कलीसिया पुनर्जागरण से छापती आई है। इसकी सिरिलिक लिपि उन्हीं हाथों की है पर किसी का पुनरुद्धार नहीं करती: सिरिलिक गारामों कभी उकेरा ही नहीं गया, इसलिए रूसी उस रूप में संयोजित है जो शेष के साथ खड़े होने के लिए बनाया गया।',
	'colophon.typeArabic':
		'अरबी इसकी पहुँच से पूर्णतः बाहर है, और Amiri में संयोजित है — 1905 में क़ाहिरा के बूलाक़ मुद्रणालय के लिए उकेरी गई नस्ख़ लिपि का ख़ालिद होस्नी द्वारा किया गया पुनरुद्धार, जिसे पाठ-अक्षर के समान ही तर्क से चुना गया: कोई समकालीन रेखांकन नहीं, बल्कि एक विशिष्ट ऐतिहासिक पुस्तक-अक्षर।',
	'colophon.typeInitials':
		'आरंभिक अक्षर Pirata One हैं, एक गॉथिक लिपि जिसके बड़े अक्षर उस आकार में भी पठनीय रहते हैं जिसकी आरंभिक अक्षर माँग करता है, और — रूसी के लिए — Ponomar, जो धर्मसभा मुद्रणालय की कलीसियाई स्लावोनिक लिपि को पुनः प्रस्तुत करता है। Ponomar केवल आरंभिक अक्षर संयोजित करता है, कभी पाठ नहीं: पूरी तरह धर्मसभा लिपि में संयोजित कोई आधुनिक विश्वपत्र अपने विषय में कुछ असत्य कहेगा। ये सभी SIL Open Font License के अंतर्गत अनुज्ञप्त हैं और किसी तृतीय पक्ष के बजाय इसी स्थल से दिए जाते हैं, इसलिए कोई पृष्ठ पढ़ना किसी और के सर्वर से कुछ नहीं माँगता।',
	'copyright.sourceTitle': 'मूल स्रोत पृष्ठ खोलें',
	'copyright.sourceLabel': 'स्रोत',
	'lang.label': 'भाषा',
	'lang.filter': 'भाषाएँ खोजें',
	'lang.more': 'और भाषाएँ',
	'calendar.title': 'धर्मविधि पंचांग',
	'calendar.tagline':
		'सामान्य रोमन पंचांग, किसी भी दिन के लिए गणना किया गया — उसका काल, उसका दर्जा, उसका रंग।',
	'calendar.date': 'तिथि',
	'calendar.calendar': 'पंचांग',
	'calendar.which.general': 'सामान्य रोमन पंचांग',
	'calendar.filter': 'देश खोजें',
	'calendar.region.europe': 'यूरोप',
	'calendar.region.americas': 'अमेरिका',
	'calendar.region.africa': 'अफ्रीका',
	'calendar.region.asia': 'एशिया',
	'calendar.region.oceania': 'ओशिनिया',
	'calendar.today': 'आज',
	'calendar.previousMonth': 'पिछला महीना',
	'calendar.nextMonth': 'अगला महीना',
	'calendar.noSuchDay': 'उस तिथि के लिए कोई धर्मविधि दिवस गणना में नहीं आता।',
	'calendar.week': 'सप्ताह',
	'calendar.alsoToday': 'आज यह भी मनाया जाता है',
	'calendar.alsoObserved': 'आज यह भी स्मरण किया जाता है',
	'calendar.obligation': 'अनिवार्य पर्व',
	'calendar.obligationCanon': 'CIC कै. 1246',
	'calendar.sundayCycle': 'रविवारीय चक्र',
	'calendar.weekdayCycle': 'साप्ताहिक दिवस चक्र',
	'calendar.psalterWeek': 'भजन सप्ताह',
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
	'calendar.rank.weekday': 'साधारण दिन'
};
