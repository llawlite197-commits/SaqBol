import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      originalUrl?: string;
    }>();

    const requestId =
      request?.headers?.["x-request-id"]?.toString() ??
      request?.headers?.["x-correlation-id"]?.toString() ??
      null;

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          "meta" in data &&
          "error" in data
        ) {
          return data;
        }

        return {
          data,
          meta: {
            requestId,
            timestamp: new Date().toISOString(),
            path: request?.originalUrl ?? null
          },
          error: null
        };
      })
    );
  }
}
