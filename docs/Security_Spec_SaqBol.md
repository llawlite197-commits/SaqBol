# Security Specification
## SaqBol.kz

**Версия:** 1.0  
**Статус:** Security Architecture and Controls Specification  
**Назначение документа:** единая security-спецификация для архитекторов, backend/frontend-разработчиков, DevSecOps, QA, SOC/CSIRT и эксплуатационной команды

---

## 1. Security goals

### 1.1. Цели безопасности

Для SaqBol.kz целями безопасности являются:

- защита персональных данных граждан;
- защита жалоб, вложений, подозрительных сущностей и служебных данных;
- недопущение несанкционированного доступа к Public Web, Workspace Web и API;
- обеспечение безопасной аутентификации граждан и сотрудников;
- защита административного и служебного контура;
- обеспечение целостности данных, статусов жалоб, журналов аудита и экспортов;
- снижение риска массового abuse публичных сервисов проверки и AI-ассистента;
- обеспечение трассируемости действий пользователей, сотрудников, администраторов и системы;
- ограничение передачи чувствительных данных во внешние интеграции и AI-контур;
- обеспечение устойчивого восстановления после инцидентов.

### 1.2. Security principles

- `Security by Design`
- `Privacy by Design`
- `Least Privilege`
- `Need to Know`
- `Default Deny`
- `Defense in Depth`
- `Zero Trust for sensitive actions`
- `Auditability`
- `Secure Defaults`
- `Human-in-the-loop for high-impact decisions`

### 1.3. CIAAN model

Безопасность портала должна обеспечивать:

- **Confidentiality**: защита ПДн, жалоб, вложений, токенов и внутренних данных;
- **Integrity**: защита от несанкционированного изменения статусов, ролей, комментариев, файлов и логов;
- **Availability**: устойчивость к DoS/abuse и наличие механизма восстановления;
- **Authenticity**: достоверность пользователей, сотрудников, сессий и сервисов;
- **Non-repudiation / Accountability**: подтверждаемость факта действия через audit trail.

### 1.4. Security classification

Рекомендуемая классификация данных:

- `Critical`: токены, секреты, signing keys, backup encryption keys;
- `High`: ПДн граждан, жалобы, вложения, телефоны, email, карты, IBAN, AI raw prompts с PII, audit logs;
- `Medium`: новости, справочники, агрегированные отчеты, экспортные задачи;
- `Low`: общедоступные страницы, FAQ, публичный контент.

---

## 2. Threat model

### 2.1. Методология

Для SaqBol.kz рекомендуется использовать комбинированный подход:

- **STRIDE** для архитектурного анализа угроз;
- **OWASP Top 10 / ASVS** для web- и API-рисков;
- **LINDDUN-lite** для privacy-рисков;
- отдельный **AI threat model** для prompt injection, data leakage и unsafe generation.

### 2.2. Основные категории угроз

#### Spoofing

- кража учетных данных граждан;
- компрометация сотрудника;
- session hijacking;
- подделка токенов;
- impersonation через AI/социальную инженерию;
- подмена системных и интеграционных сервисов.

#### Tampering

- изменение статуса жалобы;
- изменение экспортов;
- изменение ролей и настроек;
- модификация audit logs;
- подмена вложений;
- подмена AI responses или retrieval sources.

#### Repudiation

- отрицание сотрудником факта изменения статуса;
- отрицание администраторами изменения ролей и настроек;
- отсутствие корреляции между request/action/export.

#### Information Disclosure

- утечка ПДн граждан;
- доступ к чужим жалобам;
- раскрытие вложений через прямые object URLs;
- утечка токенов/секретов;
- утечка данных через AI prompt/response/logging;
- утечка через экспорт и debug endpoints.

#### Denial of Service

- brute force на login/OTP/2FA;
- rate abuse на `/check`, `/auth`, `/ai/chat`;
- загрузка крупных/вредоносных файлов;
- queue flooding export jobs;
- exhaustion of DB connections or Redis memory.

#### Elevation of Privilege

- обход RBAC;
- IDOR/BOLA в карточках жалоб и файлах;
- злоупотребление сервисными ролями;
- privilege escalation через admin UI/API;
- prompt injection для обхода policy layer.

### 2.3. Наиболее вероятные сценарии атак

- массовый подбор логина/пароля для гражданских аккаунтов;
- targeted phishing или credential theft против сотрудников;
- обход permission checks в workspace API;
- получение вложений по угаданным object key или leaked presigned URL;
- внедрение вредоносного файла как доказательства;
- enumeration телефонов/email/карт через публичную проверку;
- prompt injection против AI-ассистента;
- злоупотребление export center для массовой выгрузки данных;
- утечка секретов через CI/CD или misconfigured `.env`;
- SSRF через URL-проверку или file preview pipeline.

