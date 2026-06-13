import "server-only";
import { cookies } from "next/headers";
import { MarkalaApiClient } from "@markala/api-client";
import { verifySession, SESSION_COOKIE, type AdminSession } from "./admin-session";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Geçerli admin oturumunu cookie'den çöz (RSC/route handler). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token, secret);
}

/**
 * Per-request typed API client. accessToken cookie'den okunur.
 * Token tazeliği middleware tarafından garanti edilir (proaktif refresh).
 */
export async function getAdminApi(): Promise<MarkalaApiClient> {
  const session = await getAdminSession();
  return new MarkalaApiClient({
    baseUrl: API_URL,
    getToken: () => session?.accessToken,
  });
}
