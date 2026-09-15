<script lang="ts">
	import {
		ItemMetadataCollection,
		ItemMetadataDefinitionsCollection,
	} from "$lib/collections/def.svelte";
	import { ItemActions, ItemContent, ItemTitle } from "$lib/components/ui/item";
	import Item from "$lib/components/ui/item/item.svelte";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";

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

{#if metadata_query.data.length > 0 && item}
	<div class="flex flex-col gap-2 py-2">
		<div class="flex h-8 flex-row items-center justify-between gap-1.5 px-4 pr-2">
			<p class="text-sm font-medium">Item Metadata (Read Only)</p>
		</div>

		<div class="flex flex-col gap-1 px-4 pr-2 pb-2">
			{#each metadata_query.data as metadata (metadata.id)}
				<Item class="h-7 p-0">
					<ItemContent>
						<ItemTitle class="text-sm font-normal text-muted-foreground"
							>{metadata.definition.name}</ItemTitle
						>
					</ItemContent>

					<ItemActions>
						<p>
							{metadata.value_string}
						</p>
					</ItemActions>
				</Item>
			{/each}
		</div>
	</div>
{/if}
