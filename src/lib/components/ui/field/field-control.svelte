<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div
	class={cn("flex flex-col gap-1 @md:max-w-64 @md:flex-1 @md:overflow-hidden", class_name)}
	{...props}
>
	{@render children?.()}
</div>
