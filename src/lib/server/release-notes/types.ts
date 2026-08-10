export type ReleaseChangeType = "added" | "improved" | "fixed" | "removed" | "upcoming";

export type ReleaseChangeData = {
	type: ReleaseChangeType;
	title: string;
	details?: string[];
};

export type ReleaseJsonData = {
	title: string;
	released_at: string;
	changes: ReleaseChangeData[];
};

export type CompleteReleaseData = Omit<ReleaseJsonData, "released_at"> & {
	slug: string;
	released_at: Date;
};

export type ReleaseApiData = Omit<CompleteReleaseData, "released_at"> & {
	released_at: string;
	display_release_time: boolean;
};
