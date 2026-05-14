import type { BundleItem } from "$lib/server/db/schema";
import type ArrowUp_0_1 from "@lucide/svelte/icons/arrow-up-0-1";
import type { BundleTableData } from "../../../../../routes/dashboard/bundles/+page.svelte";

export function GetBundleCompletionStats(bundle_data: BundleTableData) {
	let item_count = bundle_data.items.length;

	if (bundle_data.items.length == 0)
		return {
			total_item_count: 0,
			completion_count: 0,
			completion_perc: 0,
		};

	const parent_map = new Map<string, string[]>();
	const completed_items = new Set<string>();

	for (const item of bundle_data.items) {
		if (item.parent_id) {
			if (parent_map.has(item.parent_id)) {
				parent_map.get(item.parent_id)!.push(item.id);
			} else {
				parent_map.set(item.parent_id, [item.id]);
			}
		}
	}

	item_count = item_count - parent_map.size;

	for (const item of bundle_data.items) {
		let is_parent_item = parent_map.has(item.id);

		const has_stock =
			item.associations.filter((a) => a.item && a.item.status_int < 2).length > 0;

		if (has_stock) {
			if (is_parent_item) {
				for (const sub_item_id of parent_map.get(item.id)!) {
					completed_items.add(sub_item_id);
				}
			} else {
				completed_items.add(item.id);
			}
		}
	}

	const completion_count = completed_items.size;

	return {
		total_item_count: item_count,
		completion_count: completion_count,
		completion_perc: Math.floor((completion_count / item_count) * 100),
	};
}

export function IsBundleItemNeeded(item: BundleTableData["items"][number]) {
	if (item.associations.length == 0) return true;

	for (const association of item.associations) {
		if (association.item) return false;
	}

	return true;
}

export function GetBundleItemInventoryCount(item: BundleTableData["items"][number]) {
	let total = 0;

	if (item.associations.length == 0) return total;

	for (const association of item.associations) {
		if (association.item != undefined) {
			total += 1;
		}
	}

	return total;
}
