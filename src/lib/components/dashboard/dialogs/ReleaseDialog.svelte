<script lang="ts">
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogContent,
		AlertDialogHeader,
	} from "$lib/components/ui/alert-dialog";
	import AlertDialogDescription from "$lib/components/ui/alert-dialog/alert-dialog-description.svelte";
	import AlertDialogFooter from "$lib/components/ui/alert-dialog/alert-dialog-footer.svelte";
	import AlertDialogTitle from "$lib/components/ui/alert-dialog/alert-dialog-title.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { trpc_client } from "$lib/trpc/client";
	import {
		GetPreviousReleaseCheckDateIso,
		GetReleaseTypeLabel,
		SetPreviousReleaseCheckDateToLatest,
	} from "$lib/utils/release-notes";
	import { LucideChevronRight, LucideInbox } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { format } from "date-fns";

	let display_dialog = $state(false);

	const release_query = createQuery(() => ({
		queryKey: ["releases", "unread"],
		queryFn: async () => {
			return await trpc_client.release_notes.get_latest_unread.query({
				previous_checked_at: GetPreviousReleaseCheckDateIso(),
			});
		},
	}));

	const releases = $derived(release_query.data ? release_query.data.releases : []);

	async function HandleReleaseDismiss() {
		SetPreviousReleaseCheckDateToLatest(releases);

		await release_query.refetch();

		display_dialog = false;
	}

	$effect(() => {
		if (!release_query.data) return;
		if (release_query.data.releases.length == 0) return;

		if (display_dialog == false) {
			display_dialog = true;
		}
	});
</script>

<AlertDialog bind:open={display_dialog}>
	<AlertDialogContent
		class="flex max-h-160 min-h-0 w-full flex-col gap-3 overflow-hidden"
		size="large"
	>
		<AlertDialogHeader>
			<AlertDialogTitle class="text-xl">What's New?</AlertDialogTitle>
		</AlertDialogHeader>

		{#if release_query.isLoading}
			<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-12">
				<p class="text-sm text-muted-foreground">Checking for updates...</p>
			</div>
		{:else if releases.length == 0}
			<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-12">
				<LucideInbox class="size-10 stroke-muted-foreground stroke-1" />
				<p class="text-sm text-muted-foreground">No new changes to view</p>
			</div>
		{:else}
			<ScrollArea class="-mx-3 min-h-0 flex-1 overflow-hidden pr-4" type="always">
				<div class="flex flex-col gap-8 pb-1">
					{#each releases as release (release.released_at)}
						<div class="flex flex-col gap-4 rounded-xl border bg-card p-4">
							<div class="flex flex-row items-center justify-between">
								<p class="text-lg font-medium">
									{format(release.released_at, "do MMMM yyyy")}
								</p>

								{#if release.display_release_time}
									<p class="text-sm text-muted-foreground">
										{format(release.released_at, "hh:mm bb")}
									</p>
								{/if}
							</div>

							<ul class="flex flex-col gap-3">
								{#each release.changes as change}
									<li>
										<div class="flex flex-col gap-3">
											<div class="flex flex-row items-center gap-3">
												<p class="font-medium">{change.title}</p>

												<Badge class="h-5" variant="secondary"
													>{GetReleaseTypeLabel(change.type)}</Badge
												>
											</div>

											{#if change.details}
												<ul class="flex list-outside list-disc flex-col gap-1.5 pb-4 pl-7">
													{#each change.details as detail}
														<li class="text-sm">
															{detail}
														</li>
													{/each}
												</ul>
											{/if}
										</div>
									</li>
								{/each}
							</ul>
						</div>
					{/each}
				</div>
			</ScrollArea>
		{/if}

		<AlertDialogFooter>
			<AlertDialogAction onclick={() => HandleReleaseDismiss()}>
				Continue to App <LucideChevronRight />
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
