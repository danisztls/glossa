"""Helpers shared by the scrapers in this directory.

WHY THIS MODULE EXISTS, given that each scraper is a standalone PEP 723
`uv run --script` file. Two comments in this directory used to assert that
sharing was impossible or unwanted -- that the scripts have "no common import
path", and that "small duplication [is] preferred over a shared module per
project convention". Neither was true. There is no such project convention
(nothing in CLAUDE.md, docs/decisions.md or docs/corpus-schema.md states one),
and the import path is simply the directory the script already lives in:
Python puts a script's own directory on `sys.path` at startup, so a sibling
module imports with a plain `import common` no matter what the working
directory is. PEP 723 metadata governs third-party DEPENDENCIES; it does not
prevent a script from importing a local module that has none.

WHAT BELONGS HERE is code with no per-source behaviour -- or code whose
per-source behaviour can be DECLARED rather than open-coded. That second
clause is newer than this module, and it is the whole of the difference
between the two lists below.

WHAT IS SHARED, and why sharing it costs nothing:

  - **The fetching skeleton** (`Fetcher`, `FetchPolicy`). This module used to
    say the four `Fetcher`s could not be shared, because they "genuinely
    differ -- retry policy, raise-vs-return-status error handling, even the
    HTTP library -- and unifying them is a design decision about behavior, not
    a mechanical merge". Every word of that stayed true; what changed is that
    the design decision was taken. The differences are now `FetchPolicy`, a
    value each scraper declares for its own source, and the identical part --
    look in the cache, wait out the floor, make one request, store the bytes
    verbatim -- is written once.
  - **Rate limits, as declared values.** Still not shared, and the guarantee
    is stronger than before: `FetchPolicy` has no default for `delay` or
    `user_agent`, so a new scraper cannot inherit another source's floor by
    forgetting to state one. Four copies of `CRAWL_DELAY = 2.0` never provided
    that. vatican.va's 2.0s is a commitment from its robots.txt
    (docs/decisions.md); sacredbible.org and liriocatolico.com.br chose their
    own, and sacredbible.org spends its floor AFTER a request rather than
    before -- a difference `delay_before` preserves precisely because it is
    the kind of thing a "consistency" merge would quietly erase.
  - **Output writing** (`write_stamped_json`, `write_if_changed`,
    `json_text`). Not merely duplicated: the `generated_at` trap that defeats
    the naive version is a thing each scraper would have to rediscover, and
    the one that forgot would silently rewrite the corpus every run.
  - **The corrections receipt** (`corrections_receipt`) and the **text
    utilities** below (`fold`, `roman_to_int`, `looks_like_number_typo`).
    Character-for-character identical across the scrapers that had them, and
    making claims about roman numerals and digit strings rather than about
    any source.

WHAT IS STILL NOT SHARED, because the duplication is only apparent:

  - **`strip_tags`.** compendium.py's copy deliberately turns `<br/>` into a
    space before dropping other tags, which ccc.py's does not; that difference
    is documented at its call site and would be silently lost in a merge.
  - **Decoding.** cp1252-always and sniff-the-`<meta>`-charset are claims
    about particular servers, so `Fetcher` takes a `decode` callable and each
    scraper supplies its own.
  - **Validation, and per-edition oracles.** `cpdv.py` and `vulgate.py` have
    byte-identical `validate` functions today and must keep them apart:
    `sacredbible.py`'s docblock records that these assert things about *an
    edition*, not about a template, and being equal right now is not a reason
    to make them unable to diverge. Note the contrast with
    `apply_verse_corrections`, which those two ALSO had identically and which
    did move: the corrections layer's rules come from docs/decisions.md and
    docs/corpus-schema.md, and an edition has no standing to disagree with
    them. `validate` is where an edition's own claims live. Identical bodies
    were never the test; whether the source is entitled to differ is.
  - **Heading heuristics** (`is_mini_header`, `is_full_bold` and friends).
    Same category as `strip_tags`: they encode what a heading looks like in
    one source's markup.

None of these scrapers has tests, so anything moved here has to be verifiable
by reading -- and every migration into this module has been checked by running
all eleven entry points offline and diffing the corpus byte for byte.
"""

from __future__ import annotations

from .absent import AbsentSources
from .corrections import (
    CorrectionDriftError,
    apply_verse_corrections,
    corrections_receipt,
    load_corrections,
)
from .fetch import (
    DEFINITIVE_ABSENCE,
    Fetcher,
    FetchError,
    FetchPolicy,
    httpx_transport,
    urllib_transport,
)
from .files import (
    file_has_text,
    filed_work_ids,
    json_text,
    read_bytes_or_none,
    read_text_or_none,
    write_if_changed,
    write_stamped_json,
)
from .overrides import OverrideDriftError, apply_overrides, load_overrides
from .paths import (
    ABSENT_SOURCES_PATH,
    CORRECTIONS_DIR,
    OVERRIDES_DIR,
    corpus_dir,
    raw_root,
    require_corpus,
    works_root,
)
from .text import (
    CHAPTER_OPENING_PUNCT,
    chapter_opening_letter,
    fold,
    fold_index,
    looks_like_number_typo,
    roman_to_int,
)

__all__ = [
    "ABSENT_SOURCES_PATH",
    "CHAPTER_OPENING_PUNCT",
    "CORRECTIONS_DIR",
    "DEFINITIVE_ABSENCE",
    "OVERRIDES_DIR",
    "AbsentSources",
    "CorrectionDriftError",
    "FetchError",
    "FetchPolicy",
    "Fetcher",
    "OverrideDriftError",
    "apply_overrides",
    "apply_verse_corrections",
    "chapter_opening_letter",
    "corpus_dir",
    "corrections_receipt",
    "file_has_text",
    "filed_work_ids",
    "fold",
    "fold_index",
    "httpx_transport",
    "json_text",
    "load_corrections",
    "load_overrides",
    "looks_like_number_typo",
    "raw_root",
    "read_bytes_or_none",
    "read_text_or_none",
    "require_corpus",
    "roman_to_int",
    "urllib_transport",
    "works_root",
    "write_if_changed",
    "write_stamped_json",
]
