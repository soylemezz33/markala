import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SchedulerRegistry } from "@nestjs/schedule";
import * as os from "os";
import * as fs from "fs";
import { PrismaService } from "../prisma/prisma.service";
import { MailHealthService, type MailDurumu } from "../mail/mail-health.service";
import { hataOzeti, type HataOzeti } from "./hata-sayaci";
import {
  enKotuSeviye,
  veritabaniSeviyesi,
  epostaSeviyesi,
  hataSeviyesi,
  diskSeviyesi,
  isSeviyesi,
  type Seviye,
} from "./saglik-kurallari";

/**
 * SİSTEM SAĞLIĞI RAPORU (2026-09-07, 7 Eylül kesintisinden sonra).
 *
 * O gün Prisma bağlantı havuzu tükendi, site 45 dakika 500 döndü ve panel "Operasyonel"
 * demeye devam etti — çünkü sağlık göstergesi yalnız "süreç ayakta mı?" sorusunu soruyordu.
 * Bu servis, kesintiyi GÖRÜNÜR kılacak sinyalleri tek yerde toplar.
 *
 * ── İLKELER ───────────────────────────────────────────────────────────────────────────
 * - Hiçbir ölçüm diğerini düşürmez: her blok kendi try/catch'inde, biri patlarsa sayfanın
 *   geri kalanı yine dolar. Sağlık sayfasının kendisi arızada çalışmazsa hiçbir işe yaramaz.
 * - Ölçülemeyen şey "sağlıklı" sayılmaz (bkz. saglik-kurallari.ts).
 * - Sır sızdırmaz: yalnız "yapılandırıldı mı" bilgisi döner, anahtarların kendisi ASLA.
 */

/** Rapor tek bir isteğe cevap verirken bu süreden uzun sürmemeli. */
const DB_ZAMAN_ASIMI_MS = 5000;

export type BilesenDurumu = { seviye: Seviye; [k: string]: unknown };

@Injectable()
export class SistemSagligiService {
  private readonly logger = new Logger(SistemSagligiService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailHealth: MailHealthService,
    private scheduler: SchedulerRegistry,
  ) {}

  async rapor() {
    // Bloklar paralel: rapor tek tek beklenirse sayfa yavaşlar.
    const [veritabani, eposta, isler] = await Promise.all([
      this.veritabani(),
      this.eposta(),
      Promise.resolve(this.zamanlanmisIsler()),
    ]);
    const depolama = this.depolama();
    const hatalar = hataOzeti();
    const api = this.apiDurumu();
    const entegrasyonlar = this.entegrasyonlar();

    const toplam = enKotuSeviye([
      veritabani.seviye,
      eposta.seviye,
      depolama.seviye,
      isler.seviye,
      hataSeviyesi(hatalar),
    ]);

    return {
      toplam,
      olusturuldu: new Date().toISOString(),
      api,
      veritabani,
      eposta,
      zamanlanmisIsler: isler,
      depolama,
      hatalar: { seviye: hataSeviyesi(hatalar), ...hatalar },
      entegrasyonlar,
    };
  }

  // ── API süreci ──────────────────────────────────────────────────────────────────────
  private apiDurumu() {
    const bellek = process.memoryUsage();
    return {
      seviye: "saglikli" as Seviye, // bu kod koşuyorsa süreç ayakta
      surum: process.env.npm_package_version ?? "0.1.0",
      imajEtiketi: this.config.get<string>("TAG") ?? null,
      nodeSurumu: process.version,
      calismaSuresiSaniye: Math.floor(process.uptime()),
      bellekMb: Math.round(bellek.rss / 1024 / 1024),
      yukOrtalamasi: os.loadavg().map((n) => Number(n.toFixed(2))),
      cekirdek: os.cpus().length,
      saatDilimi: process.env.TZ ?? "sistem varsayılanı",
      sunucuSaati: new Date().toISOString(),
    };
  }

