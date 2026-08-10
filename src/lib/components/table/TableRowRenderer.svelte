<script lang="ts" module>
	import type { AppRow } from "$lib/table/init.svelte";

	export type TableRowProps<RData> = {
		focused: boolean;
		onDouble?: (data: RData) => void;
		onFocus?: (data: RData) => void;
		onFocusBlock?: () => void;
		onFocusUnblock?: () => void;
		row: AppRow<RData>;
	};
</script>

<script lang="ts" generics="RData extends any">
	import { GetTableContext } from "$lib/table/init.svelte";
	import { createHotkeyAttachment } from "@tanstack/svelte-hotkeys";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import type { Snippet } from "svelte";
	import TableRow from "./TableRow.svelte";
	import { cn } from "$lib/utils";
	import type { AppTable } from "$lib/table/init.svelte";

	type Props = {
		mobile_row?: Snippet<[TableRowProps<RData>]>;
		row_height?: number;
		table: AppTable<RData>;

		getRowId: (row: RData) => string | null | undefined;
		onRowFocus?: (row: RData) => void;
		onRowDouble?: (row: RData) => void;
	};

	let {
		mobile_row,
		row_height = 44,
		table,
		getRowId,
		onRowFocus,
		onRowDouble,
	}: Props = $props();

	const table_state = GetTableContext();

	let scroll_container = $state<HTMLElement | null>(null);
	let hotkey_container = $derived(table_state.hotkey_container);
	let focus_change_blocked = $state(false);

	let table_rows = $derived(table.getRowModel().rows);
	const row_count = $derived(table_rows.length);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => row_height,
		getScrollElement: () => scroll_container,
		overscan: 10,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	const focused_index = $derived.by(() => {
		if (table_rows.length == 0 || table_state.focused_id == null) return null;

		const row_index = table_rows.findIndex(
			(row) => getRowId(row.original) == table_state.focused_id,
		);
		if (row_index == -1) return null;

		return row_index;
	});

	function HandleFocus(row: RData) {
		if (focus_change_blocked) return;

		onRowFocus?.(row);

		const row_id = getRowId(row);
		if (row_id != null) {
			table_state.focused_id = row_id;
		}
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
</script>

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
							{#if mobile_row}
								{@render mobile_row({
									focused: virtual_row.index == focused_index,
									onDouble: () => onRowDouble?.(row.original),
									onFocus: () => HandleFocus(row.original),
									onFocusBlock: () => {
										focus_change_blocked = true;
									},
									onFocusUnblock: () => {
										focus_change_blocked = false;
									},
									row: row,
								})}
							{:else}
								<TableRow
									focused={virtual_row.index == focused_index}
									onDouble={() => onRowDouble?.(row.original)}
									onFocus={() => HandleFocus(row.original)}
									onFocusBlock={() => {
										focus_change_blocked = true;
									}}
									onFocusUnblock={() => {
										focus_change_blocked = false;
									}}
									{row}
								/>
							{/if}
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
