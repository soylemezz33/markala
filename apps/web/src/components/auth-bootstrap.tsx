"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * App açılışında bir kez refresh cookie ile oturumu canlandırır.
 * Görsel çıktı yok — sadece auth-store.bootstrap() tetikler.
 */
export function AuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  return null;
}
