import { auth_client } from "$lib/auth-client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
	const workspace = await auth_client.organization.getFullOrganization({}, { throw: true });

	return workspace;
};

export const ssr = false;
