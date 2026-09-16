<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div
	class={cn("relative flex min-h-0 w-full flex-1 flex-col overflow-hidden", class_name)}
	{...props}
>
	{@render children?.()}
</div>
