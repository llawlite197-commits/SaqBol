# Архитектурный документ
## SaqBol.kz

**Версия:** 1.0  
**Статус:** Solution Architecture Draft  
**Проект:** SaqBol.kz  
**Назначение документа:** целевая архитектура MVP и направление эволюции системы

---

## 1. Общая архитектура

### 1.1. Архитектурный подход

Для MVP SaqBol.kz рекомендуется архитектура типа **modular monolith + separated frontends + async workers**:

- **Public Web** как отдельное Next.js-приложение для граждан;
- **Workspace Web** как отдельное Next.js-приложение для сотрудников и администраторов;
- **Backend API** как единое NestJS-приложение с четко разделенными доменными модулями;
- **Background Worker** как отдельный процесс для асинхронных задач;
- **PostgreSQL** как основная транзакционная БД;
- **S3-compatible storage** для вложений, экспортов и контента;
- **AI Service layer** для интеграции с LLM API через защитный safety layer;
- **Nginx** как reverse proxy, TLS termination и точка маршрутизации;
- **Docker** как базовый способ упаковки и развертывания;
- **Redis** рекомендуется как вспомогательный инфраструктурный компонент для очередей, rate limiting, OTP/2FA, кэша и short-lived state.

### 1.2. Почему modular monolith для MVP

Данный подход оптимален для первого этапа по следующим причинам:

- сокращает time-to-market;
- уменьшает операционную сложность по сравнению с набором микросервисов;
- сохраняет четкие границы доменов внутри кода;
- упрощает транзакционные сценарии вокруг жалоб, статусов, аудита и назначений;
- позволяет в дальнейшем выделить отдельные сервисы без полной переработки системы.

### 1.3. Целевые архитектурные принципы

- разделение публичного и служебного контуров;
- stateless runtime для web и API-слоя;
- явное разграничение доменов и модулей;
- безопасность по умолчанию;
- аудитируемость критичных действий;
- асинхронная обработка тяжелых задач;
- расширяемость под будущие интеграции;
- горизонтальное масштабирование приложений без session affinity.

### 1.4. Рекомендуемая схема доменов

Функционально система делится на следующие домены:

- Identity & Access;
- Citizen Profile;
- Staff Workspace;
- Complaints;
- Fraud Check;
- Content & Education;
- Reference Data;
- Notifications;
- Audit;
- Export;
- AI Assistant;
- File Management;
- Analytics Dashboard;
- Integration Adapters.

---

## 2. Диаграмма компонентов в текстовом виде

```text
                        +----------------------+
                        |  Citizens / Public   |
                        +----------+-----------+
                                   |
                                   v
                           +---------------+
                           |  Nginx / WAF  |
                           +-------+-------+
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
         +----------------------+      +----------------------+
         | Next.js Public Web   |      | Next.js Workspace    |
         | saqbol.kz            |      | workspace.saqbol.kz  |
         +----------+-----------+      +----------+-----------+
                    |                             |
                    +--------------+--------------+
                                   |
                                   v
                          +-------------------+
                          | NestJS Backend API|
                          | api.saqbol.kz     |
                          +-----+------+------+ 
                                |      |
               +----------------+      +------------------+
               |                                       |
               v                                       v
      +--------------------+                 +--------------------+
      | PostgreSQL         |                 | Redis              |
      | transactional data |                 | cache / queue /    |
      | audit / refs       |                 | rate limit / OTP   |
      +--------------------+                 +--------------------+
               |
               v
      +--------------------+
      | S3-compatible      |
      | attachments/files  |
      +--------------------+

                          +----------------------+
                          | Background Worker    |
                          | exports / notify /   |
                          | antivirus / audit    |
                          +-----+----------------+
                                |
             +------------------+------------------+
             |                  |                  |
             v                  v                  v
     +---------------+   +--------------+   +----------------+
     | SMS Provider  |   | Email Service|   | AI Gateway     |
     +---------------+   +--------------+   | + Safety Layer |
                                             +----------------+
```

### 2.1. Логика взаимодействия

- Пользователь работает через один из двух фронтендов.
- Frontend обращается к единому Backend API.
- Backend API хранит транзакционные данные в PostgreSQL.
- Файлы загружаются через backend-проверки и сохраняются в S3-compatible storage.
- Асинхронные задачи передаются worker-процессу через очередь.
- AI-запросы проходят через отдельный orchestration/safety layer.
- Nginx управляет HTTPS, routing, compression и базовыми security headers.

