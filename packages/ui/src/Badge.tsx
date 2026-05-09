import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "brand" | "neutral" | "success" | "warning";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const tones: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-900",
  neutral: "bg-paper-100 text-ink-700",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
};

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
