<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div
	class={cn(
		"flex flex-col rounded-2xl border bg-card [&>*:not([hidden]):not(.hidden):has(~*:not([hidden]):not(.hidden))]:border-b",
		class_name,
	)}
	{...props}
>
	{@render children?.()}
</div>
