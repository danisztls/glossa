import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
	contentDigest,
	importClosure,
	moved,
	shouldSkip,
	specifiersIn,
	treeDigest,
	walk
} from '../../scripts/incremental.mjs';

/**
 * The property under test throughout is the one `--changed-only` rests on: a
 * fingerprint moves when, and only when, an input this script actually reads
 * moved. Both errors are here on purpose, because they are not symmetric -- a
 * digest that moves too eagerly costs one unnecessary 13 s sync, and one that
 * moves too rarely serves a stale corpus. Every test that pins the loose
 * direction says so.
 */

let dir: string;
const at = (p: string) => path.join(dir, p);
const write = (p: string, s: string) => {
	mkdirSync(path.dirname(at(p)), { recursive: true });
	writeFileSync(at(p), s);
};

beforeAll(() => {
	dir = mkdtempSync(path.join(tmpdir(), 'glossa-incremental-'));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('specifiersIn', () => {
	it('reads a bare import that is followed by a `from` import', () => {
		// The regression the three-pattern split exists for: one combined
		// pattern scans past `./a.mjs` to the next statement's `from` and
		// loses the side-effect import entirely.
		expect(specifiersIn("import './a.mjs';\nimport x from './b.mjs';")).toEqual(
			expect.arrayContaining(['./a.mjs', './b.mjs'])
		);
	});

	it('reads a multi-line named import', () => {
		expect(specifiersIn("import {\n\ta,\n\tb\n} from './wide.ts';")).toContain('./wide.ts');
	});

	it('reads `export ... from` and a literal dynamic import', () => {
		expect(specifiersIn("export * from './re.ts';")).toContain('./re.ts');
		expect(specifiersIn("await import('./dyn.ts');")).toContain('./dyn.ts');
	});

	it('does not read a specifier out of a statement it does not start', () => {
		expect(specifiersIn("const s = './not-an-import.ts';")).toEqual([]);
	});
});

describe('importClosure', () => {
	beforeAll(() => {
		write('closure/entry.mjs', "import './side.mjs';\nimport { a } from './named.ts';\n");
		write('closure/side.mjs', "import fs from 'node:fs';\nimport 'html-minifier-terser';\n");
		// Written as `.js`, on disk as `.ts` -- tsconfig's
		// rewriteRelativeImportExtensions.
		write(
			'closure/named.ts',
			"import type { T } from './types';\nexport * from './rewritten.js';\n"
		);
		write('closure/types.ts', 'export type T = string;\n');
		write('closure/rewritten.ts', "import './entry.mjs';\n"); // cycle
	});

	it('follows relative imports transitively', () => {
		const files = importClosure(at('closure/entry.mjs')).map((f: string) => path.basename(f));
		expect(files).toEqual(['entry.mjs', 'named.ts', 'rewritten.ts', 'side.mjs', 'types.ts']);
	});

	it('stops at bare specifiers, which is the gap --force exists for', () => {
		const files = importClosure(at('closure/entry.mjs')).join(' ');
		expect(files).not.toContain('node:fs');
		expect(files).not.toContain('html-minifier-terser');
	});

	it('terminates on a cycle', () => {
		// rewritten.ts imports entry.mjs, which is where the walk began.
		expect(importClosure(at('closure/rewritten.ts'))).toHaveLength(5);
	});
});

describe('contentDigest', () => {
	beforeAll(() => write('content/a.json', '{"n":1}'));

	it('is stable across calls', () => {
		expect(contentDigest([at('content/a.json')], dir)).toBe(
			contentDigest([at('content/a.json')], dir)
		);
	});

	it('moves when a byte changes', () => {
		const before = contentDigest([at('content/a.json')], dir);
		write('content/a.json', '{"n":2}');
		expect(contentDigest([at('content/a.json')], dir)).not.toBe(before);
	});

	it('distinguishes a missing file from an empty one', () => {
		write('content/empty.json', '');
		expect(contentDigest([at('content/empty.json')], dir)).not.toBe(
			contentDigest([at('content/gone.json')], dir)
		);
	});

	it('is taken over paths RELATIVE to the base, so moving the tree is not a change', () => {
		// An absolute path in the hash would make "the corpus changed" and "the
		// corpus is somewhere else" indistinguishable, and only one of those is
		// a reason to re-derive.
		const nested = mkdtempSync(path.join(dir, 'moved-'));
		writeFileSync(path.join(nested, 'a.json'), '{"n":2}');
		expect(contentDigest([path.join(nested, 'a.json')], nested)).toBe(
			contentDigest([at('content/a.json')], at('content'))
		);
	});
});

describe('treeDigest', () => {
	beforeAll(() => {
		write('tree/one.json', 'x');
		write('tree/deep/two.json', 'y');
	});

	it('is stable across calls and covers nested files', () => {
		expect(walk(at('tree'))).toHaveLength(2);
		expect(treeDigest([at('tree')], dir)).toBe(treeDigest([at('tree')], dir));
	});

	it('moves when a file is added or removed', () => {
		const before = treeDigest([at('tree')], dir);
		write('tree/three.json', 'z');
		const grown = treeDigest([at('tree')], dir);
		expect(grown).not.toBe(before);
		rmSync(at('tree/three.json'));
		expect(treeDigest([at('tree')], dir)).toBe(before);
	});

	it('moves when mtime moves, which is what makes a git checkout re-run', () => {
		const before = treeDigest([at('tree')], dir);
		const t = new Date(Date.now() + 60_000);
		utimesSync(at('tree/one.json'), t, t);
		expect(treeDigest([at('tree')], dir)).not.toBe(before);
	});

	it('does NOT see a content edit that preserves size and mtime', () => {
		// THE ACCEPTED TRADEOFF, pinned so it is a decision and not a surprise:
		// hashing 460 MB of corpus costs more than the 13.3 s parse it would
		// save. Nothing writes a file's old mtime back except a restore, and a
		// restore of DIFFERENT bytes at the same size is not a case that arises
		// from the pipeline, which stamps what it writes.
		const stat = walk(at('tree/one.json'));
		expect(stat).toHaveLength(1);
		const before = treeDigest([at('tree')], dir);
		const t = new Date(2020, 0, 1);
		writeFileSync(at('tree/one.json'), 'X'); // same one byte
		utimesSync(at('tree/one.json'), t, t);
		const after = treeDigest([at('tree')], dir);
		utimesSync(at('tree/one.json'), t, t);
		expect(treeDigest([at('tree')], dir)).toBe(after);
		expect(after).not.toBe(before); // mtime did move here
	});

	it('distinguishes a missing root from an empty one', () => {
		mkdirSync(at('tree-empty'), { recursive: true });
		expect(treeDigest([at('tree-empty')], dir)).not.toBe(treeDigest([at('tree-gone')], dir));
	});
});

describe('moved / shouldSkip', () => {
	const now = { code: 'a', corpus: 'b', outputs: 'c' };

	it('treats no previous run as everything having moved', () => {
		expect(moved(now, {})).toEqual(['no previous run']);
		expect(shouldSkip(now, {})).toBe(false);
		expect(shouldSkip(now, undefined)).toBe(false);
	});

	it('skips only when every part matches', () => {
		expect(moved(now, { ...now })).toEqual([]);
		expect(shouldSkip(now, { ...now })).toBe(true);
	});

	it('names the parts that moved, and only those', () => {
		expect(moved(now, { ...now, corpus: 'other' })).toEqual(['corpus']);
		expect(moved(now, { code: 'x', corpus: 'b', outputs: 'y' })).toEqual(['code', 'outputs']);
	});

	it('does not skip when a part is absent from the record', () => {
		// A state file written by an older version of this script knows nothing
		// about a part added since, and must re-run rather than assume it.
		expect(shouldSkip(now, { code: 'a', corpus: 'b' })).toBe(false);
	});
});
