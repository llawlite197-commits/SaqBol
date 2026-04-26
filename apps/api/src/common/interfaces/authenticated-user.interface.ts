import type { AccountType, UserRoleCode } from "@saqbol/db";

export type AuthenticatedUser = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  accountType: AccountType;
  roles: UserRoleCode[];
};
