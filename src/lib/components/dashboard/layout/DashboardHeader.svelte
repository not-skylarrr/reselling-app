<script lang="ts" module>
	type BreadcrumbData =
		| {
				type: "ellipsis";
		  }
		| {
				type: "link";
				text: string;
				href: string;
		  }
		| {
				type: "page";
				text: string;
		  };

	export const BREADCRUMB_ELL: BreadcrumbData = { type: "ellipsis" };
</script>

<script lang="ts">
	import {
		Breadcrumb,
		BreadcrumbItem,
		BreadcrumbLink,
		BreadcrumbList,
		BreadcrumbPage,
		BreadcrumbSeparator,
	} from "$lib/components/ui/breadcrumb";
	import BreadcrumbEllipsis from "$lib/components/ui/breadcrumb/breadcrumb-ellipsis.svelte";
	import { afterNavigate, beforeNavigate } from "$app/navigation";
	import { Button } from "$lib/components/ui/button";
	import { useSidebar } from "$lib/components/ui/sidebar";
	import { LucidePanelLeft } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { fade } from "svelte/transition";
	import { cn } from "$lib/utils";

	type Props = {
		actions?: Snippet;
		breadcrumbs?: BreadcrumbData[];
		class?: string;
	};

	let { actions, breadcrumbs, class: class_name }: Props = $props();

	let sidebar_ctx = useSidebar();

	let pending_nav = $state(false);

	beforeNavigate(() => {
		pending_nav = true;
	});

	afterNavigate(() => {
		pending_nav = false;
	});
</script>

<div
	class={cn(
		"@container relative flex h-14 w-full shrink-0 flex-row items-center gap-3 overflow-hidden border-b px-2.5",
		class_name,
	)}
>
	<div class="flex shrink-0 flex-row items-center gap-3">
		<Button
			class="text-muted-foreground"
			onclick={() => sidebar_ctx.toggle()}
			size="icon-sm"
			variant="ghost"
		>
			<LucidePanelLeft />
		</Button>

		{#if breadcrumbs && breadcrumbs.length > 0}
			<Breadcrumb>
				<BreadcrumbList>
					{#each breadcrumbs as breadcrumb, index}
						{@const is_last = index == breadcrumbs.length - 1}

						{#if breadcrumb.type == "link"}
							<BreadcrumbItem>
								<BreadcrumbLink href={breadcrumb.href}>{breadcrumb.text}</BreadcrumbLink>
							</BreadcrumbItem>
						{:else if breadcrumb.type == "page"}
							<BreadcrumbItem>
								<BreadcrumbPage>{breadcrumb.text}</BreadcrumbPage>
							</BreadcrumbItem>
						{:else}
							<BreadcrumbItem>
								<BreadcrumbEllipsis />
							</BreadcrumbItem>
						{/if}

						{#if !is_last}
							<BreadcrumbSeparator />
						{/if}
					{/each}
				</BreadcrumbList>
			</Breadcrumb>
		{/if}
	</div>

	{#if actions}
		<div class="hidden flex-1 flex-row items-center justify-end gap-1.5 @lg:flex">
			{@render actions()}
		</div>
	{/if}

	{#if pending_nav}
		<div
			class="absolute right-0 bottom-0 left-0 h-px animate-pulse bg-primary/50"
			transition:fade={{ duration: 200 }}
		></div>
	{/if}
</div>
