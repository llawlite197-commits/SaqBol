import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import type { AccountType, UserRoleCode } from "@saqbol/db";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthenticatedUser } from "../../../common/interfaces/authenticated-user.interface";

type JwtPayload = {
  sub: string;
  email?: string | null;
  phone?: string | null;
  accountType: AccountType;
  roles: UserRoleCode[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret =
      configService.get<string>("JWT_ACCESS_SECRET") ??
      "local_dev_access_secret_change_me_please_64_chars_minimum_saqbol";

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException("Invalid access token payload.");
    }

    return {
      userId: payload.sub,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      accountType: payload.accountType,
      roles: payload.roles ?? []
    };
  }
}