### 2.4. Критичные threat scenarios

Критичными считаются:

- несанкционированный доступ к Workspace Web;
- массовая утечка жалоб или вложений;
- компрометация admin account;
- модификация audit logs;
- компрометация JWT signing keys;
- обход AI safety boundary с утечкой внутренних данных;
- компрометация backup set без шифрования.

---

## 3. Assets

### 3.1. Бизнес-активы

- репутация государственного портала;
- доверие граждан;
- непрерывность обработки обращений;
- достоверность реестра жалоб;
- юридически и операционно значимые следы аудита.

### 3.2. Информационные активы

- учетные записи пользователей;
- citizen profiles;
- employee profiles;
- user roles and permissions;
- complaints;
- complaint contacts;
- complaint files;
- complaint status history;
- internal comments;
- blacklist entries and checks;
- notifications;
- news and dictionaries;
- export files;
- audit logs;
- AI sessions and AI messages;
- OTP/2FA records;
- refresh tokens.

### 3.3. Технические активы

- frontend applications;
- backend API;
- PostgreSQL;
- Redis;
- S3-compatible storage;
- AI gateway;
- email/SMS integrations;
- Docker images;
- Nginx reverse proxy;
- CI/CD pipelines;
- secret manager / KMS / Vault;
- backup repositories;
- monitoring and SIEM.

---

## 4. Actors

### 4.1. Legitimate actors

- анонимный гражданин;
- зарегистрированный гражданин;
- оператор;
- руководитель;
- администратор;
- системные сервисы и background workers;
- интеграционные поставщики (SMS, email, AI provider, storage).

### 4.2. Threat actors

- внешний анонимный злоумышленник;
- botnet / abuse actor;
- account takeover attacker;
- insider with excessive privileges;
- malicious admin / disgruntled employee;
- supply-chain attacker;
- attacker targeting AI prompt layer;
- attacker targeting storage, exports or backups.

### 4.3. Trust boundaries

- internet -> public web;
- public web -> backend API;
- workspace web -> backend API;
- backend -> DB/Redis/storage;
- backend -> AI provider;
- backend/worker -> email/SMS provider;
- admin actions -> critical configuration surfaces;
- AI safety layer -> external LLM.

---

## 5. Attack surfaces

### 5.1. Public attack surfaces

- `saqbol.kz` public routes;
- registration/login/recovery;
- OTP verification;
- public blacklist checks;
- complaint submission;
- public file upload;
- AI-assistant chat;
- public news/FAQ/search.

### 5.2. Workspace attack surfaces

- `workspace.saqbol.kz`;
- employee login and 2FA;
- dashboard;
- complaint registry;
- complaint detail actions;
- export center;
- audit logs;
- admin panel;
- dictionaries and settings.

### 5.3. API attack surfaces

- auth endpoints;
- refresh/logout;
- complaints CRUD and status transitions;
- file upload/download endpoints;
- AI endpoints;
- export creation/download;
- admin and role management endpoints;
- audit log endpoints.

### 5.4. Infrastructure attack surfaces

- Nginx reverse proxy;
- Docker runtime;
- container registry;
- PostgreSQL network exposure;
- Redis exposure;
- S3 bucket policies;
- CI/CD secrets;
- backup storage;
- observability stack.

### 5.5. AI-specific attack surfaces

- prompt injection;
- jailbreak attempts;
- data exfiltration through prompt or output;
- unsafe retrieval source poisoning;
- token exhaustion / usage abuse;
- prompt logging leaks;
- misuse by staff to infer hidden data.

---

## 6. Security controls

### 6.1. Control families

Для SaqBol.kz обязательны следующие control families:

- transport security;
- identity and session security;
- authorization and access control;
- application security;
- API security;
- file and storage security;
- database and secret security;
- audit and monitoring;
- backup and recovery;
- AI safety and privacy controls.

### 6.2. Network and transport controls

- только HTTPS/TLS для внешнего и внутреннего трафика, где применимо;
- TLS 1.2+ минимум, предпочтительно TLS 1.3;
- отключение слабых cipher suites и legacy protocols;
- HSTS для production;
- secure reverse proxy headers;
- segmentation public/workspace/api;
- deny direct public access к DB/Redis/internal worker endpoints.

### 6.3. Platform controls

