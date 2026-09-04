# CLAUDE.md

Operational notes for working on Glossa Catholica — only what must be true
before ANY file is touched. Each half carries its own notes, loaded when you
work under it: **`pipeline/CLAUDE.md`** (scrapers, rebuild, vatican.va,
audits) and **`site/CLAUDE.md`** (routes, edge, rendering, i18n, deploy).
Architecture and rationale live in `PLAN.md`, `docs/corpus-schema.md` and
`docs/link-surface.md`. **`docs/decisions.md` holds only what is true of the
whole project** — posture, scope, process — and its table at the top names the
file beside the code that decides everything else (`pipeline/docs/*.md`,
`site/docs/*.md`). Read that one rather than the whole set.

## The corpus: a separate repository, and two directories inside it

**The corpus is not in this repository.** It lives in `glossa-corpus`, a
**private** repository expected on disk as a sibling of this one — it holds
verbatim reproductions of texts other people hold rights in, and this
repository is public (`pipeline/docs/corpus.md`; the corpus repo's own
`README.md` has the copyright position).

Both halves resolve it the same way, so one exported variable moves both:

| Consumer    | Resolver                  | Default               |
| ----------- | ------------------------- | --------------------- |
| `pipeline/` | `common.corpus_dir()`     | `../glossa-corpus`    |
| `site/`     | `scripts/sync-corpus.mjs` | `../../glossa-corpus` |

Both honour **`CORPUS_DIR`**. The pipeline calls `common.require_corpus()` at
the top of each scraper's `main()` and dies with the path it tried — every
scraper creates its output with `parents=True` and would otherwise write a
phantom corpus somewhere nobody looks. The site warns and falls back to
fixtures.

Inside the corpus repo, **the directory names carry the distinction that
governs what may be deleted**:

| Path       | Value                                                                        | Rule                                |
| ---------- | ---------------------------------------------------------------------------- | ----------------------------------- |
| `build/`   | Parsed output. Rebuilt from cache in ~19s, zero network. **Untracked.**      | Safe to rebuild. Git holds no copy. |
| `oracles/` | Tables of contents read off the raw pages by hand. Nothing regenerates them. | Tracked. Treat like `raw/`.         |
| `raw/`     | Every scraped source page. The **only** artifact that cost real fetches.     | Treat as write-once. Never delete.  |

(`build/` was `works/`, tracked, until 2026-08-27 — §The corpus. It is one
copy plus the rebuild recipe now, `pipeline/rebuild.py` — see
`pipeline/CLAUDE.md`. **`build/` is shared by every worktree**, so it may
hold output another session's branch wrote; the site's sync excludes and
warns about work types it does not know, and their presence is not
corruption.)

The stated insurance policy is that any capture regret is fixed by
**re-parsing, never re-crawling** (`docs/link-surface.md`). That only holds
while `raw/` is intact. When judging whether a deletion is safe, the question
is never "is this corpus data" but _which of the two it is_.

**Output that is only regenerable from a previous copy of itself is not
regenerable.** This bit three times in one day: each was a fact the scrapers
kept alive by reading their own last `manifest.json`, so it survived a
re-parse and evaporated on a rebuild into an empty `build/` — which is the
supported way to get a corpus at all:

| what                                                     | where it lives now                             |
| -------------------------------------------------------- | ---------------------------------------------- |
| definitive 404s                                          | `pipeline/absent-sources.json`                 |
| what a missing sibling-language edition turned out to BE | `pipeline/translations-checked.json`           |
| the day each page was fetched (`retrieved_at`)           | `raw/<source>/captured-at.json`, in the corpus |
| which verse each Doré plate depicts                      | `pipeline/dore-anchors.json`                   |

The first two are knowledge derived where there is no page to sit beside, so
they are tracked here. The third belongs to the page, so it sits in `raw/`,
written by `Fetcher` at the moment it writes the file — the only point where
the answer is certain, since a cache hit never reaches it. (The dates were
recovered from filesystem mtimes, **which git does not preserve**.)

