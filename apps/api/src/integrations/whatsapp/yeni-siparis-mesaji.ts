/**
 * YENİ SİPARİŞ WHATSAPP BİLDİRİMİ — mesaj kurgusu (2026-09-06, Hasan).
 *
 * Sipariş düştüğünde işletme hattına ("0324 433 33 51") bağlı WhatsApp API'sinden Hasan'ın
 * hattına bildirim gider. Hasan: "mesajda biraz detay da verelim, en önemlisi ödeme alındı mı."
 *
 * ── NEDEN ŞABLON (template), NEDEN SERBEST METİN DEĞİL ─────────────────────────────────
 * WhatsApp Cloud API'de serbest metin YALNIZ alıcı son 24 saat içinde işletmeye yazdıysa
 * gönderilebilir. Sipariş gecenin 03:00'ünde de düşer; o pencere çoğu zaman kapalıdır ve
 * bildirim sessizce kaybolurdu. Bu yüzden Meta'da onaylı `yeni_siparis_bildirimi` şablonu
 * kullanılır — her saatte teslim edilir.
 *
 * ── ŞABLON PARAMETRE KISITLARI ────────────────────────────────────────────────────────
 * Şablon değişkenleri satır sonu/sekme İÇEREMEZ ve arka arkaya boşluk kabul edilmez (Meta
 * #132000/#132012 hatası). Bu yüzden her parametre tek satıra indirgenir ve kırpılır;
 * ürün listesi virgülle birleştirilir. Kırpma sessiz veri kaybı değil: taşan ürün sayısı
 * "+N ürün" olarak yazılır, tam detay panelde.
 */

/** Şablondaki {{1}}..{{5}} sırası. */
export const SABLON_ADI = "yeni_siparis_bildirimi";
export const SABLON_DILI = "tr";

/** Bir parametrenin en fazla uzunluğu — Meta gövde sınırına (1024) rahat sığsın. */
const PARAM_TAVANI = 160;

export type SiparisKalemi = { productName: string; quantity: number };

export type YeniSiparisGirdisi = {
  orderNumber: string;
  totalAmount: unknown; // Prisma Decimal | number | string
  paymentStatus: string | null;
  paymentMethod: string | null;
  items: SiparisKalemi[];
  musteriAdi?: string | null;
  email?: string | null;
};

/** Satır sonu/sekme/çoklu boşluk temizler, kırpar. Şablon parametreleri bunu ZORUNLU kılar. */
export function tekSatir(deger: unknown, tavan = PARAM_TAVANI): string {
  const s = String(deger ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (s.length <= tavan) return s;
  return s.slice(0, tavan - 1).trimEnd() + "…";
}

/**
 * Ödeme durumu — mesajın EN ÖNEMLİ alanı (Hasan). Belirsiz bir ifade ("işleniyor") üretmek
 * yerine bilinmeyen durumlar açıkça "bilinmiyor" der: yanlış bir "Ödendi" görüp ürünü baskıya
 * vermek, geç fark edilen bir tahsilattan çok daha pahalı.
 */
export function odemeDurumu(paymentStatus: string | null, paymentMethod: string | null): string {
  const yontem = (paymentMethod ?? "").toLowerCase();
  const yontemAdi =
    yontem === "havale" || yontem === "eft"
      ? "havale/EFT"
      : yontem === "cari" || yontem === "acik-hesap"
        ? "cari (açık hesap)"
        : yontem === "kart" || yontem === "kredi-karti" || yontem === "iyzico"
          ? "kredi kartı"
          : yontem || "belirtilmemiş";

  switch ((paymentStatus ?? "").toLowerCase()) {
    case "basarili":
      return `✅ ALINDI — ${yontemAdi}`;
    case "beklemede":
      // Havalede para henüz gelmemiştir; cari zaten sonradan faturalanır. İkisi de "ödenmedi".
      return yontem === "cari" || yontem === "acik-hesap"
        ? "🧾 CARİ — sonra faturalanacak"
        : `⏳ BEKLİYOR — ${yontemAdi}, ödeme alınmadı`;
    case "basarisiz":
      return `❌ BAŞARISIZ — ${yontemAdi}`;
    case "iade_edildi":
    case "iade-edildi":
      return `↩️ İADE EDİLDİ — ${yontemAdi}`;
    default:
      return `❓ Ödeme durumu bilinmiyor — ${yontemAdi}`;
  }
}

/** "3.480,00 TL" — Türkçe biçim. Sayıya çevrilemeyen değerde tutar uydurulmaz. */
export function tutarYaz(totalAmount: unknown): string {
  // null/undefined/boş dizge Number() ile 0'a düşer → mesajda "0,00 TL" gibi YANLIŞ bir tutar
  // görünürdü. Eksik veri, sıfır tutarlı bir siparişten ayrılmalı.
  if (totalAmount === null || totalAmount === undefined) return "—";
  const ham =
    typeof totalAmount === "object"
      ? (totalAmount as { toString(): string }).toString()
      : String(totalAmount);
  if (!ham.trim()) return "—";
  const n = Number(ham);
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}

/** "1000 adet Klasik Kartvizit, 5 adet Emlak Afişi +2 ürün" */
export function urunOzeti(items: SiparisKalemi[]): string {
  if (!items?.length) return "ürün bilgisi yok";
  const parcalar = items.map((i) => `${i.quantity} adet ${i.productName}`);
  let ozet = parcalar[0]!;
  let kullanilan = 1;
  for (const p of parcalar.slice(1)) {
    // "+N ürün" ekinin sığacağı yeri baştan ayır.
    if (`${ozet}, ${p}`.length > PARAM_TAVANI - 12) break;
    ozet += `, ${p}`;
    kullanilan++;
  }
  const kalan = parcalar.length - kullanilan;
  return tekSatir(kalan > 0 ? `${ozet} +${kalan} ürün` : ozet);
}

/**
 * Şablonun {{1}}..{{5}} parametreleri — SIRA ŞABLONA BAĞLIDIR, değiştirmeden önce Meta'daki
 * `yeni_siparis_bildirimi` gövdesine bakın:
 *   🔔 Yeni sipariş: {{1}} / 💳 Ödeme: {{2}} / 💰 Tutar: {{3}} / 👤 Müşteri: {{4}} / 📦 {{5}}
 */
export function yeniSiparisParametreleri(o: YeniSiparisGirdisi): string[] {
  const musteri = tekSatir(o.musteriAdi?.trim() || o.email?.trim() || "—", 60);
  return [
    tekSatir(o.orderNumber, 40),
    tekSatir(odemeDurumu(o.paymentStatus, o.paymentMethod), 80),
    tekSatir(tutarYaz(o.totalAmount), 40),
    musteri || "—",
    urunOzeti(o.items ?? []),
  ];
}

/**
 * WhatsApp numarasını Meta'nın beklediği biçime indirger: yalnız rakamlar, ülke kodlu.
 * "0531 900 41 02" → "905319004102". Zaten 90 ile başlıyorsa dokunulmaz.
 * Geçersizse null döner — uydurulmuş bir numaraya mesaj göndermektense göndermemek yeğdir.
 */
export function numarayiNormalize(ham: string | undefined | null): string | null {
  const d = String(ham ?? "").replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("90") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return `90${d.slice(1)}`;
  if (d.length === 10) return `90${d}`; // 5319004102
  return d.length >= 11 && d.length <= 15 ? d : null; // yurt dışı numarası olabilir
}
