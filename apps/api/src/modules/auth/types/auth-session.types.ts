import type { AccountType, UserRoleCode } from "@saqbol/db";

export type SessionUserPayload = {
  userId: string;
  email?: string | null;
  phone?: string | null;
  accountType: AccountType;
  roles: UserRoleCode[];
};

export type IssuedSession = {
  accessToken: string;
  refreshToken: string;
  refreshTokenId: string;
  expiresIn: string;
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    roles: UserRoleCode[];
    accountType: AccountType;
  };
};
