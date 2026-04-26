import { Injectable, NotFoundException } from "@nestjs/common";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma
} from "@saqbol/db";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";
import { ListMyNotificationsDto } from "./dto/list-my-notifications.dto";

type CreateInAppNotificationInput = {
  userId: string;
  type: NotificationType;
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
  relatedEntityType?: string;
  relatedEntityId?: string;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyNotifications(user: AuthenticatedUser, query: ListMyNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      userId: user.userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { notificationType: query.type } : {})
    };

    const [items, total, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc"
        },
        skip,
        take: limit
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          userId: user.userId,
          readAt: null,
          status: {
            not: NotificationStatus.READ
          }
        }
      })
    ]);

    return {
      items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async markAsRead(user: AuthenticatedUser, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.userId
      }
    });

    if (!notification) {
      throw new NotFoundException("Notification not found.");
    }

    if (notification.status === NotificationStatus.READ && notification.readAt) {
      return notification;
    }

    return this.prisma.notification.update({
      where: {
        id: notification.id
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(user: AuthenticatedUser) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.userId,
        readAt: null,
        status: {
          not: NotificationStatus.READ
        }
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    });

    return {
      updatedCount: result.count
    };
  }

  createInAppNotification(input: CreateInAppNotificationInput): Promise<unknown> {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        channel: NotificationChannel.IN_APP,
        notificationType: input.type,
        subject: input.subject ?? null,
        body: input.body,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        status: NotificationStatus.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date(),
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null
      }
    });
  }
}
