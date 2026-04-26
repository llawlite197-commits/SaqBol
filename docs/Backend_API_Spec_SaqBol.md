# Backend API Specification
## SaqBol.kz

**Версия:** 1.0  
**Статус:** Backend Technical Specification  
**Целевая платформа:** NestJS + PostgreSQL + Prisma + S3-compatible storage  
**Назначение документа:** спецификация backend-слоя для команды разработки

---

## 0. Общие принципы backend

- Базовый префикс API: `/api/v1`
- Формат обмена: `application/json`
- Основной backend: `NestJS`
- ORM/Data access: `Prisma`
- Аутентификация: `JWT access token + rotating refresh token`
- Хранение refresh token: hash в PostgreSQL
- Авторизация: `RBAC + permission-based guards`
- 2FA: обязательно для сотрудников
- Файлы: `S3-compatible storage` через presigned upload
- Аудит: централизованный `AuditInterceptor + AuditService`
- Документация API: `Swagger/OpenAPI`
- Контракты DTO: `class-validator + class-transformer`
- Ограничение нагрузки: `@nestjs/throttler + Redis`

### 0.1. Ответ API

Рекомендуемый единый формат ответа:

```json
{
  "data": {},
  "meta": {
    "requestId": "7d8e0d5a-9d94-4a72-b924-8f9d21231234"
  },
  "error": null
}
```

Формат ошибки:

```json
{
  "data": null,
  "meta": {
    "requestId": "7d8e0d5a-9d94-4a72-b924-8f9d21231234"
  },
  "error": {
    "code": "COMPLAINT_STATUS_TRANSITION_NOT_ALLOWED",
    "message": "Status transition is not allowed.",
    "details": {
      "fromStatus": "NEW",
      "toStatus": "RESOLVED"
    }
  }
}
```

### 0.2. Разделение API-контуров

Для упрощения безопасности и поддержки рекомендуется логически разделить маршруты:

- Public API: `/api/v1/public/...`
- Workspace API: `/api/v1/workspace/...`
- Shared Auth API: `/api/v1/auth/...`
- Admin API: `/api/v1/admin/...`

---

## 1. Структура папок backend-проекта

Рекомендуемая структура `apps/api`:

```text
apps/api/
  src/
    main.ts
    app.module.ts
    app.controller.ts
    app.service.ts
    common/
      constants/
        api.constants.ts
        auth.constants.ts
        cache.constants.ts
      decorators/
        current-user.decorator.ts
        public.decorator.ts
        roles.decorator.ts
        permissions.decorator.ts
        audit-action.decorator.ts
      dto/
        api-response.dto.ts
        pagination-query.dto.ts
        id-param.dto.ts
      enums/
        role.enum.ts
        complaint-status.enum.ts
        contact-type.enum.ts
        notification-channel.enum.ts
        permission.enum.ts
      exceptions/
        app.exception.ts
        error-codes.ts
      filters/
        all-exceptions.filter.ts
        prisma-exception.filter.ts
      guards/
        jwt-auth.guard.ts
        refresh-token.guard.ts
        roles.guard.ts
        permissions.guard.ts
        two-factor.guard.ts
      interceptors/
        response-envelope.interceptor.ts
        request-id.interceptor.ts
        audit.interceptor.ts
        timeout.interceptor.ts
      middleware/
        request-context.middleware.ts
        request-logging.middleware.ts
      pipes/
        validation.pipe.ts
        parse-uuid.pipe.ts
      types/
        auth-user.type.ts
        request-context.type.ts
      utils/
        normalize-phone.ts
        normalize-url.ts
        mask-card.ts
        sanitize-html.ts
    config/
      app.config.ts
      auth.config.ts
      database.config.ts
      s3.config.ts
      redis.config.ts
      throttler.config.ts
      swagger.config.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
      prisma-exception.mapper.ts
    integrations/
      s3/
        s3.module.ts
        s3.service.ts
      sms/
        sms.module.ts
        sms.service.ts
      email/
        email.module.ts
        email.service.ts
      ai/
        ai.module.ts
        ai.gateway.service.ts
        ai-safety.service.ts
    modules/
      auth/
        auth.module.ts
        controllers/
          auth.controller.ts
          staff-auth.controller.ts
        services/
          auth.service.ts
          token.service.ts
          otp.service.ts
          two-factor.service.ts
        dto/
          register-citizen.dto.ts
          login.dto.ts
          refresh-token.dto.ts
          request-password-reset.dto.ts
          reset-password.dto.ts
          verify-otp.dto.ts
          verify-staff-2fa.dto.ts
        strategies/
          access-jwt.strategy.ts
          refresh-jwt.strategy.ts
        mappers/
          auth.mapper.ts
      users/
        users.module.ts
        controllers/
          public-users.controller.ts
          workspace-users.controller.ts
        services/
          users.service.ts
          citizen-profiles.service.ts
          employee-profiles.service.ts
        dto/
          update-citizen-profile.dto.ts
          update-employee-profile.dto.ts
      roles/
        roles.module.ts
        controllers/
          roles.controller.ts
        services/
          roles.service.ts
      complaints/
        complaints.module.ts
        controllers/
          public-complaints.controller.ts
          workspace-complaints.controller.ts
        services/
          complaints.service.ts
          complaint-query.service.ts
          complaint-workflow.service.ts
          complaint-comments.service.ts
        dto/
          create-complaint.dto.ts
          complaint-contact.dto.ts
          list-complaints.query.dto.ts
          assign-complaint.dto.ts
          update-complaint-status.dto.ts
          add-complaint-comment.dto.ts
          request-additional-info.dto.ts
        policies/
          complaint-status.policy.ts
        mappers/
          complaint.mapper.ts
      files/
        files.module.ts
        controllers/
          files.controller.ts
        services/
          files.service.ts
          upload-policy.service.ts
        dto/
          create-upload-intent.dto.ts
          complete-upload.dto.ts
      blacklist/
        blacklist.module.ts
        controllers/
          public-blacklist.controller.ts
          workspace-blacklist.controller.ts
        services/
          blacklist.service.ts
          blacklist-check.service.ts
        dto/
          check-blacklist.dto.ts
          create-blacklist-entry.dto.ts
      stats/
        stats.module.ts
        controllers/
          stats.controller.ts
        services/
          stats.service.ts
      ai/
        ai.module.ts
        controllers/
          ai.controller.ts
        services/
          ai.service.ts
          ai-safety.service.ts
          ai-session.service.ts
        dto/
          ai-chat-request.dto.ts
      notifications/
        notifications.module.ts
        controllers/
          notifications.controller.ts
        services/
          notifications.service.ts
          notification-templates.service.ts
      news/
        news.module.ts
        controllers/
          public-news.controller.ts
          workspace-news.controller.ts
        services/
          news.service.ts
        dto/
          create-news.dto.ts
          update-news.dto.ts
      admin/
        admin.module.ts
        controllers/
          admin-users.controller.ts
          admin-settings.controller.ts
        services/
          admin-users.service.ts
          system-settings.service.ts
      audit/
        audit.module.ts
        controllers/
          audit.controller.ts
        services/
          audit.service.ts
        dto/
          list-audit-logs.query.dto.ts
      export/
        export.module.ts
        controllers/
          export.controller.ts
        services/
          export.service.ts
          export-jobs.service.ts
        dto/
          create-export-job.dto.ts
      dictionaries/
        dictionaries.module.ts
        controllers/
          public-dictionaries.controller.ts
          workspace-dictionaries.controller.ts
        services/
          dictionaries.service.ts
        dto/
          update-fraud-type.dto.ts
          update-region.dto.ts
    database/
      seeds/
      migrations/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  test/
    e2e/
  package.json
  tsconfig.json
```

