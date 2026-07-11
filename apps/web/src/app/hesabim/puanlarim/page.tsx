"use client";

import { useEffect, useState } from "react";
import { Coins, ArrowUp, ArrowDown, Gift } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { formatDate } from "@/lib/format";

type LoyaltyMe = Awaited<ReturnType<typeof apiClient.loyalty.me>>;

export default function LoyaltyPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [data, setData] = useState<LoyaltyMe | null>(null); // null = yükleniyor
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isBootstrapping || !user) return;
    let cancelled = false;
    setData(null);
    setError(false);
    withRefresh(() => apiClient.loyalty.me())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isBootstrapping]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Coins size={24} weight="bold" className="text-brand-700" />
          Puanlarım
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Her siparişte puan kazanın, sonraki alışverişlerinizde indirim olarak kullanın.
        </p>
      </header>

      {data === null && !error ? (
        <div className="h-28 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />
      ) : error ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <h3 className="font-semibold text-ink-900 text-lg">Puanlar yüklenemedi</h3>
          <p className="mt-2 text-sm text-ink-500">Bağlantı sorunu olabilir, tekrar deneyin.</p>
        </div>
      ) : data && !data.enabled ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-brand-100 text-brand-700 mb-4">
            <Gift size={28} weight="regular" />
          </div>
          <h3 className="font-semibold text-ink-900 text-lg">Puan programı yakında</h3>
          <p className="mt-2 text-sm text-ink-500">
            Sadakat programımız çok yakında aktif olacak. Kazandığınız puanlar burada görünecek.
          </p>
        </div>
      ) : data ? (
        <>
          {/* Bakiye kartı */}
          <div className="p-6 md:p-8 bg-ink-900 text-paper-50 rounded-xl">
            <div className="text-sm text-paper-300">Kullanılabilir puan</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-semibold">
                {data.balance.toLocaleString("tr-TR")}
              </span>
              <span className="text-paper-300">puan</span>
            </div>
            <p className="mt-3 text-sm text-paper-300">
              ≈{" "}
              {(data.balance / data.redeemPerTl).toLocaleString("tr-TR", {
                maximumFractionDigits: 2,
              })}{" "}
              TL indirim değerinde · {data.redeemPerTl} puan = 1 TL
            </p>
          </div>

          {/* Geçmiş */}
          <section>
            <h3 className="text-sm font-semibold text-ink-800 uppercase tracking-wider mb-3">
              Puan geçmişi
            </h3>
            {data.history.length === 0 ? (
              <div className="text-center py-12 bg-paper-50 border border-paper-200 rounded-xl">
                <p className="text-sm text-ink-500">
                  Henüz puan hareketiniz yok. İlk siparişinizde puan kazanmaya başlayın.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-paper-200 bg-paper-50 border border-paper-200 rounded-xl overflow-hidden">
                {data.history.map((h) => {
                  const isEarn = h.kind === "earn" || (h.kind === "adjust" && h.points >= 0);
                  return (
                    <li key={h.id} className="flex items-center gap-4 px-4 py-3.5">
                      <div
                        className={`w-9 h-9 rounded-full grid place-items-center flex-none ${
                          isEarn ? "bg-success/10 text-success" : "bg-brand-100 text-brand-700"
                        }`}
                      >
                        {isEarn ? (
                          <ArrowUp size={16} weight="bold" />
                        ) : (
                          <ArrowDown size={16} weight="bold" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink-900 truncate">
                          {h.description}
                        </div>
                        <div className="text-xs text-ink-500">{formatDate(h.createdAt)}</div>
                      </div>
                      <div
                        className={`text-sm font-semibold ${isEarn ? "text-success" : "text-ink-700"}`}
                      >
                        {isEarn ? "+" : "−"}
                        {h.points.toLocaleString("tr-TR")}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
