<script lang="ts">
	import Button from "../button/button.svelte";
	import { Popover, PopoverTrigger } from "../popover";
	import PopoverContent from "../popover/popover-content.svelte";
	import ColourPicker from "./ColourPicker.svelte";
	import {
		CreateColourExportString,
		GetAwareColour,
		PLACEHOLDER_COLOUR_DATA,
	} from "./lib/utils";
	import { mode } from "mode-watcher";
	import LucidePalette from "@lucide/svelte/icons/palette";
	import ColourPalette from "./ColourPalette.svelte";

	type Props = {
		buttonVariant?: "ghost" | "outline";
		disabled?: boolean;
		initialColour?: string;
		onColourChange: (colour: string) => void;
		triggerLabel?: string;
		triggerVariant?: "compact" | "expanded";
	};

	let {
		buttonVariant = "ghost",
		disabled = false,
		initialColour,
		onColourChange,
		triggerLabel,
		triggerVariant = "compact",
	}: Props = $props();

	let open = $state(false);
	let colour = $state(CreateColourExportString(PLACEHOLDER_COLOUR_DATA));
	let show_picker = $state(false);

	let trigger_colour = $derived(GetAwareColour(colour, mode.current));

	function HandleColourChange(col: string) {
		colour = col;
	}

	function HandleOpenChange(open: boolean) {
		if (disabled) return;

		if (open == false) {
			onColourChange(colour);
		}
	}

	$effect(() => {
		if (initialColour) {
			colour = initialColour;
		}
	});
</script>

<Popover bind:open onOpenChange={HandleOpenChange}>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				class="disabled:opacity-100 data-[state=open]:!bg-accent"
				{disabled}
				size={triggerVariant == "compact" ? "icon-sm" : "default"}
				variant={buttonVariant}
			>
				<div class="h-2.5 w-2.5 rounded-full" style="background: {trigger_colour};"></div>

				{#if triggerVariant == "expanded" && triggerLabel}
					<p>{triggerLabel}</p>
				{/if}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent
		align="start"
		class="relative min-h-13 w-86 p-2.5"
		onCloseAutoFocus={(ev) => ev.preventDefault()}
	>
		<Button
			class="absolute top-2.5 right-2.5 text-muted-foreground"
			onclick={() => (show_picker = !show_picker)}
			size="icon-sm"
			variant="ghost"
		>
			<LucidePalette />
		</Button>

		{#if show_picker}
			<ColourPicker {initialColour} onColourChange={HandleColourChange} />
		{:else}
			<ColourPalette onColourChange={HandleColourChange} />
		{/if}
	</PopoverContent>
</Popover>
