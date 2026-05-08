<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { createForm, useStore } from "@tanstack/svelte-form";
	import {
		CreateNewFormBundleItem,
		type NewFormBundleItem,
	} from "../../../../../routes/dashboard/bundles/new/+page.svelte";
	import { Field, FieldDescription, FieldLabel } from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import { NumberInput } from "$lib/components/ui/number-input";
	import { Button } from "$lib/components/ui/button";
	import { LucideCheck } from "@lucide/svelte";

	type Props = {
		base_name: string;
		open: boolean;
		onItemsInsert: (items: NewFormBundleItem[]) => void;
	};

	let { base_name, open = $bindable(), onItemsInsert }: Props = $props();

	const form = createForm(() => ({
		defaultValues: {
			quantifier: "Series",
			series_count: 0,
		},
		onSubmit: ({ value }) => {
			let items: NewFormBundleItem[] = [];

			for (let i = 0; i < value.series_count; i++) {
				let item = CreateNewFormBundleItem();

				item.name = `${base_name} ${value.quantifier} ${i + 1}`;

				items.push(item);
			}

			onItemsInsert(items);

			open = false;
		},
	}));
</script>

<Dialog bind:open>
	<DialogContent class="w-full sm:max-w-lg">
		<DialogHeader>
			<DialogTitle>Insert Series</DialogTitle>
			<DialogDescription>Insert multiple items in a series format</DialogDescription>
		</DialogHeader>

		<div class="flex flex-col gap-6">
			<Field>
				<FieldLabel class="px-3">Series Name</FieldLabel>
				<Input readonly value={base_name} />
				<FieldDescription class="px-3">Inherited from bundle name</FieldDescription>
			</Field>

			<form.Field name="quantifier">
				{#snippet children(field)}
					<Field>
						<FieldLabel class="px-3">Series Type</FieldLabel>
						<Input
							onchange={(ev) => field.handleChange(ev.currentTarget.value)}
							value={field.state.value}
						/>
						<FieldDescription class="px-3"
							>Result: {base_name} {field.state.value} 1</FieldDescription
						>
					</Field>
				{/snippet}
			</form.Field>

			<form.Field name="series_count">
				{#snippet children(field)}
					<Field>
						<FieldLabel class="px-3">Series Count</FieldLabel>
						<NumberInput
							onValueChange={(val) => field.handleChange(val ?? 0)}
							value={field.state.value}
						/>
					</Field>
				{/snippet}
			</form.Field>
		</div>

		<DialogFooter>
			<Button onclick={() => form.handleSubmit()}><LucideCheck /> Insert Items</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
