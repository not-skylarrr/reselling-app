<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<div
	class="flex h-6 flex-row items-center divide-x divide-border overflow-hidden rounded-full border dark:bg-input/30"
>
	{@render children()}
</div>
