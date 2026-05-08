import { item_status_validator } from "$lib/server/db/schema";
import z from "zod";

const legacy_item_schema = z.object({
	id: z.string(),
	name: z.string(),
	status: item_status_validator,
	workspace_id: z.string(),
	target_sale_price: z.number().nullish().default(0),
	purchase_price: z.number().nullish().default(0),
	list_price: z.number().nullish().default(0),
	sale_price: z.number().nullish().default(0),
	listing_fees: z.number().nullish().default(0),
	listing_fees_by_marketplace: z.record(z.string(), z.number()),
	final_fees: z.number().nullish().default(0),
	postage_price: z.number().nullish().default(0),
	refunded_amount: z.number().nullish().default(0),
	buyer_paid_postage: z.boolean(),
	refund_type: z.string().nullish(),
	refund_reason: z.string().nullish(),
	purchased_at: z.coerce.date(),
	listed_at: z.coerce.date().nullish(),
	sold_at: z.coerce.date().nullish(),
	posted_at: z.coerce.date().nullish(),
	refunded_at: z.coerce.date().nullish(),
	completed_at: z.coerce.date().nullish(),
	added_at: z.coerce.date().nullish(),
	labels: z.array(z.string()),
	marketplaces: z.array(z.string()),
	storage_location: z.string().nullable(),
});

type ImportLegacyItemOptions = {
	bundle_id_map: Map<string, string>;
	label_id_map: Map<string, string>;
	location_id_map: Map<string, string>;
};

export function ImportLegacyItem(item: object) {
	const parsed_item = legacy_item_schema.safeParse(item);
	if (!parsed_item.success) throw new Error("Invalid item shape");
}
