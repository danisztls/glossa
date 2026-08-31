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
 * DELIBERATELY PARTIAL. The long colophon prose is absent and renders in
 * English through `t()`'s per-key fallback: it is the page explaining how
 * carefully this site handles other people's words, and a machine translation
 * of it would be the one page whose form contradicts its content. What is
 * here is the chrome -- including every key `CHROME_KEYS` requires, since an
 * unnamed chrome page fails the sync rather than falling back.
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
		'Trang này là gì, các bản văn từ đâu mà có, và lập trường của chúng tôi về việc sao chép chúng.'
};
