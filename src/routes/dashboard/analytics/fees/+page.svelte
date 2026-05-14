<script lang="ts" module>
	type FeeData = {
		fee: ItemFee;
		item: Item;
	};

	const column = createColumnHelper<FeeData>();

	const FeeTableColumns = [
		column.accessor("item.name", {
			id: "item.name",
			header: "Item Name",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
				filter: StringFilter({
					name: "Item Name",
					icon: {
						component: LucideTextCursor,
					},
				}),
			},
			minSize: 160,
			filterFn: AdvancedFilter,
		}),
		column.accessor("fee.type", {
			id: "fee.type",
			header: "Fee Type",
			cell: (info) => GetFeeTypeFriendlyName(info.getValue()),
			meta: {
				align: "left",
				filter: OptionFilter({
					name: "Fee Type",
					icon: {
						component: LucideReceipt,
					},
					options: Object.entries(FeeTypeFriendlyNames).map(([value, label]) => ({
						label,
						value,
					})),
					getKey: (key: string) => key,
				}),
			},
			minSize: 160,
			filterFn: AdvancedFilter,
		}),
		column.accessor("fee.amount", {
			id: "fee.amount",
			header: "Amount",
			cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("fee.reference_details", {
			header: "Reference",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("fee.buyer_paid", {
			id: "fee.buyer_paid",
			header: "Buyer Paid",
			cell: (info) => (info.getValue() ? "Yes" : "No"),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("fee.created_at", {
			id: "fee.created_at",
			header: "Creation Date",
			cell: (info) => FormatDateStd(info.getValue(), true),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
	];

	const DefaultColumnVisibility: VisibilityState = {
		"fee.type": true,
		"item.name": true,
	};
</script>

<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";

	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import {
		OptionFilter,
		StringFilter,
	} from "$lib/components/items/table/lib/filters/lib/functions";
	import CellCurrency from "$lib/components/items/table/components/cells/CellCurrency.svelte";
	import { AdvancedFilter } from "$lib/components/items/table/lib/filters";
	import { TableBase } from "$lib/components/table";
	import { FeeTypeFriendlyNames, GetFeeTypeFriendlyName } from "$lib/fees/utils";
	import type { Item, ItemFee } from "$lib/server/db/schema";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { useLiveQuery, eq } from "@tanstack/svelte-db";
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		type VisibilityState,
	} from "@tanstack/svelte-table";
	import { LucidePanelRight, LucideReceipt, LucideTextCursor } from "@lucide/svelte";
	import TableFilterDropdown from "$lib/components/items/table/components/TableFilterDropdown.svelte";
	import TableFilterDisplay from "$lib/components/items/table/components/TableFilterDisplay.svelte";
	import { FormatCurrency, FormatDateStd } from "$lib/utils/formatting";
	import AnalyticsFeeSidebar from "$lib/components/analytics/fees/AnalyticsFeeSidebar.svelte";
	import Button from "$lib/components/ui/button/button.svelte";

	const table_state = new TableState({
		key: "fees-table",
		default_column_visibility: DefaultColumnVisibility,
	});

	const fees_query = useLiveQuery((q) =>
		q
			.from({ fee: ItemFeesCollection })
			.innerJoin({ item: ItemsCollection }, ({ fee, item }) => eq(fee.item_id, item.id)),
	);

	let focused_id = $state<string | null>(null);
	let show_details = $state(false);

	let focused_fee = $derived.by(() => {
		if (!focused_id) return undefined;

		const fee_data = fees_query.data.find(({ fee }) => fee.id == focused_id);

		return fee_data;
	});

	const table = createTable<FeeData>({
		columns: FeeTableColumns,
		get data() {
			return fees_query.data;
		},
		getRowId: (data) => data.fee.id,
		...DefaultTableProps(table_state),
	});

	const visible_rows = $derived(table.getFilteredRowModel().rows);

	const fee_stats = $derived.by(() => {
		let total_paid = 0;
		let total_listing_fees = 0;
		let total_final_fees = 0;
		let total_other_fees = 0;

		for (const row of visible_rows) {
			const { fee } = row.original;

			if (fee.buyer_paid == false && fee.removed == false) {
				total_paid += fee.amount;

				switch (fee.type) {
					case "listing_fee":
						total_listing_fees += fee.amount;
						break;

					case "final_fee":
						total_final_fees += fee.amount;
						break;

					default:
						total_other_fees += fee.amount;
						break;
				}
			}
		}

		return { total_paid, total_listing_fees, total_final_fees, total_other_fees };
	});

	function ToggleDetailsSidebar() {
		if (fees_query.data.length == 0) {
			show_details = false;
			return;
		}

		if (visible_rows.length > 0 && focused_fee == null) {
			if (show_details == false) {
				show_details = true;
			}

			table_state.focused_id = visible_rows[0].original.fee.id;
			return;
		}

		show_details = !show_details;
	}

	SetTableContext(table_state);
</script>

<div class="flex flex-1 flex-row overflow-hidden">
	<DashboardLayoutRoot>
		<DashboardHeader
			breadcrumbs={[
				{ type: "link", text: "Dashboard", href: "/dashboard" },
				{ type: "link", text: "Analytics", href: "/dashboard/analytics" },
				{ type: "page", text: "Fee Breakdown" },
			]}
		>
			{#snippet actions()}
				<TableFilterDropdown label="Filter Fees" {table} {table_state} />

				<Button onclick={ToggleDetailsSidebar} size="icon-sm" variant="outline">
					<LucidePanelRight />
				</Button>
			{/snippet}
		</DashboardHeader>

		<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0" disableScroll>
			<div
				class="grid grid-cols-2 gap-0 border-b p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
			>
				<div class="flex flex-col justify-center p-6">
					<p class="text-2xl font-medium">{FormatCurrency(fee_stats.total_paid)}</p>
					<p class="text-sm text-muted-foreground">Total Fees Paid</p>
				</div>

				<div class="flex flex-col justify-center p-6">
					<p class="text-2xl font-medium">{FormatCurrency(fee_stats.total_listing_fees)}</p>
					<p class="text-sm text-muted-foreground">Listing Fees</p>
				</div>

				<div class="flex flex-col justify-center p-6">
					<p class="text-2xl font-medium">{FormatCurrency(fee_stats.total_final_fees)}</p>
					<p class="text-sm text-muted-foreground">Final Fees</p>
				</div>
				<div class="flex flex-col justify-center p-6">
					<p class="text-2xl font-medium">{FormatCurrency(fee_stats.total_other_fees)}</p>
					<p class="text-sm text-muted-foreground">Refunds & Other</p>
				</div>
			</div>

			{#if table_state.filters.length > 0}
				<div class="flex min-h-8 flex-row gap-3 border-b px-3 py-2">
					<TableFilterDisplay bind:filters={table_state.filters} {table} />
				</div>
			{/if}

			<TableBase
				getRowId={(data) => data.fee.id}
				onRowFocus={({ fee }) => (focused_id = fee.id)}
				onRowDouble={() => (show_details = !show_details)}
				{table}
			/>
		</DashboardContent>
	</DashboardLayoutRoot>

	<AnalyticsFeeSidebar data={focused_fee} open={show_details} />
</div>
