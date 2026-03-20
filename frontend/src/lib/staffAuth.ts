import { apiFetch, ApiError, AuthLoginRequest, AuthLoginResponse, MeResponse } from "@/lib/api";

const ACCESS_KEY = "infradesk_access";
const REFRESH_KEY = "infradesk_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthLoginResponse) {
  window.localStorage.setItem(ACCESS_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

export async function login(req: AuthLoginRequest): Promise<AuthLoginResponse> {
  return await apiFetch<AuthLoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function refreshAccessToken(refresh: string): Promise<string> {
  const res = await apiFetch<{ access: string }>("/auth/refresh/", {
    method: "POST",
    body: JSON.stringify({ refresh }),
  });
  return res.access;
}

export async function apiFetchStaff<T>(path: string, init?: RequestInit): Promise<T> {
  const access = getAccessToken();
  if (!access) throw new ApiError("Not authenticated", 401, null);
  try {
    return await apiFetch<T>(path, { ...init, token: access });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const refresh = getRefreshToken();
      if (!refresh) throw e;
      const newAccess = await refreshAccessToken(refresh);
      window.localStorage.setItem(ACCESS_KEY, newAccess);
      return await apiFetch<T>(path, { ...init, token: newAccess });
    }
    throw e;
  }
}

export async function getMe(): Promise<MeResponse> {
  return await apiFetchStaff<MeResponse>("/auth/me/");
}

