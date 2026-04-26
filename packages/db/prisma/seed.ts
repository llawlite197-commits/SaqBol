import bcrypt from "bcryptjs";
import {
  AccountType,
  AuditAction,
  BlacklistSource,
  CommentVisibility,
  ComplaintContactType,
  ComplaintStatus,
  ExportJobStatus,
  ExportJobType,
  NewsStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
  PrismaClient,
  RegionKind,
  RequestSource,
  RiskLevel,
  TwoFactorMethod,
  UserRoleCode,
  UserStatus
} from "../src/generated/client";

const prisma = new PrismaClient();

const demoPassword = "Password123!";
const now = new Date("2026-04-25T08:00:00.000Z");

const roleSeeds = [
  {
    id: "11111111-1111-1111-1111-111111111101",
    code: UserRoleCode.CITIZEN,
    nameKz: "Азамат",
    nameRu: "Гражданин",
    description: "Public portal citizen role.",
    sortOrder: 10
  },
  {
    id: "11111111-1111-1111-1111-111111111102",
    code: UserRoleCode.OPERATOR,
    nameKz: "Оператор",
    nameRu: "Оператор",
    description: "Workspace operator role for first-line processing.",
    sortOrder: 20
  },
  {
    id: "11111111-1111-1111-1111-111111111103",
    code: UserRoleCode.SUPERVISOR,
    nameKz: "Жетекші",
    nameRu: "Руководитель",
    description: "Supervisor role for assignment and oversight.",
    sortOrder: 30
  },
  {
    id: "11111111-1111-1111-1111-111111111104",
    code: UserRoleCode.ADMIN,
    nameKz: "Әкімші",
    nameRu: "Администратор",
    description: "Administrative role with platform management permissions.",
    sortOrder: 40
  }
] as const;

const complaintStatusSeeds = [
  { id: "44444444-4444-4444-4444-444444444401", code: ComplaintStatus.NEW, nameKz: "ЖАҢА", nameRu: "НОВАЯ", description: "Complaint has been submitted and registered.", isTerminal: false, sortOrder: 10 },
  { id: "44444444-4444-4444-4444-444444444402", code: ComplaintStatus.UNDER_REVIEW, nameKz: "ҚАРАУДА", nameRu: "НА РАССМОТРЕНИИ", description: "Complaint is under primary review.", isTerminal: false, sortOrder: 20 },
  { id: "44444444-4444-4444-4444-444444444403", code: ComplaintStatus.NEED_INFO, nameKz: "ҚОСЫМША АҚПАРАТ ҚАЖЕТ", nameRu: "ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ", description: "Additional information is required.", isTerminal: false, sortOrder: 30 },
  { id: "44444444-4444-4444-4444-444444444404", code: ComplaintStatus.ASSIGNED, nameKz: "ТАҒАЙЫНДАЛДЫ", nameRu: "НАЗНАЧЕНА", description: "Complaint has been assigned.", isTerminal: false, sortOrder: 40 },
  { id: "44444444-4444-4444-4444-444444444405", code: ComplaintStatus.IN_PROGRESS, nameKz: "ӨҢДЕЛУДЕ", nameRu: "В РАБОТЕ", description: "Complaint is being processed.", isTerminal: false, sortOrder: 50 },
  { id: "44444444-4444-4444-4444-444444444406", code: ComplaintStatus.RESOLVED, nameKz: "ШЕШІЛДІ", nameRu: "РЕШЕНА", description: "Complaint has been resolved.", isTerminal: true, sortOrder: 60 },
  { id: "44444444-4444-4444-4444-444444444407", code: ComplaintStatus.REJECTED, nameKz: "ҚАБЫЛДАНБАДЫ", nameRu: "ОТКЛОНЕНА", description: "Complaint was rejected.", isTerminal: true, sortOrder: 70 },
  { id: "44444444-4444-4444-4444-444444444408", code: ComplaintStatus.DUPLICATE, nameKz: "ҚАЙТАЛАНҒАН", nameRu: "ДУБЛИКАТ", description: "Complaint duplicates an existing record.", isTerminal: true, sortOrder: 80 }
] as const;

