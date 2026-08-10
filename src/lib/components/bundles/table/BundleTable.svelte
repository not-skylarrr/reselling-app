<script lang="ts">
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import type { BundleTableData } from "../../../../routes/dashboard/bundles/+page.svelte";
	import { GetTableContext, type AppTable } from "$lib/table/init.svelte";
	import { GetColumnSizingCssVarName } from "$lib/table/utils";
	import BundleTableHeader from "./components/BundleTableHeader.svelte";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import BundleTableRow from "./components/BundleTableRow.svelte";

	type Props = {
		table: AppTable<BundleTableData>;
	};

	let { table }: Props = $props();

	const table_state = GetTableContext();

	let scroll_container = $state<HTMLElement | null>(null);
	let active_letter = $state<string | null>(null);

	let table_rows = $derived(table.getRowModel().rows);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => 44,
		getScrollElement: () => scroll_container,
		overscan: 30,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	let column_size_vars = $derived.by(() => {
		return Object.entries(table_state.col_sizing)
			.map(([column_id, size]) => `${GetColumnSizingCssVarName(column_id)}: ${size}px`)
			.join("; ");
	});

	$effect(() => {
		const virtualizer = $row_virtualizer;

		if (virtualizer.options.count == table_rows.length) return;

		virtualizer.setOptions({
			...virtualizer.options,
			count: table_rows.length,
		});
	});

	function JumpToLetter(letter: string) {
		const normalized_letter = letter.toLowerCase();
		const target_index = table_rows.findIndex((row) =>
			row.original.name.trim().toLowerCase().startsWith(normalized_letter),
		);

		if (target_index === -1) return;

		active_letter = normalized_letter;
		$row_virtualizer.scrollToIndex(target_index, { align: "start" });
	}
</script>

<ScrollArea
	class="hidden min-h-0 flex-1 overflow-hidden md:flex [&_[data-scroll-area-content]]:flex [&_[data-scroll-area-content]]:h-full [&_[data-scroll-area-content]]:overflow-y-hidden"
	orientation="horizontal"
	type="hover"
>
	<div
		class="flex flex-1 flex-col overflow-hidden"
		data-slot="items-table"
		style={column_size_vars}
	>
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div bind:this={scroll_container} class="flex-1 overflow-x-hidden overflow-y-auto">
				<BundleTableHeader {table} {table_rows} {active_letter} onLetterSelect={JumpToLetter} />

				{#if table_rows.length > 0}
					<div class="relative w-full" style="height: {total_virtual_size}px;">
						{#each virtual_rows as virtual_row (virtual_row.key)}
							{@const row = table_rows[virtual_row.index]}

							{#if row}
								<div
									class="absolute top-0 left-0 flex w-full flex-col border-b border-border/50"
									style="height: {virtual_row.size}px; transform: translateY({virtual_row.start}px);"
								>
									<BundleTableRow {row} />
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</ScrollArea>
