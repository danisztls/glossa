<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import reynard from '$lib/assets/reynard-preaching.webp';

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
	to do it. The WebP is 89 KB, keeps the mitre, and takes its
	theme-independence from the alpha channel instead.

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
	<figure class="drollery">
		<img src={reynard} alt="" width="1368" height="768" />
		<figcaption>{t('notFound.credit')}</figcaption>
	</figure>

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
