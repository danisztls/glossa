<script lang="ts">
	import LegacyPage from '../../../compendium/[n]/+page.svelte';
	import type { CompendiumQuestionByLang } from '../../../compendium/[n]/+page';

	type LegacyData = { n: number; byLang: Partial<Record<string, CompendiumQuestionByLang>> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