const regionSeeds = [
  { id: "22222222-2222-2222-2222-222222222201", code: "ASTANA", kind: RegionKind.CITY, nameKz: "Астана", nameRu: "Астана", sortOrder: 10 },
  { id: "22222222-2222-2222-2222-222222222202", code: "ALMATY_CITY", kind: RegionKind.CITY, nameKz: "Алматы", nameRu: "Алматы", sortOrder: 20 },
  { id: "22222222-2222-2222-2222-222222222203", code: "SHYMKENT", kind: RegionKind.CITY, nameKz: "Шымкент", nameRu: "Шымкент", sortOrder: 30 },
  { id: "22222222-2222-2222-2222-222222222205", code: "AKMOLA", kind: RegionKind.REGION, nameKz: "Ақмола облысы", nameRu: "Акмолинская область", sortOrder: 40 },
  { id: "22222222-2222-2222-2222-222222222206", code: "AKTOBE", kind: RegionKind.REGION, nameKz: "Ақтөбе облысы", nameRu: "Актюбинская область", sortOrder: 50 },
  { id: "22222222-2222-2222-2222-222222222208", code: "ATYRAU", kind: RegionKind.REGION, nameKz: "Атырау облысы", nameRu: "Атырауская область", sortOrder: 60 },
  { id: "22222222-2222-2222-2222-222222222209", code: "EAST_KAZAKHSTAN", kind: RegionKind.REGION, nameKz: "Шығыс Қазақстан облысы", nameRu: "Восточно-Казахстанская область", sortOrder: 70 },
  { id: "22222222-2222-2222-2222-222222222213", code: "KARAGANDA", kind: RegionKind.REGION, nameKz: "Қарағанды облысы", nameRu: "Карагандинская область", sortOrder: 80 },
  { id: "22222222-2222-2222-2222-222222222214", code: "KOSTANAY", kind: RegionKind.REGION, nameKz: "Қостанай облысы", nameRu: "Костанайская область", sortOrder: 90 },
  { id: "22222222-2222-2222-2222-222222222216", code: "MANGYSTAU", kind: RegionKind.REGION, nameKz: "Маңғыстау облысы", nameRu: "Мангистауская область", sortOrder: 100 },
  { id: "22222222-2222-2222-2222-222222222217", code: "PAVLODAR", kind: RegionKind.REGION, nameKz: "Павлодар облысы", nameRu: "Павлодарская область", sortOrder: 110 },
  { id: "22222222-2222-2222-2222-222222222219", code: "TURKISTAN", kind: RegionKind.REGION, nameKz: "Түркістан облысы", nameRu: "Туркестанская область", sortOrder: 120 },
  { id: "22222222-2222-2222-2222-222222222210", code: "ZHAMBYL", kind: RegionKind.REGION, nameKz: "Жамбыл облысы", nameRu: "Жамбылская область", sortOrder: 130 },
  { id: "22222222-2222-2222-2222-222222222212", code: "WEST_KAZAKHSTAN", kind: RegionKind.REGION, nameKz: "Батыс Қазақстан облысы", nameRu: "Западно-Казахстанская область", sortOrder: 140 },
  { id: "22222222-2222-2222-2222-222222222215", code: "KYZYLORDA", kind: RegionKind.REGION, nameKz: "Қызылорда облысы", nameRu: "Кызылординская область", sortOrder: 150 },
  { id: "22222222-2222-2222-2222-222222222218", code: "NORTH_KAZAKHSTAN", kind: RegionKind.REGION, nameKz: "Солтүстік Қазақстан облысы", nameRu: "Северо-Казахстанская область", sortOrder: 160 },
  { id: "22222222-2222-2222-2222-222222222207", code: "ALMATY_REGION", kind: RegionKind.REGION, nameKz: "Алматы облысы", nameRu: "Алматинская область", sortOrder: 170 },
  { id: "22222222-2222-2222-2222-222222222204", code: "ABAI", kind: RegionKind.REGION, nameKz: "Абай облысы", nameRu: "область Абай", sortOrder: 180 },
  { id: "22222222-2222-2222-2222-222222222211", code: "ZHETISU", kind: RegionKind.REGION, nameKz: "Жетісу облысы", nameRu: "область Жетісу", sortOrder: 190 },
  { id: "22222222-2222-2222-2222-222222222220", code: "ULYTAU", kind: RegionKind.REGION, nameKz: "Ұлытау облысы", nameRu: "область Ұлытау", sortOrder: 200 }
] as const;

