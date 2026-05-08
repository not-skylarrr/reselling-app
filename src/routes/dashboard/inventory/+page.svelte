<script lang="ts">
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import { type InventoryItemData } from "$lib/collections/query-collections";
	import ItemInventorySidebar from "$lib/components/dashboard/inventory/inventory-sidebar/ItemInventorySidebar.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { item_dialog_state } from "$lib/components/items/dialogs/dialog-state.svelte";
	import TableDisplayOptionsPopover from "$lib/components/items/table/components/TableDisplayOptionsPopover.svelte";
	import TableFilterDisplay from "$lib/components/items/table/components/TableFilterDisplay.svelte";
	import TableFilterDropdown from "$lib/components/items/table/components/TableFilterDropdown.svelte";
	import { ItemTableColumns } from "$lib/components/items/table/def";
	import ItemsTable, {
		DefaultItemTableColVisibility,
	} from "$lib/components/items/table/ItemsTable.svelte";
	import { CreateTableFilter } from "$lib/components/items/table/lib/filters/lib/utils";
	import MobileTable from "$lib/components/items/table/MobileTable.svelte";
	import { Button } from "$lib/components/ui/button";
	import { SetTableContext, TableState } from "$lib/table/init.svelte";
	import { GetLocalDetailsOpenState, SetLocalDetailsOpenState } from "$lib/utils/dashboard";
	import { LucidePanelRight, LucidePlus, LucideSearch } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { createHotkey } from "@tanstack/svelte-hotkeys";
	import {
		createTable,
		getCoreRowModel,
		getFilteredRowModel,
		getSortedRowModel,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "inventory-table",
		default_column_visiblity: DefaultItemTableColVisibility,
	});

	const items_query = useLiveQuery(ItemsWithAllMetaCollection);

	let focused_item_id = $state<string | null>(null);

	let focused_item = $derived(items_query.data.find((i) => i.id == focused_item_id));
	let show_details = $state(GetLocalDetailsOpenState());

	const table = createTable({
		columns: ItemTableColumns,
		get data() {
			return items_query.data;
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
	});

	function ToggleDetailsSidebar() {
		if (items_query.data.length == 0) {
			show_details = false;

			SetLocalDetailsOpenState(false);
			return;
		}

		const visible_rows = table.getRowModel().rows;

		if (visible_rows.length > 0 && focused_item == null) {
			if (show_details == false) {
				show_details = true;

				SetLocalDetailsOpenState(true);
			}

			table_state.focused_id = visible_rows[0].original.id;
			return;
		}

		show_details = !show_details;

		SetLocalDetailsOpenState(show_details);
	}

	createHotkey("Shift+D", () => ToggleDetailsSidebar());

	SetTableContext(table_state);
</script>

<div class="flex flex-1 flex-row overflow-hidden">
	<DashboardLayoutRoot>
		<DashboardHeader
			breadcrumbs={[
				{ type: "link", text: "Dashboard", href: "/dashboard" },
				{ type: "page", text: "Inventory" },
			]}
		>
			{#snippet actions()}
				<Button onclick={() => (item_dialog_state.new_item_dialog_open = true)} size="sm">
					<LucidePlus /> New Item
				</Button>

				<TableFilterDropdown {table} {table_state} />

				<Button
					onclick={() =>
						table_state.AddFilter(
							CreateTableFilter("name", "string:includes", "", { defaultOpen: true }),
						)}
					size="icon-sm"
					variant="outline"
				>
					<LucideSearch />
				</Button>

				<TableDisplayOptionsPopover {table} />

				<Button onclick={ToggleDetailsSidebar} size="icon-sm" variant="outline">
					<LucidePanelRight />
				</Button>
			{/snippet}
		</DashboardHeader>

		{#if table_state.filters.length > 0}
			<div class="flex min-h-8 flex-row gap-3 border-b px-3 py-2">
				<TableFilterDisplay bind:filters={table_state.filters} {table} />
			</div>
		{/if}

		<div class="flex min-h-0 flex-1 flex-row overflow-hidden">
			<ItemsTable
				onRowFocus={(item) => (focused_item_id = item.id)}
				onRowDouble={ToggleDetailsSidebar}
				{table}
			/>

			<MobileTable
				onRowFocus={(item) => (focused_item_id = item.id)}
				onRowDouble={ToggleDetailsSidebar}
				{table}
			/>
		</div>
	</DashboardLayoutRoot>

	<ItemInventorySidebar item={focused_item} open={show_details} />
</div>
