<script lang="ts">
	// Kept as an explicit, linkable not-found route. Invalid deep links reach
	// the same UI through +error.svelte, with the edge worker preserving their
	// HTTP 404 status before the SPA starts.
	import NotFound from '$lib/components/NotFound.svelte';
</script>

<NotFound />
