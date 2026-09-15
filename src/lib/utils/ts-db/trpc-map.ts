import { query_client } from "$lib/queries/client.svelte";
import type {
	BundleItem,
	FeeGroup,
	Item,
	ItemAssociation,
	ItemBundle,
	ItemFee,
	ItemListing,
	ItemMetadataDefinition,
	ItemMetadata,
	MetadataLabelJoin,
	LabelJoin,
	WorkspaceLabel,
	WorkspaceLocation,
} from "$lib/server/db/schema";
import { trpc_client, trpc_client_batched } from "$lib/trpc/client";
import type { PendingMutation, TransactionWithMutations } from "@tanstack/svelte-db";

type TrpcClient = typeof trpc_client | typeof trpc_client_batched;

export const MutationHandlerMap = {
	items: CreateMutationHandler<Item>({
		insert: async (insertions, client) => {
			await client.items.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
		update: async (updates, client) => {
			await client.items.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
		delete: async (deletions, client) => {
			await client.items.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "items"] });
		},
	}),
	listings: CreateMutationHandler<ItemListing>({
		insert: async (insertions, client) => {
			await client.listings.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "listings"] });
		},
		update: async (updates, client) => {
			await client.listings.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "listings"] });
		},
		delete: async (deletions, client) => {},
	}),
	fees: CreateMutationHandler<ItemFee>({
		insert: async (insertions, client) => {
			await client.fees.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-fees"] });
		},
		update: async (updates, client) => {
			await client.fees.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-fees"] });
		},
		delete: async (deletions, client) => {},
	}),
	workspace_labels: CreateMutationHandler<WorkspaceLabel>({
		insert: async (insertions, client) => {
			await client.workspace.labels.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
		update: async (updates, client) => {
			await client.workspace.labels.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
		delete: async (deletions, client) => {
			await client.workspace.labels.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-labels"] });
		},
	}),
	workspace_locations: CreateMutationHandler<WorkspaceLocation>({
		insert: async (insertions, client) => {
			await client.workspace.locations.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
		update: async (updates, client) => {
			await client.workspace.locations.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
		delete: async (deletions, client) => {
			await client.workspace.locations.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-locations"] });
		},
	}),
	bundles: CreateMutationHandler<ItemBundle>({
		insert: async (insertions, client) => {
			await client.bundles.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
		update: async (updates, client) => {
			await client.bundles.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
		delete: async (deletions, client) => {
			await client.bundles.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundles"] });
		},
	}),
	"bundle-items": CreateMutationHandler<BundleItem>({
		insert: async (insertions, client) => {
			await client.bundles.items.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
		update: async (updates, client) => {
			await client.bundles.items.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
		delete: async (deletions, client) => {
			await client.bundles.items.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "bundle-items"] });
		},
	}),
	"item-associations": CreateMutationHandler<ItemAssociation>({
		insert: async (insertions, client) => {
			await client.items.assocations.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
		update: async (updates, client) => {
			await client.items.assocations.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
		delete: async (deletions, client) => {
			await client.items.assocations.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-associations"] });
		},
	}),
	"item-metadata": CreateMutationHandler<ItemMetadata>({
		insert: async (insertions, client) => {
			await client.items.metadata.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-metadata"] });
		},
		update: async (updates, client) => {
			await client.items.metadata.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-metadata"] });
		},
		delete: async (deletions, client) => {
			await client.items.metadata.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "item-metadata"] });
		},
	}),
	"item-metadata-definitions": CreateMutationHandler<ItemMetadataDefinition>({
		insert: async (insertions, client) => {
			await client.workspace.item_metadata.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({
				queryKey: ["user-session", "item-metadata-definitions"],
			});
		},
		update: async (updates, client) => {
			await client.workspace.item_metadata.update_ts_db.mutate(updates);

			query_client.invalidateQueries({
				queryKey: ["user-session", "item-metadata-definitions"],
			});
		},
		delete: async (deletions, client) => {
			await client.workspace.item_metadata.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({
				queryKey: ["user-session", "item-metadata-definitions"],
			});
			query_client.invalidateQueries({ queryKey: ["user-session", "metadata-label-joins"] });
			query_client.invalidateQueries({ queryKey: ["user-session", "item-metadata"] });
		},
	}),
	"metadata-label-joins": CreateMutationHandler<MetadataLabelJoin>({
		insert: async (insertions, client) => {
			await client.workspace.item_metadata.label_joins.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "metadata-label-joins"] });
		},
		update: async (updates, client) => {
			await client.workspace.item_metadata.label_joins.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "metadata-label-joins"] });
		},
		delete: async (deletions, client) => {
			await client.workspace.item_metadata.label_joins.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "metadata-label-joins"] });
		},
	}),
	"label-joins": CreateMutationHandler<LabelJoin>({
		insert: async (insertions, client) => {
			await client.workspace.labels.connections.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
		update: async (updates, client) => {
			await client.workspace.labels.connections.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
		delete: async (deletions, client) => {
			await client.workspace.labels.connections.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "label-joins"] });
		},
	}),
	"fee-groups": CreateMutationHandler<FeeGroup>({
		insert: async (insertions, client) => {
			await client.workspace.fee_groups.insert_ts_db.mutate(insertions);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
		update: async (updates, client) => {
			await client.workspace.fee_groups.update_ts_db.mutate(updates);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
		delete: async (deletions, client) => {
			await client.workspace.fee_groups.delete_ts_db.mutate(deletions);

			query_client.invalidateQueries({ queryKey: ["user-session", "fee-groups"] });
		},
	}),
} as const;

export type CollectionKey = keyof typeof MutationHandlerMap;

type MutationHandler<T> = {
	insert: (insertions: T[], client: TrpcClient) => Promise<void>;
	update: (updates: { id: string; changes: Partial<T> }[], client: TrpcClient) => Promise<void>;
	delete: (deletions: string[], client: TrpcClient) => Promise<void>;
};

export function CreateMutationHandler<T>(handler: MutationHandler<T>) {
	return handler;
}

export async function ApplyTsDbMutation(
	transaction: TransactionWithMutations,
	useBatched: boolean = true,
) {
	const client = useBatched ? trpc_client_batched : trpc_client;
	const insertion_map = new Map<string, PendingMutation[]>();
	const update_map = new Map<string, PendingMutation[]>();
	const deletion_map = new Map<string, PendingMutation[]>();

	for (const mutation of transaction.mutations) {
		const collection_id = mutation.collection.id;

		if (mutation.type == "insert") {
			if (insertion_map.has(collection_id)) {
				insertion_map.get(collection_id)!.push(mutation);
			} else {
				insertion_map.set(collection_id, [mutation]);
			}
		}

		if (mutation.type == "update") {
			if (update_map.has(collection_id)) {
				update_map.get(collection_id)!.push(mutation);
			} else {
				update_map.set(collection_id, [mutation]);
			}
		}

		if (mutation.type == "delete") {
			if (deletion_map.has(collection_id)) {
				deletion_map.get(collection_id)!.push(mutation);
			} else {
				deletion_map.set(collection_id, [mutation]);
			}
		}
	}

	const handlers: Promise<void>[] = [];

	// Item insertions need to be performed first to prevent FK errors
	const sorted_insertions = insertion_map
		.entries()
		.toArray()
		.sort(([id]) => (id == "items" ? -1 : 1));

	if (insertion_map.size > 0) {
		for await (const [collection_id, mutations] of sorted_insertions) {
			if (collection_id in MutationHandlerMap) {
				const handler = MutationHandlerMap[collection_id as CollectionKey];

				// To ensure insert order, inserts need to be awaited individually
				await handler.insert(
					// @ts-expect-error maybe fix later
					mutations.map((m) => m.modified),
					client,
				);
			} else {
				console.warn("Unknown collection id: ", collection_id);
			}
		}
	}

	if (update_map.size > 0) {
		for (const [collection_id, mutations] of update_map.entries()) {
			if (collection_id in MutationHandlerMap) {
				const handler = MutationHandlerMap[collection_id as CollectionKey];

				console.log("running update");

				handlers.push(
					handler.update(
						mutations.map((m) => ({ id: m.key, changes: m.changes })),
						client,
					),
				);
			} else {
				console.warn("Unknown collection id: ", collection_id);
			}
		}
	}

	if (deletion_map.size > 0) {
		for (const [collection_id, mutations] of deletion_map.entries()) {
			if (collection_id in MutationHandlerMap) {
				const handler = MutationHandlerMap[collection_id as CollectionKey];

				handlers.push(
					handler.delete(
						mutations.map((m) => m.key),
						client,
					),
				);
			} else {
				console.warn("Unknown collection id: ", collection_id);
			}
		}
	}

	await Promise.all(handlers);

	return {};
}
