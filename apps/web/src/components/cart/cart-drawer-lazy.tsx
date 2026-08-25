"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/cart-store";

// Chunk yalnız gerektiğinde iner; ssr:false — drawer SSR çıktısında zaten yoktu (kapalı).
const CartDrawerImpl = dynamic(() => import("./cart-drawer").then((m) => m.CartDrawer), {
  ssr: false,
});

/**
 * Sepet çekmecesini GEREKTİĞİNDE yükler (P2/TBT 2026-08-25): reklam inişi yapan (ve
 * Lighthouse ile ölçülen) ziyaretçinin sepeti boştur — drawer kodu + framer bağımlılığı
 * o oturumda hiç inmez. Sepette ürün olan ya da sepeti açan kullanıcıda hemen mount olur;
 * "Sepete Ekle" drawer'ı açtığı an chunk iner (açılış animasyonu zaten var, fark edilmez).
 */
export function CartDrawerLazy() {
  const isOpen = useCartStore((s) => s.isOpen);
  const hasItems = useCartStore((s) => s.items.length > 0);
  const [mount, setMount] = useState(false);
  useEffect(() => {
    if (isOpen || hasItems) setMount(true);
  }, [isOpen, hasItems]);
  return mount ? <CartDrawerImpl /> : null;
}
