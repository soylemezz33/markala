import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findByGroup(group?: string): Promise<Record<string, unknown>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await this.prisma.siteSetting.findMany(group ? { where: { group } } : ({} as any));
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
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
    return this.findByGroup(group);
  }
}