  // ── Veritabanı + BAĞLANTI HAVUZU ────────────────────────────────────────────────────
  /**
   * 7 Eylül kesintisinin tam kalbi. `acik` sayısı Prisma'nın `connection_limit`ine
   * dayandığında yeni sorgular "Timed out fetching a new connection" ile düşer.
   *
   * NOT: pg_stat_activity bu veritabanına açılmış TÜM bağlantıları sayar (yedekleme
   * konteyneri, elle açılmış psql oturumları dahil), yalnız API'ninkileri değil. Sayı bu
   * yüzden hafif yüksek çıkabilir; yön göstergesi olarak doğrudur ve fazla saymak, eksik
   * saymaktan iyidir.
   */
  private async veritabani(): Promise<BilesenDurumu> {
    const t0 = Date.now();
    let baglanti = false;
    let gecikmeMs: number | null = null;
    try {
      await this.zamanAsimli(this.prisma.$queryRaw`SELECT 1`, DB_ZAMAN_ASIMI_MS);
      baglanti = true;
      gecikmeMs = Date.now() - t0;
    } catch (e) {
      this.logger.warn(`sistem-sagligi: DB erişilemedi — ${(e as Error).message}`);
    }

    let acik: number | null = null;
    let bosta: number | null = null;
    let aktif: number | null = null;
    let islemdeBosta: number | null = null;
    let sunucuTavani: number | null = null;
    if (baglanti) {
      try {
        const satir = await this.zamanAsimli(
          this.prisma.$queryRaw<
            Array<{ toplam: bigint; bosta: bigint; aktif: bigint; islemde: bigint; tavan: string }>
          >`
            SELECT count(*) AS toplam,
                   count(*) FILTER (WHERE state = 'idle') AS bosta,
                   count(*) FILTER (WHERE state = 'active') AS aktif,
                   count(*) FILTER (WHERE state = 'idle in transaction') AS islemde,
                   current_setting('max_connections') AS tavan
              FROM pg_stat_activity
             WHERE datname = current_database()`,
          DB_ZAMAN_ASIMI_MS,
        );
        const r = satir?.[0];
        if (r) {
          acik = Number(r.toplam);
          bosta = Number(r.bosta);
          aktif = Number(r.aktif);
          islemdeBosta = Number(r.islemde);
          sunucuTavani = Number(r.tavan) || null;
        }
      } catch (e) {
        // Havuz sayımı düşse bile bağlantı durumu raporlanmalı.
        this.logger.warn(`sistem-sagligi: havuz sayımı alınamadı — ${(e as Error).message}`);
      }
    }

    const limit = this.havuzLimiti();
    return {
      seviye: veritabaniSeviyesi({ baglanti, gecikmeMs, acik, limit }),
      baglanti,
      gecikmeMs,
      havuz: {
        acik,
        bosta,
        aktif,
        islemdeBosta,
        limit,
        sunucuTavani,
        kullanimYuzde: acik !== null && limit ? Math.round((acik / limit) * 100) : null,
      },
    };
  }

  /**
   * Prisma havuz limiti: DATABASE_URL'deki `connection_limit`, yoksa Prisma'nın varsayılanı
   * (fiziksel çekirdek × 2 + 1). Bu sayı raporun anlamlı olması için şart — 17'nin 17'si
   * dolduğunda site durur, ama limiti bilmeden "17 bağlantı" hiçbir şey ifade etmez.
   */
  private havuzLimiti(): number | null {
    try {
      const url = this.config.get<string>("DATABASE_URL") ?? "";
      const m = url.match(/[?&]connection_limit=(\d+)/);
      if (m) return Number(m[1]);
      const cekirdek = os.cpus().length || 1;
      return cekirdek * 2 + 1;
    } catch {
      return null;
    }
  }

  // ── E-posta ─────────────────────────────────────────────────────────────────────────
  private async eposta(): Promise<BilesenDurumu> {
    try {
      const d: MailDurumu = await this.mailHealth.durum();
      return { seviye: epostaSeviyesi(d), ...d };
    } catch (e) {
      this.logger.warn(`sistem-sagligi: mail durumu alınamadı — ${(e as Error).message}`);
      return { seviye: "uyari", ok: null, hata: "durum okunamadı" };
    }
  }

