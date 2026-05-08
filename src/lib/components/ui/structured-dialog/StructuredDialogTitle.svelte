<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLHeadingElement>;

	let { children, class: class_name, ...props }: Props = $props();
</script>

<h4 class={cn("text-base font-medium md:text-lg", class_name)} {...props}>
	{@render children?.()}
</h4>
