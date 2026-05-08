import { createCollection, localStorageCollectionOptions } from "@tanstack/svelte-db";
import z from "zod";

export const SearchRankingCollection = createCollection(
	localStorageCollectionOptions({
		id: "search-ranking",
		schema: z.object({ id: z.string(), val: z.number() }),
		storageKey: "search-rank",
		getKey: (item) => item.id,
	}),
);
