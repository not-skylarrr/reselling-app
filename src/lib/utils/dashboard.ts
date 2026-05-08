const INVENTORY_DETAILS_KEY = "inv_dt_tg";

export function GetLocalDetailsOpenState() {
	if (typeof window == "undefined") return false;

	const open_state = window.localStorage.getItem(INVENTORY_DETAILS_KEY);

	return open_state == "1";
}

export function SetLocalDetailsOpenState(open: boolean) {
	if (typeof window == "undefined") return;

	window.localStorage.setItem(INVENTORY_DETAILS_KEY, open ? "1" : "0");
}
