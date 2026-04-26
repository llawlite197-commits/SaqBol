"use client";

import type { StaffSession, StaffUser } from "../types";

const accessTokenKey = "saqbol.workspace.accessToken";
const refreshTokenKey = "saqbol.workspace.refreshToken";
const userKey = "saqbol.workspace.user";

export function saveStaffSession(session: StaffSession) {
  localStorage.setItem(accessTokenKey, session.accessToken);

  if (session.refreshToken) {
    localStorage.setItem(refreshTokenKey, session.refreshToken);
  }

  localStorage.setItem(userKey, JSON.stringify(session.user));
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(accessTokenKey);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(refreshTokenKey);
}

export function getStaffUser(): StaffUser | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(userKey);
  return raw ? (JSON.parse(raw) as StaffUser) : null;
}

export function clearStaffSession() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
  localStorage.removeItem(userKey);
}

export function isStaffAuthenticated() {
  return Boolean(getAccessToken());
}