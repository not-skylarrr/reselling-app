export function GetWorkspaceInitials(name: string) {
	return name
		.split(" ")
		.map((seg) => seg.charAt(0))
		.join("");
}
