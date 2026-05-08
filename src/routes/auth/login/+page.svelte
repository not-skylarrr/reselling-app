<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Field, FieldError, FieldLabel } from "$lib/components/ui/field";
	import Input from "$lib/components/ui/input/input.svelte";
	import { LucideLoaderCircle, LucideLock } from "@lucide/svelte";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";

	let { data } = $props();

	const form = createForm(() => ({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			const { error } = await auth_client.signIn.email({
				email: value.email,
				password: value.password,
			});

			if (error) {
				toast.error(error.message ?? "An unknown error occurred");

				return;
			}

			goto(data.ref ?? "/dashboard");
		},
	}));

	const create_account_href = $derived(
		data.ref
			? `/auth/create-account?ref=${encodeURIComponent(data.ref)}`
			: "/auth/create-account",
	);

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		form.handleSubmit();
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-16 p-6">
	<div class="grid w-full max-w-124 gap-2">
		<h1 class="text-center text-3xl font-semibold">Welcome Back</h1>
		<p class="text-center text-pretty text-muted-foreground">
			Sign in to your reselling account and start managing your business
		</p>
	</div>

	<form class="flex w-full max-w-124 flex-col gap-6" onsubmit={HandleFormSubmit}>
		<form.Field name="email">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Email Address</FieldLabel>
					<Input
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
				</Field>
			{/snippet}
		</form.Field>

		<form.Field name="password">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Password</FieldLabel>
					<Input
						type="password"
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
				</Field>
			{/snippet}
		</form.Field>

		<div class="flex flex-col gap-3">
			<form.Subscribe selector={(state) => state.isSubmitting}>
				{#snippet children(is_submitting)}
					<Button disabled={is_submitting} type="submit">
						{#if is_submitting}
							<LucideLoaderCircle class="animate-spin" />
						{/if}

						Sign In
					</Button>
				{/snippet}
			</form.Subscribe>

			<p class="text-center text-sm text-muted-foreground">
				Don't have an account? <a
					class="text-primary hover:underline"
					href={create_account_href}>Create one</a
				>
			</p>
		</div>
	</form>
</div>
