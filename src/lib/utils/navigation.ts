import { goto } from "$app/navigation";
import { page } from "$app/state";
import type { ActionReturn } from "svelte/action";
import { get, writable } from "svelte/store";

type ReturnFlowOptions = {
	return_url?: string;
};

const return_store = writable<{ path: string | null }>({ path: null });

export function WithReturn(node: HTMLElement, options: ReturnFlowOptions = {}): ActionReturn {
	function HandleNodeClick() {
		const return_path = options.return_url ?? page.url.pathname;

		return_store.set({ path: return_path });
	}

	node.addEventListener("click", HandleNodeClick);

	return {
		destroy: () => {
			node.removeEventListener("click", HandleNodeClick);
		},
	};
}

type NavigationReturnOptions = {
	fallback: string;
};

export function NavigationReturn(
	node: HTMLElement,
	{ fallback }: NavigationReturnOptions,
): ActionReturn {
	function HandleNodeClick() {
		const store = get(return_store);

		if (store.path) {
			goto(store.path);

			return_store.set({ path: null });
		} else {
			goto(fallback);
		}
	}

	node.addEventListener("click", HandleNodeClick);

	return {
		destroy: () => {
			node.removeEventListener("click", HandleNodeClick);
		},
	};
}

export function GetNavigationReturnUrl(fallback: string) {
	const store = get(return_store);

	if (store.path == null) return fallback;

	return store.path;
}
