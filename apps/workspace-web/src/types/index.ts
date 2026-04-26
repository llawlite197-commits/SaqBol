export type StaffRole = "OPERATOR" | "SUPERVISOR" | "ADMIN" | "CITIZEN";

export type StaffUser = {
  id: string;
  email: string | null;
  phone: string | null;
  roles: StaffRole[];
  accountType: "EMPLOYEE" | "CITIZEN";
  employeeProfile?: {
    id: string;
    position?: string | null;
    department?: string | null;
  } | null;
};

export type StaffSession = {
  accessToken: string;
  refreshToken?: string;
  user: StaffUser;
};

export type TwoFactorChallenge = {
  requiresTwoFactor: boolean;
  sessionId: string;
  method: string;
  expiresAt: string;
  mockCode?: string;
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
  region?: { id: string; nameRu: string };
  fraudType?: { id: string; nameRu: string };
  citizenUser?: { email?: string | null; phone?: string | null };
  currentAssigneeEmployee?: { id: string; user?: { email?: string | null } } | null;
  contacts?: Array<{ id: string; contactType: string; rawValue: string }>;
  comments?: Array<{ id: string; commentText: string; visibility: string; createdAt: string }>;
  statusHistory?: Array<{ id: string; fromStatus?: ComplaintStatus | null; toStatus: ComplaintStatus; createdAt: string; reasonText?: string | null }>;
};

export type Paginated<T> = {
  items: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type NewsItem = {
  id: string;
  slug: string;
  titleRu: string;
  summaryRu?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

export type DictionaryItem = {
  id: string;
  code: string;
  nameRu: string;
  isActive?: boolean;
};

export type BlacklistEntry = {
  id: string;
  entryType: string;
  rawValue: string;
  normalizedValue: string;
  isActive: boolean;
};

export type ExportJob = {
  id: string;
  jobType: string;
  jobStatus: string;
  fileName?: string | null;
  rowCount?: number | null;
  createdAt: string;
};
