import { browser } from "$app/environment";
import type { ReleaseApiData, ReleaseChangeType } from "$lib/server/release-notes/types";
import { session_state } from "./session.svelte";

const RELEASE_NOTES_STORAGE_KEY_PREFIX = "release_notes:last_checked";

function GetReleaseNotesStorageKey(user_id?: string) {
	const resolved_user_id = user_id ?? session_state.user_id;
	if (resolved_user_id.length === 0) return null;

	return `${RELEASE_NOTES_STORAGE_KEY_PREFIX}:${resolved_user_id}`;
}

export function GetPreviousReleaseCheckDate(user_id?: string) {
	if (!browser) return null;

	const storage_key = GetReleaseNotesStorageKey(user_id);
	if (storage_key == null) return null;

	const stored_value = window.localStorage.getItem(storage_key);
	if (stored_value == null) return null;

	const parsed_date = new Date(stored_value);
	if (Number.isNaN(parsed_date.getTime())) return null;

	return parsed_date;
}

export function GetPreviousReleaseCheckDateIso(user_id?: string) {
	return GetPreviousReleaseCheckDate(user_id)?.toISOString() ?? null;
}

export function SetPreviousReleaseCheckDate(date: Date, user_id?: string) {
	if (!browser) return;

	const storage_key = GetReleaseNotesStorageKey(user_id);
	if (storage_key == null) return;

	if (Number.isNaN(date.getTime())) return;

	window.localStorage.setItem(storage_key, date.toISOString());
}

export function SetPreviousReleaseCheckDateIso(iso_date: string, user_id?: string) {
	const parsed_date = new Date(iso_date);
	if (Number.isNaN(parsed_date.getTime())) return;

	SetPreviousReleaseCheckDate(parsed_date, user_id);
}

export function SetPreviousReleaseCheckDateToLatest(releases: ReleaseApiData[], user_id?: string) {
	if (releases.length === 0) return;

	const latest_release = releases.reduce((latest, release) => {
		return new Date(release.released_at).getTime() > new Date(latest.released_at).getTime()
			? release
			: latest;
	});

	SetPreviousReleaseCheckDateIso(latest_release.released_at, user_id);
}

export function ClearPreviousReleaseCheckDate(user_id?: string) {
	if (!browser) return;

	const storage_key = GetReleaseNotesStorageKey(user_id);
	if (storage_key == null) return;

	window.localStorage.removeItem(storage_key);
}

const ReleaseTypeLabels: Record<ReleaseChangeType, string> = {
	added: "Added",
	fixed: "Fixed",
	improved: "Improved",
	removed: "Removed",
	upcoming: "Upcoming",
};

export function GetReleaseTypeLabel(type: ReleaseChangeType) {
	return ReleaseTypeLabels[type];
}
