"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Container, cn } from "@markala/ui";
import { House, Package, MapPin, ArrowsClockwise, User as UserIcon, SignOut, Receipt, Bell, Lock, Trash, ShieldCheck } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

const links = [
  { href: "/hesabim", label: "Hesap Özeti", icon: House },
  { href: "/hesabim/siparislerim", label: "Siparişlerim", icon: Package },
  { href: "/hesabim/tekrar-siparis", label: "Hızlı Tekrar Sipariş", icon: ArrowsClockwise },
  { href: "/hesabim/faturalarim", label: "Faturalarım", icon: Receipt },
  { href: "/hesabim/adreslerim", label: "Adreslerim", icon: MapPin },
  { href: "/hesabim/bilgilerim", label: "Bilgilerim", icon: UserIcon },
  { href: "/hesabim/sifre", label: "Şifre Değiştir", icon: Lock },
  { href: "/hesabim/bildirim", label: "Bildirim Tercihleri", icon: Bell },
  { href: "/hesabim/veri-yonetimi", label: "Veri Yönetimi (KVKK)", icon: ShieldCheck },
  { href: "/hesabim/hesap-sil", label: "Hesabı Sil (KVKK)", icon: Trash, danger: true },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (!user) router.replace("/giris");
  }, [user, router]);

  if (!user) return null;

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-10">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Hesabım</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">
            Merhaba, {user.fullName.split(" ")[0]}
          </h1>
          <p className="mt-2 text-ink-500 text-sm">{user.email}</p>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="grid lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <nav className="lg:sticky lg:top-24 p-2 bg-paper-50 border border-paper-200 rounded-xl">
              {links.map((l) => {
                const isActive = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-ink-900 text-paper-50"
                        : l.danger
                          ? "text-error/80 hover:bg-error/10 hover:text-error mt-2 border-t border-paper-200 pt-3"
                          : "text-ink-700 hover:bg-paper-100 hover:text-ink-900",
                    )}
                  >
                    <l.icon size={16} />
                    {l.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { logout(); router.replace("/"); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium text-ink-700 hover:bg-paper-100 hover:text-error mt-2 border-t border-paper-200 pt-3"
              >
                <SignOut size={16} />
                Çıkış Yap
              </button>
            </nav>
          </aside>

          <div className="lg:col-span-9">{children}</div>
        </div>
      </Container>
    </>
  );
}
