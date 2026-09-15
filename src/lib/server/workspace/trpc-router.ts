import z from "zod";
import { auth_procedure, router } from "../trpc/router";
import {
	bundle_items,
	item_bundles,
	items,
	item_fees,
	item_listings,
	new_label_schema,
	new_location_schema,
	update_label_schema,
	update_location_schema,
	workspace_labels,
	workspace_locations,
	new_label_join_schema,
	label_join_table,
	update_label_join_schema,
	item_associations,
	fee_prediction_catagories,
	new_fee_catagory_schema,
	update_fee_catagory_schema,
	item_metadata_definition,
	item_metadata,
	metadata_label_join,
	new_item_metadata_definition_schema,
	update_item_metadata_definition_schema,
	new_metadata_label_join_schema,
	update_metadata_label_join_schema,
	type ItemMetadataDefinition,
	type MetadataLabelJoin,
} from "../db/schema";
import { auth, GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import { CreateDrizzleFilters } from "../ts-db/filters";
import { eq, and, inArray } from "drizzle-orm";
import { redirect } from "@sveltejs/kit";
import { TRPCError } from "@trpc/server";

const label_joins_router = router({
	insert_ts_db: auth_procedure.input(z.array(new_label_join_schema)).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { success: can_update } = await auth.api.hasPermission({
			body: {
				permissions: {
					items: ["update"],
				},
			},
			headers: opts.ctx.headers,
		});

		if (!can_update)
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to update this data",
			});

		await db.insert(label_join_table).values(
			opts.input.map((label) => ({
				...label,
				workspace_id: workspace_id,
			})),
		);
	}),
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{
				dbTable: label_join_table,
				defaultWhere: eq(label_join_table.workspace_id, workspace_id),
			},
		);

		const returned_items = await db.query.label_join_table.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_items;
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_label_join_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const { success: can_update } = await auth.api.hasPermission({
				body: {
					permissions: {
						items: ["update"],
					},
				},
				headers: opts.ctx.headers,
			});

			if (!can_update)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this data",
				});

			const failed_updates = await Promise.allSettled(
				opts.input.map((change) => {
					return db
						.update(label_join_table)
						.set(change.changes)
						.where(
							and(
								eq(label_join_table.workspace_id, workspace_id),
								eq(label_join_table.id, change.id),
							),
						);
				}),
			);

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await db
			.delete(label_join_table)
			.where(
				and(
					eq(label_join_table.workspace_id, workspace_id),
					inArray(label_join_table.id, opts.input),
				),
			);
	}),
});

const labels_router = router({
	insert_ts_db: auth_procedure.input(z.array(new_label_schema)).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { success: can_update } = await auth.api.hasPermission({
			body: {
				permissions: {
					labels: ["create"],
				},
			},
			headers: opts.ctx.headers,
		});

		if (!can_update)
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to update this data",
			});

		await db.insert(workspace_labels).values(
			opts.input.map((label) => ({
				...label,
				workspace_id: workspace_id,
			})),
		);
	}),
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{
				dbTable: workspace_labels,
				defaultWhere: eq(workspace_labels.workspace_id, workspace_id),
			},
		);

		const returned_items = await db.query.workspace_labels.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_items;
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_label_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const { success: can_update } = await auth.api.hasPermission({
				body: {
					permissions: {
						labels: ["update"],
					},
				},
				headers: opts.ctx.headers,
			});

			if (!can_update)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this data",
				});

			const failed_updates = await Promise.allSettled(
				opts.input.map((change) => {
					return db
						.update(workspace_labels)
						.set(change.changes)
						.where(
							and(
								eq(workspace_labels.workspace_id, workspace_id),
								eq(workspace_labels.id, change.id),
							),
						);
				}),
			);

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await Promise.all([
			db
				.delete(workspace_labels)
				.where(
					and(
						eq(workspace_labels.workspace_id, workspace_id),
						inArray(workspace_labels.id, opts.input),
					),
				),
			db
				.delete(label_join_table)
				.where(
					and(
						eq(label_join_table.workspace_id, workspace_id),
						inArray(workspace_labels.id, opts.input),
					),
				),
		]);
	}),
	connections: label_joins_router,
});

