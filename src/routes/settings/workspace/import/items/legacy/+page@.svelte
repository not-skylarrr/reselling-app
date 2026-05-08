<script>
	import { Button } from "$lib/components/ui/button";
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-16 p-6">
	<div class="grid w-full max-w-124 gap-2">
		<h1 class="text-center text-3xl font-semibold">Import Legacy Items</h1>
		<p class="text-center text-pretty text-muted-foreground">
			Import items from a previous version of the application
		</p>
	</div>

	<div class="flex w-full max-w-124 flex-col">
		<Button size="lg">Select Import File</Button>
	</div>
</div>