### 1.1. Архитектурная рекомендация

Для NestJS backend SaqBol.kz рекомендуется использовать:

- `feature-based modular structure`
- `controllers + services + dto + mappers + policies`
- `PrismaService` как единый data access layer
- `domain policies` для бизнес-ограничений
- `common` для инфраструктурных cross-cutting concerns

Примечание:
- Prisma используется как основной typed access layer.
- partial unique indexes, append-only tables и advanced DB constraints должны фиксироваться отдельными SQL migrations поверх `schema.prisma`.

---

## 2. Описание каждого модуля

### 2.1. AuthModule

Зона ответственности:

- регистрация граждан;
- login/logout граждан;
- login сотрудников;
- refresh token rotation;
- password reset;
- OTP verification;
- 2FA orchestration;
- установка auth cookies;
- session revoke.

Основные сервисы:

- `AuthService`
- `TokenService`
- `OtpService`
- `TwoFactorService`

### 2.2. UsersModule

Зона ответственности:

- чтение и обновление профилей пользователей;
- citizen profile;
- employee profile;
- self-profile endpoints;
- staff profile lookup for assignment UI.

### 2.3. RolesModule

Зона ответственности:

- чтение ролей;
- чтение permission matrix;
- назначение/снятие ролей через admin flow;
- кэширование ролей и permission map.

### 2.4. ComplaintsModule

Зона ответственности:

- создание жалоб;
- получение списка жалоб гражданина;
- реестр жалоб для сотрудников;
- карточка жалобы;
- работа со статусами;
- назначение исполнителей;
- комментарии;
- timeline/status history;
- дедупликация и business workflow rules.

### 2.5. FilesModule

Зона ответственности:

- upload intent;
- complete upload;
- file metadata management;
- authorization на скачивание;
- presigned download URL;
- antivirus scan orchestration;
- привязка файлов к жалобам;
- upload для cover image новостей может использовать тот же `S3Service`, но metadata хранится в самой сущности `news`.

### 2.6. BlacklistModule

Зона ответственности:

- публичная проверка подозрительного значения;
- просмотр blacklist entries сотрудниками;
- создание/редактирование blacklist entries сотрудниками;
- логирование blacklist checks;
- нормализация phone/url/email/card/iban.

### 2.7. StatsModule

Зона ответственности:

- dashboard KPI;
- counts by status;
- counts by region;
- counts by fraud type;
- SLA widgets;
- chart-ready aggregations.

### 2.8. AiModule

Зона ответственности:

- public AI assistant endpoint;
- safety checks;
- RAG over approved knowledge sources;
- AI session logging;
- rate limiting and abuse control.

### 2.9. NotificationsModule

Зона ответственности:

- получение списка уведомлений;
- mark as read;
- отправка email/SMS/in-app notifications;
- шаблоны уведомлений;
- dispatch from domain events.

### 2.10. NewsModule

Зона ответственности:

- public list/detail;
- workspace CRUD;
- publish/archive;
- filtering by region/status;
- SEO-friendly slug handling.

### 2.11. AdminModule

Зона ответственности:

- управление сотрудниками;
- управление system settings;
- staff account activation/blocking;
- role assignment orchestration;
- internal operational tools.

### 2.12. AuditModule

Зона ответственности:

- запись audit events;
- поиск audit logs;
- фильтрация по actor/entity/date;
- экспорт audit log segments.

### 2.13. ExportModule

Зона ответственности:

- создание export jobs;
- статус job;
- генерация presigned download links;
- orchestration worker jobs for CSV/XLSX/PDF.

### 2.14. DictionariesModule

Зона ответственности:

- regions;
- fraud types;
- complaint statuses;
- справочники причин отклонения;
- справочники причин NEED_INFO;
- кэширование публичных справочников.

---

## 3. DTO для основных операций

### 3.1. Auth DTO

```ts
// modules/auth/dto/register-citizen.dto.ts
import { IsEmail, IsOptional, IsPhoneNumber, IsString, Length, Matches } from 'class-validator';

export class RegisterCitizenDto {
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  patronymic?: string;

  @IsOptional()
  @Matches(/^[0-9]{12}$/)
  iin?: string;

  @IsEmail()
  email: string;

  @IsPhoneNumber()
  phone: string;

  @IsString()
  @Length(8, 128)
  password: string;

  @IsString()
  regionId: string;
}
```

```ts
// modules/auth/dto/login.dto.ts
import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string;

  @IsString()
  @Length(8, 128)
  password: string;
}
```

```ts
// modules/auth/dto/verify-staff-2fa.dto.ts
import { IsString, Length, Matches } from 'class-validator';

export class VerifyStaff2faDto {
  @IsString()
  twoFactorToken: string;

  @Matches(/^[0-9]{6}$/)
  code: string;

  @IsString()
  @Length(1, 64)
  method: 'TOTP' | 'SMS' | 'EMAIL';
}
```

