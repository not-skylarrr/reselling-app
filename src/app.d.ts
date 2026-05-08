import type { User, Session } from "better-auth/minimal";
import type { FilterDef } from "@/components/items/table/filters/types";
import "@tanstack/svelte-table";

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user?: User;
			session?: Session;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module "@tanstack/svelte-table" {
	interface ColumnMeta<TData extends RowData, TValue> {
		align?: "left" | "right";
		filter?: FilterDef<TData>;
		flex?: boolean;
		hidden?: boolean;
	}
}

export {};
