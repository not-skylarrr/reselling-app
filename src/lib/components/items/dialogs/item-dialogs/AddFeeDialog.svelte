<script lang="ts">
	import { createForm } from "@tanstack/svelte-form";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import {
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { Field, FieldError, FieldLabel } from "$lib/components/ui/field";
	import Input from "$lib/components/ui/input/input.svelte";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { Button } from "$lib/components/ui/button";
	import { LucidePlus } from "@lucide/svelte";
	import { ItemFeesCollection } from "$lib/collections/def.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { session_state } from "$lib/utils/session.svelte";
	import { toast } from "svelte-sonner";

	type Props = ItemDialogProps<"add-fee">;

	let { item, meta, request_close }: Props = $props();

	const form = createForm(() => ({
		defaultValues: {
			ref_name: "",
			ref_details: "",
			amount: 0,
			buyer_paid: false,
		},
		onSubmit: async ({ value }) => {
			try {
				ItemFeesCollection.insert({
					id: GenerateQuickId(),
					item_id: item.id,
					listing_id: meta.listing_id,
					workspace_id: session_state.workspace_id,
					type: meta.type,
					amount: value.amount,
					buyer_paid: value.buyer_paid,
					marketplace_id: null,
					reference_name: value.ref_name,
					reference_details: value.ref_details,
					created_at: new Date(),
					removed: false,
					removal_reason: null,
				});

				request_close();
			} catch (e) {
				console.error(e);

				toast.error("Failed to create fee");
			}
		},
	}));

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();

		form.handleSubmit();
	}
</script>

<DialogContent class="sm:max-w-xl">
	<DialogHeader>
		<DialogTitle>Add New Fee</DialogTitle>
		<DialogDescription>Add a new fee to this item</DialogDescription>
	</DialogHeader>

	<form class="flex flex-col gap-6" onsubmit={HandleFormSubmit}>
		<form.Field name="ref_name">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Fee Reference</FieldLabel>
					<Input
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						placeholder="eg. Ebay Final Fee"
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field name="ref_details">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Fee Details</FieldLabel>
					<Input
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						placeholder="eg. Any Additional Details"
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field name="amount">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Fee Amount</FieldLabel>
					<CurrencyInput
						onblur={() => field.handleBlur()}
						onValueChange={(val) => field.handleChange(val)}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field name="buyer_paid">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Buyer Paid Fee</FieldLabel>
					<Select
						type="single"
						onValueChange={(val) => field.handleChange(val == "yes")}
						value={field.state.value ? "yes" : "no"}
					>
						<SelectTrigger>{field.state.value ? "Yes" : "No"}</SelectTrigger>
						<SelectContent>
							<SelectItem value="yes">Yes</SelectItem>
							<SelectItem value="no">No</SelectItem>
						</SelectContent>
					</Select>

					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<DialogFooter>
			<Button onclick={() => request_close()} type="button" variant="ghost">Cancel</Button>
			<Button type="submit"><LucidePlus /> Create Item Fee</Button>
		</DialogFooter>
	</form>
</DialogContent>
