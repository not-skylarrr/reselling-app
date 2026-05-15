<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Dialog, DialogTrigger } from "$lib/components/ui/dialog";
	import { LucidePencil } from "@lucide/svelte";
</script>

<Dialog>
	<DialogTrigger>
		{#snippet child({ props })}
			<Button {...props} size="icon-sm" variant="ghost"><LucidePencil /></Button>
		{/snippet}
	</DialogTrigger>
</Dialog>