---

## 3. Разделение public и workspace frontend

### 3.1. Рекомендация

Public Web и Workspace Web должны быть реализованы как **два независимых Next.js приложения** в одном monorepo.

### 3.2. Причины разделения

- разный профиль пользователей и UX;
- разная стратегия безопасности;
- разные правила кэширования;
- разные release cycles;
- возможность жестче изолировать служебный контур;
- публичный сайт может использовать SEO/ISR/SSR, а workspace ориентирован на авторизованный workflow.

### 3.3. Public Web

Назначение:
- публичный лендинг и информационные страницы;
- новости и обучающий контент;
- регистрация и авторизация граждан;
- личный кабинет гражданина;
- подача жалобы;
- проверка сущностей;
- AI-ассистент;
- карта Казахстана.

Рекомендации:
- использовать Next.js App Router;
- SSR/ISR для новостей, обучающих материалов и части публичных страниц;
- CSR/SSR hybrid для личного кабинета и форм;
- CDN-кэширование для статических активов и общедоступного контента.

### 3.4. Workspace Web

Назначение:
- аутентификация сотрудников;
- dashboard;
- реестр и карточка жалобы;
- работа со статусами, комментариями и назначениями;
- администрирование справочников и контента;
- audit logs;
- экспорт.

Рекомендации:
- выделенный поддомен, например `workspace.saqbol.kz`;
- более строгая CSP и политика cookie;
- отсутствие публичного индексационного контента;
- client-heavy интерфейс для таблиц, фильтров и внутренних workflow;
- отдельные layout и navigation patterns, заточенные под ops-пользователей.

### 3.5. Shared frontend libraries

Несмотря на разделение приложений, рекомендуется вынести общие библиотеки:

- `ui-core` для базовых компонентов;
- `shared-types` для DTO и доменных типов;
- `api-client` для typed API access;
- `auth-client` для общих auth-хелперов;
- `i18n` для локализации;
- `utils` для общих утилит и валидаторов.

---

## 4. Backend modules

### 4.1. Общий подход

Backend API рекомендуется реализовать как **NestJS modular monolith** с выделением модулей по бизнес-доменам. Каждый модуль должен иметь слои:

- controller / resolver layer;
- application services;
- domain logic;
- repository/data access;
- integration adapters;
- DTO/validation contracts.

### 4.2. Рекомендуемые модули NestJS

#### Core modules

- `AppModule`
- `ConfigModule`
- `HealthModule`
- `DatabaseModule`
- `CacheModule`
- `QueueModule`
- `AuditModule`

#### Identity & Access

- `AuthModule`
- `UsersModule`
- `CitizenAccountsModule`
- `StaffAccountsModule`
- `SessionsModule`
- `RbacModule`
- `TwoFactorModule`

#### Public domain

- `CitizenProfileModule`
- `ComplaintsModule`
- `ComplaintDraftsModule`
- `FraudCheckModule`
- `NewsModule`
- `EducationModule`
- `MapModule`
- `AiAssistantModule`

#### Workspace domain

- `DashboardModule`
- `ComplaintRegistryModule`
- `ComplaintWorkflowModule`
- `AssignmentsModule`
- `InternalCommentsModule`
- `ExportsModule`
- `AdminModule`
- `ReferenceDataModule`
- `ContentManagementModule`

#### Shared business modules

- `FilesModule`
- `NotificationsModule`
- `SearchModule`
- `IntegrationModule`

### 4.3. Ключевые модульные ответственности

`AuthModule`
- login/logout;
- JWT issuance;
- refresh token rotation;
- password reset;
- account lockout;
- session revocation.

`TwoFactorModule`
- TOTP setup/verify;
- backup codes;
- OTP delivery for fallback scenarios;
- 2FA reset workflow.

`ComplaintsModule`
- creation and retrieval of complaints;
- complaint drafts;
- validation and normalization of fraud-related data;
- attachments association;
- citizen-facing views.

`ComplaintWorkflowModule`
- status transitions;
- business rules;
- mandatory reasons;
- duplicate linking;
- timeline generation.

