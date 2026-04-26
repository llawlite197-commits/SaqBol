import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  const configuredCorsOrigins = (process.env.API_CORS_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const corsOrigins = Array.from(
    new Set([
      ...configuredCorsOrigins,
      process.env.PUBLIC_BASE_URL,
      process.env.WORKSPACE_BASE_URL,
      process.env.NEXT_PUBLIC_API_URL,
      "http://localhost",
      "http://localhost:3000",
      "http://localhost:3001"
    ].filter(Boolean) as string[])
  );
  const isAllowedCorsOrigin = (origin?: string) => {
    if (!origin) return true;
    if (corsOrigins.includes(origin)) return true;

    try {
      const { hostname, protocol } = new URL(origin);
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      const isNgrok =
        protocol === "https:" &&
        (hostname.endsWith(".ngrok-free.dev") || hostname.endsWith(".ngrok.app"));

      return isLocalhost || isNgrok;
    } catch {
      return false;
    }
  };

  app.use(helmet());
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    origin: true,
    credentials: true
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SaqBol.kz API")
    .setDescription("Backend API for SaqBol.kz MVP")
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      "access-token"
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
