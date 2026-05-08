<script lang="ts">
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { NumberInput } from "$lib/components/ui/number-input";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import { FormatCurrency } from "$lib/utils/formatting";

	type Props = {
		defaultOpen?: boolean;
		placeholder?: string;
		onValueChange: (val: number) => void;
		value: number;
		variant?: "default" | "currency";
	};

	let { defaultOpen, placeholder, onValueChange, value, variant = "default" }: Props = $props();

	// svelte-ignore state_referenced_locally
	let open = $state(defaultOpen);

	let trigger_content = $derived.by(() => {
		if (variant == "currency") {
			return FormatCurrency(value);
		}

		return value;
	});
</script>

<Popover bind:open>
	<PopoverTrigger
		class={cn(
			"flex h-6 flex-row items-center px-2 text-xs text-sidebar-foreground outline-none",
			"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
		)}
	>
		{trigger_content}
	</PopoverTrigger>
	<PopoverContent align="start" class="w-48 p-0" onCloseAutoFocus={(ev) => ev.preventDefault()}>
		{#if variant == "default"}
			<NumberInput {placeholder} onValueChange={(val) => onValueChange(val ?? 0)} {value} />
		{:else if variant == "currency"}
			<CurrencyInput {placeholder} onValueChange={(val) => onValueChange(val ?? 0)} {value} />
		{/if}
	</PopoverContent>
</Popover>
