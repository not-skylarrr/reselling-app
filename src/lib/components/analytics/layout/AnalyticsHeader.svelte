<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement>;

	let { class: class_name, children, ...props }: Props = $props();
</script>

<div
	class={cn("flex flex-row items-center justify-between bg-card p-6", class_name)}
	{...props}
>
	{@render children?.()}
</div>
