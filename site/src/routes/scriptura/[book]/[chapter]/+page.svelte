<script lang="ts">
	import LegacyPage from '../../../bible/[book]/[chapter]/+page.svelte';
	import type { BibleEditionData } from '../../../bible/[book]/[chapter]/+page';

	type LegacyData = { osis: string; chapterN: number; byWorkId: Record<string, BibleEditionData> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
