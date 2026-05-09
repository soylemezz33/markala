"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const baseVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

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
  return (
    <motion.div className={className} variants={baseVariants}>
      {children}
    </motion.div>
  );
}
