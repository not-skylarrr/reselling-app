<script lang="ts">
	import type { Snippet } from "svelte";
	import type { ResponsiveAction } from "./index";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "../dropdown-menu";
	import { MediaQuery } from "svelte/reactivity";
	import { Drawer, DrawerContent, DrawerTrigger } from "../drawer";
	import { Button } from "../button";

	type Props = {
		actions: ResponsiveAction[];
		align?: "start" | "center" | "end";
		trigger: Snippet<[Record<string, unknown>]>;
	};

	let { actions, align, trigger }: Props = $props();

	let open = $state(false);

	const is_mobile = new MediaQuery("max-width: 768px");

	function HandleActionSelect(action: ResponsiveAction) {
		action.onSelect();
		open = false;
	}
</script>

{#if is_mobile.current}
	<Drawer bind:open>
		<DrawerTrigger>
			{#snippet child({ props })}
				{@render trigger(props)}
			{/snippet}
		</DrawerTrigger>
		<DrawerContent>
			<div class="flex flex-col gap-1 pt-6 pb-3">
				{#each actions as action}
					<Button
						class="!bg-transparent text-base"
						onclick={() => HandleActionSelect(action)}
						size="lg"
						variant={action.variant == "destructive" ? "destructive" : "ghost"}
						><action.icon /> {action.label}</Button
					>
				{/each}
			</div>
		</DrawerContent>
	</Drawer>
{:else}
	<DropdownMenu bind:open>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				{@render trigger(props)}
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent {align}>
			{#each actions as action}
				<DropdownMenuItem onSelect={() => HandleActionSelect(action)} variant={action.variant}>
					<action.icon />
					{action.label}
				</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
{/if}
