import { clearSession, getAccessToken, getRefreshToken, saveSession } from "./auth";
import type {
  AuthSession,
  AiChatResponse,
  CheckResult,
  Complaint,
  FraudType,
  MapStatsResponse,
  NewsItem,
  NotificationItem,
  Region
} from "../types";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("ngrok-skip-browser-warning", "true");

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false && !retried) {
      const refreshed = await refreshSession();
      if (refreshed) return request<T>(path, options, true);
    }

    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String(payload.message)
        : "Ошибка запроса";
    throw new Error(message);
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const session = await request<AuthSession>(
      "/auth/refresh",
      {
        method: "POST",
        auth: false,
        body: JSON.stringify({ refreshToken })
      },
      true
    );
    saveSession(session);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

export const api = {
  baseUrl: apiBaseUrl,
  login: async (login: string, password: string) => {
    const session = await request<AuthSession>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ login, password })
    });
    saveSession(session);
    return session;
  },
  register: (body: Record<string, unknown>) =>
    request<{ userId: string; role: string }>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    }),
  me: () => request("/auth/me"),
  refresh: refreshSession,
  logout: () => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    return fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({ refreshToken })
    })
      .catch(() => null)
      .finally(() => clearSession());
  },
  regions: () => request<Region[]>("/dictionaries/regions", { auth: false }),
  fraudTypes: () => request<FraudType[]>("/dictionaries/fraud-types", { auth: false }),
  publicStats: () => request<Record<string, unknown>>("/stats/public", { auth: false }),
  mapStats: () => request<MapStatsResponse>("/stats/map", { auth: false }),
  checkScammer: (body: { type: string; value: string }) =>
    request<CheckResult>("/check", {
      method: "POST",
      auth: false,
      body: JSON.stringify(body)
    }),
  createComplaint: async (formData: FormData) => {
    return request<any>("/complaints/public", {
      method: "POST",
      auth: false,
      body: formData
    });
  },
  myComplaints: () => request<{ items: Complaint[] }>("/complaints/my"),
  complaintById: (id: string) => request<Complaint>(`/complaints/my/${id}`),
  uploadComplaintFile: (complaintId: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return request(`/complaints/${complaintId}/files`, {
      method: "POST",
      body
    });
  },
  news: () => request<{ items: NewsItem[] }>("/news", { auth: false }),
  newsBySlug: (slug: string) => request<NewsItem>(`/news/${slug}`, { auth: false }),
  notifications: () => request<{ items: NotificationItem[] }>("/notifications/my"),
  readNotification: (id: string) => request(`/notifications/${id}/read`, { method: "PATCH" }),
  aiChat: async (message: string) => {
    try {
      return await request<AiChatResponse>("/ai/chat", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ message })
      });
    } catch {
      return {
        answer: "Қазір жауап беру мүмкін емес",
        confidence: "LOW",
        source: "MOCK",
        cannotAnswer: true
      };
    }
  }
};
