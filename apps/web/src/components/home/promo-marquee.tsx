"use client";

import { motion } from "framer-motion";
import { Sparkle, Truck, ShieldCheck, PaintBrush } from "@phosphor-icons/react";

const items = [
  { icon: Truck, text: "1.500 ₺ üzeri kargo ücretsiz" },
  { icon: PaintBrush, text: "Tasarım desteği ücretsiz" },
  { icon: Sparkle, text: "Üretim biter bitmez hızlı kargoya teslim" },
  { icon: ShieldCheck, text: "Hatalı baskıda %100 değişim garantisi" },
  { icon: Truck, text: "81 ile teslimat" },
  { icon: Sparkle, text: "İlk siparişe %10 indirim — kupon: HOSGELDIN" },
];

const repeated = [...items, ...items];

export function PromoMarquee() {
  return (
    <div className="relative bg-ink-900 text-paper-50 overflow-hidden border-b border-white/5">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-ink-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-ink-900 to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-12 py-2.5 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity }}
      >
        {repeated.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-medium text-paper-50/85"
          >
            <item.icon size={14} className="text-brand-400" weight="fill" />
            {item.text}
            <span className="w-1 h-1 rounded-full bg-paper-50/30 ml-12" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}
