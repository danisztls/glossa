# CLAUDE.md

What must be true before any file is touched. Each half carries its own notes:
**`pipeline/CLAUDE.md`** (scrapers, rebuild, vatican.va, audits) and
**`site/CLAUDE.md`** (routes, edge, rendering, i18n, deploy). Rationale lives
beside the code it governs — `pipeline/docs/*.md`, `site/docs/*.md` — indexed by
the table at the top of `docs/decisions.md`, which itself holds only
project-wide posture, scope and process. Architecture: `PLAN.md`,
`docs/corpus-schema.md`, `docs/link-surface.md`.

## The corpus is a separate, private repository

`glossa-corpus`, expected on disk as a sibling of this one. It holds verbatim
reproductions of texts other people hold rights in; this repository is public
(`pipeline/docs/corpus.md`).

| Consumer    | Resolver                  | Default               |
| ----------- | ------------------------- | --------------------- |
| `pipeline/` | `common.corpus_dir()`     | `../glossa-corpus`    |
| `site/`     | `scripts/sync-corpus.mjs` | `../../glossa-corpus` |

Both honour **`CORPUS_DIR`**. `common.require_corpus()` runs at the top of each
scraper's `main()` and dies with the path it tried — every scraper creates its
output with `parents=True` and would otherwise write a phantom corpus somewhere
nobody looks. The site warns and falls back to fixtures.

### Four directories, and only one is safe to delete

| Path        | What                                                                                                                                       | Rule                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `raw/`      | Every scraped source page. The only artifact that cost real fetches.                                                                       | Write-once. Never delete.   |
| `authored/` | Text this project decided and the site serves — curated prayers, hand-corrected art masters, and the scripts recording each editorial act. | Tracked. Treat like `raw/`. |
| `oracles/`  | Readings kept only to check a parse, never served. Nothing regenerates them.                                                               | Tracked. Treat like `raw/`. |
| `build/`    | Parsed output. Rebuilt from cache in ~19s, zero network.                                                                                   | Untracked. Safe to delete.  |

Ask of anything new, in this order: did somebody else's server send it (`raw/`);
will the site serve it and did a person decide it here (`authored/`); does it
exist only to check a parse (`oracles/`); can a `rebuild.py` stage reproduce it
from those with no network (`build/`). Only the last may be deleted.

**`authored/` and `oracles/` are opposites.** An oracle tells you whether output
is right; `authored/` _is_ the output. `prayers_project.py` writes
`build/prayer.common.*` from `authored/prayers/`, and `prayers.py` only checks
the result. 17 scripts under `authored/prayers/curation/` rebuild all 35 files
in ~40s — and **that rebuild deliberately is not a pipeline stage and cannot be
made one**, because the curation reads its witnesses out of `build/`. Run in the
ordinary order every prayer would agree with itself and the check would pass for
the worst possible reason.

**`build/` is shared by every worktree**, so it may hold output another
session's branch wrote. The site's sync excludes and warns about work types it
does not know; their presence is not corruption.

### Output regenerable only from a previous copy of itself is not regenerable

Each of these was kept alive by a scraper reading its own last `manifest.json`:
it survives a re-parse and evaporates on a rebuild into an empty `build/`, which
is the supported way to get a corpus at all.

| Fact                                           | Where it lives                                 |
| ---------------------------------------------- | ---------------------------------------------- |
| definitive 404s                                | `pipeline/absent-sources.json`                 |
| what a missing sibling-language edition IS     | `pipeline/translations-checked.json`           |
| the day each page was fetched (`retrieved_at`) | `raw/<source>/captured-at.json`, in the corpus |
| which verse each Doré plate depicts            | `pipeline/dore-anchors.json`                   |

The first two are knowledge derived where there is no page to sit beside, so
they are tracked here. The third belongs to the page, written by `Fetcher` at
the moment it writes the file — the only point where the answer is certain,
since a cache hit never reaches it. (The dates were recovered from filesystem
mtimes, which git does not preserve.)

