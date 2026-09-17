"use client";

import { cn } from "@markala/ui";
import { WarningCircle, PencilSimple, UploadSimple, PaintBrush, ClockCountdown } from "@phosphor-icons/react";
import type { DesignBrief } from "@markala/types";
import { useConfigurator } from "./context";
import type { DesignMode } from "./reducer";
import { DesignSlots, slotlariNormalize } from "@/components/product/design-slots";

/**
 * Tasarım adımı (2026-09-17, dış rapor 6. bölüm ile yeniden kuruldu).
 *
 * Üç yol, tek seçim:
 *  1. Dosyam hazır            → set başına dosya alanları (DesignSlots) + kalite uyarıları
 *  2. Tasarım desteği istiyorum → ücretsiz; brief formu (metin, logo/referans, renk, yön, yüz, not)
 *  3. Dosyayı sonra göndereceğim → siparişi bitirir, üretim dosya gelene kadar BAŞLAMAZ
 *
 * `slotCount` = sepet set adedi: m² ürünlerde girilen adet (2 bayrak → 2 alan), matris ürünlerde
 * (kartvizit) ürün sayfasında 1 (set adedi sepette artırılırsa eksik alanlar sepet satırında
 * tamamlanır — CartDesignSlots). Dosya ve hata mantığı DesignSlots'ta; bu bileşen yalnız
 * konfigüratör state'ine bağlar. Sağ sütunda fiyat kartının altındaki kendi kartında render edilir.
 *
 * Brief'in logo/referans dosyaları da `designs[0]`da taşınır → mevcut musteri-dosyalari /
 * Drive taşıma hattından geçer, panelde "Tasarım Dosyaları"nda görünür.
 */