const fraudTypeSeeds = [
  { id: "33333333-3333-3333-3333-333333333301", code: "PHISHING", nameKz: "Фишинг", nameRu: "Фишинг", descriptionKz: "Жалған сайттар немесе хабарламалар арқылы деректерді ұрлау.", descriptionRu: "Хищение данных через поддельные сайты или сообщения.", sortOrder: 10 },
  { id: "33333333-3333-3333-3333-333333333302", code: "PHONE_SCAM", nameKz: "Телефон арқылы алаяқтық", nameRu: "Телефонное мошенничество", descriptionKz: "Банк, полиция немесе басқа ұйым атынан қоңырау шалу арқылы алдау.", descriptionRu: "Обман по телефону от имени банка, полиции или другой организации.", sortOrder: 20 },
  { id: "33333333-3333-3333-3333-333333333303", code: "SMS_SCAM", nameKz: "SMS алаяқтығы", nameRu: "SMS-мошенничество", descriptionKz: "Зиянды сілтемелері бар немесе төлем талап ететін SMS-хабарламалар.", descriptionRu: "SMS-сообщения с вредоносными ссылками или требованиями оплаты.", sortOrder: 30 },
  { id: "33333333-3333-3333-3333-333333333304", code: "MESSENGER_ACCOUNT_TAKEOVER", nameKz: "Мессенджердегі аккаунтты басып алу", nameRu: "Захват аккаунта в мессенджере", descriptionKz: "Мессенджер аккаунтын бұзып, оның атынан ақша сұрау.", descriptionRu: "Взлом аккаунта в мессенджере и запрос денег от имени владельца.", sortOrder: 40 },
  { id: "33333333-3333-3333-3333-333333333305", code: "MARKETPLACE_FRAUD", nameKz: "Маркетплейс алаяқтығы", nameRu: "Мошенничество на маркетплейсах", descriptionKz: "Сауда платформаларында жалған сатушы немесе сатып алушы схемалары.", descriptionRu: "Схемы с ложным продавцом или покупателем на торговых площадках.", sortOrder: 50 },
  { id: "33333333-3333-3333-3333-333333333306", code: "INVESTMENT_FRAUD", nameKz: "Инвестициялық алаяқтық", nameRu: "Инвестиционное мошенничество", descriptionKz: "Жалған инвестициялық жобалар және уәде етілген жоғары табыс схемалары.", descriptionRu: "Фиктивные инвестиционные проекты и схемы с обещанием высокой доходности.", sortOrder: 60 },
  { id: "33333333-3333-3333-3333-333333333307", code: "LOAN_FRAUD", nameKz: "Несиеге байланысты алаяқтық", nameRu: "Мошенничество с займами и кредитами", descriptionKz: "Жалған несие рәсімдеу, алдын ала комиссия сұрау немесе жалған МҚҰ схемалары.", descriptionRu: "Оформление фиктивных кредитов, запрос предоплаты или схемы с ложными МФО.", sortOrder: 70 },
  { id: "33333333-3333-3333-3333-333333333308", code: "CARD_DETAILS_THEFT", nameKz: "Карта деректерін ұрлау", nameRu: "Кража данных банковской карты", descriptionKz: "Банк картасының реквизиттерін, CVV немесе 3DS кодтарын иемдену.", descriptionRu: "Хищение реквизитов банковской карты, CVV или 3DS-кодов.", sortOrder: 80 }
] as const;

const demoUsers = [
  { id: "10000000-0000-0000-0000-000000000001", role: UserRoleCode.CITIZEN, accountType: AccountType.CITIZEN, email: "citizen@example.com", phone: "+77020000001", firstName: "Алия", lastName: "Демобаева", employeeCode: null, profileId: "11000000-0000-0000-0000-000000000001" },
  { id: "10000000-0000-0000-0000-000000000002", role: UserRoleCode.OPERATOR, accountType: AccountType.EMPLOYEE, email: "operator@example.com", phone: "+77020000002", firstName: "Данияр", lastName: "Оператор", employeeCode: "DEMO-OPER-001", profileId: "11000000-0000-0000-0000-000000000002" },
  { id: "10000000-0000-0000-0000-000000000003", role: UserRoleCode.SUPERVISOR, accountType: AccountType.EMPLOYEE, email: "supervisor@example.com", phone: "+77020000003", firstName: "Мадина", lastName: "Руководитель", employeeCode: "DEMO-SUP-001", profileId: "11000000-0000-0000-0000-000000000003" },
  { id: "10000000-0000-0000-0000-000000000004", role: UserRoleCode.ADMIN, accountType: AccountType.EMPLOYEE, email: "admin@example.com", phone: "+77020000004", firstName: "Арман", lastName: "Администратор", employeeCode: "DEMO-ADMIN-001", profileId: "11000000-0000-0000-0000-000000000004" }
] as const;

const contactTypes = [
  ComplaintContactType.PHONE,
  ComplaintContactType.URL,
  ComplaintContactType.EMAIL,
  ComplaintContactType.CARD,
  ComplaintContactType.IBAN
] as const;

const statuses = [
  ComplaintStatus.NEW,
  ComplaintStatus.UNDER_REVIEW,
  ComplaintStatus.NEED_INFO,
  ComplaintStatus.ASSIGNED,
  ComplaintStatus.IN_PROGRESS,
  ComplaintStatus.RESOLVED,
  ComplaintStatus.REJECTED,
  ComplaintStatus.DUPLICATE
] as const;

const titles = [
  "Звонок от имени службы безопасности банка",
  "Поддельная ссылка на оплату доставки",
  "Фальшивый розыгрыш в мессенджере",
  "Предоплата за товар на маркетплейсе",
  "Инвестиционная платформа с гарантированной прибылью",
  "SMS о блокировке карты",
  "Попытка получить CVV код",
  "Поддельный аккаунт родственника в WhatsApp",
  "Ложное оформление микрокредита",
  "Фишинговая страница авторизации"
] as const;

function id(prefix: string, index: number) {
  return `${prefix}0000-0000-0000-0000-${String(index).padStart(12, "0")}`;
}

function daysAgo(days: number) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function normalize(type: ComplaintContactType, value: string) {
  if (type === ComplaintContactType.PHONE || type === ComplaintContactType.CARD || type === ComplaintContactType.IBAN) {
    return value.replace(/[\s-]/g, "").toUpperCase();
  }
  return value.trim().toLowerCase();
}

