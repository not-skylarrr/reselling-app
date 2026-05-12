<script lang="ts">
	import { cn } from "$lib/utils";
	import { createHashvatar } from "hashvatar";

	type Props = {
		animated?: boolean;
		class?: string;
		hash: string;
		shape?: "circle" | "squircle" | "square";
		size?: number;
	};

	let {
		animated = false,
		class: class_name,
		hash,
		shape = "circle",
		size = 32,
	}: Props = $props();

	let parent_ref = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const { canvas } = createHashvatar({
			animated: animated,
			hash: hash,
			mode: "dither",
			size: size,
		});

		if (!parent_ref) return;

		parent_ref.appendChild(canvas);

		return () => {
			if (!parent_ref) return;

			parent_ref.removeChild(canvas);
		};
	});
</script>

<div bind:this={parent_ref} class={cn("overflow-hidden rounded-full", class_name)}></div>
