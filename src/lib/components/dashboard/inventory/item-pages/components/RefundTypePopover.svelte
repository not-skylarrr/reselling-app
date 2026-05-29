<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandList,
	} from "$lib/components/ui/command";
	import CommandItem from "$lib/components/ui/command/command-item.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import {
		GetRefundTypeFriendlyName,
		RefundTypeFriendlyNames,
		RefundTypeIcons,
	} from "$lib/items/utils";
	import { cn } from "$lib/utils";
	import { LucideCheck } from "@lucide/svelte";

	type Props = {
		align?: "start" | "center" | "end";
		class?: string;
		type: string | null;
		onTypeChange: (type: string) => void;
	};

	let { align, class: class_name, type, onTypeChange }: Props = $props();
</script>

<Popover>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				class={cn("text-sm font-normal", type == null && "text-muted-foreground", class_name)}
				size="xs"
				variant="ghost"
			>
				{type == null ? "N/A" : GetRefundTypeFriendlyName(type)}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent {align} class="p-0">
		<Command>
			<CommandInput rootClass="h-7" placeholder="Search Refund Types" />
			<CommandList>
				<CommandGroup>
					{#each Object.entries(RefundTypeFriendlyNames) as [value, label] (value)}
						{@const TypeIcon = RefundTypeIcons[value as keyof typeof RefundTypeIcons]}

						<CommandItem
							class="[&_svg]:stroke-muted-foreground"
							onSelect={() => onTypeChange(value)}
						>
							{#if TypeIcon}
								<TypeIcon />
							{/if}

							<p class="flex-1">{label}</p>

							{#if value == type}
								<LucideCheck />
							{/if}
						</CommandItem>
					{/each}
				</CommandGroup>

				<CommandEmpty>No Results Found</CommandEmpty>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
