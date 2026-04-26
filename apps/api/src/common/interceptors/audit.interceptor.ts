import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor
} from "@nestjs/common";
import { AuditAction } from "@saqbol/db";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { AuthenticatedUser } from "../interfaces/authenticated-user.interface";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method?: string;
      path?: string;
      originalUrl?: string;
      params?: Record<string, string>;
      headers?: Record<string, string | string[] | undefined>;
      user?: AuthenticatedUser;
      ip?: string;
      route?: { path?: string };
    }>();
    const response = context.switchToHttp().getResponse<{ statusCode?: number }>();

    return next.handle().pipe(
      tap({
        next: async () => {
          const actionType = this.resolveAction(
            request.method ?? "GET",
            request.originalUrl ?? request.path ?? ""
          );

          if (!actionType) {
            return;
          }

          try {
            await this.prisma.auditLog.create({
              data: {
                actorUserId: request.user?.userId ?? null,
                actionType,
                entityType: this.resolveEntityType(request.originalUrl ?? request.path ?? ""),
                entityId: request.params?.id ?? null,
                requestId: request.headers?.["x-request-id"]?.toString() ?? null,
                ipAddress: request.ip ?? null,
                userAgent: request.headers?.["user-agent"]?.toString() ?? null,
                httpMethod: request.method ?? null,
                requestPath: request.originalUrl ?? request.path ?? null,
                responseStatusCode: response.statusCode ?? null,
                metadata: {
                  route: request.route?.path ?? null
                }
              }
            });
          } catch (error) {
            this.logger.warn(`Failed to write audit log: ${String(error)}`);
          }
        }
      })
    );
  }

  private resolveEntityType(path: string): string {
    const cleanedPath = path.replace(/^\/?api\/v1\//, "");
    const [segment] = cleanedPath.split("/");
    return segment || "system";
  }

  private resolveAction(method: string, path: string): AuditAction | null {
    const normalizedPath = path.toLowerCase();

    if (normalizedPath.includes("/health")) {
      return null;
    }

    if (normalizedPath.includes("/auth/register") && method === "POST") {
      return AuditAction.USER_REGISTERED;
    }

    if (normalizedPath.includes("/auth/login") && method === "POST") {
      return AuditAction.USER_LOGGED_IN;
    }

    if (normalizedPath.includes("/auth/logout") && method === "POST") {
      return AuditAction.USER_LOGGED_OUT;
    }

    if (normalizedPath.includes("/complaints") && normalizedPath.includes("/status")) {
      return AuditAction.COMPLAINT_STATUS_CHANGED;
    }

    if (normalizedPath.includes("/complaints") && normalizedPath.includes("/assign")) {
      return AuditAction.COMPLAINT_ASSIGNED;
    }

    if (normalizedPath.includes("/complaints") && normalizedPath.includes("/comments")) {
      return AuditAction.COMMENT_CREATED;
    }

    if (normalizedPath.includes("/files") && method === "POST") {
      return AuditAction.FILE_UPLOADED;
    }

    if (normalizedPath.includes("/additional-info") && method === "POST") {
      return AuditAction.COMPLAINT_UPDATED;
    }

    if (normalizedPath.includes("/complaints") && method === "POST") {
      return AuditAction.COMPLAINT_CREATED;
    }

    if (normalizedPath.includes("/admin/blacklist")) {
      return null;
    }

    if (normalizedPath.includes("/admin/news")) {
      return null;
    }

    if (normalizedPath.includes("/admin/dictionaries")) {
      return null;
    }

    if (normalizedPath.includes("/check") && method === "POST") {
      return AuditAction.BLACKLIST_CHECKED;
    }

    if (normalizedPath.includes("/notifications") && method === "POST") {
      return AuditAction.NOTIFICATION_SENT;
    }

    if (normalizedPath.includes("/news") && method === "POST") {
      return AuditAction.NEWS_CREATED;
    }

    if (normalizedPath.includes("/news") && (method === "PATCH" || method === "PUT")) {
      return AuditAction.NEWS_UPDATED;
    }

    if (normalizedPath.includes("/exports") && method === "POST") {
      return AuditAction.EXPORT_REQUESTED;
    }

    if (normalizedPath.includes("/settings") && (method === "PATCH" || method === "PUT")) {
      return AuditAction.SETTING_UPDATED;
    }

    if (normalizedPath.includes("/ai") && method === "POST") {
      return AuditAction.AI_REQUESTED;
    }

    if (method === "PATCH" || method === "PUT") {
      return AuditAction.USER_UPDATED;
    }

    return null;
  }
}
