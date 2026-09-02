/**
 * Havale/EFT banka bilgileri — API tarafı kopyası.
 *
 * NEDEN AYRI DOSYA (2026-09-02 üretim olayı):
 * Bu sabitler önce packages/types'a konmuştu. O paket main alanında HAM
 * TypeScript kaynağı yayınlıyor (`"main": "./src/index.ts"`). API'nin oradaki
 * mevcut kullanımları yalnız TİP olduğu için derlemede siliniyordu; ilk ÇALIŞMA
 * ZAMANI değeri import edildiğinde derlenmiş dist `require("@markala/types")`
 * yaptı ve Node .ts dosyasını okuyamayıp patladı:
 *
 *   file:///app/packages/types/src/index.ts:1
 *   export type BadgeKind = ...
 *   SyntaxError: Unexpected token 'export'
 *
 * Konteyner crash-loop'a girdi, api.markala.com.tr 502 verdi. Bunu type-check,
 * birim testler ve Docker build'in HİÇBİRİ yakalayamaz — yalnız uygulama ayağa
 * kalkarken görünür.
 *
 * Kural: apps/api içinden packages/* ÇALIŞMA ZAMANI değeri import edilmez;
 * yalnız `import type` kullanılır. Buradaki değerler apps/api/src altında
 * olduğu için nest build tarafından dist'e derlenir ve sorun tekrarlamaz.
 *
 * Web tarafındaki eşi: packages/types/src/banka.ts (Next transpilePackages ile
 * sorunsuz derliyor). İkisinin AYNI kalmasını banka.spec.ts garanti eder —
 * IBAN'ın sessizce ayrışması kabul edilemez.
 */

export const BANKA_HESABI = {
  unvan:
    "324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Ticaret Limited Şirketi",
  banka: "Enpara Bank A.Ş.",
  iban: "TR21 0015 7000 0000 0131 9850 21",
  ibanDuz: "TR210015700000000131985021",
} as const;

/** Havale/EFT ile ödeyene uygulanan indirim (%). Web kopyasıyla aynı olmalı. */
export const HAVALE_INDIRIM_YUZDE = 5;

/** Ödeme yöntemi anahtarları — DB'de `orders.payment_method` sütununa yazılır. */
export const ODEME_YONTEMI = {
  kart: "iyzico",
  havale: "havale",
  cari: "cari",
} as const;
