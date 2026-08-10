import z from "zod";

const ReleaseChangeTypeSchema = z.enum(["added", "improved", "fixed", "removed", "upcoming"]);

export const ReleaseChangeSchema = z.object({
	type: ReleaseChangeTypeSchema,
	title: z.string().trim().min(1),
	details: z.array(z.string().trim().min(1)).optional(),
});

export const ReleaseJsonSchema = z.object({
	title: z.string().trim().min(1),
	released_at: z.string().datetime({ offset: true }),
	changes: z.array(ReleaseChangeSchema).min(1),
});

export const GetLatestUnreadReleaseSchema = z.object({
	previous_checked_at: z.string().datetime({ offset: true }).nullable().optional(),
});
