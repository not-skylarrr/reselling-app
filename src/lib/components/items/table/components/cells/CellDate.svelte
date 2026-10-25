<script lang="ts">
	import { cn } from "$lib/utils";
	import { FormatDateStd } from "$lib/utils/formatting";

	type Props = {
		showFullMonth?: boolean;
		value: Date | null | undefined;
	};

	let { showFullMonth = false, value }: Props = $props();

	const is_current_year = $derived(isSameYear(value, new Date()));
</script>

{#if value}
	<p class="text-sm">{FormatDateStd(value, showFullMonth)}</p>
{:else}
	<p class="text-sm text-muted-foreground">-</p>
{/if}
