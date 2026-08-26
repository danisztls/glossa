#!/usr/bin/env node
/**
 * Regenerate `static/og.png`, the link-preview card.
 *
 * Run by hand, not by the build:
 *
 *     node scripts/og-image.mjs
 *
 * and commit the PNG it writes. The build must not depend on it — it shells
 * out to two system binaries (`woff2_decompress` and `rsvg-convert`) that are
 * on nobody's dependency list, and a deploy that needs them is a deploy that
 * fails on a machine which is otherwise fine. The card changes when the site's
 * NAME or DESCRIPTION changes, which is roughly never; a committed PNG is the
 * honest representation of that.
 *
 * WHY A SCRIPT AT ALL, RATHER THAN AN IMAGE SOMEBODY DREW. The card is the
 * wordmark, and the wordmark is `src/lib/components/Wordmark.svelte` — live
 * type in the site's own faces, with a lockup whose second line is sized by a
 * ratio derived from the font's advance widths. Redrawing that by hand in an
 * editor produces a second wordmark that drifts from the first, which is the
 * exact failure that component's docblock spends a paragraph warning about.
 * Here the ratio, the tracking, the two reds and the paper are read from the
 * same places the running site reads them, and the words themselves come from
 * `static/manifest.webmanifest` — so the card cannot claim a name or a
 * description the site does not.
 *
 * WHY THE FONTS TAKE A DETOUR. `static/fonts/` holds woff2, which is what a
 * browser wants and what no rasterizer will load: librsvg resolves families
 * through fontconfig, and fontconfig does not read woff2. So each face is
 * decompressed to a TTF in a temp directory, fontconfig is pointed at THAT
 * directory and nothing else, and the render is therefore reproducible on a
 * machine whose system fonts are entirely different from this one. Pointing it
 * at the system font set instead would let a locally-installed "EB Garamond"
 * of a different vintage answer, silently, and the card would be set in a face
 * the site does not ship.
 *
 * Note the Pirata One file is the DROP-CAP SUBSET the site already ships —
 * 137 codepoints, A-Z a-z 0-9 and some punctuation (see the @font-face in
 * `src/app.css`). It covers the wordmark because the wordmark is letters, and
 * it would not cover, say, an accented name. If this card ever has to set one,
 * the subset is what to widen.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(here, '..');
const staticDir = path.join(siteDir, 'static');
const outputPath = path.join(staticDir, 'og.png');

/**
 * 1200x630 is the size every consumer of this file states in its own
 * documentation (Facebook, LinkedIn, Slack, Twitter's `summary_large_image`),
 * and `app.html` declares it in `og:image:width`/`og:image:height` so an
 * unfurler can reserve the space before the bytes arrive. `shell-meta.test.ts`
 * reads the PNG header and fails when the two disagree.
 */
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * The light palette from `src/app.css` — `--color-bg-elevated` for the paper,
 * `--color-text`, `--color-text-muted`, `--color-border`, and `--color-initial`
 * for the G.
 *
 * ONE THEME, NOT TWO, and it is the light one. A preview card is a single
 * image served to a reader whose theme this file cannot know, so there is no
 * `prefers-color-scheme` to answer; the choice is which of the site's looks
 * represents it, and that is the paper. `--color-initial` (fresh vermilion,
 * the drop cap) rather than `--color-accent` (the sober link red) for the same
 * reason the wordmark uses it on the page: this is one large decorative glyph,
 * which is the job that pigment was ground for.
 */
const PAPER = '#f6f5f1';
const INK = '#1c1a17';
const MUTED = '#6b6559';
const RULE = '#ddd9d0';
const VERMILION = '#b03024';

/**
 * The lockup's geometry, copied from `src/lib/components/Wordmark.svelte` —
 * read the docblock there before changing any of it. The ratio in particular
 * is DERIVED from Pirata One's advance widths so that both lines come out the
 * same visible width; it is not a taste value, and a card that nudges it is a
 * second wordmark.
 */
const CATHOLICA_RATIO = 0.6181;
const GLOSSA_TRACKING = 0.01; // em
const CATHOLICA_TRACKING = 0.08; // em

/** Type sizes, in px on the 1200x630 canvas. */
const GLOSSA_SIZE = 190;
const CATHOLICA_SIZE = GLOSSA_SIZE * CATHOLICA_RATIO;
const SUBLINE_SIZE = 44;
const DOMAIN_SIZE = 24;

