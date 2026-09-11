/**
 * `static/llms.txt`, filled from the corpus rather than remembered by hand.
 *
 * The file is prose, and it stays prose: `scripts/llms.template.md` is the
 * source, and this module only substitutes `{{TOKEN}}` placeholders into it.
 * The alternative — building the whole document from a template literal, the
 * way `write-security-txt.mjs` does — was refused because llms.txt is ~95%
 * Markdown carrying backticked code spans on nearly every line, and every one
 * of those would need escaping inside a JS template literal. A file people
 * edit for its wording should not be a file where the wording is the hard part.
 *
 * WHAT IS TOKENISED IS WHAT HAD ALREADY ROTTED. Not every number here is a
 * candidate: the Catechism's 2865 paragraphs are the publisher's fact and do
 * not move with the corpus, while the count of documents carrying a
 * description moves with every ingest. Both are derived anyway, because the
 * cost is one line each and the distinction is not one a future editor should
 * have to re-derive before touching a number.
 *
 * The languages are ENUMERATED here and deliberately not in the head's
 * descriptions (`src/lib/shell-head.ts`), which name none. The asymmetry is
 * the point: a reader has a language switcher and a `/{lang}/…` entry point,
 * so prose telling them what they can already see is noise; a client reading
 * this file has neither, and the editions sit behind a switch it cannot
 * operate, so the list is the one thing it cannot obtain any other way. That a
 * list of thirty tags is safe to write at all is a consequence of this file
 * being generated — it was not, while it was maintained by hand.
 */

import { censusFact } from './census.mjs';
import { hrefFor } from '../src/lib/address.ts';
import { CHROME_PATHS } from '../src/lib/route-manifest.ts';
import { SITE_ORIGIN } from '../src/lib/shell-head.ts';

const TOKEN = /\{\{([A-Z_]+)\}\}/g;

/**
 * The hosts named in the template, for `assertSourcesNamed`.
 * @param {string | null | undefined} url
 * @returns {string}
 */
