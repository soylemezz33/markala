"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import {
  ArrowLeft, Package, Truck, FileText, MapPin, Phone, EnvelopeSimple,
  CheckCircle, ClockClockwise, Printer, ChatCircle,
} from "@phosphor-icons/react";

const STATUSES = [
  { id: "siparis-alindi", label: "Sipariş Alındı" },
  { id: "tasarim-onay", label: "Tasarım Onayı" },
  { id: "uretimde", label: "Üretimde" },
  { id: "kalite-kontrol", label: "Kalite Kontrol" },
  { id: "kargoya-verildi", label: "Kargoda" },
  { id: "teslim-edildi", label: "Teslim Edildi" },
];

interface Props {
  params: { no: string };
}

export default function OrderDetailPage({ params }: Props) {
  const { no } = params;
  const [currentStatus, setCurrentStatus] = useState("uretimde");
  const [internalNote, setInternalNote] = useState("");

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/siparisler" className="p-2 rounded-md hover:bg-paper-100 text-ink-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-ink-900 font-mono">{no}</h1>
            <p className="text-xs text-ink-500 mt-1">06.05.2026 14:32 · Müşteri: Ali Yıldız</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
            <Printer size={14} /> Etiket Yazdır
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border border-paper-200 hover:bg-paper-100">
            <FileText size={14} /> Fatura Kes
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Sol: ürünler + zaman çizelgesi */}
        <div className="lg:col-span-2 space-y-5">
          <Card title="Sipariş İçeriği">
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-3 bg-paper-100/50 rounded-lg">
                <div className="flex-none w-16 h-16 rounded bg-paper-200 grid place-items-center">
                  <Package size={20} className="text-ink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-900 truncate">Klasik Kartvizit</div>
                  <div className="text-xs text-ink-500 mt-0.5">CYP · 350 gr Kuşe Çift Yön Parlak Selefon · 2.000 Adet</div>
                  <div className="text-[11px] text-ink-500 mt-1">SKU: MK-KRT-CLS · Tasarım dosyası: kartvizit-final.pdf (yüklendi)</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ink-900 tabular-nums">₺ 580,00</div>
                  <div className="text-[11px] text-ink-500">2.000 × 0.29 ₺</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-paper-200 space-y-1.5 text-sm">
              <RowKV label="Ara Toplam" value="₺ 580,00" />
              <RowKV label="Kargo" value="₺ 0,00 (1.500 ₺ üzeri ücretsiz)" />
              <RowKV label="İndirim (HOSGELDIN)" value="-₺ 58,00" muted />
              <RowKV label="KDV (%20 dahil)" value="₺ 87,00" muted />
              <RowKV label="Toplam" value="₺ 522,00" bold />
            </div>
          </Card>

          <Card title="Sipariş Durumu">
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStatus(s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    currentStatus === s.id
                      ? "bg-ink-900 text-paper-50 border-ink-900"
                      : "bg-paper-50 border-paper-200 text-ink-700 hover:border-ink-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Zaman çizelgesi */}
            <ol className="space-y-3">
              {STATUSES.slice(0, 3).map((s, i) => (
                <li key={s.id} className="flex items-start gap-3">
                  <span className="flex-none w-7 h-7 rounded-full bg-success text-paper-50 grid place-items-center">
                    <CheckCircle size={14} weight="bold" />
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-ink-900 text-sm">{s.label}</div>
                    <div className="text-[11px] text-ink-500">06.05.2026 · {12 + i}:00</div>
                  </div>
                </li>
              ))}
              <li className="flex items-start gap-3">
                <span className="flex-none w-7 h-7 rounded-full bg-paper-200 text-ink-500 grid place-items-center">
                  <ClockClockwise size={14} />
                </span>
                <div className="flex-1">
                  <div className="font-medium text-ink-500 text-sm">Kargoya Verildi (bekliyor)</div>
                </div>
              </li>
            </ol>
          </Card>

          <Card title="İç Not (sadece admin)">
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={3}
              placeholder="Üretim ekibine not, tasarım uyarısı, müşteriye iletilmeyecek bilgi..."
              className="w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
            />
            <button className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium bg-ink-900 text-paper-50 hover:bg-ink-700">
              <ChatCircle size={12} /> Not Ekle
            </button>
          </Card>
        </div>

        {/* Sağ: müşteri + adres + ödeme */}
        <div className="space-y-5">
          <Card title="Müşteri">
            <div className="font-semibold text-ink-900">Ali Yıldız</div>
            <div className="text-xs text-ink-500 mt-0.5">Bireysel · 3 sipariş geçmişi</div>
            <div className="mt-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-ink-700">
                <EnvelopeSimple size={12} /> ali@firma.com
              </div>
              <div className="flex items-center gap-2 text-ink-700">
                <Phone size={12} /> +90 532 000 00 00
              </div>
            </div>
          </Card>

          <Card title="Teslimat Adresi">
            <div className="text-sm text-ink-900 font-medium">Ali Yıldız</div>
            <div className="text-xs text-ink-700 mt-1 leading-relaxed flex items-start gap-2">
              <MapPin size={12} className="flex-none mt-0.5 text-ink-500" />
              <span>
                Yenişehir Mah. Atatürk Cad. No:42 Daire:5<br />
                Yenişehir / Mersin · 33060
              </span>
            </div>
          </Card>

          <Card title="Kargo">
            <div className="flex items-center gap-2 mb-2">
              <Truck size={16} className="text-brand-700" />
              <span className="font-semibold text-ink-900 text-sm">DHL</span>
            </div>
            <div className="text-xs text-ink-500">
              Takip No: <span className="font-mono text-ink-900">DHL2026A0123XJ</span>
            </div>
            <button className="mt-3 w-full text-center py-2 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100">
              Kargo Etiketi Yazdır
            </button>
          </Card>

          <Card title="Ödeme">
            <div className="text-sm text-ink-900">
              <strong>iyzico</strong> · 3D Secure
            </div>
            <div className="text-xs text-ink-500 mt-1">Mastercard **** 4567</div>
            <div className="mt-3 text-xs">
              <span className="inline-block px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">
                ✓ Tahsil Edildi · ₺ 522,00
              </span>
            </div>
          </Card>
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

function RowKV({ label, value, bold, muted }: { label: string; value: string; bold?: boolean; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? "font-bold text-ink-900 text-base pt-2 border-t border-paper-200 mt-2" : muted ? "text-ink-500" : "text-ink-700"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
