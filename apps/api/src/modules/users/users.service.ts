import { Injectable } from "@nestjs/common";
import { AccountType, Prisma } from "@saqbol/db";
import { PrismaService } from "../../prisma/prisma.service";
import { ListUsersDto } from "./dto/list-users.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.accountType ? { accountType: query.accountType } : {}),
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: "insensitive" } },
              { phone: { contains: query.search, mode: "insensitive" } },
              {
                employeeProfile: {
                  OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } },
                    { employeeCode: { contains: query.search, mode: "insensitive" } }
                  ]
                }
              },
              {
                citizenProfile: {
                  OR: [
                    { firstName: { contains: query.search, mode: "insensitive" } },
                    { lastName: { contains: query.search, mode: "insensitive" } }
                  ]
                }
              }
            ]
          }
        : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          accountType: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          employeeProfile: true,
          citizenProfile: true,
          userRoles: {
            where: { revokedAt: null },
            include: { role: true }
          }
        },
        orderBy: [{ accountType: "asc" }, { createdAt: "desc" }],
        skip,
        take: limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        roles: item.userRoles.map((assignment) => assignment.role.code),
        isEmployee: item.accountType === AccountType.EMPLOYEE
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
