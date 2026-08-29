/**
 * Minify the built pages, then refuse a build that still ships a comment.
 *
 * `src/app.html` is the most heavily commented file in the repository, and it
 * is also the ONE document served at every canonical address — `ssr = false`
 * and the build emits no per-route HTML, so those notes are not a build-time
 * artifact that a bundler discards, they are bytes on the wire for every cold
 * visitor. Before anything ran here, `build/index.html` was 15,063 bytes of
 * which 7,383 (49%) were comments addressed to whoever edits the file next, and
 * `offline.html` 894 of 2,968. The comments are worth keeping; they are worth
 * keeping in `src/`.
 *
 * This is a POST-BUILD pass rather than a Vite plugin because neither HTML file
 * goes through Vite's HTML pipeline: `adapter-static` writes `index.html` in
 * SvelteKit's adapt phase, after every Vite bundle hook has run, and
 * `offline.html` is copied verbatim out of `static/`. A `transformIndexHtml`
 * hook sees neither, which is why `build.minify` — which does minify every
 * `.js` and `.css` Vite itself emits — leaves both of these alone. It is wired
 * as `postbuild` so it cannot be skipped by running `npm run build` instead of
 * `npm run deploy`.
 *
 * **AN HTML FILE IS NOT ONE SYNTAX, AND ASSUMING IT WAS COST 3,000 BYTES ON
 * EVERY COLD VISIT** (found 2026-08-28). This pass removed HTML comments and
 * deliberately did not reach inside `<script>`/`<style>`, because in JavaScript
 * `<!--` opens nothing and truncating the boot script would take the app down.
 * That rule is right and the conclusion drawn from it was wrong: the boot
 * script is where most of `app.html`'s commentary actually lives, so
 * `index.html` went on shipping 3,916 bytes of inline JavaScript at authoring
 * width — 48% of the document — with every note intact. The audit did not see
 * it either. It read `.html` as markup and `.js` as a program, and had no
 * notion that a `.html` file CONTAINS a program.
 *
 * Both halves are fixed by the same shift. `html-minifier-terser` parses the
 * document properly and hands each raw-text run to the right minifier (terser
 * for JavaScript, clean-css for CSS), which is a thing to take off the shelf
 * rather than write: the boot script holds strings containing `//`, a
 * `try`/`catch` per feature and an `indexOf` over a language list, and anything
 * short of a real parser eventually eats one of them. And `commentsIn` now
 * reads a page as the two or three syntaxes it is, which is what makes the
 * regression catchable next time rather than merely fixed this time.
 *
 * Its defaults already honour the two comments that must survive, so neither is
 * ours to special-case: a downlevel-revealed conditional (`<!--[if`) is markup,
 * and `ignoreCustomComments` keeps a `<!--!` banner, the convention for a
 * licence that has to survive minification. Neither appears here today; both
 * are cheap to keep honouring and expensive to notice the loss of.
 *
 * The audit is the half nothing else does. Measured over a full build: 85 `.js`
 * files (4.4 MB, including the service worker) carry zero comments and zero
 * newlines, 31 `.css` files zero, and `sitemap.xml`, `manifest.webmanifest` and
 * 2,760 corpus JSON files zero. That is the bundler's doing and nothing asserts
 * it — `vite.config.ts` names no `minify`, so it is a default, and a default is
 * exactly the kind of thing that changes underneath a project between releases.
 * `auditComments` turns the happy measurement into a checked property.
 *
 * **It must stay independent of the options above, which is why it is a scan
 * and not a fixed-point check.** Re-minifying the output and demanding it not
 * move would be tautological: drop `minifyJS` and the pass writes unminified
 * JavaScript that re-minifies to itself, and the check passes while the bytes
 * regress. A scan for comment syntax fires on the output whatever produced it.
 *
 * **Four files carry comments and keep them, deliberately** (decided
 * 2026-08-28), which is why the audit scans by file type rather than sweeping
 * every byte of text in the build:
 *
 * | file                        | why the comments stay                        |
 * | --------------------------- | -------------------------------------------- |
 * | `robots.txt`                | Its 22 lines say why there is no `Disallow` and why the sitemap is the only link graph. Addressed to the operator reading the file. |
 * | `.well-known/security.txt`  | The scope statement to a researcher IS the file's substance (RFC 9116 asks for three fields; the prose is what makes a report actionable). |
 * | `fonts/OFL-*.txt`           | Licences. The SIL OFL requires the notice be kept. |
 * | `_headers`                  | Read by Cloudflare out of the deployed directory and never served, so its comments are never on the wire at all. |
 *
 * `llms.txt` looks like a fifth and is not: it is Markdown, where a leading `#`
 * is a heading. That is the trap a byte-level `#` sweep would fall into, and
 * the reason this scans per syntax.
 *
 * The output is a pure function of the input — no timestamps, no ordering by
 * anything but the walk — because Wrangler dedupes uploads by content hash and
 * a rebuild that changed nothing should upload nothing.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * What the minifier is asked to do, and nothing beyond it.
 *
 * The list is short on purpose. `html-minifier-terser` will also drop optional
 * tags, unquote attribute values and rewrite `type` attributes away; each is a
 * further bet that our markup means exactly what the spec says it means, for a
 * few dozen bytes on a document that is already down to five kilobytes. These
 * four are the ones that pay: the comments, the authoring indentation, and the
 * two languages the document inlines.
 */
