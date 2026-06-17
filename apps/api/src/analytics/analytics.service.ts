import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Ziyaretçi analizi & CRM servisi.
 *
 * İki veri kaynağı:
 *  1) AnalyticsEvent — storefront'tan toplanan birinci-parti davranış olayları (KPI/huni/heatmap).
 *  2) Order + User — gerçek ticari/CRM verisi (event'e BAĞIMSIZ; panel ilk günden anlamlı çalışır).
 *
 * DAYANIKLILIK: overview/segment hiçbir koşulda çökmez — her ağır blok try/catch ile
 * sarılı, hata olursa boş/varsayılan değerle devam eder. Panel "veri yok" gösterir, 500 atmaz.
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  // Event tipleri — storefront ile sözleşme (api-client AnalyticsCollectEvent.type ile uyumlu).
  private static readonly T_PAGE_VIEW = "page_view";
  private static readonly T_PRODUCT_VIEW = "product_view";
  private static readonly T_ADD_TO_CART = "add_to_cart";
  private static readonly T_CHECKOUT = "begin_checkout";

  constructor(private prisma: PrismaService) {}

  // ============================================================
  // ENDPOINT 1 — collect
  // ============================================================

  /**
   * Doğrulanmış olayları toplu yazar. userId controller'da soft-decode edilip enjekte edilir.
   * createMany ile tek round-trip; hata-izole (DB hatası logla, 0 kabul dön).
   */
  async collect(
    events: Array<{
      type: string;
      sessionId: string;
      path?: string;
      productSlug?: string;
      dwellMs?: number;
      value?: number;
      referrer?: string;
      device?: string;
      utmSource?: string;
    }>,
    userId?: string,
  ): Promise<number> {
    if (!events.length) return 0;
    try {
      const data: Prisma.AnalyticsEventCreateManyInput[] = events.map((e) => ({
        type: e.type,
        sessionId: e.sessionId,
        userId: userId ?? null,
        path: e.path ?? null,
        productSlug: e.productSlug ?? null,
        dwellMs: typeof e.dwellMs === "number" ? Math.round(e.dwellMs) : null,
        value: typeof e.value === "number" ? new Prisma.Decimal(e.value) : null,
        referrer: e.referrer ?? null,
        device: e.device ?? null,
        utmSource: e.utmSource ?? null,
      }));
      const res = await this.prisma.analyticsEvent.createMany({ data });
      return res.count;
    } catch (err) {
      // Yüksek-frekanslı endpoint: hatayı yut, asla isteyene yansıtma.
      this.logger.warn(`collect insert failed: ${(err as Error).message}`);
      return 0;
    }
  }

  // ============================================================
  // ENDPOINT 2 — overview
  // ============================================================

  async overview(days: number) {
    const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 365) : 30;
    const to = new Date();
    const from = new Date(to.getTime() - safeDays * 24 * 60 * 60 * 1000);
    const range = { days: safeDays, from: from.toISOString(), to: to.toISOString() };

    // Her blok bağımsız + hata-izole. Promise.all yerine ayrı try/catch ile dayanıklılık.
    const [collecting, kpis, topProducts, trafficByDay, visitHeatmap, deviceBreakdown, customers] =
      await Promise.all([
        this.safe(() => this.computeCollecting(from, to), true),
        this.safe(() => this.computeKpis(from, to), this.emptyKpis()),
        this.safe(() => this.computeTopProducts(from, to), []),
        this.safe(() => this.computeTrafficByDay(from, to, safeDays), []),
        this.safe(() => this.computeHeatmap(from, to), []),
        this.safe(() => this.computeDeviceBreakdown(from, to), []),
        this.safe(() => this.computeCustomers(from, to), this.emptyCustomers()),
      ]);

    const funnel = [
      { key: "sessions", label: "Oturum", count: kpis.sessions },
      { key: "product_view", label: "Ürün görüntüleme", count: kpis.productViews },
      { key: "add_to_cart", label: "Sepete ekleme", count: kpis.addToCarts },
      { key: "begin_checkout", label: "Ödemeye başlama", count: kpis.checkouts },
      { key: "order", label: "Sipariş", count: kpis.orders },
    ];

    return {
      range,
      collecting,
      kpis,
      topProducts,
      funnel,
      trafficByDay,
      visitHeatmap,
      deviceBreakdown,
      customers,
    };
  }

  /** range'de toplam < 5 event → panel "veri toplanıyor" gösterir. */
  private async computeCollecting(from: Date, to: Date): Promise<boolean> {
    const total = await this.prisma.analyticsEvent.count({
      where: { createdAt: { gte: from, lte: to } },
    });
    return total < 5;
  }

  private async computeKpis(from: Date, to: Date) {
    const where = { createdAt: { gte: from, lte: to } };

    const [
      sessionGroups,
      visitorRows,
      pageViews,
      productViews,
      addToCarts,
      checkouts,
      orders,
      dwellAgg,
      visitorSessionRows,
    ] = await Promise.all([
      // distinct sessionId
      this.prisma.analyticsEvent.findMany({ where, select: { sessionId: true }, distinct: ["sessionId"] }),
      // distinct coalesce(userId, sessionId) — raw, hızlı + doğru
      this.prisma.$queryRaw<Array<{ visitor: string }>>(Prisma.sql`
        SELECT DISTINCT COALESCE(user_id, session_id) AS visitor
        FROM analytics_events
        WHERE created_at >= ${from} AND created_at <= ${to}
      `),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsService.T_PAGE_VIEW } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsService.T_PRODUCT_VIEW } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsService.T_ADD_TO_CART } }),
      this.prisma.analyticsEvent.count({ where: { ...where, type: AnalyticsService.T_CHECKOUT } }),
      this.prisma.order.count({ where: { createdAt: { gte: from, lte: to }, deletedAt: null } }),
      this.prisma.analyticsEvent.aggregate({
        where: { ...where, type: AnalyticsService.T_PRODUCT_VIEW, dwellMs: { not: null } },
        _avg: { dwellMs: true },
      }),
      // returning: birden fazla DISTINCT oturumu olan ziyaretçi sayısı + toplam ziyaretçi
      this.prisma.$queryRaw<Array<{ visitor: string; sessions: bigint }>>(Prisma.sql`
        SELECT COALESCE(user_id, session_id) AS visitor, COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events
        WHERE created_at >= ${from} AND created_at <= ${to}
        GROUP BY COALESCE(user_id, session_id)
      `),
    ]);

    const sessions = sessionGroups.length;
    const uniqueVisitors = visitorRows.length;
    const totalVisitors = visitorSessionRows.length;
    const returningVisitors = visitorSessionRows.filter((r) => Number(r.sessions) > 1).length;

    return {
      sessions,
      uniqueVisitors,
      pageViews,
      productViews,
      addToCarts,
      checkouts,
      orders,
      conversionRate: sessions > 0 ? round2((orders / sessions) * 100) : 0,
      returningRate: totalVisitors > 0 ? round2((returningVisitors / totalVisitors) * 100) : 0,
      avgDwellMs: Math.round(Number(dwellAgg._avg.dwellMs ?? 0)),
    };
  }

  private async computeTopProducts(from: Date, to: Date) {
    const where = { createdAt: { gte: from, lte: to }, productSlug: { not: null } };

    // product_view'leri slug'a göre grupla: views + avg dwell.
    const viewGroups = await this.prisma.analyticsEvent.groupBy({
      by: ["productSlug"],
      where: { ...where, type: AnalyticsService.T_PRODUCT_VIEW },
      _count: { _all: true },
      _avg: { dwellMs: true },
      orderBy: { _count: { productSlug: "desc" } },
      take: 15,
    });

    const slugs = viewGroups.map((g) => g.productSlug!).filter(Boolean);
    if (slugs.length === 0) return [];

    const [addToCartGroups, products, orderItemGroups] = await Promise.all([
      this.prisma.analyticsEvent.groupBy({
        by: ["productSlug"],
        where: { createdAt: { gte: from, lte: to }, type: AnalyticsService.T_ADD_TO_CART, productSlug: { in: slugs } },
        _count: { _all: true },
      }),
      this.prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } }),
      // O ürünün range içindeki sipariş kalemi sayısı (OrderItem.productSlug üzerinden).
      this.prisma.orderItem.groupBy({
        by: ["productSlug"],
        where: {
          productSlug: { in: slugs },
          order: { is: { createdAt: { gte: from, lte: to }, deletedAt: null } },
        },
        _count: { _all: true },
      }),
    ]);

    const nameBySlug = new Map(products.map((p) => [p.slug, p.name]));
    const addToCartBySlug = new Map(addToCartGroups.map((g) => [g.productSlug, g._count._all]));
    const ordersBySlug = new Map(orderItemGroups.map((g) => [g.productSlug, g._count._all]));

    return viewGroups.map((g) => {
      const slug = g.productSlug!;
      const views = g._count._all;
      const orders = ordersBySlug.get(slug) ?? 0;
      return {
        slug,
        name: nameBySlug.get(slug) ?? slug,
        views,
        avgDwellMs: Math.round(Number(g._avg.dwellMs ?? 0)),
        addToCarts: addToCartBySlug.get(slug) ?? 0,
        orders,
        conversionRate: views > 0 ? round2((orders / views) * 100) : 0,
      };
    });
  }

  private async computeTrafficByDay(from: Date, to: Date, days: number) {
    // Günlük distinct oturum (event) + günlük sipariş — raw, tek sorgu ikilisi.
    const [sessionRows, orderRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ day: string; sessions: bigint }>>(Prisma.sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(DISTINCT session_id) AS sessions
        FROM analytics_events
        WHERE created_at >= ${from} AND created_at <= ${to}
        GROUP BY 1
      `),
      this.prisma.$queryRaw<Array<{ day: string; orders: bigint }>>(Prisma.sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
               COUNT(*) AS orders
        FROM orders
        WHERE created_at >= ${from} AND created_at <= ${to} AND deleted_at IS NULL
        GROUP BY 1
      `),
    ]);

    const sessionByDay = new Map(sessionRows.map((r) => [r.day, Number(r.sessions)]));
    const orderByDay = new Map(orderRows.map((r) => [r.day, Number(r.orders)]));

    // range'deki HER gün için satır üret (boş günler 0).
    const out: Array<{ date: string; sessions: number; orders: number }> = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i <= days; i++) {
      const date = cursor.toISOString().slice(0, 10);
      out.push({ date, sessions: sessionByDay.get(date) ?? 0, orders: orderByDay.get(date) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
      if (cursor > to) break;
    }
    return out;
  }

  private async computeHeatmap(from: Date, to: Date) {
    // SADECE giriş yapmış (user_id dolu) olaylar. dow 0=Pazar, hour 0-23.
    // NOT: createdAt UTC'dir. Türkiye saati (UTC+3) için +3 saat kaydır.
    const rows = await this.prisma.$queryRaw<Array<{ dow: number; hour: number; count: bigint }>>(Prisma.sql`
      SELECT EXTRACT(DOW FROM (created_at + interval '3 hours'))::int AS dow,
             EXTRACT(HOUR FROM (created_at + interval '3 hours'))::int AS hour,
             COUNT(*) AS count
      FROM analytics_events
      WHERE user_id IS NOT NULL AND created_at >= ${from} AND created_at <= ${to}
      GROUP BY 1, 2
    `);
    return rows.map((r) => ({ dow: Number(r.dow), hour: Number(r.hour), count: Number(r.count) }));
  }

  private async computeDeviceBreakdown(from: Date, to: Date) {
    const groups = await this.prisma.analyticsEvent.groupBy({
      by: ["device"],
      where: { createdAt: { gte: from, lte: to }, device: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { device: "desc" } },
    });
    return groups.map((g) => ({ device: g.device ?? "bilinmiyor", count: g._count._all }));
  }

  // ============================================================
  // CRM — customers (Order + User; event'e bağımsız)
  // ============================================================

  /**
   * Her müşterinin: kayıt tarihi, son giriş, sipariş sayısı, son sipariş tarihi.
   * Tek raw sorgu ile çekilir; segmentasyon JS tarafında (overview + segment ortak mantık).
   */
  private async loadCustomerRows(): Promise<CustomerRow[]> {
    return this.prisma.$queryRaw<CustomerRow[]>(Prisma.sql`
      SELECT u.id,
             u.full_name        AS "fullName",
             u.email,
             u.phone,
             u.created_at       AS "createdAt",
             u.last_login_at    AS "lastLoginAt",
             COUNT(o.id)        AS "orderCount",
             COALESCE(SUM(o.total), 0) AS "totalSpent",
             MAX(o.created_at)  AS "lastOrderAt"
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id AND o.deleted_at IS NULL
      WHERE u.role = 'customer' AND u.deleted_at IS NULL
      GROUP BY u.id
    `);
  }

  private async computeCustomers(from: Date, _to: Date) {
    const rows = await this.loadCustomerRows();
    const now = Date.now();

    const total = rows.length;
    const withOrders = rows.filter((r) => Number(r.orderCount) >= 1).length;
    const returning = rows.filter((r) => Number(r.orderCount) >= 2).length;
    const newThisPeriod = rows.filter((r) => r.createdAt && new Date(r.createdAt) >= from).length;

    const segmentCounts = this.countSegments(rows, now);
    const segments = SEGMENT_DEFS.map((def) => ({
      key: def.key,
      label: def.label,
      description: def.description,
      count: segmentCounts.get(def.key) ?? 0,
      tone: def.tone,
      actionable: def.actionable,
    }));

    return {
      total,
      withOrders,
      conversionRate: total > 0 ? round2((withOrders / total) * 100) : 0,
      newThisPeriod,
      returning,
      segments,
    };
  }

  private countSegments(rows: CustomerRow[], now: number): Map<string, number> {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = classifySegment(r, now);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }

  // ============================================================
  // ENDPOINT 3 — segment customer list
  // ============================================================

  async segment(key: string) {
    const def = SEGMENT_DEFS.find((d) => d.key === key);
    if (!def) {
      return { key, label: key, count: 0, customers: [] };
    }

    const rows = await this.safe(() => this.loadCustomerRows(), [] as CustomerRow[]);
    const now = Date.now();

    const matched = rows.filter((r) => classifySegment(r, now) === key);
    const customers = matched.slice(0, 500).map((r) => {
      const lastActivity = lastActivityMs(r);
      return {
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        phone: r.phone ?? null,
        orderCount: Number(r.orderCount),
        totalSpent: Number(r.totalSpent ?? 0),
        lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : null,
        lastActivityAt: lastActivity ? new Date(lastActivity).toISOString() : null,
        daysSinceLastActivity: lastActivity ? Math.floor((now - lastActivity) / DAY_MS) : null,
      };
    });

    return { key, label: def.label, count: matched.length, customers };
  }

  // ============================================================
  // Helpers
  // ============================================================

  /** Bir hesaplama bloğunu çalıştır; hata olursa fallback dön (panel asla çökmesin). */
  private async safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      this.logger.warn(`analytics block failed: ${(err as Error).message}`);
      return fallback;
    }
  }

  private emptyKpis() {
    return {
      sessions: 0,
      uniqueVisitors: 0,
      pageViews: 0,
      productViews: 0,
      addToCarts: 0,
      checkouts: 0,
      orders: 0,
      conversionRate: 0,
      returningRate: 0,
      avgDwellMs: 0,
    };
  }

  private emptyCustomers() {
    return {
      total: 0,
      withOrders: 0,
      conversionRate: 0,
      newThisPeriod: 0,
      returning: 0,
      segments: SEGMENT_DEFS.map((d) => ({
        key: d.key,
        label: d.label,
        description: d.description,
        count: 0,
        tone: d.tone,
        actionable: d.actionable,
      })),
    };
  }
}

