<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div
	class={cn(
		"relative top-4 z-40 flex h-14 flex-row items-center justify-between rounded-t-lg border border-b-transparent bg-muted px-4 pb-4 dark:bg-background",
		class_name,
	)}
	{...props}>
	{@render children?.()}
</div>
