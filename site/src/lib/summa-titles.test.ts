import { describe, expect, it } from 'vitest';
import { summaHeadingTitle, summaQuestionLabel, summaTitleParts } from './summa-titles';

/**
 * The strings below are REAL, copied out of `works/summa.en/questions.json`
 * and `structure.json` rather than invented -- including the bracket
 * artifacts, which `raw/summa-en/summa.xml` confirms are CCEL's own and not
 * something the parser introduced.
 */
describe('summaTitleParts', () => {
	it('recases a shouted title and drops the article count', () => {
		expect(summaTitleParts('THE NATURE AND EXTENT OF SACRED DOCTRINE (TEN ARTICLES)').title).toBe(
			'The Nature and Extent of Sacred Doctrine'
		);
		expect(summaTitleParts('OF THE SIMPLICITY OF GOD (EIGHT ARTICLES)').title).toBe(
			'Of the Simplicity of God'
		);
		expect(summaTitleParts('THE EXISTENCE OF GOD (THREE ARTICLES)').title).toBe(
			'The Existence of God'
		);
	});

	it('starts a new clause after a colon', () => {
		expect(summaTitleParts('TREATISE ON HUMAN ACTS: ACTS PECULIAR TO MAN').title).toBe(
			'Treatise on Human Acts: Acts Peculiar to Man'
		);
	});

	it('leaves a title that is already cased alone', () => {
		// Every article title in this edition, and anything a future edition
		// cases sanely. The rule keys off the string's shape, not its language.
		const article = 'Whether sacred doctrine is a science?';
		expect(summaTitleParts(article).title).toBe(article);
	});

	it('is a no-op on the Latin edition, which prints no titles', () => {
		expect(summaTitleParts('').title).toBe('');
	});
});

describe('summaHeadingTitle', () => {
	it('recases a treatise heading and unpicks CCEL question-anchor brackets', () => {
		expect(summaHeadingTitle('TREATISE ON SACRED DOCTRINE (Q[1])')).toBe(
			'Treatise on Sacred Doctrine (Q 1)'
		);
		expect(summaHeadingTitle('TREATISE ON THE ONE GOD (QQ[2]-26)')).toBe(
			'Treatise on the One God (QQ 2-26)'
		);
		expect(summaHeadingTitle('TREATISE ON THE CREATION (QQ 44-46)')).toBe(
			'Treatise on the Creation (QQ 44-46)'
		);
	});

	it('keeps the range, unlike a question title', () => {
		// The range is the one thing a treatise heading says about where it
		// sits, so it survives; a question's "(TEN ARTICLES)" does not, because
		// the articles are listed directly beneath it.
		expect(summaHeadingTitle('TREATISE ON THE ANGELS (QQ[50]-64)')).toContain('(QQ 50-64)');
	});

	it('keeps the part sigla CCEL prints in its own headings', () => {
		expect(summaHeadingTitle('FIRST PART (FP: QQ 1-119)')).toBe('First Part (FP: QQ 1-119)');
		expect(summaHeadingTitle('FIRST PART OF THE SECOND PART (FS) (QQ[1]-114)')).toBe(
			'First Part of the Second Part (FS) (QQ 1-114)'
		);
	});

	it('capitalizes across a hyphen but not across an apostrophe', () => {
		expect(summaHeadingTitle('SELF-EVIDENT TRUTHS')).toBe('Self-Evident Truths');
		expect(summaHeadingTitle("GOD'S KNOWLEDGE")).toBe("God's Knowledge");
	});
});

/**
 * Eleven question titles carry a translator's note, and the source puts it on
 * either side of the article count. Both orders are real, both are below.
 */
describe('translator notes', () => {
	it('peels a note that follows the article count', () => {
		expect(summaTitleParts('OF STRIFE (TWO ARTICLES) [*Strife here denotes fighting]')).toEqual({
			title: 'Of Strife',
			note: '[*Strife here denotes fighting]'
		});
	});

	it('peels a note that precedes it', () => {
		// The order that broke the first implementation: the lowercase note,
		// still attached, dragged the string below the shouting threshold and
		// the title kept its capitals.
		expect(summaTitleParts('OF BACKBITING [*Or detraction] (FOUR ARTICLES)')).toEqual({
			title: 'Of Backbiting',
			note: '[*Or detraction]'
		});
		expect(summaQuestionLabel('OF BACKBITING [*Or detraction] (FOUR ARTICLES)')).toBe(
			'Of Backbiting'
		);
	});

	it('leaves a mid-title gloss where the edition put it', () => {
		// A gloss on one word, not a subtitle: it belongs in the title line.
		expect(
			summaTitleParts('OF ENJOYMENT [*Or, Fruition], WHICH IS AN ACT OF THE WILL (FOUR ARTICLES)')
		).toEqual({ title: 'Of Enjoyment [*Or, Fruition], Which Is an Act of the Will', note: '' });
	});

	it('keeps the asterisk that points at the note', () => {
		expect(
			summaQuestionLabel('OF MAGNANIMITY* (EIGHT ARTICLES) [*Not in the ordinary sense]')
		).toBe('Of Magnanimity*');
	});

	it('drops the note in the compact form and keeps it in the full one', () => {
		const title = 'OF MERCY (FOUR ARTICLES) [*The one Latin word "misericordia" signifies mercy.]';
		expect(summaQuestionLabel(title)).toBe('Of Mercy');
		expect(summaTitleParts(title).note).toContain('misericordia');
	});
});

describe('isShouted, via its callers', () => {
	it('recases a heading whose only lowercase is an abbreviation', () => {
		// The case that refuted "contains no lowercase at all". `i.e.` survives
		// as itself: a token carrying its own lowercase is already cased.
		expect(
			summaHeadingTitle('TREATISE ON HABITS IN PARTICULAR (QQ 55-89) GOOD HABITS, i.e. VIRTUES')
		).toBe('Treatise on Habits in Particular (QQ 55-89) Good Habits, i.e. Virtues');
	});

	it('leaves a sentence-cased string alone however short', () => {
		expect(summaHeadingTitle('Pars I')).toBe('Pars I');
		expect(summaHeadingTitle('Prologue')).toBe('Prologue');
	});
});

/**
 * The case the reader reported: an article title and its note rendering as one
 * runaway line. 28 article titles carry one, as do 17 question titles.
 */
describe('title and subtitle', () => {
	it('splits an article title from its trailing note', () => {
		expect(
			summaTitleParts(
				'Whether goodness is rightly divided into the virtuous*, the useful and the pleasant? ' +
					'[*"Bonum honestum" is the virtuous good considered as fitting. (cf. SS, Q[141], A[3])]'
			)
		).toEqual({
			title: 'Whether goodness is rightly divided into the virtuous*, the useful and the pleasant?',
			// Cross-references inside the note lose their brackets like any
			// other -- they are the same CCEL artifact.
			note: '[*"Bonum honestum" is the virtuous good considered as fitting. (cf. SS, Q 141, A 3)]'
		});
	});

	it('leaves an ordinary title with an empty note', () => {
		expect(summaTitleParts('Whether sacred doctrine is a science?')).toEqual({
			title: 'Whether sacred doctrine is a science?',
			note: ''
		});
	});
});
