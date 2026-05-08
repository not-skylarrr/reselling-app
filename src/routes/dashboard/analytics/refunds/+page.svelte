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
		column.accessor("refund_type", {
			header: "Refund Type",
			cell: (info) => (info.getValue ? GetRefundTypeFriendlyName(info.getValue()!) : "-"),
			minSize: 160,
		}),
		column.accessor("refund_reason", {
			header: "Refund Reason",
			cell: (info) => info.getValue(),
			minSize: 160,
		}),
	];

	const DefaultColVisibility: VisibilityState = {
		name: true,
		refund_type: true,
	};
</script>

<script>
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import ItemsTable from "$lib/components/items/table/ItemsTable.svelte";
	import { GetRefundTypeFriendlyName } from "$lib/items/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import {
		createColumnHelper,
		createTable,
		type VisibilityState,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "refund-analytics",
		default_column_visiblity: DefaultColVisibility,
	});

	const refunded_items_query = useLiveQuery((q) =>
		q
			.from({ item: ItemsWithAllMetaCollection })
			.where(({ item }) => eq(item.status, "refunded")),
	);

	const table = createTable({
		...DefaultTableProps<FullItem>(table_state),
		columns: RefundTableColumns,
		get data() {
			return refunded_items_query.data;
		},
		enableColumnResizing: false,
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
	/>

	<DashboardContent class="p-0 md:p-0">
		<div class="flex flex-1 overflow-hidden">
			<ItemsTable onRowFocus={() => {}} {table} />
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
