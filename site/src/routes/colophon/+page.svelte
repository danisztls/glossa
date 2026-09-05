<script lang="ts">
	/**
	 * The colophon.
	 *
	 * docs/research/copyright.md §5 lists this page as part of the adopted
	 * posture, not as documentation of it: hosting Church-owned texts
	 * without prior permission is a coherent position only if the position
	 * is stated openly, with a contact address a rights holder can write to.
	 * Absent this page, the same act is just an unexplained omission. That is why
	 * PLAN.md ranks a page of prose above features that took far longer.
	 *
	 * Written as plain statements in the first person plural, and not
	 * hedged. A colophon that equivocates about what it is doing fails at
	 * the one job it has.
	 *
	 * The work counts are derived from the corpus rather than written into
	 * the copy, so the page cannot drift from what the site actually serves
	 * the way a hand-typed number would.
	 */
	import { isUnpublished, listDocuments, listWorks } from '$lib/corpus';
	import { plateCredits } from '$lib/corpus-index';
	import IndexSidebarToc from '$lib/components/IndexSidebarToc.svelte';
	import { CONTACT_EMAIL } from '$lib/colophon';
	import { t } from '$lib/i18n.svelte';
	import { RETENTION_DAYS } from '$lib/usage-store';

	const works = listWorks();
	const bibleEditions = works.filter((w) => w.type === 'bible').length;

	/**
	 * Documents whose text this site actually SERVES, which is not the same as
	 * documents the corpus contains. A work switched off still has a manifest
	 * and still has an address (which redirects to the source), so counting
	 * registry entries would quote a number this page cannot back up — on the
	 * one page whose entire job is to be believable.
	 *
	 * Counted per slug, and a slug survives if ANY of its editions is
	 * published: a document whose Portuguese text was withheld for a bad parse
	 * is still readable in English, and saying otherwise would understate the
	 * library as badly as the other error overstates it.
	 */
	const documentCount = listDocuments().filter((group) =>
		Object.values(group.manifests).some((m) => m && !isUnpublished(m.id))
	).length;

	/**
	 * The illustration collections, credited from their own manifests rather
	 * than from prose written here — the same rule the work counts above
	 * follow, and for a stronger reason: this is the page that says what the
	 * site does with other people's material, and a hand-typed attribution is
	 * one that can quietly stop matching what is actually served.
	 *
	 * The section renders only when a collection is present, so a
	 * fixture-backed or plates-free build says nothing rather than crediting
	 * an artist whose work is not on the page.
	 */
	const collections = Object.values(plateCredits);

	/**
	 * The page's own sections, for the aside. Hand-written rather than read
	 * off the rendered headings, the way `/preces` builds its list from the
	 * groups it is about to render: there is no slug helper in `$lib`, and
	 * these headings are translated, so an id derived from one would change
	 * language with it and break every link that had been made to it.
	 *
	 * The ids are therefore fixed and English while the labels come from the
	 * same dictionary keys the headings do — which is what stops the two
	 * drifting: a row and its heading read one entry, not two.
	 *
	 * `$derived` for the labels rather than the list. `collections` is fixed
	 * by module load, but every label is a `t()` call and has to be re-read
	 * when the reader switches language.
	 */
	const sidebarItems = $derived([
		{ href: '#what-this-is', label: t('colophon.whatThisIs') },
		{ href: '#texts', label: t('colophon.textsTitle') },
		...(collections.length > 0
			? [{ href: '#illustrations', label: t('colophon.illustrationsTitle') }]
			: []),
		{ href: '#type', label: t('colophon.typeTitle') },
		{ href: '#privacy', label: t('colophon.privacyTitle') },
		{ href: '#copyright', label: t('colophon.copyrightTitle') },
		{ href: '#contact', label: t('colophon.contactTitle') }
	]);
</script>

<svelte:head>
	<title>{t('colophon.title')} — {t('home.title')}</title>
