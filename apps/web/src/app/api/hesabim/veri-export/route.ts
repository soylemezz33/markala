import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * KVKK 11/d + GDPR Madde 20 — Veri taşınabilirliği (Data Portability).
 * Kullanıcının kendi verisini JSON olarak indirmesi için endpoint.
 *
 * Session check şu an mock — gerçek auth FAZ 3'te NextAuth ile bağlanacak.
 * Prod'da:
 *   const session = await getServerSession(authOptions)
 *   if (!session?.user) return 401
 *   const data = await prisma.user.findUnique({
 *     where: { id: session.user.id },
 *     include: { orders, addresses, reviews, favorites, marketingConsents }
 *   })
 */

interface ExportPayload {
  exportedAt: string;
  exportFormat: string;
  legalBasis: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    accountType: string;
    createdAt: string;
  };
  profile: {
    preferredLanguage: string;
    marketingConsents: {
      email: boolean;
      sms: boolean;
      push: boolean;
      personalizedAds: boolean;
      consentDate: string;
    };
  };
  addresses: Array<Record<string, string | null>>;
  orders: Array<Record<string, unknown>>;
  reviews: Array<Record<string, unknown>>;
  favorites: string[];
  notes: string;
}

export async function POST(req: NextRequest) {
  // Mock session — prod'da gerçek auth
  // const session = await getServerSession(authOptions);
  // if (!session?.user) {
  //   return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  // }

  // Mock kullanıcı verisi
  const mockUserId = "u_mock_demo";
  const mockEmail = "demo@markala.com.tr";

  const exportData: ExportPayload = {
    exportedAt: new Date().toISOString(),
    exportFormat: "Markala-DataExport-v1",
    legalBasis:
      "KVKK 11/d (eksik/yanlış işlenmişse düzeltilme) + GDPR Madde 20 (veri taşınabilirliği)",
    user: {
      id: mockUserId,
      email: mockEmail,
      fullName: "Demo Kullanıcı",
      phone: null,
      accountType: "individual",
      createdAt: "2025-01-01T00:00:00.000Z",
    },
    profile: {
      preferredLanguage: "tr-TR",
      marketingConsents: {
        email: true,
        sms: false,
        push: false,
        personalizedAds: true,
        consentDate: "2025-01-01T00:00:00.000Z",
      },
    },
    addresses: [
      {
        label: "Ev",
        recipient: "Demo Kullanıcı",
        phone: null,
        addressLine: "Mock adres satırı 1, Daire 2",
        district: "Yenişehir",
        city: "Mersin",
        postalCode: "33000",
      },
    ],
    orders: [
      {
        id: "ORD-MOCK-001",
        date: "2025-01-15",
        status: "delivered",
        total: 1250.5,
        items: [
          { product: "Kartvizit 500 ad.", qty: 1, unitPrice: 350 },
          { product: "Broşür A5 1000 ad.", qty: 1, unitPrice: 900.5 },
        ],
      },
    ],
    reviews: [
      {
        productId: "kartvizit-mat",
        rating: 5,
        comment: "Kalite ve teslimat süresi mükemmel.",
        date: "2025-01-20",
      },
    ],
    favorites: ["kartvizit-mat", "brosur-a5", "katalog-50sf"],
    notes:
      "Bu dosya 6698 sayılı KVKK m.11/d ve GDPR Madde 20 kapsamında oluşturulmuştur. " +
      "Veriler dosya oluşturulduğu andaki halini yansıtır. " +
      "Sipariş ve fatura kayıtları VUK 213 gereği anonimleştirilmiş olarak 10 yıl saklanmaya devam eder.",
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `markala-data-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
      "X-Markala-Export": "kvkk-data-portability-v1",
    },
  });
}

// GET ile de tetiklenebilir olsun ki tarayıcıdan doğrudan link verilebilsin
export async function GET(req: NextRequest) {
  return POST(req);
}
