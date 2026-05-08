<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { LucideInbox, LucideCircleX } from "@lucide/svelte";
</script>

<div class="flex w-full flex-1 flex-col items-center justify-center gap-8">
	<LucideInbox class="size-12 stroke-1 md:size-16" />

	<div class="flex flex-col items-center justify-center gap-2">
		<p class="text-xl font-semibold md:text-3xl">Nothing to see here</p>

		<p class="text-center text-base text-muted-foreground">
			The page you are looking for cannot be found
		</p>
	</div>

	<Button href="/dashboard">Return to Dashboard</Button>
</div>
