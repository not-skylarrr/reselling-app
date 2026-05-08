<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { cn } from "$lib/utils";
	import type { FilterOperation } from "../../lib/filters/types";

	type Props = {
		multi: boolean;
		onSelectedChange: (id: string) => void;
		operations: FilterOperation[];
		selected: string;
	};

	let { multi, onSelectedChange, operations, selected }: Props = $props();

	let selected_operation = $derived(operations.find((o) => o.id == selected));

	function GetOperationLabel(op: FilterOperation) {
		if (multi && op.label_multi) return op.label_multi;

		return op.label;
	}
</script>

{#if selected_operation}
	<DropdownMenu>
		<DropdownMenuTrigger
			class={cn(
				"line-clamp-1 flex h-6 flex-row items-center px-2 text-xs text-sidebar-foreground lowercase",
				"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
			)}
		>
			{GetOperationLabel(selected_operation)}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start" onCloseAutoFocus={(ev) => ev.preventDefault()}>
			{#each operations as operation (operation.id)}
				{#if operation.hide != true}
					<DropdownMenuItem
						onSelect={() => {
							onSelectedChange(operation.id);
						}}
					>
						{GetOperationLabel(operation)}
					</DropdownMenuItem>
				{/if}
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
{/if}
