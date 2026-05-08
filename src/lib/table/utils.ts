export function GetColumnSizingCssVarName(column_id: string) {
	const safe_id = column_id.replace(/[^a-zA-Z0-9_-]/g, "-");

	return `--iv-col-${safe_id}-size`;
}

export function GetColumnSizingCssVar(column_id: string) {
	return `var(${GetColumnSizingCssVarName(column_id)})`;
}

export function GetColumnSizingCssVarWithFallback(column_id: string, fallback: number) {
	return `var(${GetColumnSizingCssVarName(column_id)}, ${fallback}px)`;
}
