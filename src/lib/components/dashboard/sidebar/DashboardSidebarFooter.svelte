<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { SidebarFooter } from "$lib/components/ui/sidebar";
	import { LucideShield } from "@lucide/svelte";
	import FeedbackDialog from "../dialogs/FeedbackDialog.svelte";

	type Props = {
		is_admin: boolean;
	};

	let { is_admin }: Props = $props();
</script>

<SidebarFooter>
	<div
		class="flex flex-row items-center justify-between gap-2 group-data-[state=collapsed]:flex-col"
	>
		{#if is_admin}
			<Button
				class="text-muted-foreground hover:bg-sidebar-accent"
				href="/admin"
				size="icon-xs"
				variant="ghost"><LucideShield class="size-4" /></Button
			>
		{/if}
		<FeedbackDialog />
	</div>
</SidebarFooter>
