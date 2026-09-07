/**
 * Contact address for the colophon.
 *
 * docs/research/copyright.md §5's adopted posture is to host Church-owned
 * texts without prior permission and "comply promptly if asked" — which is
 * only a coherent position if there is a working address to ask at. This is
 * that address, and it is load-bearing rather than decorative: a rights
 * holder who cannot reach us has no route to the takedown this project
 * promises, and the promise is what makes hosting-without-asking a position
 * rather than an omission.
 *
 * If it ever needs changing, change it here and nowhere else. There are two
 * consumers now: the colophon page, which degrades to a visible "not set yet"
 * notice rather than a silent gap if this is ever set back to null, and
 * `scripts/write-security-txt.mjs`, which fails the build outright — `Contact`
 * is the one required field of RFC 9116, and a security.txt without it is
 * invalid rather than merely incomplete.
 *
 * It is deliberately on the site's own domain rather than a personal one: a
 * `.br` registration is published in registro.br's WHOIS under the holder's
 * name, with no privacy proxy on offer, so the address a public page carries
 * should not be the one that discloses who runs it. `curator` names the person
 * asked for rather than the medium, and is a word English borrowed unchanged,
 * so it reads to someone with no Latin as well as it does to someone with it.
 */
export const CONTACT_EMAIL: string | null = 'curator@glossacatholica.org';

/**
 * The interface languages whose Scripture gap is CLOSED rather than merely
 * open — `docs/research/bible-texts.md` §The three that are blocked.
 *
 * Most languages without a Bible edition are waiting on somebody's time:
 * Polish, Russian and Romanian each have a chosen text, captured and
 * unparsed. These three are not. Swedish has no public-domain Catholic
 * translation in existence — the alternatives are Lutheran and fail the
 * survey's own litmus at Luke 1:28 — and the Slovenian (Wolf, 1856–59) and
 * Arabic (Mosul, 1875–78) ones exist as scans nobody has turned into text,
 * so reaching them is an OCR project rather than an ingestion.
 *
 * A reader in any of the three gets English Scripture under their own chrome,
 * and said colophon paragraph is the only place the site explains why.
 *
 * IT IS A LIST SO THE PAGE CAN CHECK IT, and the check is the point: the
 * paragraph names the three languages and their two reasons in prose, which
 * no corpus can derive, so the one thing that CAN be derived — whether the
 * gap is still there — is what gates the paragraph. An edition arriving in
 * any of them withdraws the whole statement rather than leaving a page
 * asserting a blockage the library disproves. Rewrite the sentence then;
 * do not simply delete the language from this list.
 */
export const BLOCKED_BIBLE_LANGS = ['sv', 'sl', 'ar'] as const;
