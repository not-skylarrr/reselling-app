import { and, eq, inArray, sql, lt } from "drizzle-orm";
import { db } from "../db";
import { item_listings, items } from "../db/schema";

export async function InvalidateExpiredListings() {
	// Expire all active but expired listings
	const expired_listings = await db
		.update(item_listings)
		.set({ status: "expired", ended_at: sql`${item_listings.expires_at}` })
		.where(and(eq(item_listings.status, "active"), lt(item_listings.expires_at, new Date())))
		.returning();

	// Get all items that had a listing expired
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

	// Check which items will now be classed as unlisted when no other active listing is found
	const items_to_update = affected_items
		.filter((item) => {
			const active_listings = item.listings;

			if (active_listings.length == 0 && item.status == "listed") {
				return true;
			}

			return false;
		})
		.map((item) => item.id);

	// Update the items that need to be marked unlisted
	await db.update(items).set({ status: "unlisted" }).where(inArray(items.id, items_to_update));

	const items_per_workspace = new Map<string, string[]>();

	for (const item of affected_items) {
		if (items_per_workspace.has(item.workspace_id)) {
			items_per_workspace.get(item.workspace_id)!.push(item.id);
		} else {
			items_per_workspace.set(item.workspace_id, [item.id]);
		}
	}

	for (const [workspace_id, refreshed_item_ids] of items_per_workspace.entries()) {
		// Send notification to the workspace with the affected items
	}
}
