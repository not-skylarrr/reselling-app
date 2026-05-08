<script lang="ts">
	import { LabelsCollection } from "$lib/collections/def.svelte";
	import LabelMarkers from "$lib/components/labels/LabelMarkers.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import type { WorkspaceLabel } from "$lib/server/db/schema";
	import { inArray, useLiveQuery } from "@tanstack/svelte-db";

	type Props = {
		labels: WorkspaceLabel[];
	};

	let { labels }: Props = $props();
</script>

{#if labels.length > 0}
	<ScrollArea class="overflow-hidden" orientation="horizontal">
		<div class="flex flex-row gap-2">
			{#each labels as label (label.id)}
				<Badge class="bg-background" variant="outline">
					<LabelMarkers labels={[label]} />
					<p>{label.content}</p>
				</Badge>
			{/each}
		</div>
	</ScrollArea>
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