### 3.2. Complaint DTO

```ts
// modules/complaints/dto/complaint-contact.dto.ts
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { ContactType } from '@prisma/client';

export class ComplaintContactDto {
  @IsEnum(ContactType)
  contactType: ContactType;

  @IsString()
  @Length(1, 500)
  value: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
```

```ts
// modules/complaints/dto/create-complaint.dto.ts
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ComplaintContactDto } from './complaint-contact.dto';

export class CreateComplaintDto {
  @IsUUID()
  regionId: string;

  @IsUUID()
  fraudTypeId: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @IsString()
  @Length(20, 5000)
  description: string;

  @IsOptional()
  @IsDateString()
  incidentAt?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  damageAmount?: number;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ComplaintContactDto)
  contacts: ComplaintContactDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  fileIds?: string[];
}
```

```ts
// modules/complaints/dto/update-complaint-status.dto.ts
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ComplaintStatus } from '@prisma/client';

export class UpdateComplaintStatusDto {
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  reasonCode?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  reasonText?: string;

  @IsOptional()
  @IsUUID()
  duplicateOfComplaintId?: string;
}
```

```ts
// modules/complaints/dto/assign-complaint.dto.ts
import { IsUUID } from 'class-validator';

export class AssignComplaintDto {
  @IsUUID()
  employeeProfileId: string;
}
```

### 3.3. File DTO

```ts
// modules/files/dto/create-upload-intent.dto.ts
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export class CreateUploadIntentDto {
  @IsUUID()
  relatedEntityId: string;

  @IsIn(['COMPLAINT'])
  relatedEntityType: 'COMPLAINT';

  @IsString()
  @Length(1, 255)
  fileName: string;

  @IsString()
  @Length(1, 255)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  fileSizeBytes: number;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
```

### 3.4. Blacklist DTO

```ts
// modules/blacklist/dto/check-blacklist.dto.ts
import { IsEnum, IsString, Length } from 'class-validator';
import { ContactType } from '@prisma/client';

export class CheckBlacklistDto {
  @IsEnum(ContactType)
  type: ContactType;

  @IsString()
  @Length(1, 500)
  value: string;
}
```

### 3.5. News DTO

```ts
// modules/news/dto/create-news.dto.ts
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { NewsStatus } from '@prisma/client';

export class CreateNewsDto {
  @IsString()
  @Length(1, 255)
  slug: string;

  @IsString()
  @Length(1, 255)
  titleKz: string;

  @IsString()
  @Length(1, 255)
  titleRu: string;

  @IsString()
  contentKz: string;

  @IsString()
  contentRu: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;
}
```

### 3.6. Export DTO

```ts
// modules/export/dto/create-export-job.dto.ts
import { IsEnum, IsObject, IsOptional } from 'class-validator';

export enum ExportJobTypeDto {
  COMPLAINTS_CSV = 'COMPLAINTS_CSV',
  COMPLAINTS_XLSX = 'COMPLAINTS_XLSX',
  COMPLAINT_CARD_PDF = 'COMPLAINT_CARD_PDF',
  AUDIT_LOGS_CSV = 'AUDIT_LOGS_CSV',
}

export class CreateExportJobDto {
  @IsEnum(ExportJobTypeDto)
  jobType: ExportJobTypeDto;

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;
}
```

---

## 4. Entities или Prisma models

Ниже показаны рекомендуемые core Prisma models. Полная модель данных должна соответствовать `schema.sql`.

```prisma
model User {
  id                  String             @id @default(uuid()) @db.Uuid
  accountType         AccountType
  email               String?
  phone               String?
  passwordHash        String?            @map("password_hash")
  status              UserStatus         @default(PENDING_VERIFICATION)
  isEmailVerified     Boolean            @default(false) @map("is_email_verified")
  isPhoneVerified     Boolean            @default(false) @map("is_phone_verified")
  lastLoginAt         DateTime?          @map("last_login_at")
  failedLoginAttempts Int                @default(0) @map("failed_login_attempts")
  lockedUntil         DateTime?          @map("locked_until")
  deletedAt           DateTime?          @map("deleted_at")
  createdAt           DateTime           @default(now()) @map("created_at")
  updatedAt           DateTime           @updatedAt @map("updated_at")

  citizenProfile      CitizenProfile?
  employeeProfile     EmployeeProfile?
  userRoles           UserRole[]
  complaints          Complaint[]        @relation("CitizenComplaints")
  notifications       Notification[]
  refreshTokens       RefreshToken[]
  otpCodes            OtpCode[]
  twoFactorSessions   TwoFactorSession[]
  auditLogs           AuditLog[]

  @@map("users")
}
```

```prisma
model Role {
  id          String    @id @default(uuid()) @db.Uuid
  code        String    @unique
  nameKz      String    @map("name_kz")
  nameRu      String    @map("name_ru")
  description String?
  isSystem    Boolean   @default(true) @map("is_system")
  isActive    Boolean   @default(true) @map("is_active")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  userRoles   UserRole[]

  @@map("roles")
}
```

```prisma
model UserRole {
  id               String    @id @default(uuid()) @db.Uuid
  userId           String    @map("user_id") @db.Uuid
  roleId           String    @map("role_id") @db.Uuid
  assignedByUserId String?   @map("assigned_by_user_id") @db.Uuid
  assignedAt       DateTime  @default(now()) @map("assigned_at")
  revokedAt        DateTime? @map("revoked_at")
  revokedByUserId  String?   @map("revoked_by_user_id") @db.Uuid
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  user             User      @relation(fields: [userId], references: [id])
  role             Role      @relation(fields: [roleId], references: [id])

  @@map("user_roles")
  @@index([userId, roleId])
}
```

```prisma
model CitizenProfile {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @unique @map("user_id") @db.Uuid
  iin               String?
  firstName         String    @map("first_name")
  lastName          String    @map("last_name")
  patronymic        String?
  birthDate         DateTime? @map("birth_date") @db.Date
  regionId          String?   @map("region_id") @db.Uuid
  preferredLanguage String    @default("ru") @map("preferred_language")
  address           String?
  deletedAt         DateTime? @map("deleted_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id])
  region            Region?   @relation(fields: [regionId], references: [id])

  @@map("citizen_profiles")
}
```

