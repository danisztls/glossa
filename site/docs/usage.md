# Usage measurement

First-party, bucketed, unlinkable. This section is also the legitimate-interest
assessment the LGPD expects to be documented rather than assumed.

**Nothing measured usage until 2026-08-27, and the reason it had to change is
the offline-first design itself.** `/` is precached and served cache-first, an
installed app launching at `start_url` makes no document request at all, and an
in-app route change never reaches the edge. So request logs can count arrivals
and nothing else: they cannot tell a reader who came once from one who has read
daily for a year.

**Retention is measured without an identifier, by making the device count
itself.** `usage-device.ts` keeps a 28-bit integer in localStorage, one bit per
day. What leaves the device is the bucket that count falls in (`15-28`, `4-7`,
`1`) — never the bitmask, never a date, never a number assigned to anyone. Two
sessions from the same device carry no field that joins them.

The cost is classic cohort retention, which genuinely does need identity. What
it buys is the age distribution of the active population, which is what the
question actually asks. **That trade was made deliberately and is not a gap to
close later.**

**One beacon per session, and only for a reader.** Nothing is sent until the
session has had five seconds of visible time and one real interaction. That
gate is the bot defence, not politeness: a JS-rendering crawler loads,
snapshots and leaves without scrolling, and keeps no localStorage between
crawls, so every visit looks like a brand-new device that came once and never
returned — precisely the row this exists to count.

**The country is recorded and never meets the session.** Eighteen bucketed
fields in one row is already a weak quasi-identifier; adding the country makes
an unusual reader unique in the table. `geo_lang` is a separate counter with no
key back to `session`, and the cross-tab it answers costs nothing in linkage.
**That separation is what makes Art. 12 an argument rather than an assertion.**

**Work level, never passage level, and never free text.** Which text someone
opened is a corpus-priority signal; which paragraph they read is their
business. The jump box records that a query missed and, where the grammar
recognised one, which book — an identifier from our own tables. The query
itself is the one thing on a site of these texts that must not be stored.

**Every field is an enum, validated at the edge, because `/a` is an open POST
endpoint.** `usage-schema.ts` is one module shared by sender and receiver
rather than two lists, since the whole defence rests on their vocabularies
being the same object. Every outcome is 204, so a prober learns nothing about
what the validator accepts.

**The damage worth preventing is not a skewed statistic but an eaten quota.** A
poisoned window is dropped with one `delete`. D1's free tier allows 100,000 row
writes a day and exhausting it stops genuine rows being written — the same
shape of failure as the `run_worker_first` outage. `usage-store.ts` holds a
20,000-row daily cap, read from D1 at most once a minute per isolate.

## Three pieces live in the Cloudflare dashboard

Nothing in the repository can assert they agree. This is their record.

1. **A WAF custom rule** blocking `/a` for verified bots, non-`POST` methods
   and non-same-origin requests:

   ```
   (http.request.uri.path eq "/a")
   and (
     cf.client.bot
     or http.request.method ne "POST"
     or not any(http.request.headers["origin"][*] eq "https://glossacatholica.org")
   )
   ```

   `http.request.uri.path`, not `http.request.uri`, which carries the query
   string. `eq`, not `wildcard` — on a path this short a later "fix" to `/a*`
   would swallow every route beginning with `a`.

   **The third clause tested `sec-fetch-site` with `any(… ne …)` and never
   fired.** An absent header is an EMPTY ARRAY and `any()` over it is false, so
   a request carrying no fetch metadata read as "not non-same-origin" and was
   allowed — `curl -X POST` with no headers reached the worker. **Write
   `not any(… eq …)`, never `any(… ne …)`**: the first treats absence as
   failure, the second as consent, and every header test on an open endpoint
   wants the first.

   **And the field had to change with it**, because failing closed is only safe
   on a header every genuine sender sets. `Origin` is attached by the Fetch
   spec to every non-`GET` request; `Sec-Fetch-Site` arrived in Safari only at
   16.4, so tightening that clause would have silently stopped counting readers
   on older iPhones — an undercount biased toward older devices, invisible in
   the report, indistinguishable from those readers not existing. Verified by
   hand, which is the only check there is: no `Origin` and a foreign `Origin`
   both 403, the site's own 204, a real session still lands a row.

2. **The zone's single rate limiting rule already covers `/a`**
   (`site/docs/edge.md`), because it excludes three static prefixes and
   verified bots and `/a` is none of them. The free plan allows exactly one
   such rule and it is spent, which is why the write ceiling is a counter in
   `usage-store.ts`.

3. **The kill switch is a third custom rule blocking `/a` outright** — a
   dashboard change rather than a deploy on purpose, since a client-side stop
   needs the service worker to propagate and an installed PWA can sit on a
   superseded shell indefinitely.

## The law

**The LGPD is the primary law and it is a better fit than the one the design
was first argued against.** There is no Brazilian analogue to ePrivacy's
Art. 5(3) — the rule that storing information on a device is regulated whether
or not it is personal data — so the localStorage counter is not itself a
regulated act here. What matters is whether what is transmitted is _dados
pessoais_ at all (Art. 12) and on what basis.

The ANPD's _Guia Orientativo — Cookies_ (2022) is directly on point:
**legítimo interesse** (Art. 7, IX) supports first-party audience measurement
without consent, provided it is limited to patterns and trends over aggregated
data, is not combined with other tracking, and builds no profiles. Every
condition is satisfied by construction — one first-party origin, no third
party, no identifier, buckets instead of values, and `geo_lang` with no key
back to `session`.

**The device record expires after twelve months, absolutely.** The guide
rejects indeterminate durations outright. Twelve months is where it lands
because the field that needs the room is `visits`, whose binding case is the
INFREQUENT reader — cutting to four months would report a monthly reader as a
brand-new device three times a year, inflating the one number the measurement
exists to establish. It is never renewed by a visit: a sliding window would
keep a record alive indefinitely for exactly the readers who visit most. The
cost is one distorted number and the report prints the caveat beside it.

**Stored rows are pruned by a daily cron, not by a flag someone remembers.**
`RETENTION_DAYS` is 400 — thirteen months, because comparing a month against
the same month a year earlier needs both endpoints — enforced by `scheduled()`
on a trigger versioned with the deploy. **A period applied only when someone
types a flag IS an indeterminate retention period**, however firmly the
constant is written down. The two windows are deliberately different numbers:
one bounds how long a device may remember itself, the other how long an
anonymous aggregate stays useful.

**EU readers are a real secondary exposure and the design is left at the
stricter reading.** The interface is in thirty-four languages, most of them
European, which is the kind of evidence GDPR Art. 3(2) treats as offering a
service into the Union. Nothing was relaxed on discovering the LGPD is primary;
the point of recording it is to know which argument answers which regulator.

**Nothing is collected from a developer's machine, and `dev` alone does not
establish that.** `import.meta.env.DEV` is false under `npm run preview` and
under `wrangler dev`, both of which serve a production build from a laptop. The
test is the hostname, spelled deny-local rather than allow-canonical: listing
the real domain would fail in the worse direction, since moving the site would
stop measurement silently and read as "nobody visited". `?usage=on` overrides
it, because a measurement nobody can exercise by hand is one nobody checks.

**The report is a terminal report** (`npm run usage`), beside `audit.py` and
`reference-coverage.mjs`, for the same reason: a number worth acting on is a
number worth printing beside the others. It suppresses population cells below
five — not because a count of three is dangerous but because a single-reader
cell invites you to read a person into it — and deliberately does not suppress
diagnostics, where a long tail of three quota failures is the entire value.
