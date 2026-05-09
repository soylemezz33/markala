import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@markala/ui";

/**
 * Sade buton — mouse magnetic efekti KALDIRILDI.
 * Sade hover (translateY + shadow). Modern e-ticaret standardı.
 *
 * NOT: Component adı geriye dönük uyum için "MagneticButton" kaldı,
 * davranışı düz button. Kademeli olarak çağrı yerlerinden Button'a geçilebilir.
 */
interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: "primary" | "ghost-cyan" | "ghost-light" | "secondary";
  size?: "md" | "lg";
}

const variants = {
  primary:
    "bg-brand-500 text-ink-900 hover:bg-brand-600 hover:-translate-y-0.5 hover:shadow-md",
  secondary:
    "bg-ink-900 text-paper-50 hover:bg-ink-700 hover:-translate-y-0.5 hover:shadow-md",
  "ghost-cyan":
    "bg-transparent text-ink-900 border border-ink-300 hover:bg-paper-100",
  "ghost-light":
    "bg-transparent text-ink-900 border border-paper-200 hover:bg-paper-100",
};

const sizes = {
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base",
};

export function MagneticButton({
  children,
  href,
  onClick,
  className,
  variant = "primary",
  size = "lg",
}: MagneticButtonProps) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-200 ease-out cursor-pointer select-none",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export { MagneticButton as Button };
