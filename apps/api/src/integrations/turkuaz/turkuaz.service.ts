import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../../storage/storage.service";
import { baslangicFiyatBellegiTemizle } from "../../products/baslangic-fiyati-bellegi";
import {
  kategorileriAyristir,
  urunleriAyristir,
} from "./turkuaz-xml";
import {
  ASGARI_SKU_SAYISI,
  KATEGORI_TANIMLARI,
  TEDARIKCI,
  URETIM_SURESI,
  UrunYuku,
  grupToYuk,
  gruplaVeEsle,
} from "./turkuaz-esleme";

/**
 * Turkuaz Promosyon XML senkronu (2026-09-17).
 *
 * TEDARİKÇİ KURALLARI (bayilik e-postası) — bu servisin varlık sebebi:
 *  1. Servise CANLI bağlanmak yasak → günde 1 kez çekilir, kendi DB'mizden servis edilir.
 *  2. Görseller kendi sunucumuza alınır; aynı görsel İKİNCİ KEZ ASLA istenmez
 *     (TedarikciUrun.gorseller kalıcı eşleme tablosudur).
 *  3. Her istek User-Agent içinde site adresimizi taşır.
 *  4. E-posta değişirse ApiKey değişir → anahtar env'dedir (TURKUAZ_XML_KEY), kodda değil.
 *
 * ENV (yalnız sunucuda): TURKUAZ_XML_KEY (zorunlu — yoksa senkron sessizce kapalı),
 * TURKUAZ_FIYAT_KDV_DAHIL ("1" = beslemedeki fiyat KDV dahil; varsayılan hariç),
 * REVALIDATE_SECRET + TURKUAZ_REVALIDATE_URL (senkron sonrası vitrin tazeleme, opsiyonel).
 */
@Injectable()
export class TurkuazService {
  private readonly logger = new Logger(TurkuazService.name);
  private calisiyor = false;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private get anahtar(): string {
    return (this.config.get<string>("TURKUAZ_XML_KEY") ?? "").trim();
  }

  private get userAgent(): string {
    // Kural 3: User-Agent site adresimizi içermek ZORUNDA.
    return "Mozilla/5.0 (compatible; MarkalaSync/1.0; +https://www.markala.com.tr)";
  }

  /** Gece 04:45 İstanbul — trafik dibi; yorum daveti (18:30) ve puan işleriyle (08:30) çakışmaz. */
  @Cron("45 4 * * *", { name: "tedarikci-turkuaz", timeZone: "Europe/Istanbul" })
  async handleGeceSenkronCron(): Promise<void> {
    try {
      await this.runSenkron();
    } catch (e) {
      this.logger.error(`turkuaz senkron cron hatası: ${(e as Error).message}`);
    }
  }

  async besleme(tip: "urunler" | "kategoriler"): Promise<string> {
    const url = `https://api.turkuazpromosyon.com.tr/xml/index.php?type=${tip}&imgUrl=1&key=${this.anahtar}`;
    const res = await fetch(url, { headers: { "User-Agent": this.userAgent } });
    if (!res.ok) throw new Error(`Turkuaz ${tip} beslemesi ${res.status} döndü`);
    return res.text();
  }

