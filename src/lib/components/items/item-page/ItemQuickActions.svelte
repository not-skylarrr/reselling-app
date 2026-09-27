<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import {
		LucideArchive,
		LucideArchiveRestore,
		LucideChevronDown,
		LucideDollarSign,
		LucideList,
		LucidePlus,
	} from "@lucide/svelte";
	import { OpenItemDialog } from "../dialogs/dialog-state.svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	const has_primary_actions = $derived(item.status_int < 2);

	function HandleCreateListing() {
		OpenItemDialog(item, "list");
	}

	function HandleViewListings() {
		OpenItemDialog(item, "listing-history");
	}

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
		{#if item.status_int < 2}
			<DropdownMenuItem onSelect={() => HandleCreateListing()}
				><LucidePlus /> Create Listing</DropdownMenuItem
			>

			<DropdownMenuSeparator />
		{/if}

		{#if item.status == "listed"}
			<DropdownMenuItem onSelect={() => HandleMarkAsSold()}
				><LucideDollarSign /> Mark as Sold</DropdownMenuItem
			>

			<DropdownMenuItem onSelect={() => HandleViewListings()}
				><LucideList /> View Listings</DropdownMenuItem
			>

			<DropdownMenuSeparator />
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
