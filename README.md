# Glossa Catholica

A free, ad-free, account-free site for reading and consulting the deposit of faith: the Bible, the Catechism of the Catholic Church, the Compendium of the Catechism, and (next) encyclicals and other magisterial documents. English and Portuguese. Desktop, mobile, and offline-first PWA.

_Glossa_ — the apparatus of cross-references and commentary that medieval scribes set around the sacred page. The _Glossa Ordinaria_ was not its compiler's opinions; it was the Fathers, gathered and attributed, arranged so the page could be read with everything it pointed at. That is what this is meant to be.

## Structure

| Path        | What                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| `pipeline/` | Scrapers and build tools that produce the corpus (Python, `uv run` standalone scripts) |
| `corpus/`   | The built corpus (gitignored — fetched/built locally, never committed)                 |
| `site/`     | The SvelteKit site (static adapter, offline-first PWA)                                 |
| `docs/`     | Design decisions, research, corpus schema                                              |

Start with `docs/decisions.md` for the project-wide posture, scope and process, and for the table naming which of `pipeline/docs/` and `site/docs/` decides what; `docs/corpus-schema.md` is the data contract between pipeline and site. See `PLAN.md` for the current development plan — what's done, in flight, and next, and why.

## Content and copyright

Texts are reproduced verbatim, complete, and attributed. The corpus is never committed to this repository; only code is published here (MIT). See `docs/research/copyright.md` for the full rights picture and posture.

Bible texts: CPDV (English, public domain) and Matos Soares 1956 (Portuguese). Catechism and Compendium of the Catechism: Libreria Editrice Vaticana / USCCB text, reproduced from vatican.va. Encyclicals and conciliar documents (Vatican II first) are scoped and in progress — see `docs/decisions.md` §Scope and `docs/research/vatican-documents.md`.
