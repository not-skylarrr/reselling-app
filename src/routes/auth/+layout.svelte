<script lang="ts">
	let { children } = $props();
</script>

<div
	class="flex h-svh w-svw flex-col items-center justify-center pb-[env(safe-area-inset-bottom)]"
>
	{@render children()}
</div>
