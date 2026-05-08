import type { BundleTableData } from "../../../../../routes/dashboard/bundles/+page.svelte";

export function GetBundleCompletionStats(bundle_data: BundleTableData) {
	let item_count = bundle_data.items.length;
	let completion_count = 0;

	const header_items: Set<string> = new Set();

	if (bundle_data.items.length == 0)
		return {
			total_item_count: 0,
			completion_count: 0,
			completion_perc: 0,
		};

	for (const item of bundle_data.items) {
		let entry_has_inv_item = false;

		if (item.parent_id) {
			header_items.add(item.parent_id);
		}

		for (const association of item.associations) {
			if (association.item) {
				entry_has_inv_item = true;
				break;
			}
		}

		if (entry_has_inv_item) {
			completion_count += 1;
		}
	}

	item_count = item_count - header_items.size;

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
