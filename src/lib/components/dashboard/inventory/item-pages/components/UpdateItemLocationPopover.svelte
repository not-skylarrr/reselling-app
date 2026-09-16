<script lang="ts">
	import SidebarLocationSelector from "$lib/components/locations/SidebarLocationSelector.svelte";
	import type { ButtonVariant } from "$lib/components/ui/button";

	type Props = {
		button_variant?: ButtonVariant;
		class?: string;
		location_id: string | null;
		onLocationChange: (location_id: string | null) => void;
	};

	let {
		button_variant = "ghost",
		class: class_name,
		location_id,
		onLocationChange,
	}: Props = $props();
</script>

<SidebarLocationSelector {button_variant} class={class_name} {location_id} {onLocationChange} />
