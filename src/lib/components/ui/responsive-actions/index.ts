import type { Component } from "svelte";

export type ResponsiveAction = {
	icon: Component<any>;
	label: string;
	onSelect: () => void;
	variant?: "default" | "destructive";
};
