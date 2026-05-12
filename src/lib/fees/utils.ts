import type { ItemFeeType } from "$lib/server/db/schema";

export const FeeTypeFriendlyNames: { [K in ItemFeeType]: string } = {
	listing_fee: "Listing Fee",
	final_fee: "Final Fee",
	postage_fee: "Postage Cost",
	refunded_amount: "Refund",
	custom: "Other",
};

export const GetFeeTypeFriendlyName = (key: ItemFeeType) => {
	return FeeTypeFriendlyNames[key];
};