`FraudCheckModule`
- normalized entity lookup;
- risk result shaping;
- masking of sensitive data;
- anti-abuse controls.

`DashboardModule`
- metrics aggregation;
- filters by region, status, assignee;
- SLA indicators.

`FilesModule`
- upload validation;
- S3 interaction;
- presigned URLs;
- antivirus scanning orchestration;
- access control for downloads.

`NotificationsModule`
- email, SMS, in-app notifications;
- templates;
- async delivery;
- retries and failure tracking.

`AiAssistantModule`
- query intake;
- safety pre-check;
- retrieval from approved content base;
- orchestration to LLM provider;
- output filtering;
- conversation logging.

### 4.4. Стиль взаимодействия между модулями

Для MVP рекомендуется:

- синхронные вызовы через application services внутри monolith;
- доменные события для асинхронных побочных эффектов;
- outbox pattern для надежной публикации событий в очередь;
- отсутствие прямых SQL-зависимостей между модулями за пределами repository layer.

---

## 5. Database layer

### 5.1. Общая модель

Основным источником истины должна быть **PostgreSQL**. Для MVP рекомендуется одна БД с логическим разделением на схемы:

- `auth`
- `citizen`
- `workspace`
- `complaints`
- `content`
- `reference`
- `audit`
- `ai`
- `integration`

Если команда предпочитает более простую эксплуатацию на старте, допустима одна схема `public`, но с доменно разделенными таблицами и naming conventions. Архитектурно предпочтительнее использовать **несколько схем**.

### 5.2. Основные таблицы

Рекомендуемый каркас:

- `auth.users`
- `auth.roles`
- `auth.permissions`
- `auth.user_roles`
- `auth.sessions`
- `auth.refresh_tokens`
- `auth.two_factor_methods`
- `auth.two_factor_backup_codes`
- `citizen.profiles`
- `workspace.staff_profiles`
- `complaints.complaints`
- `complaints.complaint_status_history`
- `complaints.complaint_assignments`
- `complaints.complaint_comments_internal`
- `complaints.complaint_attachments`
- `complaints.suspicious_entities`
- `complaints.entity_checks`
- `content.news`
- `content.education_materials`
- `reference.regions`
- `reference.fraud_types`
- `reference.statuses`
- `notifications.notifications`
- `notifications.delivery_attempts`
- `audit.audit_events`
- `ai.sessions`
- `ai.messages`
- `exports.export_jobs`

### 5.3. Data design decisions

- каждая бизнес-сущность имеет UUID как технический идентификатор;
- complaint number формируется отдельно как человекочитаемый регистрационный номер;
- критичные справочники не удаляются физически, а архивируются;
- история статусов и назначений хранится append-only;
- внутренние комментарии отделены от citizen-visible activity stream.

### 5.4. Поиск и индексация

Для MVP рекомендуется использовать PostgreSQL с:

- B-Tree индексами по статусам, датам, внешним ключам;
- GIN/Trigram индексами для поиска по нормализованным строкам;
- Full-Text Search для новостей и обучающих материалов.

Отдельный search engine не обязателен в MVP. При росте объема и сложности поиска может быть добавлен Elasticsearch/OpenSearch.

### 5.5. ORM и миграции

Рекомендуется использовать:

- **Prisma** для скорости разработки и типобезопасности;
- либо **TypeORM** при потребности в более гибких паттернах сложного data mapping.

Для MVP рекомендуется **Prisma + SQL migrations**, при условии что команда комфортно работает с raw SQL для performance-sensitive запросов.

### 5.6. Транзакции

Следующие операции должны быть транзакционными:

- создание жалобы и первичных связанных записей;
- смена статуса + запись в history + audit event;
- назначение исполнителя + уведомление через outbox;
- завершение экспорта с фиксацией метаданных.

---

## 6. File storage

### 6.1. Общий подход

Для хранения файлов рекомендуется использовать **S3-compatible storage**:

- вложения к жалобам;
- экспортированные файлы;
- иллюстрации и медиа-контент;
- временные технические файлы.

### 6.2. Рекомендуемая структура bucket'ов

- `saqbol-complaint-attachments`
- `saqbol-public-content`
- `saqbol-exports`
- `saqbol-temp`

