<script lang="ts" module>
	const column = createColumnHelper<DefaultTableFeatures, Item>();

	const TableColumns = [
		column.accessor("name", {
			header: "Name",
			meta: {
				align: "left",
			},
			minSize: 320,
		}),
		column.accessor("status", {
			header: "Status",
			cell: (info) => renderComponent(CellStatus, { value: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("storage_location", {
			header: "Location",
			cell: (info) => renderComponent(CellLocationLazy, { location_id: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 200,
		}),
	];

	const DefaultColVisibility = { name: true };
</script>

<script lang="ts">
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { LucidePackage } from "@lucide/svelte";
	import { createColumnHelper, createTable, renderComponent } from "@tanstack/svelte-table";
	import type { BundleItemData } from "./+page.js";
	import type { Item } from "$lib/server/db/schema.js";
	import {
		DefaultTableFeatures,
		DefaultTableProps,
		SetTableContext,
		TableState,
	} from "$lib/table/init.svelte.js";
	import { TableBase } from "$lib/components/table/index.js";
	import {
		CellLocation,
		CellLocationLazy,
		CellStatus,
	} from "$lib/components/items/table/components/cells/index.js";
	import { goto } from "$app/navigation";

	const table_state = new TableState({
		key: "bundle-item-instances",
		default_column_visibility: DefaultColVisibility,
	});

	let { data } = $props();

	const table = createTable<DefaultTableFeatures, Item>({
		columns: TableColumns,
		get data() {
			return data.bundle_item.instances;
		},
		...DefaultTableProps(table_state),
	});

	$inspect(data.bundle_item);

	SetTableContext(table_state);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "ellipsis" },
			{
				type: "link",
				text: data.bundle_item.bundle.name,
				href: `/dashboard/bundles/${data.bundle_item.bundle.id}`,
			},
			{ type: "page", text: data.bundle_item.name },
		]}
	></DashboardHeader>

	<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0">
		<div class="flex flex-row items-center gap-6 border-b p-6">
			<div class="flex size-14 items-center justify-center rounded-lg bg-muted">
				<LucidePackage class="stroke-muted-foreground" />
			</div>
			<div class="grid flex-1">
				<p class="text-xl font-medium">{data.bundle_item.name}</p>
				<p class="text-sm text-muted-foreground">{data.bundle_item.bundle.name}</p>
			</div>
		</div>

		<TableBase
			getRowId={(row) => row.id}
			onRowDouble={(item) => goto(`/dashboard/inventory/items/${item.id}`)}
			{table}
		/>
	</DashboardContent>
</DashboardLayoutRoot>
