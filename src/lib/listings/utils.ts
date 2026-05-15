import type { ItemListing, ItemListingStatus } from "$lib/server/db/schema";
import { FormatDateStd } from "$lib/utils/formatting";
import { formatDistanceStrict } from "date-fns";

export const ListingStatusFriendlyNames: { [K in ItemListingStatus]: string } = {
	sold: "Sale Completed",
	active: "Active",
	expired: "Expired",
	cancelled: "Cancelled",
};

export function GetListingStatusFriendlyName(status: ItemListingStatus) {
	return ListingStatusFriendlyNames[status];
}

export function GetListingDurationString(listing: ItemListing) {
	let start_date = listing.created_at;
	let end_date = listing.expires_at;

	if (listing.ended_at) {
		end_date = listing.ended_at;
	}

	if (end_date == null) return `${FormatDateStd(start_date)} - Unknown`;

	return `${FormatDateStd(start_date)} - ${FormatDateStd(end_date)}`;
}

export function GetListingExpiryString(listing: ItemListing) {
	if (listing.expires_at == null) return "No expiry date";

	return `Ends ${formatDistanceStrict(listing.expires_at, new Date(), {
		addSuffix: true,
	})}`;
}
