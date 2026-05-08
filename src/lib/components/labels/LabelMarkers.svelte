<script lang="ts">
	import type { WorkspaceLabel } from "$lib/server/db/schema";
	import { mode } from "mode-watcher";
	import { GetAwareColour } from "../ui/colour-picker/lib/utils";
	import { LucideCircle } from "@lucide/svelte";

	type Props = {
		labels: WorkspaceLabel[];
	};

	let { labels }: Props = $props();
</script>

<div class="flex flex-row -space-x-1.5">
	{#each labels as label, index (label.id)}
		<LucideCircle
			class="size-3.5 stroke-2"
			style="stroke: var(--background); fill: {GetAwareColour(
				label.colour,
				mode.current,
			)}; z-index: {index}"
		/>
	{/each}
</div>
