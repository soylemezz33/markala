"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createMarkalaClient, type ApiError } from "@markala/api-client";
import type { User } from "@markala/types";

/**
 * GERÇEK auth store — NestJS API'ye bağlı (argon2 + JWT + refresh rotation).
 *
 * Güvenlik tasarımı:
 * - accessToken (15dk) yalnız BELLEKTE tutulur — localStorage'a YAZILMAZ (XSS sızıntısı yüzeyi).
 * - refresh token httpOnly cookie (mk_refresh) — JS göremez; tarayıcı credentials:include ile taşır.
 * - Sayfa yenilemede: persist'ten `user` anında geri gelir (UX flicker yok) + bootstrap()
 *   refresh cookie ile yeni access token alır; cookie geçersizse oturum kapatılır.
 * - 401 → tek seferlik otomatik refresh + retry (withRefresh).
 */

// baseUrl'i BURADA (apps/web app kodu) okuyoruz — Next.js process.env.NEXT_PUBLIC_API_URL'i
// burada kesin inline eder (api-client paketi içindeki erişim her zaman inline olmuyor).
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined" ? `${window.location.protocol}//api.${window.location.host.replace(/^www\./, "")}` : "http://localhost:4000");

const client = createMarkalaClient({
  baseUrl: API_BASE_URL,
  getToken: () => useAuthStore.getState().accessToken,
});

/** Authlı bir çağrı 401 dönerse bir kez refresh dene, token'ı güncelle, çağrıyı tekrarla. */
async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if ((e as ApiError)?.status === 401) {
      const refreshed = await client.auth.refresh().catch(() => null);
      if (refreshed) {
        useAuthStore.setState({ accessToken: refreshed.accessToken });
        return await fn();
      }
    }
    throw e;
  }
}

interface AuthState {
  user: User | null;
  /** Yalnız bellekte — persist edilmez. */
  accessToken: string | null;
  isLoading: boolean;
  /** İlk açılışta bootstrap (refresh) tamamlanana kadar true. */
  isBootstrapping: boolean;

  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    /** KVKK pazarlama açık rızası (opt-in). */
    marketingConsent?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<User>) => Promise<{ ok: boolean; error?: string }>;
  /** App açılışında bir kez çağrılır (AuthBootstrap). */
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isBootstrapping: true,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { accessToken } = await client.auth.login({ email, password });
          set({ accessToken });
          const user = await client.auth.me();
          set({ user, isLoading: false });
          return { ok: true };
        } catch (e) {
          set({ isLoading: false, accessToken: null });
          return { ok: false, error: (e as ApiError)?.message ?? "Giriş başarısız. Lütfen tekrar deneyin." };
        }
      },

      register: async ({ email, password, fullName, phone, marketingConsent }) => {
        set({ isLoading: true });
        try {
          const { accessToken } = await client.auth.register({ email, password, fullName, phone, marketingConsent });
          set({ accessToken });
          const user = await client.auth.me();
          set({ user, isLoading: false });
          return { ok: true };
        } catch (e) {
          set({ isLoading: false, accessToken: null });
          return { ok: false, error: (e as ApiError)?.message ?? "Kayıt başarısız. Lütfen tekrar deneyin." };
        }
      },

      logout: async () => {
        try {
          await client.auth.logout();
        } catch {
          // refresh cookie zaten geçersizse sorun değil — yerel state'i temizle
        }
        set({ user: null, accessToken: null });
      },

      updateProfile: async (patch) => {
        const { user } = get();
        if (!user) return { ok: false, error: "Oturum bulunamadı." };
        const prev = user;
        set({ user: { ...user, ...patch } }); // optimistic
        try {
          const updated = await withRefresh(() => client.users.updateProfile(patch));
          set({ user: updated });
          return { ok: true };
        } catch (e) {
          set({ user: prev }); // başarısızsa optimistic değişikliği geri al — yanlış "kaydedildi" gösterme
          return { ok: false, error: (e as ApiError)?.message ?? "Profil güncellenemedi." };
        }
      },

      bootstrap: async () => {
        try {
          const { accessToken } = await client.auth.refresh();
          set({ accessToken });
          const user = await client.auth.me();
          set({ user, isBootstrapping: false });
        } catch {
          set({ user: null, accessToken: null, isBootstrapping: false });
        }
      },
    }),
    {
      name: "markala-auth",
      // accessToken ASLA persist edilmez — yalnız user (UX için).
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