const locations_router = router({
	insert_ts_db: auth_procedure.input(z.array(new_location_schema)).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { success: can_update } = await auth.api.hasPermission({
			body: {
				permissions: {
					locations: ["create"],
				},
			},
			headers: opts.ctx.headers,
		});

		if (!can_update)
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to update this data",
			});

		await db.insert(workspace_locations).values(
			opts.input.map((label) => ({
				...label,
				workspace_id: workspace_id,
			})),
		);
	}),
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{
				dbTable: workspace_locations,
				defaultWhere: eq(workspace_locations.workspace_id, workspace_id),
			},
		);

		const returned_items = await db.query.workspace_locations.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_items;
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_location_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const { success: can_update } = await auth.api.hasPermission({
				body: {
					permissions: {
						locations: ["update"],
					},
				},
				headers: opts.ctx.headers,
			});

			if (!can_update)
				throw new TRPCError({
					code: "FORBIDDEN",
					message: "You do not have permission to update this data",
				});

			const failed_updates = await Promise.allSettled(
				opts.input.map((change) => {
					return db
						.update(workspace_locations)
						.set(change.changes)
						.where(
							and(
								eq(workspace_locations.workspace_id, workspace_id),
								eq(workspace_locations.id, change.id),
							),
						);
				}),
			);

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await db
			.delete(workspace_locations)
			.where(
				and(
					eq(workspace_locations.workspace_id, workspace_id),
					inArray(workspace_locations.id, opts.input),
				),
			);
	}),
});

const metadata_label_joins_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		const { where, orderBy, limit } = CreateDrizzleFilters(
			{ orderBy: opts.input.orderBy, where: opts.input.where, limit: opts.input.limit },
			{
				dbTable: metadata_label_join,
				defaultWhere: eq(metadata_label_join.workspace_id, workspace_id),
			},
		);

		return db.query.metadata_label_join.findMany({ where, orderBy, limit });
	}),
	insert_ts_db: auth_procedure
		.input(z.array(new_metadata_label_join_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const insert_results = await Promise.allSettled(
				opts.input.map((insertion) =>
					db.insert(metadata_label_join).values({ ...insertion, workspace_id }),
				),
			);
			const failed_insertions = insert_results.filter((result) => result.status === "rejected");

			return { failed_insertions, insert_count: opts.input.length - failed_insertions.length };
		}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_metadata_label_join_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const update_results = await Promise.allSettled(
				opts.input.map((update) =>
					db
						.update(metadata_label_join)
						.set(update.changes as Partial<MetadataLabelJoin>)
						.where(
							and(
								eq(metadata_label_join.id, update.id),
								eq(metadata_label_join.workspace_id, workspace_id),
							),
						),
				),
			);
			const failed_updates = update_results.filter((result) => result.status === "rejected");

			return { failed_updates, update_count: opts.input.length - failed_updates.length };
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		await db
			.delete(metadata_label_join)
			.where(
				and(
					inArray(metadata_label_join.id, opts.input),
					eq(metadata_label_join.workspace_id, workspace_id),
				),
			);
	}),
});

const item_metadata_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		const { where, orderBy, limit } = CreateDrizzleFilters(
			{ orderBy: opts.input.orderBy, where: opts.input.where, limit: opts.input.limit },
			{
				dbTable: item_metadata_definition,
				defaultWhere: eq(item_metadata_definition.workspace_id, workspace_id),
			},
		);

		return db.query.item_metadata_definition.findMany({ where, orderBy, limit });
	}),
	insert_ts_db: auth_procedure
		.input(z.array(new_item_metadata_definition_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const insert_results = await Promise.allSettled(
				opts.input.map((insertion) =>
					db.insert(item_metadata_definition).values({ ...insertion, workspace_id }),
				),
			);
			const failed_insertions = insert_results.filter((result) => result.status === "rejected");

			return { failed_insertions, insert_count: opts.input.length - failed_insertions.length };
		}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_metadata_definition_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const update_results = await Promise.allSettled(
				opts.input.map((update) =>
					db
						.update(item_metadata_definition)
						.set(update.changes as Partial<ItemMetadataDefinition>)
						.where(
							and(
								eq(item_metadata_definition.id, update.id),
								eq(item_metadata_definition.workspace_id, workspace_id),
							),
						),
				),
			);
			const failed_updates = update_results.filter((result) => result.status === "rejected");

			return { failed_updates, update_count: opts.input.length - failed_updates.length };
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		await db.transaction(async (tx) => {
			await tx
				.delete(item_metadata)
				.where(
					and(
						inArray(item_metadata.metadata_id, opts.input),
						eq(item_metadata.workspace_id, workspace_id),
					),
				);
			await tx
				.delete(metadata_label_join)
				.where(
					and(
						inArray(metadata_label_join.definition_id, opts.input),
						eq(metadata_label_join.workspace_id, workspace_id),
					),
				);
			await tx
				.delete(item_metadata_definition)
				.where(
					and(
						inArray(item_metadata_definition.id, opts.input),
						eq(item_metadata_definition.workspace_id, workspace_id),
					),
				);
		});
	}),
	label_joins: metadata_label_joins_router,
});

