"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, Trash, ShoppingBagOpen, ArrowRight, Plus, Minus } from "@phosphor-icons/react";
import { Button, Price } from "@markala/ui";
import { useCartStore } from "@/lib/cart-store";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

export function CartDrawer() {
  const { items, isOpen, close, removeItem, updateQuantity, subtotal, itemCount } = useCartStore();

  // Body scroll lock — sadece açılışta set, kapanışta restore (race condition önleme)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Escape key → drawer kapat (WCAG 2.1.2)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
          initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
            aria-hidden="true"
            className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-50"
          />
          <motion.aside
          initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 40, mass: 1.0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-drawer-title"
            data-testid="cart-drawer"
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper-50 z-50 flex flex-col shadow-2xl"
          >
            <header className="flex items-center justify-between p-5 border-b border-paper-200">
              <div className="flex items-center gap-2">
                <ShoppingBagOpen size={20} weight="regular" className="text-ink-900" />
                <h2 id="cart-drawer-title" className="font-medium text-ink-900">
                  Sepetim {itemCount() > 0 && <span className="text-ink-500">({itemCount()})</span>}
                </h2>
              </div>
              <button
          onClick={close}
                className="w-11 h-11 grid place-items-center rounded hover:bg-paper-100 active:scale-[0.97] active:bg-paper-100 text-ink-700 tap-target"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </header>

            {items.length === 0 ? (
              <EmptyCart onClose={close} />
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                  {items.map((item) => (
                    <article key={item.id} className="flex gap-3">
                      <Link
          href={`/urun/${item.productSlug}`}
                        onClick={close}
                        className="relative w-20 h-20 rounded-md bg-paper-100 overflow-hidden flex-none"
                      >
                        <Image src={item.productImage} alt={item.productName} fill
              sizes="80px" className="object-cover"/>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
          href={`/urun/${item.productSlug}`}
                          onClick={close}
                          className="font-medium text-ink-900 text-sm leading-snug hover:underline line-clamp-2"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-xs text-ink-500 line-clamp-2">{item.configuration.summary}</p>
                        {item.configuration.uploadedFileName && (
                          <p className="mt-1 text-xs text-success">📎 {item.configuration.uploadedFileName}</p>
                        )}
                        {item.configuration.needsDesign && (
                          <p className="mt-1 text-xs text-brand-700">✦ Tasarım desteği isteniyor</p>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <QtyControl
          value={item.quantity}
                            onChange={(n) => updateQuantity(item.id, n)}
                          />
                          <Price amount={item.configuration.totalPrice * item.quantity} className="text-ink-900" />
                        </div>
                      </div>
                      <button
          onClick={() => removeItem(item.id)}
                        className="w-11 h-11 grid place-items-center text-ink-500 hover:text-error active:scale-[0.97] active:bg-paper-100 rounded self-start tap-target"
                        aria-label="Sil"
                      >
                        <Trash size={16} />
                      </button>
                    </article>
                  ))}
                </div>

                <footer className="border-t border-paper-200 p-5 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-500">Ara toplam</span>
                    <Price amount={subtotal()} size="lg" className="text-ink-900" />
                  </div>
                  <p className="text-xs text-ink-500">
                    Kargo ve KDV sipariş adımında hesaplanır.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/odeme"
                      onClick={() => {
                        track("begin_checkout", { currency: "TRY", value: subtotal(), items: itemCount() });
                        close();
                      }}
                    >
                      <Button size="lg" fullWidth>
                        Siparişe Devam Et <ArrowRight size={18} weight="bold" />
                      </Button>
                    </Link>
                    <Link href="/sepet" onClick={close}>
                      <Button variant="outline" size="md" fullWidth>
                        Sepetin tamamını gör
                      </Button>
                    </Link>
                  </div>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function QtyControl({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center border border-paper-200 rounded">
      <button
          onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="w-11 h-11 grid place-items-center text-ink-700 hover:bg-paper-100 active:scale-[0.97] active:bg-paper-100 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded-l tap-target"
        aria-label="Azalt"
      >
        <Minus size={14} />
      </button>
      <span className="w-10 text-center text-sm tabular-nums">{value}</span>
      <button
          onClick={() => onChange(value + 1)}
        className="w-11 h-11 grid place-items-center text-ink-700 hover:bg-paper-100 active:scale-[0.97] active:bg-paper-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 rounded-r tap-target"
        aria-label="Arttır"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function EmptyCart({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 grid place-items-center p-10 text-center">
      <div>
        <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
          <ShoppingBagOpen size={28} />
        </div>
        <h3 className="mt-5 font-serif text-xl text-ink-900">Sepetiniz şu an boş</h3>
        <p className="mt-2 text-sm text-ink-500 max-w-xs mx-auto">
          İhtiyaçlarınıza uygun ürünleri keşfetmek ister misiniz?
        </p>
        <Link href="/urunler" onClick={onClose}>
          <Button variant="outline" size="md" className="mt-5">
            Ürünleri Keşfet
          </Button>
        </Link>
      </div>
    </div>
  );
}
