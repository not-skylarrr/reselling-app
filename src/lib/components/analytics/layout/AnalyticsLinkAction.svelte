<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { LucideChevronRight } from "@lucide/svelte";

	type Props = {
		label?: string;
		href: string;
	};

	let { label = "View Details", href }: Props = $props();
</script>

<Button {href} variant="default">{label} <LucideChevronRight /></Button>
