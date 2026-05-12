<script lang="ts">
	import type { InventoryItemData } from "$lib/collections/query-collections";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSub,
		DropdownMenuSubContent,
		DropdownMenuSubTrigger,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { LucideFunnelPlus } from "@lucide/svelte";
	import type { Table } from "@tanstack/svelte-table";
	import type { FilterDef } from "../lib/filters/types";
	import AddFilterOptionRenderer from "./filters/AddFilterOptionRenderer.svelte";
	import { CreateTableFilter } from "../lib/filters/lib/utils";
	import type { TableState } from "$lib/table/init.svelte";

	type Props = {
		label?: string;
		table: Table<any>;
		table_state: TableState;
	};

	let { label, table, table_state }: Props = $props();

	let open = $state(false);

	type ColumnWithFilterMeta = {
		id: string;
		filter: FilterDef<any>;
	};

	const filter_columns = $derived.by(() => {
		const columns = table.getAllColumns();

		return columns
			.filter((c) => c.columnDef.meta?.filter != undefined)
			.map((c): ColumnWithFilterMeta => {
				return {
					id: c.id,
					filter: c.columnDef.meta?.filter,
				};
			});
	});

	function HandleFilterAdd(
		filter: FilterDef<any>,
		id: string,
		operation: string,
		value: any,
		defaultOpen: boolean = false,
	) {
		const allow_multiple = filter.meta?.allowMultiple === true;
		const add_mode =
			filter.merge_behavior ??
			(filter.id == "option" ? "merge" : allow_multiple ? "append" : "overwrite");

		table_state.AddFilter(CreateTableFilter(id, operation, value, { defaultOpen }), {
			mode: add_mode,
		});

		open = false;
	}
</script>

<DropdownMenu bind:open>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} size="sm" variant="outline">
				<LucideFunnelPlus />
				{label ?? "Filter Items"}
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end">
		{#each filter_columns as column (column.id)}
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					{#if column.filter.display_meta.icon}
						<column.filter.display_meta.icon.component
							{...column.filter.display_meta.icon.props}
						/>
					{/if}

					<p class="flex-1">
						{column.filter.display_meta.name}
					</p>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent align="start" class="w-64">
					{#if column.filter.id == "option"}
						<AddFilterOptionRenderer
							id={column.id}
							label={column.filter.multi
								? column.filter.meta.multiLabel
								: column.filter.display_meta.name}
							options={column.filter.meta.options}
							onFilterAdd={(val) =>
								HandleFilterAdd(
									column.filter,
									column.id,
									column.filter.available_operations[0].id,
									[val],
								)}
						/>
					{/if}

					{#if column.filter.id == "string"}
						{#each column.filter.available_operations as operation (operation.id)}
							{@const label =
								column.filter.multi && operation.label_multi
									? operation.label_multi
									: operation.label}

							{#if !operation.hide}
								<DropdownMenuItem
									onSelect={() =>
										HandleFilterAdd(column.filter, column.id, operation.id, "", true)}
								>
									{label}
								</DropdownMenuItem>
							{/if}
						{/each}
					{/if}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		{/each}
	</DropdownMenuContent>
</DropdownMenu>
