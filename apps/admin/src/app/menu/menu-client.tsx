"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import {
  FloppyDisk,
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  ArrowCounterClockwise,
  MagnifyingGlass,
  Star,
  Info,
} from "@phosphor-icons/react";
import { DEFAULT_NAV, type NavCategory, type NavItem } from "./default-nav";
import { saveHeaderNav, searchProducts } from "./actions";

const inputCls =
  "w-full rounded-md border border-paper-200 bg-paper-50 px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-ink-300";

export function MenuClient({ initial, hasSaved }: { initial: NavCategory[]; hasSaved: boolean }) {
  const [nav, setNav] = useState<NavCategory[]>(initial);
  const [isPending, startTransition] = useTransition();

  // Öne çıkan ürün arama — aktif kategori indexi + sorgu/sonuç
  const [searchCat, setSearchCat] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ slug: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);

  function mutate(fn: (draft: NavCategory[]) => void) {
    setNav((cur) => {
      const d = structuredClone(cur);
      fn(d);
      return d;
    });
  }

  // --- Mutasyon yardımcıları (indeksler map'ten geldiği için non-null güvenli) ---
  const setCat = (ci: number, patch: Partial<NavCategory>) =>
    mutate((d) => {
      Object.assign(d[ci]!, patch);
    });
  const moveCat = (ci: number, dir: -1 | 1) =>
    mutate((d) => {
      const j = ci + dir;
      if (j < 0 || j >= d.length) return;
      const tmp = d[ci]!;
      d[ci] = d[j]!;
      d[j] = tmp;
    });
  const removeCat = (ci: number) =>
    mutate((d) => {
      d.splice(ci, 1);
    });
  const addCat = () =>
    mutate((d) => {
      d.push({ label: "Yeni Kategori", href: "/urunler", groups: [], featured: [] });
    });
  const addGroup = (ci: number) =>
    mutate((d) => {
      const c = d[ci]!;
      c.groups = c.groups ?? [];
      c.groups.push({ title: "Yeni Grup", items: [] });
    });
  const removeGroup = (ci: number, gi: number) =>
    mutate((d) => {
      d[ci]!.groups!.splice(gi, 1);
    });
  const setGroupTitle = (ci: number, gi: number, title: string) =>
    mutate((d) => {
      d[ci]!.groups![gi]!.title = title;
    });
  const addItem = (ci: number, gi: number) =>
    mutate((d) => {
      d[ci]!.groups![gi]!.items.push({ label: "", href: "" });
    });
  const removeItem = (ci: number, gi: number, ii: number) =>
    mutate((d) => {
      d[ci]!.groups![gi]!.items.splice(ii, 1);
    });
  const setItem = (ci: number, gi: number, ii: number, patch: Partial<NavItem>) =>
    mutate((d) => {
      Object.assign(d[ci]!.groups![gi]!.items[ii]!, patch);
    });
  const removeFeatured = (ci: number, fi: number) =>
    mutate((d) => {
      d[ci]!.featured!.splice(fi, 1);
    });
  const addFeatured = (ci: number, slug: string, name: string) =>
    mutate((d) => {
      const c = d[ci]!;
      c.featured = c.featured ?? [];
      if (c.featured.length < 3 && !c.featured.some((x) => x.slug === slug)) {
        c.featured.push({ slug, label: name, theme: "brand" });
      }
    });

  function handleSave() {
    startTransition(async () => {
      try {
        await saveHeaderNav(nav);
        toast.success("Menü kaydedildi. Storefront ~30 sn içinde güncellenir.");
      } catch {
        toast.error("Kayıt başarısız. Lütfen tekrar deneyin.");
      }
    });
  }

  function handleReset() {
    if (window.confirm("Menü fabrika varsayılanına dönsün mü? (Kaydedene kadar canlıya gitmez)")) {
      setNav(structuredClone(DEFAULT_NAV));
      toast.success("Varsayılan yüklendi — kaydetmeyi unutmayın.");
    }
  }

  async function runSearch(ci: number, q: string) {
    setSearchCat(ci);
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchProducts(q));
    } finally {
      setSearching(false);
    }
  }

  return (
    <AdminShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Header Menü</h1>
          <p className="text-ink-500 text-sm mt-1">
            Üst menü kategorileri, alt gruplar, bağlantılar ve mega-menü öne çıkan ürünleri.
            {!hasSaved && " (Şu an koddaki varsayılan menü gösteriliyor — kaydedince DB'ye geçer.)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-paper-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-paper-100"
          >
            <ArrowCounterClockwise size={15} /> Varsayılana Dön
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-paper-50 hover:bg-ink-700 disabled:opacity-60"
          >
            <FloppyDisk size={16} /> {isPending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </header>

      <div className="mb-4 flex items-start gap-2 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-[13px] text-ink-700">
        <Info size={16} className="mt-0.5 flex-none text-brand-700" />
        <span>
          Değişiklikler <b>Kaydet</b>'e basana kadar canlıya gitmez. Menü hem masaüstü mega-menüde
          hem mobil çekmecede kullanılır. Öne çıkan ürünler fiyatsız "İncele" kartı olarak görünür.
        </span>
      </div>

      <div className="space-y-4">
        {nav.map((cat, ci) => (
          <section key={ci} className="rounded-xl border border-paper-200 bg-paper-50 overflow-hidden">
            {/* Kategori başlık satırı */}
            <div className="flex flex-wrap items-center gap-2 border-b border-paper-200 bg-paper-100 px-3 py-2.5">
              <span className="text-[11px] font-bold text-ink-500 w-6 text-center">{ci + 1}</span>
              <input
                className={inputCls + " flex-1 min-w-[160px] font-semibold"}
                value={cat.label}
                onChange={(e) => setCat(ci, { label: e.target.value })}
                placeholder="Kategori adı"
              />
              <input
                className={inputCls + " flex-1 min-w-[140px]"}
                value={cat.href}
                onChange={(e) => setCat(ci, { href: e.target.value })}
                placeholder="/urunler"
              />
              <select
                className={inputCls + " w-28"}
                value={cat.highlight ?? ""}
                onChange={(e) =>
                  setCat(ci, {
                    highlight: (e.target.value || undefined) as NavCategory["highlight"],
                  })
                }
              >
                <option value="">Rozet yok</option>
                <option value="fire">🔥 Ateş</option>
                <option value="new">🆕 Yeni</option>
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveCat(ci, -1)}
                  disabled={ci === 0}
                  className="rounded-md p-1.5 text-ink-500 hover:bg-paper-200 disabled:opacity-30"
                  title="Yukarı"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() => moveCat(ci, 1)}
                  disabled={ci === nav.length - 1}
                  className="rounded-md p-1.5 text-ink-500 hover:bg-paper-200 disabled:opacity-30"
                  title="Aşağı"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  onClick={() =>
                    window.confirm(`"${cat.label}" kategorisi silinsin mi?`) && removeCat(ci)
                  }
                  className="rounded-md p-1.5 text-error hover:bg-error/10"
                  title="Kategoriyi sil"
                >
                  <Trash size={15} />
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-3 lg:grid-cols-[1.6fr_1fr]">
              {/* Sol: gruplar + bağlantılar */}
              <div className="space-y-3">
                {(cat.groups ?? []).map((g, gi) => (
                  <div key={gi} className="rounded-lg border border-paper-200 p-2.5">
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        className={inputCls + " flex-1 text-[12px] font-bold uppercase tracking-wide"}
                        value={g.title}
                        onChange={(e) => setGroupTitle(ci, gi, e.target.value)}
                        placeholder="Grup başlığı"
                      />
                      <button
                        onClick={() => removeGroup(ci, gi)}
                        className="rounded-md p-1.5 text-error hover:bg-error/10"
                        title="Grubu sil"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {g.items.map((it, ii) => (
                        <div key={ii} className="flex items-center gap-1.5">
                          <input
                            className={inputCls}
                            value={it.label}
                            onChange={(e) => setItem(ci, gi, ii, { label: e.target.value })}
                            placeholder="Bağlantı adı"
                          />
                          <input
                            className={inputCls + " w-40"}
                            value={it.href}
                            onChange={(e) => setItem(ci, gi, ii, { href: e.target.value })}
                            placeholder="/urun/..."
                          />
                          <input
                            className={inputCls + " w-24"}
                            value={it.badge ?? ""}
                            onChange={(e) =>
                              setItem(ci, gi, ii, { badge: e.target.value || undefined })
                            }
                            placeholder="rozet"
                          />
                          <button
                            onClick={() => removeItem(ci, gi, ii)}
                            className="rounded-md p-1.5 text-ink-400 hover:bg-error/10 hover:text-error"
                            title="Bağlantıyı sil"
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem(ci, gi)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-700 hover:text-brand-900"
                      >
                        <Plus size={13} /> Bağlantı ekle
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addGroup(ci)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-paper-300 px-3 py-1.5 text-[13px] font-medium text-ink-700 hover:bg-paper-100"
                >
                  <Plus size={14} /> Grup ekle
                </button>
              </div>

              {/* Sağ: öne çıkan ürünler */}
              <div className="rounded-lg border border-paper-200 bg-paper-100 p-2.5">
                <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-500">
                  <Star size={13} weight="fill" className="text-brand-600" /> Öne Çıkanlar (maks 3)
                </div>
                <div className="space-y-1.5">
                  {(cat.featured ?? []).map((f, fi) => (
                    <div
                      key={fi}
                      className="flex items-center gap-2 rounded-md border border-paper-200 bg-paper-50 px-2 py-1.5"
                    >
                      <span className="flex-1 text-[13px] text-ink-900 truncate" title={f.slug}>
                        {f.label}
                      </span>
                      <code className="text-[10px] text-ink-400 truncate max-w-[90px]">{f.slug}</code>
                      <button
                        onClick={() => removeFeatured(ci, fi)}
                        className="rounded p-1 text-ink-400 hover:bg-error/10 hover:text-error"
                        title="Kaldır"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {(cat.featured?.length ?? 0) < 3 && (
                  <div className="mt-2">
                    <div className="relative">
                      <MagnifyingGlass
                        size={14}
                        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-400"
                      />
                      <input
                        className={inputCls + " pl-7"}
                        value={searchCat === ci ? query : ""}
                        onChange={(e) => runSearch(ci, e.target.value)}
                        placeholder="Ürün ara (min 2 harf)…"
                      />
                    </div>
                    {searchCat === ci && query.trim().length >= 2 && (
                      <div className="mt-1 max-h-44 overflow-y-auto rounded-md border border-paper-200 bg-paper-50">
                        {searching ? (
                          <div className="px-2.5 py-2 text-[12px] text-ink-500">Aranıyor…</div>
                        ) : results.length === 0 ? (
                          <div className="px-2.5 py-2 text-[12px] text-ink-500">Sonuç yok.</div>
                        ) : (
                          results.map((r) => (
                            <button
                              key={r.slug}
                              onClick={() => {
                                addFeatured(ci, r.slug, r.name);
                                setQuery("");
                                setResults([]);
                              }}
                              className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] text-ink-700 hover:bg-paper-100"
                            >
                              <span className="truncate">{r.name}</span>
                              <Plus size={13} className="flex-none text-brand-700" />
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-2 text-[11px] text-ink-400">
                  Görsel /api/mockup'tan otomatik üretilir. İSG gibi ürün-slug'ı olmayan kategoride
                  boş bırakın.
                </p>
              </div>
            </div>
          </section>
        ))}

        <button
          onClick={addCat}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-paper-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-paper-100"
        >
          <Plus size={16} /> Kategori ekle
        </button>
      </div>
    </AdminShell>
  );
}