- hardened container base images;
- vulnerability scanning of images and dependencies;
- signed build artifacts where available;
- read-only filesystem for containers where feasible;
- non-root containers where feasible;
- restricted outbound network for backend/worker except approved integrations.

### 6.4. Application controls

- secure coding standards;
- input validation and output encoding;
- server-side authorization checks;
- business rule enforcement on backend;
- rate limiting;
- audit on critical actions;
- append-only audit history;
- masked exports and logging where applicable.

### 6.5. Privacy controls

- data minimization;
- field-level masking;
- retention limits;
- access by role and necessity;
- separate handling of public vs workspace data;
- explicit no-storage of secrets like CVV/OTP in business records.

### 6.6. OWASP Top 10 coverage

#### A01 Broken Access Control

- RBAC;
- permission checks;
- object-level authorization;
- attachment access checks;
- deny-by-default.

#### A02 Cryptographic Failures

- TLS everywhere;
- encryption at rest;
- secure password hashing;
- field-level encryption where needed;
- KMS/secret manager usage.

#### A03 Injection

- parameterized queries;
- DTO validation;
- strict URL validation;
- no shell interpolation for untrusted input;
- SSRF-safe fetchers.

#### A04 Insecure Design

- threat modeling;
- separation of public/workspace;
- human-in-the-loop for AI and workflow decisions;
- bounded permissions.

#### A05 Security Misconfiguration

- hardened Nginx;
- secure headers;
- secrets outside code;
- protected debug/admin routes;
- hardened buckets and storage.

#### A06 Vulnerable and Outdated Components

- SCA scanning;
- image scanning;
- pinned dependencies;
- patch management cadence.

#### A07 Identification and Authentication Failures

- Argon2id/bcrypt;
- JWT signing control;
- refresh rotation;
- session revoke;
- 2FA for staff;
- brute force protection.

#### A08 Software and Data Integrity Failures

- CI/CD controls;
- artifact integrity;
- migration review;
- append-only audit;
- controlled import/export processes.

#### A09 Security Logging and Monitoring Failures

- centralized logs;
- alerting on auth failures, export spikes, admin changes;
- AI safety logging;
- retention and integrity policy for logs.

#### A10 SSRF

- no unrestricted URL fetches;
- allowlist-based fetchers;
- metadata IP/range blocking;
- DNS rebinding protections;
- safe preview isolation.

---

## 7. Authentication security

### 7.1. Login channels

- Public citizens: login by email or phone + password
- Staff: login by email/phone + password + mandatory 2FA

### 7.2. HTTPS and HSTS

- все auth-сценарии доступны только по HTTPS;
- HTTP requests должны редиректиться на HTTPS;
- включить `Strict-Transport-Security` в production:
  - `max-age=31536000`
  - `includeSubDomains`
- `preload` включать только после подтверждения готовности всех subdomains.

### 7.3. Password policy

#### Preferred hashing

- `Argon2id` является предпочтительным алгоритмом;
- `bcrypt` допускается только как fallback по техническим ограничениям.

#### Recommended parameters

- Argon2id:
  - memory cost tuned to production capacity;
  - time cost >= 3;
  - parallelism >= 1;
- bcrypt:
  - cost factor >= 12, предпочтительно 12-14.

#### Password rules

- minimum length 8, recommended 12+;
- запрет extremely weak/common passwords;
- password reset only via one-time flow;
- password hashes never logged;
- staff password reuse prevention recommended.

### 7.4. JWT security

- short-lived access tokens;
- signed with strong secret or asymmetric keys;
- `aud`, `iss`, `sub`, `exp`, `jti`, `sessionId`, `roles`, `permissions` included;
- signing keys rotated per policy;
- old keys handled via key rotation window;
- access JWT never stored in `localStorage`.

### 7.5. Refresh token security

- refresh tokens rotated on every refresh;
- only token hash stored in DB;
- token family concept required;
- reuse detection must revoke entire family;
- refresh TTL shorter for staff than citizens;
- refresh cookies `HttpOnly`, `Secure`, scoped appropriately.

### 7.6. Session security

- session fixation protection;
- server-side session metadata with IP/user-agent;
- global logout and per-session revoke supported;
- invalidation after password change or suspicious events;
- stricter staff session TTL;
- re-auth required for some admin-sensitive actions.

### 7.7. 2FA

Для сотрудников обязательно:

- TOTP как основной метод;
- backup codes;
- SMS only as fallback, if approved.

Требования:

- 2FA setup/reset must be audited;
- TOTP secret encrypted at rest;
- backup codes stored as hash;
- rate limiting on 2FA verification;
- admin-driven 2FA reset only through controlled workflow.

