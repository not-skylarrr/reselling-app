import { eq, queryOnce } from "@tanstack/svelte-db";
import type { PageLoad } from "./$types";
import { BundleItemsCollection, BundlesCollection } from "$lib/collections/def.svelte";
import { error } from "@sveltejs/kit";

export const load: PageLoad = async ({ params }) => {
	const bundle_item = await queryOnce((q) =>
		q
			.from({ bundle_item: BundleItemsCollection })
			.where(({ bundle_item }) => eq(bundle_item.id, params.item_id))
			.innerJoin({ bundle: BundlesCollection }, ({ bundle, bundle_item }) =>
				eq(bundle.id, bundle_item.bundle_id),
			)
			.findOne(),
	);

	if (!bundle_item)
		throw error(404, {
			message: "The item you are looking for cannot be found",
		});

	return bundle_item;
};
