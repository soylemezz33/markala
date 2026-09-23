/**
 * `dynamicParams = false` olan VE `revalidate` tanımlamayan rotalar build'de bir kez üretilir,
 * ISR'leri yoktur. Böyle bir yola `revalidatePath` atmak sayfayı tazelemez: tags manifest'te
 * bayat işaretlenir, Next yeniden üretmek yerine 404 döner ve bu KALICIDIR — işaret konteynerin
 * `.next/cache/fetch-cache/tags-manifest.json` dosyasında durduğu için `docker restart` bile
 * düzeltmez (imajdan yeni konteyner ya da dosyanın elle temizlenmesi gerekir).
 *
 * İki kez canlıda yaşandı: 2026-09-07 /hizmetler (~30 dk), 2026-09-23 /yardim (38 sayfa, ~1 saat).
 *
 * Liste `revalidate-guard.spec.ts` tarafından app dizini taranarak doğrulanır: yeni bir rotaya
 * `dynamicParams = false` eklenip `revalidate` eklenmezse test kırmızı olur.
 */
export const REVALIDE_KAPALI_ONEKLER = ["/hizmetler/", "/matbaa/", "/yardim/"] as const;

/** Verilen yol revalidatePath'e güvenle verilebilir mi? */
export function revalideEdilebilir(yol: string): boolean {
  return !REVALIDE_KAPALI_ONEKLER.some((onek) => yol.startsWith(onek));
}
