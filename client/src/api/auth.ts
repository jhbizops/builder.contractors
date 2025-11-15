import { apiRequest } from "@/lib/queryClient";
import { mapUser, singleUserResponseSchema } from "./users";
import type { User } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  role: User["role"];
  country?: string;
  region?: string;
  locale?: string;
  currency?: string;
  languages?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/register", payload);
  const json = await res.json();
  const { user } = singleUserResponseSchema.parse(json);
  return mapUser(user);
}

export async function loginUser(payload: LoginPayload): Promise<User> {
  const res = await apiRequest("POST", "/api/auth/login", payload);
  const json = await res.json();
  const { user } = singleUserResponseSchema.parse(json);
  return mapUser(user);
}

export async function logoutUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });

  if (res.status === 401) {
    return null;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const json = await res.json();
  const { user } = singleUserResponseSchema.parse(json);
  return mapUser(user);
}
