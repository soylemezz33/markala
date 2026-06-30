"use client";

import { createMarkalaClient, type ApiError, type BannerDto } from "@markala/api-client";
import { useAuthStore, refreshOnce } from "./auth-store";

/** Banner DTO ve konum tipi — banner bileşenleri için yeniden dışa aktarılır. */
export type Banner = BannerDto;
export type BannerLocation = BannerDto["location"];

/**
 * Storefront paylaşımlı API client — authlı çağrılar için (siparişlerim, faturalar vb.).
 * accessToken auth-store'dan (bellek) okunur; auth-store ile aynı baseUrl mantığı.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//api.${window.location.host.replace(/^www\./, "")}`
    : "http://localhost:4000");

export const apiClient = createMarkalaClient({
  baseUrl: API_BASE_URL,
  getToken: () => useAuthStore.getState().accessToken,
});

/** Authlı çağrı 401 dönerse bir kez refresh dene, token'ı güncelle, çağrıyı tekrarla. */
export async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if ((e as ApiError)?.status === 401) {
      const token = await refreshOnce();
      if (token) return await fn();
    }
    throw e;
  }
}
