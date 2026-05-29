<script lang="ts" generics="Row extends any">
	import type { Table } from "@tanstack/svelte-table";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import { createHotkeyAttachment } from "@tanstack/svelte-hotkeys";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetColumnSizingCssVarName } from "$lib/table/utils";
	import { GetTableContext } from "$lib/table/init.svelte";
	import TableHeader from "./TableHeader.svelte";
	import TableRow from "./TableRow.svelte";
	import type { Snippet } from "svelte";
	import TableRowRenderer, { type TableRowProps } from "./TableRowRenderer.svelte";
	import { MediaQuery } from "svelte/reactivity";
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

	let scroll_container = $state<HTMLElement | null>(null);
	let focus_change_blocked = $state(false);
	let scrolled_to_index = $state<number | null>(null);

	const is_mobile = $derived(CreateMediaQueryBreakpoint(mobile_breakpoint));

	let column_size_vars = $derived.by(() => {
		return Object.entries(table_state.col_sizing)
			.map(([column_id, size]) => `${GetColumnSizingCssVarName(column_id)}: ${size}px`)
			.join("; ");
	});

	let hotkey_container = $derived(table_state.hotkey_container);
	let table_rows = $derived(table.getRowModel().rows);

	const [focused_row, focused_index] = $derived.by(() => {
		if (table_rows.length == 0 || table_state.focused_id == null) return [null, null];

		const found_row = table_rows.find((r) => getRowId(r.original) == table_state.focused_id);
		if (!found_row) return [null, null];

		const found_index = table_rows.indexOf(found_row);

		return [found_row.original, found_index];
	});

	let loader_row_index = $derived(table_rows.length);
	let row_count = $derived(loader_row_index);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => 44,
		getScrollElement: () => scroll_container,
		overscan: 10,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	function HandleFocus(row: any) {
		if (focus_change_blocked) return;

		onRowFocus?.(row);

		const row_id = getRowId(row);
		if (row_id != null) {
			table_state.focused_id = row_id;
		}
	}

	function ScrollToFocusedItem(index: number) {
		$row_virtualizer.scrollToIndex(index, { align: "auto" });
	}

	function MoveFocusUp() {
		if (table_rows.length == 0) return;

		if (focused_index == null) {
			const first_id = getRowId(table_rows[0]?.original);
			if (first_id != null) table_state.focused_id = first_id;
			return;
		}

		if (focused_index <= 0) return;

		const prev_row = table_rows[focused_index - 1];
		if (!prev_row) return;

		const prev_id = getRowId(prev_row.original);
		if (prev_id != null) table_state.focused_id = prev_id;
	}

	function MoveFocusDown() {
		if (table_rows.length == 0) return;

		if (focused_index == null) {
			const first_id = getRowId(table_rows[0]?.original);
			if (first_id != null) table_state.focused_id = first_id;
			return;
		}

		if (focused_index >= table_rows.length - 1) return;

		const next_row = table_rows[focused_index + 1];
		if (!next_row) return;

		const next_id = getRowId(next_row.original);
		if (next_id != null) table_state.focused_id = next_id;
	}

	const focus_up = createHotkeyAttachment("ArrowUp", MoveFocusUp, { preventDefault: true });

	const focus_down = createHotkeyAttachment("ArrowDown", MoveFocusDown, {
		preventDefault: true,
	});

	$effect(() => {
		if (focused_index == null) return;

		// Prevents jumping to focused item on scroll, only when the focused index changes
		if (focused_index == scrolled_to_index) return;

		ScrollToFocusedItem(focused_index);

		scrolled_to_index = focused_index;
	});

	$effect(() => {
		const virtualizer = $row_virtualizer;

		if (virtualizer.options.count == row_count) return;

		virtualizer.setOptions({
			...virtualizer.options,
			count: row_count,
		});
	});

	$effect(() => {
		if (!hotkey_container) return;

		const cleanup_up = focus_up(hotkey_container);
		const cleanup_down = focus_down(hotkey_container);

		return () => {
			if (typeof cleanup_up == "function") cleanup_up();
			if (typeof cleanup_down == "function") cleanup_down();
		};
	});

	$effect(() => {
		const container = table_state.hotkey_container ?? scroll_container;

		table_state.SetHotkeyContainer(container);

		if (!container) return;

		const handle_focus_in = () => table_state.SetHotkeyActive(true);

		const handle_focus_out = (ev: FocusEvent) => {
			const next = ev.relatedTarget;
			if (!(next instanceof HTMLElement) || !container.contains(next)) {
				table_state.SetHotkeyActive(false);
			}
		};

		const handle_pointer_down = (ev: PointerEvent) => {
			const target = ev.target;
			if (target instanceof HTMLElement && container.contains(target)) {
				table_state.SetHotkeyActive(true);
			}
		};

		container.addEventListener("focusin", handle_focus_in);
		container.addEventListener("focusout", handle_focus_out);
		container.addEventListener("pointerdown", handle_pointer_down);

		return () => {
			container.removeEventListener("focusin", handle_focus_in);
			container.removeEventListener("focusout", handle_focus_out);
			container.removeEventListener("pointerdown", handle_pointer_down);
		};
	});
</script>

{#if !is_mobile.current || mobile_row == undefined}
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
