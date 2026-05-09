import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-paper-50 border border-paper-200 rounded-lg overflow-hidden",
        "transition-all duration-200 ease-out-expo",
        className,
      )}
      {...props}
    />
  );
}