async function seedReferenceData() {
  for (const role of roleSeeds) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { nameKz: role.nameKz, nameRu: role.nameRu, description: role.description, isSystem: true, isActive: true, sortOrder: role.sortOrder },
      create: { ...role, isSystem: true, isActive: true }
    });
  }

  for (const status of complaintStatusSeeds) {
    await prisma.complaintStatusDictionary.upsert({
      where: { code: status.code },
      update: { nameKz: status.nameKz, nameRu: status.nameRu, description: status.description, isTerminal: status.isTerminal, isActive: true, sortOrder: status.sortOrder },
      create: { ...status, isActive: true }
    });
  }

  for (const region of regionSeeds) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: { kind: region.kind, nameKz: region.nameKz, nameRu: region.nameRu, isActive: true, sortOrder: region.sortOrder },
      create: { ...region, isActive: true }
    });
  }

  for (const fraudType of fraudTypeSeeds) {
    await prisma.fraudType.upsert({
      where: { code: fraudType.code },
      update: { nameKz: fraudType.nameKz, nameRu: fraudType.nameRu, descriptionKz: fraudType.descriptionKz, descriptionRu: fraudType.descriptionRu, isActive: true, sortOrder: fraudType.sortOrder, deletedAt: null },
      create: { ...fraudType, isActive: true, deletedAt: null }
    });
  }
}

async function seedLegacyUsers() {
  const adminPasswordHash = await bcrypt.hash("Admin123!Secure", 12);
  const operatorPasswordHash = await bcrypt.hash("Operator123!Secure", 12);
  const citizenPasswordHash = await bcrypt.hash("Citizen123!Secure", 12);
  const astana = await prisma.region.findUniqueOrThrow({ where: { code: "ASTANA" } });

  const adminUser = await upsertUser("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1", "admin@saqbol.local", "+77010000001", adminPasswordHash, AccountType.EMPLOYEE);
  const operatorUser = await upsertUser("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2", "operator@saqbol.local", "+77010000002", operatorPasswordHash, AccountType.EMPLOYEE);
  const citizenUser = await upsertUser("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3", "citizen@saqbol.local", "+77010000003", citizenPasswordHash, AccountType.CITIZEN);

  await upsertEmployeeProfile("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1", adminUser.id, "EMP-ADMIN-001", "System", "Administrator", "Administrator", astana.id);
  await upsertEmployeeProfile("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2", operatorUser.id, "EMP-OPER-001", "Demo", "Operator", "Operator", astana.id);
  await upsertCitizenProfile("cccccccc-cccc-cccc-cccc-ccccccccccc1", citizenUser.id, "Тест", "Пользователь", astana.id, "900101300001");

  await assignRole("dddddddd-dddd-dddd-dddd-ddddddddddd1", adminUser.id, UserRoleCode.ADMIN, adminUser.id);
  await assignRole("dddddddd-dddd-dddd-dddd-ddddddddddd2", operatorUser.id, UserRoleCode.OPERATOR, adminUser.id);
  await assignRole("dddddddd-dddd-dddd-dddd-ddddddddddd3", citizenUser.id, UserRoleCode.CITIZEN, adminUser.id);
}

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const astana = await prisma.region.findUniqueOrThrow({ where: { code: "ASTANA" } });
  const admin = demoUsers.find((user) => user.role === UserRoleCode.ADMIN)!;

  for (const user of demoUsers) {
    await upsertUser(user.id, user.email, user.phone, passwordHash, user.accountType);
    if (user.accountType === AccountType.EMPLOYEE) {
      await upsertEmployeeProfile(user.profileId, user.id, user.employeeCode!, user.firstName, user.lastName, user.role, astana.id);
    } else {
      await upsertCitizenProfile(user.profileId, user.id, user.firstName, user.lastName, astana.id, "910101300001");
    }
  }

  for (const user of demoUsers) {
    await assignRole(id("1200", demoUsers.indexOf(user) + 1), user.id, user.role, admin.id);
  }
}

async function upsertUser(idValue: string, email: string, phone: string, passwordHash: string, accountType: AccountType) {
  return prisma.user.upsert({
    where: { id: idValue },
    update: { accountType, email, phone, passwordHash, status: UserStatus.ACTIVE, isEmailVerified: true, isPhoneVerified: true, deletedAt: null },
    create: {
      id: idValue,
      accountType,
      email,
      phone,
      passwordHash,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerifiedAt: now,
      isPhoneVerified: true,
      phoneVerifiedAt: now,
      passwordChangedAt: now
    }
  });
}

async function upsertEmployeeProfile(idValue: string, userId: string, employeeCode: string, firstName: string, lastName: string, positionTitle: string, regionId: string) {
  return prisma.employeeProfile.upsert({
    where: { userId },
    update: { employeeCode, firstName, lastName, positionTitle, departmentName: "Demo Fraud Response Center", regionId, isActive: true, deletedAt: null, preferred2faMethod: TwoFactorMethod.TOTP },
    create: { id: idValue, userId, employeeCode, firstName, lastName, positionTitle, departmentName: "Demo Fraud Response Center", regionId, isActive: true, preferred2faMethod: TwoFactorMethod.TOTP }
  });
}

