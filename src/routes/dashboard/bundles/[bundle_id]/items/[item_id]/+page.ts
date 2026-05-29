import { eq, and, queryOnce, toArray, not, isUndefined, lt } from "@tanstack/svelte-db";
import type { PageLoad } from "./$types";
import {
	BundleItemsCollection,
	BundlesCollection,
	ItemAssociationsCollection,
	ItemsCollection,
} from "$lib/collections/def.svelte";
import { error } from "@sveltejs/kit";
import type { BundleItem, Item, ItemBundle } from "$lib/server/db/schema";

export type BundleItemData = BundleItem & {
	bundle: ItemBundle;
	instances: Item[];
};

export const load: PageLoad = async ({ params }) => {
	const bundle_item = await queryOnce((q) =>
		q
			.from({ bundle_item: BundleItemsCollection })
			.where(({ bundle_item }) => eq(bundle_item.id, params.item_id))
			.innerJoin({ bundle: BundlesCollection }, ({ bundle, bundle_item }) =>
				eq(bundle.id, bundle_item.bundle_id),
			)
			.select(({ bundle_item, bundle }) => ({
				...bundle_item,
				bundle: bundle,
				instances: toArray(
					q
						.from({ item_join: ItemAssociationsCollection })
						.where(({ item_join }) =>
							and(eq(item_join.type, "bundle-item"), eq(item_join.subject_id, bundle_item.id)),
						)
						.innerJoin({ item: ItemsCollection }, ({ item_join, item }) =>
							eq(item.id, item_join.item_id),
						)
						.where(({ item }) => and(not(isUndefined(item.id)), lt(item.status_int, 2)))
						.select(({ item }) => item),
				),
			}))
			.findOne(),
	);

	if (!bundle_item)
		throw error(404, {
			message: "The item you are looking for cannot be found",
		});

	return { bundle_item: bundle_item };
};