The fourth _was_ regenerable from `raw/`, and that was the problem: 202 of the
241 anchors came from tesseract, and OCR is not a pure function of a file. The
answer was to recognise that the reconciliation had finished — the vote ran
once, its result is committed, and the code that produced it was deleted.
**Evidence for a decision already taken belongs in git history, not in a live
file.** `dore.py` kept only the image encoding, which is not settled and has to
be able to run over the masters again.

**A normalised field is the check that misses this class.** The rebuild
comparison excluded `retrieved_at` because the corpus README asserted it carried
no information; the assertion was false, and no reproducibility check can
disprove a claim that a value does not matter. Normalise `generated_at` and
`applied_at`, and nothing else.

The insurance policy is that any capture regret is fixed by **re-parsing, never
re-crawling** (`docs/link-surface.md`). That holds only while `raw/` is intact.

**Deleting generated works is a decision for the person directing the work**,
not a judgment call to make mid-task. When delegating, name the deletable set
and the protected set explicitly — a brief that only says what to _fix_ leaves
deletion as an unstated judgment call, and it will get taken.

## Linting: ruff and prettier, behind a hook you must install

Ruff's rules are in `ruff.toml` at the repo root, not a `pyproject.toml` — the
scrapers are standalone PEP 723 `uv run --script` files. The selection is pinned
rather than left to ruff's defaults, which have widened between releases.

```sh
ruff format pipeline && ruff check --fix pipeline
git config core.hooksPath .githooks   # once per clone, with the sandbox off
```

`.githooks/pre-commit` checks the **staged content** of every touched file,
piped from `git show :path`, so an unstaged fix cannot make a broken commit pass
nor an unstaged breakage fail a clean one. `--no-verify` bypasses.

- Ruff over `.py`: `ruff` from `PATH`, falling back to `uvx ruff`.
- Prettier over everything under `site/`, plus Markdown anywhere in the tree.
  It runs **from `site/`** whatever the file, because prettier resolves a
  config's `plugins` against the working directory (`prettier-plugin-svelte`)
  and `site/.prettierignore` only applies from there. Files outside `site/` are
  addressed as `../path`, resolve no config, and get prettier's defaults —
  which is what the Markdown here is written to.
- **A file prettier cannot parse exits 0** over stdin and complains only on
  stderr, so the hook fails on stderr output rather than on exit status.
- It uses `site/node_modules/.bin/prettier`, falls back to `prettier` from
  `PATH` (fine for Markdown; a `.svelte` file needs the plugin), and skips the
  section when nothing it owns is staged.
- `pipeline/corrections/`, `pipeline/overrides/` and `absent-sources.json` stay
  out: the scrapers write them, and a reformatting hook would fight their writer.

`site/` owns `npm run format` / `check` / `test` for a whole-tree pass; the hook
only decides _when_ something runs.

## Documentation conventions

- **No bare inventory counts** (works, editions, languages) here or in `docs/` —
  they rot silently as the corpus grows. Point at what derives the number
  (`rebuild.py --list`, the sync's printed tables, `works.json`) or date-stamp
  it. Keep a number only where it is the evidence for an argument.
- **A session lesson goes to the `docs/` file beside the code it governs** —
  `pipeline/docs/` or `site/docs/`, listed in `docs/decisions.md`'s table. Only
  a project-wide rule goes in `docs/decisions.md` itself. The CLAUDE.md for that
  half gets the rule, one clause of evidence, and the pointer.
- **One claim, then at most one clause of evidence.** The measurement that
  justified a rule is in the commit that made it; an entry that retells it is an
  entry nobody finishes.

## Sandbox quirks that waste time

- **`rm` is aliased to `trash`**, which cannot write `~/.local/share/Trash`
  under the sandbox. It does not fail — it hangs at ~80% CPU and leaks the
  process. Delete with `/usr/bin/rm`.
- **Sandboxed `ps` sees only its own PID namespace**, so a live background job
  from another tool call reads as dead. Use a heartbeat file, or check with the
  sandbox off.
- `git commit` needs the gpg-agent socket under `/run/user/$UID/gnupg/`, which
  the sandbox cannot write; signing fails with `No agent running`. Run commits
  with the sandbox off.
