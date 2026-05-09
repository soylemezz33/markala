import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type Tone = "default" | "muted" | "dark";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  spacing?: "sm" | "md" | "lg";
}

const tones: Record<Tone, string> = {
  default: "bg-paper-50 text-ink-900",
  muted: "bg-paper-100 text-ink-900",
  dark: "bg-ink-900 text-paper-50",
};

const spacings = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-24 md:py-32",
};

export function Section({ tone = "default", spacing = "md", className, ...props }: SectionProps) {
  return <section className={cn(tones[tone], spacings[spacing], className)} {...props} />;
}
