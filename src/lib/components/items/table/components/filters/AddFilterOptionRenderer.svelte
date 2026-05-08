<script lang="ts">
	import { createQuery } from "@tanstack/svelte-query";
	import LucideLoaderCircle from "@lucide/svelte/icons/loader-circle";
	import type { OptionFilterOption } from "../../lib/filters/lib/functions";
	import { DropdownMenuItem } from "$lib/components/ui/dropdown-menu";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command";

	type Props = {
		id: string;
		label: string;
		options:
			| OptionFilterOption[]
			| (() => OptionFilterOption[] | Promise<OptionFilterOption[]>);
		onFilterAdd: (id: string) => void;
	};

	let { id, options, label, onFilterAdd }: Props = $props();

	const options_query = createQuery(() => ({
		queryKey: ["filter-options", id],
		queryFn: async () => {
			if (Array.isArray(options)) return options;

			return options();
		},
		refetchOnMount: false,
		refetchOnWindowFocus: false,
	}));
</script>

{#if Array.isArray(options)}
	<Command>
		<CommandInput rootClass="h-7" placeholder={`Search ${label}`} />
		<CommandList>
			<CommandGroup>
				{#each options as option (option.value)}
					<CommandItem
						class="rounded-full"
						onSelect={() => onFilterAdd(option.value)}
						value={option.label}
					>
						{#if option.icon}
							<option.icon.component {...option.icon.props} />
						{/if}

						<p>{option.label}</p>
					</CommandItem>
				{/each}
			</CommandGroup>

			<CommandEmpty>No Results</CommandEmpty>
		</CommandList>
	</Command>
{:else if options_query.status == "pending"}
	<div class="flex h-32 flex-col items-center justify-center">
		<LucideLoaderCircle class="size-6 animate-spin text-muted-foreground" />
	</div>
{:else if options_query.status == "error"}
	<p>Error</p>
{:else}
	<Command>
		<CommandInput rootClass="h-7" placeholder={`Search ${label}`} />
		<CommandList>
			<CommandGroup>
				{#each options_query.data as option (option.value)}
					<CommandItem
						class="rounded-full"
						onSelect={() => onFilterAdd(option.value)}
						value={option.label}
					>
						{#if option.icon}
							<option.icon.component {...option.icon.props} />
						{/if}

						<p>{option.label}</p>
					</CommandItem>
				{/each}
			</CommandGroup>

			<CommandEmpty>No Results</CommandEmpty>
		</CommandList>
	</Command>
{/if}
