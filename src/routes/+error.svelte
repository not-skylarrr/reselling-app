<script lang="ts">
	import { page } from "$app/state";
	import { Button } from "$lib/components/ui/button";
	import { LucideInbox, LucideCircleX } from "@lucide/svelte";

	function GetErrorTitle(status: number) {
		switch (status) {
			case 401:
				return "Invalid Permissions";

			case 403:
				return "Invalid Permissions";

			case 404:
				return "Nothing To See Here";

			default:
				return "Whoops, something went wrong";
		}
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-8">
	<div class="flex flex-col items-center justify-center gap-4">
		<p class="text-xl font-semibold md:text-3xl">{GetErrorTitle(page.status)}</p>

		<p class="text-center text-base text-muted-foreground">
			{page.error?.message ?? "An unknown error ocurred"}
		</p>
	</div>
</div>
