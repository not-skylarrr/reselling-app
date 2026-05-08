<script lang="ts">
	let { children } = $props();
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center">
	{@render children()}
</div>
