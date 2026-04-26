import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const requestId =
      request.headers["x-request-id"]?.toString() ?? request.headers["x-correlation-id"]?.toString() ?? null;

    const message =
      typeof exceptionResponse === "string"
        ? exceptionResponse
        : typeof exceptionResponse === "object" &&
            exceptionResponse !== null &&
            "message" in exceptionResponse
          ? exceptionResponse.message
          : exception instanceof Error
            ? exception.message
            : "Internal server error.";

    const errorCode =
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null &&
      "code" in exceptionResponse &&
      typeof exceptionResponse.code === "string"
        ? exceptionResponse.code
        : exception instanceof HttpException
          ? exception.name
          : "INTERNAL_SERVER_ERROR";

    response.status(status).json({
      data: null,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        path: request.originalUrl
      },
      error: {
        code: errorCode,
        message,
        statusCode: status
      }
    });
  }
}
