import { Injectable } from "@nestjs/common";
import { Prisma } from "@saqbol/db";
import { PrismaService } from "../../prisma/prisma.service";
import { ListRolesDto } from "./dto/list-roles.dto";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListRolesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const where: Prisma.RoleWhereInput = {
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {})
    };

    const [items, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
        skip,
        take: limit
      }),
      this.prisma.role.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
