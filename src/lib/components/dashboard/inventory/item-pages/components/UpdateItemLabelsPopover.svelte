<script lang="ts">
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import type { ButtonVariant } from "$lib/components/ui/button";
	import type { WorkspaceLabel } from "$lib/server/db/schema";

	type Props = {
		button_variant?: ButtonVariant;
		class?: string;
		labels: WorkspaceLabel[];
		onLabelsChange: (label_ids: string[]) => void;
	};

	let { button_variant = "ghost", class: class_name, labels, onLabelsChange }: Props = $props();
</script>

<SidebarLabelSelector {button_variant} class={class_name} {labels} {onLabelsChange} />
