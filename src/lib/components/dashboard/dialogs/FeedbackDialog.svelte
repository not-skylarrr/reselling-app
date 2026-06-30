<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import FieldError from "$lib/components/ui/field/field-error.svelte";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
	import { trpc_client } from "$lib/trpc/client";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideCheck, LucideLoaderCircle, LucideMessageSquare } from "@lucide/svelte";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import z from "zod";

	let open = $state(false);

	const form = createForm(() => ({
		defaultValues: {
			title: "",
			content: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await trpc_client.feedback.create_new.mutate({
					id: GenerateQuickId(),
					title: value.title,
					content: value.content,
					created_at: new Date(),
					created_by: session_state.user_id,
					read: false,
				});

				open = false;

				toast.success("Feedback sent!");
			} catch (e) {
				console.error(e);

				toast.error("Failed to send feedback");
			}
		},
	}));
</script>

<Dialog bind:open>
	<DialogTrigger>
		{#snippet child({ props: trigger_props })}
			<Tooltip>
				<TooltipTrigger>
					{#snippet child({ props })}
						<Button
							{...props}
							{...trigger_props}
							class="text-muted-foreground hover:bg-sidebar-accent"
							size="icon-xs"
							variant="ghost"><LucideMessageSquare /></Button
						>
					{/snippet}
				</TooltipTrigger>
				<TooltipContent>Leave Feedback</TooltipContent>
			</Tooltip>
		{/snippet}
	</DialogTrigger>

	<DialogContent class="sm:max-w-2xl">
		<DialogHeader>
			<DialogTitle>Leave Feedback</DialogTitle>
			<DialogDescription
				>Help improve the application by leaving feedback on new or existing features</DialogDescription
			>
		</DialogHeader>

		<div class="flex flex-col gap-6">
			<form.Field
				name="title"
				validators={{ onSubmit: z.string().min(3, "Must be 3+ characters") }}
			>
				{#snippet children(field)}
					<Field>
						<FieldLabel>Title</FieldLabel>
						<Input
							onchange={(ev) => field.handleChange(ev.currentTarget.value)}
							placeholder="eg. Add Item Date Filter"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			<form.Field
				name="content"
				validators={{ onSubmit: z.string().min(3, "Must be 3+ characters") }}
			>
				{#snippet children(field)}
					<Field>
						<FieldLabel>Further Details</FieldLabel>
						<Textarea
							onchange={(ev) => field.handleChange(ev.currentTarget.value)}
							placeholder="Add further details here"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>
		</div>

		<DialogFooter>
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(is_submitting)}
					<Button disabled={is_submitting} onclick={() => form.handleSubmit()}>
						{#if is_submitting}
							<LucideLoaderCircle class="animate-spin" /> Sending Feedback
						{:else}
							<LucideCheck /> Send Feedback
						{/if}
					</Button>
				{/snippet}
			</form.Subscribe>
		</DialogFooter>
	</DialogContent>
</Dialog>
