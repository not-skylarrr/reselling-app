<script lang="ts">
	import { FlexRender, type Row } from "@tanstack/svelte-table";
	import type { BundleTableData } from "../../../../../routes/dashboard/bundles/+page.svelte";
	import { GetTableContext } from "$lib/table/init.svelte";
	import { GetColumnSizingCssVarWithFallback } from "$lib/table/utils";
	import { cn } from "$lib/utils";

	type Props = {
		row: Row<BundleTableData>;
	};

	let { row }: Props = $props();

	const table_state = GetTableContext();

	let visible_cells = $derived(
		row.getVisibleCells().filter((cell) => {
			if (cell.column.columnDef.meta?.hidden == true) return false;

			if (table_state.strict_visiblity) {
				if (table_state.column_visibility[cell.column.id] != true) return false;

				return true;
			}

			return true;
		}),
	);
</script>

<a
	class="flex h-11 shrink-0 flex-row items-center overflow-hidden px-3 outline-none hover:bg-accent"
	href={`/dashboard/bundles/${row.original.id}`}
	role="row"
>
	{#each visible_cells as cell (cell.id)}
		{@const fallback_min_size = cell.column.columnDef.minSize ?? 96}
		{@const column_size_var = GetColumnSizingCssVarWithFallback(
			cell.column.id,
			fallback_min_size,
		)}

		<div
			class={cn(
				"flex h-full shrink-0 flex-row items-center justify-end overflow-hidden px-3 text-sm select-none",
				cell.column.columnDef.meta?.align == "left" && "justify-start",
				cell.column.columnDef.meta?.flex && "flex-1",
			)}
			style={cell.column.getCanResize()
				? `min-width: ${cell.column.columnDef.minSize}px; max-width: ${column_size_var};`
				: cell.column.columnDef.meta?.flex
					? `min-width: ${cell.column.columnDef.minSize}px;`
					: `min-width: ${cell.column.columnDef.minSize}px; max-width: ${cell.column.columnDef.minSize}px; `}
		>
			<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
		</div>
	{/each}
</a>
