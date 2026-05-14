<script lang="ts">
	import Hashvatar from "$lib/components/utils/Hashvatar.svelte";
	import type { ServerUser } from "$lib/server/auth";

	type Props = {
		user: {
			id: string;
			name: string;
			email: string;
		};
	};

	let { user }: Props = $props();
</script>

<div class="flex flex-row items-center gap-2">
	<Hashvatar hash={user.email} size={16} />
	<p>{user.name}</p>
</div>
