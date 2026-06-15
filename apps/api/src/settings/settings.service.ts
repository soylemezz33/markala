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
