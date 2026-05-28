import { eq, isUndefined, not, queryOnce, toArray } from "@tanstack/svelte-db";
import type { PageLoad } from "./$types";
import { error } from "@sveltejs/kit";
import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
import {
	ItemsCollection,
	LabelJoinsCollection,
	LabelsCollection,
	ListingsCollection,
	ItemFeesCollection,
	LocationsCollection,
} from "$lib/collections/def.svelte";
import type { WorkspaceLabel } from "$lib/server/db/schema";

export const load: PageLoad = async ({ params }) => {
	const item = await queryOnce((q) =>
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
			.where(({ item }) => eq(item.id, params.item_id))
			.findOne(),
	);

	if (!item)
		throw error(404, {
			message: "The item you are looking for cannot be found.",
		});

	return { item };
};

export const ssr = false;
