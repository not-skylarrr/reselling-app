<script lang="ts">
	import { FormatCurrency } from "$lib/utils/formatting";

	type Props = {
		value: number | readonly [number, number] | null;
	};

	let { value }: Props = $props();
</script>

{#if value != null}
	<p class="text-sms">
		{#if Array.isArray(value)}
			{FormatCurrency(value[0])} - {FormatCurrency(value[1])}
		{:else}
			{FormatCurrency(value as number)}
		{/if}
	</p>
{:else}
	<p class="text-sm text-muted-foreground">-</p>
{/if}
