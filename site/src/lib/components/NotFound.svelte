<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import reynard from '$lib/assets/reynard-preaching.avif';

	/** Set when the one `<img>` below fails to render -- see the comment on the
	 *  figure. Never reset: nothing re-tries, and a second attempt in the same
	 *  page view would fail for the same reason. */
	let unavailable = $state(false);

	const SECTIONS = [
		{ href: '/scriptura', key: 'nav.bible' },
		{ href: '/catechismus', key: 'nav.ccc' },
		{ href: '/summa', key: 'nav.summa' },
		{ href: '/preces', key: 'nav.prayers' },
		{ href: '/documenta', key: 'nav.magisterium' }
	] as const;
</script>

<svelte:head>
	<title>{t('notFound.title')} — {t('home.title')}</title>
</svelte:head>

<!--
	Reynard the fox, mitred and crozier in hand, preaching to a congregation of
	geese, a swan and a heron -- the bas-de-page of Royal MS 10 E IV f. 49v, the
	same manuscript whose rabbit cycle is the internet's favourite marginalia.
	The shipped file is an AI-retouched version of that folio, cut out against
	real transparency, so the figures float and the image carries no ground of
	its own to fight the page's. That is the whole reason it works on all three
	themes.

	It is a MASKED RASTER and not a vector, which was the first plan and the
	wrong one. This is a pen-and-wash painting, not line art: posterizing it
	merged the fox's cream mitre into the cream ground, so the trace quietly
	removed the bishop -- the one detail the picture is about -- and cost 656 KB
	to do it. The AVIF is 77 KB, keeps the mitre, and takes its
	theme-independence from the alpha channel instead.

	AVIF AND NOT WEBP, which is what shipped until 2026-08-28. Both encode this
	alpha losslessly -- it is a hard mask, 0.1% partially transparent -- and
	both keep the mitre; AVIF is simply 14% smaller at a slightly lower DSSIM
	against the master (0.0041 against 0.0044, measured composited over a white
	AND a near-black ground, since the mask is the whole point). It also stops
	this being the one image on the site that is not AVIF: Dore's 482 plates
	already are, for a different and stronger reason -- they are grayscale, and
	lossy WebP has no monochrome mode, so it carries two flat chroma planes for
	nothing (`pipeline/scrapers/dore/plates.py`).

	NO `<picture>` FALLBACK, AND NO EMPTY BOX EITHER. The browsers without
	AVIF-and-alpha are Safari before 16.4, and a second encoding of a
	decorative image on the error route is not worth the build asset. What
	they get instead is nothing at all: the `onerror` below drops the whole
	`<figure>`, caption included, because a credit line is the one part that
	must not outlive the picture it credits -- "based on Royal MS 10 E IV"
	standing alone over a gap reads as a claim about the page rather than
	about an illustration.

	It is `onerror` and not a feature probe on purpose. A probe answers only
	the question asked (does this engine decode AVIF), and asks it a frame
	late; the error event answers the question that actually matters -- did
	THIS image render -- for every reason it can fail. The reason that is not
	hypothetical here is the service worker: the file is DEFERRED_MEDIA
	(`sw-policy.ts`), cached on first read and in no download wave, so a
	reader who fills the offline library and later mistypes an address while
	offline has never fetched it. That reader is on a browser that supports
	AVIF perfectly well, and a probe would have shown them the empty box this
	is here to prevent.

	Keeping `width`/`height` on the element is what makes the supported path
	free: the box is reserved from the attributes, the image loads into it,
	and nothing moves. The collapse costs one reflow, and it costs it only on
	the paths that were going to show a hole anyway.

	IT IS NOT A REPRODUCTION, and the caption says so. The retouching invented
	ornament the manuscript does not carry -- the mitre is plain cream with a
	simple band on the folio and gold, jewelled and three-peaked here; the
	crozier is a plain crook there and gold filigree here. So the credit reads
	"based on" rather than naming the shelfmark flat, which would claim to BE
	f. 49v. That distinction is the same one the colophon draws for texts, and
	it is why the line is a translated string rather than a bare shelfmark.

	The MASTER is `assets/reynard-preaching.png` at the repo root, unoptimized
	and neither built nor deployed, kept so this file can be re-encoded without
	redoing the cutting. The README beside it has the derivation.

	DECORATIVE, hence `alt=""`. The page's meaning is carried entirely by the
	words below it; the caption beneath carries the attribution, and that one IS
	read out.
-->
<article class="content-column not-found">
	{#if !unavailable}
		<figure class="drollery">
			<img src={reynard} alt="" width="1368" height="768" onerror={() => (unavailable = true)} />
			<figcaption>{t('notFound.credit')}</figcaption>
		</figure>
	{/if}

	<h1>{t('notFound.title')}</h1>
	<p class="lede">{t('notFound.lede')}</p>
	<p>{t('notFound.body')}</p>
	<p>{t('notFound.searchHint')}</p>

	<p class="elsewhere">{t('notFound.elsewhere')}</p>
	<ul class="sections">
		<li><a href="/">{t('notFound.home')}</a></li>
		{#each SECTIONS as section (section.href)}
			<li><a href={section.href}>{t(section.key)}</a></li>
		{/each}
	</ul>
</article>

<style>
	.not-found {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.not-found h1 {
		margin-bottom: 0.5rem;
	}

	.drollery {
		margin: 0 0 2.5rem;
	}

	.drollery img {
		display: block;
		width: 100%;
		height: auto;
	}

	.drollery figcaption {
		margin-top: 0.5rem;
		font-family: var(--font-sans);
		font-size: 0.7rem;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}

	.lede {
		font-size: 1.15rem;
		color: var(--color-text-muted);
		margin-top: 0;
	}

	.elsewhere {
		margin-top: 2.5rem;
		margin-bottom: 0.6rem;
	}

	.sections {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 0.75rem;
		font-family: var(--font-sans);
		font-size: 0.9rem;
	}

	.sections a {
		display: inline-block;
		padding: 0.35rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		text-decoration: none;
	}

	.sections a:hover,
	.sections a:focus-visible {
		border-color: var(--color-accent);
	}
</style>
