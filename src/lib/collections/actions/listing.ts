import {
	ItemFeesCollection,
	ItemsCollection,
	ListingsCollection,
} from "$lib/collections/def.svelte";
import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
import { GetStatusInt } from "$lib/items/utils";
import { FormatDateStd } from "$lib/utils/formatting";
import { session_state } from "$lib/utils/session.svelte";
import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
import { GenerateQuickId } from "$lib/utils/web-crypto";
import { and, createTransaction, eq, inArray, queryOnce } from "@tanstack/svelte-db";

type ListItemOptions = {
	listings: NewListingConfig[];
};

export type NewListingConfig = {
	marketplace_id: string;
	list_price: number;
	listing_fee: number;
	duration_ms: number | null;
};

export function ListItem(item_id: string, options: ListItemOptions) {
	ItemsCollection.update(item_id, (item) => {
		item.status = "listed";
		item.status_int = GetStatusInt("listed");
	});

	for (const listing of options.listings) {
		const listing_id = GenerateQuickId();

		ListingsCollection.insert({
			id: listing_id,
			item_id: item_id,
			workspace_id: session_state.workspace_id,
			status: "active",
			price: listing.list_price,
			marketplace_id: listing.marketplace_id,
			notes: null,
			reference_url: null,
			created_at: new Date(),
			expires_at:
				listing.duration_ms == null ? null : new Date(Date.now() + listing.duration_ms),
			ended_at: null,
		});

		const marketplace_data = GetMarketplaceData(listing.marketplace_id);

		ItemFeesCollection.insert({
			id: GenerateQuickId(),
			item_id: item_id,
			listing_id: listing_id,
			workspace_id: session_state.workspace_id,
			type: "listing_fee",
			amount: listing.listing_fee,
			buyer_paid: false,
			marketplace_id: listing.marketplace_id,
			reference_name: "Marketplace Listing Fee",
			reference_details: `${marketplace_data.name}: ${FormatDateStd(new Date())}`,
			created_at: new Date(),
			removed: false,
			removal_reason: null,
		});
	}
}

export async function EndListing(listing_id: string, item_id: string) {
	ListingsCollection.update(listing_id, (listing) => {
		listing.status = "cancelled";
		listing.ended_at = new Date();
	});

	const active_listings = await queryOnce((q) =>
		q
			.from({ listing: ListingsCollection })
			.where(({ listing }) => and(eq(listing.item_id, item_id), eq(listing.status, "active"))),
	);

	if (active_listings.length == 0) {
		ItemsCollection.update(item_id, (item) => {
			item.status = "unlisted";
		});
	}
}

type MarkListingSoldOptions = {
	marketplace_id: string;
	sale_price: number;
	sale_fee: number;
	postage_cost: number;
	buyer_paid_postage: boolean;
};

export async function MarkListingSold(
	listing_id: string,
	item_id: string,
	{
		marketplace_id,
		sale_price,
		sale_fee,
		postage_cost,
		buyer_paid_postage,
	}: MarkListingSoldOptions,
) {
	const active_listings = await queryOnce((q) =>
		q
			.from({ listing: ListingsCollection })
			.where(({ listing }) => and(eq(listing.item_id, item_id), eq(listing.status, "active"))),
	);

	ItemsCollection.update(item_id, (item) => {
		item.status = "sold";
	});

	ListingsCollection.update(listing_id, (listing) => {
		listing.status = "sold";
		listing.price = sale_price;
		listing.ended_at = new Date();
	});

	ItemFeesCollection.insert({
		id: GenerateQuickId(),
		item_id: item_id,
		listing_id: listing_id,
		workspace_id: session_state.workspace_id,
		type: "final_fee",
		amount: sale_fee,
		buyer_paid: false,
		marketplace_id: marketplace_id,
		reference_name: "Final Sale Fees",
		reference_details: "Automatically generated",
		created_at: new Date(),
		removed: false,
		removal_reason: null,
	});

	ItemFeesCollection.insert({
		id: GenerateQuickId(),
		item_id: item_id,
		listing_id: listing_id,
		workspace_id: session_state.workspace_id,
		type: "postage_fee",
		amount: postage_cost,
		buyer_paid: buyer_paid_postage,
		marketplace_id: marketplace_id,
		reference_name: "Postage Cost",
		reference_details: "Automatically generated",
		created_at: new Date(),
		removed: false,
		removal_reason: null,
	});

	for (const listing of active_listings) {
		if (listing.id == listing_id) continue;

		ListingsCollection.update(listing.id, (listing) => {
			listing.status = "cancelled";
			listing.ended_at = new Date();
		});
	}
}

export async function SyncItemStatus(item_id: string) {
	const item_listings = await queryOnce((q) =>
		q
			.from({ listing: ListingsCollection })
			.where(({ listing }) =>
				and(eq(listing.item_id, item_id), inArray(listing.status, ["active", "sold"])),
			),
	);

	if (item_listings.length == 0) {
		ItemsCollection.update(item_id, (item) => {
			item.status = "unlisted";
		});

		return;
	}

	const sold_listing = item_listings.find((l) => l.status == "sold");

	if (sold_listing) {
		ItemsCollection.update(item_id, (item) => {
			item.status = "sold";
		});

		return;
	}

	ItemsCollection.update(item_id, (item) => {
		item.status = "listed";
	});
}
