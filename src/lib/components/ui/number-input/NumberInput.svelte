<script lang="ts">
	import type { ComponentProps } from "svelte";
	import type { Snippet } from "svelte";
	import { Input } from "$lib/components/ui/input/index.js";

	type BaseProps = Omit<
		ComponentProps<typeof Input>,
		"type" | "value" | "oninput" | "onchange" | "files"
	>;
	type Props = BaseProps & {
		value?: number | null;
		onValueChange?: (value: number | null) => void;
		allowDecimal?: boolean;
		maxDecimals?: number;
		allowNegative?: boolean;
		clampOnBlur?: boolean;
		formatValue?: (value: number) => string;
		useNativeNumberInput?: boolean;
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	};
	type InputFocusEvent = FocusEvent & { currentTarget: EventTarget & HTMLInputElement };

	let {
		ref = $bindable(null),
		value = null,
		onValueChange,
		allowDecimal = true,
		maxDecimals,
		allowNegative = false,
		clampOnBlur = true,
		formatValue,
		useNativeNumberInput = false,
		child,
		class: className,
		onblur,
		onfocus,
		inputmode,
		step,
		min,
		max,
		...restProps
	}: Props = $props();

	let internal_string = $state("");
	let is_focused = $state(false);

	const empty_values = new Set(["", "-", ".", "-.", "-."]);

	function NormalizeInput(raw: string): string {
		let next = raw.replace(/[^0-9.\-]/g, "");

		if (!allowNegative) {
			next = next.replace(/-/g, "");
		} else {
			const first_minus = next.indexOf("-");
			if (first_minus > 0) {
				next = next.replace(/-/g, "");
				next = `-${next}`;
			} else if (first_minus === 0) {
				next = `-${next.slice(1).replace(/-/g, "")}`;
			}
		}

		if (!allowDecimal) {
			return next.replace(/\./g, "");
		}

		const first_dot = next.indexOf(".");
		if (first_dot !== -1) {
			const before_dot = next.slice(0, first_dot + 1);
			let after_dot = next.slice(first_dot + 1).replace(/\./g, "");
			if (typeof maxDecimals === "number" && maxDecimals >= 0) {
				after_dot = after_dot.slice(0, maxDecimals);
			}
			next = before_dot + after_dot;
		}

		return next;
	}

	function ParseValue(raw: string): number | null {
		if (empty_values.has(raw)) return null;

		const parsed = Number(raw);
		if (Number.isNaN(parsed)) return null;

		return parsed;
	}

	function ClampValue(value: number): number {
		let next = value;

		if (typeof min === "number") {
			next = Math.max(min, next);
		}

		if (typeof max === "number") {
			next = Math.min(max, next);
		}

		return next;
	}

	function HandleInputChange(raw: string) {
		const normalized = NormalizeInput(raw);
		internal_string = normalized;

		const parsed = ParseValue(normalized);
		if (parsed === null) {
			onValueChange?.(null);
			return;
		}

		onValueChange?.(parsed);
	}

	function HandleInputBlur(event: InputFocusEvent) {
		is_focused = false;

		const parsed = ParseValue(internal_string);
		if (parsed === null) {
			internal_string = "";
			onValueChange?.(null);
			onblur?.(event);
			return;
		}

		const clamped = clampOnBlur ? ClampValue(parsed) : parsed;
		internal_string = formatValue ? formatValue(clamped) : `${clamped}`;
		onValueChange?.(clamped);
		onblur?.(event);
	}

	function HandleInputFocus(event: InputFocusEvent) {
		is_focused = true;
		onfocus?.(event);
	}

	$effect(() => {
		if (is_focused) return;

		if (value === null || value === undefined) {
			if (internal_string !== "") internal_string = "";
			return;
		}

		const next_value = formatValue ? formatValue(value) : `${value}`;

		if (next_value !== internal_string) {
			internal_string = next_value;
		}
	});

	const merged_props = $derived({
		class: className,
		type: useNativeNumberInput ? "number" : "text",
		inputmode: inputmode ?? (allowDecimal ? "decimal" : "numeric"),
		step,
		min,
		max,
		value: internal_string,
		oninput: (event: Event & { currentTarget: EventTarget & HTMLInputElement }) =>
			HandleInputChange(event.currentTarget.value),
		onblur: HandleInputBlur,
		onfocus: HandleInputFocus,
		...restProps
	});
</script>

{#if child}
	{@render child({ props: merged_props })}
{:else}
	<Input bind:ref {...merged_props} />
{/if}

<style>
	:global(input.number-input::-webkit-outer-spin-button),
	:global(input.number-input::-webkit-inner-spin-button) {
		appearance: none;
		margin: 0;
	}
</style>
