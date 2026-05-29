<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import Calendar from "$lib/components/ui/calendar/calendar.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import { FormatDateStd } from "$lib/utils/formatting";
	import { fromDate, getLocalTimeZone, type DateValue } from "@internationalized/date";

	type Props = {
		align?: "start" | "center" | "end";
		onValueChange: (date: Date | null) => void;
		value: Date | null;
	};

	let { align = "end", onValueChange, value }: Props = $props();

	function HandleCalendarDateChange(date: DateValue | undefined) {
		if (!date) return;

		onValueChange(date.toDate(getLocalTimeZone()));
	}
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				class={cn("text-sm font-normal", value == null && "text-muted-foreground")}
				size="xs"
				variant="ghost"
			>
				{value ? FormatDateStd(value) : "No Date"}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent {align} class="w-63 p-0" side="bottom">
		<Calendar
			captionLayout="dropdown"
			maxValue={fromDate(new Date(), getLocalTimeZone())}
			type="single"
			onValueChange={(val) => HandleCalendarDateChange(val)}
			value={value ? fromDate(value, getLocalTimeZone()) : undefined}
		/>
	</PopoverContent>
</Popover>
