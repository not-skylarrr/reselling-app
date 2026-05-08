<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button";
	import { ButtonGroup, ButtonGroupText } from "$lib/components/ui/button-group";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldLabel,
		Separator,
	} from "$lib/components/ui/field";
	import FieldError from "$lib/components/ui/field/field-error.svelte";
	import { Input } from "$lib/components/ui/input";
	import Switch from "$lib/components/ui/switch/switch.svelte";
	import { LucideDownload, LucideLoaderCircle, LucidePlus } from "@lucide/svelte";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import z from "zod";

	const form = createForm(() => ({
		defaultValues: {
			name: "",
			slug: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await auth_client.organization.create(
					{
						name: value.name,
						slug: value.slug,
					},
					{ throw: true },
				);

				goto("/dashboard");
			} catch (e) {
				console.error(e);

				toast.error("Failed to create organization");
			}
		},
	}));

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		form.handleSubmit();
	}
</script>

<Card class="w-full max-w-xl">
	<CardHeader>
		<CardTitle>Create new workspace</CardTitle>
		<CardDescription>Create a new team workspace to manage sales</CardDescription>
	</CardHeader>

	<CardContent>
		<form class="flex flex-col gap-6" onsubmit={HandleFormSubmit}>
			<form.Field
				name="name"
				validators={{ onBlur: z.string().min(3, "Workspace name must be 3+ characters") }}
			>
				{#snippet children(field)}
					<Field>
						<FieldLabel>Workspace Name</FieldLabel>
						<Input
							onblur={() => field.handleBlur()}
							onchange={(ev) => field.handleChange(ev.currentTarget.value)}
							placeholder="eg. Your company name"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			<form.Field
				name="slug"
				validators={{
					onBlur: z
						.string()
						.min(3, "Workspace URL must be 3+ characters")
						.regex(
							/^[a-z0-9-]*$/,
							"Workspace URL may only contain lowercase letters, numbers and dashes",
						),
				}}
			>
				{#snippet children(field)}
					<Field>
						<FieldLabel>Workspace URL</FieldLabel>

						<ButtonGroup>
							<ButtonGroupText class="font-normal text-muted-foreground"
								>https://reselling.skylarrr.dev/workspace/</ButtonGroupText
							>
							<Input
								onblur={() => field.handleBlur()}
								onchange={(ev) => field.handleChange(ev.currentTarget.value)}
								placeholder="company-name"
								value={field.state.value}
							/>
						</ButtonGroup>

						{#if field.state.meta.errors.length > 0}
							<FieldError errors={field.state.meta.errors} />
						{:else}
							<FieldDescription
								>Can only be lowercase and only container letters, numbers and dashes</FieldDescription
							>
						{/if}
					</Field>
				{/snippet}
			</form.Field>

			<div class="flex flex-col gap-3">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{#snippet children(is_submitting)}
						<Button type="submit">
							{#if is_submitting}
								<LucideLoaderCircle class="animate-spin" />
							{:else}
								<LucidePlus />
							{/if}

							Create Workspace
						</Button>
					{/snippet}
				</form.Subscribe>

				<Button href="/auth/workspace/import" variant="link"
					><LucideDownload /> Import Legacy Workspace</Button
				>
			</div>
		</form>
	</CardContent>
</Card>
