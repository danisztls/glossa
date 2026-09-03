import { describe, expect, it } from 'vitest';
import { canonLawHeadingParts, canonLawLabelText, canonLawTitleText } from './canonLawNav';

/**
 * The two rules here both failed silently on the page rather than throwing,
 * which is the whole reason they are pinned: a shouted heading beside a cased
 * one and a label numbered from the wrong basis are things a reader sees and
 * a build does not.
 */

describe('canonLawTitleText', () => {
	it('drops the range five of the seven editions print inside a heading', () => {
		expect(canonLawTitleText('ECCLESIASTICAL LAWS (Cann. 7 - 22)')).toBe('ECCLESIASTICAL LAWS');
		expect(canonLawTitleText('DE LOS SACRAMENTOS (Cann. 840-1165)')).toBe('DE LOS SACRAMENTOS');
	});

	it('keeps a parenthesis that is part of the name', () => {
		expect(canonLawTitleText('КАРАЮЩИЕ САНКЦИИ (НАКАЗАНИЯ) В ЦЕРКВИ')).toBe(
			'КАРАЮЩИЕ САНКЦИИ (НАКАЗАНИЯ) В ЦЕРКВИ'
		);
	});

	it('reads past the closing tags the Italian edition wraps the range in', () => {
		expect(
			canonLawTitleText('<b>GLI ATTI AMMINISTRATIVI SINGOLARI </b> (<b>Cann. 35 – 93)</b>')
		).toBe('<b>GLI ATTI AMMINISTRATIVI SINGOLARI </b>');
	});

	it('never empties a title', () => {
		expect(canonLawTitleText('(Cann. 7 - 22)')).toBe('(Cann. 7 - 22)');
	});
});

describe('canonLawHeadingParts', () => {
	// The bug this exists for: `normalizeCase` only rewrites an ALL-CAPS
	// heading, and the `ann` of the printed range is lower-case — so stripping
	// the range afterwards left the five editions that print one shouting
	// while the two that do not were cased.
	it('cases a heading whose only lower-case letters were in the range', () => {
		expect(canonLawHeadingParts('SINGULAR ADMINISTRATIVE ACTS (Cann. 35 - 93)', 'en').title).toBe(
			'Singular Administrative Acts'
		);
	});

	it('cases a heading with no range the same way', () => {
		expect(canonLawHeadingParts('THE PEOPLE OF GOD', 'en').title).toBe('The People of God');
	});
});

describe('canonLawLabelText', () => {
	it('shortens the noun and keeps the numeral the source printed', () => {
		expect(canonLawLabelText('CHAPTER I', 'en')).toBe('CHAP. I');
		expect(canonLawLabelText('TITLE IV', 'en')).toBe('TIT. IV');
		expect(canonLawLabelText('CAPUT III', 'la')).toBe('CAP. III');
		expect(canonLawLabelText('KAPITEL VIII', 'de')).toBe('KAP. VIII');
		expect(canonLawLabelText('ГЛАВА II', 'ru')).toBe('ГЛ. II');
	});

	it('folds the accent an edition writes into its own noun', () => {
		expect(canonLawLabelText('TÍTULO VII', 'es')).toBe('TÍT. VII');
		expect(canonLawLabelText('CAPÍTULO II', 'es')).toBe('CAP. II');
	});

	it('takes the label’s own case register', () => {
		// The Code abbreviates this level itself, and prints it in lower case.
		expect(canonLawLabelText('Art. 2', 'en')).toBe('Art. 2');
		expect(canonLawLabelText('Глава V', 'ru')).toBe('Гл. V');
	});

	it('leaves book and part alone — they are the top of the tree', () => {
		expect(canonLawLabelText('BOOK VII', 'en')).toBe('BOOK VII');
		expect(canonLawLabelText('PARS II', 'la')).toBe('PARS II');
	});

	it('leaves a label whose ordinal comes first, which is how French sets a part', () => {
		expect(canonLawLabelText('PREMIÈRE PARTIE', 'fr')).toBe('PREMIÈRE PARTIE');
		expect(canonLawLabelText('CINQUIEME PARTIE', 'fr')).toBe('CINQUIEME PARTIE');
	});

	it('leaves a label with no numeral after the noun, and a language with no table', () => {
		expect(canonLawLabelText('CHAPTER', 'en')).toBe('CHAPTER');
		expect(canonLawLabelText('CHAPTER I', 'pt')).toBe('CHAPTER I');
	});
});
