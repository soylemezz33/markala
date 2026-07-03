import { Injectable, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Cari hesap (B2B açık hesap) defteri.
 * Bakiye = borç (debit, açık-hesap siparişleri) − ödeme (credit, tahsilatlar).
 * Pozitif bakiye = müşterinin Markala'ya borcu.
 */
@Injectable()
export class CorporateLedgerService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const grouped = await this.prisma.corporateLedgerEntry.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
    });
    let debit = 0;
    let credit = 0;
    for (const g of grouped) {
      const v = Number(g._sum.amount ?? 0);
      if (g.kind === "debit") debit = v;
      else credit = v;
    }
    return Math.round((debit - credit) * 100) / 100;
  }

  async getStatement(userId: string) {
    const [entries, balance] = await Promise.all([
      this.prisma.corporateLedgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      this.getBalance(userId),
    ]);
    return { balance, entries };
  }

  /** Admin: tahsilat (ödeme) girişi → credit hareketi; bakiyeyi azaltır. */
  async recordPayment(
    userId: string,
    amount: number,
    description?: string,
    actor?: { actorId?: string | null; ipAddress?: string | null },
  ) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Tahsilat tutarı 0'dan büyük olmalı.");
    }
    const desc = description?.trim() || "Tahsilat";
    const entry = await this.prisma.corporateLedgerEntry.create({
      data: {
        userId,
        kind: "credit",
        amount: new Prisma.Decimal(amount),
        description: desc,
      },
    });
    // Denetim izi: hangi admin, hangi IP, ne zaman tahsilat girdi. Best-effort —
    // ledger kaydı zaten para hakikatidir; audit yazımı hatası tahsilatı bozmamalı.
    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor?.actorId ?? null,
          userId,
          entityType: "CorporateLedgerEntry",
          entityId: entry.id,
          action: "create",
          diff: { kind: "credit", amount, description: desc },
          ipAddress: actor?.ipAddress ?? null,
        },
      })
      .catch((e) => console.error("[audit] recordPayment denetim kaydı yazılamadı:", e?.message));
    return this.getStatement(userId);
  }
}
