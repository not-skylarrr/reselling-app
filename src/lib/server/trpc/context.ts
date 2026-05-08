import type { RequestEvent } from "@sveltejs/kit";

export async function createContext(event: RequestEvent) {
	const headers = event.request.headers;

	return {
		headers
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
