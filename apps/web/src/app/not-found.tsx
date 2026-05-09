import Link from "next/link";
import { Container } from "@markala/ui";
import {
  House, MagnifyingGlass, ArrowRight, Package,
  Question, ChatCircle,
} from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <Container className="py-16 md:py-24 max-w-3xl text-center">
      <div className="text-[140px] md:text-[200px] font-serif font-bold leading-none text-brand-500 select-none">
        404
      </div>
      <h1 className="mt-2 text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
        Sayfa bulunamadı
      </h1>
      <p className="mt-4 text-lg text-ink-700 max-w-xl mx-auto">
        Aradığın sayfa kaldırılmış veya adres yanlış olabilir. Aşağıdan devam
        edebilirsin.
      </p>

      <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        <QuickLink
          icon={House}
          title="Anasayfa"
          desc="Tüm kategoriler"
          href="/"
        />
        <QuickLink
          icon={Package}
          title="Ürünler"
          desc="30+ matbaa ürünü"
          href="/urunler"
        />
        <QuickLink
          icon={Question}
          title="Yardım"
          desc="Sıkça sorulanlar"
          href="/yardim"
        />
      </div>

      <div className="mt-10 inline-flex items-center gap-3 px-5 py-4 bg-paper-100 border border-paper-200 rounded-xl">
        <ChatCircle size={20} className="text-brand-700" weight="fill" />
        <div className="text-left text-sm">
          <div className="text-ink-900 font-medium">Hâlâ aradığını bulamadıysan</div>
          <Link
            href="/iletisim"
            className="text-brand-700 hover:text-ink-900 font-medium inline-flex items-center gap-1"
          >
            İletişime geç <ArrowRight size={11} weight="bold" />
          </Link>
        </div>
      </div>
    </Container>
  );
}

function QuickLink({
  icon: Icon,
  title,
  desc,
  href,
}: {
  icon: typeof House;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group p-5 bg-paper-50 border border-paper-200 rounded-xl hover:border-ink-300 hover:shadow-md transition-all text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 grid place-items-center mb-3">
        <Icon size={20} weight="fill" />
      </div>
      <div className="font-semibold text-ink-900 text-sm">{title}</div>
      <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs text-brand-700 font-medium group-hover:gap-2 transition-all">
        Git <ArrowRight size={11} weight="bold" />
      </div>
    </Link>
  );
}
