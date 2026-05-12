<script lang="ts">
	import { FlexRender, type Row } from "@tanstack/svelte-table";
	import { cn } from "$lib/utils";
	import { onDestroy } from "svelte";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { GetColumnSizingCssVarWithFallback } from "$lib/table/utils";
	import { GetTableContext } from "$lib/table/init.svelte";

	type Props = {
		focused: boolean;
		onDouble?: () => void;
		onFocus: () => void;
		onFocusBlock: () => void;
		onFocusUnblock: () => void;
		row: Row<any>;
		strictColVisibility?: boolean;
	};

	let {
		focused,
		onDouble,
		onFocus,
		onFocusUnblock,
		row,
		strictColVisibility = false,
	}: Props = $props();

	let table_state = GetTableContext();

	let el = $state<HTMLElement | null>(null);

	let is_selected = $derived(row.getIsSelected());

	let visible_cells = $derived(
		row.getVisibleCells().filter((cell) => {
			if (cell.column.columnDef.meta?.hidden == true) return false;

			if (strictColVisibility) {
				if (table_state.column_visibility[cell.column.id] != true) return false;

				return true;
			}

			return true;
		}),
	);

	$effect(() => {
		if (focused && el) {
			el.focus({ preventScroll: true });
		}
	});

	onDestroy(() => {
		onFocusUnblock();
	});
</script>

<div
	bind:this={el}
	class={cn(
		"group/row flex h-11 w-full flex-row items-center outline-none",
		"px-1 data-[selected=true]:bg-primary/5",
		focused && "bg-accent dark:bg-accent/70",
		table_state.selection_enabled == false && "pl-2",
	)}
	data-focused={focused}
	data-selected={is_selected}
	onfocus={(ev) => {
		ev.preventDefault();

		table_state.SetHotkeyActive(true);
		onFocus();
	}}
	onclick={() => {
		table_state.SetHotkeyActive(true);
		onFocus();
	}}
	ondblclick={() => onDouble?.()}
	onkeydown={(ev) => {}}
	tabindex={0}
	role="row"
>
	{#if table_state.selection_enabled != false}
		<div class="flex h-full w-11 shrink-0 items-center justify-center">
			<Checkbox checked={row.getIsSelected()} onCheckedChange={() => row.toggleSelected()} />
		</div>
	{/if}

	{#each visible_cells as cell (cell.id)}
		{@const fallback_min_size = cell.column.columnDef.minSize ?? 96}
		{@const column_size_var = GetColumnSizingCssVarWithFallback(
			cell.column.id,
			fallback_min_size,
		)}

		<div
			class={cn(
				"flex h-full shrink-0 flex-row items-center justify-end truncate overflow-hidden px-3 text-sm select-none",
				cell.column.columnDef.meta?.align == "left" && "justify-start",
				cell.column.columnDef.meta?.flex && "flex-1",
			)}
			style={cell.column.getCanResize()
				? `width: ${column_size_var}; min-width: ${cell.column.columnDef.minSize}px;`
				: cell.column.columnDef.meta?.flex
					? `min-width: ${cell.column.columnDef.minSize}px;`
					: `min-width: ${cell.column.columnDef.minSize}px; max-width: ${cell.column.columnDef.minSize}px; `}
		>
			<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
		</div>
	{/each}
</div>
