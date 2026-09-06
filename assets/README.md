# Source masters for site imagery

Unoptimized originals for images that ship from `site/src/lib/assets/`, and the
recipes for the ones whose original is not kept. Nothing here is built, imported
or deployed — it is kept so an asset can be re-derived without going back to the
source archive and redoing the cutting by hand. One master is neither here nor
gone: the Library's Jerome is 12 MB and lives in `glossa-corpus` under LFS, for
the reason its section gives.

## The 404 page's drollery

Reynard the fox, mitred and crozier in hand, preaching to a congregation of
geese, a swan and a heron. The bas-de-page of British Library, Royal MS 10 E IV
(the Smithfield Decretals), f. 49v, c. 1300–40 — the same manuscript whose
rabbit cycle is the internet's favourite marginalia. Public domain; the scan
came from Wikimedia Commons:

<https://commons.wikimedia.org/wiki/File:Royal_MS_10_E_IV_fol_49v_Reynard_the_Fox_preaching_to_geese.png>

`reynard-preaching.png` — 1368×768 RGBA, AI-retouched and then cut out against
real transparency. This is what ships.

**It is not a reproduction.** The retouching invented ornament the manuscript
does not carry: on the folio the mitre is plain cream with a simple band, and
here it is gold, jewelled and three-peaked; the crozier is a plain crook there
and gold filigree here. That is why the caption is `notFound.credit` — "based
on", translated per language — rather than a bare shelfmark, which would claim
to _be_ f. 49v. Anything that replaces this with a faithful cut of the folio
should change that string back.

Encoding the shipped AVIF:

```sh
avifenc -q 65 -s 0 --qalpha 100 -y 444 --jobs all \
  assets/reynard-preaching.png site/src/lib/assets/reynard-preaching.avif
```

