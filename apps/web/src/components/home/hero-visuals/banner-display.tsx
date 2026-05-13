"use client";

import { motion } from "framer-motion";

const visualFrame =
  "relative w-full max-w-[440px] h-[440px] md:h-[480px] mx-auto";

/** Branda/Afiş slide'ı için bina cephe + asılı banner */
export function BannerDisplayVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={visualFrame}
    >
      {/* Bina arkaplanı — şehir silüet */}
      <div className="absolute inset-0 flex items-end gap-1 opacity-20">
        <div className="flex-1 h-3/4 bg-paper-50 rounded-t-sm" />
        <div className="flex-1 h-full bg-paper-50 rounded-t-md" />
        <div className="flex-1 h-2/3 bg-paper-50 rounded-t-sm" />
        <div className="flex-1 h-4/5 bg-paper-50 rounded-t-md" />
      </div>

      {/* Asılı banner */}
      <motion.div
        animate={{ rotate: [-1, 1, -1], y: [0, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 left-1/2 -translate-x-1/2 w-72 md:w-80"
      >
        {/* İp/halka */}
        <div className="flex justify-between px-4 mb-1">
          <div className="w-3 h-3 rounded-full bg-ink-900" />
          <div className="w-3 h-3 rounded-full bg-ink-900" />
        </div>

        {/* Banner kendisi */}
        <div className="relative bg-brand-500 rounded-md shadow-2xl overflow-hidden aspect-[5/6]">
          {/* Üst alan — logo */}
          <div className="absolute top-6 left-0 right-0 text-center">
            <div className="text-xl font-bold text-ink-900">
              markala<span className="ml-0.5 px-1 py-0.5 rounded bg-ink-900 text-brand-500 text-[8px] font-bold">.com.tr</span>
            </div>
          </div>

          {/* Orta — büyük başlık */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 text-center">
            <div className="text-2xl md:text-3xl font-bold text-ink-900 leading-tight">
              AÇILIŞA<br />ÖZEL
            </div>
            <div className="mt-2 inline-block px-3 py-1 bg-ink-900 text-brand-400 text-xs font-bold rounded">
              %25 İNDİRİM
            </div>
          </div>

          {/* Alt — telefon */}
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="text-sm font-mono font-bold text-ink-900">0324 433 33 51</div>
          </div>
        </div>
      </motion.div>

      {/* Floating badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute bottom-8 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-paper-50 text-ink-900 text-xs font-semibold shadow-xl"
      >
        UV dayanıklı · 440 gr
      </motion.div>
    </motion.div>
  );
}
