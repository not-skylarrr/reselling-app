import {
	createCollection,
	createLiveQueryCollection,
	eq,
	isUndefined,
	liveQueryCollectionOptions,
	not,
	toArray,
} from "@tanstack/svelte-db";
import {
	ItemFeesCollection,
	ItemsCollection,
	LabelJoinsCollection,
	LabelsCollection,
	ListingsCollection,
	LocationsCollection,
} from "../def.svelte";
import type { WorkspaceLabel } from "$lib/server/db/schema";

export const ItemsWithLabelsCollection = createLiveQueryCollection((q) =>
	q.from({ item: ItemsCollection }).select(({ item }) => ({
		...item,
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
	})),
);

export const ItemsWithAllMetaCollection = createCollection(
	liveQueryCollectionOptions({
		query: (q) => {
			return q
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
				}));
		},
	}),
);
