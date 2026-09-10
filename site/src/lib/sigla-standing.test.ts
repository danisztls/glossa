import { afterEach, describe, expect, it } from 'vitest';
import { grammarSurface, setDocumentTitleSource, siglumStanding } from './refs-grammar';

/**
 * `siglumStanding` and the field it reads.
 *
 * WHAT THIS FILE GUARDS IS AN IDENTITY, not a parse. `/census` ranks the works
 * the apparatus asks for and this library has not got, and a row's identity is
 * the `names` on a siglum's table entry — so the two failures worth a test are
 * an entry that declares none (the work falls out of the ranking, silently) and
 * two entries naming one work two ways (one series arrives as two rows, each
 * with half its citations). Neither is visible in the output: a ranking with a
 * row missing looks exactly like a ranking.
 *
 * `refs.test.ts` mocks `./corpus` for its own reasons and this file must not,
 * so it lives apart rather than being folded in there.
 */

/** Every language the grammar has a config for — the tables reached through
 *  `grammarSurface`, which is the same map `parseRefs` reads. `zht` is the
 *  slug and not a BCP-47 tag, per `ui-langs.ts`. */
const LANGS = ['ar', 'de', 'en', 'es', 'fr', 'it', 'la', 'mg', 'pl', 'pt', 'ru', 'zht'];

/** The works whose language config contradicts its language's own table
 *  (`WORK_CONFIGS`) — carried so the Italian Martini and the Douay-tradition
 *  works are reached too, those being separate configs and separate tables. */
const WORKS = [undefined, 'summa.en', 'bible.douay-rheims.en', 'bible.martini.it'];

const entries = () =>
	LANGS.flatMap((lang) =>
		WORKS.flatMap((work) =>
			[...grammarSurface(lang, work).sigla].map(([siglum, entry]) => ({
				lang,
				work,
				siglum,
				entry
			}))
		)
	);

afterEach(() => setDocumentTitleSource(() => []));

describe('a siglum that names no ingested work declares what it does name', () => {
	/**
	 * THE ONE THAT CANNOT BE CAUGHT ANY OTHER WAY. A new bibliographic siglum
	 * added with an expansion and nothing else parses, glosses and renders
	 * exactly as its neighbours do; the only thing it does differently is
	 * vanish from the absence ranking. So the requirement is stated here rather
	 * than promised in a comment, and a new entry fails until somebody decides
	 * whether it names a work.
	 */
	it('declares `names` on every entry carrying neither a slug nor a work', () => {
		const undeclared = entries()
			.filter(({ entry }) => !entry.slug && !entry.work && entry.names === undefined)
			.map(({ lang, siglum }) => `${lang}:${siglum}`);
		expect(undeclared).toEqual([]);
	});

	/**
	 * `names` IS THE NAME AND NOT A KEY, so two tables spelling one work
	 * differently is the whole defect — measured before `ABSENT_WORKS` existed:
	 * Acta Apostolicae Sedis came out as two rows of 1,513 and 1,213, Migne as
	 * four, Denzinger as two. Referencing one constant is what makes them one
	 * row, and this asserts the tables really do reference it rather than
	 * repeating its text.
	 */
	it('spells one work one way across every table that abbreviates it', () => {
		// A name is one work; a name differing only in case or spacing is the
		// same work spelled twice, which is exactly what may not happen.
		const byFold = new Map<string, Set<string>>();
		for (const { entry } of entries()) {
			if (!entry.names) continue;
			const fold = entry.names.toLowerCase().replace(/\s+/g, ' ').trim();
			(byFold.get(fold) ?? byFold.set(fold, new Set()).get(fold)!).add(entry.names);
		}
		const split = [...byFold.values()].filter((names) => names.size > 1).map((n) => [...n]);
		expect(split).toEqual([]);
	});

	/** A dicastery, an office and one hour of the breviary are not works, and
	 *  the ranking must not offer them as things to ingest. `null` is how an
	 *  entry says so, which is why the assertion above admits it and the type
	 *  does not make it optional. */
	it('says `null` where the siglum names no work at all', () => {
		expect(grammarSurface('en').sigla.get('CDF')?.names).toBeNull();
		expect(grammarSurface('fr').sigla.get('off. lect.')?.names).toBeNull();
		expect(siglumStanding('CDF', 'en')).toEqual({ held: false, work: null });
	});
});