</svelte:head>

<!-- The grid `/preces` and the reading routes use: the column keeps the
     measure, the aside gets the end lane, and below 80rem `.index-aside`
     is display:none, so a phone reads the prose with no second copy of
     its headings appended. All of that is `src/styles/layout.css` — this
     page adds no CSS of its own for it. -->
<div class="reading-layout">
	<article class="content-column colophon">
		<h1>{t('colophon.title')}</h1>
		<p class="page-tagline lede">{t('colophon.lede')}</p>

		<h2 id="what-this-is" class="label-micro">{t('colophon.whatThisIs')}</h2>
		<p>{t('colophon.whatThisIsBody')}</p>
		<ul class="plain">
			<li>{t('colophon.pointFree')}</li>
			<li>{t('colophon.pointNoAds')}</li>
			<li>{t('colophon.pointNoAccounts')}</li>
			<li>{t('colophon.pointNoTracking')}</li>
			<li>{t('colophon.pointOffline')}</li>
		</ul>

		<!--
			Where this site stands, closing the section that says what it is —
			before "The texts", because a reader who has just been told what is
			offered is owed the standing it is offered on, and after the list,
			because the list is a set of promises about reading and this is not.

			Not its own <h2>: a heading would need a name in fourteen dictionaries
			for a term of art none of them has a settled word for, and the claim
			belongs to "what this is" anyway.

			One paragraph, and the second one it briefly had is gone on purpose —
			see the key's own note in i18n/en.ts. Saying what is OURS rather than
			the publishers' is a claim about provenance, and a provenance claim
			belongs beside the prose it is about, marked per item in the reading
			interface. Nothing here does that yet. The gap is deliberate.
		-->
		<p>{t('colophon.whatThisIsStanding')}</p>

		<h2 id="texts" class="label-micro">{t('colophon.textsTitle')}</h2>
		<p>{t('colophon.textsBody')}</p>
		<!--
			What is done to a text, said where a reader meets the texts rather
			than in the copyright section below. It reads there as a concession to
			a rights holder; it is really a statement about the edition, and the
			reader is the one it is owed to.
		-->
		<p>{t('colophon.textsFidelity')}</p>
		<p class="counts">
			{bibleEditions}
			{t('colophon.countBible')} · {documentCount}
			{t('colophon.countDocuments')}
		</p>

		{#if collections.length > 0}
			<h2 id="illustrations" class="label-micro">{t('colophon.illustrationsTitle')}</h2>
			<!--
				The prose sits OUTSIDE the loop and the credit inside it, which is
				the split that will still be right if a second collection is ever
				added: what is said here is about the pictures this site carries,
				and it names Doré because he is who they are by; what is said per
				collection is whose copy we have.

				Two claims: what the pictures are, and on what footing we publish
				them at all. The second is the load-bearing one, and it has the
				same shape as the copyright section below — what the position is,
				and why it holds. Neither names a date, because the credit line
				at the foot of the section is generated from the collection's own
				manifest and prints them all.
			-->
			<p>{t('colophon.illustrationsBody')}</p>
			<p>{t('colophon.illustrationsRights')}</p>
			{#each collections as collection (collection.title)}
				<p class="counts">
					{collection.plates}
					{t('colophon.countPlates')} · {collection.chapters}
					{t('colophon.countPlateChapters')}
				</p>
				<p class="credit">
					<em>{collection.title}</em>. {collection.artist}, {collection.edition}.
					{collection.reproduction}.
					<br />
					{t('plates.scansBy')}
					<a href={collection.provider_url} rel="external noopener" target="_blank"
						>{collection.provider}</a
					>
				</p>
			{/each}
		{/if}

		<!-- Every face here is OFL, which requires the copyright notice and licence
		     to travel with them; the licence texts ship as static/fonts/OFL-*.txt
		     and this is the human-readable half of that obligation. It also belongs
		     on a colophon in the older sense of the word. Three paragraphs, and the
		     split is by JOB rather than by face — the text face and its Cyrillic,
		     the Arabic the text face cannot reach, then both display faces and the
		     licence all four share. A paragraph per face would be five keys in
		     fourteen dictionaries to say four things. Source Sans 3 sets the chrome
		     and is deliberately not named: it is our furniture, not the book. -->
		<h2 id="type" class="label-micro">{t('colophon.typeTitle')}</h2>
		<p>{t('colophon.typeBody')}</p>
		<p>{t('colophon.typeArabic')}</p>
		<p>{t('colophon.typeInitials')}</p>

		<!--
			Between the type and the copyright, which is where the page turns from
			the reader to the rights holder — the last section addressed to whoever
			is reading, answering the one bullet above they have to take on trust.

			Three paragraphs deliberately: what is absent, what is counted, what
			never leaves the device. site/docs/usage.md is the argument; this is
			the claims, and a notice nobody finishes reading discloses nothing.

			The retention is interpolated from `RETENTION_DAYS`, the rule the work
			counts follow: this page's whole value is being believable, and a
			number typed into prose is one that can quietly stop being true.
		-->
		<h2 id="privacy" class="label-micro">{t('colophon.privacyTitle')}</h2>
		<p>{t('colophon.privacyBody1')}</p>
		<p>{t('colophon.privacyBody2').replace('{days}', String(RETENTION_DAYS))}</p>
		<p>{t('colophon.privacyBody3')}</p>

		<!--
			Last, and deliberately. The page opens with what a reader came for —
			what this is, the texts, the pictures, the type, and what is recorded
			of their reading — and closes with the two sections addressed to
			someone else: whoever holds rights in a text here, and how to reach
			us. Ordered that way, the copyright statement
			reads as the standing position it is rather than as the site's
			apology for existing.

			Three claims, in the order a rights holder would want them: whose the
			texts are, what each work shows of theirs, and where to write.
		-->
		<h2 id="copyright" class="label-micro">{t('colophon.copyrightTitle')}</h2>
		<p>{t('colophon.copyrightBody1')}</p>
		<p>{t('colophon.copyrightBody2')}</p>
		<p><strong>{t('colophon.copyrightBody3')}</strong></p>

		<h2 id="contact" class="label-micro">{t('colophon.contactTitle')}</h2>
		{#if CONTACT_EMAIL}
			<p>
				{t('colophon.contactBody')}
				<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
			</p>
		{:else}
			<!--
				Deliberately visible rather than silently absent — see
				`$lib/colophon.ts`. The whole page is premised on being reachable;
				shipping it unreachable would be worse than not shipping it.
			-->
			<p class="pending">{t('colophon.contactPending')}</p>
		{/if}
	</article>
	<aside class="index-aside">
		<IndexSidebarToc heading={t('colophon.title')} items={sidebarItems} />
	</aside>
</div>

<style>
	.colophon {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.colophon h1 {
		margin-bottom: 0.5rem;
	}

	.credit {
		font-size: 0.95em;
		color: var(--color-text-muted);
	}

	/* A `.page-tagline` (styles/components.css) set a step larger than the
	   index pages': this is one sentence on the page that explains the site,
	   and it is the page's opening rather than a label on a list. */
	.lede {
		font-size: 1.15rem;
	}

	.colophon h2 {
		font-size: 0.8rem;
		margin-top: 2.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--color-border);
	}

	.plain {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.plain li {
		padding: 0.2rem 0 0.2rem 1.1rem;
		position: relative;
	}

	.plain li::before {
		content: '—';
		position: absolute;
		inset-inline-start: 0;
		color: var(--color-text-muted);
	}

	.counts {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* Marked as unfinished on the page itself, not merely in a comment. */
	.pending {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		padding: 0.7rem 0.9rem;
		border: 1px dashed var(--color-accent);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
	}
</style>
