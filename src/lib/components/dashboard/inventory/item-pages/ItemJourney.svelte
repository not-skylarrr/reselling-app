<script lang="ts">
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { GetListingExpiryString } from "$lib/listings/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import { FormatDateStd } from "$lib/utils/formatting";
	import {
		LucideBadgeDollarSign,
		LucideBadgeInfo,
		LucideBadgeMinus,
		LucideBadgePlus,
		LucideBadgeX,
		LucideIterationCw,
		LucideShoppingBasket,
	} from "@lucide/svelte";
	import type { Component } from "svelte";
	import { flip } from "svelte/animate";

	type Props = {
		class?: string;
		item: FullItem;
	};

	let { class: class_name, item }: Props = $props();

	type EventData = {
		id: string;
		date: Date;
		type: string;
		title: string;
		description: string;
	};

	const event_icons: Record<string, { icon: Component<any>; class?: string }> = {
		purchase: { icon: LucideShoppingBasket },
		"listing-created": { icon: LucideBadgePlus, class: "stroke-info" },
		"listing-expired": { icon: LucideBadgeMinus, class: "stroke-warning" },
		"listing-cancelled": { icon: LucideBadgeX, class: "stroke-destructive" },
		"item-sold": {
			icon: LucideBadgeDollarSign,
			class: "stroke-success",
		},
		"item-refunded": {
			icon: LucideIterationCw,
			class: "stroke-destructive",
		},
	};

	const item_events = $derived.by(() => {
		const events: EventData[] = [];

		events.push({
			id: `purchase:${item.id}`,
			date: item.purchased_at,
			type: "purchase",
			title: "Item Purchased",
			description: "Item purchased and registered",
		});

		if (item.status == "refunded") {
			events.push({
				id: `refund:${item.id}`,
				date: item.refunded_at ?? new Date(),
				type: "item-refunded",
				title: "Item Refunded",
				description: "The item was refunded",
			});
		}

		for (const listing of item.listings) {
			const marketplace = GetMarketplaceData(listing.marketplace_id);

			events.push({
				id: `listing:create:${listing.id}`,
				date: listing.created_at,
				type: "listing-created",
				title: "Listing Created",
				description: `${marketplace.name} - ${GetListingExpiryString(listing)}`,
			});

			if (listing.ended_at) {
				if (listing.status == "sold") {
					events.push({
						id: `listing:sold:${listing.id}`,
						date: listing.ended_at,
						type: "item-sold",
						title: "Item Sold",
						description: "The item was sold to a buyer",
					});
				}

				if (listing.status == "expired") {
					events.push({
						id: `listing:expired:${listing.id}`,
						date: listing.ended_at,
						type: "listing-expired",
						title: "Listing Expired",
						description: "The listing expired",
					});
				}

				if (listing.status == "cancelled") {
					events.push({
						id: `listing:cancelled:${listing.id}`,
						date: listing.ended_at,
						type: "listing-cancelled",
						title: "Listing Cancelled",
						description: "The listing cancelled",
					});
				}
			}
		}

		let sale_date_ts: number | null = null;

		const filtered_events = events
			.sort((a, b) => a.date.getTime() - b.date.getTime())
			.filter((event) => {
				if (event.type == "item-sold") {
					sale_date_ts = event.date.getTime();
				}

				if (event.type == "listing-cancelled" && sale_date_ts != null) return false;

				return true;
			});

		return filtered_events.reverse();
	});
</script>

<div class="flex w-full justify-center">
	<div class="flex w-full max-w-3xl flex-col gap-4 px-3 py-6">
		<p class="px-4 text-lg font-medium">Item Timeline</p>

		<ScrollArea class="flex-1 overflow-hidden">
			<div class="flex flex-col gap-2">
				{#each item_events as event (event.id)}
					{@const EventIcon = event_icons[event.type]}

					<div
						class="flex flex-row items-center gap-8 px-4 py-2"
						animate:flip={{ duration: 500 }}
					>
						<div class="flex flex-1 flex-row gap-3">
							{#if EventIcon}
								<EventIcon.icon
									class={cn("mt-0.5 size-4 stroke-muted-foreground", EventIcon.class)}
								/>
							{:else}
								<LucideBadgeInfo class="size-4 stroke-muted-foreground" />
							{/if}

							<div class="grid">
								<p class="text-sm font-medium">{event.title}</p>
								<p class="text-xs text-muted-foreground">{event.description}</p>
							</div>
						</div>

						<p class="text-xs text-muted-foreground">{FormatDateStd(event.date)}</p>
					</div>
				{/each}
			</div>
		</ScrollArea>
	</div>
</div>
