<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuCheckboxItem,
		DropdownMenuContent,
		DropdownMenuGroup,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { cn } from "$lib/utils";
	import { onMount } from "svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import type { OptionFilterOption } from "../../lib/filters/lib/functions";
	import type { FilterDef } from "../../lib/filters/types";

	type Props = {
		id: string;
		def: FilterDef<unknown>;
		defaultOpen?: boolean;
		multi?: boolean;
		multiLabel?: string;
		options:
			| OptionFilterOption[]
			| (() => OptionFilterOption[] | Promise<OptionFilterOption[]>);
		selectedOption: string | string[];
		onSelectedOptionChange: (val: string | string[], override_removal?: boolean) => void;
	};

	let {
		id,
		def,
		defaultOpen = false,
		multi,
		multiLabel,
		options,
		selectedOption,
		onSelectedOptionChange,
	}: Props = $props();

	// svelte-ignore state_referenced_locally
	let open = $state(defaultOpen);

	let shift_modifier_pressed = $state(false);

	let options_query = createQuery(() => ({
		queryKey: ["filter-options", id],
		queryFn: async () => {
			if (Array.isArray(options)) return options;

			return options();
		},
	}));

	let selected_options = $derived.by(() => {
		if (!options_query.data) return [];

		let options_id_array = Array.isArray(selectedOption) ? selectedOption : [selectedOption];

		return options_id_array
			.map((id) => {
				const option = options_query.data.find((op) => op.value == id);

				return option;
			})
			.filter((o) => o != undefined);
	});

	let selected_option_string = $derived.by(() => {
		if (options_query.status == "pending") return "Loading...";
		if (options_query.status == "error") return "Failed to get option";

		let fetched_options = options_query.data;

		if (Array.isArray(selectedOption)) {
			if (selectedOption.length == 0) return "None";

			if (selectedOption.length > 1) {
				return `${selectedOption.length} ${multiLabel ?? "items"}`;
			}

			const selected_option = fetched_options.find((o) => o.value == selectedOption[0]);
			if (!selected_option) return "Invalid Value";

			return selected_option.label;
		}

		const selected_option = fetched_options.find((o) => o.value == selectedOption);
		if (!selected_option) return "Invalid Value";

		return selected_option.label;
	});

	function IsMultiItemSelected(val: string) {
		if (!Array.isArray(selectedOption)) return false;

		return selectedOption.includes(val);
	}

	function ToggleMultiItemSelected(val: string) {
		if (!Array.isArray(selectedOption)) return;

		let new_selection = [...selectedOption];

		if (selectedOption.includes(val)) {
			let option_index = new_selection.indexOf(val);

			new_selection.splice(option_index, 1);
		} else {
			new_selection.push(val);
		}

		onSelectedOptionChange(new_selection, shift_modifier_pressed);
	}

	function SelectItem(val: string) {
		if (Array.isArray(selectedOption)) return;

		onSelectedOptionChange(val, shift_modifier_pressed);
	}

	function HandleOpenChange(open: boolean) {
		if (open == false && selected_options.length == 0) {
			onSelectedOptionChange([], false);
		}
	}

	onMount(() => {
		const HandleKeyDown = (ev: KeyboardEvent) => {
			if (ev.key == "Shift") {
				shift_modifier_pressed = true;
			}
		};

		const HandleKeyUp = (ev: KeyboardEvent) => {
			if (ev.key == "Shift") {
				shift_modifier_pressed = false;
			}
		};

		document.addEventListener("keydown", HandleKeyDown);
		document.addEventListener("keyup", HandleKeyUp);

		return () => {
			document.removeEventListener("keydown", HandleKeyDown);
			document.removeEventListener("keyup", HandleKeyUp);
		};
	});
</script>

<DropdownMenu bind:open onOpenChange={HandleOpenChange}>
	<DropdownMenuTrigger
		class={cn(
			"flex h-6 flex-row items-center gap-2 px-2 text-xs text-sidebar-foreground outline-none",
			"focus-within:bg-muted hover:bg-muted data-[state=open]:bg-muted",
		)}
	>
		{#if selected_options.length > 0}
			<div class="flex flex-row -space-x-[3px] [&_svg]:size-3">
				{#each selected_options.slice(0, 3) as option (option.value)}
					{#if option.icon}
						<option.icon.component
							class={`relative border border-input`}
							{...option.icon.props}
						/>
					{/if}
				{/each}
			</div>
		{/if}
		{selected_option_string}
	</DropdownMenuTrigger>

	<DropdownMenuContent
		align="start"
		class="w-56"
		onCloseAutoFocus={(ev) => ev.preventDefault()}
	>
		{#if options_query.status == "pending"}
			<p>Pending</p>
		{:else if options_query.status == "error"}
			<p>Error</p>
		{:else if multi == true}
			<DropdownMenuGroup>
				{#each options_query.data as option (option.value)}
					<DropdownMenuCheckboxItem
						closeOnSelect={!shift_modifier_pressed}
						checked={IsMultiItemSelected(option.value)}
						onCheckedChange={() => ToggleMultiItemSelected(option.value)}
					>
						{#if option.icon}
							<option.icon.component {...option.icon.props} />
						{/if}

						{option.label}
					</DropdownMenuCheckboxItem>
				{/each}
			</DropdownMenuGroup>
		{:else}
			<DropdownMenuGroup>
				{#each options_query.data as option (option.value)}
					<DropdownMenuItem
						closeOnSelect={!shift_modifier_pressed}
						onSelect={() => SelectItem(option.value)}
					>
						{#if option.icon}
							<option.icon.component {...option.icon.props} />
						{/if}

						{option.label}
					</DropdownMenuItem>
				{/each}
			</DropdownMenuGroup>
		{/if}
	</DropdownMenuContent>
</DropdownMenu>