/**
 * Baselines and rules, balanced against the RENDERED INK rather than against
 * the boxes: the measured ink of everything below spans y 101-539 inside a
 * frame whose inner edge is 47-583, i.e. 54px of air above and 44px below,
 * which reads as centred because the eye puts optical centre slightly high.
 * Moving any of these means re-measuring (`magick og.png -fuzz 5% -trim
 * info:`), not re-deriving — the wordmark's ink box is nothing a font metric
 * hands you.
 */
const GLOSSA_BASELINE = 248;
const CATHOLICA_BASELINE = 366;
const DIVIDER_Y = 418;
const DIVIDER_HALF_WIDTH = 70;
const SUBLINE_BASELINE = 478;
const DOMAIN_BASELINE = 533;

/** The domain, which is `wrangler.jsonc`'s `routes` pattern. */
const DOMAIN = 'glossacatholica.org';

/**
 * The three faces the card sets, as they are named in `static/fonts/` and as
 * fontconfig will report them once decompressed. The family names are the
 * fonts' own — `fc-scan` says so — and NOT the `@font-face` family names
 * `app.css` invents ("EB Garamond Variable", "Pirata One Subset"), which exist
 * only inside a browser's CSS.
 */
const FACES = [
	{ file: 'pirata-one-dropcap.woff2', family: 'Pirata One' },
	{ file: 'eb-garamond-latin-wght-normal.woff2', family: 'EB Garamond' },
	{ file: 'source-sans-3-latin-wght-normal.woff2', family: 'Source Sans 3' }
];

/** What the card says, read from the file the browser reads it from. */
function readWords() {
	const manifest = JSON.parse(readFileSync(path.join(staticDir, 'manifest.webmanifest'), 'utf8'));

	// Two words, set one over the other. `Wordmark.svelte` hardcodes them as
	// markup because a component is not a place to parse a name; here the
	// split is what keeps the card from outliving a rename.
	const words = String(manifest.name).split(/\s+/);
	if (words.length !== 2) {
		throw new Error(
			`manifest name must be two words for the lockup, got ${JSON.stringify(manifest.name)}`
		);
	}

	// The description's first clause. The whole sentence names four bodies of
	// text and a licence posture — right for a search result, four lines of
	// small type in an image. The clause before the em dash is the sentence's
	// own summary of itself, so the card says what the description says
	// without the card being a second description to keep in sync.
	const [clause] = String(manifest.description).split(' — ');
	if (!clause || clause === manifest.description) {
		throw new Error('manifest description has no leading clause (expected " — " in it)');
	}

	return { words, clause, description: String(manifest.description) };
}

