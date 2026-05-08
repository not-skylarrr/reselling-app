<script lang="ts">
	import LucideX from "@lucide/svelte/icons/x";

	type Props = {
		onClose: () => void;
	};

	let { onClose }: Props = $props();
</script>

<button
	class="flex h-6 w-6 items-center justify-center text-muted-foreground outline-none focus-within:bg-accent hover:bg-accent hover:text-accent-foreground"
	onclick={onClose}
>
	<LucideX class="size-3" />
</button>
