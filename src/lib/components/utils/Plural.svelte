<script lang="ts">
	type Props = {
		count: number;
		singular: string;
		plural: string;
	};

	let { count, singular, plural }: Props = $props();
</script>

{#if count == 0 || count > 1}
	{plural}
{:else}
	{singular}
{/if}
