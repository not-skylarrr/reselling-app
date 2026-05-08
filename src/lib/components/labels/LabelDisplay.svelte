<script lang="ts">
	import { LabelsCollection } from "$lib/collections/def.svelte";
	import { inArray, useLiveQuery } from "@tanstack/svelte-db";
	import LabelMarkers from "./LabelMarkers.svelte";
	import { LucideCircle, LucideLoader } from "@lucide/svelte";

	type Props = {
		label_ids: string[];
	};

	let { label_ids }: Props = $props();

	const labels_query = useLiveQuery(
		(q) =>
			q.from({ label: LabelsCollection }).where(({ label }) => inArray(label.id, label_ids)),
		[() => label_ids],
	);
</script>

{#if labels_query.isLoading}
	<div class="flex flex-row gap-2">
		<LucideLoader class="size-3 animate-spin" />
		<p class="text-sm text-muted-foreground">Loading</p>
	</div>
{:else if labels_query.data.length == 0}
	<div class="flex flex-row items-center gap-2">
		<p class="text-sm text-muted-foreground">No Labels</p>
	</div>
{:else}
	<div class="flex flex-row items-center gap-2">
		<LabelMarkers labels={labels_query.data} />

		{#if labels_query.data.length == 1}
			<p class="text-sm">
				{labels_query.data[0].content}
			</p>
		{:else}
			<p class="text-sm">
				{labels_query.data.length} Labels
			</p>
		{/if}
	</div>
{/if}
