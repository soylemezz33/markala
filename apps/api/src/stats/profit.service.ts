import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { computeItemCostTotal } from "../orders/costing";
import { gerceklesenSiparis } from "./gerceklesen-siparis";

/**
 * KÂR ANALİZİ — 2026-08-20 (Hasan talebi: "ciroya tıklayınca ne kadar kâr etmişiz").
 *
 * TEMEL KURALLAR (yanlış rakam üretmemek için bilerek katı):
 *
 * 1) CİRO = KDV HARİÇ. `lineTotal` KDV DAHİL tutuluyor (doğrulandı: subtotal 986,90 →
 *    vat 164,48 = 986,90 − 986,90/1,2). KDV devlete ait, kâr değil → 1,2'ye bölünür.
 *
 * 2) KARGO BEDELİ KÂRA KATILMAZ. Müşteriden alınan kargo ücreti var ama kargo firmasına
 *    ödenen tutar sistemde YOK; ikisini karşılaştıramayız. Kâra katmak uydurma olurdu.
 *
 * 3) MALİYET İKİ FARKLI YOLDAN GELİR — ürünün fiyatlama moduna göre:
 *    • "area" (branda/folyo/dekota): fiyat motoru zaten `satış_haric = maliyet × marj`
 *      diye çalışıyor. Yani maliyet = KDV hariç satış ÷ marj. Marj bir AYAR (şu an 1,2).
 *    • "additive" (kartvizit vb.): maliyet, fiyat satırındaki `cost` alanından gelir ve
 *      fiyattan BAĞIMSIZDIR. Aynı fiyat motoru `price` yerine `cost` beslenerek
 *      çalıştırılır → hesap mantığı satış fiyatıyla birebir aynı olur.
 *
 * 4) MALİYETİ BİLİNMEYEN KALEM "0 MALİYET" SAYILMAZ. Aksi hâlde %100 kâr gösterirdi ki
 *    bu tehlikeli bir yanlış olur. Katalogda 836 aktif üründe (tüm İSG) hiç maliyet yok.
 *    Böyle kalemler ayrı toplanır ve arayüzde "maliyeti girilmemiş" olarak gösterilir.
 *
 * 5) SİPARİŞ SEVİYESİ İNDİRİM CİRODAN DÜŞÜLÜR (2026-09-02 düzeltmesi).
 *    `lineTotal` kalem tutarıdır ve kupon / kurumsal iskonto / puan / havale %5 gibi
 *    SİPARİŞ seviyesindeki indirimleri İÇERMEZ — onlar `orders.discount` alanında durur.
 *    Eskiden ciro = Σ lineTotal ÷ 1,2 idi; indirimler hiç düşülmüyordu. Canlı veride
 *    1.272,11 ₺ indirim yok sayılıyordu → ciro ve KÂR, KDV hariç 1.060 ₺ fazla
 *    görünüyordu (Hasan bildirdi: dashboard 25.401,63 derken bu sayfa 20.977,28 diyordu).
 *    İndirim kaleme lineTotal oranında dağıtılır ki ürün bazlı kâr da doğru olsun.
 *
 *    DİKKAT: maliyet fallback'ine İNDİRİMSİZ ciro verilir. "area" ürünlerde
 *    maliyet = KDV hariç satış ÷ marj; indirimli tutar geçilirse maliyet de düşerdi —
 *    oysa müşteriye indirim yapmak bizim maliyetimizi değiştirmez.
 *
 * 6) MALİYET SNAPSHOT'I (2026-08-24, kalıcı çözüm): orders.service.create sipariş anında
 *    `OrderItem.costTotal` yazar — maliyet güncellemesi GEÇMİŞ kârı artık DEĞİŞTİRMEZ.
 *    Snapshot'sız eski kalemlerde fallback: ürünün güncel maliyetinden hesap
 *    (orders/costing.ts — sipariş yazımıyla AYNI fonksiyon). Eski kalemler tek seferlik
 *    backfill ile dolduruldu (scripts/siparis/backfill-maliyet.cjs).
 */
@Injectable()
export class ProfitService {
  private readonly logger = new Logger(ProfitService.name);
  private static readonly VAT_DIVISOR = 1.2;

