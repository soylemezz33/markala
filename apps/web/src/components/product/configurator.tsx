"use client";

import { useCallback, useMemo, useReducer, useState, useRef, useEffect } from "react";
import { Button, Price } from "@markala/ui";
import { ShoppingBagOpen, CheckCircle, ChatCircleText, Truck, SpinnerGap } from "@phosphor-icons/react";
import type { Product } from "@markala/types";
import {
  calculateTotal,
  buildSelectionSummary,
  resolveRules,
  effectiveSelections,
  optionPriceHints,
  groupHintMode,
  availablePriceDimKeys,
  computeAreaPrice,
  adetTierBadges,
  getInstallmentAmount,
  DEFAULT_PRICING,
  type PricingSettings,
  type OptionRulesLite,
} from "@/lib/configurator";
import { exVat } from "@/lib/vat";
import { useCartStore } from "@/lib/cart-store";
import { apiClient } from "@/lib/api";
import {
  ConfiguratorContext,
  configuratorReducer,
  initState,
  OptionGroup,
  DesignUpload,
  AreaField,
  MobileCta,
} from "./configurator-fields";

// Tip — API'den gelen product.options her satırı bu şekildedir
interface RawOption {
  groupKey: string;
  groupLabel: string;
  groupRole: "dimension" | "priced";
  groupSort: number;
  optionKey: string;
  optionLabel: string;
  optionSublabel?: string | null;
  optionSort: number;
  locked?: boolean;
  rules?: OptionRulesLite | null;
}

interface OptionGroupData {
  groupKey: string;
  groupLabel: string;
  groupSort: number;
  locked: boolean;
  options: Array<{
    optionKey: string;
    optionLabel: string;
    optionSublabel?: string | null;
    optionSort: number;
    /** rules.tier — seçenek çok olan gruplarda 2 adımlı seçim için (bkz. OptionGroup). */
    tier?: string | null;
  }>;
}

function buildGroups(raw: unknown[]): OptionGroupData[] {
  const opts = raw as RawOption[];
  const map = new Map<string, OptionGroupData>();
  for (const o of opts) {
    if (!map.has(o.groupKey)) {
      map.set(o.groupKey, {
        groupKey: o.groupKey,
        groupLabel: o.groupLabel,
        groupSort: o.groupSort,
        locked: !!o.locked,
        options: [],
      });
    }
    map.get(o.groupKey)!.options.push({
      optionKey: o.optionKey,
      optionLabel: o.optionLabel,
      optionSublabel: o.optionSublabel,
      optionSort: o.optionSort,
      tier: (o.rules as { tier?: string } | null | undefined)?.tier ?? null,
    });
  }
  return [...map.values()].sort((a, b) => a.groupSort - b.groupSort);
}