### 6.3. Правила хранения

- файл не считается доступным, пока не прошел базовую валидацию и не сохранена его metadata-запись в БД;
- доступ к вложениям жалоб выдается только авторизованным пользователям по ACL-правилам;
- скачивание должно выполняться через backend authorization + presigned URL;
- для экспортов задается ограниченный TTL хранения;
- имена файлов в storage нормализуются и не должны использовать оригинальное пользовательское имя как ключ.

### 6.4. Поток загрузки файла

Рекомендуемый процесс:

1. Frontend запрашивает upload intent у backend.
2. Backend проверяет права, тип, размер и бизнес-контекст.
3. Backend выдает временный upload token/presigned URL.
4. Файл загружается в S3-compatible storage.
5. Backend фиксирует metadata и запускает post-processing.
6. Worker выполняет antivirus scan, thumbnail generation или file classification при необходимости.
7. После успешной проверки файл получает статус `ACTIVE`.

### 6.5. File metadata

В БД по каждому файлу хранить:

- `id`
- `bucket`
- `object_key`
- `original_filename`
- `mime_type`
- `size_bytes`
- `checksum`
- `uploaded_by_user_id`
- `status`
- `related_entity_type`
- `related_entity_id`
- `created_at`

---

## 7. AI service и safety layer

### 7.1. Архитектурный подход

AI-функциональность не должна вызываться напрямую из frontend в LLM API. Все запросы должны проходить через **AI Orchestration Layer** внутри инфраструктуры SaqBol.kz.

### 7.2. Компоненты AI-контура

- `AI Gateway` внутри backend или как отдельный внутренний сервис;
- `Safety Layer`;
- `Prompt Management`;
- `Knowledge Retrieval`;
- `Conversation Logging`;
- `Usage Metering`;
- `Fallback Rules Engine`.

### 7.3. Рекомендуемая схема обработки AI-запроса

```text
User -> Frontend -> Backend AI Module -> Safety Input Filter
     -> Retrieval from approved content
     -> Prompt Composer
     -> LLM Provider API
     -> Safety Output Filter
     -> Response Formatter
     -> Frontend
```

### 7.4. Safety layer

Safety layer должен выполнять:

- классификацию запроса;
- фильтрацию prompt injection и jailbreak-попыток;
- redaction/маскирование PII;
- запрет на передачу чувствительных данных в LLM без необходимости;
- ограничение опасных сценариев;
- контроль длины и формата ответа;
- добавление дисклеймеров;
- блокировку неразрешенных доменных ответов.

### 7.5. Knowledge retrieval

В качестве источников для RAG допускаются только утвержденные материалы:

- FAQ;
- обучающие статьи;
- новости и предупреждения;
- регламентированные инструкции для граждан.

Не рекомендуется в MVP разрешать AI-модулю прямой доступ к персональным данным жалоб или служебным данным сотрудников.

### 7.6. AI-изолированность

Рекомендуется разделять:

- public AI assistant;
- будущий internal assistant для сотрудников.

На этапе MVP нужен только public assistant. Это упрощает безопасность и снижает риск утечки внутренних данных.

### 7.7. Логирование AI

Должны логироваться:

- timestamp;
- user/session id в допустимом и минимальном виде;
- request category;
- provider/model;
- token usage;
- safety flags;
- response status.

Полные тексты диалогов следует хранить только в пределах согласованной политики обработки данных.

---

## 8. Notification service

### 8.1. Назначение

Notification service отвечает за:

- OTP и 2FA-коды;
- email-уведомления;
- SMS-уведомления;
- in-app notifications;
- технические служебные оповещения.

### 8.2. Архитектурный подход

Уведомления должны отправляться **асинхронно** через очередь задач.

Рекомендуемый стек:

- NestJS `NotificationsModule`;
- BullMQ или аналог поверх Redis;
- отдельный `worker`-процесс для отправки и retry logic.

### 8.3. Каналы

- Email provider;
- SMS gateway;
- In-app notification store;
- Webhook-based providers при расширении.

### 8.4. Notification flow

```text
Business Event -> Outbox Event -> Queue -> Notification Worker
                -> Template Render -> Provider Adapter
                -> Delivery Status -> DB + Audit
```

