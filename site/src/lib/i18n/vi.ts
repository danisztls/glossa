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
 * `docs/decisions.md`. The confidence note below governs
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
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
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
	'nav.prayers': 'Kinh nguyện',
	'nav.bookmarks': 'Dấu trang',
	'nav.menu': 'Trình đơn',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Đọc tiếp',
	'home.works': 'Thư viện',
	'home.ccc.heading': 'Sách Giáo lý và Bản Toát yếu',
	'home.magisterium.mostRecent': 'Mới nhất',
	'home.prayers.heading': 'Kinh nguyện',
	'unitNav.previous': 'Trước',
	'unitNav.next': 'Tiếp',
	'bible.landing.title': 'Kinh Thánh',
	'bible.landing.tagline': 'Đọc trọn bộ Kinh Thánh, từng cuốn một, từng chương một.',
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
	'ccc.landing.tagline':
		'<strong>Sách Giáo lý</strong> trình bày giáo huấn Công giáo trong 2.865 số được đánh số. <strong>Bản Toát yếu</strong> trình bày cùng giáo huấn ấy dưới dạng 598 câu hỏi thưa, theo cùng một bố cục.',
	'document.library.tagline':
		'Các thông điệp, hiến chế công đồng, sắc lệnh và tuyên ngôn của Huấn quyền.',
	'doctores.landing.title': 'Các Tiến sĩ Hội Thánh',
	'doctores.landing.tagline': 'Các tác phẩm thần học của các Giáo phụ và Tiến sĩ Hội Thánh.',
	'summa.landing.title': 'Tổng luận Thần học',
	'summa.landing.tagline': 'Tôma Aquinô, bằng tiếng Anh và bằng tiếng Latinh ngài đã viết.',
	'prayers.landing.title': 'Kinh nguyện thông thường',
	'prayers.landing.tagline': 'Các kinh nguyện kèm bản văn Latinh bên cạnh.',
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
	'footer.notEndorsed': 'Độc lập, không được Tòa Thánh chuẩn nhận.',
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
	'colophon.typeTitle': 'Kiểu chữ',
	'colophon.typeBody':
		'Sắp chữ bằng EB Garamond, bản phục hồi của Georg Duffner và Octavio Pardo đối với những con chữ mà Claude Garamont đã khắc vào thập niên 1590 — truyền thống nhân văn mà Giáo hội đã in ấn theo từ thời Phục hưng. Phần chữ Kirin của nó do cùng những bàn tay ấy nhưng không phục hồi điều gì: chưa từng có Garamond Kirin nào được khắc, nên tiếng Nga được sắp bằng một hình thể được vẽ để đứng cạnh phần còn lại.',
	'colophon.typeArabic':
		'Tiếng Ả Rập hoàn toàn nằm ngoài tầm với của nó, và được sắp bằng Amiri — bản phục hồi của Khaled Hosny đối với kiểu naskh được khắc cho nhà in Bulaq ở Cairo năm 1905, được chọn theo cùng lý lẽ như kiểu chữ thân bài: một kiểu chữ sách lịch sử cụ thể chứ không phải một bản vẽ đương đại.',
	'colophon.typeInitials':
		'Các mẫu tự mở đầu là Pirata One, một kiểu chữ gô-tinh mà các chữ hoa vẫn dễ đọc ở kích thước mà một chữ cái đầu đoạn đòi hỏi, và — cho tiếng Nga — Ponomar, kiểu chữ tái hiện con chữ Slavơ Giáo hội của Nhà in Thượng Hội đồng. Ponomar chỉ sắp chữ cái đầu và không bao giờ sắp bản văn: một thông điệp hiện đại được sắp toàn bộ bằng kiểu chữ Thượng Hội đồng sẽ nói điều gì đó không đúng về bản chất của nó. Tất cả đều được cấp phép theo SIL Open Font License và được phục vụ từ chính trang này thay vì từ một bên thứ ba, nên việc đọc một trang không đòi hỏi gì từ máy chủ của người khác.'
};
