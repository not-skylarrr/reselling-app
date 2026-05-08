<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import Calendar from "$lib/components/ui/calendar/calendar.svelte";
	import { cn } from "$lib/utils";
	import { fromDate, getLocalTimeZone } from "@internationalized/date";
	import { format } from "date-fns";

	type Props = {
		defaultOpen?: boolean;
		onValueChange: (val: Date) => void;
		value: Date | undefined;
	};

	let { defaultOpen = false, onValueChange, value }: Props = $props();

	// svelte-ignore state_referenced_locally
	let open = $state(defaultOpen);

	let calendar_value = $derived(value ? fromDate(value, getLocalTimeZone()) : undefined);

	let trigger_content = $derived(value ? format(value, "d MMM yyyy") : "Pick a date");
</script>

<Popover bind:open>
	<PopoverTrigger
		class={cn(
			"flex h-6 flex-row items-center px-2 text-xs text-sidebar-foreground outline-none",
			"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
			!value && "text-muted-foreground",
		)}
	>
		{trigger_content}
	</PopoverTrigger>
	<PopoverContent
		align="start"
		class="w-auto overflow-hidden p-0"
		onCloseAutoFocus={(ev) => ev.preventDefault()}
	>
		<Calendar
			type="single"
			captionLayout="dropdown"
			value={calendar_value}
			onValueChange={(val) => {
				if (val) {
					onValueChange(val.toDate(getLocalTimeZone()));
				}
				open = false;
			}}
		/>
	</PopoverContent>
</Popover>
