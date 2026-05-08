import { auth_client } from "$lib/auth-client";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
	const { data, error } = await auth_client.organization.list();

	if (error) throw new Error("Failed to get organizations");

	return { organizations: data };
};

export const ssr = false;
