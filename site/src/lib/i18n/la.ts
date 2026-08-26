/**
 * Latin UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 *
 * THE REGISTER IS THE CHURCH'S OWN, not classical reconstruction: the words
 * this site's readers already meet in the texts it carries. Where the corpus
 * itself supplies a term it wins over a better classical one — `Obiectio` /
 * `Sed contra` / `Respondeo dicendum` are the Summa's own division names,
 * `Catechismus Catholicae Ecclesiae` is the editio typica's own title, and
 * the route names (`/scriptura`, `/preces`, `/signata`) already chose a word
 * for three of the nav labels. Where the Church genuinely has no word — the
 * browser, the clipboard, monochrome — the choice is a plain descriptive
 * phrase rather than a Latinized loan, because a reader who asks for Latin
 * chrome wants Latin, not `installare`.
 */

import type { Dictionary } from '../i18n.svelte';

export const la: Dictionary = {
	'nav.bible': 'Scriptura',
	'nav.ccc': 'Catechismus',
	'nav.compendium': 'Compendium',
	'nav.magisterium': 'Magisterium',
	'nav.prayers': 'Preces',
	'nav.bookmarks': 'Signata',
	'nav.menu': 'Index',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Perge legere',
	'home.works': 'Bibliotheca',
	'home.ccc.heading': 'Catechismus et Compendium',
	'home.ccc.noCounterpart': 'Nihil respondens in altero opere',
	'home.magisterium.mostRecent': 'Recentissima',
	// `ioannes` and `ccc` are what the parser actually accepts, not a
	// translation of the English example: the Clementine's own abbreviations
	// carry `ioannes` (bible-index.json), while `refparse.ts` reads only
	// `ccc`/`catecismo` for a Catechism paragraph — so an example written
	// `cce 1234` would be a promise the search box does not keep.
	'jumpbox.placeholder': 'Adi… (ex. gr. ioannes 3,16, ccc 1234)',
	'jumpbox.short': 'Quaere',
	'jumpbox.hint': 'Preme / vel Ctrl+K ut ad locum adeas',
	'jumpbox.noMatch': 'Nihil inventum',
	'appearance.label': 'Species',
	'darkMode.label': 'Modus obscurus',
	// Latin has no yes/no pair, so the three cells say WHEN rather than
	// whether: of its own accord / always / never. That reads as one
	// sentence under the row title and keeps all three inside the width the
	// English `Auto`/`On`/`Off` set.
	'darkMode.auto': 'Sponte',
	'darkMode.on': 'Semper',
	'darkMode.off': 'Numquam',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Tantum in luce',
	'sepia.noHue': 'Non cum uno',
	'oled.label': 'Nigrum OLED',
	'oled.darkOnly': 'Tantum in tenebris',
	// `unicolor` is Vergil's and Pliny's word for "of one colour" and needs
	// no gloss for a reader of this page; `monochromatus` would be a Greek
	// loan doing the same work with more letters.
	'mono.label': 'Unicolor',
	'mono.hint':
		'Totam paginam uno colore cano pingit, ne quid colore solo distinguatur. Sepia interim cessat.',
	'fontSize.label': 'Magnitudo textus',
	'fontSize.larger': 'Litterae maiores',
	'fontSize.smaller': 'Litterae minores',
	'print.label': 'Hanc paginam imprime',
	// iOS ships no Latin, so the quoted button CANNOT match what the reader
	// sees on their own screen, the way this string does in the other eight
	// languages. The sentence around it names the action instead, and the
	// quotation is translated rather than left in English: a reader who
	// chose Latin chrome knows their telephone did not.
	'install.label': 'Glossam institue',
	'install.hint.label': 'Adde ad paginam primam',
	'install.hint.title': 'Adde Glossam ad paginam primam',
	'install.hint.stepBefore': 'Ut applicatio aperitur et sine rete legitur. Tange',
	'install.hint.stepAfter': 'deinde “Adde ad paginam primam”.',
	'install.hint.dismiss': 'Dimitte',
	'edition.label': 'Editio',
	'edition.select': 'Editionem elige',
	'edition.current': 'Editio praesens',
	'bible.prevChapter': 'Caput prius',
	'bible.nextChapter': 'Caput sequens',
	'bible.pickBook': 'Libri et capita',
	'bible.landing.title': 'Sacra Scriptura',
	'bible.landing.tagline': 'Lege totam Scripturam, librum post librum, caput post caput.',
	'bible.landing.continue': 'Perge ubi desiisti',
	'bible.landing.start': 'Incipe legere',
	'bible.landing.books': 'Libri',
	'bible.chapterUnavailable': 'In hac editione non exstat',
	'bible.introduction': 'Prooemium',
	'bible.introUnavailable': 'Nondum est prooemium hac lingua',
	'bible.introSource': 'Prooemia ad textum sacrum non pertinent.',
	'bible.testament.ot': 'Vetus Testamentum',
	'bible.testament.nt': 'Novum Testamentum',
	'ccc.prevParagraph': 'Prius',
	'ccc.nextParagraph': 'Sequens',
	// The Latin editio typica heads these sections `Compendium`, which is
	// the name of another work in this corpus and of the tab beside this
	// one. `Breviter` says the same thing and cannot be misread.
	'ccc.inBrief': 'Breviter',
	'ccc.landing.title': 'Catechismus Catholicae Ecclesiae',
	'ccc.landing.tagline': 'Catechismus integer.',
	'ccc.tableOfContents': 'Index capitum',
	'ccc.related': 'Vide etiam',
	'compendium.landing.title': 'Compendium Catechismi',
	'compendium.landing.tagline':
		'Interrogationes et responsiones quae Catechismum Catholicae Ecclesiae breviter complectuntur.',
	'compendium.question': 'Interrogatio',
	'compendium.answer': 'Responsio',
	'compendium.tableOfContents': 'Index interrogationum',
	'compendium.prevQuestion': 'Interrogatio prior',
	'compendium.nextQuestion': 'Interrogatio sequens',
	'compendium.condenses': 'Complectitur CCE ¶¶',
	'compendium.noQuestionNumber': 'Numerus interrogationis in hoc corpore deest',
	'nav.summa': 'Summa',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Sancti Thomae Aquinatis, Latine ut scripsit et Anglice.',
	'summa.tableOfContents': 'Index quaestionum',
	'summa.part': 'Pars',
	'summa.question': 'Quaestio',
	'summa.article': 'Articulus',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titulus ex editione {lang}',
	'summa.prologue': 'Prologus',
	// The Summa's own headings, which the English module also keeps in
	// Latin and for the same reason: a footnote reads `ad 3` and `co.`, and
	// a translated heading leaves the reader guessing which paragraph is
	// meant.
	'summa.objection': 'Obiectio',
	'summa.sedContra': 'Sed contra',
	'summa.corpus': 'Respondeo dicendum',
	'summa.reply': 'Ad obiectionem',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Quaestio prior',
	'summa.nextQuestion': 'Quaestio sequens',
	'summa.noEditionInYourLanguage': 'Summa editionem lingua tua non habet. Exhibetur {lang}.',
	'summa.noLatinSupplement':
		'Supplementum Anglice tantum exstat: post mortem sancti Thomae compositum est.',
	'index.showSubsections': 'Ostende partes minores',
	'index.hideSubsections': 'Absconde partes minores',
	'prayers.landing.title': 'Preces communes',
	'prayers.landing.tagline': 'Preces, adiuncto textu Latino.',
	'prayers.tableOfContents': 'Index precum',
	'prayers.prevPrayer': 'Prex prior',
	'prayers.nextPrayer': 'Prex sequens',
	// The Rosary reader's own chrome — routes/prayers/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Hodie',
	'prayers.rosary.todayHeading': 'Mysteria hodierna',
	'prayers.rosary.openingPrayer': 'Oratio initialis',
	'prayers.rosary.decadePrayers': 'Orationes decadis',
	'home.prayers.heading': 'Preces',
	'home.prayers.browseAll': 'Omnes preces percurre',
	'ref.tooltip.loading': 'Legitur…',
	'ref.tooltip.openCcc': 'Aperi in Catechismo',
	'ref.tooltip.openBible': 'Aperi in Scriptura',
	'ref.tooltip.openCompendium': 'Aperi in Compendio',
	'ref.preview.open': 'Aperi',
	'ref.cf': 'cf.',
	'anchor.actions': 'Quid de hoc loco fiat',
	'anchor.copy': 'Textum exscribe',
	'anchor.copyLink': 'Nexum exscribe',
	'anchor.view': 'Aspice',
	'anchor.copied': 'Exscriptum',
	'anchor.copyFailed': 'Exscribi non potuit',
	'bookmark.add': 'Signa',
	'bookmark.remove': 'Signum tolle',
	'bookmark.library': 'Signata',
	'bookmark.library.tagline': 'Quaecumque legens signasti.',
	'bookmark.empty': 'Nihil adhuc signatum.',
	'bookmark.emptyHint':
		'Numerum versus aut paragraphi tange et “Signa” elige, vel signaculo in pagina utere.',
	'bookmark.deviceOnly':
		'Signata in hoc solo navigatro servantur. Nusquam mittuntur, et memoria navigatri deleta pereunt.',
	'bookmark.unavailable': 'Non est in editione quam legis',
	'document.library.tagline':
		'Litterae encyclicae, constitutiones, decreta et declarationes Magisterii.',
	'document.tableOfContents': 'Index partium',
	'document.startReading': 'Incipe legere',
	'document.readFullDocument': 'Lege documentum integrum',
	'document.section': 'Pars',
	'document.prevSection': 'Prior',
	'document.nextSection': 'Sequens',
	'document.kind.conciliarConstitution': 'Constitutio',
	'document.kind.conciliarDecree': 'Decretum',
	'document.kind.conciliarDeclaration': 'Declaratio',
	// `Litterae encyclicae` is a plurale tantum — one encyclical is still
	// `litterae`. So the singular entry here and the plural entry below are
	// the same words, which is the language being right rather than a
	// copy-paste to fix.
	'document.kind.encyclical': 'Litterae encyclicae',
	'document.kind.apostolicExhortation': 'Adhortatio apostolica',
	'document.kind.apostolicConstitution': 'Constitutio apostolica',
	'document.kind.cdfDeclaration': 'Declaratio CDF',
	'document.kindPlural.conciliarConstitution': 'Constitutiones',
	'document.kindPlural.conciliarDecree': 'Decreta',
	'document.kindPlural.conciliarDeclaration': 'Declarationes',
	'document.kindPlural.encyclical': 'Litterae encyclicae',
	'document.kindPlural.apostolicExhortation': 'Adhortationes apostolicae',
	'document.kindPlural.apostolicConstitution': 'Constitutiones apostolicae',
	'document.kindPlural.cdfDeclaration': 'Declarationes CDF',
	'citation.unavailable': 'Textus fontis huius notae non praesto est.',
	'colophon.title': 'Colophon',
	'colophon.lede': 'Quid haec sedes sit, unde textus eius veniant, quo animo eos reddamus.',
	'colophon.whatThisIs': 'Quid hoc sit',
	'colophon.whatThisIsBody':
		'Glossa Catholica sedes est ad Scripturas, Catechismum, Compendium et documenta Magisterii legenda, Anglice, Lusitane et Latine. Ad hoc solum facta est ut legatur, nec quicquam aliud a te legente petitur:',
	'colophon.pointFree': 'Gratis, et semper gratis. Nullum pretium, nulla pensio, nihil emendum.',
	'colophon.pointNoAds': 'Nulla praeconia, nulla merces ullo modo commendata.',
	'colophon.pointNoAccounts':
		'Nulla nomina danda. Nihil est quo te adscribas, nihil quo te introducas.',
	'colophon.pointNoTracking':
		'Nulla vestigia, nulla scripta quae te sequantur, nullus alienus codex. Machina quae has paginas mittit commentarios petitionum servat, ut machinae omnes; praeter hos nihil observat quid legas.',
	'colophon.pointOffline':
		'Ita facta ut sine rete legi possit postquam semel adisti, ne infirma coniunctio lectioni obstet.',
	'colophon.textsTitle': 'De textibus',
	'colophon.textsBody':
		'Omnis textus e fonte nominato venit, et omne opus editionem suam, paginam fontis et diem quo haustus est memorat. Scriptura translationibus utitur quae iuris publici sunt; Catechismus, Compendium et documenta Magisterii ex ipsis Sanctae Sedis editis textibus veniunt. Eos integros reddimus — et ubi exemplar nostrum mancum esse apparuit, opus omittimus potius quam textum tibi cum lacunis quas videre non possis exhibeamus.',
	'colophon.countBible': 'editiones Scripturae',
	'colophon.countDocuments': 'documenta Magisterii',
	'colophon.copyrightTitle': 'Iura auctorum',
	'colophon.copyrightBody1':
		'Catechismus, Compendium et documenta Magisterii eorum sunt qui iura in eis tenent — praecipue Librariae Editricis Vaticanae et Dicasterii pro Communicatione. Hic eos reddimus venia non prius petita. Id aperte dicimus ne quis id ipse deprehendat: consilio factum est, non incuria.',
	'colophon.copyrightBody2':
		'Hoc consilium capimus quia hi textus doctrina Ecclesiae sunt, ad omnes missa, et quia id quod ii qui iura tenent curare se dixerunt integritas textus est. Textus igitur numquam breviatur, numquam aliis verbis redditur, numquam rescribitur, numquam iuxta praeconia ponitur. Menda tamen aperta in paginis editis emendamus — verbum omissum, locus male allatus, nota quae paragraphum absorpsit — semper ad id quod fons ipse imprimit, numquam ad id quod nos imprimendum esse putemus. Sententiam non mutamus, verba nostra non substituimus, nihil adnotamus neque iudicamus. Omnis emendatio seorsum notatur, cum verbis pristinis, verbis novis et causa; nihil umquam tacite mutatur. Omne opus notam eius qui ius tenet, ipsius verbis, exhibet, et ad paginam unde sumptum est ducit.',
	'colophon.copyrightBody3':
		'Si quis ius in textu aliquo hic posito tenet et eum publicari non vult, ad nos scribat et statim tollemus. Sine controversia, nec opus est ut quemquam alium prius adhibeat.',
	'colophon.contactTitle': 'Quomodo nos adeas',
	'colophon.contactBody': 'De quacumque re, etiam de superioribus:',
	'colophon.contactPending':
		'Inscriptio nondum constituta est. Haec sedes in publicum edi non debet priusquam eam habeat — quod supra promittitur sine via nos adeundi nihil valet.',
	'colophon.buildTitle': 'Quomodo facta sit',
	'colophon.buildBody':
		'Textus e fontibus editis colliguntur, in corpus digestum rediguntur, et paginis stabilibus exhibentur. Emendationes mendorum in fonte singulae notantur, cum verbis pristinis, verbis emendatis et causa — nullus textus umquam tacite mutatur.',
	'colophon.typeTitle': 'De litterarum forma',
	'colophon.typeBody':
		'Litteris EB Garamond composita, quas Georgius Duffner et Octavius Pardo ex typis a Claudio Garamont circa annum 1590 caesis renovaverunt — ea traditione humanistica qua Ecclesia ab aetate litterarum renascentium imprimit. Litterae initiales sunt Pirata One, forma Gothica cuius capitales etiam ea magnitudine quam littera initialis poscit legi possunt. Utraeque sub licentia SIL Open Font License dantur et ex hac ipsa sede mittuntur, non ex aliena, ne pagina legenda quicquam ab alterius machina petat.',
	'refs.citedIn': 'Ubi affertur',
	// The Latin editio typica is `Catechismus Catholicae Ecclesiae`, so the
	// siglum is CCE — as in French. `refparse.ts` still reads only `ccc`;
	// this key names the work in prose, it does not decide what the search
	// box accepts.
	'bible.cccAbbrev': 'CCE',
	'bible.wholeChapter': 'Hoc caput',
	'bible.verseNotInEdition':
		'Hic numerus versus in hac editione non est — vide notam in fonte paginae',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Nota',
	'bible.noteMissing': 'Haec nota in corpore deest',
	'bible.chapterArgument': 'Argumentum',
	'ccc.readFullChapter': 'Lege caput integrum',
	'ccc.noParagraphNumber': 'Numerus paragraphi in hoc corpore deest',
	'copyright.sourceTitle': 'Aperi paginam fontis',
	'copyright.sourceLabel': 'Fons',
	'lang.label': 'Lingua',
	'notFound.title': 'Nihil hac in inscriptione',
	'notFound.lede': 'Pagina quam petisti hic non est.',
	'notFound.body':
		'Nexus fortasse perperam scriptus est aut obsoletus, aut ad textum ducit quem haec sedes non habet. Nihil hic post ianuam aut pretium latet: si pagina est, adiri potest.',
	'notFound.searchHint':
		'Si locum quem quaeris nosti — librum et caput, paragraphum Catechismi — in arcam quaerendi supra eum scribe.',
	'notFound.elsewhere': 'Vel hinc incipe:',
	'notFound.home': 'Prima pagina',
	'compare.enter': 'Editiones confer',
	'compare.exit': 'Collationem relinque',
	'compare.missing': 'In hac editione non est',
	'compare.versificationNote':
		'Hae duae editiones versus huius capitis alicubi aliter dividunt (varietas textus, non consilium interpretis) — idem numerus versus non semper eandem sententiam in utraque columna signat.',
	'compare.loading': 'Altera lingua legitur…'
};
