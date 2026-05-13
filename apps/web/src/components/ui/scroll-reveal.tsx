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

const reducedVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
};

/** prefers-reduced-motion aktifse animasyonu devre dışı bırak */
function useMotionVariants(): Variants {
  return useMemo(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return reducedVariants;
    }
    return baseVariants;
  }, []);
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
  const variants = useMotionVariants();
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Çocukları stagger ile bir bir reveal eder.
 * Her direkt çocuğa otomatik motion variant uygulanır.
 */
export function StaggerReveal({
  children,
  className,
  step = 0.08,
}: {
  children: ReactNode;
  className?: string;
  step?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: step, delayChildren: 0.05 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const variants = useMotionVariants();
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
