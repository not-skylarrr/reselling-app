<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<div class={cn("z-50 rounded-lg border bg-popover", class_name)} {...props}>
	{@render children?.()}
</div>
