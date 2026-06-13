import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Plus, PencilSimple, Eye, Storefront } from "@phosphor-icons/react/dist/ssr";
import { getAdminApi } from "@/lib/api";

export default async function CategoriesAdminPage() {
  const api = await getAdminApi();
  const categories = await api.categories.list(true);

  return (
    <AdminShell>
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Kategoriler</h1>
          <p className="text-ink-500 text-sm mt-1">Toplam {categories.length} kategori</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700">
          <Plus size={14} weight="bold" /> Yeni Kategori
        </button>
      </header>

      <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Kategori</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Slug</th>
                <th className="text-center px-4 py-3 font-semibold">Ürün</th>
                <th className="text-right px-4 py-3 font-semibold">Başlangıç ₺</th>
                <th className="text-right px-4 py-3 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {categories.map((c) => (
                <tr key={c.slug} className="hover:bg-paper-100/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-none w-9 h-9 rounded bg-paper-100 grid place-items-center text-ink-500">
                        <Storefront size={16} />
                      </div>
                      <div>
                        <div className="font-semibold text-ink-900">{c.name}</div>
                        <div className="text-[11px] text-ink-500 truncate max-w-[300px]">{c.shortDescription}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-500 hidden md:table-cell">{c.slug}</td>
                  <td className="px-4 py-3 text-center text-ink-700 tabular-nums">{c.productCount ?? 0}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{Number(c.startingPrice).toLocaleString("tr-TR")} ₺</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`https://markala.com.tr/kategori/${c.slug}`} target="_blank" className="p-1.5 rounded text-ink-500 hover:bg-paper-100"><Eye size={14} /></Link>
                      <button className="p-1.5 rounded text-ink-500 hover:bg-paper-100 hover:text-brand-700"><PencilSimple size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
