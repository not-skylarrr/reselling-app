<script lang="ts">
	import { mode } from "mode-watcher";
	import {
		CreateColourExportString,
		DEFAULT_COLOUR_PALETTE,
		GetAwareColour,
	} from "./lib/utils";

	type Props = {
		onColourChange: (export_string: string) => void;
	};

	let { onColourChange }: Props = $props();
</script>

<div class="flex flex-row">
	{#each DEFAULT_COLOUR_PALETTE as colour, index}
		<button
			aria-label={`Select Colour ${index + 1}`}
			class="flex size-8 items-center justify-center rounded-md hover:bg-accent"
			onclick={() => onColourChange(CreateColourExportString(colour))}
		>
			<div
				class="size-5 rounded"
				style="background: {GetAwareColour(colour, mode.current)}"
			></div>
		</button>
	{/each}
</div>
