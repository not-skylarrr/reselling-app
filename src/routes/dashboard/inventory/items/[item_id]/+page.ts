import { eq, isUndefined, not, queryOnce, toArray } from "@tanstack/svelte-db";
import type { PageLoad } from "./$types";
import {
	ItemFeesCollection,
	ItemsCollection,
	LabelJoinsCollection,
	LabelsCollection,
	ListingsCollection,
} from "$lib/collections/def.svelte";
import { error } from "@sveltejs/kit";
import type { WorkspaceLabel } from "$lib/server/db/schema";
import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";

export const load: PageLoad = async ({ params }) => {
	const item = await queryOnce((q) =>
		q
			.from({ item: ItemsWithAllMetaCollection })
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
