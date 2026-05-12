import type { Item, ItemFee, ItemListing, ItemStatus } from "$lib/server/db/schema";
import {
	LucideBadgeAlert,
	LucideBan,
	LucideMessageSquareWarning,
	LucidePackageX,
} from "@lucide/svelte";
import type { Component } from "svelte";

export const ItemStatusOrder: ItemStatus[] = ["unlisted", "listed", "sold", "refunded"];

export function GetStatusIndex(status: ItemStatus) {
	return ItemStatusOrder.indexOf(status);
}

export function GetStatusInt(status: ItemStatus) {
	return GetStatusIndex(status);
}

const StatusFriendlyNames: { [K in ItemStatus]: string } = {
	unlisted: "Unlisted",
	listed: "Listed",
	sold: "Sold",
	refunded: "Refunded",
};

export function GetStatusFriendlyName(status: ItemStatus) {
	return StatusFriendlyNames[status];
}

export const StatusForegroundColourClasses: { [K in ItemStatus]: string } = {
	unlisted: "text-foreground",
	listed: "text-indigo-400",
	sold: "text-cyan-500",
	refunded: "text-destructive",
};

export function GetStatusForegroundColour(status: ItemStatus) {
	return StatusForegroundColourClasses[status];
}

export const StatusBackgroundColourClasses: { [K in ItemStatus]: string } = {
	unlisted: "bg-muted dark:bg-muted/50",
	listed: "bg-indigo-400/10",
	sold: "bg-cyan-500/10",
	refunded: "bg-destructive/10",
};

export function GetStatusBackgroundColour(status: ItemStatus) {
	return StatusBackgroundColourClasses[status];
}

type ProfitCalculationOptions = {
	item: Item;
	fees: ItemFee[];
	listings: ItemListing[];
};

export function CalculateItemProfit({
	item,
	fees,
	listings,
}: ProfitCalculationOptions): number | null {
	const sold_listing = listings.find((l) => l.status == "sold");
	if (!sold_listing) return null;

	const total_fees = fees.reduce((total, fee) => {
		if (fee.buyer_paid || fee.removed) return total;

		return total + fee.amount;
	}, 0);

	return sold_listing.price - item.purchase_price - total_fees;
}

export function CalculateTotalFees(fees: ItemFee[]) {
	return fees.reduce((total, fee) => {
		if (fee.buyer_paid) return total;

		return total + fee.amount;
	}, 0);
}

export function CalculateFeesByType(fees: ItemFee[]) {
	let listing_fees = 0;
	let final_fees = 0;
	let postage_fees = 0;
	let refund_fees = 0;
	let other_fees = 0;

	for (const fee of fees) {
		if (fee.buyer_paid) continue;

		switch (fee.type) {
			case "listing_fee":
				listing_fees += fee.amount;
				break;

			case "final_fee":
				final_fees += fee.amount;
				break;

			case "postage_fee":
				postage_fees += fee.amount;
				break;

			case "refunded_amount":
				refund_fees += fee.amount;
				break;

			case "custom":
				other_fees += fee.amount;
				break;
		}
	}

	return { listing_fees, final_fees, postage_fees, other_fees, refund_fees };
}

export const RefundTypeFriendlyNames: Record<string, string> = {
	ITEM_DAMAGED: "Item Damaged",
	NOT_AS_DESCRIBED: "Item Not As Described",
	ORDER_CANCELLED: "Order Cancelled",
	CUSTOM: "Other Issue",
};

export const RefundTypeIcons: Record<string, Component<any>> = {
	ITEM_DAMAGED: LucidePackageX,
	NOT_AS_DESCRIBED: LucideBadgeAlert,
	ORDER_CANCELLED: LucideBan,
	CUSTOM: LucideMessageSquareWarning,
};

export function GetRefundTypeFriendlyName(type: string) {
	if (type in RefundTypeFriendlyNames) {
		return RefundTypeFriendlyNames[type];
	}

	return type;
}
