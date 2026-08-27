# A hero image at the head of every Bible chapter

Explored 2026-08-27. **Viable, costed, and not adopted** — the design work is
finished and the two blocking questions are recorded below rather than
answered. This document exists so that resuming it does not mean starting it.

The idea: an illuminated-manuscript miniature at the head of each of the 1,334
Bible chapters, generated with Gemini, in a single house style.

## The finding that makes it cheap

**The subject lines already exist.** `bible.douay-rheims.en` stores Challoner's
chapter argument as `chapters[].summary` — a one-sentence description of what
the chapter contains, written in exactly the register an illuminator would have
worked from:

> Jonah being sent to preach in Ninive, fleeth away by sea: a tempest riseth:
> of which he being found, by lot, to be the cause, is cast into the sea, which
> thereupon is calmed.

```sh
cd ../glossa-corpus && python3 -c "
import json, glob
tot = have = 0; miss = []
for f in glob.glob('works/bible.douay-rheims.en/books/*.json'):
    d = json.load(open(f))
    for c in d.get('chapters', []):
        tot += 1
        if (c.get('summary') or '').strip(): have += 1
        else: miss.append(d['osis'] + ' ' + str(c['n']))
print(tot, have, len(miss))
"
```

**1,307 of 1,334 chapters carry one.** The 27 that do not are Psalm 56 and most
of Proverbs 11–21 — which is to say, precisely the non-narrative chapters that
should get ornament rather than a scene anyway. The gap is not a gap.

So the generation problem reduces to a fixed style body plus one variable
subject slot, and the corpus fills the slot.

## The two questions that stopped it

**Provenance.** This project's discipline is that nothing is invented: a source
defect with no known correct value gets documented rather than fixed, `raw/` is
the record of what the source actually said, and a work belongs in
`WORK_CONFIGS` only when its references are measurably read wrong without it.
A synthetic pastiche of a 13th-century Bible is invented apparatus, sitting at
the head of a verbatim text, and it is the most visually prominent thing on the
page. That is not disqualifying — an illustration is not a claim about the text
the way a correction is — but it is a decision to take deliberately and to
state in the colophon, the way `colophon.pointNoTracking` was rewritten when
the beacon landed rather than left saying something that had stopped being true.

The alternative is real: Gallica, e-codices, the Bodleian and the British
Library publish digitized illuminated Bibles under public-domain or CC terms.
A genuine Morgan Picture Bible leaf beats anything generated. It costs
per-chapter research and its coverage is uneven, which is a fair reason to go
synthetic — but the choice should be made, not defaulted into.

**Weight.** 1,334 images against a build that is currently ~2,910 files and
110 MB. At hero width in AVIF, an illuminated miniature is not cheap to
compress — burnished gold texture and a diapered lattice are high-entropy —
so 40–80 KB each is the honest estimate, i.e. **50–110 MB and a 46% rise in
file count**. Three consequences, none fatal and none free:

- The 20,000-file Cloudflare deployment cap is still far away.
- Every image must be negated in `run_worker_first` or it is a billed Worker
  invocation per request. A cold visitor filling the offline library was
  ~2,240 invocations before this; the free plan answers **429 instead of
  serving the asset** past 100,000/day.
- The offline library roughly doubles. Whether a hero image belongs in a
  download wave at all — or is the one thing fetched lazily and allowed to be
  absent offline — is an unanswered question in `sw-policy.ts`.

## The style: two decisions that matter more than adjectives

### Which tradition

"Illuminated manuscript" alone yields a mush of all of them. These are
genuinely different:

| Tradition                                            | Look                                                              | Fit                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| **Insular** (Kells, Lindisfarne, 7th–9th c.)         | Interlace, triple spirals, zoomorphic knots; almost no narrative  | Superb ornament, cannot tell a story                            |
| **Romanesque** (Lambeth/Winchester Bible, 12th c.)   | Heavy contour, damp-fold drapery, flat vermilion and ultramarine  | Reads best at small sizes                                       |
| **Gothic Parisian** (Paris pocket Bibles, c. 1250)   | Slim figures, burnished gold ground, diaper, bar borders with ivy | **The Bible's own idiom.** Chosen                               |
| **International Gothic** (Très Riches Heures, 1410s) | Landscape depth, ultramarine skies, real space                    | Beautiful, but it is a Book of Hours, and depth fights flatness |

Gothic Parisian was chosen because it is historically what a Bible chapter
looked like, and because its flatness is a floor the model cannot drift below
into cinematic lighting.

### Which pictorial device

More load-bearing than the style words: the device is what makes 1,334 images
feel like one manuscript.

- **Historiated initial** — the letter containing the scene. Most authentic,
  but it means generating letterforms, which models do badly.
- **Column miniature / frieze** — a bordered rectangle at the head of the
  column. Native fit for a hero slot. **Chosen.**
- **Bas-de-page vignette** — wide narrative strip in the lower margin.

A framed wide miniature at 3:1 gives every image the same skeleton, which is
most of the consistency problem solved before the model runs.