const escapeXml = (text) =>
	text.replace(
		/[&<>"']/g,
		(c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]
	);

/**
 * A tracked line, centred.
 *
 * The `x` offset is the whole subtlety. CSS letter-spacing — and SVG's, which
 * is the same property — puts a space after the LAST glyph as well as between
 * glyphs, so a `text-anchor="middle"` line centres its advance box, trailing
 * space included, and the ink lands half a space to the left. `Wordmark.svelte`
 * removes that space with a negative `margin-inline-end`; there is no such
 * thing here, so the anchor moves right by half of it instead. Same correction,
 * opposite end.
 */
function trackedLine({ text, size, tracking, baseline, extra = '' }) {
	const spacing = size * tracking;
	const x = WIDTH / 2 + spacing / 2;
	return `<text x="${x.toFixed(2)}" y="${baseline}" font-size="${size.toFixed(2)}" letter-spacing="${spacing.toFixed(2)}"${extra}>${text}</text>`;
}

function buildSvg({ words, clause }) {
	const [first, second] = words;
	// The initial is a `tspan` for the same reason the component makes it a
	// `<span>`: it is the drop-cap letterform in the drop-cap colour, which is
	// what makes the wordmark and every chapter opening one system.
	const glossa = `<tspan fill="${VERMILION}">${escapeXml(first.slice(0, 1))}</tspan>${escapeXml(first.slice(1))}`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
	<!-- A double rule, the frame a title page carries. Half-pixel origins so
	     the odd stroke widths land on the pixel grid rather than straddling it. -->
	<rect x="36.5" y="36.5" width="${WIDTH - 73}" height="${HEIGHT - 73}" fill="none" stroke="${RULE}" stroke-width="3"/>
	<rect x="46.5" y="46.5" width="${WIDTH - 93}" height="${HEIGHT - 93}" fill="none" stroke="${RULE}" stroke-width="1"/>
	<g font-family="Pirata One" fill="${INK}" text-anchor="middle">
		${trackedLine({ text: glossa, size: GLOSSA_SIZE, tracking: GLOSSA_TRACKING, baseline: GLOSSA_BASELINE })}
		${trackedLine({ text: escapeXml(second), size: CATHOLICA_SIZE, tracking: CATHOLICA_TRACKING, baseline: CATHOLICA_BASELINE })}
	</g>
	<line x1="${WIDTH / 2 - DIVIDER_HALF_WIDTH}" y1="${DIVIDER_Y}" x2="${WIDTH / 2 + DIVIDER_HALF_WIDTH}" y2="${DIVIDER_Y}" stroke="${VERMILION}" stroke-width="2"/>
	<text x="${WIDTH / 2}" y="${SUBLINE_BASELINE}" font-family="EB Garamond" font-size="${SUBLINE_SIZE}" fill="${INK}" text-anchor="middle">${escapeXml(clause)}</text>
	<text x="${WIDTH / 2}" y="${DOMAIN_BASELINE}" font-family="Source Sans 3" font-weight="400" font-size="${DOMAIN_SIZE}" fill="${MUTED}" text-anchor="middle" letter-spacing="2.5">${escapeXml(DOMAIN)}</text>
</svg>
`;
}

/** `execFileSync`, with the "you are missing a binary" case made legible. */
function run(binary, args, options = {}) {
	try {
		return execFileSync(binary, args, { stdio: ['ignore', 'pipe', 'pipe'], ...options });
	} catch (error) {
		if (error.code === 'ENOENT') {
			const packages = { woff2_decompress: 'woff2', 'rsvg-convert': 'librsvg' };
			throw new Error(
				`${binary} is not on PATH. It ships in the \`${packages[binary] ?? binary}\` package; ` +
					'this script is run by hand and deliberately not part of the build, so nothing ' +
					'else here needs it.'
			);
		}
		const stderr = error.stderr ? String(error.stderr).trim() : '';
		throw new Error(`${binary} failed: ${stderr || error.message}`);
	}
}

/** Decompress the site's own faces into `dir` and point fontconfig at them. */
function stageFonts(dir) {
	for (const face of FACES) {
		const staged = path.join(dir, face.file);
		copyFileSync(path.join(staticDir, 'fonts', face.file), staged);
		// Writes `<name>.ttf` beside its input, which is why the woff2 was
		// copied into the temp directory rather than read from static/.
		run('woff2_decompress', [staged]);
	}

	const configPath = path.join(dir, 'fonts.conf');
	writeFileSync(
		configPath,
		`<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
	<dir>${dir}</dir>
	<cachedir>${path.join(dir, 'cache')}</cachedir>
	<config></config>
</fontconfig>
`
	);
	return configPath;
}

/** The PNG header, read back so the script asserts what it produced. */
function pngSize(file) {
	const header = readFileSync(file).subarray(0, 24);
	return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

function main() {
	const { words, clause, description } = readWords();
	const dir = mkdtempSync(path.join(tmpdir(), 'glossa-og-'));
	try {
		const configPath = stageFonts(dir);
		const svgPath = path.join(dir, 'og.svg');
		writeFileSync(svgPath, buildSvg({ words, clause }));

		run('rsvg-convert', ['-w', String(WIDTH), '-h', String(HEIGHT), svgPath, '-o', outputPath], {
			env: { ...process.env, FONTCONFIG_FILE: configPath }
		});
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}

	const { width, height } = pngSize(outputPath);
	if (width !== WIDTH || height !== HEIGHT) {
		throw new Error(`rsvg-convert wrote ${width}x${height}, expected ${WIDTH}x${HEIGHT}`);
	}

	console.log(
		`wrote static/og.png (${width}x${height})\n` +
			`  wordmark: ${words.join(' ')}\n` +
			`  subline:  ${clause}\n` +
			`  (from manifest description: ${description})`
	);
}

main();
