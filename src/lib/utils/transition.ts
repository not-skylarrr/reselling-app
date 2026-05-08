import { slide, type SlideParams, type TransitionConfig } from "svelte/transition";

export function slideFade(node: HTMLElement, params: SlideParams): TransitionConfig {
	const s = slide(node, params);

	return {
		...s,
		css: (t, u) => `
				${s.css ? s.css(t, u) : ""};
				opacity: ${1 * t};
			`,
	};
}