**The fourth is its own lesson: it WAS regenerable from `raw/`, and that was
the problem.** 202 of the 241 anchors came from tesseract, and OCR is not a
pure function of a file — a different engine build reads a digit differently,
so a rebuild could move a plate to a verse nobody chose, silently. The answer
was not to cache the read but to recognise the reconciliation had FINISHED:
the vote ran once, its result is committed, and the code that produced it was
deleted (2026-08-28) — evidence for a decision already taken belongs in git
history, not in a live file. `dore.py` kept only the image encoding, because
THAT is not settled and has to be able to run over the masters again.
**A pipeline stage that can only ever reproduce its own committed output is
not a pipeline stage.**

**The check that misses this class is a normalised field.** The rebuild
comparison excluded `retrieved_at` because the corpus README asserted it
carried no information — the assertion was false, and no reproducibility check
can disprove a claim that a value does not matter. Normalise `generated_at`
and `applied_at`, and nothing else.

**Deleting generated works is a decision for the person directing the work,
not a judgment call to make mid-task.** An agent once removed 105 empty work
directories on its own stub-detection heuristic; nothing was lost, but nothing
had authorized it either. If you are delegating, name the deletable set and
the protected set explicitly — a brief that only says what to _fix_ leaves
deletion as an unstated judgment call, and it will get taken.

## Linting: ruff and prettier, behind a hook that is not installed for you

Ruff's rules live in `ruff.toml` at the repo root — not a `pyproject.toml`,
because the scrapers are standalone PEP 723 `uv run --script` files. The
selection is pinned rather than left to ruff's defaults, which have widened
between releases.

```sh
ruff format pipeline && ruff check --fix pipeline
git config core.hooksPath .githooks     # once per clone; git runs nothing from a tracked dir by itself
```

`.githooks/pre-commit` runs `ruff format --check` and `ruff check` over the
**staged content** of every touched `.py` file — piped from `git show :path`,
so an unstaged fix cannot make a broken commit pass, nor an unstaged breakage
fail a clean one. `ruff` from `PATH`, falling back to `uvx ruff`;
`--no-verify` bypasses. Note `git config` writes `.git/config`, which the
sandbox masks — run that one line with the sandbox off.

**Prettier runs in the same hook, over what is staged and nothing else**
(§Process) — everything under `site/`, plus Markdown anywhere in the tree.
Two invocation details are load-bearing:

- It runs **from `site/`** whatever the file, because prettier resolves a
  config's `plugins` against the working directory (`prettier-plugin-svelte`)
  and `site/.prettierignore` only applies from there. Files outside `site/`
  are addressed as `../path`, resolve no config, and get prettier's defaults —
  which is what the Markdown here is written to.
- A file prettier **cannot parse exits 0** over stdin and complains only on
  stderr. So the hook fails on any stderr output, not on the exit status.

It uses `site/node_modules/.bin/prettier`, falls back to `prettier` from
`PATH` (fine for Markdown; a `.svelte` file needs the plugin), and skips the
whole section when nothing it owns is staged. The pipeline's JSON stays out of
it: `pipeline/corrections/`, `pipeline/overrides/` and `absent-sources.json`
are written by the scrapers, and a hook that reformatted them would fight
their writer. `site/` still owns `npm run format` / `check` / `test` for a
whole-tree pass; the hook only decides _when_ something runs.

## Documentation conventions

Avoid bare inventory counts (how many works, editions, languages) in this
file and in `docs/` — they rot silently as the corpus grows. Point at what
derives the number (`rebuild.py --list`, the sync's printed tables,
`works.json`), or date-stamp it. Keep a number only where it IS the evidence
for an argument.

New session lessons: the story goes to the `docs/` file beside the code it
governs — `pipeline/docs/` or `site/docs/`, listed in `docs/decisions.md`'s
table — and only a project-wide rule goes in `docs/decisions.md` itself. The
CLAUDE.md for the half it belongs to gets the rule, one line of evidence, and
the pointer. **One claim, then at most one clause of evidence**: the
measurement that justified a rule is in the commit that made it, and an entry
that retells it is an entry nobody finishes.

## Sandbox quirks that waste time

- **`rm` is aliased to `trash`**, which cannot write `~/.local/share/Trash`
  under the sandbox. It does not fail — it hangs forever at ~80% CPU and leaks
  the process. Delete with `/usr/bin/rm`.
- **Sandboxed `ps` cannot see processes from other tool calls** — each runs in
  its own PID namespace, so a genuinely-alive background job reads as dead.
  Use a heartbeat file, or check with the sandbox disabled.
- `git commit` needs `~/.gnupg` for signing, which the sandbox blocks.
