export {};

declare module "@tanstack/query-db-collection" {
	interface QueryCollectionMeta {
		workspace_id?: () => string;
	}
}
