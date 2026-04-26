export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type UserRole = "CITIZEN" | "OPERATOR" | "SUPERVISOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  roles: UserRole[];
  accountType: "CITIZEN" | "EMPLOYEE";
  citizenProfile?: {
    firstName?: string;
    lastName?: string;
    patronymic?: string | null;
  } | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
  user: AuthUser;
};

export type Region = {
  id: string;
  code: string;
  nameRu: string;
  nameKz?: string | null;
};

export type FraudType = {
  id: string;
  code: string;
  nameRu: string;
  nameKz?: string | null;
  descriptionRu?: string | null;
};

export type ComplaintStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "NEED_INFO"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED"
  | "DUPLICATE";

export type Complaint = {
  id: string;
  complaintNumber: string;
  title?: string | null;
  description: string;
  currentStatus: ComplaintStatus;
  createdAt: string;
  incidentAt?: string | null;
  damageAmount?: string | number | null;
  fraudType?: FraudType;
  region?: Region;
  files?: ComplaintFile[];
  statusHistory?: ComplaintStatusHistory[];
};

export type ComplaintFile = {
  id: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
};

export type ComplaintStatusHistory = {
  id: string;
  fromStatus?: ComplaintStatus | null;
  toStatus: ComplaintStatus;
  reasonText?: string | null;
  createdAt: string;
};

export type NewsItem = {
  id: string;
  slug: string;
  titleRu: string;
  titleKz?: string | null;
  summaryRu?: string | null;
  summaryKz?: string | null;
  contentRu?: string;
  contentKz?: string | null;
  publishedAt?: string | null;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type CheckResult = {
  type: "PHONE" | "URL" | "EMAIL" | "CARD" | "IBAN";
  value: string;
  normalizedValue: string;
  riskLevel: RiskLevel;
  explanation: string;
  complaintMatches?: number;
};

export type AiChatResponse = {
  answer: string;
  confidence: "LOW" | "MEDIUM";
  source: "MOCK" | "RULE_BASED";
  cannotAnswer: boolean;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export type MapScammerContact = {
  type: "PHONE" | "URL" | "EMAIL" | "CARD" | "IBAN";
  value: string;
  riskLevel: RiskLevel;
  complaintsCount: number;
};

export type MapFraudTypeStat = {
  id: string;
  nameRu: string;
  nameKz?: string | null;
  count: number;
};

export type MapRegionStat = {
  id: string;
  code: string;
  nameRu: string;
  nameKz?: string | null;
  totalComplaints: number;
  totalDamageAmount: number;
  fraudTypes: MapFraudTypeStat[];
  scammerContacts: MapScammerContact[];
};

export type MapStatsResponse = {
  regions: MapRegionStat[];
  summary: {
    totalComplaints: number;
    totalRegions: number;
    topRegion: Pick<MapRegionStat, "id" | "code" | "nameRu" | "nameKz" | "totalComplaints"> | null;
    topFraudType: MapFraudTypeStat | null;
  };
};

export type NotificationItem = {
  id: string;
  subject?: string | null;
  body: string;
  status: string;
  createdAt: string;
};
