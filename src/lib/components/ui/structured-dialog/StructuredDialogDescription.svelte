<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLParagraphElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<p class={cn("text-xs text-muted-foreground md:text-sm", class_name)} {...props}>
	{@render children?.()}
</p>
