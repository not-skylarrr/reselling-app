<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLHeadingElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<h1 class={cn("text-2xl font-medium", class_name)} {...props}>{@render children?.()}</h1>
