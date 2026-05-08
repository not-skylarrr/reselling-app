<script lang="ts" module>
	export const DefaultItemTableColVisibility = {
		name: true,
		status: true,
		labels: true,
		storage_location: true,
		marketplaces: true,
		purchase_price: true,
		target_sale_price: true,
		list_price: true,
		sale_price: true,
		listing_fees: true,
		final_fees: true,
		total_fees: true,
		profit: true,
	};
</script>

<script lang="ts">
	import type { Table } from "@tanstack/svelte-table";
	import ItemsTableHeader from "./components/ItemsTableHeader.svelte";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import { createHotkeyAttachment } from "@tanstack/svelte-hotkeys";
	import ItemsTableRow from "./components/ItemsTableRow.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetColumnSizingCssVarName } from "$lib/table/utils";
	import { GetTableContext } from "$lib/table/init.svelte";
	import type { FullItem } from "$lib/server/db/schema";

	type Props = {
		onRowDouble?: () => void;
		onRowFocus: (item: FullItem) => void;
		table: Table<FullItem>;
	};

	let { onRowFocus, onRowDouble, table }: Props = $props();

	const table_state = GetTableContext();

	let scroll_container = $state<HTMLElement | null>(null);
	let focus_change_blocked = $state(false);
	let scrolled_to_index = $state<number | null>(null);

	let column_size_vars = $derived.by(() => {
		return Object.entries(table_state.col_sizing)
			.map(([column_id, size]) => `${GetColumnSizingCssVarName(column_id)}: ${size}px`)
			.join("; ");
	});

	let hotkey_container = $derived(table_state.hotkey_container);
	let table_rows = $derived(table.getRowModel().rows);

	const [focused_item, focused_index] = $derived.by(() => {
		if (table_rows.length == 0 || table_state.focused_id == null) return [null, null];

		const focused_row = table_rows.find((r) => r.original.id == table_state.focused_id);
		if (!focused_row) return [null, null];

		const focused_index = table_rows.indexOf(focused_row);

		return [focused_row.original, focused_index];
	});

	let loader_row_index = $derived(table_rows.length);
	let row_count = $derived(loader_row_index);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => 44,
		getScrollElement: () => scroll_container,
		overscan: 30,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	function HandleFocus(item: FullItem) {
		if (focus_change_blocked) return;

		onRowFocus(item);

		table_state.focused_id = item.id;
	}

	function ScrollToFocusedItem(index: number) {
		$row_virtualizer.scrollToIndex(index, { align: "auto" });
	}

	function MoveFocusUp() {
		if (table_rows.length == 0) return;

		if (focused_index == null) {
			table_state.focused_id = table_rows[0].original.id;
			return;
		}

		if (focused_index <= 0) return;

		const prev_row = table_rows[focused_index - 1];
		if (!prev_row) return;

		table_state.focused_id = prev_row.original.id;
	}

	function MoveFocusDown() {
		if (table_rows.length == 0) return;

		if (focused_index == null) {
			table_state.focused_id = table_rows[0].original.id;
			return;
		}

		if (focused_index >= table_rows.length - 1) return;

		const next_row = table_rows[focused_index + 1];
		if (!next_row) return;

		table_state.focused_id = next_row.original.id;
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

<ScrollArea
	class="hidden min-h-0 w-full flex-1 overflow-hidden md:flex [&_[data-scroll-area-content]]:flex [&_[data-scroll-area-content]]:h-full [&_[data-scroll-area-content]]:overflow-y-hidden"
	orientation="horizontal"
	type="hover"
>
	<div
		class="flex flex-1 flex-col overflow-y-hidden"
		data-slot="items-table"
		style={column_size_vars}
	>
		<ItemsTableHeader {table} />

		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div
				bind:this={scroll_container}
				class="flex-1 overflow-x-hidden overflow-y-auto"
				tabindex={!hotkey_container ? -1 : undefined}
				{@attach !hotkey_container && focus_up}
				{@attach !hotkey_container && focus_down}
			>
				{#if table_rows.length > 0}
					<div class="relative w-full" style="height: {total_virtual_size}px;">
						{#each virtual_rows as virtual_row (virtual_row.key)}
							{@const row = table_rows[virtual_row.index]}

							{#if row}
								<div
									class="absolute top-0 left-0 flex w-full flex-col border-b border-border/50"
									style="height: {virtual_row.size}px; transform: translateY({virtual_row.start}px);"
								>
									<ItemsTableRow
										focused={virtual_row.index == focused_index}
										selectedRowCount={Object.keys(table_state.row_selection).length}
										selectedRowIds={Object.keys(table_state.row_selection)}
										onDouble={() => onRowDouble?.()}
										onFocus={() => HandleFocus(row.original)}
										onFocusBlock={() => {
											focus_change_blocked = true;
										}}
										onFocusUnblock={() => {
											focus_change_blocked = false;
										}}
										{row}
									/>
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</ScrollArea>
