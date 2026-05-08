<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
		DialogDescription,
	} from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { cn } from "$lib/utils";

	type Props = {
		columnName?: string;
		defaultOpen?: boolean;
		placeholder?: string;
		onBlur: (val: string) => void;
		onValueChange: (val: string) => void;
		value: string;
	};

	let { columnName, defaultOpen, placeholder, onBlur, onValueChange, value }: Props = $props();

	// svelte-ignore state_referenced_locally
	let open = $state(defaultOpen);

	// svelte-ignore state_referenced_locally
	let internal_string = $state(value);

	function HandleBlur() {
		onBlur(internal_string);
	}

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		onValueChange(internal_string);
		onBlur(internal_string);

		open = false;
	}

	function HandleOpenChange(open: boolean) {
		if (open == false) {
			HandleBlur();
		}
	}
</script>

<Dialog bind:open onOpenChange={HandleOpenChange}>
	<DialogTrigger
		class={cn(
			"flex h-6 flex-row items-center px-2 text-xs text-sidebar-foreground outline-none",
			"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
			value.length == 0 && "text-muted-foreground",
		)}
	>
		{value.length > 0 ? value : "Empty"}
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Filter {columnName}</DialogTitle>
			<DialogDescription class="sr-only"
				>Filter the table by searching with text</DialogDescription
			>
		</DialogHeader>

		<form class="flex flex-col gap-6" onsubmit={HandleFormSubmit}>
			<Input
				{placeholder}
				oninput={(ev) => (internal_string = ev.currentTarget.value)}
				value={internal_string}
			/>

			<div class="flex flex-row justify-end gap-3">
				<Button onclick={() => onBlur("")} type="button" variant="outline">Remove</Button>
				<Button type="submit">Submit</Button>
			</div>
		</form>
	</DialogContent>
</Dialog>
