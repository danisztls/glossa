import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * EVERY PALETTE, EVERY INK, AGAINST BOTH GROUNDS IT IS DRAWN ON.
 *
 * `styles/tokens.css` says of the colours that "the contrast bar each colour
 * was picked to clear" is not recoverable from the hex alone. This recovers it:
 * the bars are written here once, and the file is measured against them.
 *
 * IT IS A TEST AND NOT A NOTE BECAUSE THE PALETTES MULTIPLY. Four appearance
 * axes compose into six live palettes, and an edit is made against ONE of them
 * — the one the person editing has on screen. Sepia's muted ink sat at 4.45:1
 * on the paper and 3.97:1 on the elevated surface, under a 4.5 bar, through
 * every pass this file has had; it is the colour of every caption, credit,
 * count and label-micro on the site, and the elevated surface is the header,
 * the footer and every panel. Nothing about looking at it says 3.97.
 *
 * THE SECOND BAR IS 3:1 AND IT IS NOT ABOUT TEXT (WCAG 1.4.11). A divider may
 * be as faint as it likes — it carries no information. The edge of a field a
 * reader types into may not: those fields fill in `--color-bg-elevated` over a
 * `--color-bg` page, which is 1.09:1, so the border is the entire affordance.
 * That is `--color-control-border`, and `--color-border` is deliberately not
 * held to it.
 *
 * THE THIRD CHECK IS THAT THE TWO COPIES AGREE. Dark, OLED and mono are each
 * written twice — once under `@media (prefers-color-scheme: …)` for the auto
 * setting and once under an explicit `[data-theme]` — and a value changed in
 * one copy and not the other is a palette that differs depending on how the
 * reader arrived at it.
 */

const TOKENS = new URL('../styles/tokens.css', import.meta.url).pathname;

/** Every innermost `selector { … }` block's `--color-*` declarations. Blocks
 *  nested in an `@media` are found rather than swallowed with the at-rule,
 *  because both halves of the pattern refuse a brace. */
function blocks(css: string): Map<string, Record<string, string>> {
	const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const found = new Map<string, Record<string, string>>();
	for (const rule of stripped.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
		const selector = rule[1].trim().replace(/\s+/g, ' ');
		if (!selector.startsWith(':root')) continue;
		const declarations: Record<string, string> = found.get(selector) ?? {};
		for (const declaration of rule[2].matchAll(/(--color-[\w-]+)\s*:\s*([^;]+);/g)) {
			declarations[declaration[1]] = declaration[2].trim();
		}
		found.set(selector, declarations);
	}
	return found;
}

const SHEET = blocks(readFileSync(TOKENS, 'utf8'));

function block(selector: string): Record<string, string> {
	const found = SHEET.get(selector);
	// A selector that stopped matching would make every assertion below
	// vacuous — an empty palette has no ink to measure.
	if (!found) throw new Error(`tokens.css no longer has a \`${selector}\` block`);
	return found;
}

/** The palettes as a browser resolves them: each layer overriding the one
 *  before it, in the order `tokens.css`'s own docblock fixes. */
const PALETTES = {
	light: { ...block(':root') },
	sepia: { ...block(':root'), ...block(':root[data-sepia]') },
	dark: { ...block(':root'), ...block(":root[data-theme='dark']") },
	oled: {
		...block(':root'),
		...block(":root[data-theme='dark']"),
		...block(":root[data-theme='dark'][data-oled]")
	},
	'mono-light': { ...block(':root'), ...block(":root[data-mono][data-theme='light']") },
	'mono-dark': {
		...block(':root'),
		...block(":root[data-theme='dark']"),
		...block(":root[data-mono][data-theme='dark']")
	}
} as const;

/** The `@media` copy of a palette, and the explicit copy it must equal. */
const DOUBLED: [string, string, string][] = [
	['dark', ":root:not([data-theme='light'])", ":root[data-theme='dark']"],
	['oled', ":root[data-oled]:not([data-theme='light'])", ":root[data-theme='dark'][data-oled]"],
	[
		'mono on paper',
		":root[data-mono]:not([data-theme='dark'])",
		":root[data-mono][data-theme='light']"
	],
	[
		'mono at night',
		":root[data-mono]:not([data-theme='light'])",
		":root[data-mono][data-theme='dark']"
	]
];

/**
 * The bar each ink clears, and against which grounds.
 *
 * `--color-initial` takes 3:1 rather than 4.5 because a drop cap is three
 * lines of the reading measure tall, which is large text by any reading of the
 * rule. `--color-bookmark` does not: it sets a small mark and a line of
 * metadata beside the reader's own quotations.
 */
const INK: Record<string, number> = {
	'--color-text': 4.5,
	'--color-text-muted': 4.5,
	'--color-link': 4.5,
	'--color-accent': 4.5,
	'--color-apparatus': 4.5,
	'--color-bookmark': 4.5,
	'--color-initial': 3,
	// Not text. The ring has to be findable and the field edge has to say
	// where the field is; neither has to be readable.
	'--color-focus-ring': 3,
	'--color-control-border': 3
};

const GROUNDS = ['--color-bg', '--color-bg-elevated'];

const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance(hex: string): number {
	const value = parseInt(hex.slice(1), 16);
	const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) =>
		channel(c / 255)
	);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
	const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
}

/** Every value this test measures is a literal hex, and that is load-bearing:
 *  a `color-mix()` resolves in the browser and not here, so one arriving on an
 *  ink or a ground would be measured as nothing at all. */
function hex(palette: Record<string, string>, token: string): string {
	const value = palette[token];
	if (!value) throw new Error(`no \`${token}\` in this palette`);
	if (!/^#[0-9a-f]{6}$/i.test(value)) {
		throw new Error(`\`${token}\` is \`${value}\` — this test can only measure a literal hex`);
	}
	return value;
}

describe('the palette is legible in every appearance', () => {
	it('finds the six palettes to measure', () => {
		expect(Object.keys(PALETTES)).toHaveLength(6);
		for (const [name, palette] of Object.entries(PALETTES)) {
			expect(Object.keys(palette).length, `${name} resolved to nothing`).toBeGreaterThan(10);
		}
	});

	it.each(Object.entries(PALETTES))('%s clears the bar on both grounds', (_name, palette) => {
		const failures: string[] = [];
		for (const [token, bar] of Object.entries(INK)) {
			for (const ground of GROUNDS) {
				const ratio = contrast(hex(palette, token), hex(palette, ground));
				if (ratio < bar) failures.push(`${token} on ${ground}: ${ratio.toFixed(2)} < ${bar}`);
			}
		}
		expect(failures).toEqual([]);
	});

	it.each(Object.entries(PALETTES))(
		'%s sets its own contrast ink on the accent',
		(_name, palette) => {
			// `.segment.current` and every filled button draw this pair and nothing
			// else, so neither of the grounds above is the one to measure it against.
			const ratio = contrast(
				hex(palette, '--color-accent-contrast'),
				hex(palette, '--color-accent')
			);
			expect(ratio).toBeGreaterThanOrEqual(4.5);
		}
	);
});

describe('a palette written twice is written the same twice', () => {
	it.each(DOUBLED)('%s', (_name, media, explicit) => {
		expect(block(media)).toEqual(block(explicit));
	});
});