async function upsertCitizenProfile(idValue: string, userId: string, firstName: string, lastName: string, regionId: string, iin: string) {
  return prisma.citizenProfile.upsert({
    where: { userId },
    update: { iin, firstName, lastName, patronymic: "Демоұлы", regionId, preferredLanguage: "ru", address: "г. Астана", deletedAt: null },
    create: { id: idValue, userId, iin, firstName, lastName, patronymic: "Демоұлы", regionId, preferredLanguage: "ru", address: "г. Астана" }
  });
}

async function assignRole(idValue: string, userId: string, roleCode: UserRoleCode, assignedByUserId: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.userRole.upsert({
    where: { id: idValue },
    update: { userId, roleId: role.id, assignedByUserId, revokedAt: null },
    create: { id: idValue, userId, roleId: role.id, assignedByUserId }
  });
}

async function seedComplaints() {
  const citizen = demoUsers[0];
  const operator = demoUsers[1];
  const supervisor = demoUsers[2];
  const fraudTypeIds = fraudTypeSeeds.map((fraudType) => fraudType.id);

  for (let index = 1; index <= 80; index += 1) {
    const status = statuses[(index - 1) % statuses.length];
    const createdAt = daysAgo(index % 45);
    const complaintId = id("5000", index);
    const assignedEmployeeId = status === ComplaintStatus.NEW || status === ComplaintStatus.UNDER_REVIEW ? null : operator.profileId;
    const regionId = getDemoRegionId(index);
    const fraudTypeId = fraudTypeIds[(index - 1) % fraudTypeIds.length];
    const incidentAt = daysAgo((index % 50) + 1);
    const resolvedAt = [ComplaintStatus.RESOLVED, ComplaintStatus.REJECTED, ComplaintStatus.DUPLICATE].includes(status) ? daysAgo((index % 20) + 1) : null;

    await prisma.complaint.upsert({
      where: { id: complaintId },
      update: {
        complaintNumber: `SB-2026-${String(index).padStart(5, "0")}`,
        citizenUserId: citizen.id,
        regionId,
        fraudTypeId,
        title: titles[(index - 1) % titles.length],
        description: `Демо-жалоба #${index}. Гражданин сообщил о подозрительной схеме: ${titles[(index - 1) % titles.length].toLowerCase()}. Данные синтетические и предназначены только для проверки MVP.`,
        incidentAt,
        damageAmount: new Prisma.Decimal(15000 + index * 13750),
        currentStatus: status,
        currentAssigneeEmployeeId: assignedEmployeeId,
        submissionSource: RequestSource.PUBLIC_WEB,
        submittedAt: createdAt,
        lastStatusChangedAt: daysAgo(index % 30),
        resolvedAt,
        metadata: { demo: true, priority: index % 5 === 0 ? "high" : "normal" }
      },
      create: {
        id: complaintId,
        complaintNumber: `SB-2026-${String(index).padStart(5, "0")}`,
        citizenUserId: citizen.id,
        regionId,
        fraudTypeId,
        title: titles[(index - 1) % titles.length],
        description: `Демо-жалоба #${index}. Гражданин сообщил о подозрительной схеме: ${titles[(index - 1) % titles.length].toLowerCase()}. Данные синтетические и предназначены только для проверки MVP.`,
        incidentAt,
        damageAmount: new Prisma.Decimal(15000 + index * 13750),
        currentStatus: status,
        currentAssigneeEmployeeId: assignedEmployeeId,
        submissionSource: RequestSource.PUBLIC_WEB,
        submittedAt: createdAt,
        lastStatusChangedAt: daysAgo(index % 30),
        resolvedAt,
        metadata: { demo: true, priority: index % 5 === 0 ? "high" : "normal" },
        createdAt
      }
    });

    await seedComplaintContacts(index, complaintId);
    await seedComplaintHistory(index, complaintId, status, operator.id, supervisor.id);
    await seedComplaintComments(index, complaintId, operator.id, supervisor.id);
    await seedComplaintNotification(index, complaintId, citizen.id, status);
  }
}

function getDemoRegionId(index: number) {
  if (index <= 12) return regionSeeds[1].id; // Алматы
  if (index <= 22) return regionSeeds[0].id; // Астана
  if (index <= 30) return regionSeeds[2].id; // Шымкент
  return regionSeeds[3 + ((index - 31) % 17)].id;
}

async function seedComplaintContacts(index: number, complaintId: string) {
  for (let contactIndex = 0; contactIndex < contactTypes.length; contactIndex += 1) {
    const type = contactTypes[contactIndex];
    const repeatedBucket = ((index - 1) % 12) + 1;
    const valueByType: Record<ComplaintContactType, string> = {
      [ComplaintContactType.PHONE]: `+7701999${String(repeatedBucket).padStart(4, "0")}`,
      [ComplaintContactType.URL]: `https://demo-risk-${repeatedBucket}.example.kz/login`,
      [ComplaintContactType.EMAIL]: `support-${repeatedBucket}@demo-risk.example`,
      [ComplaintContactType.CARD]: `4400 0000 0000 ${String(1000 + repeatedBucket).padStart(4, "0")}`,
      [ComplaintContactType.IBAN]: `KZ${String(10 + repeatedBucket).padStart(2, "0")}DEMO000000000${String(repeatedBucket).padStart(2, "0")}`
    };

    await prisma.complaintContact.upsert({
      where: { id: id("5100", index * 10 + contactIndex) },
      update: {
        complaintId,
        contactType: type,
        rawValue: valueByType[type],
        normalizedValue: normalize(type, valueByType[type]),
        label: `Demo ${type}`,
        isPrimary: contactIndex === 0,
        metadata: { demo: true }
      },
      create: {
        id: id("5100", index * 10 + contactIndex),
        complaintId,
        contactType: type,
        rawValue: valueByType[type],
        normalizedValue: normalize(type, valueByType[type]),
        label: `Demo ${type}`,
        isPrimary: contactIndex === 0,
        metadata: { demo: true }
      }
    });
  }
}

