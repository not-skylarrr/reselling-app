<script lang="ts">
	import Badge from "../ui/badge/badge.svelte";
	import LabelMarkers from "./LabelMarkers.svelte";
	import { cn } from "$lib/utils";
	import type { ActionReturn } from "svelte/action";
	import type { WorkspaceLabel } from "$lib/server/db/schema";

	type Props = {
		class?: string;
		labels: WorkspaceLabel[];
		max?: number;
	};

	let { class: class_name, labels, max }: Props = $props();

	let overflow_limit = $state<number | null>(null);

	const limited_labels = $derived(
		overflow_limit != null
			? labels.slice(0, overflow_limit)
			: max != undefined
				? labels.slice(0, max)
				: labels,
	);

	const removed_labels = $derived(
		overflow_limit != null
			? labels.slice(overflow_limit)
			: max != undefined
				? labels.slice(max)
				: [],
	);

	const ResizeAction = (node: HTMLElement): ActionReturn => {
		const resize_observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.target != node) continue;

				if (entry.contentRect.width < 600) {
					const overflow_amount = Math.max(Math.floor(entry.contentRect.width / 160), 1);

					overflow_limit = overflow_amount;
				} else {
					overflow_limit = null;
				}
			}
		});

		resize_observer.observe(node);

		return {
			destroy: () => {
				resize_observer.disconnect();
			},
		};
	};
</script>

<div
	class={cn("flex flex-row items-center gap-2 overflow-hidden", class_name)}
	use:ResizeAction
>
	{#each limited_labels as label (label.id)}
		<Badge class="bg-background" variant="outline">
			<LabelMarkers labels={[label]} />
			<p>{label.content}</p>
		</Badge>
	{/each}

	{#if removed_labels.length > 0}
		<p class="text-sm text-muted-foreground">+{removed_labels.length}</p>
	{/if}
</div>