### 8.5. Бизнес-примеры уведомлений

- подтверждение регистрации;
- подтверждение отправки жалобы;
- запрос дополнительной информации;
- смена статуса жалобы;
- назначение исполнителя;
- сброс пароля;
- события 2FA.

### 8.6. Надежность уведомлений

- retry с экспоненциальной задержкой;
- dead-letter queue для постоянных ошибок;
- идемпотентность по event key;
- template versioning;
- аудит факта отправки и результата доставки.

---

## 9. Auth, JWT, refresh tokens, RBAC, 2FA

### 9.1. Общая стратегия

Аутентификация должна быть централизована в backend. Frontend не должен хранить чувствительные токены в `localStorage`.

Рекомендуемая модель:

- short-lived access JWT;
- rotating refresh tokens;
- httpOnly secure cookies;
- отдельные auth-политики для граждан и сотрудников;
- RBAC на backend;
- mandatory 2FA для сотрудников.

### 9.2. JWT strategy

Рекомендуемые параметры:

- Access Token TTL для граждан: 10-15 минут;
- Access Token TTL для сотрудников: 5-10 минут;
- Refresh Token TTL для граждан: до 30 дней с rotation;
- Refresh Token TTL для сотрудников: 8-24 часа с rotation и device/session tracking.

### 9.3. Refresh token rotation

Каждый refresh должен:

- инвалидировать предыдущий refresh token;
- создавать новый token family record;
- записывать `jti`, device metadata и timestamps;
- поддерживать глобальный logout и отзыв всех сессий.

При обнаружении reuse старого refresh token вся token family должна ревокироваться.

### 9.4. Cookie strategy

Рекомендуется использовать:

- `HttpOnly`;
- `Secure`;
- `SameSite=Lax` или `Strict` в зависимости от маршрутов;
- разные cookie namespaces для public и workspace;
- CSRF protection, если frontend обращается к API через cookies.

### 9.5. RBAC

Базовая ролевая модель:

- `CITIZEN`
- `OPERATOR`
- `SUPERVISOR`
- `ADMIN`

RBAC должен быть реализован в двух слоях:

- coarse-grained role checks;
- fine-grained permission checks на уровне use case.

Примеры permission scopes:

- `complaint.read.own`
- `complaint.read.assigned`
- `complaint.read.all`
- `complaint.status.change`
- `complaint.assign`
- `audit.read`
- `content.manage`
- `reference.manage`
- `user.manage.staff`

### 9.6. 2FA

Для сотрудников рекомендуется:

- основной вариант: TOTP authenticator app;
- резервный вариант: backup codes;
- SMS OTP только как fallback и только при одобрении ИБ.

Для хранения:

- TOTP secret хранится в зашифрованном виде;
- backup codes хранятся в hash form;
- попытки верификации ограничиваются rate limiting.

### 9.7. Session management

В БД должны фиксироваться:

- session id;
- user id;
- session type;
- device info;
- IP address;
- user agent;
- issued_at;
- expires_at;
- revoked_at.

### 9.8. Password policy

- password hashing: Argon2id или bcrypt с современными параметрами;
- password reset via signed one-time token;
- lockout policy после N неуспешных попыток;
- password reuse prevention для сотрудников при необходимости.

---

## 10. Audit logging

### 10.1. Назначение

Audit logging является обязательным архитектурным элементом, а не вспомогательной функцией.

### 10.2. Что логировать

Минимальный перечень:

- login/logout;
- failed login;
- password reset;
- 2FA setup/reset/verify;
- complaint creation;
- complaint status changes;
- assignment changes;
- internal comments create/update/delete;
- export generation and download;
- reference data changes;
- content management actions;
- role/permission changes;
- AI usage events;
- file upload/download for protected files.

### 10.3. Структура audit event

Каждое событие должно хранить:

- `event_id`
- `event_type`
- `entity_type`
- `entity_id`
- `actor_type`
- `actor_id`
- `target_user_id` при необходимости
- `ip_address`
- `user_agent`
- `request_id`
- `timestamp`
- `before_state` при необходимости
- `after_state` при необходимости
- `metadata`

### 10.4. Архитектурная реализация

Рекомендуется комбинировать:

- синхронную запись критичных audit events в рамках транзакции;
- асинхронную доставку копий в centralized logging / SIEM;
- отдельный `AuditService` и `AuditRepository`;
- interceptor/middleware для автоматического обогащения request metadata.

### 10.5. Immutability

- audit events должны быть append-only;
- изменение или удаление audit events через UI/API запрещено;
- административный просмотр журнала должен быть read-only.

---

## 11. Security architecture

### 11.1. Security zones

Система должна быть разделена минимум на следующие зоны:

- Internet/Public Zone;
- Public Web Zone;
- Workspace Web Zone;
- API/Application Zone;
- Data Zone;
- External Integration Zone.

### 11.2. Базовые меры защиты

- TLS everywhere;
- reverse proxy hardening;
- security headers;
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy;
- server-side authorization checks;
- secrets management вне кода;
- vulnerability scanning of images and dependencies.

### 11.3. Application security

- DTO validation на входе;
- output encoding;
- ORM/query parameterization;
- file upload validation;
- rate limiting и anti-abuse на чувствительных endpoint'ах;
- CSRF protection для cookie-based auth;
- CORS policy только на разрешенные origins;
- strict MIME rules.

### 11.4. Data security

- шифрование in transit;
- шифрование at rest для БД/бэкапов/секретов по политике инфраструктуры;
- field-level encryption для особо чувствительных полей при необходимости;
- PII masking в логах, экспортных сценариях и AI-контуре.

### 11.5. Public anti-abuse controls

Особенно для public-функций:

- rate limiting на auth, entity check и AI endpoints;
- reCAPTCHA/turnstile для злоупотребляемых форм при необходимости;
- IP reputation и WAF rules;
- anomaly detection по burst-трафику.

### 11.6. Workspace hardening

- отдельный поддомен;
- 2FA mandatory;
- stricter session TTL;
- export restrictions;
- elevated logging;
- optional IP allowlist/VPN requirement на следующем этапе.

### 11.7. Secrets management

Необходимо вынести из кода:

- JWT secrets / signing keys;
- DB credentials;
- S3 credentials;
- SMTP/SMS credentials;
- AI provider keys.

Для production рекомендуется использовать Vault/KMS/secret manager платформы.

---

## 12. Deployment architecture

### 12.1. Минимальная production-схема

Рекомендуемая схема:

- `nginx` reverse proxy;
- `public-web` container;
- `workspace-web` container;
- `api` container;
- `worker` container;
- `postgres` managed service или dedicated DB node;
- `redis` instance;
- `s3-compatible storage` managed or self-hosted;
- monitoring stack;
- centralized logs.

### 12.2. Environment strategy

Минимум следующие окружения:

- `local`
- `dev`
- `stage`
- `prod`

Рекомендуется отдельный bucket namespace, database, Redis namespace и secrets set для каждого окружения.

### 12.3. Deployment model

Для MVP допустимы два варианта:

1. `docker-compose` / single VM deployment для dev/stage и, при ограниченном бюджете, начального production.
2. Контейнерная оркестрация на Kubernetes или аналогичной платформе для production-ready масштабирования.

Если ожидается быстрый рост нагрузки и высокая критичность, лучше сразу проектировать манифесты с учетом Kubernetes, даже если первый rollout будет на VM.

### 12.4. Stateless services

Следующие компоненты должны быть stateless:

- public-web;
- workspace-web;
- api;
- worker.

Состояние должно храниться в:

- PostgreSQL;
- Redis;
- S3 storage.

---

## 13. Docker structure

### 13.1. Рекомендуемые образы

- `saqbol/public-web`
- `saqbol/workspace-web`
- `saqbol/api`
- `saqbol/worker`
- `saqbol/nginx`

### 13.2. Пример структуры Docker-файлов

```text
infrastructure/
  docker/
    public-web.Dockerfile
    workspace-web.Dockerfile
    api.Dockerfile
    worker.Dockerfile
    nginx.Dockerfile
  compose/
    docker-compose.local.yml
    docker-compose.dev.yml
    docker-compose.stage.yml
```

### 13.3. Рекомендуемый compose состав для local/dev

```text
services:
  nginx
  public-web
  workspace-web
  api
  worker
  postgres
  redis
  minio
  mailhog
```

### 13.4. Разделение runtime

