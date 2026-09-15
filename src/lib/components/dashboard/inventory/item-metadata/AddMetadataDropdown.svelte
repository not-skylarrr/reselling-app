<script lang="ts">
	import {
		ItemMetadataCollection,
		ItemMetadataDefinitionsCollection,
	} from "$lib/collections/def.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { Input } from "$lib/components/ui/input";
	import { NumberInput } from "$lib/components/ui/number-input";
	import { GetMetadataTypeName, SerializeItemMetadataField } from "$lib/items/metadata";
	import type { ItemMetadataType, ItemWithLabels } from "$lib/server/db/schema";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideLoaderCircle, LucidePlus } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";

	type Props = {
		item: ItemWithLabels;
		used_meta_ids?: string[];
	};

	let { item, used_meta_ids = [] }: Props = $props();

	let dialog_open = $state(false);
	let dialog_meta_id = $state("");
	let dialog_meta_type = $state<ItemMetadataType>("string");
	let dialog_meta_value = $state<any>("");
	let dialog_submitting = $state(false);

	const metadata_query = useLiveQuery((q) =>
		q.from({ definition: ItemMetadataDefinitionsCollection }),
	);

	function HandleDropdownSelect(id: string, type: ItemMetadataType) {
		dialog_meta_id = id;
		dialog_meta_type = type;
		dialog_open = true;

		switch (type) {
			case "currency":
				dialog_meta_value = 0;
				break;

			case "string":
				dialog_meta_value = "";
				break;

			case "number":
				dialog_meta_value = 0;
				break;
		}
	}

	async function HandleDialogSubmit() {
		switch (dialog_meta_type) {
			case "string":
				if (dialog_meta_value.length == 0) return toast.error("Text must be 1+ characters");
				break;
		}

		const string_value = SerializeItemMetadataField(dialog_meta_type, dialog_meta_value);

		const insert = ItemMetadataCollection.insert({
			id: GenerateQuickId(),
			item_id: item.id,
			workspace_id: session_state.workspace_id,
			metadata_id: dialog_meta_id,
			value_string: string_value,
			created_at: new Date(),
		});

		try {
			await insert.isPersisted.promise;

			dialog_open = false;
			dialog_meta_id = "";
			dialog_meta_type = "string";
			dialog_meta_value = "";
		} catch (e) {
			toast.error("Failed to save metadata");
		}
	}
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} size="icon-xs" variant="ghost">
				<LucidePlus class="size-4" />
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent>
		{#each metadata_query.data as metadata (metadata.id)}
			{#if !used_meta_ids.includes(metadata.id)}
				<DropdownMenuItem onSelect={() => HandleDropdownSelect(metadata.id, metadata.type)}>
					<div class="grid">
						<p>Add {metadata.name}</p>
						<p class="text-xs text-muted-foreground">{GetMetadataTypeName(metadata.type)}</p>
					</div>
				</DropdownMenuItem>
			{/if}
		{/each}
	</DropdownMenuContent>
</DropdownMenu>

<Dialog bind:open={dialog_open}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Add {GetMetadataTypeName(dialog_meta_type)}</DialogTitle>
			<DialogDescription>Add new metadata to this item</DialogDescription>
		</DialogHeader>

		{#if dialog_meta_type == "string"}
			<Input
				placeholder={GetMetadataTypeName(dialog_meta_type)}
				bind:value={dialog_meta_value}
			/>
		{/if}

		{#if dialog_meta_type == "number"}
			<NumberInput
				onValueChange={(val) => (dialog_meta_value = val)}
				value={dialog_meta_value}
			/>
		{/if}

		{#if dialog_meta_type == "currency"}
			<CurrencyInput
				onValueChange={(val) => (dialog_meta_value = val)}
				value={dialog_meta_value}
			/>
		{/if}

		<Button
			disabled={dialog_submitting == true}
			onclick={async () => {
				dialog_submitting = true;

				await HandleDialogSubmit();

				dialog_submitting = false;
			}}
		>
			{#if dialog_submitting}
				<LucideLoaderCircle class="animate-spin" />
			{/if}

			Add Metadata
		</Button>
	</DialogContent>
</Dialog>
