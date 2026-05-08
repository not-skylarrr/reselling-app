<script lang="ts">
	import { GetStatusForegroundColour } from "$lib/items/utils";
	import type { ItemStatus } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import LucideArchive from "@lucide/svelte/icons/archive";
	import LucideDollarSign from "@lucide/svelte/icons/dollar-sign";
	import LucideTag from "@lucide/svelte/icons/tag";
	import LucideX from "@lucide/svelte/icons/x";
	import LucidePackage from "@lucide/svelte/icons/package";
	import LucideCircleCheck from "@lucide/svelte/icons/circle-check";

	type Props = {
		class?: string;
		status: ItemStatus;
	};

	let { class: class_name, status }: Props = $props();
</script>

{#if status == "completed"}
	<LucideCircleCheck class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{:else if status == "refunded"}
	<LucideX class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{:else if status == "posted"}
	<LucidePackage class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{:else if status == "sold"}
	<LucideDollarSign class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{:else if status == "listed"}
	<LucideTag class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{:else if status == "unlisted"}
	<LucideArchive class={cn(GetStatusForegroundColour(status), "size-3.5", class_name)} />
{/if}
