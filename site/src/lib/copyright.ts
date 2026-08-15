/**
 * Copyright display for a work, per the posture decided in
 * docs/research/copyright.md and docs/decisions.md: public-domain works
 * say so plainly; copyrighted works display their exact notice (verbatim,
 * as required by the rights holders) on every landing/reading page.
 */

import type { WorkManifest } from './types';

export function copyrightLabel(manifest: WorkManifest): string {
	if (manifest.copyright.status === 'public-domain') return 'Public domain';
	return (
		manifest.copyright.notice ??
		(manifest.copyright.holder ? `© ${manifest.copyright.holder}` : 'Copyrighted')
	);
}