function hostOf(url) {
	return String(url ?? '')
		.replace(/^https?:\/\//, '')
		.split('/')[0];
}

/**
 * The questions, as the landing page shelves them, for `{{TOPIC_LIST}}`.
 *
 * THE ONE ADDRESS FAMILY THIS FILE CANNOT STATE AS A GRAMMAR. Every other
 * address here is built by substitution from a citation the client already
 * holds — `CCC 1210` becomes `/catechismus/1210` — and a topic has no citation
 * to be built from: `{topic}` is a Latin slug and the reader arrived with a
 * sentence in their own language. So the set is enumerated, which is the only
 * form in which "you can write it without fetching anything" stays true of the
 * whole address space.
 *
 * ENUMERATED BY THE BUILD AND NEVER BY HAND, for the reason the rest of the
 * file is: a list of a hundred-odd rows maintained beside a tracked topic file
 * is a list that will describe last month's site, and this one would do it
 * while claiming to be complete. The order is `site/quaestiones.json`'s own,
 * doorway by doorway and then cluster by cluster, which is the order
 * `/quaestiones` draws — a client reading this and a reader reading the page
 * meet the questions in one sequence.
 *
 * The names come from `route-titles.json`'s topics rather than from the
 * dictionary directly, so what is published here is what the shell publishes
 * at the address, already guarded by `assertNamed`.
 *
 * @param {{doorways?: string[], clusters?: Record<string, string[]>, topics?: Record<string, {doorway: string, cluster: string}>}} index
 *   `site/quaestiones.json`, as the sync reads it
 * @param {Record<string, [string, string]>} names slug -> `[title, question]`
 * @param {Record<string, string>} english the English dictionary, for the shelf headings
 * @returns {string}
 */
export function topicList(index, names, english) {
	/** @type {string[]} */
	const lines = [];
	for (const doorway of index.doorways ?? []) {
		for (const cluster of index.clusters?.[doorway] ?? []) {
			const slugs = Object.entries(index.topics ?? {})
				.filter(([, topic]) => topic.doorway === doorway && topic.cluster === cluster)
				.map(([slug]) => slug);
			// An empty shelf renders nothing, exactly as it does on the page:
			// the sync already warns about one, and a heading over no questions
			// would be this file promising a shelf that is not there.
			if (slugs.length === 0) continue;
			const heading = english[`quaestiones.cluster.${cluster}`];
			if (!heading) {
				throw new Error(
					`llms.txt: no English heading for shelf \`${cluster}\` ` +
						`(quaestiones.cluster.${cluster}). The shelves are this list's only ` +
						`structure; publishing the key would name it to a reader.`
				);
			}
			lines.push(`### ${heading}`, '');
			for (const slug of slugs) {
				const named = names[slug];
				// `assertNamed` has already refused a build whose topic has no
				// title and question, so this cannot fire from the sync — it is
				// here because the alternative to failing is a row reading
				// `[undefined](…)`, which is the failure this whole module exists
				// to make impossible.
				if (!named) {
					throw new Error(
						`llms.txt: topic \`${slug}\` has no title and question in English, so it ` +
							`cannot be listed. route-titles.mjs drops such a topic; this file would ` +
							`publish the gap.`
					);
				}
				lines.push(
					`- [${named[0]}](${SITE_ORIGIN}${hrefFor({ kind: 'topic', slug })}) — ${named[1]}`
				);
			}
			lines.push('');
		}
	}
	if (lines.length === 0) {
		throw new Error(
			`llms.txt: the template has a section for the questions and this build has none. ` +
				`site/quaestiones.json is tracked in this repository rather than in the corpus, so ` +
				`an empty set means the file is missing or its topics were dropped — and the ` +
				`section would stand over nothing while telling a reader the set is complete.`
		);
	}
	return lines.join('\n').trim();
}

/**
 * The values the template asks for, projected out of the census.
 *
 * THIS FILE DERIVED THEM ITSELF UNTIL THE CENSUS EXISTED, off `routeManifest`,
 * `works` and `apparatus` in three lines that were each correct. What changed
 * is that a second consumer arrived: `/bibliotheca/census` states the document
 * count to a reader, this file states it to a machine, and two derivations of
 * one fact are two things to keep true. `censusFact` throws for a fact it
 * cannot find, so a renamed fact fails the build here rather than shipping the
 * word `undefined` inside a published sentence.
 *
 * THE QUESTIONS ARE NOT A FACT ABOUT THE CORPUS and so are not read here: a
 * topic is written in this repository, against a corpus that knows nothing
 * about it, which is why `topicList` takes its own three sources and this
 * function takes its output already rendered.
 *
 * @param {ReturnType<typeof import('./census.mjs').buildCensus>} census
 * @param {string} questions `topicList`'s output, for `{{TOPIC_LIST}}`
 * @returns {Record<string, string | number>}
 */
export function llmsFacts(census, questions) {
	return {
		TOPIC_LIST: questions,
		CCC_MAX: census.maxima.ccc,
		COMPENDIUM_MAX: census.maxima.compendium,
		CSDC_MAX: census.maxima.socialDoctrine,
		CANON_MAX: census.maxima.canonLaw,
		SUMMA_PARTS: census.summaParts.map((/** @type {string} */ part) => `\`${part}\``).join(', '),
		// NOT FROM THE CENSUS, like the questions above and for a different
		// reason. The census derives from the corpus; this is a property of the
		// app, and `sitemap.mjs` already reads the same constant to build the
		// clusters this sentence describes. Written by hand the list said eight
		// when there were fourteen, and had been wrong since `/ius-canonicum`
		// landed: a reader was told `/pt/calendarium` is an entry point that
		// canonicalizes away, when it is a real page with an `hreflang` set.
		// The count is deliberately not published beside it — the list
		// enumerates, so a number would be a second thing to keep true.
		CHROME_PATHS: CHROME_PATHS.map((path) => `\`${path}\``).join(', '),
		LANGUAGE_COUNT: census.languages.length,
		LANGUAGES: census.languages.join(', '),
		DOCUMENT_COUNT: censusFact(census, 'magisterium', 'documents'),
		DESCRIPTION_COUNT: censusFact(census, 'magisterium', 'described')
	};
}

/**
 * Fail the sync when the corpus draws on a publisher this file does not name.
 *
 * The same posture as `assertNamed` and `assertApparatus`, and for a stronger
 * reason than either: this file's central claim is "for the words, cite the
 * publisher", and it then lists them. A list that has fallen behind the corpus
 * does not merely omit — it tells a reader the enumeration is complete when it
 * is not. It was, when this was written: four hosts named against eleven in
 * use, so seven editions were being reproduced with no attribution anywhere a
 * machine could read.
 *
 * Hosts and not publisher names, because a host is what the template already
 * spells in a link and is the one form of the answer that cannot be worded two
 * ways — "Libreria Editrice Vaticana / Dicastery for Communication" and
 * "Libreria Editrice Vaticana" are one publisher and would be two strings.
 *
 * @param {string} template
 * @param {{works: {source?: string | null}[]}} works
 */
export function assertSourcesNamed(template, works) {
	const hosts = [
		...new Set(
			works.works
				.map((/** @type {{source?: string | null}} */ w) => hostOf(w.source))
				.filter(Boolean)
		)
	].sort();
	const missing = hosts.filter((host) => !template.includes(host));
	if (missing.length) {
		throw new Error(
			`llms.txt: works.json draws on ${missing.length} host(s) that scripts/llms.template.md ` +
				`does not name — ${missing.join(', ')}. Add a line for each under "Where the texts ` +
				`come from": the file tells readers to cite the publisher and then lists them, so a ` +
				`list behind the corpus is a false claim of completeness, not an omission.`
		);
	}
}

/**
 * Substitute, and refuse anything less than an exact match between what the
 * template asks for and what the corpus offered.
 *
 * BOTH DIRECTIONS ARE CHECKED. A token with no value would ship `{{LANGUAGES}}`
 * to a reader, which is obvious; a value with no token is the quiet one — it is
 * what a token deleted during an edit looks like, and it leaves a fact this
 * module still computes, still tests, and no longer publishes.
 *
 * @param {string} template
 * @param {Record<string, string | number>} facts
 * @returns {string}
 */
export function llmsTxt(template, facts) {
	// STRIPPED BEFORE THE SCAN, not after substitution. The comment is where
	// the template explains its own `{{TOKEN}}` syntax, so scanning the whole
	// file finds a token in the sentence describing tokens and demands a value
	// for it. Its being the note to whoever edits this is exactly why it must
	// not be read as content.
	const body = template.replace(/^<!--[\s\S]*?-->\n/, '');
	const asked = new Set([...body.matchAll(TOKEN)].map((m) => m[1]));
	const offered = new Set(Object.keys(facts));
	const missing = [...asked].filter((k) => !offered.has(k));
	const unused = [...offered].filter((k) => !asked.has(k));
	if (missing.length || unused.length) {
		throw new Error(
			`llms.txt: template and facts disagree.` +
				(missing.length ? ` No value for {{${missing.join('}}, {{')}}}.` : '') +
				(unused.length
					? ` Nothing consumes ${unused.join(', ')} — a token was probably deleted, which ` +
						`silently unpublishes a fact this module still computes.`
					: '')
		);
	}
	return body.replace(TOKEN, (/** @type {string} */ _, /** @type {string} */ key) =>
		String(facts[key])
	);
}