### 7.8. CAPTCHA and abuse protection

CAPTCHA следует применять адаптивно:

- на registration при повышенном abuse;
- на password reset после подозрительных попыток;
- на public login после threshold;
- на `/check` и `/ai/chat` при spike или anonymous abuse.

Не рекомендуется ставить CAPTCHA на каждый сценарий по умолчанию, если это ухудшает гражданский UX без выраженной угрозы.

### 7.9. Brute force protection

- per-IP rate limiting;
- per-identifier rate limiting;
- temporary lockouts;
- exponential backoff;
- suspicious auth spike alerts;
- credential stuffing detection where feasible.

### 7.10. Recommended thresholds

- citizen login: 5-10 неудачных попыток / 15 минут;
- staff login: 5 попыток / 15 минут;
- OTP verification: 5 попыток / OTP;
- 2FA verification: 5 попыток / session;
- refresh misuse detection triggers family revocation.

---

## 8. Authorization security

### 8.1. Authorization model

Необходима многоуровневая модель:

- role-based access control;
- permission-based checks;
- object-level authorization;
- scope-based access for staff;
- deny-by-default.

### 8.2. Roles

- `CITIZEN`
- `OPERATOR`
- `SUPERVISOR`
- `ADMIN`

### 8.3. Permissions

Минимальный набор permission groups:

- `complaint.read.own`
- `complaint.read.assigned`
- `complaint.read.all`
- `complaint.status.change`
- `complaint.assign`
- `complaint.comment.internal`
- `file.download.protected`
- `export.create`
- `audit.read`
- `content.manage`
- `reference.manage`
- `user.manage.staff`
- `role.manage`
- `settings.manage`

### 8.4. Object-level access control

Обязательные правила:

- citizen sees only own complaints and files;
- operator sees only permitted queue/scope;
- supervisor sees wider queue and assignment actions;
- admin does not automatically bypass logging and policy;
- attachments checked against complaint ownership/scope on every download.

### 8.5. IDOR / BOLA prevention

- no trust in client-supplied IDs alone;
- every read/write of complaint, file, export, audit record checked against user scope;
- opaque IDs preferred;
- sequential IDs avoided for sensitive entities;
- bulk actions checked per object, not only per endpoint.

### 8.6. Admin safety

- least privilege admin roles;
- optional split admin roles in future;
- system settings, role changes, export of sensitive data fully audited;
- critical admin actions may require re-auth or step-up confirmation.

---

## 9. API security

### 9.1. General rules

- all APIs behind HTTPS only;
- versioned API;
- structured error responses without stack traces;
- authentication and authorization always enforced server-side;
- all critical endpoints audited.

### 9.2. Input validation

- DTO validation required;
- whitelist + forbid non-whitelisted fields;
- strict enum validation;
- normalize phone/email/URL/card/IBAN before use;
- reject malformed JSON and oversized payloads.

### 9.3. CSRF protection

Если auth основан на cookies:

- CSRF protection mandatory for state-changing requests;
- `SameSite=Lax` or `Strict` cookies;
- CSRF token or double-submit token for unsafe methods;
- do not rely on CORS alone.

### 9.4. XSS protection

- output encoding in frontend;
- sanitize rich content if any HTML rendering exists;
- strict CSP;
- avoid `dangerouslySetInnerHTML` unless sanitized;
- stored XSS checks for comments, news and content management inputs.

### 9.5. SQL Injection protection

- Prisma/ORM parameterization by default;
- raw SQL only via reviewed parameterized queries;
- no string concatenation for SQL;
- DB user permissions limited.

### 9.6. SSRF protection

Особенно важно для:

- URL analysis;
- link preview;
- antivirus/file processing pipelines;
- remote fetch or validation services.

Controls:

- deny direct arbitrary fetch where possible;
- if fetch required, allowlist destinations or use hardened proxy;
- block private IP ranges and cloud metadata endpoints;
- resolve DNS safely and revalidate post-resolution;
- limit protocols to `https` and `http` only if necessary;
- cap response size and redirects.

### 9.7. CORS and origins

- strict allowlist of trusted origins;
- separate origin policy for workspace;
- no wildcard credentials configuration;
- environment-specific origin lists.

### 9.8. Security headers

Recommended headers:

- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or via CSP frame-ancestors
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cache-Control` for sensitive endpoints and pages

### 9.9. Rate limiting

Apply to:

- login
- refresh
- OTP and 2FA
- blacklist checks
- AI chat
- file upload intent
- export creation

Recommended patterns:

- per-IP
- per-user
- per-identifier
- burst + sustained rate windows
- escalated penalties for repeated abuse

### 9.10. Export security

- export creation requires explicit permission;
- fields masked by role;
- each export logged;
- short-lived download links;
- generated export files isolated in dedicated bucket/path;
- prevent directory/object enumeration.

---

## 10. Frontend security

### 10.1. General frontend controls

- no sensitive tokens in `localStorage`;
- use `HttpOnly` cookies for auth where applicable;
- no inline scripts unless CSP nonce-based and justified;
- route protection for workspace;
- RBAC-aware rendering is convenience only, backend remains source of truth.

### 10.2. Content Security Policy

Recommended CSP baseline:

- `default-src 'self'`
- `script-src 'self' 'nonce-<dynamic>'`
- `style-src 'self' 'unsafe-inline'` only if necessary and preferably nonce/hash-based
- `img-src 'self' data: https:`
- `connect-src 'self' https://api.saqbol.kz`
- `frame-ancestors 'none'`
- `object-src 'none'`
- `base-uri 'self'`

Need adjustment for:

- analytics if approved;
- AI provider should still be backend-only, not direct from frontend.

### 10.3. Sensitive page caching

- no-store for authenticated workspace pages;
- no-store or private cache for citizen cabinet and complaint detail;
- public content may use controlled caching.

### 10.4. Clickjacking

- deny framing via CSP or X-Frame-Options;
- especially important for login, complaint actions and admin pages.

### 10.5. Dependency hygiene

- SCA scanning for frontend dependencies;
- lockfile committed;
- avoid abandoned packages;
- review WYSIWYG and file viewer libraries carefully.

---

## 11. File security

### 11.1. Upload rules

- presigned upload flow preferred;
- file metadata created before object activation;
- only allowlisted file types;
- validate extension, MIME type and magic bytes;
- enforce size limits;
- enforce count limits;
- store files with opaque object keys.

### 11.2. Disallowed content

- executables;
- scripts;
- macro-enabled office files unless explicitly approved;
- archives if not strictly required;
- password-protected files unless business-justified and safely handled.

### 11.3. Antivirus scanning concept

Recommended flow:

1. file uploaded into quarantine/pending state;
2. backend marks file as `PENDING_SCAN`;
3. worker sends object to AV scanning pipeline;
4. result:
   - `ACTIVE` on pass;
   - `QUARANTINED` on fail/suspicious;
5. unscanned files are not downloadable by users;
6. all scanning outcomes logged.

### 11.4. Attachment access control

- storage bucket must not be public;
- no permanent direct public URLs;
- download only via backend authorization or short-lived presigned GET URLs;
- access checked against complaint ownership or employee scope;
- short TTL on download URLs;
- object keys not guessable;
- file access logged.

### 11.5. Preview security

- previews generated in isolated worker context;
- PDF/image preview only after scan;
- no browser-executed active content;
- sanitize filename display;
- content-disposition configured safely.

### 11.6. File retention

- complaint evidence retained per policy;
- export files shorter retention;
- quarantined files retained only as long as needed for investigation;
- deletion or archival events logged.

---

## 12. Database security

### 12.1. Access model

- database must not be internet-accessible;
- separate DB users for app, migration, readonly/reporting if needed;
- no app connection as superuser;
- least privilege DB accounts;
- admin credentials rotated and controlled.

### 12.2. Encryption at rest

- storage-level encryption for DB volumes/backups;
- additional field-level encryption recommended for highly sensitive fields:
  - IIN
  - raw card/IBAN values if retained
  - TOTP secrets
  - certain complaint contact raw values depending on policy

### 12.3. Encryption in transit

- TLS for DB connections where infrastructure supports it;
- encrypted transport between app and managed DB or dedicated DB host.

### 12.4. Sensitive data minimization

- never store CVV;
- never store OTP in plain text;
- do not store passwords in reversible form;
- mask phone/email/card/IBAN in UI and logs where possible;
- avoid storing more PII than required for complaint processing.

### 12.5. Searchable sensitive values

Для phone/email/URL/card/IBAN, если нужен поиск:

- использовать нормализованные значения;
- для особо чувствительных полей рассмотреть deterministic tokenization / keyed hash for match-only scenarios;
- raw sensitive values should be restricted, encrypted or masked according to data need.

### 12.6. Audit protection

- audit tables append-only;
- no UPDATE/DELETE from application roles;
- export and admin changes fully traceable;
- separate backup retention for audit data.

### 12.7. SQL and migration hygiene