export const MINIFY_OPTIONS = {
	collapseWhitespace: true,
	removeComments: true,
	minifyJS: true,
	minifyCSS: true
};

/** Minify one document. Exported so the tests exercise the real settings. */
export const minifyHtml = (html) => minify(html, MINIFY_OPTIONS);

/** Every file under `dir`, depth-first, in directory order. */
function walk(dir) {
	const found = [];
	for (const entry of readdirSync(dir).sort()) {
		const full = path.join(dir, entry);
		if (statSync(full).isDirectory()) found.push(...walk(full));
		else found.push(full);
	}
	return found;
}

export async function minifyBuiltHtml(buildDir) {
	const report = [];
	for (const file of walk(buildDir).filter((f) => f.endsWith('.html'))) {
		const before = readFileSync(file, 'utf8');
		const after = await minifyHtml(before);
		if (after !== before) writeFileSync(file, after);
		report.push({
			file: path.relative(buildDir, file),
			before: Buffer.byteLength(before),
			after: Buffer.byteLength(after)
		});
	}
	return report;
}

/**
 * The file types where a comment can only be a comment.
 *
 * JSON is NOT among them, and it is the one exclusion that had to be measured
 * rather than reasoned: JSON has no comment syntax, so a `<!--` inside one is
 * data. 87 of the 2,760 built corpus files carry exactly that — stored document
 * text that ends mid-markup in the mirror it was captured from. None of them
 * closes the sequence today, so a JSON scan would have passed here and then
 * refused a build years later over a source page, not over anything anyone
 * wrote.
 *
 * `.js` is scanned for BLOCK comments and for a line that opens with `//`, and
 * not for `//` anywhere — the built JavaScript is one line of 1.9 MB with every
 * URL and regexp in the corpus inside it, and a naive scan would report the `//`
 * in `https://` several hundred times. A line comment cannot survive
 * minification anyway; a line that STARTS with `//` can only appear once
 * minification is off, which is the regression worth catching.
 *
 * `.html` is here as markup, and is also the key the raw-text scan below reads
 * its inner syntaxes out of this same table by.
 */
