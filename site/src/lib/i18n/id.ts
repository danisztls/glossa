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
	'jumpbox.placeholder': 'Lompat ke… (mis. jn 3:16, ccc 1234)',
	'jumpbox.short': 'Cari',
	'jumpbox.hint': 'Tekan / atau Ctrl+K untuk melompat ke suatu rujukan',
	'jumpbox.noMatch': 'Tidak ada yang cocok',
	'jumpbox.suggestions': 'Saran',
	'settings.label': 'Pengaturan',
	'darkMode.label': 'Mode gelap',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Nyala',
	'darkMode.off': 'Mati',
	'loadFailed.title': 'Itu tidak termuat',
	'loadFailed.hint':
		'Halamannya ada — ada yang salah saat mengambilnya. Mencoba lagi biasanya berhasil.',
	'loadFailed.retry': 'Coba lagi',
	'loadFailed.retrying': 'Mencoba…',
	'fontSize.label': 'Ukuran teks',
	'fontSize.larger': 'Teks lebih besar',
	'fontSize.smaller': 'Teks lebih kecil',
	'print.label': 'Cetak halaman ini',
	'toTop.label': 'Kembali ke atas',
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
	'bible.landing.books': 'Kitab',
	'bible.introduction': 'Pengantar',
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
	'ccc.landing.title': 'Katekismus Gereja Katolik',
	'ccc.landing.pairTitle': 'Katekismus dan Kompendium',
	'ccc.landing.tagline':
		'<strong>Katekismus</strong> memaparkan ajaran Katolik dalam 2.865 alinea bernomor. <strong>Kompendium</strong> menyajikan ajaran yang sama sebagai 598 tanya jawab, menurut kerangka yang sama.',
	'ccc.landing.pairTagline':
		'Katekismus Gereja Katolik dalam 2.865 nomor, dan Kompendiumnya dalam 598 pertanyaan.',
	'ccc.abbrev': 'KGK',
	'compendium.abbrev': 'Komp.',
	'document.library.tagline': 'Ensiklik, konstitusi konsili, dekret, dan deklarasi Magisterium.',
	'doctores.landing.title': 'Pujangga Gereja',
	'doctores.landing.tagline': 'Karya-karya teologis para Bapa dan Pujangga Gereja.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline':
		'Tomas Aquinas, dalam bahasa Inggris dan dalam bahasa Latin yang ia tulis.',
	'index.division': 'Bagian',
	'prayers.landing.title': 'Doa-doa Umum',
	'prayers.landing.tagline': 'Doa dengan teks Latin di sampingnya.',
	'prayers.seeAlso': 'Lihat juga',
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
	'art.about': 'Tentang gambar ini',
	'art.detail': 'detail',
	'colophon.typeTitle': 'Hurufnya',
	'colophon.typeBody':
		'Disusun dalam EB Garamond, kebangkitan kembali oleh Georg Duffner dan Octavio Pardo atas huruf-huruf yang dipahat Claude Garamont pada tahun 1590-an — tradisi humanis yang telah dipakai Gereja untuk mencetak sejak Renaisans. Huruf Kirilnya berasal dari tangan yang sama tetapi tidak membangkitkan apa pun: tidak pernah ada Garamond Kiril yang dipahat, sehingga bahasa Rusia disusun dalam bentuk yang digambar agar berdiri berdampingan dengan yang lain.',
	'colophon.typeArabic':
		'Bahasa Arab sama sekali di luar jangkauannya, dan disusun dalam Amiri — kebangkitan kembali oleh Khaled Hosny atas naskh yang dipahat untuk percetakan Bulaq di Kairo pada tahun 1905, dipilih dengan alasan yang sama seperti huruf teksnya: sebuah huruf buku historis tertentu, bukan gambar kontemporer.',
	'colophon.typeInitials':
		'Huruf-huruf inisial pembuka adalah Pirata One, huruf gotik yang huruf kapitalnya tetap terbaca pada ukuran yang dituntut sebuah inisial, dan — untuk bahasa Rusia — Ponomar, yang mereproduksi huruf Slavonik Gereja dari Percetakan Sinode. Ponomar menyusun inisialnya dan tidak pernah teksnya: sebuah ensiklik modern yang seluruhnya disusun dalam huruf Sinode akan mengatakan sesuatu yang tidak benar tentang apa dirinya. Semuanya dilisensikan di bawah SIL Open Font License dan disajikan dari situs ini alih-alih dari pihak ketiga, sehingga membaca sebuah halaman tidak meminta apa pun dari peladen orang lain.',
	'copyright.sourceTitle': 'Buka halaman sumber aslinya',
	'copyright.sourceLabel': 'Sumber',
	'lang.label': 'Bahasa',
	'lang.filter': 'Cari bahasa',
	'lang.more': 'bahasa lainnya'
};