- reviewed migrations;
- no destructive migrations without backup and approval;
- schema drift detection;
- test restores from backup.

---

## 13. AI security

### 13.1. Core rule

AI must operate only through the internal AI orchestration and safety layer. No frontend direct access to external LLM APIs.

### 13.2. AI security goals

- prevent data leakage to LLM provider;
- block prompt injection and jailbreak attempts;
- prevent RBAC bypass through AI;
- prevent unsafe or overconfident recommendations;
- keep AI read-only regarding complaint workflow.

### 13.3. Required controls

- input safety filter;
- PII redaction before model call;
- approved-source retrieval only;
- output safety filter;
- refusal policy;
- request rate limiting;
- AI usage logging;
- human-in-the-loop for workspace assistance;
- no direct access to raw complaint corpus unless explicitly scoped and authorized.

### 13.4. Sensitive data handling

- redact phone, email, card, IBAN, IIN where not necessary;
- never send OTP, passwords, tokens, CVV, session data;
- minimal complaint context only for workspace use cases;
- no hidden internal notes to AI unless explicitly allowed and access-controlled.

### 13.5. Prompt injection protection

- ignore user attempts to override policies or system prompt;
- isolate tool and retrieval instructions from user content;
- classify suspicious meta-prompts;
- refuse requests to reveal secrets, hidden instructions or internal data.

### 13.6. AI output policy

AI must not:

- make legal conclusions;
- accuse specific entities;
- promise money recovery;
- recommend bypassing controls;
- decide complaint status;
- output hidden PII from context;
- simulate access to protected systems it does not have.

### 13.7. AI logging and alerts

- log safety flags and refusal reasons;
- alert on spike of blocked/jailbreak prompts;
- alert on abnormal token usage;
- alert on repeated workspace AI queries attempting broad data extraction.

---

## 14. Audit logging requirements

### 14.1. Mandatory audit events

- login/logout;
- failed login;
- password reset request/complete;
- 2FA setup/reset/verify/fail;
- complaint create/update/status change/assignment;
- internal comments create/update/delete;
- file upload/download/delete;
- blacklist create/update/delete/check;
- export create/generate/download/fail;
- admin user changes;
- role assignments and revocations;
- dictionary changes;
- news publish/archive;
- system settings changes;
- AI usage events and safety refusals where applicable.

### 14.2. Required audit fields

- event id;
- timestamp;
- actor user id;
- actor role(s);
- action type;
- entity type;
- entity id;
- request id / correlation id;
- IP address;
- user agent;
- result / status code;
- old values;
- new values;
- metadata.

### 14.3. Audit integrity

- append-only storage;
- no edit/delete through UI/API;
- restricted DB permissions;
- backup included;
- integrity monitoring recommended.

### 14.4. Admin activity tracking

All admin actions must be specifically tracked, including:

- user create/block/unblock;
- role changes;
- system settings changes;
- dictionary changes;
- export creation of sensitive data;
- 2FA resets;
- emergency break-glass actions.

### 14.5. Export logging

Every export event must log:

- requester;
- role;
- export type;
- filters used;
- field-set/profile if applicable;
- row count;
- generation status;
- download event;
- expiration/deletion event.

### 14.6. Log retention

- security and audit logs retained per policy and regulation;
- different retention profiles for application logs vs audit logs vs AI logs;
- archival and secure deletion documented.

---

## 15. Monitoring and alerts

### 15.1. Observability stack

Recommended:

- centralized structured logs;
- metrics collection;
- dashboards;
- error tracking;
- traces for critical request paths;
- SIEM or centralized security analysis pipeline.

### 15.2. What to monitor

- login failures;
- staff 2FA failures;
- password reset spikes;
- rate limit triggers;
- export spikes;
- audit access spikes;
- file scanning failures;
- abnormal download activity;
- attachment access denials;
- DB auth failures;
- Redis auth/exposure;
- storage access anomalies;
- AI safety blocks and spikes.

### 15.3. Mandatory alerts

- repeated failed staff login attempts;
- repeated failed 2FA attempts;
- refresh token reuse detection;
- admin role changes;
- mass export generation;
- unusual complaint download volume;
- AI jailbreak/refusal spikes;
- antivirus-positive file;
- failed backup jobs;
- storage bucket exposure or access anomalies;
- critical dependency/image vulnerability in production.

### 15.4. Alert severity

Suggested levels:

- `SEV1`: confirmed compromise, mass leakage, admin compromise, signing key compromise;
- `SEV2`: suspicious export spike, staff credential attack, malicious file found;
- `SEV3`: repeated abuse, anomalous AI prompts, partial service degradation.