const COMMENT_SYNTAX = {
	'.html': [/<!--(?!\[|!).*?-->/gs],
	'.xml': [/<!--.*?-->/gs],
	'.js': [/\/\*.*?\*\//gs, /^[^\S\n]*\/\/.*$/gm],
	'.css': [/\/\*.*?\*\//gs]
};

/**
 * Comments a build may ship, each with the reason it is allowed.
 *
 * Empty today, and the point is what it is FOR: a dependency's `/*!` licence
 * banner surviving minification is the realistic way this check first fires,
 * and deleting a copyright notice to quiet a build script is the wrong answer
 * to it. An entry here keeps the notice and records the decision. Keyed on the
 * build-relative path, minus the content hash a build asset carries.
 */
const ALLOWED = {};

/**
 * A raw-text element's content, with the syntax it is written in.
 *
 * Per the HTML parser these elements end at the first `</script`/`</style`
 * however that sequence is quoted, so a literal search is the specified
 * behaviour rather than an approximation. A `<script>` is JavaScript unless its
 * `type` says otherwise — JSON-LD, an import map and a speculation-rules block
 * all ride in a `<script>` and are not programs — and a `src=` script has no
 * content to read at all.
 */
function rawTextRuns(html) {
	const lower = html.toLowerCase();
	const runs = [];
	const open = /<(script|style|title|textarea)\b([^>]*)>/gi;

	for (let tag; (tag = open.exec(html));) {
		const close = lower.indexOf(`</${tag[1].toLowerCase()}`, open.lastIndex);
		const end = close === -1 ? html.length : close;
		runs.push({ syntax: scriptSyntax(tag[1], tag[2]), start: open.lastIndex, end });
		open.lastIndex = end;
	}

	return runs;
}

function scriptSyntax(tag, attrs) {
	const name = tag.toLowerCase();
	if (name === 'style') return '.css';
	if (name !== 'script') return null;
	if (/\ssrc\s*=/i.test(attrs)) return null;
	const type = /\stype\s*=\s*("([^"]*)"|'([^']*)'|([^\s]+))/i.exec(attrs);
	const value = (type?.[2] ?? type?.[3] ?? type?.[4] ?? '').trim().toLowerCase();
	return ['', 'module', 'text/javascript', 'application/javascript'].includes(value) ? '.js' : null;
}

/** Every match of `patterns` in `text`. */
const matches = (patterns, text) =>
	patterns.flatMap((pattern) => [...text.matchAll(new RegExp(pattern))].map((m) => m[0]));

/**
 * Comments found in `text`, given the syntax its extension implies.
 *
 * Reading an HTML file as a single syntax gets the answer wrong in both
 * directions, and this check has made both mistakes. Scanned as markup alone,
 * the boot script's hundred lines of `//` were invisible — which is how they
 * shipped, past a check written to catch exactly this. Scanned as markup over
 * the whole file, a `<!--` inside a script string would be reported as a
 * comment it is not. So the raw-text runs are scanned in the syntax they are
 * written in, and blanked (newlines kept, so the line-comment rule still sees
 * line boundaries) before the markup scan runs over what is left.
 *
 * A `<title>` or `<textarea>` is raw text too, and is neither JavaScript nor
 * CSS. Neither is a JSON-LD block. Each is scanned as nothing rather than as
 * markup, which is the same reason JSON is absent from the table above.
 */
export function commentsIn(file, text) {
	const ext = path.extname(file).toLowerCase();
	const patterns = COMMENT_SYNTAX[ext];
	if (!patterns) return [];
	if (ext !== '.html') return matches(patterns, text);

	const found = [];
	// Blanking rather than cutting keeps a `<!--` and its `-->` from being
	// spliced together across a script that sat between them.
	let markup = '';
	let i = 0;

	for (const run of rawTextRuns(text)) {
		const source = text.slice(run.start, run.end);
		if (run.syntax) found.push(...matches(COMMENT_SYNTAX[run.syntax], source));
		markup += text.slice(i, run.start) + source.replace(/[^\n]/g, ' ');
		i = run.end;
	}

	return [...found, ...matches(patterns, markup + text.slice(i))];
}

/**
 * Every comment left in `buildDir` that nothing has excused.
 *
 * Runs AFTER the minify, so the HTML it walks is the HTML that ships.
 */
export function auditComments(buildDir) {
	const findings = [];
	for (const file of walk(buildDir)) {
		const rel = path.relative(buildDir, file);
		if (!(path.extname(rel).toLowerCase() in COMMENT_SYNTAX)) continue;
		if (ALLOWED[rel]) continue;
		const found = commentsIn(rel, readFileSync(file, 'utf8'));
		if (found.length > 0) findings.push({ file: rel, comments: found });
	}
	return findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const buildDir = path.join(siteRoot, 'build');

	const report = await minifyBuiltHtml(buildDir);
	if (report.length === 0) {
		console.error(`[minify-build] no HTML found under ${buildDir}. Did the build run?`);
		process.exit(1);
	}
	for (const { file, before, after } of report) {
		const saved = before - after;
		console.log(
			`[minify-build] ${file}: ${before} -> ${after} bytes` +
				(saved > 0 ? ` (-${saved}, ${Math.round((saved / before) * 100)}%)` : '')
		);
	}

	const findings = auditComments(buildDir);
	if (findings.length > 0) {
		console.error(
			`[minify-build] ${findings.length} built file(s) still carry comments. The site is one\n` +
				'shell served at every address, so anything here is bytes on the wire for every\n' +
				'reader. If a comment is a licence notice, keep it and record it in ALLOWED in\n' +
				'scripts/minify-build.mjs rather than deleting it.'
		);
		for (const { file, comments } of findings) {
			const bytes = comments.reduce((n, c) => n + Buffer.byteLength(c), 0);
			console.error(`  ${file}: ${comments.length} comment(s), ${bytes} bytes`);
			for (const comment of comments.slice(0, 3)) {
				console.error(`    ${comment.replace(/\s+/g, ' ').slice(0, 120)}`);
			}
		}
		process.exit(1);
	}
	console.log('[minify-build] no comments left in built HTML, JS, CSS or XML');
}