- `public-web` и `workspace-web` собираются отдельно;
- `api` и `worker` используют один codebase, но разные entrypoints;
- миграции БД выполняются отдельной job/container;
- Nginx не должен содержать бизнес-логику, только reverse proxy и статику.

---

## 14. Nginx reverse proxy routing

### 14.1. Рекомендуемая маршрутизация по поддоменам

Предпочтительный вариант:

- `https://saqbol.kz` -> Public Web
- `https://workspace.saqbol.kz` -> Workspace Web
- `https://api.saqbol.kz` -> Backend API

Альтернатива с единым доменом возможна, но менее предпочтительна:

- `/` -> Public Web
- `/workspace` -> Workspace Web
- `/api` -> Backend API

### 14.2. Почему поддомены предпочтительнее

- лучшее security isolation;
- проще разграничить cookie policy;
- удобнее логировать и масштабировать контуры отдельно;
- ниже риск случайного кэширования служебных страниц.

### 14.3. Пример routing логики

```nginx
server {
  listen 443 ssl http2;
  server_name saqbol.kz;

  location / {
    proxy_pass http://public-web:3000;
  }
}

server {
  listen 443 ssl http2;
  server_name workspace.saqbol.kz;

  location / {
    proxy_pass http://workspace-web:3000;
  }
}

server {
  listen 443 ssl http2;
  server_name api.saqbol.kz;

  location / {
    proxy_pass http://api:3000;
  }
}
```

### 14.4. Nginx responsibilities

- TLS termination;
- gzip/brotli compression;
- upstream routing;
- basic rate limiting;
- request size limits;
- security headers;
- static asset caching policy;
- real IP forwarding and trace headers.

---

## 15. Масштабирование

### 15.1. Горизонтальное масштабирование

Система должна масштабироваться горизонтально для:

- public-web;
- workspace-web;
- api;
- worker.

Это возможно при условии stateless runtime и внешнего хранения состояния.

### 15.2. Вертикальное масштабирование

На раннем этапе допустимо:

- увеличивать CPU/RAM для PostgreSQL;
- выделять больше ресурсов API и worker;
- оптимизировать Nginx и connection pools.

### 15.3. Bottlenecks и стратегия роста

Наиболее вероятные узкие места:

- поиск по жалобам;
- массовые экспорты;
- файловые операции;
- AI traffic spikes;
- dashboard aggregation;
- auth/OTP bursts.

Рекомендуемая стратегия:

- вынести тяжелые экспорты в worker;
- использовать Redis для rate limiting и временного state;
- добавлять read replicas для PostgreSQL на следующем этапе;
- при росте AI-нагрузки выделить AI orchestration в отдельный сервис;
- при росте notification traffic вынести notification workers в отдельный deployment.

### 15.4. Эволюция архитектуры

Потенциальные кандидаты на выделение из modular monolith в будущем:

- `AiAssistantModule`
- `NotificationsModule`
- `ExportsModule`
- `FraudCheckModule`
- `AuditModule`

---

## 16. Monitoring и logging

### 16.1. Что мониторить

Инфраструктурные метрики:

- CPU, RAM, disk, network;
- container health;
- DB connections;
- Redis memory/latency;
- storage availability.

Приложенческие метрики:

- request rate;
- latency p95/p99;
- error rate;
- auth failures;
- status transition failures;
- export job duration;
- notification delivery success rate;
- AI request success/failure and safety blocks.

### 16.2. Рекомендуемый стек observability

Для production рекомендуется:

- Prometheus для метрик;
- Grafana для dashboards;
- Loki или ELK/OpenSearch для логов;
- Sentry для application errors;
- OpenTelemetry для traces.

### 16.3. Структурированное логирование

Все backend-логи должны быть structured JSON и содержать:

- timestamp;
- level;
- service_name;
- environment;
- request_id;
- user_id при допустимости;
- module;
- event_type;
- error_code.

### 16.4. Correlation

`request_id` и `trace_id` должны проходить через:

- Nginx;
- frontend requests;
- backend;
- queue jobs;
- notification delivery;
- external integrations.

### 16.5. Alerting

Необходимо настроить алерты на:

- API 5xx spike;
- auth attack spike;
- DB saturation;
- worker queue backlog;
- failed exports;
- AI provider outage;
- SMS/email provider degradation;
- storage access errors.

