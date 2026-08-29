#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""Word spaces a mirror lost when it reflowed, found by measuring the corpus
against itself.

WHY THIS EXISTS. Several vatican.va English mirrors of one vintage print
`theresult` where they mean "the result" -- 700-odd joins over 40 pages, and
`christi-nomen.en` still carried seven after a careful reader found sixteen.
Reading for this defect does not find all of it, which is the whole argument
for a scan.

HOW A JOIN IS RECOGNISED. No en_US word list survives contact with this
vocabulary, so the corpus is its own dictionary AND its own grammar: a
candidate is a token occurring in exactly one English work that splits into
two parts the rest of the corpus writes often, and whose BIGRAM the rest of
the corpus actually writes. That last test is the difference between a
working detector and a useless one -- without it `lumen-gentium.en` returns
27 candidates, every one a Latin citation word split at a plausible seam
(`notis` -> "not is", `textus` -> "text us"). English prose writes "the
result" constantly and "not is" never.

Two detectors need no bigram, because no English word produces what they
match: a case transition inside a token (`aFrench`, `etSpes`) and a missing
space after a full stop or comma (`us.The`).

WHAT IT REFUSES TO PROPOSE, and why each refusal is principled:

  * a token hunspell ACCEPTS. `buildup`, `influx` and `nonbelievers` are real
    words whose split happens to be a common bigram; only a dictionary can
    say so.
  * anything in the citation apparatus. A reflow defect lives in English
    prose; `conversionis` and `sentire` are Latin, and the corpus holds four
    whole works in Latin to say which words those are.
  * a pair the corpus more often HYPHENATES. `non-Catholic`, `self-giving`
    and `present-day` are real joins, but the lost character is a hyphen and
    restoring a space writes something the source did not say. Reported as a
    defect with no known correct value and filed nowhere, per
    `docs/decisions.md` on corrections.

Everything it does propose is one restored space and nothing else, which is
what makes the output safe to turn into `pipeline/corrections/` entries: the
generated `to` differs from its `from` by exactly one character.
"""

import json
import re
import subprocess
import sys
from collections import Counter, defaultdict

import common

BUILD = common.build_root()
TAG = re.compile(r"<[^>]*>")
WORD = re.compile(r"[A-Za-z]+")
only = sys.argv[1:] or None

works = sorted(
    p.name
    for p in BUILD.iterdir()
    if p.is_dir()
    and p.name.endswith(".en")
    and (p.name.startswith("encyclical.") or p.name.startswith("vatii."))
)


def body_text(work):
    """Every block's html, and nothing from the citation apparatus."""
    out = []
    for fn in ("sections.json", "appendix.json"):
        f = BUILD / work / fn
        if not f.exists():
            continue
        data = json.loads(f.read_text())
        stack = [data]
        while stack:
            x = stack.pop()
            if isinstance(x, dict):
                if "marker" in x and "text" in x:
                    continue  # a citation, not prose
                if isinstance(x.get("html"), str):
                    out.append(x["html"])
                stack.extend(v for k, v in x.items() if k != "html")
            elif isinstance(x, list):
                stack.extend(x)
    return TAG.sub(" ", " ".join(out))


texts = {w: body_text(w) for w in works}

freq, where, bigram = Counter(), defaultdict(set), Counter()
for w, t in texts.items():
    toks = WORD.findall(t)
    for tok in set(toks):
        freq[tok.lower()] += 1
        where[tok].add(w)
    low = [x.lower() for x in toks]
    for i in range(len(low) - 1):
        bigram[(low[i], low[i + 1])] += 1

COMMON, BIGRAM_MIN = 4, 3

# The residue the three automatic tests cannot settle, each read in its own
# sentence. Kept as a named table rather than folded into the filters: five
# more heuristics tuned to catch these would cost true positives elsewhere,
# and every one of these is a judgement about one page.
NOT_A_MERGE = {
    (
        "encyclical.divini-illius-magistri.en",
        "didst",
    ): "archaic verb, 'Thou didst create us'",
    (
        "encyclical.iucunda-sane.en",
        "Augustin",
    ): "a name in a citation, 'ad Augustin. Anglorum Episcopum'",
    (
        "encyclical.communium-rerum.en",
        "goodfor",
    ): "'good-for-nothing' -- the hyphen after it is printed",
    (
        "vatii.presbyterorum-ordinis.en",
        "Highpriest",
    ): "'High Priest' or 'High priest'; the case is not ours to choose",
    (
        "encyclical.pacem.en",
        "dwellingplace",
    ): "'dwelling place' and 'dwelling-place' are both current; no known correct value",
}
# And the one the Latin test over-caught: `amore` IS Latin, but not here --
# "as an earnest of amore peaceful time" is English and the join is real.
FORCE = {("encyclical.quod-auctoritate.en", "amore"): "a more"}
cands = {
    t
    for t, ws in where.items()
    if len(ws) == 1 and len(t) >= 5 and freq[t.lower()] == 1
}

