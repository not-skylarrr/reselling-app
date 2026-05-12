import { createColumnHelper, type VisibilityState } from "@tanstack/svelte-table";
import { type BundleTableData } from "../../../../routes/dashboard/bundles/+page.svelte";
import { GetBundleCompletionStats } from "./lib/utils";
import { StringFilter } from "$lib/components/items/table/lib/filters/lib/functions";
import { LucideTextCursor } from "@lucide/svelte";
import { AdvancedFilter } from "$lib/components/items/table/lib/filters";

const column = createColumnHelper<BundleTableData>();

export const BundleTableColumns = [
	column.accessor("name", {
		header: "Name",
		cell: (info) => info.getValue(),
		meta: {
			align: "left",
			flex: true,
			filter: StringFilter({
				name: "Name",
				icon: {
					component: LucideTextCursor,
				},
			}),
		},
		minSize: 360,
		filterFn: AdvancedFilter,
	}),
	column.accessor((row) => GetBundleCompletionStats(row).total_item_count, {
		id: "item-count",
		header: "Items Count",
		cell: (info) => info.getValue(),
		meta: {
			align: "left",
		},
		minSize: 160,
	}),
	column.accessor((row) => GetBundleCompletionStats(row).completion_perc, {
		id: "completion",
		header: "Completion",
		cell: (info) => `${info.getValue()}%`,
		meta: {
			align: "left",
		},
		minSize: 160,
	}),
];

export const BundleTableDefaultColumnVis: VisibilityState = {
	name: true,
	"item-count": true,
	completion: true,
};
