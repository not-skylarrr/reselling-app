import { and, eq, inArray, queryOnce, toArray } from "@tanstack/svelte-db";
import type { PageLoad } from "./$types";
import {
	BundleItemsCollection,
	BundlesCollection,
	ItemAssociationsCollection,
	ItemsCollection,
} from "$lib/collections/def.svelte";
import { error } from "@sveltejs/kit";

export const load: PageLoad = async ({ params }) => {
	const bundle = await queryOnce((q) =>
		q
			.from({ bundle: BundlesCollection })
			.where(({ bundle }) => eq(bundle.id, params.bundle_id))
			.select(({ bundle }) => ({
				...bundle,
				items: toArray(
					q
						.from({ bundle_item: BundleItemsCollection })
						.where(({ bundle_item }) => eq(bundle.id, bundle_item.bundle_id))
						.select(({ bundle_item }) => ({
							...bundle_item,
							associations: toArray(
								q
									.from({ association: ItemAssociationsCollection })
									.where(({ association }) =>
										and(
											eq(association.subject_id, bundle_item.id),
											eq(association.type, "bundle-item"),
										),
									)
									.select(({ association }) => ({
										...association,
										linked_items: toArray(
											q
												.from({ item: ItemsCollection })
												.where(({ item }) =>
													and(
														eq(association.item_id, item.id),
														inArray(item.status, ["unlisted", "listed"]),
													),
												),
										),
									})),
							),
						})),
				),
			}))
			.findOne(),
	);

	if (!bundle)
		throw error(404, {
			message: "The bundle you are looking for cannot be found",
		});

	return { bundle };
};

export const ssr = false;
