<script lang="ts">
	import LabelMarkers from "$lib/components/labels/LabelMarkers.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import type { WorkspaceLabel } from "$lib/server/db/schema";

	type Props = {
		labels: WorkspaceLabel[];
	};

	let { labels }: Props = $props();
</script>

{#if labels.length > 0}
	<div class="flex flex-row gap-2 overflow-hidden">
		{#each labels as label (label.id)}
			<Badge class="bg-background" variant="outline">
				<LabelMarkers labels={[label]} />
				<p>{label.content}</p>
			</Badge>
		{/each}
	</div>
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
