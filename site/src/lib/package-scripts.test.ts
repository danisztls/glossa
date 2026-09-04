import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * THE SCRIPT TABLE IS THE ONE PART OF THIS PROJECT WITH NO COMPILER BEHIND IT.
 *
 * Every composite here is a string naming another string. Rename `build` and
 * `prebuild` stops running — no error, no warning, just a deploy that ships
 * whatever `corpus-data/` happened to hold. Delete a `.mjs` and the script that
 * calls it fails only when someone runs it, which for `coverage:accept` or
 * `usage` may be months. `svelte-check` does not read package.json and `vitest`
 * does not either, so nothing else in the repo can notice.
 *
 * These are the invariants that were true when the scripts were regrouped on
 * 2026-09-03 and that a later edit could break silently.
 */

const siteRoot = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', siteRoot), 'utf8'));

/** @type {Record<string, string>} */
const scripts: Record<string, string> = pkg.scripts;
const names = new Set(Object.keys(scripts));

/**
 * npm runs `pre<name>` and `post<name>` around `npm run <name>` on its own.
 * That is a feature for the three below and a trap for everything else: FIVE of
 * this project's script names begin with `pre` or `post` for reasons that have
 * nothing to do with hooks — `preview`, `preview:edge`, `preview:deploy`,
 * `preflight`, and npm's own `prepare`. None collides today. Adding a script
 * called `view`, `flight` or `view:deploy` would silently turn one of them into
 * a hook of the other, and the symptom would be a server starting before a
 * command nobody connected them.
 */
const INTENTIONAL_HOOKS: Readonly<Record<string, string>> = {
	predev: 'dev',
	prebuild: 'build',
	postbuild: 'build'
};

/** npm lifecycle scripts that hook npm itself, not another entry in this table. */
const NPM_LIFECYCLE = new Set(['prepare']);

function hookTarget(name: string): string | undefined {
	for (const prefix of ['pre', 'post']) {
		if (name.startsWith(prefix) && name.length > prefix.length) return name.slice(prefix.length);
	}
	return undefined;
}

describe('package.json scripts', () => {
	it('never calls a script that does not exist', () => {
		const broken: string[] = [];
		for (const [name, body] of Object.entries(scripts)) {
			for (const [, called] of body.matchAll(/npm run ([\w:-]+)/g)) {
				if (!names.has(called)) broken.push(`${name} -> npm run ${called}`);
			}
		}
		expect(broken, 'A composite names a script that is not in the table.').toEqual([]);
	});

	it('never calls a scripts/*.mjs that does not exist', () => {
		const missing: string[] = [];
		for (const [name, body] of Object.entries(scripts)) {
			for (const [, file] of body.matchAll(/node (scripts\/[\w.-]+\.mjs)/g)) {
				if (!existsSync(new URL(file, siteRoot))) missing.push(`${name} -> ${file}`);
			}
		}
		expect(missing, 'A script names a file that is not on disk.').toEqual([]);
	});

	it('keeps every intended pre/post hook attached to a script that exists', () => {
		// The failure this catches has no symptom of its own. If `build` were
		// renamed, `prebuild` and `postbuild` would simply stop running: the
		// corpus would not be re-derived, the built HTML would not be minified,
		// and the build would still exit 0.
		for (const [hook, target] of Object.entries(INTENTIONAL_HOOKS)) {
			expect(names.has(hook), `${hook} is missing`).toBe(true);
			expect(names.has(target), `${hook} hooks ${target}, which no longer exists`).toBe(true);
		}
	});

	it('has no accidental pre/post hook', () => {
		const accidental: string[] = [];
		for (const name of names) {
			if (name in INTENTIONAL_HOOKS || NPM_LIFECYCLE.has(name)) continue;
			const target = hookTarget(name);
			if (target && names.has(target)) accidental.push(`${name} would run before/after ${target}`);
		}
		expect(
			accidental,
			'npm runs pre<name>/post<name> automatically. Rename one of the two, or add the pair to ' +
				'INTENTIONAL_HOOKS if it is meant.'
		).toEqual([]);
	});

	it('gates a deploy and its rehearsal on exactly the same thing', () => {
		// `preview:deploy` exists to be `deploy` without the deploy. The moment
		// the two prefixes disagree, the rehearsal stops rehearsing — which is
		// the one thing it is for.
		const gate = 'npm run build && npm run preflight';
		expect(scripts.deploy.startsWith(gate), `deploy: ${scripts.deploy}`).toBe(true);
		expect(
			scripts['preview:deploy'].startsWith(gate),
			`preview:deploy: ${scripts['preview:deploy']}`
		).toBe(true);
	});

	it('runs every non-watch check under `verify`', () => {
		// There is no CI on this project (site/docs/edge.md: a deploy
		// ships one person's working tree), so `verify` is the only place the
		// three checks are named together. A check that is not here is a check
		// that runs when someone remembers it.
		for (const part of ['format:check', 'check', 'test']) {
			expect(scripts.verify, `verify does not run ${part}`).toContain(`npm run ${part}`);
		}
	});

	it('keeps `verify:calendar` OUT of `verify`', () => {
		// The colon reads as membership and this one is not a member, so the
		// exception is a test rather than a line in a table nobody rereads.
		// `verify` must stay runnable on any checkout: format, types and the
		// hermetic suite, no corpus and no network. `verify:calendar` reads
		// 281 files of somebody else's computed calendars out of the private
		// corpus and would turn a missing checkout into a failed verify.
		// Checking our calendar against theirs is a development task, done
		// while working on the calendar — see `vitest.oracle.config.ts`.
		expect(scripts['verify:calendar']).toBeDefined();
		expect(scripts.verify).not.toContain('verify:calendar');
		// And it must not creep into the hermetic run either, which is the
		// same rule stated where it would actually be broken.
		expect(scripts.test).toBe('vitest run');
	});

	it('leaves no scripts/*.mjs unreachable', () => {
		// Five of these are hand-run tools with no npm script — the book-forms
		// oracle, the three exporters, the OG card. They are reachable because
		// something names them: a test imports them, or a docblock says when to
		// run them. One that nothing names at all is dead code, and this is the
		// only place that would notice.
		const sources = [
			readFileSync(new URL('package.json', siteRoot), 'utf8'),
			...readdirSync(new URL('scripts/', siteRoot))
				.filter((f) => f.endsWith('.mjs'))
				.map((f) => `${f}\n${readFileSync(new URL(`scripts/${f}`, siteRoot), 'utf8')}`),
			...walkTs(fileURLToPath(new URL('src/', siteRoot))).map((f) => readFileSync(f, 'utf8'))
		];
		const unreachable = readdirSync(new URL('scripts/', siteRoot))
			.filter((f) => f.endsWith('.mjs'))
			.filter((f) => sources.filter((s) => s.includes(f)).length < 2);
		expect(unreachable, 'Nothing names these. Wire them up or delete them.').toEqual([]);
	});
});

function walkTs(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const full = `${dir}/${entry.name}`;
		if (entry.isDirectory()) return walkTs(full);
		return entry.name.endsWith('.ts') || entry.name.endsWith('.svelte') ? [full] : [];
	});
}
