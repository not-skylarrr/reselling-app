import { auth_procedure, router } from "../trpc/router";
import { GetLatestUnreadReleaseSchema } from "./schema";
import { GetAllPublishedReleases, GetUnreadReleases, SerializeReleasesForApi } from "./utils";

export const release_notes_router = router({
	get_latest_unread: auth_procedure
		.input(GetLatestUnreadReleaseSchema)
		.query(async ({ input }) => {
			const all_releases = await GetAllPublishedReleases();
			const releases = await GetUnreadReleases(input.previous_checked_at);

			return {
				releases: SerializeReleasesForApi(releases),
				all_releases: SerializeReleasesForApi(all_releases),
			};
		}),
});
