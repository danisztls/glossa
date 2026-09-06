import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * No surface may write a citation's chapter mark as a literal.
 *
 * IT IS A SOURCE SCAN BECAUSE THE DEFECT IS INVISIBLE TO EVERY OTHER CHECK.
 * `${ref.chapter}:${verse}` compiles, types, renders, and is correct in
 * English — which is the language the person writing it is reading. It is
 * wrong in the eight interface languages whose citation grammar puts a comma
 * there, and the only reader who can see it is one of those. Nothing that runs
 * here renders a component, and no test asserts about a language nobody
 * thought to write a case for; so the thing to assert about is the SOURCE, as
 * `pigments.test.ts` does for a colour literal and `index-priming.test.ts`
 * does for a resolver that moved.
 *
 * THE RULE IT ENFORCES is `site/docs/references.md`'s: a citation this site
 * COMPOSES takes its mark from `grammarSurface`, the table the parser matches
 * against, so a composed citation can never be spelled in a form the parser
 * refuses. `chapterVerseSep()` in `citation-style.ts` is that call for the
 * three surfaces reading the reader's own edition; `scriptureSpecimen` and
 * `localizeCite` take a language as an argument and reach the same table.
 *
 * THIS WAS WRITTEN AFTER THE THIRD OCCURRENCE AND IMMEDIATELY FOUND TWO MORE.
 * `PrayerReferences` printed `Lucas 1:28` under the Ave Maria; running the
 * scan before fixing it turned up `CitedBy`'s verse label and — the one a
 * screenshot had already caught — the link preview card's own title, which is
 * how `Psalms 94:1-9` came to head a card on a page with no other English on
 * it. Three surfaces, three authors, one literal.
 */

/**
 * A CHAPTER interpolated, then a bare `:` or `,`, then the verse.
 *
 * The leading `[\s\x60]` is the whole discriminator and is worth stating: a
 * citation a reader SEES has a space before the chapter (`Lucas 1,28`) or
 * begins with it, while an internal key has a colon (`luke:1:28`). So
 * `${citer.osis}:${citer.chapter}:${citer.verse}` — a dedupe key, a
 * `LATE_MERGE` lookup, a preview cache key — does not match, and no exemption
 * list is needed for the several that exist. A key spelled like a label is
 * indistinguishable from one, which is why `lectionary/cite.ts`'s comparison
 * string is written colon-separated.
 *
 * The trailing lookahead is the other half: the mark must be followed by the
 * verse itself. `${address.chapter}, with the Catechism…` is an English
 * sentence in a `<head>` description, and a comma in a sentence is a comma.
 *
 * WHAT IT DOES NOT CATCH, said plainly rather than implied: a chapter held in
 * a variable this does not recognise (`${c}:${v}`), and a citation assembled
 * across statements. It catches the shape all five occurrences had, which is
 * the shape someone writes when they are not thinking about it — and someone
 * not thinking about it is the entire failure mode.
 */
const LITERAL_SEP = /[\s`]\$\{[^}]*\bchapter\b[^}]*\}[:,](?=\$\{|\d)/i;

const SRC = new URL('..', import.meta.url);

/** Every `.ts` and `.svelte` file under `src/`, tests excluded — a test is not
 *  a surface, and its assertion labels are keys by another name. */
function sourceFiles(dir: string): string[] {
	return readdirSync(new URL(dir, SRC), { withFileTypes: true }).flatMap((entry) => {
		const path = `${dir}${entry.name}`;
		if (entry.isDirectory()) return sourceFiles(`${path}/`);
		if (entry.name.endsWith('.test.ts')) return [];
		return /\.(ts|svelte)$/.test(entry.name) ? [path] : [];
	});
}

describe('a composed citation takes its chapter mark from the grammar', () => {
	const files = sourceFiles('lib/').concat(sourceFiles('routes/'));

	it('finds the shape it is looking for', () => {
		// So the scan cannot pass by matching nothing. These are the two real
		// occurrences, as they were written.
		expect(
			LITERAL_SEP.test('label: `${bookName(citer.osis)} ${citer.chapter}:${citer.verse}`')
		).toBe(true);
		expect(LITERAL_SEP.test('`${ref.chapter}:${span(ref.first, ref.last)}`')).toBe(true);
		// And these are the internal keys standing beside them, which it must
		// not claim: a key is colon-separated, a sentence's comma is followed
		// by a word.
		expect(LITERAL_SEP.test('key: `${citer.osis}:${citer.chapter}:${citer.verse}`')).toBe(false);
		expect(LITERAL_SEP.test('`${book}, chapter ${address.chapter}, with the Catechism.`')).toBe(
			false
		);
	});

	it('scans a real tree', () => {
		// The scan is worthless if the walk finds nothing; `lib/` alone is
		// nearly two hundred files.
		expect(files.length).toBeGreaterThan(100);
	});

	it('is written nowhere', () => {
		const offenders = files.filter((path) =>
			LITERAL_SEP.test(readFileSync(new URL(path, SRC), 'utf8'))
		);
		// ZERO, and not a threshold. Each one of these is a citation printed in
		// English punctuation to a reader whose language does not use it; the
		// fix is `chapterVerseSep()` from `$lib/citation-style`, or the
		// language-taking table call where the caller already has a language.
		expect(offenders).toEqual([]);
	});
});