describe('siglumStanding', () => {
	const holding = (...slugs: string[]) =>
		setDocumentTitleSource(() => slugs.map((slug) => ({ slug, manifests: {} })));

	it('answers held for a siglum whose document the corpus has', () => {
		holding('lumen-gentium');
		expect(siglumStanding('LG', 'en').held).toBe(true);
	});

	/**
	 * THE DEFECT THIS FUNCTION EXISTS FOR, in the one form a test can reach
	 * without a corpus: a siglum naming as ABSENT a work another siglum claims
	 * as a document. Malagasy's `FM` expanded to "Familiaris consortio" with no
	 * slug beside it while `PAPAL_SIGLA`'s `FC` carried
	 * `slug: 'familiaris-consortio'` — so 21 citations rendered as a non-link
	 * to a document one tap away, and the first run of the absence ranking
	 * published the exhortation as a work to acquire.
	 *
	 * The comparison cuts each expansion at its parenthesis, those being the
	 * gloss written for one language's reader rather than part of the name. It
	 * flags rather than proves: a genuine pair of works whose names agree to
	 * the parenthesis would fail it, and that is the right way round.
	 *
	 * WHAT IT CANNOT SEE is the other half of the same defect — `MD` naming
	 * Mulieris dignitatem with no entry anywhere claiming a slug for it, the
	 * corpus having gained the work after the table was written. Only the
	 * corpus answers that one, which is what the census run does every build.
	 */
	it('does not name as absent a work another siglum claims as a document', () => {
		const nameOf = (text: string) => text.split(' (')[0].toLowerCase().trim();
		const claimed = new Map(
			entries()
				.filter(({ entry }) => entry.slug)
				.map(({ entry }) => [nameOf(entry.expansion), entry.slug!])
		);
		const contradicted = entries()
			.filter(({ entry }) => entry.names && claimed.has(nameOf(entry.names)))
			.map(({ lang, siglum, entry }) => `${lang}:${siglum} → ${claimed.get(nameOf(entry.names!))}`);
		expect(contradicted).toEqual([]);
	});

	/**
	 * `linksSigla` IS NOT CONSULTED, deliberately. Portuguese maps no siglum to
	 * a slug at all (`DOCUMENT_SIGLA_PT`), so today no entry in a table with
	 * the flag off carries one and the distinction is unreachable from here —
	 * but whether a language draws a link is a fact about its apparatus, and
	 * whether the corpus holds the work is not. Reading absence off a parsed
	 * segment's `slug` would make the first answer the second the day that
	 * table gains an entry.
	 */
	it('reads the corpus and not the table', () => {
		holding('lumen-gentium');
		expect(siglumStanding('LG', 'en').held).toBe(true);
		holding();
		expect(siglumStanding('LG', 'en').held).toBe(false);
	});

	/**
	 * A slug is a claim the corpus may not honour, and an unhonoured one is an
	 * absence rather than an error — the row leaves the ranking on the day the
	 * work is ingested, with nobody editing a list.
	 */
	it('treats a slug the corpus has not got as an absence, named by its expansion', () => {
		holding();
		const standing = siglumStanding('LG', 'en');
		expect(standing.held).toBe(false);
		expect(standing.work).toContain('Lumen Gentium');
	});

	it('answers held for the Code, which is addressed under a space of its own', () => {
		holding();
		expect(siglumStanding('CIC', 'en').held).toBe(true);
	});

	/** Two tables, one row. `SC` is the series in Latin and the constitution in
	 *  French, which is the collision `DOCUMENT_SIGLA_PT` was split off for —
	 *  so this also pins that the split survived. */
	it('names the series identically wherever the series is abbreviated', () => {
		holding();
		expect(siglumStanding('SC', 'la').work).toBe(siglumStanding('SCh', 'en').work);
		expect(siglumStanding('PL', 'en').work).toBe(siglumStanding('PL', 'la').work);
		expect(siglumStanding('CCL', 'la').work).toBe(siglumStanding('CCSL', 'la').work);
	});

	it('answers nothing for a siglum the language does not read', () => {
		holding();
		expect(siglumStanding('NOTASIGLUM', 'en')).toEqual({ held: false, work: null });
	});
});
