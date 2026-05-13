"use client";

import { motion } from "framer-motion";

const visualFrame =
  "relative w-full max-w-[440px] h-[440px] md:h-[480px] mx-auto";

/** Kupa slide'ı için 3D kupa illustrasyon */
export function MugVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`${visualFrame} flex items-center justify-center`}
    >
      {/* Yer gölgesi */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-72 h-6 rounded-full bg-ink-900/15 blur-xl" />

      <motion.div
        animate={{ rotate: [-2, 2, -2], y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        {/* Kulp */}
        <div className="absolute top-12 right-[-32px] w-16 h-24 border-[12px] border-paper-50 rounded-r-full" style={{ borderLeftColor: "transparent" }} />

        {/* Gövde */}
        <div className="relative w-56 h-64 rounded-b-3xl rounded-t-md bg-paper-50 shadow-2xl border border-paper-200 overflow-hidden">
          {/* Üst ağız ellipsi */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-paper-100 to-transparent" />
          <div className="absolute top-2 left-3 right-3 h-4 rounded-full bg-ink-900/15" />

          {/* Logo gövde üzerinde */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 text-center">
            <div className="text-3xl font-bold text-ink-900 tracking-tight">
              markala
              <div className="inline-block ml-0.5 px-1.5 py-0.5 rounded bg-brand-500 text-[9px] font-bold align-middle">.com.tr</div>
            </div>
            <div className="mt-2 text-[10px] uppercase tracking-widest text-ink-500">Kurumsal hediye</div>
          </div>

          {/* Alt taban gölge */}
          <div className="absolute bottom-0 left-4 right-4 h-2 bg-ink-900/10 rounded-full" />
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-8 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500 text-ink-900 text-xs font-semibold shadow-xl"
      >
        Sublime baskı
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="absolute bottom-12 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-50 text-ink-900 text-xs font-medium shadow-xl border border-paper-200"
      >
        330 ml · seramik
      </motion.div>
    </motion.div>
  );
}