## The prompt

Fixed body, one `{{SUBJECT}}` slot. Gemini's image models respond to
descriptive prose, not keyword lists, so these are sentences.

```
A single illuminated miniature from a thirteenth-century Parisian Bible,
photographed flat from the original manuscript page.

SUPPORT — Aged calfskin vellum, warm cream shading to honey at the edges,
faint hair-follicle speckle, slight cockling, small foxing spots, a worn
corner. The parchment is the background; do not paint it out.

STYLE — Early Gothic Parisian illumination, c. 1250, in the manner of the
Paris pocket Bibles and the Bible moralisée. Figures slim and elongated,
faces hieratic and inexpressive, drawn in fine iron-gall outline and
modelled with flat washes and fine white hatching. No perspective and no
cast shadows: depth is indicated only by overlap, and importance by
hieratic scale — the principal figure is drawn larger. Architecture and
landscape reduced to schematic emblems: a trilobe arch stands for a
building, three stacked green humps for a mountain, scalloped bands for
water. All persons wear thirteenth-century dress regardless of the period
depicted.

GROUND & GOLD — The ground behind the figures is burnished gold leaf laid
over gesso, standing slightly proud of the surface, tooled with small
punched rosettes, its edges cracked and rubbed to show the red bole
beneath. Where the composition is a row of medallions, the ground may
alternate between burnished gold and a diapered lattice of ultramarine and
vermilion with fine white tracery, in regular panels; elsewhere use one
ground edge to edge.

PIGMENTS — A restricted medieval palette and nothing outside it: lapis
ultramarine, vermilion and red lead, verdigris and malachite green, lead
white, iron-gall brown-black, burnished gold. Colours opaque, unblended,
each field closed by a dark contour line. No modern hues, no gradients,
no glow.

FRAME — The scene sits within a narrow bar border of alternating blue and
rose panels edged in gold, with a hairline of white filigree. The border
keeps the same colour sequence along its whole length; it does not change
scheme partway across. Slim ivy-leaf sprays tipped with gold bezant dots
grow from the corners into the bare parchment margin.

FORMAT — Wide horizontal miniature, 3:1. Leave a clean margin of bare
vellum on all four sides. The composition must stay legible when reduced
to the width of a column of text.

SUBJECT — {{SUBJECT}}

DO NOT — No lettering, no script, no letterforms, no captions, in any
alphabet. No crowds, bystanders, onlookers or attendant figures unless the
SUBJECT names them; depict only the persons named. No photorealism, no
chiaroscuro, no three-point lighting, no depth of field. Not digital art,
not fantasy illustration, not Art Nouveau, not stained glass, not woodcut
or engraving. No airbrushed sheen on the gold. No modern faces, no modern
clothing, no signature.
```

**The lettering prohibition is not optional.** Left free, the model writes
pseudo-Latin, and invented Latin at the head of a real Vulgate is the one
failure this repository cannot ship.

## What two generations proved

Two Genesis 1 plates were generated on 2026-08-27. Both are gone; what they
established is here.

**The fixed blocks are reliable.** Vellum with genuine foxing and a worn
corner, the bar border, ivy sprays with gold bezants at all four corners, gold
ground tooled with punched rosettes, the restricted palette holding with no
modern hue anywhere, flat modelling, barefoot slim figures, and not one
letterform. None of that needed a second attempt.

**Three failure modes appeared, and two are now guarded in the prompt above:**

- **Invented crowds.** The first plate put seven laymen in mantles at the left
  of Genesis 1, where scripture has nobody. The model fills the left of a wide
  miniature with a Gothic bystander group because that is what its training
  data does, and Challoner's arguments will keep inviting it. Hence the
  `DO NOT` clause naming only the persons named.
- **Panels butted together.** The first plate read as four zones — crowd,
  Creator, cosmos, ornament — with the border changing colour at the midpoint
  exactly where the gold ground stopped, so a seam ran down the centre. Two
  causes: `GROUND` offered diaper as an alternative to gold and the model read
  it as "use both, side by side," parking dead ornament in the last fifth where
  the eye expects resolution; and the border was free to change scheme partway.
  Both are now constrained.
- **Anachronism inside the scene.** Gold towers among the green hills of the
  sixth day — architecture before anyone exists to build it. Not generally
  guardable; it belongs in the subject line, per chapter.

**One disobedience improved the result and was adopted.** Told to use one ground
edge to edge, the second plate alternated gold and diaper in panels behind a row
of medallions. That is a real Gothic convention and it gives the row a rhythm a
flat gold field does not; the `GROUND` block above was loosened to permit it.

**The model knows the iconography by name.** The _Deus geometra_ — the Creator
setting compasses to the dark disc of the deep, from the Bible moralisée,
Vienna ÖNB 2554 — came out correct unprompted. Name a known miniature and it
will be reproduced; that is worth more than describing one.

## Writing the subject line

Do not paste Challoner raw. An argument usually summarizes three or four
episodes and yields a muddle. Rewrite as **one moment, present tense, named
actors, stated spatial relations**:

- **Jonah 1** — `Sailors in a small clinker-built ship on scalloped blue waves lower Jonah head-first over the gunwale; Jonah wears a red mantle, hands raised; at the right a great fish with a curled tail opens its jaws to receive him; a band of burnished gold above.`
- **Psalm 23** — `A crowned David in a blue mantle sits playing a harp at the left; at the right a shepherd leads three white sheep beside a scalloped band of still water, below three stacked green hills.`

For chapters with several genuine episodes the authentic move is **continuous
narrative** — add to `FORMAT`: `divided into three compartments by slender
colonnettes under trilobe arches, reading left to right`. Straight out of the
Bible moralisée, and it handles the sprawling Judges and Kings chapters without
misrepresenting what the chapter contains.

### Genesis 1, as arrived at

A 3:1 banner is the exact shape of the medieval answer to this chapter.

```
SUBJECT — The Deus geometra of the Bible moralisée. At the far left, a young
beardless Christ-Logos in a blue tunic and rose mantle, barefoot, haloed with
a cruciform nimbus whose three visible cross-arms are vermilion, stoops and
sets a pair of open compasses to the rim of a dark disc of the unformed deep.
To the right of him, six circular medallions in a single horizontal row, each
ringed in gold: the first divides light from darkness in gold and iron-black;
the second parts a band of blue water above from a band of blue water below,
divided by a white firmament; the third shows three stacked green humps of dry
land with slender trees; the fourth a gold sun and a silver crescent moon on
ultramarine; the fifth green fish in scalloped water with two birds above; the
sixth a lion, an ox and a stag on green ground with a small nude Adam standing
among them. No buildings, no architecture, no towers. No figures other than
the Creator and Adam.
```

Two residual notes from the plate this produced: days two and five both read as
plain blue water and do not distinguish themselves when scanned (hence the
explicit firmament above), and the nimbus rendered as rayed rather than as three
arms of a cross — cruciform is the doctrinally specific one and what separates
the Logos from a saint, so it needs checking at full resolution.

## Non-narrative books are the real design problem

Roughly a third of the corpus has no scene to depict, and forcing one is how
this degenerates into decoration.

- **Psalms** — 150 chapters. The historical solution is the eight-fold psalter
  division (Pss 1, 26, 38, 52, 68, 80, 97, 109 carried the great initials) for
  the set-pieces, and David-as-cantor plus a textual emblem for the rest.
- **Epistles** — the authentic device is the **author portrait**, not a scene:
  `Paul, bald and dark-bearded, seated at a lectern on a faldstool, dipping a
quill, a sword upright beside him`. One per epistle, varied by attribute.
  Same for the evangelists and their symbols.
- **Proverbs, genealogies, law codes** — and the 27 chapters with no Challoner
  argument — take **ornament only**. Swap the `STYLE` block for Insular:
  `Insular illumination in the manner of the Book of Kells. The field is filled
edge to edge with interlace knotwork, triple spirals and zoomorphic terminals
of elongated hounds and birds biting their own bodies, in orpiment yellow,
verdigris, minium and iron-gall.` This also gives the eye a rest, which a
  thousand consecutive scenes would not.

## Holding a house style across 1,334 images

Prose alone will not do it. The pipeline that would:

1. Generate ~8 candidates of a **single style plate** on a neutral subject (a
   seated evangelist writing). Pick one. That is the master.
2. Condition every subsequent call on it: `Match the palette, the border, the
ivy sprays, the handling of the gold and the drawing of faces in the attached
image exactly. Change only the scene depicted.` The models are far stronger
   at this than at re-reading a style paragraph, and it is what keeps book 12
   looking like book 1.
3. **The master must be a plain single scene, never the Genesis medallion row.**
   Reference conditioning copies structure along with palette; condition Jonah
   on Genesis 1 and Jonah gets medallions.
4. **Batch by book, in one thread.** Context carries; fifty chapters generated
   together cohere in a way fifty cold calls do not.
5. **Generate large and downscale hard.** Artifacts in gold texture and in faces
   vanish at hero width and are glaring at native resolution.
6. Optionally give each book a **dominant secondary colour** in the border, so a
   reader learns where they are without reading a word.

## Cases that fight the safety filter

- **God the Father** — ask for the medieval convention explicitly or a
  Renaissance Zeus arrives: the _Dextera Dei_, a hand emerging from a segment of
  cloud with two fingers raised in blessing, or the beardless Christ-Logos with
  cruciform nimbus.
- **Nudity** (Gen 2–3, Susanna, Bathsheba) — the medieval convention is already
  flat and sexless; say so (`in the flat, sexless medieval convention, hair and
gesture covering the body`) and expect refusals anyway. Genesis 1's small nude
  Adam passed.
- **Violence** (Judges, Kings, Maccabees, Apocalypse) — manuscripts are bloody
  and the filter is not. `in the flat, unbloodied medieval convention` usually
  passes.
