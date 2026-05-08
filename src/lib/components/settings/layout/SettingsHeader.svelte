<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<div class={cn("relative grid gap-1 px-4", class_name)} {...props}>
	{@render children?.()}
</div>
