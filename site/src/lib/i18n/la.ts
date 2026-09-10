/**
 * Latin UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * The language names in `lang-names.ts` are written in
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
	'nav.socialDoctrine': 'Doctrina socialis',
	'socialDoctrine.landing.title': 'Compendium doctrinae socialis Ecclesiae',
	'socialDoctrine.landing.tagline': 'Quae Ecclesia de vita sociali docet, 583 numeris digesta.',
	'nav.canonLaw': 'Ius canonicum',
	'canonLaw.landing.title': 'Codex Iuris Canonici',
	'canonLaw.landing.tagline':
		'Ius Ecclesiae latinae, canonibus MDCCLII per libros septem distributis.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Canon praecedens',
	'canonLaw.nextCanon': 'Canon sequens',
	'canonLaw.readFullTitle': 'Totum titulum legere',
	'canonLaw.superseded': 'Textus mutatus per',
	'nav.prayers': 'Preces',
	'nav.bookmarks': 'Signata',
	'nav.menu': 'Index',
	'nav.sections': 'Partes',
	'nav.works': 'Opera',
	'nav.pages': 'Loca',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Perge legere',
	'home.tagline':
		'Sedes ad Scripturas, Catechismum et documenta Magisterii legenda — gratis, etiam sine rete, nullo nomine dando.',
	'home.doors.heading': 'Quo eas',
	'home.find.heading': 'Vel locum inscribe',
	'nav.library': 'Bibliotheca',
	'nav.learn': 'Disce',
	'library.landing.tagline':
		'Corpus totum, pluteus post pluteum — cum loco ubi desiisti et iis quae notasti.',
	'schola.landing.title': 'Unde incipiendum',
	'schola.landing.tagline':
		'Brevis index eorum quae hic habentur: quid sit quisque horum librorum, quomodo eius locus citetur, quomodo locus inveniatur, et ordines legendi quos Ecclesia proposuit.',
	'schola.start.heading': 'Estne tibi nova fides catholica?',
	'schola.start.body': 'Optimum initium est ',
	'schola.start.bodyAfter':
		': eadem doctrina quae Catechismi, multo brevior, interrogationibus et responsionibus conscripta. Decima fere parte minor est nec quicquam praesupponit.',
	'schola.bible.heading': 'Numquam Scripturam legisti?',
	'schola.bible.library':
		'Non unus liber est sed septuaginta tres, per mille amplius annos conscripti et eo ordine collecti quem Ecclesia statuit — non quo res gestae sunt, neque quo facillime leguntur. Plerique a prima pagina incipiunt et post paucas hebdomadas desinunt, in longo capite legis antiquae, quia nemo adhuc eis dixit quorsum haec pertineant.',
	'schola.bible.step.gospel': 'Ab Evangelio incipe',
	'schola.bible.start':
		'Unus e quattuor brevibus libris de vita Iesu, intus potius quam in fronte. Non nostrum hoc consilium est: Concilium Ecclesiae petiit ut recte uti Scriptura doceantur, «praesertim Novo Testamento et ante omnia Evangeliis». Nullum unum nominavit, nec nos nominabimus.',
	'schola.bible.whichGospel':
		'Tria vulgo suadentur, tribus de causis diversis. Quodlibet eorum bonus locus est ubi sis.',
	'schola.bible.gospel.mark':
		'Brevissimum. Totum uno post meridiem legere potes, et unum perfecisse initio plus valet quam optimum elegisse.',
	'schola.bible.gospel.luke':
		'Scriptum est cuidam extra fidem qui rem ordine digestam habere volebat — quod fortasse tu ipse es. Recta in Actus Apostolorum procedit, ideoque revera prior pars est libri longioris.',
	'schola.bible.gospel.john':
		'Illud quod aperte dicit cur scriptum sit: «ut credatis». Verbis simplicibus, et recta ad quaestionem quis sit Iesus accedit.',
	'schola.bible.step.acts': 'Deinde quid postea acciderit',
	'schola.bible.thenActs':
		'Cum unum perfeceris, lege quid fecerint, illo abeunte, qui eum noverant.',
	'schola.bible.acts.why':
		'Triginta anni post Evangeliorum finem: pauci decem homines timentes, et quomodo id quod viderant ad ultimam imperii partem pervenerit.',
	'schola.bible.step.old': 'Deinde pars antiquior',
	'schola.bible.thenOld':
		'Non a prima pagina, neque tota. Pauca loca narrationem ferunt, eaque sunt ad quae Evangelia identidem respiciunt.',
	'schola.bible.ot.beginnings': 'Quomodo incipiat, et quomodo depravetur.',
	'schola.bible.ot.promise': 'Una familia, et promissum ei factum quod omnes eius superstat.',
	'schola.bible.ot.exodus': 'Populus e servitute eductus, et lex ei ad vivendum data.',
	'schola.bible.ot.psalms':
		'Non narratio: centum quinquaginta preces et cantica. Unum tantum lege, quolibet ordine. Ecclesia haec cotidie adhuc orat.',
	'schola.bible.bothWays':
		'Agnosces quaedam, idque propositum est, non casus. Ecclesia libros antiquiores in lumine Christi legit et recentiores in lumine eorum quae praecesserunt — utraque pars alteram explicat, ideoque neutra sola legitur.',
	'schola.books.heading': 'Quae hic sint, et quomodo designentur',
	'schola.books.lede':
		'Horum quisque diversum librorum genus est, et quisque proprio numero designatur. Exempla formam ostendunt: tale quid in capsam quaerendi inscribe et ad locum pervenies.',
	'schola.cite.label': 'Designatur',
	'schola.what.scripture':
		'Scripturae ut eas Ecclesia accipit, in utroque Testamento. Cetera omnia hic in earum lumine leguntur.',
	'schola.cite.scripture': 'libro, capite et versu, iis compendiis quae tua editio imprimit',
	'schola.what.catechism':
		'Summa eorum quae Ecclesia Catholica credit, uno volumine. Non ipse fons est: Scripturam, Patres, liturgiam et Ecclesiae doctrinam colligit, et quisque numerus unde id quod dicit veniat indicat.',
	'schola.cite.catechism': 'numero, a prima usque ad ultimam paginam continuo',
	'schola.what.compendium':
		'Eadem doctrina interrogationibus et responsionibus exposita, decima fere parte brevior.',
	'schola.cite.compendium': 'numero interrogationis',
	'schola.what.magisterium':
		'Quae Pontifices et Concilia revera scripserunt — litterae encyclicae, constitutiones, decreta, declarationes — quodque ad certum tempus certamque quaestionem directum. Quodque a primis verbis Latinis nominatur.',
	'schola.cite.magisterium': 'nomine documenti, deinde numero sectionis intra illud',
	'schola.what.social':
		'Doctrina Ecclesiae de labore, dominio, familia, re publica et pace, ex illis documentis in unum librum collecta.',
	'schola.cite.social': 'numero, sub siglo quo opus se ipsum designat',
	'schola.what.law': 'Ius potius quam doctrina. Quid Ecclesia exigat dicit, et emendatur.',
	'schola.cite.law': 'canone, quo nomine eius partes numeratae appellantur',
	'schola.what.doctors':
		'Theologi quos Ecclesia Doctores nominavit. Nullam auctoritatem publicam fert, quantuscumque sit auctor.',
	'schola.cite.doctors': 'parte, deinde quaestione — divisionibus ipsius Summae',
	'schola.what.prayers': 'Verba quibus Ecclesia orat, Latino iuxta posito.',
	'schola.cite.prayers': 'nomine; nulli sunt numeri citandi',
	'schola.places.heading': 'Non textus, sed loca huius sedis',
	'schola.what.library':
		'Omnia sedis opera uno indice, secundum res potius quam secundum genus digesta.',
	'schola.what.calendar':
		'Dies liturgicus — tempus, color, et quis colatur — pro ea regione cuius calendarium sequeris.',
	'schola.what.bookmarks':
		'Loci quos signasti, et ubi in quoque opere ultimo desiisti. Utraque in hoc navigatro manent nec usquam mittuntur.',
	'ccc.noCounterpart': 'Nihil respondens in altero opere',
	// `ioannes` and `ccc` are what the parser actually accepts, not a
	// translation of the English example: the Clementine's own abbreviations
	// carry `ioannes` (bible-index.json), while `refparse.ts` reads only
	// `ccc`/`catecismo` for a Catechism paragraph — so an example written
	// `cce 1234` would be a promise the search box does not keep.
	'jumpbox.placeholder': 'Adi… (ex. gr. ioannes 3,16, ccc 1234)',
	'jumpbox.short': 'Quaere',
	'jumpbox.hint': 'Preme / vel Ctrl+K ut ad locum adeas',
	'jumpbox.noMatch': 'Nihil inventum',
	'jumpbox.suggestions': 'Proposita',
	'settings.label': 'Optiones',
	'apparatus.label': 'Apparatus',
	'apparatus.editionNotes': 'Notae huius editionis',
	'apparatus.commentary': 'Commentarius',
	'apparatus.inCommentary': 'Iam in commentario supra continetur.',
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
	'advanced.label': 'Provecta',
	'library.title': 'Bibliotheca sine rete',
	'library.lede': 'Textus in hoc instrumento servati sine ulla rete aperiuntur.',
	'library.essentials': 'Preces et Compendium',
	'library.illustrations': 'Biblia (imagines)',
	'library.illustrationsDetail': 'Biblia (imagines accuratiores)',
	'library.other': 'Alii textus',
	'library.everything': 'Omnia',
	'library.downloadAll': 'Omnia transferre',
	'library.download': 'Transferre',
	'library.downloaded': 'In hoc instrumento',
	'library.offlineNote': 'Modum sine rete claude ut quid transferas.',
	'library.remove': 'De hoc instrumento tollere',
	'library.removeConfirm': 'Tollere?',
	'library.forget': 'Translata tollere',
	'library.forgetConfirm': 'Omnia tollere?',
	'offline.label': 'Modus sine rete',
	'offline.hint':
		'Rete omnino non utitur: nihil transfertur, nulla renovatio quaeritur, nihil metitur. Soli textus in hoc instrumento iam praesentes aperiuntur.',
	'offline.notDownloaded': 'In hoc instrumento non praesens',
	'loadFailed.title': 'Hoc allatum non est',
	'loadFailed.hint':
		'Pagina exstat — in arcessendo aliquid erravit. Iterum conanti plerumque succedit.',
	'loadFailed.retry': 'Iterum conare',
	'loadFailed.retrying': 'Conatur…',
	'offline.turnOff': 'Modum sine rete claudere',

	'type.label': 'Magnitudo et forma litterarum',
	'fontSize.label': 'Magnitudo textus',
	'fontSize.small': 'Parvae',
	'fontSize.medium': 'Mediae',
	'fontSize.large': 'Magnae',
	'fontSize.xlarge': 'Maiores',
	'fontSize.xxlarge': 'Maximae',
	'face.label': 'Forma litterarum',
	'face.serif': 'Cum serifis',
	'face.sans': 'Sine serifis',
	'print.label': 'Hanc paginam imprime',
	'toTop.label': 'Ad summum paginae redi',
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
	'update.label': 'Nova editio praesto est',
	'update.title': 'Nova editio parata est',
	'update.body': 'Renova ut recentissimos textus et emendationes accipias.',
	'update.action': 'Renova',
	'update.dismiss': 'Nondum',
	'edition.label': 'Editio',
	'edition.select': 'Editionem elige',
	'edition.current': 'Editio praesens',
	'edition.filter': 'Editiones quaerere',
	'menu.noMatches': 'Nihil inventum',
	'unitNav.previous': 'Prius',
	'unitNav.next': 'Sequens',
	'bible.prevChapter': 'Caput prius',
	'bible.nextChapter': 'Caput sequens',
	'bible.pickBook': 'Libri et capita',
	'bible.landing.title': 'Sacra Scriptura',
	'bible.landing.tagline': 'Lege totam Scripturam, librum post librum, caput post caput.',
	'bible.landing.random': 'Fortunam tento',
	'bible.landing.books': 'Libri',
	'bible.chapterUnavailable': 'In hac editione non exstat',
	'bible.introduction': 'Prooemium',
	'bible.introUnavailable': 'Nondum est prooemium hac lingua',
	'bible.introSource': 'Prooemia ad textum sacrum non pertinent.',
	'bible.testament.ot': 'Vetus Testamentum',
	'bible.testament.nt': 'Novum Testamentum',
	'bible.group.pentateuch': 'Pentateuchus',
	'bible.group.historical': 'Libri historici',
	'bible.group.wisdom': 'Libri sapientiales',
	'bible.group.prophetic': 'Libri prophetici',
	'bible.group.gospels': 'Evangelia',
	'bible.group.acts': 'Actus Apostolorum',
	'bible.group.pauline': 'Epistulae Paulinae',
	'bible.group.catholicLetters': 'Epistulae catholicae',
	'bible.group.revelation': 'Apocalypsis',
	'ccc.prevParagraph': 'Paragraphus prior',
	'ccc.nextParagraph': 'Paragraphus sequens',
	// The Latin editio typica heads these sections `Compendium`, which is
	// the name of another work in this corpus and of the tab beside this
	// one. `Breviter` says the same thing and cannot be misread.
	'ccc.inBrief': 'Breviter',
	'ccc.landing.title': 'Catechismus Catholicae Ecclesiae',
	'ccc.landing.pairTitle': 'Catechismus et Compendium',
	'ccc.landing.tagline':
		'<strong>Catechismus</strong> doctrinam catholicam 2.865 numeris distinctis exponit. <strong>Compendium</strong> eandem doctrinam 598 quaestionibus et responsionibus, eodem ordine servato, refert.',
	'ccc.landing.pairTagline':
		'Catechismus Catholicae Ecclesiae 2.865 numeris, eiusque Compendium 598 quaestionibus.',
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
	'ccc.abbrev': 'CCE',
	'ccc.condensedIn': 'In Compendio',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Numerus interrogationis in hoc corpore deest',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Doctores Ecclesiae',
	'doctores.landing.tagline': 'Opera theologica Patrum et Doctorum Ecclesiae.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Sancti Thomae Aquinatis, Latine ut scripsit et Anglice.',
	'summa.tableOfContents': 'Index quaestionum',
	'summa.part': 'Pars',
	'summa.question': 'Quaestio',
	'summa.article': 'Articulus',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titulus ex editione {lang}',
	'summa.titlesFromEdition': 'Tituli ex editione {lang} — haec nullos praebet',
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
	'index.division': 'Divisio',
	'index.showSubsections': 'Ostende partes minores',
	'index.hideSubsections': 'Absconde partes minores',
	'prayers.landing.title': 'Preces communes',
	'prayers.landing.tagline': 'Preces, adiuncto textu Latino.',
	'prayers.gloss.versicle':
		'Versiculus — linea quam is qui precem ducit solus dicit vel canit. Cui congregatio responso sequenti respondet.',
	'prayers.gloss.response':
		'Responsum — linea quam congregatio simul dicit vel canit, versiculo praecedenti respondens.',
	'prayers.tableOfContents': 'Index precum',
	'prayers.seeAlso': 'Vide etiam',
	'prayers.prevPrayer': 'Prex prior',
	'prayers.nextPrayer': 'Prex sequens',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Hodie',
	'prayers.rosary.todayHeading': 'Mysteria hodierna',
	'prayers.rosary.openingPrayer': 'Oratio initialis',
	'prayers.rosary.decadePrayers': 'Orationes decadis',
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
	'bookmark.about': 'De his signatis',
	'bookmark.deviceOnly':
		'Signata in hoc solo navigatro servantur. Nusquam mittuntur, et memoria navigatri deleta pereunt.',
	'bookmark.unavailable': 'Non est in editione quam legis',
	'document.library.tagline':
		'Litterae encyclicae, constitutiones, decreta et declarationes Magisterii.',
	'document.filter.heading': 'Selectio',
	'document.filter.author': 'Auctor',
	'document.filter.kind': 'Genus',
	'document.filter.subject': 'Argumentum',
	'document.filter.search': 'Documenta quaerere',
	'document.filter.clear': 'Delere',
	'document.filter.results': 'Documenta ostensa',
	'document.filter.noResults': 'Nullum documentum his condicionibus respondet.',
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
	'document.kind.apostolicLetter': 'Epistula apostolica',
	'document.kind.cdfDeclaration': 'Declaratio CDF',
	'document.kind.cdfInstruction': 'Instructio CDF',
	'document.kind.cdfLetter': 'Epistula CDF',
	'document.kind.cdfDoctrinalNote': 'Nota doctrinalis CDF',
	'document.kind.cdfResponsum': 'Responsum CDF',
	'document.kind.cdfConsiderations': 'Considerationes CDF',
	'document.kindPlural.conciliarConstitution': 'Constitutiones',
	'document.kindPlural.conciliarDecree': 'Decreta',
	'document.kindPlural.conciliarDeclaration': 'Declarationes',
	'document.kindPlural.encyclical': 'Litterae encyclicae',
	'document.kindPlural.apostolicExhortation': 'Adhortationes apostolicae',
	'document.kindPlural.apostolicConstitution': 'Constitutiones apostolicae',
	'document.kindPlural.apostolicLetter': 'Epistulae apostolicae',
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
		'Nulla scripta quae te sequantur, nullus alienus codex, nulla crustula. Numeri tantum usus anonymi, nihil quod te designet.',
	'colophon.pointOffline':
		'Ita facta ut sine rete legi possit postquam semel adisti, ne infirma coniunctio lectioni obstet.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica inceptum privatum christifidelium laicorum est. Nullam approbationem ecclesiasticam habet nec ulla auctoritate propria loquitur.',
	'footer.notEndorsed': 'A Sancta Sede non approbatum',
	'colophon.textsTitle': 'De textibus',
	'colophon.textsBody':
		'Omnis textus e fonte nominato venit, et omne opus editionem suam, paginam fontis et diem quo haustus est memorat. Scriptura translationibus utitur quae iuris publici sunt; Catechismus, Compendium et documenta Magisterii ex ipsis Sanctae Sedis editis textibus veniunt.',
	'colophon.textsFidelity':
		'Textus numquam breviatur, numquam aliis verbis redditur, numquam rescribitur, numquam iuxta praeconia ponitur. Menda tamen aperta emendamus — verbum omissum, locus male allatus, nota quae paragraphum absorpsit — semper ad id quod fons ipse imprimit, numquam ad id quod nos imprimendum esse putamus.',
	'colophon.countBible': 'editiones Scripturae',
	'colophon.countDocuments': 'documenta Magisterii',
	'colophon.privacyTitle': 'Secretum tuum',
	'colophon.privacyBody1':
		'Nulla nomina danda, nulla crustula, nulla praeconia, nullus alienus codex. Nihil hic te extra hanc sedem sequitur.',
	'colophon.privacyBody2':
		'Usum tamen sedis numeramus: una mensura per quamque visitationem, quolibet campo intervallum potius quam numerum praecisum ferente — quamdiu adfueris, quotiens huc redieris, quae opera aperueris. Patria tua seorsum numeratur, nulla re eam ceteris iungente. Visitationem describit, non visitatorem, et per {days} dies servatur.',
	'colophon.privacyBody3':
		'Numquam mittuntur: quae in capsam quaerendi scripseris, quem locum apertum habueris, aut quidquid instrumentum tuum iterum agnoscere possit. Optiones tuae, signata et textus translati in instrumento tuo manent.',
	'colophon.copyrightTitle': 'Iura auctorum',
	'colophon.copyrightBody1':
		'Catechismus, Compendium et documenta Magisterii eorum sunt qui iura in eis tenent — praecipue Librariae Editricis Vaticanae et Dicasterii pro Communicatione.',
	'colophon.copyrightBody2':
		'Omne opus notam eius qui ius tenet, ipsius verbis, exhibet, et ad paginam unde sumptum est ducit.',
	'colophon.copyrightBody3':
		'Si quis ius in textu aliquo hic posito tenet et eum publicari non vult, ad nos scribat.',
	'colophon.contactTitle': 'Quomodo nos adeas',
	'colophon.contactBody': 'De quacumque re, etiam de superioribus:',
	'colophon.contactPending':
		'Inscriptio nondum constituta est. Haec sedes in publicum edi non debet priusquam eam habeat — quod supra promittitur sine via nos adeundi nihil valet.',
	'colophon.illustrationsTitle': 'De imaginibus',
	'colophon.illustrationsBody':
		'Biblia imagines Gustavi Doré fert, unamquamque ad versum quem exprimit positam — ultimus et amplissimus ex eius cyclis biblicis, ex ipsius adumbrationibus in ligno incisus et cum textu impressus, non in fine voluminis collectus.',
	'colophon.illustrationsRights':
		'In publico sunt, ut anni infra scripti ostendunt, neque imaginis publicae fidelis photographica repetitio novum ius auctoris parit.',
	'colophon.countPlates': 'imagines',
	'colophon.countPlateChapters': 'capita imaginibus ornata',
	'plates.scansBy': 'Imagines electronicae praebitae a',
	'plates.enlarge': 'Amplifica {title}',
	'plates.zoom': 'Amplificatio',
	'art.about': 'De hac imagine',
	'art.detail': 'particula',
	'colophon.typeTitle': 'De litterarum forma',
	'colophon.typeBody':
		'Litteris EB Garamond composita, quas Georgius Duffner et Octavius Pardo ex typis a Claudio Garamont circa annum 1590 caesis renovaverunt — ea traditione humanistica qua Ecclesia ab aetate litterarum renascentium imprimit. Litterae eius Cyrillicae ab iisdem manibus sunt, nihil tamen renovant: Garamont Cyrillicus numquam caesus est, ideoque textus Russicus forma nova exprimitur, quae ceteris apte adstet.',
	'colophon.typeArabic':
		'Arabica prorsus extra eius fines iacet et litteris Amiri exprimitur — quibus Khaled Hosny naskh illud renovavit quod anno 1905 officinae Bulaquensi Cairi caesum est, eadem ratione electis qua littera textus: certus typus librarius historicus, non nova nostrae aetatis descriptio.',
	'colophon.typeInitials':
		'Litterae initiales sunt Pirata One, forma Gothica cuius capitales etiam ea magnitudine quam littera initialis poscit legi possunt, et — pro Russicis — Ponomar, quae typum Slavonicum ecclesiasticum Officinae Synodalis refert. Ponomar litteram initialem tantum, numquam textum, componit: encyclica nostrae aetatis tota typo Synodali composita falsum aliquid de se diceret. Omnes sub licentia SIL Open Font License dantur et ex hac ipsa sede mittuntur, non ex aliena, ne pagina legenda quicquam ab alterius machina petat.',
	'refs.citedIn': 'Ubi affertur',
	'refs.externalVolume': 'Volumen {volume} apud {host} — imagines photographicae (PDF)',
	// The Latin editio typica is `Catechismus Catholicae Ecclesiae`, so the
	// siglum is CCE — as in French. `refparse.ts` still reads only `ccc`;
	// this key names the work in prose, it does not decide what the search
	// box accepts.
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
	'lang.filter': 'Linguas quaerere',
	'lang.more': 'linguae aliae',
	'notFound.title': 'Nihil hac in inscriptione',
	'notFound.lede': 'Pagina quam petisti hic non est.',
	'notFound.body':
		'Nexus fortasse perperam scriptus est aut obsoletus, aut ad textum ducit quem haec sedes non habet.',
	'notFound.searchHint':
		'Si locum quem quaeris nosti — librum et caput, paragraphum Catechismi — in arcam quaerendi supra eum scribe.',
	'notFound.credit': 'Ad exemplar British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Vel hinc incipe:',
	'notFound.home': 'Prima pagina',
	'compare.enter': 'Editiones confer',
	'compare.exit': 'Collationem relinque',
	'compare.missing': 'In hac editione non est',
	'compare.versificationNote':
		'Hae duae editiones versus huius capitis alicubi aliter dividunt (varietas textus, non consilium interpretis) — idem numerus versus non semper eandem sententiam in utraque columna signat.',
	'compare.loading': 'Altera lingua legitur…',
	'ui.close': 'Claude',
	'shortcuts.title': 'Compendia clavium',
	'shortcuts.betweenDocuments': 'Inter documenta',
	'shortcuts.withinDocument': 'Intra documentum',
	'shortcuts.show': 'Hunc indicem ostendere',
	'help.title': 'Auxilium',
	'help.reading.heading': 'Tabula supra textum',
	'help.feature.search':
		'Locum in capsam superiorem inscribe — caput et versum, numerum paragraphi, nomen documenti — et scribenti complet.',
	'help.feature.offline':
		'Adde sedem ad primam tabulam tuam et sicut applicatio aperitur. Opera integra transferre potes ut sine rete legas.',
	'help.feature.contents':
		'Divisiones operis in quo es — libri, partes, capita — ut intus te moveas nec ad initium redeas.',
	'help.feature.compare':
		'Duae eiusdem loci editiones, iuxta positae — Latinum iuxta linguam tuam, vel una translatio iuxta alteram.',
	'help.feature.apparatus':
		'Notae ipsius editionis, et quilibet commentarius in textum scriptus, iuxta eum offeruntur, non infra. Citationes intra textum vincula sunt, ut locus eo ducat quo spectat.',
	'help.feature.focus':
		'Omnia praeter textum tollit. Exitus ibi manet ubi tabula erat, ne quid post eam captum sit.',
	'zen.enter': 'Modum intentionis ini',
	'zen.exit': 'Modum intentionis relinque',
	'nav.calendar': 'Calendarium',
	'calendar.title': 'Calendarium Liturgicum',
	'calendar.tagline':
		'Calendarium Romanum Generale, in quemlibet diem computatum — tempus, gradus, color.',
	'calendar.national.tagline':
		'{name}, cum celebrationibus propriis, in quemlibet diem computatum.',
	'calendar.calendar': 'Calendarium',
	'calendar.which.general': 'Calendarium Romanum Generale',
	'calendar.filter': 'Regiones quaerere',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Americae',
	'calendar.region.africa': 'Africa',
	'calendar.region.middleEast': 'Medius Oriens',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Hodie',
	'calendar.previousMonth': 'Mensis praecedens',
	'calendar.nextMonth': 'Mensis sequens',
	'calendar.plainDays': 'Feriae',
	'calendar.noSuchDay': 'Nullus dies liturgicus huic diei computatur.',
	'calendar.week': 'hebdomada',
	'calendar.alsoToday': 'Item hodie',
	'calendar.alsoObserved': 'Item hodie servatur',
	'calendar.obligation': 'Dies festus de praecepto',
	'calendar.obligationCanon': 'CIC can. 1246',
	'calendar.sundayCycle': 'Cyclus dominicalis',
	'calendar.weekdayCycle': 'Cyclus ferialis',
	'calendar.psalterWeek': 'Hebdomada psalterii',
	'lectionary.heading': 'Lectiones Missae',
	'lectionary.slot.reading': 'Lectio',
	'lectionary.slot.reading1': 'Lectio prima',
	'lectionary.slot.reading2': 'Lectio secunda',
	'lectionary.slot.reading3': 'Lectio tertia',
	'lectionary.slot.reading4': 'Lectio quarta',
	'lectionary.slot.reading5': 'Lectio quinta',
	'lectionary.slot.reading6': 'Lectio sexta',
	'lectionary.slot.reading7': 'Lectio septima',
	'lectionary.slot.psalm': 'Psalmus responsorius',
	'lectionary.slot.epistle': 'Epistola',
	'lectionary.slot.acclamation': 'Acclamatio ante Evangelium',
	'lectionary.slot.gospel': 'Evangelium',
	'lectionary.slot.sequence': 'Sequentia',
	'lectionary.or': 'vel',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'De his lectionibus',
	'lectionary.caveat':
		'Loci ab Ordine Lectionum Missae assignati, ad huius sedis proprias editiones iuncti — non translatio quae in aliqua Ecclesia particulari proclamatur, et Episcoporum Conferentia ordinem aptare potest.',
	'calendar.transferredFrom': 'Translatum a die',
	'calendar.season.advent': 'Adventus',
	'calendar.season.christmas': 'Tempus Nativitatis',
	'calendar.season.lent': 'Quadragesima',
	'calendar.season.triduum': 'Triduum Paschale',
	'calendar.season.easter': 'Tempus Paschale',
	'calendar.season.ordinary': 'Tempus per annum',
	'calendar.colour.white': 'Albus',
	'calendar.colour.red': 'Ruber',
	'calendar.colour.green': 'Viridis',
	'calendar.colour.violet': 'Violaceus',
	'calendar.colour.rose': 'Rosaceus',
	'calendar.colour.black': 'Niger',
	'calendar.colour.blue': 'Caeruleus',
	'calendar.rank.solemnity': 'Sollemnitas',
	'calendar.rank.feast': 'Festum',
	'calendar.rank.memorial': 'Memoria',
	'calendar.rank.optional-memorial': 'Memoria ad libitum',
	'calendar.rank.commemoration': 'Commemoratio',
	'calendar.rank.sunday': 'Dominica',
	'calendar.rank.weekday': 'Feria',
	/* See `en.ts`: each gloss is shown twice, behind the term in the day's
	   card and in the primer at the foot of `/calendarium`. Where the Missal
	   itself glosses one of these words this takes its wording -- Easter Time
	   as `magna dominica` and a Sunday that `praevalet` are the General Norms'
	   own, and a reader who chose Latin chrome will meet them again there. */
	'calendar.gloss.season.advent':
		'Quattuor hebdomadae ante Nativitatem: praeparatio ad adventum Domini, et initium anni Ecclesiae.',
	'calendar.gloss.season.christmas':
		'A die Nativitatis usque ad Baptisma Domini, quo ortus Domini et manifestatio eius mundo celebrantur.',
	'calendar.gloss.season.lent':
		'Quadraginta dies a feria quarta Cinerum usque ad Missam vespertinam in Cena Domini: paenitentia, eleemosyna et praeparatio ad Pascha.',
	'calendar.gloss.season.triduum':
		'Tres dies a vespere feriae quintae in Cena Domini usque ad vesperum Dominicae Paschae — passio, mors et resurrectio Domini, totiusque anni culmen.',
	'calendar.gloss.season.easter':
		'Quinquaginta dies a Pascha usque ad Pentecosten, veluti unus dies festus acti — «magna dominica».',
	'calendar.gloss.season.ordinary':
		'Triginta tres vel triginta quattuor hebdomadae extra cetera tempora. Non «quaelibet» sed ordinatae: numeris signantur, et Ecclesia vitam doctrinamque Domini ex ordine percurrit. Duobus spatiis decurrit — post Tempus Nativitatis usque ad Quadragesimam, et post Pentecosten usque ad Adventum.',
	'calendar.gloss.rank.solemnity':
		'Summus gradus: Pascha, Nativitas, Ascensio, patronus loci proprius. Cum Gloria et Credo celebratur, et a vesperis diei praecedentis incipit.',
	'calendar.gloss.rank.feast':
		'Intra ipsum diem celebratur. Apostoli et evangelistae, et dies maiores Domini et Beatae Mariae Virginis.',
	'calendar.gloss.rank.memorial':
		'Sanctus die suo recolitur, intra Missam et Officium temporis currentis. Ubicumque servatur, obligatoria est.',
	'calendar.gloss.rank.optional-memorial':
		'Servari potest vel omitti, prout sacerdos aut communitas elegerit. Si omittitur, dies simpliciter feria est.',
	'calendar.gloss.rank.commemoration':
		'Id quod memoria in Quadragesima fit: oratio Missae feriali addita, quam alioquin tempus integram servat.',
	'calendar.gloss.rank.sunday':
		'Dies festus primigenius — dies Domini, omni hebdomada a resurrectione servatus. Sola sollemnitas aut festum Domini ei praevalere potest, in Adventu autem, Quadragesima et Tempore Paschali ne haec quidem.',
	'calendar.gloss.rank.weekday':
		'Dies nullam celebrationem propriam habens. Missa et Officium ipsius temporis sunt, unde apparet cur tempus noscere intersit.',
	'calendar.gloss.colour.white':
		'Laetitia. Tempus Paschale et Tempus Nativitatis, dies Domini praeter passionis, Beata Maria Virgo, angeli, et sancti qui martyres non fuerunt.',
	'calendar.gloss.colour.red':
		'Sanguis et ignis. Dominica in Palmis et feria sexta in Passione Domini, Pentecoste, apostoli et evangelistae, et martyres.',
	'calendar.gloss.colour.green': 'Tempus per annum: color spei et rerum crescentium.',
	'calendar.gloss.colour.violet':
		'Adventus et Quadragesima; adhibetur etiam in Missis defunctorum.',
	'calendar.gloss.colour.rose':
		'Bis in anno adhibetur — dominica Gaudete, tertia Adventus, et dominica Laetare, quarta Quadragesimae — ubi ieiunium levatur et finis prospicitur.',
	'calendar.gloss.colour.black': 'Adhiberi potest in Missis defunctorum.',
	'calendar.gloss.colour.blue':
		'Privilegium coloris caerulei: in Immaculata Conceptione adhibetur in Hispania, in Philippinis et in paucis aliis locis quibus Sancta Sedes id concessit.',
	'calendar.gloss.sundayCycle':
		'Lectiones dominicales per tres annos decurrunt — A, B et C — Matthaeo, Marco et Luca per vices lectis, Ioanne autem per Quadragesimam et Tempus Paschale. Cyclus dominica prima Adventus vertitur, cum anno Ecclesiae.',
	'calendar.gloss.weekdayCycle':
		'Lectiones feriales per duos annos decurrunt, I et II: lectio prior mutatur, Evangelium non mutatur. Annus liturgicus ab anno civili quo finitur nominatur — anni impares I sunt, pares II.',
	'calendar.gloss.psalterWeek':
		'Liturgia Horarum psalmos per quattuor hebdomadas distribuit, I ad IV, per annum repetitas. Hic indicatur cuius hebdomadae psalmi hodierni sint, iis qui Horas orant.',
	'calendar.gloss.obligation':
		'Dies quo fideles Missae participare tenentur et ab operibus quae id impediant abstinere. Omnis dominica, et ceteri dies quos singulae Episcoporum Conferentiae statuerunt.',
	'calendar.primer.title': 'Haec tibi nova sunt?',
	'calendar.primer.lead':
		'Ecclesia annum proprium servat. Ab Adventu incipit, circa Pascha vertitur, et cuique diei nomen, gradum et colorem tribuit — quae decernunt quid illo die in Missa et in Liturgia Horarum oretur et legatur. Itaque «Dominica XXIII per annum» velut locus citatus est: sacerdoti, choro, cuilibet domi oranti indicat quae orationes et lectiones hodiernae sint.',
	'calendar.primer.seasons': 'Tempora',
	'calendar.primer.ranks': 'Quid dies esse possit',
	'calendar.primer.colours': 'Colores',
	'calendar.primer.cycles': 'Cycli',
	'calendar.primer.cyclesLead':
		'Tres numeri, qui simul indicant quae lectiones et psalmi hodie assignentur.'
};