```prisma
model EmployeeProfile {
  id                 String    @id @default(uuid()) @db.Uuid
  userId             String    @unique @map("user_id") @db.Uuid
  employeeCode       String    @map("employee_code")
  firstName          String    @map("first_name")
  lastName           String    @map("last_name")
  patronymic         String?
  positionTitle      String?   @map("position_title")
  departmentName     String?   @map("department_name")
  regionId           String?   @map("region_id") @db.Uuid
  isActive           Boolean   @default(true) @map("is_active")
  preferred2faMethod TwoFactorMethod @default(TOTP) @map("preferred_2fa_method")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  user               User      @relation(fields: [userId], references: [id])
  region             Region?   @relation(fields: [regionId], references: [id])
  assignedComplaints Complaint[] @relation("ComplaintAssignee")

  @@map("employee_profiles")
}
```

```prisma
model Complaint {
  id                        String             @id @default(uuid()) @db.Uuid
  complaintNumber           String             @unique @map("complaint_number")
  citizenUserId             String             @map("citizen_user_id") @db.Uuid
  regionId                  String             @map("region_id") @db.Uuid
  fraudTypeId               String             @map("fraud_type_id") @db.Uuid
  title                     String?
  description               String
  incidentAt                DateTime?          @map("incident_at")
  damageAmount              Decimal?           @map("damage_amount") @db.Decimal(18, 2)
  damageCurrency            String             @default("KZT") @map("damage_currency")
  currentStatus             ComplaintStatus    @default(NEW) @map("current_status")
  currentAssigneeEmployeeId String?            @map("current_assignee_employee_id") @db.Uuid
  duplicateOfComplaintId    String?            @map("duplicate_of_complaint_id") @db.Uuid
  submittedAt               DateTime           @default(now()) @map("submitted_at")
  lastStatusChangedAt       DateTime           @default(now()) @map("last_status_changed_at")
  resolvedAt                DateTime?          @map("resolved_at")
  metadata                  Json               @default("{}")
  createdAt                 DateTime           @default(now()) @map("created_at")
  updatedAt                 DateTime           @updatedAt @map("updated_at")

  citizen                   User               @relation("CitizenComplaints", fields: [citizenUserId], references: [id])
  assignee                  EmployeeProfile?   @relation("ComplaintAssignee", fields: [currentAssigneeEmployeeId], references: [id])
  region                    Region             @relation(fields: [regionId], references: [id])
  fraudType                 FraudType          @relation(fields: [fraudTypeId], references: [id])
  contacts                  ComplaintContact[]
  files                     ComplaintFile[]
  comments                  ComplaintComment[]
  statusHistory             ComplaintStatusHistory[]

  @@map("complaints")
  @@index([citizenUserId, currentStatus])
  @@index([currentAssigneeEmployeeId, currentStatus])
  @@index([regionId, currentStatus])
}
```

```prisma
model ComplaintContact {
  id              String      @id @default(uuid()) @db.Uuid
  complaintId     String      @map("complaint_id") @db.Uuid
  contactType     ContactType @map("contact_type")
  rawValue        String      @map("raw_value")
  normalizedValue String?     @map("normalized_value")
  label           String?
  isPrimary       Boolean     @default(false) @map("is_primary")
  metadata        Json        @default("{}")
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  complaint       Complaint   @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@map("complaint_contacts")
  @@index([contactType, normalizedValue])
}
```

```prisma
model ComplaintStatusHistory {
  id              String           @id @default(uuid()) @db.Uuid
  complaintId     String           @map("complaint_id") @db.Uuid
  fromStatus      ComplaintStatus? @map("from_status")
  toStatus        ComplaintStatus  @map("to_status")
  reasonCode      String?          @map("reason_code")
  reasonText      String?          @map("reason_text")
  changedByUserId String?          @map("changed_by_user_id") @db.Uuid
  createdAt       DateTime         @default(now()) @map("created_at")

  complaint       Complaint        @relation(fields: [complaintId], references: [id], onDelete: Cascade)

  @@map("complaint_status_history")
  @@index([complaintId, createdAt(sort: Desc)])
}
```

```prisma
model BlacklistEntry {
  id               String      @id @default(uuid()) @db.Uuid
  entryType        ContactType @map("entry_type")
  rawValue         String      @map("raw_value")
  normalizedValue  String      @map("normalized_value")
  fraudTypeId      String?     @map("fraud_type_id") @db.Uuid
  regionId         String?     @map("region_id") @db.Uuid
  sourceComplaintId String?    @map("source_complaint_id") @db.Uuid
  riskScore        Int         @default(50) @map("risk_score")
  isActive         Boolean     @default(true) @map("is_active")
  lastSeenAt       DateTime?   @map("last_seen_at")
  deletedAt        DateTime?   @map("deleted_at")
  createdAt        DateTime    @default(now()) @map("created_at")
  updatedAt        DateTime    @updatedAt @map("updated_at")

  @@map("blacklist_entries")
  @@index([entryType, normalizedValue])
}
```

```prisma
model RefreshToken {
  id                String    @id @default(uuid()) @db.Uuid
  userId            String    @map("user_id") @db.Uuid
  tokenHash         String    @unique @map("token_hash")
  tokenFamilyId     String    @map("token_family_id") @db.Uuid
  replacedByTokenId String?   @map("replaced_by_token_id") @db.Uuid
  issuedIp          String?   @map("issued_ip")
  userAgent         String?   @map("user_agent")
  expiresAt         DateTime  @map("expires_at")
  revokedAt         DateTime? @map("revoked_at")
  lastUsedAt        DateTime? @map("last_used_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
  @@index([userId, tokenFamilyId])
}
```

```prisma
model TwoFactorSession {
  id                    String               @id @default(uuid()) @db.Uuid
  userId                String               @map("user_id") @db.Uuid
  method                TwoFactorMethod
  sessionStatus         TwoFactorSessionStatus @default(PENDING) @map("session_status")
  verificationTokenHash String               @unique @map("verification_token_hash")
  challengeExpiresAt    DateTime             @map("challenge_expires_at")
  verifiedAt            DateTime?            @map("verified_at")
  trustedDevice         Boolean              @default(false) @map("trusted_device")
  requestIp             String?              @map("request_ip")
  userAgent             String?              @map("user_agent")
  createdAt             DateTime             @default(now()) @map("created_at")
  updatedAt             DateTime             @updatedAt @map("updated_at")

  user                  User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("two_factor_sessions")
}
```

