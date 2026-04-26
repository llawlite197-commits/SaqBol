import { SetMetadata } from "@nestjs/common";
import type { UserRoleCode } from "@saqbol/db";
import { ROLES_KEY } from "../constants/auth.constants";

export const Roles = (...roles: UserRoleCode[]) => SetMetadata(ROLES_KEY, roles);
