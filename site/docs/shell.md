# The shell, the tiers and offline

What the browser downloads, in what order, and what survives the network going
away. The edge in front of it is `site/docs/edge.md`.

## One shell

**One static SPA shell, not a prerender.** The static page was never the
content identity: prerendering repeated the chrome thousands of times and could
embed only a build-time default edition or every edition at once.

**The boot payload is priced per registry, not per byte.** With `ssr = false`
nothing paints until the client bundle has mounted, so whatever the boot index
carries sits in front of first paint on every route, including the routes that
never read a byte of it. What decides whether a registry boots with the app is
**the question it answers**: "does this address exist" is asked with no work in
hand and stays eager, while a document's outline is only ever wanted by the
page already reading that document.

**The lever that was left was not shipping it eagerly: 6.30 MB to 0.47 MB.**
The measurement that started it was of the boot PAYLOAD — every `.js` file
`index.html` asks for before it can paint, which nothing had ever added up — of
which 92% was data compiled into JavaScript. The large index files are `?url`
assets primed by the route that reads them, `manifests.json` is awaited in
`+layout.ts` because every path asks what works exist, the content tier's path
map and `suggest.ts`'s grammar are `await import()`ed, and
`content-manifest.json` went back to being read by the service worker and
nowhere else — the rule its own docblock states, written when the file was
248 KB and since broken by two static imports. Small files stay eager: under
20 KB a request costs more than a parse.

**Three of the four were invisible to every check that existed** — each one
word or one import from correct, neither a spelling error nor a test failure,
with no symptom but the site being slower for everybody.
`preflight-deploy.mjs` measures the boot payload off `index.html` and refuses
the deploy over `MAX_BOOT_JS_BYTES`: a ceiling in bytes, because Vite's
per-chunk warning cannot tell a lazily-fetched 1.34 MB chunk from one every
route parses.

**Making a registry lazy breaks whatever was DERIVED from it at module scope,
and that is not visible from the registry's own call sites.** `corpus.ts`
builds five maps once at module load, on the sound argument that regrouping
~450 works per call is waste — and module load now happens long before any
primer resolves, so they memoised the emptiness. **The search that missed them
looked for the registry and they do not name it**: two reach `manifests`
through `listWorksOfType` inside an IIFE. When a value stops being available at
module load, the thing to enumerate is not its readers but everything memoised
from it, one indirection out.

**The fix keeps the memo and keys it on a GENERATION** — a counter and not a
boolean, because six primers land independently and a map built after the Bible
index arrived is still stale for the document index.

**It is guarded by a source scan, because nothing runnable can catch it.**
Under fixtures the registries ARE populated at module load, so an eager
derivation is correct and every test passes.
`corpus-derivations.test.ts` asserts about the TEXT of `corpus.ts`, with a
second assertion that the scan still matches something so it cannot pass by
finding nothing.

**A shelf owes the indexes its own text is read FROM and the indexes its text
POINTS AT, and the priming table asked only the first.** `refAddress` validates
an address before it will mint a link, so a footnote threw on an unprimed Bible
index — and two other shelves failed the same way SILENTLY, since only the
scripture check is behind `requireIndex` and the others read an empty registry,
concluded the corpus does not hold the target, and rendered dead text.

**Asynchrony was pushed to the ARRIVAL of the data, never to its readers.** Two
dozen synchronous readers are called from render and keep their signatures; the
registries are the same mutable objects, filled in place by primers that
`load()` awaits, which is where a route already waits. The guards differ by how
completely their callers can be enumerated — the content index throws always,
the per-work-type indexes throw in dev and warn in production. Under fixtures
neither can fire, so `npm test` is not what catches a mistake here.

## Chunking

**Every content split is a fixed stride, and a size ceiling fails the build.**
Chunk membership is a pure function of the unit's own number, so no boundary
table has to ship or stay in sync. What the strides are matters less than the
ceiling: every chunking regression this project has had was one size premise
recorded in a comment, correct when written, never re-measured — documents were
whole-file on a "~200 KB worst case" note until the real worst case reached
827 KB. `CONTENT_FILE_CEILING_BYTES` turns that class into a failed sync.

**A fixed section count is only a fixed byte count while the alphabet is.**
`DOCUMENT_CHUNK_SIZE` was 50 on a measurement over a Latin-script corpus;
`caritas-in-veritate.ru` made a 202 KB chunk out of the same 50 sections its
English edition fits in 108 KB. The stride is 25.

**The reader's unit, not the volume's, decides the chunk.** A Bible book
matched the print volume's granularity and was the wrong unit anyway, since
`/scriptura/{osis}/{chapter}` shows one chapter — so opening Ps 23 fetched all
150 psalms.

## Offline

**Offline is two cache tiers.** The content tier is unversioned and survives
app updates the way a downloaded book should; the shell tier is versioned and
swept on activate. Content-hashed data that is not corpus text is content tier
too, and deliberately not in the install precache.

**The service worker's decisions live outside the service worker.**
`service-worker.ts` cannot be imported by a test, and every way it can be wrong
is silent: a misclassified corpus file lands in the versioned cache, is wiped
on the next deploy, and the reader re-downloads their library with no error
anywhere. Classification, routing and wave order are in `sw-policy.ts`; cache
operations take `caches` and `fetch` as arguments in `sw-cache.ts`.