// ============================================================
// Segment tanımları + sınıflandırma (overview ve segment ortak kullanır)
// ============================================================

const DAY_MS = 24 * 60 * 60 * 1000;

interface CustomerRow {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  createdAt: Date | string | null;
  lastLoginAt: Date | string | null;
  orderCount: bigint | number;
  totalSpent: Prisma.Decimal | number | string | null;
  lastOrderAt: Date | string | null;
}

interface SegmentDef {
  key: string;
  label: string;
  description: string;
  tone: string;
  actionable: boolean;
}

const SEGMENT_DEFS: SegmentDef[] = [
  {
    key: "new",
    label: "Yeni Müşteri",
    description: "Son 14 günde kayıt oldu, henüz 0-1 sipariş — hoş geldin/ilk alışveriş teşviki hedefi.",
    tone: "info",
    actionable: false,
  },
  {
    key: "loyal",
    label: "Sadık Müşteri",
    description: "3+ sipariş ve son 60 günde aktif — VIP/sadakat programı ve çapraz satış hedefi.",
    tone: "success",
    actionable: false,
  },
  {
    key: "at_risk",
    label: "Riskli Müşteri",
    description: "Siparişi var ama 30-60 gündür sessiz — hatırlatma/indirim ile elde tutma hedefi.",
    tone: "warning",
    actionable: true,
  },
  {
    key: "dormant",
    label: "Uyuyan Müşteri",
    description: "60-120 gündür uykuda — win-back SMS/e-posta hedefi.",
    tone: "warning",
    actionable: true,
  },
  {
    key: "lost",
    label: "Kayıp Müşteri",
    description: "Son aktivite 120 günden eski — agresif geri kazanım/yeniden etkileşim hedefi.",
    tone: "error",
    actionable: true,
  },
];

