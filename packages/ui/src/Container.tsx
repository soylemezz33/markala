import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mx-auto w-full max-w-content px-4 sm:px-6 md:px-10 lg:px-16", className)}
      {...props}
    />
  );
}