  /**
   * Tam senkron. Dönen özet SiteSetting("turkuaz.sync_ozet")'e de yazılır (panel/durum ucu).
   * Grup başına hata YUTULUR ve özete eklenir — tek bozuk kayıt geceyi düşürmez.
   */
  async runSenkron(): Promise<Record<string, unknown>> {
    if (!this.anahtar) {
      this.logger.debug("TURKUAZ_XML_KEY tanımsız — senkron kapalı.");
      return { kapali: true };
    }
    if (this.calisiyor) {
      this.logger.warn("Turkuaz senkronu zaten çalışıyor — ikinci tetik yok sayıldı.");
      return { zatenCalisiyor: true };
    }
    this.calisiyor = true;
    const baslangic = Date.now();
    const sayac = {
      yeni: 0,
      guncellenen: 0,
      degismeyen: 0,
      pasiflenen: 0,
      gorselIndirilen: 0,
      hatalar: [] as string[],
    };
    try {
      const [urunXml, kategoriXml] = [
        await this.besleme("urunler"),
        await this.besleme("kategoriler"),
      ];
      const skular = urunleriAyristir(urunXml);
      const kategoriler = kategorileriAyristir(kategoriXml);
      // Sigorta: besleme kırık/boş geldiyse mevcut kataloğu pasifleme faciasına girme.
      if (skular.filter((s) => s.durum).length < ASGARI_SKU_SAYISI) {
        throw new Error(
          `Besleme şüpheli küçük (${skular.length} SKU < ${ASGARI_SKU_SAYISI}) — senkron iptal.`,
        );
      }

      const { gruplar, atlanan } = gruplaVeEsle(skular, kategoriler);
      const fiyatKdvDahil = this.config.get<string>("TURKUAZ_FIYAT_KDV_DAHIL") === "1";
      const kategoriIdMap = await this.kategorileriHazirla();

      const eskiKayitlar = await this.prisma.tedarikciUrun.findMany({
        where: { tedarikci: TEDARIKCI },
      });
      const eskiByKodgrup = new Map(eskiKayitlar.map((k) => [k.kodgrup, k]));
      const beslemedeVar = new Set<string>();

      for (const grup of gruplar) {
        beslemedeVar.add(grup.kodgrup);
        try {
          const yuk = grupToYuk(grup, fiyatKdvDahil);
          const sonuc = await this.grubuIsle(yuk, kategoriIdMap, eskiByKodgrup.get(grup.kodgrup));
          sayac[sonuc.durum]++;
          sayac.gorselIndirilen += sonuc.gorselIndirilen;
        } catch (e) {
          sayac.hatalar.push(`${grup.kodgrup}: ${(e as Error).message}`);
        }
      }

      // Beslemeden kaybolan gruplar: ürün pasife düşer, kayıt ve görsel eşlemesi kalır.
      for (const eski of eskiKayitlar) {
        if (beslemedeVar.has(eski.kodgrup) || !eski.productId) continue;
        try {
          const r = await this.prisma.product.updateMany({
            where: { id: eski.productId, isActive: true },
            data: { isActive: false },
          });
          if (r.count > 0) sayac.pasiflenen++;
        } catch (e) {
          sayac.hatalar.push(`pasifleme ${eski.kodgrup}: ${(e as Error).message}`);
        }
      }

      baslangicFiyatBellegiTemizle();
      await this.vitrinTazele();

      const ozet = {
        bitis: new Date().toISOString(),
        sureSn: Math.round((Date.now() - baslangic) / 1000),
        beslemeSku: skular.length,
        grup: gruplar.length,
        ...sayac,
        hatalar: sayac.hatalar.slice(0, 20),
        hataSayisi: sayac.hatalar.length,
        atlanan,
      };
      await this.prisma.siteSetting.upsert({
        where: { key: "turkuaz.sync_ozet" },
        create: { key: "turkuaz.sync_ozet", value: ozet, group: "tedarikci" },
        update: { value: ozet },
      });
      this.logger.log(
        `Turkuaz senkron bitti: ${gruplar.length} grup — yeni ${sayac.yeni}, güncel ${sayac.guncellenen}, ` +
          `değişmeyen ${sayac.degismeyen}, pasif ${sayac.pasiflenen}, görsel ${sayac.gorselIndirilen}, hata ${sayac.hatalar.length}`,
      );
      return ozet;
    } finally {
      this.calisiyor = false;
    }
  }

