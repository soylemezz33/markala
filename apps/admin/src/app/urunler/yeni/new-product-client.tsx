"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, FloppyDisk } from "@phosphor-icons/react";
import { ImageGallery } from "@/components/image-uploader";
import { createProduct } from "./actions";

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  categories: CategoryRow[];
}

/** Türkçe karakterleri sadeleştirip slug üretir (backend SLUG_REGEX: a-z0-9 ve tire). */
function slugify(input: string): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  return input
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (c) => map[c] ?? c)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewProductClient({ categories }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(0);
  const [startingPrice, setStartingPrice] = useState<number>(0);
  const [productionTime, setProductionTime] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugTouched) setSlug(slugify(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slug || slugify(name);

    // Backend zorunlu alan kontrolü (kullanıcıya net hata; sahte başarı yok).
    if (name.trim().length < 2) return toast.error("Ürün adı en az 2 karakter olmalı.");
    if (!finalSlug) return toast.error("Geçerli bir slug girin.");
    if (!categoryId) return toast.error("Kategori seçin.");
    if (shortDesc.trim().length < 2) return toast.error("Kısa açıklama girin.");
    if (description.trim().length < 2) return toast.error("Tam açıklama girin.");
    if (!productionTime.trim()) return toast.error("Üretim süresi girin.");

    setSaving(true);
    (async () => {
      const res = await createProduct({
        name: name.trim(),
        slug: finalSlug,
        categoryId,
        shortDescription: shortDesc.trim(),
        description: description.trim(),
        basePrice: Number(basePrice) || 0,
        ...(Number(startingPrice) > 0 ? { startingPrice: Number(startingPrice) } : {}),
        productionTime: productionTime.trim(),
        images,
        bestseller,
        isActive,
      });
      if (res.ok) {
        toast.success("Ürün oluşturuldu.");
        router.push(`/urunler/${res.slug}`);
      } else {
        toast.error(res.error);
        setSaving(false);
      }
    })();
  }

  return (
    <AdminShell>
      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/urunler"
              className="p-2 rounded-md hover:bg-paper-100 text-ink-700"
              aria-label="Geri"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-ink-900">Yeni Ürün</h1>
              <p className="text-xs text-ink-500">Temel bilgileri girip oluşturun; fiyat yönetimi/SEO sonra düzenlenebilir.</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-ink-900 text-paper-50 px-4 py-2 rounded-md text-sm font-medium hover:bg-ink-700 disabled:opacity-60"
          >
            <FloppyDisk size={14} weight="bold" />
            {saving ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card title="Temel Bilgiler">
              <Field label="Ürün Adı *">
                <input
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Slug * (URL — yalnız küçük harf, rakam, tire)">
                <input
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="kartvizit-mat-selefon"
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>
              <Field label="Kısa Açıklama * (listelerde gösterilir)">
                <input
                  required
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Tam Açıklama *">
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className={inputCls + " font-mono text-xs"}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Kategori *">
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">— Seçiniz —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Üretim Süresi *">
                  <input
                    required
                    value={productionTime}
                    onChange={(e) => setProductionTime(e.target.value)}
                    placeholder="2-3 iş günü"
                    className={inputCls}
                  />
                </Field>
                <Field label="Taban Fiyat (TL) *">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className={inputCls + " tabular-nums"}
                  />
                </Field>
                <Field label="Başlangıç Fiyatı (TL) — opsiyonel">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className={inputCls + " tabular-nums"}
                  />
                </Field>
              </div>
            </Card>

          </div>

          <div className="space-y-5">
            <Card title="Yayın Durumu">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm font-medium text-ink-900">Yayında</span>
                <Toggle checked={isActive} onChange={setIsActive} />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer mt-3">
                <span className="text-sm font-medium text-ink-900">Çok Satan rozeti</span>
                <Toggle checked={bestseller} onChange={setBestseller} />
              </label>
            </Card>

            <Card title="Görseller">
              <ImageGallery value={images} onChange={setImages} />
            </Card>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-ink-700 uppercase tracking-wider mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
      <header className="px-5 py-3 border-b border-paper-200 bg-paper-100/40">
        <h2 className="font-semibold text-ink-900 text-sm">{title}</h2>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors flex-none ${
        checked ? "bg-brand-500" : "bg-paper-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
