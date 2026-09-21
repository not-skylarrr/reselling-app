<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import {
		LucideArchive,
		LucideArchiveRestore,
		LucideChevronDown,
		LucideDollarSign,
	} from "@lucide/svelte";
	import { OpenItemDialog } from "../dialogs/dialog-state.svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	function HandleMarkAsSold() {
		OpenItemDialog(item, "sell", { listing_id: undefined });
	}

	function ToggleItemArchived() {
		ItemsCollection.update(item.id, (draft) => {
			draft.archived = !item.archived;
		});
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} class="group"
				>Quick Actions <LucideChevronDown
					class="transition-transform group-data-[state=open]:-rotate-180"
				/></Button
			>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end">
		{#if item.status == "listed"}
			<DropdownMenuItem onSelect={() => HandleMarkAsSold()}
				><LucideDollarSign /> Mark as Sold</DropdownMenuItem
			>
		{/if}

		<DropdownMenuItem onSelect={() => ToggleItemArchived()}>
			{#if item.archived}
				<LucideArchiveRestore /> Restore Item
			{:else}
				<LucideArchive /> Archive Item
			{/if}
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
