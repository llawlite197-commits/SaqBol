import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, NewsStatus, Prisma } from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateNewsDto } from "./dto/create-news.dto";
import { ListNewsDto } from "./dto/list-news.dto";
import { PublishNewsDto } from "./dto/publish-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";

@Injectable()
export class NewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublishedNews(query: ListNewsDto) {
    return this.listNews(
      {
        ...query,
        status: NewsStatus.PUBLISHED
      },
      false
    );
  }

  async getPublishedNewsBySlug(slug: string) {
    const news = await this.prisma.news.findFirst({
      where: {
        slug,
        status: NewsStatus.PUBLISHED,
        deletedAt: null
      },
      include: {
        region: true
      }
    });

    if (!news) {
      throw new NotFoundException("News not found.");
    }

    return news;
  }

  async listAdminNews(query: ListNewsDto) {
    return this.listNews(query, true);
  }

  async createNews(user: AuthenticatedUser, dto: CreateNewsDto) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.titleRu);
    const status = dto.status ?? NewsStatus.DRAFT;

    const news = await this.prisma.news.create({
      data: {
        titleRu: dto.titleRu,
        titleKz: dto.titleKz ?? dto.titleRu,
        slug,
        summaryRu: dto.summaryRu,
        summaryKz: dto.summaryKz ?? null,
        contentRu: dto.contentRu,
        contentKz: dto.contentKz ?? dto.contentRu,
        status,
        coverImageBucket: dto.coverImageObjectKey ? "local" : null,
        coverImageObjectKey: dto.coverImageObjectKey ?? null,
        regionId: dto.regionId ?? null,
        publishedAt: status === NewsStatus.PUBLISHED ? new Date() : null,
        authorUserId: user.userId
      }
    });

    await this.writeAudit(user, AuditAction.NEWS_CREATED, news.id, {
      slug: news.slug,
      status: news.status
    });

    return news;
  }

  async updateNews(user: AuthenticatedUser, id: string, dto: UpdateNewsDto) {
    await this.ensureNewsExists(id);

    const nextSlug = dto.slug ? await this.resolveUniqueSlug(dto.slug, id) : undefined;
    const nextStatus = dto.status;

    const news = await this.prisma.news.update({
      where: {
        id
      },
      data: {
        ...(dto.titleRu !== undefined ? { titleRu: dto.titleRu } : {}),
        ...(dto.titleKz !== undefined ? { titleKz: dto.titleKz ?? dto.titleRu ?? "" } : {}),
        ...(nextSlug ? { slug: nextSlug } : {}),
        ...(dto.summaryRu !== undefined ? { summaryRu: dto.summaryRu } : {}),
        ...(dto.summaryKz !== undefined ? { summaryKz: dto.summaryKz ?? null } : {}),
        ...(dto.contentRu !== undefined ? { contentRu: dto.contentRu } : {}),
        ...(dto.contentKz !== undefined ? { contentKz: dto.contentKz ?? dto.contentRu ?? "" } : {}),
        ...(nextStatus !== undefined
          ? {
              status: nextStatus,
              publishedAt: nextStatus === NewsStatus.PUBLISHED ? new Date() : null
            }
          : {}),
        ...(dto.coverImageObjectKey !== undefined
          ? {
              coverImageBucket: dto.coverImageObjectKey ? "local" : null,
              coverImageObjectKey: dto.coverImageObjectKey ?? null
            }
          : {}),
        ...(dto.regionId !== undefined ? { regionId: dto.regionId ?? null } : {}),
      }
    });

    await this.writeAudit(user, AuditAction.NEWS_UPDATED, news.id, {
      slug: news.slug,
      status: news.status
    });

    return news;
  }

  async archiveNews(user: AuthenticatedUser, id: string) {
    await this.ensureNewsExists(id);

    const news = await this.prisma.news.update({
      where: {
        id
      },
      data: {
        status: NewsStatus.ARCHIVED,
        deletedAt: new Date(),
      }
    });

    await this.writeAudit(user, AuditAction.NEWS_DELETED, id, {
      slug: news.slug
    });

    return news;
  }

  async publishNews(user: AuthenticatedUser, id: string, dto: PublishNewsDto) {
    const existingNews = await this.ensureNewsExists(id);

    if (existingNews.deletedAt) {
      throw new BadRequestException("Archived news cannot be published.");
    }

    const news = await this.prisma.news.update({
      where: {
        id
      },
      data: {
        status: NewsStatus.PUBLISHED,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
      }
    });

    await this.writeAudit(user, AuditAction.NEWS_PUBLISHED, id, {
      slug: news.slug
    });

    return news;
  }

  private async listNews(query: ListNewsDto, includeArchived: boolean) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(includeArchived ? {} : { deletedAt: null }),
      ...(query.status ? { status: query.status } : {}),
      ...(query.regionId ? { regionId: query.regionId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                titleRu: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                titleKz: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              },
              {
                summaryRu: {
                  contains: query.search,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {})
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.news.findMany({
        where,
        include: {
          region: true
        },
        orderBy: [
          {
            publishedAt: "desc"
          },
          {
            createdAt: "desc"
          }
        ],
        skip,
        take: limit
      }),
      this.prisma.news.count({ where })
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

  private async ensureNewsExists(id: string) {
    const news = await this.prisma.news.findUnique({
      where: {
        id
      }
    });

    if (!news) {
      throw new NotFoundException("News not found.");
    }

    return news;
  }

  private async resolveUniqueSlug(source: string, currentId?: string) {
    const baseSlug = this.slugify(source);
    let slug = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.news.findFirst({
        where: {
          slug,
          ...(currentId ? { id: { not: currentId } } : {})
        }
      })
    ) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return slug;
  }

  private slugify(value: string) {
    const transliterated = value
      .trim()
      .toLowerCase()
      .replace(/[ә]/g, "a")
      .replace(/[і]/g, "i")
      .replace(/[ң]/g, "n")
      .replace(/[ғ]/g, "g")
      .replace(/[үұ]/g, "u")
      .replace(/[қ]/g, "k")
      .replace(/[ө]/g, "o")
      .replace(/[һ]/g, "h")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");

    return (
      transliterated
        .replace(/[^a-z0-9а-яё]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120) || `news-${Date.now()}`
    );
  }

  private writeAudit(
    user: AuthenticatedUser,
    action: AuditAction,
    entityId: string,
    metadata: Record<string, unknown>
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: user.userId,
        actionType: action,
        entityType: "news",
        entityId,
        metadata: metadata as Prisma.InputJsonValue
      }
    });
  }
}
