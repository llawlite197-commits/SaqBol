import type { StaffRole, StaffUser } from "../types";

export const roleLabels: Record<StaffRole, string> = {
  CITIZEN: "Гражданин",
  OPERATOR: "Оператор",
  SUPERVISOR: "Руководитель",
  ADMIN: "Администратор"
};

export function hasAnyRole(user: StaffUser | null, roles: StaffRole[]) {
  if (!user) return false;
  return user.roles.some((role) => roles.includes(role));
}

export function canManageAdmin(user: StaffUser | null) {
  return hasAnyRole(user, ["ADMIN"]);
}

export function canProcessComplaints(user: StaffUser | null) {
  return hasAnyRole(user, ["OPERATOR", "SUPERVISOR", "ADMIN"]);
}
