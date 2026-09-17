import { relations, type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { pgTable, text, real, timestamp, boolean, integer } from "drizzle-orm/pg-core";
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
	refunded_at: timestamp("refunded_at"),

	archived: boolean("archived").notNull().default(false),
});

export const items_relations = relations(items, ({ one, many }) => ({
	associations: many(item_associations),
	fees: many(item_fees),
	listings: many(item_listings),
}));

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
	refunded_at: true,
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
	refunded_at: true,
	archived: true,
});

export type NewItem = z.infer<typeof new_item_schema>;

export type Item = InferSelectModel<typeof items>;

export type ItemWithLabels = Item & {
	labels: WorkspaceLabel[];
};

export type FullItem = ItemWithLabels & {
	listings: ItemListing[];
	fees: ItemFee[];
	location?: WorkspaceLocation | undefined;
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

export const listings_relations = relations(item_listings, ({ one }) => ({
	item: one(items, {
		fields: [item_listings.item_id],
		references: [items.id],
	}),
}));

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
	listing_id: text("listing_id"),
	workspace_id: text("workspace_id").notNull(),
	type: text("type").notNull().$type<ItemFeeType>(),
	reference_name: text("ref_name").notNull(),
	reference_details: text("ref_details").notNull(),
	amount: real("amount").notNull(),
	buyer_paid: boolean("buyer_paid").notNull().default(false),
	marketplace_id: text("marketplace_id"),
	created_at: timestamp("created_at").notNull(),
	removed: boolean("removed").default(false),
	removal_reason: text("removal_reason"),
});

export const fees_relations = relations(item_fees, ({ one }) => ({
	item: one(items, {
		fields: [item_fees.item_id],
		references: [items.id],
	}),
}));

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
	removed: true,
	removal_reason: true,
});

export type ItemFee = InferSelectModel<typeof item_fees>;

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

const label_join_type_schema = z.union([z.literal("item-label"), z.literal("fee-association")]);

export type LabelJoinType = z.infer<typeof label_join_type_schema>;

export const label_join_table = pgTable("label_join_table", {
	id: text("id").primaryKey(),
	type: text("type").notNull().$type<LabelJoinType>().default("item-label"),
	subject_id: text("subject_id").notNull(),
	label_id: text("label_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
});

export const new_label_join_schema = createInsertSchema(label_join_table, {
	type: label_join_type_schema,
});
export const update_label_join_schema = createUpdateSchema(label_join_table, {
	type: label_join_type_schema,
}).pick({
	label_id: true,
});

export type LabelJoin = InferSelectModel<typeof label_join_table>;

export const item_label_metadata_type_schema = z.union([
	z.literal("string"),
	z.literal("number"),
	z.literal("currency"),
]);

export type ItemMetadataType = z.infer<typeof item_label_metadata_type_schema>;

export const item_metadata_definition = pgTable("item_metadata_definition", {
	id: text("id").primaryKey(),
	workspace_id: text("workspace_id").notNull(),
	type: text("type").notNull().$type<ItemMetadataType>(),
	name: text("name").notNull(),
	required: boolean("required").notNull().default(false),
	created_at: timestamp("created_at").notNull(),
});

export const new_item_metadata_definition_schema = createInsertSchema(
	item_metadata_definition,
	{
		type: item_label_metadata_type_schema,
	},
).omit({ workspace_id: true });

export const update_item_metadata_definition_schema = createUpdateSchema(
	item_metadata_definition,
	{
		type: item_label_metadata_type_schema,
	},
).pick({
	type: true,
	name: true,
	required: true,
});

export type ItemMetadataDefinition = InferSelectModel<typeof item_metadata_definition>;

export const metadata_label_join = pgTable("metadata_label_join", {
	id: text("id").primaryKey(),
	definition_id: text("definition_id").notNull(),
	label_id: text("label_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
	created_at: timestamp("created_at").notNull(),
});

export const new_metadata_label_join_schema = createInsertSchema(metadata_label_join).omit({
	workspace_id: true,
});
export const update_metadata_label_join_schema = createUpdateSchema(metadata_label_join).pick({
	definition_id: true,
	label_id: true,
});

export type MetadataLabelJoin = InferSelectModel<typeof metadata_label_join>;

export const item_metadata = pgTable("item_metadata", {
	id: text("id").primaryKey(),
	item_id: text("item_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
	metadata_id: text("metadata_id").notNull(),
	value_string: text("value_string").notNull(),
	created_at: timestamp("created_at").notNull(),
});

export const new_item_metadata_schema = createInsertSchema(item_metadata).omit({
	workspace_id: true,
});
export const update_item_metadata_schema = createUpdateSchema(item_metadata).pick({
	value_string: true,
});

export type ItemMetadata = InferSelectModel<typeof item_metadata>;

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
	// Links a refunded item to a new copy to manage returns
	z.literal("returned-item"),
	// Links an item arbitrarily
	z.literal("misc-item-ref"),
]);

export type ItemAssociationType = z.infer<typeof item_association_type_schema>;

export const item_associations = pgTable("item-associations", {
	id: text("id").primaryKey(),
	type: text("type").notNull().$type<ItemAssociationType>(),
	item_id: text("item_id")
		.notNull()
		.references(() => items.id, { onDelete: "cascade" }),
	subject_id: text("subject_id").notNull(),
	workspace_id: text("workspace_id").notNull(),
});

export const associations_relations = relations(item_associations, ({ one }) => ({
	item: one(items, {
		fields: [item_associations.item_id],
		references: [items.id],
	}),
}));

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

export const fee_prediction_catagories = pgTable("fee_prediction_catagories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	fee_value_perc: real("fee_value_perc").notNull(),
	workspace_id: text("workspace_id").notNull(),
});

export const new_fee_catagory_schema = createInsertSchema(fee_prediction_catagories);
export const update_fee_catagory_schema = createUpdateSchema(fee_prediction_catagories).pick({
	name: true,
	fee_value_perc: true,
});

export type FeeGroup = InferSelectModel<typeof fee_prediction_catagories>;
export type UpdateFeeGroup = z.infer<typeof update_fee_catagory_schema>;

export const feedback_table = pgTable("feedback", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	content: text("content").notNull(),
	created_at: timestamp("created_at").notNull(),
	created_by: text("created_by").notNull(),
	read: boolean("read").notNull().default(false),
	archived: boolean("archived").notNull().default(false),
});

export type UserFeedback = InferSelectModel<typeof feedback_table>;

export const new_feedback_schema = createInsertSchema(feedback_table);

export const update_feedback_schema = createUpdateSchema(feedback_table).pick({
	title: true,
	content: true,
	read: true,
});

export * from "./auth.schema";