export function DesignUpload({ slotCount = 1 }: { slotCount?: number }) {
  const { state, dispatch, product } = useConfigurator();
  const { designMode, brief } = state;
  const isArea = (product as { pricingMode?: string }).pricingMode === "area";
  const setMode = (mode: DesignMode) => dispatch({ type: "SET_DESIGN_MODE", mode });
  const setBrief = (patch: Partial<DesignBrief>) => dispatch({ type: "SET_BRIEF", patch });

  const secenekler: Array<{ mode: DesignMode; icon: React.ReactNode; baslik: string; alt: string }> = [
    { mode: "hazir", icon: <UploadSimple size={18} weight="bold" />, baslik: "Dosyam hazır", alt: "Baskıya uygun dosyanızı yükleyin." },
    { mode: "destek", icon: <PaintBrush size={18} weight="bold" />, baslik: "Tasarım desteği istiyorum", alt: "Grafik ekibimiz ücretsiz hazırlar, onayınıza sunar." },
    { mode: "sonra", icon: <ClockCountdown size={18} weight="bold" />, baslik: "Dosyayı sonra göndereceğim", alt: "Siparişi şimdi verin; üretim dosya gelince başlar." },
  ];

  return (
    <div>
      <span className="block text-sm font-medium text-ink-900">Tasarım</span>
      <div role="radiogroup" aria-label="Tasarım yolu" className="mt-2 grid gap-2">
        {secenekler.map((s) => {
          const on = designMode === s.mode;
          return (
            <button
              key={s.mode}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setMode(s.mode)}
              className={cn(
                "flex items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
                on ? "border-[#4B3AA0] bg-paper-50 shadow-sm" : "border-paper-200 bg-paper-50 hover:border-ink-300",
              )}
            >
              <span className={cn("mt-0.5 flex-none", on ? "text-[#4B3AA0]" : "text-ink-500")}>{s.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-900">{s.baslik}</span>
                <span className="block text-xs text-ink-500">{s.alt}</span>
              </span>
            </button>
          );
        })}
      </div>

      {designMode === "hazir" && (
        <>
          <div className="mt-4">
            <DesignSlots
              count={slotCount}
              designs={slotlariNormalize(state.designs, slotCount)}
              onChange={(designs) => dispatch({ type: "SET_DESIGNS", designs })}
              onUploadingChange={(n) => dispatch({ type: "SET_UPLOADING", value: n })}
              idPrefix="urun"
            />
          </div>

          {/* Dosya kalitesi bilgilendirmesi (Hasan talebi 2026-08-23): müşteriler yapay zekâ
              çıktısı / düşük çözünürlüklü dosya gönderiyor, baskıda bulanıklık çıkınca itiraz
              oluyor. Uyarı SİPARİŞ ÖNCESİ burada; sözleşme maddesi (7.C), sipariş başarı sayfası
              ve onay e-postasında da tekrarlanır. Uyarının yanında ücretsiz vektörel çizim
              teklifi verilir — kuru "sorumlu değiliz" yerine hizmete çevrilir. */}
          <div className="mt-3 space-y-2">
            <p className="flex items-start gap-2 text-xs text-ink-700 bg-warning/10 border border-warning/25 rounded-md px-3 py-2 leading-relaxed">
              <WarningCircle size={14} className="flex-none mt-0.5 text-warning" weight="fill" />
              <span>
                <strong className="text-ink-900">Dosya kalitesi hakkında:</strong> Yapay zekâ ile
                üretilmiş, düşük çözünürlüklü veya vektörel olmayan dosyalarda baskıda bulanıklık
                ve metin bozulmaları oluşabilir; bu tür dosyalardan kaynaklanan kalite
                sorunlarından markala.com.tr sorumlu değildir. Baskıya en uygun format: vektörel
                PDF/AI (yazılar convert edilmiş) veya 300 DPI CMYK.
              </span>
            </p>
            <p className="flex items-start gap-2 text-xs text-ink-700 bg-brand-100 border border-brand-300 rounded-md px-3 py-2 leading-relaxed">
              <PencilSimple size={14} className="flex-none mt-0.5 text-brand-700" weight="fill" />
              <span>
                Dosyanız bu niteliklere uygun değilse endişelenmeyin: görselinizi yine de
                yükleyin, grafik ekibimiz görselinize istinaden{" "}
                <strong className="text-ink-900">vektörel çizimi ücretsiz hazırlar</strong> ve
                baskı öncesi onayınıza sunar. Üretim, tasarım onayınızdan sonra başlar.
              </span>
            </p>
          </div>
        </>
      )}

      {designMode === "destek" && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-ink-700 leading-relaxed">
            Ne basılacağını yazın, elinizdeki logo ve örnekleri ekleyin. Taslağı sipariş sonrası
            onayınıza sunarız; <strong className="text-ink-900">üretim onayınızdan sonra başlar.</strong>
          </p>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-900">
              Basılacak metin <span className="font-normal text-ink-500">· isim, unvan, slogan, telefon, adres…</span>
            </span>
            <textarea
              value={brief.metin ?? ""}
              onChange={(e) => setBrief({ metin: e.target.value.slice(0, 1500) })}
              rows={4}
              maxLength={1500}
              placeholder={"Örn.\nAhmet Yılmaz – Satış Müdürü\n0532 000 00 00 · ahmet@firma.com\nFirma Adı A.Ş."}
              className="w-full rounded-lg border border-paper-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40"
            />
          </label>

          {/* 2026-09-14 (Hasan): destek isteyen müşteri de logo/görsel/metin gönderir; set başına alan
              korunur (2 farklı kartvizit → 2 materyal alanı). Dosyalar yol değişince korunur. */}
          <DesignSlots
            count={slotCount}
            designs={slotlariNormalize(state.designs, slotCount)}
            onChange={(designs) => dispatch({ type: "SET_DESIGNS", designs })}
            onUploadingChange={(n) => dispatch({ type: "SET_UPLOADING", value: n })}
            idPrefix="brief"
            compact
            etiket="Logo ve referans görseller"
            etiketCoklu="Materyal"
            ipucu="isteğe bağlı · logo, eski baskı, beğendiğiniz örnek · AI, PDF, JPG, PNG, WEBP · ≤ 50 MB"
          />

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-900">
              Renkler <span className="font-normal text-ink-500">· isteğe bağlı</span>
            </span>
            <input
              type="text"
              value={brief.renkler ?? ""}
              onChange={(e) => setBrief({ renkler: e.target.value.slice(0, 200) })}
              maxLength={200}
              placeholder="Örn. lacivert + beyaz, logodaki renkler"
              className="w-full rounded-lg border border-paper-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40"
            />
          </label>

          <div className={cn("grid gap-3", isArea ? "grid-cols-1" : "grid-cols-2")}>
            {/* m² ürünlerde yön en/boy ile zaten belli — soru sorulmaz. */}
            {!isArea && (
              <Segment
                label="Yön"
                value={brief.yon ?? "farketmez"}
                onChange={(v) => setBrief({ yon: v as DesignBrief["yon"] })}
                options={[
                  ["yatay", "Yatay"],
                  ["dikey", "Dikey"],
                  ["farketmez", "Fark etmez"],
                ]}
              />
            )}
            <Segment
              label="Yüz"
              value={brief.yuzler ?? "farketmez"}
              onChange={(v) => setBrief({ yuzler: v as DesignBrief["yuzler"] })}
              options={[
                ["tek", "Tek yüz"],
                ["cift", "Ön + arka"],
                ["farketmez", "Ürüne göre"],
              ]}
            />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-900">
              Not <span className="font-normal text-ink-500">· isteğe bağlı</span>
            </span>
            <textarea
              value={brief.notlar ?? ""}
              onChange={(e) => setBrief({ notlar: e.target.value.slice(0, 1000) })}
              rows={2}
              maxLength={1000}
              placeholder="Beğendiğiniz tarz, kaçınmamızı istediğiniz şeyler…"
              className="w-full rounded-lg border border-paper-300 px-3 py-2 text-sm text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/40"
            />
          </label>

          {!(brief.metin ?? "").trim() && (state.designs[0]?.files.length ?? 0) === 0 && (
            <p className="text-[11px] text-ink-500">
              Metin ya da logo eklerseniz ilk taslak çok daha hızlı gelir; boş bırakırsanız ekibimiz
              sipariş sonrası WhatsApp üzerinden ister.
            </p>
          )}
        </div>
      )}

      {designMode === "sonra" && (
        <p className="mt-4 flex items-start gap-2 text-xs text-ink-700 bg-warning/10 border border-warning/25 rounded-md px-3 py-2 leading-relaxed">
          <ClockCountdown size={14} className="flex-none mt-0.5 text-warning" weight="fill" />
          <span>
            <strong className="text-ink-900">Üretim, dosyanız gelene kadar başlamaz</strong> ve
            teslim süresi o kadar uzar. Dosyayı sipariş sonrası sepetten, hesabınızdan ya da
            WhatsApp üzerinden sipariş numaranızla gönderebilirsiniz.
          </span>
        </p>
      )}
    </div>
  );
}

function Segment({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-ink-900">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => {
          const on = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(v)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                on ? "border-[#4B3AA0] bg-[#4B3AA0] text-paper-50" : "border-paper-300 text-ink-700 hover:border-ink-300",
              )}
            >
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
