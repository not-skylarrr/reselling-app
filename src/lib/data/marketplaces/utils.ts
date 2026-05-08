import { AVAILABLE_MARKETPLACES } from "./data";

export function GetMarketplaceData(marketplace_id: string) {
	const marketplace = AVAILABLE_MARKETPLACES.find((m) => m.id == marketplace_id);
	if (!marketplace) throw new Error("Invalid marketplace id");

	return marketplace;
}
