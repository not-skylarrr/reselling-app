<script lang="ts">
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Props = HTMLAttributes<HTMLDivElement> & {
		disableScroll?: boolean;
	};

	let { children, class: class_name, disableScroll, ...props }: Props = $props();
</script>

{#if disableScroll}
	<div
		class={cn(
			"flex h-full w-full flex-col gap-3 overflow-hidden p-3 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:gap-8 md:p-8 md:px-12",
			class_name,
		)}
	>
		{@render children?.()}
	</div>
{:else}
	<ScrollArea class="min-h-0 flex-1 overflow-hidden">
		<div
			class={cn(
				"flex min-h-full w-full flex-col gap-3 p-3 pb-[calc(env(safe-area-inset-bottom)+2rem)] md:gap-8 md:p-8 md:px-12",
				"md:group-data-[variant=ghost]/layout:pt-14",
				class_name,
			)}
			{...props}
		>
			{@render children?.()}
		</div>
	</ScrollArea>
{/if}