async function seedComplaintHistory(index: number, complaintId: string, finalStatus: ComplaintStatus, operatorUserId: string, supervisorUserId: string) {
  const chain = [ComplaintStatus.NEW];
  if (finalStatus !== ComplaintStatus.NEW) chain.push(ComplaintStatus.UNDER_REVIEW);
  if (![ComplaintStatus.NEW, ComplaintStatus.UNDER_REVIEW].includes(finalStatus)) chain.push(finalStatus);

  for (let step = 0; step < chain.length; step += 1) {
    await prisma.complaintStatusHistory.upsert({
      where: { id: id("5200", index * 10 + step) },
      update: {
        complaintId,
        fromStatus: step === 0 ? null : chain[step - 1],
        toStatus: chain[step],
        reasonCode: step === 0 ? "DEMO_CREATED" : "DEMO_STATUS_FLOW",
        reasonText: step === 0 ? "Жалоба зарегистрирована в demo mode." : `Статус изменен на ${chain[step]} для демонстрации dashboard.`,
        changedByUserId: step === 0 ? null : step % 2 === 0 ? supervisorUserId : operatorUserId,
        createdAt: daysAgo(22 - index - step)
      },
      create: {
        id: id("5200", index * 10 + step),
        complaintId,
        fromStatus: step === 0 ? null : chain[step - 1],
        toStatus: chain[step],
        reasonCode: step === 0 ? "DEMO_CREATED" : "DEMO_STATUS_FLOW",
        reasonText: step === 0 ? "Жалоба зарегистрирована в demo mode." : `Статус изменен на ${chain[step]} для демонстрации dashboard.`,
        changedByUserId: step === 0 ? null : step % 2 === 0 ? supervisorUserId : operatorUserId,
        createdAt: daysAgo(22 - index - step)
      }
    });
  }
}

async function seedComplaintComments(index: number, complaintId: string, operatorUserId: string, supervisorUserId: string) {
  const comments = [
    { authorUserId: operatorUserId, text: "Проверены первичные контакты, требуется сверка по blacklist.", visibility: CommentVisibility.INTERNAL },
    { authorUserId: supervisorUserId, text: "Для demo: обратить внимание на сумму ущерба и повторяемость контактов.", visibility: CommentVisibility.INTERNAL },
    { authorUserId: null, text: "Системный комментарий: обращение включено в demo dataset.", visibility: CommentVisibility.SYSTEM }
  ] as const;

  for (let commentIndex = 0; commentIndex < comments.length; commentIndex += 1) {
    const comment = comments[commentIndex];
    await prisma.complaintComment.upsert({
      where: { id: id("5300", index * 10 + commentIndex) },
      update: {
        complaintId,
        authorUserId: comment.authorUserId,
        visibility: comment.visibility,
        commentText: comment.text,
        isSystemGenerated: comment.visibility === CommentVisibility.SYSTEM,
        deletedAt: null
      },
      create: {
        id: id("5300", index * 10 + commentIndex),
        complaintId,
        authorUserId: comment.authorUserId,
        visibility: comment.visibility,
        commentText: comment.text,
        isSystemGenerated: comment.visibility === CommentVisibility.SYSTEM
      }
    });
  }
}

async function seedComplaintNotification(index: number, complaintId: string, citizenUserId: string, status: ComplaintStatus) {
  await prisma.notification.upsert({
    where: { id: id("5400", index) },
    update: {
      userId: citizenUserId,
      channel: NotificationChannel.IN_APP,
      notificationType: status === ComplaintStatus.NEED_INFO ? NotificationType.NEED_INFO_REQUESTED : NotificationType.COMPLAINT_STATUS_CHANGED,
      subject: `Demo: статус обращения SB-2026-${String(index).padStart(5, "0")}`,
      body: `Статус demo-обращения изменен на ${status}.`,
      payload: { demo: true, complaintId, status },
      status: index % 3 === 0 ? NotificationStatus.READ : NotificationStatus.DELIVERED,
      sentAt: daysAgo(10 - (index % 5)),
      deliveredAt: daysAgo(10 - (index % 5)),
      readAt: index % 3 === 0 ? daysAgo(9 - (index % 5)) : null,
      relatedEntityType: "complaint",
      relatedEntityId: complaintId
    },
    create: {
      id: id("5400", index),
      userId: citizenUserId,
      channel: NotificationChannel.IN_APP,
      notificationType: status === ComplaintStatus.NEED_INFO ? NotificationType.NEED_INFO_REQUESTED : NotificationType.COMPLAINT_STATUS_CHANGED,
      subject: `Demo: статус обращения SB-2026-${String(index).padStart(5, "0")}`,
      body: `Статус demo-обращения изменен на ${status}.`,
      payload: { demo: true, complaintId, status },
      status: index % 3 === 0 ? NotificationStatus.READ : NotificationStatus.DELIVERED,
      sentAt: daysAgo(10 - (index % 5)),
      deliveredAt: daysAgo(10 - (index % 5)),
      readAt: index % 3 === 0 ? daysAgo(9 - (index % 5)) : null,
      relatedEntityType: "complaint",
      relatedEntityId: complaintId
    }
  });
}

