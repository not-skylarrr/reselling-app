import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import {
	pgTable,
	text,
	real,
	timestamp,
	json,
	boolean,
	integer,
	pgTableCreator,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

export const workspace_configs = pgTable("workspace_configs", {
	id: text("id").primaryKey(),
});

export const item_status_validator = z.union([
	z.literal("refunded"),
	z.literal("sold"),
	z.literal("listed"),
	z.literal("unlisted"),
]);

export type ItemStatus = z.Infer<typeof item_status_validator>;

export const items = pgTable("items", {
	// Core
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	status: text("status").notNull().$type<ItemStatus>(),
	status_int: integer("status_int").notNull(),
	workspace_id: text("workspace_id").notNull(),

	// Dates
	added_at: timestamp("added_at").notNull().defaultNow(),
	purchased_at: timestamp("purchased_at").notNull(),

	// Pricing
	purchase_price: real("purchase_price").notNull(),
	target_sale_price: real("target_sale_price").notNull(),

	// Metadata
	storage_location: text("storage_location"),
	refund_type: text("refund_type"),
	refund_reason: text("refund_reason"),
});

export const new_item_schema = createInsertSchema(items, {
	status: item_status_validator,
	storage_location: z.string().nullable(),
}).pick({
	id: true,
	name: true,
	status: true,
	status_int: true,
	purchased_at: true,
	purchase_price: true,
	target_sale_price: true,
	storage_location: true,
	refund_type: true,
	refund_reason: true,
});

export const update_item_schema = createUpdateSchema(items, {
	status: item_status_validator,
	storage_location: z.string().nullable(),
}).pick({
	name: true,
	status: true,
	status_int: true,
	purchased_at: true,
	purchase_price: true,
	target_sale_price: true,
	storage_location: true,
	refund_type: true,
	refund_reason: true,
});

export type NewItem = z.infer<typeof new_item_schema>;

export const items_relations = relations(items, ({ many }) => ({
	listings: many(item_listings),
	listing_fees: many(item_fees),
}));

export type Item = InferSelectModel<typeof items>;

export type ItemWithLabels = Item & {
	labels: WorkspaceLabel[];
};

export type FullItem = ItemWithLabels & {
	listings: ItemListing[];
	fees: ItemFee[];
};

export const item_listing_status_schema = z.union([
	z.literal("active"),
	z.literal("expired"),
	z.literal("cancelled"),
	z.literal("sold"),
]);

export type ItemListingStatus = z.infer<typeof item_listing_status_schema>;

export const item_listings = pgTable("item_listings", {
	id: text("id").primaryKey(),
	item_id: text("item_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
	status: text("status").notNull().$type<ItemListingStatus>(),
	price: real("price").notNull(),
	marketplace_id: text("marketplace_id").notNull(),
	notes: text("notes"),
	reference_url: text("reference_url"),
	created_at: timestamp("created_at").notNull(),
	expires_at: timestamp("expires_at"),
	ended_at: timestamp("ended_at"),
});

export const new_listing_schema = createInsertSchema(item_listings, {
	status: item_listing_status_schema,
});

export const update_listing_schema = createUpdateSchema(item_listings, {
	status: item_listing_status_schema,
}).pick({
	status: true,
	marketplace_id: true,
	price: true,
	notes: true,
	reference_url: true,
	expires_at: true,
	ended_at: true,
});

export const item_listing_relations = relations(item_listings, ({ one, many }) => ({
	item: one(items, {
		fields: [item_listings.item_id],
		references: [items.id],
	}),
	fees: many(item_fees),
}));

export type NewItemListing = InferInsertModel<typeof item_listings>;
export type ItemListing = InferSelectModel<typeof item_listings>;

export const item_fee_type_schema = z.union([
	z.literal("listing_fee"),
	z.literal("final_fee"),
	z.literal("postage_fee"),
	z.literal("refunded_amount"),
	z.literal("custom"),
]);

export type ItemFeeType = z.infer<typeof item_fee_type_schema>;

export const item_fees = pgTable("item_fees", {
	id: text("id").primaryKey(),
	item_id: text("item_id").notNull(),
	listing_id: text("listing_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
	type: text("type").notNull().$type<ItemFeeType>(),
	reference_name: text("ref_name").notNull(),
	reference_details: text("ref_details").notNull(),
	amount: real("amount").notNull(),
	buyer_paid: boolean("buyer_paid").notNull().default(false),
	marketplace_id: text("marketplace_id"),
	created_at: timestamp("created_at").notNull(),
});

export const new_item_fee_schema = createInsertSchema(item_fees, {
	type: item_fee_type_schema,
});

export const update_item_fee_schema = createUpdateSchema(item_fees, {
	type: item_fee_type_schema,
}).pick({
	type: true,
	reference_name: true,
	reference_details: true,
	amount: true,
	buyer_paid: true,
	marketplace_id: true,
});

export type ItemFee = InferSelectModel<typeof item_fees>;

export const item_fees_relations = relations(item_fees, ({ one }) => ({
	listing: one(item_listings, {
		fields: [item_fees.listing_id],
		references: [item_listings.id],
	}),
	item: one(items, {
		fields: [item_fees.item_id],
		references: [items.id],
	}),
}));

export const workspace_labels = pgTable("workspace_labels", {
	id: text("id").primaryKey(),
	workspace_id: text("workspace_id").notNull(),
	content: text("content").notNull(),
	colour: text("colour").notNull(),
	created_at: timestamp("created_at").notNull(),
});

export const new_label_schema = createInsertSchema(workspace_labels);

export const update_label_schema = createUpdateSchema(workspace_labels, {
	content: z.string().min(1, "Label name cannot be empty"),
}).pick({
	content: true,
	colour: true,
});

export type WorkspaceLabel = InferSelectModel<typeof workspace_labels>;
export type UpdateWorkspaceLabel = z.infer<typeof update_label_schema>;

export const label_join_table = pgTable("label_join_table", {
	id: text("id").primaryKey(),
	item_id: text("item_id").notNull(),
	label_id: text("label_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
});

export const new_label_join_schema = createInsertSchema(label_join_table);
export const update_label_join_schema = createUpdateSchema(label_join_table).pick({
	label_id: true,
});

export type LabelJoin = InferSelectModel<typeof label_join_table>;

export const workspace_locations = pgTable("workspace_locations", {
	id: text("id").primaryKey(),
	workspace_id: text("workspace_id").notNull(),
	name: text("name").notNull(),
	colour: text("colour").notNull(),
	created_at: timestamp("created_at").notNull(),
});

export const new_location_schema = createInsertSchema(workspace_locations);

export const update_location_schema = createUpdateSchema(workspace_locations).pick({
	name: true,
	colour: true,
});

export type WorkspaceLocation = InferSelectModel<typeof workspace_locations>;
export type UpdateWorkspaceLocation = z.infer<typeof update_location_schema>;

export const item_bundles = pgTable("item-bundles", {
	id: text("id").primaryKey(),
	workspace_id: text("workspace_id").notNull(),
	name: text("name").notNull(),
	completed_price: real("completed_price").notNull(),
	created_at: timestamp("created_at").notNull(),
});

export const new_item_bundle_schema = createInsertSchema(item_bundles);
export const update_item_bundle_schema = createUpdateSchema(item_bundles).pick({
	name: true,
	completed_price: true,
});

export type ItemBundle = InferSelectModel<typeof item_bundles>;
export type UpdateItemBundle = z.infer<typeof update_item_bundle_schema>;

export const bundle_items = pgTable("bundle-item", {
	id: text("id").primaryKey(),
	bundle_id: text("bundle_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
	name: text("name").notNull(),
	price: real("price").notNull(),
	parent_id: text("parent_id"),
});

export const new_bundle_item_schema = createInsertSchema(bundle_items);
export const update_bundle_item_schema = createUpdateSchema(bundle_items).pick({
	name: true,
	price: true,
	parent_id: true,
});

export type BundleItem = InferSelectModel<typeof bundle_items>;
export type UpdateBundleItem = z.infer<typeof update_bundle_item_schema>;

export const item_association_type_schema = z.union([
	// Links an item to a bundle item
	z.literal("bundle-item"),
	// Links an item to a completed bundle in the inventory
	z.literal("inclusion-ref"),
	// Links an item arbitrarily
	z.literal("misc-item-ref"),
]);

export type ItemAssociationType = z.infer<typeof item_association_type_schema>;

export const item_associations = pgTable("item-associations", {
	id: text("id").primaryKey(),
	type: text("type").notNull().$type<ItemAssociationType>(),
	item_id: text("item_id").notNull(),
	subject_id: text("subject_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
});

export const new_item_association_schema = createInsertSchema(item_associations, {
	type: item_association_type_schema,
});
export const update_item_association_schema = createUpdateSchema(item_associations, {
	type: item_association_type_schema,
}).pick({
	type: true,
	subject_id: true,
});

export type ItemAssociation = InferSelectModel<typeof item_associations>;

export * from "./auth.schema";
