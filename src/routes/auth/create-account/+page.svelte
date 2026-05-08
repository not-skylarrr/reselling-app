<script lang="ts">
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
	import { createForm } from "@tanstack/svelte-form";
	import { LucideCircleUser, LucideLoaderCircle } from "@lucide/svelte";
	import { z } from "zod";
	import { auth_client } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import { toast } from "svelte-sonner";

	const { data } = $props();

	const form = createForm(() => ({
		defaultValues: {
			email: "",
			name: "",
			password: "",
			confirm_password: "",
		},
		onSubmit: async ({ value }) => {
			const { error } = await auth_client.signUp.email({
				email: value.email,
				name: value.name,
				password: value.password,
			});

			if (error) {
				console.error(error);

				return toast.error("Failed to create account");
			}

			goto("/");
		},
	}));

	const login_href = $derived(
		data.ref ? `/auth/login?ref=${encodeURIComponent(data.ref)}` : "/auth/login",
	);

	function HandleFormSubmit(ev: Event) {
		ev.preventDefault();
		ev.stopPropagation();

		form.handleSubmit();
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-16 p-6">
	<div class="grid w-full max-w-124 gap-2">
		<h1 class="text-center text-3xl font-semibold">Create Account</h1>
		<p class="text-center text-pretty text-muted-foreground">
			Create a reselling account and start managing your business
		</p>
	</div>

	<form class="flex w-full max-w-124 flex-col gap-6" onsubmit={HandleFormSubmit}>
		<form.Field name="email" validators={{ onBlur: z.email("Please provide a valid email") }}>
			{#snippet children(field)}
				<Field>
					<FieldLabel>Email Address</FieldLabel>
					<Input
						placeholder="eg. johndoe@company.com"
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field
			name="name"
			validators={{ onBlur: z.string().min(3, "Name must be 3+ characters") }}
		>
			{#snippet children(field)}
				<Field>
					<FieldLabel>Your Name</FieldLabel>
					<Input
						placeholder="eg. John Doe"
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field
			name="password"
			validators={{ onBlur: z.string().min(6, "Password must be 6+ characters") }}
		>
			{#snippet children(field)}
				<Field>
					<FieldLabel>Password</FieldLabel>
					<Input
						type="password"
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field
			name="confirm_password"
			validators={{
				onBlur: ({ value, fieldApi }) => {
					if (value != fieldApi.form.getFieldValue("password")) return "Passwords do not match";

					return undefined;
				},
			}}
		>
			{#snippet children(field)}
				<Field>
					<FieldLabel>Confirm Password</FieldLabel>
					<Input
						type="password"
						onblur={() => field.handleBlur()}
						onchange={(ev) => field.handleChange(ev.currentTarget.value)}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
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
				Already have an account? <a class="text-primary hover:underline" href={login_href}
					>Sign In</a
				>
			</p>
		</div>
	</form>
</div>