### 4.1. Остальные Prisma models

Остальные модели должны быть сгенерированы по `schema.sql`:

- `Region`
- `FraudType`
- `ComplaintFile`
- `ComplaintComment`
- `BlacklistCheck`
- `Notification`
- `News`
- `AuditLog`
- `OtpCode`
- `ExportJob`
- `SystemSetting`

Важно:
- partial unique indexes для soft-delete сценариев нужно хранить в SQL migrations;
- append-only ограничения для audit/history таблиц должны оставаться на уровне DDL и не теряться при генерации Prisma schema.

---

## 5. REST API endpoints

### 5.1. Auth endpoints

#### Public auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/verify-email-otp`
- `POST /api/v1/auth/verify-phone-otp`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`
- `GET /api/v1/auth/me`

#### Staff auth

- `POST /api/v1/auth/staff/login`
- `POST /api/v1/auth/staff/2fa/verify`
- `POST /api/v1/auth/staff/2fa/resend`
- `POST /api/v1/auth/staff/logout`
- `POST /api/v1/auth/staff/refresh`
- `GET /api/v1/auth/staff/me`

### 5.2. Users endpoints

#### Public

- `GET /api/v1/public/users/me`
- `PATCH /api/v1/public/users/me`

#### Workspace

- `GET /api/v1/workspace/users/me`
- `PATCH /api/v1/workspace/users/me`
- `GET /api/v1/workspace/users/employees`
- `GET /api/v1/workspace/users/employees/:id`

### 5.3. Roles endpoints

- `GET /api/v1/admin/roles`
- `GET /api/v1/admin/roles/:id`
- `POST /api/v1/admin/users/:id/roles`
- `DELETE /api/v1/admin/users/:id/roles/:roleId`

### 5.4. Complaints endpoints

#### Public complaints

- `POST /api/v1/public/complaints`
- `GET /api/v1/public/complaints`
- `GET /api/v1/public/complaints/:id`
- `GET /api/v1/public/complaints/:id/timeline`
- `POST /api/v1/public/complaints/:id/comments`
- `GET /api/v1/public/complaints/:id/comments`

#### Workspace complaints

- `GET /api/v1/workspace/complaints`
- `GET /api/v1/workspace/complaints/:id`
- `GET /api/v1/workspace/complaints/:id/timeline`
- `PATCH /api/v1/workspace/complaints/:id/status`
- `PATCH /api/v1/workspace/complaints/:id/assign`
- `POST /api/v1/workspace/complaints/:id/comments`
- `GET /api/v1/workspace/complaints/:id/comments`
- `POST /api/v1/workspace/complaints/:id/request-info`
- `POST /api/v1/workspace/complaints/:id/mark-duplicate`

### 5.5. Files endpoints

- `POST /api/v1/files/upload-intents`
- `POST /api/v1/files/complete`
- `GET /api/v1/files/:id/download`
- `DELETE /api/v1/files/:id`

### 5.6. Blacklist endpoints

#### Public

- `POST /api/v1/public/blacklist/check`

#### Workspace

- `GET /api/v1/workspace/blacklist`
- `GET /api/v1/workspace/blacklist/:id`
- `POST /api/v1/workspace/blacklist`
- `PATCH /api/v1/workspace/blacklist/:id`
- `DELETE /api/v1/workspace/blacklist/:id`
- `GET /api/v1/workspace/blacklist/checks`

### 5.7. Stats endpoints

- `GET /api/v1/workspace/stats/dashboard`
- `GET /api/v1/workspace/stats/by-status`
- `GET /api/v1/workspace/stats/by-region`
- `GET /api/v1/workspace/stats/by-fraud-type`

### 5.8. AI endpoints

- `POST /api/v1/public/ai/chat`
- `GET /api/v1/public/ai/session/:id`

### 5.9. Notifications endpoints

- `GET /api/v1/public/notifications`
- `PATCH /api/v1/public/notifications/:id/read`
- `GET /api/v1/workspace/notifications`
- `PATCH /api/v1/workspace/notifications/:id/read`

### 5.10. News endpoints

#### Public

- `GET /api/v1/public/news`
- `GET /api/v1/public/news/:slug`

#### Workspace

- `GET /api/v1/workspace/news`
- `POST /api/v1/workspace/news`
- `GET /api/v1/workspace/news/:id`
- `PATCH /api/v1/workspace/news/:id`
- `POST /api/v1/workspace/news/:id/publish`
- `POST /api/v1/workspace/news/:id/archive`

### 5.11. Admin endpoints

- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `POST /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id`
- `POST /api/v1/admin/users/:id/block`
- `POST /api/v1/admin/users/:id/unblock`
- `GET /api/v1/admin/system-settings`
- `PATCH /api/v1/admin/system-settings/:key`

### 5.12. Audit endpoints

- `GET /api/v1/admin/audit-logs`
- `GET /api/v1/admin/audit-logs/:id`

### 5.13. Export endpoints

- `POST /api/v1/workspace/exports`
- `GET /api/v1/workspace/exports`
- `GET /api/v1/workspace/exports/:id`
- `GET /api/v1/workspace/exports/:id/download`

### 5.14. Dictionaries endpoints

#### Public

- `GET /api/v1/public/dictionaries/regions`
- `GET /api/v1/public/dictionaries/fraud-types`
- `GET /api/v1/public/dictionaries/complaint-statuses`

#### Admin/workspace

- `GET /api/v1/admin/dictionaries/regions`
- `PATCH /api/v1/admin/dictionaries/regions/:id`
- `GET /api/v1/admin/dictionaries/fraud-types`
- `PATCH /api/v1/admin/dictionaries/fraud-types/:id`
- `GET /api/v1/admin/dictionaries/complaint-statuses`

---

## 6. Auth flow

### 6.1. Citizen auth flow

1. Пользователь вызывает `POST /auth/register`.
2. Backend создает `users` + `citizen_profiles` в транзакции.
3. Backend генерирует OTP для email/phone verification.
4. Пользователь подтверждает OTP.
5. После успешной верификации backend переводит пользователя в `ACTIVE`.
6. При `POST /auth/login` backend:
   - ищет пользователя по email/phone;
   - проверяет пароль;
   - проверяет статус;
   - создает access token;
   - создает refresh token family;
   - сохраняет hash refresh token в `refresh_tokens`;
   - выставляет `httpOnly secure cookies`.

### 6.2. Refresh flow

1. Клиент вызывает `POST /auth/refresh`.
2. Backend находит refresh token hash.
3. Проверяет `expiresAt`, `revokedAt`, token family.
4. Ревокирует использованный refresh token.
5. Выпускает новый access token и новый refresh token.
6. Обновляет cookie.

### 6.3. Logout flow

- `POST /auth/logout` ревокирует текущий refresh token.
- При logout all sessions backend ревокирует всю token family или все active sessions пользователя.

### 6.4. JWT рекомендации

- access token TTL: 10-15 минут для citizens, 5-10 минут для staff;
- refresh token TTL: до 30 дней для citizens, до 24 часов для staff;
- `sub`, `sessionId`, `jti`, `roles`, `permissions`, `accountType` должны быть в payload access token.

---

## 7. Staff 2FA flow

### 7.1. Login Step 1

`POST /api/v1/auth/staff/login`

Backend:

- проверяет email/phone + password;
- проверяет наличие роли `OPERATOR` / `SUPERVISOR` / `ADMIN`;
- проверяет, что employee profile active;
- не выдает access token на этом шаге;
- создает запись `two_factor_sessions`;
- возвращает:

```json
{
  "data": {
    "requiresTwoFactor": true,
    "twoFactorToken": "opaque-temporary-token",
    "method": "TOTP"
  }
}
```

### 7.2. Login Step 2

`POST /api/v1/auth/staff/2fa/verify`

Backend:

- проверяет `twoFactorToken`;
- находит active `two_factor_sessions`;
- проверяет TOTP/SMS code;
- обновляет session status = `VERIFIED`;
- создает access + refresh tokens;
- выставляет auth cookies;
- пишет audit event.

### 7.3. Failure scenarios

- invalid code -> `401 INVALID_2FA_CODE`
- expired challenge -> `401 TWO_FACTOR_SESSION_EXPIRED`
- too many attempts -> `429 TWO_FACTOR_RATE_LIMITED`
- blocked employee -> `403 EMPLOYEE_BLOCKED`

### 7.4. Trusted devices

Для MVP trusted devices можно не включать. Если включать:

- хранить signed trusted-device cookie;
- связывать с device fingerprint ограниченно;
- использовать короткий TTL и аудит.

---

## 8. RBAC guards

### 8.1. Подход

Авторизация должна состоять из нескольких уровней:

- `JwtAuthGuard` подтверждает, что пользователь аутентифицирован;
- `TwoFactorGuard` проверяет обязательность 2FA для staff routes;
- `RolesGuard` проверяет role-level access;
- `PermissionsGuard` проверяет точное право на use case;
- object-level access проверяется в сервисе.

### 8.2. Roles

- `CITIZEN`
- `OPERATOR`
- `SUPERVISOR`
- `ADMIN`

### 8.3. Permission examples

- `complaint.create`
- `complaint.read.own`
- `complaint.read.assigned`
- `complaint.read.all`
- `complaint.assign`
- `complaint.status.change`
- `complaint.comment.internal`
- `blacklist.read`
- `blacklist.manage`
- `news.manage`
- `audit.read`
- `export.create`
- `settings.manage`

### 8.4. Object-level rules

Даже при наличии роли backend обязан проверить:

- citizen может читать только свои complaints;
- operator может читать assigned complaints или complaints своего scope;
- supervisor может переназначать complaints;
- admin может менять system settings;
- internal comments недоступны citizen.

---

## 9. File upload flow

### 9.1. Рекомендуемая схема

Для production рекомендуется **presigned upload**, а не проксирование больших файлов через API.

Для MVP текущая SQL-схема ориентирована на `complaint_files`, поэтому базовый upload flow относится к вложениям жалоб. Загрузка media для news может использовать тот же S3 integration layer, но оформляется отдельным use case в `NewsModule`.

### 9.2. Flow

1. Клиент вызывает `POST /files/upload-intents`.
2. Backend:
   - валидирует entity context;
   - проверяет права;
   - проверяет mime type и size;
   - создает pending metadata record;
   - генерирует `presigned PUT URL`.
3. Клиент загружает файл напрямую в S3.
4. Клиент вызывает `POST /files/complete`.
5. Backend:
   - проверяет наличие объекта;
   - фиксирует metadata;
   - ставит задачу на scan;
   - переводит файл в `PENDING_SCAN`.
6. Worker после scan:
   - ставит `ACTIVE` либо `QUARANTINED`.

### 9.3. Security rules

- whitelist mime types;
- max file size per type;
- checksum verification;
- download only through authorized API;
- internal files hidden from public users.

---

## 10. Complaint status flow

### 10.1. Supported statuses

- `NEW`
- `UNDER_REVIEW`
- `NEED_INFO`
- `ASSIGNED`
- `IN_PROGRESS`
- `RESOLVED`
- `REJECTED`
- `DUPLICATE`

### 10.2. Recommended transition policy

- `NEW -> UNDER_REVIEW`
- `NEW -> DUPLICATE`
- `UNDER_REVIEW -> NEED_INFO`
- `UNDER_REVIEW -> ASSIGNED`
- `UNDER_REVIEW -> REJECTED`
- `UNDER_REVIEW -> DUPLICATE`
- `NEED_INFO -> UNDER_REVIEW`
- `ASSIGNED -> IN_PROGRESS`
- `IN_PROGRESS -> RESOLVED`
- `IN_PROGRESS -> REJECTED`
- `IN_PROGRESS -> DUPLICATE`

### 10.3. Backend enforcement

Все переходы должны проверяться в `ComplaintStatusPolicy`.

Backend обязан:

- проверить allowed transition;
- проверить mandatory reason fields;
- проверить duplicateOfComplaintId для `DUPLICATE`;
- обновить `complaints.current_status`;
- обновить `last_status_changed_at`;
- записать `complaint_status_history`;
- записать `audit_logs`;
- инициировать notification при необходимости.

### 10.4. Transaction boundary

Изменение статуса должно выполняться в одной транзакции:

- update complaint;
- insert complaint_status_history;
- insert audit event;
- enqueue notification outbox.

---

## 11. Audit logging middleware/interceptor

### 11.1. Что писать в audit

- login/logout;
- failed login;
- password reset;
- 2FA verify/fail;
- complaint create/update/status change/assign;
- blacklist create/update/delete/check;
- file upload/delete/download;
- export create/download;
- news publish/archive;
- admin setting changes.

### 11.2. Архитектурный подход

Рекомендуется использовать комбинацию:

- `RequestContextMiddleware` для `requestId`, IP, user-agent;
- `AuditAction` decorator для явной разметки критичных endpoints;
- `AuditInterceptor` для capture request/response metadata;
- `AuditService` для записи в БД;
- async queue при высоконагруженных операциях.

### 11.3. Какие данные сохранять

- actorUserId;
- actionType;
- entityType;
- entityId;
- requestId;
- ipAddress;
- userAgent;
- httpMethod;
- requestPath;
- responseStatusCode;
- oldValues;
- newValues;
- metadata.

---

## 12. Error handling

### 12.1. Exception strategy

Нужен единый `AllExceptionsFilter`, который:

- перехватывает `HttpException`;
- перехватывает Prisma known request errors;
- перехватывает неожиданные `Error`;
- маппит их в доменные `error.code`;
- добавляет `requestId`.

### 12.2. Примеры доменных ошибок

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_ACCOUNT_BLOCKED`
- `AUTH_OTP_EXPIRED`
- `AUTH_REFRESH_TOKEN_REUSED`
- `COMPLAINT_NOT_FOUND`
- `COMPLAINT_ACCESS_DENIED`
- `COMPLAINT_STATUS_TRANSITION_NOT_ALLOWED`
- `FILE_UPLOAD_TYPE_NOT_ALLOWED`
- `BLACKLIST_CHECK_RATE_LIMITED`
- `SETTINGS_UPDATE_FORBIDDEN`

