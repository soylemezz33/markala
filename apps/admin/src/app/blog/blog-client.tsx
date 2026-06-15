"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ImageUploader } from "@/components/image-uploader";
import { Plus, PencilSimple, Trash, CheckCircle, X } from "@phosphor-icons/react";
import type { BlogPostDto, BlogCategoryDto } from "@markala/api-client";
import { createPost, updatePost, removePost, publishPost } from "./actions";

interface Props {
  posts: BlogPostDto[];
  categories: BlogCategoryDto[];
}

type PostStatus = "draft" | "published" | "archived";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  authorName: string;
  tags: string;
  status: PostStatus;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  categoryId: "",
  authorName: "Hasan Söylemez",
  tags: "",
  status: "draft",
  coverImage: "",
  seoTitle: "",
  seoDescription: "",
};

function statusLabel(status: PostStatus): string {
  if (status === "published") return "Yayında";
  if (status === "archived") return "Arşiv";
  return "Taslak";
}

function statusClass(status: PostStatus): string {
  if (status === "published") return "bg-success/15 text-success";
  if (status === "archived") return "bg-paper-200 text-ink-500";
  return "bg-brand-100 text-brand-700";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    authorName: form.authorName.trim(),
    status: form.status,
    tags: form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };

  if (form.categoryId !== "") {
    payload.categoryId = form.categoryId;
  }

  if (form.coverImage.trim() !== "") {
    payload.coverImage = form.coverImage.trim();
  }

  if (form.seoTitle.trim() !== "") {
    payload.seoTitle = form.seoTitle.trim();
  }

  if (form.seoDescription.trim() !== "") {
    payload.seoDescription = form.seoDescription.trim();
  }

  return payload;
}

export function BlogClient({ posts, categories }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: BlogPostDto) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      content: p.content,
      categoryId: p.categoryId ?? "",
      authorName: p.authorName,
      tags: p.tags.join(", "),
      status: p.status,
      coverImage: p.coverImage ?? "",
      seoTitle: p.seoTitle ?? "",
      seoDescription: p.seoDescription ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleRemove(p: BlogPostDto) {
    if (!window.confirm(`"${p.title}" yazısını silmek istediğinizden emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await removePost(p.id);
        toast.success("Yazı silindi.");
      } catch {
        toast.error("Silme başarısız.");
      }
    });
  }

  function handlePublish(p: BlogPostDto) {
    startTransition(async () => {
      try {
        await publishPost(p.id);
        toast.success(`"${p.title}" yayına alındı.`);
      } catch {
        toast.error("Yayınlama başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updatePost(editingId, payload);
          toast.success("Yazı güncellendi.");
        } else {
          await createPost(payload);
          toast.success("Yazı oluşturuldu.");
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
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Blog Yazıları</h1>
          <p className="text-ink-500 text-sm mt-1">{posts.length} yazı</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Yazı
        </button>
      </header>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç yazı oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Yazıyı Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Başlık</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Yazar</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Görüntülenme</th>
                  <th className="text-left px-4 py-3 font-semibold hidden xl:table-cell">Tarih</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <span className="font-medium text-ink-900 line-clamp-1">{p.title}</span>
                      <span className="block text-[11px] text-ink-500 font-mono">{p.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">
                      {p.category?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden lg:table-cell">{p.authorName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusClass(p.status)}`}
                      >
                        {statusLabel(p.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-700 tabular-nums hidden lg:table-cell">
                      {p.viewCount}
                    </td>
                    <td className="px-4 py-3 text-ink-500 text-xs hidden xl:table-cell">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
                        >
                          <PencilSimple size={12} /> Düzenle
                        </button>
                        {p.status !== "published" && (
                          <button
                            onClick={() => handlePublish(p)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-success/10 hover:border-success/30 hover:text-success text-ink-700 disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Yayınla
                          </button>
                        )}
                        <button
                          onClick={() => handleRemove(p)}
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
          <div className="bg-paper-50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-paper-200 sticky top-0 bg-paper-50 z-10">
              <h2 className="text-lg font-semibold text-ink-900">
                {editingId ? "Yazı Düzenle" : "Yeni Yazı"}
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
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Başlık <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => {
                    setField("title", e.target.value);
                    if (!editingId) {
                      setField("slug", slugify(e.target.value));
                    }
                  }}
                  placeholder="Kartvizit Tasarımında 10 Kritik Detay"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Slug <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={form.slug}
                  onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="kartvizit-tasariminda-10-kritik-detay"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm font-mono text-ink-900 outline-none focus:border-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!!editingId && (
                  <p className="text-[11px] text-ink-500 mt-1">Slug düzenlenemez.</p>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Özet <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.excerpt}
                  onChange={(e) => setField("excerpt", e.target.value)}
                  placeholder="Yazının kısa özeti (liste ve kart görünümlerinde kullanılır)"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500 resize-none"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  İçerik <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={10}
                  value={form.content}
                  onChange={(e) => setField("content", e.target.value)}
                  placeholder="Markdown veya düz metin…"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500 resize-y font-mono"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Kategori</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="">— Kategori yok —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Yazar <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.authorName}
                  onChange={(e) => setField("authorName", e.target.value)}
                  placeholder="Hasan Söylemez"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Etiketler{" "}
                  <span className="font-normal text-ink-500">(virgülle ayır)</span>
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setField("tags", e.target.value)}
                  placeholder="kartvizit, tasarım, baskı"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">Durum</label>
                <select
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value as PostStatus)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="draft">Taslak</option>
                  <option value="published">Yayında</option>
                  <option value="archived">Arşiv</option>
                </select>
              </div>

              {/* Cover image */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Kapak Görseli{" "}
                  <span className="font-normal text-ink-500">(isteğe bağlı)</span>
                </label>
                <ImageUploader
                  value={form.coverImage}
                  onChange={(url) => setField("coverImage", url)}
                />
              </div>

              {/* SEO */}
              <div className="border-t border-paper-200 pt-4 space-y-4">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">SEO</p>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    SEO Başlığı{" "}
                    <span className="font-normal text-ink-500">(isteğe bağlı)</span>
                  </label>
                  <input
                    type="text"
                    value={form.seoTitle}
                    onChange={(e) => setField("seoTitle", e.target.value)}
                    placeholder="Kartvizit Tasarımında 10 Kritik Detay | Markala"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    SEO Açıklaması{" "}
                    <span className="font-normal text-ink-500">(isteğe bağlı)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.seoDescription}
                    onChange={(e) => setField("seoDescription", e.target.value)}
                    placeholder="Meta description (150-160 karakter önerilir)"
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              </div>

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
