<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div class={cn("flex flex-col gap-0 overflow-visible", class_name)} {...props}>
	{@render children?.()}
</div>
