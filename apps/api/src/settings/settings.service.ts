import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Storefront'un her istekte okuyacağı public site config (bakım modu + iletişim). */
export interface PublicConfig {
  maintenance: { enabled: boolean; title: string; message: string };
  contact: { phone: string; whatsapp: string; email: string };
}

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Middleware her istekte /settings/public'i çağırır → DB'yi korumak için kısa TTL cache.
  // upsertMany cache'i sıfırlar, böylece admin toggle'ı en geç TTL kadar sonra yansır.
  private publicCache: { at: number; data: PublicConfig } | null = null;
  private static readonly PUBLIC_TTL_MS = 10_000;

  async findByGroup(group?: string): Promise<Record<string, unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await this.prisma.siteSetting.findMany(group ? { where: { group } } : ({} as any));
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  /**
   * Header menüsü (Faz 1) — admin'in yönettiği navigasyon JSON'u.
   * Yoksa null döner → storefront koddaki DEFAULT_NAV yedeğine düşer.
   */
  async getHeaderNav(): Promise<unknown | null> {
    const row = await this.prisma.siteSetting.findUnique({ where: { key: "header_nav" } });
    return row?.value ?? null;
  }

  async getShipping(): Promise<{ fee: number; freeThreshold: number }> {
    const rows = await this.prisma.siteSetting.findMany({ where: { group: "shipping" } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const num = (v: unknown, d: number) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) && n >= 0 ? n : d;
    };
    return { fee: num(map["shipping.fee"], 79), freeThreshold: num(map["shipping.freeThreshold"], 750) };
  }

  /**
   * m² maliyet motoru global ayarları (group "pricing").
   * kur: dolar→TL · marj: net kâr çarpanı · kdv: oran · minM2: min faturalanan alan.
   * Eksik anahtarlarda default'a düşer.
   */
  async getPricing(): Promise<{ kur: number; marj: number; kdv: number; minM2: number }> {
    const rows = await this.prisma.siteSetting.findMany({ where: { group: "pricing" } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const num = (v: unknown, d: number) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) && n > 0 ? n : d;
    };
    return {
      kur: num(map["pricing.kur"], 46),
      marj: num(map["pricing.marj"], 1.5),
      kdv: num(map["pricing.kdv"], 0.2),
      minM2: num(map["pricing.minM2"], 1),
    };
  }

  async upsertMany(group: string, values: Record<string, unknown>) {
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key },
          update: { value: value as Prisma.InputJsonValue, group },
          create: { key, value: value as Prisma.InputJsonValue, group },
        }),
      ),
    );
    this.publicCache = null; // toggle/iletişim değişikliği public config'i etkileyebilir → cache'i düşür
    return this.findByGroup(group);
  }

  /** Public (unauth) site config. Bakım bayrağı + iletişim. ~10sn cache. */
  async getPublicConfig(): Promise<PublicConfig> {
    const now = Date.now();
    if (this.publicCache && now - this.publicCache.at < SettingsService.PUBLIC_TTL_MS) {
      return this.publicCache.data;
    }
    const rows = await this.prisma.siteSetting.findMany({
      where: { group: { in: ["maintenance", "general"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    const data: PublicConfig = {
      maintenance: {
        enabled: map["maintenance.enabled"] === true,
        title: str(map["maintenance.title"]),
        message: str(map["maintenance.message"]),
      },
      contact: {
        phone: str(map["general.phone"]),
        whatsapp: str(map["general.whatsapp"]),
        email: str(map["general.email"]),
      },
    };
    this.publicCache = { at: now, data };
    return data;
  }
}
