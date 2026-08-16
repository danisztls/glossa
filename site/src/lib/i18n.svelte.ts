/**
 * UI string dictionary.
 *
 * UI language now DRIVES content language (reversing the original "the URL
 * carries content choice, setting carries UI language" decision recorded in
 * docs/decisions.md — see the entry this change adds there). Switching this
 * switches both the site's chrome AND, by default, which edition of the
 * Bible/CCC/Compendium is shown (see `$lib/content.svelte.ts`). A reader who
 * wants to read a different edition than their interface language implies
 * still can — the edition/version selector lets them override it — but that
 * override is scoped to the UI language it was made under, so changing the
 * interface language changes the content language too unless the reader
 * re-picks an edition after switching.
 */

export type UiLang = 'en' | 'pt';

const STORAGE_KEY = 'depositum:ui-lang';

type Dictionary = Record<string, string>;

const dictionaries: Record<UiLang, Dictionary> = {
	en: {
		'nav.home': 'Home',
		'nav.bible': 'Bible',
		'nav.ccc': 'Catechism',
		'nav.compendium': 'Compendium',
		// "Magisterium" over "Documents"/"Magisterial Documents" — the name
		// shown in the navbar and the home-page Library group; the route path
		// stays `/documents` regardless (URL and display name needn't match,
		// and `/documents` stays accurate as encyclicals/exhortations/CDF
		// documents join the 16 Vatican II texts already here).
		'nav.magisterium': 'Magisterium',
		'nav.menu': 'Menu',
		'home.title': 'Depositum',
		'home.tagline': 'The Bible and the Catechism of the Catholic Church, free to read.',
		'home.continueReading': 'Continue reading',
		'home.works': 'Library',
		'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
		'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
		'jumpbox.noMatch': 'No match',

		// Theme menu (auto/light/dark/sepia) — ThemeMenu.svelte is the consumer.
		'theme.label': 'Theme',
		'theme.auto': 'Auto',
		'theme.light': 'Light',
		'theme.dark': 'Dark',
		'theme.sepia': 'Sepia',

		// Font size menu — FontSizeMenu.svelte is the consumer; store is prefs.svelte.ts.
		'fontSize.label': 'Text size',
		'fontSize.larger': 'Larger text',
		'fontSize.smaller': 'Smaller text',
		'fontSize.reset': 'Reset text size',

		// Edition/version selector — EditionMenu.svelte is the consumer; store is content.svelte.ts.
		'edition.label': 'Edition',
		'edition.select': 'Choose edition',
		'edition.current': 'Current edition',

		'bible.prevChapter': 'Previous chapter',
		'bible.nextChapter': 'Next chapter',
		'bible.pickBook': 'Books & chapters',
		'bible.landing.title': 'The Bible',
		'bible.landing.tagline': 'Read the whole Bible, book by book, chapter by chapter.',
		'bible.landing.continue': 'Continue where you left off',
		'bible.landing.start': 'Start reading',
		'bible.landing.books': 'Books',
		// The canonical book/chapter structure is edition-independent, so the
		// picker can offer a chapter the reader's current edition lacks.
		'bible.chapterUnavailable': 'Not available in this edition',
		'bible.testament.ot': 'Old Testament',
		'bible.testament.nt': 'New Testament',

		'ccc.prevParagraph': 'Previous',
		'ccc.nextParagraph': 'Next',
		'ccc.inBrief': 'In Brief',
		'ccc.tableOfContents': 'Table of Contents',
		'ccc.related': 'See also',

		// Compendium of the CCC — routes/compendium/** is the consumer.
		'compendium.landing.title': 'Compendium of the Catechism',
		'compendium.landing.tagline':
			'598 questions and answers summarizing the Catechism of the Catholic Church.',
		'compendium.question': 'Question',
		'compendium.answer': 'Answer',
		'compendium.tableOfContents': 'Table of Contents',
		'compendium.prevQuestion': 'Previous question',
		'compendium.nextQuestion': 'Next question',
		'compendium.condenses': 'Condenses CCC ¶¶',

		// Reference tooltips/popovers — RefText.svelte is the consumer.
		'ref.tooltip.loading': 'Loading…',
		'ref.tooltip.openCcc': 'Open in Catechism',
		'ref.tooltip.openBible': 'Open in Bible',
		'ref.tooltip.openCompendium': 'Open in Compendium',
		'ref.cf': 'cf.',

		// Documents (encyclicals, conciliar constitutions/decrees/declarations,
		// docs/corpus-schema.md §Documents) — routes/documents/** is the
		// consumer, plus the home page's Magisterium group.
		'document.library.tagline':
			'Encyclicals, conciliar constitutions, decrees, and declarations of the Magisterium.',
		'document.tableOfContents': 'Table of Contents',
		'document.startReading': 'Start reading',
		'document.section': 'Section',
		'document.prevSection': 'Previous',
		'document.nextSection': 'Next',
		'document.promulgated': 'Promulgated',
		'document.kind.conciliarConstitution': 'Constitution',
		'document.kind.conciliarDecree': 'Decree',
		'document.kind.conciliarDeclaration': 'Declaration',
		'document.kind.encyclical': 'Encyclical',
		'document.kind.apostolicExhortation': 'Apostolic Exhortation',
		'document.kind.apostolicConstitution': 'Apostolic Constitution',
		'document.kind.cdfDeclaration': 'CDF Declaration',
		'document.kindPlural.conciliarConstitution': 'Constitutions',
		'document.kindPlural.conciliarDecree': 'Decrees',
		'document.kindPlural.conciliarDeclaration': 'Declarations',
		'document.kindPlural.encyclical': 'Encyclicals',
		'document.kindPlural.apostolicExhortation': 'Apostolic Exhortations',
		'document.kindPlural.apostolicConstitution': 'Apostolic Constitutions',
		'document.kindPlural.cdfDeclaration': 'CDF Declarations',

		// A citation whose source text is a confirmed gap in the source page
		// itself, not a parsing failure (docs/research/vatican-documents.md §6)
		// — CccParagraphText.svelte's citation disclosure, shared by CCC and
		// document sections.
		'citation.unavailable': 'No source text available for this note.',

		'lang.label': 'Language'
	},
	pt: {
		'nav.home': 'Início',
		'nav.bible': 'Bíblia',
		'nav.ccc': 'Catecismo',
		'nav.compendium': 'Compêndio',
		'nav.magisterium': 'Magistério',
		'nav.menu': 'Menu',
		'home.title': 'Depositum',
		'home.tagline': 'A Bíblia e o Catecismo da Igreja Católica, livres para ler.',
		'home.continueReading': 'Continuar lendo',
		'home.works': 'Biblioteca',
		'jumpbox.placeholder': 'Ir para… (ex: jo 3,16, ccc 1234)',
		'jumpbox.hint': 'Pressione / ou Ctrl+K para ir a uma referência',
		'jumpbox.noMatch': 'Nenhum resultado',

		'theme.label': 'Tema',
		'theme.auto': 'Automático',
		'theme.light': 'Claro',
		'theme.dark': 'Escuro',
		'theme.sepia': 'Sépia',

		'fontSize.label': 'Tamanho do texto',
		'fontSize.larger': 'Aumentar texto',
		'fontSize.smaller': 'Diminuir texto',
		'fontSize.reset': 'Repor tamanho do texto',

		'edition.label': 'Edição',
		'edition.select': 'Escolher edição',
		'edition.current': 'Edição atual',

		'bible.prevChapter': 'Capítulo anterior',
		'bible.nextChapter': 'Próximo capítulo',
		'bible.pickBook': 'Livros e capítulos',
		'bible.landing.title': 'A Bíblia',
		'bible.landing.tagline': 'Leia toda a Bíblia, livro por livro, capítulo por capítulo.',
		'bible.landing.continue': 'Continuar de onde parou',
		'bible.landing.start': 'Começar a leitura',
		'bible.landing.books': 'Livros',
		'bible.chapterUnavailable': 'Não disponível nesta edição',
		'bible.testament.ot': 'Antigo Testamento',
		'bible.testament.nt': 'Novo Testamento',

		'ccc.prevParagraph': 'Anterior',
		'ccc.nextParagraph': 'Próximo',
		'ccc.inBrief': 'Resumindo',
		'ccc.tableOfContents': 'Índice',
		'ccc.related': 'Veja também',

		'compendium.landing.title': 'Compêndio do Catecismo',
		'compendium.landing.tagline':
			'598 perguntas e respostas que resumem o Catecismo da Igreja Católica.',
		'compendium.question': 'Pergunta',
		'compendium.answer': 'Resposta',
		'compendium.tableOfContents': 'Índice',
		'compendium.prevQuestion': 'Pergunta anterior',
		'compendium.nextQuestion': 'Próxima pergunta',
		'compendium.condenses': 'Condensa os §§',

		'ref.tooltip.loading': 'Carregando…',
		'ref.tooltip.openCcc': 'Abrir no Catecismo',
		'ref.tooltip.openBible': 'Abrir na Bíblia',
		'ref.tooltip.openCompendium': 'Abrir no Compêndio',
		'ref.cf': 'cf.',

		'document.library.tagline':
			'Encíclicas, constituições conciliares, decretos e declarações do Magistério.',
		'document.tableOfContents': 'Índice',
		'document.startReading': 'Começar a leitura',
		'document.section': 'Secção',
		'document.prevSection': 'Anterior',
		'document.nextSection': 'Próximo',
		'document.promulgated': 'Promulgado em',
		'document.kind.conciliarConstitution': 'Constituição',
		'document.kind.conciliarDecree': 'Decreto',
		'document.kind.conciliarDeclaration': 'Declaração',
		'document.kind.encyclical': 'Encíclica',
		'document.kind.apostolicExhortation': 'Exortação Apostólica',
		'document.kind.apostolicConstitution': 'Constituição Apostólica',
		'document.kind.cdfDeclaration': 'Declaração da CDF',
		'document.kindPlural.conciliarConstitution': 'Constituições',
		'document.kindPlural.conciliarDecree': 'Decretos',
		'document.kindPlural.conciliarDeclaration': 'Declarações',
		'document.kindPlural.encyclical': 'Encíclicas',
		'document.kindPlural.apostolicExhortation': 'Exortações Apostólicas',
		'document.kindPlural.apostolicConstitution': 'Constituições Apostólicas',
		'document.kindPlural.cdfDeclaration': 'Declarações da CDF',

		'citation.unavailable': 'Sem texto de fonte disponível para esta nota.',

		'lang.label': 'Idioma'
	}
};

function readStored(): UiLang | null {
	if (typeof localStorage === 'undefined') return null;
	const value = localStorage.getItem(STORAGE_KEY);
	return value === 'en' || value === 'pt' ? value : null;
}

class I18nStore {
	lang: UiLang = $state(readStored() ?? 'en');

	set(lang: UiLang) {
		this.lang = lang;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, lang);
		}
	}

	t(key: string): string {
		return dictionaries[this.lang][key] ?? dictionaries.en[key] ?? key;
	}
}

export const i18n = new I18nStore();

/** Convenience helper, reactive when called from within a component. */
export function t(key: string): string {
	return i18n.t(key);
}