---

## 16. Backup and recovery

### 16.1. Backup scope

Must back up:

- PostgreSQL data;
- audit logs if separate;
- critical storage metadata;
- export job metadata;
- configuration and IaC where appropriate;
- secret recovery references as approved.

### 16.2. Backup policy

- scheduled full and incremental backups;
- encrypted backups at rest;
- off-site or isolated backup copy;
- access to backups tightly restricted;
- retention policy documented separately by asset class.

### 16.3. Recovery objectives

RPO/RTO must be approved by the owner, but security-wise:

- critical complaint data should have low RPO;
- audit logs must be recoverable;
- backup restore procedures must be periodically tested.

### 16.4. Backup protection

- backup repositories not public;
- separate credentials for backup systems;
- immutable/locked backup copies recommended;
- backup access fully logged;
- restore operations require controlled approval.

### 16.5. Restore testing

- quarterly restore drills recommended;
- test restore to isolated environment;
- verify DB consistency, attachments linkage and audit integrity;
- document outcomes and remediation actions.

---

## 17. Incident response plan

### 17.1. IR phases

1. Preparation
2. Detection
3. Triage
4. Containment
5. Eradication
6. Recovery
7. Lessons Learned

### 17.2. Preparation

- define incident owners and escalation matrix;
- maintain playbooks;
- ensure contact tree for security, ops, product and legal/compliance stakeholders;
- ensure time synchronization and logging coverage.

### 17.3. Detection and triage

Sources:

- SIEM alerts;
- auth anomaly alerts;
- AV scan alerts;
- export anomaly alerts;
- AI safety anomaly alerts;
- user reports;
- infrastructure monitoring.

Questions:

- what asset is affected;
- what data may be exposed;
- is the incident ongoing;
- is admin/staff account involved;
- does it affect PII or regulated data;
- does it affect availability or integrity.

### 17.4. Containment examples

- revoke sessions and refresh token families;
- disable affected staff/admin accounts;
- block suspicious IPs/WAF rules;
- disable affected integration keys;
- quarantine malicious files;
- temporarily disable AI or export endpoint if abused;
- rotate compromised secrets.

### 17.5. Eradication

- patch vulnerability;
- remove malicious persistence;
- rotate credentials and keys;
- clean affected workloads;
- validate storage and backup integrity.

### 17.6. Recovery

- restore from trusted backups if needed;
- re-enable services gradually;
- monitor for re-exploitation;
- communicate to stakeholders as required by incident class and policy.

### 17.7. Post-incident actions

- root cause analysis;
- control gap remediation;
- updated runbooks;
- updated detections and dashboards;
- security review of similar surfaces.

---

## 18. Security acceptance criteria

MVP security acceptance is achieved only if all of the following are met:

### 18.1. Transport and platform

- all production traffic is HTTPS-only;
- HSTS enabled in production;
- no public direct access to DB/Redis/internal services;
- secure headers configured;
- container images scanned and critical vulnerabilities resolved or risk-accepted.

### 18.2. Auth and session

- passwords hashed with Argon2id or approved bcrypt fallback;
- staff 2FA enforced;
- refresh token rotation implemented;
- refresh token reuse detection implemented;
- brute force protection enabled;
- CAPTCHA available for adaptive abuse mitigation.

### 18.3. Authorization

- RBAC implemented on backend;
- object-level access checks verified for complaints, files, exports and audit;
- IDOR/BOLA tests passed for critical entities;
- admin actions require explicit permissions.

### 18.4. Files and storage

- file type allowlist enabled;
- AV scanning pipeline implemented or approved equivalent compensating control;
- files inaccessible before scan completion;
- attachments accessible only through authorized flow;
- storage buckets are not public by default.

### 18.5. Logging and audit

- critical events logged;
- admin activity tracked;
- export events tracked;
- audit logs immutable to normal app users;
- request correlation identifiers present.

### 18.6. AI

- AI requests pass through safety layer;
- PII redaction implemented;
- refusal policy implemented;
- rate limiting enabled;
- AI cannot change complaint state;
- AI cannot bypass RBAC.

### 18.7. Data protection

- encryption in transit enabled;
- encryption at rest enabled for storage and backups;
- sensitive fields evaluated for field-level encryption;
- no CVV, passwords or OTP stored in plain text;
- privacy by design controls documented and implemented.

### 18.8. Resilience

- backup jobs configured and successful;
- restore test executed or scheduled with owner approval;
- incident response contacts and playbook prepared;
- monitoring and alerts operational.

