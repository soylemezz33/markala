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

/** Kullanıcı admin/super_admin mi? (Tip role içermese de runtime değerini defansif okur.) */
function isAdminRole(user: unknown): boolean {
  const role = (user as { role?: string } | null | undefined)?.role;
  return role === "admin" || role === "super_admin";
}

/**
 * Bakım modu bypass çerezini yaz — admin storefront'a girince siteyi canlı gezebilsin.
 * Same-origin route handler rolü API ile YENİDEN doğrular (istemciye güvenmez); burada yalnız
 * gereksiz istek atmamak için kapı koyuyoruz. Çerez set/return'den ÖNCE await edilir (redirect race).
 */
async function syncMaintenanceBypass(token: string | null | undefined): Promise<void> {
  if (!token) return;
  try {
    await fetch("/api/maintenance/bypass", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // yazılamazsa kritik değil — admin /giris'ten tekrar deneyebilir
  }
}

/** Çıkışta bypass çerezini sil — paylaşılan cihazda oturum kapanınca bakım yine görünsün. */
async function clearMaintenanceBypass(): Promise<void> {
  try {
    await fetch("/api/maintenance/bypass", { method: "DELETE" });
  } catch {
    // sessiz geç
  }
}

/**
 * Refresh'i TEKLEŞTİR (single-flight). Eş zamanlı authed çağrılar 401 olunca HER BİRİ ayrı
 * refresh atarsa, backend refresh-token ROTATION'u ikinci (artık eski) token'ı "replay" görüp
 * kullanıcının TÜM refresh'lerini iptal eder → oturum/checkout çöker (refresh.replay_detected).
 * Bu yüzden aynı anda yalnız BİR refresh çalışır; bekleyen tüm çağrılar aynı sonucu paylaşır.
 * Başarıda accessToken'ı store'a yazar; başarısızlıkta null döner.
 */
let refreshInFlight: Promise<string | null> | null = null;
export function refreshOnce(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = client.auth
    .refresh()
    .then(({ accessToken }) => {
      useAuthStore.setState({ accessToken });
      return accessToken;
    })
    .catch(() => null)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** Authlı bir çağrı 401 dönerse single-flight refresh dene, token'ı güncelle, çağrıyı tekrarla. */
async function withRefresh<T>(fn: () => Promise<T>): Promise<T> {
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
  /**
   * Kritik authed POST'lardan (sipariş yazma gibi) ÖNCE access token'ı tazeler.
   * 15dk'lık access token checkout sırasında dolmuş olabilir; bayat token authed çağrıyı
   * 401'e düşürüp siparişi sessizce MİSAFİR yapar (→ kurumsal indirim + cari uygulanmaz).
   * Döner: kullanılabilir access token (tazelendiyse yeni, refresh olmadıysa eldeki) veya null.
   */
  ensureFreshToken: () => Promise<string | null>;
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
          // Admin ise: user'ı set ETMEDEN ÖNCE bypass çerezini yaz (redirect race'i önler).
          if (isAdminRole(user)) await syncMaintenanceBypass(accessToken);
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
        await clearMaintenanceBypass();
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
          const token = await refreshOnce();
          if (!token) throw new Error("refresh-failed");
          const user = await client.auth.me();
          // Girişli admin /giris'e gelince çerez user set edilmeden yazılsın ki yönlendirmede 503'e takılmasın.
          if (isAdminRole(user)) await syncMaintenanceBypass(token);
          set({ user, isBootstrapping: false });
        } catch {
          set({ user: null, accessToken: null, isBootstrapping: false });
        }
      },

      ensureFreshToken: async () => {
        if (!get().user) return null; // oturumsuz → tazelenecek bir şey yok
        // Single-flight refresh: checkout'taki paralel çağrılarla yarışıp oturumu DÜŞÜRMESİN.
        const token = await refreshOnce();
        // Refresh başarısızsa eldeki (muhtemelen bayat) token'la yine de dene; proxy 401'de
        // misafire düşer, sipariş kaybolmaz (yalnız kurumsal avantaj uygulanmaz).
        return token ?? get().accessToken;
      },
    }),
    {
      name: "markala-auth",
      // accessToken ASLA persist edilmez — yalnız user (UX için).
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