  constructor(private prisma: PrismaService, private settings: SettingsService) {}

  async summary(days?: number) {
    const since =
      days && Number.isFinite(days) && days > 0
        ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        : undefined;

    // GERÇEKLEŞEN satışlar: ödemesi başarılı (veya cari) + iptal DEĞİL + silinmemiş.
    // stats.service'teki ciro tanımıyla aynı olmalı, yoksa iki ekran çelişir.
    // Sipariş filtresi TEK YERDE: kalem sorgusu ile mutabakat toplamı aynı kümeyi
    // saymazsa iki rakam çelişir (bu sayfanın zaten yaşadığı sorun).
    const siparisFiltresi = gerceklesenSiparis(since);

    const [items, siparisToplam] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: { order: siparisFiltresi },
        select: {
          productId: true,
          productSlug: true,
          productName: true,
          quantity: true,
          lineTotal: true,
          costTotal: true,
          configuration: true,
          // discount/subtotal: sipariş seviyesi indirimi kaleme dağıtmak için.
          order: { select: { createdAt: true, discount: true, subtotal: true } },
        },
      }),
      // Dashboard'daki "Toplam Ciro" ile birebir aynı küme — mutabakat bunun üstüne kurulur.
      this.prisma.order.aggregate({
        where: siparisFiltresi,
        _sum: { total: true, subtotal: true, discount: true, shippingFee: true, vat: true },
        _count: true,
      }),
    ]);

    // Maliyet için ürün seçenek/fiyat satırları — tek seferde çek (N+1 olmasın).
    const productIds = [...new Set(items.map((i) => i.productId).filter((v): v is string => !!v))];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          // content: area (m²) ürünlerde gerçek maliyet content.maliyetUsd'de duruyor.
          select: { id: true, pricingMode: true, options: true, prices: true, content: true },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const pricing = await this.settings.getPricing();
    const marj = Number(pricing?.marj) > 0 ? Number(pricing.marj) : 1.2;

    type Agg = {
      productSlug: string;
      productName: string;
      adet: number;
      ciro: number; // KDV hariç
      maliyet: number;
      maliyetBilinen: boolean;
    };
    const agg = new Map<string, Agg>();
    const aylik = new Map<string, { ciro: number; maliyet: number; bilinen: boolean }>();

    let ciroToplam = 0;
    let maliyetToplam = 0;
    let ciroMaliyetiBilinmeyen = 0;

    for (const it of items) {
      const kalemTutar = Number(it.lineTotal) || 0;
      const sipAraToplam = Number(it.order.subtotal) || 0;
      const sipIndirim = Number(it.order.discount) || 0;
      // İndirimi kaleme AGIRLIKLI dağıt: pahalı kalem indirimin çoğunu üstlenir.
      // sipAraToplam 0 ise (olmamalı) bölme yapma — indirim 0 sayılır.
      const kalemIndirim = sipAraToplam > 0 ? (sipIndirim * kalemTutar) / sipAraToplam : 0;

      /** İNDİRİMSİZ, KDV hariç kalem tutarı — YALNIZ maliyet fallback'i için. */
      const ciroHaricBrut = kalemTutar / ProfitService.VAT_DIVISOR;
      /** Gerçek ciro: indirim düşülmüş, KDV hariç. Kâr bunun üzerinden hesaplanır. */
      const ciroHaric = (kalemTutar - kalemIndirim) / ProfitService.VAT_DIVISOR;

      // Önce SNAPSHOT (sipariş anındaki maliyet); yoksa güncel maliyetten fallback hesap.
      // Fallback'e ciroHaricBrut gider: "area" ürünlerde maliyet = satış ÷ marj olduğu
      // için indirimli tutar geçilseydi maliyet de düşerdi — indirim maliyeti değiştirmez.
      const cost =
        it.costTotal != null
          ? Number(it.costTotal)
          : computeItemCostTotal(
              it.productId ? byId.get(it.productId) : undefined,
              it.configuration,
              it.quantity ?? 1,
              ciroHaricBrut,
              marj,
              // area ürünlerde kur/minM2 olmadan maliyet hesaplanamaz.
              pricing,
            );

      ciroToplam += ciroHaric;
      if (cost === null) ciroMaliyetiBilinmeyen += ciroHaric;
      else maliyetToplam += cost;

      const key = it.productSlug || it.productName;
      const cur =
        agg.get(key) ??
        { productSlug: it.productSlug, productName: it.productName, adet: 0, ciro: 0, maliyet: 0, maliyetBilinen: true };
      cur.adet += it.quantity ?? 0;
      cur.ciro += ciroHaric;
      if (cost === null) cur.maliyetBilinen = false;
      else cur.maliyet += cost;
      agg.set(key, cur);

      const ay = it.order.createdAt.toISOString().slice(0, 7);
      const m = aylik.get(ay) ?? { ciro: 0, maliyet: 0, bilinen: true };
      m.ciro += ciroHaric;
      if (cost === null) m.bilinen = false;
      else m.maliyet += cost;
      aylik.set(ay, m);
    }

    const urunler = [...agg.values()]
      .map((u) => ({
        ...u,
        ciro: round2(u.ciro),
        maliyet: round2(u.maliyet),
        kar: u.maliyetBilinen ? round2(u.ciro - u.maliyet) : null,
        marjYuzde: u.maliyetBilinen && u.ciro > 0 ? round2(((u.ciro - u.maliyet) / u.ciro) * 100) : null,
      }))
      .sort((a, b) => (b.kar ?? -1) - (a.kar ?? -1));

    const karToplam = ciroToplam - ciroMaliyetiBilinmeyen - maliyetToplam;
    const kapsananCiro = ciroToplam - ciroMaliyetiBilinmeyen;

    return {
      // Kapsam bilgisi: rapor okunurken "neyin dahil olduğu" görünsün.
      kapsam: {
        gunSayisi: days ?? null,
        kalemSayisi: items.length,
        not: "Ciro KDV hariç ve indirimler düşülmüştür. Kargo bedeli kâra dahil edilmez (kargo maliyeti sistemde yok).",
      },
      /**
       * MUTABAKAT — dashboard'daki "Toplam Ciro" ile bu sayfanın ilişkisini açık eder.
       * İkisi farklı şeyleri ölçüyor ve bu fark daha önce çelişki gibi görünüyordu:
       *   tahsilEdilen (dashboard) = urunAraToplam − indirim + kargo
       *   ciro (bu sayfa)          = (urunAraToplam − indirim) ÷ 1,2
       */
      mutabakat: {
        siparisSayisi: siparisToplam._count,
        /** Kalem tutarları toplamı — KDV dahil, indirim ÖNCESİ. */
        urunAraToplam: round2(Number(siparisToplam._sum.subtotal ?? 0)),
        /** Kupon + kurumsal iskonto + puan + havale indirimi. */
        indirim: round2(Number(siparisToplam._sum.discount ?? 0)),
        /** Müşteriden alınan kargo bedeli — kâra katılmaz (kargo gideri sistemde yok). */
        kargo: round2(Number(siparisToplam._sum.shippingFee ?? 0)),
        /** Dashboard'da "Toplam Ciro" olarak görünen tutar (KDV + kargo dahil). */
        tahsilEdilen: round2(Number(siparisToplam._sum.total ?? 0)),
        /** Devlete ait KDV payı — kâr değildir. */
        kdv: round2(Number(siparisToplam._sum.vat ?? 0)),
      },
      toplam: {
        ciro: round2(ciroToplam),
        maliyet: round2(maliyetToplam),
        kar: round2(karToplam),
        marjYuzde: kapsananCiro > 0 ? round2((karToplam / kapsananCiro) * 100) : null,
        /** Maliyeti girilmemiş ürünlerden gelen ciro — kâr hesabına KATILMAZ. */
        maliyetiBilinmeyenCiro: round2(ciroMaliyetiBilinmeyen),
      },
      urunler,
      aylik: [...aylik.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([ay, v]) => ({
          ay,
          ciro: round2(v.ciro),
          maliyet: round2(v.maliyet),
          kar: v.bilinen ? round2(v.ciro - v.maliyet) : null,
        })),
    };
  }

}

function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}
