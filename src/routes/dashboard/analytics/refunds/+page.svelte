<script lang="ts" module>
	const column = createColumnHelper<FullItem>();

	const RefundTableColumns = [
		column.accessor("name", {
			header: "Name",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
				flex: true,
			},
			minSize: 184,
		}),
		column.accessor(
			(row) => {
				const refund_fee = row.fees?.find((fee) => fee.type == "refunded_amount");
				if (!refund_fee) return null;

				return refund_fee.amount;
			},
			{
				id: "refunded-amount",
				header: "Amount Refunded",
				cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
				meta: {
					align: "left",
				},
				minSize: 160,
			},
		),
		column.accessor("refund_type", {
			header: "Refund Type",
			cell: (info) => (info.getValue ? GetRefundTypeFriendlyName(info.getValue()!) : "-"),
			meta: {
				align: "left",
				filter: OptionFilter({
					name: "Refund Type",
					icon: {
						component: LucideIterationCw,
					},
					multiLabel: "Types",
					options: Object.entries(RefundTypeFriendlyNames).map(([value, label]) => ({
						icon: {
							component: RefundTypeIcons[value],
						},
						label,
						value,
					})),
				}),
			},
			minSize: 184,
			filterFn: AdvancedFilter,
		}),
		column.accessor("refund_reason", {
			header: "Refund Reason",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
			},
			minSize: 360,
		}),
	];

	const DefaultColVisibility: VisibilityState = {
		name: true,
		refund_type: true,
	};
</script>

<script>
	import {
		ItemFeesCollection,
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
	} from "$lib/collections/def.svelte";

	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import CellCurrency from "$lib/components/items/table/components/cells/CellCurrency.svelte";
	import TableFilterDisplay from "$lib/components/items/table/components/TableFilterDisplay.svelte";
	import TableFilterDropdown from "$lib/components/items/table/components/TableFilterDropdown.svelte";
	import ItemsTable from "$lib/components/items/table/ItemsTable.svelte";
	import { AdvancedFilter } from "$lib/components/items/table/lib/filters";
	import { OptionFilter } from "$lib/components/items/table/lib/filters/lib/functions";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { TableBase } from "$lib/components/table";
	import {
		GetRefundTypeFriendlyName,
		RefundTypeFriendlyNames,
		RefundTypeIcons,
	} from "$lib/items/utils";
	import type { FullItem, WorkspaceLabel } from "$lib/server/db/schema";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideIterationCw } from "@lucide/svelte";
	import { eq, isUndefined, not, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		type VisibilityState,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "refund-analytics",
		default_column_visiblity: DefaultColVisibility,
	});

	// Doesn't like the premade query for some reason despite being identical
	const refunded_items_query = useLiveQuery((q) =>
		q
			.from({ item: ItemsCollection })
			.where(({ item }) => eq(item.status, "refunded"))
			.select(({ item }) => ({
				...item,
				labels: toArray(
					q
						.from({ label_join: LabelJoinsCollection })
						.where(({ label_join }) => eq(label_join.item_id, item.id))
						.leftJoin({ label: LabelsCollection }, ({ label_join, label }) =>
							eq(label.id, label_join.label_id),
						)
						.where(({ label }) => not(isUndefined(label)))
						.fn.select(({ label }): WorkspaceLabel => {
							return label as WorkspaceLabel;
						}),
				),
				listings: toArray(
					q
						.from({ listing: ListingsCollection })
						.where(({ listing }) => eq(item.id, listing.item_id)),
				),
				fees: toArray(
					q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(item.id, fee.item_id)),
				),
			})),
	);

	const table = createTable({
		...DefaultTableProps<FullItem>(table_state),
		columns: RefundTableColumns,
		get data() {
			return refunded_items_query.data;
		},
	});

	const available_data = $derived(table.getFilteredRowModel().rows.map((row) => row.original));

	const use_selection_stats = $derived(Object.keys(table_state.row_selection).length > 0);

	const refund_stats = $derived.by(() => {
		let amount_refunded = 0;
		let most_common_reason = "N/A";
		let refund_type_count = new Map<string, number>();

		for (const item of available_data) {
			if (!item.refund_type) continue;

			if (use_selection_stats) {
				if (!table_state.row_selection[item.id]) continue;
			}

			const refund_fee = item.fees.find((fee) => fee.type == "refunded_amount");

			if (refund_fee) {
				amount_refunded += refund_fee.amount;
			}

			if (refund_type_count.has(item.refund_type)) {
				const curr = refund_type_count.get(item.refund_type)!;

				refund_type_count.set(item.refund_type, curr + 1);
			} else {
				refund_type_count.set(item.refund_type, 1);
			}
		}

		let highest_occurence = 0;

		for (const [type, count] of refund_type_count.entries()) {
			if (count > highest_occurence) {
				highest_occurence = count;
				most_common_reason = type;
			}
		}

		return { amount_refunded: amount_refunded, most_common_type: most_common_reason };
	});

	SetTableContext(table_state);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "link", text: "Analytics", href: "/dashboard/analytics" },
			{ type: "page", text: "Refunds" },
		]}
	>
		{#snippet actions()}
			<TableFilterDropdown {table} {table_state} />
		{/snippet}
	</DashboardHeader>

	<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0" disableScroll>
		<div
			class="grid grid-cols-2 gap-0 border-b p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(n+2)]:border-t [&>*:nth-child(odd)]:border-l"
		>
			<div class="col-span-2 grid p-6">
				<p class="line-clamp-1 truncate text-2xl font-medium">
					{GetRefundTypeFriendlyName(refund_stats.most_common_type)}
				</p>
				<p class="text-sm text-muted-foreground">Most Common Refund Reason</p>
			</div>

			<div class="grid p-6">
				<p class="text-2xl font-medium">{FormatCurrency(refund_stats.amount_refunded)}</p>
				<p class="text-sm text-muted-foreground">Amount Refunded</p>
			</div>

			<div class="grid p-6">
				<p class="text-2xl font-medium">{FormatCurrency(refund_stats.amount_refunded)}</p>
				<p class="text-sm text-muted-foreground">Amount Refunded</p>
			</div>
		</div>

		{#if table_state.filters.length > 0}
			<div class="flex min-h-8 flex-row gap-3 border-b px-3 py-2">
				<TableFilterDisplay bind:filters={table_state.filters} {table} />
			</div>
		{/if}

		<div class="flex flex-1 overflow-hidden">
			<TableBase onRowFocus={() => {}} {table} />
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
