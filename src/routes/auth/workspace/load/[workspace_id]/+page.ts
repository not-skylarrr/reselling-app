import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
	return { workspace_id: params.workspace_id };
};
