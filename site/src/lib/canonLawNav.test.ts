import { describe, expect, it } from 'vitest';
import { canonLawHeadingParts, canonLawLabelText, canonLawTitleText } from './canonLawNav';
import { kindLabelWord } from './titles';
import type { StructureNode } from './types';

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
		expect(canonLawLabelText('CHAPTER I', 'en')).toBe('CH. I');
		expect(canonLawLabelText('CAPUT III', 'la')).toBe('CAP. III');
		expect(canonLawLabelText('KAPITEL VIII', 'de')).toBe('KAP. VIII');
		expect(canonLawLabelText('ГЛАВА II', 'ru')).toBe('ГЛ. II');
	});

	// `title` goes through the same substitution and comes out the same length:
	// its word in `KIND_LABELS` is the whole word, because "Title" -> "Tit."
	// saves one character and costs the reader a certainty.
	it('leaves the title noun at its full length', () => {
		expect(canonLawLabelText('TITLE IV', 'en')).toBe('TITLE IV');
		expect(canonLawLabelText('TITULUS I', 'la')).toBe('TITULUS I');
		expect(canonLawLabelText('ТИТУЛ V', 'ru')).toBe('ТИТУЛ V');
	});

	// The Spanish pages print `CAPITULO`/`TITULO` bare in places and
	// `CAPÍTULO`/`TÍTULO` in others; the noun is read through the fold and
	// printed from the table, so every crumb is accented either way.
	it('folds the accent an edition writes into its own noun, and restores it', () => {
		expect(canonLawLabelText('TÍTULO VII', 'es')).toBe('TÍTULO VII');
		expect(canonLawLabelText('TITULO VII', 'es')).toBe('TÍTULO VII');
		expect(canonLawLabelText('CAPÍTULO II', 'es')).toBe('CAP. II');
		expect(canonLawLabelText('CAPITULO II', 'es')).toBe('CAP. II');
	});

	it('takes the label’s own case register', () => {
		// The Code abbreviates this level itself, and prints it in lower case.
		expect(canonLawLabelText('Art. 2', 'en')).toBe('Art. 2');
		expect(canonLawLabelText('Глава V', 'ru')).toBe('Гл. V');
	});

	/**
	 * THE ONE THAT MATTERS. `canonLawLabelText` holds no words of its own — it
	 * maps a printed noun to a kind and asks `kindLabelWord` — so it CANNOT
	 * disagree with the rest of the site, and what is worth pinning is the
	 * other half: that every noun the seven editions print still reaches a
	 * word. A hole in `KIND_LABELS`, a noun dropped from
	 * `CANON_LAW_EXTRA_NOUNS`, or `documentLabelKind` ceasing to recognise
	 * `TITULUS` all degrade to the verbatim label — correct, silent, and a
	 * whole column of the index suddenly a third wider.
	 *
	 * The labels are real: every distinct division noun in all seven editions,
	 * taken off `structure.json`.
	 */
	const PRINTED: [lang: string, label: string, kind: StructureNode['kind']][] = [
		['en', 'TITLE IV', 'title'],
		['la', 'TITULUS I', 'title'],
		['it', 'TITOLO III', 'title'],
		['es', 'TÍTULO VII', 'title'],
		['fr', 'TITRE II', 'title'],
		['de', 'TITEL I', 'title'],
		['ru', 'ТИТУЛ V', 'title'],
		['en', 'CHAPTER I', 'chapter'],
		['la', 'CAPUT III', 'chapter'],
		['it', 'CAPITOLO IX', 'chapter'],
		['es', 'CAPÍTULO II', 'chapter'],
		['fr', 'CHAPITRE X', 'chapter'],
		['de', 'KAPITEL VIII', 'chapter'],
		['ru', 'ГЛАВА II', 'chapter'],
		['en', 'Art. 2', 'article'],
		['la', 'Art. 1', 'article'],
		['it', 'Articolo 3', 'article'],
		['es', 'Art. 4', 'article'],
		['fr', 'Art. 1', 'article'],
		['de', 'Artikel 2', 'article'],
		['ru', 'Ст. 1', 'article']
	];

	it.each(PRINTED)("labels %s %s with the site's own word for a %s", (lang, label, kind) => {
		const shared = kindLabelWord(kind, lang);
		expect(shared, `KIND_LABELS has no ${kind} for ${lang}`).not.toBeNull();
		const [noun, ...rest] = canonLawLabelText(label, lang).split(' ');
		expect(noun.toLocaleUpperCase()).toBe((shared as string).toLocaleUpperCase());
		// The numeral is the source's, untouched — the whole reason this is not
		// `marker()`.
		expect(rest.join(' ')).toBe(label.split(' ').slice(1).join(' '));
	});

	// A separate assertion because the article and title rows above cannot make
	// it: every edition already prints `Art.`/`Ст.`, and the title word is not
	// abbreviated at all, so for those the function is a no-op and "the label
	// got shorter" is false while everything about the row is right.
	it('actually shortens the nouns the editions spell out', () => {
		const SPELLED_OUT: [string, string][] = [
			['en', 'CHAPTER I'],
			['la', 'CAPUT III'],
			['it', 'CAPITOLO IX'],
			['es', 'CAPÍTULO II'],
			['fr', 'CHAPITRE X'],
			['de', 'KAPITEL VIII'],
			['ru', 'ГЛАВА II']
		];
		for (const [lang, label] of SPELLED_OUT) {
			expect(canonLawLabelText(label, lang).length).toBeLessThan(label.length);
		}
	});

	it('leaves book, part and section alone — the shared table spells those out', () => {
		expect(canonLawLabelText('BOOK VII', 'en')).toBe('BOOK VII');
		expect(canonLawLabelText('PARS II', 'la')).toBe('PARS II');
		expect(canonLawLabelText('SECTION I', 'en')).toBe('SECTION I');
		// And German prints SEKTION where the shared table says `Abschnitt`,
		// which is a different word rather than a shorter one.
		expect(canonLawLabelText('SEKTION II', 'de')).toBe('SEKTION II');
	});

	it('leaves a label whose ordinal comes first, which is how French sets a part', () => {
		expect(canonLawLabelText('PREMIÈRE PARTIE', 'fr')).toBe('PREMIÈRE PARTIE');
		expect(canonLawLabelText('CINQUIEME PARTIE', 'fr')).toBe('CINQUIEME PARTIE');
	});

	it('leaves a label with no numeral after the noun', () => {
		expect(canonLawLabelText('CHAPTER', 'en')).toBe('CHAPTER');
	});

	it('leaves a noun neither table knows', () => {
		// Book is in neither and has no kind at all, so it degrades with no
		// entry needed — and so does a word from nowhere near a division.
		expect(canonLawLabelText('LIBER I', 'la')).toBe('LIBER I');
		expect(canonLawLabelText('PROOEMIUM I', 'la')).toBe('PROOEMIUM I');
	});

	// THE LABEL AND THE LANGUAGE ARE ALWAYS ONE EDITION'S: every caller passes
	// `crumb.node.label` beside `editions.lang`, and the outline that label came
	// from is that edition's. The kind is read from the noun and the word from
	// the language, so crossing them returns the other language's word — which
	// is unreachable today and recorded here so a future caller knows which
	// half wins rather than discovering it.
	it('reads the kind from the noun and the word from the language', () => {
		expect(canonLawLabelText('CAPUT III', 'la')).toBe('CAP. III');
		expect(canonLawLabelText('CAPUT III', 'de')).toBe('KAP. III');
	});
});
