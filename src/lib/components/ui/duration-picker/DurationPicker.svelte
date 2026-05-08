<script lang="ts">
	import ButtonGroup from "../button-group/button-group.svelte";
	import { Input } from "../input";
	import { NumberInput } from "../number-input";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "../select";

	type Quantifier = keyof typeof Quantifiers;

	type Props = {
		defaultQuantifier?: Quantifier;
		duration: number;
		onDurationChange: (val: number) => void;
	};

	let { defaultQuantifier, duration, onDurationChange }: Props = $props();

	const Quantifiers = {
		minutes: {
			label: "Minutes",
			value: 60 * 1000,
		},
		hours: {
			label: "Hours",
			value: 60 * 60 * 1000,
		},
		days: {
			label: "Days",
			value: 24 * 60 * 60 * 1000,
		},
		weeks: {
			label: "Weeks",
			value: 7 * 24 * 60 * 60 * 1000,
		},
	} satisfies Record<string, { label: string; value: number }>;

	// svelte-ignore state_referenced_locally
	let quantifier = $state<Quantifier>(defaultQuantifier ?? "days");
	let quantifier_label = $derived(Quantifiers[quantifier].label);

	let quantified_value = $derived.by(() => {
		const quant_val = Quantifiers[quantifier].value;

		return Math.floor(duration / quant_val);
	});

	function HandleInputChange(int_val: number | null) {
		if (!int_val) {
			onDurationChange(0);
			return;
		}

		const quant_val = Quantifiers[quantifier].value;

		onDurationChange(int_val * quant_val);
	}

	function HandleQuantifierChange(val: string) {
		const quant = Quantifiers[val as Quantifier];

		onDurationChange(quantified_value * quant.value);

		quantifier = val as Quantifier;
	}
</script>

<ButtonGroup class="w-full">
	<NumberInput onValueChange={HandleInputChange} value={quantified_value} />

	<Select type="single" onValueChange={HandleQuantifierChange} value={quantifier}>
		<SelectTrigger class="w-24">{quantifier_label}</SelectTrigger>
		<SelectContent>
			{#each Object.entries(Quantifiers) as [id, quantifier] (id)}
				<SelectItem value={id}>{quantifier.label}</SelectItem>
			{/each}
		</SelectContent>
	</Select>
</ButtonGroup>
