<script lang="ts">
	import { cn } from "$lib/utils";

	type Props = {
		muted?: boolean;
		value: string;
	};

	let { muted = false, value }: Props = $props();
</script>

<p class={cn("text-sm", muted && "text-muted-foreground")}>
	{value}
</p>
