<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLParagraphElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<p class={cn("text-sm text-muted-foreground", class_name)} {...props}>{@render children?.()}</p>
