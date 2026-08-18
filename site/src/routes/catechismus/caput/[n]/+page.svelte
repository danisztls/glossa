<script lang="ts">
	import LegacyPage from '../../../ccc/chapter/[n]/+page.svelte';
	import type { CccChapterLangData } from '../../../ccc/chapter/[n]/+page';

	type LegacyData = { n: number; byLang: Partial<Record<string, CccChapterLangData>> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
