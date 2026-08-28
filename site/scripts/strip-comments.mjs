/**
 * Strip authored comments from the built pages, then refuse a build that still
 * ships one.
 *
 * `src/app.html` is the most heavily commented file in the repository, and it
 * is also the ONE document served at every canonical address — `ssr = false`
 * and the build emits no per-route HTML, so those notes are not a build-time
 * artifact that a bundler discards, they are bytes on the wire for every cold
 * visitor. Before this ran, `build/index.html` was 15,063 bytes of which 7,383
 * (49%) were comments addressed to whoever edits the file next, and
 * `offline.html` 894 of 2,968. The comments are worth keeping; they are worth
 * keeping in `src/`.
 *
 * HTML was the ONLY place they survived, which is the reason the second half of
 * this file exists. Measured over a full build: 85 `.js` files (4.4 MB,
 * including the service worker) carry zero comments and zero newlines, 31
 * `.css` files zero, and `sitemap.xml`, `manifest.webmanifest` and 2,760
 * corpus JSON files zero. That is the minifier's doing and nothing asserts it —
 * `vite.config.ts` names no `minify`, so it is a default, and a default is
 * exactly the kind of thing that changes underneath a project between releases.
 * `auditComments` turns the happy measurement into a checked property.
 *
 * The strip is a POST-BUILD pass rather than a Vite plugin because neither HTML
 * file goes through Vite's HTML pipeline: `adapter-static` writes `index.html`
 * in SvelteKit's adapt phase, after every Vite bundle hook has run, and
 * `offline.html` is copied verbatim out of `static/`. A `transformIndexHtml`
 * hook sees neither. It is wired as `postbuild` so it cannot be skipped by
 * running `npm run build` instead of `npm run deploy`.
 *
 * Two things the strip must not do:
 *
 * - **Touch raw-text elements.** `index.html`'s inline boot script is real
 *   JavaScript, where `<!--` opens nothing. Per the HTML parser a raw-text
 *   element ends at the first `</script`/`</style` however it is quoted, so
 *   scanning for that literal is the specified behaviour rather than an
 *   approximation.
 * - **Remove a comment something reads.** A downlevel-revealed conditional
 *   (`<!--[if`) is markup, and a `<!--!` banner is the convention for a licence
 *   that has to survive minification. Neither appears here today; both are
 *   cheap to keep honouring and expensive to notice the loss of.
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

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Elements whose content the parser reads as text, not markup. */
const RAW_TEXT = ['script', 'style', 'textarea', 'title'];

/** Comments that are read by something and must survive. */
const isLoadBearing = (comment) => comment.startsWith('<!--[') || comment.startsWith('<!--!');

/**
 * Remove comments from `html`, leaving raw-text element content alone.
 *
 * A comment that sat alone on its line takes the line's indentation and
 * newline with it; one that sat inline leaves the surrounding text untouched.
 */
export function stripHtmlComments(html) {
	const lower = html.toLowerCase();
	let out = '';
	let i = 0;

	while (i < html.length) {
		const open = html.indexOf('<!--', i);

		const raw = RAW_TEXT.map((tag) => {
			const at = lower.indexOf(`<${tag}`, i);
			return at === -1 ? null : { tag, at };
		})
			.filter((hit) => hit !== null)
			.sort((a, b) => a.at - b.at)[0];

		// Whichever comes first decides what happens next; a `<!--` inside a
		// raw-text element is never reached, because the element is copied
		// through as one span.
		if (raw && (open === -1 || raw.at < open)) {
			const close = lower.indexOf(`</${raw.tag}`, raw.at);
			const end = close === -1 ? html.length : close + raw.tag.length + 2;
			out += html.slice(i, end);
			i = end;
			continue;
		}

		if (open === -1) {
			out += html.slice(i);
			break;
		}

		const close = html.indexOf('-->', open);
		if (close === -1) {
			// An unterminated comment is a defect in the source, not something
			// to guess at. Copy the rest and let it be visible.
			out += html.slice(i);
			break;
		}

		const end = close + 3;
		const comment = html.slice(open, end);
		out += html.slice(i, open);

		if (isLoadBearing(comment)) {
			out += comment;
			i = end;
			continue;
		}

		// Drop the line the comment sat alone on, rather than leaving a run of
		// indentation followed by a blank line.
		const lineStart = out.lastIndexOf('\n') + 1;
		const alone = out.slice(lineStart).trim() === '';
		const after = /^[^\S\n]*\n/.exec(html.slice(end));
		if (alone && after) {
			out = out.slice(0, lineStart);
			i = end + after[0].length;
		} else {
			i = end;
		}
	}

	return out;
}

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

export function stripBuiltHtml(buildDir) {
	const report = [];
	for (const file of walk(buildDir).filter((f) => f.endsWith('.html'))) {
		const before = readFileSync(file, 'utf8');
		const after = stripHtmlComments(before);
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

/** Comments found in `text`, given the syntax its extension implies. */
export function commentsIn(file, text) {
	const patterns = COMMENT_SYNTAX[path.extname(file).toLowerCase()];
	if (!patterns) return [];
	return patterns.flatMap((pattern) => [...text.matchAll(new RegExp(pattern))].map((m) => m[0]));
}

/**
 * Every comment left in `buildDir` that nothing has excused.
 *
 * Runs AFTER the strip, so the HTML it walks is the HTML that ships.
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

	const report = stripBuiltHtml(buildDir);
	if (report.length === 0) {
		console.error(`[strip-comments] no HTML found under ${buildDir}. Did the build run?`);
		process.exit(1);
	}
	for (const { file, before, after } of report) {
		const saved = before - after;
		console.log(
			`[strip-comments] ${file}: ${before} -> ${after} bytes` +
				(saved > 0 ? ` (-${saved}, ${Math.round((saved / before) * 100)}%)` : '')
		);
	}

	const findings = auditComments(buildDir);
	if (findings.length > 0) {
		console.error(
			`[strip-comments] ${findings.length} built file(s) still carry comments. The site is one\n` +
				'shell served at every address, so anything here is bytes on the wire for every\n' +
				'reader. If a comment is a licence notice, keep it and record it in ALLOWED in\n' +
				'scripts/strip-comments.mjs rather than deleting it.'
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
	console.log('[strip-comments] no comments left in built HTML, JS, CSS or XML');
}
