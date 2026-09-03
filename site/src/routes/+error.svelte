<!--
	Two failures reach this route, and until offline mode there was only one.

	A 404 is an address the corpus does not carry, and `NotFound` is the whole
	answer to it. Anything else is a load that THREW, and by far the commonest
	way for that to happen now is a content file the reader does not have: in
	offline mode `service-worker.ts` refuses a cache miss instead of fetching
	it, `corpus.ts` throws on the non-ok response, and the route's `load` gives
	up. Sending that reader to "Nothing at this address" would be a lie about
	their own library — the text exists, it is simply not here — and the fix is
	one switch away, which is why `NotDownloaded` carries the switch.

	THE DISCRIMINATOR IS THE STATUS AND NOT THE MESSAGE. Every deliberate
	refusal in a `load` is an `error(404, …)`; an unexpected throw is a 500. So
	a genuinely missing address still gets `NotFound` with offline mode on,
	which is right: turning the switch off would not conjure it.
-->
<script lang="ts">
	import { page } from '$app/state';
	import NotFound from '$lib/components/NotFound.svelte';
	import NotDownloaded from '$lib/components/NotDownloaded.svelte';
	import { offline } from '$lib/offline.svelte';

	const notDownloaded = $derived(offline.enabled && page.status !== 404);
</script>

{#if notDownloaded}
	<NotDownloaded />
{:else}
	<NotFound />
{/if}