---

## 19. Security checklist before production

### 19.1. Architecture and environment

- [ ] Public, Workspace and API contours are separated as designed.
- [ ] Production domain and subdomain TLS certificates are valid and renewed automatically.
- [ ] HSTS enabled and validated.
- [ ] Nginx reverse proxy hardened and exposing only intended routes.
- [ ] DB, Redis and internal services are not internet-accessible.
- [ ] Secrets are stored in Vault/KMS/secret manager, not in code or images.
- [ ] Environment-specific secrets and buckets are isolated.

### 19.2. Authentication

- [ ] Password hashing uses Argon2id or approved bcrypt fallback.
- [ ] Staff 2FA is mandatory and tested.
- [ ] Refresh token rotation and reuse detection are implemented.
- [ ] Auth cookies are `HttpOnly`, `Secure`, correctly scoped and reviewed.
- [ ] Brute force protection thresholds are configured.
- [ ] Adaptive CAPTCHA is enabled for abuse-prone flows.

### 19.3. Authorization

- [ ] RBAC roles and permissions are reviewed and approved.
- [ ] Object-level access checks are implemented and tested.
- [ ] IDOR/BOLA negative tests passed for complaints, files, exports and audit records.
- [ ] Admin actions require explicit permissions and are audited.

### 19.4. Application security

- [ ] Global validation pipe and DTO validation enabled.
- [ ] CSRF protection enabled for cookie-authenticated unsafe methods.
- [ ] CSP configured and tested.
- [ ] XSS protection reviewed for comments, news and any rich text rendering.
- [ ] SQL injection checks passed and raw SQL reviewed.
- [ ] SSRF protections implemented for URL-related features and file/preview workers.
- [ ] Error responses do not leak stack traces or internal details.

### 19.5. File security

- [ ] File type allowlist configured.
- [ ] Magic-byte validation implemented.
- [ ] File size and file count limits configured.
- [ ] Uploaded files remain inaccessible until scanning completes.
- [ ] Antivirus or equivalent scanning pipeline is active.
- [ ] Attachment downloads require authorization and are logged.
- [ ] Storage buckets are private and object keys are opaque.

### 19.6. Database and data protection

- [ ] Encryption at rest confirmed for DB, storage and backups.
- [ ] Encryption in transit confirmed for external and internal sensitive flows.
- [ ] Sensitive fields review completed.
- [ ] CVV is never stored.
- [ ] OTP and backup codes are not stored in plain text.
- [ ] Data retention and archival policy documented.

### 19.7. Audit and monitoring

- [ ] Audit logging implemented for critical events.
- [ ] Admin activity tracking implemented.
- [ ] Export logging implemented.
- [ ] Request IDs/correlation IDs visible end-to-end.
- [ ] Centralized logging operational.
- [ ] Alerting configured for auth abuse, export spikes, admin changes and AV detections.

### 19.8. AI security

- [ ] AI orchestration and safety layer are active.
- [ ] PII redaction implemented before model calls.
- [ ] Refusal policy implemented.
- [ ] Workspace AI respects RBAC and complaint scope.
- [ ] AI outputs contain disclaimer and do not create legal conclusions.
- [ ] AI logging is sanitized and access-controlled.

### 19.9. Recovery and operations

- [ ] Backup jobs are green.
- [ ] Backup restore procedure documented.
- [ ] Restore test completed or scheduled and approved.
- [ ] Incident response playbook is available.
- [ ] Contacts for SecOps / DevOps / product owners are current.
- [ ] Security review findings are closed or formally accepted.

---

## Вывод

Security for SaqBol.kz must be treated as a first-class architecture concern across identity, authorization, files, exports, AI, audit and privacy. The portal handles sensitive citizen and staff data, which means baseline web security is not enough: the solution must combine layered preventive controls, strong auditability, abuse resistance, privacy protections and tested recovery capability.

Ключевой результат этой спецификации:

- public и workspace контуры защищены и разделены;
- auth, 2FA, JWT и refresh lifecycle контролируются;
- RBAC и object-level access исключают несанкционированный доступ;
- вложения, экспорты и audit имеют отдельные security controls;
- AI работает только в policy- и safety-boundary;
- портал готов к мониторингу, расследованию и восстановлению.

### Следующий практический шаг

После утверждения этой спецификации рекомендуется подготовить:

- detailed threat model workbook;
- secure configuration baseline for Nginx, backend and storage;
- IAM and permission matrix;
- security test plan;
- incident playbooks;
- pre-production penetration test scope.
