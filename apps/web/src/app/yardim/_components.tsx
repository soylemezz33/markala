import Link from "next/link";
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ChatCircle } from "@phosphor-icons/react/dist/ssr";
import {
  Package, FileText, User, Tag, CreditCard, Truck, ArrowsClockwise, Buildings,
} from "@phosphor-icons/react/dist/ssr";
import { HELP_CATEGORIES, type HelpCategory } from "@/lib/help-center";

/** Veri katmanındaki string ikon anahtarı → Phosphor bileşeni. */
export const CATEGORY_ICONS: Record<HelpCategory["icon"], Icon> = {
  package: Package,
  file: FileText,
  user: User,
  tag: Tag,
  card: CreditCard,
  truck: Truck,
  return: ArrowsClockwise,
  building: Buildings,
};

/** Kategori/makale sayfalarındaki sol kategori navigasyonu (bidolubaski deseni). */
export function HelpSidebar({ activeCategory }: { activeCategory?: string }) {
  return (
    <nav aria-label="Yardım kategorileri" className="lg:sticky lg:top-24">
      <h2 className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-3 px-3">
        Kategoriler
      </h2>
      <ul className="space-y-0.5">
        {HELP_CATEGORIES.map((c) => {
          const active = c.slug === activeCategory;
          return (
            <li key={c.slug}>
              <Link
                href={`/yardim/${c.slug}`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "block px-3 py-2 rounded-lg bg-brand-100 text-brand-700 text-sm font-semibold"
                    : "block px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-paper-100 hover:text-ink-900 transition-colors"
                }
              >
                {c.title}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/yardim/sss"
            className="block px-3 py-2 rounded-lg text-sm text-ink-700 hover:bg-paper-100 hover:text-ink-900 transition-colors"
          >
            Sıkça Sorulan Sorular
          </Link>
        </li>
      </ul>
    </nav>
  );
}

/** "Cevabınızı bulamadınız mı?" kutusu — makale ve kategori sayfası altı. */
export function HelpContactBox() {
  return (
    <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl flex items-start gap-3">
      <ChatCircle size={22} className="flex-none text-brand-700 mt-0.5" />
      <div>
        <div className="font-semibold text-ink-900 text-sm">Cevabınızı bulamadınız mı?</div>
        <p className="text-xs text-ink-500 mt-1">
          <Link href="/iletisim" className="text-brand-700 hover:underline font-medium">
            İletişim formundan
          </Link>{" "}
          ulaşın ya da{" "}
          <a href="https://wa.me/905319004102" className="text-brand-700 hover:underline font-medium">
            WhatsApp
          </a>{" "}
          ile yazın. Hafta içi 09:00-18:00 arası destek veriyoruz.
        </p>
      </div>
    </div>
  );
}

/** Makale liste satırı — kategori sayfaları ve ilgili makaleler için. */
export function ArticleLinkRow({ href, title, description }: { href: string; title: string; description?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-paper-100 group transition-colors"
    >
      <span>
        <span className="block text-sm text-ink-900 font-medium">{title}</span>
        {description && <span className="block text-xs text-ink-500 mt-0.5 line-clamp-1">{description}</span>}
      </span>
      <ArrowRight
        size={14}
        className="flex-none text-ink-500 group-hover:text-brand-700 group-hover:translate-x-1 transition-all"
      />
    </Link>
  );
}
