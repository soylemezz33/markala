"use client";

import { motion } from "framer-motion";

const visualFrame =
  "relative w-full max-w-[440px] h-[440px] md:h-[480px] mx-auto";

/** Kartvizit slide'ı için 3 izole kart yığını (sarı zeminde beyaz kartlar) */
export function CardStackVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={visualFrame}
    >
      {/* Glow halka */}
      <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

      {/* Arka kart — koyu */}
      <div className="absolute bottom-12 right-4 w-64 md:w-72 aspect-[3/2] rounded-xl bg-ink-900 rotate-[-8deg] shadow-2xl p-5 flex flex-col">
        <span className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold">Kartvizit</span>
        <div className="mt-auto space-y-1.5">
          <div className="h-1 rounded bg-paper-50/30 w-3/4" />
          <div className="h-1 rounded bg-paper-50/20 w-2/3" />
        </div>
      </div>

      {/* Orta kart — beyaz */}
      <div className="absolute top-12 right-16 w-64 md:w-72 aspect-[3/2] rounded-xl bg-paper-50 rotate-[4deg] shadow-2xl p-5 flex flex-col">
        <div className="text-[10px] uppercase tracking-wider text-ink-500 font-semibold">Markanız</div>
        <div className="mt-auto">
          <div className="text-base md:text-lg font-semibold text-ink-900">Hasan Söylemez</div>
          <div className="text-xs text-ink-500 mt-0.5">Kurumsal İletişim Yöneticisi</div>
          <div className="mt-2 h-px bg-brand-500 w-12" />
          <div className="mt-2 text-[10px] font-mono text-ink-700">+90 324 433 33 51</div>
        </div>
      </div>

      {/* Ön kart — beyaz, logolu */}
      <motion.div
        animate={{ rotate: [-2, 0, -2], y: [0, -3, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-2 left-12 w-64 md:w-72 aspect-[3/2] rounded-xl bg-paper-50 shadow-2xl p-5 flex flex-col items-center justify-center"
      >
        <div className="text-2xl md:text-3xl font-semibold text-ink-900">
          markala<span className="ml-0.5 px-1.5 py-0.5 rounded bg-brand-500 text-ink-900 text-[10px] font-bold">.com.tr</span>
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-widest text-ink-500">Türkiye'nin matbaası</div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-4 right-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900 text-brand-400 text-xs font-medium shadow-xl"
      >
        Üretim bittiği gün kargoda
      </motion.div>
    </motion.div>
  );
}
