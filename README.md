# Depositum

A free, ad-free, account-free site for reading and consulting the deposit of faith: the Bible, the Catechism of the Catholic Church, the Compendium of the Catechism, and (next) encyclicals and other magisterial documents. English and Portuguese. Desktop, mobile, and offline-first PWA.

_Depositum fidei_ — the deposit of faith.

## Structure

| Path        | What                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| `pipeline/` | Scrapers and build tools that produce the corpus (Python, `uv run` standalone scripts) |
| `corpus/`   | The built corpus (gitignored — fetched/built locally, never committed)                 |
| `site/`     | The SvelteKit site (static adapter, offline-first PWA)                                 |
| `docs/`     | Decision log, research, corpus schema                                                  |

Start with `docs/decisions.md` for what this is and why, and `docs/corpus-schema.md` for the data contract between pipeline and site.

## Content and copyright

Texts are reproduced verbatim, complete, and attributed. The corpus is never committed to this repository; only code is published here (MIT). See `docs/research/copyright.md` for the full rights picture and posture.

Bible texts: CPDV (English, public domain) and Matos Soares 1956 (Portuguese). Catechism and Compendium of the Catechism: Libreria Editrice Vaticana / USCCB text, reproduced from vatican.va. Encyclicals and conciliar documents (Vatican II first) are scoped and in progress — see `docs/decisions.md` §Vatican documents in scope and `docs/research/vatican-documents.md`.
