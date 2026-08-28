import { describe, expect, it } from 'vitest';

// @ts-expect-error -- plain-Node build script, no types
import { commentsIn, stripHtmlComments } from '../../scripts/strip-comments.mjs';

/**
 * The post-build pass over `build/**\/*.html`.
 *
 * `src/app.html` is the one document served at every canonical address, and it
 * is nearly half comment. The risk of removing them at build time is not that
 * too few go — it is that the pass reaches into a place where `<!--` is not a
 * comment at all, and the only such place in this build is the inline boot
 * script that starts the app.
 */
describe('stripHtmlComments', () => {
	it('removes an authored comment', () => {
		expect(stripHtmlComments('<p>a</p><!-- why --><p>b</p>')).toBe('<p>a</p><p>b</p>');
	});

	it('takes the line a comment sat alone on', () => {
		expect(stripHtmlComments('<head>\n\t<!-- note -->\n\t<title>x</title>\n</head>')).toBe(
			'<head>\n\t<title>x</title>\n</head>'
		);
	});

	it('leaves the surrounding text of an inline comment alone', () => {
		expect(stripHtmlComments('a <!-- x --> b')).toBe('a  b');
	});

	it('spans a multi-line comment', () => {
		expect(stripHtmlComments('<a>\n<!-- one\n     two -->\n<b>')).toBe('<a>\n<b>');
	});

	// The boot script SvelteKit writes into the shell is real JavaScript, where
	// `<!--` opens nothing. Reaching into it would truncate the application.
	it('does not read inside a script', () => {
		const html = '<script>\n\tconst t = "<!-- not a comment -->";\n</script>\n<p>a</p>';
		expect(stripHtmlComments(html)).toBe(html);
	});

	it('does not read inside a style', () => {
		const html = '<style>\n\t/* <!-- kept --> */\n</style>';
		expect(stripHtmlComments(html)).toBe(html);
	});

	// A downlevel-revealed conditional is markup, and a `<!--!` banner is the
	// convention for a licence meant to survive minification.
	it('keeps a conditional comment and a bang banner', () => {
		expect(stripHtmlComments('<!--[if IE]><p>a</p><![endif]-->')).toBe(
			'<!--[if IE]><p>a</p><![endif]-->'
		);
		expect(stripHtmlComments('<!--! (c) someone -->')).toBe('<!--! (c) someone -->');
	});

	// Wrangler dedupes uploads by content hash: a second pass over an already
	// stripped file must not keep nibbling at it.
	it('is idempotent', () => {
		const once = stripHtmlComments('<head>\n\t<!-- a -->\n\t<meta />\n</head>');
		expect(stripHtmlComments(once)).toBe(once);
	});

	// A truncated comment is a defect in the source. Swallowing the rest of the
	// document would be a far worse answer than leaving it visible.
	it('copies an unterminated comment through rather than eating the document', () => {
		expect(stripHtmlComments('<p>a</p><!-- oops')).toBe('<p>a</p><!-- oops');
	});
});

/**
 * The audit that runs after the strip.
 *
 * It exists because nothing else asserts that the minifier is still removing
 * comments from JavaScript and CSS: `vite.config.ts` names no `minify`, so that
 * is a default, and defaults move between releases. What it must NOT do is
 * report a comment in a file type that has none — the corpus ships 87 JSON
 * files carrying a bare `<!--` as stored document text.
 */
describe('commentsIn', () => {
	it('finds a block comment in JavaScript', () => {
		expect(commentsIn('app.js', 'const a=1;/*! (c) someone */const b=2;')).toEqual([
			'/*! (c) someone */'
		]);
	});

	// The built JavaScript is one line of 1.9 MB holding every URL in the corpus.
	// A scan for `//` anywhere reports several hundred `https://`.
	it('does not read a protocol separator as a line comment', () => {
		expect(commentsIn('app.js', 'const u="https://example.org/x";')).toEqual([]);
	});

	// A line that opens with `//` cannot appear in minified output, so it is the
	// signal that minification itself has been turned off.
	it('finds a line comment that opens a line', () => {
		expect(commentsIn('app.js', 'const a=1;\n\t// why\nconst b=2;')).toEqual(['\t// why']);
	});

	it('finds a comment in CSS and in XML', () => {
		expect(commentsIn('app.css', 'a{color:red}/* why */')).toEqual(['/* why */']);
		expect(commentsIn('sitemap.xml', '<urlset><!-- why --></urlset>')).toEqual(['<!-- why -->']);
	});

	// 87 built corpus files carry a bare `<!--` — stored document text that ends
	// mid-markup in the mirror it was captured from. JSON has no comment syntax,
	// so scanning it would refuse a build over a source page.
	it('reads no comment syntax into JSON', () => {
		expect(commentsIn('0001-0050.json', '{"html":"<!-- not ours -->"}')).toEqual([]);
	});

	it('ignores a file type with no comment syntax at all', () => {
		expect(commentsIn('robots.txt', '# why\nUser-agent: *')).toEqual([]);
		expect(commentsIn('font.woff2', '\\x00\\x01')).toEqual([]);
	});

	// The stripper leaves these two; the audit must agree with it rather than
	// refuse the build over what the strip deliberately kept.
	it('agrees with the stripper about conditional and bang comments', () => {
		const html = '<!--[if IE]><p>a</p><![endif]--><!--! (c) someone -->';
		expect(stripHtmlComments(html)).toBe(html);
		expect(commentsIn('index.html', html)).toEqual([]);
	});
});
