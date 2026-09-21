<script lang="ts">
	import { cn } from "$lib/utils";
	import { LucideArchive } from "@lucide/svelte";

	type Props = {
		archived?: boolean;
		value: string;
	};

	let { archived = false, value }: Props = $props();
</script>

<div class={cn("flex flex-row items-center gap-2", archived && "text-muted-foreground")}>
	<p>{value}</p>

	{#if archived}
		<LucideArchive class="size-3.5" />
	{/if}
</div>
