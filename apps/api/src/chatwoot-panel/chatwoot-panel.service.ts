import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const ORDER_LIMIT = 5;

/**
 * Kargo takip URL kalıpları — {no} yerine takip numarası gelir.
 * trackingCarrier serbest metin olduğundan regex ile eşlenir; eşleşme yoksa link üretilmez, sadece numara gösterilir.
 * NOT: Kalıpları ilk gerçek kargoda tıklayıp doğrulayın (siteler URL'lerini değiştirebiliyor).
 */
const CARRIER_URLS: Array<[RegExp, string]> = [
  [/yurt/i, "https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code={no}"],
  [/aras/i, "https://www.araskargo.com.tr/tr/cargo-tracking?code={no}"],
  [/mng/i, "https://www.mngkargo.com.tr/gonderitakip?takipNo={no}"],
  [/ptt/i, "https://gonderitakip.ptt.gov.tr/Track/Verify?q={no}"],
  [/s[uü]rat/i, "https://www.suratkargo.com.tr/KargoTakip/?kargotakipno={no}"],
  [/hepsijet/i, "https://www.hepsijet.com/gonderi-takibi/{no}"],
];

/** Telefonu "son 10 hane" anahtarına indirger: +90 505 741 70 28 → 5057417028. Kayıt formatı ne olursa olsun eşleşir. */
export function phoneKey(raw: string | null | undefined): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return digits.slice(-10);
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));
const iso = (d: Date | null | undefined): string | null => (d ? new Date(d).toISOString() : null);

function trackingUrl(carrier: string | null, no: string | null): string | null {
  if (!carrier || !no) return null;
  const hit = CARRIER_URLS.find(([re]) => re.test(carrier));
  return hit ? hit[1].replace("{no}", encodeURIComponent(no.trim())) : null;
}

/** orders.notes = müşterinin checkout notu + [[idem:...]] etiketi. Etiketi ayıkla; kolona asla yazma (mükerrer sipariş koruması). */
function customerNote(notes: string | null): string | null {
  const t = (notes ?? "").replace(/\[\[idem:[^\]]*\]\]/g, "").trim();
  return t || null;
}

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  account_type: string;
  corporate_status: string;
  company_name: string | null;
  corporate_discount: unknown;
  corporate_credit_limit: unknown;
  corporate_payment_term_days: number | null;
  loyalty_points: number;
  created_at: Date;
};

export interface PanelLookup {
  found: boolean;
  phoneKey: string | null;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    accountType: string;
    corporateStatus: string;
    companyName: string | null;
    loyaltyPoints: number;
    memberSince: string | null;
  }>;
  corporate: {
    userId: string;
    companyName: string | null;
    balance: number; // debit − credit; pozitif = müşteri borçlu
    creditLimit: number | null;
    paymentTermDays: number | null;
    discount: number | null;
    lastInvoice: {
      period: string;
      totalAmount: number | null;
      orderCount: number;
      status: string;
    } | null;
  } | null;
  orders: { total: number; items: PanelOrder[] };
}

export interface PanelOrder {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentError: string | null;
  total: number | null;
  isGuest: boolean;
  items: Array<{
    productName: string;
    quantity: number;
    configurationSummary: string;
    needsDesignSupport: boolean;
    uploadedFileName: string | null;
    uploadedFileUrl: string | null;
  }>;
  ship: {
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    city: string | null;
    district: string | null;
  };
  proofs: Array<{ kind: string; fileName: string; fileUrl: string; createdAt: string | null }>;
  invoice: { number: string | null; issuedAt: string | null };
  customerNote: string | null;
  internalNotes: Array<{ authorName: string; body: string; createdAt: string | null }>;
}

@Injectable()
export class ChatwootPanelService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(phoneRaw: string): Promise<PanelLookup> {
    const key = phoneKey(phoneRaw);
    const empty: PanelLookup = {
      found: false,
      phoneKey: key,
      customers: [],
      corporate: null,
      orders: { total: 0, items: [] },
    };
    if (!key) return empty;
    const like = "%" + key;

    // 1) Kayıtlı müşteri(ler) — telefon kolonundaki rakam dışı karakterler ayıklanarak eşlenir (soft-delete hariç)
    const users = await this.prisma.$queryRaw<UserRow[]>`
      SELECT id, full_name, email, phone, account_type, corporate_status, company_name,
             corporate_discount, corporate_credit_limit, corporate_payment_term_days,
             loyalty_points, created_at
      FROM users
      WHERE deleted_at IS NULL
        AND regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') LIKE ${like}
      ORDER BY created_at ASC
      LIMIT 3`;

    // 2) Siparişler — hesaba bağlı olanlar + aynı telefonla verilmiş misafir siparişleri (user_id NULL)
    const userIds = users.map((u) => u.id);
    const userCond = userIds.length
      ? Prisma.sql`o.user_id IN (${Prisma.join(userIds)})`
      : Prisma.sql`FALSE`;
    const phoneCond = Prisma.sql`regexp_replace(COALESCE(o.phone, ''), '[^0-9]', '', 'g') LIKE ${like}`;

