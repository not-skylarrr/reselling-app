<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { LucideInbox, LucideCircleX } from "@lucide/svelte";
</script>

<div class="flex w-full flex-1 flex-col items-center justify-center gap-8">
	{#if page.status == 404}
		<LucideInbox class="size-12 stroke-1 md:size-16" />
	{:else}
		<LucideCircleX class="size-12 stroke-1 md:size-16" />
	{/if}
	<div class="flex flex-col items-center justify-center gap-2">
		{#if page.status == 404}
			<p class="text-xl font-semibold md:text-3xl">Nothing to see here</p>
		{:else}
			<p class="text-xl font-semibold md:text-3xl">Whoops, something went wrong</p>
		{/if}

		<p class="text-center text-base text-muted-foreground">
			{page.error?.message ?? "An unknown error ocurred"}
		</p>
	</div>

	<Button href="/dashboard">Return to Dashboard</Button>
</div>
