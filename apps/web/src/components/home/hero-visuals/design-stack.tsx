"use client";

import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";

/** Tüm hero visual'ları için ortak container — eşit boyut, center hizalı */
const visualFrame =
  "relative w-full max-w-[440px] h-[440px] md:h-[480px] mx-auto";

/** "Tasarım desteği" slide'ı için 3 katlı kart yığını (BRIEF / TASLAK / ONAYLANDI) */
export function DesignStackVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={visualFrame}
    >
      {/* Arka kart — krem, brief */}
      <div className="absolute top-0 right-0 w-64 md:w-72 aspect-[3/4] rounded-2xl bg-paper-100 rotate-[8deg] shadow-2xl">
        <div className="p-5 h-full flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Brief</span>
          <div className="mt-3 space-y-1.5">
            <div className="h-1.5 rounded bg-ink-700/20 w-full" />
            <div className="h-1.5 rounded bg-ink-700/20 w-5/6" />
            <div className="h-1.5 rounded bg-ink-700/20 w-4/6" />
            <div className="h-1.5 rounded bg-ink-700/20 w-full" />
            <div className="h-1.5 rounded bg-ink-700/20 w-3/6" />
          </div>
          <div className="mt-auto"><div className="h-2 rounded bg-brand-500/40 w-1/3" /></div>
        </div>
      </div>

      {/* Orta kart — beyaz, taslak v1 */}
      <div className="absolute top-8 right-10 w-64 md:w-72 aspect-[3/4] rounded-2xl bg-paper-50 -rotate-[3deg] shadow-2xl">
        <div className="p-5 h-full flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Taslak v1</span>
          <div className="mt-3 flex-1 grid grid-cols-3 gap-2">
            <div className="bg-paper-100 rounded" />
            <div className="bg-brand-500 rounded" />
            <div className="bg-paper-100 rounded" />
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="h-2 rounded bg-ink-900/10 w-full" />
            <div className="h-2 rounded bg-ink-900/10 w-2/3" />
          </div>
        </div>
      </div>

      {/* Ön kart — sarı, onaylandı */}
      <motion.div
        animate={{ rotate: [6, 4, 6], y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-20 w-64 md:w-72 aspect-[3/4] rounded-2xl bg-brand-500 shadow-2xl"
      >
        <div className="p-5 h-full flex flex-col text-ink-900">
          <span className="text-[10px] uppercase tracking-wider font-semibold">Onaylandı ✓</span>
          <div className="mt-4 text-2xl md:text-3xl font-bold leading-tight">Markanız<br />ön plana</div>
          <div className="mt-2 text-xs opacity-70">Premium kartvizit · 1.000 adet</div>
          <div className="mt-auto flex items-center justify-between">
            <div className="text-xs font-mono opacity-80">markala.com.tr</div>
            <span className="w-5 h-5 rounded-full bg-ink-900 text-brand-500 grid place-items-center text-[10px] font-bold">✓</span>
          </div>
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-2 left-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper-50 text-ink-900 text-xs font-medium shadow-xl"
      >
        <Sparkle size={14} weight="fill" className="text-brand-500" />
        Ortalama 18 saatte tamamlanır
      </motion.div>
    </motion.div>
  );
}
