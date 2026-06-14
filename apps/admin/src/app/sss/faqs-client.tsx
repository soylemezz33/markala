"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import type { FaqDto } from "@markala/api-client";
import { createFaq, updateFaq, removeFaq } from "./actions";

interface Props {
  faqs: FaqDto[];
}

type FaqCategory = "tasarim" | "urun" | "kargo" | "odeme" | "iade" | "genel";

interface FormState {
  question: string;
  answer: string;
  category: FaqCategory;
  productSlug: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  question: "",
  answer: "",
  category: "genel",
  productSlug: "",
  sortOrder: "0",
  isActive: true,
};

const CATEGORY_LABELS: Record<FaqCategory, string> = {
  tasarim: "Tasarım",
  urun: "Ürün",
  kargo: "Kargo",
  odeme: "Ödeme",
  iade: "İade",
  genel: "Genel",
};

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    question: form.question.trim(),
    answer: form.answer.trim(),
    category: form.category,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };

  if (form.productSlug.trim() !== "") {
    payload.productSlug = form.productSlug.trim();
  }

  return payload;
}

export function FaqsClient({ faqs: initialFaqs }: Props) {
  const [faqs] = useState<FaqDto[]>(initialFaqs);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categoryFilter, setCategoryFilter] = useState<string>("__all__");
  const [isPending, startTransition] = useTransition();

  const visibleFaqs =
    categoryFilter === "__all__"
      ? faqs
      : faqs.filter((f) => f.category === categoryFilter);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(f: FaqDto) {
    setEditingId(f.id);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category as FaqCategory,
      productSlug: f.productSlug ?? "",
      sortOrder: String(f.sortOrder),
      isActive: f.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleDelete(f: FaqDto) {
    if (!window.confirm(`"${f.question}" sorusunu silmek istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await removeFaq(f.id);
        toast.success("Soru silindi.");
      } catch {
        toast.error("Silme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateFaq(editingId, payload);
          toast.success("Soru güncellendi.");
        } else {
          await createFaq(payload);
          toast.success("Soru oluşturuldu.");
        }
        closeModal();
      } catch {
        toast.error(editingId ? "Güncelleme başarısız." : "Oluşturma başarısız.");
      }
    });
  }

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">SSS Yönetimi</h1>
          <p className="text-ink-500 text-sm mt-1">{faqs.length} soru</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Soru
        </button>
      </header>

      {/* Category filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["__all__", "tasarim", "urun", "kargo", "odeme", "iade", "genel"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              categoryFilter === cat
                ? "bg-brand-500 border-brand-500 text-ink-900"
                : "bg-paper-50 border-paper-200 text-ink-700 hover:bg-paper-100"
            }`}
          >
            {cat === "__all__" ? "Tümü" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Table */}
      {visibleFaqs.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">
            {categoryFilter === "__all__" ? "Henüz hiç soru oluşturulmamış." : "Bu kategoride soru bulunamadı."}
          </p>
          {categoryFilter === "__all__" && (
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus size={16} weight="bold" /> İlk Soruyu Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Soru</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Bağlı Ürün</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {visibleFaqs.map((f) => (
                  <tr key={f.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900 line-clamp-1 max-w-xs block">{f.question}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                      {CATEGORY_LABELS[f.category as FaqCategory] ?? f.category}
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                      {f.productSlug ?? <span className="text-ink-400">Genel</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          f.isActive
                            ? "bg-success/15 text-success"
                            : "bg-paper-200 text-ink-500"
                        }`}
                      >
                        {f.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(f)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
                        >
                          <PencilSimple size={12} /> Düzenle
                        </button>
                        <button
                          onClick={() => handleDelete(f)}
                          disabled={isPending}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                        >
                          <Trash size={12} /> Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Soruyu Düzenle" : "Yeni Soru"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 -mr-1.5 rounded hover:bg-paper-100 text-ink-500"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Question */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Soru <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.question}
                  onChange={(e) => setField("question", e.target.value)}
                  placeholder="Tasarım dosyamı hangi formatta göndermeliyim?"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Yanıt <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.answer}
                  onChange={(e) => setField("answer", e.target.value)}
                  placeholder="PDF veya Adobe Illustrator (AI) formatında gönderebilirsiniz."
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500 resize-y"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Kategori <span className="text-error">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value as FaqCategory)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="tasarim">Tasarım</option>
                  <option value="urun">Ürün</option>
                  <option value="kargo">Kargo</option>
                  <option value="odeme">Ödeme</option>
                  <option value="iade">İade</option>
                  <option value="genel">Genel</option>
                </select>
              </div>

              {/* Product slug */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Bağlı Ürün Slug{" "}
                  <span className="font-normal text-ink-500">(boş = genel)</span>
                </label>
                <input
                  type="text"
                  value={form.productSlug}
                  onChange={(e) => setField("productSlug", e.target.value)}
                  placeholder="klasik-kartvizit"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Sıra{" "}
                  <span className="font-normal text-ink-500">(küçük = önce)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.sortOrder}
                  onChange={(e) => setField("sortOrder", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* isActive */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                />
                <span className="text-sm text-ink-900 font-medium">Soru aktif</span>
              </label>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-paper-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border border-paper-200 hover:bg-paper-100 text-ink-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-500 hover:bg-brand-600 text-ink-900 disabled:opacity-60"
                >
                  {isPending ? "Kaydediliyor…" : editingId ? "Güncelle" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
