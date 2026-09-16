<script lang="ts">
	import { Button, type ButtonVariant } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { Textarea } from "$lib/components/ui/textarea";
	import { cn } from "$lib/utils";
	import { GrowingTextarea } from "$lib/utils/attachments/TextareaSizer";
	import { LucideCheck } from "@lucide/svelte";
	import type { Snippet } from "svelte";
	import { toast } from "svelte-sonner";

	type Props = {
		button_variant?: ButtonVariant;
		class?: string;
		disabled?: boolean;
		disabled_text?: string;
		label?: string;
		min_length?: number;
		onValueChange: (val: string) => void;
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		type?: "popover" | "dialog";
		value: string;
		variant?: "input" | "textarea";
	};

	let {
		button_variant = "ghost",
		class: class_name,
		disabled,
		disabled_text = "N/A",
		label = "Update Text",
		min_length = 3,
		onValueChange,
		trigger,
		type = "popover",
		value,
		variant = "input",
	}: Props = $props();

	let open = $state(false);

	// svelte-ignore state_referenced_locally
	let internal_value = $state(value);

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();

		HandleSave();
	}

	function HandleSave() {
		if (internal_value.length < min_length) {
			toast.error(`Text must be ${min_length}+ characters`);
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
						class={cn("max-w-full min-w-0 shrink! text-sm font-normal", class_name)}
						{disabled}
						size="xs"
						variant={button_variant}
					>
						<span class="min-w-0 flex-1 truncate">{disabled ? disabled_text : value}</span>
					</Button>
				{/snippet}
			</PopoverTrigger>
		{/if}

		<PopoverContent align="end" class="p-3">
			<form class="flex flex-col gap-3" onsubmit={HandleFormSubmit}>
				<div class="grid gap-1.5">
					<p class="px-3 text-xs text-muted-foreground">{label}</p>

					<Input
						onchange={(ev) => (internal_value = ev.currentTarget.value)}
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
							"h-auto! min-h-7 max-w-full min-w-0 shrink! py-1.5 text-left text-sm leading-snug font-normal text-pretty whitespace-normal",
							class_name,
						)}
						{disabled}
						size="xs"
						variant={button_variant}
					>
						<span class="min-w-0 flex-1 truncate">{disabled ? disabled_text : value}</span>
					</Button>
				{/snippet}
			</DialogTrigger>
		{/if}
		<DialogContent class="sm:max-w-xl">
			<DialogHeader>
				<DialogTitle>{label}</DialogTitle>
			</DialogHeader>

			<form class="flex flex-col gap-4" onsubmit={HandleFormSubmit}>
				{#if variant == "textarea"}
					<Textarea
						{@attach GrowingTextarea}
						onchange={(ev) => (internal_value = ev.currentTarget.value)}
						value={internal_value}
					/>
				{:else}
					<Input
						onchange={(ev) => (internal_value = ev.currentTarget.value)}
						value={internal_value}
					/>
				{/if}

				<DialogFooter>
					<Button type="submit"><LucideCheck /> Save Changes</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
{/if}
