import { auth } from "$lib/server/auth";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request }) => {
	const user_session = await auth.api.getSession({ headers: request.headers });
	if (!user_session) throw redirect(308, "/auth/login");

	if (user_session.user.role != "admin")
		throw error(403, {
			message: "You do not have permission to view this page",
		});

	return { user_session };
};
