<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement> & {
		size?: "sm" | "md" | "lg" | "full";
	};

	let { class: class_name, children, size = "md", ...props }: Props = $props();
</script>

<div
	class={cn(
		"mx-auto flex h-full w-full flex-1 flex-col gap-6 py-4 md:gap-12 md:py-2",
		size == "sm" && "max-w-lg",
		size == "md" && "max-w-2xl",
		size == "lg" && "max-w-4xl",
		class_name,
	)}
	{...props}
>
	{@render children?.()}
</div>
