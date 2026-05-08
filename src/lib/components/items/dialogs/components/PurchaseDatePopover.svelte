<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Calendar } from "$lib/components/ui/calendar";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { FormatDateStd } from "$lib/utils/formatting";
	import { fromDate, getLocalTimeZone, type DateValue } from "@internationalized/date";
	import { LucideCalendar } from "@lucide/svelte";

	type Props = {
		date: Date;
		onDateChange: (date: Date) => void;
	};

	let { date, onDateChange }: Props = $props();

	let open = $state(false);

	function HandleCalendarDateChange(date: DateValue | undefined) {
		if (!date) return;

		onDateChange(date.toDate(getLocalTimeZone()));
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<button {...props} class="rounded-full" type="button">
				<Badge class="hover:bg-accent" role="button" size="lg" variant="outline">
					<LucideCalendar />
					{FormatDateStd(date)}
				</Badge>
			</button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="start" class="w-63 p-0" side="top">
		<Calendar
			captionLayout="dropdown"
			maxValue={fromDate(new Date(), getLocalTimeZone())}
			type="single"
			onValueChange={(val) => HandleCalendarDateChange(val)}
			value={fromDate(date, getLocalTimeZone())}
		/>
	</PopoverContent>
</Popover>
