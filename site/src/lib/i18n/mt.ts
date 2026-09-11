/**
 * Malti UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * ADDED 2026-09-06, and the reason is the calendar. `calendar/names/mt.ts`
 * holds the General Roman Calendar's 218 celebrations and the whole Proper of
 * Time in Malti, read off the calendar GCatholic publishes for this
 * language — so the site could name every day of the year in it and had no
 * chrome to put around them. That is the combination `../ui-langs.ts` says the
 * interface list should never leave standing, arriving from the calendar's
 * side rather than the corpus's.
 *
 * The same 280 keys the other tail dictionaries carry: every chrome page's
 * name and description, the reader-facing controls, the colophon, and all 75
 * `calendar.*` keys — the 44 the calendar page labels itself with and the 31
 * that teach what those labels mean. IT HAS NOT BEEN READ BY A NATIVE
 * SPEAKER. `colophon.whatThisIsStanding` and `footer.notEndorsed` (the
 * canonical standing statement, Can. 216 CIC, at full length and in the one
 * line the footer of every page carries) and `colophon.copyrightBody3` (how a
 * rights holder reaches us) are the ones to check first: all three are
 * operative rather than descriptive. Deleting a doubtful line is a valid fix —
 * it falls back to English.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const mt: Dictionary = {
	'nav.bible': 'Bibbja',
	'nav.ccc': 'Katekiżmu',
	'nav.compendium': 'Kompendju',
	'nav.magisterium': 'Maġisteru',
	'nav.socialDoctrine': 'Duttrina Soċjali',
	'socialDoctrine.landing.title': 'Kompendju tad-Duttrina Soċjali tal-Knisja',
	'socialDoctrine.landing.tagline':
		'Dak li l-Knisja tgħallem dwar il-ħajja fis-soċjetà, f’583 paragrafu numerat.',
	'nav.canonLaw': 'Dritt Kanoniku',
	'canonLaw.landing.title': 'Kodiċi tad-Dritt Kanoniku',
	'canonLaw.landing.tagline': 'Il-liġi tal-Knisja Latina, f’1,752 kanoni maqsuma f’seba’ kotba.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kann.',
	'canonLaw.prevCanon': 'Kanoni ta’ qabel',
	'canonLaw.nextCanon': 'Kanoni li jmiss',
	'canonLaw.readFullTitle': 'Aqra t-titlu sħiħ',
	'canonLaw.superseded': 'Kliem mibdul minn',
	'nav.prayers': 'Talb',
	'nav.bookmarks': 'Sinjali',
	'nav.menu': 'Menu',
	'nav.sections': 'Taqsimiet',
	'nav.works': 'Xogħlijiet',
	'nav.pages': 'Paġni',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Kompli aqra',
	'home.tagline':
		'Sit għall-qari tal-Iskrittura, tal-Katekiżmu u tad-dokumenti tal-Maġisteru — b’xejn, offline, u bla ma trid tirreġistra xejn.',
	'home.doors.heading': 'Fejn tmur',
	'home.find.heading': 'Jew ittajpja referenza',
	'nav.library': 'Librerija',
	'nav.learn': 'Tgħallem',
	'library.landing.tagline': 'Il-korpus kollu, xkaffa xkaffa, u dak li mmarkajt fih.',
	'schola.landing.title': 'Minn fejn tibda',
	'schola.landing.tagline':
		'Gwida qasira għal dak li hawn: x’inhu kull wieħed minn dawn il-kotba, l-Għaxar Kmandamenti u l-listi l-oħra li l-Knisja titlob li Kattoliku jkun jaf, u minn fejn tibda taqra.',
	'schola.start.heading': 'Ġdid għall-Kattoliċiżmu?',
	'schola.start.body': 'Ibda bil-',
	'schola.start.bodyAfter':
		': l-istess tagħlim tal-Katekiżmu, ħafna iqsar, miktub bħala mistoqsijiet u tweġibiet. Huwa madwar wieħed minn kull għaxra fit-tul u ma jassumi xejn.',
	'schola.bible.heading': 'Qatt ma qrajt il-Bibbja?',
	'schola.bible.library':
		'Mhijiex ktieb wieħed imma tlieta u sebgħin, miktuba fuq aktar minn elf sena u marbuta fl-ordni li l-Knisja stabbiliet — mhux l-ordni li fih ġraw il-ġrajjiet, u mhux l-ordni l-aktar faċli għall-qari. Ħafna jibdew mill-ewwel paġna u jieqfu ftit ġimgħat wara, f’xi kapitlu twil ta’ liġi antika, għax xejn għadu ma qalilhom għalxiex hi.',
	'schola.bible.step.gospel': 'Ibda b’Evanġelju',
	'schola.bible.start':
		'Wieħed minn erba’ kotba qosra dwar il-ħajja ta’ Ġesù, ferm ’il ġewwa u mhux fil-bidu. Din mhijiex ideja tagħna: Konċilju tal-Knisja talab li n-nies jitgħallmu l-użu t-tajjeb tal-Iskrittura “l-aktar it-Testment il-Ġdid u fuq kollox l-Evanġelji”. Ma semma l-ebda wieħed b’ismu, u lanqas aħna.',
	'schola.bible.whichGospel':
		'Tlieta jiġu ssuġġeriti komunement, għal tliet raġunijiet differenti. Kwalunkwe minnhom huwa post tajjeb fejn tkun.',
	'schola.bible.gospel.mark':
		'L-iqsar. Tista’ taqrah kollu f’wara nofsinhar, u li tkun temmejt wieħed jiswa aktar fil-bidu milli li tkun għażilt l-aħjar wieħed.',
	'schola.bible.gospel.luke':
		'Miktub għal xi ħadd barra mill-fidi li ried ir-rakkont imniżżel bl-ordni — li jista’ jkun eżattament int. Jissokta dritt fl-Atti tal-Appostli, mela huwa tabilħaqq l-ewwel nofs ta’ ktieb itwal.',
	'schola.bible.gospel.john':
		'Dak li jgħid ċar għaliex inkiteb: “biex intom temmnu”. Kliem sempliċi, u jmur dritt għall-mistoqsija ta’ min hu Ġesù.',
	'schola.bible.step.acts': 'Imbagħad x’ġara wara',
	'schola.bible.thenActs':
		'Meta tkun temmejt wieħed, aqra x’għamlu n-nies li kienu jafuh wara li telaq.',
	'schola.bible.acts.why':
		'It-tletin sena wara li jispiċċaw l-Evanġelji: ftit għexieren ta’ nies imbeżżgħa, u kif dak li kienu raw wasal sax-xatt l-ieħor tal-imperu.',
	'schola.bible.step.old': 'Imbagħad in-nofs eqdem',
	'schola.bible.thenOld':
		'Mhux mill-ewwel paġna, u mhux kollu. Ftit postijiet iġorru r-rakkont, u huma dawk li l-Evanġelji jibqgħu jipponta lejhom.',
	'schola.bible.ot.beginnings': 'Kif jibda, u kif imur ħażin.',
	'schola.bible.ot.promise':
		'Familja waħda, u wegħda magħmula lilha li tgħix aktar minn kull min hemm fiha.',
	'schola.bible.ot.exodus': 'Poplu meħruġ mill-jasar, u mogħti liġi biex jgħix biha.',
	'schola.bible.ot.psalms':
		'Mhux rakkont: mija u ħamsin talba u għanja. Aqra waħda kull darba, fi kwalunkwe ordni. Il-Knisja għadha titlobhom kuljum.',
	'schola.bible.bothWays':
		'Se tagħraf affarijiet, u dak huwa l-punt aktar milli koinċidenza. Il-Knisja taqra l-kotba eqdem fid-dawl ta’ Kristu u dawk ġodda fid-dawl ta’ dak li ġie qabel — kull nofs jispjega l-ieħor, u għalhekk l-ebda wieħed ma jinqara waħdu.',
	'schola.books.heading': 'X’hemm hawn',
	'schola.what.scripture':
		'L-Iskrittura kif tirċeviha l-Knisja, fiż-żewġ Testmenti. Kull ħaġa oħra hawn tinqara fid-dawl tagħha.',
	'schola.what.catechism':
		'Sinteżi ta’ dak li temmen il-Knisja Kattolika, f’volum wieħed. Mhuwiex hu stess sors: jiġbor l-Iskrittura, il-Padri, il-liturġija u t-tagħlim tal-Knisja, u kull paragrafu jgħid minn fejn ġej dak li jgħid.',
	'schola.what.compendium':
		'L-istess tagħlim imqiegħed bħala mistoqsijiet u tweġibiet, f’madwar wieħed minn kull għaxra fit-tul.',
	'schola.what.magisterium':
		'Dak li l-papiet u l-konċilji fil-fatt kitbu — enċikliki, kostituzzjonijiet, digrieti, dikjarazzjonijiet — kull wieħed indirizzat lil mument partikolari u lil mistoqsija partikolari. Kull wieħed jingħaraf bl-ewwel kliem tiegħu bil-Latin.',
	'schola.what.social':
		'It-tagħlim tal-Knisja dwar ix-xogħol, il-proprjetà, il-familja, il-politika u l-paċi, miġbur minn dawk id-dokumenti fi ktieb wieħed.',
	'schola.what.law': 'Liġi aktar milli duttrina. Tgħid x’titlob il-Knisja, u tiġi emendata.',
	'schola.what.doctors':
		'It-teologi li l-Knisja semmiet Dutturi. Ma jġorr l-ebda awtorità uffiċjali, ikun kemm ikun kbir l-awtur tiegħu.',
	'schola.what.prayers': 'Il-kliem li titlob il-Knisja, bil-Latin ħdejh.',
	'schola.places.heading': 'Mhux testi, imma postijiet f’dan is-sit',
	'schola.what.library':
		'Kull xogħol fis-sit f’lista waħda, miġbur skont is-suġġett aktar milli skont ix-xorta.',
	'schola.what.questions':
		'Mod kif tidħol għal min għandu mistoqsija u l-ebda ċitazzjoni. Kull waħda tiġbor is-siltiet li jwieġbuha — l-ewwel il-Katekiżmu — u kull kelma tagħhom hija tal-Knisja stess.',
	'schola.what.calendar':
		'Il-jum liturġiku — staġun, kulur, u min jiġi mfakkar — għall-pajjiż li tal-kalendarju tiegħu timxi.',
	'schola.what.bookmarks':
		'Siltiet li mmarkajt, u fejn wasalt f’kull xogħol. It-tnejn jinżammu f’dan il-browser u ma jintbagħtu mkien.',
	'schola.what.census':
		'X’għandha din il-librerija u kemm tasal ’il bogħod — kemm-il xogħol, b’liema lingwi, u kemm minn kull wieħed jista’ tabilħaqq jilħaq min jaqra bil-lingwa tiegħek.',
	'schola.formulas.heading': 'L-Għaxar Kmandamenti',
	'ccc.noCounterpart': 'L-ebda korrispondent fix-xogħol l-ieħor',
	'jumpbox.placeholder': 'Aqbeż għal… (eż. john 3:16, ccc 1234)',
	'jumpbox.short': 'Fittex',
	'jumpbox.hint': 'Agħfas / jew Ctrl+K biex taqbeż għal referenza',
	'jumpbox.noMatch': 'L-ebda riżultat',
	'jumpbox.suggestions': 'Suġġerimenti',
	'settings.label': 'Issettjar',
	'apparatus.label': 'Apparat',
	'apparatus.editionNotes': 'In-noti ta’ din l-edizzjoni',
	'apparatus.commentary': 'Kummentarju',
	'apparatus.inCommentary': 'Inkluż fil-kummentarju ta’ hawn fuq.',
	'darkMode.label': 'Modalità skura',
	'darkMode.auto': 'Awtomatiku',
	'darkMode.on': 'Mixgħul',
	'darkMode.off': 'Mitfi',
	'sepia.label': 'Sepja',
	'sepia.lightOnly': 'Modalità ċara biss',
	'sepia.noHue': 'Mhux fil-monokrom',
	'oled.label': 'Iswed OLED',
	'oled.darkOnly': 'Modalità skura biss',
	'mono.label': 'Monokrom',
	'mono.hint':
		'Ipoġġi l-paġna kollha f’griż wieħed, biex xejn ma jingħaraf mill-ieħor bil-kulur. Is-Sepja tintefa’ waqt li din tkun mixgħula.',
	'advanced.label': 'Avvanzat',
	'library.title': 'Librerija offline',
	'library.lede':
		'It-testi miżmuma f’dan l-apparat jinfetħu mingħajr ebda konnessjoni tal-internet.',
	'library.essentials': 'Talb u Kompendju',
	'library.illustrations': 'Bibbja (illustrazzjonijiet)',
	'library.illustrationsDetail': 'Bibbja (illustrazzjonijiet, riżoluzzjoni għolja)',
	'library.other': 'Testi oħra',
	'library.everything': 'Kollox',
	'library.downloadAll': 'Niżżel kollox',
	'library.download': 'Niżżel',
	'library.downloaded': 'F’dan l-apparat',
	'library.offlineNote': 'Itfi l-modalità offline biex tniżżel xi ħaġa.',
	'library.remove': 'Neħħi minn dan l-apparat',
	'library.removeConfirm': 'Tneħħi?',
	'library.forget': 'Neħħi t-tniżżil',
	'library.forgetConfirm': 'Tneħħi kollox?',
	'offline.label': 'Modalità offline',
	'offline.hint':
		'Ma tuża ebda konnessjoni: xejn ma jitniżżel, l-ebda aġġornament ma jiġi ċċekkjat, xejn ma jitkejjel. Jinfetħu biss it-testi diġà f’dan l-apparat.',
	'offline.notDownloaded': 'Mhux f’dan l-apparat',
	'loadFailed.title': 'Dan ma tgħabbiex',
	'loadFailed.hint':
		'Il-paġna teżisti — xi ħaġa marret ħażin waqt li kienet qed tinġieb. Li terġa’ tipprova s-soltu jaħdem.',
	'loadFailed.retry': 'Erġa’ pprova',
	'loadFailed.retrying': 'Qed nipprova…',
	'offline.turnOff': 'Itfi l-modalità offline',
	'type.label': 'Daqs u tipa tat-test',
	'fontSize.label': 'Daqs tat-test',
	'fontSize.small': 'Żgħir',
	'fontSize.medium': 'Medju',
	'fontSize.large': 'Kbir',
	'fontSize.xlarge': 'Kbir ħafna',
	'fontSize.xxlarge': 'L-akbar',
	'face.label': 'Tipa tal-ittri',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Ipprintja din il-paġna',
	'toTop.label': 'Erġa’ lura fil-quċċata',
	'install.label': 'Installa Glossa',
	'install.hint.label': 'Żid mal-Iskrin Ewlieni',
	'install.hint.title': 'Żid Glossa mal-Iskrin Ewlieni tiegħek',
	'install.hint.stepBefore': 'Jinfetaħ bħal app u jaqra offline. Agħfas',
	'install.hint.stepAfter': 'imbagħad “Żid mal-Iskrin Ewlieni”.',
	'install.hint.dismiss': 'Injora',
	'update.label': 'Edizzjoni ġdida disponibbli',
	'update.title': 'Edizzjoni ġdida lesta',
	'update.body': 'Erġa’ tella’ l-paġna biex tikseb l-aħħar testi u l-korrezzjonijiet.',
	'update.action': 'Erġa’ tella’',
	'update.dismiss': 'Mhux issa',
	'edition.label': 'Edizzjoni',
	'edition.select': 'Agħżel edizzjoni',
	'edition.current': 'Edizzjoni attwali',
	'edition.filter': 'Fittex edizzjonijiet',
	'menu.noMatches': 'L-ebda riżultat',
	'unitNav.previous': 'Ta’ qabel',
	'unitNav.next': 'Li jmiss',
	'bible.prevChapter': 'Kapitlu ta’ qabel',
	'bible.nextChapter': 'Kapitlu li jmiss',
	'bible.pickBook': 'Kotba u kapitli',
	'bible.landing.title': 'Il-Bibbja',
	'bible.landing.tagline': 'Aqra l-Bibbja kollha, ktieb ktieb, kapitlu kapitlu.',
	'bible.landing.random': 'Silta bl-addoċċ',
	'bible.landing.books': 'Kotba',
	'bible.chapterUnavailable': 'Mhux disponibbli f’din l-edizzjoni',
	'bible.introduction': 'Introduzzjoni',
	'bible.introUnavailable': 'Għad m’hemm l-ebda introduzzjoni b’din il-lingwa',
	'bible.introSource': 'L-introduzzjonijiet mhumiex parti mit-test tal-Iskrittura.',
	'bible.testament.ot': 'It-Testment il-Qadim',
	'bible.testament.nt': 'It-Testment il-Ġdid',
	'bible.group.pentateuch': 'Il-Pentatewku',
	'bible.group.historical': 'Kotba Storiċi',
	'bible.group.wisdom': 'Kotba tal-Għerf',
	'bible.group.prophetic': 'Kotba Profetiċi',
	'bible.group.gospels': 'Evanġelji',
	'bible.group.acts': 'Atti tal-Appostli',
	'bible.group.pauline': 'Ittri ta’ San Pawl',
	'bible.group.catholicLetters': 'Ittri Kattoliċi',
	'bible.group.revelation': 'Apokalissi',
	'ccc.prevParagraph': 'Paragrafu ta’ qabel',
	'ccc.nextParagraph': 'Paragrafu li jmiss',
	'ccc.inBrief': 'Fil-Qosor',
	'ccc.landing.title': 'Katekiżmu tal-Knisja Kattolika',
	'ccc.landing.pairTitle': 'Katekiżmu u Kompendju',
	'ccc.landing.tagline':
		'<strong>Il-Katekiżmu</strong> ifisser id-duttrina Kattolika f’2,865 paragrafu numerat. <strong>Il-Kompendju</strong> jerġa’ jgħid l-istess duttrina bħala 598 mistoqsija u tweġiba, fuq l-istess pjan.',
	'ccc.landing.pairTagline':
		'Il-Katekiżmu tal-Knisja Kattolika f’2,865 paragrafu, u l-Kompendju tiegħu f’598 mistoqsija.',
	'ccc.tableOfContents': 'Werrej',
	'ccc.related': 'Ara wkoll',
	'compendium.landing.title': 'Kompendju tal-Katekiżmu',
	'compendium.landing.tagline':
		'Mistoqsijiet u tweġibiet li jiġbru fil-qosor il-Katekiżmu tal-Knisja Kattolika.',
	'compendium.question': 'Mistoqsija',
	'compendium.answer': 'Tweġiba',
	'compendium.tableOfContents': 'Werrej',
	'compendium.prevQuestion': 'Mistoqsija ta’ qabel',
	'compendium.nextQuestion': 'Mistoqsija li jmiss',
	'compendium.condenses': 'Jiġbor KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'Fil-Kompendju',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'L-ebda numru ta’ mistoqsija f’dan il-korpus',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Dutturi tal-Knisja',
	'doctores.landing.tagline': 'Ix-xogħlijiet teoloġiċi tal-Padri u tad-Dutturi tal-Knisja.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Tumas t’Aquino, bl-Ingliż u bil-Latin li kiteb bih.',
	'summa.tableOfContents': 'Werrej',
	'summa.part': 'Parti',
	'summa.question': 'Kwistjoni',
	'summa.article': 'Artiklu',
	'summa.questionShort': 'Kw.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titlu mill-edizzjoni bil-{lang}',
	'summa.titlesFromEdition': 'Titli mill-edizzjoni bil-{lang} — din ma tistampa l-ebda wieħed',
	'summa.prologue': 'Prologu',
	'summa.objection': 'Oġġezzjoni',
	'summa.sedContra': 'Għall-kuntrarju',
	'summa.corpus': 'Inwieġeb li',
	'summa.reply': 'Tweġiba għall-Oġġezzjoni',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Kwistjoni ta’ qabel',
	'summa.nextQuestion': 'Kwistjoni li jmiss',
	'summa.noEditionInYourLanguage':
		'Is-Summa m’għandha l-ebda edizzjoni bil-lingwa tiegħek. Muri bil-{lang}.',
	'summa.noLatinSupplement':
		'Is-Suppliment jeżisti bl-Ingliż biss — ġie miġbur wara l-mewt t’Aquino.',
	'index.division': 'Diviżjoni',
	'index.showSubsections': 'Uri t-taqsimiet ta’ taħt',
	'index.hideSubsections': 'Aħbi t-taqsimiet ta’ taħt',
	'prayers.landing.title': 'Talb Komuni',
	'prayers.landing.tagline': 'Talb bit-test Latin ħdejh.',
	'prayers.tableOfContents': 'Werrej',
	'prayers.gloss.versicle':
		'Il-vers — ir-ringiela li min imexxi t-talba jgħid jew ikanta waħdu. Il-ġemgħa twieġbu bit-tweġiba li ġejja.',
	'prayers.gloss.response':
		'It-tweġiba — ir-ringiela li l-ġemgħa tgħid jew tkanta flimkien, bi tweġiba għall-vers ta’ qabel.',
	'prayers.seeAlso': 'Ara wkoll',
	'prayers.prevPrayer': 'Talba ta’ qabel',
	'prayers.nextPrayer': 'Talba li jmiss',
	'prayers.rosary.today': 'Illum',
	'prayers.rosary.todayHeading': 'Il-misteri tal-lum',
	'prayers.rosary.openingPrayer': 'Talba tal-ftuħ',
	'prayers.rosary.decadePrayers': 'It-talb ta’ deċina',
	'ref.tooltip.loading': 'Qed jitgħabba…',
	'ref.tooltip.openCcc': 'Iftaħ fil-Katekiżmu',
	'ref.tooltip.openBible': 'Iftaħ fil-Bibbja',
	'ref.tooltip.openCompendium': 'Iftaħ fil-Kompendju',
	'ref.preview.open': 'Iftaħ',
	'ref.cf': 'cf.',
	'anchor.actions': 'Azzjonijiet tar-referenza',
	'anchor.copy': 'Ikkopja t-test',
	'anchor.copyLink': 'Ikkopja l-link',
	'anchor.view': 'Ara',
	'anchor.copied': 'Ikkupjat',
	'anchor.copyFailed': 'Ma setax jiġi kkupjat',
	'bookmark.add': 'Immarka',
	'bookmark.remove': 'Neħħi s-sinjal',
	'bookmark.library': 'Sinjali',
	'bookmark.library.tagline': 'Kull ma mmarkajt waqt il-qari.',
	'bookmark.empty': 'Xejn immarkat s’issa.',
	'bookmark.emptyHint':
		'Ikklikkja n-numru ta’ vers jew paragrafu u agħżel Immarka, jew uża l-buttuna tas-sinjal fuq paġna.',
	'bookmark.about': 'Dwar dawn is-sinjali',
	'bookmark.deviceOnly':
		'Is-sinjali jinżammu f’dan il-browser biss. Ma jintbagħtu mkien, u jekk tħassar id-data tal-browser jitilfu.',
	'bookmark.unavailable': 'Mhux fl-edizzjoni li qed taqra',
	'document.library.tagline':
		'Enċikliki, kostituzzjonijiet konċiljari, digrieti u dikjarazzjonijiet tal-Maġisteru.',
	'document.filter.heading': 'Filtru',
	'document.filter.author': 'Awtur',
	'document.filter.kind': 'Xorta',
	'document.filter.subject': 'Suġġett',
	'document.filter.search': 'Fittex dokumenti',
	'document.filter.clear': 'Ħassar',
	'document.filter.results': 'Dokumenti muri',
	'document.filter.noResults': 'L-ebda dokument ma jaqbel ma’ dawn il-filtri.',
	'document.tableOfContents': 'Werrej',
	'document.startReading': 'Ibda taqra',
	'document.readFullDocument': 'Aqra d-dokument sħiħ',
	'document.section': 'Taqsima',
	'document.prevSection': 'Ta’ qabel',
	'document.nextSection': 'Li jmiss',
	'document.kind.conciliarConstitution': 'Kostituzzjoni',
	'document.kind.conciliarDecree': 'Digriet',
	'document.kind.conciliarDeclaration': 'Dikjarazzjoni',
	'document.kind.encyclical': 'Enċiklika',
	'document.kind.apostolicExhortation': 'Eżortazzjoni Appostolika',
	'document.kind.apostolicConstitution': 'Kostituzzjoni Appostolika',
	'document.kind.apostolicLetter': 'Ittra Appostolika',
	'document.kind.cdfDeclaration': 'Dikjarazzjoni tal-KDF',
	'document.kind.cdfInstruction': 'Istruzzjoni tal-KDF',
	'document.kind.cdfLetter': 'Ittra tal-KDF',
	'document.kind.cdfDoctrinalNote': 'Nota Duttrinali tal-KDF',
	'document.kind.cdfResponsum': 'Responsum tal-KDF',
	'document.kind.cdfConsiderations': 'Konsiderazzjonijiet tal-KDF',
	'document.kindPlural.conciliarConstitution': 'Kostituzzjonijiet',
	'document.kindPlural.conciliarDecree': 'Digrieti',
	'document.kindPlural.conciliarDeclaration': 'Dikjarazzjonijiet',
	'document.kindPlural.encyclical': 'Enċikliki',
	'document.kindPlural.apostolicExhortation': 'Eżortazzjonijiet Appostoliċi',
	'document.kindPlural.apostolicConstitution': 'Kostituzzjonijiet Appostoliċi',
	'document.kindPlural.apostolicLetter': 'Ittri Appostoliċi',
	'document.kindPlural.cdfDeclaration': 'Dikjarazzjonijiet tal-KDF',
	'citation.unavailable': 'L-ebda test tas-sors disponibbli għal din in-nota.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'X’inhu dan is-sit, minn fejn ġejjin it-testi tiegħu, u fejn qegħdin aħna dwar ir-riproduzzjoni tagħhom.',
	'colophon.whatThisIs': 'X’inhu dan',
	'colophon.whatThisIsBody':
		'Glossa Catholica huwa sit għall-qari tal-Iskrittura, tal-Katekiżmu, tal-Kompendju u tad-dokumenti tal-Maġisteru, bl-Ingliż, bil-Portugiż u bil-Latin. Jeżisti biex jinqara, u ma jintalab xejn aktar mingħandek biex taqrah:',
	'colophon.pointFree': 'B’xejn, u dejjem b’xejn. L-ebda ħlas, l-ebda abbonament, xejn x’tixtri.',
	'colophon.pointNoAds': 'L-ebda reklamar, u l-ebda tqegħid sponsorjat ta’ kwalunkwe xorta.',
	'colophon.pointNoAccounts': 'L-ebda kont. Xejn x’tirreġistra, xejn fejn tidħol.',
	'colophon.pointNoTracking':
		'L-ebda skripts ta’ traċċar, l-ebda kodiċi ta’ terzi, l-ebda cookies. Għadd anonimu tal-użu biss, bla xejn li jidentifikak.',
	'colophon.pointOffline':
		'Mibni biex jibqa’ jaħdem offline ladarba żortu, ħalli konnessjoni fqira ma jkollhiex għalfejn tkun ostaklu għall-qari.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica huwa impriża privata tal-lajċi fidili. Ma jġorr l-ebda approvazzjoni ekkleżjastika u ma jitkellimx b’awtorità tiegħu.',
	'footer.notEndorsed': 'Mhux approvat mis-Santa Sede',
	'colophon.textsTitle': 'It-testi',
	'colophon.textsBody':
		'Kull test ġej minn sors imsemmi, u kull xogħol jirreġistra l-edizzjoni tiegħu, il-paġna tas-sors u d-data li nġieb fiha. L-Iskrittura tuża traduzzjonijiet fid-dominju pubbliku; il-Katekiżmu, il-Kompendju u d-dokumenti maġisterjali ġejjin mit-testi ppubblikati tas-Santa Sede nnifisha.',
	'colophon.textsFidelity':
		'It-test qatt ma jiġi mqassar, qatt parafrasat, qatt miktub mill-ġdid, u qatt imqiegħed ħdejn reklamar. Aħna nsewwu difetti ċari — kelma li waqgħet, ċitazzjoni mħarbta, markup li bela’ paragrafu — dejjem lejn dak li jistampa s-sors innifsu, qatt lejn dak li naħsbu li kellu jgħid.',
	'colophon.countBible': 'edizzjonijiet tal-Bibbja',
	'colophon.countDocuments': 'dokumenti maġisterjali',
	'colophon.privacyTitle': 'Privatezza',
	'colophon.privacyBody1':
		'L-ebda kont, l-ebda cookies, l-ebda reklamar, l-ebda kodiċi ta’ terzi. Xejn hawn ma jsegwik ’il barra minn dan is-sit.',
	'colophon.privacyBody2':
		'Aħna ngħoddu kif jintuża s-sit: kejl wieħed għal kull żjara, kull qasam huwa medda minflok valur — kemm domt, kemm-il darba kont hawn, liema xogħlijiet fetaħt. Il-pajjiż tiegħek jingħadd separatament, mingħajr ma jingħaqad mal-bqija. Jiddeskrivi żjara, mhux żair, u jinżamm għal {days} jum.',
	'colophon.privacyBody3':
		'Qatt ma jintbagħtu: dak li tikteb fil-kaxxa tat-tfittxija, liema silta kellek miftuħa, jew xi ħaġa li tista’ terġa’ tagħraf l-apparat tiegħek. L-issettjar, is-sinjali u t-testi mniżżla tiegħek jibqgħu fuq l-apparat tiegħek.',
	'colophon.copyrightTitle': 'Drittijiet tal-awtur',
	'colophon.copyrightBody1':
		'Il-Katekiżmu, il-Kompendju u d-dokumenti maġisterjali huma proprjetà tad-detenturi tad-drittijiet tagħhom — prinċipalment il-Libreria Editrice Vaticana u d-Dikasteru għall-Komunikazzjoni.',
	'colophon.copyrightBody2':
		'Kull xogħol juri l-avviż tad-drittijiet tad-detentur tiegħu, bi kliemu stess, u jorbot mal-paġna li minnha ttieħed.',
	'colophon.copyrightBody3':
		'Jekk għandek drittijiet fuq xi test hawn u tippreferi li ma jkunx ippubblikat, ikteblna.',
	'colophon.contactTitle': 'Kuntatt',
	'colophon.contactBody': 'Għal kull ħaġa, inkluż dak ta’ hawn fuq:',
	'colophon.contactPending':
		'Għadu ma ġiex stabbilit indirizz ta’ kuntatt. Dan is-sit m’għandux isir pubbliku sakemm ikollu wieħed — l-impenn ta’ hawn fuq ma jfisser xejn bla mod kif tilħaqna.',
	'colophon.illustrationsTitle': 'L-illustrazzjonijiet',
	'colophon.illustrationsBody':
		'Il-Bibbja ġġorr l-inċiżjonijiet ta’ Gustave Doré, kull waħda mqiegħda fil-vers li turi — l-aħħar u l-akbar miċ-ċikli Bibliċi tiegħu, maqtugħa fl-injam mid-disinji tiegħu u stampati mat-test aktar milli miġbura fl-aħħar.',
	'colophon.illustrationsRights':
		'Huma fid-dominju pubbliku, kif juru d-dati ta’ hawn taħt, u riproduzzjoni fotografika fidila ta’ inċiżjoni fid-dominju pubbliku ma ġġorr l-ebda dritt ġdid tagħha.',
	'colophon.countPlates': 'inċiżjonijiet',
	'colophon.countPlateChapters': 'kapitli illustrati',
	'plates.scansBy': 'Skens ipprovduti minn',
	'plates.enlarge': 'Kabbar {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Dwar din l-istampa',
	'art.detail': 'dettall',
	'colophon.typeTitle': 'It-tipografija',
	'colophon.typeBody':
		'Miktub f’EB Garamond, ir-revival ta’ Georg Duffner u Octavio Pardo tat-tipi li Claude Garamont qata’ fis-snin 1590 — it-tradizzjoni umanistika li biha l-Knisja tistampa mir-Rinaxximent ’l hawn. Iċ-Ċirilliku tiegħu huwa ta’ l-istess idejn imma ma jirrevivi xejn: qatt ma nqata’ Ċirilliku Garamond, mela r-Russu huwa miktub f’forma mfassla biex toqgħod ħdejn l-oħrajn.',
	'colophon.typeArabic':
		'L-Għarbi jmur lil hinn minn dan għalkollox, u huwa miktub f’Amiri — ir-revival ta’ Khaled Hosny tan-naskh maqtugħ għall-istamperija ta’ Bulaq fil-Kajr fl-1905, magħżul bl-istess raġunament tat-tipa tat-test: tipa storika partikolari ta’ ktieb aktar milli disinn kontemporanju.',
	'colophon.typeInitials':
		'L-inizjali tal-bidu huma Pirata One, blackletter li l-kapitali tiegħu jibqgħu jinqraw fid-daqs li titlob inizjali kbira, u — għar-Russu — Ponomar, li jirriproduċi t-tipa Slava tal-Knisja tal-Istamperija Sinodali. Ponomar jistampa l-inizjali u qatt it-test: enċiklika moderna miktuba kollha kemm hi f’tipa Sinodali tgħid xi ħaġa mhux vera dwar x’inhi. Kollha huma liċenzjati taħt is-SIL Open Font License u servuti minn dan is-sit aktar milli minn terzi, mela l-qari ta’ paġna ma jitlob xejn mis-server ta’ ħaddieħor.',
	'refs.citedIn': 'Iċċitat f’',
	'refs.externalVolume': 'Volum {volume} f’{host} — PDF skennjat',
	'bible.wholeChapter': 'Dan il-kapitlu',
	'bible.verseNotInEdition':
		'Dan in-numru ta’ vers mhuwiex f’din l-edizzjoni — ara n-nota fis-sors tal-paġna',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Nota',
	'bible.noteMissing': 'Din in-nota mhix fil-korpus',
	'bible.chapterArgument': 'Sommarju',
	'ccc.readFullChapter': 'Aqra l-kapitlu sħiħ',
	'ccc.noParagraphNumber': 'L-ebda numru ta’ paragrafu f’dan il-korpus',
	'copyright.sourceTitle': 'Iftaħ il-paġna oriġinali tas-sors',
	'copyright.sourceLabel': 'Sors',
	'lang.label': 'Lingwa',
	'lang.filter': 'Fittex lingwi',
	'lang.more': 'aktar lingwi',
	'notFound.title': 'Xejn f’dan l-indirizz',
	'notFound.lede': 'Il-paġna li tlabt mhix hawn.',
	'notFound.body':
		'Il-link jista’ jkun miktub ħażin jew skadut, jew jista’ jindika test li dan is-sit ma jġorrx.',
	'notFound.searchHint':
		'Jekk taf ir-referenza li trid — ktieb u kapitlu, paragrafu tal-Katekiżmu — ittajpjaha fil-kaxxa tat-tfittxija fin-naħa ta’ fuq ta’ din il-paġna.',
	'notFound.credit': 'Ibbażat fuq British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Jew ibda minn wieħed minn dawn:',
	'notFound.home': 'Il-Bidu',
	'compare.enter': 'Qabbel l-edizzjonijiet',
	'compare.exit': 'Oħroġ mit-tqabbil',
	'compare.missing': 'Mhux preżenti f’din l-edizzjoni',
	'compare.versificationNote':
		'Dawn iż-żewġ edizzjonijiet jaqsmu l-versi ta’ dan il-kapitlu b’mod differenti f’xi postijiet (varjant tat-test, mhux għażla ta’ traduzzjoni) — l-istess numru ta’ vers ma jimmarkax dejjem l-istess sentenza fiż-żewġ kolonni.',
	'compare.loading': 'Qed jitgħabba t-tieni lingwa…',
	'ui.close': 'Agħlaq',
	'shortcuts.title': 'Kumbinazzjonijiet tat-tastiera',
	'shortcuts.betweenDocuments': 'Bejn id-dokumenti',
	'shortcuts.withinDocument': 'Ġewwa d-dokument',
	'shortcuts.show': 'Uri din il-lista',
	'help.title': 'Għajnuna',
	'help.reading.heading': 'Il-bar fuq test',
	'help.feature.offline':
		'Żid is-sit mal-iskrin prinċipali u jinfetaħ bħal app. Tista’ tniżżel xogħlijiet sħaħ biex taqrahom bla konnessjoni.',
	'help.feature.contents':
		'Id-diviżjonijiet tax-xogħol li qiegħed fih — kotba, partijiet, kapitli — biex tiċċaqlaq ġo fih bla ma terġa’ lura għall-bidu.',
	'help.feature.compare':
		'Żewġ edizzjonijiet tal-istess silta, ġenb ma’ ġenb — il-Latin ħdejn il-lingwa tiegħek, jew traduzzjoni ħdejn oħra.',
	'help.feature.apparatus':
		'In-noti tal-qiegħ ta’ edizzjoni, u kull kummentarju miktub fuq it-test, jiġu offruti ħdejh aktar milli taħtu. Iċ-ċitazzjonijiet ġewwa t-test huma links, mela referenza tieħdok fejn tipponta.',
	'help.feature.focus':
		'Ineħħi kollox ħlief it-test. Il-ħruġ jibqa’ fejn kien il-bar, mela xejn ma jinqabad warajh.',
	'zen.enter': 'Modalità Fokus',
	'zen.exit': 'Oħroġ mill-Modalità Fokus',
	'nav.calendar': 'Kalendarju',
	'calendar.title': 'Kalendarju Liturġiku',
	'calendar.tagline':
		'Il-Kalendarju Ruman Ġenerali, ikkalkulat għal kull jum — l-istaġun tiegħu, il-grad tiegħu, il-kulur tiegħu.',
	'calendar.national.tagline': '{name}, biċ-ċelebrazzjonijiet tiegħu, ikkalkulat għal kull jum.',
	'calendar.calendar': 'Kalendarju',
	'calendar.which.general': 'Kalendarju Ruman Ġenerali',
	'calendar.filter': 'Fittex pajjiżi',
	'calendar.region.europe': 'Ewropa',
	'calendar.region.americas': 'L-Ameriki',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Il-Lvant Nofsani',
	'calendar.region.asia': 'Asja',
	'calendar.region.oceania': 'Oċeanja',
	'calendar.today': 'Illum',
	'calendar.previousMonth': 'Xahar ta’ qabel',
	'calendar.nextMonth': 'Xahar li jmiss',
	'calendar.plainDays': 'Jiem tal-ġimgħa sempliċi',
	'calendar.noSuchDay': 'Ma jiġi kkalkulat l-ebda jum liturġiku għal dik id-data.',
	'calendar.week': 'ġimgħa',
	'calendar.alsoToday': 'Jinżamm ukoll illum',
	'calendar.alsoObserved': 'Jitfakkar ukoll illum',
	'calendar.obligation': 'Festa ta’ preċett',
	'calendar.obligationCanon': 'KDK kan. 1246',
	'calendar.sundayCycle': 'Ċiklu tal-Ħdud',
	'calendar.weekdayCycle': 'Ċiklu tal-jiem tal-ġimgħa',
	'calendar.psalterWeek': 'Ġimgħa tas-Salterju',
	'lectionary.heading': 'Qari fil-Quddiesa',
	'lectionary.slot.reading': 'Qari',
	'lectionary.slot.reading1': 'L-Ewwel Qari',
	'lectionary.slot.reading2': 'It-Tieni Qari',
	'lectionary.slot.reading3': 'It-Tielet Qari',
	'lectionary.slot.reading4': 'Ir-Raba’ Qari',
	'lectionary.slot.reading5': 'Il-Ħames Qari',
	'lectionary.slot.reading6': 'Is-Sitt Qari',
	'lectionary.slot.reading7': 'Is-Seba’ Qari',
	'lectionary.slot.psalm': 'Salm Responsorjali',
	'lectionary.slot.epistle': 'Epistola',
	'lectionary.slot.acclamation': 'Akklamazzjoni tal-Evanġelju',
	'lectionary.slot.gospel': 'Evanġelju',
	'lectionary.slot.sequence': 'Sekwenza',
	'lectionary.or': 'jew',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'Dwar dan il-qari',
	'lectionary.caveat':
		'Is-siltiet stabbiliti mill-Ordo Lectionum Missae, marbuta mal-edizzjonijiet stess ta’ dan is-sit — mhux it-traduzzjoni pproklamata fi knisja partikolari, u konferenza tista’ tadatta l-iskeda.',
	'calendar.transferredFrom': 'Trasferit minn',
	'calendar.season.advent': 'Avvent',
	'calendar.season.christmas': 'Żmien il-Milied',
	'calendar.season.lent': 'Randan',
	'calendar.season.triduum': 'It-Tridu tal-Għid',
	'calendar.season.easter': 'Żmien il-Għid',
	'calendar.season.ordinary': 'Żmien ta’ Matul is-Sena',
	'calendar.colour.white': 'Abjad',
	'calendar.colour.red': 'Aħmar',
	'calendar.colour.green': 'Aħdar',
	'calendar.colour.violet': 'Vjola',
	'calendar.colour.rose': 'Roża',
	'calendar.colour.black': 'Iswed',
	'calendar.colour.blue': 'Ikħal',
	'calendar.rank.solemnity': 'Solennità',
	'calendar.rank.feast': 'Festa',
	'calendar.rank.memorial': 'Tifkira',
	'calendar.rank.optional-memorial': 'Tifkira fakultattiva',
	'calendar.rank.commemoration': 'Kommemorazzjoni',
	'calendar.rank.sunday': 'Ħadd',
	'calendar.rank.weekday': 'Jum tal-ġimgħa',
	'calendar.gloss.season.advent':
		'L-erba’ ġimgħat qabel il-Milied: tħejjija għall-miġja tal-Mulej, u l-bidu tas-sena tal-Knisja.',
	'calendar.gloss.season.christmas':
		'Mill-jum tal-Milied sal-Magħmudija tal-Mulej, fejn jinżammu t-twelid tal-Mulej u d-dehra tiegħu lid-dinja.',
	'calendar.gloss.season.lent':
		'L-erbgħin jum minn Ras ir-Randan sal-Quddiesa ta’ filgħaxija tal-Ikla tal-Mulej: penitenza, karità u tħejjija għall-Għid.',
	'calendar.gloss.season.triduum':
		'It-tliet ijiem minn filgħaxija tal-Ħamis ix-Xirka sa filgħaxija tal-Ħadd tal-Għid — il-passjoni, il-mewt u l-qawmien tal-Mulej, u l-quċċata tas-sena kollha.',
	'calendar.gloss.season.easter':
		'Il-ħamsin jum mill-Għid sa Pentekoste, miżmuma bħala festa waħda kontinwa — “Ħadd wieħed kbir”.',
	'calendar.gloss.season.ordinary':
		'It-tlieta u tletin jew erbgħa u tletin ġimgħa barra l-istaġuni l-oħra. Mhux “sempliċi” imma ordnat: il-ġimgħat huma numerati, u l-Knisja taqra l-ħajja u t-tagħlim tal-Mulej wieħed wara l-ieħor. Jiġi f’żewġ meded — wara Żmien il-Milied sar-Randan, u wara Pentekoste sal-Avvent.',
	'calendar.gloss.rank.solemnity':
		'L-ogħla grad: l-Għid, il-Milied, it-Tlugħ fis-Sema, il-patrun ta’ post. Tinżamm bil-Glorja u bil-Kredu, u tibda fil-lejla ta’ qabel.',
	'calendar.gloss.rank.feast':
		'Tinżamm fil-jum innifsu. L-appostli u l-evanġelisti, u l-jiem akbar tal-Mulej u tal-Madonna.',
	'calendar.gloss.rank.memorial':
		'Qaddis imfakkar f’jumu, ġewwa l-Quddiesa u l-Uffiċċju tal-istaġun. Obbligatorja fejn tinżamm.',
	'calendar.gloss.rank.optional-memorial':
		'Tista’ tinżamm jew le, kif jagħżel is-saċerdot jew il-komunità. Jekk ma tinżammx, il-jum huwa sempliċement il-jum tal-ġimgħa.',
	'calendar.gloss.rank.commemoration':
		'Dak li ssir tifkira fir-Randan: talba miżjuda mal-Quddiesa ferjali, li l-istaġun mill-bqija jżomm sħiħa.',
	'calendar.gloss.rank.sunday':
		'Il-festa ta’ l-ewwel — Jum il-Mulej, miżmum kull ġimgħa mill-qawmien ’l hawn. Solennità biss jew festa tal-Mulej tista’ tiġi minflokha, u fl-Avvent, fir-Randan u fi Żmien il-Għid lanqas dawk.',
	'calendar.gloss.rank.weekday':
		'Jum bla ċelebrazzjoni tiegħu. Il-Quddiesa u l-Uffiċċju huma tal-istaġun, u dan hu li jagħmel l-istaġun ħaġa li tiswa tkun taf.',
	'calendar.gloss.colour.white':
		'Ferħ. Żmien il-Għid u Żmien il-Milied, il-jiem tal-Mulej barra l-passjoni tiegħu, il-Madonna, l-anġli, u l-qaddisin li ma kinux martri.',
	'calendar.gloss.colour.red':
		'Demm u nar. Ħadd il-Palm u l-Ġimgħa l-Kbira, Pentekoste, l-appostli u l-evanġelisti, u l-martri.',
	'calendar.gloss.colour.green': 'Żmien ta’ Matul is-Sena: il-kulur tat-tama, u ta’ dak li jikber.',
	'calendar.gloss.colour.violet': 'Avvent u Randan, u jintlibes ukoll fil-Quddies għall-mejtin.',
	'calendar.gloss.colour.rose':
		'Jintlibes darbtejn fis-sena — il-Ħadd Gaudete, it-tielet tal-Avvent, u l-Ħadd Laetare, ir-raba’ tar-Randan — fejn is-sawm jitħaffef u t-tmiem jidher.',
	'calendar.gloss.colour.black': 'Jista’ jintlibes fil-Quddies għall-mejtin.',
	'calendar.gloss.colour.blue':
		'Il-privileġġ tal-ikħal: jintlibes għall-Immakulata Kunċizzjoni fi Spanja, fil-Filippini u fil-ftit postijiet oħra li s-Santa Sede tathulhom.',
	'calendar.gloss.sundayCycle':
		'Il-qari tal-Ħdud jgħaddi fuq tliet snin — A, B u Ċ — jaqra lil Mattew, lil Mark u lil Luqa wieħed wara l-ieħor, b’Ġwanni tul ir-Randan u Żmien il-Għid. Iċ-ċiklu jinbidel fl-ewwel Ħadd tal-Avvent, mas-sena tal-Knisja.',
	'calendar.gloss.weekdayCycle':
		'Il-qari tal-jiem tal-ġimgħa jgħaddi fuq sentejn, I u II: l-ewwel qari jinbidel, l-Evanġelju le. Sena liturġika tissemma bis-sena ċivili li fiha tispiċċa — is-snin fardi huma I, dawk pari II.',
	'calendar.gloss.psalterWeek':
		'Il-Liturġija tas-Sigħat tqassam is-salmi fuq erba’ ġimgħat, minn I sa IV, li jerġgħu lura tul is-sena. Din hi l-ġimgħa li s-salmi tagħha huma tal-lum, għal min jitlob is-Sigħat.',
	'calendar.gloss.obligation':
		'Jum li fih l-insara huma marbuta li jieħdu sehem fil-Quddiesa u li jżommu lura minn xogħol li jżommhom milli jagħmlu dan. Kull Ħadd, u l-jiem l-oħra li kull konferenza ta’ isqfijiet iddeterminat.',
	'calendar.primer.title': 'L-ewwel darba?',
	'calendar.primer.lead':
		'Il-Knisja żżomm sena tagħha. Tibda bl-Avvent, iddur madwar l-Għid, u tagħti lil kull jum isem, grad u kulur — u dawk jiddeċiedu x’jintalab u x’jinqara dakinhar fil-Quddiesa u fil-Liturġija tas-Sigħat. Mela “it-tlieta u għoxrin Ħadd ta’ Matul is-Sena” hija indirizz: tgħid lil saċerdot, lil kor, jew lil min jitlob id-dar, liema talb u liema qari huma tal-lum.',
	'calendar.primer.seasons': 'L-istaġuni',
	'calendar.primer.ranks': 'X’jista’ jkun jum',
	'calendar.primer.colours': 'Il-kuluri',
	'calendar.primer.cycles': 'Iċ-ċikli',
	'calendar.primer.cyclesLead':
		'Tliet għaddieda li, flimkien, jgħidu liema qari u liema salmi huma msemmija għal-lum.'
};
