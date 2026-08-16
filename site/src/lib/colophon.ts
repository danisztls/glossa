/**
 * Contact address for the colophon.
 *
 * SET THIS BEFORE THE SITE IS PUBLIC. docs/research/copyright.md §5's
 * adopted posture is to host Church-owned texts without prior permission
 * and "comply promptly if asked" — which is only a coherent position if
 * there is a working address to ask at. A colophon that states the posture
 * without a reachable contact is worse than no colophon: it announces that
 * we are hosting copyrighted text and gives the rights holder no way to
 * respond, which is exactly the reading the posture exists to avoid.
 *
 * Left unset rather than guessed. The page renders an explicit "contact
 * address pending" line while this is null, so the gap is visible on the
 * page instead of hidden in a config file — nobody ships a public site
 * having read that sentence and not noticed.
 */
export const CONTACT_EMAIL: string | null = null;

/** Where the source lives, for the "how this was built" section. */
export const REPOSITORY_URL: string | null = null;
