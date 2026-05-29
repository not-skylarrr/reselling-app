<script lang="ts">
	import type { WorkspaceLabel } from "$lib/server/db/schema";
	import { mode } from "mode-watcher";
	import {
		GetAwareColour,
		type ColourData,
		type ColourOutputData,
	} from "../ui/colour-picker/lib/utils";
	import { LucideCircle } from "@lucide/svelte";

	type Props = {
		colour_data: ColourOutputData;
	};

	let { colour_data }: Props = $props();
</script>

<LucideCircle
	class="size-3.5 stroke-2"
	style="stroke: var(--background); fill: {GetAwareColour(colour_data, mode.current)};"
/>
