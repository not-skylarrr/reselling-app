import type { ItemFeeType } from "$lib/server/db/schema";

export const FeeTypeFriendlyNames: { [K in ItemFeeType]: string } = {
	listing_fee: "Listing Fee",
	final_fee: "Final Fee",
	postage_fee: "Postage Cost",
	refunded_amount: "Refunded Balance",
	custom: "Other",
};

export const GetFeeTypeFriendlyName = (key: string, fallback?: string) => {
	if (key in FeeTypeFriendlyNames) {
		return FeeTypeFriendlyNames[key as ItemFeeType];
	}

	if (fallback) return fallback;

	return "Other";
};
