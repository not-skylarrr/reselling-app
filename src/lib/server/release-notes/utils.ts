import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ReleaseJsonSchema } from "./schema";
import type { CompleteReleaseData, ReleaseApiData } from "./types";

const RELEASE_FILE_NAME_REGEX = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/;

function GetReleaseNotesDirectory() {
	return join(dirname(fileURLToPath(import.meta.url)), "data");
}

function GetReleaseSlug(file_name: string) {
	const match = RELEASE_FILE_NAME_REGEX.exec(file_name);

	return match?.[1] ?? null;
}

function GetIsoDateFromSlug(slug: string) {
	const [date_part, time_part] = slug.split("T");
	const normalized_time = time_part.slice(0, -1).split("-").join(":");

	return `${date_part}T${normalized_time}Z`;
}

function ParseDateString(value: string) {
	const parsed_date = new Date(value);

	if (Number.isNaN(parsed_date.getTime())) return null;

	return parsed_date;
}

function GetReleaseDayKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

async function ParseReleaseFile(file_name: string) {
	const slug = GetReleaseSlug(file_name);
	if (slug == null) return null;

	const release_path = join(GetReleaseNotesDirectory(), file_name);

	let raw_json: string;

	try {
		raw_json = await readFile(release_path, "utf8");
	} catch (error) {
		console.error(`[release-notes] Failed to read "${file_name}"`, error);
		return null;
	}

	let parsed_json: unknown;

	try {
		parsed_json = JSON.parse(raw_json);
	} catch (error) {
		console.error(`[release-notes] Failed to parse JSON for "${file_name}"`, error);
		return null;
	}

	const validated_json = ReleaseJsonSchema.safeParse(parsed_json);
	if (!validated_json.success) {
		console.error(
			`[release-notes] Invalid release schema for "${file_name}"`,
			validated_json.error.flatten(),
		);
		return null;
	}

	const released_at = ParseDateString(validated_json.data.released_at);
	if (released_at == null) {
		console.error(`[release-notes] Invalid released_at date for "${file_name}"`);
		return null;
	}

	const release = {
		...validated_json.data,
		slug,
		released_at,
	} satisfies CompleteReleaseData;

	const file_timestamp = ParseDateString(GetIsoDateFromSlug(slug));
	if (file_timestamp != null && file_timestamp.getTime() !== release.released_at.getTime()) {
		console.warn(`[release-notes] Filename timestamp mismatch for "${file_name}"`, {
			file_name,
			file_timestamp: file_timestamp.toISOString(),
			released_at: release.released_at.toISOString(),
		});
	}

	return release;
}

export async function GetAllPublishedReleases(now = new Date()) {
	let file_names: string[];

	try {
		file_names = await readdir(GetReleaseNotesDirectory());
	} catch (error) {
		const is_missing_dir =
			error != null && typeof error == "object" && "code" in error && error.code === "ENOENT";

		if (is_missing_dir) return [];

		console.error("[release-notes] Failed to read release notes directory", error);
		return [];
	}

	const release_files = file_names
		.filter((file_name) => RELEASE_FILE_NAME_REGEX.test(file_name))
		.sort((a, b) => b.localeCompare(a));

	const releases: CompleteReleaseData[] = [];

	for (const file_name of release_files) {
		const release = await ParseReleaseFile(file_name);
		if (release == null) continue;

		if (release.released_at.getTime() > now.getTime()) continue;

		releases.push(release);
	}

	return releases;
}

export async function GetUnreadReleases(previous_checked_at?: string | null, now = new Date()) {
	const previous_checked_date =
		previous_checked_at == null ? null : ParseDateString(previous_checked_at);

	const releases = await GetAllPublishedReleases(now);

	if (previous_checked_date == null) return releases;

	return releases.filter(
		(release) => release.released_at.getTime() > previous_checked_date.getTime(),
	);
}

export function SerializeReleaseForApi(
	release: CompleteReleaseData | null,
	display_release_time = false,
): ReleaseApiData | null {
	if (release == null) return null;

	return {
		...release,
		released_at: release.released_at.toISOString(),
		display_release_time,
	};
}

export function SerializeReleasesForApi(releases: CompleteReleaseData[]): ReleaseApiData[] {
	const day_counts = new Map<string, number>();

	for (const release of releases) {
		const day_key = GetReleaseDayKey(release.released_at);
		day_counts.set(day_key, (day_counts.get(day_key) ?? 0) + 1);
	}

	return releases
		.map((release) =>
			SerializeReleaseForApi(
				release,
				(day_counts.get(GetReleaseDayKey(release.released_at)) ?? 0) > 1,
			),
		)
		.filter((release) => release != null);
}
