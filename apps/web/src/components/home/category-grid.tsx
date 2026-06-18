import Link from "next/link";
import { Container } from "@markala/ui";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { getCategories } from "@/lib/catalog";
import { CategoryCard } from "@/components/category-card";
import { ScrollReveal, StaggerReveal, StaggerItem } from "@/components/ui/scroll-reveal";

export async function CategoryGrid() {
  // CANLI kategoriler (admin yönetir) — yeni eklenen kategori (örn. İş Güvenliği) burada görünür.
  const categories = await getCategories();
  return (
    <section className="relative py-16 md:py-24 bg-paper-100">
      <Container className="relative">
        <ScrollReveal className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <p className="text-sm text-brand-700 font-medium uppercase tracking-wider">Kataloğumuz</p>
            <h2 className="mt-2 text-display-lg font-serif text-ink-900">
              Tüm matbaa ve reklam ürünleri
            </h2>
          </div>
          <Link
            href="/urunler"
            className="hidden md:inline-flex items-center gap-1.5 text-sm text-ink-700 hover:text-ink-900 transition-colors"
          >
            {categories.length} kategori <ArrowUpRight size={16} />
          </Link>
        </ScrollReveal>

        <StaggerReveal className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5" step={0.05}>
          {categories.map((cat) => (
            <StaggerItem key={cat.slug}>
              <CategoryCard category={cat} surface="light" />
            </StaggerItem>
          ))}
        </StaggerReveal>
      </Container>
    </section>
  );
}
