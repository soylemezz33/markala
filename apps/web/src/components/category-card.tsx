import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Price } from "@markala/ui";
import type { Category } from "@markala/types";
import { formatPriceDisplay } from "@/lib/format";

interface CategoryCardProps {
  category: Category;
  /** Geriye dönük uyum için tutuluyor — artık her iki değer aynı görünür. */
  surface?: "light" | "dark";
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/kategori/${category.slug}`}
      className="group relative flex flex-col rounded-lg overflow-hidden bg-paper-50 border border-paper-200 transition-all duration-200 ease-out hover:border-ink-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-100">
        <Image
          src={category.imageUrl}
          alt={category.name}
          fill
          sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/40 via-transparent to-transparent" />
        <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-paper-50/90 text-ink-900 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight size={16} weight="bold" />
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-ink-900">{category.name}</h3>
        <div className="mt-1 flex items-baseline gap-1.5 text-sm text-ink-500">
          {category.startingPrice > 0 ? (
            <>
              <Price amount={category.startingPrice} size="sm" className="text-ink-900" />
              <span>'den</span>
            </>
          ) : (
            // Fiyatsız kategoride "Teklif Al" yazmak anasayfa dolusu kartta
            // "fiyat gizliyorlar" algısı yaratıyordu — nötr keşif metni.
            <span className="text-sm font-medium text-ink-700">Ürünleri incele</span>
          )}
        </div>
      </div>
    </Link>
  );
}
