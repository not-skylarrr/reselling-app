<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLHeadElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<h5 class={cn("text-2xl font-medium", class_name)} {...props}>
	{@render children?.()}
</h5>
