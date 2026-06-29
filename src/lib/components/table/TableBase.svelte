<script lang="ts" generics="Row extends any">
	import type { Table } from "@tanstack/svelte-table";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetColumnSizingCssVarName } from "$lib/table/utils";
	import { GetTableContext } from "$lib/table/init.svelte";
	import TableHeader from "./TableHeader.svelte";
	import type { Snippet } from "svelte";
	import TableRowRenderer, { type TableRowProps } from "./TableRowRenderer.svelte";
	import { CreateMediaQueryBreakpoint, type MediaBreakPoint } from "$lib/utils/reactivity";

	// TODO: Integrate mobile row snippets
	type Props = {
		onRowDouble?: (row: Row) => void;
		onRowFocus?: (row: Row) => void;
		table: Table<Row>;
		getRowId: (row: Row) => string | null | undefined;
		mobile_row?: Snippet<[TableRowProps<Row>]>;
		mobile_row_height?: number;
		mobile_breakpoint?: MediaBreakPoint;
	};

	let {
		onRowFocus,
		onRowDouble,
		table,
		getRowId,
		mobile_row,
		mobile_row_height = 44,
		mobile_breakpoint = "md",
	}: Props = $props();

	const table_state = GetTableContext();

	const is_mobile = $derived(CreateMediaQueryBreakpoint(mobile_breakpoint));

	let column_size_vars = $derived.by(() => {
		return Object.entries(table_state.col_sizing)
			.map(([column_id, size]) => `${GetColumnSizingCssVarName(column_id)}: ${size}px`)
			.join("; ");
	});
</script>

{#if !is_mobile.current || mobile_row == undefined}
	<!-- Provides horizontal scroll  -->
	<ScrollArea
		class="flex min-h-0 w-full flex-1 overflow-hidden **:data-scroll-area-content:flex **:data-scroll-area-content:h-full **:data-scroll-area-content:overflow-y-hidden"
		orientation="horizontal"
		type="hover"
	>
		<div
			class="flex flex-1 flex-col overflow-y-hidden"
			data-slot="table-base"
			style={column_size_vars}
		>
			<TableHeader {table} />

			<TableRowRenderer {table} {getRowId} {onRowFocus} {onRowDouble} />
		</div>
	</ScrollArea>
{:else}
	<div class="flex flex-1 overflow-hidden">
		<TableRowRenderer
			{table}
			{getRowId}
			{onRowFocus}
			{onRowDouble}
			{mobile_row}
			row_height={mobile_row_height}
		/>
	</div>
{/if}
