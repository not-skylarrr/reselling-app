import { MediaQuery } from "svelte/reactivity";

const Breakpoints = {
	sm: "640px",
	md: "768px",
	lg: "1024px",
	xl: "1280px",
} as const;

export type MediaBreakPoint = keyof typeof Breakpoints;

export function CreateMediaQueryBreakpoint(breakpoint: MediaBreakPoint = "md") {
	return new MediaQuery(`(max-width: calc(${Breakpoints[breakpoint]} - 1px))`);
}
