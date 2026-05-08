<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<div
	class={cn(
		"absolute top-1/2 right-0 hidden -translate-y-1/2 flex-row gap-2 lg:flex",
		class_name,
	)}
	{...props}
>
	{@render children?.()}
</div>
