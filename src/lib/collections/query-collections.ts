import {
	ItemFeesCollection,
	ItemsCollection,
	LabelJoinsCollection,
	LabelsCollection,
	ListingsCollection,
} from "$lib/collections/def.svelte";
import type { WorkspaceLabel } from "$lib/server/db/schema";
import {
	eq,
	toArray,
	sum,
	createCollection,
	liveQueryCollectionOptions,
	type InferCollectionType,
	not,
	isNull,
	isUndefined,
} from "@tanstack/svelte-db";

export const inventory_items_collection = createCollection(
	liveQueryCollectionOptions({
		query: (q) =>
			q
				.from({ item: ItemsCollection })
				.orderBy(({ item }) => item.status_int, "desc")
				.orderBy(({ item }) => item.added_at, "desc")
				.select(({ item }) => ({
					...item,
					labels: toArray(
						q
							.from({ label_join: LabelJoinsCollection })
							.where(({ label_join }) => eq(label_join.item_id, item.id))
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
				})),
	}),
);

export type InventoryItemData = InferCollectionType<typeof inventory_items_collection>;
