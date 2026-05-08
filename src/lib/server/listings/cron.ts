import { and, eq, inArray, sql, lt } from "drizzle-orm";
import { db } from "../db";
import { item_listings, items } from "../db/schema";

export async function InvalidateExpiredListings() {
	const expired_listings = await db
		.update(item_listings)
		.set({ status: "expired", ended_at: sql`${item_listings.expires_at}` })
		.where(and(eq(item_listings.status, "active"), lt(item_listings.expires_at, new Date())))
		.returning();

	const affected_items = await db.query.items.findMany({
		where: (table, ops) =>
			ops.inArray(
				table.id,
				expired_listings.map((listing) => listing.id),
			),
		with: {
			listings: {
				where: (table, ops) => ops.eq(table.status, "active"),
			},
		},
	});

	const items_to_update = affected_items
		.filter((item) => {
			const active_listings = item.listings;

			if (active_listings.length == 0 && item.status == "listed") {
				return true;
			}

			return false;
		})
		.map((item) => item.id);

	await db.update(items).set({ status: "unlisted" }).where(inArray(items.id, items_to_update));
}