  // ── Zamanlanmış işler ───────────────────────────────────────────────────────────────
  /**
   * Kayıtlı cron'lar, bir sonraki ve son çalışma anlarıyla. Veri doğrudan zamanlayıcıdan
   * gelir — ayrı bir kayıt tutulmaz, yani "rapor doğru ama gerçek yanlış" durumu olamaz.
   *
   * `sonCalisma` null ise iş bu süreç ayağa kalktıktan sonra HİÇ koşmamış demektir; bu
   * normal olabilir (günde bir koşan iş) ya da zamanlayıcının durduğunu gösterebilir —
   * ayrımı `sonrakiCalisma` geçmişte mi diye bakan kural yapar.
   */
  private zamanlanmisIsler(): BilesenDurumu {
    try {
      const isler: Array<{
        ad: string;
        sonrakiCalisma: string | null;
        sonCalisma: string | null;
      }> = [];
      for (const [ad, is] of this.scheduler.getCronJobs()) {
        let sonraki: string | null = null;
        let son: string | null = null;
        try {
          const n = is.nextDate();
          // cron sürümüne göre Luxon DateTime ya da Date dönebilir.
          sonraki = typeof (n as { toISO?: () => string }).toISO === "function"
            ? (n as { toISO: () => string }).toISO()
            : new Date(n as unknown as string).toISOString();
        } catch { /* bu iş için sonraki çalışma hesaplanamadı */ }
        try {
          const l = is.lastDate();
          son = l ? new Date(l).toISOString() : null;
        } catch { /* hiç koşmamış */ }
        isler.push({ ad, sonrakiCalisma: sonraki, sonCalisma: son });
      }
      isler.sort((a, b) => (a.sonrakiCalisma ?? "").localeCompare(b.sonrakiCalisma ?? ""));
      return { seviye: isSeviyesi(isler), adet: isler.length, isler };
    } catch (e) {
      this.logger.warn(`sistem-sagligi: cron listesi alınamadı — ${(e as Error).message}`);
      return { seviye: "uyari", adet: 0, isler: [] };
    }
  }

  // ── Depolama ────────────────────────────────────────────────────────────────────────
  /**
   * Müşteri tasarım dosyalarının durduğu diskin doluluğu. Disk dolduğunda yükleme, log ve
   * veritabanı yazımı aynı anda durur; bu yüzden erken uyarı değerli.
   */
  private depolama(): BilesenDurumu {
    const yol = this.config.get<string>("UPLOAD_DIR") ?? "/app/uploads";
    try {
      // statfs Node 18.15+; yoksa ölçüm yapılamaz ("uyarı" döner, yeşil değil).
      const statfs = (fs as unknown as { statfsSync?: (p: string) => { bsize: number; blocks: number; bavail: number } }).statfsSync;
      if (typeof statfs !== "function") {
        return { seviye: diskSeviyesi(null), yol, olculdu: false };
      }
      const s = statfs(yol);
      const toplamMb = Math.round((s.blocks * s.bsize) / 1024 / 1024);
      const bosMb = Math.round((s.bavail * s.bsize) / 1024 / 1024);
      const kullanilanMb = toplamMb - bosMb;
      const yuzde = toplamMb > 0 ? Math.round((kullanilanMb / toplamMb) * 100) : null;
      return { seviye: diskSeviyesi(yuzde), yol, olculdu: true, toplamMb, bosMb, kullanilanMb, kullanimYuzde: yuzde };
    } catch (e) {
      this.logger.warn(`sistem-sagligi: disk ölçülemedi (${yol}) — ${(e as Error).message}`);
      return { seviye: diskSeviyesi(null), yol, olculdu: false };
    }
  }

  // ── Entegrasyonlar ──────────────────────────────────────────────────────────────────
  /**
   * Yalnız "yapılandırıldı mı" — anahtarların kendisi ASLA dönmez. Bu sayfa panel
   * yetkililerine açık; bir token'ın son 4 hanesi bile burada işi olmayan bir bilgidir.
   */
  private entegrasyonlar() {
    const var_ = (...anahtarlar: string[]) =>
      anahtarlar.every((k) => (this.config.get<string>(k) ?? "").trim().length > 0);
    return {
      iyzico: var_("IYZICO_API_KEY", "IYZICO_SECRET"),
      parasut: var_("PARASUT_CLIENT_ID", "PARASUT_CLIENT_SECRET", "PARASUT_COMPANY_ID"),
      smtp: var_("SMTP_HOST", "SMTP_USER", "SMTP_PASS"),
      whatsapp: var_("WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ADMIN_TO"),
      googleDrive: var_("GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_REFRESH_TOKEN"),
      metaCapi: var_("META_CAPI_TOKEN"),
      dhl: var_("DHL_API_KEY"),
      netgsm: var_("NETGSM_USERNAME", "NETGSM_PASSWORD"),
      r2: var_("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"),
    };
  }

  /** Ölçüm sorgusu asılı kalırsa sağlık sayfası da asılı kalmasın. */
  private zamanAsimli<T>(vaat: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      vaat,
      new Promise<T>((_, red) => setTimeout(() => red(new Error(`zaman aşımı (${ms}ms)`)), ms)),
    ]);
  }
}
