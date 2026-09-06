<script lang="ts">
	/**
	 * The Mass readings appointed for one day, as resolved citations.
	 *
	 * EVERY CITATION IS A LINK INTO THIS SITE'S OWN BIBLES and never a text
	 * reproduced here — `$lib/lectionary` says why at length. `RefText` does
	 * the resolving, which means the Hebrew-to-Vulgate psalm mapping is
	 * applied on the way without this component knowing about it (`refs.ts`
	 * calls `resolveVulgate` for every scripture segment).
	 *
	 * THE NOTE UNDER THE READINGS IS NOT DECORATION. A reader who arrives at a
	 * page headed with today's date and a list of readings will reasonably take
	 * it for what is read at their parish, and for two reasons it may not be:
	 * the translation is this corpus's, not the one proclaimed aloud, and the
	 * schedule is the universal Ordo Lectionum Missae, which a conference may
	 * adapt. Saying so once, quietly, under the list is the colophon's own
	 * posture — `site/docs/colophon.md` — applied where the claim is actually
	 * made rather than on a page few readers reach.
	 *
	 * A PERICOPE WITH NO CITATION IS PRINTED AS ITS NAME AND NOTHING ELSE.
	 * Christmas Day's acclamation and the Easter sequences are not Scripture,
	 * so the source prints no address for them; showing an empty link, or
	 * dropping the row, would each say something false — that the site lost a
	 * citation, or that the Mass has no sequence.
	 */
	import { i18n, t } from '$lib/i18n.svelte';
	import { slotKey, type MassReadings, type Pericope } from '$lib/lectionary';
	import RefText from './RefText.svelte';

	interface Props {
		masses: MassReadings[];
	}
	let { masses }: Props = $props();

	// The content language of a citation string, which is what drives the
	// grammar's book tables. These come from an English-language source and are
	// English-spelled ("Sirach", "Matthew"), so they are read as English
	// whatever interface the reader is using — the citation is resolved, then
	// the link lands in whichever edition the reader's own language has.
	const CITE_LANG = 'en';

	function label(p: Pericope, readings: Pericope[]): string {
		const key = slotKey(p, readings);
		return key ? t(key) : (p.label ?? '');
	}
</script>

<section class="readings" aria-labelledby="readings-heading">
	<h3 id="readings-heading">{t('lectionary.heading')}</h3>

	{#each masses as mass (mass.olm)}
		<div class="mass">
			{#if mass.label}
				<!-- Named only where the day has more than one Mass to tell
				     apart; the source names it, and this does not invent one. -->
				<h4>{mass.label}</h4>
			{/if}
			<dl>
				{#each mass.readings as reading, i (i)}
					<div class="row">
						<dt lang={i18n.lang}>{label(reading, mass.readings)}</dt>
						<dd>
							{#if reading.cite}
								<RefText text={reading.cite} lang={CITE_LANG} />
								{#each reading.orElse ?? [] as alt (alt)}
									<span class="alt">
										<span class="or">{t('lectionary.or')}</span>
										<RefText text={alt} lang={CITE_LANG} />
									</span>
								{/each}
							{:else}
								<!-- No address because the text is not Scripture. -->
								<span class="unscriptured">{t('lectionary.notScripture')}</span>
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/each}

	<p class="caveat">{t('lectionary.caveat')}</p>
</section>

<style>
	.readings {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--color-border);
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}
	h4 {
		margin: 0.75rem 0 0.3rem;
		font-size: 0.85rem;
		font-weight: 600;
	}
	.mass:first-of-type h4 {
		margin-top: 0;
	}
	dl {
		margin: 0;
		display: grid;
		/* The label column sizes to the longest label and stops there, so a
		   translation longer than English's does not push the citations off a
		   narrow screen — it wraps instead. */
		grid-template-columns: minmax(min-content, max-content) 1fr;
		gap: 0.2rem 0.75rem;
	}
	.row {
		display: contents;
	}
	dt {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		hyphens: auto;
	}
	dd {
		margin: 0;
		font-size: 0.9rem;
	}
	.alt {
		white-space: nowrap;
	}
	.or {
		color: var(--color-text-muted);
		font-style: italic;
		margin: 0 0.15rem 0 0.35rem;
	}
	.unscriptured {
		color: var(--color-text-muted);
		font-style: italic;
	}
	.caveat {
		margin: 0.7rem 0 0;
		font-size: 0.75rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	@media (max-width: 26rem) {
		/* Two columns stop helping once the label column is most of the width:
		   the citation is the answer and gets the full measure. */
		dl {
			grid-template-columns: 1fr;
			gap: 0 0;
		}
		.row {
			display: block;
			margin-bottom: 0.4rem;
		}
	}
</style>
