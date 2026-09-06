/**
 * Tiếng Việt UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 8 editions in Tiếng Việt and its readers were reading
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

export const vi: Dictionary = {
	'nav.bible': 'Kinh Thánh',
	'nav.ccc': 'Giáo lý',
	'nav.compendium': 'Bản Toát yếu',
	'nav.magisterium': 'Huấn quyền',
	'nav.socialDoctrine': 'Học thuyết xã hội',
	'socialDoctrine.landing.title': 'Tóm lược Học thuyết Xã hội của Giáo hội',
	'socialDoctrine.landing.tagline': 'Điều Giáo hội dạy về đời sống xã hội, trong 583 số.',
	'nav.canonLaw': 'Giáo luật',
	'canonLaw.landing.title': 'Bộ Giáo luật',
	'canonLaw.landing.tagline':
		'Luật của Giáo hội Latinh, trong 1.752 điều luật chia thành bảy quyển.',
	'canonLaw.canon': 'Đ.',
	'canonLaw.canons': 'Đ.',
	'canonLaw.prevCanon': 'Điều trước',
	'canonLaw.nextCanon': 'Điều sau',
	'canonLaw.readFullTitle': 'Đọc trọn thiên',
	'canonLaw.superseded': 'Bản văn được thay thế bởi',
	'nav.prayers': 'Kinh nguyện',
	'nav.bookmarks': 'Dấu trang',
	'nav.menu': 'Trình đơn',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Đọc tiếp',
	'home.tagline':
		'Một trang đọc Kinh Thánh, Sách Giáo lý và các văn kiện của Huấn quyền — miễn phí, chạy được cả khi ngoại tuyến, và không có gì để ghi danh.',
	'home.doors.heading': 'Đi đâu',
	'home.find.heading': 'Hoặc gõ một trưng dẫn',
	'nav.library': 'Thư viện',
	'nav.learn': 'Học',
	'library.landing.tagline':
		'Toàn bộ kho sách, từng kệ một — cùng với chỗ bạn đang đọc dở và những gì bạn đã đánh dấu.',
	'schola.landing.title': 'Bắt đầu từ đâu',
	'schola.landing.tagline':
		'Một chỉ dẫn ngắn về những gì có ở đây: mỗi cuốn sách này là gì, một trưng dẫn nó được viết thế nào, tìm một đoạn ra sao, và những thứ tự đọc mà Hội Thánh đã đề nghị.',
	'schola.start.heading': 'Nếu tất cả những điều này còn mới với bạn',
	'schola.start.body': 'Khởi đầu tốt nhất là ',
	'schola.start.bodyAfter':
		': cùng một giáo huấn như Sách Giáo lý, ngắn hơn nhiều, viết theo lối hỏi thưa. Nó dài chừng một phần mười và không giả định điều gì trước.',
	'schola.bible.heading': 'Nếu bạn chưa bao giờ đọc Kinh Thánh',
	'schola.bible.library':
		'Đó không phải một cuốn sách mà là bảy mươi ba cuốn, viết trong hơn một ngàn năm và đóng lại theo thứ tự Hội Thánh đã định — không phải thứ tự các việc đã xảy ra, cũng không phải thứ tự dễ đọc nhất. Phần đông bắt đầu ở trang thứ nhất rồi vài tuần sau bỏ dở, giữa một chương dài của luật cổ, bởi chưa ai nói cho họ biết nó dùng để làm gì.',
	'schola.bible.step.gospel': 'Hãy bắt đầu bằng một sách Tin Mừng',
	'schola.bible.start':
		'Một trong bốn cuốn ngắn về cuộc đời Đức Giêsu, nằm sâu bên trong chứ không ở đầu. Đó không phải ý của chúng tôi: một Công đồng của Hội Thánh đã xin dạy cách dùng Kinh Thánh cho đúng, „nhất là Tân Ước và trước hết là các sách Tin Mừng“. Công đồng không nêu tên cuốn nào, và chúng tôi cũng không.',
	'schola.bible.whichGospel':
		'Ba cuốn thường được đề nghị, vì ba lý do khác nhau. Cuốn nào cũng là một chỗ tốt để ở lại.',
	'schola.bible.gospel.mark':
		'Ngắn nhất. Bạn có thể đọc trọn trong một buổi chiều, và lúc khởi đầu, đọc xong một cuốn đáng giá hơn là đã chọn được cuốn hay nhất.',
	'schola.bible.gospel.luke':
		'Viết cho một người ngoài đức tin muốn câu chuyện được ghi lại có thứ tự — điều có thể đúng với chính bạn. Nó chạy thẳng sang sách Công vụ Tông đồ, nên thật ra là nửa đầu của một cuốn sách dài hơn.',
	'schola.bible.gospel.john':
		'Cuốn nói thẳng ra vì sao nó được viết: „để anh em tin“. Lời lẽ đơn sơ, và đi thẳng vào câu hỏi Đức Giêsu là ai.',
	'schola.bible.step.acts': 'Rồi đến chuyện xảy ra sau đó',
	'schola.bible.thenActs':
		'Khi đã đọc xong một cuốn, hãy đọc xem những người từng biết Người đã làm gì sau khi Người ra đi.',
	'schola.bible.acts.why':
		'Ba mươi năm sau khi các sách Tin Mừng khép lại: vài chục con người sợ hãi, và cách điều họ đã thấy lan tới đầu kia của đế quốc.',
	'schola.bible.step.old': 'Rồi đến nửa cổ hơn',
	'schola.bible.thenOld':
		'Không phải từ trang đầu, và không phải tất cả. Một ít chỗ mang lấy câu chuyện, và đó chính là những chỗ các sách Tin Mừng không ngừng quy chiếu về.',
	'schola.bible.ot.beginnings': 'Nó bắt đầu thế nào, và hỏng đi ra sao.',
	'schola.bible.ot.promise':
		'Một gia đình, và một lời hứa ban cho nó, sống lâu hơn mọi người trong nó.',
	'schola.bible.ot.exodus':
		'Một dân được đưa ra khỏi cảnh nô lệ, và một lề luật ban cho họ để sống.',
	'schola.bible.ot.psalms':
		'Không phải một câu chuyện: một trăm năm mươi lời kinh và bài ca. Hãy đọc từng bài, theo thứ tự nào cũng được. Hội Thánh vẫn đọc những bài này mỗi ngày.',
	'schola.bible.bothWays':
		'Bạn sẽ nhận ra nhiều điều, và đó là chủ ý chứ không phải tình cờ. Hội Thánh đọc các sách cổ hơn dưới ánh sáng Đức Kitô và các sách mới hơn dưới ánh sáng những gì đi trước — mỗi nửa giải thích nửa kia, và vì thế không nửa nào được đọc riêng một mình.',
	'schola.guide.heading': 'Tìm đường',
	'schola.guide.lede':
		'Bản văn là cả trang; mọi thứ còn lại là một nút điều khiển mà bạn có thể bỏ qua cho tới khi cần đến.',
	'schola.guide.top.heading': 'Thanh ở đầu mỗi trang',
	'schola.guide.reading.heading': 'Thanh phía trên một bản văn',
	'schola.feature.search':
		'Gõ một trưng dẫn vào ô trên cùng — chương và câu, một số mục, tên một văn kiện — và nó tự hoàn tất khi bạn gõ. Bấm / hoặc Ctrl+K từ bất cứ đâu, và ? để xem các phím tắt khác.',
	'schola.feature.languages':
		'Giao diện và bản văn được chọn riêng, nên bạn có thể đọc một tác phẩm bằng một ngôn ngữ trong khi các nút vẫn ở ngôn ngữ khác. Nơi một tác phẩm có nhiều bản in trong ngôn ngữ của bạn, bạn cũng chọn giữa chúng.',
	'schola.feature.settings':
		'Cỡ chữ, sáng hay tối, sắc nâu, và bạn muốn bao nhiêu phần chú giải nằm cạnh bản văn.',
	'schola.feature.offline':
		'Thêm trang này vào màn hình chính thì nó mở ra như một ứng dụng. Bạn có thể tải trọn các tác phẩm để đọc khi không có kết nối.',
	'schola.feature.contents':
		'Các phân chia của tác phẩm bạn đang ở trong — quyển, phần, chương — để đi lại bên trong nó mà không phải trở về đầu.',
	'schola.feature.compare':
		'Hai bản in của cùng một đoạn, đặt cạnh nhau — tiếng Latinh bên cạnh ngôn ngữ của bạn, hoặc bản dịch này bên cạnh bản dịch kia.',
	'schola.feature.apparatus':
		'Các chú thích của chính bản in, và mọi lời chú giải viết về bản văn, được đặt bên cạnh chứ không phải bên dưới. Những trưng dẫn trong bản văn là liên kết, nên một quy chiếu dẫn tới đúng nơi nó chỉ.',
	'schola.feature.focus':
		'Dọn hết mọi thứ trừ bản văn. Lối ra vẫn ở nơi thanh vốn nằm, để không gì bị kẹt phía sau.',
	'schola.books.heading': 'Ở đây có gì, và trưng dẫn thế nào',
	'schola.books.lede':
		'Mỗi cuốn trong số này là một loại sách khác nhau, và mỗi cuốn được quy chiếu bằng một con số riêng. Các thí dụ cho thấy dạng thức: gõ một dạng như thế vào ô tìm và bạn tới đúng đoạn.',
	'schola.cite.label': 'Trưng dẫn là',
	'schola.what.scripture':
		'Kinh Thánh như Hội Thánh lãnh nhận, trong cả hai Giao ước. Mọi thứ khác ở đây được đọc dưới ánh sáng của nó.',
	'schola.cite.scripture': 'sách, chương và câu, theo các chữ tắt mà bản in của bạn dùng',
	'schola.what.catechism':
		'Bản tóm lược điều Hội Thánh Công giáo tin, gói trong một cuốn. Tự nó không phải là nguồn: nó quy tụ Kinh Thánh, các giáo phụ, phụng vụ và giáo huấn của Hội Thánh, và mỗi số đều nói điều mình phát biểu đến từ đâu.',
	'schola.cite.catechism': 'theo số, chạy liền một mạch từ trang đầu đến trang cuối',
	'schola.what.compendium':
		'Cùng một giáo huấn trình bày theo lối hỏi thưa, dài chừng một phần mười.',
	'schola.cite.compendium': 'theo số câu hỏi',
	'schola.what.magisterium':
		'Những gì các giáo hoàng và các công đồng đã thực sự viết — thông điệp, hiến chế, sắc lệnh, tuyên ngôn — mỗi văn kiện ngỏ với một thời điểm và một vấn đề nhất định. Mỗi văn kiện được gọi theo những chữ Latinh mở đầu của nó.',
	'schola.cite.magisterium': 'theo tên văn kiện, rồi một số mục bên trong nó',
	'schola.what.social':
		'Giáo huấn của Hội Thánh về lao động, sở hữu, gia đình, chính trị và hòa bình, gom từ các văn kiện ấy vào một cuốn.',
	'schola.cite.social': 'theo số, dưới chữ tắt mà tác phẩm dùng cho chính nó',
	'schola.what.law': 'Luật chứ không phải đạo lý. Nó nói điều Hội Thánh đòi hỏi, và được tu chính.',
	'schola.cite.law': 'theo điều, tên gọi các đơn vị đánh số của nó',
	'schola.what.doctors':
		'Các nhà thần học được Hội Thánh tuyên phong là Tiến sĩ. Điều đó không mang thẩm quyền chính thức, dù tác giả lớn đến đâu.',
	'schola.cite.doctors': 'theo phần, rồi vấn đề — những phân chia riêng của bộ Tổng luận',
	'schola.what.prayers': 'Những lời Hội Thánh cầu nguyện, có tiếng Latinh bên cạnh.',
	'schola.cite.prayers': 'theo tên; không có số nào để trưng dẫn',
	'schola.places.heading': 'Không phải bản văn, mà là những nơi trên trang này',
	'schola.what.library':
		'Mọi tác phẩm của trang trong một danh mục, nhóm theo chủ đề chứ không theo loại.',
	'schola.what.calendar':
		'Ngày phụng vụ — mùa, màu, và ai được kính nhớ — cho quốc gia mà bạn theo lịch của họ.',
	'schola.what.bookmarks':
		'Những đoạn bạn đã đánh dấu, và nơi bạn dừng lại lần cuối trong mỗi tác phẩm. Cả hai được giữ trong trình duyệt này và không gửi đi đâu cả.',
	'jumpbox.placeholder': 'Đi tới… (vd. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Tìm',
	'jumpbox.hint': 'Nhấn / hoặc Ctrl+K để đi tới một trưng dẫn',
	'jumpbox.noMatch': 'Không tìm thấy',
	'jumpbox.suggestions': 'Gợi ý',
	'settings.label': 'Cài đặt',
	'darkMode.label': 'Chế độ tối',
	'darkMode.auto': 'Tự động',
	'darkMode.on': 'Bật',
	'darkMode.off': 'Tắt',
	'loadFailed.title': 'Trang đó không tải được',
	'loadFailed.hint': 'Trang vẫn có — có gì đó trục trặc khi lấy về. Thử lại thường là được.',
	'loadFailed.retry': 'Thử lại',
	'loadFailed.retrying': 'Đang thử…',
	'fontSize.label': 'Cỡ chữ',
	'fontSize.larger': 'Chữ lớn hơn',
	'fontSize.smaller': 'Chữ nhỏ hơn',
	'print.label': 'In trang này',
	'toTop.label': 'Trở lên đầu trang',
	'edition.label': 'Bản in',
	'edition.select': 'Chọn bản in',
	'edition.current': 'Bản in hiện tại',
	'edition.filter': 'Tìm bản in',
	'menu.noMatches': 'Không có kết quả',
	'unitNav.previous': 'Trước',
	'unitNav.next': 'Tiếp',
	'bible.prevChapter': 'Chương trước',
	'bible.nextChapter': 'Chương sau',
	'bible.pickBook': 'Sách và chương',
	'bible.landing.title': 'Kinh Thánh',
	'bible.landing.tagline': 'Đọc trọn bộ Kinh Thánh, từng cuốn một, từng chương một.',
	'bible.landing.books': 'Các sách',
	'bible.introduction': 'Dẫn nhập',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Ngũ Thư',
	'bible.group.historical': 'Các sách Lịch sử',
	'bible.group.wisdom': 'Các sách Khôn ngoan',
	'bible.group.prophetic': 'Các sách Ngôn sứ',
	'bible.group.gospels': 'Các sách Tin Mừng',
	'bible.group.acts': 'Công vụ Tông đồ',
	'bible.group.pauline': 'Các thư Phaolô',
	'bible.group.catholicLetters': 'Các thư Công giáo',
	'bible.group.revelation': 'Khải Huyền',
	'ccc.landing.title': 'Sách Giáo lý Hội Thánh Công giáo',
	'ccc.landing.pairTitle': 'Sách Giáo lý và Bản Toát yếu',
	'ccc.landing.tagline':
		'<strong>Sách Giáo lý</strong> trình bày giáo huấn Công giáo trong 2.865 số được đánh số. <strong>Bản Toát yếu</strong> trình bày cùng giáo huấn ấy dưới dạng 598 câu hỏi thưa, theo cùng một bố cục.',
	'ccc.landing.pairTagline':
		'Sách Giáo lý Hội Thánh Công giáo trong 2.865 số, và Bản Toát yếu trong 598 câu hỏi.',
	'compendium.landing.title': 'Bản Toát yếu Sách Giáo lý',
	'compendium.landing.tagline': 'Những câu hỏi thưa tóm lược Sách Giáo lý Hội Thánh Công giáo.',
	'compendium.question': 'Hỏi',
	'compendium.answer': 'Thưa',
	'compendium.tableOfContents': 'Mục lục',
	'compendium.prevQuestion': 'Câu hỏi trước',
	'compendium.nextQuestion': 'Câu hỏi sau',
	'compendium.condenses': 'Tóm lược GLHTCG ¶¶',
	'ccc.abbrev': 'GLHTCG',
	'compendium.abbrev': 'Toát yếu',
	'compendium.noQuestionNumber': 'Không có số câu hỏi trong kho văn bản này',
	'document.library.tagline':
		'Các thông điệp, hiến chế công đồng, sắc lệnh và tuyên ngôn của Huấn quyền.',
	'doctores.landing.title': 'Các Tiến sĩ Hội Thánh',
	'doctores.landing.tagline': 'Các tác phẩm thần học của các Giáo phụ và Tiến sĩ Hội Thánh.',
	'summa.landing.title': 'Tổng luận Thần học',
	'summa.landing.tagline': 'Tôma Aquinô, bằng tiếng Anh và bằng tiếng Latinh ngài đã viết.',
	'index.division': 'Phân mục',
	'prayers.landing.title': 'Kinh nguyện thông thường',
	'prayers.landing.tagline': 'Các kinh nguyện kèm bản văn Latinh bên cạnh.',
	'prayers.gloss.versicle':
		'Câu xướng — dòng mà người chủ sự đọc hoặc hát một mình. Cộng đoàn đáp lại bằng câu đáp theo sau.',
	'prayers.gloss.response':
		'Câu đáp — dòng mà cộng đoàn cùng nhau đọc hoặc hát, đáp lại câu xướng trước đó.',
	'prayers.seeAlso': 'Xem thêm',
	'anchor.actions': 'Thao tác với trưng dẫn',
	'anchor.copy': 'Chép bản văn',
	'anchor.copyLink': 'Chép liên kết',
	'anchor.view': 'Xem',
	'anchor.copied': 'Đã chép',
	'anchor.copyFailed': 'Không chép được',
	'bookmark.add': 'Đánh dấu',
	'bookmark.remove': 'Bỏ dấu trang',
	'bookmark.library': 'Dấu trang',
	'bookmark.library.tagline': 'Tất cả những gì bạn đã đánh dấu khi đọc.',
	'bookmark.empty': 'Chưa đánh dấu gì cả.',
	'bookmark.emptyHint':
		'Bấm vào số của một câu hoặc một số mục rồi chọn Đánh dấu, hoặc dùng nút dấu trang trên trang.',
	'bookmark.deviceOnly':
		'Dấu trang chỉ được giữ trong trình duyệt này. Chúng không được gửi đi đâu cả, và xoá dữ liệu trình duyệt sẽ xoá chúng.',
	'bookmark.unavailable': 'Không có trong bản in bạn đang đọc',
	'colophon.title': 'Trang ghi ấn',
	'colophon.lede':
		'Trang này là gì, các bản văn từ đâu mà có, và lập trường của chúng tôi về việc sao chép chúng.',
	'colophon.whatThisIs': 'Đây là gì',
	'colophon.whatThisIsBody':
		'Glossa Catholica là một trang đọc Kinh Thánh, Sách Giáo lý, Bản Toát yếu và các văn kiện của Huấn quyền, bằng tiếng Anh, tiếng Bồ Đào Nha và tiếng Latinh. Trang này hiện hữu để được đọc, và không đòi hỏi gì khác nơi bạn để đọc nó:',
	'colophon.pointFree':
		'Miễn phí, và luôn luôn miễn phí. Không có tường phí, không đăng ký thuê bao, không có gì để mua.',
	'colophon.pointNoAds': 'Không quảng cáo, và không có bất kỳ hình thức tài trợ nào.',
	'colophon.pointNoAccounts':
		'Không có tài khoản. Không có gì để ghi danh, không có gì để đăng nhập.',
	'colophon.pointNoTracking':
		'Không có mã theo dõi, không có mã của bên thứ ba, không có cookie. Chỉ có số liệu sử dụng ẩn danh, không có gì nhận dạng bạn.',
	'colophon.pointOffline':
		'Được dựng để tiếp tục hoạt động ngoại tuyến sau lần bạn ghé thăm đầu tiên, để một kết nối kém không phải là rào cản cho việc đọc.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica là một sáng kiến tư nhân của giáo dân. Trang này không có bất kỳ sự chuẩn nhận nào của Giáo hội và không nói với thẩm quyền riêng nào.',
	'footer.notEndorsed': 'Không được Tòa Thánh chuẩn nhận',
	'colophon.textsTitle': 'Các bản văn',
	'colophon.textsBody':
		'Mỗi bản văn đều đến từ một nguồn được nêu tên, và mỗi tác phẩm đều ghi lại ấn bản, trang nguồn và ngày được lấy về. Kinh Thánh dùng các bản dịch thuộc phạm vi công cộng; Sách Giáo lý, Bản Toát yếu và các văn kiện của Huấn quyền đến từ chính các bản văn do Tòa Thánh xuất bản.',
	'colophon.textsFidelity':
		'Bản văn không bao giờ bị rút gọn, không bao giờ bị diễn giải lại, không bao giờ bị viết lại, và không bao giờ đặt cạnh quảng cáo. Chúng tôi có sửa những khiếm khuyết rõ ràng — một chữ bị rơi, một trích dẫn bị hỏng, mã đánh dấu đã nuốt mất một đoạn — luôn theo hướng những gì chính nguồn in ra, không bao giờ theo hướng những gì chúng tôi nghĩ nó nên nói.',
	'colophon.countBible': 'ấn bản Kinh Thánh',
	'colophon.countDocuments': 'văn kiện Huấn quyền',
	'colophon.copyrightTitle': 'Bản quyền',
	'colophon.copyrightBody1':
		'Sách Giáo lý, Bản Toát yếu và các văn kiện của Huấn quyền thuộc quyền sở hữu của những người giữ bản quyền — chủ yếu là Libreria Editrice Vaticana và Bộ Truyền thông.',
	'colophon.copyrightBody2':
		'Mỗi tác phẩm hiển thị thông báo bản quyền của chính người giữ quyền, theo lời văn của họ, và liên kết đến trang mà nó được lấy từ đó.',
	'colophon.copyrightBody3':
		'Nếu bạn giữ bản quyền đối với bất kỳ bản văn nào ở đây và muốn nó không được công bố, xin viết thư cho chúng tôi.',
	'colophon.contactTitle': 'Liên hệ',
	'colophon.contactBody': 'Về bất cứ điều gì, kể cả những điều trên:',
	'colophon.contactPending':
		'Địa chỉ liên hệ chưa được thiết lập. Trang này không nên được công bố cho đến khi có một địa chỉ — cam kết ở trên không có ý nghĩa nếu không có cách nào liên lạc với chúng tôi.',
	'colophon.illustrationsTitle': 'Các minh họa',
	'colophon.illustrationsBody':
		'Kinh Thánh mang các bản khắc của Gustave Doré, mỗi bản được đặt tại câu mà nó mô tả — bộ cuối cùng và lớn nhất trong các bộ Kinh Thánh của ông, được khắc trên gỗ theo các bản vẽ của ông và in cùng với bản văn thay vì gom lại ở cuối sách.',
	'colophon.illustrationsRights':
		'Chúng thuộc phạm vi công cộng, như các niên đại bên dưới cho thấy, và một bản sao chụp trung thực của một bản khắc thuộc phạm vi công cộng không mang bản quyền mới nào của riêng nó.',
	'colophon.countPlates': 'bản khắc',
	'colophon.countPlateChapters': 'chương có minh họa',
	'art.about': 'Về bức tranh này',
	'art.detail': 'chi tiết',
	'colophon.typeTitle': 'Kiểu chữ',
	'colophon.typeBody':
		'Sắp chữ bằng EB Garamond, bản phục hồi của Georg Duffner và Octavio Pardo đối với những con chữ mà Claude Garamont đã khắc vào thập niên 1590 — truyền thống nhân văn mà Giáo hội đã in ấn theo từ thời Phục hưng. Phần chữ Kirin của nó do cùng những bàn tay ấy nhưng không phục hồi điều gì: chưa từng có Garamond Kirin nào được khắc, nên tiếng Nga được sắp bằng một hình thể được vẽ để đứng cạnh phần còn lại.',
	'colophon.typeArabic':
		'Tiếng Ả Rập hoàn toàn nằm ngoài tầm với của nó, và được sắp bằng Amiri — bản phục hồi của Khaled Hosny đối với kiểu naskh được khắc cho nhà in Bulaq ở Cairo năm 1905, được chọn theo cùng lý lẽ như kiểu chữ thân bài: một kiểu chữ sách lịch sử cụ thể chứ không phải một bản vẽ đương đại.',
	'colophon.typeInitials':
		'Các mẫu tự mở đầu là Pirata One, một kiểu chữ gô-tinh mà các chữ hoa vẫn dễ đọc ở kích thước mà một chữ cái đầu đoạn đòi hỏi, và — cho tiếng Nga — Ponomar, kiểu chữ tái hiện con chữ Slavơ Giáo hội của Nhà in Thượng Hội đồng. Ponomar chỉ sắp chữ cái đầu và không bao giờ sắp bản văn: một thông điệp hiện đại được sắp toàn bộ bằng kiểu chữ Thượng Hội đồng sẽ nói điều gì đó không đúng về bản chất của nó. Tất cả đều được cấp phép theo SIL Open Font License và được phục vụ từ chính trang này thay vì từ một bên thứ ba, nên việc đọc một trang không đòi hỏi gì từ máy chủ của người khác.',
	'copyright.sourceTitle': 'Mở trang nguồn gốc',
	'copyright.sourceLabel': 'Nguồn',
	'lang.label': 'Ngôn ngữ',
	'lang.filter': 'Tìm ngôn ngữ',
	'lang.more': 'ngôn ngữ khác',
	'calendar.title': 'Lịch phụng vụ',
	'calendar.tagline':
		'Lịch Rôma chung, tính cho bất kỳ ngày nào — mùa của ngày, bậc của ngày, màu của ngày.',
	'calendar.date': 'Ngày',
	'calendar.calendar': 'Lịch',
	'calendar.which.general': 'Lịch Rôma chung',
	'calendar.filter': 'Tìm quốc gia',
	'calendar.region.europe': 'Châu Âu',
	'calendar.region.americas': 'Châu Mỹ',
	'calendar.region.africa': 'Châu Phi',
	'calendar.region.middleEast': 'Trung Đông',
	'calendar.region.asia': 'Châu Á',
	'calendar.region.oceania': 'Châu Đại Dương',
	'calendar.today': 'Hôm nay',
	'calendar.previousMonth': 'Tháng trước',
	'calendar.nextMonth': 'Tháng sau',
	'calendar.noSuchDay': 'Không có ngày phụng vụ nào được tính cho ngày đó.',
	'calendar.week': 'tuần',
	'calendar.alsoToday': 'Hôm nay cũng mừng',
	'calendar.alsoObserved': 'Hôm nay cũng kính nhớ',
	'calendar.obligation': 'Lễ buộc',
	'calendar.obligationCanon': 'CIC Đ. 1246',
	'calendar.sundayCycle': 'Chu kỳ Chúa nhật',
	'calendar.weekdayCycle': 'Chu kỳ ngày thường',
	'calendar.psalterWeek': 'Tuần thánh vịnh',
	'calendar.transferredFrom': 'Dời từ',
	'calendar.season.advent': 'Mùa Vọng',
	'calendar.season.christmas': 'Mùa Giáng Sinh',
	'calendar.season.lent': 'Mùa Chay',
	'calendar.season.triduum': 'Tam Nhật Vượt Qua',
	'calendar.season.easter': 'Mùa Phục Sinh',
	'calendar.season.ordinary': 'Mùa Thường Niên',
	'calendar.colour.white': 'Trắng',
	'calendar.colour.red': 'Đỏ',
	'calendar.colour.green': 'Xanh lục',
	'calendar.colour.violet': 'Tím',
	'calendar.colour.rose': 'Hồng',
	'calendar.colour.black': 'Đen',
	'calendar.colour.blue': 'Xanh lam',
	'calendar.rank.solemnity': 'Lễ trọng',
	'calendar.rank.feast': 'Lễ kính',
	'calendar.rank.memorial': 'Lễ nhớ',
	'calendar.rank.optional-memorial': 'Lễ nhớ tùy ý',
	'calendar.rank.commemoration': 'Kỷ niệm',
	'calendar.rank.sunday': 'Chúa nhật',
	'calendar.rank.weekday': 'Ngày thường',
	'calendar.gloss.season.advent':
		'Bốn tuần trước lễ Giáng Sinh: chuẩn bị cho việc Chúa đến, và khởi đầu năm của Hội Thánh.',
	'calendar.gloss.season.christmas':
		'Từ lễ Giáng Sinh đến lễ Chúa Giêsu chịu phép rửa, mừng việc Chúa giáng sinh và tỏ mình ra cho thế gian.',
	'calendar.gloss.season.lent':
		'Bốn mươi ngày từ thứ Tư Lễ Tro đến thánh lễ chiều Tiệc Ly: sám hối, bố thí và chuẩn bị mừng lễ Phục Sinh.',
	'calendar.gloss.season.triduum':
		'Ba ngày từ chiều thứ Năm Tuần Thánh đến chiều Chúa Nhật Phục Sinh — cuộc thương khó, cái chết và sự phục sinh của Chúa, tột đỉnh của cả năm.',
	'calendar.gloss.season.easter':
		'Năm mươi ngày từ lễ Phục Sinh đến lễ Hiện Xuống, được mừng như một đại lễ duy nhất — „một Chúa Nhật lớn“.',
	'calendar.gloss.season.ordinary':
		'Ba mươi ba hoặc ba mươi bốn tuần ngoài các mùa khác. Không phải „tầm thường“ mà là có trật tự: các tuần được đánh số, và Hội Thánh đọc liên tục cuộc đời và giáo huấn của Chúa. Mùa này đến trong hai chặng — sau mùa Giáng Sinh cho đến mùa Chay, và sau lễ Hiện Xuống cho đến mùa Vọng.',
	'calendar.gloss.rank.solemnity':
		'Bậc cao nhất: lễ Phục Sinh, lễ Giáng Sinh, lễ Chúa Lên Trời, thánh bổn mạng của một nơi. Được cử hành với kinh Vinh Danh và kinh Tin Kính, và bắt đầu từ chiều hôm trước.',
	'calendar.gloss.rank.feast':
		'Được cử hành trong chính ngày ấy. Các tông đồ và thánh sử, cùng những ngày lớn hơn của Chúa và của Đức Mẹ.',
	'calendar.gloss.rank.memorial':
		'Một vị thánh được nhớ đến trong ngày của ngài, bên trong thánh lễ và Các Giờ Kinh Phụng Vụ của mùa ấy. Bắt buộc ở nơi được cử hành.',
	'calendar.gloss.rank.optional-memorial':
		'Có thể cử hành hay không, tùy linh mục hoặc cộng đoàn chọn. Nếu không cử hành, ngày ấy chỉ đơn thuần là ngày trong tuần.',
	'calendar.gloss.rank.commemoration':
		'Điều mà một lễ nhớ trở thành trong mùa Chay: một lời nguyện thêm vào thánh lễ ngày thường, mà mùa Chay vẫn giữ nguyên vẹn phần còn lại.',
	'calendar.gloss.rank.sunday':
		'Ngày lễ đầu tiên — Ngày của Chúa, được mừng mỗi tuần từ khi Chúa sống lại. Chỉ một lễ trọng hoặc một lễ kính Chúa mới được thay thế, và trong mùa Vọng, mùa Chay và mùa Phục Sinh thì ngay cả những lễ ấy cũng không.',
	'calendar.gloss.rank.weekday':
		'Ngày không có lễ riêng. Thánh lễ và Các Giờ Kinh Phụng Vụ là của mùa — chính điều đó khiến mùa phụng vụ đáng biết đến.',
	'calendar.gloss.colour.white':
		'Niềm vui. Mùa Phục Sinh và mùa Giáng Sinh, các ngày lễ về Chúa ngoài cuộc thương khó, Đức Mẹ, các thiên thần, và các thánh không phải là tử đạo.',
	'calendar.gloss.colour.red':
		'Máu và lửa. Chúa Nhật Lễ Lá và thứ Sáu Tuần Thánh, lễ Hiện Xuống, các tông đồ và thánh sử, cùng các thánh tử đạo.',
	'calendar.gloss.colour.green': 'Mùa Thường Niên: màu của hy vọng, và của những gì đang lớn lên.',
	'calendar.gloss.colour.violet':
		'Mùa Vọng và mùa Chay, và cũng dùng trong các thánh lễ cầu cho người qua đời.',
	'calendar.gloss.colour.rose':
		'Dùng hai lần trong năm — Chúa Nhật Gaudete, Chúa Nhật thứ ba mùa Vọng, và Chúa Nhật Laetare, Chúa Nhật thứ tư mùa Chay — khi việc chay tịnh dịu bớt và đã thấy được đích đến.',
	'calendar.gloss.colour.black': 'Có thể dùng trong các thánh lễ cầu cho người qua đời.',
	'calendar.gloss.colour.blue':
		'Đặc ân màu xanh: dùng trong lễ Đức Mẹ Vô Nhiễm Nguyên Tội tại Tây Ban Nha, Philippines và ít nơi khác được Tòa Thánh ban phép.',
	'calendar.gloss.sundayCycle':
		'Các bài đọc Chúa Nhật chạy theo ba năm — A, B và C — lần lượt đọc Mátthêu, Máccô và Luca, cùng với Gioan trong mùa Chay và mùa Phục Sinh. Chu kỳ đổi vào Chúa Nhật thứ nhất mùa Vọng, cùng với năm của Hội Thánh.',
	'calendar.gloss.weekdayCycle':
		'Các bài đọc ngày thường chạy theo hai năm, I và II: bài đọc thứ nhất thay đổi, Tin Mừng thì không. Một năm phụng vụ mang tên năm dương lịch mà nó kết thúc — năm lẻ là I, năm chẵn là II.',
	'calendar.gloss.psalterWeek':
		'Các Giờ Kinh Phụng Vụ chia các thánh vịnh theo bốn tuần, I đến IV, lặp lại suốt năm. Đây là tuần mà các thánh vịnh của nó là của hôm nay, dành cho ai đọc Các Giờ Kinh.',
	'calendar.gloss.obligation':
		'Ngày mà các tín hữu buộc phải tham dự thánh lễ và kiêng những việc làm cản trở điều đó. Mọi Chúa Nhật, và những ngày khác mà mỗi hội đồng giám mục đã ấn định.',
	'calendar.primer.title': 'Lần đầu đến đây?',
	'calendar.primer.lead':
		'Hội Thánh giữ một năm riêng. Năm ấy bắt đầu với mùa Vọng, xoay quanh lễ Phục Sinh, và cho mỗi ngày một tên gọi, một bậc lễ và một màu — và những điều ấy quyết định hôm đó đọc và cầu nguyện những gì trong thánh lễ và trong Các Giờ Kinh Phụng Vụ. Vì thế „Chúa Nhật thứ hai mươi ba Mùa Thường Niên“ là một địa chỉ: nó cho linh mục, ca đoàn, hay bất cứ ai cầu nguyện tại nhà biết những lời nguyện và bài đọc nào thuộc về hôm nay.',
	'calendar.primer.seasons': 'Các mùa phụng vụ',
	'calendar.primer.ranks': 'Một ngày có thể là gì',
	'calendar.primer.colours': 'Các màu',
	'calendar.primer.cycles': 'Các chu kỳ',
	'calendar.primer.cyclesLead':
		'Ba bộ đếm, cùng nhau cho biết những bài đọc và thánh vịnh nào được chỉ định cho hôm nay.'
};
