import { createTRPCClient, httpBatchLink, httpLink } from "@trpc/client";
import type { Router } from "../server/trpc/app-router";
import superjson from "superjson";
import { browser } from "$app/environment";

async function GetRequestFetch() {
	if (browser) return fetch;

	const { getRequestEvent } = await import("$app/server");

	return getRequestEvent().fetch;
}

export const trpc_client_batched = createTRPCClient<Router>({
	links: [
		httpBatchLink({
			url: "/trpc",
			fetch: async (input, init) => {
				const request_fetch = await GetRequestFetch();

				return request_fetch(input, {
					...init,
					credentials: "include",
				});
			},
			transformer: superjson,
			methodOverride: "POST",
		}),
	],
});

export const trpc_client = createTRPCClient<Router>({
	links: [
		httpLink({
			url: "/trpc",
			fetch: async (input, init) => {
				const request_fetch = await GetRequestFetch();

				return request_fetch(input, {
					...init,
					credentials: "include",
				});
			},
			transformer: superjson,
			methodOverride: "POST",
		}),
	],
});
