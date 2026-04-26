"use client";

import type { AuthSession, AuthUser } from "../types";

const accessTokenKey = "saqbol.accessToken";
const refreshTokenKey = "saqbol.refreshToken";
const userKey = "saqbol.user";

export function saveSession(session: AuthSession) {
  localStorage.setItem(accessTokenKey, session.accessToken);
  if (session.refreshToken) {
    localStorage.setItem(refreshTokenKey, session.refreshToken);
  }
  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(refreshTokenKey);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem(userKey);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearSession() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
  localStorage.removeItem(userKey);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}
