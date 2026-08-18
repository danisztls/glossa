import { describe, expect, it } from 'vitest';
import { detectUiLang } from './i18n.svelte';

describe('detectUiLang', () => {
	it('uses the first supported browser preference', () => {
		expect(detectUiLang(['pt-BR', 'en-US'])).toBe('pt');
		expect(detectUiLang(['en-GB', 'pt-PT'])).toBe('en');
	});

	it('skips unsupported preferences in favour of a later supported one', () => {
		expect(detectUiLang(['fr-FR', 'pt-PT', 'en-US'])).toBe('pt');
	});

	it('falls back to English when there is no supported browser language', () => {
		expect(detectUiLang(['fr-FR', 'es-ES'])).toBe('en');
		expect(detectUiLang([])).toBe('en');
		expect(detectUiLang(undefined)).toBe('en');
	});
});
