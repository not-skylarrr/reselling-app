<script lang="ts">
	import type { WorkspaceLocation } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import { LucideCircle } from "@lucide/svelte";
	import { GetAwareColour } from "../ui/colour-picker/lib/utils";
	import { mode } from "mode-watcher";

	type Props = {
		class?: string;
		location: WorkspaceLocation;
	};

	let { class: class_name, location }: Props = $props();
</script>

<LucideCircle
	class={cn("size-3.5 border-none stroke-2", class_name)}
	style="stroke: var(--background); fill: {GetAwareColour(location.colour, mode.current)}"
/>
