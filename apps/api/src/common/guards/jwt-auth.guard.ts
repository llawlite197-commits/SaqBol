import {
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { IS_PUBLIC_KEY } from "../constants/auth.constants";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      const request = context.switchToHttp().getRequest<{
        headers?: Record<string, string | string[] | undefined>;
      }>();
      const authorizationHeader = request?.headers?.authorization;

      if (!authorizationHeader) {
        return true;
      }

      return super.canActivate(context);
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    error: unknown,
    user: TUser,
    _info: unknown,
    context: ExecutionContext
  ) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic && !error && !user) {
      return null;
    }

    if (error || !user) {
      throw error ?? new UnauthorizedException("Authentication required.");
    }

    return user;
  }
}
