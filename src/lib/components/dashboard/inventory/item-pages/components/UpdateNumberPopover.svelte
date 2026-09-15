<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { NumberInput } from "$lib/components/ui/number-input";
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { cn } from "$lib/utils";
	import { LucideCheck } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { toast } from "svelte-sonner";

	type Props = {
		allowDecimal?: boolean;
		allowNegative?: boolean;
		class?: string;
		disabled?: boolean;
		disabled_text?: string;
		label?: string;
		onValueChange: (val: number) => void;
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		type?: "popover" | "dialog";
		value: number;
	};

	let {
		allowDecimal = true,
		allowNegative = false,
		class: class_name,
		disabled,
		disabled_text = "N/A",
		label = "Update Number",
		onValueChange,
		trigger,
		type = "popover",
		value,
	}: Props = $props();

	let open = $state(false);

	// svelte-ignore state_referenced_locally
	let internal_value = $state<number | null>(value);

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();

		HandleSave();
	}

	function HandleSave() {
		if (internal_value === null) {
			toast.error("Enter a number before saving");
			return;
		}

		onValueChange(internal_value);
		open = false;
	}

	$effect(() => {
		if (open == false) {
			internal_value = value;
		}
	});
</script>

{#if type == "popover"}
	<Popover bind:open>
		{#if trigger}
			<PopoverTrigger child={trigger} />
		{:else}
			<PopoverTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						class={cn("text-sm font-normal", class_name)}
						{disabled}
						size="xs"
						variant="ghost"
					>
						{disabled ? disabled_text : value}
					</Button>
				{/snippet}
			</PopoverTrigger>
		{/if}

		<PopoverContent align="end" class="p-3">
			<form class="flex flex-col gap-3" onsubmit={HandleFormSubmit}>
				<div class="grid gap-1.5">
					<p class="px-3 text-xs text-muted-foreground">{label}</p>

					<NumberInput
						{allowDecimal}
						{allowNegative}
						onValueChange={(val) => (internal_value = val)}
						value={internal_value}
					/>
				</div>

				<div class="flex flex-row items-center justify-end">
					<Button size="xs" type="submit"><LucideCheck /> Save Changes</Button>
				</div>
			</form>
		</PopoverContent>
	</Popover>
{:else}
	<Dialog bind:open>
		{#if trigger}
			<DialogTrigger child={trigger} />
		{:else}
			<DialogTrigger>
				{#snippet child({ props })}
					<Button
						{...props}
						class={cn(
							"h-auto! min-h-7 py-1.5 text-left text-sm leading-snug font-normal text-pretty whitespace-normal",
							class_name,
						)}
						{disabled}
						size="xs"
						variant="ghost"
					>
						{disabled ? disabled_text : value}
					</Button>
				{/snippet}
			</DialogTrigger>
		{/if}
		<DialogContent class="sm:max-w-xl">
			<DialogHeader>
				<DialogTitle>{label}</DialogTitle>
			</DialogHeader>

			<form class="flex flex-col gap-4" onsubmit={HandleFormSubmit}>
				<NumberInput
					{allowDecimal}
					{allowNegative}
					onValueChange={(val) => (internal_value = val)}
					value={internal_value}
				/>

				<DialogFooter>
					<Button type="submit"><LucideCheck /> Save Changes</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}