proposals = {}
for tok in cands:
    best = None
    for i in range(1, len(tok)):
        a, b = tok[:i], tok[i:]
        if len(b) < 2:
            continue
        if freq.get(a.lower(), 0) < COMMON or freq.get(b.lower(), 0) < COMMON:
            continue
        cased = a[-1].islower() and b[0].isupper()
        bg = bigram.get((a.lower(), b.lower()), 0)
        if not cased and bg < BIGRAM_MIN:
            continue
        score = (10000 if cased else 0) + bg
        if best is None or score > best[0]:
            best = (score, a, b)
    if best:
        proposals[tok] = best

probe = sorted(set(proposals))
rejected = set(
    subprocess.run(
        ["hunspell", "-d", "en_US", "-l"],
        input="\n".join(probe),
        capture_output=True,
        text=True,
    ).stdout.split()
)

# A LOST HYPHEN IS NOT A LOST SPACE. `nonCatholic`, `selfgiving`, `presentday`
# and `goodfor-nothing` are all real joins, and restoring a SPACE to any of
# them writes something the source did not say. Where the corpus itself
# hyphenates the pair elsewhere, the missing character is not ours to guess:
# the join is reported as a defect with no known correct value and filed
# nowhere, which is what docs/decisions.md asks for.
hyphenated = Counter()
for t in texts.values():
    for m in re.finditer(r"\b([A-Za-z]{2,})-([A-Za-z]{2,})\b", t):
        hyphenated[(m.group(1).lower(), m.group(2).lower())] += 1

# A LATIN QUOTATION IS NOT ENGLISH PROSE. These pages quote Augustine and the
# Vulgate inline, and `artis`, `foras`, `missionis`, `conversionis` and
# `sentire` all split into a plausible English bigram while being one Latin
# word. The corpus holds four whole works in Latin; if they write the token,
# it is a word and not a join.
LATIN = BUILD
latin_vocab = set()
for d in LATIN.iterdir():
    # The Latin works name their content files differently from the documents
    # -- summa.la has questions.json, the Clementina one file per book -- so
    # take the whole directory rather than a fixed pair of names.
    if d.is_dir() and d.name.endswith(".la"):
        for f in d.rglob("*.json"):
            latin_vocab.update(
                w.lower() for w in WORD.findall(TAG.sub(" ", f.read_text()))
            )

rows, deferred = [], []
for tok, (score, a, b) in proposals.items():
    if tok not in rejected:
        continue  # a real word, not a merge
    how = "case" if score >= 10000 else f"bigram:{score}"
    # The hyphen has to be the BETTER reading, not merely an attested one:
    # some page writes "love-for" once, against 301 plain "love for".
    hy = hyphenated.get((a.lower(), b.lower()), 0)
    if hy and hy * 4 >= bigram.get((a.lower(), b.lower()), 0):
        deferred.append((next(iter(where[tok])), tok, f"{a}-{b}", "hyphen?"))
        continue
    if tok.lower() in latin_vocab and (next(iter(where[tok])), tok) not in FORCE:
        deferred.append((next(iter(where[tok])), tok, f"{a} {b}", "latin"))
        continue
    w = next(iter(where[tok]))
    if (w, tok) in NOT_A_MERGE:
        deferred.append((w, tok, "--", NOT_A_MERGE[(w, tok)]))
        continue
    rows.append((w, tok, f"{a} {b}", how))

for (w, tok), fix in FORCE.items():
    # Only while the join is still in the text -- once its correction is
    # filed and applied, a forced row would report a defect that is fixed.
    if tok in texts.get(w, "") and not any(r[0] == w and r[1] == tok for r in rows):
        rows.append((w, tok, fix, "forced"))

PUNCT = re.compile(r"\b([a-z]{2,})([.,])([A-Z][a-z]{2,})\b")
for w, t in texts.items():
    for m in PUNCT.finditer(t):
        a, p, b = m.groups()
        if freq.get(a.lower(), 0) >= COMMON and freq.get(b.lower(), 0) >= COMMON:
            rows.append((w, f"{a}{p}{b}", f"{a}{p} {b}", "punct"))

rows = sorted(set(rows))
bywork = defaultdict(list)
for w, tok, fix, how in rows:
    bywork[w].append((tok, fix, how))

if only:
    for w in only:
        print(f"=== {w}  ({len(bywork.get(w, []))})")
        for tok, fix, how in sorted(bywork.get(w, [])):
            print(f"    {tok}  ->  {fix}   [{how}]")
else:
    for w in sorted(bywork, key=lambda k: -len(bywork[k])):
        print(f"{len(bywork[w]):4d}  {w}")
    print(
        f"\n{len(rows)} candidates across {len(bywork)} works, {len(works)} English works scanned"
    )
    if deferred:
        print(
            f"\n{len(deferred)} deferred (no known correct value -- reported, not filed):"
        )
        for w, tok, fix, why in sorted(deferred):
            print(f"  {w:44s} {tok:20s} {fix:24s} [{why}]")