async function seedBlacklistAndChecks() {
  const citizen = demoUsers[0];
  for (let index = 1; index <= 10; index += 1) {
    const type = contactTypes[(index - 1) % contactTypes.length];
    const repeatedBucket = ((index - 1) % 10) + 1;
    const rawValue = type === ComplaintContactType.PHONE ? `+7701999${String(repeatedBucket).padStart(4, "0")}` : type === ComplaintContactType.URL ? `https://demo-risk-${repeatedBucket}.example.kz/login` : type === ComplaintContactType.EMAIL ? `support-${repeatedBucket}@demo-risk.example` : type === ComplaintContactType.CARD ? `4400 0000 0000 ${String(1000 + repeatedBucket).padStart(4, "0")}` : `KZ${String(10 + repeatedBucket).padStart(2, "0")}DEMO000000000${String(repeatedBucket).padStart(2, "0")}`;
    const normalizedValue = normalize(type, rawValue);

    await prisma.blacklistEntry.upsert({
      where: { id: id("5500", index) },
      update: {
        entryType: type,
        rawValue,
        normalizedValue,
        fraudTypeId: fraudTypeSeeds[(index - 1) % fraudTypeSeeds.length].id,
        regionId: regionSeeds[(index - 1) % regionSeeds.length].id,
        sourceComplaintId: id("5000", index),
        sourceType: index % 2 === 0 ? BlacklistSource.MANUAL : BlacklistSource.COMPLAINT,
        notes: "Demo blacklist entry. Synthetic data only.",
        riskScore: index % 3 === 0 ? 95 : 70,
        isActive: true,
        lastSeenAt: daysAgo(index),
        deletedAt: null
      },
      create: {
        id: id("5500", index),
        entryType: type,
        rawValue,
        normalizedValue,
        fraudTypeId: fraudTypeSeeds[(index - 1) % fraudTypeSeeds.length].id,
        regionId: regionSeeds[(index - 1) % regionSeeds.length].id,
        sourceComplaintId: id("5000", index),
        sourceType: index % 2 === 0 ? BlacklistSource.MANUAL : BlacklistSource.COMPLAINT,
        notes: "Demo blacklist entry. Synthetic data only.",
        riskScore: index % 3 === 0 ? 95 : 70,
        isActive: true,
        lastSeenAt: daysAgo(index)
      }
    });

    await prisma.blacklistCheck.upsert({
      where: { id: id("5600", index) },
      update: {
        checkedByUserId: index % 2 === 0 ? citizen.id : null,
        checkType: type,
        inputValue: rawValue,
        normalizedValue,
        matchedBlacklistEntryId: id("5500", index),
        matchFound: true,
        matchCount: 1 + (index % 4),
        source: RequestSource.PUBLIC_WEB,
        responsePayload: { riskLevel: index % 3 === 0 ? RiskLevel.HIGH : RiskLevel.MEDIUM, demo: true }
      },
      create: {
        id: id("5600", index),
        checkedByUserId: index % 2 === 0 ? citizen.id : null,
        checkType: type,
        inputValue: rawValue,
        normalizedValue,
        matchedBlacklistEntryId: id("5500", index),
        matchFound: true,
        matchCount: 1 + (index % 4),
        source: RequestSource.PUBLIC_WEB,
        responsePayload: { riskLevel: index % 3 === 0 ? RiskLevel.HIGH : RiskLevel.MEDIUM, demo: true }
      }
    });
  }
}

