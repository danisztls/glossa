/**
 * The reader is an SPA. `adapter-static` emits one fallback shell, and the
 * client router resolves the stable, path-based reference URLs from there.
 *
 * Content remains static: `corpus.ts` fetches immutable, content-hashed JSON
 * assets as a route needs them. Disabling SSR here is what stops SvelteKit
 * from materialising one HTML document per paragraph, chapter, and work just
 * to carry a small amount of route data around the same application shell.
 */
export const ssr = false;
