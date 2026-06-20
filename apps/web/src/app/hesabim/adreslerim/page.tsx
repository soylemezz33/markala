"use client";

import { useEffect, useState } from "react";
import { Button } from "@markala/ui";
import {
  MapPin, Plus, PencilSimple, Trash, Buildings, User as UserIcon, Star, X,
} from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";
import { apiClient, withRefresh } from "@/lib/api";
import { IlIlceSelect } from "@/components/forms/il-ilce-select";
import { PhoneInput } from "@/components/forms/phone-input";
import type { Address } from "@markala/types";

type AddrType = "individual" | "corporate";
interface FormState {
  id?: string;
  label: string;
  type: AddrType;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  zipCode: string;
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  isDefault: boolean;
}
const emptyForm: FormState = {
  label: "", type: "individual", fullName: "", phone: "", city: "", district: "",
  fullAddress: "", zipCode: "", companyName: "", taxOffice: "", taxNumber: "", isDefault: false,
};

export default function AddressesPage() {
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await withRefresh(() => apiClient.users.listAddresses());
      setAddresses(data ?? []);
    } catch {
      setAddresses([]);
    }
  }

  useEffect(() => {
    if (isBootstrapping || !user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isBootstrapping]);

  function openNew() {
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }
  function openEdit(a: Address) {
    setForm({
      id: a.id,
      label: a.label,
      type: a.type === "corporate" ? "corporate" : "individual",
      fullName: a.fullName,
      phone: a.phone,
      city: a.city,
      district: a.district,
      fullAddress: a.fullAddress,
      zipCode: a.zipCode ?? "",
      companyName: a.companyName ?? "",
      taxOffice: a.taxOffice ?? "",
      taxNumber: a.taxNumber ?? "",
      isDefault: a.isDefault,
    });
    setError(null);
    setShowForm(true);
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.label.trim() || !form.fullName.trim() || form.phone.length < 7 || !form.city.trim() || !form.district.trim() || form.fullAddress.trim().length < 5) {
      return setError("Lütfen tüm zorunlu alanları doldurun.");
    }
    if (form.type === "corporate" && (!form.companyName.trim() || !form.taxNumber.trim())) {
      return setError("Kurumsal fatura adresi için firma adı ve vergi numarası zorunludur.");
    }
    const payload: Partial<Address> = {
      label: form.label.trim(),
      type: form.type,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      fullAddress: form.fullAddress.trim(),
      zipCode: form.zipCode.trim() || undefined,
      isDefault: form.isDefault,
      companyName: form.type === "corporate" ? form.companyName.trim() : null,
      taxOffice: form.type === "corporate" ? (form.taxOffice.trim() || null) : null,
      taxNumber: form.type === "corporate" ? form.taxNumber.trim() : null,
    };
    setSaving(true);
    try {
      if (form.id) await withRefresh(() => apiClient.users.updateAddress(form.id!, payload));
      else await withRefresh(() => apiClient.users.createAddress(payload));
      setShowForm(false);
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Adres kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    try {
      await withRefresh(() => apiClient.users.deleteAddress(id));
      await load();
    } catch {
      /* sessiz; bir sonraki load gercegi gosterir */
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-ink-900">Kayıtlı Adresler</h2>
          <p className="mt-1 text-sm text-ink-500">Bireysel veya kurumsal (fatura) adreslerinizi kaydedin; ödeme adımında otomatik dolsun.</p>
        </div>
        <Button variant="outline" size="md" onClick={openNew}>
          <Plus size={16} weight="bold" /> Yeni Adres Ekle
        </Button>
      </header>

      {addresses === null ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => <div key={i} className="h-44 bg-paper-100 border border-paper-200 rounded-xl animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
            <MapPin size={28} />
          </div>
          <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz adresiniz yok</h3>
          <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">Yukarıdaki “Yeni Adres Ekle” ile bireysel veya kurumsal adres ekleyin.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <article key={a.id} className="p-5 bg-paper-50 border border-paper-200 rounded-xl flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-paper-200">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-ink-900 truncate">{a.label}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${a.type === "corporate" ? "bg-brand-100 text-brand-900" : "bg-paper-200 text-ink-600"}`}>
                    {a.type === "corporate" ? <Buildings size={11} weight="bold" /> : <UserIcon size={11} weight="bold" />}
                    {a.type === "corporate" ? "Kurumsal" : "Bireysel"}
                  </span>
                  {a.isDefault && <span className="inline-flex items-center gap-1 text-[11px] text-warning font-semibold"><Star size={11} weight="fill" /> Varsayılan</span>}
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <button onClick={() => openEdit(a)} className="p-1.5 text-ink-500 hover:text-ink-900 rounded-md hover:bg-paper-100" aria-label="Düzenle"><PencilSimple size={16} /></button>
                  <button onClick={() => onDelete(a.id)} className="p-1.5 text-ink-500 hover:text-error rounded-md hover:bg-error/10" aria-label="Sil"><Trash size={16} /></button>
                </div>
              </div>
              <div className="text-sm space-y-0.5 text-ink-700">
                <p className="font-medium text-ink-900">{a.fullName}</p>
                {a.type === "corporate" && a.companyName && (
                  <p className="text-xs text-ink-500">{a.companyName}{a.taxNumber ? ` · VKN: ${a.taxNumber}` : ""}{a.taxOffice ? ` · ${a.taxOffice}` : ""}</p>
                )}
                <p className="text-ink-600">{a.fullAddress}</p>
                <p className="text-ink-500">{a.district} / {a.city}{a.zipCode ? ` · ${a.zipCode}` : ""}</p>
                <p className="text-ink-500">{a.phone}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg bg-paper-50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-paper-200 sticky top-0 bg-paper-50">
              <h3 className="font-semibold text-ink-900 text-lg">{form.id ? "Adresi Düzenle" : "Yeni Adres"}</h3>
              <button onClick={() => setShowForm(false)} className="w-10 h-10 grid place-items-center -mr-2 text-ink-500 hover:text-ink-900" aria-label="Kapat"><X size={20} /></button>
            </div>
            <form onSubmit={onSubmit} className="p-5 space-y-4">
              {/* Tip seçimi */}
              <div className="grid grid-cols-2 gap-2">
                {(["individual", "corporate"] as AddrType[]).map((t) => (
                  <button type="button" key={t} onClick={() => set("type", t)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${form.type === t ? "border-brand-500 bg-brand-50 text-brand-900" : "border-paper-200 bg-paper-100 text-ink-600 hover:border-ink-300"}`}>
                    {t === "individual" ? <UserIcon size={16} /> : <Buildings size={16} />}
                    {t === "individual" ? "Bireysel" : "Kurumsal (Fatura)"}
                  </button>
                ))}
              </div>

              <Input label="Adres Başlığı *" value={form.label} onChange={(v) => set("label", v)} placeholder="Ev, İş, Şube…" />

              {form.type === "corporate" && (
                <div className="space-y-4 p-3 bg-brand-50/50 border border-brand-100 rounded-lg">
                  <Input label="Firma Adı / Ünvan *" value={form.companyName} onChange={(v) => set("companyName", v)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Vergi No / TCKN *" value={form.taxNumber} onChange={(v) => set("taxNumber", v)} />
                    <Input label="Vergi Dairesi" value={form.taxOffice} onChange={(v) => set("taxOffice", v)} />
                  </div>
                </div>
              )}

              <Input label="Ad Soyad *" value={form.fullName} onChange={(v) => set("fullName", v)} />
              <PhoneInput
                value={form.phone}
                onChange={(v) => set("phone", v)}
                label="Telefon *"
                inputClassName="w-full px-3.5 py-2.5 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
              />
              <IlIlceSelect
                il={form.city}
                ilce={form.district}
                onIlChange={(v) => set("city", v)}
                onIlceChange={(v) => set("district", v)}
                required
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                ilLabel="İl *"
                ilceLabel="İlçe *"
                selectClassName="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30"
              />
              <Textarea label="Açık Adres *" value={form.fullAddress} onChange={(v) => set("fullAddress", v)} />
              <Input label="Posta Kodu" value={form.zipCode} onChange={(v) => set("zipCode", v)} />

              <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="rounded border-paper-300" />
                Varsayılan adres yap
              </label>

              {error && <div className="p-3 bg-error/10 border border-error/20 rounded-md text-sm text-error">{error}</div>}

              <div className="flex items-center gap-3 pt-1">
                <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor…" : form.id ? "Güncelle" : "Kaydet"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Vazgeç</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-1.5">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30" />
    </label>
  );
}
function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-900 mb-1.5">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
        className="w-full px-3.5 py-2.5 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 resize-none" />
    </label>
  );
}
