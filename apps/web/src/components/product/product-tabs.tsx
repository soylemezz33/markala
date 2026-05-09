"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@markala/ui";
import { Info, Wrench, FileArrowUp, ChatCircle } from "@phosphor-icons/react";

const tabs = [
  { id: "description", label: "Açıklama", icon: Info },
  { id: "tech", label: "Teknik Detaylar", icon: Wrench },
  { id: "files", label: "Dosya Hazırlama", icon: FileArrowUp },
  { id: "reviews", label: "Yorumlar", icon: ChatCircle },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductTabs({ description }: { description: string }) {
  const [active, setActive] = useState<TabId>("description");

  return (
    <div>
      {/* Tab nav */}
      <div className="border-b border-paper-200 flex gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-700",
              )}
            >
              <t.icon size={16} />
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="py-8"
        >
          {active === "description" && (
            <div className="prose-content">
              <p className="text-ink-700 leading-relaxed text-lg">{description}</p>
            </div>
          )}

          {active === "tech" && (
            <dl className="grid sm:grid-cols-2 gap-4">
              {[
                { k: "Üretim süresi", v: "1-3 iş günü" },
                { k: "Kâğıt çözünürlüğü", v: "300 DPI" },
                { k: "Renk profili", v: "CMYK" },
                { k: "Taşma payı", v: "3 mm" },
                { k: "Dosya formatı", v: "PDF, AI, PSD, JPG, PNG" },
                { k: "Maks. dosya boyutu", v: "200 MB" },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline justify-between p-4 bg-paper-100 rounded-lg border border-paper-200">
                  <dt className="text-sm text-ink-500">{row.k}</dt>
                  <dd className="text-sm font-medium text-ink-900">{row.v}</dd>
                </div>
              ))}
            </dl>
          )}

          {active === "files" && (
            <div className="space-y-4">
              <div className="p-5 bg-paper-100 border border-paper-200 rounded-lg">
                <h3 className="font-semibold text-ink-900 mb-2">📐 Dosya hazırlama önerileri</h3>
                <ul className="space-y-2 text-sm text-ink-700">
                  <li>• <strong>3 mm taşma payı</strong> bırakın — kesim hatasını önler</li>
                  <li>• <strong>CMYK</strong> renk profili kullanın — RGB baskıda renkler değişebilir</li>
                  <li>• <strong>300 DPI</strong> minimum çözünürlük</li>
                  <li>• Yazıları <strong>"outline" / "convert to curves"</strong> yapın</li>
                </ul>
              </div>
              <div className="p-5 bg-brand-50 border border-brand-200 rounded-lg">
                <h3 className="font-semibold text-ink-900">💡 Tasarımınız yok mu?</h3>
                <p className="mt-1 text-sm text-ink-700">
                  Konfigüratörde <strong>"Tasarım desteği istiyorum"</strong> seçeneğini açın — profesyonel grafik ekibimiz sizin için hazırlasın.
                </p>
              </div>
            </div>
          )}

          {active === "reviews" && (
            <div className="text-center py-12 bg-paper-100 border border-paper-200 rounded-lg">
              <ChatCircle size={40} className="mx-auto text-ink-300" />
              <h3 className="mt-4 font-semibold text-ink-900">Henüz yorum yok</h3>
              <p className="mt-2 text-sm text-ink-500">
                Bu ürünü ilk değerlendiren siz olun — sipariş verdikten sonra yorum yazabilirsiniz.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
