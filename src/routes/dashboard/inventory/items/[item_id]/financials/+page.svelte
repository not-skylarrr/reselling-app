<script lang="ts">
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
		ItemFeesCollection,
		LocationsCollection,
	} from "$lib/collections/def.svelte.js";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte.js";
	import ItemFeesPage from "$lib/components/items/item-page/pages/ItemFeesPage.svelte";
	import ItemListingsPage from "$lib/components/items/item-page/pages/ItemListingsPage.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Empty,
		EmptyContent,
		EmptyDescription,
		EmptyHeader,
		EmptyMedia,
		EmptyTitle,
	} from "$lib/components/ui/empty/index.js";
	import { ItemIsOrPassedStatus } from "$lib/items/utils.js";
	import type { WorkspaceLabel } from "$lib/server/db/schema.js";
	import { LucideCheck, LucideChevronRight, LucideInbox, LucideX } from "@lucide/svelte";
	import { eq, toArray, useLiveQuery, not, isUndefined } from "@tanstack/svelte-db";

	let { data } = $props();

	const item_query = useLiveQuery(
		(q) =>
			q
				.from({ item: ItemsCollection })
				.orderBy(({ item }) => item.status_int, "desc")
				.orderBy(({ item }) => item.added_at, "desc")
				.leftJoin({ location: LocationsCollection }, ({ location, item }) =>
					eq(item.storage_location, location.id),
				)
				.select(({ item, location }) => ({
					...item,
					location: location,
					labels: toArray(
						q
							.from({ label_join: LabelJoinsCollection })
							.where(({ label_join }) => eq(label_join.subject_id, item.id))
							.leftJoin({ label: LabelsCollection }, ({ label_join, label }) =>
								eq(label.id, label_join.label_id),
							)
							.where(({ label }) => not(isUndefined(label)))
							.fn.select(({ label }): WorkspaceLabel => {
								return label as WorkspaceLabel;
							}),
					),
					listings: toArray(
						q
							.from({ listing: ListingsCollection })
							.where(({ listing }) => eq(item.id, listing.item_id)),
					),
					fees: toArray(
						q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(item.id, fee.item_id)),
					),
				}))
				.where(({ item }) => eq(item.id, data.item.id))
				.findOne(),
		[() => data.item],
	);

	let item = $derived(item_query.data ?? data.item);
</script>

{#if item.fees.length > 0}
	<ItemFeesPage {item} />
{:else}
	<Empty>
		<EmptyHeader>
			<EmptyMedia variant="icon">
				<LucideX />
			</EmptyMedia>

			<EmptyTitle>Nothing to display</EmptyTitle>
			<EmptyDescription>This item has no fees attached</EmptyDescription>
		</EmptyHeader>
	</Empty>
{/if}
