"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@markala/types";

/**
 * MOCK auth store — FAZ 1-2 için. Gerçek auth FAZ 3'te NextAuth + NestJS ile.
 * Şu an credentials sadece "varsa giriş yap" mantığı; şifre kontrolü yok.
 */

interface AuthState {
  user: User | null;
  isLoading: boolean;

  login: (email: string, _password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    /** KVKK: pazarlama amaçlı veri işleme açık rızası (opt-in). false ise sadece zorunlu işlemler. */
    marketingConsent?: boolean;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,

      login: async (email) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 600)); // mock latency
        if (!email.includes("@")) {
          set({ isLoading: false });
          return { ok: false, error: "Lütfen geçerli bir e-posta adresi girin." };
        }
        const user: User = {
          id: `u_${Date.now().toString(36)}`,
          email,
          fullName: email.split("@")[0]?.replace(/[._]/g, " ") ?? "Misafir",
          accountType: "individual",
        };
        set({ user, isLoading: false });
        return { ok: true };
      },

      register: async ({ email, fullName, phone, marketingConsent }) => {
        set({ isLoading: true });
        await new Promise((r) => setTimeout(r, 800));
        if (!email.includes("@") || fullName.length < 2) {
          set({ isLoading: false });
          return { ok: false, error: "Lütfen tüm alanları doğru doldurun." };
        }
        const user: User = {
          id: `u_${Date.now().toString(36)}`,
          email,
          fullName,
          phone,
          accountType: "individual",
        };
        // KVKK: pazarlama açık rızası ayrı bir kayıt (mock — FAZ 3'te backend'e taşınacak)
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(
              "markala-marketing-consent",
              JSON.stringify({
                email,
                granted: Boolean(marketingConsent),
                timestamp: Date.now(),
              }),
            );
          } catch {
            // localStorage erişimi reddedilirse sessizce devam et
          }
        }
        set({ user, isLoading: false });
        return { ok: true };
      },

      logout: () => set({ user: null }),

      updateProfile: (patch) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, ...patch } });
      },
    }),
    { name: "markala-auth", partialize: (s) => ({ user: s.user }) },
  ),
);
