<script lang="ts">
	import { cn } from "$lib/utils.js";
	import { LucideChevronDown } from "@lucide/svelte";
	import { FlexRender, type SortingState, type Table } from "@tanstack/svelte-table";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { GetColumnSizingCssVarWithFallback } from "$lib/table/utils";
	import { GetTableContext } from "$lib/table/init.svelte";

	type Props = {
		table: Table<any>;
	};

	let { table }: Props = $props();

	const table_state = GetTableContext();

	let table_headers = $derived.by(() => {
		const all_table_headers = table.getFlatHeaders();

		return all_table_headers.filter((header) => {
			if (header.column.columnDef.meta?.hidden == true) return false;

			if (table_state.strict_visiblity) {
				if (table_state.column_visibility[header.column.id] != true) return false;

				return true;
			}

			return header.column.getIsVisible();
		});
	});

	function GetColumnSortingData(data: SortingState, id: string) {
		const sorting_data = data.find((s) => s.id == id);

		return sorting_data;
	}

	function ToggleSorting(col_id: string, append: boolean = false) {
		const existing_sort = GetColumnSortingData(table_state.sorting, col_id);

		table_state.focused_id = null;

		if (!existing_sort) {
			if (append) {
				if (col_id == "status") {
					// Ensure status filter overrides any sub sorts
					table_state.sorting = [{ id: col_id, desc: false }, ...table_state.sorting];
				} else {
					table_state.sorting = [...table_state.sorting, { id: col_id, desc: false }];
				}
			} else {
				table_state.sorting = [{ id: col_id, desc: false }];
			}
			return;
		}

		if (existing_sort.desc == false) {
			table_state.sorting = table_state.sorting.map((s) => {
				if (s.id != col_id) return s;

				return { id: s.id, desc: true };
			});

			return;
		}

		table_state.sorting = table_state.sorting.filter((s) => s.id != col_id);
	}
</script>

<div class="sticky top-0 flex h-9 shrink-0 items-center divide-x border-b px-1">
	{#if table_state.selection_enabled != false}
		<div class="flex h-full w-11 shrink-0 flex-row items-center justify-center">
			<Checkbox
				checked={table.getIsAllRowsSelected()}
				onCheckedChange={() => table.toggleAllRowsSelected()}
			/>
		</div>
	{/if}

	{#each table_headers as header (header.id)}
		{@const column_def = header.column.columnDef}
		{@const fallback_min_size = column_def.minSize ?? 96}
		{@const column_size_var = GetColumnSizingCssVarWithFallback(
			header.column.id,
			fallback_min_size,
		)}
		{@const align = column_def.meta?.align ?? "right"}
		{@const resize_delta = table.getState().columnSizingInfo.deltaOffset ?? 0}

		{@const sort_data = GetColumnSortingData(table_state.sorting, header.column.id)}

		<div
			class={cn(
				"group/header relative flex h-full shrink-0 flex-row items-center truncate px-3 text-xs text-muted-foreground select-none",
				"data-[cansort=true]:hover:bg-accent data-[cansort=true]:hover:text-accent-foreground",
				align == "left" && "justify-start text-left",
				align == "right" && "justify-end text-right",
				sort_data && "justify-between",
				header.column.columnDef.meta?.flex && "flex-1",
				table_state.selection_enabled == false && "pl-4",
			)}
			data-cansort={header.column.getCanSort()}
			style={header.column.getCanResize()
				? `width: ${column_size_var}; min-width: ${header.column.columnDef.minSize}px;`
				: header.column.columnDef.meta?.flex
					? `min-width: ${header.column.columnDef.minSize}px;`
					: `min-width: ${header.column.columnDef.minSize}px; max-width: ${header.column.columnDef.minSize}px; `}
		>
			<button
				class="flex h-full w-full flex-row items-center gap-2 truncate text-xs"
				onclick={(ev) => ToggleSorting(header.column.id, ev.shiftKey)}
			>
				{#if sort_data && (align == "right" || column_def.meta?.align == undefined)}
					<LucideChevronDown class={cn("size-4", sort_data.desc && "rotate-180")} />
				{/if}

				<div
					class={cn(
						"flex flex-1 flex-row",
						align == "left" && "justify-start",
						align == "right" && "justify-end",
					)}
				>
					<FlexRender content={header.column.columnDef.header} context={header.getContext()} />
				</div>

				{#if sort_data && column_def.meta?.align == "left"}
					<LucideChevronDown class={cn("size-4", sort_data.desc && "rotate-180")} />
				{/if}
			</button>

			{#if header.column.getCanResize()}
				<button
					type="button"
					aria-label={`Resize ${typeof column_def.header == "string" ? column_def.header : header.column.id} column`}
					class={cn(
						"absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none select-none",
						"bg-transparent transition-colors hover:bg-border/80",
						header.column.getIsResizing() && "bg-accent",
					)}
					onmousedown={header.getResizeHandler()}
					ontouchstart={header.getResizeHandler()}
				>
				</button>

				{#if header.column.getIsResizing()}
					<div
						class="pointer-events-none absolute top-0 right-0 z-20 h-full w-px bg-primary"
						style="transform: translateX({resize_delta}px);"
					></div>
				{/if}
			{/if}
		</div>
	{/each}
</div>
