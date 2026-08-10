<script lang="ts">
	import LucideCalendar from "@lucide/svelte/icons/calendar";
	import { fromDate, getLocalTimeZone, type DateValue } from "@internationalized/date";
	import type { ComponentProps } from "svelte";
	import { Button, type ButtonSize, type ButtonVariant } from "$lib/components/ui/button";
	import { Calendar } from "$lib/components/ui/calendar";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import { FormatDateStd } from "$lib/utils/formatting";

	type CalendarProps = Omit<
		ComponentProps<typeof Calendar>,
		"class" | "type" | "value" | "onValueChange" | "placeholder"
	>;

	type PopoverContentProps = ComponentProps<typeof PopoverContent>;

	type Props = CalendarProps & {
		value?: Date | null;
		open?: boolean;
		onValueChange?: (value: Date | null) => void;
		placeholder?: string;
		buttonVariant?: ButtonVariant;
		buttonSize?: ButtonSize;
		class?: string;
		contentClass?: string;
		calendarClass?: string;
		align?: PopoverContentProps["align"];
		side?: PopoverContentProps["side"];
		sideOffset?: PopoverContentProps["sideOffset"];
		disabled?: boolean;
		closeOnSelect?: boolean;
		fullMonth?: boolean;
		formatValue?: (value: Date) => string;
		minDate?: Date;
		maxDate?: Date;
		minValue?: DateValue;
		maxValue?: DateValue;
	};

	let {
		value = $bindable(null),
		open = $bindable(false),
		onValueChange,
		placeholder = "Pick a date",
		buttonVariant = "outline",
		buttonSize = "default",
		class: className,
		contentClass,
		calendarClass,
		align = "start",
		side = "bottom",
		sideOffset = 4,
		disabled = false,
		closeOnSelect = true,
		fullMonth = false,
		formatValue,
		minDate,
		maxDate,
		minValue,
		maxValue,
		captionLayout = "dropdown",
		weekdayFormat = "short",
		locale = "en-US",
		...calendarProps
	}: Props = $props();

	const time_zone = getLocalTimeZone();

	const calendar_value = $derived(value ? fromDate(value, time_zone) : undefined);
	const resolved_min_value = $derived(
		minValue ?? (minDate ? fromDate(minDate, time_zone) : undefined),
	);
	const resolved_max_value = $derived(
		maxValue ?? (maxDate ? fromDate(maxDate, time_zone) : undefined),
	);
	const button_label = $derived(
		value ? (formatValue?.(value) ?? FormatDateStd(value, fullMonth)) : placeholder,
	);

	function HandleValueChange(next_value: DateValue | undefined) {
		if (!next_value) {
			value = null;
			onValueChange?.(null);
			return;
		}

		const next_date = next_value.toDate(time_zone);
		value = next_date;
		onValueChange?.(next_date);

		if (closeOnSelect) {
			open = false;
		}
	}
</script>

<Popover bind:open>
	<PopoverTrigger {disabled}>
		{#snippet child({ props })}
			<Button
				{...props}
				{disabled}
				aria-label={value ? `Selected date ${button_label}` : placeholder}
				class={cn(
					"w-full justify-between text-left font-normal",
					value == null && "text-muted-foreground",
					className,
				)}
				size={buttonSize}
				variant={buttonVariant}
			>
				<span class="truncate">{button_label}</span>
				<LucideCalendar class="size-4" data-icon="inline-end" />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent {align} {side} {sideOffset} class={cn("w-auto p-0", contentClass)}>
		<Calendar
			{captionLayout}
			{weekdayFormat}
			{locale}
			class={calendarClass}
			maxValue={resolved_max_value}
			minValue={resolved_min_value}
			type="single"
			onValueChange={HandleValueChange}
			value={calendar_value}
			{...calendarProps}
		/>
	</PopoverContent>
</Popover>