`--qalpha 100` is nearly free because the alpha is already a hard mask (0.1% of
pixels are partially transparent) and encodes losslessly at 7 KB — the decoded
alpha is bit-identical to the master's. `-y 444` rather than the encoder's usual
4:2:0 because the invented gold filigree is fine chroma detail; 4:2:0 saved 1 KB
and is not worth it. `-s 0` because this is encoded by hand once, so the slowest
speed is free (it buys 2% over the plates' `-s 4`).

Quality 65 was chosen by measuring, not by eye: DSSIM against the master,
composited over both a white and a near-black ground because the picture is a
cut-out and the mask is what it is for.

| encoding                            | bytes  | DSSIM (white) |
| ----------------------------------- | ------ | ------------- |
| WebP q80 (shipped until 2026-08-28) | 91,376 | 0.00445       |
| AVIF q50                            | 56,014 | 0.00871       |
| AVIF q63                            | 75,833 | 0.00440       |
| **AVIF q65**                        | 78,347 | 0.00409       |
| AVIF q70                            | 94,719 | 0.00291       |

The WebP is gone and nothing falls back to it. A browser that cannot render the
AVIF is shown no illustration at all — `NotFound.svelte` drops the whole figure,
caption included, on the image's `error` event. Its comment has the reasoning;
the short version is that a credit line must not outlive the picture it credits.

**If you ever cut a fresh version off the Commons scan, do not threshold its
alpha at 255.** In a plain cut-out only about 18% of pixels are fully opaque —
the thin elements are painted in partially-transparent pixels throughout, not
just at their edges — so dropping everything below full opacity deletes the
crozier, takes the heron's legs and neck, severs the swan's neck and puts holes
through the geese. The midpoint (≥ 128) removes the feathered halo and keeps
the drawing.

## The two landing-page paintings

Public-domain paintings illustrating the two landing pages — a banner over
`/schola`'s title, a tailpiece under `/bibliotheca`'s last shelf. The identifications, the licence
position and the `paper` flag are in `site/src/lib/landing-art.ts`; this section
is the derivation.

**Two of the four banners went with the routes they stood over** (2026-09-05):
Raphael's _Disputa_ headed "The four pillars" and Millet's _Gleaners_ headed
"The Church's social teaching", and both routes were removed. A banner with
nothing under it is a picture every reader downloads for no reason. Their rows
are struck through rather than deleted, on the same reasoning as the vignettes
below — and here it is close to free, because a route that comes back gets its
picture back from one fetch and one crop.

**Six square vignettes were derived the same way and are no longer here.** They
sat on the shelves of "What each of these is", which is the one section of that
page that is not illustration but definition, and a painting there is something
to look at while reading the sentence. They are `Icon.svelte` glyphs now.
The six rows below are kept rather than deleted: the derivation is the only
record of what those files were, the crop boxes were the expensive part, and
somebody restoring one should not have to find the scans again.

**No master here, and one master elsewhere.** A faithful crop — no retouching,
nothing invented — is reproduced byte for byte by the two commands below, so the
recipe IS the copy and keeping the original would put tens of megabytes of JPEG
in a public repository to save a download. The SHA-256 is of the file as fetched
from Commons, so a scan replaced upstream is detected rather than silently
re-cropped.

**`hero-jerome` is the exception: it is a crop AND a hand tone-correction**,
brightened and pulled open (mean 0.24 → 0.34, standard deviation 0.11 → 0.21
against the same box on the Commons scan), because the National Gallery's
photograph is dark and yellow and the shelves behind Jerome go to a single brown
at the size the page draws them. **No command reproduces that**, which is the
drollery's rule above and not a new one — hand work keeps its master or it is
gone the next time the slot wants a different shape.

**So its master is `authored/art/hero-jerome-adjusted.jpg` in `glossa-corpus`**,
tracked there through git-lfs beside the Doré scans: 12 MB is not something a
public repository should hand every future clone, and the private one already
carries binaries that size for exactly this reason. The file is 4731×2794,
sha256 `4a86f4ad5a88c064…`, and it is the Commons crop plus the tone-correction
already applied — so what the box column below holds for this row is a second
crop, taken on that file rather than on the scan. The Commons row stays where it
is: it is still the licence, the provenance and the unretouched original.

Fetch (`{name}.jpg`, from `https://upload.wikimedia.org/wikipedia/commons/…`):

| name                  | Commons file                                                                                 | px         | sha256 (first 16)  |
| --------------------- | -------------------------------------------------------------------------------------------- | ---------- | ------------------ |
| hero-jerome           | `Antonello da Messina - St Jerome in his study - National Gallery London.jpg`                | 4731×6000  | `d2a50c625ee24fa0` |
| ~~pillars-disputa~~   | `Sanzio, Raffaello - Disputa del Sacramento - 1508-1511 - hi res.jpg`                        | 1845×1459  | `aa68e33c3f09d905` |
| gospels-preaching     | `Christ Preaching, called La Petite Tombe MET DP832290.jpg`                                  | 3594×2687  | `75563743cc71e5f3` |
| ~~social-gleaners~~   | `Jean-François Millet - Gleaners - Google Art Project 2.jpg`                                 | 5354×4006  | `6abe60efbda2dbdb` |
| ~~shelf-scripture~~   | `The Inspiration of Saint Matthew-Caravaggio (1602).jpg`                                     | 6911×10816 | `91ab56aa9ff23b50` |
| ~~shelf-catechism~~   | `Albrecht Dürer - Jesus among the Doctors - Google Art Project.jpg`                          | 4338×3480  | `a1bdaa3136fa9c27` |
| ~~shelf-magisterium~~ | `Concilio Trento Museo Buonconsiglio.jpg`                                                    | 4056×3340  | `c6e92776016982e9` |
| ~~shelf-law~~         | `Gregory IX approving decretals Raphael Rooms.jpg`                                           | 2008×2999  | `8f5d7191b70db28e` |
| ~~shelf-theologian~~  | `Le Triomphe de saint Thomas d'Aquin - Benozzo Gozzoli - Musée du Louvre … - avec cadre.jpg` | 3606×9403  | `77ce2e5c3761f557` |
| ~~shelf-prayers~~     | `Albrecht Dürer - Praying Hands, 1508 - Google Art Project.jpg`                              | 2680×3900  | `e406c782ee1b6dac` |

Crop and encode. The crop box is `WxH+X+Y` on the master. A banner is 2.5:1 at
1800px and the withdrawn vignettes were square at 400px; **`hero-jerome` is
neither, since 2026-09-06.** It stopped being a banner when it moved under
`/bibliotheca`'s last shelf, and it is now the one row here whose out size is
not a slot: the page draws it 300px tall with `object-fit: cover` and a press
opens the file whole, so the encode answers "how much painting is worth
shipping" and the CSS answers "how much page it may take". 1600×727 is the first
question's answer — the study, the shelves, the lion and the arcade, with the
ceiling beams and the front of the checkerboard floor gone, which is 205 KB
against 357 for the whole room.

Its box is taken on the adjusted master and centred vertically: 2150 of that
file's 2794 rows, 322 off each end. Centring is not a nicety — `cover` crops
from the middle, so a band that is not centred on the file is a band the page
will centre again.

**The boxes were chosen by eye and are the only judgement in the derivation** —
every one of them was got wrong at least once and corrected against the output,
so change one only by looking at what comes out: the first hero band landed on
the shelves above Jerome, and the first Aquinas vignette was a lap and a book
with his head above the frame.

```sh
magick "$master" -crop "$box" +repage -resize "${W}x${H}!" out.png
avifenc -q 65 -s 0 -y 420 --jobs all out.png "site/src/lib/assets/schola/$name.avif"
```

| name                  | crop box             | out      |
| --------------------- | -------------------- | -------- |
| hero-jerome           | `4731x2150+0+322`†   | 1600×727 |
| ~~pillars-disputa~~   | `1845x738+0+680`     | 1800×720 |
| gospels-preaching     | `3300x1320+150+560`  | 1800×720 |
| ~~social-gleaners~~   | `5354x2142+0+1250`   | 1800×720 |
| ~~shelf-scripture~~   | `6911x6911+0+400`    | 400×400  |
| ~~shelf-catechism~~   | `3480x3480+429+0`    | 400×400  |
| ~~shelf-magisterium~~ | `3340x3340+358+0`    | 400×400  |
| ~~shelf-law~~         | `2008x2008+0+500`    | 400×400  |
| ~~shelf-theologian~~  | `3360x3360+123+3150` | 400×400  |
| ~~shelf-prayers~~     | `2400x2400+240+600`  | 400×400  |

† On `authored/art/hero-jerome-adjusted.jpg` in `glossa-corpus`, not on the
Commons scan. Every other box here is on the file the fetch table names.

**`gospels-preaching` is the one exception to the encoder line**: it is a
monochrome etching, so it is converted with `-colorspace Gray` and encoded
`-q 60 -y 400`. Chroma planes on a grey image cost 40% of the file and carry
nothing — the same argument `pipeline/scrapers/dore/dore.py` makes for the
plates, which are grayscale AVIF for exactly this reason.

`-y 420` rather than the drollery's `4:4:4`: there is no cut-out mask and no
invented filigree here, so the finer chroma buys nothing on a photograph of a
painting. `-s 0` for the same reason it is used above — encoded by hand once,
so the slowest speed is free.

Total shipped (2026-09-06): 579 KB across three files, none of them `eager` —
both paintings are below the fold at every viewport and the drollery is on a
page nobody meant to reach.
They are Vite build assets under `_app/immutable/`, so they are negated from
`run_worker_first` and land in the service worker's content tier rather than
its install precache (`DEFERRED_MEDIA` in `sw-policy.ts` lists `.avif`).
