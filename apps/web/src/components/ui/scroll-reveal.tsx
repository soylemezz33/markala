"use client";

import { motion, type Variants } from "framer-motion";
import { useMemo, type ReactNode } from "react";

const baseVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

/** prefers-reduced-motion aktifse animasyonu tamamen atla (içerik anında görünür). */
function usePrefersReducedMotion(): boolean {
  return useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
}

interface ScrollRevealProps {
  children: ReactNode;
  /** Görünür hâle gelmeden önceki gecikme (s) */
  delay?: number;
  /** Sadece bir kez tetiklenir (varsayılan true) */
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "li";
}

export function ScrollReveal({
  children,
  delay = 0,
  once = true,
  className,
  as = "div",
}: ScrollRevealProps) {
  const MotionTag = motion[as];
  const reduced = usePrefersReducedMotion();
  const Tag = as as keyof JSX.IntrinsicElements;

  // Reduced-motion: hiç animasyon yok, içerik doğrudan render edilir.
  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={baseVariants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Bir grid/list için kapsayıcı. Eskiden parent→child framer-motion variant
 * propagation ile orkestre ediyordu; bu güvenilir DEĞİLDİ (çok çocuklu gridlerde
 * alt öğeler `opacity:0` takılı kalıp GÖRÜNMEZ oluyordu — ana sayfa kategori
 * bölümü bu yüzden boş çıkıyordu). Artık sade bir kapsayıcı; her `StaggerItem`
 * KENDİ viewport gözlemcisiyle bağımsız reveal eder → görünürlük garanti.
 * `step` geriye dönük uyumluluk için kabul edilir ama kullanılmaz.
 */
export function StaggerReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={baseVariants}
    >
      {children}
    </motion.div>
  );
}