    const idRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT o.id FROM orders o
      WHERE o.deleted_at IS NULL AND (${userCond} OR ${phoneCond})
      ORDER BY o.created_at DESC
      LIMIT ${ORDER_LIMIT}`;
    const [{ n: total }] = await this.prisma.$queryRaw<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM orders o
      WHERE o.deleted_at IS NULL AND (${userCond} OR ${phoneCond})`;

    if (!users.length && !idRows.length) return empty;

    const orders = idRows.length
      ? await this.prisma.order.findMany({
          where: { id: { in: idRows.map((r) => r.id) } },
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              select: {
                productName: true,
                quantity: true,
                configurationSummary: true,
                needsDesignSupport: true,
                uploadedFileName: true,
                uploadedFileUrl: true,
              },
            },
            designUploads: {
              where: { kind: { in: ["onizleme", "baski"] } },
              orderBy: { createdAt: "desc" },
              take: 3,
              select: { kind: true, fileName: true, fileUrl: true, createdAt: true },
            },
            internalNotes: {
              orderBy: { createdAt: "desc" },
              take: 2,
              select: { authorName: true, body: true, createdAt: true },
            },
            shippingAddress: { select: { city: true, district: true } },
          },
        })
      : [];

    // 3) Kurumsal (onaylı) müşteri için cari özeti
    const corpUser = users.find((u) => u.corporate_status === "approved");
    let corporate: PanelLookup["corporate"] = null;
    if (corpUser) {
      const sums = await this.prisma.corporateLedgerEntry.groupBy({
        by: ["kind"],
        where: { userId: corpUser.id },
        _sum: { amount: true },
      });
      const debit = num(sums.find((s) => s.kind === "debit")?._sum.amount) ?? 0;
      const credit = num(sums.find((s) => s.kind === "credit")?._sum.amount) ?? 0;
      const inv = await this.prisma.corporateMonthlyInvoice.findFirst({
        where: { userId: corpUser.id },
        orderBy: { period: "desc" },
        select: { period: true, totalAmount: true, orderCount: true, status: true },
      });
      corporate = {
        userId: corpUser.id,
        companyName: corpUser.company_name,
        balance: Math.round((debit - credit) * 100) / 100,
        creditLimit: num(corpUser.corporate_credit_limit),
        paymentTermDays: corpUser.corporate_payment_term_days,
        discount: num(corpUser.corporate_discount),
        lastInvoice: inv
          ? {
              period: inv.period,
              totalAmount: num(inv.totalAmount),
              orderCount: inv.orderCount,
              status: inv.status,
            }
          : null,
      };
    }

    return {
      found: true,
      phoneKey: key,
      customers: users.map((u) => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        phone: u.phone,
        accountType: u.account_type,
        corporateStatus: u.corporate_status,
        companyName: u.company_name,
        loyaltyPoints: u.loyalty_points ?? 0,
        memberSince: iso(u.created_at),
      })),
      corporate,
      orders: {
        total,
        items: orders.map((o): PanelOrder => {
          const snap = (o.shippingAddressSnapshot ?? null) as {
            city?: string;
            district?: string;
          } | null;
          return {
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: iso(o.createdAt),
            status: o.status,
            paymentStatus: o.paymentStatus,
            paymentMethod: o.paymentMethod,
            paymentError: o.paymentStatus === "basarisiz" ? o.paymentErrorMessage : null,
            total: num(o.total),
            isGuest: o.userId == null,
            items: o.items.map((i) => ({
              productName: i.productName,
              quantity: i.quantity,
              configurationSummary: i.configurationSummary,
              needsDesignSupport: i.needsDesignSupport,
              uploadedFileName: i.uploadedFileName,
              uploadedFileUrl: i.uploadedFileUrl,
            })),
            ship: {
              carrier: o.trackingCarrier,
              trackingNumber: o.trackingNumber,
              trackingUrl: trackingUrl(o.trackingCarrier, o.trackingNumber),
              shippedAt: iso(o.shippedAt),
              deliveredAt: iso(o.deliveredAt),
              city: o.shippingAddress?.city ?? snap?.city ?? null,
              district: o.shippingAddress?.district ?? snap?.district ?? null,
            },
            proofs: o.designUploads.map((d) => ({
              kind: d.kind,
              fileName: d.fileName,
              fileUrl: d.fileUrl,
              createdAt: iso(d.createdAt),
            })),
            invoice: { number: o.invoiceNumber, issuedAt: iso(o.invoiceIssuedAt) },
            customerNote: customerNote(o.notes),
            internalNotes: o.internalNotes.map((n) => ({
              authorName: n.authorName,
              body: n.body,
              createdAt: iso(n.createdAt),
            })),
          };
        }),
      },
    };
  }
}
