<script lang="ts" module>
	const column = createColumnHelper<FullItem>();

	const ItemAnalyticsTableColumns = [
		column.accessor("name", {
			header: "Name",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
				filter: StringFilter({
					name: "Name",
					icon: {
						component: LucideTextCursor,
					},
				}),
			},
			minSize: 180,
			filterFn: AdvancedFilter,
		}),
		column.accessor("status", {
			header: "Status",
			cell: (info) => renderComponent(CellStatus, { value: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 180,
		}),
		column.accessor("labels", {
			header: "Labels",
			cell: (info) => renderComponent(CellLabels, { labels: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 180,
		}),
		column.accessor("purchase_price", {
			header: "Cost",
			cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
			minSize: 160,
		}),
	];

	const DefaultColVisibility: VisibilityState = {
		name: true,
	};
</script>

<script lang="ts">
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { CellCurrency, CellLabels } from "$lib/components/items/table/components/cells";
	import CellStatus from "$lib/components/items/table/components/cells/CellStatus.svelte";
	import TableFilterDisplay from "$lib/components/items/table/components/TableFilterDisplay.svelte";
	import TableFilterDropdown from "$lib/components/items/table/components/TableFilterDropdown.svelte";
	import { ItemTableColumns } from "$lib/components/items/table/def";
	import { AdvancedFilter } from "$lib/components/items/table/lib/filters";
	import { StringFilter } from "$lib/components/items/table/lib/filters/lib/functions";
	import { TableBase } from "$lib/components/table";
	import { CalculateTotalFees, GetItemSalePrice } from "$lib/items/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideTextCursor } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		type VisibilityState,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "inventory-analytics",
		default_column_visibility: DefaultColVisibility,
		column_visibility: {
			storage_location: false,
			marketplaces: false,
		},
	});

	const items_query = useLiveQuery(ItemsWithAllMetaCollection);

	const table = createTable<FullItem>({
		columns: ItemTableColumns,
		get data() {
			return items_query.data;
		},
		...DefaultTableProps(table_state),
	});

	const visible_rows = $derived(table.getFilteredRowModel().rows);
	const visible_filters = $derived(table_state.GetVisibleFilters());

	const item_stats = $derived.by(() => {
		let total_items = 0;
		let total_purchase_cost = 0;
		let total_fee_cost = 0;
		let total_profit = 0;

		let use_selection = Object.keys(table_state.row_selection).length > 0;

		for (const row of visible_rows) {
			if (use_selection) {
				if (!table_state.row_selection[row.id]) continue;
			}

			const item = row.original;

			let item_fees = CalculateTotalFees(item.fees);
			let sale_price = GetItemSalePrice(item.listings);

			total_items += 1;

			total_purchase_cost += item.purchase_price;
			total_fee_cost += item_fees;

			total_profit += sale_price - item.purchase_price - item_fees;
		}

		return {
			count: total_items,
			purchase_cost: total_purchase_cost,
			fee_cost: total_fee_cost,
			profit: total_profit,
		};
	});

	SetTableContext(table_state);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "link", text: "Analytics", href: "/dashboard/analytics" },
			{ type: "page", text: "Inventory" },
		]}
	>
		{#snippet actions()}
			<TableFilterDropdown {table} {table_state} />
		{/snippet}
	</DashboardHeader>

	<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0" disableScroll>
		<div
			class="grid grid-cols-2 gap-0 border-b p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
		>
			<div class="flex flex-col justify-center p-6">
				<p class="text-2xl font-medium">{item_stats.count}</p>
				<p class="text-sm text-muted-foreground">Items Tracked</p>
			</div>
			<div class="flex flex-col justify-center p-6">
				<p class="text-2xl font-medium">{FormatCurrency(item_stats.purchase_cost)}</p>
				<p class="text-sm text-muted-foreground">Spent on Items</p>
			</div>
			<div class="flex flex-col justify-center p-6">
				<p class="text-2xl font-medium">{FormatCurrency(item_stats.fee_cost)}</p>
				<p class="text-sm text-muted-foreground">Spent on Fees</p>
			</div>
			<div class="flex flex-col justify-center p-6">
				<p class="text-2xl font-medium">{FormatCurrency(item_stats.profit)}</p>
				<p class="text-sm text-muted-foreground">Current Profit</p>
			</div>
		</div>

		{#if visible_filters.length > 0}
			<div class="flex min-h-8 flex-row gap-3 border-b px-3 py-2">
				<TableFilterDisplay bind:filters={table_state.filters} {table} />
			</div>
		{/if}

		<TableBase getRowId={(item) => item.id} {table} />
	</DashboardContent>
</DashboardLayoutRoot>
