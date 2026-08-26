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

/** Where the source lives, for the "how this was built" section. */
export const REPOSITORY_URL: string | null = null;
