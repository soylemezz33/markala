"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { toast } from "@/components/toast";
import { ArrowLeft, MagnifyingGlass, Plus, Trash, UserCircle, Package, Truck, CreditCard, Receipt, type Icon } from "@phosphor-icons/react";
import { kalemFiyatla, manuelSiparisOlustur, musteriAra, urunAra, urunDetay, type UrunSecenek } from "./actions";

/**
 * MANUEL SİPARİŞ FORMU (2026-09-16, Hasan: "yüz yüze iş aldık; panelde manuel sipariş ekle").
 *
 * Katalog ürünü seçilince sitedeki konfigüratörle AYNI seçenekler gelir (ölçü en/boy, malzeme,
 * ek işlem, adet kademesi…) ve fiyat SUNUCUDAKİ motorla hesaplanır (POST /orders/manuel/fiyatla) —
 * Hasan 14:01: "ölçü giremiyorum, otomatik hesaplamıyor, ek işlem seçemiyorum". Personel isterse
 * "Fiyatı elle gir" ile ezer; katalog dışı serbest kalem de girilebilir.
 */
type Urun = { id: string; name: string; slug: string; fiyat: number; pricingMode: string };
type UrunDetayi = { id: string; name: string; slug: string; pricingMode: string; options: UrunSecenek[] };
type Kalem = {
  productId?: string; productSlug?: string; productName: string; configurationSummary: string; quantity: number;
  unitPrice: number; lineTotal: number; needsDesignSupport: boolean;
  detay?: UrunDetayi | null; selections: Record<string, string>; fiyatElle: boolean; fiyatHata?: string | null; hesaplaniyor?: boolean;
};
type Musteri = { id: string; fullName: string; email: string; phone: string; accountType: string; companyName: string | null };

