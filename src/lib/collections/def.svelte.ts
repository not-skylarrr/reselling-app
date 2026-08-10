import {
	BasicIndex,
	createCollection,
	createLiveQueryCollection,
	eq,
	toArray,
} from "@tanstack/svelte-db";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { ParseSubsetOptions, ParseWhereFilters } from "$lib/utils/ts-db";
import { query_client } from "$lib/queries/client.svelte";
import { trpc_client } from "$lib/trpc/client";

export const ItemsCollection = createCollection(
	queryCollectionOptions({
		id: "items",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "items", "ts-db", parsed_where];

			return ["user-session", "items", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			return await trpc_client.items.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});
		},
		queryClient: query_client,
		getKey: (item) => item.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.items.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.items.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.map((m) => m.key);

			await trpc_client.items.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

ItemsCollection.createIndex((row) => row.id);
ItemsCollection.createIndex((row) => row.status);

export const ListingsCollection = createCollection(
	queryCollectionOptions({
		id: "listings",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "listings", "ts-db", parsed_where];

			return ["user-session", "listings", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const listings = await trpc_client.listings.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return listings;
		},
		queryClient: query_client,
		getKey: (listing) => listing.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.listings.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "listings"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.listings.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "listings"] });
		},
	}),
);

export const ItemFeesCollection = createCollection(
	queryCollectionOptions({
		id: "fees",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "item-fees", "ts-db", parsed_where];

			return ["user-session", "item-fees", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const fees = await trpc_client.fees.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return fees;
		},
		queryClient: query_client,
		getKey: (fee) => fee.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.fees.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-fees"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.fees.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-fees"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

export const LabelsCollection = createCollection(
	queryCollectionOptions({
		id: "workspace_labels",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "workspace-labels", "ts-db", parsed_where];

			return ["user-session", "workspace-labels", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const labels = await trpc_client.workspace.labels.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return labels;
		},
		queryClient: query_client,
		getKey: (label) => label.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.workspace.labels.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.workspace.labels.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.workspace.labels.delete_ts_db.mutate(deletions.map((mut) => mut.key));

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

export const LabelJoinsCollection = createCollection(
	queryCollectionOptions({
		id: "label-joins",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "label-joins", "ts-db", parsed_where];

			return ["user-session", "label-joins", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const labels = await trpc_client.workspace.labels.connections.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return labels;
		},
		queryClient: query_client,
		getKey: (label) => label.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.workspace.labels.connections.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.workspace.labels.connections.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.workspace.labels.connections.delete_ts_db.mutate(
				deletions.map((mut) => mut.key),
			);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

LabelJoinsCollection.createIndex((row) => row.type);
LabelJoinsCollection.createIndex((row) => row.label_id);

export const LocationsCollection = createCollection(
	queryCollectionOptions({
		id: "workspace_locations",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "workspace-locations", "ts-db", parsed_where];

			return ["user-session", "workspace-locations", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const labels = await trpc_client.workspace.locations.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return labels;
		},
		queryClient: query_client,
		getKey: (label) => label.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.workspace.locations.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.workspace.locations.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.workspace.locations.delete_ts_db.mutate(
				deletions.map((mut) => mut.key),
			);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

export const BundlesCollection = createCollection(
	queryCollectionOptions({
		id: "bundles",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "bundles", "ts-db", parsed_where];

			return ["user-session", "bundles", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const bundles = await trpc_client.bundles.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return bundles;
		},
		queryClient: query_client,
		getKey: (bundle) => bundle.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.bundles.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.bundles.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.bundles.delete_ts_db.mutate(deletions.map((mut) => mut.key));

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
		syncMode: "on-demand",
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

export const BundleItemsCollection = createCollection(
	queryCollectionOptions({
		id: "bundle-items",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "bundle-items", "ts-db", parsed_where];

			return ["user-session", "bundle-items", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const bundles = await trpc_client.bundles.items.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return bundles;
		},
		queryClient: query_client,
		getKey: (bundle_item) => bundle_item.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.bundles.items.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.bundles.items.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.bundles.items.delete_ts_db.mutate(deletions.map((mut) => mut.key));

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
		syncMode: "on-demand",
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

export const ItemAssociationsCollection = createCollection(
	queryCollectionOptions({
		id: "item-associations",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "item-associations", "ts-db", parsed_where];

			return ["user-session", "item-associations", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const bundles = await trpc_client.items.assocations.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return bundles;
		},
		queryClient: query_client,
		getKey: (bundle_item) => bundle_item.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.items.assocations.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.items.assocations.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.items.assocations.delete_ts_db.mutate(deletions.map((mut) => mut.key));

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
		autoIndex: "eager",
		defaultIndexType: BasicIndex,
	}),
);

ItemAssociationsCollection.createIndex((row) => row.item_id);
ItemAssociationsCollection.createIndex((row) => row.subject_id);

export const FeeGroupsCollection = createCollection(
	queryCollectionOptions({
		id: "fee-groups",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "fee-groups", "ts-db", parsed_where];

			return ["user-session", "fee-groups", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const fee_groups = await trpc_client.workspace.fee_groups.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return fee_groups;
		},
		queryClient: query_client,
		getKey: (bundle_item) => bundle_item.id,
		onInsert: async ({ transaction }) => {
			const insertions = transaction.mutations.map((m) => m.modified);

			await trpc_client.workspace.fee_groups.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
		onUpdate: async ({ transaction }) => {
			const updates = transaction.mutations.map((m) => ({
				id: m.key,
				changes: m.changes,
			}));

			await trpc_client.workspace.fee_groups.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
		onDelete: async ({ transaction }) => {
			const deletions = transaction.mutations.filter((m) => m.type == "delete");

			await trpc_client.workspace.fee_groups.delete_ts_db.mutate(
				deletions.map((mut) => mut.key),
			);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
	}),
);

export const UsersCollection = createCollection(
	queryCollectionOptions({
		id: "users",
		queryKey: ({ where }) => {
			const parsed_where = ParseWhereFilters(where);

			if (parsed_where) return ["user-session", "users", "ts-db", parsed_where];

			return ["user-session", "users", "ts-db"];
		},
		queryFn: async (ctx) => {
			const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

			const users = await trpc_client.admin.users.get_ts_db.query({
				where: where,
				orderBy: sorts,
				limit: limit,
			});

			return users;
		},
		queryClient: query_client,
		getKey: (user) => user.id,
	}),
);
