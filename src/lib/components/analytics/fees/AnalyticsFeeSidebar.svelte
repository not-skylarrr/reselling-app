<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Item, ItemContent, ItemTitle, ItemActions } from "$lib/components/ui/item";
	import type { Item as DbItem, ItemFee } from "$lib/server/db/schema";
	import { LucideCopy, LucidePencil, LucideTrash, LucideExternalLink } from "@lucide/svelte";
	import { slide } from "svelte/transition";

	type Props = {
		open: boolean;
		data:
			| {
					fee: ItemFee;
					item: DbItem;
			  }
			| undefined;
	};

	let { data, open }: Props = $props();
</script>

{#if open && data}
	<div
		class="z-50 hidden overflow-hidden shadow-lg will-change-transform md:block"
		transition:slide={{ axis: "x" }}
	>
		<div class="flex h-full w-84 shrink-0 flex-col gap-1 divide-y border-l">
			<div class="flex min-h-23 shrink-0 flex-col justify-between gap-3 border-b px-4 py-3.5">
				<div class="flex shrink-0 flex-row items-center text-base">
					<p class="font-medium">{data.item.name}</p>
				</div>

				<div class="flex flex-row items-center justify-between gap-3">
					<div class="flex flex-row items-center gap-1.5">
						<Button size="icon-xs" variant="outline"><LucideCopy /></Button>
						<Button size="icon-xs" variant="outline"><LucidePencil /></Button>
					</div>
					<div class="flex flex-row items-center gap-1.5">
						<Button class="[&_svg]:stroke-destructive" size="icon-xs" variant="outline"
							><LucideTrash /></Button
						>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-1 px-4 py-2 pr-2">
				<Item class="h-7 flex-nowrap p-0">
					<ItemContent>
						<ItemTitle class="text-sm font-normal text-muted-foreground">Item</ItemTitle>
					</ItemContent>

					<ItemActions>
						<Button
							href={`/dashboard/inventory/items/${data.item.id}`}
							size="xs"
							variant="ghost"
							><LucideExternalLink />
							Item Details
						</Button>
					</ItemActions>
				</Item>
			</div>
		</div>
	</div>
{/if}
