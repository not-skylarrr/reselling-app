<script lang="ts">
	import type { Table } from "@tanstack/svelte-table";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import MobileTableRow from "./components/MobileTableRow.svelte";
	import MobileTableHeader from "./components/MobileTableHeader.svelte";
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

	let table_rows = $derived(table.getRowModel().rows);

	let loader_row_index = $derived(table_rows.length);
	let row_count = $derived(loader_row_index);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => 128,
		getScrollElement: () => scroll_container,
		overscan: 4,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	function HandleFocus(item: FullItem) {
		if (focus_change_blocked) return;

		onRowFocus(item);

		table_state.focused_id = item.id;
	}

	$effect(() => {
		const virtualizer = $row_virtualizer;

		if (virtualizer.options.count == row_count) return;

		virtualizer.setOptions({
			...virtualizer.options,
			count: row_count,
		});
	});
</script>

<div class="flex min-h-0 flex-1 flex-col md:hidden" data-slot="items-table">
	<MobileTableHeader {table} />
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div bind:this={scroll_container} class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
		{#if table_rows.length > 0}
			<div class="relative w-full" style="height: {total_virtual_size}px;">
				{#each virtual_rows as virtual_row (virtual_row.key)}
					{@const row = table_rows[virtual_row.index]}

					{#if row}
						<div
							class="absolute top-0 left-0 flex w-full flex-col border-b border-border/50"
							style="height: {virtual_row.size}px; transform: translateY({virtual_row.start}px);"
						>
							<MobileTableRow
								focused={false}
								selectedRowCount={Object.keys(table_state.row_selection).length}
								selectedRowIds={Object.keys(table_state.row_selection)}
								onDouble={() => onRowDouble?.()}
								onFocus={() => HandleFocus(row.original)}
								onFocusBlock={() => (focus_change_blocked = true)}
								onFocusUnblock={() => (focus_change_blocked = false)}
								{row}
							/>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>
