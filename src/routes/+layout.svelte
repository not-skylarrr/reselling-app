<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { Toaster } from "$lib/components/ui/sonner";
	import { QueryClientProvider } from "@tanstack/svelte-query";
	import { query_client } from "$lib/queries/client.svelte";
	import { ModeWatcher, mode } from "mode-watcher";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={query_client}>
	{@render children()}
</QueryClientProvider>

<Toaster />
<ModeWatcher />