export function Configurator({ product, rating: ratingProp, pricing = DEFAULT_PRICING }: { product: Product; rating?: { average: number; count: number }; pricing?: PricingSettings }) {
  const addItem = useCartStore((s) => s.addItem);
  const [state, dispatch] = useReducer(configuratorReducer, product, initState);
  // Kargo ücreti buy-box'ta ŞEFFAF gösterilir — sepetteki +79₺ sürprizi terk ettiriyordu
  // (CRO denetimi 2026-08-01). API düşerse 79/1500 fallback; sepet sayfasıyla aynı kaynak.
  const [shippingInfo, setShippingInfo] = useState({ fee: 79, freeThreshold: 1500 });
  useEffect(() => {
    apiClient.settings.shipping().then(setShippingInfo).catch(() => {});
  }, []);
  // Fiyatlar tüm sitede DAİMA KDV dahil gösterilir (B2C yasal gereği + sepet/ödeme ile tutarlı).
  // Eski KDV dahil/hariç toggle'ı kaldırıldı; gösterim mantığı sabit dahil olarak korunur.
  const kdvDahil = true;

  // Flat list of all options with their rules — memoized on product.options
  const optionsWithRules = useMemo(
    () =>
      ((product.options ?? []) as unknown as RawOption[]).map((o) => ({
        groupKey: o.groupKey,
        optionKey: o.optionKey,
        rules: o.rules ?? null,
      })),
    [product.options],
  );

  // Seyrek matris: fiyat-boyutu (adet) grubunun, seçili ebat için GEÇERLİ değerleri.
  // null → filtreleme yok (tam ızgara veya fiyatsız ürün).
  const dimFilter = useMemo(
    () => availablePriceDimKeys(product, state.selections),
    [product, state.selections],
  );

  // Geçersiz kalan fiyat-boyutu seçimini (örn. A5 + 2000) ilk GEÇERLİ değere çek —
  // sayfa "Teklif Al" yerine doğrudan fiyatlı açılsın. Ham kullanıcı niyeti state'te kalır;
  // düzeltme türetilmiştir (gizli option seçili kalmaz).
  const baseSelections = useMemo(() => {
    if (!dimFilter) return state.selections;
    const cur = state.selections[dimFilter.groupKey];
    if (cur && dimFilter.keys.has(cur)) return state.selections;
    const firstValid = ((product.options ?? []) as unknown as RawOption[])
      .filter((o) => o.groupKey === dimFilter.groupKey)
      .sort((a, b) => a.optionSort - b.optionSort)
      .find((o) => dimFilter.keys.has(o.optionKey));
    return firstValid
      ? { ...state.selections, [dimFilter.groupKey]: firstValid.optionKey }
      : state.selections;
  }, [state.selections, dimFilter, product.options]);

  // Seçime bağlı galeri görseli (2026-08-29, Hasan): rules.gorsel = N (1-tabanlı görsel
  // sırası) taşıyan bir seçenek seçilince galeriye "markala:gorsel-sec" olayı gönderilir —
  // ürün fotoğrafı o seçeneğin görseline döner (örn. yelken bayrakta "Kumaş + Takım" →
  // takım fotoğrafı). İlk açılışta da çalışır: varsayılan seçenek gorsel taşıyorsa sayfa
  // doğrudan o görselle açılır. Panelsiz genel mekanizma — rules JSON'una sayı yazmak yeter.
  const oncekiSecimler = useRef<Record<string, string> | null>(null);
  useEffect(() => {
    const onceki = oncekiSecimler.current;
    oncekiSecimler.current = baseSelections;
    for (const [grup, secenek] of Object.entries(baseSelections)) {
      if (onceki && onceki[grup] === secenek) continue; // bu grup değişmedi
      const opt = optionsWithRules.find((o) => o.groupKey === grup && o.optionKey === secenek);
      const gorsel = (opt?.rules as { gorsel?: unknown } | null | undefined)?.gorsel;
      if (typeof gorsel === "number" && Number.isInteger(gorsel) && gorsel >= 1) {
        window.dispatchEvent(new CustomEvent("markala:gorsel-sec", { detail: { index: gorsel - 1 } }));
        break; // tek geçişte bir görsel yönlendirmesi yeter
      }
    }
  }, [baseSelections, optionsWithRules]);

  const resolved = useMemo(
    () => resolveRules(optionsWithRules, baseSelections),
    [optionsWithRules, baseSelections],
  );

  const effSel = useMemo(
    () => effectiveSelections(baseSelections, resolved),
    [baseSelections, resolved],
  );

  const isArea = (product as { pricingMode?: string }).pricingMode === "area";

  // Area: geçerli ölçü = en>0 && boy>0. Ölçü girilmeden min-1m² clamp'i ile sahte fiyat
  // göstermeyi önler (müşteri ölçü girmeden fiyat görmesin / ölçüsüz sepete eklemesin).
  const hasValidSize = !isArea || (Number(effSel.en) > 0 && Number(effSel.boy) > 0);

  // Area: BİRİM (tek parça) fiyat — "adet" HARİÇ hesaplanır (adet artık sepet adedidir).
  const unitArea = useMemo(() => {
    if (!isArea) return 0;
    if (!(Number(effSel.en) > 0 && Number(effSel.boy) > 0)) return 0; // ölçü yok → fiyat yok
    const rows = ((product.prices ?? []) as unknown as Array<{
      groupKey: string | null;
      optionKey: string | null;
      dimKey: string | null;
      price: unknown;
      cost?: unknown;
    }>).map((r) => ({
      groupKey: r.groupKey,
      optionKey: r.optionKey,
      dimKey: r.dimKey,
      price: Number(r.price),
      cost: r.cost == null ? null : Number(r.cost),
    }));
    // adet="1" ZORLA → tek parça birim fiyatı. Toplam = birim × adet (aşağıda).
    return computeAreaPrice(product.options as never, rows, { ...effSel, adet: "1" }, pricing).dahil;
  }, [isArea, product, effSel, pricing]);

  // Girilen "adet" area'da SEPET ADEDİ olur (additive'de sepet adedi state.quantity=1).
  const areaAdet = isArea ? Math.max(1, Number(effSel.adet) || 1) : state.quantity;

  const total = useMemo(
    () => (isArea ? unitArea * areaAdet : calculateTotal(product, effSel)),
    [isArea, unitArea, areaAdet, product, effSel],
  );

  const priceHintsMap = useMemo(() => {
    // Area: her malzemenin 1 m² (KDV dahil) fiyatını ipucu olarak göster → müşteri
    // malzeme seçmeden fiyat farkını görür. computeAreaPrice ile birim-m² fiyat.
    if (isArea) {
      const rows = ((product.prices ?? []) as unknown as Array<{
        groupKey: string | null; optionKey: string | null; dimKey: string | null; price: unknown; cost?: unknown;
      }>).map((r) => ({
        groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey,
        price: Number(r.price), cost: r.cost == null ? null : Number(r.cost),
      }));
      const opts = (product.options ?? []) as never[];
      const matHints: Record<string, number> = {};
      for (const o of (product.options ?? []) as Array<{ groupKey: string; optionKey: string }>) {
        if (o.groupKey !== "malzeme") continue;
        matHints[o.optionKey] = computeAreaPrice(opts, rows, { malzeme: o.optionKey, en: "100", boy: "100", adet: "1" }, pricing).dahil;
      }
      const hints: Record<string, Record<string, number>> = { malzeme: matHints };

      // MALZEME DIŞINDAKİ ücretli gruplar (ör. "Ek İşlem") — 2026-09-03, Hasan: "ek
      // fiyatları neden yazmadın?". Buraya kadar yalnız malzeme ipucu hesaplanıyordu,
      // dolayısıyla CNC Kesim / Laminasyon gibi ÜCRETLİ seçenekler fiyatsız görünüyordu;
      // müşteri ancak seçtikten sonra toplamın arttığını fark ediyordu.
      //
      // Fiyat AÇIKLAMA METNİNE YAZILMAZ: tutar kura ve girilen ölçüye bağlı (CNC m²
      // başına, laminasyon adet başına). Sabit metin ilk kur değişiminde yalan olur.
      // Bunun yerine fark, o anki seçimlerle hesaplanır ve "+245,00 ₺" olarak basılır.
      //
      // Ölçü girilmeden ipucu YOK — hasValidSize ile aynı kural: min-1m² kıskacı
      // yüzünden müşteriye ölçüsüz sahte rakam gösterilmesin (bkz. unitArea).
      if (hasValidSize) {
        const tumOpts = (product.options ?? []) as Array<{
          groupKey: string;
          optionKey: string;
          groupRole?: string;
        }>;
        const ucretliGruplar = [
          ...new Set(
            tumOpts.filter((o) => o.groupRole === "priced" && o.groupKey !== "malzeme").map((o) => o.groupKey),
          ),
        ];
        for (const gKey of ucretliGruplar) {
          // Taban = grup HİÇ seçilmemiş hâl; fark yalnız o seçeneğin eklediğidir.
          // adet:"1" ile birim üzerinden hesaplanıp adetle çarpılır — ekrandaki
          // toplamın (unitArea × areaAdet) kurulumuyla birebir aynı olsun diye.
          const taban = computeAreaPrice(opts, rows, { ...effSel, adet: "1", [gKey]: "" }, pricing).dahil;
          const grup: Record<string, number> = {};
          for (const o of tumOpts) {
            if (o.groupKey !== gKey) continue;
            const ile = computeAreaPrice(opts, rows, { ...effSel, adet: "1", [gKey]: o.optionKey }, pricing).dahil;
            grup[o.optionKey] = Math.round((ile - taban) * areaAdet * 100) / 100;
          }
          hints[gKey] = grup;
        }
      }
      return hints;
    }
    return optionPriceHints(product, effSel);
  }, [isArea, product, effSel, pricing, hasValidSize, areaAdet]);

  // Area: seçili malzemenin maxM2'sini aşan ölçü sipariş edilemez (basılamaz).
  const areaMaxExceeded = useMemo(() => {
    if (!isArea) return false;
    const en = Number(effSel.en) || 0;
    const boy = Number(effSel.boy) || 0;
    const alan = (en * boy) / 10000;
    if (alan <= 0) return false;
    const opt = ((product.options ?? []) as Array<{ groupKey: string; optionKey: string; rules?: { maxM2?: number } | null }>).find(
      (o) => o.groupKey === "malzeme" && o.optionKey === effSel.malzeme,
    );
    const maxM2 = opt?.rules?.maxM2;
    return typeof maxM2 === "number" && maxM2 > 0 && alan > maxM2;
  }, [isArea, effSel, product.options]);

  // Area: üretim MİNİMUMU altındaki ölçü sipariş edilemez (2026-08-26 UX denetimi İş 2).
  // Üst sınırla (areaMaxExceeded) simetrik: malzeme kuralındaki minEn/minBoy (cm) altında
  // giriş varsa Sepete Ekle kilitlenir; alan bileşeni kırmızı satır içi hatayı gösterir.
  const areaMinViolated = useMemo(() => {
    if (!isArea) return false;
    const en = Number(effSel.en) || 0;
    const boy = Number(effSel.boy) || 0;
    if (en <= 0 && boy <= 0) return false;
    const opt = ((product.options ?? []) as Array<{ groupKey: string; optionKey: string; rules?: { minEn?: number; minBoy?: number } | null }>).find(
      (o) => o.groupKey === "malzeme" && o.optionKey === effSel.malzeme,
    );
    const minEn = opt?.rules?.minEn;
    const minBoy = opt?.rules?.minBoy;
    return (
      (typeof minEn === "number" && minEn > 0 && en > 0 && en < minEn) ||
      (typeof minBoy === "number" && minBoy > 0 && boy > 0 && boy < minBoy)
    );
  }, [isArea, effSel, product.options]);

  /**
   * Tasarım dosyası HÂLÂ YÜKLENİYOR mu? (2026-08-26 UX denetimi #5)
   * Reducer, dosya seçilince `uploadedFileName`i yazıp `uploadedFileUrl`i temizler; URL
   * ancak yükleme bitince gelir. Yükleme sürerken "Sepete Ekle"ye basılabildiği için
   * yavaş bağlantıda kalem DOSYASIZ kaydediliyordu — müşteri tasarımını gönderdiğini
   * sanıyor, üretim eli boş kalıyordu. Yükleme başarısız olursa reducer adı da temizler,
   * yani bu bayrak kilitli kalmaz.
   */
  // 2026-09-03: çoklu dosya — DesignSlots sürmekte olan yükleme sayısını reducer'a yazar.
  const uploadPending = !state.needsDesign && state.uploading > 0;

  const canBuy = total > 0 && !areaMaxExceeded && !areaMinViolated && !uploadPending;

  // Area başlangıç fiyatı: ölçü girilmeden gösterilecek "X₺'den başlayan".
  // = minM2 × en-ucuz malzemenin m²-fiyatı (KDV dahil, priceHintsMap.malzeme'den).
  // Müşteri "Teklif Al" yerine erişilebilir bir giriş fiyatı görür; ölçü girince gerçek fiyata döner.
  const startingPrice = useMemo(() => {
    if (!isArea) return 0;
    const hints = Object.values(
      (priceHintsMap as { malzeme?: Record<string, number> }).malzeme ?? {},
    ).filter((v) => typeof v === "number" && v > 0);
    if (hints.length === 0) return 0;
    // Temiz üst tam sayı (kartla aynı: getDisplayPrice area'da Math.ceil) — "115,92'den" yerine "116'dan".
    return Math.ceil(pricing.minM2 * Math.min(...hints));
  }, [isArea, priceHintsMap, pricing.minM2]);

  // CTA "Teklif Al"a düştüğünde sebebi açıkla (buton sessizce değişmesin).
  const ctaReason = useMemo(() => {
    // Yükleme sebebi ürün tipinden bağımsız (area olmayanlarda da olur) → önce o.
    if (uploadPending) return "Tasarım dosyanız yükleniyor, bitince sepete ekleyebilirsiniz.";
    if (!isArea || canBuy) return null;
    if (!hasValidSize) return "Fiyat için en ve boy ölçüsünü girin.";
    if (areaMaxExceeded) return "Bu ölçü tek parça üretim sınırını aşıyor, özel teklif alın.";
    if (areaMinViolated) return "Girilen ölçü bu ürünün üretim minimumunun altında, ölçüyü büyütün.";
    return null;
  }, [isArea, canBuy, hasValidSize, areaMaxExceeded, areaMinViolated, uploadPending]);

  /** Gösterim dönüşümü: KDV dahil modda ham değer, hariç modda exVat uygular. */
  const show = (n: number) => (kdvDahil ? n : exVat(n));

  /** Fiyat ipuçlarını kdvDahil durumuna göre dönüştür. */
  const displayedPriceHints = useMemo(() => {
    if (kdvDahil) return priceHintsMap;
    const result: typeof priceHintsMap = {};
    for (const [groupKey, hints] of Object.entries(priceHintsMap)) {
      if (!hints) { result[groupKey] = hints; continue; }
      const converted: Record<string, number> = {};
      for (const [optionKey, val] of Object.entries(hints)) {
        converted[optionKey] = Number.isFinite(val) ? exVat(val as number) : (val as number);
      }
      result[groupKey] = converted;
    }
    return result;
  }, [priceHintsMap, kdvDahil]);

  const groups = useMemo(
    () => buildGroups((product.options ?? []) as unknown[]),
    [product.options],
  );

  // "En çok tercih edilen" rozeti — paket grubunda varsayılan seçilen (optionSort/displayOrder
  // ilk) seçenek. Persona bulgusu: 16 seçenekli paket listesinde müşteri neyi seçeceğini
  // bilemiyordu; rozet güvenli bir başlangıç noktası verir. Fiyata/seçim davranışına etkisi yok.
  const popularPaketKey = useMemo(() => {
    const paketOpts = ((product.options ?? []) as unknown as RawOption[])
      .filter((o) => o.groupKey === "paket")
      .sort((a, b) => a.optionSort - b.optionSort);
    // Rozet tek seçenekli "listede" anlamsız — en az 2 seçenek varsa göster.
    if (paketOpts.length < 2) return undefined;
    // Rozet AÇILIŞTA SEÇİLİ olanı işaretler; ikisi de rules.varsayilan'ı takip eder
    // (initSelections ile aynı kural), yoksa listenin ilki.
    const isaretli = paketOpts.find(
      (o) => (o.rules as { varsayilan?: boolean } | null | undefined)?.varsayilan === true,
    );
    return (isaretli ?? paketOpts[0]!).optionKey;
  }, [product.options]);

  // Hacim indirimi YALNIZ "adet" ayrı çarpan-boyutu olan lineer ürünlerde (İSG) uygulanır: adet
  // dimension VAR ve BAŞKA bir dimension (ör. ebat) da var. Matris (kartvizit, tek dimension=adet
  // → adet fiyat-boyutu) ve area ürünler bu koşulu sağlamaz → rozet gösterilmez (fiyata da etkisiz).
  const hasVolumeAdet = useMemo(() => {
    const dims = new Set<string>();
    for (const o of (product.options ?? []) as RawOption[]) {
      if (o.groupRole === "dimension") dims.add(o.groupKey);
    }
    return dims.has("adet") && [...dims].some((k) => k !== "adet");
  }, [product.options]);

  // Sabit alt bar (fiyat + Sepete Ekle) görünürlüğü: gerçek (kolon-içi) CTA ekranda
  // görünürken bar gizlenir → footer örtülmez, çift buton olmaz; aksi halde bar görünür.
  const ctaRef = useRef<HTMLDivElement>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(true);
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setStickyBarVisible(!entry.isIntersecting);
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function handleAddToCart() {
    if (!canBuy) return;
    addItem({
      productSlug: product.slug,
      productName: product.name,
      productImage:
        product.images[0] || `/api/mockup?slug=${product.slug}&w=200&h=200`,
      configuration: {
        // Area: "adet" sepet adedine taşınır → saklanan selections'ta adet="1"
        // (server computeAreaPrice(adet=1) × quantity = birim × adet ile aynı sonuç).
        selections: isArea ? { ...effSel, adet: "1" } : effSel,
        summary: buildSelectionSummary(product, effSel, state.needsDesign),
        totalPrice: isArea ? unitArea : total, // BİRİM fiyat (sepet satırı = totalPrice × quantity)
        needsDesign: state.needsDesign,
        uploadedFileName: state.uploadedFileName,
        uploadedFileUrl: state.uploadedFileUrl,
        // Set başına tasarımlar (2026-09-03). Tasarım desteği istendiyse boş.
        designs: state.needsDesign ? [] : state.designs.map((d) => ({ files: d.files.map((f) => ({ name: f.name, url: f.url, size: f.size, type: f.type })) })),
      },
      quantity: areaAdet, // area: girilen adet; additive: 1
    });
    dispatch({ type: "JUST_ADDED", value: true });
    setTimeout(() => dispatch({ type: "JUST_ADDED", value: false }), 1500);
  }

  const handleSelect = useCallback(
    (groupKey: string, optionKey: string) =>
      dispatch({ type: "SET_SELECTION", groupKey, optionKey }),
    [],
  );

  function handleQuoteClick() {
    const msg = encodeURIComponent(
      `Merhaba, "${product.name}" ürünü için teklif almak istiyorum.`,
    );
    window.open(`https://wa.me/905319004102?text=${msg}`, "_blank");
  }

  return (
    <ConfiguratorContext.Provider value={{ state, dispatch, product }}>
      {/* 2026-08-07 UX yenilemesi (rakip deseni): SOL = başlık + seçenekler,
          SAĞ = sticky FİYAT ÖZET KARTI (Toplam Fiyat + KDV + CTA + teslim + güven).
          Fiyat artık sayfa altında değil — seçenek değiştikçe sağda sabit güncellenir.
          Mobilde tek kolon akar; alttaki MobileCta sticky bar toplamı zaten gösterir. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6 lg:items-start">
        {/* SOL — başlık + açıklama + seçenekler */}
        <div className="space-y-4 min-w-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-ink-900 leading-tight">{product.name}</h1>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-ink-500">
              {(() => { const rating = ratingProp ?? product.rating; return rating && rating.count > 0 ? (
                <>
                  <span className="text-brand-500">★</span>
                  <span className="font-medium text-ink-900">
                    {rating.average.toFixed(1)}
                  </span>
                  <span>({rating.count} yorum)</span>
                  <span className="mx-1 text-paper-200">·</span>
                </>
              ) : null; })()}
              <span>Üretim: {product.productionTime}</span>
            </div>
          </div>

          <p className="text-sm text-ink-700 leading-relaxed line-clamp-2">{product.shortDescription}</p>

          <div className="space-y-5 pt-1 border-t border-paper-200">
            {isArea && <AreaField minM2={pricing.minM2} />}
            {groups.map((group) => {
              const visibleOptions =
                dimFilter && group.groupKey === dimFilter.groupKey
                  ? group.options.filter((o) => dimFilter.keys.has(o.optionKey))
                  : group.options;
              // Tiraj rozetleri ("Önerilen" / "En avantajlı") — yalnız adet grubunda ve
              // İSG -%N rozetiyle çakışmayacak ürünlerde. Gizli (seyrek matris) kademeler
              // rozet alamaz; band/eşik mantığı adetTierBadges'ta.
              const tierBadges =
                group.groupKey === "adet" && !isArea && !hasVolumeAdet
                  ? adetTierBadges(
                      displayedPriceHints["adet"],
                      new Set(visibleOptions.map((o) => o.optionKey)),
                    )
                  : undefined;
              return (
                <OptionGroup
                  key={group.groupKey}
                  groupKey={group.groupKey}
                  groupLabel={group.groupLabel}
                  options={visibleOptions}
                  selected={effSel[group.groupKey] ?? baseSelections[group.groupKey] ?? ""}
                  locked={group.locked}
                  disabled={resolved.disabledGroups.has(group.groupKey)}
                  onSelect={(optionKey) => handleSelect(group.groupKey, optionKey)}
                  priceHints={displayedPriceHints[group.groupKey]}
                  hintMode={isArea && group.groupKey === "malzeme" ? "total" : groupHintMode(product, group.groupKey)}
                  layout={isArea && group.groupKey === "malzeme" ? "cards" : "auto"}
                  unitSuffix={isArea && group.groupKey === "malzeme" ? "/m²" : undefined}
                  volumeBadge={hasVolumeAdet && group.groupKey === "adet"}
                  tierBadges={tierBadges}
                  popularKey={group.groupKey === "paket" ? popularPaketKey : undefined}
                />
              );
            })}
            {/* Set adedi kadar tasarım alanı: m² üründe girilen adet, diğerlerinde 1 (sepette artarsa
                sepet satırında tamamlanır — CartDesignSlots). */}
            <DesignUpload slotCount={isArea ? areaAdet : state.quantity} />
          </div>
        </div>

        {/* SAĞ — sticky fiyat özet kartı (mobilde seçeneklerin altında akar) */}
        <aside className="mt-6 lg:mt-0 lg:sticky lg:top-24">
          <div className="rounded-xl border border-paper-200 bg-paper-50 shadow-lg p-5 space-y-4">
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink-900">Toplam Fiyat</span>
                <span className="text-xs text-ink-500">{kdvDahil ? "KDV dahil" : "KDV hariç"}</span>
              </div>
              {canBuy ? (
                <>
                  <Price amount={show(total)} size="xl" className="mt-1 block text-brand-600 tabular-nums" />
                  {/* Fiyat şoku önleme: büyük rakamın NEYİN karşılığı olduğunu hemen altında söyle. */}
                  <p className="mt-0.5 text-xs text-ink-500">
                    {isArea
                      ? Number(effSel.en) > 0 && Number(effSel.boy) > 0
                        ? `${effSel.en}×${effSel.boy} cm için${areaAdet > 1 ? ` · ${areaAdet} adet` : ""}`
                        : null
                      : effSel.adet && Number(effSel.adet) > 0
                        ? `${Number(effSel.adet).toLocaleString("tr-TR")} adet için`
                        : null}
                  </p>
                  {areaAdet > 1 && (
                    <p className="mt-0.5 text-xs text-ink-500">
                      Birim:{" "}
                      <Price amount={show(total / areaAdet)} size="sm" className="text-ink-700 align-baseline" />{" "}
                      / adet
                    </p>
                  )}
                  {total > 100 && (
                    // Taksit KDV DAHİL toplamdan hesaplanır (total/3). Yanındaki matrah
                    // "net" diye etiketliyken taksit tabanı sanılıyordu (test geri bildirimi
                    // 2026-08) → "KDV hariç" olarak açık yazılır.
                    <p className="mt-1 text-xs text-ink-500">
                      3 taksitle <Price amount={getInstallmentAmount(show(total), 3)} size="sm" className="text-ink-700" />
                      &apos;den · KDV hariç <Price amount={show(total) / 1.2} size="sm" className="text-ink-700" />
                    </p>
                  )}
                </>
              ) : isArea && startingPrice > 0 ? (
                // Ölçü girilmeden başlangıç fiyatı — "Teklif Al" hissini kırar.
                <>
                  <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
                    <Price amount={show(startingPrice)} size="xl" className="text-brand-600 tabular-nums" />
                    <span className="text-sm text-ink-500">&apos;den başlayan</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    En/boy ölçüsünü girin, fiyatınız anında hesaplansın.
                  </p>
                </>
              ) : uploadPending ? (
                // Fiyat hesaplanabiliyor; yalnız dosya bekleniyor → "Teklif Al" yazmak yanıltıcı olur.
                <Price amount={show(total)} size="xl" className="mt-1 block text-brand-600 tabular-nums" />
              ) : (
                <span className="mt-1 block text-3xl font-medium tracking-tight text-brand-600">Teklif Al</span>
              )}
            </div>

            {ctaReason && <p className="text-xs text-ink-500">{ctaReason}</p>}

            <div ref={ctaRef}>
              {canBuy ? (
                <Button size="lg" fullWidth onClick={handleAddToCart} disabled={state.justAdded}>
                  {state.justAdded ? (
                    <>
                      <CheckCircle size={20} weight="bold" /> Sepete Eklendi
                    </>
                  ) : (
                    <>
                      <ShoppingBagOpen size={20} weight="bold" /> Sepete Ekle
                    </>
                  )}
                </Button>
              ) : uploadPending ? (
                // Yükleme sürerken "Teklif Al"a DÖNMEZ — fiyat belli, sadece dosya bekleniyor.
                <Button size="lg" fullWidth disabled>
                  <SpinnerGap size={20} weight="bold" className="animate-spin" /> Dosya yükleniyor…
                </Button>
              ) : (
                <Button size="lg" fullWidth variant="secondary" onClick={handleQuoteClick}>
                  <ChatCircleText size={20} weight="bold" /> Teklif Al / WhatsApp
                </Button>
              )}
            </div>

            {/* "En geç X kargoda" teslim tahmini KALDIRILDI (2026-08-08 karar): tarihli
                kargo sözü, üretim süresiyle karışıp yanlış beklenti yaratıyordu. Üretim
                süresi başlık altında zaten yazıyor; kargo süresi bilinçli olarak verilmiyor. */}

            {/* Kargo şeffaflığı — sepetteki +79₺ sürprizini önler. */}
            {canBuy && (
              <p className="text-xs text-ink-500 flex items-center gap-1.5">
                <Truck size={14} weight="fill" className="text-ink-400" />
                Kargo {shippingInfo.fee}₺, {shippingInfo.freeThreshold.toLocaleString("tr-TR")}₺ üzeri ücretsiz
              </p>
            )}

            <p className="text-[11px] leading-relaxed text-ink-500">
              {canBuy
                ? "Sipariş sonrası ekibimiz sizinle iletişime geçer; baskı, tasarımınızı onaylamanızın ardından başlar."
                : "Teklif Al'a tıkla, 24 saat içinde sana dönelim, hiçbir ödeme veya taahhüt yok."}
            </p>
          </div>
        </aside>
      </div>

      <MobileCta
        total={show(total)}
        canBuy={canBuy}
        uploading={uploadPending}
        productName={product.name}
        visible={stickyBarVisible}
        onAddToCart={canBuy ? handleAddToCart : handleQuoteClick}
      />
    </ConfiguratorContext.Provider>
  );
}
