/**
 * Bahasa Indonesia UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * A REACH LANGUAGE: the corpus holds nothing in Bahasa Indonesia, and that is the
 * point rather than an oversight. The interface list stopped tracking the
 * corpus on 2026-08-31 (see `../ui-langs.ts`) and reaches past it by Catholic
 * population -- here, Indonesia, the largest Catholic population of any Muslim-majority country. A reader gets their own chrome and English
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
 * `site/docs/colophon.md`. The confidence note below governs
 * the colophon too.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive.
 *
 * TRANSLATION CONFIDENCE: MEDIUM. Written by an LLM with no native reader
 * in the loop. The chrome vocabulary here is conventional and is likely
 * right; the longer taglines are what to check first. Deleting a doubtful
 * line is a valid fix — English fills the gap per key.
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

export const id: Dictionary = {
	'nav.bible': 'Alkitab',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Magisterium',
	'nav.socialDoctrine': 'Ajaran sosial',
	'socialDoctrine.landing.title': 'Kompendium Ajaran Sosial Gereja',
	'socialDoctrine.landing.tagline':
		'Yang diajarkan Gereja tentang hidup bermasyarakat, dalam 583 nomor.',
	'nav.canonLaw': 'Hukum Kanonik',
	'canonLaw.landing.title': 'Kitab Hukum Kanonik',
	'canonLaw.landing.tagline':
		'Hukum Gereja Latin, dalam 1.752 kanon yang terbagi dalam tujuh buku.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Kanon sebelumnya',
	'canonLaw.nextCanon': 'Kanon berikutnya',
	'canonLaw.readFullTitle': 'Baca seluruh judul',
	'canonLaw.superseded': 'Rumusan yang digantikan oleh',
	'nav.prayers': 'Doa',
	'nav.bookmarks': 'Penanda',
	'nav.menu': 'Menu',
	'nav.sections': 'Bagian',
	'nav.works': 'Karya',
	'nav.pages': 'Halaman',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Lanjutkan membaca',
	'home.tagline':
		'Situs bacaan untuk Kitab Suci, Katekismus, dan dokumen-dokumen Magisterium — gratis, tetap berfungsi luring, dan tidak ada yang perlu didaftarkan.',
	'home.doors.heading': 'Ke mana',
	'home.find.heading': 'Atau ketikkan sebuah rujukan',
	'nav.library': 'Perpustakaan',
	'nav.learn': 'Belajar',
	'library.landing.tagline':
		'Seluruh koleksi, rak demi rak — beserta tempat Anda berhenti dan apa yang Anda tandai.',
	'schola.landing.title': 'Mulai dari mana',
	'schola.landing.tagline':
		'Panduan singkat atas apa yang ada di sini: apa masing-masing kitab ini, Sepuluh Perintah Allah dan daftar-daftar lain yang menurut Gereja perlu diketahui seorang Katolik, dan dari mana mulai membaca.',
	'schola.start.heading': 'Baru mengenal Katolik?',
	'schola.start.body': 'Awal yang paling baik adalah ',
	'schola.start.bodyAfter':
		': ajaran yang sama seperti Katekismus, jauh lebih ringkas, ditulis dalam tanya jawab. Panjangnya kira-kira sepersepuluh dan tidak mengandaikan apa pun.',
	'schola.bible.heading': 'Belum pernah membaca Alkitab?',
	'schola.bible.library':
		'Ia bukan satu kitab melainkan tujuh puluh tiga, ditulis selama lebih dari seribu tahun dan dihimpun dalam urutan yang ditetapkan Gereja — bukan urutan terjadinya peristiwa, dan bukan urutan yang paling mudah dibaca. Kebanyakan orang mulai pada halaman pertama dan berhenti beberapa minggu kemudian, di tengah bab panjang tentang hukum purba, sebab belum ada yang memberi tahu mereka untuk apa itu.',
	'schola.bible.step.gospel': 'Mulailah dengan sebuah Injil',
	'schola.bible.start':
		'Salah satu dari empat kitab pendek tentang kehidupan Yesus, jauh di dalam dan bukan di depan. Ini bukan gagasan kami: sebuah Konsili Gereja meminta agar diajarkan penggunaan Kitab Suci yang benar, „terutama Perjanjian Baru dan di atas segalanya Injil“. Konsili itu tidak menyebut satu pun secara khusus, dan kami pun tidak.',
	'schola.bible.whichGospel':
		'Tiga biasanya disarankan, dengan tiga alasan yang berbeda. Mana pun di antaranya adalah tempat yang baik untuk berada.',
	'schola.bible.gospel.mark':
		'Yang terpendek. Anda dapat membacanya seluruhnya dalam satu petang, dan pada awalnya menyelesaikan satu lebih berharga daripada memilih yang terbaik.',
	'schola.bible.gospel.luke':
		'Ditulis untuk seseorang di luar iman yang menginginkan kisah itu dicatat menurut urutannya — yang boleh jadi persis Anda. Ia berlanjut langsung ke Kisah Para Rasul, sehingga sebenarnya merupakan paruh pertama sebuah kitab yang lebih panjang.',
	'schola.bible.gospel.john':
		'Yang terus terang menyatakan mengapa ia ditulis: „supaya kamu percaya“. Kata-kata sederhana, dan langsung menuju pertanyaan siapakah Yesus itu.',
	'schola.bible.step.acts': 'Lalu apa yang terjadi sesudahnya',
	'schola.bible.thenActs':
		'Setelah Anda menyelesaikan satu, bacalah apa yang dilakukan mereka yang mengenal-Nya sesudah Ia pergi.',
	'schola.bible.acts.why':
		'Tiga puluh tahun setelah Injil berakhir: beberapa lusin orang yang ketakutan, dan bagaimana apa yang mereka lihat sampai ke ujung lain kekaisaran.',
	'schola.bible.step.old': 'Lalu paruh yang lebih tua',
	'schola.bible.thenOld':
		'Bukan dari halaman pertama, dan bukan seluruhnya. Beberapa tempat membawa kisah itu, dan justru ke sanalah Injil terus-menerus menunjuk kembali.',
	'schola.bible.ot.beginnings': 'Bagaimana ia bermula, dan bagaimana ia menjadi rusak.',
	'schola.bible.ot.promise':
		'Satu keluarga, dan sebuah janji kepadanya yang melampaui semua orang di dalamnya.',
	'schola.bible.ot.exodus':
		'Suatu bangsa yang dibawa keluar dari perbudakan, dan hukum yang diberikan kepadanya untuk hidup.',
	'schola.bible.ot.psalms':
		'Bukan kisah: seratus lima puluh doa dan nyanyian. Bacalah satu per satu, dalam urutan mana pun. Gereja masih mendoakannya setiap hari.',
	'schola.bible.bothWays':
		'Anda akan mengenali banyak hal, dan itulah maksudnya, bukan kebetulan. Gereja membaca kitab-kitab yang lebih tua dalam terang Kristus dan yang lebih baru dalam terang apa yang mendahuluinya — masing-masing paruh menjelaskan yang lain, dan karena itu tak satu pun dibaca sendirian.',
	'schola.books.heading': 'Apa yang ada di sini',
	'schola.books.lede':
		'Masing-masing ini adalah jenis kitab yang berbeda, dan baris di bawahnya menyebutkan jenis itu. Buka kotak pencarian di bagian atas halaman untuk melihat bagaimana masing-masing dirujuk, dan untuk langsung menuju suatu bagian.',
	'schola.what.scripture':
		'Kitab Suci sebagaimana diterima Gereja, dalam kedua Perjanjian. Segala sesuatu yang lain di sini dibaca dalam terangnya.',
	'schola.what.catechism':
		'Ringkasan apa yang diimani Gereja Katolik, dalam satu jilid. Ia sendiri bukan sumber: ia menghimpun Kitab Suci, para Bapa, liturgi dan ajaran Gereja, dan setiap nomor menyebutkan dari mana asal apa yang dikatakannya.',
	'schola.what.compendium':
		'Ajaran yang sama disajikan dalam tanya jawab, kira-kira sepersepuluh panjangnya.',
	'schola.what.magisterium':
		'Apa yang sungguh-sungguh ditulis para paus dan konsili — ensiklik, konstitusi, dekret, deklarasi — masing-masing ditujukan kepada suatu saat tertentu dan suatu persoalan tertentu. Masing-masing dikenal menurut kata-kata pembukanya dalam bahasa Latin.',
	'schola.what.social':
		'Ajaran Gereja tentang kerja, milik, keluarga, politik dan perdamaian, dihimpun dari dokumen-dokumen itu ke dalam satu kitab.',
	'schola.what.law':
		'Hukum dan bukan ajaran. Ia menyatakan apa yang dituntut Gereja, dan ia diubah dari waktu ke waktu.',
	'schola.what.doctors':
		'Para teolog yang telah dinyatakan Gereja sebagai Pujangga. Itu tidak membawa wewenang resmi, betapapun besar penulisnya.',
	'schola.what.prayers': 'Kata-kata yang didoakan Gereja, dengan bahasa Latin di sampingnya.',
	'schola.places.heading': 'Bukan teks, melainkan tempat-tempat di situs ini',
	'schola.what.library':
		'Semua karya situs ini dalam satu daftar, dikelompokkan menurut pokok dan bukan menurut jenis.',
	'schola.what.questions':
		'Pintu masuk bagi pembaca yang memegang pertanyaan dan bukan rujukan. Setiap pertanyaan menghimpun bagian-bagian yang menjawabnya — Katekismus lebih dahulu — dan setiap katanya adalah milik Gereja sendiri.',
	'schola.what.calendar':
		'Hari liturgi — masa, warna, dan siapa yang diperingati — bagi negara yang kalendernya Anda ikuti.',
	'schola.what.bookmarks':
		'Bagian-bagian yang telah Anda tandai, dan di mana Anda terakhir berhenti dalam tiap karya. Keduanya disimpan di peramban ini dan tidak dikirim ke mana pun.',
	'schola.what.census':
		'Apa yang dimiliki perpustakaan ini dan seberapa jauh jangkauannya — berapa banyak karya, dalam bahasa apa saja, dan berapa banyak dari masing-masing yang benar-benar dapat dijangkau pembaca dalam bahasa Anda sendiri.',
	'schola.formulas.heading': 'Sepuluh Perintah Allah, dan apa lagi yang dihafalkan',
	'schola.formulas.lede':
		'Bukan ringkasan situs ini: inilah daftar-daftar yang dicetak Gereja sendiri di akhir Kompendium, bagi siapa pun yang sedang diajar imannya. Setiap kata di bawah ini dikutip dari edisi Anda sendiri.',
	'ccc.noCounterpart': 'Tidak ada padanan dalam karya lainnya',
	'jumpbox.placeholder': 'Lompat ke… (mis. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Cari',
	'jumpbox.hint': 'Tekan / atau Ctrl+K untuk melompat ke suatu rujukan',
	'jumpbox.noMatch': 'Tidak ada yang cocok',
	'jumpbox.suggestions': 'Saran',
	'settings.label': 'Pengaturan',
	'apparatus.label': 'Aparatus',
	'apparatus.editionNotes': 'Catatan edisi ini',
	'apparatus.commentary': 'Tafsir',
	'apparatus.inCommentary': 'Termasuk dalam tafsir di atas.',
	'darkMode.label': 'Mode gelap',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Nyala',
	'darkMode.off': 'Mati',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Hanya mode terang',
	'sepia.noHue': 'Tidak ada dalam mono',
	'oled.label': 'Hitam OLED',
	'oled.darkOnly': 'Hanya mode gelap',
	'mono.label': 'Monokrom',
	'mono.hint':
		'Menjadikan seluruh halaman dalam satu warna abu-abu, sehingga tidak ada yang dibedakan berdasarkan warna. Sepia dimatikan selama mode ini aktif.',
	'advanced.label': 'Lanjutan',
	'library.title': 'Perpustakaan luring',
	'library.lede': 'Teks yang disimpan di perangkat ini terbuka tanpa koneksi sama sekali.',
	'library.essentials': 'Doa dan Kompendium',
	'library.illustrations': 'Alkitab (ilustrasi)',
	'library.illustrationsDetail': 'Alkitab (ilustrasi, resolusi tinggi)',
	'library.other': 'Teks lainnya',
	'library.everything': 'Semuanya',
	'library.downloadAll': 'Unduh semuanya',
	'library.download': 'Unduh',
	'library.downloaded': 'Di perangkat ini',
	'library.offlineNote': 'Matikan mode luring untuk dapat mengunduh.',
	'library.remove': 'Hapus dari perangkat ini',
	'library.removeConfirm': 'Hapus?',
	'library.forget': 'Hapus unduhan',
	'library.forgetConfirm': 'Hapus semuanya?',
	'offline.label': 'Mode luring',
	'offline.hint':
		'Sama sekali tidak menggunakan jaringan: tidak ada yang diunduh, tidak ada pembaruan yang diperiksa, tidak ada yang diukur. Hanya teks yang sudah ada di perangkat ini yang akan terbuka.',
	'offline.notDownloaded': 'Tidak ada di perangkat ini',
	'loadFailed.title': 'Itu tidak termuat',
	'loadFailed.hint':
		'Halamannya ada — ada yang salah saat mengambilnya. Mencoba lagi biasanya berhasil.',
	'loadFailed.retry': 'Coba lagi',
	'loadFailed.retrying': 'Mencoba…',
	'offline.turnOff': 'Matikan mode luring',
	'type.label': 'Ukuran teks dan jenis huruf',
	'fontSize.label': 'Ukuran teks',
	'fontSize.small': 'Kecil',
	'fontSize.medium': 'Sedang',
	'fontSize.large': 'Besar',
	'fontSize.xlarge': 'Sangat besar',
	'fontSize.xxlarge': 'Terbesar',
	'face.label': 'Jenis huruf',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Cetak halaman ini',
	'toTop.label': 'Kembali ke atas',
	'install.label': 'Pasang Glossa',
	'install.hint.label': 'Tambahkan ke Layar Utama',
	'install.hint.title': 'Tambahkan Glossa ke Layar Utama Anda',
	'install.hint.stepBefore': 'Ia terbuka seperti aplikasi dan dapat dibaca secara luring. Ketuk',
	'install.hint.stepAfter': 'lalu „Tambahkan ke Layar Utama“.',
	'install.hint.dismiss': 'Tutup',
	'update.label': 'Edisi baru tersedia',
	'update.title': 'Edisi baru siap',
	'update.body': 'Muat ulang untuk mendapatkan teks dan koreksi terbaru.',
	'update.action': 'Muat Ulang',
	'update.dismiss': 'Nanti saja',
	'edition.label': 'Edisi',
	'edition.select': 'Pilih edisi',
	'edition.current': 'Edisi sekarang',
	'edition.filter': 'Cari edisi',
	'menu.noMatches': 'Tidak ada yang cocok',
	'unitNav.previous': 'Sebelumnya',
	'unitNav.next': 'Berikutnya',
	'bible.prevChapter': 'Bab sebelumnya',
	'bible.nextChapter': 'Bab berikutnya',
	'bible.pickBook': 'Kitab dan bab',
	'bible.landing.title': 'Alkitab',
	'bible.landing.tagline': 'Bacalah seluruh Alkitab, kitab demi kitab, bab demi bab.',
	'bible.landing.random': 'Saya lagi beruntung',
	'bible.landing.books': 'Kitab',
	'bible.chapterUnavailable': 'Tidak tersedia dalam edisi ini',
	'bible.introduction': 'Pengantar',
	'bible.introUnavailable': 'Belum ada pengantar dalam bahasa ini',
	'bible.introSource': 'Pengantar bukan bagian dari teks Kitab Suci.',
	'bible.testament.ot': 'Perjanjian Lama',
	'bible.testament.nt': 'Perjanjian Baru',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial.
	'bible.group.pentateuch': 'Pentateukh',
	'bible.group.historical': 'Kitab-kitab Sejarah',
	'bible.group.wisdom': 'Kitab-kitab Kebijaksanaan',
	'bible.group.prophetic': 'Kitab-kitab Nabi',
	'bible.group.gospels': 'Injil',
	'bible.group.acts': 'Kisah Para Rasul',
	'bible.group.pauline': 'Surat-surat Paulus',
	'bible.group.catholicLetters': 'Surat-surat Katolik',
	'bible.group.revelation': 'Wahyu',
	'ccc.prevParagraph': 'Alinea sebelumnya',
	'ccc.nextParagraph': 'Alinea berikutnya',
	'ccc.inBrief': 'Ringkasan',
	'ccc.landing.title': 'Katekismus Gereja Katolik',
	'ccc.landing.pairTitle': 'Katekismus dan Kompendium',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> memaparkan ajaran Katolik dalam 2.865 alinea bernomor. <strong>Kompendium</strong> menyajikan ajaran yang sama sebagai 598 tanya jawab, menurut kerangka yang sama.',
	'ccc.landing.pairTagline':
		'Katekismus Gereja Katolik dalam 2.865 nomor, dan Kompendiumnya dalam 598 pertanyaan.',
	'ccc.tableOfContents': 'Daftar Isi',
	'ccc.related': 'Lihat juga',
	'compendium.landing.title': 'Kompendium Katekismus',
	'compendium.landing.tagline': 'Tanya jawab yang meringkas Katekismus Gereja Katolik.',
	'compendium.question': 'Pertanyaan',
	'compendium.answer': 'Jawaban',
	'compendium.tableOfContents': 'Daftar Isi',
	'compendium.prevQuestion': 'Pertanyaan sebelumnya',
	'compendium.nextQuestion': 'Pertanyaan berikutnya',
	'compendium.condenses': 'Meringkas KGK ¶¶',
	'ccc.abbrev': 'KGK',
	'ccc.condensedIn': 'Dalam Kompendium',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Tidak ada nomor pertanyaan dalam korpus ini',
	'document.library.tagline': 'Ensiklik, konstitusi konsili, dekret, dan deklarasi Magisterium.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Penulis',
	'document.filter.kind': 'Jenis',
	'document.filter.subject': 'Subjek',
	'document.filter.search': 'Cari dokumen',
	'document.filter.clear': 'Bersihkan',
	'document.filter.results': 'Dokumen ditampilkan',
	'document.filter.noResults': 'Tidak ada dokumen yang cocok dengan filter ini.',
	'document.tableOfContents': 'Daftar Isi',
	'document.startReading': 'Mulai membaca',
	'document.readFullDocument': 'Baca seluruh dokumen',
	'document.section': 'Bagian',
	'document.prevSection': 'Sebelumnya',
	'document.nextSection': 'Berikutnya',
	'document.kind.conciliarConstitution': 'Konstitusi',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Deklarasi',
	'document.kind.encyclical': 'Ensiklik',
	'document.kind.apostolicExhortation': 'Anjuran Apostolik',
	'document.kind.apostolicConstitution': 'Konstitusi Apostolik',
	'document.kind.apostolicLetter': 'Surat Apostolik',
	'document.kind.cdfDeclaration': 'Deklarasi CDF',
	'document.kind.cdfInstruction': 'Instruksi CDF',
	'document.kind.cdfLetter': 'Surat CDF',
	'document.kind.cdfDoctrinalNote': 'Nota Doktrinal CDF',
	'document.kind.cdfResponsum': 'Responsum CDF',
	'document.kind.cdfConsiderations': 'Pertimbangan CDF',
	'document.kindPlural.conciliarConstitution': 'Konstitusi',
	'document.kindPlural.conciliarDecree': 'Dekret',
	'document.kindPlural.conciliarDeclaration': 'Deklarasi',
	'document.kindPlural.encyclical': 'Ensiklik',
	'document.kindPlural.apostolicExhortation': 'Anjuran Apostolik',
	'document.kindPlural.apostolicConstitution': 'Konstitusi Apostolik',
	'document.kindPlural.apostolicLetter': 'Surat Apostolik',
	'document.kindPlural.cdfDeclaration': 'Deklarasi CDF',
	'citation.unavailable': 'Tidak ada teks sumber yang tersedia untuk catatan ini.',
	'doctores.landing.title': 'Pujangga Gereja',
	'doctores.landing.tagline': 'Karya-karya teologis para Bapa dan Pujangga Gereja.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tomas Aquinas, dalam bahasa Inggris dan dalam bahasa Latin yang ia tulis.',
	'summa.tableOfContents': 'Daftar Isi',
	'summa.part': 'Bagian',
	'summa.question': 'Pertanyaan',
	'summa.article': 'Artikel',
	'summa.questionShort': 'P',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Judul dari edisi {lang}',
	'summa.titlesFromEdition': 'Judul-judul dari edisi {lang} — edisi ini tidak mencetak satu pun',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Keberatan',
	'summa.sedContra': 'Sebaliknya',
	'summa.corpus': 'Aku menjawab bahwa',
	'summa.reply': 'Jawaban atas Keberatan',
	'summa.preamble': 'Catatan',
	'summa.prevQuestion': 'Pertanyaan sebelumnya',
	'summa.nextQuestion': 'Pertanyaan berikutnya',
	'summa.noEditionInYourLanguage':
		'Summa tidak memiliki edisi dalam bahasa Anda. Ditampilkan dalam {lang}.',
	'summa.noLatinSupplement':
		'Suplemen hanya ada dalam bahasa Inggris — disusun setelah wafatnya Aquinas.',
	'index.division': 'Bagian',
	'index.showSubsections': 'Tampilkan subbagian',
	'index.hideSubsections': 'Sembunyikan subbagian',
	'prayers.landing.title': 'Doa-doa Umum',
	'prayers.landing.tagline': 'Doa dengan teks Latin di sampingnya.',
	'prayers.tableOfContents': 'Daftar Isi',
	'prayers.gloss.versicle':
		'Baris yang diucapkan atau dinyanyikan sendiri oleh pemimpin doa; umat menjawabnya dengan jawaban yang menyusul.',
	'prayers.gloss.response':
		'Baris yang diucapkan atau dinyanyikan umat bersama-sama, sebagai jawaban atas baris pemimpin sebelumnya.',
	'prayers.seeAlso': 'Lihat juga',
	'prayers.prevPrayer': 'Doa sebelumnya',
	'prayers.nextPrayer': 'Doa berikutnya',
	'prayers.rosary.today': 'Hari ini',
	'prayers.rosary.todayHeading': 'Peristiwa hari ini',
	'prayers.rosary.openingPrayer': 'Doa pembuka',
	'prayers.rosary.decadePrayers': 'Doa-doa dalam sepuluh Salam Maria',
	'ref.tooltip.loading': 'Memuat…',
	'ref.tooltip.openCcc': 'Buka di Katekismus',
	'ref.tooltip.openBible': 'Buka di Alkitab',
	'ref.tooltip.openCompendium': 'Buka di Kompendium',
	'ref.preview.open': 'Buka',
	'ref.cf': 'bdk.',
	'anchor.actions': 'Tindakan atas rujukan',
	'anchor.copy': 'Salin teks',
	'anchor.copyLink': 'Salin tautan',
	'anchor.view': 'Lihat',
	'anchor.copied': 'Tersalin',
	'anchor.copyFailed': 'Tidak dapat menyalin',
	'bookmark.add': 'Tandai',
	'bookmark.remove': 'Hapus penanda',
	'bookmark.library': 'Penanda',
	'bookmark.library.tagline': 'Segala yang Anda tandai selama membaca.',
	'bookmark.empty': 'Belum ada yang ditandai.',
	'bookmark.emptyHint':
		'Klik nomor ayat atau alinea lalu pilih Tandai, atau gunakan tombol penanda pada halaman.',
	'bookmark.about': 'Tentang penanda ini',
	'bookmark.deviceOnly':
		'Penanda hanya disimpan di peramban ini. Penanda tidak dikirim ke mana pun, dan menghapus data peramban akan menghilangkannya.',
	'bookmark.unavailable': 'Tidak ada dalam edisi yang Anda baca',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Apa situs ini, dari mana teksnya berasal, dan bagaimana sikap kami tentang memperbanyaknya.',
	'colophon.whatThisIs': 'Apa ini',
	'colophon.whatThisIsBody':
		'Glossa Catholica adalah situs bacaan untuk Kitab Suci, Katekismus, Kompendium, dan dokumen-dokumen Magisterium, dalam bahasa Inggris, Portugis, dan Latin. Situs ini ada untuk dibaca, dan tidak ada hal lain yang diminta dari Anda untuk membacanya:',
	'colophon.pointFree':
		'Gratis, dan selamanya gratis. Tanpa dinding berbayar, tanpa langganan, tidak ada yang dijual.',
	'colophon.pointNoAds': 'Tanpa iklan, dan tanpa penempatan bersponsor dalam bentuk apa pun.',
	'colophon.pointNoAccounts':
		'Tanpa akun. Tidak ada yang perlu didaftarkan, tidak ada yang perlu dimasuki.',
	'colophon.pointNoTracking':
		'Tanpa skrip pelacak, tanpa kode pihak ketiga, tanpa kuki. Hanya hitungan penggunaan anonim, tanpa apa pun yang mengidentifikasi Anda.',
	'colophon.pointOffline':
		'Dibangun agar tetap berfungsi luring setelah Anda mengunjunginya, sehingga koneksi yang buruk tidak perlu menjadi penghalang untuk membaca.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica adalah usaha pribadi kaum awam beriman. Situs ini tidak memiliki persetujuan gerejawi apa pun dan tidak berbicara dengan otoritas apa pun dari dirinya sendiri.',
	'footer.notEndorsed': 'Tanpa persetujuan Takhta Suci',
	'colophon.textsTitle': 'Teks-teksnya',
	'colophon.textsBody':
		'Setiap teks berasal dari sumber yang disebutkan namanya, dan setiap karya mencatat edisinya, halaman sumbernya, dan tanggal pengambilannya. Kitab Suci menggunakan terjemahan yang berada dalam domain publik; Katekismus, Kompendium, dan dokumen-dokumen Magisterium berasal dari teks-teks yang diterbitkan oleh Takhta Suci sendiri.',
	'colophon.textsFidelity':
		'Teks tidak pernah diringkas, tidak pernah diparafrasekan, tidak pernah ditulis ulang, dan tidak pernah ditempatkan di samping iklan. Kami memang memperbaiki cacat yang nyata — sebuah kata yang hilang, kutipan yang rusak, markah yang menelan satu paragraf — selalu ke arah apa yang dicetak oleh sumbernya sendiri, tidak pernah ke arah apa yang kami pikir seharusnya dikatakannya.',
	'colophon.countBible': 'edisi Alkitab',
	'colophon.countDocuments': 'dokumen Magisterium',
	'colophon.privacyTitle': 'Privasi',
	'colophon.privacyBody1':
		'Tanpa akun, tanpa kuki, tanpa iklan, tanpa kode pihak ketiga. Tidak ada yang mengikuti Anda keluar dari situs ini.',
	'colophon.privacyBody2':
		'Kami memang menghitung bagaimana situs ini digunakan: satu pengukuran per kunjungan, setiap kolom berupa rentang dan bukan nilai pasti — berapa lama Anda tinggal, seberapa sering Anda ke sini, karya apa yang Anda buka. Negara Anda dihitung secara terpisah, tanpa ada yang menghubungkannya dengan yang lain. Ini menggambarkan sebuah kunjungan, bukan seorang pengunjung, dan disimpan selama {days} hari.',
	'colophon.privacyBody3':
		'Tidak pernah dikirim: apa yang Anda ketik ke kotak pencarian, bagian mana yang sedang Anda buka, atau apa pun yang dapat mengenali perangkat Anda kembali. Pengaturan, penanda, dan teks unduhan Anda tetap berada di perangkat Anda.',
	'colophon.copyrightTitle': 'Hak cipta',
	'colophon.copyrightBody1':
		'Katekismus, Kompendium, dan dokumen-dokumen Magisterium adalah milik para pemegang haknya — terutama Libreria Editrice Vaticana dan Dikasteri untuk Komunikasi.',
	'colophon.copyrightBody2':
		'Setiap karya menampilkan pemberitahuan hak cipta milik pemegang haknya sendiri, dengan kata-kata mereka, dan menautkan ke halaman asal pengambilannya.',
	'colophon.copyrightBody3':
		'Jika Anda memegang hak atas teks mana pun di sini dan lebih menghendaki agar teks itu tidak diterbitkan, tulislah kepada kami.',
	'colophon.contactTitle': 'Kontak',
	'colophon.contactBody': 'Untuk hal apa pun, termasuk hal di atas:',
	'colophon.contactPending':
		'Alamat kontak belum ditetapkan. Situs ini tidak boleh dipublikasikan sebelum memilikinya — komitmen di atas tidak bermakna tanpa cara untuk menghubungi kami.',
	'colophon.illustrationsTitle': 'Ilustrasi',
	'colophon.illustrationsBody':
		'Alkitab memuat ukiran-ukiran Gustave Doré, masing-masing ditempatkan pada ayat yang digambarkannya — yang terakhir dan terbesar dari siklus-siklus Alkitabnya, dipahat pada kayu dari gambar-gambarnya dan dicetak bersama teks alih-alih dikumpulkan di bagian belakang.',
	'colophon.illustrationsRights':
		'Semuanya berada dalam domain publik, sebagaimana ditunjukkan oleh tahun-tahun di bawah ini, dan reproduksi fotografis yang setia dari sebuah ukiran domain publik tidak membawa hak cipta baru apa pun.',
	'colophon.countPlates': 'ukiran',
	'colophon.countPlateChapters': 'bab berilustrasi',
	'plates.scansBy': 'Pindaian disediakan oleh',
	'plates.enlarge': 'Perbesar {title}',
	'plates.zoom': 'Perbesar',
	'art.about': 'Tentang gambar ini',
	'art.detail': 'detail',
	'colophon.typeTitle': 'Hurufnya',
	'colophon.typeBody':
		'Disusun dalam EB Garamond, kebangkitan kembali oleh Georg Duffner dan Octavio Pardo atas huruf-huruf yang dipahat Claude Garamont pada tahun 1590-an — tradisi humanis yang telah dipakai Gereja untuk mencetak sejak Renaisans. Huruf Kirilnya berasal dari tangan yang sama tetapi tidak membangkitkan apa pun: tidak pernah ada Garamond Kiril yang dipahat, sehingga bahasa Rusia disusun dalam bentuk yang digambar agar berdiri berdampingan dengan yang lain.',
	'colophon.typeArabic':
		'Bahasa Arab sama sekali di luar jangkauannya, dan disusun dalam Amiri — kebangkitan kembali oleh Khaled Hosny atas naskh yang dipahat untuk percetakan Bulaq di Kairo pada tahun 1905, dipilih dengan alasan yang sama seperti huruf teksnya: sebuah huruf buku historis tertentu, bukan gambar kontemporer.',
	'colophon.typeInitials':
		'Huruf-huruf inisial pembuka adalah Pirata One, huruf gotik yang huruf kapitalnya tetap terbaca pada ukuran yang dituntut sebuah inisial, dan — untuk bahasa Rusia — Ponomar, yang mereproduksi huruf Slavonik Gereja dari Percetakan Sinode. Ponomar menyusun inisialnya dan tidak pernah teksnya: sebuah ensiklik modern yang seluruhnya disusun dalam huruf Sinode akan mengatakan sesuatu yang tidak benar tentang apa dirinya. Semuanya dilisensikan di bawah SIL Open Font License dan disajikan dari situs ini alih-alih dari pihak ketiga, sehingga membaca sebuah halaman tidak meminta apa pun dari peladen orang lain.',
	'refs.citedIn': 'Dikutip di',
	'refs.externalVolume': 'Volume {volume} di {host} — PDF hasil pindaian',
	'bible.wholeChapter': 'Bab ini',
	'bible.verseNotInEdition':
		'Nomor ayat ini tidak ada dalam edisi ini — lihat catatan pada sumber halaman',
	'bible.verseAbbrev': 'ay.',
	'bible.note': 'Catatan',
	'bible.noteMissing': 'Catatan ini tidak ada dalam korpus',
	'bible.chapterArgument': 'Ringkasan',
	'ccc.readFullChapter': 'Baca seluruh bab',
	'ccc.noParagraphNumber': 'Tidak ada nomor alinea dalam korpus ini',
	'copyright.sourceTitle': 'Buka halaman sumber aslinya',
	'copyright.sourceLabel': 'Sumber',
	'lang.label': 'Bahasa',
	'lang.filter': 'Cari bahasa',
	'lang.more': 'bahasa lainnya',
	'notFound.title': 'Tidak ada apa pun di alamat ini',
	'notFound.lede': 'Halaman yang Anda minta tidak ada di sini.',
	'notFound.body':
		'Tautannya mungkin salah ketik atau sudah usang, atau mungkin menunjuk ke teks yang tidak dimuat situs ini.',
	'notFound.searchHint':
		'Jika Anda tahu rujukan yang Anda cari — sebuah kitab dan bab, sebuah alinea Katekismus — ketikkan ke kotak pencarian di bagian atas halaman ini.',
	'notFound.credit': 'Berdasarkan British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Atau mulailah dari salah satu berikut:',
	'notFound.home': 'Beranda',
	'compare.enter': 'Bandingkan edisi',
	'compare.exit': 'Keluar dari perbandingan',
	'compare.missing': 'Tidak ada dalam edisi ini',
	'compare.versificationNote':
		'Kedua edisi ini membagi ayat-ayat bab ini secara berbeda di beberapa tempat (varian tekstual, bukan pilihan terjemahan) — nomor ayat yang sama tidak selalu menandai kalimat yang sama di kedua kolom.',
	'compare.loading': 'Memuat bahasa kedua…',
	'ui.close': 'Tutup',
	'shortcuts.title': 'Pintasan papan ketik',
	'shortcuts.betweenDocuments': 'Antar dokumen',
	'shortcuts.withinDocument': 'Di dalam dokumen',
	'shortcuts.show': 'Tampilkan daftar ini',
	'help.title': 'Bantuan',
	'help.reading.heading': 'Bilah di atas sebuah teks',
	'help.feature.offline':
		'Tambahkan situs ini ke layar utama Anda dan ia terbuka seperti aplikasi. Anda dapat mengunduh karya-karya utuh untuk dibaca tanpa koneksi.',
	'help.feature.contents':
		'Pembagian karya tempat Anda berada — kitab, bagian, bab — supaya Anda dapat bergerak di dalamnya tanpa kembali ke awal.',
	'help.feature.compare':
		'Dua edisi dari bagian yang sama, berdampingan — bahasa Latin di samping bahasa Anda sendiri, atau satu terjemahan di samping yang lain.',
	'help.feature.apparatus':
		'Catatan edisi itu sendiri, dan setiap tafsir yang ditulis atas teks, disajikan di sampingnya dan bukan di bawahnya. Kutipan di dalam teks adalah pranala, sehingga sebuah rujukan menuju ke tempat yang ditunjuknya.',
	'help.feature.focus':
		'Membersihkan segalanya kecuali teks. Jalan keluar tetap di tempat bilah tadi berada, sehingga tidak ada yang terkurung di baliknya.',
	'zen.enter': 'Mode fokus',
	'zen.exit': 'Keluar dari mode fokus',
	'nav.calendar': 'Kalender',
	'calendar.title': 'Kalender liturgi',
	'calendar.tagline':
		'Kalender Romawi Umum, dihitung untuk hari mana pun — masanya, tingkatnya, warnanya.',
	'calendar.national.tagline': '{name}, dengan perayaan khasnya, dihitung untuk hari mana pun.',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Kalender Romawi Umum',
	'calendar.filter': 'Cari negara',
	'calendar.region.europe': 'Eropa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Timur Tengah',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oseania',
	'calendar.today': 'Hari ini',
	'calendar.previousMonth': 'Bulan sebelumnya',
	'calendar.nextMonth': 'Bulan berikutnya',
	'calendar.plainDays': 'Hari biasa saja',
	'calendar.noSuchDay': 'Tidak ada hari liturgi yang dihitung untuk tanggal itu.',
	'calendar.week': 'pekan',
	'calendar.alsoToday': 'Hari ini juga dirayakan',
	'calendar.alsoObserved': 'Hari ini juga diperingati',
	'calendar.obligation': 'Hari raya wajib',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Siklus hari Minggu',
	'calendar.weekdayCycle': 'Siklus hari biasa',
	'calendar.psalterWeek': 'Pekan mazmur',
	'lectionary.heading': 'Bacaan Misa',
	'lectionary.slot.reading': 'Bacaan',
	'lectionary.slot.reading1': 'Bacaan Pertama',
	'lectionary.slot.reading2': 'Bacaan Kedua',
	'lectionary.slot.reading3': 'Bacaan Ketiga',
	'lectionary.slot.reading4': 'Bacaan Keempat',
	'lectionary.slot.reading5': 'Bacaan Kelima',
	'lectionary.slot.reading6': 'Bacaan Keenam',
	'lectionary.slot.reading7': 'Bacaan Ketujuh',
	'lectionary.slot.psalm': 'Mazmur Tanggapan',
	'lectionary.slot.epistle': 'Surat',
	'lectionary.slot.acclamation': 'Bait Pengantar Injil',
	'lectionary.slot.gospel': 'Injil',
	'lectionary.slot.sequence': 'Sekuensia',
	'lectionary.or': 'atau',
	'lectionary.cf': 'Bdk.',
	'lectionary.about': 'Tentang bacaan ini',
	'lectionary.caveat':
		'Bacaan-bacaan yang ditetapkan oleh Ordo Lectionum Missae, ditautkan ke edisi situs ini sendiri — bukan terjemahan yang dibacakan di gereja tertentu, dan sebuah konferensi waligereja dapat menyesuaikan jadwalnya.',
	'calendar.transferredFrom': 'Dipindahkan dari',
	'calendar.season.advent': 'Masa Adven',
	'calendar.season.christmas': 'Masa Natal',
	'calendar.season.lent': 'Masa Prapaskah',
	'calendar.season.triduum': 'Trihari Paskah',
	'calendar.season.easter': 'Masa Paskah',
	'calendar.season.ordinary': 'Masa Biasa',
	'calendar.colour.white': 'Putih',
	'calendar.colour.red': 'Merah',
	'calendar.colour.green': 'Hijau',
	'calendar.colour.violet': 'Ungu',
	'calendar.colour.rose': 'Merah muda',
	'calendar.colour.black': 'Hitam',
	'calendar.colour.blue': 'Biru',
	'calendar.rank.solemnity': 'Hari Raya',
	'calendar.rank.feast': 'Pesta',
	'calendar.rank.memorial': 'Peringatan wajib',
	'calendar.rank.optional-memorial': 'Peringatan fakultatif',
	'calendar.rank.commemoration': 'Kenangan',
	'calendar.rank.sunday': 'Hari Minggu',
	'calendar.rank.weekday': 'Hari biasa',
	'calendar.gloss.season.advent':
		'Empat pekan sebelum Natal: persiapan menyambut kedatangan Tuhan, dan awal tahun Gereja.',
	'calendar.gloss.season.christmas':
		'Dari Hari Natal sampai Pembaptisan Tuhan, merayakan kelahiran Tuhan dan penampakan-Nya kepada dunia.',
	'calendar.gloss.season.lent':
		'Empat puluh hari dari Rabu Abu sampai Misa sore Perjamuan Tuhan: pertobatan, sedekah, dan persiapan menyambut Paskah.',
	'calendar.gloss.season.triduum':
		'Tiga hari dari sore Kamis Putih sampai sore Minggu Paskah — sengsara, wafat, dan kebangkitan Tuhan, puncak seluruh tahun.',
	'calendar.gloss.season.easter':
		'Lima puluh hari dari Paskah sampai Pentakosta, dirayakan sebagai satu pesta tunggal — „satu hari Minggu yang besar“.',
	'calendar.gloss.season.ordinary':
		'Tiga puluh tiga atau tiga puluh empat pekan di luar masa-masa lain. Bukan „biasa saja“ melainkan tertata: pekan-pekannya dihitung, dan Gereja membaca hidup serta ajaran Tuhan berturut-turut. Ia datang dalam dua penggal — sesudah Masa Natal sampai Prapaskah, dan sesudah Pentakosta sampai Adven.',
	'calendar.gloss.rank.solemnity':
		'Tingkat tertinggi: Paskah, Natal, Kenaikan, pelindung suatu tempat. Dirayakan dengan Kemuliaan dan Syahadat, dan dimulai pada sore sebelumnya.',
	'calendar.gloss.rank.feast':
		'Dirayakan di dalam hari itu sendiri. Para rasul dan penginjil, serta hari-hari yang lebih besar dari Tuhan dan Santa Perawan Maria.',
	'calendar.gloss.rank.memorial':
		'Seorang kudus yang dikenang pada harinya, di dalam Misa dan Ibadat Harian masa itu. Wajib di tempat ia dirayakan.',
	'calendar.gloss.rank.optional-memorial':
		'Boleh dirayakan atau tidak, sesuai pilihan imam atau jemaat. Bila tidak dirayakan, hari itu sekadar hari biasa.',
	'calendar.gloss.rank.commemoration':
		'Yang terjadi pada suatu peringatan dalam masa Prapaskah: sebuah doa yang ditambahkan pada Misa hari biasa, yang selebihnya dipertahankan utuh oleh masa itu.',
	'calendar.gloss.rank.sunday':
		'Hari raya yang pertama — Hari Tuhan, dirayakan tiap pekan sejak kebangkitan. Hanya hari raya atau pesta Tuhan yang boleh menggesernya, dan pada Adven, Prapaskah, dan Masa Paskah bahkan itu pun tidak.',
	'calendar.gloss.rank.weekday':
		'Hari tanpa perayaan sendiri. Misa dan Ibadat Harian adalah milik masanya — dan justru itulah yang membuat masa liturgi layak dikenal.',
	'calendar.gloss.colour.white':
		'Sukacita. Masa Paskah dan Masa Natal, hari-hari Tuhan di luar sengsara-Nya, Santa Perawan Maria, para malaikat, dan para kudus yang bukan martir.',
	'calendar.gloss.colour.red':
		'Darah dan api. Minggu Palma dan Jumat Agung, Pentakosta, para rasul dan penginjil, serta para martir.',
	'calendar.gloss.colour.green': 'Masa Biasa: warna harapan, dan warna hal-hal yang bertumbuh.',
	'calendar.gloss.colour.violet': 'Adven dan Prapaskah, dan dikenakan pula pada Misa arwah.',
	'calendar.gloss.colour.rose':
		'Dikenakan dua kali setahun — pada Minggu Gaudete, Minggu ketiga Adven, dan Minggu Laetare, Minggu keempat Prapaskah — di mana puasa melonggar dan akhirnya sudah tampak.',
	'calendar.gloss.colour.black': 'Boleh dikenakan pada Misa arwah.',
	'calendar.gloss.colour.blue':
		'Hak istimewa warna biru: dikenakan pada Maria Dikandung Tanpa Noda di Spanyol, di Filipina, dan di sedikit tempat lain yang telah diberi izin oleh Takhta Suci.',
	'calendar.gloss.sundayCycle':
		'Bacaan hari Minggu berjalan dalam tiga tahun — A, B, dan C — membaca Matius, Markus, dan Lukas bergantian, dengan Yohanes sepanjang Prapaskah dan Masa Paskah. Siklusnya berganti pada Minggu Adven I, bersama tahun Gereja.',
	'calendar.gloss.weekdayCycle':
		'Bacaan hari biasa berjalan dalam dua tahun, I dan II: bacaan pertama berganti, Injilnya tidak. Suatu tahun liturgi dinamai menurut tahun kalender tempat ia berakhir — tahun ganjil adalah I, tahun genap II.',
	'calendar.gloss.psalterWeek':
		'Ibadat Harian membagi mazmur atas empat pekan, I sampai IV, yang berulang sepanjang tahun. Inilah pekan yang mazmurnya berlaku hari ini, bagi siapa pun yang mendoakan Ibadat Harian.',
	'calendar.gloss.obligation':
		'Hari ketika umat beriman wajib mengambil bagian dalam Misa dan menjauhi pekerjaan yang menghalanginya. Setiap hari Minggu, dan hari-hari lain yang telah ditetapkan oleh masing-masing konferensi para uskup.',
	'calendar.primer.title': 'Baru di sini?',
	'calendar.primer.lead':
		'Gereja memelihara tahunnya sendiri. Ia mulai dengan Adven, berputar di sekitar Paskah, dan memberi setiap hari sebuah nama, sebuah tingkat, dan sebuah warna — dan ketiganya menentukan apa yang didoakan dan dibacakan pada hari itu dalam Misa dan Ibadat Harian. Jadi „Hari Minggu Biasa XXIII“ adalah sebuah alamat: ia memberitahu seorang imam, sebuah paduan suara, atau siapa pun yang berdoa di rumah, doa dan bacaan mana yang menjadi milik hari ini.',
	'calendar.primer.seasons': 'Masa-masa liturgi',
	'calendar.primer.ranks': 'Suatu hari bisa menjadi apa',
	'calendar.primer.colours': 'Warna-warna',
	'calendar.primer.cycles': 'Siklus-siklus',
	'calendar.primer.cyclesLead':
		'Tiga penghitung yang bersama-sama menyatakan bacaan dan mazmur mana yang ditentukan untuk hari ini.'
};
