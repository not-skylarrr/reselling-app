<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { LucideChevronDown, LucideCirclePlus, LucideTrash } from "@lucide/svelte";
	import {
		CreateNewFormBundleItem,
		type NewFormBundleItem,
	} from "../../../../routes/dashboard/bundles/new/+page.svelte";
	import { Input } from "$lib/components/ui/input";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { slideFade } from "$lib/utils/transition";
	import { slide } from "svelte/transition";

	type Props = {
		index: number;
		item: NewFormBundleItem;
		onItemChange: (item: NewFormBundleItem) => void;
		onItemDelete: () => void;
		sub_items: NewFormBundleItem[];
		onSubItemsInsert: (item: NewFormBundleItem) => void;
		onSubItemChange: (item_id: string, item: NewFormBundleItem) => void;
		onSubItemDelete: (item_id: string) => void;
		onMultiLinePaste: (
			content: string[],
			item_id: string,
			parent_id?: string | null,
		) => Promise<boolean>;
	};

	let {
		index,
		item,
		onItemChange,
		onItemDelete,
		sub_items,
		onSubItemDelete,
		onSubItemChange,
		onSubItemsInsert,
		onMultiLinePaste,
	}: Props = $props();

	let show_sub_items = $state(false);

	function UpdateItem(partial: Partial<NewFormBundleItem>) {
		onItemChange({ ...item, ...partial });
	}

	function InsertSubItem() {
		onSubItemsInsert(CreateNewFormBundleItem(item.id));
	}

	function UpdateSubItem(item_id: string, partial: Partial<NewFormBundleItem>) {
		const item = sub_items.find((item) => item.id == item_id);
		if (!item) throw new Error("Invalid sub item id");

		onSubItemChange(item_id, { ...item, ...partial });
	}

	async function HandleNameInputPaste(
		ev: ClipboardEvent,
		item_id: string,
		parent_id: string | null = null,
	) {
		const paste_value = ev.clipboardData?.getData("text");
		if (!paste_value) return;

		const split_content = paste_value.split("\n").filter((seg) => seg.length > 0);

		if (split_content.length > 1) {
			ev.preventDefault();

			const accepted_multiline = await onMultiLinePaste(split_content, item_id, parent_id);

			if (!accepted_multiline) {
				// Enter the value as if it was pasted
				if (parent_id == null) {
					UpdateItem({ name: paste_value });
				} else {
					UpdateSubItem(item_id, { name: paste_value });
				}
			}
		}
	}
</script>

<div class="group flex flex-row items-start gap-3 px-3 py-3 md:items-center">
	<div class="mt-1 flex size-8 items-center justify-center group-hover:hidden md:mt-0">
		<p aria-label="Item Number" class="text-xs text-muted-foreground tabular-nums">
			{`0${index + 1}`.slice(-2)}
		</p>
	</div>

	<Button
		class="group/collapsible hidden text-muted-foreground group-hover:flex"
		data-expanded={show_sub_items}
		onclick={() => (show_sub_items = !show_sub_items)}
		size="icon-sm"
		variant="ghost"
	>
		<LucideChevronDown class="group-data-[expanded=true]/collapsible:rotate-180" />
	</Button>

	<div class="flex flex-1 flex-col items-center gap-6 md:flex-row">
		<Input
			class="h-8 border border-transparent bg-transparent group-hover:border-border"
			onchange={(ev) => UpdateItem({ name: ev.currentTarget.value })}
			onpaste={(ev) => HandleNameInputPaste(ev, item.id)}
			placeholder="eg. Friends Season 1"
			value={item.name}
		/>

		<CurrencyInput
			class="h-8 border border-transparent bg-transparent group-hover:border-border"
			disabled={sub_items.length > 0}
			onValueChange={(val) => UpdateItem({ price: val })}
			value={sub_items.length > 0
				? sub_items.reduce((total, item) => {
						return total + item.price;
					}, 0)
				: item.price}
		/>
	</div>

	<div class="flex w-7 flex-row justify-end gap-3">
		<Button
			class="hidden group-hover:flex"
			onclick={() => onItemDelete()}
			size="icon-sm"
			variant="destructive"><LucideTrash /></Button
		>
	</div>
</div>

{#if show_sub_items}
	<div
		class="-mt-2 flex flex-col overflow-hidden pb-4 pl-12"
		transition:slideFade={{ axis: "y" }}
	>
		{#each sub_items as sub_item, sub_index (sub_item.id)}
			<div
				class="group flex flex-row items-start gap-3 px-3 py-3 md:items-center"
				transition:slide={{ axis: "y" }}
			>
				<div class="mt-1 flex size-8 items-center justify-center md:mt-0">
					<p aria-label="Item Number" class="text-xs text-muted-foreground tabular-nums">
						{`0${sub_index + 1}`.slice(-2)}
					</p>
				</div>

				<div class="flex flex-1 flex-col items-center gap-6 md:flex-row">
					<Input
						class="h-8 border border-transparent bg-transparent group-hover:border-border"
						onchange={(ev) => UpdateSubItem(sub_item.id, { name: ev.currentTarget.value })}
						onpaste={(ev) => HandleNameInputPaste(ev, sub_item.id, sub_item.parent_id)}
						placeholder="eg. Friends Season 1"
						value={sub_item.name}
					/>

					<CurrencyInput
						class="h-8 border border-transparent bg-transparent group-hover:border-border"
						onValueChange={(val) => UpdateSubItem(sub_item.id, { price: val })}
						value={sub_item.price}
					/>
				</div>

				<div class="flex w-19 flex-row justify-end gap-3">
					<Button
						class="hidden group-hover:flex"
						onclick={() => onSubItemDelete(sub_item.id)}
						size="icon-sm"
						variant="destructive"><LucideTrash /></Button
					>
				</div>
			</div>
		{/each}

		<div class="flex flex-row pt-2 pl-1.5">
			<Button
				class="text-muted-foreground"
				onclick={() => InsertSubItem()}
				size="sm"
				variant="ghost"><LucideCirclePlus /> Add Sub Item</Button
			>
		</div>
	</div>
{/if}
