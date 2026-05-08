<script lang="ts" module>
	export type BundleTableData = ItemBundle & {
		items: (BundleItem & {
			associations: BundleAssociationData[];
		})[];
	};

	export type BundleAssociationData = ItemAssociation & {
		item: Item | undefined;
	};

	export const BundleTableDataCollection = createLiveQueryCollection((q) =>
		q.from({ bundle: BundlesCollection }).select(({ bundle }) => ({
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
								.leftJoin({ item: ItemsCollection }, ({ association, item }) =>
									eq(item.id, association.item_id),
								)
								.select(({ association, item }) => ({ ...association, item: item }))
								.fn.select(
									(row): BundleAssociationData => ({
										...row.association,
										item: row.item,
									}),
								),
						),
					})),
			),
		})),
	);
</script>

<script lang="ts">
	import {
		BundleItemsCollection,
		BundlesCollection,
		ItemAssociationsCollection,
		ItemsCollection,
	} from "$lib/collections/def.svelte";
	import BundleTable from "$lib/components/bundles/table/BundleTable.svelte";
	import {
		BundleTableColumns,
		BundleTableDefaultColumnVis,
	} from "$lib/components/bundles/table/def";
	import MobileBundleTable from "$lib/components/bundles/table/MobileBundleTable.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { Button } from "$lib/components/ui/button";
	import type { BundleItem, Item, ItemAssociation, ItemBundle } from "$lib/server/db/schema";
	import { SetTableContext, TableState } from "$lib/table/init.svelte";
	import { LucidePlus } from "@lucide/svelte";
	import {
		eq,
		and,
		toArray,
		useLiveQuery,
		inArray,
		createLiveQueryCollection,
	} from "@tanstack/svelte-db";
	import {
		createTable,
		getCoreRowModel,
		getSortedRowModel,
		getFilteredRowModel,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "bundle-table",
		default_column_visiblity: BundleTableDefaultColumnVis,
		sorting: [{ id: "name", desc: false }],
	});

	const bundles_query = useLiveQuery(BundleTableDataCollection);

	const table = createTable({
		columns: BundleTableColumns,
		get data() {
			return bundles_query.data;
		},
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getRowId: (original) => original.id,
		groupedColumnMode: "reorder",
		state: {
			get columnFilters() {
				return table_state.filters;
			},
			get columnVisibility() {
				return table_state.column_visibility;
			},
			get rowSelection() {
				return table_state.row_selection;
			},
			get sorting() {
				return table_state.sorting;
			},
			get columnSizing() {
				return table_state.col_sizing;
			},
		},
		columnResizeMode: "onChange",
		onColumnVisibilityChange: (updater) => table_state.SetColumnVisibility(updater),
		onRowSelectionChange: (updater) => table_state.SetRowSelection(updater),
		onColumnSizingChange: (updater) => table_state.SetColumnSizing(updater),
		enableColumnResizing: false,
	});

	SetTableContext(table_state);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "page", text: "Bundles" },
		]}
	>
		{#snippet actions()}
			<Button href="/dashboard/bundles/new"><LucidePlus /> New Bundle</Button>
		{/snippet}
	</DashboardHeader>

	<DashboardContent class="p-0 md:p-0" disableScroll>
		<BundleTable {table} />
		<MobileBundleTable {table} />
	</DashboardContent>
</DashboardLayoutRoot>
