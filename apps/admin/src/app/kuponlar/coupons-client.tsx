"use client";

import { useState, useTransition } from "react";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { Plus, PencilSimple, Prohibit, X } from "@phosphor-icons/react";
import type { CouponDto } from "@markala/api-client";
import { createCoupon, updateCoupon } from "./actions";

interface Props {
  coupons: CouponDto[];
}

type CouponType = "percentage" | "fixed_amount" | "free_shipping";

interface FormState {
  code: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxUses: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: "",
  type: "percentage",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

function typeLabel(type: CouponType): string {
  if (type === "percentage") return "Yüzde";
  if (type === "fixed_amount") return "Sabit Tutar";
  return "Ücretsiz Kargo";
}

function formatDiscount(c: CouponDto): string {
  if (c.type === "percentage") return `%${Number(c.value)}`;
  if (c.type === "fixed_amount") return `${Number(c.value)} ₺`;
  return "Ücretsiz Kargo";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function buildPayload(form: FormState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    code: form.code.trim().toUpperCase(),
    type: form.type,
    isActive: form.isActive,
  };

  if (form.type !== "free_shipping") {
    payload.value = Number(form.value) || 0;
  } else {
    payload.value = 0;
  }

  if (form.minOrderAmount !== "") {
    payload.minOrderAmount = Number(form.minOrderAmount);
  }

  if (form.maxUses !== "") {
    payload.maxUses = Number(form.maxUses);
  }

  if (form.validFrom !== "") {
    payload.validFrom = form.validFrom;
  }

  if (form.validUntil !== "") {
    payload.validUntil = form.validUntil;
  }

  return payload;
}

export function CouponsClient({ coupons }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(c: CouponDto) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value != null ? String(Number(c.value)) : "",
      minOrderAmount: c.minOrderAmount != null ? String(Number(c.minOrderAmount)) : "",
      maxUses: c.maxUses != null ? String(c.maxUses) : "",
      validFrom: formatDate(c.validFrom),
      validUntil: formatDate(c.validUntil),
      isActive: c.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleDeactivate(c: CouponDto) {
    startTransition(async () => {
      try {
        await updateCoupon(c.id, { isActive: false });
        toast.success(`"${c.code}" pasifleştirildi.`);
      } catch {
        toast.error("Pasifleştirme başarısız.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateCoupon(editingId, payload);
          toast.success("Kupon güncellendi.");
        } else {
          await createCoupon(payload);
          toast.success("Kupon oluşturuldu.");
        }
        closeModal();
      } catch {
        toast.error(editingId ? "Güncelleme başarısız." : "Oluşturma başarısız.");
      }
    });
  }

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const showValueField = form.type !== "free_shipping";
  const valueLabel = form.type === "percentage" ? "İndirim (%)" : "İndirim Tutarı (₺)";

  return (
    <AdminShell>
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900">Kuponlar</h1>
          <p className="text-ink-500 text-sm mt-1">{coupons.length} kupon</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus size={16} weight="bold" /> Yeni Kupon
        </button>
      </header>

      {/* Table */}
      {coupons.length === 0 ? (
        <div className="bg-paper-50 border border-paper-200 rounded-lg p-12 text-center">
          <p className="text-ink-500 text-sm">Henüz hiç kupon oluşturulmamış.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-ink-900 text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus size={16} weight="bold" /> İlk Kuponu Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-paper-50 border border-paper-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-paper-100/60 text-ink-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Kod</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Tür</th>
                  <th className="text-left px-4 py-3 font-semibold">İndirim</th>
                  <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Kullanım</th>
                  <th className="text-center px-4 py-3 font-semibold hidden lg:table-cell">Geçerlilik</th>
                  <th className="text-center px-4 py-3 font-semibold">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-200">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-paper-100/40">
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-ink-900 tracking-wide">{c.code}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-700 hidden md:table-cell">{typeLabel(c.type)}</td>
                    <td className="px-4 py-3 font-medium text-ink-900">{formatDiscount(c)}</td>
                    <td className="px-4 py-3 text-center text-ink-700 tabular-nums hidden lg:table-cell">
                      {c.usedCount} / {c.maxUses ?? "∞"}
                    </td>
                    <td className="px-4 py-3 text-center text-ink-700 hidden lg:table-cell text-xs">
                      {c.validFrom || c.validUntil
                        ? `${formatDate(c.validFrom) || "—"} – ${formatDate(c.validUntil) || "—"}`
                        : "Sürekli"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          c.isActive
                            ? "bg-success/15 text-success"
                            : "bg-paper-200 text-ink-500"
                        }`}
                      >
                        {c.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-paper-100 text-ink-700"
                        >
                          <PencilSimple size={12} /> Düzenle
                        </button>
                        {c.isActive && (
                          <button
                            onClick={() => handleDeactivate(c)}
                            disabled={isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-paper-200 hover:bg-error/10 hover:border-error/30 hover:text-error text-ink-700 disabled:opacity-50"
                          >
                            <Prohibit size={12} /> Pasifleştir
                          </button>
                        )}
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
                {editingId ? "Kupon Düzenle" : "Yeni Kupon"}
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
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Kupon Kodu <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={form.code}
                  onChange={(e) => setField("code", e.target.value.toUpperCase())}
                  placeholder="HOSGELDIN"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm font-mono uppercase text-ink-900 outline-none focus:border-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!!editingId && (
                  <p className="text-[11px] text-ink-500 mt-1">Kod düzenlenemez.</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">İndirim Türü</label>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value as CouponType)}
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed_amount">Sabit Tutar (₺)</option>
                  <option value="free_shipping">Ücretsiz Kargo</option>
                </select>
              </div>

              {/* Value */}
              {showValueField && (
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">{valueLabel}</label>
                  <input
                    type="number"
                    min={0}
                    step={form.type === "percentage" ? 1 : 0.01}
                    value={form.value}
                    onChange={(e) => setField("value", e.target.value)}
                    placeholder={form.type === "percentage" ? "10" : "50.00"}
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
              )}

              {/* Min order amount */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Min. Sepet Tutarı (₺){" "}
                  <span className="font-normal text-ink-500">(boş = yok)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.minOrderAmount}
                  onChange={(e) => setField("minOrderAmount", e.target.value)}
                  placeholder="100.00"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Max uses */}
              <div>
                <label className="block text-xs font-semibold text-ink-700 mb-1">
                  Maks. Kullanım{" "}
                  <span className="font-normal text-ink-500">(boş = sınırsız)</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.maxUses}
                  onChange={(e) => setField("maxUses", e.target.value)}
                  placeholder="500"
                  className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                />
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Başlangıç <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setField("validFrom", e.target.value)}
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-700 mb-1">
                    Bitiş <span className="font-normal text-ink-500">(boş = yok)</span>
                  </label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setField("validUntil", e.target.value)}
                    className="w-full px-3 py-2 bg-paper-50 border border-paper-200 rounded-lg text-sm text-ink-900 outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* isActive */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                  className="w-4 h-4 rounded border-paper-200 accent-brand-500"
                />
                <span className="text-sm text-ink-900 font-medium">Kupon aktif</span>
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
