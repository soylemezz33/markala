/**
 * Markala API client — frontend (apps/web, apps/admin) için type-safe REST wrapper.
 * Şu an statik tipler; FAZ 4'te Zod ile runtime validation eklenebilir.
 */

import type { Category, Product, Order, User, Address } from "@markala/types";

export interface ApiClientConfig {
  baseUrl: string;
  /** JWT access token — auth gerektiren endpointler için */
  getToken?: () => string | null | undefined;
  /** Hata yakalayıcı (örn. toast göster) */
  onError?: (error: ApiError) => void;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export interface AdminStats {
  revenue: { total: number; today: number };
  orders: { total: number; today: number; inProduction: number; byStatus: Record<string, number> };
  customers: { total: number };
  pending: { corporateApplications: number; reviews: number };
  recentOrders: Array<{
    orderNumber: string;
    customer: string;
    isCorporate: boolean;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }>;
}

export interface CorporateApplication {
  id: string;
  userId: string | null;
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  sector: string | null;
  annualVolume: string | null;
  contactName: string;
  contactRole: string | null;
  email: string;
  phone: string;
  address: string;
  notes: string | null;
  status: "none" | "pending" | "approved" | "rejected";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class MarkalaApiClient {
  constructor(private config: ApiClientConfig) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts: { auth?: boolean; query?: Record<string, string | number | boolean | undefined> } = {},
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl.replace(/\/$/, "")}/api${path}`);
    if (opts.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (opts.auth) {
      const token = this.config.getToken?.();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      let errBody: any = {};
      try {
        errBody = await res.json();
      } catch {}
      const error: ApiError = {
        status: res.status,
        message: errBody.message ?? res.statusText,
        code: errBody.code,
        details: errBody,
      };
      this.config.onError?.(error);
      throw error;
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // === Health ===
  health = () => this.request<{ status: string; checks: { db: string } }>("GET", "/health");

  // === Auth ===
  auth = {
    register: (data: {
      email: string;
      password: string;
      fullName: string;
      phone?: string;
      marketingConsent?: boolean;
    }) =>
      this.request<{ accessToken: string; user: User }>("POST", "/auth/register", data),
    login: (data: { email: string; password: string }) =>
      this.request<{ accessToken: string; user: User }>("POST", "/auth/login", data),
    /** Refresh cookie (mk_refresh, httpOnly) ile yeni access token + user. Body yok; credentials:include. */
    refresh: () =>
      this.request<{ accessToken: string; user: User }>("POST", "/auth/refresh"),
    logout: () => this.request<{ ok: boolean }>("POST", "/auth/logout"),
    me: () => this.request<User>("GET", "/auth/me", undefined, { auth: true }),
  };

  // === Categories ===
  categories = {
    list: (includeInactive = false) =>
      this.request<Category[]>("GET", "/categories", undefined, { query: { includeInactive } }),
    detail: (slug: string) =>
      this.request<Category & { products: Product[] }>("GET", `/categories/${slug}`),
    create: (data: Partial<Category>) =>
      this.request<Category>("POST", "/categories", data, { auth: true }),
    update: (id: string, data: Partial<Category>) =>
      this.request<Category>("PATCH", `/categories/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/categories/${id}`, undefined, { auth: true }),
  };

  // === Products ===
  products = {
    list: (opts: { category?: string; bestseller?: boolean; take?: number; skip?: number } = {}) =>
      this.request<Product[]>("GET", "/products", undefined, { query: opts }),
    detail: (slug: string) => this.request<Product>("GET", `/products/${slug}`),
    create: (data: Partial<Product>) =>
      this.request<Product>("POST", "/products", data, { auth: true }),
    update: (id: string, data: Partial<Product>) =>
      this.request<Product>("PATCH", `/products/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/products/${id}`, undefined, { auth: true }),
  };

  // === Orders ===
  orders = {
    create: (data: any) => this.request<Order>("POST", "/orders", data, { auth: true }),
    createGuest: (data: any) => this.request<Order>("POST", "/orders/guest", data),
    listMine: () => this.request<Order[]>("GET", "/orders/mine", undefined, { auth: true }),
    listAll: (opts: { status?: string; take?: number; skip?: number } = {}) =>
      this.request<Order[]>("GET", "/orders", undefined, { auth: true, query: opts }),
    detail: (id: string) =>
      this.request<Order>("GET", `/orders/${id}`, undefined, { auth: true }),
    updateStatus: (id: string, body: { status: string; trackingNumber?: string; trackingCarrier?: string }) =>
      this.request<Order>("PATCH", `/orders/${id}/status`, body, { auth: true }),
  };

  // === Admin (dashboard stats) ===
  admin = {
    stats: () => this.request<AdminStats>("GET", "/admin/stats", undefined, { auth: true }),
  };

  // === Kurumsal başvurular (admin) ===
  corporateApplications = {
    list: (status?: string) =>
      this.request<CorporateApplication[]>("GET", "/corporate-applications", undefined, {
        auth: true,
        query: { status },
      }),
    detail: (id: string) =>
      this.request<CorporateApplication>("GET", `/corporate-applications/${id}`, undefined, { auth: true }),
    review: (id: string, data: { status: "approved" | "rejected"; reviewNote?: string }) =>
      this.request<CorporateApplication>("PATCH", `/corporate-applications/${id}`, data, { auth: true }),
  };

  // === Users (kendim) ===
  users = {
    updateProfile: (data: Partial<User>) =>
      this.request<User>("PATCH", "/users/me", data, { auth: true }),
    listAddresses: () => this.request<Address[]>("GET", "/users/me/addresses", undefined, { auth: true }),
    createAddress: (data: Partial<Address>) =>
      this.request<Address>("POST", "/users/me/addresses", data, { auth: true }),
    updateAddress: (id: string, data: Partial<Address>) =>
      this.request<Address>("PATCH", `/users/me/addresses/${id}`, data, { auth: true }),
    deleteAddress: (id: string) =>
      this.request<void>("DELETE", `/users/me/addresses/${id}`, undefined, { auth: true }),
  };
}

/** Convenience: env'den otomatik kurulan client */
export function createMarkalaClient(opts?: Partial<ApiClientConfig>): MarkalaApiClient {
  return new MarkalaApiClient({
    // `||` kullan (`??` değil): NEXT_PUBLIC_API_URL boş string ise de fallback'e düşsün,
    // aksi halde new URL("") → "Failed to construct 'URL': Invalid URL" ile login/kayıt kırılır.
    baseUrl: opts?.baseUrl || (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000" : "http://localhost:4000"),
    getToken: opts?.getToken,
    onError: opts?.onError,
  });
}
