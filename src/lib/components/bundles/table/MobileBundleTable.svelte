<script lang="ts">
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import type { Table } from "@tanstack/svelte-table";
	import type { BundleTableData } from "../../../../routes/dashboard/bundles/+page.svelte";
	import { GetTableContext } from "$lib/table/init.svelte";
	import { GetColumnSizingCssVarName } from "$lib/table/utils";
	import BundleTableHeader from "./components/BundleTableHeader.svelte";
	import { createVirtualizer } from "@tanstack/svelte-virtual";
	import BundleTableRow from "./components/BundleTableRow.svelte";
	import MobileBundleTableRow from "./components/MobileBundleTableRow.svelte";

	type Props = {
		table: Table<BundleTableData>;
	};

	let { table }: Props = $props();

	const table_state = GetTableContext();

	let scroll_container = $state<HTMLElement | null>(null);

	let table_rows = $derived(table.getRowModel().rows);

	const row_virtualizer = createVirtualizer<HTMLElement, HTMLDivElement>({
		count: 0,
		estimateSize: () => 112,
		getScrollElement: () => scroll_container,
		overscan: 4,
	});

	let virtual_rows = $derived($row_virtualizer.getVirtualItems());
	let total_virtual_size = $derived($row_virtualizer.getTotalSize());

	$effect(() => {
		const virtualizer = $row_virtualizer;

		if (virtualizer.options.count == table_rows.length) return;

		virtualizer.setOptions({
			...virtualizer.options,
			count: table_rows.length,
		});
	});
</script>

<div class="flex flex-1 flex-col overflow-hidden md:hidden" data-slot="items-table">
	<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div bind:this={scroll_container} class="flex-1 overflow-x-hidden overflow-y-auto">
			{#if table_rows.length > 0}
				<div class="relative w-full" style="height: {total_virtual_size}px;">
					{#each virtual_rows as virtual_row (virtual_row.key)}
						{@const row = table_rows[virtual_row.index]}

						{#if row}
							<div
								class="absolute top-0 left-0 flex w-full flex-col border-b border-border/50"
								style="height: {virtual_row.size}px; transform: translateY({virtual_row.start}px);"
							>
								<MobileBundleTableRow {row} />
							</div>
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
