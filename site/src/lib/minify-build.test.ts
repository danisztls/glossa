import { describe, expect, it } from 'vitest';

import { commentsIn, minifyHtml } from '../../scripts/minify-build.mjs';

/**
 * The post-build pass over `build/**\/*.html`.
 *
 * `src/app.html` is the one document served at every canonical address, and it
 * is nearly half comment — most of it inside the inline boot script, which is
 * the part a bundler never sees. The parsing is `html-minifier-terser`'s and is
 * not retested here; what these assert is that this project's two documents
 * come out the far end without the things it would be expensive to lose.
 */
describe('minifyHtml', () => {
	it('removes an authored comment', async () => {
		expect(await minifyHtml('<p>a</p><!-- why --><p>b</p>')).toBe('<p>a</p><p>b</p>');
	});

	// The reason this pass was rewritten. `<!--` opens nothing in JavaScript, so
	// the comment strip had to step around a `<script>` — and then everything
	// inside one shipped at authoring width, which was the larger half of the
	// bytes. The minifier reads the script as a program instead.
	it('minifies the inline boot script rather than stepping around it', async () => {
		const html = '<script>\n\t// why\n\tvar value = 1;\n\tconsole.log(value);\n</script>';
		expect(await minifyHtml(html)).toBe('<script>var value=1;console.log(value)</script>');
	});

	// `offline.html`'s `<style>` is 64% of the file and is copied verbatim out
	// of `static/`, so Vite never minifies it either.
	it('minifies an inline stylesheet', async () => {
		expect(await minifyHtml('<style>\n\tbody {\n\t\tcolor: red;\n\t}\n</style>')).toBe(
			'<style>body{color:red}</style>'
		);
	});

	// A string that merely looks like markup is text, and a minifier that read
	// it as markup would truncate the application at it. Terser goes one better
	// and escapes the sequence, so the string cannot be read as markup by the
	// HTML parser either — the value is unchanged, which is the part that
	// matters, and it is why this pass can be trusted with a `<script>` at all.
	it('escapes rather than eats a markup-shaped string inside a script', async () => {
		// `\x3c` and `\x3e` are `<` and `>`: the same string, spelled so that no
		// HTML parser can find a tag or a comment in it.
		expect(await minifyHtml('<script>var t = "<!-- not a comment -->";</script>')).toBe(
			'<script>var t="\\x3c!-- not a comment --\\x3e"</script>'
		);
	});

	// A downlevel-revealed conditional is markup, and a `<!--!` banner is the
	// convention for a licence meant to survive minification. Both are the
	// minifier's own defaults; the test is here because losing either would be
	// silent.
	it('keeps a conditional comment and a bang banner', async () => {
		expect(await minifyHtml('<!--[if IE]><p>a</p><![endif]--><!--! (c) someone -->')).toBe(
			'<!--[if IE]><p>a</p><![endif]--><!--! (c) someone -->'
		);
	});

	// Wrangler dedupes uploads by content hash: a second pass over an already
	// minified file must not keep nibbling at it.
	it('is idempotent', async () => {
		const once = await minifyHtml('<head>\n\t<!-- a -->\n\t<meta charset="utf-8" />\n</head>');
		expect(await minifyHtml(once)).toBe(once);
	});

	// A truncated comment is a defect in the source. Refusing the build names it
	// at the file it is in; the pass this replaced copied it through in silence.
	it('refuses an unterminated comment rather than guessing', async () => {
		await expect(minifyHtml('<p>a</p><!-- oops')).rejects.toThrow(/Parse Error/);
	});
});

/**
 * The audit that runs after the minify.
 *
 * It exists because nothing else asserts that the minifier is still removing
 * comments from JavaScript and CSS: `vite.config.ts` names no `minify`, so that
 * is a default, and defaults move between releases. It is a scan rather than a
 * re-minify-and-compare because the latter is tautological — drop `minifyJS`
 * and unminified output is still a fixed point of the same settings.
 *
 * What it must NOT do is report a comment in a file type that has none: the
 * corpus ships 87 JSON files carrying a bare `<!--` as stored document text.
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

	// The gap that let 3,916 bytes of commented JavaScript ship: an HTML file
	// was read as markup, and markup has no `//`.
	it('reads an inline script as JavaScript', () => {
		expect(commentsIn('index.html', '<html><script>\n// why\nvar a=1;\n</script></html>')).toEqual([
			'// why'
		]);
		expect(commentsIn('index.html', '<html><style>/* why */</style></html>')).toEqual([
			'/* why */'
		]);
	});

	// The other direction of the same mistake. A markup scan over the whole file
	// reports a comment the document does not contain.
	it('does not read a markup-shaped string inside a script as a comment', () => {
		expect(commentsIn('index.html', '<script>var t="<!-- not ours -->";</script>')).toEqual([]);
	});

	// A `<script>` written INSIDE a comment is not a script — the parser is in
	// comment state and never sees a tag. Blanking the run rather than cutting
	// it out is what keeps the surrounding `<!--` and `-->` findable as the one
	// comment they are, instead of losing the whole span to the inner scan.
	it('still reports a comment that has a script-shaped span inside it', () => {
		expect(commentsIn('index.html', '<p><!--<script>var a=1;</script>--></p>')).toEqual([
			'<!--<script>        </script>-->'
		]);
	});

	// Raw text that is neither a program nor a stylesheet is scanned as neither,
	// for the same reason JSON is: a `<!--` there is text.
	it('reads no comment syntax into a title or a JSON-LD block', () => {
		expect(commentsIn('index.html', '<title>a <!-- b --> c</title>')).toEqual([]);
		expect(
			commentsIn('index.html', '<script type="application/ld+json">{"a":"<!-- b -->"}</script>')
		).toEqual([]);
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

	// The minifier keeps these two; the audit must agree with it rather than
	// refuse the build over what the minify deliberately kept.
	it('agrees with the minifier about conditional and bang comments', async () => {
		const html = '<!--[if IE]><p>a</p><![endif]--><!--! (c) someone -->';
		expect(await minifyHtml(html)).toBe(html);
		expect(commentsIn('index.html', html)).toEqual([]);
	});
});
