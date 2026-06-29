<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<div
	class={cn("grid shrink-0 grid-cols-1 @lg:grid-cols-2 @5xl:grid-cols-4", class_name)}
	{...props}
>
	{@render children?.()}
</div>
