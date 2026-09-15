<script lang="ts">
	import {
		ItemMetadataCollection,
		ItemMetadataDefinitionsCollection,
	} from "$lib/collections/def.svelte";
	import { ItemActions, ItemContent, ItemTitle } from "$lib/components/ui/item";
	import Item from "$lib/components/ui/item/item.svelte";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import MetadataSidebarEntry from "../../item-metadata/MetadataSidebarEntry.svelte";
	import AddMetadataDropdown from "../../item-metadata/AddMetadataDropdown.svelte";
	import { LucideInbox } from "@lucide/svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	const metadata_query = useLiveQuery(
		(q) =>
			q
				.from({ metadata: ItemMetadataCollection })
				.where(({ metadata }) => eq(metadata.item_id, item.id))
				.innerJoin(
					{ definition: ItemMetadataDefinitionsCollection },
					({ metadata, definition }) => eq(metadata.metadata_id, definition.id),
				)
				.select(({ definition, metadata }) => ({
					...metadata,
					definition: definition,
				})),
		[() => item],
	);
</script>

{#if item && metadata_query.isReady}
	<div class="flex flex-col gap-2 py-2">
		<div class="flex h-8 flex-row items-center justify-between gap-1.5 px-4 pr-2">
			<p class="text-sm font-medium">Additional Metadata</p>

			<AddMetadataDropdown
				{item}
				used_meta_ids={metadata_query.data.map((meta) => meta.definition.id)}
			/>
		</div>

		<div class="flex flex-col gap-1 px-4 pr-2 pb-2">
			{#each metadata_query.data as metadata (metadata.id)}
				<MetadataSidebarEntry {metadata} />
			{/each}

			{#if metadata_query.data.length == 0}
				<div class="flex flex-col items-center justify-center gap-3 py-6">
					<LucideInbox class="size-8 stroke-1 text-muted-foreground" />
					<p class="text-xs text-muted-foreground">No Additional Metadata</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
