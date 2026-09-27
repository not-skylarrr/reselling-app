<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import DropdownMenuContent from "$lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
	import { cn } from "$lib/utils";
	import type { AppColumn } from "$lib/table/init.svelte";
	import type { FilterDef } from "../../lib/filters/types";

	type Props = {
		def: FilterDef<any>;
		options: AppColumn<any>[];
		onFilterIdUpdate: (new_id: string) => void;
	};

	let { def, options, onFilterIdUpdate }: Props = $props();
</script>

{#if def.allow_swap}
	<DropdownMenu>
		<DropdownMenuTrigger
			class={cn(
				"flex flex-row items-center gap-2 px-2 text-xs text-sidebar-foreground select-none hover:bg-sidebar-accent [&_svg]:size-3 [&_svg]:stroke-sidebar-foreground/70",
			)}
		>
			{#if def.display_meta.icon}
				<def.display_meta.icon.component {...def.display_meta.icon.props} />
			{/if}

			{def.display_meta.name}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start" class="w-64">
			{#each options as column (column.id)}
				{@const filter_def = column.columnDef.meta?.filter!}
				<DropdownMenuItem onSelect={() => onFilterIdUpdate(column.id)}>
					{#if filter_def.display_meta.icon}
						<filter_def.display_meta.icon.component {...filter_def.display_meta.icon.props} />
					{/if}

					{filter_def.display_meta.name}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
{:else}
	<div
		class="flex flex-row items-center gap-2 px-2 text-xs text-sidebar-foreground select-none [&_svg]:size-3 [&_svg]:stroke-sidebar-foreground/70"
	>
		{#if def.display_meta.icon}
			<def.display_meta.icon.component {...def.display_meta.icon.props} />
		{/if}

		{def.display_meta.name}
	</div>
{/if}