/** lastActivity = max(lastLoginAt, lastOrderAt) ms. İkisi de yoksa createdAt'e düşer. */
function lastActivityMs(r: CustomerRow): number | null {
  const candidates: number[] = [];
  if (r.lastLoginAt) candidates.push(new Date(r.lastLoginAt).getTime());
  if (r.lastOrderAt) candidates.push(new Date(r.lastOrderAt).getTime());
  if (candidates.length === 0 && r.createdAt) candidates.push(new Date(r.createdAt).getTime());
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

/**
 * Müşteriyi tek bir segmente atar (öncelik sırası önemli). Tanımlar overview ve segment'te aynı.
 *  - new: son 14 günde kayıt, 0-1 sipariş
 *  - loyal: 3+ sipariş ve son 60 günde aktif
 *  - at_risk: siparişi var, son aktivite 30-60 gün önce
 *  - dormant: son aktivite 60-120 gün önce
 *  - lost: son aktivite >120 gün önce
 */
function classifySegment(r: CustomerRow, now: number): string | null {
  const orders = Number(r.orderCount);
  const registeredMs = r.createdAt ? new Date(r.createdAt).getTime() : null;
  const daysSinceRegister = registeredMs !== null ? (now - registeredMs) / DAY_MS : Infinity;

  const activity = lastActivityMs(r);
  const daysSinceActivity = activity !== null ? (now - activity) / DAY_MS : Infinity;

  // new: son 14 günde kayıt + 0-1 sipariş
  if (daysSinceRegister <= 14 && orders <= 1) return "new";

  // loyal: 3+ sipariş ve son 60 günde aktif
  if (orders >= 3 && daysSinceActivity <= 60) return "loyal";

  // lost: son aktivite >120 gün
  if (daysSinceActivity > 120) return "lost";

  // dormant: 60-120 gün
  if (daysSinceActivity > 60) return "dormant";

  // at_risk: siparişi var ve 30-60 gün
  if (orders >= 1 && daysSinceActivity > 30) return "at_risk";

  return null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
