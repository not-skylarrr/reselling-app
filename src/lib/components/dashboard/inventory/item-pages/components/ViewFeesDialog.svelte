<script lang="ts">
	import { ItemFeesCollection } from "$lib/collections/def.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger,
	} from "$lib/components/ui/collapsible";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { Separator } from "$lib/components/ui/separator";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
	import type { Item, ItemFee, ItemFeeType, ItemListing } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import {
		LucideBuilding,
		LucideChevronDown,
		LucideCircleUser,
		LucideIterationCw,
		LucidePlus,
		LucideX,
	} from "@lucide/svelte";
	import type { Snippet } from "svelte";

	type Props = {
		item: Item;
		type: ItemFeeType;
		fees: ItemFee[];
		title: string;
		trigger: Snippet<[{ props: Record<string, any> }]>;
	};

	let { fees, item, title, trigger, type }: Props = $props();
</script>

<Dialog>
	<DialogTrigger child={trigger} />
	<DialogContent class="flex max-h-180 flex-col gap-8 sm:max-w-xl" showCloseButton={false}>
		<div class="flex flex-row items-center gap-3">
			<DialogHeader class="flex-1">
				<DialogTitle>{title}</DialogTitle>
				<DialogDescription>Explore the fees link to this item</DialogDescription>
			</DialogHeader>

			<Button
				onclick={() => OpenItemDialog(item, "add-fee", { type, listing_id: null })}
				size="sm"
				variant="outline"><LucidePlus /> Add New Fee</Button
			>
		</div>

		<ScrollArea class="flex-1 overflow-hidden">
			<div class="flex flex-col gap-6">
				{#each fees as fee (fee.id)}
					<div class="grid grid-cols-[2fr_1fr_1fr] items-center gap-3">
						<div class="grid">
							<p class="text-sm font-medium">{fee.reference_name}</p>
							<p class="line-clamp-1 truncate text-xs text-muted-foreground">
								{fee.removed
									? `Removed: ${fee.removal_reason ?? "No Reason Provided"}`
									: fee.reference_details}
							</p>
						</div>

						<Select
							disabled={fee.removed ?? false}
							type="single"
							onValueChange={(val) => {
								ItemFeesCollection.update(fee.id, (draft) => {
									draft.buyer_paid = val == "buyer_paid";
								});
							}}
							value={fee.buyer_paid ? "buyer_paid" : "seller_paid"}
						>
							<SelectTrigger class="w-full" size="sm">
								{#if fee.buyer_paid}
									Buyer Paid
								{:else}
									Seller Paid
								{/if}
							</SelectTrigger>
							<SelectContent align="end">
								<SelectItem value="buyer_paid">Buyer Paid</SelectItem>
								<SelectItem value="seller_paid">Seller Paid</SelectItem>
							</SelectContent>
						</Select>

						<div class="flex flex-row items-center justify-end gap-2">
							<UpdateItemPriceInput
								class={cn(
									fee.buyer_paid && "text-muted-foreground",
									fee.removed && "text-muted-foreground line-through",
								)}
								label="Update Fee Amount"
								price={fee.amount}
								onPriceChange={(val) => {
									ItemFeesCollection.update(fee.id, (draft) => {
										draft.amount = val;
									});
								}}
							/>

							{#if fee.removed}
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<Button
												{...props}
												onclick={() => {
													ItemFeesCollection.update(fee.id, (draft) => {
														draft.removed = false;
														draft.removal_reason = null;
													});
												}}
												size="icon-xs"
												variant="outline"
											>
												<LucideIterationCw />
											</Button>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>Reinstate Fee</TooltipContent>
								</Tooltip>
							{:else}
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<Button
												{...props}
												onclick={() => {
													ItemFeesCollection.update(fee.id, (draft) => {
														draft.removed = true;
													});
												}}
												size="icon-xs"
												variant="destructive"
											>
												<LucideX />
											</Button>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent>Remove Fee</TooltipContent>
								</Tooltip>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</ScrollArea>
	</DialogContent>
</Dialog>