async function seedNews() {
  const admin = demoUsers[3];
  const titlesRu = [
    "Новая схема мошенничества через WhatsApp",
    "Как распознать фишинговую ссылку",
    "АФМ заблокировало подозрительные счета",
    "Памятка по безопасности банковских карт",
    "Маркетплейсы: как не попасть на предоплату",
    "Инвестиционные пирамиды в социальных сетях",
    "Что делать, если сообщили код из SMS",
    "Киберполиция предупреждает о фальшивых вакансиях",
    "SaqBol.kz запустил demo карту обращений",
    "Пять правил цифровой гигиены"
  ];

  for (let index = 1; index <= 10; index += 1) {
    const titleRu = titlesRu[index - 1];
    const slug = `demo-news-${index}`;
    await prisma.news.upsert({
      where: { id: id("5700", index) },
      update: {
        slug,
        titleRu,
        titleKz: `${titleRu} KZ`,
        summaryRu: "Демонстрационная новость для проверки публичного раздела.",
        summaryKz: "Публичті бөлімді тексеруге арналған demo жаңалық.",
        contentRu: `Полный текст demo-новости #${index}. Все данные синтетические.`,
        contentKz: `Demo жаңалық #${index}. Барлық деректер синтетикалық.`,
        regionId: regionSeeds[(index - 1) % regionSeeds.length].id,
        status: index <= 8 ? NewsStatus.PUBLISHED : NewsStatus.DRAFT,
        publishedAt: index <= 8 ? daysAgo(index) : null,
        authorUserId: admin.id,
        deletedAt: null
      },
      create: {
        id: id("5700", index),
        slug,
        titleRu,
        titleKz: `${titleRu} KZ`,
        summaryRu: "Демонстрационная новость для проверки публичного раздела.",
        summaryKz: "Публичті бөлімді тексеруге арналған demo жаңалық.",
        contentRu: `Полный текст demo-новости #${index}. Все данные синтетические.`,
        contentKz: `Demo жаңалық #${index}. Барлық деректер синтетикалық.`,
        regionId: regionSeeds[(index - 1) % regionSeeds.length].id,
        status: index <= 8 ? NewsStatus.PUBLISHED : NewsStatus.DRAFT,
        publishedAt: index <= 8 ? daysAgo(index) : null,
        authorUserId: admin.id
      }
    });
  }
}

async function seedAuditAndExports() {
  const admin = demoUsers[3];
  const operator = demoUsers[1];
  const actions = [
    AuditAction.USER_LOGGED_IN,
    AuditAction.COMPLAINT_CREATED,
    AuditAction.COMPLAINT_STATUS_CHANGED,
    AuditAction.COMPLAINT_ASSIGNED,
    AuditAction.COMMENT_CREATED,
    AuditAction.BLACKLIST_CHECKED,
    AuditAction.NEWS_PUBLISHED,
    AuditAction.EXPORT_COMPLETED,
    AuditAction.AI_REQUESTED,
    AuditAction.SETTING_UPDATED
  ];

  for (let index = 1; index <= 20; index += 1) {
    await prisma.auditLog.upsert({
      where: { id: id("5800", index) },
      update: {
        actorUserId: index % 2 === 0 ? admin.id : operator.id,
        actionType: actions[(index - 1) % actions.length],
        entityType: index % 3 === 0 ? "complaint" : "demo",
        entityId: index <= 20 ? id("5000", ((index - 1) % 20) + 1) : null,
        requestId: `demo-request-${index}`,
        ipAddress: "127.0.0.1",
        userAgent: "SaqBol Demo Seed",
        httpMethod: index % 2 === 0 ? "POST" : "GET",
        requestPath: `/demo/${index}`,
        responseStatusCode: 200,
        metadata: { demo: true, dashboardFriendly: true }
      },
      create: {
        id: id("5800", index),
        actorUserId: index % 2 === 0 ? admin.id : operator.id,
        actionType: actions[(index - 1) % actions.length],
        entityType: index % 3 === 0 ? "complaint" : "demo",
        entityId: id("5000", ((index - 1) % 20) + 1),
        requestId: `demo-request-${index}`,
        ipAddress: "127.0.0.1",
        userAgent: "SaqBol Demo Seed",
        httpMethod: index % 2 === 0 ? "POST" : "GET",
        requestPath: `/demo/${index}`,
        responseStatusCode: 200,
        metadata: { demo: true, dashboardFriendly: true },
        createdAt: daysAgo(index)
      }
    });
  }

  await prisma.exportJob.upsert({
    where: { id: "59000000-0000-0000-0000-000000000001" },
    update: {
      requestedByUserId: operator.id,
      jobType: ExportJobType.COMPLAINTS_CSV,
      jobStatus: ExportJobStatus.COMPLETED,
      filters: { demo: true },
      fileName: "demo-complaints.csv",
      storageBucket: "local",
      storageObjectKey: "demo-complaints.csv",
      rowCount: 20,
      startedAt: daysAgo(2),
      completedAt: daysAgo(2),
      expiresAt: daysAgo(-30)
    },
    create: {
      id: "59000000-0000-0000-0000-000000000001",
      requestedByUserId: operator.id,
      jobType: ExportJobType.COMPLAINTS_CSV,
      jobStatus: ExportJobStatus.COMPLETED,
      filters: { demo: true },
      fileName: "demo-complaints.csv",
      storageBucket: "local",
      storageObjectKey: "demo-complaints.csv",
      rowCount: 20,
      startedAt: daysAgo(2),
      completedAt: daysAgo(2),
      expiresAt: daysAgo(-30)
    }
  });
}

async function main() {
  await seedReferenceData();
  await seedLegacyUsers();
  await seedDemoUsers();
  await seedComplaints();
  await seedBlacklistAndChecks();
  await seedNews();
  await seedAuditAndExports();
  console.log("SaqBol demo seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("SaqBol demo seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
