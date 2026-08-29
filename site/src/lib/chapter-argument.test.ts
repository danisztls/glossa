import { describe, it, expect } from 'vitest';
import { chapterArgument } from './chapter-argument';

describe('chapterArgument', () => {
	it('keeps an argument that says something the rubrics do not', () => {
		// Matos Soares, Ps 3 — a real title over rubrics of its own.
		expect(
			chapterArgument({
				summary: 'Oração de quem confia em Deus no meio dos seus Inimigos',
				headings: [
					{ before_verse: 1, level: 4, text: 'Cercado pelo inimigo, o salmista conserva a paz.' },
					{ before_verse: 7, level: 4, text: 'Súplica veemente.' }
				]
			})
		).toBe('Oração de quem confia em Deus no meio dos seus Inimigos');
	});

	it('suppresses an argument that is the chapter’s own rubrics', () => {
		// Matos Soares, Genesis 1 — and the outer divisions are ignored, which
		// is what makes this the deepest level rather than every heading.
		expect(
			chapterArgument({
				summary: 'Principio. Primeiro dia da criação. Segundo dia da criação.',
				headings: [
					{ before_verse: 1, level: 1, text: 'PRIMEIRA PARTE' },
					{ before_verse: 1, level: 2, text: 'I - CRIAÇÃO DO MUNDO' },
					{ before_verse: 1, level: 4, text: 'Principio.' },
					{ before_verse: 3, level: 4, text: 'Primeiro dia da criação.' },
					{ before_verse: 6, level: 4, text: 'Segundo dia da criação.' }
				]
			})
		).toBeUndefined();
	});

	it('reads a line break as a space', () => {
		expect(
			chapterArgument({
				summary: 'Primeiro dia da criação.\n  Segundo dia da criação.',
				headings: [
					{ before_verse: 1, level: 4, text: 'Primeiro dia da criação.' },
					{ before_verse: 3, level: 4, text: 'Segundo dia da criação.' }
				]
			})
		).toBeUndefined();
	});

	it('keeps an argument in a chapter with no headings at all', () => {
		// Challoner's ordinary case: 1,307 arguments, none of them a rubric list.
		expect(chapterArgument({ summary: 'The creation of heaven and earth.' })).toBe(
			'The creation of heaven and earth.'
		);
	});

	it('keeps an argument when the rubrics are only part of it', () => {
		expect(
			chapterArgument({
				summary: 'Sua falta. O castigo. Os Cedarenos.',
				headings: [
					{ before_verse: 1, level: 4, text: 'Sua falta.' },
					{ before_verse: 4, level: 4, text: 'O castigo.' }
				]
			})
		).toBe('Sua falta. O castigo. Os Cedarenos.');
	});

	it('has nothing to print when the edition stores no argument', () => {
		expect(chapterArgument({})).toBeUndefined();
		expect(chapterArgument({ summary: '   ' })).toBeUndefined();
	});
});