const fee_calculation_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{
				dbTable: fee_prediction_catagories,
				defaultWhere: eq(fee_prediction_catagories.workspace_id, workspace_id),
			},
		);

		const catagories = await db.query.fee_prediction_catagories.findMany({
			where,
			orderBy,
			limit,
		});

		return catagories;
	}),
	insert_ts_db: auth_procedure
		.input(z.array(new_fee_catagory_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			await db.insert(fee_prediction_catagories).values(
				opts.input.map((catagory) => ({
					...catagory,
					workspace_id: workspace_id,
				})),
			);
		}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_fee_catagory_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const failed_updates = await Promise.allSettled(
				opts.input.map((change) => {
					return db
						.update(fee_prediction_catagories)
						.set(change.changes)
						.where(
							and(
								eq(fee_prediction_catagories.workspace_id, workspace_id),
								eq(fee_prediction_catagories.id, change.id),
							),
						);
				}),
			);

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await db
			.delete(fee_prediction_catagories)
			.where(
				and(
					eq(fee_prediction_catagories.workspace_id, workspace_id),
					inArray(fee_prediction_catagories.id, opts.input),
				),
			);
	}),
});

export const workspace_router = router({
	labels: labels_router,
	locations: locations_router,
	item_metadata: item_metadata_router,
	fee_groups: fee_calculation_router,
	delete: auth_procedure.mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await auth.api.deleteOrganization({
			body: {
				organizationId: workspace_id,
			},
			headers: opts.ctx.headers,
		});

		const delete_labels = db
			.delete(workspace_labels)
			.where(eq(workspace_labels.workspace_id, workspace_id));
		const delete_locations = db
			.delete(workspace_locations)
			.where(eq(workspace_locations.workspace_id, workspace_id));

		const delete_items = db.delete(items).where(eq(items.workspace_id, workspace_id));
		const delete_fees = db.delete(item_fees).where(eq(item_fees.workspace_id, workspace_id));
		const delete_listings = db
			.delete(item_listings)
			.where(eq(item_listings.workspace_id, workspace_id));

		const delete_bundles = db
			.delete(item_bundles)
			.where(eq(item_bundles.workspace_id, workspace_id));
		const delete_bundle_items = db
			.delete(bundle_items)
			.where(eq(bundle_items.workspace_id, workspace_id));
		const delete_item_associations = db
			.delete(item_associations)
			.where(eq(item_associations.workspace_id, workspace_id));
		const delete_item_metadata_definitions = db
			.delete(item_metadata_definition)
			.where(eq(item_metadata_definition.workspace_id, workspace_id));
		const delete_metadata_label_joins = db
			.delete(metadata_label_join)
			.where(eq(metadata_label_join.workspace_id, workspace_id));

		const delete_label_joins = db
			.delete(label_join_table)
			.where(eq(label_join_table.workspace_id, workspace_id));

		await Promise.all([
			delete_labels,
			delete_locations,
			delete_items,
			delete_bundles,
			delete_bundle_items,
			delete_item_associations,
			delete_item_metadata_definitions,
			delete_metadata_label_joins,
			delete_fees,
			delete_listings,
			delete_label_joins,
		]);
	}),
});