  /** Promosyon kategorilerini slug→id haritası olarak döner; olmayanı oluşturur (var olanı EZMEZ). */
  private async kategorileriHazirla(): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    let sira = 900; // Mevcut kategorilerin arkasına; panelden taşınabilir.
    for (const [slug, tanim] of Object.entries(KATEGORI_TANIMLARI)) {
      const mevcut = await this.prisma.category.findUnique({ where: { slug } });
      if (mevcut) {
        map.set(slug, mevcut.id);
        continue;
      }
      const yeni = await this.prisma.category.create({
        data: {
          slug,
          name: tanim.name,
          shortDescription: tanim.shortDescription,
          longDescription: tanim.longDescription,
          imageUrl: "",
          startingPrice: 0,
          productionTime: URETIM_SURESI,
          sortOrder: sira++,
          isActive: true,
          // SEO/GEO içeriği (seo + faqs + seoBolumler — 41 kategoriyle aynı şema).
          // Yalnız OLUŞTURMADA yazılır; SEO oturumunun sonraki düzenlemeleri ezilmez.
          ...(tanim.content ? { content: tanim.content as never } : {}),
        },
      });
      map.set(slug, yeni.id);
      this.logger.log(`Kategori oluşturuldu: ${slug}`);
    }
    return map;
  }

  private async grubuIsle(
    yuk: UrunYuku,
    kategoriIdMap: Map<string, string>,
    eski: { id: string; productId: string | null; ozet: unknown; gorseller: unknown } | undefined,
  ): Promise<{ durum: "yeni" | "guncellenen" | "degismeyen"; gorselIndirilen: number }> {
    const kategoriId = kategoriIdMap.get(yuk.kategoriSlug);
    if (!kategoriId) throw new Error(`kategori bulunamadı: ${yuk.kategoriSlug}`);

    const eskiHash = (eski?.ozet as { hash?: string } | undefined)?.hash;
    let urun = eski?.productId
      ? await this.prisma.product.findUnique({ where: { id: eski.productId } })
      : null;
    // Panelden silinmiş ya da bağ hiç kurulmamış olabilir — slug son çıpadır.
    if (!urun) urun = await this.prisma.product.findUnique({ where: { slug: yuk.slug } });

    // Hızlı yol: içerik aynıysa hiçbir şeye dokunma (gece senkronunun olağan sonucu).
    if (urun && eski && eskiHash === yuk.ozetHash && urun.isActive === yuk.aktif) {
      if (eski.productId !== urun.id) {
        await this.prisma.tedarikciUrun.update({
          where: { id: eski.id },
          data: { productId: urun.id },
        });
      }
      return { durum: "degismeyen", gorselIndirilen: 0 };
    }

    // Görseller: yalnız eşlemede olmayan kaynaklar indirilir (kural 2 — tekrar istek yok).
    const gorselMap: Record<string, string> = { ...((eski?.gorseller as Record<string, string>) ?? {}) };
    let gorselIndirilen = 0;
    for (const kaynak of yuk.gorselKaynaklari) {
      if (gorselMap[kaynak]) continue;
      const url = await this.gorselIndir(kaynak);
      if (url) {
        gorselMap[kaynak] = url;
        gorselIndirilen++;
      }
    }
    const gorseller = yuk.gorselKaynaklari
      .map((k) => gorselMap[k])
      .filter((u): u is string => Boolean(u));

    let durum: "yeni" | "guncellenen";
    if (!urun) {
      urun = await this.prisma.product.create({
        data: {
          slug: yuk.slug,
          name: yuk.name,
          categoryId: kategoriId,
          shortDescription: yuk.shortDescription,
          description: yuk.description,
          basePrice: yuk.basePrice,
          productionTime: yuk.productionTime,
          images: gorseller,
          badges: ["Promosyon"],
          isActive: yuk.aktif,
          pricingMode: "additive",
          content: yuk.content as never,
        },
      });
      durum = "yeni";
    } else {
      // Var olan üründe yalnız TEDARİKÇİNİN sahibi olduğu alanlar güncellenir; isim,
      // açıklama, görsel ve içerik panel/SEO düzenlemelerine bırakılır (script kuralı:
      // panel emeği senkronla EZİLMEZ). Görseli boş kalmış ürün tamamlanır.
      await this.prisma.product.update({
        where: { id: urun.id },
        data: {
          basePrice: yuk.basePrice,
          isActive: yuk.aktif,
          ...(urun.images.length === 0 && gorseller.length > 0 ? { images: gorseller } : {}),
        },
      });
      durum = "guncellenen";
    }

    // Seçenek + fiyat matrisi tam değiştirme (PUT semantiği) — prices.service ile aynı desen.
    await this.prisma.$transaction([
      this.prisma.productOption.deleteMany({ where: { productId: urun.id } }),
      this.prisma.productOption.createMany({
        data: yuk.options.map((o) => ({ ...o, rules: o.rules ?? undefined, productId: urun.id })),
      }),
      this.prisma.productPrice.deleteMany({ where: { productId: urun.id } }),
      this.prisma.productPrice.createMany({
        data: yuk.prices.map((p) => ({ ...p, productId: urun.id })),
      }),
    ]);

    await this.prisma.tedarikciUrun.upsert({
      where: { tedarikci_kodgrup: { tedarikci: TEDARIKCI, kodgrup: yuk.content.sku as string } },
      create: {
        tedarikci: TEDARIKCI,
        kodgrup: yuk.content.sku as string,
        productId: urun.id,
        ozet: { hash: yuk.ozetHash, isim: yuk.name },
        gorseller: gorselMap,
        senkronAt: new Date(),
      },
      update: {
        productId: urun.id,
        ozet: { hash: yuk.ozetHash, isim: yuk.name },
        gorseller: gorselMap,
        senkronAt: new Date(),
      },
    });

    // Kategori görseli boşsa ilk ürün görseliyle doldur (tek seferlik).
    if (gorseller.length > 0) {
      await this.prisma.category.updateMany({
        where: { id: kategoriId, imageUrl: "" },
        data: { imageUrl: gorseller[0] },
      });
    }

    return { durum, gorselIndirilen };
  }

  /** Tek görseli tedarikçiden indirir, WebP hattından geçirip bizim URL'yi döner. */
  private async gorselIndir(kaynak: string): Promise<string | null> {
    try {
      // Tedarikçi sunucusunu boğmama nezaketi: istekler arası kısa bekleme.
      await new Promise((r) => setTimeout(r, 250));
      const res = await fetch(kaynak, { headers: { "User-Agent": this.userAgent } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const uzanti = kaynak.split(".").pop()?.toLowerCase();
      const mimetype =
        uzanti === "png" ? "image/png" : uzanti === "webp" ? "image/webp" : "image/jpeg";
      const sonuc = await this.storage.put({ buffer, mimetype });
      return sonuc.url;
    } catch (e) {
      this.logger.warn(`Görsel indirilemedi (${kaynak}): ${(e as Error).message}`);
      return null;
    }
  }

  /** Senkron sonrası vitrin ISR tazeleme — en iyi çaba, hata senkronu düşürmez. */
  private async vitrinTazele(): Promise<void> {
    const secret = (this.config.get<string>("REVALIDATE_SECRET") ?? "").trim();
    if (!secret) return;
    const url =
      (this.config.get<string>("TURKUAZ_REVALIDATE_URL") ?? "").trim() ||
      "http://markala-web:3000/api/revalidate";
    try {
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-revalidate-secret": secret },
        body: JSON.stringify({ paths: ["/", "/kategoriler"] }),
      });
    } catch (e) {
      this.logger.warn(`Vitrin tazeleme başarısız: ${(e as Error).message}`);
    }
  }
}