const round2 = (n: number) => Math.round(n * 100) / 100;
const tl = (n: number) => `₺ ${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const bosKalem = (): Kalem => ({ productName: "", configurationSummary: "", quantity: 1, unitPrice: 0, lineTotal: 0, needsDesignSupport: false, selections: {}, fiyatElle: false });

/** Sipariş özeti: satır toplamları (alan ürünlerinde 1 m² tabanı yüzünden birim×adet ≠ satır olabilir). */
function ozetHesapla(kalemler: Kalem[], indirim: number, kargo: number) {
  const subtotal = round2(kalemler.reduce((s, k) => s + (k.lineTotal || 0), 0));
  const discount = round2(Math.min(Math.max(0, indirim), subtotal));
  const shippingFee = round2(Math.max(0, kargo));
  const taxableGross = round2(subtotal - discount);
  const vat = round2(taxableGross - round2(taxableGross / 1.2));
  return { subtotal, discount, shippingFee, vat, total: round2(taxableGross + shippingFee) };
}

/** Sitedeki initSelections ile aynı: gruptaki varsayılan (rules.varsayilan) yoksa en düşük optionSort. */
function varsayilanSecimler(options: UrunSecenek[], pricingMode: string): Record<string, string> {
  const seen = new Map<string, { optionKey: string; optionSort: number; isaretli: boolean }>();
  for (const o of options) {
    const isaretli = (o.rules as { varsayilan?: boolean } | null)?.varsayilan === true;
    const m = seen.get(o.groupKey);
    if (!m || (isaretli && !m.isaretli) || (isaretli === m.isaretli && o.optionSort < m.optionSort)) seen.set(o.groupKey, { optionKey: o.optionKey, optionSort: o.optionSort, isaretli });
  }
  const s: Record<string, string> = {};
  for (const [g, v] of seen) s[g] = v.optionKey;
  if (pricingMode === "area") { s.en ??= "100"; s.boy ??= "100"; }
  return s;
}

const input = "w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-60";
const label = "block text-xs font-medium text-ink-700 mb-1";

function Kart({ baslik, ikon: Ikon, children }: { baslik: string; ikon: Icon; children: React.ReactNode }) {
  return (
    <section className="bg-paper-50 border border-paper-200 rounded-xl">
      <header className="px-4 py-3 border-b border-paper-200 flex items-center gap-2">
        <Ikon size={16} className="text-brand-700" />
        <h2 className="text-sm font-semibold text-ink-900">{baslik}</h2>
      </header>
      <div className="p-4 space-y-3">{children}</div>
    </section>
  );
}

/** Konfigüratör: sitedeki gruplar select olarak; alan ürününde en/boy girişi (adet grubu adet alanında). */
function Konfigurator({ k, fiyatElle, onSecim }: { k: Kalem; fiyatElle: boolean; onSecim: (groupKey: string, optionKey: string) => void }) {
  const d = k.detay; if (!d) return null;
  const isArea = d.pricingMode === "area";
  const gruplar = new Map<string, { label: string; role: string; sort: number; opts: UrunSecenek[] }>();
  for (const o of d.options) { const g = gruplar.get(o.groupKey) ?? { label: o.groupLabel, role: o.groupRole, sort: o.groupSort, opts: [] }; g.opts.push(o); gruplar.set(o.groupKey, g); }
  const sirali = [...gruplar.entries()].sort((a, b) => a[1].sort - b[1].sort).filter(([key]) => !(isArea && key === "adet"));
  return (
    <div className="rounded-md bg-paper-100/60 border border-paper-200 p-3 grid sm:grid-cols-3 gap-2">
      {isArea && (
        <>
          <div><label className={label}>En (cm)</label><input type="number" min={1} className={input} value={k.selections.en ?? ""} disabled={fiyatElle} onChange={(e) => onSecim("en", e.target.value)} /></div>
          <div><label className={label}>Boy (cm)</label><input type="number" min={1} className={input} value={k.selections.boy ?? ""} disabled={fiyatElle} onChange={(e) => onSecim("boy", e.target.value)} /></div>
        </>
      )}
      {sirali.map(([key, g]) => (
        <div key={key}>
          <label className={label}>{g.label}</label>
          <select className={input} value={k.selections[key] ?? ""} disabled={fiyatElle || g.opts.every((o) => o.locked)} onChange={(e) => onSecim(key, e.target.value)}>
            {[...g.opts].sort((a, b) => a.optionSort - b.optionSort).map((o) => (
              <option key={o.optionKey} value={o.optionKey}>{o.optionLabel}{o.optionSublabel ? ` — ${o.optionSublabel}` : ""}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function YeniSiparisClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [musteriArama, setMusteriArama] = useState("");
  const [musteriler, setMusteriler] = useState<Musteri[]>([]);
  const [secili, setSecili] = useState<Musteri | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [epostaYok, setEpostaYok] = useState(false);

  const [teslimat, setTeslimat] = useState<"elden" | "kargo">("elden");
  const [adres, setAdres] = useState({ city: "", district: "", fullAddress: "", zipCode: "" });
  const [kargoUcreti, setKargoUcreti] = useState(0);
  const [kurumsal, setKurumsal] = useState(false);
  const [fatura, setFatura] = useState({ companyName: "", taxNumber: "", taxOffice: "", fullAddress: "", city: "", district: "" });

  const [kalemler, setKalemler] = useState<Kalem[]>([bosKalem()]);
  const [urunArama, setUrunArama] = useState<{ i: number; q: string } | null>(null);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const fiyatSayac = useRef<Record<number, number>>({});
  const fiyatZamanlayici = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const [indirim, setIndirim] = useState(0);
  const [odemeYontemi, setOdemeYontemi] = useState<"havale" | "nakit" | "pos">("havale");
  const [odemeAlindi, setOdemeAlindi] = useState(true);
  const [kanal, setKanal] = useState<"yuz-yuze" | "telefon" | "whatsapp" | "diger">("yuz-yuze");
  const [not, setNot] = useState("");
  const [musteriyeEposta, setMusteriyeEposta] = useState(true);

  useEffect(() => {
    if (secili || musteriArama.trim().length < 2) { setMusteriler([]); return; }
    const t = setTimeout(() => { void musteriAra(musteriArama).then(setMusteriler); }, 300);
    return () => clearTimeout(t);
  }, [musteriArama, secili]);

  useEffect(() => {
    if (!urunArama || urunArama.q.trim().length < 2) { setUrunler([]); return; }
    const t = setTimeout(() => { void urunAra(urunArama.q).then(setUrunler); }, 300);
    return () => clearTimeout(t);
  }, [urunArama]);

  const ozet = useMemo(() => ozetHesapla(kalemler, indirim, teslimat === "kargo" ? kargoUcreti : 0), [kalemler, indirim, teslimat, kargoUcreti]);

  function kalemGuncelle(i: number, patch: Partial<Kalem> | ((k: Kalem) => Partial<Kalem>)) {
    setKalemler((ks) => ks.map((k, j) => (j === i ? { ...k, ...(typeof patch === "function" ? patch(k) : patch) } : k)));
  }

  /** Sunucu fiyatı: 350 ms gecikmeli, eski yanıtlar sayaçla elenir. */
  function fiyatIste(i: number, k: Kalem) {
    if (!k.productId || k.fiyatElle) return;
    kalemGuncelle(i, { hesaplaniyor: true });
    clearTimeout(fiyatZamanlayici.current[i]);
    fiyatZamanlayici.current[i] = setTimeout(() => {
      const sira = (fiyatSayac.current[i] = (fiyatSayac.current[i] ?? 0) + 1);
      void kalemFiyatla({ productId: k.productId!, selections: k.selections, quantity: Math.max(1, Math.floor(k.quantity)) }).then((r) => {
        if (fiyatSayac.current[i] !== sira) return;
        if (!r.ok) { kalemGuncelle(i, { hesaplaniyor: false, fiyatHata: r.error, unitPrice: 0, lineTotal: 0 }); return; }
        kalemGuncelle(i, { hesaplaniyor: false, fiyatHata: null, unitPrice: r.unitPrice, lineTotal: r.lineTotal, configurationSummary: r.summary });
      });
    }, 350);
  }

  async function urunSec(i: number, u: Urun) {
    setUrunArama(null); setUrunler([]);
    kalemGuncelle(i, { productId: u.id, productSlug: u.slug, productName: u.name, fiyatElle: false, hesaplaniyor: true, fiyatHata: null });
    const d = await urunDetay(u.slug);
    if (!d) { kalemGuncelle(i, { hesaplaniyor: false, fiyatHata: "Ürün seçenekleri alınamadı; fiyatı elle girin.", fiyatElle: true }); return; }
    const selections = varsayilanSecimler(d.options, d.pricingMode);
    const mevcut = kalemler[i] ?? bosKalem();
    const sonraki: Kalem = { ...mevcut, productId: u.id, productSlug: u.slug, productName: u.name, detay: d, selections, fiyatElle: false, quantity: 1 };
    kalemGuncelle(i, sonraki);
    fiyatIste(i, sonraki);
  }
  function secimDegistir(i: number, groupKey: string, optionKey: string) {
    const k = kalemler[i]; if (!k) return;
    const sonraki = { ...k, selections: { ...k.selections, [groupKey]: optionKey } };
    kalemGuncelle(i, { selections: sonraki.selections });
    fiyatIste(i, sonraki);
  }
  function adetDegistir(i: number, quantity: number) {
    const k = kalemler[i]; if (!k) return;
    const q = Math.max(1, Math.floor(Number(quantity) || 1));
    const sonraki = { ...k, quantity: q };
    kalemGuncelle(i, { quantity: q, lineTotal: k.fiyatElle || !k.productId ? round2(k.unitPrice * q) : k.lineTotal });
    fiyatIste(i, sonraki);
  }
  function elleFiyat(i: number, unitPrice: number) {
    kalemGuncelle(i, (k) => ({ unitPrice: round2(unitPrice), lineTotal: round2(round2(unitPrice) * Math.max(1, Math.floor(k.quantity))) }));
  }

  const hatalar: string[] = [];
  if (!fullName.trim()) hatalar.push("Müşteri adı gerekli.");
  if (phone.replace(/\D/g, "").length < 10) hatalar.push("Telefon gerekli (en az 10 rakam).");
  if (!epostaYok && !/^\S+@\S+\.\S+$/.test(email.trim())) hatalar.push("Geçerli e-posta girin ya da 'E-postası yok' işaretleyin.");
  if (teslimat === "kargo" && (!adres.city.trim() || !adres.district.trim() || !adres.fullAddress.trim())) hatalar.push("Kargo teslimatı için il, ilçe ve adres gerekli.");
  if (kurumsal && !/^\d{10}$/.test(fatura.taxNumber.replace(/\D/g, ""))) hatalar.push("Kurumsal faturada 10 haneli vergi numarası gerekli.");
  if (kurumsal && !fatura.companyName.trim()) hatalar.push("Kurumsal faturada firma unvanı gerekli.");
  kalemler.forEach((k, i) => {
    if (!k.productName.trim()) hatalar.push(`${i + 1}. kalem: ürün adı gerekli.`);
    if (!(k.quantity >= 1)) hatalar.push(`${i + 1}. kalem: adet en az 1.`);
    if (k.hesaplaniyor) hatalar.push(`${i + 1}. kalem: fiyat hesaplanıyor…`);
    else if (k.fiyatHata && !k.fiyatElle) hatalar.push(`${i + 1}. kalem: ${k.fiyatHata}`);
    else if (!(k.unitPrice > 0)) hatalar.push(`${i + 1}. kalem: birim fiyat 0'dan büyük olmalı.`);
  });

  function gonder() {
    if (hatalar.length) { toast.error(hatalar[0] ?? "Form eksik."); return; }
    const govde = {
      userId: secili?.id,
      fullName: fullName.trim(), phone: phone.trim(),
      email: epostaYok ? undefined : email.trim().toLowerCase(),
      teslimat,
      adres: teslimat === "kargo" ? { fullName: fullName.trim(), phone: phone.trim(), city: adres.city.trim(), district: adres.district.trim(), fullAddress: adres.fullAddress.trim(), zipCode: adres.zipCode.trim() || undefined } : undefined,
      faturaAdresi: kurumsal
        ? { fullName: fullName.trim(), phone: phone.trim(), type: "corporate", companyName: fatura.companyName.trim(), taxNumber: fatura.taxNumber.replace(/\D/g, ""), taxOffice: fatura.taxOffice.trim() || undefined,
            city: (fatura.city || adres.city || "-").trim(), district: (fatura.district || adres.district || "-").trim(), fullAddress: (fatura.fullAddress || adres.fullAddress || "Elden teslim").trim() }
        : undefined,
      kalemler: kalemler.map((k) => ({
        productId: k.productId, productName: k.productName.trim(),
        configurationSummary: k.configurationSummary.trim() || undefined,
        selections: k.productId ? k.selections : undefined,
        fiyatElle: k.fiyatElle || !k.productId,
        quantity: Math.floor(k.quantity), unitPrice: round2(k.unitPrice), needsDesignSupport: k.needsDesignSupport,
      })),
      kargoUcreti: teslimat === "kargo" ? round2(kargoUcreti) : 0,
      indirim: round2(indirim),
      odemeYontemi, odemeAlindi, kanal,
      not: not.trim() || undefined,
      musteriyeEposta: musteriyeEposta && !epostaYok,
    };
    startTransition(async () => {
      const r = await manuelSiparisOlustur(govde);
      if (!r.ok) { toast.error(r.error); return; }
      toast.success(`${r.orderNumber} oluşturuldu · ${tl(r.total)}`);
      router.push(`/siparisler/${r.id}`);
    });
  }

  return (
    <AdminShell>
      <header className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/siparisler" className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-900"><ArrowLeft size={12} /> Siparişler</Link>
          <h1 className="text-2xl md:text-3xl font-semibold text-ink-900 mt-1">Manuel Sipariş</h1>
          <p className="text-ink-500 text-sm mt-1">Yüz yüze, telefon veya WhatsApp ile alınan işi sisteme kaydeder; ciroya ve sipariş akışına dahil olur. Katalog ürününde fiyat sitedeki motorla hesaplanır.</p>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Kart baslik="Müşteri" ikon={UserCircle}>
            {secili ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-success/10 px-3 py-2 text-sm">
                <span><strong className="text-ink-900">{secili.fullName}</strong> <span className="text-ink-500">· {secili.email}{secili.companyName ? ` · ${secili.companyName}` : ""}</span> <span className="text-[11px] text-success ml-1">kayıtlı üye</span></span>
                <button type="button" className="text-xs text-ink-500 hover:text-error" onClick={() => setSecili(null)}>Değiştir</button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 bg-paper-100 border border-paper-200 rounded-md">
                  <MagnifyingGlass size={14} className="text-ink-500" />
                  <input value={musteriArama} onChange={(e) => setMusteriArama(e.target.value)} placeholder="Kayıtlı müşteri ara (ad, e-posta, telefon) — ya da aşağıya yeni müşteri yaz" className="flex-1 bg-transparent outline-none text-sm" />
                </div>
                {musteriler.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full bg-paper-50 border border-paper-200 rounded-md shadow-lg max-h-56 overflow-auto">
                    {musteriler.map((m) => (
                      <li key={m.id}>
                        <button type="button" onClick={() => { setSecili(m); setFullName(m.fullName); setPhone(m.phone || ""); setEmail(m.email); setEpostaYok(false); setMusteriArama(""); if (m.accountType === "corporate") { setKurumsal(true); setFatura((f) => ({ ...f, companyName: m.companyName ?? f.companyName })); } }} className="w-full text-left px-3 py-2 text-sm hover:bg-paper-100">
                          <span className="font-medium text-ink-900">{m.fullName}</span> <span className="text-ink-500">· {m.email}{m.phone ? ` · ${m.phone}` : ""}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="grid sm:grid-cols-3 gap-3">
              <div><label className={label}>Ad Soyad *</label><input className={input} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
              <div><label className={label}>Telefon *</label><input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xx xxx xx xx" /></div>
              <div>
                <label className={label}>E-posta {epostaYok ? "" : "*"}</label>
                <input className={input} value={email} onChange={(e) => setEmail(e.target.value)} disabled={epostaYok} placeholder={epostaYok ? "e-posta yok" : "musteri@ornek.com"} />
                <label className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-500"><input type="checkbox" checked={epostaYok} onChange={(e) => setEpostaYok(e.target.checked)} /> E-postası yok (bildirim gitmez)</label>
              </div>
            </div>
          </Kart>

          <Kart baslik="Kalemler" ikon={Package}>
            {kalemler.map((k, i) => (
              <div key={i} className="rounded-lg border border-paper-200 p-3 space-y-2">
                <div className="grid sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 relative">
                    <label className={label}>Ürün * <span className="font-normal text-ink-400">(katalogdan seç ya da serbest yaz)</span></label>
                    <input
                      className={input}
                      value={k.productName}
                      onChange={(e) => { kalemGuncelle(i, { productName: e.target.value, productId: undefined, productSlug: undefined, detay: null, selections: {}, fiyatHata: null, fiyatElle: false, hesaplaniyor: false }); setUrunArama({ i, q: e.target.value }); }}
                      onFocus={() => { if (!k.productId) setUrunArama({ i, q: k.productName }); }}
                      placeholder="ör. Vinil Branda 440 gr"
                    />
                    {k.productId && <span className="absolute right-2 top-7 text-[10px] text-success">katalog · {k.detay?.pricingMode === "area" ? "m² fiyat" : "seçenekli"}</span>}
                    {urunArama?.i === i && urunler.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-paper-50 border border-paper-200 rounded-md shadow-lg max-h-56 overflow-auto">
                        {urunler.map((u) => (
                          <li key={u.id}>
                            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => void urunSec(i, u)} className="w-full text-left px-3 py-2 text-sm hover:bg-paper-100 flex justify-between gap-2">
                              <span className="text-ink-900">{u.name}</span>
                              {u.fiyat > 0 && <span className="text-ink-500 text-xs">{tl(u.fiyat)}&apos;den</span>}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="sm:col-span-2"><label className={label}>{k.detay?.pricingMode === "area" ? "Adet (parça) *" : "Adet (set) *"}</label><input type="number" min={1} className={input} value={k.quantity} onChange={(e) => adetDegistir(i, Number(e.target.value))} /></div>
                  <div className="sm:col-span-2">
                    <label className={label}>Birim fiyat (KDV dahil)</label>
                    <input type="number" min={0} step="0.01" className={input} value={k.unitPrice} disabled={Boolean(k.productId) && !k.fiyatElle} onChange={(e) => elleFiyat(i, Number(e.target.value))} />
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-end">
                    <button type="button" aria-label="Kalemi sil" disabled={kalemler.length === 1} onClick={() => setKalemler((ks) => ks.filter((_, j) => j !== i))} className="p-2 rounded text-ink-400 hover:text-error hover:bg-error/10 disabled:opacity-30"><Trash size={14} /></button>
                  </div>
                </div>

                {k.productId && <Konfigurator k={k} fiyatElle={k.fiyatElle} onSecim={(g, v) => secimDegistir(i, g, v)} />}

                <div className="grid sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-7"><label className={label}>{k.productId ? "Özet (otomatik; düzenleyebilirsiniz)" : "Açıklama / ölçü / malzeme"}</label><input className={input} value={k.configurationSummary} onChange={(e) => kalemGuncelle(i, { configurationSummary: e.target.value })} placeholder="ör. 250×80 cm · kuşgözlü · çift yüz" /></div>
                  <label className="sm:col-span-3 inline-flex items-center gap-1.5 text-xs text-ink-700 pb-2"><input type="checkbox" checked={k.needsDesignSupport} onChange={(e) => kalemGuncelle(i, { needsDesignSupport: e.target.checked })} /> Tasarım desteği</label>
                  {k.productId && (
                    <label className="sm:col-span-2 inline-flex items-center gap-1.5 text-xs text-ink-700 pb-2"><input type="checkbox" checked={k.fiyatElle} onChange={(e) => { const ac = e.target.checked; kalemGuncelle(i, { fiyatElle: ac, fiyatHata: null }); if (!ac) fiyatIste(i, { ...k, fiyatElle: false }); }} /> Fiyatı elle gir</label>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={k.fiyatHata && !k.fiyatElle ? "text-error" : "text-ink-500"}>{k.hesaplaniyor ? "Fiyat hesaplanıyor…" : k.fiyatHata && !k.fiyatElle ? k.fiyatHata : k.productId && !k.fiyatElle ? "Fiyat sitedeki motorla hesaplandı" : ""}</span>
                  <span className="text-ink-500">Satır: <strong className="text-ink-900 tabular-nums">{tl(k.lineTotal || 0)}</strong></span>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setKalemler((ks) => [...ks, bosKalem()])} className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"><Plus size={14} /> Kalem ekle</button>
          </Kart>

          <Kart baslik="Teslimat" ikon={Truck}>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-1.5"><input type="radio" checked={teslimat === "elden"} onChange={() => setTeslimat("elden")} /> Elden teslim (mağazadan)</label>
              <label className="inline-flex items-center gap-1.5"><input type="radio" checked={teslimat === "kargo"} onChange={() => setTeslimat("kargo")} /> Kargo</label>
            </div>
            {teslimat === "kargo" && (
              <div className="grid sm:grid-cols-4 gap-3">
                <div><label className={label}>İl *</label><input className={input} value={adres.city} onChange={(e) => setAdres({ ...adres, city: e.target.value })} /></div>
                <div><label className={label}>İlçe *</label><input className={input} value={adres.district} onChange={(e) => setAdres({ ...adres, district: e.target.value })} /></div>
                <div className="sm:col-span-2"><label className={label}>Adres *</label><input className={input} value={adres.fullAddress} onChange={(e) => setAdres({ ...adres, fullAddress: e.target.value })} /></div>
                <div><label className={label}>Posta kodu</label><input className={input} value={adres.zipCode} onChange={(e) => setAdres({ ...adres, zipCode: e.target.value })} /></div>
                <div><label className={label}>Kargo ücreti (₺)</label><input type="number" min={0} step="0.01" className={input} value={kargoUcreti} onChange={(e) => setKargoUcreti(Number(e.target.value))} /></div>
              </div>
            )}
          </Kart>

          <Kart baslik="Fatura" ikon={Receipt}>
            <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={kurumsal} onChange={(e) => setKurumsal(e.target.checked)} /> Kurumsal fatura (VKN)</label>
            {kurumsal && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2"><label className={label}>Firma unvanı *</label><input className={input} value={fatura.companyName} onChange={(e) => setFatura({ ...fatura, companyName: e.target.value })} /></div>
                <div><label className={label}>Vergi no (10 hane) *</label><input className={input} value={fatura.taxNumber} onChange={(e) => setFatura({ ...fatura, taxNumber: e.target.value })} /></div>
                <div><label className={label}>Vergi dairesi</label><input className={input} value={fatura.taxOffice} onChange={(e) => setFatura({ ...fatura, taxOffice: e.target.value })} /></div>
                <div><label className={label}>İl</label><input className={input} value={fatura.city} onChange={(e) => setFatura({ ...fatura, city: e.target.value })} placeholder={adres.city || "-"} /></div>
                <div><label className={label}>İlçe</label><input className={input} value={fatura.district} onChange={(e) => setFatura({ ...fatura, district: e.target.value })} placeholder={adres.district || "-"} /></div>
                <div className="sm:col-span-3"><label className={label}>Fatura adresi</label><input className={input} value={fatura.fullAddress} onChange={(e) => setFatura({ ...fatura, fullAddress: e.target.value })} placeholder={adres.fullAddress || "Teslimat adresiyle aynı"} /></div>
              </div>
            )}
            <p className="text-[11px] text-ink-500">e-Arşiv / e-Fatura, sipariş kargoya verildiğinde (elden teslimde &quot;Kargoya verildi&quot; işaretlendiğinde) otomatik kesilir. Nakit ve POS tahsilatlarda internet satışı bilgisi gönderilmez.</p>
          </Kart>
        </div>

        <div className="space-y-5">
          <Kart baslik="Ödeme" ikon={CreditCard}>
            <div><label className={label}>Ödeme yöntemi</label>
              <select className={input} value={odemeYontemi} onChange={(e) => setOdemeYontemi(e.target.value as typeof odemeYontemi)}>
                <option value="havale">Havale / EFT</option>
                <option value="nakit">Nakit</option>
                <option value="pos">Kart (POS)</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={odemeAlindi} onChange={(e) => setOdemeAlindi(e.target.checked)} /> Ödeme alındı</label>
            {!odemeAlindi && <p className="text-[11px] text-warning">Ödeme bekliyor olarak kaydedilir; para gelince sipariş detayından &quot;Ödeme geldi, onayla&quot;.</p>}
            <div><label className={label}>Kanal</label>
              <select className={input} value={kanal} onChange={(e) => setKanal(e.target.value as typeof kanal)}>
                <option value="yuz-yuze">Yüz yüze</option>
                <option value="telefon">Telefon</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="diger">Diğer</option>
              </select>
            </div>
            <div><label className={label}>İndirim (₺, KDV dahil)</label><input type="number" min={0} step="0.01" className={input} value={indirim} onChange={(e) => setIndirim(Number(e.target.value))} /></div>
            <div><label className={label}>Not (iç kullanım; sipariş notuna eklenir)</label><textarea rows={3} className={input} value={not} onChange={(e) => setNot(e.target.value)} placeholder="ör. ölçü müşteriyle teyit edildi, montaj yok" /></div>
            <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={musteriyeEposta && !epostaYok} disabled={epostaYok} onChange={(e) => setMusteriyeEposta(e.target.checked)} /> Müşteriye sipariş e-postası gönder</label>
          </Kart>

          <section className="bg-ink-900 text-paper-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-paper-100/70">Ara toplam</span><span className="tabular-nums">{tl(ozet.subtotal)}</span></div>
            {ozet.discount > 0 && <div className="flex justify-between"><span className="text-paper-100/70">İndirim</span><span className="tabular-nums">− {tl(ozet.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-paper-100/70">Kargo</span><span className="tabular-nums">{ozet.shippingFee > 0 ? tl(ozet.shippingFee) : "—"}</span></div>
            <div className="flex justify-between text-paper-100/70 text-xs"><span>KDV (dahil)</span><span className="tabular-nums">{tl(ozet.vat)}</span></div>
            <div className="flex justify-between pt-2 border-t border-paper-50/20 text-base font-semibold"><span>Toplam</span><span className="tabular-nums">{tl(ozet.total)}</span></div>
          </section>

          {hatalar.length > 0 && (
            <ul className="text-xs text-warning space-y-0.5 list-disc pl-4">{hatalar.slice(0, 4).map((h) => <li key={h}>{h}</li>)}</ul>
          )}
          <button type="button" onClick={gonder} disabled={pending || hatalar.length > 0} className="w-full py-3 rounded-md text-sm font-semibold bg-brand-500 text-ink-900 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {pending ? "Kaydediliyor…" : "Siparişi Oluştur"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
