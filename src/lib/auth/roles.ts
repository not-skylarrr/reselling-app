import type { AuthOrganizationRole } from "./permissions";

export function GetRoleFriendlyName(role: AuthOrganizationRole) {
	switch (role) {
		case "member":
			return "Member";

		case "admin":
			return "Admin";

		case "owner":
			return "Owner";
	}
}
