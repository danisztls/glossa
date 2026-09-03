<!--
	THREE failures reach this route, and until 2026-09-03 only two were told
	apart — the third was quietly answered with the first one's page.

	THE DISCRIMINATOR IS THE STATUS AND NOT THE MESSAGE. Every deliberate
	refusal in a `load` is an `error(404, …)`; an unexpected throw is a 500.

	  - 404 is an address the corpus does not carry, whatever the offline
	    switch says, and `NotFound` is the whole answer to it. It stays right
	    with offline mode on: turning the switch off would not conjure an
	    address that does not exist.

	  - A 500 with offline mode ON is by far the commonest throw: a content
	    file the reader does not have. `service-worker.ts` refuses a cache miss
	    instead of fetching it, `corpus.ts` throws on the non-ok response, and
	    the route's `load` gives up. Sending that reader to "Nothing at this
	    address" would be a lie about their own library — the text exists, it is
	    simply not here — and the fix is one switch away, which is why
	    `NotDownloaded` carries the switch.

	  - A 500 with offline mode OFF is a request that failed while online, and
	    it used to fall through to `NotFound`. That was the same lie with the
	    remedy removed: a dropped fetch of an index or a content file told the
	    reader their address does not exist, and `NotFound` is built to send
	    them somewhere else — away from a page that was one retry from working.
	    A torn dev reload does it, a flaky connection does it, and until
	    `retryable-once.ts` a single failed index fetch did it to EVERY address
	    in a work type at once, permanently, because the rejected primer promise
	    was memoised. `LoadFailed` says what happened and offers the retry.

	The two 500 branches deliberately do not try to tell a network failure from
	a bug: the reader's next move is the same either way, and the retry is
	cheap. What separates them is the switch, because only one of them has a
	remedy the reader controls.
-->
<script lang="ts">
	import { page } from '$app/state';
	import NotFound from '$lib/components/NotFound.svelte';
	import NotDownloaded from '$lib/components/NotDownloaded.svelte';
	import LoadFailed from '$lib/components/LoadFailed.svelte';
	import { errorView } from '$lib/error-view';
	import { offline } from '$lib/offline.svelte';

	const view = $derived(errorView(page.status, offline.enabled));
</script>

{#if view === 'not-downloaded'}
	<NotDownloaded />
{:else if view === 'load-failed'}
	<LoadFailed />
{:else}
	<NotFound />
{/if}
