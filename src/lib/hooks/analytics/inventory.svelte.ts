import {
	ItemsCollection,
	LabelJoinsCollection,
	LabelsCollection,
} from "$lib/collections/def.svelte";
import type { WorkspaceLabel } from "$lib/server/db/schema";
import { count, eq, inArray, useLiveQuery } from "@tanstack/svelte-db";

type InventoryItemsData =
	| {
			type: "unassigned";
			total: number;
	  }
	| {
			type: "label-item";
			label: WorkspaceLabel;
			total: number;
	  };

export function useItemTypeAnalytics() {
	const item_count_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => inArray(items.status, ["unlisted", "listed"]))
			.select(({ items }) => ({
				total: count(items.id),
			})),
	);

	const total_items = $derived(
		item_count_query.data.length > 0 ? item_count_query.data[0].total : 0,
	);

	const label_counts_query = useLiveQuery((q) =>
		q
			.from({ label_join: LabelJoinsCollection })
			.groupBy(({ label_join }) => label_join.label_id)
			.innerJoin({ item: ItemsCollection }, ({ item, label_join }) =>
				eq(item.id, label_join.subject_id),
			)
			.where(({ item }) => inArray(item.status, ["unlisted", "listed"]))
			.select(({ label_join }) => ({
				label_id: label_join.label_id,
				total: count(label_join.label_id),
			}))
			.orderBy(({ $selected }) => $selected.total, "asc"),
	);

	const labels_query = useLiveQuery((q) => q.from({ labels: LabelsCollection }));

	const label_data = $derived.by(() => {
		const data: InventoryItemsData[] = [];

		let total_assigned = 0;

		for (const { label_id, total } of label_counts_query.data) {
			const label = labels_query.data.find((l) => l.id == label_id);
			if (!label) continue;

			total_assigned += total;

			data.push({ type: "label-item", label: label, total: total });
		}

		if (total_items - total_assigned > 0) {
			data.push({ type: "unassigned", total: total_items - total_assigned });
		}

		return data.sort((a, b) => b.total - a.total);
	});

	return {
		get total_items() {
			return total_items;
		},
		get item_type_data() {
			return label_data;
		},
	};
}