### 12.3. HTTP mapping

- `400` validation/business format errors
- `401` unauthenticated / invalid tokens
- `403` forbidden
- `404` not found
- `409` unique/consistency conflicts
- `422` semantic business rule violations
- `429` rate limit
- `500` unexpected internal error

---

## 13. Validation pipe

### 13.1. Global validation pipe

В `main.ts`:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
    forbidUnknownValues: true,
    validationError: { target: false, value: false },
  }),
);
```

### 13.2. Рекомендации

- все `params`, `query`, `body` описывать DTO;
- использовать enum validation;
- `ParseUUIDPipe` для `:id`;
- normalize input values в сервисах;
- бизнес-валидацию отделять от transport-валидации.

---

## 14. Rate limiting

### 14.1. Базовые правила

Рекомендуется `@nestjs/throttler` + Redis storage.

### 14.2. Политики по endpoint'ам

- `/auth/login`: 5-10 попыток / 15 минут на IP + identifier
- `/auth/staff/login`: 5 попыток / 15 минут
- `/auth/refresh`: 20-30 запросов / 15 минут
- `/public/blacklist/check`: 20-50 запросов / час для anonymous
- `/public/ai/chat`: 10-20 запросов / час для anonymous
- `/files/upload-intents`: stricter limits for public users

### 14.3. Дополнительные меры

- separate keys by userId when authenticated;
- device/IP-based throttling for OTP;
- audit suspicious spikes;
- optional captcha on public abuse-prone endpoints.

---

## 15. Swagger/OpenAPI structure

### 15.1. Группировка Swagger tags

- `Auth`
- `Staff Auth`
- `Users`
- `Roles`
- `Public Complaints`
- `Workspace Complaints`
- `Files`
- `Blacklist`
- `Stats`
- `AI`
- `Notifications`
- `News`
- `Admin`
- `Audit`
- `Exports`
- `Dictionaries`

### 15.2. Security schemes

Рекомендуется описать:

- `cookieAuth`
- `bearerAuth` как optional future/mobile scheme

### 15.3. Swagger structure example

```ts
const config = new DocumentBuilder()
  .setTitle('SaqBol API')
  .setDescription('Backend API for SaqBol.kz')
  .setVersion('1.0.0')
  .addCookieAuth('access_token', {
    type: 'apiKey',
    in: 'cookie',
    name: 'access_token',
  })
  .addBearerAuth()
  .build();
