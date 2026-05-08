import { auth } from "$lib/server/auth";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request }) => {
	const { success: can_view_page } = await auth.api.hasPermission({
		body: {
			permissions: {
				organization: ["update", "delete"],
			},
		},
		headers: request.headers,
	});

	if (!can_view_page)
		throw error(403, {
			message: "You do not have permission to view this page",
		});
};
