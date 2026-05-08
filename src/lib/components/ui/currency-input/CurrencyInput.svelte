<script lang="ts">
	import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../input-group";
	import { NumberInput } from "../number-input";
	import { GetCurrencyValue } from "$lib/utils/currency";

	type Props = {
		class?: string;
		placeholder?: string;
		onblur?: (event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) => void;
		onValueChange: (val: number) => void;
		value: number;
		disabled?: boolean;
	};

	let {
		class: class_name,
		placeholder,
		onblur,
		onValueChange,
		value,
		disabled = false,
	}: Props = $props();

	function HandleValueChange(next: number | null) {
		if (next === null) {
			onValueChange(0);
			return;
		}

		onValueChange(GetCurrencyValue(next));
	}

	function FormatDisplayValue(next: number): string {
		return GetCurrencyValue(next).toFixed(2);
	}
</script>

<InputGroup class={class_name}>
	<InputGroupAddon align="inline-start">
		<InputGroupText class="text-base md:text-sm">£</InputGroupText>
	</InputGroupAddon>

	<NumberInput
		{disabled}
		{placeholder}
		allowNegative={true}
		{value}
		onValueChange={HandleValueChange}
		{onblur}
		allowDecimal={true}
		maxDecimals={2}
		formatValue={FormatDisplayValue}
		inputmode="decimal"
		aria-label="Currency amount"
	>
		{#snippet child({ props })}
			<InputGroupInput {...props} />
		{/snippet}
	</NumberInput>
</InputGroup>