```

### 15.4. OpenAPI conventions

- все DTO annotated через `@ApiProperty`;
- query DTO для filters/pagination;
- examples для типовых success/error responses;
- отдельно помечать public vs workspace endpoints.

---

## 16. Примеры кода

### 16.1. Auth controller

```ts
// modules/auth/controllers/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterCitizenDto } from '../dto/register-citizen.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthUser } from '../../../common/types/auth-user.type';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterCitizenDto,
    @Req() req: Request,
  ) {
    return this.authService.registerCitizen(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.loginCitizen(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.authService.setAuthCookies(res, session.tokens);

    return {
      user: session.user,
      requiresTwoFactor: false,
    };
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.authService.refreshSession(req);
    this.authService.setAuthCookies(res, session.tokens);

    return { user: session.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.getCurrentUserProfile(user.sub);
  }

  @HttpCode(200)
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(req);
    this.authService.clearAuthCookies(res);
    return { success: true };
  }
}
```

### 16.2. Complaint controller

```ts
// modules/complaints/controllers/workspace-complaints.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComplaintsService } from '../services/complaints.service';
import { ComplaintWorkflowService } from '../services/complaint-workflow.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UpdateComplaintStatusDto } from '../dto/update-complaint-status.dto';
import { AssignComplaintDto } from '../dto/assign-complaint.dto';
import { ListComplaintsQueryDto } from '../dto/list-complaints.query.dto';
import { AuthUser } from '../../../common/types/auth-user.type';

@ApiTags('Workspace Complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('api/v1/workspace/complaints')
export class WorkspaceComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly workflowService: ComplaintWorkflowService,
  ) {}

  @Get()
  @Permissions('complaint.read.assigned', 'complaint.read.all')
  async list(@Query() query: ListComplaintsQueryDto, @CurrentUser() user: AuthUser) {
    return this.complaintsService.listWorkspaceComplaints(query, user);
  }

  @Get(':id')
  @Permissions('complaint.read.assigned', 'complaint.read.all')
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.complaintsService.getWorkspaceComplaintById(id, user);
  }

  @Patch(':id/status')
  @Permissions('complaint.status.change')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.changeStatus(id, dto, user);
  }

  @Patch(':id/assign')
  @Permissions('complaint.assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignComplaintDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.assignComplaint(id, dto, user);
  }

  @Post(':id/request-info')
  @Permissions('complaint.status.change')
  async requestInfo(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workflowService.requestAdditionalInfo(id, dto, user);
  }
}
```

### 16.3. RBAC guard

```ts
// common/guards/permissions.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User context is missing.');
    }

    const userPermissions: string[] = user.permissions ?? [];
    const isAllowed = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!isAllowed) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    return true;
  }
}
```

### 16.4. Audit interceptor

```ts
// common/interceptors/audit.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';
import { AuditService } from '../../modules/audit/services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const auditAction =
      this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    if (!auditAction) {
      return next.handle();
    }

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(async (responseBody) => {
        await this.auditService.write({
          actorUserId: req.user?.sub ?? null,
          actionType: auditAction,
          entityType: req.auditEntityType ?? null,
          entityId: req.auditEntityId ?? null,
          requestId: req.requestId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          httpMethod: req.method,
          requestPath: req.originalUrl,
          responseStatusCode: res.statusCode,
          newValues: req.auditNewValues ?? null,
          metadata: {
            durationMs: Date.now() - startedAt,
            responseSummary: responseBody?.id ? { id: responseBody.id } : undefined,
          },
        });
      }),
      catchError((error) => {
        void this.auditService.write({
          actorUserId: req.user?.sub ?? null,
          actionType: `${auditAction}_FAILED`,
          entityType: req.auditEntityType ?? null,
          entityId: req.auditEntityId ?? null,
          requestId: req.requestId,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          httpMethod: req.method,
          requestPath: req.originalUrl,
          responseStatusCode: error?.status ?? 500,
          metadata: {
            durationMs: Date.now() - startedAt,
            errorMessage: error?.message,
          },
        });

        return throwError(() => error);
      }),
    );
  }
}
```

### 16.5. File upload service

```ts
// modules/files/services/files.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from '../../../integrations/s3/s3.service';
import { CreateUploadIntentDto } from '../dto/create-upload-intent.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  async createUploadIntent(dto: CreateUploadIntentDto, userId: string) {
    this.assertMimeTypeAllowed(dto.mimeType);

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: dto.relatedEntityId },
      select: { id: true },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found.');
    }

    const objectKey = this.buildObjectKey(dto.relatedEntityType, dto.relatedEntityId, dto.fileName);
    const bucket = 'saqbol-complaint-attachments';

    const file = await this.prisma.complaintFile.create({
      data: {
        complaintId: dto.relatedEntityId,
        uploadedByUserId: userId,
        originalFileName: dto.fileName,
        storageBucket: bucket,
        storageObjectKey: objectKey,
        mimeType: dto.mimeType,
        fileSizeBytes: dto.fileSizeBytes,
        fileStatus: 'PENDING_SCAN',
        isInternal: dto.isInternal ?? false,
      },
    });

    const uploadUrl = await this.s3Service.getPresignedPutUrl({
      bucket,
      objectKey,
      contentType: dto.mimeType,
      expiresInSeconds: 900,
    });

    return {
      fileId: file.id,
      bucket,
      objectKey,
      uploadUrl,
      expiresInSeconds: 900,
    };
  }

  async completeUpload(fileId: string) {
    const file = await this.prisma.complaintFile.findUnique({
      where: { id: fileId },
    });

    if (!file || file.deletedAt) {
      throw new NotFoundException('File not found.');
    }

    const exists = await this.s3Service.objectExists({
      bucket: file.storageBucket,
      objectKey: file.storageObjectKey,
    });

    if (!exists) {
      throw new BadRequestException('Uploaded object not found in storage.');
    }

    return this.prisma.complaintFile.update({
      where: { id: fileId },
      data: {
        fileStatus: 'PENDING_SCAN',
      },
    });
  }

  private assertMimeTypeAllowed(mimeType: string) {
    const allowed = [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowed.includes(mimeType)) {
      throw new BadRequestException('File type is not allowed.');
    }
  }

  private buildObjectKey(entityType: string, entityId: string, fileName: string) {
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin';
    return `${entityType.toLowerCase()}/${entityId}/${randomUUID()}.${ext}`;
  }
}
```

---

## 17. Рекомендации по реализации

### 17.1. main.ts baseline

В `main.ts` рекомендуется включить:

- global prefix `/api/v1`;
- global validation pipe;
- exception filters;
- security headers через `helmet`;
- cookie parser;
- CORS только для доверенных origins;
- Swagger только для dev/stage либо защищенного admin access;
- requestId middleware/interceptor.

### 17.2. Транзакционные use cases

Через Prisma `$transaction` должны идти:

- регистрация пользователя;
- login refresh rotation;
- complaint creation;
- complaint status transition;
- complaint assignment;
- role assign/revoke;
- export job finalization.

### 17.3. Async jobs

В worker/BullMQ рекомендуется вынести:

- notifications send;
- file antivirus scan;
- export generation;
- AI session analytics;
- retention cleanup.

### 17.4. Кэширование

Через Redis кэшировать:

- dictionaries;
- news list hot queries;
- stats widgets short-lived aggregates;
- RBAC permission maps;
- OTP and rate limiting counters.

---

## 18. Вывод

Backend SaqBol.kz должен быть реализован как модульный NestJS API с четким разделением public и workspace маршрутов, централизованным auth-потоком, обязательной 2FA для сотрудников, строгим RBAC, асинхронной обработкой тяжелых задач и полноценным audit trail.

Ключевые принципы реализации:

- DTO-first и contract-driven API;
- Prisma как единый typed data layer;
- service-level enforcement бизнес-правил;
- interceptor/filter/guard-based cross-cutting architecture;
- presigned file upload вместо тяжелого proxy upload;
- строгая безопасность по auth, audit и rate limiting.

### Следующий практический шаг

После утверждения этой спецификации рекомендуется сразу подготовить:

- `schema.prisma` на базе `schema.sql`;
- NestJS scaffold по описанной структуре;
- OpenAPI YAML/JSON draft;
- permission matrix;
- e2e test matrix по auth, complaints и workspace flow.
