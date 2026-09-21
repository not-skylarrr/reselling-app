<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuGroup,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { cn } from "$lib/utils";

	type Props = {
		falseLabel?: string;
		trueLabel?: string;
		value: boolean;
		onValueChange: (value: boolean) => void;
	};

	let { falseLabel = "False", trueLabel = "True", value, onValueChange }: Props = $props();
</script>

<DropdownMenu>
	<DropdownMenuTrigger
		class={cn(
			"flex h-6 items-center px-2 text-xs text-sidebar-foreground outline-none",
			"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
		)}
	>
		{value ? trueLabel : falseLabel}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="start" class="w-36">
		<DropdownMenuGroup>
			<DropdownMenuItem onSelect={() => onValueChange(true)}>{trueLabel}</DropdownMenuItem>
			<DropdownMenuItem onSelect={() => onValueChange(false)}>{falseLabel}</DropdownMenuItem>
		</DropdownMenuGroup>
	</DropdownMenuContent>
</DropdownMenu>
