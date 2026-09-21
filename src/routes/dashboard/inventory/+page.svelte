<script lang="ts">
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import ItemInventorySidebar from "$lib/components/dashboard/inventory/inventory-sidebar/ItemInventorySidebar.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { item_dialog_state } from "$lib/components/items/dialogs/dialog-state.svelte";
	import ItemStatusBadge from "$lib/components/items/reusable/ItemStatusBadge.svelte";
	import TableDisplayOptionsPopover from "$lib/components/items/table/components/TableDisplayOptionsPopover.svelte";
	import TableFilterDisplay from "$lib/components/items/table/components/TableFilterDisplay.svelte";
	import TableFilterDropdown from "$lib/components/items/table/components/TableFilterDropdown.svelte";
	import { ItemTableColumns } from "$lib/components/items/table/def";
	import ItemsTable, {
		DefaultItemTableColVisibility,
	} from "$lib/components/items/table/ItemsTable.svelte";
	import { CreateTableFilter } from "$lib/components/items/table/lib/filters/lib/utils";
	import { TableBase } from "$lib/components/table";
	import { Button } from "$lib/components/ui/button";
	import {
		DefaultTableFeatures,
		DefaultTableProps,
		SetTableContext,
		TableState,
	} from "$lib/table/init.svelte";
	import { GetLocalDetailsOpenState, SetLocalDetailsOpenState } from "$lib/utils/dashboard";
	import { LucidePanelRight, LucidePlus, LucideSearch } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { createHotkey } from "@tanstack/svelte-hotkeys";
	import { createTable } from "@tanstack/svelte-table";
	import { cn } from "$lib/utils";
	import LabelBadgeDisplay from "$lib/components/labels/LabelBadgeDisplay.svelte";
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import type { FullItem } from "$lib/server/db/schema";
	import { Input } from "$lib/components/ui/input";
	import Plural from "$lib/components/utils/Plural.svelte";

	const table_state = new TableState({
		key: "inventory-table",
		default_column_visibility: DefaultItemTableColVisibility,
	});

	const items_query = useLiveQuery(ItemsWithAllMetaCollection);

	let focused_item_id = $state<string | null>(null);
	let search_query = $state<string>("");

	let processed_items = $derived.by(() => {
		const has_archive_filter = table_state.filters.find((f) => f.id == "archived") != undefined;

		if (table_state.hide_archived && !has_archive_filter) {
			return [...items_query.data].filter((item) => item.archived == false);
		}

		return items_query.data;
	});

	let focused_item = $derived(processed_items.find((i) => i.id == focused_item_id));
	let show_details = $state(GetLocalDetailsOpenState());

	const table = createTable<DefaultTableFeatures, FullItem>({
		columns: ItemTableColumns,
		get data() {
			return processed_items;
		},
		getRowId: (original) => original.id,
		...DefaultTableProps(table_state),
	});

	const item_count = $derived(table.getRowModel().rows.length);

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

	function HandleQueryChange(query: string) {
		if (query.length > 0) {
			if (table_state.DoesFilterExist("name-search")) {
				table_state.UpdateFilterByKey("name-search", { value: query });
			} else {
				table_state.AddFilter({
					id: "name",
					key: "name-search",
					silent: true,
					value: { operator: "string:includes", value: query },
				});
			}
		} else {
			if (table_state.DoesFilterExist("name-search")) {
				table_state.RemoveFilterByKey("name-search");
			}
		}

		search_query = query;
	}

	createHotkey("Shift+D", () => ToggleDetailsSidebar());

	SetTableContext(table_state);
</script>

<svelte:head>
	<title>Your Inventory</title>
</svelte:head>

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

			{#snippet details()}
				<p class="block text-muted-foreground">
					{item_count}
					<Plural count={item_count} singular="Item" plural="Items" />
				</p>
			{/snippet}
		</DashboardHeader>

		<div class="flex flex-col border-b p-3 md:hidden">
			<Input
				oninput={(ev) => HandleQueryChange(ev.currentTarget.value)}
				placeholder="Search Items"
				value={search_query}
			/>
		</div>

		{#if table_state.GetVisibleFilters().length > 0}
			<div class="flex min-h-8 flex-row gap-3 border-b px-3 py-2">
				<TableFilterDisplay bind:filters={table_state.filters} {table} />
			</div>
		{/if}

		<div class="flex min-h-0 flex-1 flex-row overflow-hidden">
			<TableBase
				{table}
				getRowId={(item) => item.id}
				onRowFocus={(item) => (focused_item_id = item.id)}
				onRowDouble={ToggleDetailsSidebar}
				mobile_row_height={128}
			>
				{#snippet mobile_row({ row })}
					{@const item = row.original}

					<a
						class={cn("flex h-32 flex-col gap-6 p-4", "hover:bg-accent")}
						href={`/dashboard/inventory/items/${item.id}`}
					>
						<div class="flex flex-row items-center justify-between gap-3">
							<p class="line-clamp-1 truncate">{item.name}</p>

							<ItemStatusBadge status={item.status} />
						</div>

						<div class="grid grid-cols-2 gap-6">
							<Field class="flex-1">
								<FieldLabel class="text-xs font-normal text-muted-foreground">Labels</FieldLabel
								>

								{#if item.labels.length > 0}
									<LabelBadgeDisplay labels={item.labels} />
								{:else}
									<p class="text-sm text-muted-foreground">N/A</p>
								{/if}
							</Field>

							<Field class="w-auto min-w-32">
								<FieldLabel class="text-xs font-normal text-muted-foreground"
									>Location</FieldLabel
								>

								<div class="flex flex-row items-center">
									{#if item.storage_location}
										<LocationBadge location={item.location} />
									{:else}
										<p class="text-sm text-muted-foreground">N/A</p>
									{/if}
								</div>
							</Field>
						</div>
					</a>
				{/snippet}
			</TableBase>
		</div>
	</DashboardLayoutRoot>

	<ItemInventorySidebar item={focused_item} open={show_details} />
</div>
