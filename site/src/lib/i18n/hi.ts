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
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` (the canonical standing statement, Can. 216
 * CIC) and `colophon.copyrightBody3` (how a rights holder reaches us) are the
 * two to check first: both are operative rather than descriptive.
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
	'nav.socialDoctrine': 'सामाजिक शिक्षा',
	'socialDoctrine.landing.title': 'कलीसिया की सामाजिक शिक्षा का संग्रह',
	'socialDoctrine.landing.tagline':
		'समाज में जीवन के विषय में कलीसिया की शिक्षा, 583 क्रमांकित अनुच्छेदों में।',
	'socialDoctrine.backMatter': 'आरंभिक पृष्ठ और अनुक्रमणिकाएँ',
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
	'colophon.typeTitle': 'अक्षर',
	'colophon.typeBody':
		'EB Garamond में संयोजित, जो क्लोद गारामों द्वारा 1590 के दशक में उकेरे गए अक्षरों का गेओर्ग डुफ़्नर और ओक्ताविओ पार्दो द्वारा किया गया पुनरुद्धार है — वही मानवतावादी परंपरा जिसमें कलीसिया पुनर्जागरण से छापती आई है। इसकी सिरिलिक लिपि उन्हीं हाथों की है पर किसी का पुनरुद्धार नहीं करती: सिरिलिक गारामों कभी उकेरा ही नहीं गया, इसलिए रूसी उस रूप में संयोजित है जो शेष के साथ खड़े होने के लिए बनाया गया।',
	'colophon.typeArabic':
		'अरबी इसकी पहुँच से पूर्णतः बाहर है, और Amiri में संयोजित है — 1905 में क़ाहिरा के बूलाक़ मुद्रणालय के लिए उकेरी गई नस्ख़ लिपि का ख़ालिद होस्नी द्वारा किया गया पुनरुद्धार, जिसे पाठ-अक्षर के समान ही तर्क से चुना गया: कोई समकालीन रेखांकन नहीं, बल्कि एक विशिष्ट ऐतिहासिक पुस्तक-अक्षर।',
	'colophon.typeInitials':
		'आरंभिक अक्षर Pirata One हैं, एक गॉथिक लिपि जिसके बड़े अक्षर उस आकार में भी पठनीय रहते हैं जिसकी आरंभिक अक्षर माँग करता है, और — रूसी के लिए — Ponomar, जो धर्मसभा मुद्रणालय की कलीसियाई स्लावोनिक लिपि को पुनः प्रस्तुत करता है। Ponomar केवल आरंभिक अक्षर संयोजित करता है, कभी पाठ नहीं: पूरी तरह धर्मसभा लिपि में संयोजित कोई आधुनिक विश्वपत्र अपने विषय में कुछ असत्य कहेगा। ये सभी SIL Open Font License के अंतर्गत अनुज्ञप्त हैं और किसी तृतीय पक्ष के बजाय इसी स्थल से दिए जाते हैं, इसलिए कोई पृष्ठ पढ़ना किसी और के सर्वर से कुछ नहीं माँगता।'
};
