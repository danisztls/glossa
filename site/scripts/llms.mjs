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
 * The values the template asks for, read off the same objects the sync has
 * already built. `routeManifest` answers for the address space, `works` for
 * who published what and in which languages, `apparatus` for how much of the
 * commentary is ours.
 *
 * @param {object} input
 * @param {Record<string, any>} input.routeManifest
 * @param {{works: {source?: string | null, languages?: string[]}[]}} input.works
 * @param {{descriptions: Record<string, string>}} input.apparatus
 * @returns {Record<string, string | number>}
 */
export function llmsFacts({ routeManifest, works, apparatus }) {
	const languages = [
		...new Set(works.works.flatMap((/** @type {{languages?: string[]}} */ w) => w.languages ?? []))
	].sort();
	return {
		CCC_MAX: Math.max(...routeManifest.ccc),
		COMPENDIUM_MAX: Math.max(...routeManifest.compendium),
		CSDC_MAX: Math.max(...routeManifest.socialDoctrine),
		CANON_MAX: Math.max(...routeManifest.canonLaw),
		SUMMA_PARTS: Object.keys(routeManifest.summa)
			.map((part) => `\`${part}\``)
			.join(', '),
		LANGUAGE_COUNT: languages.length,
		LANGUAGES: languages.join(', '),
		DOCUMENT_COUNT: routeManifest.documents.length,
		DESCRIPTION_COUNT: Object.keys(apparatus.descriptions).length
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
