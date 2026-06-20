/**
 * Markala API client — frontend (apps/web, apps/admin) için type-safe REST wrapper.
 * Şu an statik tipler; FAZ 4'te Zod ile runtime validation eklenebilir.
 */

import type { Category, Product, Order, User, Address } from "@markala/types";

// Node/Next ortamında env okumak için minimal ambient bildirim (@types/node bağımlılığı eklemeden).
declare const process: { env: Record<string, string | undefined> };

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
    /** Şifre değiştir — currentPassword backend'de argon2.verify ile doğrulanır; hatalıysa 401. */
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      this.request<{ ok: boolean }>("PATCH", "/auth/password", data, { auth: true }),
    /** Şifre sıfırlama talebi — daima { ok:true } (enumeration koruması); kullanıcı varsa mail gider. */
    forgotPassword: (email: string) =>
      this.request<{ ok: boolean }>("POST", "/auth/forgot-password", { email }),
    /** Token ile yeni şifre belirle — geçersiz/süresi dolmuş token 400 döner. */
    resetPassword: (data: { token: string; newPassword: string }) =>
      this.request<{ ok: boolean }>("POST", "/auth/reset-password", data),
  };

  // === Analytics / Ziyaretçi Analizi & CRM ===
  analytics = {
    /** Storefront birinci-parti olay gönderimi (public, batch). JWT varsa userId backend'de eklenir. */
    collect: (events: AnalyticsCollectEvent[]) =>
      this.request<{ ok: boolean; accepted: number }>("POST", "/analytics/collect", { events }),
    /** Admin gösterge paneli — KPI/huni/top ürün/heatmap/CRM segment özetleri. */
    overview: (days = 30) =>
      this.request<AnalyticsOverviewDto>("GET", "/analytics/overview", undefined, { auth: true, query: { days } }),
    /** Bir segmentin müşteri listesi (win-back/kampanya için iletişim bilgili). */
    segment: (key: string) =>
      this.request<AnalyticsSegmentResultDto>("GET", `/analytics/segments/${key}`, undefined, { auth: true }),
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
    list: (opts: { category?: string; bestseller?: boolean; take?: number; skip?: number; q?: string } = {}) =>
      this.request<Product[]>("GET", "/products", undefined, { query: opts }),
    detail: (slug: string) => this.request<Product>("GET", `/products/${slug}`),
    create: (data: Partial<Product>) =>
      this.request<Product>("POST", "/products", data, { auth: true }),
    update: (id: string, data: Partial<Product>) =>
      this.request<Product>("PATCH", `/products/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/products/${id}`, undefined, { auth: true }),
    bulkPrice: (data: {
      scope: "all" | "category";
      categoryId?: string;
      op: "percent" | "fixed";
      direction: "increase" | "decrease";
      value: number;
      round?: string;
    }) => this.request<{ updated: number }>("POST", "/products/bulk-price", data, { auth: true }),
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

  // === Payments ===
  payments = {
    /** "Ödeme Yap" tekrar — giriş yapmış müşteri kendi beklemede siparişi için ödemeyi yeniden başlatır. */
    retry: (orderId: string) =>
      this.request<{ paymentPageUrl?: string }>("POST", "/payments/iyzico/retry", { orderId }, { auth: true }),
  };

  // === Admin (dashboard stats) ===
  admin = {
    stats: () => this.request<AdminStats>("GET", "/admin/stats", undefined, { auth: true }),
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
    getNotificationPrefs: () =>
      this.request<Record<string, { email?: boolean; sms?: boolean }> | null>(
        "GET",
        "/users/me/notification-prefs",
        undefined,
        { auth: true },
      ),
    updateNotificationPrefs: (prefs: Record<string, { email: boolean; sms: boolean }>) =>
      this.request<{ ok: boolean }>("PATCH", "/users/me/notification-prefs", prefs, { auth: true }),
  };

  // === Hero slides ===
  heroSlides = {
    list: (includeInactive = false) =>
      this.request<HeroSlideDto[]>("GET", "/hero-slides", undefined, { query: { includeInactive } }),
    create: (data: Partial<HeroSlideDto>) =>
      this.request<HeroSlideDto>("POST", "/hero-slides", data, { auth: true }),
    update: (id: string, data: Partial<HeroSlideDto>) =>
      this.request<HeroSlideDto>("PATCH", `/hero-slides/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/hero-slides/${id}`, undefined, { auth: true }),
  };

  // === Banners ===
  banners = {
    /** Storefront — aktif + tarih penceresi içindeki banner'lar (public). */
    listPublic: () => this.request<BannerDto[]>("GET", "/banners/public"),
    list: () => this.request<BannerDto[]>("GET", "/banners", undefined, { auth: true }),
    create: (data: Partial<BannerDto>) => this.request<BannerDto>("POST", "/banners", data, { auth: true }),
    update: (id: string, data: Partial<BannerDto>) => this.request<BannerDto>("PATCH", `/banners/${id}`, data, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/banners/${id}`, undefined, { auth: true }),
  };

  // === FAQs ===
  faqs = {
    list: (category?: string) =>
      this.request<FaqDto[]>("GET", "/faqs", undefined, { auth: true, query: { category } }),
    create: (data: Partial<FaqDto>) =>
      this.request<FaqDto>("POST", "/faqs", data, { auth: true }),
    update: (id: string, data: Partial<FaqDto>) =>
      this.request<FaqDto>("PATCH", `/faqs/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/faqs/${id}`, undefined, { auth: true }),
  };

  // === Coupons ===
  coupons = {
    list: () => this.request<CouponDto[]>("GET", "/coupons", undefined, { auth: true }),
    create: (data: Partial<CouponDto>) => this.request<CouponDto>("POST", "/coupons", data, { auth: true }),
    update: (id: string, data: Partial<CouponDto>) => this.request<CouponDto>("PATCH", `/coupons/${id}`, data, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/coupons/${id}`, undefined, { auth: true }),
  };

  // === Blog ===
  blog = {
    listPosts: () => this.request<BlogPostDto[]>("GET", "/blog/posts", undefined, { auth: true }),
    createPost: (data: Partial<BlogPostDto>) => this.request<BlogPostDto>("POST", "/blog/posts", data, { auth: true }),
    updatePost: (id: string, data: Partial<BlogPostDto>) => this.request<BlogPostDto>("PATCH", `/blog/posts/${id}`, data, { auth: true }),
    removePost: (id: string) => this.request<void>("DELETE", `/blog/posts/${id}`, undefined, { auth: true }),
    publishPost: (id: string) => this.request<BlogPostDto>("POST", `/blog/posts/${id}/publish`, undefined, { auth: true }),
    listCategories: () => this.request<BlogCategoryDto[]>("GET", "/blog/categories", undefined, { auth: true }),
    createCategory: (data: Partial<BlogCategoryDto>) => this.request<BlogCategoryDto>("POST", "/blog/categories", data, { auth: true }),
    // --- Public (storefront, auth yok): yalnız yayınlanmış içerik ---
    listPublic: () => this.request<BlogPostDto[]>("GET", "/blog/public/posts"),
    getPublic: (slug: string) => this.request<BlogPostDto>("GET", `/blog/public/posts/${slug}`),
    listCategoriesPublic: () => this.request<BlogCategoryDto[]>("GET", "/blog/public/categories"),
  };

  // === Legal pages ===
  legal = {
    list: () => this.request<LegalPageDto[]>("GET", "/legal", undefined, { auth: true }),
    detail: (slug: string) => this.request<LegalPageDto>("GET", `/legal/${slug}`, undefined, { auth: true }),
    create: (data: Partial<LegalPageDto>) => this.request<LegalPageDto>("POST", "/legal", data, { auth: true }),
    update: (id: string, data: Partial<LegalPageDto>) => this.request<LegalPageDto>("PATCH", `/legal/${id}`, data, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/legal/${id}`, undefined, { auth: true }),
    // --- Public (storefront, auth yok): yalnız aktif sayfalar ---
    listPublic: () => this.request<LegalPageDto[]>("GET", "/legal/public"),
    getPublic: (slug: string) => this.request<LegalPageDto>("GET", `/legal/public/${slug}`),
  };

  // === Campaign packages ===
  campaignPackages = {
    list: () => this.request<CampaignPackageDto[]>("GET", "/campaign-packages", undefined, { auth: true }),
    create: (data: Partial<CampaignPackageDto>) => this.request<CampaignPackageDto>("POST", "/campaign-packages", data, { auth: true }),
    update: (id: string, data: Partial<CampaignPackageDto>) => this.request<CampaignPackageDto>("PATCH", `/campaign-packages/${id}`, data, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/campaign-packages/${id}`, undefined, { auth: true }),
  };

  // === Reviews ===
  reviews = {
    list: (status?: "pending" | "approved") => this.request<ReviewDto[]>("GET", "/reviews", undefined, { auth: true, query: { status } }),
    setApproval: (id: string, isApproved: boolean) => this.request<ReviewDto>("PATCH", `/reviews/${id}/approval`, { isApproved }, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/reviews/${id}`, undefined, { auth: true }),
    // --- Public (storefront): yalnız ürünün ONAYLANMIŞ yorumları ---
    listPublic: (productSlug: string) =>
      this.request<ReviewDto[]>("GET", "/reviews/public", undefined, { query: { productSlug } }),
    // --- Giriş yapmış müşteri yorum bırakır (onaysız doğar) ---
    createPublic: (data: { productSlug: string; rating: number; title?: string; body: string }) =>
      this.request<ReviewDto>("POST", "/reviews/public", data, { auth: true }),
  };

  // === Brands (Referanslar) ===
  brands = {
    // --- Public (storefront): yalnız aktif markalar ---
    listPublic: () => this.request<BrandDto[]>("GET", "/brands/public"),
    // --- Admin (auth) ---
    list: () => this.request<BrandDto[]>("GET", "/brands", undefined, { auth: true }),
    create: (data: Partial<BrandDto>) => this.request<BrandDto>("POST", "/brands", data, { auth: true }),
    update: (id: string, data: Partial<BrandDto>) => this.request<BrandDto>("PATCH", `/brands/${id}`, data, { auth: true }),
    remove: (id: string) => this.request<void>("DELETE", `/brands/${id}`, undefined, { auth: true }),
  };

  // === Settings ===
  settings = {
    get: (group?: string) =>
      this.request<Record<string, unknown>>("GET", "/settings", undefined, { auth: true, query: { group } }),
    upsert: (group: string, values: Record<string, unknown>) =>
      this.request<Record<string, unknown>>("PATCH", "/settings", { group, values }, { auth: true }),
  };

  // === Corporate applications ===
  corporateApplications = {
    list: (status?: string) =>
      this.request<CorporateApplicationDto[]>("GET", "/corporate-applications", undefined, { auth: true, query: { status } }),
    setStatus: (id: string, body: { status: "approved" | "rejected" | "pending"; reviewNote?: string }) =>
      this.request<CorporateApplicationDto>("PATCH", `/corporate-applications/${id}`, body, { auth: true }),
    /** Public (B2B form) — başvuruyu panele düşürür. Auth gerektirmez. */
    createPublic: (data: {
      companyName: string;
      taxOffice?: string;
      taxNumber: string;
      sector?: string;
      annualVolume?: string;
      contactName: string;
      contactRole?: string;
      email: string;
      phone: string;
      address?: string;
      notes?: string;
    }) => this.request<CorporateApplicationDto>("POST", "/corporate-applications", data),
  };

  // === Admin: users + stats ===
  adminUsers = {
    list: (opts: { take?: number; skip?: number; q?: string } = {}) =>
      this.request<AdminUserDto[]>("GET", "/admin/users", undefined, { auth: true, query: opts }),
    detail: (id: string) =>
      this.request<AdminUserDto>("GET", `/admin/users/${id}`, undefined, { auth: true }),
    updateCorporate: (
      id: string,
      data: { corporateDiscount?: number; corporateCreditLimit?: number; corporatePaymentTermDays?: number },
    ) => this.request<AdminUserDto>("PATCH", `/admin/users/${id}/corporate`, data, { auth: true }),
  };

  // Cari hesap (B2B açık hesap) defteri
  corporateLedger = {
    statement: (userId: string) =>
      this.request<LedgerStatementDto>("GET", `/admin/corporate-ledger/${userId}`, undefined, { auth: true }),
    recordPayment: (userId: string, data: { amount: number; description?: string }) =>
      this.request<LedgerStatementDto>("POST", `/admin/corporate-ledger/${userId}/payment`, data, { auth: true }),
    mine: () => this.request<LedgerStatementDto>("GET", "/users/me/ledger", undefined, { auth: true }),
  };

  adminStats = () =>
    this.request<AdminStatsDto>("GET", "/admin/stats", undefined, { auth: true });
}

export interface BannerDto {
  id: string;
  title: string;
  location: "hero" | "category" | "cart" | "footer";
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  sortOrder: number;
  isActive: boolean;
  clickCount: number;
}

export interface FaqDto {
  id: string;
  question: string;
  answer: string;
  category: string;
  productSlug?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReviewDto {
  id: string;
  productId: string;
  userName: string;
  userCompany?: string | null;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product?: { slug: string; name: string } | null;
}

export interface CouponDto {
  id: string;
  code: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: string;
  minOrderAmount?: string | null;
  maxUses?: number | null;
  usedCount: number;
  validFrom?: string | null;
  validUntil?: string | null;
  isActive: boolean;
  /** Yalnızca müşterinin ilk siparişinde geçerli (örn. HOSGELDIN). */
  firstOrderOnly?: boolean;
  createdAt: string;
}

export interface HeroSlideDto {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CorporateApplicationDto {
  id: string;
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  contactName: string;
  email: string;
  phone: string;
  status: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AdminUserOrderDto {
  id: string;
  orderNumber: string;
  total: string | number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  accountType: "individual" | "corporate";
  companyName?: string | null;
  role: "customer" | "admin" | "super_admin";
  orderCount?: number;
  createdAt: string;
  // Detay (GET /admin/users/:id) ek alanları:
  taxOffice?: string | null;
  taxNumber?: string | null;
  corporateStatus?: "none" | "pending" | "approved" | "rejected";
  corporateDiscount?: string | number | null;
  corporateCreditLimit?: string | number | null;
  corporatePaymentTermDays?: number | null;
  lastLoginAt?: string | null;
  orders?: AdminUserOrderDto[];
  addresses?: Array<{
    id: string;
    label?: string | null;
    type?: string | null;
    fullName?: string | null;
    phone?: string | null;
    city?: string | null;
    district?: string | null;
    fullAddress?: string | null;
    zipCode?: string | null;
    companyName?: string | null;
    taxOffice?: string | null;
    taxNumber?: string | null;
    isDefault?: boolean;
  }>;
}

export interface LedgerEntryDto {
  id: string;
  orderId?: string | null;
  kind: "debit" | "credit";
  amount: string | number;
  description: string;
  dueDate?: string | null;
  createdAt: string;
}

export interface LedgerStatementDto {
  balance: number;
  entries: LedgerEntryDto[];
}

export interface AdminStatsDto {
  orderCount: number;
  revenue: number;
  customerCount: number;
  pendingCorporate: number;
  ordersByStatus: Array<{ status: string; count: number }>;
  /** Entegrasyonların gerçek yapılandırma durumu (env'den) — opsiyonel (eski API ile uyum). */
  integrations?: {
    iyzico: boolean;
    parasut: boolean;
    sendgrid: boolean;
    netgsm: boolean;
    dhl: boolean;
    r2: boolean;
  };
}

export interface BlogPostDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string | null;
  authorName: string;
  authorRole?: string | null;
  categoryId?: string | null;
  tags: string[];
  status: "draft" | "published" | "archived";
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogImage?: string | null;
  viewCount: number;
  publishedAt?: string | null;
  createdAt: string;
  category?: { slug: string; name: string } | null;
}

export interface BlogCategoryDto {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder: number;
}

export interface CampaignPackageDto {
  id: string;
  slug: string;
  name: string;
  category: "esnaf" | "kurumsal" | "etkinlik" | "acilis" | "promosyon";
  contents: string;
  listPrice: string;
  packagePrice: string;
  stockLimit?: number | null;
  endDate?: string | null;
  designSupport: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface LegalPageDto {
  id: string;
  slug: string;
  title: string;
  content: string;
  version: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandDto {
  id: string;
  name: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Analytics / Ziyaretçi Analizi & CRM tipleri =====

/** Storefront'tan gönderilen birinci-parti olay. */
export interface AnalyticsCollectEvent {
  type: string; // page_view | product_view | add_to_cart | begin_checkout | purchase | search | session_start
  sessionId: string;
  path?: string;
  productSlug?: string;
  dwellMs?: number;
  value?: number;
  referrer?: string;
  device?: string; // mobile | desktop | tablet
  utmSource?: string;
}

export interface AnalyticsKpis {
  sessions: number;
  uniqueVisitors: number;
  pageViews: number;
  productViews: number;
  addToCarts: number;
  checkouts: number;
  orders: number;
  conversionRate: number; // sipariş/oturum (%)
  returningRate: number; // dönen ziyaretçi oranı (%)
  avgDwellMs: number; // ortalama ürün inceleme süresi
}

export interface AnalyticsTopProduct {
  slug: string;
  name: string;
  views: number;
  avgDwellMs: number;
  addToCarts: number;
  orders: number;
  conversionRate: number; // sipariş/görüntülenme (%)
}

export interface AnalyticsFunnelStage {
  key: string;
  label: string;
  count: number;
}

export interface AnalyticsTimePoint {
  date: string; // YYYY-MM-DD
  sessions: number;
  orders: number;
}

/** Kayıtlı kullanıcı ziyaret zamanlaması ısı haritası hücresi (dow 0=Pazar, hour 0-23). */
export interface AnalyticsHeatCell {
  dow: number;
  hour: number;
  count: number;
}

export interface AnalyticsDeviceSlice {
  device: string;
  count: number;
}

export interface AnalyticsSegment {
  key: string; // new | loyal | at_risk | dormant | lost | inactive_60d ...
  label: string;
  description: string;
  count: number;
  tone?: string; // ui ipucu: success|warning|error|info
  actionable?: boolean; // kampanya hedefi mi
}

export interface AnalyticsOverviewDto {
  range: { days: number; from: string; to: string };
  /** Event verisi henüz birikmediyse true (yeni etkinleştirildi) — ziyaretçi bölümleri "veri toplanıyor". */
  collecting: boolean;
  kpis: AnalyticsKpis;
  topProducts: AnalyticsTopProduct[];
  funnel: AnalyticsFunnelStage[];
  trafficByDay: AnalyticsTimePoint[];
  visitHeatmap: AnalyticsHeatCell[];
  deviceBreakdown: AnalyticsDeviceSlice[];
  customers: {
    total: number;
    withOrders: number;
    conversionRate: number; // sipariş veren üye / toplam üye (%)
    newThisPeriod: number;
    returning: number; // 2+ siparişli
    segments: AnalyticsSegment[];
  };
}

export interface AnalyticsSegmentCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  lastActivityAt: string | null; // max(lastLoginAt, lastOrderAt)
  daysSinceLastActivity: number | null;
}

export interface AnalyticsSegmentResultDto {
  key: string;
  label: string;
  count: number;
  customers: AnalyticsSegmentCustomer[];
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
