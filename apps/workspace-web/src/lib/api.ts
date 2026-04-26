import { clearStaffSession, getAccessToken, getRefreshToken, saveStaffSession } from "./auth";
import type {
  BlacklistEntry,
  Complaint,
  ComplaintStatus,
  DictionaryItem,
  ExportJob,
  NewsItem,
  Paginated,
  StaffSession
} from "../types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:4000/api/v1";

type RequestOptions = RequestInit & { auth?: boolean };

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false && !retried) {
      const refreshed = await refreshStaffSession();
      if (refreshed) return request<T>(path, options, true);
    }

    const message = typeof payload === "object" && payload && "message" in payload ? String(payload.message) : "Ошибка запроса";
    throw new Error(message);
  }

  if (typeof payload === "object" && payload && "data" in payload) return payload.data as T;
  return payload as T;
}

async function refreshStaffSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const session = await request<StaffSession>(
      "/staff/auth/refresh",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ refreshToken })
      },
      true
    );
    saveStaffSession(session);
    return true;
  } catch {
    clearStaffSession();
    return false;
  }
}

function toQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const api = {
  staffLogin: (login: string, password: string) =>
    request<StaffSession>("/staff/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, password })
    }),
  verify2fa: async (sessionId: string, code: string) => {
    const session = await request<StaffSession>("/staff/auth/2fa/verify", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ sessionId, code })
    });
    saveStaffSession(session);
    return session;
  },
  me: () => request("/staff/auth/me"),
  refresh: refreshStaffSession,
  logout: () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    return fetch(`${apiBaseUrl}/staff/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ refreshToken })
    })
      .catch(() => null)
      .finally(() => clearStaffSession());
  },
  dashboardStats: () => request<Record<string, unknown>>("/admin/stats/dashboard"),
  complaints: (filters: Record<string, string | undefined>) =>
    request<Paginated<Complaint>>(`/admin/complaints${toQuery(filters)}`),
  complaint: (id: string) => request<Complaint>(`/admin/complaints/${id}`),
  updateStatus: (id: string, status: ComplaintStatus, reasonText?: string) =>
    request(`/admin/complaints/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, reasonText })
    }),
  assignComplaint: (id: string, assigneeEmployeeId: string) =>
    request(`/admin/complaints/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assigneeEmployeeId })
    }),
  addComment: (id: string, text: string) =>
    request(`/admin/complaints/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text, visibility: "INTERNAL" })
    }),
  complaintHistory: (id: string) => request(`/admin/complaints/${id}/history`),
  exportComplaints: (format: "CSV" | "XLSX") =>
    request<ExportJob>("/admin/export/complaints", {
      method: "POST",
      body: JSON.stringify({ format })
    }),
  exportJobs: () => request<Paginated<ExportJob>>("/admin/export/jobs"),
  adminNews: () => request<Paginated<NewsItem>>("/admin/news"),
  createNews: (body: Record<string, unknown>) =>
    request("/admin/news", { method: "POST", body: JSON.stringify(body) }),
  publishNews: (id: string) => request(`/admin/news/${id}/publish`, { method: "PATCH", body: JSON.stringify({}) }),
  regions: () => request<DictionaryItem[]>("/dictionaries/regions", { auth: false }),
  fraudTypes: () => request<DictionaryItem[]>("/dictionaries/fraud-types", { auth: false }),
  createRegion: (body: Record<string, unknown>) => request("/admin/dictionaries/regions", { method: "POST", body: JSON.stringify(body) }),
  createFraudType: (body: Record<string, unknown>) => request("/admin/dictionaries/fraud-types", { method: "POST", body: JSON.stringify(body) }),
  blacklist: () => request<Paginated<BlacklistEntry>>("/admin/blacklist"),
  createBlacklist: (body: Record<string, unknown>) => request("/admin/blacklist", { method: "POST", body: JSON.stringify(body) }),
  updateBlacklist: (id: string, body: Record<string, unknown>) => request(`/admin/blacklist/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBlacklist: (id: string) => request(`/admin/blacklist/${id}`, { method: "DELETE" }),
  auditLogs: () => request<Paginated<Record<string, unknown>>>("/admin/audit-logs"),
  users: (filters: Record<string, string | undefined> = {}) => request<Paginated<Record<string, unknown>>>(`/admin/users${toQuery(filters)}`),
  roles: () => request<Paginated<Record<string, unknown>>>("/admin/roles")
};
