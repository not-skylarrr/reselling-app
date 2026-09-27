<script lang="ts">
	import {
		BundleItemsCollection,
		BundlesCollection,
		ItemAssociationsCollection,
	} from "$lib/collections/def.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Item, ItemContent, ItemDescription, ItemTitle } from "$lib/components/ui/item";
	import ItemActions from "$lib/components/ui/item/item-actions.svelte";
	import type { Item as DbItem } from "$lib/server/db/schema";
	import { LucideInbox, LucidePlus } from "@lucide/svelte";
	import { eq, and, useLiveQuery, toArray } from "@tanstack/svelte-db";

	type Props = {
		item: DbItem;
	};

	let { item }: Props = $props();

	let item_id = $derived(item?.id ?? "");

	let associations_query = useLiveQuery(
		(q) =>
			q
				.from({ association: ItemAssociationsCollection })
				.where(({ association }) =>
					and(eq(association.item_id, item_id), eq(association.type, "bundle-item")),
				)
				.select(({ association }) => ({
					...association,
					bundle_items: toArray(
						q
							.from({ bundle_item: BundleItemsCollection })
							.where(({ bundle_item }) => eq(association.subject_id, bundle_item.id))
							.leftJoin({ bundle: BundlesCollection }, ({ bundle_item, bundle }) =>
								eq(bundle.id, bundle_item.bundle_id),
							)
							.select(({ bundle_item, bundle }) => ({
								...bundle_item,
								bundle: bundle,
							})),
					),
				})),
		[() => item_id],
	);

	$inspect(associations_query.data);
</script>

<div class="flex flex-col gap-2 py-2">
	<div class="flex h-8 flex-row items-center justify-between gap-1.5 px-4 pr-2">
		<p class="text-sm font-medium">Bundle Associations</p>

		<div class="flex flex-row gap-2">
			<Button onclick={() => OpenItemDialog(item, "link")} size="icon-sm" variant="ghost"
				><LucidePlus /></Button
			>
		</div>
	</div>

	{#if associations_query.data.length == 0}
		<div class="flex flex-col items-center justify-center gap-4 px-4 py-6">
			<LucideInbox class="size-8 stroke-muted-foreground stroke-1" />
			<p class="text-xs text-pretty text-muted-foreground">
				This item is not associated to any bundles
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each associations_query.data as association (association.id)}
				{@const bundle_item = association.bundle_items[0]}

				{#if bundle_item}
					{@const bundle = bundle_item.bundle}

					<Item class="py-0">
						<ItemContent>
							<ItemTitle>{bundle_item.name}</ItemTitle>
							<ItemDescription class="text-xs">{bundle?.name}</ItemDescription>
						</ItemContent>

						<ItemActions>
							<Button href={`/dashboard/bundles/${bundle?.id}`} size="xs" variant="ghost"
								>View Bundle</Button
							>
						</ItemActions>
					</Item>
				{/if}
			{/each}
		</div>
	{/if}
</div>
