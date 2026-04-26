"use client";

import { getStaffUser } from "../lib/auth";
import { hasAnyRole } from "../lib/rbac";
import type { StaffRole } from "../types";

export function RoleGate({
  roles,
  children,
  fallback = null
}: {
  roles: StaffRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return hasAnyRole(getStaffUser(), roles) ? children : fallback;
}
