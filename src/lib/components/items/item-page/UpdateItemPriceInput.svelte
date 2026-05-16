<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideCheck } from "@lucide/svelte";

	type Props = {
		align?: "start" | "center" | "end";
		class?: string;
		label?: string;
		price: number;
		onPriceChange: (price: number) => void;
	};

	let {
		align = "end",
		class: class_name,
		label = "Update Price",
		price,
		onPriceChange,
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let internal_value = $state(price);
	let open = $state(false);

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();

		HandleSave();
	}

	function HandleSave() {
		onPriceChange(internal_value);
		open = false;
	}

	$effect(() => {
		if (open == false) {
			internal_value = price;
		}
	});
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				class={cn("text-sm font-normal", class_name)}
				size="xs"
				variant="ghost"
			>
				{FormatCurrency(price)}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent {align} class="p-3">
		<form class="flex flex-col gap-3" onsubmit={HandleFormSubmit}>
			<div class="grid gap-1.5">
				<p class="px-3 text-xs text-muted-foreground">{label}</p>

				<CurrencyInput onValueChange={(val) => (internal_value = val)} value={internal_value} />
			</div>

			<div class="flex flex-row items-center justify-end">
				<Button size="xs" type="submit"><LucideCheck /> Save Changes</Button>
			</div>
		</form>
	</PopoverContent>
</Popover>
