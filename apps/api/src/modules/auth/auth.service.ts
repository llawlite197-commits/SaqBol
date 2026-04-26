import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import {
  AccountType,
  NotificationChannel,
  NotificationType,
  OtpDeliveryChannel,
  OtpPurpose,
  TwoFactorMethod,
  TwoFactorSessionStatus,
  UserRoleCode,
  UserStatus
} from "@saqbol/db";
import { randomInt, randomUUID } from "node:crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { LogoutDto } from "./dto/logout.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { StaffLoginDto } from "./dto/staff-login.dto";
import { VerifyStaffTwoFactorDto } from "./dto/verify-staff-2fa.dto";
import {
  calculateRefreshExpiry,
  generateRefreshToken,
  generateRefreshTokenRecordId,
  generateTokenFamilyId,
  hashToken
} from "./helpers/refresh-token.helper";
import { hashPassword, verifyPassword } from "./helpers/password.helper";
import type { IssuedSession, SessionUserPayload } from "./types/auth-session.types";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly staffRoles: UserRoleCode[] = [
    UserRoleCode.OPERATOR,
    UserRoleCode.SUPERVISOR,
    UserRoleCode.ADMIN
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: dto.email }, { phone: dto.phone }]
      }
    });

    if (existingUser) {
      throw new BadRequestException("A user with this email or phone already exists.");
    }

    const role = await this.prisma.role.findUnique({
      where: {
        code: UserRoleCode.CITIZEN
      }
    });

    if (!role) {
      throw new BadRequestException("Citizen role is not configured.");
    }

    const passwordHash = await hashPassword(dto.password);
    const preferredLanguage = this.normalizeLanguage(dto.preferredLanguage);
    const otpCode = this.generateVerificationCode();

    const user = await this.prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          accountType: AccountType.CITIZEN,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
          passwordChangedAt: new Date()
        }
      });

      await transaction.citizenProfile.create({
        data: {
          userId: createdUser.id,
          iin: dto.iin ?? null,
          firstName: dto.firstName,
          lastName: dto.lastName,
          patronymic: dto.patronymic ?? null,
          regionId: dto.regionId ?? null,
          preferredLanguage,
          address: dto.address ?? null
        }
      });

      await transaction.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: role.id
        }
      });

      await transaction.otpCode.create({
        data: {
          userId: createdUser.id,
          purpose: OtpPurpose.REGISTRATION,
          channel: dto.email ? OtpDeliveryChannel.EMAIL : OtpDeliveryChannel.SMS,
          target: dto.email ?? dto.phone,
          codeHash: hashToken(otpCode),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
      });

      await transaction.notification.create({
        data: {
          userId: createdUser.id,
          channel: dto.email ? NotificationChannel.EMAIL : NotificationChannel.SMS,
          notificationType: NotificationType.OTP,
          subject: "SaqBol.kz registration",
          body: `Mock verification code: ${otpCode}`
        }
      });

      return createdUser;
    });

    this.logger.log(
      `Mock registration OTP for ${dto.email ?? dto.phone}: ${otpCode}`
    );

    return {
      userId: user.id,
      role: UserRoleCode.CITIZEN,
      otp: {
        mocked: true,
        code: otpCode,
        expiresInSeconds: 600
      }
    };
  }

  async loginCitizen(dto: LoginDto) {
    const user = await this.getUserForLogin(dto.login);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    const roles = this.extractActiveRoles(user.userRoles);
    const isCitizen = roles.includes(UserRoleCode.CITIZEN);

    if (!isCitizen || user.accountType !== AccountType.CITIZEN) {
      throw new UnauthorizedException("Citizen access is required.");
    }

    return this.issueSession({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      roles
    });
  }

  async loginStaff(dto: StaffLoginDto) {
    const user = await this.getUserForLogin(dto.login);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid login or password.");
    }

    const roles = this.extractActiveRoles(user.userRoles);
    const hasStaffRole = roles.some((role) => this.staffRoles.includes(role));

    if (!hasStaffRole || user.accountType !== AccountType.EMPLOYEE) {
      throw new UnauthorizedException("Staff access is required.");
    }

    const session = await this.issueSession({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      roles
    });

    return {
      requiresTwoFactor: false,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      user: session.user
    };
  }

  async verifyStaffTwoFactor(dto: VerifyStaffTwoFactorDto) {
    const session = await this.prisma.twoFactorSession.findUnique({
      where: {
        id: dto.sessionId
      },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                revokedAt: null
              },
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!session || session.sessionStatus !== TwoFactorSessionStatus.PENDING) {
      throw new UnauthorizedException("2FA session is invalid.");
    }

    if (session.challengeExpiresAt < new Date()) {
      await this.prisma.twoFactorSession.update({
        where: { id: session.id },
        data: {
          sessionStatus: TwoFactorSessionStatus.EXPIRED
        }
      });

      throw new UnauthorizedException("2FA session has expired.");
    }

    const isCodeValid = hashToken(dto.code) === session.verificationTokenHash;

    if (!isCodeValid) {
      throw new UnauthorizedException("Invalid 2FA code.");
    }

    await this.prisma.twoFactorSession.update({
      where: {
        id: session.id
      },
      data: {
        sessionStatus: TwoFactorSessionStatus.VERIFIED,
        verifiedAt: new Date()
      }
    });

    const roles = this.extractActiveRoles(session.user.userRoles);

    return this.issueSession({
      userId: session.user.id,
      email: session.user.email,
      phone: session.user.phone,
      accountType: session.user.accountType,
      roles
    });
  }

  async refreshCitizen(dto: RefreshTokenDto) {
    return this.refresh(dto, "citizen");
  }

  async refreshStaff(dto: RefreshTokenDto) {
    return this.refresh(dto, "staff");
  }

  async logout(userId: string, dto: LogoutDto) {
    if (dto.refreshToken) {
      const tokenHash = hashToken(dto.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          tokenHash,
          revokedAt: null
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date()
        }
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date()
        }
      });
    }

    return {
      success: true
    };
  }

  async me(userId: string, scope: "citizen" | "staff") {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      include: {
        userRoles: {
          where: {
            revokedAt: null
          },
          include: {
            role: true
          }
        },
        citizenProfile: true,
        employeeProfile: true
      }
    });

    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    const roles = this.extractActiveRoles(user.userRoles);
    const isCitizenScope = roles.includes(UserRoleCode.CITIZEN);
    const isStaffScope = roles.some((role) => this.staffRoles.includes(role));

    if (scope === "citizen" && (!isCitizenScope || user.accountType !== AccountType.CITIZEN)) {
      throw new UnauthorizedException("Citizen profile is not available.");
    }

    if (scope === "staff" && (!isStaffScope || user.accountType !== AccountType.EMPLOYEE)) {
      throw new UnauthorizedException("Staff profile is not available.");
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      accountType: user.accountType,
      status: user.status,
      roles,
      citizenProfile: user.citizenProfile,
      employeeProfile: user.employeeProfile
    };
  }

  private async refresh(dto: RefreshTokenDto, scope: "citizen" | "staff") {
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashToken(dto.refreshToken)
      },
      include: {
        user: {
          include: {
            userRoles: {
              where: {
                revokedAt: null
              },
              include: {
                role: true
              }
            }
          }
        }
      }
    });

    if (!existingToken || existingToken.revokedAt || existingToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token is invalid or expired.");
    }

    const roles = this.extractActiveRoles(existingToken.user.userRoles);
    const isCitizen = roles.includes(UserRoleCode.CITIZEN);
    const isStaff = roles.some((role) => this.staffRoles.includes(role));

    if (scope === "citizen" && (!isCitizen || existingToken.user.accountType !== AccountType.CITIZEN)) {
      throw new UnauthorizedException("Citizen refresh token is invalid.");
    }

    if (scope === "staff" && (!isStaff || existingToken.user.accountType !== AccountType.EMPLOYEE)) {
      throw new UnauthorizedException("Staff refresh token is invalid.");
    }

    const nextSession = await this.issueSession({
      userId: existingToken.user.id,
      email: existingToken.user.email,
      phone: existingToken.user.phone,
      accountType: existingToken.user.accountType,
      roles,
      tokenFamilyId: existingToken.tokenFamilyId
    });

    await this.prisma.refreshToken.update({
      where: {
        id: existingToken.id
      },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: nextSession.refreshTokenId,
        lastUsedAt: new Date()
      }
    });

    return {
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
      expiresIn: nextSession.expiresIn,
      user: nextSession.user
    };
  }

  private async getUserForLogin(login: string) {
    return this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: login }, { phone: login }]
      },
      include: {
        userRoles: {
          where: {
            revokedAt: null
          },
          include: {
            role: true
          }
        },
        employeeProfile: true
      }
    });
  }

  private async issueSession(params: SessionUserPayload & { tokenFamilyId?: string }): Promise<IssuedSession> {
    const accessTtl = (this.configService.get<string>("JWT_ACCESS_TTL") ??
      "15m") as JwtSignOptions["expiresIn"];
    const accessSecret = this.configService.get<string>("JWT_ACCESS_SECRET");

    if (!accessSecret) {
      throw new Error("JWT_ACCESS_SECRET is not configured.");
    }

    const payload = {
      sub: params.userId,
      email: params.email ?? null,
      phone: params.phone ?? null,
      accountType: params.accountType,
      roles: params.roles
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessTtl
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenId = generateRefreshTokenRecordId();

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: params.userId,
        tokenHash: hashToken(refreshToken),
        tokenFamilyId: params.tokenFamilyId ?? generateTokenFamilyId(),
        expiresAt: calculateRefreshExpiry()
      }
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
      expiresIn: String(accessTtl),
      user: {
        id: params.userId,
        email: params.email ?? null,
        phone: params.phone ?? null,
        roles: params.roles,
        accountType: params.accountType
      }
    };
  }

  private extractActiveRoles(
    assignments: Array<{
      role: {
        code: UserRoleCode;
      };
    }>
  ) {
    return assignments.map((assignment) => assignment.role.code);
  }

  private normalizeLanguage(input?: string) {
    if (!input) {
      return "ru";
    }

    if (input === "kz") {
      return "kk";
    }

    return input;
  }

  private generateVerificationCode() {
    return String(randomInt(100000, 999999));
  }
}
