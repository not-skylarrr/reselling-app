<script lang="ts">
	import type { InventoryItemData } from "$lib/collections/query-collections";
	import { Button } from "$lib/components/ui/button";
	import {
		Item,
		ItemContent,
		ItemActions,
		ItemTitle,
		ItemDescription,
	} from "$lib/components/ui/item";
	import type { FullItem, WorkspaceLabel } from "$lib/server/db/schema";
	import {
		LucideCalendar,
		LucideCheck,
		LucideCopy,
		LucideLink,
		LucideArchive,
		LucideTrash,
		LucideReceiptText,
		LucideRotateCw,
	} from "@lucide/svelte";
	import { slide } from "svelte/transition";
	import ItemListings from "./components/ItemListings.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import ItemDetails from "./components/ItemDetails.svelte";
	import { eq, isUndefined, not, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import ItemSaleDetails from "./components/ItemSaleDetails.svelte";
	import { SyncItemStatus } from "$lib/collections/actions/listing";
	import ItemAssociations from "./components/ItemAssociations.svelte";
	import { ItemsWithLabelsCollection } from "$lib/collections/lib/items";

	type Props = {
		item: FullItem | undefined;
		open: boolean;
	};

	let { item, open }: Props = $props();

	function HandleItemDelete() {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description:
				"This item cannot be recovered once deleted.\nIt is recommended to archive items unless deletion is 100% needed.",

			onConfirm: () => {
				if (item) {
					ItemsCollection.delete(item.id);
				}
			},
			action_label: "Delete Item",
		});
	}
</script>

{#if item && open}
	<div class="z-50 hidden overflow-hidden shadow-lg md:block" transition:slide={{ axis: "x" }}>
		<div class="flex h-full w-84 shrink-0 flex-col gap-1 divide-y border-l">
			<div class="flex min-h-23 shrink-0 flex-col justify-between gap-3 border-b px-4 py-3.5">
				<div class="flex shrink-0 flex-row items-center text-base">
					<p class="font-medium">{item.name}</p>
				</div>

				<div class="flex flex-row items-center justify-between gap-3">
					<div class="flex flex-row items-center gap-1.5">
						<Button size="icon-xs" variant="outline"><LucideCopy /></Button>
						<Button
							onclick={() => OpenItemDialog(item, "link")}
							size="icon-xs"
							variant="outline"><LucideLink /></Button
						>
						<Button
							href={`/dashboard/inventory/items/${item.id}`}
							size="icon-xs"
							variant="outline"
						>
							<LucideReceiptText />
						</Button>
					</div>
					<div class="flex flex-row items-center gap-1.5">
						<Button onclick={() => SyncItemStatus(item.id)} size="icon-xs" variant="outline"
							><LucideRotateCw /></Button
						>
						<Button
							class="[&_svg]:stroke-destructive"
							onclick={() => HandleItemDelete()}
							size="icon-xs"
							variant="outline"><LucideTrash /></Button
						>
					</div>
				</div>
			</div>

			<ItemDetails {item} />

			{#if item.status_int > 1}
				<ItemSaleDetails {item} />
			{/if}

			{#if item.status_int < 2}
				<ItemListings {item} />
			{/if}

			<ItemAssociations {item} />
		</div>
	</div>
{/if}
