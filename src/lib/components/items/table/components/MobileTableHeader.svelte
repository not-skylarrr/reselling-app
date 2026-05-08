<script lang="ts">
	import type { InventoryItemData } from "$lib/collections/query-collections";
	import { Button } from "$lib/components/ui/button";
	import { InputGroup, InputGroupAddon, InputGroupInput } from "$lib/components/ui/input-group";
	import { LucidePlus, LucideSearch } from "@lucide/svelte";
	import type { Table } from "@tanstack/svelte-table";
	import { OpenNewItemDialog } from "../../dialogs/dialog-state.svelte";
	import { GetTableContext } from "$lib/table/init.svelte";
	import type { FullItem } from "$lib/server/db/schema";

	type Props = {
		table: Table<FullItem>;
	};

	let { table }: Props = $props();

	const table_state = GetTableContext();

	let search_query = $state("");

	function HandleQueryChange(query: string) {
		if (query.length > 0) {
			if (table_state.DoesFilterExist("name-search")) {
				table_state.UpdateFilterByKey("name-search", { value: query });
			} else {
				table_state.AddFilter({
					id: "name",
					key: "name-search",
					value: { operator: "includes", value: query },
				});
			}
		} else {
			if (table_state.DoesFilterExist("name-search")) {
				table_state.RemoveFilterByKey("name-search");
			}
		}

		search_query = query;
	}
</script>

<div class="flex h-16 flex-row items-center gap-2 border-b px-2">
	<InputGroup>
		<InputGroupAddon>
			<LucideSearch />
		</InputGroupAddon>
		<InputGroupInput
			oninput={(ev) => HandleQueryChange(ev.currentTarget.value)}
			placeholder="Search Items..."
			value={search_query}
		/>
	</InputGroup>

	<Button onclick={() => OpenNewItemDialog()} size="icon">
		<LucidePlus />
	</Button>
</div>