---

## 17. Рекомендуемая структура monorepo

### 17.1. Общая структура

```text
saqbol/
  apps/
    public-web/
    workspace-web/
    api/
    worker/
  packages/
    ui-core/
    ui-public/
    ui-workspace/
    shared-types/
    shared-utils/
    api-client/
    auth-client/
    config-eslint/
    config-typescript/
    config-tailwind/
    i18n/
  infrastructure/
    docker/
    compose/
    nginx/
    scripts/
    ci/
  docs/
    SRS_SaqBol_MVP.md
    Architecture_SaqBol.md
  .env.example
  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
```

### 17.2. Пример структуры `apps/public-web`

```text
apps/public-web/
  src/
    app/
      (marketing)/
      auth/
      cabinet/
      complaint/
      check/
      news/
      education/
      map/
      ai/
      api/
    components/
    features/
      auth/
      complaint/
      check/
      ai/
      content/
    hooks/
    lib/
    styles/
    middleware.ts
  public/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

### 17.3. Пример структуры `apps/workspace-web`

```text
apps/workspace-web/
  src/
    app/
      login/
      dashboard/
      complaints/
      exports/
      audit/
      admin/
      content/
      references/
    components/
    features/
      auth/
      dashboard/
      complaint-registry/
      complaint-card/
      assignments/
      audit/
      admin/
    hooks/
    lib/
    styles/
    middleware.ts
  public/
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  package.json
```

### 17.4. Пример структуры `apps/api`

```text
apps/api/
  src/
    main.ts
    app.module.ts
    common/
      decorators/
      guards/
      interceptors/
      filters/
      pipes/
      dto/
      utils/
    config/
    modules/
      auth/
      users/
      sessions/
      rbac/
      two-factor/
      citizen-profile/
      complaints/
      complaint-workflow/
      assignments/
      internal-comments/
      fraud-check/
      dashboard/
      news/
      education/
      content-management/
      reference-data/
      files/
      notifications/
      exports/
      audit/
      ai-assistant/
      integrations/
      health/
    database/
      prisma/
      migrations/
      seeds/
  test/
  package.json
  tsconfig.json
```

### 17.5. Пример структуры `apps/worker`

```text
apps/worker/
  src/
    main.ts
    jobs/
      notifications/
      exports/
      files/
      ai/
      cleanup/
    consumers/
    services/
    utils/
  package.json
  tsconfig.json
```

### 17.6. Пример структуры `infrastructure/nginx`

```text
infrastructure/nginx/
  nginx.conf
  conf.d/
    public.conf
    workspace.conf
    api.conf
  snippets/
    ssl.conf
    headers.conf
    gzip.conf
    rate-limit.conf
```

### 17.7. Пример структуры `packages/shared-types`

```text
packages/shared-types/
  src/
    auth/
    complaints/
    content/
    notifications/
    ai/
    common/
  package.json
  tsconfig.json
```

---

## 18. Вывод

Для SaqBol.kz на этапе MVP оптимальна архитектура с двумя отдельными Next.js фронтендами, единым NestJS backend API, PostgreSQL как центральной БД, S3-compatible storage для файлов, Redis для очередей и short-lived state, а также защищенным AI-контуром через orchestration и safety layer.

Ключевое архитектурное решение состоит в том, чтобы:

- не усложнять MVP преждевременными микросервисами;
- сразу заложить жесткое разделение public и workspace контуров;
- делать backend как modular monolith с явными bounded contexts;
- строить систему вокруг безопасности, аудита и расширяемости;
- вынести тяжелые и ненадежные операции в асинхронные worker-процессы.

Такая архитектура обеспечивает:

- быстрый старт разработки;
- управляемую операционную сложность;
- понятную модель безопасности;
- достаточный запас для масштабирования;
- эволюционный путь к выделению сервисов при росте нагрузки и интеграционного ландшафта.

### Рекомендуемые следующие артефакты

После утверждения данной архитектуры рекомендуется подготовить:

- C4 diagrams L1-L3;
- ERD базы данных;
- API contract draft в OpenAPI;
- матрицу ролей и permission model;
- sequence diagrams по ключевым use cases;
- deployment handbook;
- threat model и security checklist.