**The background fill is per language, ordered, and opt-in past the
Catechism.** The worker takes only the three cheapest waves without being asked
— the next chunk of what is open, the small whole works, the Catechism, about
1.2 MB gzipped. Scripture, the Magisterium and the Summa are offered, not
taken.

**Doré's engravings are a shelf, and were in no wave at all.** As ordinary
build assets they were stored on first read, so the only way to get them was to
have already looked at them one plate at a time, online. They are last in the
order and outside `AUTOMATIC_WAVES`: 482 files and 103 MB, four times the
entire text corpus, so nobody may have it uninvited and the row says what it
costs. The beacon's `full` library bucket excludes them from its denominator,
or a reader with every word of every work would read as `partial` for ever.

**And the zoom renditions are a second shelf behind it** (`illustrations-detail`,
2026-09-05). They are the same engravings at `PLATE_DETAIL_WIDTH`, several times
the bytes of the two a chapter draws, and worth nothing to a reader who does not
zoom — so folding them into the row above would have multiplied the one number
that row exists to state. Same exclusions as `plate-image`, for the same reason.

**A shelf can be dropped as well as taken, and the two deletions are not one
operation.** A per-wave delete happens in the page against the content cache;
"remove everything" is the worker's `caches.delete`, because the cache also
holds files whose content hash has moved on and languages the reader has
stopped reading, which a sum of the waves would quietly leave behind.

**The panel plans the waves on the client, which is not a second planner.** The
worker plans in order to fetch; this plans in order to PRICE, and a price is
asked for before the download exists to be asked about — so `readerPlan()` is
exported, because a divergence would show one number while the worker fetched a
different set of files, with no symptom on either side. What is not duplicated
is the measurement: held bytes are read back from the cache every time, since
the reader whose library was filled last week is the one the panel must be
right about.

## Updates

**No `skipWaiting()`** — a reader mid-chapter should not have assets swapped
under an open tab. That obliges us to offer the update instead: the browser's
own rule is not something a reader can act on, a plain reload does not release
the old worker, and since the corpus index ships inside the shell bundle a
stale worker is a stale table of contents.

**Asking was the first answer and is now the last of three.** There are two
moments where nothing is standing on the ground — the tab is hidden, and the
reader has just clicked a link away — and the update is applied silently at
both. `UpdateBanner` is what is left for the reader parked on one chapter, the
one case where the ground genuinely would move. At one to two deploys a day the
bar was a near-daily interruption offering something the reader had no reason
to refuse.

Three details are load-bearing. The navigation must be a real `link` to a
different address (a `goto` is often a button wearing a URL; a `#`-jump is a
navigation to the page already being read). The update must be applied BEFORE
the new document opens, or it is claimed by the old worker and the reader pays
a full load to arrive on the same stale shell. And the wait for
`controllerchange` times out, because `activate` sweeps two caches first.

**The build id is legible, and printed in the footer.** SvelteKit's default is
`Date.now()`, which names the shell cache and is what `usage.ts` compares to
tell a landed update from an offered one — all correct, and unreadable. It is a
UTC minute and the commit, `-dirty` when the tree held changes that commit does
not describe. The minute cannot be dropped in favour of the sha, since a deploy
ships one person's working tree and two builds from one commit are the normal
case. `vite.config.ts` is evaluated four times per build in four processes, so
the first to compute the id exports it and the rest inherit it — without that,
one build shipped two identities.

## Offline mode

**The reader may switch the network off entirely.** Everything above is about
coping with a network that went away; this is the other direction. Off by
default, in `AdvancedSheet`.

**It is three gates and not one, because there are three mechanisms and no
single chokepoint.** `sw.svelte.ts` stops the update check, the offer and every
download message; `usage.ts` withholds the beacon; `service-worker.ts` serves
cache-only, which is the only half that can hold for a request no application
code issues — a font, an image, the document of a cold start.

**The worker's copy has to be PERSISTED.** A service worker has no
`localStorage` and is killed freely, and the navigation that boots the app is
answered before any page script exists to tell it anything. The flag is
mirrored into a cache of its own, the only storage a page and a worker share,
and the page re-posts it on every start as a correction rather than as the
source. **A design that only posted the flag would have worked in every manual
test and failed exactly once per cold start.**

**A miss is REFUSED, not fetched, and that is the whole feature.** `cacheOnly`
answers 504 rather than falling through, including when the cache itself throws
— an unreadable cache is not permission to make the request.

**Two things it cannot stop, and both are the browser's**: the periodic
byte-check of the worker script and the `install` that follows. The precache is
deliberately not gated — a worker that activates with an empty shell cache is
an app that cannot boot at all.

**It shipped behind a fold, and then the fold stopped being a fold.** A hidden
control that is silently ON is a reader who cannot explain why nothing loads;
the library was a second dialog either way, because byte counts and a
destructive action do not fit an 11rem popover; and that width is why the
switch could only name its state and not its price. **The panel that was too
narrow to explain either half was what forced the split.**

**It made two latent bugs reachable, and both were fixed with it.** `corpus.ts`
memoized REJECTED reads, harmless while the only cause was a network already
gone and fatal to a switch whose purpose is to be turned back off; and
`LinkPreview` had no `catch` on its resolve. Both are the same shape: a failure
path only ever reached by accident, become ordinary.
