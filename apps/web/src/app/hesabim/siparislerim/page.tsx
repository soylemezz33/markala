"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, Price, cn } from "@markala/ui";
import { Package, ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate, orderStatusLabel } from "@/lib/format";
import type { Order, OrderStatus } from "@markala/types";

const statusToneClass: Record<string, string> = {
  "siparis-alindi": "bg-brand-100 text-brand-900",
  "tasarim-bekleniyor": "bg-warning/10 text-warning",
  "tasarim-onayindi": "bg-warning/10 text-warning",
  "uretimde": "bg-paper-100 text-ink-700",
  "kargoya-verildi": "bg-success/10 text-success",
  "teslim-edildi": "bg-success/10 text-success",
  "iptal-edildi": "bg-error/10 text-error",
};

// API Prisma enum'u underscore döndürebilir (tasarim_onayindi); UI hyphen kullanıyor.
const normStatus = (s: string): OrderStatus => s.replace(/_/g, "-") as OrderStatus;

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [orders, setOrders] = useState<Order[] | null>(null); // null = yükleniyor
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let cancelled = false;
    setOrders(null);
    setError(false);
    withRefresh(() => apiClient.orders.listMine())
      .then((data) => { if (!cancelled) setOrders(data ?? []); })
      .catch(() => { if (!cancelled) { setOrders([]); setError(true); } });
    return () => { cancelled = true; };
  }, [user, isBootstrapping]);

  // Yükleniyor (auth bootstrap veya fetch sürüyor)
  if (orders === null) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-40 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-paper-50 border border-paper-200 rounded-xl">
        <h2 className="font-semibold text-ink-900 text-lg">Siparişler yüklenemedi</h2>
        <p className="mt-2 text-sm text-ink-500">Bağlantı sorunu olabilir. Lütfen tekrar deneyin.</p>
        <Button className="mt-5" onClick={() => location.reload()}>
          <ArrowsClockwise size={16} weight="bold" /> Yenile
        </Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-paper-50 border border-paper-200 rounded-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
          <Package size={28} />
        </div>
        <h2 className="mt-5 font-semibold text-ink-900 text-lg">Henüz siparişiniz yok</h2>
        <p className="mt-2 text-sm text-ink-500">İlk siparişinize başlayın — tasarım desteği ücretsiz.</p>
        <Link href="/urunler"><Button className="mt-5">Ürünleri Keşfet <ArrowRight size={16} weight="bold" /></Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((o) => {
        const st = normStatus(o.status as unknown as string);
        return (
          <article key={o.id} className="p-5 md:p-6 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 transition-colors">
            <header className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-paper-200">
              <div>
                <Link href={`/hesabim/siparislerim/${o.id}`} className="font-mono font-semibold text-ink-900 hover:underline">
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-ink-500 mt-1">{formatDate(o.createdAt)}</p>
              </div>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", statusToneClass[st] ?? "bg-paper-100 text-ink-700")}>
                {orderStatusLabel(st)}
              </span>
            </header>

            <ul className="space-y-3">
              {o.items.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg bg-paper-100 overflow-hidden flex-none">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} fill sizes="64px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-ink-400"><Package size={20} /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900 text-sm">{item.productName}</p>
                    <p className="text-xs text-ink-500 line-clamp-1">{item.configurationSummary}</p>
                    <p className="text-xs text-ink-500 mt-0.5">x{item.quantity}</p>
                  </div>
                  <Price amount={item.lineTotal} className="text-ink-900 flex-none font-semibold" />
                </li>
              ))}
            </ul>

            <footer className="mt-4 pt-4 border-t border-paper-200 flex items-center justify-between">
              <span className="text-sm text-ink-500">{o.items.length} ürün</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-ink-500">Toplam:</span>
                <Price amount={o.total} size="lg" className="text-ink-900" />
                <Link href={`/hesabim/siparislerim/${o.id}`} className="text-brand-700 hover:text-brand-900">
                  <ArrowRight size={18} />
                </Link>
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
