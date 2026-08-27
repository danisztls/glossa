# Source masters for site imagery

Unoptimized originals for images that ship from `site/src/lib/assets/`. Nothing
here is built, imported or deployed — it is kept so an asset can be re-derived
without going back to the source archive and redoing the cutting by hand.

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

Encoding the shipped WebP:

```sh
magick assets/reynard-preaching.png -strip -define webp:method=6 \
  -define webp:alpha-quality=100 -quality 80 \
  site/src/lib/assets/reynard-preaching.webp
```

`alpha-quality=100` is nearly free because the alpha is already a hard mask
(0.1% of pixels are partially transparent), and quality 80 is indistinguishable
from the master at 4× zoom.

**If you ever cut a fresh version off the Commons scan, do not threshold its
alpha at 255.** In a plain cut-out only about 18% of pixels are fully opaque —
the thin elements are painted in partially-transparent pixels throughout, not
just at their edges — so dropping everything below full opacity deletes the
crozier, takes the heron's legs and neck, severs the swan's neck and puts holes
through the geese. The midpoint (≥ 128) removes the feathered halo and keeps
the drawing.
