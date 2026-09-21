import type { ColumnVisibilityState } from "@tanstack/svelte-table";
import { z } from "zod";

const ColumnDisplayStateSchema = z.record(z.string(), z.coerce.boolean());
const ColumnSizingStateSchema = z.record(z.string(), z.coerce.number());
const HideArchivedStateSchema = z
	.enum(["true", "false"])
	.transform((value) => value === "true");

const LocalVisibilityKey = "table_cols_visibility";
const LocalSizingKey = "table_cols_sizing";
const LocalHideArchivedKey = "table_hide_archived";

function VisibilityKey(key?: string) {
	return key ? `${LocalVisibilityKey}_${key}` : LocalVisibilityKey;
}

function SizingKey(key?: string) {
	return key ? `${LocalSizingKey}_${key}` : LocalSizingKey;
}

function HideArchivedKey(key?: string) {
	return key ? `${LocalHideArchivedKey}_${key}` : LocalHideArchivedKey;
}

export function GetLocalColumnDisplayState(
	key: string | undefined,
	default_state: ColumnVisibilityState,
): ColumnVisibilityState {
	if (typeof window == "undefined") return default_state;

	const local_state = window.localStorage.getItem(VisibilityKey(key));
	if (!local_state) return default_state;

	const parsed_state = ColumnDisplayStateSchema.safeParse(JSON.parse(local_state));
	if (!parsed_state.success) return default_state;

	const visibility_state = CompleteDisplayDiff(parsed_state.data, default_state);

	if (!visibility_state["name"]) {
		visibility_state["name"] = true;
	}

	return visibility_state;
}

export function SetLocalColumnDisplayState(
	key: string | undefined,
	default_state: ColumnVisibilityState,
	state: Record<string, boolean>,
) {
	if (typeof window == "undefined") return;

	window.localStorage.setItem(
		VisibilityKey(key),
		JSON.stringify(GetColumnDisplayDiff(state, default_state)),
	);
}

function GetColumnDisplayDiff(
	state: Record<string, boolean>,
	default_state: ColumnVisibilityState,
): Record<string, boolean> {
	let diff: Record<string, boolean> = {};

	for (const [key, value] of Object.entries(state)) {
		if (default_state[key] != value) {
			diff[key] = value;
		}
	}

	return diff;
}

function CompleteDisplayDiff(
	diff: Record<string, boolean>,
	default_state: ColumnVisibilityState,
) {
	let complete: Record<string, boolean> = diff;

	for (const [key, value] of Object.entries(default_state)) {
		if (complete[key] == undefined) {
			complete[key] = value;
		}
	}

	return complete;
}

export function GetLocalColumnSizingState(key?: string): Record<string, number> {
	if (typeof window == "undefined") return {};

	const local_state = window.localStorage.getItem(SizingKey(key));
	if (!local_state) return {};

	const parsed_state = ColumnSizingStateSchema.safeParse(JSON.parse(local_state));
	if (!parsed_state.success) return {};

	return parsed_state.data;
}

export function SetLocalColumnSizingState(
	key: string | undefined,
	state: Record<string, number>,
) {
	if (typeof window == "undefined") return;

	window.localStorage.setItem(SizingKey(key), JSON.stringify(state));
}

export function GetLocalHideArchivedState(key?: string): boolean | undefined {
	if (typeof window == "undefined") return undefined;

	const local_state = window.localStorage.getItem(HideArchivedKey(key));
	if (local_state == null) return undefined;

	const parsed_state = HideArchivedStateSchema.safeParse(local_state);
	return parsed_state.success ? parsed_state.data : undefined;
}

export function SetLocalHideArchivedState(key: string | undefined, state: boolean) {
	if (typeof window == "undefined") return;

	window.localStorage.setItem(HideArchivedKey(key), String(state));
}
