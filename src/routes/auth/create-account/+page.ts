import type { PageLoad } from "./$types";

export const load: PageLoad = ({ url }) => {
	const referer_location = url.searchParams.get("ref");

	return { ref: referer_location };
};
