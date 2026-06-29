<script lang="ts">
	import {
		ItemFeesCollection,
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { useItemTypeAnalytics } from "$lib/hooks/analytics/inventory.svelte";
	import type { WorkspaceLabel } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { and, count, eq, inArray, sum, useLiveQuery } from "@tanstack/svelte-db";

	const analytics = useItemTypeAnalytics();

	const most_popular_label = $derived.by(() => {
		const highest_count = [...analytics.item_type_data].at(0);
		if (!highest_count) return null;

		if (highest_count.type == "unassigned")
			return { label_name: "Unknown", count: highest_count.total };

		return { label_name: highest_count.label.content, count: highest_count.total };
	});
</script>

{#if most_popular_label}
	<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
		<p class="text-sm text-muted-foreground">Most Common Item Type</p>
		<p class="text-3xl font-medium">
			{most_popular_label.label_name}
		</p>
		<p class="text-xs text-muted-foreground">
			Total of {most_popular_label.count} items in storage
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
		<p class="text-sm text-muted-foreground">Most Common Item Type</p>
		<p class="text-3xl font-medium">N/A</p>
		<p class="text-xs text-muted-foreground">Assign item labels to track item types</p>
	</div>
{/if}
