<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";

	const error_title = $derived(page.status == 404 ? "Page Not Found" : "An Error Occurred");
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-12 p-6">
	<div class="grid gap-2">
		<h1 class="text-center text-3xl font-semibold">{error_title}</h1>
		<p class="text-center text-pretty text-muted-foreground">
			{page.error?.message}
		</p>
	</div>
</div>
