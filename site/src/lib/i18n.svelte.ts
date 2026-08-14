/**
 * UI string dictionary — deliberately tiny in v1 ("a handful of strings
 * only" per the brief). UI language is independent of content language
 * (see docs/decisions.md: "the URL carries content choice, setting
 * carries UI language"): switching this does not change which Bible
 * edition or CCC translation you're reading, only the site's own chrome.
 */

export type UiLang = 'en' | 'pt';

const STORAGE_KEY = 'depositum:ui-lang';

type Dictionary = Record<string, string>;

const dictionaries: Record<UiLang, Dictionary> = {
	en: {
		'nav.home': 'Home',
		'nav.bible': 'Bible',
		'nav.ccc': 'Catechism',
		'home.title': 'Depositum',
		'home.tagline': 'The Bible and the Catechism of the Catholic Church, free to read.',
		'home.continueReading': 'Continue reading',
		'home.works': 'Library',
		'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
		'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
		'jumpbox.noMatch': 'No match',
		'theme.label': 'Theme',
		'theme.light': 'Light',
		'theme.dark': 'Dark',
		'theme.sepia': 'Sepia',
		'bible.prevChapter': 'Previous chapter',
		'bible.nextChapter': 'Next chapter',
		'bible.pickBook': 'Books & chapters',
		'ccc.prevParagraph': 'Previous',
		'ccc.nextParagraph': 'Next',
		'ccc.inBrief': 'In Brief',
		'ccc.tableOfContents': 'Table of Contents',
		'ccc.related': 'See also',
		'lang.label': 'Language'
	},
	pt: {
		'nav.home': 'Início',
		'nav.bible': 'Bíblia',
		'nav.ccc': 'Catecismo',
		'home.title': 'Depositum',
		'home.tagline': 'A Bíblia e o Catecismo da Igreja Católica, livres para ler.',
		'home.continueReading': 'Continuar lendo',
		'home.works': 'Biblioteca',
		'jumpbox.placeholder': 'Ir para… (ex: jo 3,16, ccc 1234)',
		'jumpbox.hint': 'Pressione / ou Ctrl+K para ir a uma referência',
		'jumpbox.noMatch': 'Nenhum resultado',
		'theme.label': 'Tema',
		'theme.light': 'Claro',
		'theme.dark': 'Escuro',
		'theme.sepia': 'Sépia',
		'bible.prevChapter': 'Capítulo anterior',
		'bible.nextChapter': 'Próximo capítulo',
		'bible.pickBook': 'Livros e capítulos',
		'ccc.prevParagraph': 'Anterior',
		'ccc.nextParagraph': 'Próximo',
		'ccc.inBrief': 'Resumindo',
		'ccc.tableOfContents': 'Índice',
		'ccc.related': 'Veja também',
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
