<script lang="ts">
	import Hashvatar from "$lib/components/utils/Hashvatar.svelte";
	import type { ServerUser } from "$lib/server/auth";

	type Props = {
		user: ServerUser;
	};

	let { user }: Props = $props();
</script>

<div class="flex flex-row items-center gap-2">
	<Hashvatar hash={user.name} size={16} />
	<p>{user.name}</p>
</div>
