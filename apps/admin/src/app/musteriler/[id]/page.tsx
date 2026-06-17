import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getAdminApi } from "@/lib/api";
import {
  ArrowLeft, EnvelopeSimple, Phone, ClockCounterClockwise, MapPin,
} from "@phosphor-icons/react/dist/ssr";

/** Prisma enum (underscore) → etiket anahtarı (hyphen). */
const toSlug = (s: string) => String(s ?? "").replace(/_/g, "-");

export const dynamic = "force-dynamic";

const TRY = (n: number | string) =>
  "₺ " + Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

const STATUS_LABEL: Record<string, string> = {
  "siparis-alindi": "Sipariş Alındı",
  "tasarim-bekleniyor": "Tasarım Bekleniyor",
  "tasarim-onayindi": "Tasarım Onayında",
  uretimde: "Üretimde",
  "kargoya-verildi": "Kargoda",
  "teslim-edildi": "Teslim Edildi",
  "iptal-edildi": "İptal",
};
const PAYMENT_LABEL: Record<string, string> = {
  beklemede: "Ödeme Bekliyor",
  basarili: "Ödendi",
  basarisiz: "Başarısız",
  "iade-edildi": "İade",
};

function fmtDate(s?: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const api = await getAdminApi();
  let user;
  try {
    user = await api.adminUsers.detail(params.id);
  } catch {
    notFound();
  }
  if (!user) notFound();

  const orders = user.orders ?? [];
  const addresses = user.addresses ?? [];
  const totalSpent = orders
    .filter((o) => o.paymentStatus === "basarili")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <AdminShell>
      <div className="mb-6 flex items-center gap-3">
        <Link href="/musteriler" className="p-2 rounded-md hover:bg-paper-100 text-ink-700">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-ink-900">{user.fullName}</h1>
          <p className="text-xs text-ink-500 mt-1">
            {user.accountType === "corporate" ? "Kurumsal" : "Bireysel"} · Üyelik: {fmtDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: profil */}
        <div className="space-y-5">
          <Card title="İletişim">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-ink-700"><EnvelopeSimple size={14} /> {user.email}</div>
              <div className="flex items-center gap-2 text-ink-700"><Phone size={14} /> {user.phone ?? "—"}</div>
            </div>
          </Card>

          {user.accountType === "corporate" && (
            <Card title="Kurumsal Bilgiler">
              <KV label="Firma" value={user.companyName ?? "—"} />
              <KV label="Vergi Dairesi" value={user.taxOffice ?? "—"} />
              <KV label="Vergi No" value={user.taxNumber ?? "—"} />
              <KV label="Durum" value={user.corporateStatus ?? "—"} />
              {user.corporateDiscount != null && <KV label="İndirim" value={`%${user.corporateDiscount}`} />}
            </Card>
          )}

          <Card title="Özet">
            <KV label="Toplam Sipariş" value={String(orders.length)} />
            <KV label="Toplam Harcama" value={TRY(totalSpent)} />
            <KV label="Son Giriş" value={fmtDate(user.lastLoginAt)} />
          </Card>
        </div>

        {/* Sağ: sipariş geçmişi */}
        <div className="lg:col-span-2">
          <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
            <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40 flex items-center gap-2">
              <ClockCounterClockwise size={16} className="text-brand-700" />
              <h2 className="font-semibold text-ink-900 text-sm">Sipariş Geçmişi ({orders.length})</h2>
            </header>
            {orders.length === 0 ? (
              <div className="p-10 text-center text-ink-500 text-sm">Bu müşterinin siparişi yok.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-paper-100/40 text-ink-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-2.5 font-semibold">Sipariş No</th>
                      <th className="text-left px-5 py-2.5 font-semibold hidden md:table-cell">Tarih</th>
                      <th className="text-left px-5 py-2.5 font-semibold">Durum</th>
                      <th className="text-right px-5 py-2.5 font-semibold">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-paper-200">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-paper-100/40">
                        <td className="px-5 py-3">
                          <Link href={`/siparisler/${o.id}`} className="font-mono text-xs font-semibold text-brand-700 hover:underline">
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-ink-500 text-xs hidden md:table-cell">{fmtDate(o.createdAt)}</td>
                        <td className="px-5 py-3 text-ink-700 text-xs">
                          {STATUS_LABEL[toSlug(o.status)] ?? o.status} · {PAYMENT_LABEL[toSlug(o.paymentStatus)] ?? o.paymentStatus}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-ink-900 tabular-nums">{TRY(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Adresler */}
          <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden mt-5">
            <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40 flex items-center gap-2">
              <MapPin size={16} className="text-brand-700" />
              <h2 className="font-semibold text-ink-900 text-sm">Adresler ({addresses.length})</h2>
            </header>
            {addresses.length === 0 ? (
              <div className="p-10 text-center text-ink-500 text-sm">Kayıtlı adres yok.</div>
            ) : (
              <div className="p-5 grid sm:grid-cols-2 gap-3">
                {addresses.map((a) => (
                  <div key={a.id} className="border border-paper-200 rounded-lg p-4 text-sm">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-ink-900">{a.label || "Adres"}</span>
                      {a.type === "corporate" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-900">Kurumsal</span>
                      )}
                      {a.isDefault && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success">Varsayılan</span>
                      )}
                    </div>
                    <div className="text-ink-700">{a.fullName}</div>
                    {a.type === "corporate" && a.companyName && (
                      <div className="text-ink-500 text-xs">
                        {a.companyName} · VD: {a.taxOffice ?? "—"} · VN: {a.taxNumber ?? "—"}
                      </div>
                    )}
                    <div className="text-ink-600 mt-1">{a.fullAddress}</div>
                    <div className="text-ink-500 text-xs">
                      {a.district} / {a.city} {a.zipCode}
                    </div>
                    {a.phone && <div className="text-ink-500 text-xs mt-1">{a.phone}</div>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40">
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900 font-medium text-right">{value}</span>
    </div>
  );
}
