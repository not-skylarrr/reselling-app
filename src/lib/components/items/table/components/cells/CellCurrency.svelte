<script lang="ts">
	import { cn } from "$lib/utils";
	import { FormatCurrency } from "$lib/utils/formatting";

	type Props = {
		partial?: boolean;
		richColours?: boolean;
		value: number | null;
	};

	let { partial = false, richColours, value }: Props = $props();
</script>

<p
	class={cn(
		"text-sm",
		value == null && "text-muted-foreground",
		partial == true && "text-muted-foreground",
		richColours && value != null && value > 0 && "text-green-600 dark:text-green-400",
		richColours && value != null && value < 0 && "text-destructive",
		richColours && value != null && value == 0 && "text-muted-foreground",
	)}
>
	{#if richColours && value != null && value > 0}
		{"+"}
	{/if}
	{#if value != null}
		{`${partial ? "*" : ""}${FormatCurrency(value)}`}
	{:else}
		{"-"}
	{/if}
</p>
